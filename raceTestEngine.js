/**
 * raceTestEngine.js
 * 
 * Motor de test para simular carreras sin depender de Teletrak.
 * Usa el mismo motor base del watcher real, solo cambia la fuente de datos.
 * 
 * Endpoints:
 *   POST /test/startRace - Inicia una carrera simulada
 *   POST /test/updateResults - Actualiza resultados parciales
 *   POST /test/completeRace - Marca carrera como completa
 *   GET  /test/status - Estado actual del test
 *   POST /test/reset - Resetea carrera de test
 *   POST /test/setResults - Fuerza resultados específicos
 *   POST /test/setOfficial - Fuerza estado OFFICIAL
 */

const { fetchTeletrakFavoritesForRaces, mapRaceResult } = require('./teletrak');
const { upsertResult, loadOverrides, upsertEventMeta } = require('./storage');

// Estado global del modo test
const testState = {
  active: false,
  races: {}, // { raceNum: { status, results, favorite, retiros, empates, updatedAt } }
  trackId: 'test-track',
  date: new Date().toISOString().split('T')[0],
  logs: [],
  eventId: null,
};

// Helper para loguear con hora local de Chile (UTC-4)
function log(message) {
  const timestamp = new Date().toLocaleString('es-CL', { 
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const entry = `[TEST ${timestamp}] ${message}`;
  console.log(entry);
  testState.logs.push(entry);
}

// Genera resultados simulados
function generateMockResult(raceNumber, config = {}) {
  const {
    primero = String(Math.floor(Math.random() * 15) + 1),
    segundo = String(Math.floor(Math.random() * 15) + 1),
    tercero = String(Math.floor(Math.random() * 15) + 1),
    ganador = (Math.random() * 10 + 1.1).toFixed(2),
    divSegundo = (Math.random() * 5 + 1.1).toFixed(2),
    divTercero = (Math.random() * 3 + 1.1).toFixed(2),
    favorito = String(Math.floor(Math.random() * 15) + 1),
    retiros = [],
    empates = [],
    incomplete = false,
    noFavorite = false,
    noDividends = false,
    tie = false,
  } = config;

  const result = {
    race: String(raceNumber),
    primero: incomplete ? null : primero,
    empatePrimero: '',
    ganador: noDividends ? '' : ganador,
    divSegundoPrimero: noDividends ? '' : divSegundo,
    divTerceroPrimero: noDividends ? '' : divTercero,
    empatePrimeroGanador: '',
    empatePrimeroDivSegundo: '',
    empatePrimeroDivTercero: '',
    segundo: incomplete ? null : segundo,
    empateSegundo: '',
    divSegundo: noDividends ? '' : divSegundo,
    divTerceroSegundo: noDividends ? '' : divTercero,
    empateSegundoDivSegundo: '',
    empateSegundoDivTercero: '',
    tercero: incomplete ? null : tercero,
    empateTercero: '',
    divTercero: noDividends ? '' : divTercero,
    empateTerceroDivTercero: '',
    favorito: noFavorite ? '' : favorito,
    retiros: retiros,
  };

  if (tie) {
    result.empatePrimero = String(Math.floor(Math.random() * 15) + 1);
    result.empatePrimeroGanador = ganador;
    result.empatePrimeroDivSegundo = divSegundo;
    result.empatePrimeroDivTercero = divTercero;
  }

  return result;
}

// Inicia una carrera simulada
function startTestRace(raceNumber, config = {}) {
  log(`Iniciando carrera ${raceNumber} (modo TEST)`);
  
  testState.races[String(raceNumber)] = {
    status: 'pending',
    results: null,
    favorite: config.favorito || String(Math.floor(Math.random() * 15) + 1),
    retiros: config.retiros || [],
    empates: config.empates || [],
    updatedAt: Date.now(),
  };

  return { success: true, raceNumber, status: 'pending' };
}

// Actualiza resultados parciales
function updateTestResults(raceNumber, resultConfig) {
  const raceKey = String(raceNumber);
  if (!testState.races[raceKey]) {
    return { error: `Carrera ${raceNumber} no iniciada` };
  }

  log(`Actualizando carrera ${raceNumber} con resultados parciales`);

  const result = generateMockResult(raceNumber, resultConfig);
  testState.races[raceKey].results = result;
  testState.races[raceKey].status = resultConfig.incomplete ? 'partial' : 'complete';
  testState.races[raceKey].updatedAt = Date.now();

  // Guardar en storage
  const eventId = testState.eventId || `imported-${testState.date}`;
  upsertResult(eventId, raceKey, result);

  return { success: true, raceNumber, status: testState.races[raceKey].status };
}

// Marca carrera como completa
function completeTestRace(raceNumber, config = {}) {
  const raceKey = String(raceNumber);
  
  log(`Completando carrera ${raceNumber} (modo TEST)`);

  const result = generateMockResult(raceNumber, config);
  
  testState.races[raceKey] = {
    status: 'official',
    results: result,
    favorite: config.favorito || result.favorito,
    retiros: config.retiros || [],
    empates: config.empates || [],
    updatedAt: Date.now(),
  };

  // Guardar en storage
  const eventId = testState.eventId || `imported-${testState.date}`;
  upsertResult(eventId, raceKey, result);

  return { success: true, raceNumber, status: 'official' };
}

// Fuerza resultados específicos
function forceTestResults(raceNumber, resultConfig) {
  const raceKey = String(raceNumber);
  
  testState.races[raceKey] = {
    status: resultConfig.status || 'complete',
    results: resultConfig.results || generateMockResult(raceNumber, resultConfig),
    favorite: resultConfig.favorito || testState.races[raceKey]?.favorite || '0',
    retiros: resultConfig.retiros || [],
    empates: resultConfig.empates || [],
    updatedAt: Date.now(),
  };

  // Guardar en storage
  const eventId = testState.eventId || `imported-${testState.date}`;
  if (testState.races[raceKey].results) {
    upsertResult(eventId, raceKey, testState.races[raceKey].results);
  }

  log(`Forzando resultados para carrera ${raceNumber}`);

  return { success: true, raceNumber, status: testState.races[raceKey].status };
}

// Resetea carrera de test
function resetTestRace(raceNumber) {
  const raceKey = String(raceNumber);
  delete testState.races[raceKey];
  
  log(`Reseteando carrera ${raceNumber}`);

  return { success: true, raceNumber, message: 'Carrera reseteada' };
}

// Obtiene estado actual del test
function getTestStatus() {
  return {
    active: testState.active,
    date: testState.date,
    trackId: testState.trackId,
    eventId: testState.eventId,
    races: Object.entries(testState.races).map(([num, data]) => ({
      raceNumber: Number(num),
      status: data.status,
      hasResults: !!data.results,
      favorite: data.favorite,
      updatedAt: new Date(data.updatedAt).toISOString(),
    })),
    logs: testState.logs.slice(-50), // Últimos 50 logs
  };
}

// Activa/desactiva modo test
function setTestMode(active) {
  testState.active = active;
  log(`Modo test ${active ? 'ACTIVADO' : 'DESACTIVADO'}`);
  return { success: true, testMode: active };
}

// Configura fecha y evento de test
function configureTest(date, trackId, eventId) {
  testState.date = date || testState.date;
  testState.trackId = trackId || testState.trackId;
  testState.eventId = eventId || `imported-${testState.date}`;
  
  log(`Configuración: date=${testState.date}, trackId=${testState.trackId}, eventId=${testState.eventId}`);
  return { success: true, config: { date: testState.date, trackId: testState.trackId, eventId: testState.eventId } };
}

module.exports = {
  testState,
  startTestRace,
  updateTestResults,
  completeTestRace,
  forceTestResults,
  resetTestRace,
  getTestStatus,
  setTestMode,
  configureTest,
  log,
};
