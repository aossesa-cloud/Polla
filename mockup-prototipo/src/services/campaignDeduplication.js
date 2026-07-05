export function dedupeCampaignList(campaigns = [], kind = '') {
  const byKey = new Map()

  ;(campaigns || []).forEach((campaign) => {
    const key = getCampaignIdentityKey(kind, campaign) || String(campaign?.id || '')
    if (!key) return

    const current = byKey.get(key)
    byKey.set(
      key,
      current ? mergeCampaignRecords(current, campaign) : campaign,
    )
  })

  return Array.from(byKey.values())
}

export function dedupeCampaignCollections(collections = {}) {
  const daily = dedupeCampaignList(collections.daily || collections.diaria || [], 'daily')
  const weekly = dedupeCampaignList(collections.weekly || collections.semanal || [], 'weekly')
  const monthly = dedupeCampaignList(collections.monthly || collections.mensual || [], 'monthly')

  return {
    ...collections,
    daily,
    weekly,
    monthly,
    diaria: Object.prototype.hasOwnProperty.call(collections, 'diaria') ? daily : collections.diaria,
    semanal: Object.prototype.hasOwnProperty.call(collections, 'semanal') ? weekly : collections.semanal,
    mensual: Object.prototype.hasOwnProperty.call(collections, 'mensual') ? monthly : collections.mensual,
  }
}

export function getFrontendCampaignCollections(collections = {}, current = {}) {
  const deduped = dedupeCampaignCollections(collections)
  return {
    ...current,
    diaria: deduped.diaria || deduped.daily || current.diaria || [],
    semanal: deduped.semanal || deduped.weekly || current.semanal || [],
    mensual: deduped.mensual || deduped.monthly || current.mensual || [],
  }
}

function mergeCampaignRecords(current, incoming) {
  const primary = getCampaignCompletenessScore(incoming) > getCampaignCompletenessScore(current)
    ? incoming
    : current
  const secondary = primary === incoming ? current : incoming
  const eventIds = uniqueValues([
    ...(secondary.eventIds || []),
    secondary.eventId,
    ...(primary.eventIds || []),
    primary.eventId,
  ])

  return {
    ...secondary,
    ...primary,
    id: primary.id || secondary.id,
    enabled: primary.enabled !== false || secondary.enabled !== false,
    eventIds,
    eventId: primary.eventId || secondary.eventId || eventIds[0] || null,
    registeredParticipants: mergeObjectArrayByName(secondary.registeredParticipants, primary.registeredParticipants),
    selectedEventIds: uniqueValues([...(secondary.selectedEventIds || []), ...(primary.selectedEventIds || [])]),
    groups: mergeArrayByJson(secondary.groups, primary.groups),
    pairs: mergeArrayByJson(secondary.pairs, primary.pairs),
    matchups: mergeArrayByJson(secondary.matchups, primary.matchups),
    modeConfig: {
      ...(secondary.modeConfig || {}),
      ...(primary.modeConfig || {}),
      groups: mergeArrayByJson(secondary.modeConfig?.groups, primary.modeConfig?.groups),
      pairs: mergeArrayByJson(secondary.modeConfig?.pairs, primary.modeConfig?.pairs),
      matchups: mergeArrayByJson(secondary.modeConfig?.matchups, primary.modeConfig?.matchups),
    },
    createdAt: getEarliestValue(primary.createdAt, secondary.createdAt),
    lastModified: getLatestValue(primary.lastModified, secondary.lastModified),
  }
}

function getCampaignIdentityKey(kind, campaign = {}) {
  const name = normalizeIdentityPart(campaign.name)
  const group = normalizeIdentityPart(campaign.groupId || campaign.group)
  if (!name) return ''

  if (kind === 'daily' || kind === 'diaria') {
    return [
      'daily',
      name,
      normalizeDatePart(campaign.date),
      group,
      normalizeIdentityPart(campaign.trackId || campaign.hipodromo || campaign.trackName),
    ].join('|')
  }

  if (kind === 'weekly' || kind === 'semanal') {
    return [
      'weekly',
      name,
      normalizeDatePart(campaign.startDate),
      normalizeDatePart(campaign.endDate),
      group,
      normalizeIdentityPart(campaign.format || campaign.competitionMode),
    ].join('|')
  }

  if (kind === 'monthly' || kind === 'mensual') {
    return [
      'monthly',
      name,
      normalizeDatePart(campaign.startDate),
      normalizeDatePart(campaign.endDate),
      group,
    ].join('|')
  }

  return [kind, name, group].join('|')
}

function getCampaignCompletenessScore(campaign = {}) {
  const eventCount = Array.isArray(campaign.eventIds) ? campaign.eventIds.length : 0
  const participantCount = Array.isArray(campaign.registeredParticipants) ? campaign.registeredParticipants.length : 0
  const modified = Date.parse(campaign.lastModified || campaign.createdAt || '')

  return [
    eventCount * 1000,
    participantCount * 100,
    Number(campaign.entryValue || 0) > 0 ? 20 : 0,
    campaign.promoEnabled ? 10 : 0,
    campaign.enabled !== false ? 5 : 0,
    Number.isFinite(modified) ? modified / 1000000000000 : 0,
  ].reduce((sum, value) => sum + value, 0)
}

function mergeObjectArrayByName(left = [], right = []) {
  const byKey = new Map()
  ;[...(left || []), ...(right || [])].forEach((entry) => {
    const value = entry && typeof entry === 'object' ? entry : { name: String(entry || '').trim() }
    const key = normalizeIdentityPart(value.name || value.participant || JSON.stringify(value))
    if (!key) return
    byKey.set(key, { ...(byKey.get(key) || {}), ...value })
  })
  return Array.from(byKey.values())
}

function mergeArrayByJson(left = [], right = []) {
  const byKey = new Map()
  ;[...(left || []), ...(right || [])].forEach((entry) => {
    const key = JSON.stringify(entry)
    if (!key) return
    byKey.set(key, entry)
  })
  return Array.from(byKey.values())
}

function uniqueValues(values = []) {
  return Array.from(new Set(values.map((value) => String(value || '').trim()).filter(Boolean)))
}

function getEarliestValue(left, right) {
  return [left, right].filter(Boolean).sort()[0] || left || right || new Date().toISOString()
}

function getLatestValue(left, right) {
  const values = [left, right].filter(Boolean).sort()
  return values[values.length - 1] || left || right || new Date().toISOString()
}

function normalizeIdentityPart(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function normalizeDatePart(value) {
  const text = String(value || '').trim()
  const iso = text.match(/\b\d{4}-\d{2}-\d{2}\b/)
  if (iso) return iso[0]
  const latin = text.match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b/)
  if (!latin) return ''
  const [, day, month, year] = latin
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}
