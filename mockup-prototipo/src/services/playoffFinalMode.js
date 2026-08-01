export const PLAYOFF_FINAL_MODE_ID = 'playoff-final'
export const GROUP_PLAYOFF_FINAL_MODE_ID = 'group-playoff-final'
export const DEFAULT_PLAYOFF_DAYS = ['Viernes']
export const DEFAULT_FINAL_DAYS = ['Sabado']
export const DEFAULT_DIRECT_QUALIFIERS = 2
export const DEFAULT_ELIMINATED_BEFORE_PLAYOFF = 2

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado']

export function isPlayoffFinalMode(mode) {
  const normalized = String(mode || '')
  return normalized === PLAYOFF_FINAL_MODE_ID || normalized === GROUP_PLAYOFF_FINAL_MODE_ID
}

export function isGroupedPlayoffFinalMode(mode) {
  return String(mode || '') === GROUP_PLAYOFF_FINAL_MODE_ID
}

export function normalizePlayoffFinalConfig(source = {}) {
  const modeConfig = source?.modeConfig || {}

  return {
    playoffDays: normalizeStringArray(
      modeConfig.playoffDays ?? source.playoffDays ?? DEFAULT_PLAYOFF_DAYS,
    ),
    finalDays: normalizeStringArray(
      modeConfig.finalDays ?? source.finalDays ?? DEFAULT_FINAL_DAYS,
    ),
    directQualifiersCount: normalizePositiveInteger(
      modeConfig.directQualifiersCount ?? source.directQualifiersCount,
      DEFAULT_DIRECT_QUALIFIERS,
    ),
    eliminatedBeforePlayoffCount: normalizeNonNegativeInteger(
      modeConfig.eliminatedBeforePlayoffCount ?? source.eliminatedBeforePlayoffCount,
      DEFAULT_ELIMINATED_BEFORE_PLAYOFF,
    ),
    groups: resolveGroupedPlayoffGroups(source),
  }
}

export function determinePlayoffFinalStage(date, settings = {}) {
  const config = normalizePlayoffFinalConfig(settings)
  const dayName = getDayNameFromDate(date)

  if (config.finalDays.map(normalizeDayLabel).includes(normalizeDayLabel(dayName))) {
    return 'final'
  }

  if (config.playoffDays.map(normalizeDayLabel).includes(normalizeDayLabel(dayName))) {
    return 'playoff'
  }

  return 'classification'
}

export function splitPlayoffFinalLeaderboard(leaderboard = [], settings = {}) {
  const config = normalizePlayoffFinalConfig(settings)
  const sorted = [...(leaderboard || [])].sort(comparePlayoffFinalEntries)
  const directCount = Math.min(config.directQualifiersCount, sorted.length)
  const direct = sorted.slice(0, directCount)
  const remaining = sorted.slice(directCount)
  const eliminatedCount = Math.min(config.eliminatedBeforePlayoffCount, remaining.length)
  const eliminated = eliminatedCount > 0 ? remaining.slice(-eliminatedCount) : []
  const eliminatedKeys = new Set(eliminated.map((entry) => normalizeName(entry?.participant)))
  const playoff = remaining.filter((entry) => !eliminatedKeys.has(normalizeName(entry?.participant)))

  return {
    direct,
    playoff,
    eliminated,
    directNames: direct.map((entry) => entry.participant).filter(Boolean),
    playoffNames: playoff.map((entry) => entry.participant).filter(Boolean),
    eliminatedNames: eliminated.map((entry) => entry.participant).filter(Boolean),
  }
}

