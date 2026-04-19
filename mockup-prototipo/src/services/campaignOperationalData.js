import { loadJornadas } from './jornadaStorage'

export function resolveEventOperationalData(appData, campaign, event, fallbackDate = '') {
  const eventDate = getEventDate(event) || normalizeDate(campaign?.date || fallbackDate)
  const trackHints = collectTrackHints(campaign, event)

  const jornadaResults = getJornadaResults(eventDate)
  const importedResults = getImportedResults(appData, eventDate, trackHints)
  const eventResults = normalizeResultsObject(event?.results)

  const results = mergeResults(
    eventResults,
    importedResults,
    jornadaResults,
  )

  const raceCount = resolveRaceCount(appData, campaign, event, eventDate, trackHints, results)
  const trackName = resolveTrackName(appData, eventDate, trackHints, event)

  return {
    date: eventDate,
    results,
    raceCount,
    trackName,
  }
}

function getJornadaResults(date) {
  if (!date || typeof window === 'undefined') return {}
  const jornadas = loadJornadas()
  const races = jornadas?.[date]?.races || {}
  const resultEntries = {}

  Object.entries(races).forEach(([raceKey, race]) => {
    if (!race) return
    resultEntries[String(race.raceNumber || raceKey)] = mapJornadaRaceToResult(race, raceKey)
  })

  return resultEntries
}

function mapJornadaRaceToResult(race, raceKey) {
  return {
    race: Number(race.raceNumber || raceKey),
    primero: race?.winner?.number || '',
    segundo: race?.second?.number || '',
    tercero: race?.third?.number || '',
    nombrePrimero: race?.winner?.name || '',
    nombreSegundo: race?.second?.name || '',
    nombreTercero: race?.third?.name || '',
    ganador: race?.winner?.dividend || '',
    divSegundoPrimero: race?.winner?.divSegundo || '',
    divTerceroPrimero: race?.winner?.divTercero || '',
    divSegundo: race?.second?.dividend || '',
    divTerceroSegundo: race?.second?.divTercero || '',
    divTercero: race?.third?.dividend || '',
    favorito: race?.favorite?.number || '',
    nombreFavorito: race?.favorite?.name || '',
    retiros: Array.isArray(race?.withdrawals) ? race.withdrawals : [],
    complete: Boolean(race?.winner?.number),
  }
}

function getImportedResults(appData, date, trackHints) {
  const events = Array.isArray(appData?.events) ? appData.events : Object.values(appData?.events || {})
  const importedEventsForDate = events.filter((event) => {
    const eventDate = getEventDate(event)
    if (eventDate !== date) return false
    const isImported = String(event?.id || '').startsWith('imported-') || event?.meta?.autoImported || event?.campaignType === 'imported'
    if (!isImported) return false
    return true
  })

  const matchingEvents = importedEventsForDate.filter((event) => (
    matchesTrackHints(trackHints, event?.meta?.trackName || event?.meta?.trackId || event?.sheetName)
  ))

  const resolvedEvents = matchingEvents.length > 0
    ? matchingEvents
    : (importedEventsForDate.length === 1 ? importedEventsForDate : [])

  return resolvedEvents.reduce((acc, event) => ({
    ...acc,
    ...normalizeResultsObject(event?.results),
  }), {})
}

function resolveRaceCount(appData, campaign, event, date, trackHints, results) {
  const fromConfigured = Math.max(
    Number(event?.races || 0),
    Number(event?.meta?.raceCount || 0),
    Number(campaign?.raceCount) || 0,
  )

  const fromParticipantPicks = Math.max(
    0,
    ...((event?.participants || []).map((participant) => getMeaningfulPickCount(participant?.picks))),
  )

  const programs = Array.isArray(appData?.programs) ? appData.programs : Object.values(appData?.programs || {})
  const fromPrograms = Math.max(
    0,
    ...programs
      .filter((program) => normalizeDate(program?.date) === date)
      .filter((program) => matchesTrackHints(trackHints, program?.trackName || program?.trackId))
      .map((program) => {
        if (Array.isArray(program?.races)) return program.races.length
        return Object.keys(program?.races || {}).length
      }),
  )

  const fromResults = Object.keys(results || {}).length

  if (fromPrograms > 0 || fromResults > 0) {
    return Math.max(fromPrograms, fromResults, fromParticipantPicks, 0)
  }

  return Math.max(fromConfigured, fromParticipantPicks, 0)
}

