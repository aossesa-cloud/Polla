const express = require("express");
const crypto = require("crypto");
const path = require("path");
const { loadData } = require("./parser");
const {
  upsertParticipant,
  upsertResult,
  upsertResultIncremental,  // ✅ NEW: Incremental import
  upsertEventMeta,
  upsertRegistryGroup,
  upsertRegistryParticipant,
  updateSettings,
  loadOverrides,
  saveOverrides,
  updateCampaign,
  deleteCampaign,
  copyEventResults,
  clearEventData,
  deleteParticipant,
  deleteRegistryGroup,
  deleteRegistryParticipant,
  upsertProgram,
  deleteProgram,
  loadJornada,
  saveJornadaServer,
  listJornadaDates,
  prepareManualResultPayload,
} = require("./storage");
const { fetchTeletrakProgram, fetchTeletrakTracks, fetchTeletrakRaceResults } = require("./teletrak");
const { extractFavoriteFromOddsBoards, parseTeletrakRunnerEntries, matchTeletrakTrack, formatTeletrakTime } = require("./teletrak");
const { fetchTeletrakFavoritesForRaces } = require("./teletrak");

// Constantes de Teletrak API
const TELETRAK_API_BASE = "https://apuestas.teletrak.cl/api/falcon/v1/results";
const TELETRAK_STOMP_URL = "https://apuestas.teletrak.cl/api/falcon/ws";

