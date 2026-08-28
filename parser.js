const path = require("path");
const XLSX = require("xlsx");
const { loadOverrides, OVERRIDES_FILE } = require("./storage");

const ROOT = __dirname;
const FILES = {
  semanal: path.join(ROOT, "DIARIA Y SEMANAL.xlsm"),
  mensual: path.join(ROOT, "POLLA MENSUAL.xlsx"),
};

const WEEKDAY_SHEETS = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];

function readWorkbook(filePath) {
  return XLSX.readFile(filePath, {
    cellFormula: true,
    cellNF: true,
    cellText: true,
    cellStyles: false,
    dense: false,
  });
}

function cellValue(sheet, row, col) {
  if (row < 0 || col < 0) return null;
  const ref = XLSX.utils.encode_cell({ r: row, c: col });
  const cell = sheet[ref];
  if (!cell) return null;
  if (cell.v !== undefined) return cell.v;
  if (cell.w !== undefined && cell.w !== "") return cell.w;
  return null;
}

function cellText(sheet, row, col) {
  const value = cellValue(sheet, row, col);
  return value === null || value === undefined ? "" : String(value);
}

function toText(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\s+/g, " ").trim();
}

function normalizeText(value) {
  return toText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function toNumber(value) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const cleaned = value.trim();
    if (!cleaned) return null;
    const normalized = cleaned.includes(",")
      ? cleaned.replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "")
      : cleaned.replace(/[^\d.-]/g, "");
    if (!normalized) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

const DEFAULT_POINT_COLORS = Object.freeze({
  first: "#10B981",
  second: "#3B82F6",
  third: "#F59E0B",
  exclusiveFirst: "#8B5CF6",
  exclusiveSecond: "#EC4899",
});

function normalizePointColors(pointColors) {
  return Object.entries(DEFAULT_POINT_COLORS).reduce((resolved, [key, fallback]) => {
    const candidate = typeof pointColors?.[key] === "string"
      ? pointColors[key].trim().toUpperCase()
      : "";
    resolved[key] = /^#[0-9A-F]{6}$/.test(candidate) ? candidate : fallback;
    return resolved;
  }, {});
}

function normalizeScoring(scoring) {
  const mode = scoring?.mode === "points" ? "points" : "dividend";
  const secondPoints = toNumber(scoring?.points?.second) ?? 5;
  return {
    mode,
    doubleLastRace: mode === "dividend" ? scoring?.doubleLastRace !== false : false,
    points: {
      first: toNumber(scoring?.points?.first) ?? 10,
      second: secondPoints,
      third: toNumber(scoring?.points?.third) ?? 1,
      exclusiveFirst: toNumber(scoring?.points?.exclusiveFirst) ?? 20,
      exclusiveSecond: toNumber(scoring?.points?.exclusiveSecond) ?? secondPoints,
    },
    pointColors: normalizePointColors(scoring?.pointColors),
  };
}

function normalizeRetiros(result) {
  const raw = [
    ...(Array.isArray(result?.retiros) ? result.retiros : []),
    ...(Array.isArray(result?.withdrawals) ? result.withdrawals : []),
    result?.retiro1,
    result?.retiro2,
  ];
  return raw.flatMap((item) => extractHorseTokens(
    item && typeof item === "object"
      ? (item.number ?? item.numero ?? item.id ?? item.horse ?? "")
      : item,
  )).filter(Boolean);
}

function resolveEffectiveHorse(pickHorse, result) {
  const horse = toText(pickHorse);
  if (!horse) return "";
  return normalizeRetiros(result).includes(horse)
    ? (toText(result?.favorito) || toText(result?.favorite?.number) || toText(result?.favorite) || horse)
    : horse;
}

function extractHorseTokens(value) {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) return value.flatMap(extractHorseTokens);
  if (typeof value === "object") {
    return extractHorseTokens(value.number ?? value.numero ?? value.horse ?? value.pick ?? value.value ?? "");
  }
  const text = toText(value);
  if (!text) return [];
  const numericTokens = text.match(/\d+/g);
  if (numericTokens?.length) return [...new Set(numericTokens.map((token) => toText(token)).filter(Boolean))];
  return text.split("/").map((token) => toText(token)).filter(Boolean);
}

function parseRaceHeaders(sheet, headerRow, startCol = 3, maxCols = 40) {
  const races = [];
  for (let col = startCol; col < startCol + maxCols; col += 1) {
    const text = toText(cellText(sheet, headerRow, col));
    if (!text) break;
    if (!/^\d+$/.test(text)) {
      if (races.length > 0) break;
      continue;
    }
    races.push({
      col,
      label: text,
      number: races.length + 1,
    });
  }
  return races;
}

function createRaceHeaders(count = 12) {
  return Array.from({ length: count }, (_, index) => ({
    col: index + 3,
    label: String(index + 1),
    number: index + 1,
  }));
}

function findHeaderRow(sheet) {
  for (let row = 0; row < 20; row += 1) {
    const a = normalizeText(cellText(sheet, row, 0));
    const b = normalizeText(cellText(sheet, row, 1));
    const c = normalizeText(cellText(sheet, row, 2));
    if ((a === "n°" || a === "nº" || a === "n" || a === "no") && b === "stud" && c === "puntos") {
      return row;
    }
  }
  return -1;
}

