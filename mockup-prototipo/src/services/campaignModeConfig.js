const DEFAULT_WEEKLY_MODE_CONFIG = {
  format: 'individual',
  activeDays: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  hasFinalStage: false,
  finalDays: [],
  playoffDays: ['Viernes'],
  directQualifiersCount: 2,
  eliminatedBeforePlayoffCount: 2,
  groupCount: 4,
  groupSize: 8,
  qualifiersPerGroup: 4,
  qualifiersByGroup: {},
  qualifiersCount: null,
  eliminatePerDay: 1,
  pairMode: false,
  groups: [],
  pairs: [],
  matchups: [],
}

export function normalizeWeeklyModeConfig(source = {}, fallback = {}) {
  const modeConfig = source?.modeConfig || {}
  const format = source?.format || source?.competitionMode || modeConfig?.format || fallback?.format || 'individual'

  const activeDays = normalizeStringArray(
    modeConfig?.activeDays ?? source?.activeDays ?? fallback?.activeDays ?? DEFAULT_WEEKLY_MODE_CONFIG.activeDays
  )
  const finalDays = normalizeStringArray(
    modeConfig?.finalDays ?? source?.finalDays ?? fallback?.finalDays ?? DEFAULT_WEEKLY_MODE_CONFIG.finalDays
  )

  const hasFinalStageSource =
    modeConfig?.hasFinalStage ??
    source?.hasFinalStage ??
    fallback?.hasFinalStage

  const hasFinalStage = (format === 'final-qualification' || format === 'playoff-final')
    ? true
    : Boolean(hasFinalStageSource)

  const storedGroups = normalizeStructuredArray(modeConfig?.groups ?? source?.groups ?? fallback?.groups)
  const storedGroupCount = storedGroups.length > 0 ? storedGroups.length : undefined
  const groupCount = normalizePositiveInteger(
    modeConfig?.groupCount ?? source?.groupCount ?? storedGroupCount ?? fallback?.groupCount,
    DEFAULT_WEEKLY_MODE_CONFIG.groupCount,
  )
  const groups = format === 'groups'
    ? buildNumberedGroups(groupCount, storedGroups)
    : storedGroups
  const qualifiersPerGroup = normalizePositiveInteger(
    modeConfig?.qualifiersPerGroup ?? source?.qualifiersPerGroup ?? fallback?.qualifiersPerGroup,
    DEFAULT_WEEKLY_MODE_CONFIG.qualifiersPerGroup,
  )

  return {
    format,
    activeDays,
    hasFinalStage,
    finalDays,
    playoffDays: normalizeStringArray(
      modeConfig?.playoffDays ?? source?.playoffDays ?? fallback?.playoffDays ?? DEFAULT_WEEKLY_MODE_CONFIG.playoffDays
    ),
    directQualifiersCount: normalizePositiveInteger(
      modeConfig?.directQualifiersCount ?? source?.directQualifiersCount ?? fallback?.directQualifiersCount,
      DEFAULT_WEEKLY_MODE_CONFIG.directQualifiersCount,
    ),
    eliminatedBeforePlayoffCount: normalizeNonNegativeInteger(
      modeConfig?.eliminatedBeforePlayoffCount ?? source?.eliminatedBeforePlayoffCount ?? fallback?.eliminatedBeforePlayoffCount,
      DEFAULT_WEEKLY_MODE_CONFIG.eliminatedBeforePlayoffCount,
    ),
    groupCount: groups.length > 0 ? groups.length : groupCount,
    groupSize: normalizePositiveInteger(
      modeConfig?.groupSize ?? source?.groupSize ?? fallback?.groupSize,
      DEFAULT_WEEKLY_MODE_CONFIG.groupSize,
    ),
    qualifiersPerGroup,
    qualifiersByGroup: normalizeQualifiersByGroup(
      modeConfig?.qualifiersByGroup ?? source?.qualifiersByGroup ?? fallback?.qualifiersByGroup,
      groups,
    ),
    qualifiersCount: normalizeNullablePositiveInteger(
      modeConfig?.qualifiersCount ?? source?.qualifiersCount ?? fallback?.qualifiersCount,
    ),
    eliminatePerDay: normalizePositiveInteger(
      modeConfig?.eliminatePerDay ?? source?.eliminatePerDay ?? fallback?.eliminatePerDay,
      DEFAULT_WEEKLY_MODE_CONFIG.eliminatePerDay,
    ),
    pairMode: Boolean(
      modeConfig?.pairMode ??
      source?.pairMode ??
      fallback?.pairMode ??
      format === 'pairs'
    ),
    groups,
    pairs: normalizeStructuredArray(modeConfig?.pairs ?? source?.pairs ?? fallback?.pairs),
    matchups: normalizeStructuredArray(modeConfig?.matchups ?? source?.matchups ?? fallback?.matchups),
  }
}

