import { resolveEventOperationalData } from './campaignOperationalData'
import { getChileDateString, normalizeDateToChile } from '../utils/dateChile'
import { resolveCampaignDateRange } from './campaignEligibility'

export function resolveCampaignStatus({ campaign, appData, campaignEvents = [], today = getChileDateString() }) {
  if (!campaign?.enabled) return 'finalizada'

  const normalizedToday = normalizeDate(today)
  const campaignDate = normalizeDate(campaign?.date)
  const { startDate, endDate } = resolveCampaignDateRange(campaign)
  const progress = getCampaignProgress({ campaign, appData, campaignEvents, fallbackDate: campaignDate || startDate || normalizedToday })

  if (campaignDate) {
    if (campaignDate > normalizedToday) return 'proxima'
    if (campaignDate < normalizedToday) return 'finalizada'
    if (progress.totalRaces > 0 && progress.completedRaces >= progress.totalRaces) return 'finalizada'
    if (progress.completedRaces > 0) return 'en-curso'
    return 'activa'
  }

  if (startDate || endDate) {
    if (startDate && normalizedToday < startDate) return 'proxima'
    if (endDate && normalizedToday > endDate) return 'finalizada'
    if (progress.completedRaces > 0) return 'en-curso'
    return 'activa'
  }

  if (progress.totalRaces > 0 && progress.completedRaces >= progress.totalRaces) return 'finalizada'
  if (progress.completedRaces > 0) return 'en-curso'
  return 'activa'
}

function getCampaignProgress({ campaign, appData, campaignEvents, fallbackDate }) {
  const mergedResults = {}
  let totalRaces = Number(campaign?.raceCount) || 0

  ;(campaignEvents || []).forEach((event) => {
    const operationalData = resolveEventOperationalData(appData, campaign, event, fallbackDate)
    totalRaces = Math.max(totalRaces, Number(operationalData?.raceCount) || 0)
    Object.entries(operationalData?.results || {}).forEach(([raceKey, race]) => {
      mergedResults[String(race?.race || raceKey)] = race
    })
  })

  return {
    totalRaces,
    completedRaces: countCompletedRaces(mergedResults),
  }
}

function countCompletedRaces(results) {
  return Object.values(results || {}).filter((race) => (
    race &&
    (
      race.primero ||
      race.winner?.number ||
      race.complete
    )
  )).length
}

function normalizeDate(value) {
  if (!value) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value

  const latinDate = String(value).match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (latinDate) {
    const [, day, month, year] = latinDate
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  const embeddedDate = String(value).match(/(\d{4}-\d{2}-\d{2})/)
  if (embeddedDate) return embeddedDate[1]

  try {
    return normalizeDateToChile(value)
  } catch {
    return null
  }
}
