/**
 * jornadaStorage.js
 *
 * Almacenamiento de jornadas y resultados por fecha.
 * Fuente primaria: servidor (/api/jornadas/:fecha)
 * Fuente secundaria: localStorage (fallback offline)
 */

import { createJornada, createRaceEntry, RACE_STATUS } from '../engine/raceWatcher'
import { API_URL } from '../config/api'

const JORNADAS_KEY = 'pollas-jornadas'
const AUDIT_KEY = 'pollas-audit-log'

/**
 * Carga todas las jornadas del localStorage (para compatibilidad).
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
 * Guarda en localStorage y dispara evento.
 */
function saveJornadasAll(jornadas) {
  localStorage.setItem(JORNADAS_KEY, JSON.stringify(jornadas))
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pollas-jornadas-updated', {
      detail: { updatedAt: new Date().toISOString() },
    }))
  }
}

/**
 * Guarda jornada en el servidor.
 */
async function syncJornadaToServer(fecha, jornada) {
  try {
    await fetch(`${API_URL}/jornadas/${fecha}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(jornada),
    })
  } catch (err) {
    console.warn('[JornadaStorage] No se pudo sincronizar con servidor:', err.message)
  }
}

/**
 * Obtiene una jornada: primero servidor, fallback localStorage.
 */
export async function getJornada(fecha) {
  // Intentar obtener del servidor primero
  try {
    const res = await fetch(`${API_URL}/jornadas/${fecha}`)
    if (res.ok) {
      const serverJornada = await res.json()
      // Actualizar localStorage con datos del servidor
      const jornadas = loadJornadas()
      jornadas[fecha] = serverJornada
      saveJornadasAll(jornadas)
      return serverJornada
    }
  } catch {
    // Sin conexión o error - usar localStorage
  }

  // Fallback: localStorage
  const jornadas = loadJornadas()
  const jornada = jornadas[fecha]
  if (!jornada) return null

  // Migrate: push localStorage data to server so public view can see it
  syncJornadaToServer(fecha, jornada).catch(() => {})

  // Recalculate invalid statuses
  let needsSave = false
  if (jornada.races) {
    Object.values(jornada.races).forEach(race => {
      const invalidStatuses = ['manual-edit', 'manual', 'editing', 'undefined', undefined, null]
      if (invalidStatuses.includes(race.status)) {
        const hasWinner = Boolean(race?.winner?.number || race?.winner?.dividend)
        const hasSecond = Boolean(race?.second?.number || race?.second?.dividend)
        const hasThird = Boolean(race?.third?.number || race?.third?.dividend)
        const ties = Array.isArray(race?.ties) ? race.ties : []
        const hasTiedSecond = ties.some((tie) => Number(tie?.position) === 2 && (tie?.number || tie?.dividend || tie?.divTercero))
        const hasTiedThird = ties.some((tie) => Number(tie?.position) === 3 && (tie?.number || tie?.dividend))
        if (hasWinner && (hasThird || hasTiedThird || (hasSecond && hasTiedSecond))) {
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
  if (needsSave) saveJornadasAll(jornadas)

  return jornada
}

/**
 * Guarda o actualiza una jornada (localStorage + servidor).
 */
export async function saveJornada(fecha, jornada) {
  const jornadas = loadJornadas()
  jornada.updatedAt = new Date().toISOString()
  jornadas[fecha] = jornada
  saveJornadasAll(jornadas)
  await syncJornadaToServer(fecha, jornada)
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
  await syncJornadaToServer(fecha, jornada)
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
  jornadas[fecha].updatedAt = new Date().toISOString()
  saveJornadasAll(jornadas)
  // Sincronizar con servidor para que la vista pública vea los cambios
  await syncJornadaToServer(fecha, jornadas[fecha])

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

/**
 * Migra todas las jornadas del localStorage al servidor.
 * Llamar en el startup de la app para sincronizar datos históricos.
 */
export async function migrateLocalStorageJornadasToServer() {
  const jornadas = loadJornadas()
  const dates = Object.keys(jornadas)
  if (dates.length === 0) return

  for (const fecha of dates) {
    const jornada = jornadas[fecha]
    if (!jornada) continue
    try {
      // Solo migrar si el servidor no tiene datos más recientes
      const res = await fetch(`${API_URL}/jornadas/${fecha}`)
      if (res.ok) {
        const serverJornada = await res.json()
        const serverUpdatedAt = serverJornada?.updatedAt || ''
        const localUpdatedAt = jornada?.updatedAt || ''
        if (serverUpdatedAt >= localUpdatedAt) continue // servidor ya está actualizado
      }
      // Servidor no tiene datos o tiene datos más viejos → sincronizar
      await syncJornadaToServer(fecha, jornada)
    } catch {
      // Ignorar errores de red
    }
  }
}

// Exportar para integración con raceWatcher
import { setRaceWatcherStorage } from '../engine/raceWatcher'

setRaceWatcherStorage({
  getJornada,
  saveJornada,
  saveRaceResult,
})
