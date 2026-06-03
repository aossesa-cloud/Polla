const {
  fetchTeletrakProgram,
  fetchTeletrakRaceResults,
  fetchTeletrakTracks,
  matchTeletrakTrack,
} = require("../teletrak");
const {
  loadOverrides,
  upsertProgram,
  upsertResultIncremental,
} = require("../storage");

const DEFAULT_TRACKS = ["chs", "hipodromo-chile", "valparaiso", "concepcion"];

function chileDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function argValue(name) {
  const arg = process.argv.find((item) => item.startsWith(`--${name}=`));
  return arg ? arg.slice(name.length + 3).trim() : "";
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function text(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function dateInRange(date, start, end) {
  const safeDate = text(date);
  const safeStart = text(start);
  const safeEnd = text(end);
  if (!safeDate || !safeStart || !safeEnd) return false;
  return safeDate >= safeStart && safeDate <= safeEnd;
}

function collectTargetEventIds(date, localTrackId, overrides) {
  const ids = new Set([
    `imported-${date}`,
    `imported-${date}::${localTrackId}`,
  ]);

  Object.entries(overrides.events || {}).forEach(([eventId, event]) => {
    if (text(event?.meta?.date) === date) ids.add(eventId);
    if (eventId.includes(date)) ids.add(eventId);
  });

  const campaigns = overrides.settings?.campaigns || {};
  (campaigns.daily || []).forEach((campaign) => {
    if (campaign.enabled === false || text(campaign.date) !== date) return;
    ids.add(campaign.eventId || `campaign-${campaign.id}`);
  });

  (campaigns.weekly || []).forEach((campaign) => {
    if (campaign.enabled === false || !dateInRange(date, campaign.startDate, campaign.endDate)) return;
    (campaign.eventIds || []).forEach((eventId) => {
      if (text(eventId).includes(date)) ids.add(eventId);
    });
  });

  (campaigns.monthly || []).forEach((campaign) => {
    if (campaign.enabled === false || !dateInRange(date, campaign.startDate, campaign.endDate)) return;
    (campaign.eventIds || []).forEach((eventId) => {
      if (text(eventId).includes(date)) ids.add(eventId);
    });
    (campaign.selectedEventIds || []).forEach((eventId) => {
      if (text(eventId).includes(date)) ids.add(eventId);
    });
  });

  return Array.from(ids).filter(Boolean);
}

async function importTrack(date, localTrackId, teletrakTracks, options = {}) {
  const dryRun = Boolean(options.dryRun);
  console.log(`[excel:update] Importando ${localTrackId} para ${date}...`);
  let program = null;
  try {
    program = await fetchTeletrakProgram(date, localTrackId);
    if (!dryRun) upsertProgram(program);
    console.log(`[excel:update] Programa ${localTrackId}: ${program.raceCount} carreras`);
  } catch (error) {
    console.log(`[excel:update] Programa ${localTrackId}: ${error.message}`);
  }

  const trackName = program?.trackName || localTrackId;
  const matchedTrack = matchTeletrakTrack(teletrakTracks, trackName);
  if (!matchedTrack) {
    console.log(`[excel:update] Resultados ${localTrackId}: no encontre hipodromo en Teletrak`);
    return { localTrackId, imported: 0 };
  }

  const payload = await fetchTeletrakRaceResults(matchedTrack.id, date);
  const overrides = loadOverrides();
  const targetEventIds = collectTargetEventIds(date, localTrackId, overrides);
  let imported = 0;

  payload.results.forEach((result) => {
    if (!text(result.primero)) return;
    targetEventIds.forEach((eventId) => {
      if (!dryRun) {
        upsertResultIncremental(eventId, result.race, result, {
          skipIfComplete: true,
          preferExisting: true,
        });
      }
    });
    imported += 1;
  });

  const action = dryRun ? "detectadas para guardar" : "guardadas";
  console.log(`[excel:update] Resultados ${localTrackId}: ${imported} carreras ${action} en ${targetEventIds.length} evento(s)`);
  return { localTrackId, imported };
}

async function run() {
  const date = argValue("date") || chileDate();
  const trackArg = argValue("track");
  const dryRun = hasFlag("dry-run");
  const tracks = trackArg ? trackArg.split(",").map((item) => item.trim()).filter(Boolean) : DEFAULT_TRACKS;

  console.log(`[excel:update] Fecha: ${date}`);
  if (dryRun) console.log("[excel:update] Modo dry-run: no se escriben cambios.");
  const teletrakTracks = await fetchTeletrakTracks(date);
  if (!teletrakTracks.length) {
    console.log("[excel:update] Teletrak no devolvio hipodromos para la fecha.");
    return;
  }

  for (const track of tracks) {
    try {
      await importTrack(date, track, teletrakTracks, { dryRun });
    } catch (error) {
      console.log(`[excel:update] ${track}: ${error.message}`);
    }
  }
}

if (require.main === module) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = { run };
