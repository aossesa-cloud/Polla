/**
 * jornadaStorage.js
 *
 * Almacenamiento de jornadas y resultados por fecha.
 * 
 * Reglas:
 * - Las jornadas se guardan por fecha (key: "jornada-YYYY-MM-DD")
 * - Las campañas consultan jornadas por fecha, NO guardan resultados propios
 * - Los overrides manuales se auditan
 */

import { createJornada, createRaceEntry, RACE_STATUS } from '../engine/raceWatcher'

const JORNADAS_KEY = 'pollas-jornadas'
const AUDIT_KEY = 'pollas-audit-log'

/**
 * Carga todas las jornadas almacenadas.
 */
export function loadJornadas() {
  try {
    const raw = localStorage.getItem(JORNADAS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

/**
 * Guarda todas las jornadas.
 */
function saveJornadasAll(jornadas) {
  localStorage.setItem(JORNADAS_KEY, JSON.stringify(jornadas))
}

/**
 * Obtiene una jornada por fecha.
 */
export async function getJornada(fecha) {
  const jornadas = loadJornadas()
  const jornada = jornadas[fecha]
  
  if (!jornada) return null
  
  // Recalculate status for all races that have 'manual-edit' or invalid status
  let needsSave = false
  if (jornada.races) {
    Object.values(jornada.races).forEach(race => {
      const invalidStatuses = ['manual-edit', 'manual', 'editing', 'undefined', undefined, null]
      if (invalidStatuses.includes(race.status)) {
        // Recalculate based on available data
        const hasWinner = race.winner && race.winner.dividend
        const hasSecond = race.second && race.second.dividend
        const hasThird = race.third && race.third.dividend
        
        if (hasWinner && hasSecond && hasThird) {
          race.status = RACE_STATUS.RESULTS_READY
        } else if (hasWinner) {
          race.status = RACE_STATUS.RESULTS_PARTIAL
        } else {
          race.status = RACE_STATUS.PENDING
        }
        needsSave = true
      }
    })
  }
  
  // Save if we recalculated any statuses
  if (needsSave) {
    console.log('[JornadaStorage] Recalculated race statuses for', fecha)
    saveJornadasAll(jornadas)
  }
  
  return jornada
}

/**
 * Guarda o actualiza una jornada.
 */
export async function saveJornada(fecha, jornada) {
  const jornadas = loadJornadas()
  jornada.updatedAt = new Date().toISOString()
  jornadas[fecha] = jornada
  saveJornadasAll(jornadas)
  return jornada
}

/**
 * Guarda el resultado de una carrera en su jornada.
 * Protege las ediciones manuales de ser sobrescritas por datos de Teletrak.
 */
export async function saveRaceResult(fecha, raceNumber, race) {
  const jornadas = loadJornadas()
  let jornada = jornadas[fecha]

  if (!jornada) {
    jornada = createJornada(fecha, 'desconocido')
    jornadas[fecha] = jornada
  }

  if (!jornada.races) jornada.races = {}

  // Merge con existente para preservar overrides manuales
  const existing = jornada.races[String(raceNumber)]
  const merged = existing ? { ...existing, ...race } : race

  // Preservar overrides manuales
  if (existing?.manualOverrides) {
    merged.manualOverrides = existing.manualOverrides
    
    // PROTECCIÓN: Si un campo fue editado manualmente, NO sobrescribir con datos de Teletrak
    const manuallyEditedFields = new Set()
    existing.manualOverrides.forEach(override => {
      // Extraer el nombre del campo principal (ej: "winner.dividend" → "winner")
      const mainField = override.field.split('.')[0]
      manuallyEditedFields.add(mainField)
    })
    
    // Restaurar campos que fueron editados manualmente
    manuallyEditedFields.forEach(field => {
      if (existing[field] && race[field]) {
        console.log(`[JornadaStorage] Protegiendo edición manual: ${field} en carrera ${raceNumber}`)
        merged[field] = existing[field] // Mantener valor manual, no el de Teletrak
      }
    })
  }

  merged.updatedAt = new Date().toISOString()
  jornada.races[String(raceNumber)] = merged
  jornada.updatedAt = new Date().toISOString()

  saveJornadasAll(jornadas)
  return merged
}

/**
 * Obtiene resultados de una fecha.
 */
export async function getResultados(fecha) {
  const jornada = await getJornada(fecha)
  return jornada?.races || {}
}

/**
 * Obtiene resultado de una carrera específica.
 */
export async function getResultadoCarrera(fecha, raceNumber) {
  const jornada = await getJornada(fecha)
  return jornada?.races?.[String(raceNumber)] || null
}

/**
 * Aplica un override manual a un resultado.
 * Registra auditoría.
 */
export async function applyManualOverride(fecha, raceNumber, field, oldValue, newValue, user, reason = '') {
  const jornadas = loadJornadas()
  const jornada = jornadas[fecha]
  const raceKey = String(raceNumber)

  // If jornada doesn't exist, create it
  if (!jornada) {
    console.log(`[JornadaStorage] Creating jornada for ${fecha}`)
    jornadas[fecha] = {
      date: fecha,
      races: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }

  // If race doesn't exist, create empty race entry
  if (!jornadas[fecha].races?.[raceKey]) {
    console.log(`[JornadaStorage] Creating race ${raceKey} for jornada ${fecha}`)
    if (!jornadas[fecha].races) {
      jornadas[fecha].races = {}
    }
    jornadas[fecha].races[raceKey] = {
      raceNumber: raceNumber,
      manualOverrides: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }

  const race = jornadas[fecha].races[raceKey]
  const oldValueStr = JSON.stringify(oldValue)
  const newValueStr = JSON.stringify(newValue)

  // Aplicar cambio (soporte para paths anidados como "winner.dividend")
  setNestedValue(race, field, newValue)

  // Recalculate status based on available data using official RACE_STATUS
  const hasWinner = race.winner && race.winner.dividend
  const hasSecond = race.second && race.second.dividend
  const hasThird = race.third && race.third.dividend
  
  if (hasWinner && hasSecond && hasThird) {
    race.status = RACE_STATUS.RESULTS_READY
  } else if (hasWinner) {
    race.status = RACE_STATUS.RESULTS_PARTIAL
  } else {
    race.status = RACE_STATUS.PENDING
  }

  // Registrar override
  if (!race.manualOverrides) race.manualOverrides = []
  race.manualOverrides.push({
    field,
    oldValue: oldValueStr,
    newValue: newValueStr,
    by: user?.username || user?.id || 'unknown',
    at: new Date().toISOString(),
    reason,
  })

  race.updatedAt = new Date().toISOString()
  saveJornadasAll(jornadas)

  // Auditoría
  addAuditEntry({
    action: 'MANUAL_OVERRIDE',
    fecha,
    raceNumber,
    field,
    oldValue: oldValueStr,
    newValue: newValueStr,
    user: user?.username || user?.id || 'unknown',
    reason,
    timestamp: new Date().toISOString(),
  })
  
  return race
}

/**
 * Resuelve una alerta manualmente.
 */
export async function resolveAlert(fecha, raceNumber, alertIndex, user) {
  const jornadas = loadJornadas()
  const raceKey = String(raceNumber)
  
  // If jornada doesn't exist, create it
  if (!jornadas[fecha]) {
    jornadas[fecha] = {
      date: fecha,
      races: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }
  
  // If race doesn't exist, create empty race entry
  if (!jornadas[fecha].races?.[raceKey]) {
    if (!jornadas[fecha].races) {
      jornadas[fecha].races = {}
    }
    jornadas[fecha].races[raceKey] = {
      raceNumber: raceNumber,
      status: 'manual-edit',
      alerts: [],
      manualOverrides: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }

  const race = jornadas[fecha].races[raceKey]
  if (race.alerts?.[alertIndex]) {
    race.alerts[alertIndex].resolvedAt = new Date().toISOString()
    race.alerts[alertIndex].resolvedBy = user?.username || user?.id || 'unknown'
    race.updatedAt = new Date().toISOString()
    saveJornadasAll(jornadas)
  }
  
  return race
}

/**
 * Obtiene el log de auditoría.
 */
export function getAuditLog(fecha) {
  try {
    const raw = localStorage.getItem(AUDIT_KEY)
    const log = raw ? JSON.parse(raw) : []
    return fecha ? log.filter(e => e.fecha === fecha) : log
  } catch {
    return []
  }
}

/**
 * Agrega entrada al log de auditoría.
 */
function addAuditEntry(entry) {
  try {
    const raw = localStorage.getItem(AUDIT_KEY)
    const log = raw ? JSON.parse(raw) : []
    log.push(entry)
    // Mantener solo últimos 500 entries
    const trimmed = log.slice(-500)
    localStorage.setItem(AUDIT_KEY, JSON.stringify(trimmed))
  } catch (err) {
    console.error('Failed to save audit log:', err)
  }
}

/**
 * Helper para setear valores anidados.
 */
function setNestedValue(obj, path, value) {
  const parts = path.split('.')
  let current = obj
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]]) current[parts[i]] = {}
    current = current[parts[i]]
  }
  current[parts[parts.length - 1]] = value
}

// Exportar para integración con raceWatcher
import { setRaceWatcherStorage } from '../engine/raceWatcher'

setRaceWatcherStorage({
  getJornada,
  saveJornada,
  saveRaceResult,
})
