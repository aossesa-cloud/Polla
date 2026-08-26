export const DEFAULT_POINT_COLORS = Object.freeze({
  first: '#10B981',
  second: '#3B82F6',
  third: '#F59E0B',
  exclusiveFirst: '#8B5CF6',
})

const POINT_COLOR_KEYS = Object.freeze(Object.keys(DEFAULT_POINT_COLORS))
const HEX_COLOR_PATTERN = /^#[0-9A-F]{6}$/i

export function sanitizePointColor(value, fallback) {
  const normalized = typeof value === 'string' ? value.trim().toUpperCase() : ''
  if (HEX_COLOR_PATTERN.test(normalized)) return normalized
  const normalizedFallback = typeof fallback === 'string' ? fallback.trim().toUpperCase() : ''
  return HEX_COLOR_PATTERN.test(normalizedFallback) ? normalizedFallback : null
}

export function resolvePointColors(...sources) {
  return sources.reduce((resolved, source) => {
    if (!source || typeof source !== 'object') return resolved

    POINT_COLOR_KEYS.forEach((key) => {
      const color = sanitizePointColor(source[key], null)
      if (color) resolved[key] = color
    })
    return resolved
  }, { ...DEFAULT_POINT_COLORS })
}

export function getContrastingTextColor(backgroundColor) {
  const background = sanitizePointColor(backgroundColor, '#000000')
  const darkText = '#111111'
  const lightText = '#FFFFFF'
  return contrastRatio(background, darkText) >= contrastRatio(background, lightText)
    ? darkText
    : lightText
}

function contrastRatio(left, right) {
  const leftLuminance = relativeLuminance(left)
  const rightLuminance = relativeLuminance(right)
  const lighter = Math.max(leftLuminance, rightLuminance)
  const darker = Math.min(leftLuminance, rightLuminance)
  return (lighter + 0.05) / (darker + 0.05)
}

function relativeLuminance(color) {
  const hex = sanitizePointColor(color, '#000000').slice(1)
  const channels = [hex.slice(0, 2), hex.slice(2, 4), hex.slice(4, 6)]
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) => (
      channel <= 0.04045
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4
    ))
  return (0.2126 * channels[0]) + (0.7152 * channels[1]) + (0.0722 * channels[2])
}

export const DEFAULT_SCORING_CONFIG = Object.freeze({
  mode: 'dividend',
  doubleLastRace: true,
  points: {},
  pointColors: DEFAULT_POINT_COLORS,
})

export function resolveScoringConfig(...sources) {
  const validSources = sources.filter((source) => source && typeof source === 'object')
  const resolved = validSources.reduce((current, source) => ({
    ...current,
    ...source,
    points: {
      ...(current.points || {}),
      ...(source.points || {}),
    },
  }), { ...DEFAULT_SCORING_CONFIG, points: {}, pointColors: { ...DEFAULT_POINT_COLORS } })

  return {
    ...resolved,
    pointColors: resolvePointColors(...validSources.map((source) => source.pointColors)),
  }
}

export function resolveCampaignScoringConfig(campaign, event) {
  return resolveScoringConfig(
    event?.scoring,
    campaign?.modeConfig?.scoring,
    campaign?.scoring,
  )
}

export function shouldDoubleLastRace(scoringConfig) {
  const resolved = resolveScoringConfig(scoringConfig)
  return resolved.mode !== 'points' && resolved.doubleLastRace !== false
}