// Helper functions para mapeo de resultados (copiadas de teletrak.js para evitar circular dependency)
function payoutValue(entry, key) {
  // Intentar múltiples estructuras posibles de dividendos
  if (entry?.payouts?.[key]) return String(entry.payouts[key]).trim();
  if (entry?.dividends?.[key]) return String(entry.dividends[key]).trim();
  if (entry?.odds) return String(entry.odds).trim();
  if (entry?.payout) return String(entry.payout).trim();
  if (entry?.dividend) return String(entry.dividend).trim();
  return "";
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

function mapRaceResult(race, favorite = "") {
  const entries = Array.isArray(race.runnersResults) ? race.runnersResults : [];
  const first = extractPrimaryEntry(entries, 1);
  const firstTie = extractTieEntry(entries, 1);
  const second = extractPrimaryEntry(entries, 2);
  const secondTie = extractTieEntry(entries, 2);
  const third = extractPrimaryEntry(entries, 3);
  const thirdTie = extractTieEntry(entries, 3);

  const result = {
    race: String(Number(race.raceNumber) === 0 ? 1 : Number(race.raceNumber)),
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
  
  return result;
}

// Helper para fetch JSON
async function fetchJson(url) {
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
}

// Exportar funciones que necesitan teletrak.js
module.exports.fetchJson = fetchJson;
module.exports.mapRaceResult = mapRaceResult;

const app = express();
const PORT = process.env.PORT || 3030;

// =====================================================
// LOGGING CONTROL (evita saturación de logs en Railway)
// =====================================================
const LOG_LEVEL = String(
  process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "warn" : "info")
).toLowerCase();
const DEBUG_LOGS = process.env.DEBUG_LOGS === "true";
const LOG_THROTTLE_ENABLED = process.env.LOG_THROTTLE !== "false";
const LOG_THROTTLE_MS = Math.max(250, Number(process.env.LOG_THROTTLE_MS || 1000));

const LEVEL_WEIGHT = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const originalConsole = {
  log: console.log.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
};

function safeSerialize(value) {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function shouldPrint(level) {
  if (level === "debug" && !DEBUG_LOGS) return false;
  const current = LEVEL_WEIGHT[level] ?? LEVEL_WEIGHT.info;
  const min = LEVEL_WEIGHT[LOG_LEVEL] ?? LEVEL_WEIGHT.info;
  return current >= min;
}

const logThrottleMap = new Map();

function throttledPrint(method, args, level) {
  if (!shouldPrint(level)) return;

  if (!LOG_THROTTLE_ENABLED || level === "error") {
    originalConsole[method](...args);
    return;
  }

  const now = Date.now();
  const signature = `${method}|${args.map(safeSerialize).join(" ")}`;
  const entry = logThrottleMap.get(signature);

  if (entry && now - entry.lastAt < LOG_THROTTLE_MS) {
    entry.dropped += 1;
    return;
  }

  if (entry?.dropped > 0) {
    originalConsole.warn(
      `[LOG-THROTTLE] Mensajes repetidos suprimidos: ${entry.dropped} (ventana ${LOG_THROTTLE_MS}ms)`
    );
  }

  logThrottleMap.set(signature, { lastAt: now, dropped: 0 });
  originalConsole[method](...args);
}

console.log = (...args) => throttledPrint("log", args, "info");
console.warn = (...args) => throttledPrint("warn", args, "warn");
console.error = (...args) => throttledPrint("error", args, "error");

// =====================================================
// AUTO-IMPORT: Programa diario a las 7:00 AM
// =====================================================
function scheduleDailyProgramImport() {
  const SCHEDULE_HOUR = 7; // 7:00 AM
  const SAME_DAY_RETRY_INTERVAL_MS = 10 * 60 * 1000; // 10 minutos
  let nextImportTimeout = null;

  function getNextScheduleTime() {
    const now = new Date();
    const scheduled = new Date(now);
    scheduled.setHours(SCHEDULE_HOUR, 0, 0, 0);
    
    // Si ya pasaron las 7 AM hoy, programar para mañana
    if (now >= scheduled) {
      scheduled.setDate(scheduled.getDate() + 1);
    }
    
    return scheduled;
  }
  
  function getTimeUntilNextSchedule() {
    const next = getNextScheduleTime();
    const now = new Date();
    return next.getTime() - now.getTime();
  }

  function shouldRetrySameDay() {
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setHours(23, 0, 0, 0);
    return now < cutoff;
  }

  function scheduleSameDayRetry() {
    if (!shouldRetrySameDay()) return;
    console.log(`⏳ [AUTO-IMPORT] Reintento programado en ${Math.round(SAME_DAY_RETRY_INTERVAL_MS / 60000)} min`);
    setTimeout(() => tryImport(1), SAME_DAY_RETRY_INTERVAL_MS);
  }
  
  async function importAllPrograms() {
    const today = getChileDate(); // YYYY-MM-DD (Hora Chile)
    console.log(`\n⏰ [AUTO-IMPORT] Iniciando importación automática de programas - ${today} ${new Date().toLocaleTimeString()}`);
    
    const MAX_RETRIES = 5;
    const RETRY_DELAY_MS = 10 * 60 * 1000; // 10 minutos entre reintentos
    
    async function tryImport(attempt = 1) {
      try {
        const tracks = await fetchTeletrakTracks(today);
        
        if (!tracks.length) {
          console.log(`⚠️ [AUTO-IMPORT] No se encontraron hipódromos para ${today}`);
          return false;
        }
        
        console.log(`📋 [AUTO-IMPORT] Hipódromos encontrados: ${tracks.length}`);
        
        let importedCount = 0;
        let skippedCount = 0;
        
        for (const track of tracks) {
          // Mapear track.id a localTrackId
          let localTrackId = null;
          const trackName = track.name.toLowerCase();
          
          if (trackName.includes('concepcion') || trackName.includes('concepción')) {
            localTrackId = 'concepcion';
          } else if (trackName.includes('valparaiso') || trackName.includes('valparaíso')) {
            localTrackId = 'valparaiso';
          } else if (trackName.includes('hipodromo chile') || trackName.includes('hipódromo chile')) {
            localTrackId = 'hipodromo-chile';
          } else if (
            trackName.includes('santiago') ||
            trackName.includes('club hípico de santiago') ||
            trackName.includes('club hipico de santiago') ||
            trackName.includes('club hípico') ||
            trackName.includes('club hipico')
          ) {
            localTrackId = 'chs';
          }
          
          if (!localTrackId) {
            console.log(`⚠️ [AUTO-IMPORT] Hipódromo no reconocido: ${track.name}`);
            continue;
          }
          
          // Verificar si ya existe el programa
          const programs = loadOverrides().programs || {};
          const programKey = `${today}::${localTrackId}`;
          if (programs[programKey]) {
            console.log(`ℹ️ [AUTO-IMPORT] ${localTrackId}: Programa ya existe, saltando`);
            skippedCount++;
            continue;
          }
          
          try {
            console.log(`🔄 [AUTO-IMPORT] Importando ${localTrackId}...`);
            const imported = await fetchTeletrakProgram(today, localTrackId);
            
            upsertProgram({
              date: imported.date,
              trackId: imported.trackId,
              trackName: imported.trackName,
              source: imported.source,
              sourceUrl: imported.sourceUrl,
              status: imported.status,
              races: imported.races,
            });

            // Re-disparar planificación de resultados ahora que el programa ya existe en storage
            if (typeof global.triggerRaceSchedulerForToday === "function") {
              setTimeout(() => {
                try {
                  global.triggerRaceSchedulerForToday();
                } catch (scheduleError) {
                  console.warn(`[AUTO-IMPORT] No se pudo replanificar resultados para ${localTrackId}: ${scheduleError.message}`);
                }
              }, 500);
            }
            
            importedCount++;
            console.log(`✅ [AUTO-IMPORT] ${localTrackId}: ${imported.raceCount} carreras importadas`);
          } catch (error) {
            if (error.message.includes('programa vivo')) {
              console.log(`⏳ [AUTO-IMPORT] ${localTrackId}: Reunión aún no activa en Teletrak, reintentaremos después`);
            } else {
              console.error(`❌ [AUTO-IMPORT] Error en ${localTrackId}:`, error.message);
            }
          }
        }
        
        if (importedCount > 0 || skippedCount > 0) {
          console.log(`✨ [AUTO-IMPORT] Completado: ${importedCount} importados, ${skippedCount} ya existían\n`);
          return true; // Éxito o parcialmente exitoso
        }
        
        // Si no importó nada y no hay programas existentes, reintentar
        if (attempt < MAX_RETRIES) {
          console.log(`🔄 [AUTO-IMPORT] Reintento ${attempt}/${MAX_RETRIES} en 10 minutos...`);
          setTimeout(() => tryImport(attempt + 1), RETRY_DELAY_MS);
          return false;
        } else {
          if (shouldRetrySameDay()) {
            console.log(`⏳ [AUTO-IMPORT] Sin programas activos aún. Seguiremos reintentando cada 10 min hasta las 23:00.`);
            scheduleSameDayRetry();
            return false;
          }
          console.log(`⚠️ [AUTO-IMPORT] Agotados ${MAX_RETRIES} intentos. Las reuniones aún no están activas en Teletrak.\n`);
          return false;
        }
        
      } catch (error) {
        console.error(`❌ [AUTO-IMPORT] Error general:`, error.message);
        if (shouldRetrySameDay()) {
          console.log(`⏳ [AUTO-IMPORT] Error general. Reintentaremos en 10 min hasta las 23:00.`);
          scheduleSameDayRetry();
        }
        return false;
      }
    }
    
    // Iniciar primer intento inmediato
    await tryImport(1);
    
    // Re-programar para el próximo día
    scheduleNextImport();
  }
  
  function scheduleNextImport() {
    if (nextImportTimeout) {
      clearTimeout(nextImportTimeout);
      nextImportTimeout = null;
    }

    const delay = getTimeUntilNextSchedule();
    const hours = Math.floor(delay / (1000 * 60 * 60));
    const minutes = Math.floor((delay % (1000 * 60 * 60)) / (1000 * 60));
    
    console.log(`⏱️ [AUTO-IMPORT] Próxima importación en ${hours}h ${minutes}min (${getNextScheduleTime().toLocaleString()})`);
    
    nextImportTimeout = setTimeout(() => {
      nextImportTimeout = null;
      importAllPrograms();
    }, delay);
  }
  
  // Intento inmediato al iniciar + agendar próximo ciclo
  importAllPrograms();
}

// =====================================================
// AUTO-IMPORT: Resultados basados en hora de cada carrera
// =====================================================
function scheduleRaceResultImports() {
  const CHECK_AFTER_POST_TIME_MINUTES = 1; // Empezar a verificar 1 min después del postTime
  const RECHECK_INTERVAL_MS = 60000; // Verificar cada 1 minuto si no cerró
  const MAX_RETRIES = 30; // Máximo 30 intentos (30 min)
  const DIVIDEND_CHECK_RETRIES = 10; // Reintentos extra para traer dividendos

  // Track de carreras ya importadas hoy
  const importedRaces = new Map(); // raceKey -> { hasResults: bool, hasDividends: bool, retryCount: number }
  const watcherState = {
    startTime: new Date().toISOString(),
    lastCheck: null,
    totalChecks: 0,
    totalImports: 0,
    activeSchedules: [],
  };

  // Exponer estado para diagnóstico
  global.raceWatcherStatus = {
    active: true,
    state: watcherState,
    importedRaces: () => Object.fromEntries(importedRaces),
    importedCount: () => importedRaces.size,
  };

  function releaseRaceSequenceIfNeeded(sequenceKey, raceKey, raceNumber) {
    if (!sequenceKey) return;
    const status = importedRaces.get(raceKey);
    if (!status || status.sequenceReleased) return;
    importedRaces.set(raceKey, { ...status, sequenceReleased: true });
    advanceRaceSequence(sequenceKey, raceNumber);
  }
  
  async function checkRaceStatus(teletrakTrackId, localTrackId, trackName, raceNumber, raceId, postTime, date, sequenceKey) {
    const raceKey = `${date}_${localTrackId}_${raceNumber}`;
    const importStatus = importedRaces.get(raceKey);

    // Track state
    watcherState.lastCheck = new Date().toISOString();
    watcherState.totalChecks++;

    // Si ya tenemos resultados Y dividendos, no verificar más
    if (importStatus?.hasResults && importStatus?.hasDividends) {
      advanceRaceSequence(sequenceKey, raceNumber);
      return;
    }
    
    // Si ya reintentamos demasiado para dividendos, parar
    if (importStatus?.hasResults && importStatus?.dividendRetries >= DIVIDEND_CHECK_RETRIES) {
      console.log(`⏹️ [RACE-CHECK] Carrera ${raceNumber}: máximos reintentos para dividendos (${DIVIDEND_CHECK_RETRIES}), cerrando...`);
      return;
    }

    const now = new Date();
    const currentHour = Number(new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Santiago",
      hour: "2-digit",
      hour12: false,
    }).format(now));

    // No seguir verificando durante la noche, pero permitir carreras matinales.
    if (currentHour >= 23) {
      return;
    }

    try {
      console.log(`🏁 [RACE-CHECK] Verificando carrera ${raceNumber} - ${trackName} (${postTime})...`);

      // Consultar resultados de Teletrak usando el ID numérico
      const payload = await fetchJson(`https://apuestas.teletrak.cl/api/falcon/v1/results/races/${Number(teletrakTrackId)}/${date}`);
      const results = Array.isArray(payload?.results) ? payload.results : [];

      // Buscar la carrera específica
      const race = results.find(r => Number(r.raceNumber) === Number(raceNumber));

      if (!race) {
        console.log(`⏳ [RACE-CHECK] Carrera ${raceNumber} aún no aparece en resultados, re-verificando en 1 min...`);
        setTimeout(() => checkRaceStatus(teletrakTrackId, localTrackId, trackName, raceNumber, raceId, postTime, date, sequenceKey), RECHECK_INTERVAL_MS);
        return;
      }

      // Verificar si la carrera tiene resultados (primero definido) o está marcada como completa
      // Guardar SIEMPRE si Teletrak devuelve la carrera, incluso sin dividendos
      const hasResults = race.runnersResults && race.runnersResults.length > 0;
      const hasFirstPlace = hasResults && race.runnersResults.some(r => r.position === 1);

      // Si la carrera no existe en Teletrak, reintentar después
      if (!race) {
        console.log(`⏳ [RACE-CHECK] Carrera ${raceNumber} no aparece en Teletrak, re-verificando en 1 min...`);
        setTimeout(() => checkRaceStatus(teletrakTrackId, localTrackId, trackName, raceNumber, raceId, postTime, date, sequenceKey), RECHECK_INTERVAL_MS);
        return;
      }

      // La carrera tiene resultados o está completa, importar
      console.log(`✅ [RACE-CHECK] Carrera ${raceNumber} tiene resultados! Importando...`);
      console.log(`   Estado: complete=${race.complete}, resultados=${race.runnersResults?.length || 0}, primero=${hasFirstPlace ? 'SI' : 'NO'}`);
      
      // ✅ DIAGNÓSTICO: Verificar si ya existe en eventos
      const genericEventId = `imported-${date}`;
      const data = loadOverrides();
      const existingEventData = data.events?.[genericEventId];
      const existingResult = existingEventData?.results?.[String(raceNumber)];
      
      if (existingResult && existingResult.primero) {
        console.log(`   ℹ️ [EXISTENTE] Carrera ${raceNumber} ya tiene datos:`);
        console.log(`      1°=${existingResult.primero}, 2°=${existingResult.segundo}, 3°=${existingResult.tercero}`);
        console.log(`      Divs: Ganador=${existingResult.ganador || 'N/A'}, 2°=${existingResult.divSegundo || 'N/A'}, 3°=${existingResult.divTercero || 'N/A'}`);
        console.log(`      Favorito=${existingResult.favorito || 'N/A'}`);
        console.log(`   🔄 Se hará MERGE inteligente (NO se sobrescribe)`);
      } else {
        console.log(`   🆕 [NUEVA] Carrera ${raceNumber} no tiene datos, se guardará completo`);
      }

      // Obtener favorito del mercado de apuestas (siempre intentar, sin filtro de complete)
      console.log(`   🎯 Obteniendo favorito desde canal vivo...`);
      let favorite = '';

      // Usar Promise.race para evitar que se quede colgado indefinidamente
      const favoritePromise = (async () => {
        try {
          // race de results puede no tener raceId, usar raceNumber en su lugar
          const raceForFavorite = {
            raceId: race.raceId || race.id || race.raceNumber,
            raceNumber: race.raceNumber || raceNumber
          };
          const favoriteMap = await fetchTeletrakFavoritesForRaces(
            [raceForFavorite].filter(r => Number(r?.raceId) > 0),
            { timeoutMs: 8000 } // Timeout de 8 segundos
          );
          return favoriteMap.get(String(raceNumber)) || '';
        } catch (favError) {
          console.warn(`   ⚠️ No se pudo obtener favorito: ${favError.message}`);
          return '';
        }
      })();
      
      // Timeout de seguridad de 10 segundos
      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => {
          console.warn(`   ⚠️ Timeout obteniendo favorito (10s), continuando sin favorito...`);
          resolve('');
        }, 10000);
      });
      
      favorite = await Promise.race([favoritePromise, timeoutPromise]);
      console.log(`   🎯 Favorito obtenido (carrera ${raceNumber}): ${favorite || 'No disponible'}`);

      // Mapear resultado con el favorito
      const raceResult = mapRaceResult(race, favorite);

      // Verificar si tenemos dividendos (alguno de los 3 primeros tiene payout)
      const hasDividends = raceResult.ganador || raceResult.divSegundo || raceResult.divTercero;

      // SIEMPRE guardar en evento genérico importado-${date} para que aparezca en Admin > Resultados
      // ✅ INCREMENTAL: NO sobrescribir si la carrera ya está completa
      const importResult = upsertResultIncremental(genericEventId, raceResult.race, raceResult, {
        skipIfComplete: true,
        preferExisting: true
      });
      
      if (importResult.skipped) {
        console.log(`⏭️ [AUTO-IMPORT] Carrera ${raceResult.race} saltada: ${importResult.reason}`);
      } else {
        console.log(`✅ [AUTO-IMPORT] Carrera ${raceResult.race} guardada/actualizada correctamente`);
      }
      
      upsertEventMeta(genericEventId, {
        date: date,
        trackId: localTrackId,
        trackName: trackName,
        source: "teletrak-auto-import",
        importedAt: new Date().toISOString(),
        autoImported: true,
        visibleInAdmin: true,
        lastUpdated: new Date().toISOString()
      });

      // También guardar en campañas activas si las hay
      const campaigns = data.settings?.campaigns || {};

      const activeEvents = [];
      console.log(`   [DEBUG] Buscando campañas activas para fecha ${date}...`);
      
      ['daily', 'weekly', 'monthly'].forEach(kind => {
        const kindCampaigns = campaigns[kind] || [];
        console.log(`   [DEBUG] ${kind}: ${kindCampaigns.length} campañas encontradas`);
        
        kindCampaigns.forEach(campaign => {
          if (!campaign.enabled) {
            console.log(`   [DEBUG] ${kind} "${campaign.name}": deshabilitada, saltando`);
            return;
          }
          
          // Obtener el eventId correcto para esta campaña
          let campaignEventId = null;
          if (kind === 'daily') {
            // Campañas diarias: usar eventId o generar uno por defecto
            campaignEventId = campaign.eventId || `campaign-${campaign.id}`;
            console.log(`   [DEBUG] ${kind} "${campaign.name}": date=${campaign.date}, eventId=${campaignEventId}, match=${campaign.date === date}`);
            // Solo guardar si la fecha de la campaña coincide
            if (campaign.date !== date) return;
          } else {
            // Campañas semanales/mensuales: buscar eventIds que incluyan la fecha
            const eventIds = campaign.eventIds || [];
            console.log(`   [DEBUG] ${kind} "${campaign.name}": eventIds=${JSON.stringify(eventIds)}`);
            for (const eventId of eventIds) {
              if (eventId.includes(date)) {
                campaignEventId = eventId;
                console.log(`   [DEBUG] ${kind} "${campaign.name}": encontrado eventId=${campaignEventId}`);
                break;
              }
            }
            if (!campaignEventId) return;
          }
          
          // Guardar resultado en el evento de la campaña
          if (!activeEvents.includes(campaignEventId)) {
            activeEvents.push(campaignEventId);
            
            // ✅ INCREMENTAL: NO sobrescribir si ya existe
            const campaignImportResult = upsertResultIncremental(campaignEventId, raceResult.race, raceResult, {
              skipIfComplete: true,
              preferExisting: true
            });
            
            if (campaignImportResult.skipped) {
              console.log(`⏭️ [CAMPAIGN] Carrera ${raceResult.race} saltada en campaña: ${campaignImportResult.reason}`);
            } else {
              console.log(`   📁 Guardado en campaña ${kind}: ${campaignEventId}`);
            }
          }
        });
      });
      
      console.log(`   [DEBUG] Total activeEvents: ${activeEvents.length} - ${JSON.stringify(activeEvents)}`);

      console.log(`✨ [RACE-CHECK] Carrera ${raceNumber} guardada en evento: ${genericEventId}`);
      console.log(`   1°=${raceResult.primero}, 2°=${raceResult.segundo}, 3°=${raceResult.tercero}, Fav=${raceResult.favorito || 'N/A'}`);
      console.log(`   Dividendos: Ganador=${raceResult.ganador || 'ESPERANDO'}, 2°=${raceResult.divSegundo || 'ESPERANDO'}, 3°=${raceResult.divTercero || 'ESPERANDO'}`);
      console.log(`   Estado Teletrak: complete=${race.complete}`);
      if (activeEvents.length > 0) {
        console.log(`   📁 También guardado en ${activeEvents.length} campaña(s) activa(s)`);
      }
      
      // Actualizar estado de importación
      if (!importStatus) {
        importedRaces.set(raceKey, {
          hasResults: true,
          hasDividends: !!hasDividends,
          dividendRetries: 0,
          lastFavorite: raceResult.favorito,
          isComplete: race.complete,
          sequenceReleased: false,
        });
      } else {
        importStatus.hasResults = true;
        importStatus.hasDividends = !!hasDividends;
        importStatus.dividendRetries = (importStatus.dividendRetries || 0) + 1;
        importStatus.lastFavorite = raceResult.favorito;
        importStatus.isComplete = race.complete;
      }

      releaseRaceSequenceIfNeeded(sequenceKey, raceKey, raceNumber);
      
      // Lógica de reintentos:
      // - Dividendos: solo reintentar mientras race.complete === false
      // - Favorito: SIEMPRE reintentar (viene de WebSocket en vivo, puede cambiar incluso después de race.complete)
      // - IMPORTANTE: Los resultados YA se guardaron arriba, incluso sin dividendos

      const retryCount = importedRaces.get(raceKey).dividendRetries;
      const favoriteChanged = importStatus?.lastFavorite !== raceResult.favorito;
      const dividendsStillMissing = !hasDividends && !race.complete;
      const shouldRetryForFavorite = retryCount < DIVIDEND_CHECK_RETRIES;

      let scheduledRetry = false;

      if (dividendsStillMissing && shouldRetryForFavorite) {
        // Carrera sin dividendos pero YA guardada, seguir reintentando para actualizar
        console.log(`🔄 [RACE-CHECK] Carrera ${raceNumber}: sin dividendos aún (intento ${retryCount}/${DIVIDEND_CHECK_RETRIES}), re-verificando en 1 min...`);
        scheduledRetry = true;
        setTimeout(() => checkRaceStatus(teletrakTrackId, localTrackId, trackName, raceNumber, raceId, postTime, date, null), RECHECK_INTERVAL_MS);
      } else if (!race.complete && shouldRetryForFavorite) {
        // Carrera no completa, seguir reintentando para actualizar favorito
        if (favoriteChanged) {
          console.log(`🔄 [RACE-CHECK] Carrera ${raceNumber}: favorito actualizado a ${raceResult.favorito}, re-verificando en 1 min...`);
        } else {
          console.log(`🔄 [RACE-CHECK] Carrera ${raceNumber}: verificando favorito (intento ${retryCount}/${DIVIDEND_CHECK_RETRIES}), re-verificando en 1 min...`);
        }
        scheduledRetry = true;
        setTimeout(() => checkRaceStatus(teletrakTrackId, localTrackId, trackName, raceNumber, raceId, postTime, date, null), RECHECK_INTERVAL_MS);
      } else if (race.complete && shouldRetryForFavorite) {
        // Carrera completa pero seguir actualizando favorito (viene de WebSocket en vivo)
        console.log(`   ✅ Carrera ${raceNumber} completa según Teletrak. Dividendos: Ganador=${raceResult.ganador || 'N/A'}, 2°=${raceResult.divSegundo || 'N/A'}, 3°=${raceResult.divTercero || 'N/A'}`);
        console.log(`   🎯 Favorito: ${raceResult.favorito || 'N/A'}${favoriteChanged ? ' (actualizado)' : ''}`);
        console.log(`   📋 Revisa los resultados en: Administrador > Resultados`);
        console.log(`🔄 [RACE-CHECK] Carrera ${raceNumber}: continuando verificación de favorito (${retryCount}/${DIVIDEND_CHECK_RETRIES})...`);
        scheduledRetry = true;
        setTimeout(() => checkRaceStatus(teletrakTrackId, localTrackId, trackName, raceNumber, raceId, postTime, date, null), RECHECK_INTERVAL_MS);
      } else {
        // Máximo de intentos alcanzado - resultados ya guardados
        console.log(`   ✅ Carrera ${raceNumber} completa. Dividendos finales: Ganador=${raceResult.ganador || 'N/A'}, 2°=${raceResult.divSegundo || 'N/A'}, 3°=${raceResult.divTercero || 'N/A'}`);
        console.log(`   🎯 Favorito final: ${raceResult.favorito || 'N/A'}`);
        console.log(`   📋 Revisa los resultados en: Administrador > Resultados`);
      }

      if (!scheduledRetry) {
        advanceRaceSequence(sequenceKey, raceNumber);
      }
      
    } catch (error) {
      console.error(`❌ [RACE-CHECK] Error en carrera ${raceNumber}:`, error.message);
      console.error(`   Tipo de error:`, error.constructor?.name);
      console.error(`   Stack:`, error.stack);
      console.error(`   Contexto: teletrakTrackId=${teletrakTrackId}, localTrackId=${localTrackId}, trackName=${trackName}, raceNumber=${raceNumber}, raceId=${raceId}`);
      console.error(`   Fecha: ${date}, PostTime: ${postTime}`);
      // Re-intentar en caso de error de red (máximo 5 reintentos)
      if (!error.retryCount) error.retryCount = 0;
      if (error.retryCount < 5) {
        error.retryCount++;
        console.log(`   🔄 Reintento ${error.retryCount}/5 en 1 minuto...`);
        setTimeout(() => checkRaceStatus(teletrakTrackId, localTrackId, trackName, raceNumber, raceId, postTime, date, sequenceKey), RECHECK_INTERVAL_MS);
      } else {
        console.error(`   ❌ Máximos reintentos alcanzados para carrera ${raceNumber}`);
        advanceRaceSequence(sequenceKey, raceNumber);
      }
    }
  }

  function buildRaceQueue(program) {
    const races = program.races || {};
    return Object.entries(races)
      .map(([raceKey, race]) => ({
        raceNumber: Number(race?.race || raceKey),
        raceId: race?.id,
        postTime: race?.postTime,
      }))
      .filter((race) => Number.isFinite(race.raceNumber))
      .sort((a, b) => a.raceNumber - b.raceNumber);
  }

  function scheduleRaceSequence(program, date, localTrackId, teletrakTrackId, trackName) {
    const queue = buildRaceQueue(program);
    if (!queue.length) return;

    const sequenceKey = `${date}::${localTrackId}`;
    watcherState.activeSchedules = watcherState.activeSchedules || [];
    if (!watcherState.activeSchedules.includes(sequenceKey)) {
      watcherState.activeSchedules.push(sequenceKey);
    }
    watcherState.sequenceMap = watcherState.sequenceMap || new Map();
    watcherState.sequenceMap.set(sequenceKey, {
      queue,
      index: 0,
      date,
      localTrackId,
      teletrakTrackId,
      trackName,
    });

    console.log(`\n📅 [SCHEDULE] Programando verificación secuencial de ${queue.length} carreras para ${trackName}...`);
    scheduleNextRace(sequenceKey);
  }

  function scheduleNextRace(sequenceKey) {
    if (!sequenceKey) return;
    const state = watcherState.sequenceMap?.get(sequenceKey);
    if (!state) return;

    const current = state.queue[state.index];
    if (!current) {
      console.log(`✅ [SCHEDULE] Secuencia finalizada para ${state.trackName}`);
      return;
    }

    const { raceNumber, raceId, postTime } = current;
    if (!postTime) {
      console.log(`⚠️ [SCHEDULE] Carrera ${raceNumber} sin postTime, saltando`);
      state.index += 1;
      scheduleNextRace(sequenceKey);
      return;
    }

    const [hours, minutes] = postTime.split(":").map(Number);
    const normalizedDate = normalizeDateYMD(state.date) || getChileDate();
    const baseUtcMs = zonedTimeToUtcMs(normalizedDate, hours, minutes, "America/Santiago");
    const targetUtcMs = baseUtcMs + (CHECK_AFTER_POST_TIME_MINUTES * 60 * 1000);
    const delay = targetUtcMs - Date.now();
    const actualDelay = Math.max(delay, 1000);
    const scheduledChile = new Date(targetUtcMs).toLocaleTimeString("es-CL", {
      timeZone: "America/Santiago",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    console.log(`⏰ [SCHEDULE] Carrera ${raceNumber}: programada a las ${postTime}, verificación a las ${scheduledChile}`);

    setTimeout(() => {
      checkRaceStatus(
        state.teletrakTrackId,
        state.localTrackId,
        state.trackName,
        raceNumber,
        raceId,
        postTime,
        state.date,
        sequenceKey
      );
    }, actualDelay);
  }

  function advanceRaceSequence(sequenceKey, raceNumber) {
    if (!sequenceKey) return;
    const state = watcherState.sequenceMap?.get(sequenceKey);
    if (!state) return;
    const current = state.queue[state.index];
    if (!current || Number(current.raceNumber) !== Number(raceNumber)) return;
    state.index += 1;
    scheduleNextRace(sequenceKey);
  }
  
  async function scheduleAllRacesForToday() {
    const today = getChileDate();
    
    try {
      const tracks = await fetchTeletrakTracks(today);
      
      if (!tracks.length) {
        console.log(`ℹ️ [SCHEDULE] No hay hipódromos para ${today}`);
        return;
      }
      
      console.log(`📋 [SCHEDULE] Obteniendo programas para ${today}...`);
      
      for (const track of tracks) {
        // Mapear track.id a localTrackId
        let localTrackId = null;
        const trackName = track.name.toLowerCase();
        
        if (trackName.includes('concepcion') || trackName.includes('concepción')) {
          localTrackId = 'concepcion';
        } else if (trackName.includes('valparaiso') || trackName.includes('valparaíso')) {
          localTrackId = 'valparaiso';
        } else if (trackName.includes('hipodromo chile') || trackName.includes('hipódromo chile')) {
          localTrackId = 'hipodromo-chile';
        } else if (
          trackName.includes('santiago') ||
          trackName.includes('club hípico de santiago') ||
          trackName.includes('club hipico de santiago') ||
          trackName.includes('club hípico') ||
          trackName.includes('club hipico')
        ) {
          localTrackId = 'chs';
        }
        
        if (!localTrackId) continue;
        
        try {
          // Obtener programa del día desde storage local
          const programs = loadOverrides().programs || {};
          const programKey = `${today}::${localTrackId}`;
          const program = programs[programKey];
          
          if (program && program.races) {
            scheduleRaceSequence(program, today, localTrackId, track.id, track.name);
          } else {
            console.log(`⚠️ [SCHEDULE] No hay programa guardado para ${localTrackId}`);
          }
        } catch (error) {
          console.error(`❌ [SCHEDULE] Error programando ${localTrackId}:`, error.message);
        }
      }
    } catch (error) {
      console.error(`❌ [SCHEDULE] Error general:`, error.message);
    }
  }

  const runScheduleAllRacesForToday = (() => {
    let running = false;
    return async () => {
      if (running) return;
      running = true;
      try {
        await scheduleAllRacesForToday();
      } finally {
        running = false;
      }
    };
  })();
  
  // Programar carreras para hoy al iniciar
  setTimeout(runScheduleAllRacesForToday, 2000);
  global.triggerRaceSchedulerForToday = runScheduleAllRacesForToday;
}

// Iniciar schedulers cuando se arranque el servidor
scheduleDailyProgramImport();
scheduleRaceResultImports();

app.use((req, res, next) => {
  const origin = req.headers.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Cache-Control, Pragma");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  next();
});

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function toText(value) {
  return String(value ?? "").trim();
}

function isNumericValue(value) {
  if (typeof value === "number") return Number.isFinite(value);
  const text = toText(value);
  if (!text) return false;
  const normalized = text.includes(",")
    ? text.replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "")
    : text.replace(/[^\d.-]/g, "");
  return normalized !== "" && Number.isFinite(Number(normalized));
}