export function buildSingleGroupPlayoffMatchups(playoffEntries = [], directCount = 0) {
  const entries = Array.isArray(playoffEntries) ? playoffEntries : []
  const max = Math.ceil(entries.length / 2)

  return Array.from({ length: max }, (_, index) => {
    const player1Entry = entries[index] || null
    const player2Index = entries.length - 1 - index
    const player2Entry = player2Index !== index ? entries[player2Index] || null : null
    const player1 = player1Entry?.participant || ''
    const player2 = player2Entry?.participant || ''
    const members = [player1, player2].filter(Boolean)

    return {
      id: `playoff-${index + 1}`,
      name: members.length === 2 ? `${members[0]} vs ${members[1]}` : `${members[0] || members[1]} libre`,
      members,
      player1,
      player2,
      player1Group: 'Clasificacion',
      player2Group: 'Clasificacion',
      player1Position: player1 ? directCount + index + 1 : null,
      player2Position: player2 ? directCount + player2Index + 1 : null,
      bye: members.length < 2,
    }
  }).filter((matchup) => matchup.members.length > 0)
}

export function resolveGroupedPlayoffGroups(settings = {}) {
  const modeConfig = settings?.modeConfig || {}
  const storedGroups = modeConfig.groups || settings?.groups || []
  const defaults = [
    { id: 'group-a', name: 'Grupo A', aliases: ['group-a', 'a', 'grupo a', '1'] },
    { id: 'group-b', name: 'Grupo B', aliases: ['group-b', 'b', 'grupo b', '2'] },
  ]
  const used = new Set()

  return defaults.map((base, index) => {
    const storedIndex = (storedGroups || []).findIndex((group, candidateIndex) => {
      if (used.has(candidateIndex)) return false
      const labels = [group?.id, group?.name, String(index + 1)].map(normalizeGroupKey)
      const aliases = base.aliases.map(normalizeGroupKey)
      return labels.some((label) => aliases.includes(label))
    })
    const stored = storedIndex >= 0 ? storedGroups[storedIndex] : ((storedGroups || [])[index] || {})
    if (storedIndex >= 0) used.add(storedIndex)

    return {
      ...stored,
      id: String(stored?.id || base.id),
      name: stored?.name || base.name,
      members: Array.isArray(stored?.members) ? stored.members.filter(Boolean) : [],
    }
  })
}

export function splitGroupedPlayoffFinalLeaderboard(leaderboard = [], settings = {}) {
  const config = normalizePlayoffFinalConfig(settings)
  const groups = resolveGroupedPlayoffGroups(settings)
  const sorted = [...(leaderboard || [])].sort(comparePlayoffFinalEntries)
  const byParticipant = new Map(sorted.map((entry) => [normalizeName(entry?.participant), entry]))

  const groupSplits = groups.map((group, groupIndex) => {
    const memberEntries = (group.members || [])
      .map((member) => byParticipant.get(normalizeName(member)))
      .filter(Boolean)
      .sort(comparePlayoffFinalEntries)

    const entries = memberEntries.length > 0 || groupIndex !== 0
      ? memberEntries
      : sorted

    const directCount = Math.min(config.directQualifiersCount, entries.length)
    const direct = entries.slice(0, directCount)
    const remaining = entries.slice(directCount)
    const eliminatedCount = Math.min(config.eliminatedBeforePlayoffCount, remaining.length)
    const eliminated = eliminatedCount > 0 ? remaining.slice(-eliminatedCount) : []
    const eliminatedKeys = new Set(eliminated.map((entry) => normalizeName(entry?.participant)))
    const playoff = remaining.filter((entry) => !eliminatedKeys.has(normalizeName(entry?.participant)))

    return {
      group,
      direct,
      playoff,
      eliminated,
      directNames: direct.map((entry) => entry.participant).filter(Boolean),
      playoffNames: playoff.map((entry) => entry.participant).filter(Boolean),
      eliminatedNames: eliminated.map((entry) => entry.participant).filter(Boolean),
    }
  })

  const direct = groupSplits.flatMap((split) => split.direct)
  const playoff = groupSplits.flatMap((split) => split.playoff)
  const eliminated = groupSplits.flatMap((split) => split.eliminated)

  return {
    groups: groupSplits,
    direct,
    playoff,
    eliminated,
    matchups: buildCrossGroupPlayoffMatchups(groupSplits),
    directNames: direct.map((entry) => entry.participant).filter(Boolean),
    playoffNames: playoff.map((entry) => entry.participant).filter(Boolean),
    eliminatedNames: eliminated.map((entry) => entry.participant).filter(Boolean),
  }
}

