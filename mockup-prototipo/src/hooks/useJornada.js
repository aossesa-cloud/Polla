import { useState, useEffect, useCallback, useMemo } from 'react'
import useAppStore from '../store/useAppStore'
import {
  getJornada,
  applyManualOverride,
  resolveAlert,
  getAuditLog,
} from '../services/jornadaStorage'
import { RACE_STATUS, ALERT_TYPES } from '../engine/raceWatcher'

function mergeRunner(existingRunner, importedRunner) {
  if (!existingRunner) return importedRunner
  if (!importedRunner) return existingRunner

  return {
    ...importedRunner,
    ...existingRunner,
    number: existingRunner.number || importedRunner.number,
    name: existingRunner.name || importedRunner.name,
    dividend: existingRunner.dividend || importedRunner.dividend,
    divSegundo: existingRunner.divSegundo || importedRunner.divSegundo,
    divTercero: existingRunner.divTercero || importedRunner.divTercero,
  }
}

function mergeAlerts(existingAlerts = [], importedAlerts = []) {
  const existing = Array.isArray(existingAlerts) ? existingAlerts : []
  const imported = Array.isArray(importedAlerts) ? importedAlerts : []

  const resolvedKeys = new Set(
    existing
      .filter(alert => alert?.resolvedAt)
      .map(alert => `${alert.type}::${alert.message}`)
  )

  const pendingExisting = existing.filter(alert => !alert?.resolvedAt)
  const resolvedExisting = existing.filter(alert => alert?.resolvedAt)
  const pendingImported = imported.filter(alert => !resolvedKeys.has(`${alert.type}::${alert.message}`))

  return [...resolvedExisting, ...pendingExisting, ...pendingImported]
}

function mergeRaceEntries(existingRace, importedRace) {
  if (!existingRace) return importedRace

  const merged = {
    ...existingRace,
    ...importedRace,
    winner: mergeRunner(existingRace.winner, importedRace.winner),
    second: mergeRunner(existingRace.second, importedRace.second),
    third: mergeRunner(existingRace.third, importedRace.third),
    favorite: mergeRunner(existingRace.favorite, importedRace.favorite),
    withdrawals: Array.isArray(existingRace.withdrawals) && existingRace.withdrawals.length > 0
      ? existingRace.withdrawals
      : importedRace.withdrawals,
    ties: Array.isArray(existingRace.ties) && existingRace.ties.length > 0
      ? existingRace.ties
      : importedRace.ties,
    alerts: mergeAlerts(existingRace.alerts, importedRace.alerts),
    manualOverrides: existingRace.manualOverrides || importedRace.manualOverrides || [],
    createdAt: existingRace.createdAt || importedRace.createdAt,
    updatedAt: importedRace.updatedAt || existingRace.updatedAt || new Date().toISOString(),
  }

  const manuallyEditedFields = new Set(
    (existingRace.manualOverrides || [])
      .map(override => String(override.field || '').split('.')[0])
      .filter(Boolean)
  )

  if (manuallyEditedFields.has('winner')) merged.winner = existingRace.winner
  if (manuallyEditedFields.has('second')) merged.second = existingRace.second
  if (manuallyEditedFields.has('third')) merged.third = existingRace.third
  if (manuallyEditedFields.has('favorite')) merged.favorite = existingRace.favorite
  if (manuallyEditedFields.has('withdrawals')) merged.withdrawals = existingRace.withdrawals
  if (manuallyEditedFields.has('ties')) merged.ties = existingRace.ties

  return merged
}

function extractImportedEventDate(eventData = {}) {
  const rawId = String(eventData.id || '')
  const rawDate = String(eventData.meta?.date || '')

  if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
    return rawDate
  }

  if (rawId.startsWith('imported-')) {
    const normalized = rawId.replace('imported-', '').split('::')[0]
    if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
      return normalized
    }
  }

  return ''
}

