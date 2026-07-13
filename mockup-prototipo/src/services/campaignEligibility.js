import { normalizeDateToChile } from '../utils/dateChile'

export const CAMPAIGN_TRACK_OPTIONS = [
  'Hipodromo Chile',
  'Club Hípico',
  'Valparaíso Sporting',
  'Concepción',
]

const CALENDAR_MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

const CALENDAR_TRACK_LABELS = {
  chs: 'Club Hipico de Santiago',
  'hipodromo-chile': 'Hipodromo Chile',
  valparaiso: 'Valparaiso Sporting',
  concepcion: 'C. H. Concepcion',
}

const CALENDAR_SCHEDULE_2026 = {
  chs: {
    Enero: [2, 9, 12, 16, 23, 26, 30],
    Febrero: [6, 9, 13, 20, 23, 27],
    Marzo: [1, 6, 9, 13, 20, 23, 27],
    Abril: [2, 6, 10, 12, 17, 20, 24],
    Mayo: [1, 4, 8, 15, 18, 22, 25, 29, 31],
    Junio: [5, 12, 15, 19, 21, 26, 29],
    Julio: [3, 10, 13, 17, 24, 27, 31],
    Agosto: [2, 7, 10, 14, 16, 21, 24, 28, 30],
    Septiembre: [4, 7, 11, 13, 21, 25],
    Octubre: [2, 5, 9, 11, 16, 19, 23, 30],
    Noviembre: [1, 6, 13, 16, 20, 27, 29],
    Diciembre: [4, 11, 14, 18, 21, 28],
  },
  'hipodromo-chile': {
    Enero: [3, 10, 15, 17, 24, 29, 31],
    Febrero: [5, 7, 14, 19, 21, 26, 28],
    Marzo: [5, 7, 14, 19, 21, 26, 28],
    Abril: [4, 9, 11, 16, 18, 25, 30],
    Mayo: [2, 7, 9, 16, 21, 23, 28, 30],
    Junio: [4, 6, 13, 18, 20, 25, 27],
    Julio: [2, 4, 11, 16, 18, 25, 30],
    Agosto: [1, 6, 8, 15, 20, 22, 27, 29],
    Septiembre: [3, 5, 10, 12, 19, 24, 26],
    Octubre: [3, 10, 15, 17, 22, 24, 29, 31],
    Noviembre: [5, 7, 14, 19, 21, 26, 28],
    Diciembre: [3, 5, 12, 19, 26, 31],
  },
  valparaiso: {
    Enero: [4, 7, 11, 14, 19, 21],
    Febrero: [1, 4, 16, 18, 22, 25],
    Marzo: [2, 4, 11, 16, 18, 25, 30],
    Abril: [1, 8, 13, 15, 22, 27, 29],
    Mayo: [3, 6, 11, 13, 20, 27],
    Junio: [1, 3, 8, 10, 17, 22, 24],
    Julio: [1, 6, 8, 15, 20, 22, 29],
    Agosto: [3, 5, 12, 17, 19, 26, 31],
    Septiembre: [2, 9, 14, 16, 23, 28],
    Octubre: [1, 7, 12, 14, 21, 26, 28],
    Noviembre: [2, 4, 9, 11, 18, 23, 25, 30],
    Diciembre: [2, 7, 9, 16, 23, 30],
  },
  concepcion: {
    Enero: [8, 13, 20, 22, 27],
    Febrero: [3, 10, 12, 17, 24],
    Marzo: [3, 10, 12, 17, 24, 31],
    Abril: [7, 14, 21, 23, 28],
    Mayo: [5, 12, 14, 19, 26],
    Junio: [2, 9, 11, 16, 23, 30],
    Julio: [7, 9, 14, 21, 28],
    Agosto: [4, 11, 13, 18, 25],
    Septiembre: [1, 8, 15, 17, 22, 29],
    Octubre: [6, 8, 13, 20, 27],
    Noviembre: [3, 10, 12, 17, 24],
    Diciembre: [1, 10, 15, 22, 29],
  },
}

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

  const trackHints = collectCampaignTrackHints(campaign)
  const dates = new Set(explicitDates)
  const programs = Array.isArray(appData?.programs) ? appData.programs : Object.values(appData?.programs || {})
  const events = Array.isArray(appData?.events) ? appData.events : Object.values(appData?.events || {})

  collectScheduledCalendarEntries(campaign).forEach((entry) => {
    dates.add(entry.date)
  })

  programs.forEach((program) => {
    const date = normalizeDate(program?.date || program?.key)
    if (!date || !isDateInsideCampaignRange(campaign, date)) return
    const candidate = [
      program?.trackName,
      program?.trackId,
      program?.key,
    ].filter(Boolean).join(' ')
    if (trackHints.length > 0 && !candidateMatchesTrackHints(trackHints, candidate)) return
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

  return Array.from(dates).sort()
}

export function buildMonthlySelectedEventIds(campaign, appData = null, fallbackSelectedEventIds = []) {
  if (!campaign || campaign.type !== 'mensual') return []

  const calendarEventIds = collectCalendarSelectedEventIds(campaign, appData)
  const filteredFallbackIds = filterSelectedEventIdsByCampaign(campaign, fallbackSelectedEventIds)

  return Array.from(new Set([
    ...calendarEventIds,
    ...filteredFallbackIds,
  ])).sort(compareCalendarEventIds)
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
  const configuredDays = [
    ...(campaign.activeDays || []),
    ...(campaign?.modeConfig?.activeDays || []),
    ...(campaign.playoffDays || []),
    ...(campaign?.modeConfig?.playoffDays || []),
    ...(campaign.finalDays || []),
    ...(campaign?.modeConfig?.finalDays || []),
  ]
  const activeDays = configuredDays.map(normalizeDayLabel).filter(Boolean)
  if (activeDays.length === 0) return true

  const dayNames = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']
  const dayName = dayNames[new Date(`${date}T12:00:00`).getDay()]
  return activeDays.includes(dayName)
}

function normalizeDayLabel(value) {
  const raw = String(value || '')
    .replace(/ÃƒÂ¡/g, 'á')
    .replace(/Ã¡/g, 'á')
    .replace(/ÃƒÂ©/g, 'é')
    .replace(/Ã©/g, 'é')
    .replace(/ÃƒÂ­/g, 'í')
    .replace(/Ã­/g, 'í')
    .replace(/ÃƒÂ³/g, 'ó')
    .replace(/Ã³/g, 'ó')
    .replace(/ÃƒÂº/g, 'ú')
    .replace(/Ãº/g, 'ú')
    .replace(/ÃƒÂ±/g, 'ñ')
    .replace(/Ã±/g, 'ñ')
    .replace(/Ã‚/g, '')

  const normalized = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]/gi, '')
    .toLowerCase()
    .trim()

  if (normalized.startsWith('mier')) return 'miercoles'
  if (normalized.startsWith('sab')) return 'sabado'
  if (normalized.startsWith('dom')) return 'domingo'
  return normalized
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
  const { startDate, endDate } = resolveCampaignDateRange(campaign)
  const hasDateRange = Boolean(startDate || endDate)

  return Array.from(new Set(selectedEventIds.filter(Boolean))).filter((eventId) => {
    const eventDate = extractDateFromValue(eventId)
    if (eventDate && !isDateInsideCampaignRange(campaign, eventDate)) return false
    if (!eventDate && hasDateRange) return false
    if (trackHints.length === 0) return true

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

function collectCalendarSelectedEventIds(campaign, appData = null) {
  const ids = new Set()
  const trackHints = collectCampaignTrackHints(campaign)

  collectScheduledCalendarEntries(campaign).forEach((entry) => {
    ids.add(entry.key)
  })

  getProgramList(appData?.programs).forEach((program) => {
    const date = normalizeDate(program?.date || program?.key)
    if (!date || !isDateInsideCampaignRange(campaign, date)) return

    const trackCandidate = [
      program?.trackId,
      program?.trackName,
      program?.key,
    ].filter(Boolean).join(' ')

    if (trackHints.length > 0 && !candidateMatchesTrackHints(trackHints, trackCandidate)) return

    const trackId = toCalendarTrackId(program?.trackId || program?.trackName || program?.key)
    if (trackId) ids.add(`calendar-${trackId}-${date}`)
  })

  getEventList(appData?.events).forEach((event) => {
    const date = normalizeDate(event?.meta?.date || event?.date || event?.id || event?.sheetName)
    if (!date || !isDateInsideCampaignRange(campaign, date)) return

    const trackCandidate = [
      event?.meta?.trackId,
      event?.meta?.trackName,
      event?.sheetName,
      event?.title,
      event?.name,
      event?.id,
    ].filter(Boolean).join(' ')

    if (trackHints.length > 0 && !candidateMatchesTrackHints(trackHints, trackCandidate)) return

    const trackId = toCalendarTrackId(event?.meta?.trackId || event?.meta?.trackName || event?.id || event?.sheetName)
    if (trackId) ids.add(`calendar-${trackId}-${date}`)
  })

  return Array.from(ids).sort(compareCalendarEventIds)
}

function collectScheduledCalendarEntries(campaign) {
  const trackIds = collectCampaignCalendarTrackIds(campaign)
  if (trackIds.length === 0) return []

  const entries = []
  trackIds.forEach((trackId) => {
    const schedule = CALENDAR_SCHEDULE_2026[trackId] || {}
    Object.entries(schedule).forEach(([monthName, days]) => {
      const monthIndex = CALENDAR_MONTHS.indexOf(monthName)
      if (monthIndex < 0) return

      ;(days || []).forEach((day) => {
        const date = `2026-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        if (!isDateInsideCampaignRange(campaign, date)) return

        entries.push({
          key: `calendar-${trackId}-${date}`,
          date,
          trackId,
          label: `${CALENDAR_TRACK_LABELS[trackId] || trackId} · ${date}`,
        })
      })
    })
  })

  return entries.sort((a, b) => {
    const dateDiff = a.date.localeCompare(b.date)
    if (dateDiff !== 0) return dateDiff
    return a.trackId.localeCompare(b.trackId)
  })
}

function collectCampaignCalendarTrackIds(campaign) {
  return Array.from(new Set(
    normalizeCampaignTrackSelection(campaign?.hipodromos || [])
      .map(toCalendarTrackId)
      .filter((trackId) => trackId && CALENDAR_SCHEDULE_2026[trackId])
  ))
}

function getProgramList(programs) {
  if (Array.isArray(programs)) return programs
  return Object.entries(programs || {}).map(([key, program]) => ({
    key,
    ...(program || {}),
  }))
}

function getEventList(events) {
  if (Array.isArray(events)) return events
  return Object.values(events || {})
}

function compareCalendarEventIds(a, b) {
  const dateDiff = String(extractDateFromValue(a) || '').localeCompare(String(extractDateFromValue(b) || ''))
  if (dateDiff !== 0) return dateDiff
  return String(a).localeCompare(String(b))
}

function toCalendarTrackId(value) {
  const canonical = canonicalTrackId(value)
  switch (canonical) {
    case 'club-hipico-santiago':
      return 'chs'
    case 'hipodromo-chile':
    case 'valparaiso':
    case 'concepcion':
      return canonical
    default:
      break
  }

  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
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