export function getManualPlayoffMatchups(settings = {}, date = '') {
  const dateKey = normalizeDateKey(date)
  if (!dateKey) return []

  const modeConfig = settings?.modeConfig || {}
  const byDate =
    modeConfig.manualPlayoffMatchupsByDate ||
    settings?.manualPlayoffMatchupsByDate ||
    modeConfig.playoffMatchupOverridesByDate ||
    settings?.playoffMatchupOverridesByDate ||
    modeConfig.playoffMatchupsByDate ||
    settings?.playoffMatchupsByDate ||
    {}

  return normalizeManualPlayoffMatchups(byDate?.[dateKey])
}

export function applyPlayoffMatchupOverrides(split = {}, settings = {}, date = '') {
  const manualMatchups = getManualPlayoffMatchups(settings, date)
  if (!manualMatchups.length) return split

  const participantMeta = buildPlayoffParticipantMeta(split)
  const matchups = manualMatchups
    .map((matchup, index) => normalizeManualPlayoffMatchup(matchup, index, participantMeta))
    .filter((matchup) => matchup.members.length > 0)

  if (!matchups.length) return split

  return {
    ...split,
    matchups,
    hasManualMatchups: true,
  }
}

function buildCrossGroupPlayoffMatchups(groupSplits = []) {
  const groupAInfo = groupSplits[0] || {}
  const groupBInfo = groupSplits[1] || {}
  const groupA = groupAInfo.playoff || []
  const groupB = groupBInfo.playoff || []
  const groupADirectCount = Number(groupAInfo.direct?.length || 0)
  const groupBDirectCount = Number(groupBInfo.direct?.length || 0)
  const max = Math.max(groupA.length, groupB.length)

  return Array.from({ length: max }, (_, index) => {
    const groupAEntry = groupA[index] || null
    const groupBIndex = groupB.length - 1 - index
    const groupBEntry = groupB[groupBIndex] || null
    const playerA = groupAEntry?.participant || ''
    const playerB = groupBEntry?.participant || ''
    const members = [playerA, playerB].filter(Boolean)
    const name = members.length === 2 ? `${members[0]} vs ${members[1]}` : `${members[0] || members[1]} libre`

    return {
      id: `group-playoff-${index + 1}`,
      name,
      members,
      player1: members[0] || '',
      player2: members[1] || '',
      player1Group: groupAInfo.group?.name || 'Grupo A',
      player2Group: groupBInfo.group?.name || 'Grupo B',
      player1Position: playerA ? groupADirectCount + index + 1 : null,
      player2Position: playerB ? groupBDirectCount + groupBIndex + 1 : null,
      bye: members.length < 2,
    }
  }).filter((matchup) => matchup.members.length > 0)
}

function normalizeManualPlayoffMatchups(rows) {
  return Array.isArray(rows)
    ? rows.map((row) => (row && typeof row === 'object' ? row : null)).filter(Boolean)
    : []
}

function normalizeManualPlayoffMatchup(row, index, participantMeta) {
  const rawPlayer1 = row.player1 || row.left || row.a || row.members?.[0] || ''
  const rawPlayer2 = row.player2 || row.right || row.b || row.members?.[1] || ''
  const player1 = getCanonicalParticipantName(rawPlayer1, participantMeta)
  const player2 = getCanonicalParticipantName(rawPlayer2, participantMeta)
  const members = uniqueNames([player1, player2])
  const player1Meta = participantMeta.get(normalizeName(members[0])) || {}
  const player2Meta = participantMeta.get(normalizeName(members[1])) || {}

  return {
    id: row.id || `manual-playoff-${index + 1}`,
    name: members.length === 2 ? `${members[0]} vs ${members[1]}` : `${members[0] || ''} libre`,
    members,
    player1: members[0] || '',
    player2: members[1] || '',
    player1Group: row.player1Group || player1Meta.group || '',
    player2Group: row.player2Group || player2Meta.group || '',
    player1Position: row.player1Position ?? player1Meta.position ?? null,
    player2Position: row.player2Position ?? player2Meta.position ?? null,
    bye: members.length < 2,
    manual: true,
  }
}

