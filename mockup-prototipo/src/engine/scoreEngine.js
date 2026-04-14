/**
 * scoreEngine.js
 * 
 * Motor de puntaje: idéntico para TODOS los modos de competencia.
 * No sabe nada de grupos, parejas ni eliminación.
 * Solo calcula: picks + resultados → puntajes.
 */

/**
 * Calcula puntajes diarios para todos los participantes.
 * 
 * @param {Array} picks - [{ participant, picks: [horse, ...] }]
 * @param {Object} results - { "1": { first, second, third, ... }, "2": ... }
 * @param {Object} scoringConfig - { mode, points, doubleLastRace }
 * @returns {Object} scores - { participantName: score }
 */
export function calculateDailyScores(picks, results, scoringConfig) {
  const scores = {}
  const totalRaces = picks[0]?.picks?.length || 0

  for (const entry of picks) {
    let score = 0
    const picksList = entry.picks || []

    for (let raceNum = 1; raceNum <= picksList.length; raceNum++) {
      const pick = normalizePickValue(picksList[raceNum - 1])
      const result = results[String(raceNum)]
      if (!result || !pick) continue

      score += calculatePickScore(pick, result, raceNum, totalRaces, scoringConfig)
    }

    scores[entry.participant] = Math.round(score * 100) / 100
  }

  return scores
}

/**
 * Calcula el puntaje de un pick individual vs un resultado.
 */
function calculatePickScore(pick, result, raceNum, totalRaces, scoringConfig) {
  const { mode, points, doubleLastRace } = scoringConfig || {}

  if (mode === 'points') {
    return calculatePointsScore(pick, result, points)
  }

  // Modo dividendo (default)
  let score = calculateDividendScore(pick, result)
  if (doubleLastRace && raceNum === totalRaces) {
    score *= 2
  }
  return score
}

/**
 * Scoring por puntos fijos.
 */
function calculatePointsScore(pick, result, points = {}) {
  const { first = 10, second = 5, third = 1, exclusiveFirst = 20 } = points
  const picked = String(pick)
  const firstPlace = String(result.first || result.primero || '')
  const secondPlace = String(result.second || result.segundo || '')
  const thirdPlace = String(result.third || result.tercero || '')

  // Exclusivo: solo acertó al primero y nadie más
  if (picked === firstPlace && picked !== secondPlace && picked !== thirdPlace) {
    return exclusiveFirst
  }

  if (picked === firstPlace) return first
  if (picked === secondPlace) return second
  if (picked === thirdPlace) return third
  return 0
}

/**
 * Scoring por dividendos.
 */
function calculateDividendScore(pick, result) {
  const picked = String(pick)
  const firstPlace = String(result.first || result.primero || '')
  const secondPlace = String(result.second || result.segundo || '')
  const thirdPlace = String(result.third || result.tercero || '')

  const divGanador = parseDividend(result.ganador || result.dividends?.winner)
  const div2del1 = parseDividend(result.divSegundoPrimero || result.divSegundo || result.dividends?.place2_from1)
  const div3del1 = parseDividend(result.divTerceroPrimero || result.divTercero || result.dividends?.place3_from1)
  const div2 = parseDividend(result.divSegundo || result.dividends?.place2)
  const div3del2 = parseDividend(result.divTerceroSegundo || result.dividends?.place3_from2)
  const div3 = parseDividend(result.divTercero || result.dividends?.place3)

  if (picked === firstPlace) {
    return divGanador + div2del1 + div3del1
  }
  if (picked === secondPlace) {
    return div2 + div3del2
  }
  if (picked === thirdPlace) {
    return div3
  }
  return 0
}

function parseDividend(value) {
  if (value === undefined || value === null) return 0
  const num = typeof value === 'string' ? parseFloat(value.replace(/\./g, '').replace(',', '.')) : Number(value)
  return isNaN(num) ? 0 : num
}

function normalizePickValue(pick) {
  if (pick === undefined || pick === null) return null
  if (typeof pick === 'object') {
    return pick.horse ?? pick.number ?? pick.pick ?? pick.value ?? null
  }
  return pick
}

/**
 * Calcula rankings diarios con posición.
 */
export function buildDailyRanking(picks, results, scoringConfig) {
  const scores = calculateDailyScores(picks, results, scoringConfig)

  return Object.entries(scores)
    .map(([participant, score]) => ({ participant, score }))
    .sort((a, b) => b.score - a.score)
    .map((entry, i) => ({ ...entry, position: i + 1 }))
}