function findResultsRow(sheet) {
  for (let row = 0; row < 220; row += 1) {
    if (normalizeText(cellText(sheet, row, 2)) === "carrera") return row;
  }
  return -1;
}

function parseParticipants(sheet, headerRow, raceHeaders) {
  const participants = [];
  for (let row = headerRow + 1; row < headerRow + 120; row += 2) {
    const idx = toNumber(cellValue(sheet, row, 0));
    const name = toText(cellText(sheet, row, 1));
    if (idx === null && !name) {
      if (participants.length > 0) break;
      continue;
    }
    participants.push({
      index: idx ?? participants.length + 1,
      name: name || "Sin nombre",
      points: 0,
      picks: raceHeaders.map((race) => ({
        race: race.number,
        raceLabel: race.label,
        horse: toText(cellText(sheet, row, race.col)),
        score: 0,
      })),
    });
  }
  return participants;
}

function parseResultSection(sheet, resultRow, maxCols = 30) {
  if (resultRow < 0) return [];
  const labels = {};
  for (let row = resultRow + 1; row < resultRow + 30; row += 1) {
    const raw = toText(cellText(sheet, row, 2));
    const normalized = normalizeText(raw);
    if (!normalized) continue;
    if (normalized === "primero") labels.primero = row;
    if (normalized === "ganador") labels.ganador = row;
    if (raw === "Segundo") labels.segundo = row;
    if (raw === "SEGUNDO" && labels.divSegundo === undefined) labels.divSegundo = row;
    if (normalized === "div segundo") labels.divSegundo = row;
    if (raw === "Tercero") labels.tercero = row;
    if (raw === "TERCERO" && labels.divTercero === undefined) labels.divTercero = row;
    if (normalized === "div tercero") labels.divTercero = row;
    if (normalized === "favorito") labels.favorito = row;
    if (normalized === "retiro 1") labels.retiro1 = row;
    if (normalized === "retiro 2") labels.retiro2 = row;
  }

  const results = [];
  for (let col = 3; col < 3 + maxCols; col += 1) {
    const raceNumber = toText(cellText(sheet, resultRow, col));
    if (!raceNumber) break;
    results.push({
      race: raceNumber,
      primero: toText(cellText(sheet, labels.primero ?? -1, col)),
      empatePrimero: "",
      ganador: toText(cellText(sheet, labels.ganador ?? -1, col)),
      divSegundoPrimero: toText(cellText(sheet, labels.divSegundo ?? -1, col)),
      divTerceroPrimero: toText(cellText(sheet, labels.divTercero ?? -1, col)),
      segundo: toText(cellText(sheet, labels.segundo ?? -1, col)),
      empateSegundo: "",
      divSegundo: toText(cellText(sheet, labels.divSegundo ?? -1, col)),
      divTerceroSegundo: toText(cellText(sheet, labels.divTercero ?? -1, col)),
      tercero: toText(cellText(sheet, labels.tercero ?? -1, col)),
      empateTercero: "",
      divTercero: toText(cellText(sheet, labels.divTercero ?? -1, col)),
      favorito: toText(cellText(sheet, labels.favorito ?? -1, col)),
      retiros: [toText(cellText(sheet, labels.retiro1 ?? -1, col)), toText(cellText(sheet, labels.retiro2 ?? -1, col))].filter(Boolean),
      retiro1: toText(cellText(sheet, labels.retiro1 ?? -1, col)),
      retiro2: toText(cellText(sheet, labels.retiro2 ?? -1, col)),
    });
  }
  return results;
}