function resolveTrackName(appData, date, trackHints, event) {
  if (event?.meta?.trackName) return event.meta.trackName

  const programs = Array.isArray(appData?.programs) ? appData.programs : Object.values(appData?.programs || {})
  const matchingProgram = programs.find((program) => (
    normalizeDate(program?.date) === date &&
    matchesTrackHints(trackHints, program?.trackName || program?.trackId)
  ))

  return matchingProgram?.trackName || matchingProgram?.trackId || event?.sheetName || ''
}

function collectTrackHints(campaign, event) {
  const hints = new Set()
  ;(campaign?.hipodromos || []).forEach((value) => {
    const normalized = normalizeText(value)
    if (normalized) hints.add(normalized)
  })
  ;[
    campaign?.hippodrome,
    campaign?.trackId,
    event?.meta?.trackName,
    event?.meta?.trackId,
  ].forEach((value) => {
    const normalized = normalizeText(value)
    if (normalized) hints.add(normalized)
  })
  return Array.from(hints)
}

function matchesTrackHints(trackHints, candidateValue) {
  if (!trackHints.length) return true
  const candidate = normalizeText(candidateValue)
  if (!candidate) return true
  return trackHints.some((hint) => candidate.includes(hint) || hint.includes(candidate))
}

function normalizeResultsObject(results) {
  if (!results || typeof results !== 'object') return {}
  const normalized = {}

  Object.entries(results).forEach(([key, value]) => {
    const raceKey = String(value?.race || key)
    normalized[raceKey] = normalizeRaceResult(value, raceKey)
  })

  return normalized
}

function mergeResults(...sources) {
  return sources.reduce((acc, source) => {
    const normalizedSource = normalizeResultsObject(source)
    Object.entries(normalizedSource).forEach(([raceKey, race]) => {
      acc[raceKey] = {
        ...(acc[raceKey] || {}),
        ...race,
      }
    })
    return acc
  }, {})
}

function normalizeRaceResult(result, raceKey) {
  if (!result || typeof result !== 'object') return result

  return {
    ...result,
    race: Number(result.race || raceKey),
    ganador: normalizeDividend(result.ganador),
    divSegundoPrimero: normalizeDividend(result.divSegundoPrimero),
    divTerceroPrimero: normalizeDividend(result.divTerceroPrimero),
    divSegundo: normalizeDividend(result.divSegundo),
    divTerceroSegundo: normalizeDividend(result.divTerceroSegundo),
    divTercero: normalizeDividend(result.divTercero),
  }
}

function normalizeDividend(value) {
  if (value === undefined || value === null || value === '') return value
  if (typeof value === 'number') return value

  const stringValue = String(value).trim()
  if (!stringValue) return ''

  if (stringValue.includes(',')) {
    const normalized = Number(stringValue.replace(/\./g, '').replace(',', '.'))
    return Number.isFinite(normalized) ? normalized : value
  }

  const normalized = Number(stringValue)
  return Number.isFinite(normalized) ? normalized : value
}

function hasResultEntries(results) {
  return Object.values(results || {}).some((race) => race && (race.primero || race.winner?.number))
}

function getEventDate(event) {
  return normalizeDate(event?.meta?.date || event?.date || event?.id || event?.sheetName)
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
    return new Date(value).toISOString().slice(0, 10)
  } catch {
    return null
  }
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function getMeaningfulPickCount(picks) {
  if (!Array.isArray(picks)) return 0

  for (let index = picks.length - 1; index >= 0; index -= 1) {
    const pick = picks[index]
    const normalized = typeof pick === 'object'
      ? (pick?.horse ?? pick?.number ?? pick?.pick ?? pick?.value ?? '')
      : pick

    if (normalized !== undefined && normalized !== null && String(normalized).trim() !== '') {
      return index + 1
    }
  }

  return 0
}
