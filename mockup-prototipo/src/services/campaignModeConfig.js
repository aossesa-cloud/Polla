const DEFAULT_WEEKLY_MODE_CONFIG = {
  format: 'individual',
  activeDays: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  hasFinalStage: false,
  finalDays: [],
  groupSize: 8,
  qualifiersPerGroup: 4,
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

  const hasFinalStage = format === 'final-qualification'
    ? true
    : Boolean(hasFinalStageSource)

  return {
    format,
    activeDays,
    hasFinalStage,
    finalDays,
    groupSize: normalizePositiveInteger(
      modeConfig?.groupSize ?? source?.groupSize ?? fallback?.groupSize,
      DEFAULT_WEEKLY_MODE_CONFIG.groupSize,
    ),
    qualifiersPerGroup: normalizePositiveInteger(
      modeConfig?.qualifiersPerGroup ?? source?.qualifiersPerGroup ?? fallback?.qualifiersPerGroup,
      DEFAULT_WEEKLY_MODE_CONFIG.qualifiersPerGroup,
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
    groups: normalizeStructuredArray(modeConfig?.groups ?? source?.groups ?? fallback?.groups),
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
    groupSize: modeConfig.groupSize,
    qualifiersPerGroup: modeConfig.qualifiersPerGroup,
    qualifiersCount: modeConfig.qualifiersCount,
    eliminatePerDay: modeConfig.eliminatePerDay,
    pairMode: modeConfig.pairMode,
    groups: modeConfig.groups,
    pairs: modeConfig.pairs,
    matchups: modeConfig.matchups,
  }
}

function normalizeStringArray(value) {
  return Array.isArray(value)
    ? value.map((item) => String(item || '').trim()).filter(Boolean)
    : []
}

function normalizeStructuredArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : []
}

function normalizePositiveInteger(value, fallback) {
  const numeric = Number(value)
  return Number.isFinite(numeric) && numeric > 0 ? Math.round(numeric) : fallback
}

function normalizeNullablePositiveInteger(value) {
  if (value === null || value === undefined || value === '') return null
  const numeric = Number(value)
  return Number.isFinite(numeric) && numeric > 0 ? Math.round(numeric) : null
}