function calculatePickScore(
  pickHorse,
  result,
  scoring,
  isExclusiveFirst = false,
  isExclusiveSecond = false,
) {
  const horse = toText(pickHorse);
  if (!horse) return 0;
  const normalizedScoring = normalizeScoring(scoring);
  const firstHorses = extractHorseTokens([result.primero, result.first, result.winner?.number]);
  const tieFirstHorses = extractHorseTokens(result.empatePrimero);
  const secondHorses = extractHorseTokens([result.segundo, result.second]);
  const tieSecondHorses = extractHorseTokens(result.empateSegundo);
  const thirdHorses = extractHorseTokens([result.tercero, result.third]);
  const tieThirdHorses = extractHorseTokens(result.empateTercero);
  const firstPlaces = [...new Set([...firstHorses, ...tieFirstHorses])];
  const secondPlaces = [...new Set([...secondHorses, ...tieSecondHorses])];
  const thirdPlaces = [...new Set([...thirdHorses, ...tieThirdHorses])];
  const favorite = toText(result.favorito) || toText(result.favorite?.number) || toText(result.favorite);
  const retiros = normalizeRetiros(result);
  const defendedHorse = retiros.includes(horse) ? favorite : "";
  if (normalizedScoring.mode === "points") {
    if (firstPlaces.includes(horse)) {
      const baseScore = isExclusiveFirst ? normalizedScoring.points.exclusiveFirst : normalizedScoring.points.first;
      return baseScore + getFirstDividendBonus(horse, result);
    }
    if (secondPlaces.includes(horse)) {
      return isExclusiveSecond ? normalizedScoring.points.exclusiveSecond : normalizedScoring.points.second;
    }
    if (thirdPlaces.includes(horse)) return normalizedScoring.points.third;
    if (defendedHorse) {
      if (firstPlaces.includes(defendedHorse)) {
        const baseScore = isExclusiveFirst ? normalizedScoring.points.exclusiveFirst : normalizedScoring.points.first;
        return baseScore + getFirstDividendBonus(defendedHorse, result);
      }
      if (secondPlaces.includes(defendedHorse)) {
        return isExclusiveSecond ? normalizedScoring.points.exclusiveSecond : normalizedScoring.points.second;
      }
      if (thirdPlaces.includes(defendedHorse)) return normalizedScoring.points.third;
    }
    return 0;
  }
  const ganador = toNumber(result.ganador) ?? 0;
  const primeroSegundo = toNumber(result.divSegundoPrimero ?? result.divSegundo) ?? 0;
  const primeroTercero = toNumber(result.divTerceroPrimero ?? result.divTercero) ?? 0;
  const empatePrimeroGanador = toNumber(result.empatePrimeroGanador ?? result.ganador) ?? 0;
  const empatePrimeroSegundo = toNumber(result.empatePrimeroDivSegundo ?? result.divSegundoPrimero ?? result.divSegundo) ?? 0;
  const empatePrimeroTercero = toNumber(result.empatePrimeroDivTercero ?? result.divTerceroPrimero ?? result.divTercero) ?? 0;
  const segundoSegundo = toNumber(result.divSegundo) ?? 0;
  const segundoTercero = toNumber(result.divTerceroSegundo ?? result.divTercero) ?? 0;
  const empateSegundoSegundo = toNumber(result.empateSegundoDivSegundo ?? result.divSegundo) ?? 0;
  const empateSegundoTercero = toNumber(result.empateSegundoDivTercero ?? result.divTerceroSegundo ?? result.divTercero) ?? 0;
  const terceroSolo = toNumber(result.divTercero) ?? 0;
  const empateTerceroSolo = toNumber(result.empateTerceroDivTercero ?? result.divTercero) ?? 0;
  if (firstHorses.includes(horse)) return ganador + primeroSegundo + primeroTercero;
  if (tieFirstHorses.includes(horse)) return empatePrimeroGanador + empatePrimeroSegundo + empatePrimeroTercero;
  if (secondHorses.includes(horse)) return segundoSegundo + segundoTercero;
  if (tieSecondHorses.includes(horse)) return empateSegundoSegundo + empateSegundoTercero;
  if (thirdHorses.includes(horse)) return terceroSolo;
  if (tieThirdHorses.includes(horse)) return empateTerceroSolo;
  if (defendedHorse) {
    if (firstHorses.includes(defendedHorse)) return ganador + primeroSegundo + primeroTercero;
    if (tieFirstHorses.includes(defendedHorse)) return empatePrimeroGanador + empatePrimeroSegundo + empatePrimeroTercero;
    if (secondHorses.includes(defendedHorse)) return segundoSegundo + segundoTercero;
    if (tieSecondHorses.includes(defendedHorse)) return empateSegundoSegundo + empateSegundoTercero;
    if (thirdHorses.includes(defendedHorse)) return terceroSolo;
    if (tieThirdHorses.includes(defendedHorse)) return empateTerceroSolo;
  }
  return 0;
}

function getFirstDividendBonus(pickHorse, result) {
  return getWinnerDividendForPick(pickHorse, result) > 10 ? 3 : 0;
}

function getWinnerDividendForPick(pickHorse, result) {
  if (!result || typeof result !== "object") return 0;

  const firstPlaces = [...new Set(extractLeadingHorseTokens([result.first, result.primero, result.winner?.number]))];
  const tiedFirstPlaces = extractLeadingHorseTokens(result.empatePrimero);
  const pickToken = toText(pickHorse);
  if (tiedFirstPlaces.includes(pickToken)) {
    const hasTiedDividend = result.empatePrimeroGanador !== undefined
      && result.empatePrimeroGanador !== null
      && toText(result.empatePrimeroGanador) !== "";
    const tiedDividend = hasTiedDividend
      ? result.empatePrimeroGanador
      : getWinnerDividendValue(result);
    const tieOffset = hasTiedDividend ? 0 : 1;
    return parseWinnerDividend(tiedDividend, Math.max(0, tieOffset + tiedFirstPlaces.indexOf(pickToken)));
  }

  if (!firstPlaces.includes(pickToken)) return 0;
  return parseWinnerDividend(getWinnerDividendValue(result), Math.max(0, firstPlaces.indexOf(pickToken)));
}

function getWinnerDividendValue(result) {
  if (result?.ganador !== undefined && result?.ganador !== null && toText(result.ganador) !== "") {
    return result.ganador;
  }
  if (result?.winner?.dividend !== undefined && result?.winner?.dividend !== null && toText(result.winner.dividend) !== "") {
    return result.winner.dividend;
  }
  return result?.dividends?.winner;
}

function extractLeadingHorseTokens(value) {
  if (Array.isArray(value)) return value.flatMap(extractLeadingHorseTokens);
  if (value && typeof value === "object") {
    return extractLeadingHorseTokens(value.number ?? value.numero ?? value.horse ?? value.pick ?? value.value ?? "");
  }

  const text = toText(value);
  if (!text) return [];
  const parts = text.split("/");
  const leading = parts
    .map((part) => part.trim().match(/^(\d+)/)?.[1])
    .filter(Boolean);
  if (leading.length === parts.length) return [...new Set(leading)];
  return extractHorseTokens(value);
}

