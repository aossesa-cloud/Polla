export const ROTATING_DUEL_MODE_ID = 'rotating-head-to-head'

export function isRotatingDuelMode(mode) {
  return String(mode || '') === ROTATING_DUEL_MODE_ID
}

export function extractEventParticipantNames(event) {
  const seen = new Set()
  const names = []

  ;(event?.participants || []).forEach((participant) => {
    const name = String(participant?.name || participant?.index || '').trim()
    const key = normalizeName(name)
    if (!key || seen.has(key)) return
    seen.add(key)
    names.push(name)
  })

  return names
}

export function extractEventRotatingDuelMatchups(event) {
  const matchups = new Map()

  ;(event?.participants || []).forEach((participant) => {
    const player = String(participant?.name || participant?.index || '').trim()
    const opponent = getParticipantDuelOpponent(participant)
    if (!player || !opponent || normalizeName(player) === normalizeName(opponent)) return

    const members = [player, opponent].sort((a, b) => normalizeName(a).localeCompare(normalizeName(b)))
    const id = members.map(normalizeName).join('::')
    if (!id || matchups.has(id)) return

    matchups.set(id, {
      id,
      name: `${members[0]} vs ${members[1]}`,
      members,
      player1: members[0],
      player2: members[1],
      bye: false,
    })
  })

  return Array.from(matchups.values())
}

export function buildRotatingDuelPairs(seedParticipants = [], roundIndex = 0) {
  const participants = uniqueNames(seedParticipants)
  if (participants.length === 0) return []
  if (participants.length === 1) {
    return [{ id: 'duel-bye-1', name: `${participants[0]} libre`, members: [participants[0]], bye: true }]
  }

  const lineup = participants.length % 2 === 0 ? [...participants] : [...participants, null]
  const fixed = lineup[0]
  const rotating = lineup.slice(1)
  const rounds = Math.max(1, lineup.length - 1)
  const offset = normalizeRoundIndex(roundIndex, rounds)
  const rotated = rotating.slice(offset).concat(rotating.slice(0, offset))
  const arranged = [fixed, ...rotated]
  const pairs = []

  for (let index = 0; index < arranged.length / 2; index += 1) {
    const left = arranged[index]
    const right = arranged[arranged.length - 1 - index]
    const members = [left, right].filter(Boolean)
    if (members.length === 0) continue

    pairs.push({
      id: members.map(normalizeName).join('::') || `duel-${index + 1}`,
      name: members.length === 2 ? `${members[0]} vs ${members[1]}` : `${members[0]} libre`,
      members,
      player1: members[0] || '',
      player2: members[1] || '',
      bye: members.length === 1,
    })
  }

  return pairs
}

export function buildRotatingDuelPointEntries({
  seedParticipants = [],
  rawScores = {},
  matchups = [],
  date = '',
  roundIndex = 0,
  winPoints = 3,
  drawPoints = 1,
  byePoints = 0,
} = {}) {
  const scoreMap = normalizeScoreMap(rawScores)
  const manualPairs = buildRotatingDuelPairsFromMatchups(seedParticipants, matchups)
  const pairs = manualPairs.length > 0
    ? manualPairs
    : buildRotatingDuelPairs(seedParticipants, roundIndex)
  const entries = []

  pairs.forEach((pair) => {
    const [player1, player2] = pair.members || []

    if (pair.bye || !player2) {
      entries.push(buildDuelEntry(player1, {
        date,
        score: byePoints,
        rawScore: scoreMap.get(normalizeName(player1)) || 0,
        opponent: '',
        matchup: pair,
        outcome: 'bye',
      }))
      return
    }

    const player1Raw = scoreMap.get(normalizeName(player1)) || 0
    const player2Raw = scoreMap.get(normalizeName(player2)) || 0

    if (player1Raw === player2Raw) {
      entries.push(buildDuelEntry(player1, {
        date,
        score: drawPoints,
        rawScore: player1Raw,
        opponent: player2,
        matchup: pair,
        outcome: 'draw',
      }))
      entries.push(buildDuelEntry(player2, {
        date,
        score: drawPoints,
        rawScore: player2Raw,
        opponent: player1,
        matchup: pair,
        outcome: 'draw',
      }))
      return
    }

    const player1Wins = player1Raw > player2Raw
    entries.push(buildDuelEntry(player1, {
      date,
      score: player1Wins ? winPoints : 0,
      rawScore: player1Raw,
      opponent: player2,
      matchup: pair,
      outcome: player1Wins ? 'win' : 'loss',
    }))
    entries.push(buildDuelEntry(player2, {
      date,
      score: player1Wins ? 0 : winPoints,
      rawScore: player2Raw,
      opponent: player1,
      matchup: pair,
      outcome: player1Wins ? 'loss' : 'win',
    }))
  })

  return entries
}

