import { loadJornadas } from './jornadaStorage'

export function resolveEventOperationalData(appData, campaign, event, fallbackDate = '') {
  const eventDate = getEventDate(event) || normalizeDate(campaign?.date || fallbackDate)
  const trackHints = collectTrackHints(campaign, event)

  const jornadaResults = getJornadaResults(eventDate)
  const importedResults = getImportedResults(appData, eventDate, trackHints)
  const eventResults = normalizeResultsObject(event?.results)

  const results = hasResultEntries(jornadaResults)
    ? jornadaResults
    : hasResultEntries(importedResults)
      ? importedResults
      : eventResults

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
  const matchingEvents = events.filter((event) => {
    const eventDate = getEventDate(event)
    if (eventDate !== date) return false
    const isImported = String(event?.id || '').startsWith('imported-') || event?.meta?.autoImported || event?.campaignType === 'imported'
    if (!isImported) return false
    return matchesTrackHints(trackHints, event?.meta?.trackName || event?.meta?.trackId || event?.sheetName)
  })

  return matchingEvents.reduce((acc, event) => ({
    ...acc,
    ...normalizeResultsObject(event?.results),
  }), {})
}

function resolveRaceCount(appData, campaign, event, date, trackHints, results) {
  const fromEvent = Math.max(
    Number(event?.races || 0),
    Number(event?.meta?.raceCount || 0),
    ...((event?.participants || []).map((participant) => Array.isArray(participant?.picks) ? participant.picks.length : 0)),
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

  return Math.max(
    fromEvent,
    fromPrograms,
    fromResults,
    Number(campaign?.raceCount) || 0,
    0,
  )
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
    event?.sheetName,
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
    normalized[raceKey] = value
  })

  return normalized
}

function hasResultEntries(results) {
  return Object.values(results || {}).some((race) => race && (race.primero || race.winner?.number))
}

function getEventDate(event) {
  return normalizeDate(event?.meta?.date || event?.date || event?.sheetName)
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
