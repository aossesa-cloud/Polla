/**
 * accumulator.js
 * 
 * Acumulador de rankings: idéntico para TODOS los modos.
 * Toma rankings diarios y los acumula por participante.
 */

/**
 * Acumula rankings de múltiples días.
 * 
 * @param {Array} dailyRankingsList - [{ date, participant, score, position }, ...]
 * @returns {Array} accumulated - [{ participant, total, daily: [{date, score}], position }]
 */
export function accumulateRankings(dailyRankingsList) {
  const accumulated = {}

  for (const entry of dailyRankingsList) {
    if (!accumulated[entry.participant]) {
      accumulated[entry.participant] = {
        participant: entry.participant,
        total: 0,
        daily: []
      }
    }
    accumulated[entry.participant].total += entry.score
    accumulated[entry.participant].daily.push({
      date: entry.date,
      score: entry.score,
      position: entry.position
    })
  }

  return Object.values(accumulated)
    .sort((a, b) => b.total - a.total)
    .map((entry, i) => ({ ...entry, position: i + 1 }))
}

/**
 * Combina scores diarios + acumulados previos.
 */
export function mergeRankings(dailyRanking, accumulatedRanking) {
  const accMap = new Map(accumulatedRanking.map(r => [r.participant, r.total]))

  return dailyRanking.map(entry => ({
    ...entry,
    accumulatedTotal: accMap.get(entry.participant) || entry.score
  }))
}