function parseWinnerDividend(value, tokenIndex = 0) {
  if (value === undefined || value === null) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  const raw = toText(value);
  if (!raw) return 0;
  const chunks = raw.split("/").map((chunk) => chunk.trim()).filter(Boolean);
  const selectedChunk = chunks.length > 1 ? (chunks[tokenIndex] || chunks[0]) : raw;
  if (selectedChunk.includes(",")) {
    const asCommaDecimal = Number(selectedChunk.replace(/\./g, "").replace(",", "."));
    if (Number.isFinite(asCommaDecimal)) return asCommaDecimal;
  }
  const direct = Number(selectedChunk);
  if (Number.isFinite(direct)) return direct;

  const numericMatch = selectedChunk.match(/-?\d+(?:[.,]\d+)?/);
  if (!numericMatch) return 0;
  const parsed = Number(numericMatch[0].replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildExclusivePositionMap(participants, results, getPositionValues) {
  const exclusives = new Map();
  results.forEach((result) => {
    const positionHorses = [...new Set(getPositionValues(result).flatMap(extractHorseTokens))];
    if (!positionHorses.length) return;

    const raceKey = String(result.race);
    const selectionsByHorse = new Map(positionHorses.map((horse) => [horse, new Set()]));
    participants.forEach((participant, participantIndex) => {
      const pick = participant.picks.find(
        (item) => String(item.raceLabel) === raceKey || String(item.race) === raceKey,
      );
      const effectiveHorse = resolveEffectiveHorse(pick?.horse, result);
      if (!selectionsByHorse.has(effectiveHorse)) return;

      const participantName = normalizeText(participant.name);
      const participantIdentity = participantName
        ? `name:${participantName}`
        : (participant.index !== undefined && participant.index !== null
          ? `index:${participant.index}`
          : `row:${participantIndex}`);
      selectionsByHorse.get(effectiveHorse).add(participantIdentity);
    });
    exclusives.set(raceKey, new Set(
      positionHorses.filter((horse) => selectionsByHorse.get(horse)?.size === 1),
    ));
  });
  return exclusives;
}

function scoreParticipants(participants, results, scoring, totalRaces = 0) {
  const resultMap = new Map(results.map((result) => [String(result.race), result]));
  const normalizedScoring = normalizeScoring(scoring);
  const exclusiveFirstByRace = buildExclusivePositionMap(
    participants,
    results,
    (result) => [result.primero, result.first, result.winner?.number, result.empatePrimero],
  );
  const exclusiveSecondByRace = buildExclusivePositionMap(
    participants,
    results,
    (result) => [result.segundo, result.second, result.empateSegundo],
  );
  return participants.map((participant) => {
    const picks = participant.picks.map((pick) => {
      const result = resultMap.get(String(pick.raceLabel)) || resultMap.get(String(pick.race));
      const raceKey = String(pick.raceLabel || pick.race);
      const effectiveHorse = result ? resolveEffectiveHorse(pick.horse, result) : "";
      const isExclusiveFirst = exclusiveFirstByRace.get(raceKey)?.has(effectiveHorse) === true;
      const isExclusiveSecond = exclusiveSecondByRace.get(raceKey)?.has(effectiveHorse) === true;
      const baseScore = result
        ? calculatePickScore(
          pick.horse,
          result,
          normalizedScoring,
          isExclusiveFirst,
          isExclusiveSecond,
        )
        : 0;
      const isLastRace =
        normalizedScoring.mode === "dividend" &&
        normalizedScoring.doubleLastRace &&
        Number(totalRaces) > 0 &&
        (Number(pick.race) === Number(totalRaces) || Number(pick.raceLabel) === Number(totalRaces));
      return {
        ...pick,
        score: isLastRace ? Number((baseScore * 2).toFixed(2)) : baseScore,
      };
    });
    const points = picks.reduce((sum, pick) => sum + (pick.score || 0), 0);
    return {
      ...participant,
      picks,
      points: Number(points.toFixed(2)),
    };
  });
}

function parseCompetitionSheet(workbook, sheetName, type) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return null;
  const headerRow = findHeaderRow(sheet);
  if (headerRow === -1) return null;
  const raceHeaders = parseRaceHeaders(sheet, headerRow, 3, 30);
  const participants = parseParticipants(sheet, headerRow, raceHeaders);
  const results = parseResultSection(sheet, findResultsRow(sheet), raceHeaders.length + 2);
  const title = toText(cellText(sheet, 0, 0)) || sheetName;
  return {
    id: `${type}-${sheetName.toLowerCase()}`,
    type,
    sheetName,
    title,
    races: raceHeaders.length,
    raceHeaders,
    participants,
    results,
  };
}

function applyEventOverrides(event, overrides, scoring) {
  const eventOverride = overrides.events[event.id] || {};
  const configuredRaceCount = Number(eventOverride.meta?.raceCount) || Number(event.races) || 0;
  const raceCount = Math.max(configuredRaceCount, event.raceHeaders?.length || 0);
  const raceHeaders = raceCount === (event.raceHeaders?.length || 0)
    ? event.raceHeaders
    : createRaceHeaders(raceCount);
  const resultMap = new Map(event.results.map((result) => [String(result.race), result]));
  for (const [race, result] of Object.entries(eventOverride.results || {})) {
    resultMap.set(String(race), {
      race: String(race),
      primero: toText(result.primero),
      empatePrimero: toText(result.empatePrimero),
      ganador: toText(result.ganador),
      divSegundoPrimero: toText(result.divSegundoPrimero ?? result.divSegundo),
      divTerceroPrimero: toText(result.divTerceroPrimero ?? result.divTercero),
      empatePrimeroGanador: toText(result.empatePrimeroGanador ?? result.ganador),
      empatePrimeroDivSegundo: toText(result.empatePrimeroDivSegundo ?? result.divSegundoPrimero ?? result.divSegundo),
      empatePrimeroDivTercero: toText(result.empatePrimeroDivTercero ?? result.divTerceroPrimero ?? result.divTercero),
      segundo: toText(result.segundo),
      empateSegundo: toText(result.empateSegundo),
      divSegundo: toText(result.divSegundo),
      divTerceroSegundo: toText(result.divTerceroSegundo ?? result.divTercero),
      empateSegundoDivSegundo: toText(result.empateSegundoDivSegundo ?? result.divSegundo),
      empateSegundoDivTercero: toText(result.empateSegundoDivTercero ?? result.divTerceroSegundo ?? result.divTercero),
      tercero: toText(result.tercero),
      empateTercero: toText(result.empateTercero),
      divTercero: toText(result.divTercero),
      empateTerceroDivTercero: toText(result.empateTerceroDivTercero ?? result.divTercero),
      favorito: toText(result.favorito),
      retiros: normalizeRetiros(result),
      retiro1: toText(result.retiro1),
      retiro2: toText(result.retiro2),
    });
  }

  const participantMap = new Map(event.participants.map((participant) => [Number(participant.index), participant]));
  for (const override of eventOverride.participants || []) {
    const base = participantMap.get(Number(override.index));
    participantMap.set(Number(override.index), {
      index: Number(override.index),
      name: toText(override.name) || base?.name || "Sin nombre",
      points: 0,
      picks: raceHeaders.map((race, idx) => ({
        race: race.number,
        raceLabel: race.label,
        horse: toText(override.picks?.[idx] ?? base?.picks?.[idx]?.horse ?? ""),
        score: 0,
      })),
    });
  }

  const results = Array.from(resultMap.values()).sort((a, b) => Number(a.race) - Number(b.race));
  const participants = scoreParticipants(
    Array.from(participantMap.values()).sort((a, b) => a.index - b.index),
    results,
    scoring,
    raceCount,
  );
  const leaderboard = [...participants].sort((a, b) => b.points - a.points || a.name.localeCompare(b.name, "es"));

  return {
    ...event,
    meta: {
      ...(event.meta || {}),
      ...(eventOverride.meta || {}),
    },
    races: raceCount,
    raceHeaders,
    scoring: normalizeScoring(scoring),
    results,
    participants,
    leaderboard,
  };
}

function parseProgramSheet(workbook) {
  const sheet = workbook.Sheets.Programa;
  if (!sheet) return [];
  const dayBlocks = [];
  for (let col = 0; col < 34; col += 5) {
    const dayName = toText(cellText(sheet, 0, col));
    if (!dayName) continue;
    const entries = [];
    for (let row = 2; row < 50; row += 1) {
      const carrera = toText(cellText(sheet, row, col));
      const numero = toText(cellText(sheet, row, col + 1));
      const ejemplar = toText(cellText(sheet, row, col + 2));
      const jinete = toText(cellText(sheet, row, col + 3));
      if (!carrera && !numero && !ejemplar && !jinete) continue;
      entries.push({ carrera, numero, ejemplar, jinete });
    }
    dayBlocks.push({ dayName, entries });
  }
  return dayBlocks;
}

function parseStudList(workbook, sheetName, nameCol = 1) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];
  const items = [];
  for (let row = 1; row < 150; row += 1) {
    const number = toNumber(cellValue(sheet, row, 0));
    const name = toText(cellText(sheet, row, nameCol));
    if (number === null && !name) {
      if (items.length > 0) break;
      continue;
    }
    items.push({
      number: number ?? items.length + 1,
      name: name || "Sin nombre",
    });
  }
  return items;
}

