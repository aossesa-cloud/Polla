/**
 * raceWatcher.js
 *
 * Sistema de monitoreo automático de carreras hípicas.
 * 
 * Arquitectura:
 * - Jornada (fecha + hipódromo) es la unidad central
 * - Carreras con máquina de estados
 * - Polling inteligente con reintentos
 * - Alertas automáticas por datos faltantes
 * - Confirmación Teletac para cierre oficial
 */

import {
  getRaceStatus,
  getFavorites,
  getProgram,
  getOdds,
  isRaceClosed as checkRaceClosedUtil,
  validateResultsCompleteness,
} from '../services/teletrakService'

// ===== MÁQUINA DE ESTADOS =====

export const RACE_STATUS = {
  PENDING: 'pending',                    // Aún no cerrada
  CLOSED: 'closed',                      // Cerrada, inicia polling
  RESULTS_PARTIAL: 'results_partial',    // Hay datos pero faltan campos
  RESULTS_READY: 'results_ready',        // Resultados encontrados y estructurados
  OFFICIAL: 'official',                  // Teletac confirmó cierre oficial
  ERROR: 'error',                        // Error técnico
  OFFICIAL_WITH_ALERT: 'official_alert', // Oficial pero con alertas pendientes
}

export const ALERT_TYPES = {
  MISSING_FAVORITE: 'missing_favorite',
  MISSING_WIN_DIVIDEND: 'missing_win_dividend',
  MISSING_PLACE_DIVIDEND: 'missing_place_dividend',
  MISSING_SHOW_DIVIDEND: 'missing_show_dividend',
  MISSING_RESULT_NAME: 'missing_result_name',
  INCOMPLETE_RESULTS: 'incomplete_results',
  RESULTS_TIMEOUT: 'results_timeout',
  DATA_INCONSISTENCY: 'data_inconsistency',
}

// Polling config
const POLLING_CONFIG = {
  INITIAL_DELAY_MS: 5000,        // 5s después del cierre
  POLL_INTERVAL_MS: 15000,       // Cada 15s
  MAX_RETRIES: 20,               // 5 minutos máximo
  TIMEOUT_ALERT_MS: 120000,      // Alerta a los 2 minutos
  CONFIRMATION_POLL_MS: 30000,   // Confirmación cada 30s
}

// ===== MODELO DE DATOS =====

/**
 * Crea una estructura de carrera vacía.
 */
