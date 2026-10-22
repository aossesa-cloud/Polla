const SockJS = require("sockjs-client");
const { Client } = require("@stomp/stompjs");
const WebSocket = require("ws");

const TELETRAK_REALTIME_DB = "https://teletrak.firebaseio.com";
const TELETRAK_STOMP_URL = "https://apuestas.teletrak.cl/api/falcon/ws";
const TELETRAK_LANGUAGE_TAG = "es-PR";
const TELETRAK_FAVORITE_TIMEOUT_MS = 2500;
const TELETRAK_PROGRAM_TIMEOUT_MS = 6000;

const TELETRAK_TRACK_ALIASES = {
  chs: ["Club Hipico de Santiago", "Club Hípico de Santiago"],
  "hipodromo-chile": ["Hipodromo Chile", "Hipódromo Chile"],
  valparaiso: ["Valparaiso Sporting", "Valparaíso Sporting", "Valparaiso Sporting Club", "Valparaíso Sporting Club"],
  concepcion: [
    "C. H. Concepcion",
    "C. H. Concepción",
    "Club Hipico de Concepcion",
    "Club Hípico de Concepción",
    "Club Hípico De Concepción",
    "Club Hipico Concepcion",
    "Club Hípico Concepción",
  ],
};

const LOCAL_TRACK_IDS = {
  chs: 1,
  "hipodromo-chile": 2,
  valparaiso: 3,
  concepcion: 4,
};

function normalizeTeletrakDate(date) {
  const value = String(date || "").trim();
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return `${iso[1]}${iso[2]}${iso[3]}`;
  const dmy = value.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (dmy) return `${dmy[3]}${dmy[2]}${dmy[1]}`;
  return /^\d{8}$/.test(value) ? value : "";
}

