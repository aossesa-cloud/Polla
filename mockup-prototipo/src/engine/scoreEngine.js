import { resolveScoringConfig, shouldDoubleLastRace } from '../services/scoringConfig'

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
  const winnerSelectionCounts = calculateWinnerSelectionCounts(picks, results)
  const secondSelectionCounts = calculateSecondSelectionCounts(picks, results)

  for (const entry of picks) {
    let score = 0
    const picksList = entry.picks || []
    const entryScoringConfig = entry?.scoring
      ? resolveScoringConfig(scoringConfig, entry.scoring)
      : scoringConfig

    for (let raceNum = 1; raceNum <= picksList.length; raceNum++) {
      const pick = normalizePickValue(picksList[raceNum - 1])
      const result = results[String(raceNum)]
      if (!result || !pick) continue

      const effectivePick = resolveEffectivePick(pick, result)
      const isExclusiveFirst = isExclusiveWinnerPick(
        winnerSelectionCounts,
        raceNum,
        effectivePick,
        result,
      )
      const isExclusiveSecond = isExclusiveSecondPlacePick(
        secondSelectionCounts,
        raceNum,
        effectivePick,
        result,
      )
      score += calculatePickScore(
        pick,
        result,
        raceNum,
        totalRaces,
        entryScoringConfig,
        isExclusiveFirst,
        isExclusiveSecond,
      )
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

function calculatePickScore(
  pick,
  result,
  raceNum,
  totalRaces,
  scoringConfig,
  isExclusiveFirst = false,
  isExclusiveSecond = false,
) {
  const { mode, points, doubleLastRace } = scoringConfig || {}
  const effectivePick = resolveEffectivePick(pick, result)

  if (mode === 'points') {
    return calculatePointsScore(effectivePick, result, points, isExclusiveFirst, isExclusiveSecond)
  }

  let score = calculateDividendScore(effectivePick, result)
  if (shouldDoubleLastRace({ mode, doubleLastRace }) && raceNum === totalRaces) {
    score *= 2
  }
  return score
}

function calculatePointsScore(pick, result, points = {}, isExclusiveFirst = false, isExclusiveSecond = false) {
  const { first = 10, second = 5, third = 1, exclusiveFirst = 20 } = points
  const exclusiveSecond = points?.exclusiveSecond ?? second
  const scoreKind = getPointsScoreKind(pick, result, isExclusiveFirst, isExclusiveSecond)
  const firstDividendBonus = scoreKind === 'exclusiveFirst' || scoreKind === 'first'
    ? getFirstDividendBonus(pick, result)
    : 0

  if (scoreKind === 'exclusiveFirst') return Number(exclusiveFirst) + firstDividendBonus
  if (scoreKind === 'exclusiveSecond') return Number(exclusiveSecond)
  if (scoreKind === 'first') return Number(first) + firstDividendBonus
  if (scoreKind === 'second') return Number(second)
  if (scoreKind === 'third') return Number(third)
  return 0
}

function getFirstDividendBonus(pick, result) {
  return getWinnerDividendForPick(pick, result) > 10 ? 3 : 0
}

function getWinnerDividendForPick(pick, result) {
  if (!result || typeof result !== 'object') return 0

  const firstPlaces = [...new Set(extractLeadingPositionTokens([result.first, result.primero, result.winner?.number]))]
  const tiedFirstPlaces = extractLeadingPositionTokens(result.empatePrimero)
  const pickToken = String(pick ?? '').trim()
  if (tiedFirstPlaces.includes(pickToken)) {
    const tiedDividend = hasDividendValue(result.empatePrimeroGanador)
      ? result.empatePrimeroGanador
      : getWinnerDividendValue(result)
    const tieOffset = hasDividendValue(result.empatePrimeroGanador) ? 0 : 1
    return parseDividend(tiedDividend, Math.max(0, tieOffset + tiedFirstPlaces.indexOf(pickToken)))
  }

  if (!firstPlaces.includes(pickToken)) return 0
  const tokenIndex = Math.max(0, firstPlaces.indexOf(pickToken))
  return parseDividend(getWinnerDividendValue(result), tokenIndex)
}

function getWinnerDividendValue(result) {
  if (hasDividendValue(result?.ganador)) return result.ganador
  if (hasDividendValue(result?.winner?.dividend)) return result.winner.dividend
  return result?.dividends?.winner
}

function extractLeadingPositionTokens(value) {
  if (Array.isArray(value)) return value.flatMap(extractLeadingPositionTokens)
  if (value && typeof value === 'object') {
    return extractLeadingPositionTokens(value.number ?? value.horse ?? value.pick ?? value.value ?? '')
  }

  const text = String(value ?? '').trim()
  if (!text) return []
  const parts = text.split('/')
  const leading = parts
    .map((part) => part.trim().match(/^(\d+)/)?.[1])
    .filter(Boolean)
  if (leading.length === parts.length) return [...new Set(leading)]
  return extractPositionTokens(value)
}

export function getPointsScoreKind(
  pick,
  result,
  isExclusiveFirst = false,
  isExclusiveSecond = false,
) {
  if (!result || typeof result !== 'object') return null
  const picked = String(pick ?? '')

  const firstPlace = [result.first, result.primero, result.winner?.number]
  const tiedFirstPlace = result.empatePrimero || ''
  const secondPlace = [result.second, result.segundo]
  const tiedSecondPlace = result.empateSegundo || ''
  const thirdPlace = [result.third, result.tercero]
  const tiedThirdPlace = result.empateTercero || ''

  const isFirst = isPickMatchingPosition(picked, firstPlace)
  const isTiedFirst = isPickMatchingPosition(picked, tiedFirstPlace)
  const isSecond = isPickMatchingPosition(picked, secondPlace)
  const isTiedSecond = isPickMatchingPosition(picked, tiedSecondPlace)
  const isThird = isPickMatchingPosition(picked, thirdPlace)
  const isTiedThird = isPickMatchingPosition(picked, tiedThirdPlace)

  if (isFirst || isTiedFirst) return isExclusiveFirst ? 'exclusiveFirst' : 'first'
  if (isSecond || isTiedSecond) return isExclusiveSecond ? 'exclusiveSecond' : 'second'
  if (isThird || isTiedThird) return 'third'
  return null
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
  const tiedDivGanador = parseDividendOrFallback(result.empatePrimeroGanador, result.ganador || result.dividends?.winner, 1)
  const tiedDiv2del1 = parseDividendOrFallback(result.empatePrimeroDivSegundo, result.divSegundoPrimero || result.divSegundo || result.dividends?.place2_from1, 1)
  const tiedDiv3del1 = parseDividendOrFallback(result.empatePrimeroDivTercero, result.divTerceroPrimero || result.divTercero || result.dividends?.place3_from1, 1)
  const div2 = parseDividend(result.divSegundo || result.dividends?.place2)
  const div3del2 = parseDividend(result.divTerceroSegundo || result.dividends?.place3_from2)
  const tiedDiv2 = parseDividendOrFallback(result.empateSegundoDivSegundo, result.divSegundo || result.dividends?.place2, 1)
  const tiedDiv3del2 = parseDividendOrFallback(result.empateSegundoDivTercero, result.divTerceroSegundo || result.divTercero || result.dividends?.place3_from2, 1)
  const div3 = parseDividend(result.divTercero || result.dividends?.place3)
  const tiedDiv3 = parseDividendOrFallback(result.empateTerceroDivTercero, result.divTercero || result.dividends?.place3, 1)

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

function parseDividendOrFallback(value, fallback, fallbackTokenIndex = 0) {
  if (hasDividendValue(value)) {
    return parseDividend(value)
  }
  return parseDividend(fallback, fallbackTokenIndex)
}

function hasDividendValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== ''
}

function parseDividend(value, tokenIndex = 0) {
  if (value === undefined || value === null) return 0
  const normalized = normalizeDividendToken(value, tokenIndex)
  const num = Number(normalized)
  return Number.isFinite(num) ? num : 0
}

function normalizeDividendToken(value, tokenIndex = 0) {
  if (typeof value === 'number') return value
  if (typeof value !== 'string') return value
  const raw = value.trim()
  if (!raw) return 0

  const chunks = raw.split('/').map((chunk) => chunk.trim()).filter(Boolean)
  const selectedChunk = chunks.length > 1 ? (chunks[tokenIndex] || chunks[0]) : raw
  if (selectedChunk.includes(',')) {
    const asCommaDecimal = Number(selectedChunk.replace(/\./g, '').replace(',', '.'))
    if (Number.isFinite(asCommaDecimal)) return asCommaDecimal
  }
  const direct = Number(selectedChunk)
  if (Number.isFinite(direct)) return direct

  const numericMatch = selectedChunk.match(/-?\d+(?:[.,]\d+)?/)
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
    .flatMap((item) => {
      if (typeof item === 'object') {
        return extractPositionTokens(item.number ?? item.numero ?? item.id ?? '')
      }
      return extractPositionTokens(item)
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

function getWinningHorseTokens(result) {
  return [...new Set([
    ...extractPositionTokens([result?.first, result?.primero, result?.winner?.number]),
    ...extractPositionTokens(result?.empatePrimero ?? ''),
  ])]
}

function getSecondPlaceHorseTokens(result) {
  return [...new Set([
    ...extractPositionTokens(result?.second || result?.segundo || ''),
    ...extractPositionTokens(result?.empateSegundo ?? ''),
  ])]
}

function getParticipantIdentity(entry, entryIndex) {
  const providedIdentity = entry?.participant ?? entry?.name
  if (providedIdentity !== undefined && providedIdentity !== null && String(providedIdentity).trim()) {
    return `name:${String(providedIdentity)
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()}`
  }
  if (entry?.index !== undefined && entry?.index !== null) return `index:${entry.index}`
  return `row:${entryIndex}`
}

export function calculateWinnerSelectionCounts(picks = [], results = {}) {
  return calculatePositionSelectionCounts(picks, results, getWinningHorseTokens)
}

export function calculateSecondSelectionCounts(picks = [], results = {}) {
  return calculatePositionSelectionCounts(picks, results, getSecondPlaceHorseTokens)
}

function calculatePositionSelectionCounts(picks = [], results = {}, getPositionHorseTokens) {
  const counts = new Map()

  for (const [entryIndex, entry] of (picks || []).entries()) {
    const picksList = Array.isArray(entry?.picks) ? entry.picks : []
    const participantIdentity = getParticipantIdentity(entry, entryIndex)

    for (let raceNum = 1; raceNum <= picksList.length; raceNum += 1) {
      const result = results?.[String(raceNum)] || results?.[raceNum]
      if (!result) continue

      const rawPick = normalizePickValue(picksList[raceNum - 1])
      if (rawPick === undefined || rawPick === null || rawPick === '') continue

      const effectivePick = String(resolveEffectivePick(rawPick, result) ?? '').trim()
      if (!effectivePick || !getPositionHorseTokens(result).includes(effectivePick)) continue

      if (!counts.has(String(raceNum))) counts.set(String(raceNum), new Map())
      const raceCounts = counts.get(String(raceNum))
      if (!raceCounts.has(effectivePick)) raceCounts.set(effectivePick, new Set())
      raceCounts.get(effectivePick).add(participantIdentity)
    }
  }

  return counts
}

function isExclusiveWinnerPick(winnerSelectionCounts, raceNum, effectivePick, result) {
  return isExclusivePositionPick(
    winnerSelectionCounts,
    raceNum,
    effectivePick,
    result,
    getWinningHorseTokens,
  )
}

function isExclusiveSecondPlacePick(secondSelectionCounts, raceNum, effectivePick, result) {
  return isExclusivePositionPick(
    secondSelectionCounts,
    raceNum,
    effectivePick,
    result,
    getSecondPlaceHorseTokens,
  )
}

function isExclusivePositionPick(selectionCounts, raceNum, effectivePick, result, getPositionHorseTokens) {
  const horse = String(effectivePick ?? '').trim()
  if (!horse || !getPositionHorseTokens(result).includes(horse)) return false
  return selectionCounts.get(String(raceNum))?.get(horse)?.size === 1
}

export function calculateWinnerHitCounts(picks = [], results = {}) {
  const counts = {}

  for (const entry of picks || []) {
    const participant = entry?.participant
    if (!participant) continue

    let hits = 0
    const picksList = Array.isArray(entry?.picks) ? entry.picks : []

    for (let raceNum = 1; raceNum <= picksList.length; raceNum += 1) {
      const rawPick = normalizePickValue(picksList[raceNum - 1])
      if (rawPick === undefined || rawPick === null || rawPick === '') continue

      const result = results?.[String(raceNum)] || results?.[raceNum]
      if (!result) continue

      const effectivePick = resolveEffectivePick(rawPick, result)
      const firstPlace = result.first || result.primero || result.winner?.number || ''
      const tiedFirstPlace = result.empatePrimero || ''
      if (
        isPickMatchingPosition(effectivePick, firstPlace) ||
        isPickMatchingPosition(effectivePick, tiedFirstPlace)
      ) {
        hits += 1
      }
    }

    counts[participant] = hits
  }

  return counts
}

export function enrichPicksWithScores(picks, results, scoringConfig) {
  const totalRaces = resolveScoringRaceCount(picks, results, scoringConfig)
  const winnerSelectionCounts = calculateWinnerSelectionCounts(picks, results)
  const secondSelectionCounts = calculateSecondSelectionCounts(picks, results)

  return (picks || []).map(entry => {
    const entryScoringConfig = entry?.scoring
      ? resolveScoringConfig(scoringConfig, entry.scoring)
      : scoringConfig
    const mode = entryScoringConfig?.mode || 'dividend'
    const picksList = Array.isArray(entry.picks) ? entry.picks : []
    const enrichedPicks = picksList.map((pickItem, idx) => {
      const raceNum = idx + 1
      const rawPick = normalizePickValue(pickItem)
      const horse = String(
        (typeof pickItem === 'object' ? (pickItem?.horse ?? pickItem?.pick ?? rawPick) : rawPick) ?? ''
      ).trim()

      const result = results?.[String(raceNum)]
      if (!result || rawPick === null || rawPick === undefined || rawPick === '') {
        return {
          ...(typeof pickItem === 'object' && pickItem ? pickItem : {}),
          horse,
          score: 0,
          scoreKind: null,
        }
      }

      const effectivePick = resolveEffectivePick(rawPick, result)
      const isExclusiveFirst = isExclusiveWinnerPick(
        winnerSelectionCounts,
        raceNum,
        effectivePick,
        result,
      )
      const isExclusiveSecond = isExclusiveSecondPlacePick(
        secondSelectionCounts,
        raceNum,
        effectivePick,
        result,
      )
      const scoreKind = mode === 'points'
        ? getPointsScoreKind(String(effectivePick ?? ''), result, isExclusiveFirst, isExclusiveSecond)
        : null
      let score = mode === 'points'
        ? calculatePointsScore(
          String(effectivePick ?? ''),
          result,
          entryScoringConfig?.points,
          isExclusiveFirst,
          isExclusiveSecond,
        )
        : calculateDividendScore(String(effectivePick ?? ''), result)

      if (shouldDoubleLastRace(entryScoringConfig) && raceNum === totalRaces) {
        score *= 2
      }

      return {
        ...(typeof pickItem === 'object' && pickItem ? pickItem : {}),
        horse,
        score: score ? Math.round(score * 100) / 100 : 0,
        scoreKind,
      }
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