function buildPasswordHash(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(String(password || ""), salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, passwordHash) {
  const text = String(password || "");
  if (!passwordHash) return false;
  const [salt, storedHash] = String(passwordHash).split(":");
  if (!salt || !storedHash) return false;
  const derived = crypto.scryptSync(text, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(derived, "hex"), Buffer.from(storedHash, "hex"));
}

function toPublicAdminUser(user) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName || user.username,
    enabled: user.enabled !== false,
    role: user.role || "admin",
  };
}

function getAdminUsers(settings = loadOverrides().settings || {}) {
  return Array.isArray(settings.adminUsers) ? settings.adminUsers : [];
}

function isValidAdminLogin(settings, username, password) {
  const users = getAdminUsers(settings);
  const normalizedUsername = toText(username).toLowerCase();
  const user = users.find((item) => toText(item.username).toLowerCase() === normalizedUsername && item.enabled !== false);
  if (!user) return null;
  const fallbackPassword = String(settings.adminPin || "");
  const valid = user.passwordHash
    ? verifyPassword(password, user.passwordHash)
    : String(password || "") === fallbackPassword;
  return valid ? user : null;
}

function validateParticipantPayload(participant) {
  const index = Number(participant?.index);
  const name = toText(participant?.name);
  const picks = Array.isArray(participant?.picks) ? participant.picks.map((value) => toText(value)) : [];
  if (!Number.isInteger(index) || index < 1) return "El numero del participante debe ser un entero mayor o igual a 1.";
  if (!name) return "El participante debe tener nombre.";
  if (!picks.length) return "El pronostico debe incluir carreras.";
  return "";
}