async function fetchRealtimeJson(path) {
  const safePath = String(path || "").split("/").filter(Boolean).map(encodeURIComponent).join("/");
  const response = await fetch(`${TELETRAK_REALTIME_DB}/${safePath}.json`, {
    headers: { Accept: "application/json" },
  });
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Teletrak Realtime DB respondió HTTP ${response.status} en ${safePath}.`);
  }
  try {
    return body ? JSON.parse(body) : null;
  } catch {
    throw new Error(`Teletrak Realtime DB devolvió datos inválidos en ${safePath}.`);
  }
}

function localTrackIdFromName(name) {
  const normalized = normalizeText(name);
  if (normalized.includes("pollon")) return "";
  if (normalized.includes("concepcion")) return "concepcion";
  if (normalized.includes("valparaiso")) return "valparaiso";
  if (normalized.includes("hipodromo chile")) return "hipodromo-chile";
  if (normalized.includes("santiago") || normalized.includes("club hipico")) return "chs";
  return "";
}

function findPoolData(pools, poolType) {
  const target = normalizeText(poolType);
  return Object.entries(pools || {}).find(([key, pool]) => {
    // Realtime timedDetails stores the pool type in its key (for example,
    // "ext|TO|WIN|CLP"), while poolDetails exposes it as pool.poolType.
    const keyPoolType = String(key || "").split("|")[2] || "";
    return normalizeText(pool?.poolType || keyPoolType) === target;
  })?.[1] || null;
}

function payoutForRunner(pool, programNumber) {
  const number = String(programNumber || "").trim();
  if (!number) return "";
  const payoff = pool?.payoff && typeof pool.payoff === "object" ? pool.payoff : {};
  const direct = payoff[number];
  if (direct !== undefined && direct !== null) return String(direct);
  const tied = Object.entries(payoff).find(([key]) => key.split(/[,*]/).map((part) => part.trim()).includes(number));
  return tied ? String(tied[1]) : "";
}

function favoriteFromRealtimeOdds(timedPools, runners) {
  const winPool = findPoolData(timedPools, "WIN");
  const odds = Array.isArray(winPool?.odds) ? winPool.odds : [];
  let favorite = null;
  Object.values(runners || {}).forEach((runner) => {
    if (!runner || runner.scrached === true || runner.scratched === true) return;
    const number = String(runner.programNumber || runner.programNo || runner.number || "").trim();
    const price = Number(odds[Number(number)]);
    if (!number || !Number.isFinite(price) || price <= 0) return;
    if (!favorite || price < favorite.price) favorite = { number, price };
  });
  return favorite?.number || "";
}

function buildRealtimeRaceResult(raceNumber, race, runners, pools, timedPools) {
  const programNumberOf = (runner) => String(
    runner?.programNumber ?? runner?.programNo ?? runner?.number ?? "",
  ).trim();
  const order = Array.isArray(race?.finishingOrder)
    ? race.finishingOrder.map((item) => typeof item === "object" && item !== null
      ? programNumberOf(item)
      : String(item || "").trim()).filter(Boolean)
    : [];
  const win = findPoolData(pools, "WIN");
  const place = findPoolData(pools, "PLACE");
  const show = findPoolData(pools, "SHOW");
  const runnerByNumber = new Map(Object.values(runners || {}).map((runner) => [programNumberOf(runner), runner]));
  const runnersResults = order.slice(0, 3).map((programNumber, index) => {
    const runner = runnerByNumber.get(programNumber) || {};
    return {
      programNumber,
      name: String(runner.horseName || "").trim(),
      position: index + 1,
      payouts: {
        win: payoutForRunner(win, programNumber),
        place: payoutForRunner(place, programNumber),
        show: payoutForRunner(show, programNumber),
      },
    };
  });
  const hasResults = order.length > 0 || String(race?.status || "").toUpperCase() === "RESULTED";
  return {
    raceNumber: Number(raceNumber),
    raceId: race?.raceId || "",
    complete: hasResults,
    status: String(race?.status || "").toUpperCase(),
    favorite: favoriteFromRealtimeOdds(timedPools, runners),
    runnersResults,
    scratchRunners: Object.values(runners || {})
      .filter((runner) => runner?.scrached === true || runner?.scratched === true)
      .map((runner) => ({ programNumber: programNumberOf(runner), name: String(runner?.horse?.horseName || runner?.horseName || "").trim() }))
      .filter((runner) => runner.programNumber),
  };
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchJson(url) {
  const MAX_ATTEMPTS = 3;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "TablasNuevas/1.0",
        },
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Teletrak ${response.status}: ${text.slice(0, 200)}`);
      }
      return response.json();
    } catch (err) {
      if (attempt < MAX_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
        continue;
      }
      const cause = err?.cause ? ` (cause: ${err.cause.message || String(err.cause)})` : "";
      throw new Error(`Teletrak fetch failed for ${url}${cause}`);
    }
  }
}

async function fetchTeletrakTracks(date) {
  const dateKey = normalizeTeletrakDate(date);
  if (!dateKey) {
    throw new Error("Falta la fecha para consultar Teletrak.");
  }
  const raceDetailsByTrack = await fetchRealtimeJson(`scheduleData/${dateKey}/raceDetails`);
  return Object.entries(raceDetailsByTrack || {})
    .map(([trackCode, races]) => {
      const firstRace = Object.values(races || {}).find(Boolean) || {};
      const name = String(firstRace.trackName || "").trim();
      const localTrackId = localTrackIdFromName(name);
      return {
        id: LOCAL_TRACK_IDS[localTrackId] || 0,
        raceCardId: trackCode,
        sourceCode: trackCode,
        localTrackId,
        name,
        countryCode: "CL",
        breedType: "THOROUGHBRED",
      };
    })
    .filter((track) => track.id > 0 && track.name)
    .sort((a, b) => a.id - b.id);
}

function toRunnerOrderNumber(entry) {
  const parsed = Number(String(entry?.programNumber ?? "").trim());
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
}

function getEntriesByPosition(entries, position) {
  return entries
    .filter((entry) => Number(entry?.position) === Number(position))
    .sort((a, b) => toRunnerOrderNumber(a) - toRunnerOrderNumber(b));
}

function extractTieEntry(entries, position) {
  const matches = getEntriesByPosition(entries, position);
  return matches.length > 1 ? matches[1] : null;
}

function extractPrimaryEntry(entries, position) {
  const matches = getEntriesByPosition(entries, position);
  return matches.length > 0 ? matches[0] : null;
}

