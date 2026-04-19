import { normalizeDate, normalizeCampaignTrackLabel } from './campaignEligibility'

export function resolveCampaignPickTargetEventIds(campaign, selectedDate) {
  const normalizedDate = normalizeDate(selectedDate) || normalizeDate(campaign?.date) || normalizeDate(campaign?.startDate)
  if (!campaign || !normalizedDate) return []

  const explicitEventIds = Array.isArray(campaign.eventIds) ? campaign.eventIds.filter(Boolean) : []
  const datedExplicitIds = explicitEventIds.filter((eventId) => String(eventId).includes(normalizedDate))
  if (datedExplicitIds.length > 0) return datedExplicitIds

  if (campaign.eventId && (campaign.type === 'diaria' || String(campaign.eventId).includes(normalizedDate))) {
    return [campaign.eventId]
  }

  return [`campaign-${campaign.id}-${normalizedDate}`]
}

export function buildCampaignEventMeta(campaign, selectedDate) {
  const normalizedDate = normalizeDate(selectedDate) || normalizeDate(campaign?.date) || normalizeDate(campaign?.startDate)
  const primaryTrack = normalizeCampaignTrackLabel(campaign?.hipodromos?.[0] || campaign?.hippodrome || campaign?.trackId || '')

  return {
    date: normalizedDate || '',
    trackName: primaryTrack || '',
    trackId: normalizeTrackId(primaryTrack || campaign?.trackId || ''),
    campaignId: campaign?.id || '',
    campaignType: campaign?.type || '',
    title: campaign?.name || '',
    source: 'manual-picks',
    lastUpdated: new Date().toISOString(),
  }
}

export function findLegacyCampaignContainerEvent(appData, campaign) {
  if (!campaign?.id) return null
  const legacyId = `campaign-${campaign.id}`
  const events = Array.isArray(appData?.events) ? appData.events : Object.values(appData?.events || {})

  return events.find((event) => {
    if (String(event?.id || '') !== legacyId) return false
    const eventDate = normalizeDate(event?.meta?.date || event?.date || event?.sheetName)
    return !eventDate
  }) || null
}

function normalizeTrackId(value) {
  const text = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

  if (!text) return ''
  if (text.includes('hipodromo chile')) return 'hipodromo-chile'
  if (text.includes('club hipico')) return 'chs'
  if (text.includes('valparaiso')) return 'valparaiso'
  if (text.includes('concepcion')) return 'concepcion'

  return text.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}
