/**
 * scoreEngine.js
 *
 * Motor de puntaje: identico para TODOS los modos de competencia.
 * No sabe nada de grupos, parejas ni eliminacion.
 * Solo calcula: picks + resultados -> puntajes.
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
  const totalRaces = resolveScoringRaceCount(picks, results, scoringConfig)

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

function resolveScoringRaceCount(picks, results, scoringConfig) {
  const resultsRaceCount = Math.max(
    0,
    ...Object.entries(results || {}).map(([key, race]) => Number(race?.race || key) || 0),
  )

  const pickRaceCount = Math.max(
    0,
    ...(picks || []).map((entry) => getMeaningfulPickCount(entry?.picks)),
  )

  const configuredRaceCount = Number(scoringConfig?.raceCount || 0)

  if (resultsRaceCount > 0) {
    return Math.max(resultsRaceCount, pickRaceCount)
  }

  return Math.max(configuredRaceCount, pickRaceCount, 0)
}

function getMeaningfulPickCount(picks) {
  if (!Array.isArray(picks)) return 0

  for (let index = picks.length - 1; index >= 0; index -= 1) {
    const normalized = normalizePickValue(picks[index])
    if (normalized !== undefined && normalized !== null && String(normalized).trim() !== '') {
      return index + 1
    }
  }

  return 0
}

function calculatePickScore(pick, result, raceNum, totalRaces, scoringConfig) {
  const { mode, points, doubleLastRace } = scoringConfig || {}
  const effectivePick = resolveEffectivePick(pick, result)

  if (mode === 'points') {
    return calculatePointsScore(effectivePick, result, points)
  }

  let score = calculateDividendScore(effectivePick, result)
  if (doubleLastRace && raceNum === totalRaces) {
    score *= 2
  }
  return score
}

function calculatePointsScore(pick, result, points = {}) {
  const { first = 10, second = 5, third = 1, exclusiveFirst = 20 } = points
  const picked = String(pick)

  const firstPlace = result.first || result.primero || ''
  const tiedFirstPlace = result.empatePrimero || ''
  const secondPlace = result.second || result.segundo || ''
  const tiedSecondPlace = result.empateSegundo || ''
  const thirdPlace = result.third || result.tercero || ''
  const tiedThirdPlace = result.empateTercero || ''

  const isFirst = isPickMatchingPosition(picked, firstPlace)
  const isTiedFirst = isPickMatchingPosition(picked, tiedFirstPlace)
  const isSecond = isPickMatchingPosition(picked, secondPlace)
  const isTiedSecond = isPickMatchingPosition(picked, tiedSecondPlace)
  const isThird = isPickMatchingPosition(picked, thirdPlace)
  const isTiedThird = isPickMatchingPosition(picked, tiedThirdPlace)

  if (
    isFirst &&
    !isTiedFirst &&
    !isSecond &&
    !isTiedSecond &&
    !isThird &&
    !isTiedThird
  ) {
    return exclusiveFirst
  }

  if (isFirst || isTiedFirst) return first
  if (isSecond || isTiedSecond) return second
  if (isThird || isTiedThird) return third
  return 0
}

function calculateDividendScore(pick, result) {
  const picked = String(pick)

  const firstPlace = result.first || result.primero || ''
  const tiedFirstPlace = result.empatePrimero || ''
  const secondPlace = result.second || result.segundo || ''
  const tiedSecondPlace = result.empateSegundo || ''
  const thirdPlace = result.third || result.tercero || ''
  const tiedThirdPlace = result.empateTercero || ''

  const divGanador = parseDividend(result.ganador || result.dividends?.winner)
  const div2del1 = parseDividend(result.divSegundoPrimero || result.divSegundo || result.dividends?.place2_from1)
  const div3del1 = parseDividend(result.divTerceroPrimero || result.divTercero || result.dividends?.place3_from1)
  const tiedDivGanador = parseDividend(result.empatePrimeroGanador || result.ganador || result.dividends?.winner)
  const tiedDiv2del1 = parseDividend(result.empatePrimeroDivSegundo || result.divSegundoPrimero || result.divSegundo || result.dividends?.place2_from1)
  const tiedDiv3del1 = parseDividend(result.empatePrimeroDivTercero || result.divTerceroPrimero || result.divTercero || result.dividends?.place3_from1)
  const div2 = parseDividend(result.divSegundo || result.dividends?.place2)
  const div3del2 = parseDividend(result.divTerceroSegundo || result.dividends?.place3_from2)
  const tiedDiv2 = parseDividend(result.empateSegundoDivSegundo || result.divSegundo || result.dividends?.place2)
  const tiedDiv3del2 = parseDividend(result.empateSegundoDivTercero || result.divTerceroSegundo || result.divTercero || result.dividends?.place3_from2)
  const div3 = parseDividend(result.divTercero || result.dividends?.place3)
  const tiedDiv3 = parseDividend(result.empateTerceroDivTercero || result.divTercero || result.dividends?.place3)

  if (isPickMatchingPosition(picked, firstPlace)) {
    return divGanador + div2del1 + div3del1
  }
  if (isPickMatchingPosition(picked, tiedFirstPlace)) {
    return tiedDivGanador + tiedDiv2del1 + tiedDiv3del1
  }
  if (isPickMatchingPosition(picked, secondPlace)) {
    return div2 + div3del2
  }
  if (isPickMatchingPosition(picked, tiedSecondPlace)) {
    return tiedDiv2 + tiedDiv3del2
  }
  if (isPickMatchingPosition(picked, thirdPlace)) {
    return div3
  }
  if (isPickMatchingPosition(picked, tiedThirdPlace)) {
    return tiedDiv3
  }
  return 0
}

function parseDividend(value) {
  if (value === undefined || value === null) return 0
  const normalized = normalizeDividendToken(value)
  const num = Number(normalized)
  return isNaN(num) ? 0 : num
}

function normalizeDividendToken(value) {
  if (typeof value === 'number') return value
  if (typeof value !== 'string') return value
  const raw = value.trim()
  if (!raw) return 0

  // Si viene "1,3 / 1,30" o similares, tomamos el primer token numerico.
  const firstChunk = raw.split('/')[0]?.trim() || raw
  if (firstChunk.includes(',')) {
    const asCommaDecimal = Number(firstChunk.replace(/\./g, '').replace(',', '.'))
    if (Number.isFinite(asCommaDecimal)) return asCommaDecimal
  }
  const direct = Number(firstChunk)
  if (Number.isFinite(direct)) return direct

  const numericMatch = firstChunk.match(/-?\d+(?:[.,]\d+)?/)
  if (!numericMatch) return 0
  return Number(numericMatch[0].replace(',', '.'))
}

function normalizePickValue(pick) {
  if (pick === undefined || pick === null) return null
  if (typeof pick === 'object') {
    return pick.horse ?? pick.number ?? pick.pick ?? pick.value ?? null
  }
  return pick
}

export function resolveEffectivePick(pick, result) {
  const normalizedPick = normalizePickValue(pick)
  if (normalizedPick === undefined || normalizedPick === null || normalizedPick === '') {
    return normalizedPick
  }

  const withdrawals = [
    ...(Array.isArray(result?.retiros) ? result.retiros : []),
    ...(Array.isArray(result?.withdrawals) ? result.withdrawals : []),
    result?.retiro1,
    result?.retiro2,
  ]
    .filter(Boolean)
    .map((item) => {
      if (typeof item === 'object') {
        return String(item.number ?? item.numero ?? item.id ?? '').trim()
      }
      return String(item).trim()
    })
    .filter(Boolean)

  const normalizedPickText = String(normalizedPick).trim()
  const isWithdrawal = withdrawals.includes(normalizedPickText)
  if (!isWithdrawal) return normalizedPick

  const favorite = result?.favorito || result?.favorite?.number || result?.favorite
  return favorite ? String(favorite).trim() : normalizedPick
}

function extractPositionTokens(positionValue) {
  if (positionValue === undefined || positionValue === null) return []
  if (Array.isArray(positionValue)) {
    return positionValue.flatMap(extractPositionTokens)
  }
  if (typeof positionValue === 'object') {
    return extractPositionTokens(
      positionValue.number
      ?? positionValue.horse
      ?? positionValue.pick
      ?? positionValue.value
      ?? ''
    )
  }

  const text = String(positionValue).trim()
  if (!text) return []

  // Soporta "5 / 6", "5 - Nombre / 6 - Nombre", etc.
  const numericTokens = text.match(/\d+/g)
  if (numericTokens && numericTokens.length > 0) {
    return [...new Set(numericTokens.map((token) => String(token).trim()).filter(Boolean))]
  }

  return text
    .split('/')
    .map((token) => token.trim())
    .filter(Boolean)
}

export function isPickMatchingPosition(pick, positionValue) {
  const pickToken = String(pick ?? '').trim()
  if (!pickToken) return false
  const tokens = extractPositionTokens(positionValue)
  return tokens.includes(pickToken)
}

export function enrichPicksWithScores(picks, results, scoringConfig) {
  const totalRaces = resolveScoringRaceCount(picks, results, scoringConfig)
  const mode = scoringConfig?.mode || 'dividend'

  return (picks || []).map(entry => {
    const picksList = Array.isArray(entry.picks) ? entry.picks : []
    const enrichedPicks = picksList.map((pickItem, idx) => {
      const raceNum = idx + 1
      const rawPick = normalizePickValue(pickItem)
      const horse = String(
        (typeof pickItem === 'object' ? (pickItem?.horse ?? pickItem?.pick ?? rawPick) : rawPick) ?? ''
      ).trim()

      const result = results?.[String(raceNum)]
      if (!result || rawPick === null || rawPick === undefined || rawPick === '') {
        return { horse, score: 0 }
      }

      const effectivePick = resolveEffectivePick(rawPick, result)
      let score = mode === 'points'
        ? calculatePointsScore(String(effectivePick ?? ''), result, scoringConfig?.points)
        : calculateDividendScore(String(effectivePick ?? ''), result)

      if (scoringConfig?.doubleLastRace !== false && raceNum === totalRaces) {
        score *= 2
      }

      return { horse, score: score ? Math.round(score * 100) / 100 : 0 }
    })

    return { ...entry, picks: enrichedPicks }
  })
}

export function buildDailyRanking(picks, results, scoringConfig) {
  const scores = calculateDailyScores(picks, results, scoringConfig)

  return Object.entries(scores)
    .map(([participant, score]) => ({ participant, score }))
    .sort((a, b) => b.score - a.score)
    .map((entry, i) => ({ ...entry, position: i + 1 }))
}