function buildPlayoffParticipantMeta(split = {}) {
  const byName = new Map()
  const groups = Array.isArray(split?.groups) && split.groups.length > 0
    ? split.groups
    : [
        {
          group: { name: 'Clasificacion' },
          direct: split?.direct || [],
          playoff: split?.playoff || [],
          eliminated: split?.eliminated || [],
        },
      ]

  const addEntry = (entry, groupName, position) => {
    const name = entry?.participant || entry?.name || entry
    const key = normalizeName(name)
    if (!key || byName.has(key)) return
    byName.set(key, {
      name: String(name || '').trim(),
      group: groupName,
      position,
    })
  }

  groups.forEach((splitGroup) => {
    const groupName = splitGroup?.group?.name || 'Clasificacion'
    const direct = splitGroup?.direct || []
    const playoff = splitGroup?.playoff || []
    const eliminated = splitGroup?.eliminated || []

    direct.forEach((entry, index) => addEntry(entry, groupName, index + 1))
    playoff.forEach((entry, index) => addEntry(entry, groupName, direct.length + index + 1))
    eliminated.forEach((entry, index) => addEntry(entry, groupName, direct.length + playoff.length + index + 1))
  })

  ;(split?.matchups || []).forEach((matchup) => {
    const members = matchup?.members || [matchup?.player1, matchup?.player2]
    members.forEach((member, index) => {
      const key = normalizeName(member)
      if (!key || byName.has(key)) return
      byName.set(key, {
        name: String(member || '').trim(),
        group: index === 0 ? matchup?.player1Group : matchup?.player2Group,
        position: index === 0 ? matchup?.player1Position : matchup?.player2Position,
      })
    })
  })

  return byName
}

function getCanonicalParticipantName(value, participantMeta) {
  const key = normalizeName(value)
  if (!key) return ''
  return participantMeta.get(key)?.name || String(value || '').trim()
}

function normalizeDateKey(value) {
  const date = String(value || '').slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : ''
}

function uniqueNames(names = []) {
  const seen = new Set()
  const unique = []

  ;(names || []).forEach((name) => {
    const label = String(name || '').trim()
    const key = normalizeName(label)
    if (!label || seen.has(key)) return
    seen.add(key)
    unique.push(label)
  })

  return unique
}

export function comparePlayoffFinalEntries(left = {}, right = {}) {
  const totalDiff = Number(right?.total || 0) - Number(left?.total || 0)
  if (totalDiff !== 0) return totalDiff

  const rawDiff = Number(right?.rawTotal || 0) - Number(left?.rawTotal || 0)
  if (rawDiff !== 0) return rawDiff

  return String(left?.participant || '').localeCompare(String(right?.participant || ''), 'es')
}

function normalizeGroupKey(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim()
}

export function normalizePlayoffFinalName(value) {
  return normalizeName(value)
}

function getDayNameFromDate(dateStr) {
  const normalizedDate = String(dateStr || '').slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)) return ''
  const date = new Date(`${normalizedDate}T12:00:00`)
  return DAY_NAMES[date.getDay()] || ''
}

function normalizeDayLabel(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '')
    .trim()
}

function normalizeStringArray(value) {
  return Array.isArray(value)
    ? value.map((item) => String(item || '').trim()).filter(Boolean)
    : []
}

function normalizePositiveInteger(value, fallback) {
  const numeric = Number(value)
  return Number.isFinite(numeric) && numeric > 0 ? Math.round(numeric) : fallback
}

function normalizeNonNegativeInteger(value, fallback) {
  const numeric = Number(value)
  return Number.isFinite(numeric) && numeric >= 0 ? Math.round(numeric) : fallback
}

function normalizeName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}