function validateResultPayload(result) {
  const race = Number(result?.race);
  if (!Number.isInteger(race) || race < 1) return "La carrera debe ser un entero mayor o igual a 1.";
  const primero = toText(result?.primero);
  const segundo = toText(result?.segundo);
  const tercero = toText(result?.tercero);
  const empateSegundo = toText(result?.empateSegundo);
  const empateTercero = toText(result?.empateTercero);

  if (!primero || !segundo) return "El resultado debe incluir primero y segundo.";

  const requiereTercero = !empateSegundo;
  if (requiereTercero && !tercero) {
    return "El resultado debe incluir tercero (o empate en segundo sin tercer lugar).";
  }

  const podium = [primero, segundo, tercero].filter(Boolean);
  if (new Set(podium).size < podium.length) return "Primero, segundo y tercero deben ser distintos.";

  const numericFields = [
    ["ganador", "Dividendo de ganador"],
    ["divSegundoPrimero", "Dividendo de segundo del primero"],
    ["divTerceroPrimero", "Dividendo de tercero del primero"],
    ["divSegundo", "Dividendo de segundo"],
    ["divTerceroSegundo", "Dividendo de tercero del segundo"],
  ];
  if (tercero || empateTercero) {
    numericFields.push(["divTercero", "Dividendo de tercero"]);
  }
  for (const [key, label] of numericFields) {
    if (!isNumericValue(result?.[key])) return `${label} invalido o vacio.`;
  }

  const tieGroups = [
    ["empatePrimero", ["empatePrimeroGanador", "empatePrimeroDivSegundo", "empatePrimeroDivTercero"], "empate del primero"],
    ["empateSegundo", ["empateSegundoDivSegundo", "empateSegundoDivTercero"], "empate del segundo"],
    ["empateTercero", ["empateTerceroDivTercero"], "empate del tercero"],
  ];
  for (const [tieKey, tieNumericKeys, label] of tieGroups) {
    const tieHorse = toText(result?.[tieKey]);
    if (!tieHorse) continue;
    if ([primero, segundo, tercero].filter(Boolean).includes(tieHorse)) {
      return `El ${label} debe ser un ejemplar distinto de primero, segundo y tercero.`;
    }
    for (const numericKey of tieNumericKeys) {
      if (!isNumericValue(result?.[numericKey])) return `Faltan dividendos validos para el ${label}.`;
    }
  }

  // Consistencia mínima para empates en segundo:
  // si hay empate de segundo, no puede repetirse con tercero.
  if (empateSegundo && tercero && empateSegundo === tercero) {
    return "El empate del segundo no puede ser igual al tercero.";
  }

  return "";
}

function normalizeProgramEntries(entries) {
  return (Array.isArray(entries) ? entries : [])
    .map((entry) => ({
      number: toText(entry?.number || entry?.numero),
      name: toText(entry?.name || entry?.ejemplar),
      jockey: toText(entry?.jockey || entry?.jinete),
    }))
    .filter((entry) => entry.number || entry.name);
}

function validateProgramPayload(payload) {
  const date = toText(payload?.date);
  const trackId = toText(payload?.trackId);
  const trackName = toText(payload?.trackName);
  if (!date) return "Falta la fecha del programa.";
  if (!trackId) return "Falta el hipodromo del programa.";
  if (!trackName) return "Falta el nombre visible del hipodromo.";
  const races = payload?.races || {};
  if (!Object.keys(races).length) return "Debes cargar al menos una carrera en el programa.";
  for (const [raceKey, raceData] of Object.entries(races)) {
    const race = Number(raceData?.race || raceKey);
    if (!Number.isInteger(race) || race < 1) return "Cada carrera del programa debe tener un numero valido.";
    const entries = normalizeProgramEntries(raceData?.entries);
    if (!entries.length) return `La carrera ${race} debe tener al menos un ejemplar.`;
  }
  return "";
}

// Helper para obtener la fecha actual en Chile (UTC-4)
// Esto evita que el servidor use UTC y se "pase" al día siguiente antes de medianoche chilena
function getChileDate() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santiago' });
}

function normalizeDateYMD(dateStr) {
  const raw = String(dateStr ?? "").trim();
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const match = raw.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  return raw;
}

function mapTeletrakTrackNameToLocalTrackId(trackName) {
  const normalizedName = String(trackName || "").toLowerCase();
  if (normalizedName.includes("concepcion") || normalizedName.includes("concepción")) {
    return "concepcion";
  }
  if (normalizedName.includes("valparaiso") || normalizedName.includes("valparaíso")) {
    return "valparaiso";
  }
  if (normalizedName.includes("hipodromo chile") || normalizedName.includes("hipódromo chile")) {
    return "hipodromo-chile";
  }
  if (
    normalizedName.includes("santiago") ||
    normalizedName.includes("club hípico de santiago") ||
    normalizedName.includes("club hipico de santiago") ||
    normalizedName.includes("club hípico") ||
    normalizedName.includes("club hipico")
  ) {
    return "chs";
  }
  return "";
}