export function createRaceEntry(raceNumber) {
  return {
    raceNumber,
    status: RACE_STATUS.PENDING,
    // Posiciones
    winner: null,      // { number, name, dividend }
    second: null,      // { number, name, dividend }
    third: null,       // { number, name, dividend }
    // Favorito
    favorite: null,    // { number, name }
    // Retiros
    withdrawals: [],   // [{ number, name }]
    // Empates
    ties: [],          // [{ position, numbers: [number, ...] }]
    // Metadata
    sourceStatus: 'pending',
    lastCheckedAt: null,
    confirmedByTeletac: false,
    confirmedAt: null,
    alerts: [],        // [{ type, message, createdAt, resolvedAt }]
    manualOverrides: [], // [{ field, oldValue, newValue, by, at, reason }]
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

/**
 * Crea una estructura de jornada vacía.
 */
export function createJornada(fecha, hipodromo) {
  return {
    fecha,
    hipodromo,
    status: 'pending',
    races: {},         // { "1": raceEntry, "2": raceEntry, ... }
    alerts: [],        // Alertas de nivel jornada
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

// ===== VALIDACIÓN Y ALERTAS =====

/**
 * Valida un resultado de carrera y genera alertas si faltan datos.
 */
export function validateRaceResult(race) {
  const alerts = []

  if (!race) return alerts

  // Favorito
  if (!race.favorite?.number) {
    alerts.push({
      type: ALERT_TYPES.MISSING_FAVORITE,
      message: `Carrera ${race.raceNumber}: Falta el favorito`,
      severity: 'medium',
      createdAt: new Date().toISOString(),
    })
  }

  // Ganador
  if (!race.winner) {
    alerts.push({
      type: ALERT_TYPES.INCOMPLETE_RESULTS,
      message: `Carrera ${race.raceNumber}: No hay resultado del ganador`,
      severity: 'high',
      createdAt: new Date().toISOString(),
    })
  } else {
    if (!race.winner.name) {
      alerts.push({
        type: ALERT_TYPES.MISSING_RESULT_NAME,
        message: `Carrera ${race.raceNumber}: Falta nombre del ganador`,
        severity: 'low',
        createdAt: new Date().toISOString(),
      })
    }
    if (!race.winner.dividend) {
      alerts.push({
        type: ALERT_TYPES.MISSING_WIN_DIVIDEND,
        message: `Carrera ${race.raceNumber}: Falta dividendo del ganador`,
        severity: 'medium',
        createdAt: new Date().toISOString(),
      })
    }
  }

  return alerts
}

/**
 * Determina el estado de la carrera según los datos disponibles.
 */
export function determineRaceStatus(race, alerts) {
  if (!race.winner) return RACE_STATUS.PENDING
  if (race.confirmedByTeletac) {
    return alerts.length > 0 ? RACE_STATUS.OFFICIAL_WITH_ALERT : RACE_STATUS.OFFICIAL
  }
  if (alerts.some(a => a.severity === 'high')) return RACE_STATUS.RESULTS_PARTIAL
  if (race.winner && race.winner.dividend) return RACE_STATUS.RESULTS_READY
  return RACE_STATUS.RESULTS_PARTIAL
}

// ===== MOTOR DE POLLING =====

/**
 * Polling inteligente para una carrera individual.
 * 
 * @param {string} fecha - "2026-04-14"
 * @param {number} raceNumber - Número de carrera
 * @param {number} trackId - ID numérico del hipódromo en Teletrak
 * @param {Function} onProgress - Callback de progreso
 * @param {AbortSignal} signal - Señal para cancelar
 */
export async function watchRace(fecha, raceNumber, trackId, onProgress, signal) {
  let retries = 0
  let hasResults = false
  const startTime = Date.now()

  log(`[Watcher] Carrera ${raceNumber} (${fecha}): Iniciando monitoreo`)

  while (retries < POLLING_CONFIG.MAX_RETRIES) {
    if (signal?.aborted) {
      log(`[Watcher] Carrera ${raceNumber}: Cancelado por señal`)
      return { status: 'cancelled', raceNumber }
    }

    try {
      // 1. Verificar si la carrera está cerrada
      const statusData = await getRaceStatus(fecha, raceNumber, trackId)
      const isClosed = checkRaceClosedUtil(statusData)
      
      if (!isClosed) {
        await delay(POLLING_CONFIG.POLL_INTERVAL_MS)
        retries++
        continue
      }

      // 2. Carrera cerrada → buscar favorito si no lo tenemos
      if (!hasResults) {
        onProgress?.({ raceNumber, status: RACE_STATUS.CLOSED, message: 'Carrera cerrada, buscando favorito...' })
        
        try {
          const favData = await getFavorites(fecha, trackId)
          if (favData?.favorites?.[raceNumber]) {
            onProgress?.({ raceNumber, status: RACE_STATUS.CLOSED, message: 'Favorito encontrado' })
          }
        } catch (favErr) {
          console.warn(`[Watcher] No se pudo obtener favorito: ${favErr.message}`)
        }

        // 3. Iniciar polling de resultados
        onProgress?.({ raceNumber, status: RACE_STATUS.CLOSED, message: 'Polling de resultados...' })
      }

      // 4. Obtener resultados (pueden ser parciales al inicio)
      const statusData2 = await getRaceStatus(fecha, raceNumber, trackId)
      const results = statusData2?.results
      
      if (results && isValidResult(results)) {
        hasResults = true
        const race = buildRaceEntry(raceNumber, results, statusData2)
        
        // 5. Validar y generar alertas
        const alerts = validateRaceResult(race)
        race.alerts = alerts
        race.status = determineRaceStatus(race, alerts)
        race.lastCheckedAt = new Date().toISOString()

        // 6. Guardar
        await saveRaceResult(fecha, raceNumber, race)
        
        onProgress?.({ 
          raceNumber, 
          status: race.status, 
          message: alerts.length > 0 ? `Resultados parciales (${alerts.length} alertas)` : 'Resultados listos',
          alerts 
        })

        // 7. Verificar confirmación Teletac
        if (statusData2?.complete) {
          race.confirmedByTeletac = true
          race.confirmedAt = new Date().toISOString()
          race.status = alerts.length > 0 ? RACE_STATUS.OFFICIAL_WITH_ALERT : RACE_STATUS.OFFICIAL
          await saveRaceResult(fecha, raceNumber, race)
          
          log(`[Watcher] Carrera ${raceNumber}: OFICIAL (Teletac confirmado)`)
          onProgress?.({ raceNumber, status: RACE_STATUS.OFFICIAL, message: 'Oficial - Teletac confirmado' })
          return { status: 'official', raceNumber, race }
        }

        // Si ya tiene resultados completos, esperar confirmación
        if (race.status === RACE_STATUS.RESULTS_READY) {
          await delay(POLLING_CONFIG.CONFIRMATION_POLL_MS)
          retries++
          continue
        }
      }

      // Timeout alert
      if (Date.now() - startTime > POLLING_CONFIG.TIMEOUT_ALERT_MS && !hasResults) {
        const alertRace = createRaceEntry(raceNumber)
        alertRace.status = RACE_STATUS.RESULTS_TIMEOUT
        alertRace.alerts.push({
          type: ALERT_TYPES.RESULTS_TIMEOUT,
          message: `Carrera ${raceNumber}: Timeout buscando resultados`,
          severity: 'high',
          createdAt: new Date().toISOString(),
        })
        await saveRaceResult(fecha, raceNumber, alertRace)
        
        onProgress?.({ raceNumber, status: RACE_STATUS.RESULTS_TIMEOUT, message: 'Timeout - Revisar manualmente' })
      }

      await delay(POLLING_CONFIG.POLL_INTERVAL_MS)
      retries++

    } catch (error) {
      log(`[Watcher] Carrera ${raceNumber}: Error - ${error.message}`)
      
      if (retries >= POLLING_CONFIG.MAX_RETRIES - 1) {
        const errorRace = createRaceEntry(raceNumber)
        errorRace.status = RACE_STATUS.ERROR
        errorRace.alerts.push({
          type: 'error',
          message: `Error técnico: ${error.message}`,
          severity: 'high',
          createdAt: new Date().toISOString(),
        })
        await saveRaceResult(fecha, raceNumber, errorRace)
        
        onProgress?.({ raceNumber, status: RACE_STATUS.ERROR, message: `Error: ${error.message}` })
        return { status: 'error', raceNumber, error: error.message }
      }
      
      await delay(POLLING_CONFIG.POLL_INTERVAL_MS * 2)
    }
  }

  // Máximo de reintentos alcanzado
  log(`[Watcher] Carrera ${raceNumber}: Máximo de reintentos alcanzado`)
  return { status: 'timeout', raceNumber }
}

/**
 * Monitorea todas las carreras de una jornada.
 * 
 * @param {string} fecha - "2026-04-14"
 * @param {number} raceCount - Cantidad de carreras
 * @param {string} hipodromo - Nombre del hipódromo
 * @param {number} trackId - ID numérico en Teletrak
 * @param {Function} onProgress - Callback de progreso
 */
export async function watchJornada(fecha, raceCount, hipodromo, trackId, onProgress) {
  log(`[Watcher] Jornada ${fecha} (${hipodromo}, trackId=${trackId}): Iniciando monitoreo de ${raceCount} carreras`)

  // Crear o obtener jornada
  let jornada = await getJornada(fecha)
  if (!jornada) {
    jornada = createJornada(fecha, hipodromo)
    jornada.trackId = trackId
    await saveJornada(fecha, jornada)
  } else if (!jornada.trackId) {
    jornada.trackId = trackId
    await saveJornada(fecha, jornada)
  }

  const results = []

  // Monitorear cada carrera
  const abortController = new AbortController()

  const racePromises = Array.from({ length: raceCount }, (_, i) => i + 1).map(raceNum =>
    watchRace(fecha, raceNum, trackId, (progress) => {
      onProgress?.({ ...progress, fecha, hipodromo })
    }, abortController.signal).then(result => {
      results.push(result)
      return result
    })
  )

  await Promise.allSettled(racePromises)

  // Actualizar estado de jornada
  const officialCount = results.filter(r => r.status === 'official').length
  jornada.status = officialCount === raceCount ? 'completed' : 'partial'
  jornada.updatedAt = new Date().toISOString()
  await saveJornada(fecha, jornada)

  log(`[Watcher] Jornada ${fecha}: ${officialCount}/${raceCount} carreras oficiales`)

  return { fecha, hipodromo, trackId, results, jornada }
}

// ===== HELPERS =====

function isValidResult(results) {
  return results && (results.winner || results.first || results.primero)
}

function buildRaceEntry(raceNumber, results, statusData = {}) {
  const race = createRaceEntry(raceNumber)
  
  // Normalizar datos de Teletrak
  race.winner = {
    number: results.winner?.number || results.first?.numero || results.primero,
    name: results.winner?.name || results.first?.nombre || '',
    dividend: results.winner?.dividend || results.ganador,
  }
  
  if (results.second || results.segundo) {
    race.second = {
      number: results.second?.number || results.segundo?.numero,
      name: results.second?.name || results.segundo?.nombre || '',
      dividend: results.second?.dividend || results.divSegundo,
    }
  }
  
  if (results.third || results.tercero) {
    race.third = {
      number: results.third?.number || results.tercero?.numero,
      name: results.third?.name || results.tercero?.nombre || '',
      dividend: results.third?.dividend || results.divTercero,
    }
  }
  
  // Favorito desde statusData (viene de getRaceStatus o getFavorites)
  race.favorite = statusData?.results?.favorite || statusData?.results?.favorito || results.favorite || results.favorito || null
  race.withdrawals = results.withdrawals || results.retiros || []
  race.ties = results.ties || results.empates || []
  race.sourceStatus = statusData?.status || 'unknown'
  race.confirmedByTeletac = statusData?.complete || false
  
  return race
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`)
}

// ===== STORAGE INTERFACE =====
// Estas funciones se implementan en storage.js

let _storage = {
  getJornada: async () => null,
  saveJornada: async () => {},
  saveRaceResult: async () => {},
}

export function setRaceWatcherStorage(storage) {
  _storage = storage
}

export async function getJornada(fecha) {
  return _storage.getJornada(fecha)
}

export async function saveJornada(fecha, jornada) {
  return _storage.saveJornada(fecha, jornada)
}

export async function saveRaceResult(fecha, raceNumber, race) {
  return _storage.saveRaceResult(fecha, raceNumber, race)
}

export async function getResultados(fecha) {
  const jornada = await _storage.getJornada(fecha)
  return jornada?.races || {}
}

export async function getResultadoCarrera(fecha, raceNumber) {
  const jornada = await _storage.getJornada(fecha)
  return jornada?.races?.[String(raceNumber)] || null
}
