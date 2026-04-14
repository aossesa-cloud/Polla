const SockJS = require("sockjs-client");
const { Client } = require("@stomp/stompjs");
const WebSocket = require("ws");

const TELETRAK_API_BASE = "https://apuestas.teletrak.cl/api/falcon/v1/results";
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
  if (!date) {
    throw new Error("Falta la fecha para consultar Teletrak.");
  }
  const tracks = await fetchJson(`${TELETRAK_API_BASE}/tracks/${date}`);
  return Array.isArray(tracks)
    ? tracks.map((track) => ({
        id: Number(track.id),
        raceCardId: Number(track.raceCardId),
        name: String(track.name || ""),
        countryCode: String(track.countryCode || ""),
        breedType: String(track.breedType || ""),
      }))
    : [];
}

function extractTieEntry(entries, position) {
  const matches = entries.filter((entry) => Number(entry.position) === position);
  return matches.length > 1 ? matches[1] : null;
}

function extractPrimaryEntry(entries, position) {
  return entries.find((entry) => Number(entry.position) === position) || null;
}

function payoutValue(entry, key) {
  return String(entry?.payouts?.[key] || "").trim();
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
  const runners = Array.isArray(payload?.runners) ? payload.runners : [];
  return runners
    .filter((runner) => runner && !runner?.scratch?.scratched)
    .map((runner) => ({
      number: String(runner.programNumber || "").trim(),
      name: String(runner?.horse?.horseName || "").trim(),
      jockey: String(runner.riderName || "").trim(),
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
  if (!safeDate || !safeTrackId) {
    throw new Error("Faltan fecha o hipodromo para importar el programa desde Teletrak.");
  }

  const raceCards = await fetchTeletrakRaceCards();
  const raceCard = matchTeletrakRaceCard(raceCards, safeTrackId, safeDate);
  if (!raceCard) {
    throw new Error("Teletrak no tiene un programa vivo disponible para esa fecha e hipodromo.");
  }

  const races = await fetchTeletrakProgramRaces(raceCard);
  if (!Object.keys(races).length) {
    throw new Error("Teletrak no devolvio carreras para ese programa.");
  }

  return {
    date: safeDate,
    trackId: safeTrackId,
    trackName: String(raceCard.name || "").trim(),
    source: "teletrak",
    sourceUrl: raceCard.raceCardId && raceCard.races?.[0]?.id
      ? `https://apuestas.teletrak.cl/wager?raceCardId=${raceCard.raceCardId}&raceId=${raceCard.races[0].id}`
      : "https://apuestas.teletrak.cl/wager",
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
  const payload = await fetchJson(`${TELETRAK_API_BASE}/races/${Number(trackId)}/${date}`);
  const results = Array.isArray(payload?.results) ? payload.results : [];
  const favoriteMap = await fetchTeletrakFavoritesForRaces(
    results.filter((race) => race?.complete && Number(race?.raceId) > 0),
  );
  const raceResults = results
    .filter((race) => Number(race.raceNumber) > 0)
    .map((race) => mapRaceResult(race, favoriteMap.get(String(race.raceNumber)) || ""))
    .sort((a, b) => Number(a.race) - Number(b.race));
  const raceCount = results.reduce((max, race) => Math.max(max, Number(race.raceNumber) || 0), 0);
  return {
    trackId: Number(trackId),
    date,
    raceCount,
    results: raceResults,
  };
}

function matchTeletrakTrack(tracks, name) {
  const target = normalizeText(name);
  return tracks.find((track) => normalizeText(track.name) === target)
    || tracks.find((track) => normalizeText(track.name).includes(target))
    || null;
}

module.exports = {
  fetchTeletrakProgram,
  fetchTeletrakRaceResults,
  fetchTeletrakTracks,
  matchTeletrakTrack,
  fetchTeletrakFavoritesForRaces,
  extractFavoriteFromOddsBoards,
  parseTeletrakRunnerEntries,
  formatTeletrakTime,
};