async function resolveProgramForTeletrakTrack(date, teletrakTrackId) {
  const safeDate = normalizeDateYMD(date);
  const numericTrackId = Number(teletrakTrackId);
  if (!safeDate || !Number.isFinite(numericTrackId)) {
    return null;
  }

  let localTrackId = "";
  let remoteTrack = null;
  try {
    const tracks = await fetchTeletrakTracks(safeDate);
    remoteTrack = tracks.find((track) => Number(track?.id) === numericTrackId) || null;
    localTrackId = mapTeletrakTrackNameToLocalTrackId(remoteTrack?.name || "");
  } catch (_) {
    localTrackId = "";
  }

  if (!localTrackId) {
    return null;
  }

  try {
    return await fetchTeletrakProgram(safeDate, localTrackId);
  } catch (error) {
    if (!String(error?.message || "").includes("programa vivo")) {
      throw error;
    }
  }

  const storedProgram = loadOverrides().programs?.[`${safeDate}::${localTrackId}`] || null;
  if (!storedProgram) {
    return null;
  }

  return {
    ...storedProgram,
    date: safeDate,
    trackId: localTrackId,
    trackName: storedProgram.trackName || remoteTrack?.name || localTrackId,
    status: storedProgram.status || "imported",
    source: storedProgram.source || "storage",
  };
}

function getTimeZoneOffsetMinutes(date, timeZone) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(date).reduce((acc, part) => {
    if (part.type !== "literal") acc[part.type] = part.value;
    return acc;
  }, {});
  const asUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return (asUTC - date.getTime()) / 60000;
}

function zonedTimeToUtcMs(dateStr, hours, minutes, timeZone) {
  const [year, month, day] = String(dateStr).split("-").map(Number);
  const utcGuess = Date.UTC(year, month - 1, day, hours, minutes, 0);
  const offsetMinutes = getTimeZoneOffsetMinutes(new Date(utcGuess), timeZone);
  return utcGuess - offsetMinutes * 60000;
}

const testRaceEndpoints = require('./testRaceEndpoints');

// Registrar endpoints de test
app.use('/api/test', testRaceEndpoints);

app.get("/api/data", (_req, res) => {
  try {
    const payload = loadData();
    const jornadaDates = listJornadaDates();
    const jornadas = jornadaDates.reduce((acc, date) => {
      const jornada = loadJornada(date);
      if (jornada) acc[date] = jornada;
      return acc;
    }, {});

    res.json({
      ...payload,
      jornadas,
    });
  } catch (error) {
    res.status(500).json({
      error: "No se pudieron leer las planillas.",
      detail: error.message,
    });
  }
});

// ===== JORNADAS (server-side storage for race results) =====

