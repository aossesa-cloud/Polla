export const DEFAULT_SCORING_CONFIG = Object.freeze({
  mode: 'dividend',
  doubleLastRace: true,
  points: {},
})

export function resolveScoringConfig(...sources) {
  return sources
    .filter((source) => source && typeof source === 'object')
    .reduce((resolved, source) => ({
      ...resolved,
      ...source,
      points: {
        ...(resolved.points || {}),
        ...(source.points || {}),
      },
    }), { ...DEFAULT_SCORING_CONFIG, points: {} })
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
