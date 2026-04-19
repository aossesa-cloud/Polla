/**
 * raceStatus.js
 *
 * Detecta estado de jornada segun resultados disponibles.
 */

/**
 * @param {Object} results Objeto de resultados por carrera
 * @param {number} totalRaces Numero total esperado de carreras
 */
export function detectRaceStatus(results, totalRaces) {
  const normalizedTotalRaces = Number.isFinite(Number(totalRaces))
    ? Number(totalRaces)
    : 0

  if (!results || typeof results !== 'object') {
    return {
      status: 'no-results',
      label: '🟡 Inicio de jornada',
      lastRace: 0,
      totalRaces: normalizedTotalRaces,
      completedRaces: 0,
      progressPercent: 0,
    }
  }

  const completedRaces = Object.keys(results).filter((raceKey) => {
    const race = results[raceKey]
    return race && race.primero && race.primero !== ''
  }).length

  let lastRace = 0
  if (completedRaces > 0) {
    const raceKeys = Object.keys(results)
      .filter((raceKey) => {
        const race = results[raceKey]
        return race && race.primero && race.primero !== ''
      })
      .map(Number)
    lastRace = Math.max(...raceKeys)
  }

  const progressPercent = normalizedTotalRaces > 0
    ? (completedRaces / normalizedTotalRaces) * 100
    : 0

  let status
  let label
  if (completedRaces === 0) {
    status = 'no-results'
    label = '🟡 Inicio de jornada'
  } else if (normalizedTotalRaces > 0 && completedRaces >= normalizedTotalRaces) {
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
    totalRaces: normalizedTotalRaces,
    completedRaces,
    progressPercent,
  }
}

export function getHeaderInfo(campaign, program, date) {
  const campaignTypeMap = {
    diaria: 'Diaria',
    semanal: 'Semanal',
    mensual: 'Mensual',
    daily: 'Diaria',
    weekly: 'Semanal',
    monthly: 'Mensual',
  }

  const campaignType = campaignTypeMap[campaign?.type] || campaignTypeMap[campaign?.competitionMode] || 'Diaria'
  const hippodrome = program?.trackName || campaign?.hippodrome || ''
  const formattedDate = date ? formatDate(date) : ''

  return {
    campaignType,
    hippodrome,
    date: formattedDate,
    campaignName: campaign?.name || '',
  }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  return `${parts[2]}-${parts[1]}-${parts[0]}`
}

export function generateHeaderText(headerInfo) {
  const parts = ['🏇 Pronósticos']

  if (headerInfo.campaignType) {
    parts.push(headerInfo.campaignType)
  }

  if (headerInfo.hippodrome) {
    parts.push(`– ${headerInfo.hippodrome}`)
  }

  if (headerInfo.date) {
    parts.push(`– ${headerInfo.date}`)
  }

  return parts.join(' ')
}