function parseMonthlyTable(workbook) {
  const sheet = workbook.Sheets.Tabla;
  if (!sheet) return null;
  const headers = [];
  for (let col = 2; col < 95; col += 1) {
    const value = toText(cellText(sheet, 6, col));
    if (!value) continue;
    headers.push({ col, label: value });
  }
  const standings = [];
  for (let row = 7; row < 80; row += 1) {
    const place = toText(cellText(sheet, row, 0));
    const stud = toText(cellText(sheet, row, 1));
    if (!place && !stud) {
      if (standings.length > 0) break;
      continue;
    }
    const scores = headers.map((header) => ({
      label: header.label,
      value: toNumber(cellValue(sheet, row, header.col)) ?? 0,
    }));
    standings.push({ place, stud, scores });
  }
  return {
    headers: headers.map((header) => header.label),
    standings,
  };
}

function buildSyntheticEvent({ id, type, sheetName, title, races: configuredRaces, scoring, meta }, overrides) {
  const eventOverride = overrides.events[id] || {};
  const participantOverrides = Array.isArray(eventOverride.participants) ? eventOverride.participants : [];
  const resultOverrides = eventOverride.results || {};
  const maxPicks = participantOverrides.reduce((max, participant) => Math.max(max, Array.isArray(participant.picks) ? participant.picks.length : 0), 0);
  const maxRace = Object.keys(resultOverrides).reduce((max, race) => Math.max(max, Number(race) || 0), 0);
  const metaRaceCount = Number(eventOverride.meta?.raceCount) || 0;
  const races = Math.max(Number(configuredRaces) || 0, metaRaceCount, 12, maxPicks, maxRace);
  const raceHeaders = createRaceHeaders(races);

  return applyEventOverrides(
    {
      id,
      type,
      sheetName,
      title: title || sheetName,
      meta: meta || {},
      races,
      raceHeaders,
      participants: [],
      results: [],
    },
    overrides,
    scoring,
  );
}

