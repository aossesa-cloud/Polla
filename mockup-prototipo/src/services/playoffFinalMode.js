export const PLAYOFF_FINAL_MODE_ID = 'playoff-final'
export const DEFAULT_PLAYOFF_DAYS = ['Viernes']
export const DEFAULT_FINAL_DAYS = ['Sabado']
export const DEFAULT_DIRECT_QUALIFIERS = 2
export const DEFAULT_ELIMINATED_BEFORE_PLAYOFF = 2

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado']

export function isPlayoffFinalMode(mode) {
  return String(mode || '') === PLAYOFF_FINAL_MODE_ID
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

export function comparePlayoffFinalEntries(left = {}, right = {}) {
  const totalDiff = Number(right?.total || 0) - Number(left?.total || 0)
  if (totalDiff !== 0) return totalDiff

  const rawDiff = Number(right?.rawTotal || 0) - Number(left?.rawTotal || 0)
  if (rawDiff !== 0) return rawDiff

  return String(left?.participant || '').localeCompare(String(right?.participant || ''), 'es')
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