function payoutValue(entry, key) {
  return String(entry?.payouts?.[key] || "").trim();
}

function resultRunnerName(entry) {
  return String(
    entry?.name ||
    entry?.runnerName ||
    entry?.horseName ||
    entry?.ejemplar ||
    entry?.nombre ||
    entry?.horse?.horseName ||
    entry?.horse?.name ||
    entry?.runner?.name ||
    ""
  ).trim();
}

function isPollonGroupRunnerName(value) {
  const text = normalizeText(value).replace(/[^a-z0-9]+/g, " ").trim();
  return /^(?:\d+\s+)?grupo\s*\d+$/.test(text);
}

function getTeletrakRaceImportBlockReason(race) {
  const entries = Array.isArray(race?.runnersResults) ? race.runnersResults : [];
  const placedEntries = entries.filter((entry) => Number(entry?.position) > 0);
  const groupNames = placedEntries
    .map((entry) => resultRunnerName(entry))
    .filter((name) => isPollonGroupRunnerName(name));

  if (groupNames.length) {
    return `Teletrak devolvio datos del Pollon de Oro (${[...new Set(groupNames)].join(", ")})`;
  }

  return "";
}

function isImportableTeletrakRaceResult(race) {
  return !getTeletrakRaceImportBlockReason(race);
}