function normalizeIdPart(value) {
  return toText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getCampaignCollections(overrides) {
  const campaigns = overrides.settings?.campaigns || {};
  return [
    ...safeArray(campaigns.daily),
    ...safeArray(campaigns.diaria),
    ...safeArray(campaigns.weekly),
    ...safeArray(campaigns.monthly),
  ];
}

function eventIdMatchesCampaign(eventId, campaign) {
  const normalizedEventId = toText(eventId);
  const campaignId = toText(campaign?.id);
  if (!normalizedEventId || !campaignId) return false;
  if (toText(campaign?.eventId) === normalizedEventId) return true;
  if (safeArray(campaign?.eventIds).some((id) => toText(id) === normalizedEventId)) return true;
  return normalizedEventId === campaignId
    || normalizedEventId.startsWith(`${campaignId}-`)
    || normalizedEventId === `campaign-${campaignId}`
    || normalizedEventId.startsWith(`campaign-${campaignId}-`);
}

function resolveEventCampaign(eventId, eventData, campaigns) {
  const explicitCampaignId = toText(eventData?.meta?.campaignId);
  if (explicitCampaignId) {
    return campaigns.find((campaign) => toText(campaign?.id) === explicitCampaignId) || null;
  }
  const normalizedEventId = toText(eventId);
  const declaredEventMatches = campaigns.filter((campaign) => (
    toText(campaign?.eventId) === normalizedEventId
    || safeArray(campaign?.eventIds).some((id) => toText(id) === normalizedEventId)
  ));
  if (declaredEventMatches.length > 0) {
    return declaredEventMatches.length === 1 ? declaredEventMatches[0] : null;
  }

  const exactIdMatch = campaigns.find((campaign) => {
    const campaignId = toText(campaign?.id);
    return Boolean(campaignId) && (
      normalizedEventId === campaignId || normalizedEventId === `campaign-${campaignId}`
    );
  });
  if (exactIdMatch) return exactIdMatch;

  return campaigns
    .filter((campaign) => eventIdMatchesCampaign(normalizedEventId, campaign))
    .sort((a, b) => toText(b?.id).length - toText(a?.id).length)[0] || null;
}

function collectSyntheticEventDefs(overrides) {
  const defs = [];
  const campaigns = getCampaignCollections(overrides);
  const campaignTypeById = new Map();
  const addDef = (def) => {
    if (!def?.id) return;
    if (defs.some((item) => item.id === def.id)) return;
    defs.push(def);
  };

  for (const campaign of overrides.settings?.campaigns?.daily || []) {
    if (campaign.enabled === false) continue;
    campaignTypeById.set(String(campaign.id || ""), "diaria");
    addDef({
      id: campaign.eventId || `campaign-${campaign.id}`,
      type: "semanal",
      sheetName: campaign.eventName || campaign.date || campaign.name || "Diaria",
      title: campaign.name || campaign.eventName || "Diaria",
      races: campaign.raceCount,
      scoring: campaign.scoring,
    });
  }

  for (const campaign of overrides.settings?.campaigns?.weekly || []) {
    if (campaign.enabled === false) continue;
    campaignTypeById.set(String(campaign.id || ""), "semanal");
    const ids = Array.isArray(campaign.eventIds) && campaign.eventIds.length
      ? campaign.eventIds
      : (campaign.activeDays || []).map((day) => `${campaign.id}-${normalizeIdPart(day)}`);
    const names = Array.isArray(campaign.eventNames) ? campaign.eventNames : [];
    ids.forEach((id, index) => {
      const raceCount = Number(campaign.raceCountsByEvent?.[id]) || Number(campaign.raceCount) || 12;
      addDef({
        id,
        type: "semanal",
        sheetName: names[index] || campaign.activeDays?.[index] || `${campaign.name || "Semanal"} ${index + 1}`,
        title: campaign.name || "Semanal",
        races: raceCount,
        scoring: campaign.scoring,
      });
    });
  }

  for (const campaign of overrides.settings?.campaigns?.monthly || []) {
    if (campaign.enabled === false) continue;
    campaignTypeById.set(String(campaign.id || ""), "mensual");
    const overrideEventIds = Object.entries(overrides.events || {})
      .filter(([eventId, eventData]) => resolveEventCampaign(eventId, eventData, campaigns) === campaign)
      .map(([eventId]) => eventId);
    const ids = Array.isArray(campaign.eventIds) && campaign.eventIds.length
      ? campaign.eventIds
      : (overrideEventIds.length ? overrideEventIds : [`${campaign.id}-general`]);
    const names = Array.isArray(campaign.eventNames) ? campaign.eventNames : [];
    ids.forEach((id, index) => {
      const raceCount = Number(campaign.raceCountsByEvent?.[id]) || Number(campaign.raceCount) || 12;
      addDef({
        id,
        type: "mensual",
        sheetName: names[index] || campaign.name || `Mensual ${index + 1}`,
        title: campaign.name || "Mensual",
        races: raceCount,
        scoring: campaign.scoring,
      });
    });
  }

  for (const eventId of Object.keys(overrides.events || {})) {
    const eventData = overrides.events?.[eventId] || {};
    const explicitType = String(eventData?.meta?.campaignType || "").trim().toLowerCase();
    const campaignId = String(eventData?.meta?.campaignId || "").trim();
    const inferredCampaignType = campaignId ? campaignTypeById.get(campaignId) : null;
    const campaign = resolveEventCampaign(eventId, eventData, campaigns);
    const resolvedCampaignType = campaign ? campaignTypeById.get(toText(campaign.id)) : null;
    const inferredType = explicitType || inferredCampaignType || resolvedCampaignType || (eventId.startsWith("mensual") ? "mensual" : "semanal");
    addDef({
      id: eventId,
      type: inferredType === "mensual" ? "mensual" : "semanal",
      sheetName: eventData?.meta?.date || eventId,
      title: eventData?.meta?.title || eventId,
      meta: eventData?.meta || {},
      scoring: campaign?.enabled !== false
        ? (campaign?.scoring || eventData?.scoring)
        : eventData?.scoring,
    });
  }

  return defs;
}

function buildEventScoringMap(overrides) {
  const map = new Map();
  const campaigns = getCampaignCollections(overrides);
  const addCampaignScoring = (campaignCollection) => {
    (campaignCollection || []).forEach((campaign) => {
      if (campaign.enabled === false) return;
      const scoring = normalizeScoring(campaign.scoring);
      const overrideEventIds = Object.entries(overrides.events || {})
        .filter(([eventId, eventData]) => resolveEventCampaign(eventId, eventData, campaigns) === campaign)
        .map(([eventId]) => eventId);
      const ids = Array.isArray(campaign.eventIds) && campaign.eventIds.length
        ? campaign.eventIds
        : (campaign.eventId ? [campaign.eventId] : overrideEventIds);
      ids.forEach((id) => map.set(id, scoring));
    });
  };
  addCampaignScoring([
    ...safeArray(overrides.settings?.campaigns?.daily),
    ...safeArray(overrides.settings?.campaigns?.diaria),
  ]);
  addCampaignScoring(overrides.settings?.campaigns?.weekly);
  addCampaignScoring(overrides.settings?.campaigns?.monthly);
  Object.entries(overrides.events || {}).forEach(([eventId, eventData]) => {
    const campaign = resolveEventCampaign(eventId, eventData, campaigns);
    if (campaign?.enabled === false && !eventData?.scoring) {
      map.delete(eventId);
      return;
    }
    const scoring = campaign?.enabled === false
      ? eventData?.scoring
      : (campaign?.scoring || eventData?.scoring);
    if (scoring) map.set(eventId, normalizeScoring(scoring));
  });
  return map;
}

function buildRegistry(studGroups, overrides) {
  const map = new Map();
  const registryGroups = new Map(
    safeArray(overrides.settings?.registryGroups).map((group) => [String(group.id || "").trim(), group]),
  );
  const normalizeGroups = (item, current) => Array.from(
    new Set([
      ...safeArray(item?.groups),
      ...safeArray(item?.groupIds),
      item?.group,
      item?.groupId,
      ...safeArray(current?.groups),
    ].map((groupId) => toText(groupId)).filter(Boolean)),
  );

  for (const stud of studGroups.semanal) {
    const name = toText(stud.name);
    if (!name || name === "0") continue;
    map.set(name.toLowerCase(), {
      name,
      diaria: false,
      semanal: true,
      mensual: false,
      source: "excel",
    });
  }

  for (const stud of studGroups.mensual) {
    const name = toText(stud.name);
    if (!name || name === "0") continue;
    const current = map.get(name.toLowerCase());
    map.set(name.toLowerCase(), {
      name,
      diaria: current?.diaria ?? false,
      semanal: current?.semanal ?? false,
      mensual: true,
      source: "excel",
    });
  }

  for (const item of overrides.registry || []) {
    const name = toText(item.name);
    if (!name) continue;
    const current = map.get(name.toLowerCase());
    const groups = normalizeGroups(item, current);
    const requestedGroup = toText(item.group);
    const primaryGroup = groups.includes(requestedGroup) ? requestedGroup : groups[0] || "";
    map.set(name.toLowerCase(), {
      name,
      diaria: Boolean(item.diaria ?? current?.diaria),
      semanal: Boolean(item.semanal ?? current?.semanal),
      mensual: Boolean(item.mensual ?? current?.mensual),
      promo: Boolean(item.promo ?? current?.promo),
      promoMode: toText(item.promoMode || current?.promoMode),
      promoPartners: Array.from(
        new Set(
          safeArray(item.promoPartners ?? current?.promoPartners)
            .map((partner) => toText(partner))
            .filter(Boolean),
        ),
      ),
      group: primaryGroup,
      groups,
      groupName: toText(registryGroups.get(primaryGroup)?.name || primaryGroup),
      source: current ? "excel+admin" : "admin",
    });
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "es"));
}