async function buildJornadaData(fecha, appData) {
  if (!fecha) return null

  const events = appData?.events || []
  const eventsArray = Array.isArray(events) ? events : Object.values(events || {})

  const importedEvents = eventsArray.filter(ev => {
    const isImported = (ev.id || '').startsWith('imported-') || ev.meta?.autoImported
    const eventDate = extractImportedEventDate(ev)
    return isImported && eventDate === fecha
  })

  const localJornada = await getJornada(fecha).catch(() => null)
  let jornadaData = localJornada

  if (importedEvents.length === 0) {
    return jornadaData
  }

  if (!jornadaData) {
    const firstEvent = importedEvents[0]
    jornadaData = {
      fecha,
      hipodromo: firstEvent?.meta?.trackName || 'desconocido',
      trackId: firstEvent?.meta?.trackId,
      status: 'partial',
      races: {},
      alerts: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }

  if (!jornadaData.races) jornadaData.races = {}

  for (const eventData of importedEvents) {
    const resultsArray = Array.isArray(eventData.results) ? eventData.results : []

    const programs = appData?.programs || []
    const programsList = Array.isArray(programs) ? programs : Object.values(programs || {})
    const program = programsList.find(p => {
      const pDate = p.date || p.key?.split('::')[0] || ''
      return pDate === fecha || pDate?.includes(fecha) || fecha?.includes(pDate)
    })
    const racesData = program?.races || {}
    const raceCount = Array.isArray(racesData) ? racesData.length : Object.keys(racesData).length

    const resultsMap = {}
    for (const raceResult of resultsArray) {
      const raceKey = String(raceResult.race || raceResult.raceNumber || '')
      if (raceKey) {
        resultsMap[raceKey] = raceResult
      }
    }

    for (let raceNum = 1; raceNum <= raceCount; raceNum++) {
      const raceKey = String(raceNum)
      const raceResult = resultsMap[raceKey] || null
      const existingRace = jornadaData.races[raceKey]

      const racesArray = Array.isArray(racesData) ? racesData : Object.values(racesData)
      const raceData = racesArray.find(r => Number(r.raceNumber || r.race) === raceNum) || racesArray[raceNum - 1]
      const raceName = raceData?.label || raceData?.name || `Carrera ${raceNum}`
      const runners = Array.isArray(raceData?.runners)
        ? raceData.runners
        : (Array.isArray(raceData?.entries) ? raceData.entries : [])

      const findRunnerByNumber = (number) => {
        if (!number || !runners.length) return null
        const numStr = String(number).trim()
        return runners.find(r => {
          const rNum = String(r.number || r.programNumber || r.runnerNumber || '').trim()
          return rNum === numStr
        }) || null
      }

      if (!raceResult) {
        if (!existingRace) {
          jornadaData.races[raceKey] = {
            raceNumber: raceNum,
            status: RACE_STATUS.RESULTS_PARTIAL,
            raceName,
            winner: null,
            second: null,
            third: null,
            favorite: null,
            withdrawals: [],
            ties: [],
            confirmedByTeletac: false,
            sourceStatus: 'missing',
            alerts: [{
              type: ALERT_TYPES.INCOMPLETE_RESULTS,
              message: `Carrera ${raceNum}: Sin resultados`,
              severity: 'high',
              createdAt: new Date().toISOString(),
            }],
            manualOverrides: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        }
        continue
      }

      const firstRunner = findRunnerByNumber(raceResult.primero)
      const secondRunner = findRunnerByNumber(raceResult.segundo)
      const thirdRunner = findRunnerByNumber(raceResult.tercero)
      const favRunner = findRunnerByNumber(raceResult.favorito || raceResult.favorite)

      const alerts = []
      if (!raceResult.ganador && raceResult.primero) {
        alerts.push({ type: ALERT_TYPES.MISSING_WIN_DIVIDEND, message: 'Falta dividendo ganador', severity: 'high', createdAt: new Date().toISOString() })
      }
      if (!raceResult.favorito && !raceResult.favorite) {
        alerts.push({ type: ALERT_TYPES.MISSING_FAVORITE, message: 'Falta favorito', severity: 'medium', createdAt: new Date().toISOString() })
      }

      const importedRace = {
        raceNumber: raceNum,
        status: raceResult.complete ? RACE_STATUS.OFFICIAL : (alerts.length > 0 ? RACE_STATUS.RESULTS_PARTIAL : RACE_STATUS.RESULTS_READY),
        raceName,
        winner: {
          number: firstRunner?.number || raceResult.primero || '-',
          name: firstRunner?.name || '',
          dividend: raceResult.ganador,
          divSegundo: raceResult.divSegundoPrimero,
          divTercero: raceResult.divTerceroPrimero,
        },
        second: secondRunner ? {
          number: secondRunner.number,
          name: secondRunner.name,
          dividend: raceResult.divSegundo,
          divTercero: raceResult.divTerceroSegundo,
        } : null,
        third: thirdRunner ? {
          number: thirdRunner.number,
          name: thirdRunner.name,
          dividend: raceResult.divTercero,
        } : null,
        favorite: favRunner ? { number: favRunner.number, name: favRunner.name } : null,
        withdrawals: raceResult.retiros || raceResult.withdrawals || [],
        ties: raceResult.empates || raceResult.ties || [],
        confirmedByTeletac: raceResult.complete || false,
        sourceStatus: 'imported',
        alerts,
        manualOverrides: existingRace?.manualOverrides || [],
        createdAt: existingRace?.createdAt || eventData.meta?.importedAt || new Date().toISOString(),
        updatedAt: eventData.meta?.lastUpdated || new Date().toISOString(),
      }

      jornadaData.races[raceKey] = mergeRaceEntries(existingRace, importedRace)
    }
  }

  jornadaData.updatedAt = new Date().toISOString()
  return jornadaData
}

export function useJornada(fecha) {
  const { appData } = useAppStore()
  const [jornada, setJornada] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!fecha) return
    setLoading(true)

    buildJornadaData(fecha, appData)
      .then(jornadaData => {
        setJornada(jornadaData)
        setError(null)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [fecha, appData])

  const resultados = useMemo(() => {
    return jornada?.races || {}
  }, [jornada])

  const getCarrera = useCallback((raceNumber) => {
    return jornada?.races?.[String(raceNumber)] || null
  }, [jornada])

  const alertas = useMemo(() => {
    if (!jornada?.races) return []
    return Object.entries(jornada.races).flatMap(([num, race]) =>
      (race.alerts || [])
        .filter(a => !a.resolvedAt)
        .map(a => ({ ...a, raceNumber: num }))
    )
  }, [jornada])

  const aplicarOverride = useCallback(async (raceNumber, field, oldValue, newValue, user, reason) => {
    const updated = await applyManualOverride(fecha, raceNumber, field, oldValue, newValue, user, reason)
    setJornada(prev => ({
      ...prev,
      races: { ...prev.races, [String(raceNumber)]: updated }
    }))
    return updated
  }, [fecha])

  const resolverAlerta = useCallback(async (raceNumber, alertIndex, user) => {
    const updated = await resolveAlert(fecha, raceNumber, alertIndex, user)
    setJornada(prev => ({
      ...prev,
      races: { ...prev.races, [String(raceNumber)]: updated }
    }))
    return updated
  }, [fecha])

  const auditLog = useMemo(() => getAuditLog(fecha), [fecha])

  const refresh = useCallback(async () => {
    if (!fecha) return
    try {
      const data = await buildJornadaData(fecha, appData)
      setJornada(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    }
  }, [fecha, appData])

  return {
    jornada,
    loading,
    error,
    resultados,
    getCarrera,
    alertas,
    aplicarOverride,
    resolverAlerta,
    auditLog,
    refresh,
  }
}

export function useJornadaDates() {
  const { appData } = useAppStore()
  const [dates, setDates] = useState([])

  useEffect(() => {
    const allDates = new Set()

    try {
      const raw = localStorage.getItem('pollas-jornadas')
      const jornadas = raw ? JSON.parse(raw) : {}
      Object.keys(jornadas).forEach(d => allDates.add(d))
    } catch {}

    const events = appData?.events || []
    const eventsList = Array.isArray(events) ? events : Object.values(events)

    for (const ev of eventsList) {
      const eventId = Array.isArray(events) ? ev.id : ev
      const eventData = Array.isArray(events) ? ev : (events[ev] || {})

      if ((eventId || '').startsWith('imported-') || eventData.meta?.autoImported) {
        const date = extractImportedEventDate({ ...eventData, id: eventId || eventData.id })
        if (date) {
          allDates.add(date)
        }
      }

      if (eventData.meta?.date && /\d{4}-\d{2}-\d{2}/.test(eventData.meta.date)) {
        allDates.add(eventData.meta.date)
      }
    }

    const programs = appData?.programs || []
    const programsList = Array.isArray(programs) ? programs : Object.values(programs)
    for (const prog of programsList) {
      const date = prog.date || (prog.key || '').split('::')[0]
      if (date && /\d{4}-\d{2}-\d{2}/.test(date)) {
        allDates.add(date)
      }
    }

    setDates(Array.from(allDates).sort().reverse())
  }, [appData])

  return dates
}