function parseTeletrakMoney(value) {
  const numeric = Number.parseFloat(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
}

function extractFavoriteFromOddsBoards(payload) {
  const runners = Array.isArray(payload?.runners?.currentRace) ? payload.runners.currentRace : [];
  const pools = Array.isArray(payload?.wps?.win?.oddsBoard?.pools) ? payload.wps.win.oddsBoard.pools : [];
  let best = null;

  runners.forEach((runner, index) => {
    if (!runner || runner.scratched) return;
    const amount = parseTeletrakMoney(pools[index]);
    const programNumber = String(runner.programNumber || "").trim();
    if (!programNumber || amount <= 0) return;
    if (!best || amount > best.amount) {
      best = { amount, programNumber };
    }
  });

  return best?.programNumber || "";
}

function formatTeletrakTime(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  const match = text.match(/T(\d{2}:\d{2})/);
  return match ? match[1] : text;
}

function parseTeletrakRunnerEntries(payload) {
  const source = payload?.runners ?? payload;
  const runners = Array.isArray(source) ? source : Object.values(source || {});
  return runners
    .filter((runner) => runner && !runner?.scratch?.scratched && runner?.scrached !== true && runner?.scratched !== true)
    .map((runner) => ({
      number: String(runner.programNumber || runner.programNo || "").trim(),
      name: String(runner?.horse?.horseName || runner?.horseName || "").trim(),
      jockey: String(runner.riderName || runner.jockeyName || "").trim(),
    }))
    .filter((entry) => entry.number || entry.name)
    .sort((a, b) => Number(a.number) - Number(b.number));
}

function normalizeTeletrakRaceCardPayload(payload) {
  return Array.isArray(payload)
    ? payload.flatMap((track) => (Array.isArray(track?.raceCards) ? track.raceCards.map((raceCard) => ({
        trackId: Number(track?.id),
        country: String(track?.country || ""),
        type: String(track?.type || ""),
        raceCardId: Number(raceCard?.id),
        name: String(raceCard?.name || ""),
        nextRaceDate: String(raceCard?.nextRace?.date || ""),
        nextOpenRaceId: Number(raceCard?.nextOpenRaceId || 0),
        races: Array.isArray(raceCard?.races)
          ? raceCard.races.map((race) => ({
              id: Number(race?.id),
              raceNumber: Number(race?.raceNumber),
              status: String(race?.status || ""),
            }))
          : [],
      })) : []))
    : [];
}

function matchTeletrakRaceCard(cards, localTrackId, date) {
  const aliases = TELETRAK_TRACK_ALIASES[localTrackId] || [];
  const normalizedAliases = aliases.map((alias) => normalizeText(alias));
  
  // Match by exact name OR if alias is contained in track name (handles "04. Club Hípico" format)
  const byTrack = cards.filter((card) => {
    const normalizedName = normalizeText(card.name);
    if (localTrackId === "concepcion" && normalizedName.includes("concepcion")) {
      return true;
    }
    return normalizedAliases.includes(normalizedName) ||
           normalizedAliases.some((alias) => normalizedName.includes(alias));
  });
  
  const byDate = date ? byTrack.filter((card) => String(card.nextRaceDate || "") === String(date)) : byTrack;
  return byDate[0] || byTrack[0] || null;
}

async function fetchTeletrakRaceCards(options = {}) {
  const timeoutMs = Number(options.timeoutMs) > 0 ? Number(options.timeoutMs) : TELETRAK_PROGRAM_TIMEOUT_MS;

  return new Promise((resolve) => {
    let finished = false;
    let subscription = null;

    const finalize = async (client, payload) => {
      if (finished) return;
      finished = true;
      if (subscription) {
        try {
          subscription.unsubscribe();
        } catch (_) {
          // Ignore unsubscribe issues during shutdown.
        }
      }
      if (client) {
        try {
          await client.deactivate();
        } catch (_) {
          // Ignore shutdown issues; payload already collected.
        }
      }
      resolve(normalizeTeletrakRaceCardPayload(payload));
    };

    const timer = setTimeout(() => {
      finalize(client, []);
    }, timeoutMs);

    if (typeof global.WebSocket === "undefined") {
      global.WebSocket = WebSocket;
    }

    const client = new Client({
      webSocketFactory: () => new SockJS(TELETRAK_STOMP_URL),
      reconnectDelay: 0,
      heartbeatIncoming: 0,
      heartbeatOutgoing: 0,
      debug: () => {},
      onConnect: () => {
        subscription = client.subscribe(`/broker/v2.tracks.${TELETRAK_LANGUAGE_TAG}`, (message) => {
          let payload;
          try {
            payload = JSON.parse(message.body);
          } catch (_) {
            payload = [];
          }
          clearTimeout(timer);
          finalize(client, payload);
        });
      },
      onStompError: () => {
        clearTimeout(timer);
        finalize(client, []);
      },
      onWebSocketError: () => {
        clearTimeout(timer);
        finalize(client, []);
      },
      onWebSocketClose: () => {
        clearTimeout(timer);
        finalize(null, []);
      },
    });

    client.activate();
  });
}

async function fetchTeletrakProgramRaces(raceCard, options = {}) {
  const timeoutMs = Number(options.timeoutMs) > 0 ? Number(options.timeoutMs) : TELETRAK_PROGRAM_TIMEOUT_MS;
  const raceList = Array.isArray(raceCard?.races)
    ? raceCard.races
        .filter((race) => Number(race?.id) > 0 && Number(race?.raceNumber) > 0)
        .sort((a, b) => Number(a.raceNumber) - Number(b.raceNumber))
    : [];
  if (!raceList.length) return {};

  return new Promise((resolve) => {
    let finished = false;
    const subscriptions = [];
    const racesByNumber = {};
    const pending = new Set(raceList.map((race) => `${race.id}:meta:${race.raceNumber}`));
    raceList.forEach((race) => pending.add(`${race.id}:runners:${race.raceNumber}`));

    const finalize = async (client) => {
      if (finished) return;
      finished = true;
      subscriptions.forEach((subscription) => {
        try {
          subscription.unsubscribe();
        } catch (_) {
          // Ignore unsubscribe issues during shutdown.
        }
      });
      if (client) {
        try {
          await client.deactivate();
        } catch (_) {
          // Ignore shutdown issues after collecting the program.
        }
      }
      resolve(racesByNumber);
    };

    const timer = setTimeout(() => {
      finalize(client);
    }, timeoutMs);

    if (typeof global.WebSocket === "undefined") {
      global.WebSocket = WebSocket;
    }

    const ensureRace = (raceNumber) => {
      const key = String(raceNumber);
      if (!racesByNumber[key]) {
        racesByNumber[key] = {
          race: Number(raceNumber),
          label: `Carrera ${raceNumber}`,
          postTime: "",
          distance: "",
          surface: "",
          entries: [],
        };
      }
      return racesByNumber[key];
    };

    const markDone = () => {
      if (!pending.size) {
        clearTimeout(timer);
        finalize(client);
      }
    };

    const client = new Client({
      webSocketFactory: () => new SockJS(TELETRAK_STOMP_URL),
      reconnectDelay: 0,
      heartbeatIncoming: 0,
      heartbeatOutgoing: 0,
      debug: () => {},
      onConnect: () => {
        raceList.forEach((race) => {
          const raceNumber = Number(race.raceNumber);
          const metaKey = `${race.id}:meta:${raceNumber}`;
          const runnersKey = `${race.id}:runners:${raceNumber}`;

          subscriptions.push(client.subscribe(`/broker/v3.race.${race.id}.${TELETRAK_LANGUAGE_TAG}`, (message) => {
            let payload;
            try {
              payload = JSON.parse(message.body);
            } catch (_) {
              payload = null;
            }
            const item = ensureRace(raceNumber);
            item.label = String(payload?.name || item.label || `Carrera ${raceNumber}`).trim();
            item.postTime = formatTeletrakTime(payload?.postTime);
            item.distance = String(payload?.distance || "").trim();
            item.surface = String(payload?.surface || "").trim();
            pending.delete(metaKey);
            markDone();
          }));

          subscriptions.push(client.subscribe(`/broker/v2.race.${race.id}.${TELETRAK_LANGUAGE_TAG}.runners`, (message) => {
            let payload;
            try {
              payload = JSON.parse(message.body);
            } catch (_) {
              payload = null;
            }
            const item = ensureRace(raceNumber);
            item.entries = parseTeletrakRunnerEntries(payload);
            pending.delete(runnersKey);
            markDone();
          }));
        });
      },
      onStompError: () => {
        clearTimeout(timer);
        finalize(client);
      },
      onWebSocketError: () => {
        clearTimeout(timer);
        finalize(client);
      },
      onWebSocketClose: () => {
        clearTimeout(timer);
        finalize(null);
      },
    });

    client.activate();
  });
}

async function fetchTeletrakProgram(date, localTrackId) {
  const safeDate = String(date || "").trim();
  const safeTrackId = String(localTrackId || "").trim();
  const dateKey = normalizeTeletrakDate(safeDate);
  if (!dateKey || !safeTrackId) {
    throw new Error("Faltan fecha o hipodromo para importar el programa desde Teletrak.");
  }
  const tracks = await fetchTeletrakTracks(safeDate);
  const track = tracks.find((item) => item.localTrackId === safeTrackId);
  if (!track) {
    throw new Error("Teletrak no tiene un programa vivo disponible para esa fecha e hipodromo.");
  }
  const [raceDetails, tripDetails] = await Promise.all([
    fetchRealtimeJson(`scheduleData/${dateKey}/raceDetails/${track.sourceCode}`),
    fetchRealtimeJson(`scheduleData/${dateKey}/tripDetails/${track.sourceCode}`),
  ]);
  const races = {};
  Object.entries(raceDetails || {}).forEach(([raceKey, raceInfo]) => {
    const raceNumber = Number(String(raceKey).replace(/^R_/, ""));
    if (!Number.isInteger(raceNumber) || raceNumber < 1) return;
    const entries = parseTeletrakRunnerEntries(tripDetails?.[raceKey]);
    races[String(raceNumber)] = {
      race: raceNumber,
      raceNumber,
      raceId: raceInfo?.raceId || "",
      label: String(raceInfo?.raceName || `Carrera ${raceNumber}`).trim(),
      postTime: formatTeletrakTime(raceInfo?.postTime),
      distance: raceInfo?.distance ? String(raceInfo.distance) : "",
      surface: String(raceInfo?.surfaceType || "").trim(),
      status: String(raceInfo?.status || "").toLowerCase(),
      complete: String(raceInfo?.status || "").toUpperCase() === "RESULTED",
      entries,
    };
  });
  if (!Object.keys(races).length) {
    throw new Error("Teletrak no devolvio carreras para ese programa.");
  }

  return {
    date: safeDate,
    trackId: safeTrackId,
    trackName: track.name,
    source: "teletrak",
    sourceUrl: `https://apuestas.teletrak.cl/racing/${dateKey}`,
    status: "imported",
    races,
    raceCount: Object.keys(races).length,
  };
}

async function fetchTeletrakFavoritesForRaces(races, options = {}) {
  const raceList = Array.isArray(races)
    ? races
        .filter((race) => Number(race?.raceId) > 0)
        .map((race) => ({
          raceId: Number(race.raceId),
          raceNumber: String(race.raceNumber || ""),
        }))
    : [];
  if (!raceList.length) return new Map();

  const timeoutMs = Number(options.timeoutMs) > 0 ? Number(options.timeoutMs) : TELETRAK_FAVORITE_TIMEOUT_MS;
  const favorites = new Map();
  const pending = new Set(raceList.map((race) => race.raceId));
  const subscriptions = [];

  return new Promise((resolve) => {
    let finished = false;

    const finalize = async (client) => {
      if (finished) return;
      finished = true;
      subscriptions.forEach((subscription) => {
        try {
          subscription.unsubscribe();
        } catch (_) {
          // Ignore unsubscribe failures during shutdown.
        }
      });
      if (client) {
        try {
          await client.deactivate();
        } catch (_) {
          // Ignore deactivate failures; favorites already collected.
        }
      }
      resolve(favorites);
    };

    const timer = setTimeout(() => {
      finalize(client);
    }, timeoutMs);

    if (typeof global.WebSocket === "undefined") {
      global.WebSocket = WebSocket;
    }

    const client = new Client({
      webSocketFactory: () => new SockJS(TELETRAK_STOMP_URL),
      reconnectDelay: 0,
      heartbeatIncoming: 0,
      heartbeatOutgoing: 0,
      debug: () => {},
      onConnect: () => {
        raceList.forEach((race) => {
          const subscription = client.subscribe(
            `/broker/v2.race.${race.raceId}.${TELETRAK_LANGUAGE_TAG}.oddsBoards`,
            (message) => {
              let payload;
              try {
                payload = JSON.parse(message.body);
              } catch (_) {
                payload = null;
              }
              favorites.set(String(race.raceNumber), extractFavoriteFromOddsBoards(payload));
              pending.delete(race.raceId);
              if (!pending.size) {
                clearTimeout(timer);
                finalize(client);
              }
            },
          );
          subscriptions.push(subscription);
        });
      },
      onStompError: () => {
        clearTimeout(timer);
        finalize(client);
      },
      onWebSocketError: () => {
        clearTimeout(timer);
        finalize(client);
      },
      onWebSocketClose: () => {
        clearTimeout(timer);
        finalize(null);
      },
    });

    client.activate();
  });
}

function mapRaceResult(race, favorite = "") {
  const entries = Array.isArray(race.runnersResults) ? race.runnersResults : [];
  const first = extractPrimaryEntry(entries, 1);
  const firstTie = extractTieEntry(entries, 1);
  const second = extractPrimaryEntry(entries, 2);
  const secondTie = extractTieEntry(entries, 2);
  const third = extractPrimaryEntry(entries, 3);
  const thirdTie = extractTieEntry(entries, 3);

  return {
    race: String(race.raceNumber),
    primero: String(first?.programNumber || ""),
    empatePrimero: String(firstTie?.programNumber || ""),
    ganador: payoutValue(first, "win"),
    divSegundoPrimero: payoutValue(first, "place"),
    divTerceroPrimero: payoutValue(first, "show"),
    empatePrimeroGanador: payoutValue(firstTie, "win"),
    empatePrimeroDivSegundo: payoutValue(firstTie, "place"),
    empatePrimeroDivTercero: payoutValue(firstTie, "show"),
    segundo: String(second?.programNumber || ""),
    empateSegundo: String(secondTie?.programNumber || ""),
    divSegundo: payoutValue(second, "place"),
    divTerceroSegundo: payoutValue(second, "show"),
    empateSegundoDivSegundo: payoutValue(secondTie, "place"),
    empateSegundoDivTercero: payoutValue(secondTie, "show"),
    tercero: String(third?.programNumber || ""),
    empateTercero: String(thirdTie?.programNumber || ""),
    divTercero: payoutValue(third, "show"),
    empateTerceroDivTercero: payoutValue(thirdTie, "show"),
    favorito: String(favorite || "").trim(),
    retiros: Array.isArray(race.scratchRunners)
      ? race.scratchRunners.map((runner) => String(runner.programNumber || "").trim()).filter(Boolean)
      : [],
  };
}

async function fetchTeletrakRaceResults(trackId, date) {
  if (!trackId || !date) {
    throw new Error("Faltan trackId o fecha para consultar resultados Teletrak.");
  }
  const results = await fetchTeletrakRawRaceResults(trackId, date);
  const raceResults = results
    .filter((race) => Number(race.raceNumber) > 0 && race.complete && isImportableTeletrakRaceResult(race))
    .map((race) => mapRaceResult(race, race.favorite))
    .sort((a, b) => Number(a.race) - Number(b.race));
  return {
    trackId,
    date,
    raceCount: results.raceCount || 0,
    results: raceResults,
  };
}

async function fetchTeletrakRawRaceResults(trackId, date) {
  const dateKey = normalizeTeletrakDate(date);
  if (!dateKey || !trackId) {
    throw new Error("Faltan trackId o fecha para consultar resultados Teletrak.");
  }
  const tracks = await fetchTeletrakTracks(date);
  const track = tracks.find((item) => String(item.id) === String(trackId)
    || item.localTrackId === String(trackId)
    || item.sourceCode === String(trackId));
  if (!track) {
    throw new Error("El hipodromo seleccionado no tiene carreras en Teletrak para esa fecha.");
  }
  const [raceDetails, tripDetails, poolDetails, timedDetails] = await Promise.all([
    fetchRealtimeJson(`scheduleData/${dateKey}/raceDetails/${track.sourceCode}`),
    fetchRealtimeJson(`scheduleData/${dateKey}/tripDetails/${track.sourceCode}`),
    fetchRealtimeJson(`scheduleData/${dateKey}/poolDetails/${track.sourceCode}`),
    fetchRealtimeJson(`scheduleData/${dateKey}/timedDetails/${track.sourceCode}`),
  ]);
  const races = Object.entries(raceDetails || {})
    .map(([raceKey, raceInfo]) => {
      const raceNumber = Number(String(raceKey).replace(/^R_/, ""));
      const runners = tripDetails?.[raceKey] || {};
      const pools = poolDetails?.[raceKey] || {};
      const timedPools = timedDetails?.[raceKey] || {};
      return Number.isInteger(raceNumber) && raceNumber > 0
        ? { ...buildRealtimeRaceResult(raceNumber, raceInfo, runners, pools, timedPools), postTime: raceInfo?.postTime }
        : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.raceNumber - b.raceNumber);
  races.raceCount = races.reduce((max, race) => Math.max(max, race.raceNumber), 0);
  return races;
}

function matchTeletrakTrack(tracks, name) {
  // Program cards can prefix the hipodromo with an ordinal (for example
  // "1. Valparaíso Sporting"), while the results endpoint returns only the
  // plain name. Ignore that display prefix when matching both sides.
  const normalizeTrackName = (value) => normalizeText(value)
    .replace(/^\d+\s*[.)-]?\s*/, "");
  const target = normalizeTrackName(name);
  return tracks.find((track) => normalizeTrackName(track.name) === target)
    || tracks.find((track) => {
      const candidate = normalizeTrackName(track.name);
      return candidate.includes(target) || target.includes(candidate);
    })
    || null;
}

module.exports = {
  fetchTeletrakProgram,
  fetchTeletrakRaceResults,
  fetchTeletrakRawRaceResults,
  fetchTeletrakTracks,
  matchTeletrakTrack,
  fetchTeletrakFavoritesForRaces,
  extractFavoriteFromOddsBoards,
  parseTeletrakRunnerEntries,
  formatTeletrakTime,
  getTeletrakRaceImportBlockReason,
  isImportableTeletrakRaceResult,
};
