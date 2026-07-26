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
