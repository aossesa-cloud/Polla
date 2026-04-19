import { normalizeDateToChile } from '../utils/dateChile'

export const CAMPAIGN_TRACK_OPTIONS = [
  'Hipodromo Chile',
  'Club Hípico',
  'Valparaíso Sporting',
  'Concepción',
]

export function isCampaignActiveForDate(campaign, date, appData = null) {
  const normalizedDate = normalizeDate(date)
  if (!campaign || !normalizedDate) return false
  const { startDate, endDate } = resolveCampaignDateRange(campaign)

  if (campaign.type === 'diaria') {
    return normalizeDate(campaign.date) === normalizedDate
  }

  if (startDate && normalizedDate < startDate) return false
  if (endDate && normalizedDate > endDate) return false

  if (campaign.type === 'semanal') {
    return isWeeklyDayEnabled(campaign, normalizedDate)
  }

  if (campaign.type === 'mensual') {
    const eligibleDates = getCampaignEligibleDates(campaign, appData)
    if (eligibleDates.size > 0) return eligibleDates.has(normalizedDate)
  }

  return true
}

export function isCampaignEventEligible(campaign, eventDate, eventTrackText = '', appData = null) {
  const normalizedDate = normalizeDate(eventDate)
  if (!campaign || !normalizedDate) return false
  if (!isCampaignActiveForDate(campaign, normalizedDate, appData)) return false

  if (campaign.type === 'mensual') {
    const trackHints = collectCampaignTrackHints(campaign)
    if (trackHints.length > 0) {
      return candidateMatchesTrackHints(trackHints, eventTrackText)
    }
  }

  return true
}

export function getCampaignEligibleDates(campaign, appData = null) {
  return new Set(getCampaignEligibleDateList(campaign, appData))
}

export function getCampaignFirstActiveDate(campaign, appData = null) {
  if (!campaign) return null
  const { startDate, endDate } = resolveCampaignDateRange(campaign)

  if (campaign.type === 'diaria') {
    return normalizeDate(campaign.date)
  }

  if (campaign.type === 'mensual') {
    const eligibleDates = getCampaignEligibleDateList(campaign, appData).sort()
    return eligibleDates[0] || startDate
  }

  if (campaign.type === 'semanal') {
    if (!startDate) return null

    let cursor = new Date(`${startDate}T12:00:00`)
    const limit = new Date(`${endDate || startDate}T12:00:00`)

    while (cursor <= limit) {
      const current = cursor.toISOString().slice(0, 10)
      if (isWeeklyDayEnabled(campaign, current)) return current
      cursor.setDate(cursor.getDate() + 1)
    }

    return startDate
  }

  return startDate || normalizeDate(campaign.date)
}

export function getCampaignEligibleDateList(campaign, appData = null) {
  if (!campaign || campaign.type !== 'mensual') return []

  const fallbackSelectedIds = campaign.selectedEventIds?.length
    ? campaign.selectedEventIds
    : (appData?.settings?.monthly?.selectedEventIds || [])
  const filteredSelectedIds = filterSelectedEventIdsByCampaign(campaign, fallbackSelectedIds)

  const explicitDates = filteredSelectedIds
    .map(extractDateFromValue)
    .filter(Boolean)

  if (explicitDates.length > 0) return Array.from(new Set(explicitDates))

  const trackHints = collectCampaignTrackHints(campaign)
  const dates = new Set()
  const programs = Array.isArray(appData?.programs) ? appData.programs : Object.values(appData?.programs || {})
  const events = Array.isArray(appData?.events) ? appData.events : Object.values(appData?.events || {})

  programs.forEach((program) => {
    const date = normalizeDate(program?.date || program?.key)
    if (!date || !isDateInsideCampaignRange(campaign, date)) return
    if (trackHints.length > 0 && !candidateMatchesTrackHints(trackHints, program?.trackName || program?.trackId)) return
    dates.add(date)
  })

  events.forEach((event) => {
    const date = normalizeDate(event?.meta?.date || event?.date || event?.sheetName)
    if (!date || !isDateInsideCampaignRange(campaign, date)) return
    if (trackHints.length > 0) {
      const candidate = [
        event?.meta?.trackName,
        event?.meta?.trackId,
        event?.sheetName,
        event?.title,
        event?.name,
      ].filter(Boolean).join(' ')
      if (!candidateMatchesTrackHints(trackHints, candidate)) return
    }
    dates.add(date)
  })

  return Array.from(dates)
}

export function collectCampaignTrackHints(campaign) {
  const hints = new Set()
  ;[
    ...normalizeCampaignTrackSelection(campaign?.hipodromos || []),
    campaign?.hippodrome,
    campaign?.trackId,
  ].forEach((value) => {
    const canonical = canonicalTrackId(value)
    if (canonical) {
      hints.add(canonical)
      return
    }
    const normalized = normalizeText(value)
    if (normalized) hints.add(`raw:${normalized}`)
  })
  return Array.from(hints)
}

