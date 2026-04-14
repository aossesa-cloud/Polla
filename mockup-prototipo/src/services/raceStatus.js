/**
 * raceStatus.js
 * 
 * Lógica para detectar el estado de la jornada basándose en resultados disponibles.
 * Determina si la jornada está en:
 * - 🟡 Inicio (sin resultados)
 * - 🟢 Hasta carrera X (resultados parciales)
 * - 🏁 Jornada finalizada (todos los resultados)
 */

/**
 * Detectar el estado de la jornada
 * @param {Object} results - Objeto de resultados { "1": {...}, "2": {...}, ... }
 * @param {number} totalRaces - Número total de carreras esperadas
 * @returns {Object} Estado de la jornada
 */
export function detectRaceStatus(results, totalRaces) {
  // Validar entradas
  if (!results || typeof results !== 'object') {
    return {
      status: 'no-results',
      label: '🟡 Inicio de jornada',
      lastRace: 0,
      totalRaces,
      completedRaces: 0,
      progressPercent: 0,
    }
  }

  // Contar carreras con resultados válidos
  const completedRaces = Object.keys(results).filter(raceKey => {
    const race = results[raceKey]
    return race && race.primero && race.primero !== ''
  }).length

  // Detectar la última carrera con resultado
  let lastRace = 0
  if (completedRaces > 0) {
    const raceKeys = Object.keys(results)
      .filter(raceKey => {
        const race = results[raceKey]
        return race && race.primero && race.primero !== ''
      })
      .map(Number)
    lastRace = Math.max(...raceKeys)
  }

  // Calcular porcentaje
  const progressPercent = totalRaces > 0 ? (completedRaces / totalRaces) * 100 : 0

  // Determinar estado
  let status, label
  if (completedRaces === 0) {
    status = 'no-results'
    label = '🟡 Inicio de jornada'
  } else if (completedRaces >= totalRaces) {
    status = 'completed'
    label = '🏁 Jornada finalizada'
  } else {
    status = 'in-progress'
    label = `🟢 Hasta carrera ${lastRace}`
  }

  return {
    status,
    label,
    lastRace,
    totalRaces,
    completedRaces,
    progressPercent,
  }
}

/**
 * Obtener información completa de la campaña para el header
 * @param {Object} campaign - Datos de la campaña
 * @param {Object} program - Datos del programa (hipódromo)
 * @param {string} date - Fecha seleccionada
 * @returns {Object} Información del header
 */
export function getHeaderInfo(campaign, program, date) {
  // Tipo de campaña
  const campaignTypeMap = {
    'diaria': 'Diaria',
    'semanal': 'Semanal',
    'mensual': 'Mensual',
    'daily': 'Diaria',
    'weekly': 'Semanal',
    'monthly': 'Mensual',
  }
  const campaignType = campaignTypeMap[campaign?.type] || campaignTypeMap[campaign?.competitionMode] || 'Diaria'

  // Hipódromo
  const hippodrome = program?.trackName || campaign?.hippodrome || ''
  
  // Fecha formateada
  const formattedDate = date ? formatDate(date) : ''

  return {
    campaignType,
    hippodrome,
    date: formattedDate,
    campaignName: campaign?.name || '',
  }
}

/**
 * Formatear fecha de YYYY-MM-DD a DD-MM-YYYY
 */
function formatDate(dateStr) {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  return `${parts[2]}-${parts[1]}-${parts[0]}`
}

/**
 * Generar texto completo del header
 */
export function generateHeaderText(headerInfo, raceStatus) {
  const parts = ['🏇 Pronósticos']
  
  if (headerInfo.campaignType) {
    parts.push(headerInfo.campaignType)
  }
  
  if (headerInfo.hippodrome) {
    parts.push('– ' + headerInfo.hippodrome)
  }
  
  if (headerInfo.date) {
    parts.push('– ' + headerInfo.date)
  }

  return parts.join(' ')
}