function buildRotatingDuelPairsFromMatchups(seedParticipants = [], matchups = []) {
  if (!Array.isArray(matchups) || matchups.length === 0) return []

  const participants = uniqueNames([
    ...(seedParticipants || []),
    ...matchups.flatMap((matchup) => normalizeMatchupMembers(matchup)),
  ])
  if (participants.length === 0) return []

  const participantByKey = new Map(participants.map((name) => [normalizeName(name), name]))
  const assigned = new Set()
  const pairs = []

  matchups.forEach((matchup, index) => {
    const members = normalizeMatchupMembers(matchup)
      .map((member) => participantByKey.get(normalizeName(member)) || String(member || '').trim())
      .filter(Boolean)

    const uniqueMembers = uniqueNames(members).slice(0, 2)
    if (uniqueMembers.length < 2) return

    const [player1, player2] = uniqueMembers
    const key1 = normalizeName(player1)
    const key2 = normalizeName(player2)
    if (!key1 || !key2 || key1 === key2 || assigned.has(key1) || assigned.has(key2)) return

    assigned.add(key1)
    assigned.add(key2)
    pairs.push({
      id: String(matchup?.id || `${key1}::${key2}` || `daily-duel-${index + 1}`),
      name: matchup?.name || `${player1} vs ${player2}`,
      members: [player1, player2],
      player1,
      player2,
      bye: false,
    })
  })

  participants.forEach((participant) => {
    const key = normalizeName(participant)
    if (!key || assigned.has(key)) return
    pairs.push({
      id: `duel-bye-${key}`,
      name: `${participant} libre`,
      members: [participant],
      player1: participant,
      player2: '',
      bye: true,
    })
  })

  return pairs
}

function normalizeMatchupMembers(matchup) {
  if (Array.isArray(matchup?.members)) return matchup.members.filter(Boolean)
  return [matchup?.player1, matchup?.player2].filter(Boolean)
}

function getParticipantDuelOpponent(participant) {
  return String(
    participant?.rotatingDuelOpponent ||
    participant?.duelOpponent ||
    participant?.dailyDuelOpponent ||
    ''
  ).trim()
}

function buildDuelEntry(participant, { date, score, rawScore, opponent, matchup, outcome }) {
  const roundedScore = roundScore(score)
  const roundedRawScore = roundScore(rawScore)

  return {
    participant,
    total: roundedScore,
    rawTotal: roundedRawScore,
    duelOpponent: opponent,
    duelOutcome: outcome,
    matchupId: matchup?.id || '',
    matchupName: matchup?.name || '',
    dailyTotals: date ? [{
      date,
      score: roundedScore,
      rawScore: roundedRawScore,
      outcome,
      opponent,
      matchupId: matchup?.id || '',
      matchupName: matchup?.name || '',
    }] : [],
  }
}

function normalizeScoreMap(rawScores) {
  const map = new Map()

  if (rawScores instanceof Map) {
    rawScores.forEach((score, name) => {
      map.set(normalizeName(name), Number(score || 0))
    })
    return map
  }

  Object.entries(rawScores || {}).forEach(([name, score]) => {
    map.set(normalizeName(name), Number(score || 0))
  })

  return map
}

function uniqueNames(values = []) {
  const seen = new Set()
  return (values || [])
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .filter((value) => {
      const key = normalizeName(value)
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
}

function normalizeRoundIndex(value, rounds) {
  const numeric = Number(value || 0)
  if (!Number.isFinite(numeric) || rounds <= 0) return 0
  return ((Math.round(numeric) % rounds) + rounds) % rounds
}

function normalizeName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function roundScore(value) {
  return Math.round(Number(value || 0) * 100) / 100
}