export function normalizeDate(value) {
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

function isWeeklyDayEnabled(campaign, date) {
  const activeDays = (campaign.activeDays || []).map(normalizeText)
  if (activeDays.length === 0) return true

  const dayNames = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']
  const dayName = dayNames[new Date(`${date}T12:00:00`).getDay()]
  return activeDays.includes(dayName)
}

function isDateInsideCampaignRange(campaign, date) {
  const { startDate, endDate } = resolveCampaignDateRange(campaign)
  if (startDate && date < startDate) return false
  if (endDate && date > endDate) return false
  return true
}

export function resolveCampaignDateRange(campaign) {
  const explicitStartDate = normalizeDate(campaign?.startDate)
  const explicitEndDate = normalizeDate(campaign?.endDate)

  if (explicitStartDate || explicitEndDate) {
    return {
      startDate: explicitStartDate,
      endDate: explicitEndDate || explicitStartDate,
    }
  }

  if (campaign?.type !== 'semanal') {
    return {
      startDate: explicitStartDate,
      endDate: explicitEndDate,
    }
  }

  const parsedFromName = parseWeeklyRangeFromName(campaign?.name, campaign?.createdAt || campaign?.lastModified)
  if (parsedFromName) return parsedFromName

  return {
    startDate: explicitStartDate,
    endDate: explicitEndDate,
  }
}

function candidateMatchesTrackHints(trackHints, candidateValue) {
  const canonicalCandidate = canonicalTrackId(candidateValue)
  const candidate = normalizeText(candidateValue)
  if (!canonicalCandidate && !candidate) return false

  return trackHints.some((hint) => {
    if (hint.startsWith('raw:')) {
      const rawHint = hint.slice(4)
      return candidate.includes(rawHint) || rawHint.includes(candidate)
    }
    return canonicalCandidate === hint
  })
}

function extractDateFromValue(value) {
  const match = String(value || '').match(/(\d{4}-\d{2}-\d{2})/)
  return match ? match[1] : null
}

export function filterSelectedEventIdsByCampaign(campaign, selectedEventIds = []) {
  if (!campaign || !Array.isArray(selectedEventIds) || selectedEventIds.length === 0) return []

  const trackHints = collectCampaignTrackHints(campaign)
  if (trackHints.length === 0) return selectedEventIds

  return selectedEventIds.filter((eventId) => {
    const trackId = extractTrackIdFromSelectedEventId(eventId)
    if (!trackId) return false
    return candidateMatchesTrackHints(trackHints, trackId)
  })
}

export function normalizeCampaignTrackLabel(value) {
  const canonical = canonicalTrackId(value)
  switch (canonical) {
    case 'hipodromo-chile':
      return 'Hipodromo Chile'
    case 'club-hipico-santiago':
      return 'Club Hípico'
    case 'valparaiso':
      return 'Valparaíso Sporting'
    case 'concepcion':
      return 'Concepción'
    default:
      return String(value || '').trim()
  }
}

export function normalizeCampaignTrackSelection(values = []) {
  if (!Array.isArray(values)) return []
  const unique = new Set()

  values.forEach((value) => {
    const normalized = normalizeCampaignTrackLabel(value)
    if (normalized) unique.add(normalized)
  })

  return Array.from(unique)
}

function extractTrackIdFromSelectedEventId(value) {
  const match = String(value || '').match(/^calendar-(.+)-(\d{4}-\d{2}-\d{2})$/)
  return match ? match[1] : null
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .trim()
}

function canonicalTrackId(value) {
  const text = normalizeText(value)
  if (!text) return null

  if (text.includes('hipodromo chile')) return 'hipodromo-chile'
  if (text.includes('valparaiso')) return 'valparaiso'
  if (text.includes('concepcion')) return 'concepcion'
  if (
    text === 'club hipico' ||
    text.includes('club hipico de santiago') ||
    text.includes('club hipico santiago') ||
    text === 'chs' ||
    text.includes('santiago')
  ) {
    return 'club-hipico-santiago'
  }

  return null
}

function parseWeeklyRangeFromName(name, referenceDate) {
  const text = String(name || '')
  const match = text.match(/(\d{1,2})\s*(?:al|-|a)\s*(\d{1,2})\s+([a-záéíóú]+)/i)
  if (!match) return null

  const [, rawStartDay, rawEndDay, rawMonth] = match
  const month = monthToNumber(rawMonth)
  if (!month) return null

  const referenceYear =
    normalizeDate(referenceDate)?.slice(0, 4) ||
    String(new Date().getFullYear())

  const startDate = `${referenceYear}-${month}-${String(rawStartDay).padStart(2, '0')}`
  const endDate = `${referenceYear}-${month}-${String(rawEndDay).padStart(2, '0')}`

  return {
    startDate,
    endDate,
  }
}

function monthToNumber(rawMonth) {
  const month = normalizeText(rawMonth)
  const months = {
    enero: '01',
    febrero: '02',
    marzo: '03',
    abril: '04',
    mayo: '05',
    junio: '06',
    julio: '07',
    agosto: '08',
    septiembre: '09',
    setiembre: '09',
    octubre: '10',
    noviembre: '11',
    diciembre: '12',
  }
  return months[month] || null
}