app.get("/api/jornadas", (_req, res) => {
  try {
    res.json({ dates: listJornadaDates() })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get("/api/jornadas/:fecha", (req, res) => {
  try {
    const jornada = loadJornada(req.params.fecha)
    res.json(jornada || null)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post("/api/jornadas/:fecha", (req, res) => {
  try {
    const { fecha } = req.params
    const jornada = req.body
    if (!jornada || typeof jornada !== 'object') {
      return res.status(400).json({ error: 'Datos de jornada inválidos' })
    }
    const saved = saveJornadaServer(fecha, jornada)
    res.json({ ok: true, jornada: saved })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post("/api/events/:eventId/participants", (req, res) => {
  try {
    const { eventId } = req.params;
    const { index, name, picks } = req.body || {};
    if (!eventId || !index || !name || !Array.isArray(picks)) {
      return res.status(400).json({ error: "Datos incompletos para guardar el pronostico." });
    }
    const validationError = validateParticipantPayload({ index, name, picks });
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    // VALIDACIÓN: Verificar que el participante no exista ya en este evento
    const data = loadOverrides();
    const existingEvent = data.events[eventId];
    if (existingEvent && Array.isArray(existingEvent.participants)) {
      const trimmedName = String(name).trim().toLowerCase();
      const duplicate = existingEvent.participants.find(
        p => p.name.toLowerCase().trim() === trimmedName || p.index === Number(index)
      );
      if (duplicate) {
        console.log(`⚠️ [PARTICIPANT] Duplicado detectado: "${name}" (index ${index}) en evento ${eventId}`);
        return res.status(409).json({
          error: `El stud "${name}" ya está registrado en esta campaña`,
          detail: `Existe un participante con el mismo nombre o índice (${index})`,
          existingParticipant: {
            name: duplicate.name,
            index: duplicate.index
          }
        });
      }
    }

    console.log(`✅ [PARTICIPANT] Guardando: "${name}" (index ${index}) en evento ${eventId}`);
    upsertParticipant(eventId, {
      index: Number(index),
      name: String(name).trim(),
      picks: picks.map((value) => String(value ?? "").trim()),
    });
    return res.json(loadData());
  } catch (error) {
    return res.status(500).json({
      error: "No se pudo guardar el pronostico.",
      detail: error.message,
    });
  }
});

app.post("/api/events/:eventId/results/:race", (req, res) => {
  try {
    const { eventId, race } = req.params;
    const data = loadOverrides();
    const existingResult = data.events[eventId]?.results?.[race] || {};
    
    // If the podium changes, stale positional dividends must be cleared unless
    // the corrected values are explicitly sent again with the new official order.
    const mergedPayload = prepareManualResultPayload(existingResult, req.body || {}, race);
    
    const validationError = validateResultPayload(mergedPayload);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }
    upsertResult(eventId, race, mergedPayload);
    return res.json(loadData());
  } catch (error) {
    return res.status(500).json({
      error: "No se pudo guardar el resultado.",
      detail: error.message,
    });
  }
});

app.post("/api/events/:eventId/meta", (req, res) => {
  try {
    const { eventId } = req.params;
    if (!eventId) {
      return res.status(400).json({ error: "Falta el ID del evento." });
    }
    const body = req.body || {};
    const raceCount = body.raceCount !== undefined ? Number(body.raceCount) : undefined;
    const metaToSave = {}
    if (raceCount !== undefined && Number.isFinite(raceCount) && raceCount >= 1) {
      metaToSave.raceCount = raceCount
    }
    const allowedFields = ['date', 'trackName', 'trackId', 'campaignId', 'campaignType', 'title', 'source', 'lastUpdated']
    allowedFields.forEach(field => {
      if (body[field] !== undefined) metaToSave[field] = body[field]
    })
    if (Object.keys(metaToSave).length === 0) {
      return res.status(400).json({ error: "No se enviaron datos para guardar." });
    }
    upsertEventMeta(eventId, metaToSave);
    return res.json(loadData());
  } catch (error) {
    return res.status(500).json({
      error: "No se pudo guardar el meta del evento.",
      detail: error.message,
    });
  }
});

app.delete("/api/events/:eventId/participants/:index", (req, res) => {
  try {
    const { eventId, index } = req.params;
    if (!eventId || !index) {
      return res.status(400).json({ error: "Faltan datos para eliminar el pronostico." });
    }
    deleteParticipant(eventId, Number(index));
    return res.json(loadData());
  } catch (error) {
    return res.status(500).json({
      error: "No se pudo eliminar el pronostico.",
      detail: error.message,
    });
  }
});

app.get("/api/import/teletrak/tracks", async (req, res) => {
  try {
    const date = String(req.query.date || "").trim();
    if (!date) {
      return res.status(400).json({ error: "Falta la fecha para consultar hipodromos." });
    }
    const tracks = await fetchTeletrakTracks(date);
    return res.json({ date, tracks });
  } catch (error) {
    return res.status(500).json({
      error: "No se pudieron leer los hipodromos de Teletrak.",
      detail: error.message,
    });
  }
});

app.post("/api/import/teletrak/results", async (req, res) => {
  try {
    const date = String(req.body?.date || "").trim();
    const trackId = Number(req.body?.trackId);
    const targetEventIds = Array.from(new Set((Array.isArray(req.body?.targetEventIds) ? req.body.targetEventIds : []).filter(Boolean)));
    if (!date || !Number.isFinite(trackId)) {
      return res.status(400).json({ error: "Faltan fecha o hipodromo para importar." });
    }
    if (!targetEventIds.length) {
      return res.status(400).json({ error: "No hay jornadas destino para importar." });
    }

    const imported = await fetchTeletrakRaceResults(trackId, date);
    targetEventIds.forEach((eventId) => {
      upsertEventMeta(eventId, {
        raceCount: Number(imported.raceCount) || 0,
        importedFrom: "teletrak",
        importedAt: new Date().toISOString(),
        importedTrackId: trackId,
        importedDate: date,
      });
      imported.results.forEach((result) => {
        upsertResult(eventId, result.race, result);
      });
    });

    return res.json({
      ...loadData(),
      importSummary: {
        source: "teletrak",
        date,
        trackId,
        targetEventIds,
        raceCount: imported.raceCount,
        importedRaces: imported.results.length,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: "No se pudieron importar los resultados desde Teletrak.",
      detail: error.message,
    });
  }
});

app.post("/api/import/teletrak/program", async (req, res) => {
  try {
    const date = toText(req.body?.date);
    const trackId = toText(req.body?.trackId);
    if (!date || !trackId) {
      return res.status(400).json({ error: "Faltan fecha o hipodromo para importar el programa." });
    }

    const imported = await fetchTeletrakProgram(date, trackId);
    upsertProgram({
      date: imported.date,
      trackId: imported.trackId,
      trackName: imported.trackName,
      source: imported.source,
      sourceUrl: imported.sourceUrl,
      status: imported.status,
      races: imported.races,
    });

    return res.json({
      ...loadData(),
      importSummary: {
        source: "teletrak",
        date: imported.date,
        trackId: imported.trackId,
        raceCount: imported.raceCount,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: "No se pudo importar el programa desde Teletrak.",
      detail: error.message,
    });
  }
});

// ===== NUEVOS ENDPOINTS PARA RACE WATCHER =====

app.get("/api/teletrak/race-status/:date/:raceNumber", async (req, res) => {
  try {
    const { date, raceNumber } = req.params;
    const trackId = Number(req.query.trackId);

    if (!date || !raceNumber || !Number.isFinite(trackId)) {
      return res.status(400).json({ error: "Faltan fecha, carrera o trackId." });
    }

    const program = await resolveProgramForTeletrakTrack(date, trackId);
    const races = Object.values(program?.races || {});
    const race = races.find((item) => String(item.raceNumber || item.race) === String(raceNumber)) || null;

    let results = null;
    let isClosed = false;
    let rawResult = null;

    try {
      const resultsPayload = await fetchJson(`${TELETRAK_API_BASE}/races/${trackId}/${date}`);
      const racesFromResults = Array.isArray(resultsPayload?.results) ? resultsPayload.results : [];
      rawResult = racesFromResults.find((item) => String(item.raceNumber || item.race) === String(raceNumber)) || null;
      if (rawResult) {
        results = mapRaceResult(rawResult);
        isClosed = rawResult.complete === true || Boolean(results.primero || results.ganador || results.divSegundo || results.divTercero);
      }
    } catch {
      // Sin resultados aun
    }

    if (!race && !rawResult) {
      return res.status(404).json({ error: `Carrera ${raceNumber} no encontrada para esa fecha e hipodromo.` });
    }

    return res.json({
      date,
      trackId,
      raceNumber,
      postTime: race?.postTime || null,
      isClosed,
      complete: rawResult?.complete === true || race?.complete || false,
      status: isClosed ? "closed" : "pending",
      results: results || null,
      raw: rawResult || race,
    });
  } catch (error) {
    return res.status(500).json({
      error: "No se pudo obtener el estado de la carrera.",
      detail: error.message,
    });
  }
});

/**
 * GET /api/teletrak/race-status/:date/:raceNumber
 * Obtiene estado y resultados de una carrera específica.
 * Query params: trackId (número de hipódromo)
 */
app.get("/api/teletrak/race-status/:date/:raceNumber", async (req, res) => {
  try {
    const { date, raceNumber } = req.params;
    const trackId = Number(req.query.trackId);
    
    if (!date || !raceNumber || !Number.isFinite(trackId)) {
      return res.status(400).json({ error: "Faltan fecha, carrera o trackId." });
    }

    // Obtener programa para ver postTime y estado
    const program = await fetchTeletrakProgram(date, trackId);
    const races = Object.values(program.races || {});
    const race = races.find(r => String(r.raceNumber || r.race) === String(raceNumber));
    
    if (!race) {
      return res.status(404).json({ error: `Carrera ${raceNumber} no encontrada en el programa.` });
    }

    // Obtener resultados si existen
    let results = null;
    let isClosed = false;
    
    try {
      const resultsPayload = await fetchJson(`${TELETRAK_API_BASE}/races/${trackId}/${date}`);
      if (Array.isArray(resultsPayload)) {
        const raceResult = resultsPayload.find(r => String(r.race) === String(raceNumber));
        if (raceResult) {
          results = mapRaceResult(raceResult);
          isClosed = raceResult.complete === true || (results.ganador && results.primero);
        }
      }
    } catch {
      // Sin resultados aún
    }

    return res.json({
      date,
      trackId,
      raceNumber,
      postTime: race.postTime,
      isClosed,
      complete: race.complete || false,
      status: isClosed ? 'closed' : 'pending',
      results: results || null,
      raw: race,
    });
  } catch (error) {
    return res.status(500).json({
      error: "No se pudo obtener el estado de la carrera.",
      detail: error.message,
    });
  }
});

/**
 * GET /api/teletrak/favorites/:date
 * Obtiene favoritos para todas las carreras de una fecha.
 * Query params: trackId
 */
app.get("/api/teletrak/favorites/:date", async (req, res) => {
  try {
    const { date } = req.params;
    const trackId = Number(req.query.trackId);
    
    if (!date || !Number.isFinite(trackId)) {
      return res.status(400).json({ error: "Faltan fecha o trackId." });
    }

    // Obtener programa para tener raceIds
    const program = await fetchTeletrakProgram(date, trackId);
    const races = Object.values(program.races || {});
    
    // Obtener favoritos
    const raceIds = races.map(r => r.raceId || r.id).filter(Boolean);
    const favorites = {};
    
    if (raceIds.length > 0) {
      try {
        const favoriteMap = await fetchTeletrakFavoritesForRaces(
          TELETRAK_STOMP_URL,
          trackId,
          date,
          raceIds.slice(0, 4) // Limitar a primeras 4 carreras para eficiencia
        );
        
        Object.entries(favoriteMap).forEach(([raceId, fav]) => {
          const race = races.find(r => String(r.raceId || r.id) === String(raceId));
          if (race && fav) {
            favorites[race.raceNumber || race.race] = {
              number: fav.number || fav.runner?.number,
              name: fav.name || fav.runner?.name,
            };
          }
        });
      } catch (favError) {
        console.log(`[Teletrak] No se pudieron obtener favoritos: ${favError.message}`);
      }
    }

    return res.json({ date, trackId, favorites });
  } catch (error) {
    return res.status(500).json({
      error: "No se pudieron obtener los favoritos.",
      detail: error.message,
    });
  }
});

/**
 * GET /api/teletrak/program/:date/:trackId
 * Obtiene programa completo (carreras, postTimes, estado).
 */
app.get("/api/teletrak/program/:date/:trackId", async (req, res) => {
  try {
    const { date, trackId } = req.params;
    const program = await fetchTeletrakProgram(date, Number(trackId));
    return res.json(program);
  } catch (error) {
    return res.status(500).json({
      error: "No se pudo obtener el programa.",
      detail: error.message,
    });
  }
});

/**
 * GET /api/teletrak/odds/:date/:raceNumber
 * Obtiene tabla de dividendos (odds board) para una carrera.
 * Esto es más preciso que los resultados para obtener el favorito real.
 * Query params: trackId
 */
app.get("/api/teletrak/odds/:date/:raceNumber", async (req, res) => {
  try {
    const { date, raceNumber } = req.params;
    const trackId = Number(req.query.trackId);
    
    if (!date || !raceNumber || !Number.isFinite(trackId)) {
      return res.status(400).json({ error: "Faltan fecha, carrera o trackId." });
    }

    // Obtener odds desde el endpoint de resultados que incluye dividendos
    const resultsPayload = await fetchJson(`${TELETRAK_API_BASE}/races/${trackId}/${date}`);
    
    if (!Array.isArray(resultsPayload)) {
      return res.json({ date, trackId, raceNumber, odds: null });
    }

    const raceResult = resultsPayload.find(r => String(r.race) === String(raceNumber));
    if (!raceResult) {
      return res.json({ date, trackId, raceNumber, odds: null });
    }

    return res.json({
      date,
      trackId,
      raceNumber,
      odds: mapRaceResult(raceResult),
      isClosed: raceResult.complete === true,
    });
  } catch (error) {
    return res.status(500).json({
      error: "No se pudieron obtener los dividendos.",
      detail: error.message,
    });
  }
});

app.post("/api/events/copy-results", (req, res) => {
  try {
    const sourceEventId = String(req.body?.sourceEventId || "").trim();
    const targetEventIds = Array.from(new Set((Array.isArray(req.body?.targetEventIds) ? req.body.targetEventIds : []).filter(Boolean)));
    if (!sourceEventId) {
      return res.status(400).json({ error: "Falta la jornada origen para copiar resultados." });
    }
    if (!targetEventIds.length) {
      return res.status(400).json({ error: "No hay jornadas destino para copiar resultados." });
    }
    copyEventResults(sourceEventId, targetEventIds, { replace: true });
    return res.json(loadData());
  } catch (error) {
    return res.status(500).json({
      error: "No se pudieron copiar los resultados.",
      detail: error.message,
    });
  }
});

app.get("/api/watcher/status", (req, res) => {
  const status = global.raceWatcherStatus || { active: false };
  return res.json({
    active: status.active,
    state: status.state || null,
    importedRaces: status.importedRaces ? status.importedRaces() : {},
    importedCount: status.importedCount ? status.importedCount() : 0,
  });
});

/**
 * POST /api/import/missing-races
 * Re-importa carreras faltantes desde Teletrak para una fecha específica.
 * Body: { date, trackId }
 */
app.post("/api/import/missing-races", async (req, res) => {
  try {
    const { date, trackId, raceNumbers } = req.body || {};
    if (!date || !trackId) {
      return res.status(400).json({ error: "Faltan fecha o trackId." });
    }

    // Obtener resultados actuales de Teletrak
    const payload = await fetchJson(`${TELETRAK_API_BASE}/races/${Number(trackId)}/${date}`);
    if (!payload || !Array.isArray(payload.results)) {
      return res.status(500).json({ error: "No se pudieron obtener resultados de Teletrak." });
    }

    const genericEventId = `imported-${date}`;
    const overrides = loadOverrides();
    const existingResults = overrides.events?.[genericEventId]?.results || {};
    let importedCount = 0;
    const importedRaces = [];
    const failedRaces = [];

    // Si se especificaron números de carrera, solo importar esas
    const targetRaces = raceNumbers
      ? payload.results.filter(r => raceNumbers.includes(Number(r.raceNumber)))
      : payload.results;

    console.log(`[Re-import] Total carreras de Teletrak: ${payload.results.length}`);
    console.log(`[Re-import] Target races: ${targetRaces.length}`);
    if (payload.results.length > 0) {
      const lastRace = payload.results[payload.results.length - 1];
      console.log(`[Re-import] Última carrera en Teletrak: C${lastRace.raceNumber} (results=${lastRace.runnersResults?.length || 0})`);
    }

    for (const race of targetRaces) {
      const raceNum = String(race.raceNumber);
      // Saltar si ya existe y tiene resultados completos
      const existing = existingResults[raceNum];
      if (existing && existing.ganador && existing.segundo && existing.tercero) continue;

      if (!race.runnersResults || race.runnersResults.length === 0) continue;

      try {
        // Obtener favorito si está disponible
        let favorite = '';
        if (race.raceId) {
          try {
            const favMap = await fetchTeletrakFavoritesForRaces(
              [{ raceId: race.raceId, raceNumber: race.raceNumber }],
              { timeoutMs: 5000 }
            );
            favorite = favMap.get(String(raceNum)) || '';
          } catch (e) { /* sin favorito */ }
        }

        // Mapear resultado
        const raceResult = mapRaceResult(race, favorite);
        // ✅ INCREMENTAL: NO sobrescribir si ya tiene dividendos
        const importResult = upsertResultIncremental(genericEventId, raceNum, raceResult, {
          skipIfComplete: true,
          preferExisting: true
        });
        
        if (!importResult.skipped) {
          importedCount++;
          importedRaces.push(raceNum);
        }
      } catch (err) {
        failedRaces.push({ race: raceNum, error: err.message });
      }
    }

    return res.json({
      success: true,
      importedCount,
      importedRaces,
      failedRaces,
      totalResults: payload.results.length,
    });
  } catch (error) {
    return res.status(500).json({
      error: "No se pudieron importar las carreras faltantes.",
      detail: error.message,
    });
  }
});

app.get("/api/programs", (req, res) => {
  try {
    const date = toText(req.query.date);
    const trackId = toText(req.query.trackId);
    const programs = loadOverrides().programs || {};
    if (date && trackId) {
      return res.json({ program: programs[`${date}::${trackId}`] || null });
    }
    return res.json({ programs });
  } catch (error) {
    return res.status(500).json({
      error: "No se pudieron leer los programas de carreras.",
      detail: error.message,
    });
  }
});

app.post("/api/programs", (req, res) => {
  try {
    const payload = req.body || {};
    const validationError = validateProgramPayload(payload);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }
    const races = Object.fromEntries(
      Object.entries(payload.races || {}).map(([raceKey, raceData]) => [String(raceKey), {
        race: Number(raceData?.race || raceKey),
        label: toText(raceData?.label) || `Carrera ${Number(raceData?.race || raceKey) || raceKey}`,
        postTime: toText(raceData?.postTime),
        distance: toText(raceData?.distance),
        surface: toText(raceData?.surface),
        entries: normalizeProgramEntries(raceData?.entries),
      }]),
    );
    upsertProgram({
      date: toText(payload.date),
      trackId: toText(payload.trackId),
      trackName: toText(payload.trackName),
      source: toText(payload.source) || "manual",
      sourceUrl: toText(payload.sourceUrl),
      status: toText(payload.status) || "manual",
      races,
    });
    return res.json(loadData());
  } catch (error) {
    return res.status(500).json({
      error: "No se pudo guardar el programa de carreras.",
      detail: error.message,
    });
  }
});

app.delete("/api/programs/:date/:trackId", (req, res) => {
  try {
    const date = toText(req.params.date);
    const trackId = toText(req.params.trackId);
    if (!date || !trackId) {
      return res.status(400).json({ error: "Faltan fecha o hipodromo para eliminar el programa." });
    }
    deleteProgram(date, trackId);
    return res.json(loadData());
  } catch (error) {
    return res.status(500).json({
      error: "No se pudo eliminar el programa de carreras.",
      detail: error.message,
    });
  }
});

app.post("/api/operations/batch", (req, res) => {
  try {
    const { targetEventIds, participant, result } = req.body || {};
    const eventIds = Array.from(new Set(Array.isArray(targetEventIds) ? targetEventIds.filter(Boolean) : []));
    if (!eventIds.length) {
      return res.status(400).json({ error: "No se indicaron jornadas destino." });
    }
    if (!participant && !result) {
      return res.status(400).json({ error: "No hay datos para guardar." });
    }

    eventIds.forEach((eventId) => {
      if (participant) {
        const validationError = validateParticipantPayload(participant);
        if (validationError) throw new Error(validationError);
        upsertParticipant(eventId, {
          index: Number(participant.index),
          name: String(participant.name).trim(),
          picks: (participant.picks || []).map((value) => String(value ?? "").trim()),
        });
      }
      if (result) {
        const validationError = validateResultPayload(result);
        if (validationError) throw new Error(validationError);
        upsertResult(eventId, result.race, {
          primero: result.primero,
          empatePrimero: result.empatePrimero,
          ganador: result.ganador,
          divSegundoPrimero: result.divSegundoPrimero,
          divTerceroPrimero: result.divTerceroPrimero,
          empatePrimeroGanador: result.empatePrimeroGanador,
          empatePrimeroDivSegundo: result.empatePrimeroDivSegundo,
          empatePrimeroDivTercero: result.empatePrimeroDivTercero,
          segundo: result.segundo,
          empateSegundo: result.empateSegundo,
          divSegundo: result.divSegundo,
          divTerceroSegundo: result.divTerceroSegundo,
          empateSegundoDivSegundo: result.empateSegundoDivSegundo,
          empateSegundoDivTercero: result.empateSegundoDivTercero,
          tercero: result.tercero,
          empateTercero: result.empateTercero,
          divTercero: result.divTercero,
          empateTerceroDivTercero: result.empateTerceroDivTercero,
          favorito: result.favorito || "",
          retiros: Array.isArray(result.retiros) ? result.retiros : [],
          retiro1: result.retiro1 || "",
          retiro2: result.retiro2 || "",
          manualOverride: true,
          source: "manual",
        });
      }
    });

    return res.json(loadData());
  } catch (error) {
    const status = String(error?.message || "").includes("inval") || String(error?.message || "").includes("debe") || String(error?.message || "").includes("Faltan")
      ? 400
      : 500;
    return res.status(status).json({
      error: "No se pudo guardar la operacion masiva.",
      detail: error.message,
    });
  }
});

app.post("/api/admin/registry", (req, res) => {
  try {
    console.log('[API-Registry] Incoming body:', JSON.stringify(req.body));
    
    const { name, originalName, diaria, semanal, mensual, promo, group, promoPartners } = req.body || {};
    if (!name) {
      return res.status(400).json({ error: "Falta el nombre del participante." });
    }

    const data = loadData();
    const existingParticipant = data.registry?.find(r => r.name === name || r.name === originalName);
    
    upsertRegistryParticipant({
      name,
      originalName,
      diaria: diaria ?? existingParticipant?.diaria,
      semanal: semanal ?? existingParticipant?.semanal,
      mensual: mensual ?? existingParticipant?.mensual,
      promo: promo ?? existingParticipant?.promo,
      group: group ?? existingParticipant?.group,
      promoPartners: promoPartners ?? existingParticipant?.promoPartners,
    });
    
    const updatedData = loadData();
    const savedParticipant = updatedData.registry?.find(r => r.name === name);
    console.log('[API-Registry] Data returned to frontend:', JSON.stringify(savedParticipant));
    
    return res.json(updatedData);
  } catch (error) {
    return res.status(500).json({
      error: "No se pudo guardar el participante.",
      detail: error.message,
    });
  }
});

app.delete("/api/admin/registry/:name", (req, res) => {
  try {
    const name = toText(req.params.name);
    if (!name) {
      return res.status(400).json({ error: "Falta el participante a eliminar." });
    }
    deleteRegistryParticipant(decodeURIComponent(name));
    return res.json(loadData());
  } catch (error) {
    return res.status(500).json({
      error: "No se pudo eliminar el participante.",
      detail: error.message,
    });
  }
});

app.post("/api/admin/registry/bulk-delete", (req, res) => {
  try {
    const names = Array.isArray(req.body?.names) ? req.body.names.map((item) => toText(item)).filter(Boolean) : [];
    if (!names.length) {
      return res.status(400).json({ error: "No hay participantes para eliminar." });
    }
    names.forEach((name) => {
      deleteRegistryParticipant(name);
    });
    return res.json(loadData());
  } catch (error) {
    return res.status(500).json({
      error: "No se pudo completar la eliminacion masiva.",
      detail: error.message,
    });
  }
});

app.post("/api/admin/registry-groups", (req, res) => {
  try {
    const { id, originalId, name, description, enabled } = req.body || {};
    if (!toText(name)) {
      return res.status(400).json({ error: "Falta el nombre del grupo." });
    }
    upsertRegistryGroup({ id, originalId, name, description, enabled });
    return res.json(loadData());
  } catch (error) {
    return res.status(500).json({
      error: "No se pudo guardar el grupo.",
      detail: error.message,
    });
  }
});

app.delete("/api/admin/registry-groups/:id", (req, res) => {
  try {
    const id = toText(req.params.id);
    if (!id) {
      return res.status(400).json({ error: "Falta el grupo a eliminar." });
    }
    deleteRegistryGroup(decodeURIComponent(id));
    return res.json(loadData());
  } catch (error) {
    return res.status(500).json({
      error: "No se pudo eliminar el grupo.",
      detail: error.message,
    });
  }
});

app.post("/api/admin/unlock", (req, res) => {
  try {
    console.log('[LOGIN] Solicitud de login recibida:', req.body ? 'con body' : 'sin body');
    const { pin, username, password } = req.body || {};
    const settings = loadOverrides().settings || {};
    const user = username ? isValidAdminLogin(settings, username, password) : null;
    const validByPin = !username && String(pin || "") === String(settings.adminPin || "");
    const authenticatedUser = user
      ? toPublicAdminUser(user)
      : (validByPin
          ? {
              id: "pin-admin",
              username: "admin-pin",
              displayName: "Administrador",
              enabled: true,
              role: "admin",
            }
          : null);
    console.log('[LOGIN] Resultado:', { user: !!user, validByPin });
    return res.json({
      ok: Boolean(authenticatedUser),
      user: authenticatedUser,
    });
  } catch (error) {
    console.error('[LOGIN] Error:', error.message);
    return res.status(500).json({
      error: "No se pudo validar el acceso.",
      detail: error.message,
    });
  }
});

app.get("/api/admin/users", (req, res) => {
  try {
    const users = getAdminUsers(loadOverrides().settings).map((user) => toPublicAdminUser(user));
    const settings = loadOverrides().settings || {};
    return res.json({ users, authManagedByEnv: Boolean(settings.authManagedByEnv) });
  } catch (error) {
    return res.status(500).json({
      error: "No se pudo cargar la lista de usuarios.",
      detail: error.message,
    });
  }
});

app.post("/api/admin/users", (req, res) => {
  try {
    const settings = loadOverrides().settings || {};
    if (settings.authManagedByEnv) {
      return res.status(409).json({ error: "Los usuarios admin estan gestionados por variables de entorno." });
    }
    const users = getAdminUsers(settings);
    const id = toText(req.body?.id);
    const username = toText(req.body?.username);
    const displayName = toText(req.body?.displayName) || username;
    const password = String(req.body?.password || "");
    const enabled = req.body?.enabled !== false;
    const role = toText(req.body?.role) || "admin";
    if (!username) {
      return res.status(400).json({ error: "Falta el nombre de usuario." });
    }
    const existing = users.find((user) => user.id === id) || null;
    const duplicate = users.find((user) => user.id !== id && toText(user.username).toLowerCase() === username.toLowerCase());
    if (duplicate) {
      return res.status(400).json({ error: "Ese nombre de usuario ya existe." });
    }
    if (!existing && !password) {
      return res.status(400).json({ error: "Debes definir una clave para el usuario nuevo." });
    }
    const nextUser = {
      id: id || username.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
      username,
      displayName,
      enabled,
      role,
      passwordHash: password ? buildPasswordHash(password) : String(existing?.passwordHash || ""),
    };
    const nextUsers = existing
      ? users.map((user) => (user.id === existing.id ? nextUser : user))
      : [...users, nextUser];
    updateSettings({ adminUsers: nextUsers });
    return res.json({ users: nextUsers.map((user) => toPublicAdminUser(user)) });
  } catch (error) {
    return res.status(500).json({
      error: "No se pudo guardar el usuario.",
      detail: error.message,
    });
  }
});

app.delete("/api/admin/users/:id", (req, res) => {
  try {
    const settings = loadOverrides().settings || {};
    if (settings.authManagedByEnv) {
      return res.status(409).json({ error: "Los usuarios admin estan gestionados por variables de entorno." });
    }
    const id = toText(req.params.id);
    const users = getAdminUsers(settings);
    const nextUsers = users.filter((user) => user.id !== id);
    const enabledAdmins = nextUsers.filter((user) => user.enabled !== false && (user.role || "admin") === "admin");
    if (!enabledAdmins.length) {
      return res.status(400).json({ error: "Debe quedar al menos un administrador activo." });
    }
    updateSettings({ adminUsers: nextUsers });
    return res.json({ users: nextUsers.map((user) => toPublicAdminUser(user)) });
  } catch (error) {
    return res.status(500).json({
      error: "No se pudo eliminar el usuario.",
      detail: error.message,
    });
  }
});

// =====================================================
// POST /api/admin/campaigns - Crear nueva campaña
// =====================================================
app.post("/api/admin/campaigns", (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n📝 [CAMPAIGN-CREATE] Solicitud de creación recibida a las ${timestamp}`);
  console.log(`[CAMPAIGN-CREATE] Body recibido:`, JSON.stringify(req.body, null, 2));

  try {
    const { kind, campaign } = req.body || {};

    // Validar que existan los datos requeridos
    if (!kind || !campaign) {
      console.error(`❌ [CAMPAIGN-CREATE] Error: Faltan datos requeridos (kind o campaign)`);
      console.error(`[CAMPAIGN-CREATE] kind=${kind}, campaign=${campaign ? 'presente' : 'ausente'}`);
      return res.status(400).json({
        error: "Faltan datos requeridos",
        detail: "Se necesita 'kind' (daily/weekly/monthly) y 'campaign' (objeto de campaña)",
        received: { kind, hasCampaign: !!campaign }
      });
    }

    // Validar kind
    if (!["daily", "weekly", "monthly"].includes(kind)) {
      console.error(`❌ [CAMPAIGN-CREATE] Error: Kind inválido '${kind}'`);
      return res.status(400).json({
        error: "Tipo de campaña inválido",
        detail: `El kind debe ser 'daily', 'weekly' o 'monthly', recibido: '${kind}'`,
        validKinds: ["daily", "weekly", "monthly"]
      });
    }

    // Validar nombre
    if (!campaign.name || !String(campaign.name).trim()) {
      console.error(`❌ [CAMPAIGN-CREATE] Error: Nombre de campaña vacío`);
      return res.status(400).json({
        error: "Nombre de campaña requerido",
        detail: "El campo 'name' es obligatorio y no puede estar vacío"
      });
    }

    // Validar campos específicos por tipo
    if (kind === "daily" && !campaign.date) {
      console.error(`❌ [CAMPAIGN-CREATE] Error: Campaña diaria sin fecha`);
      console.error(`[CAMPAIGN-CREATE] Campaña:`, JSON.stringify(campaign, null, 2));
      return res.status(400).json({
        error: "Fecha requerida para campañas diarias",
        detail: "Las campañas diarias deben tener el campo 'date' (formato YYYY-MM-DD)"
      });
    }

    if (kind === "weekly" && (!campaign.activeDays || !Array.isArray(campaign.activeDays) || campaign.activeDays.length === 0)) {
      console.error(`❌ [CAMPAIGN-CREATE] Error: Campaña semanal sin días activos`);
      return res.status(400).json({
        error: "Días activos requeridos para campañas semanales",
        detail: "Las campañas semanales deben tener el campo 'activeDays' con al menos un día"
      });
    }

    if (kind === "monthly" && (!campaign.hipódromos || !Array.isArray(campaign.hipódromos) || campaign.hipódromos.length === 0)) {
      console.warn(`⚠️ [CAMPAIGN-CREATE] Advertencia: Campaña mensual sin hipódromos`);
      // No es error fatal, pero se loguea
    }

    // Generar ID si no existe
    const campaignId = campaign.id || `${kind}-${Date.now()}`;
    console.log(`[CAMPAIGN-CREATE] ID generado: ${campaignId}`);

    // Construir objeto de campaña normalizado
    const newCampaign = {
      id: campaignId,
      name: String(campaign.name).trim(),
      enabled: campaign.enabled !== false, // true por defecto
      groupId: campaign.groupId || "",
      raceCount: Number(campaign.raceCount) || 12,
      entryValue: Number(campaign.entryValue) || 0,
      promoEnabled: Boolean(campaign.promoEnabled),
      promoPrice: Number(campaign.promoPrice) || 0,
      theme: campaign.theme || "dark",
      style: campaign.style || null,
      exportStyle: campaign.exportStyle || "excel-classic", // ✅ Estilo de exportación PNG
      customColors: campaign.customColors || null, // ✅ Colores personalizados
      scoring: campaign.scoring || {
        mode: "dividend",
        doubleLastRace: false,
        points: { first: 10, second: 5, third: 1, exclusiveFirst: 20 }
      },
      // Campos específicos por tipo
      ...(kind === "daily" && { date: campaign.date }),
      ...(kind === "weekly" && {
        format: campaign.format || "individual",
        groupSize: Number(campaign.groupSize) || 4,
        qualifiersPerGroup: Number(campaign.qualifiersPerGroup) || 2,
        activeDays: campaign.activeDays,
        finalDays: campaign.finalDays || [],
        pairMode: Boolean(campaign.pairMode)
      }),
      ...(kind === "monthly" && {
        hipodromos: campaign.hipodromos || [],
        startDate: campaign.startDate || "",
        endDate: campaign.endDate || ""
      }),
      competitionMode: campaign.competitionMode || "individual",
      eventIds: campaign.eventIds || [],
      eventId: campaign.eventId || null,
      registeredParticipants: campaign.registeredParticipants || [],
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };

    console.log(`[CAMPAIGN-CREATE] Campaña normalizada:`, JSON.stringify(newCampaign, null, 2));

    // Cargar datos actuales y agregar/actualizar la campaña
    const overrides = loadOverrides();
    const campaigns = overrides.settings.campaigns || { daily: [], weekly: [], monthly: [] };
    const kindCampaigns = campaigns[kind] || [];

    // Verificar si ya existe una campaña con el mismo ID (modo edición)
    const existingIndex = kindCampaigns.findIndex(c => c.id === campaignId);
    const isUpdate = existingIndex >= 0;

    if (isUpdate) {
      // Modo edición: actualizar campaña existente
      console.log(`📝 [CAMPAIGN-UPDATE] Actualizando campaña existente: ${campaignId}`);
      kindCampaigns[existingIndex] = {
        ...kindCampaigns[existingIndex], // Mantener campos existentes
        ...newCampaign, // Sobrescribir con nuevos datos
        lastModified: new Date().toISOString()
      };
      console.log(`✅ [CAMPAIGN-UPDATE] Campaña '${newCampaign.name}' actualizada exitosamente`);
    } else {
      // Modo creación: agregar nueva campaña
      kindCampaigns.push(newCampaign);
      console.log(`✅ [CAMPAIGN-CREATE] Campaña '${newCampaign.name}' creada exitosamente`);
    }

    campaigns[kind] = kindCampaigns;
    console.log(`[CAMPAIGN] Campañas actuales en ${kind}: ${kindCampaigns.length}`);
    console.log(`[CAMPAIGN] Todas las campañas:`, JSON.stringify(campaigns, null, 2));

    // Guardar
    overrides.settings.campaigns = campaigns;
    saveOverrides(overrides);

    console.log(`[CAMPAIGN] Guardado en data/overrides.json\n`);

    // Retornar datos actualizados
    return res.status(isUpdate ? 200 : 201).json({
      success: true,
      message: isUpdate 
        ? `Campaña '${newCampaign.name}' actualizada exitosamente`
        : `Campaña '${newCampaign.name}' creada exitosamente`,
      campaign: newCampaign,
      data: loadData()
    });

  } catch (error) {
    console.error(`❌ [CAMPAIGN-CREATE] Error inesperado:`, error.message);
    console.error(`[CAMPAIGN-CREATE] Stack:`, error.stack);
    console.error(`[CAMPAIGN-CREATE] Body recibido:`, JSON.stringify(req.body, null, 2));
    return res.status(500).json({
      error: "Error interno al crear la campaña",
      detail: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
});

app.post("/api/admin/settings", (req, res) => {
  try {
    console.log(`\n⚙️ [SETTINGS] Actualizando configuración...`);
    console.log(`[SETTINGS] Keys recibidas:`, Object.keys(req.body || {}));
    if (req.body?.campaigns) {
      console.log(`[SETTINGS] Campañas recibidas:`, JSON.stringify(req.body.campaigns, null, 2));
    }
    
    updateSettings(req.body || {});
    
    console.log(`✅ [SETTINGS] Configuración actualizada exitosamente`);
    return res.json(loadData());
  } catch (error) {
    console.error(`❌ [SETTINGS] Error al guardar configuración:`, error.message);
    console.error(`[SETTINGS] Stack:`, error.stack);
    return res.status(500).json({
      error: "No se pudo guardar la configuracion.",
      detail: error.message,
    });
  }
});

app.post("/api/admin/campaigns/:kind/:id/action", (req, res) => {
  try {
    const { kind, id } = req.params;
    const { action } = req.body || {};
    if (!["daily", "weekly", "monthly"].includes(kind)) {
      return res.status(400).json({ error: "Tipo de campana invalido." });
    }
    if (!id || !action) {
      return res.status(400).json({ error: "Faltan datos para la accion." });
    }

    if (action === "activate") updateCampaign(kind, id, { enabled: true });
    else if (action === "deactivate") updateCampaign(kind, id, { enabled: false });
    else if (action === "delete") deleteCampaign(kind, id, { clearEvents: true });
    else if (action === "clear-data") {
      const campaigns = loadOverrides().settings.campaigns?.[kind] || [];
      const campaign = campaigns.find((item) => item.id === id);
      const eventIds = Array.isArray(campaign?.eventIds) && campaign.eventIds.length
        ? campaign.eventIds
        : (campaign?.eventId ? [campaign.eventId] : []);
      clearEventData(eventIds);
    } else {
      return res.status(400).json({ error: "Accion no soportada." });
    }

    return res.json(loadData());
  } catch (error) {
    return res.status(500).json({
      error: "No se pudo aplicar la accion de campana.",
      detail: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Panel disponible en http://localhost:${PORT}`);
});