export function applyWeeklyModeConfig(campaign = {}, fallback = {}) {
  const modeConfig = normalizeWeeklyModeConfig(campaign, fallback)
  const format = campaign?.format || campaign?.competitionMode || modeConfig.format

  return {
    ...campaign,
    format,
    competitionMode: format,
    modeConfig,
    activeDays: modeConfig.activeDays,
    hasFinalStage: modeConfig.hasFinalStage,
    finalDays: modeConfig.finalDays,
    playoffDays: modeConfig.playoffDays,
    directQualifiersCount: modeConfig.directQualifiersCount,
    eliminatedBeforePlayoffCount: modeConfig.eliminatedBeforePlayoffCount,
    groupCount: modeConfig.groupCount,
    groupSize: modeConfig.groupSize,
    qualifiersPerGroup: modeConfig.qualifiersPerGroup,
    qualifiersByGroup: modeConfig.qualifiersByGroup,
    qualifiersCount: modeConfig.qualifiersCount,
    eliminatePerDay: modeConfig.eliminatePerDay,
    pairMode: modeConfig.pairMode,
    groups: modeConfig.groups,
    pairs: modeConfig.pairs,
    matchups: modeConfig.matchups,
  }
}

function buildNumberedGroups(groupCount, storedGroups = []) {
  const requestedCount = normalizePositiveInteger(groupCount, DEFAULT_WEEKLY_MODE_CONFIG.groupCount)
  const numberedGroups = new Map()
  const unnumberedGroups = []

  storedGroups.forEach((group) => {
    const idMatch = String(group?.id || '').match(/^group-(\d+)$/i)
    const nameMatch = String(group?.name || '').match(/^grupo\s+(\d+)$/i)
    const groupNumber = Number(idMatch?.[1] || nameMatch?.[1] || 0)
    if (groupNumber > 0) {
      numberedGroups.set(groupNumber, group)
    } else {
      unnumberedGroups.push(group)
    }
  })

  const highestStoredNumber = Math.max(0, ...numberedGroups.keys())
  const safeCount = Math.max(requestedCount, highestStoredNumber, storedGroups.length)

  return Array.from({ length: safeCount }, (_, index) => {
    const groupNumber = index + 1
    const stored = numberedGroups.get(groupNumber) || unnumberedGroups.shift() || {}
    return {
      ...stored,
      id: String(stored?.id || `group-${groupNumber}`),
      name: stored?.name || `Grupo ${groupNumber}`,
      members: Array.isArray(stored?.members) ? stored.members.filter(Boolean) : [],
    }
  })
}

function normalizeStringArray(value) {
  return Array.isArray(value)
    ? value.map((item) => String(item || '').trim()).filter(Boolean)
    : []
}

function normalizeStructuredArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : []
}

function normalizeQualifiersByGroup(value, groups = []) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}

  const normalized = {}
  ;(groups || []).forEach((group, index) => {
    const id = String(group?.id || `group-${index + 1}`)
    const aliases = [
      id,
      group?.name,
      String(index + 1),
      `Grupo ${index + 1}`,
      `group-${index + 1}`,
    ].filter(Boolean)
    const rawValue = aliases
      .map((key) => value[key])
      .find((candidate) => candidate !== undefined && candidate !== null && candidate !== '')
    const numeric = Number(rawValue)

    if (Number.isFinite(numeric) && numeric > 0) {
      normalized[id] = Math.round(numeric)
    }
  })

  return normalized
}

function normalizePositiveInteger(value, fallback) {
  const numeric = Number(value)
  return Number.isFinite(numeric) && numeric > 0 ? Math.round(numeric) : fallback
}

function normalizeNonNegativeInteger(value, fallback) {
  const numeric = Number(value)
  return Number.isFinite(numeric) && numeric >= 0 ? Math.round(numeric) : fallback
}

function normalizeNullablePositiveInteger(value) {
  if (value === null || value === undefined || value === '') return null
  const numeric = Number(value)
  return Number.isFinite(numeric) && numeric > 0 ? Math.round(numeric) : null
}