function loadData() {
  const overrides = loadOverrides();
  const publicSettings = {
    ...overrides.settings,
    adminUsers: Array.isArray(overrides.settings?.adminUsers)
      ? overrides.settings.adminUsers.map((user) => ({
          id: user.id,
          username: user.username,
          displayName: user.displayName || user.username,
          enabled: user.enabled !== false,
          role: user.role || "admin",
        }))
      : [],
  };
  const scoringMap = buildEventScoringMap(overrides);
  const useExcelBase = Boolean(overrides.settings?.excel?.useExcelBase);
  const weeklyBook = useExcelBase ? readWorkbook(FILES.semanal) : null;
  const monthlyBook = useExcelBase ? readWorkbook(FILES.mensual) : null;
  const studs = useExcelBase
    ? {
        semanal: parseStudList(weeklyBook, "STUD"),
        mensual: parseStudList(monthlyBook, "Partici"),
      }
    : {
        semanal: [],
        mensual: [],
      };

  const weeklyEvents = useExcelBase
    ? WEEKDAY_SHEETS
        .map((sheetName) => parseCompetitionSheet(weeklyBook, sheetName, "semanal"))
        .map((event) => (event ? applyEventOverrides(event, overrides, scoringMap.get(event.id)) : null))
        .filter(Boolean)
    : [];

  const monthlyEvents = useExcelBase
    ? monthlyBook.SheetNames
        .map((sheetName) => {
          const normalized = sheetName.toLowerCase();
          const looksLikeCompetition =
            normalized.startsWith("dia ") ||
            normalized.startsWith("dia") ||
            /\d/.test(normalized);
          return looksLikeCompetition ? parseCompetitionSheet(monthlyBook, sheetName, "mensual") : null;
        })
        .map((event) => (event ? applyEventOverrides(event, overrides, scoringMap.get(event.id)) : null))
        .filter(Boolean)
    : [];

  const knownWeeklyIds = new Set(weeklyEvents.map((event) => event.id));
  const knownMonthlyIds = new Set(monthlyEvents.map((event) => event.id));
  const syntheticDefs = collectSyntheticEventDefs(overrides);

  syntheticDefs.forEach((def) => {
    if (def.type === "mensual") {
      if (!knownMonthlyIds.has(def.id)) {
        monthlyEvents.push(buildSyntheticEvent(def, overrides));
        knownMonthlyIds.add(def.id);
      }
      return;
    }
    if (!knownWeeklyIds.has(def.id)) {
      weeklyEvents.push(buildSyntheticEvent(def, overrides));
      knownWeeklyIds.add(def.id);
    }
  });

  weeklyEvents.sort((a, b) => a.sheetName.localeCompare(b.sheetName, "es"));
  monthlyEvents.sort((a, b) => a.sheetName.localeCompare(b.sheetName, "es"));

  // Recopilar todos los eventos importados (imported-*)
  const importedEvents = {};
  Object.entries(overrides.events || {}).forEach(([eventId, eventData]) => {
    if (eventId.startsWith('imported-')) {
      importedEvents[eventId] = eventData;
    }
  });

  // Incluir eventos de campañas diarias (campaign-daily-* / campaign-diaria-*)
  const dailyCampaignDefs = overrides.settings?.campaigns?.daily || overrides.settings?.campaigns?.diaria || [];
  Object.entries(overrides.events || {}).forEach(([eventId, eventData]) => {
    if (eventId.startsWith('campaign-daily-') || eventId.startsWith('campaign-diaria-')) {
      const campaign = resolveEventCampaign(eventId, eventData, dailyCampaignDefs);
      const campaignId = campaign?.id || toText(eventData?.meta?.campaignId) || eventId.replace(/^campaign-/, '');
      importedEvents[eventId] = {
        ...eventData,
        scoring: campaign?.scoring || eventData.scoring,
        meta: {
          ...eventData.meta,
          date: campaign?.date || eventData.meta?.date || '',
          trackName: campaign?.name || eventData.meta?.trackName || eventId,
          raceCount: campaign?.raceCount || eventData.meta?.raceCount || 12,
          campaignType: 'diaria',
          campaignId: campaign?.id || campaignId,
          campaignName: campaign?.name || '',
        },
      };
    }
  });


  return {
    updatedAt: new Date().toISOString(),
    files: FILES,
    storage: {
      overridesFile: OVERRIDES_FILE,
    },
    settings: publicSettings,
    programs: overrides.programs || {},
    studs,
    registry: buildRegistry(studs, overrides),
    programa: useExcelBase ? parseProgramSheet(weeklyBook) : [],
    // Exponer eventos importados automáticamente para Admin > Resultados
    events: importedEvents,
    semanal: {
      events: weeklyEvents,
      totalEvents: weeklyEvents.length,
      totalParticipants: weeklyEvents.reduce((max, event) => Math.max(max, event.participants.length), 0),
    },
    mensual: {
      events: monthlyEvents,
      totalEvents: monthlyEvents.length,
      totalParticipants: monthlyEvents.reduce((max, event) => Math.max(max, event.participants.length), 0),
      tabla: useExcelBase ? parseMonthlyTable(monthlyBook) : { headers: [], standings: [] },
    },
  };
}

module.exports = {
  loadData,
  __test: {
    buildEventScoringMap,
    normalizeScoring,
    resolveEventCampaign,
    scoreParticipants,
  },
};
