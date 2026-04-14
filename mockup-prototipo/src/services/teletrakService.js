/**
 * teletrakService.js
 *
 * Servicio frontend para conectar con los endpoints de Teletrak del backend.
 * Usado por el raceWatcher para monitoreo automático de carreras.
 */


const API_BASE = `${API_URL}/teletrak`

/**
 * Obtiene estado de una carrera específica.
 * @returns { date, trackId, raceNumber, postTime, isClosed, complete, status, results, raw }
 */
export async function getRaceStatus(fecha, raceNumber, trackId) {
  const res = await fetch(
    `${API_BASE}/race-status/${fecha}/${raceNumber}?trackId=${trackId}`
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Error ${res.status} obteniendo estado de carrera`)
  }
  return res.json()
}

/**
 * Obtiene favoritos para todas las carreras de una fecha.
 * @returns { date, trackId, favorites: { "1": { number, name }, "2": ... } }
 */
export async function getFavorites(fecha, trackId) {
  const res = await fetch(
    `${API_BASE}/favorites/${fecha}?trackId=${trackId}`
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Error ${res.status} obteniendo favoritos`)
  }
  return res.json()
}

/**
 * Obtiene programa completo (carreras, postTimes, estado).
 * @returns { date, trackId, trackName, races: { "1": { raceNumber, postTime, complete, ... } } }
 */
export async function getProgram(fecha, trackId) {
  const res = await fetch(
    `${API_BASE}/program/${fecha}/${trackId}`
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Error ${res.status} obteniendo programa`)
  }
  return res.json()
}

/**
 * Obtiene dividendos/odds de una carrera.
 * @returns { date, trackId, raceNumber, odds: { primero, segundo, tercero, ... }, isClosed }
 */
export async function getOdds(fecha, raceNumber, trackId) {
  const res = await fetch(
    `${API_BASE}/odds/${fecha}/${raceNumber}?trackId=${trackId}`
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Error ${res.status} obteniendo dividendos`)
  }
  return res.json()
}

/**
 * Obtiene hipódromos disponibles para una fecha.
 * @returns { date, tracks: [{ id, name }] }
 */
export async function getTracks(fecha) {
  const res = await fetch(
    `${API_URL}/import/teletrak/tracks?date=${fecha}`
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Error ${res.status} obteniendo hipódromos`)
  }
  return res.json()
}

/**
 * Importa resultados completos desde Teletrak.
 */
export async function importResults(fecha, trackId, targetEventIds) {
  const res = await fetch(`${API_URL}/import/teletrak/results`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      date: fecha,
      trackId: Number(trackId),
      targetEventIds,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Error ${res.status} importando resultados`)
  }
  return res.json()
}

/**
 * Importa programa desde Teletrak.
 */
export async function importProgram(fecha, trackId) {
  const res = await fetch(`${API_URL}/import/teletrak/program`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      date: fecha,
      trackId: String(trackId),
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Error ${res.status} importando programa`)
  }
  return res.json()
}

/**
 * Helper: determina si una carrera está cerrada según múltiples criterios.
 */
export function isRaceClosed(statusData) {
  if (!statusData) return false
  
  // Criterio 1: Teletrak marca complete=true
  if (statusData.complete) return true
  
  // Criterio 2: Hay resultado con ganador y dividendo
  if (statusData.results?.winner?.dividend || statusData.results?.ganador) return true
  
  // Criterio 3: Status reported como closed
  if (statusData.status === 'closed') return true
  
  return false
}

/**
 * Helper: valida si los resultados son completos o parciales.
 */
export function validateResultsCompleteness(results) {
  if (!results) return { complete: false, missing: ['resultados'] }
  
  const missing = []
  
  if (!results.winner?.number && !results.primero) missing.push('ganador')
  if (!results.winner?.dividend && !results.ganador) missing.push('dividend_ganador')
  if (!results.favorite?.number && !results.favorito) missing.push('favorito')
  
  // Segundo y tercero son opcionales dependiendo de la carrera
  if (results.second && !results.second.dividend && !results.divSegundo) {
    missing.push('dividend_segundo')
  }
  if (results.third && !results.third.dividend && !results.divTercero) {
    missing.push('dividend_tercero')
  }
  
  return {
    complete: missing.length === 0,
    missing,
    severity: missing.includes('ganador') ? 'high' : missing.length > 1 ? 'medium' : 'low',
  }
}
import { API_URL } from '../config/api'
