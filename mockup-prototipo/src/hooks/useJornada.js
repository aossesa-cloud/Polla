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
  const importedKeys = new Set(imported.map(getAlertKey))

  const mergedImported = imported.map((alert) => {
    const existingAlert = existing.find((candidate) => getAlertKey(candidate) === getAlertKey(alert))
    if (existingAlert?.resolvedAt) {
      return { ...alert, resolvedAt: existingAlert.resolvedAt, resolvedBy: existingAlert.resolvedBy }
    }
    return alert
  })

  const resolvedHistory = existing.filter((alert) => alert?.resolvedAt && !importedKeys.has(getAlertKey(alert)))

  return [...resolvedHistory, ...mergedImported]
}

function getAlertKey(alert) {
  return `${String(alert?.type || '')}::${String(alert?.message || '')}`
}

function buildRaceAlerts(race) {
  if (!race) return []

  const alerts = []
  const timestamp = new Date().toISOString()

  if (!race.favorite?.number) {
    alerts.push({
      type: ALERT_TYPES.MISSING_FAVORITE,
      message: 'Falta favorito',
      severity: 'medium',
      createdAt: timestamp,
    })
  }

  if (race.winner?.number && !race.winner?.name) {
    alerts.push({
      type: ALERT_TYPES.MISSING_RESULT_NAME,
      message: 'Falta nombre del ganador',
      severity: 'low',
      createdAt: timestamp,
    })
  }

  if (race.winner?.number && !hasValue(race.winner?.dividend)) {
    alerts.push({
      type: ALERT_TYPES.MISSING_WIN_DIVIDEND,
      message: 'Falta dividendo ganador',
      severity: 'medium',
      createdAt: timestamp,
    })
  }

  return alerts
}

function hasValue(value) {
  return !(value === undefined || value === null || value === '')
}

function resolveRaceStatus(race, alerts = []) {
  const pendingAlerts = alerts.filter((alert) => !alert?.resolvedAt)
  const hasWinner = Boolean(race?.winner?.number)
  const hasSecond = Boolean(race?.second?.number)
  const hasThird = Boolean(race?.third?.number)
  const ties = Array.isArray(race?.ties) ? race.ties : []
  const hasTiedSecond = ties.some((tie) => Number(tie?.position) === 2 && tie?.number)
  const hasTiedThird = ties.some((tie) => Number(tie?.position) === 3 && tie?.number)
  const hasCompletePodium = hasWinner && (
    hasThird ||
    hasTiedThird ||
    (hasSecond && hasTiedSecond)
  )

  if (race?.confirmedByTeletac) {
    return pendingAlerts.length > 0 ? RACE_STATUS.OFFICIAL_WITH_ALERT : RACE_STATUS.OFFICIAL
  }

  if (!hasWinner && !hasSecond && !hasThird) {
    return RACE_STATUS.PENDING
  }

  if (pendingAlerts.length > 0) {
    return RACE_STATUS.RESULTS_PARTIAL
  }

  if (hasCompletePodium || hasWinner) {
    return RACE_STATUS.RESULTS_READY
  }

  return RACE_STATUS.PENDING
}

function mergeRaceEntries(existingRace, importedRace) {
  const existing = existingRace || null
  const imported = importedRace || null

  if (!existing) {
    const alerts = mergeAlerts([], buildRaceAlerts(imported))
    return {
      ...imported,
      alerts,
      status: resolveRaceStatus(imported, alerts),
    }
  }

  if (!imported) {
    const alerts = mergeAlerts(existing.alerts, buildRaceAlerts(existing))
    return {
      ...existing,
      alerts,
      status: resolveRaceStatus(existing, alerts),
    }
  }

  const merged = {
    ...imported,
    ...existing,
    raceNumber: existing.raceNumber || imported.raceNumber,
    raceName: existing.raceName || imported.raceName,
    winner: mergeRunner(existing.winner, imported.winner),
    second: mergeRunner(existing.second, imported.second),
    third: mergeRunner(existing.third, imported.third),
    favorite: mergeRunner(existing.favorite, imported.favorite),
    withdrawals: Array.isArray(existing.withdrawals) && existing.withdrawals.length > 0
      ? existing.withdrawals
      : (Array.isArray(imported.withdrawals) ? imported.withdrawals : []),
    ties: Array.isArray(existing.ties) && existing.ties.length > 0
      ? existing.ties
      : (Array.isArray(imported.ties) ? imported.ties : []),
    manualOverrides: Array.isArray(existing.manualOverrides) ? existing.manualOverrides : (imported.manualOverrides || []),
    createdAt: existing.createdAt || imported.createdAt || new Date().toISOString(),
    updatedAt: imported.updatedAt || existing.updatedAt || new Date().toISOString(),
    confirmedByTeletac: Boolean(existing.confirmedByTeletac || imported.confirmedByTeletac),
    sourceStatus: imported.sourceStatus || existing.sourceStatus || 'manual',
  }

  const alerts = mergeAlerts(existing.alerts, buildRaceAlerts(merged))
  return {
    ...merged,
    alerts,
    status: resolveRaceStatus(merged, alerts),
  }
}

function normalizeDateValue(value) {
  if (!value) return null
  const text = String(value).trim()
  if (!text) return null

  const exact = text.match(/\b\d{4}-\d{2}-\d{2}\b/)
  if (exact) return exact[0]

  const latin = text.match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b/)
  if (latin) {
    const [, day, month, year] = latin
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  return null
}

function extractImportedEventDate(event) {
  const candidates = [
    event?.meta?.date,
    event?.date,
    event?.sheetName,
    event?.id,
  ]

  for (const candidate of candidates) {
    const normalized = normalizeDateValue(candidate)
    if (normalized) return normalized
  }

  return null
}

function normalizeResultsObject(results) {
  if (!results || typeof results !== 'object') return {}

  return Object.entries(results).reduce((acc, [key, value]) => {
    if (!value || typeof value !== 'object') return acc
    const raceKey = String(value.race || key)
    acc[raceKey] = { ...value, race: Number(value.race || key) }
    return acc
  }, {})
}

function getProgramsForDate(appData, fecha) {
  const programs = Array.isArray(appData?.programs) ? appData.programs : Object.values(appData?.programs || {})
  return programs.filter((program) => normalizeDateValue(program?.date || program?.key) === fecha)
}

function findRaceProgram(programs, raceNumber) {
  for (const program of programs) {
    const races = Array.isArray(program?.races) ? program.races : Object.values(program?.races || {})
    const match = races.find((race, index) => Number(race?.raceNumber || race?.numero || index + 1) === Number(raceNumber))
    if (match) return match
  }
  return null
}

function findRunner(raceProgram, runnerNumber) {
  if (!raceProgram || !runnerNumber) return null
  const entries = raceProgram.runners || raceProgram.entries || []
  return entries.find((runner, index) => String(runner?.number || runner?.numero || index + 1) === String(runnerNumber)) || null
}

function buildRunnerResult(number, runner, extras = {}) {
  if (!number && !runner && !hasValue(extras.dividend) && !hasValue(extras.divSegundo) && !hasValue(extras.divTercero)) {
    return null
  }

  return {
    number: number || runner?.number || runner?.numero || '-',
    name: runner?.name || runner?.ejemplar || runner?.nombre || '',
    ...extras,
  }
}

function buildImportedTies(raceResult, raceProgram) {
  const ties = []

  const pushTie = (position, explicitNumber, explicitDividend, nameKey = '', extras = {}) => {
    if (!explicitNumber) return
    const runner = findRunner(raceProgram, explicitNumber)
    ties.push({
      position,
      number: String(explicitNumber),
      name: runner?.name || runner?.ejemplar || runner?.nombre || raceResult?.[nameKey] || '',
      dividend: explicitDividend || '',
      ...extras,
    })
  }

  pushTie(1, raceResult?.empatePrimero, raceResult?.empatePrimeroGanador, 'nombreEmpatePrimero', {
    divSegundo: raceResult?.empatePrimeroDivSegundo || '',
    divTercero: raceResult?.empatePrimeroDivTercero || '',
  })
  pushTie(2, raceResult?.empateSegundo, raceResult?.empateSegundoDivSegundo, 'nombreEmpateSegundo', {
    divTercero: raceResult?.empateSegundoDivTercero || '',
  })
  pushTie(3, raceResult?.empateTercero, raceResult?.empateTerceroDivTercero, 'nombreEmpateTercero')

  return ties
}

async function buildJornadaData(fecha, appData) {
  const existingJornada = await getJornada(fecha)
  const now = new Date().toISOString()
  const jornadaData = {
    fecha,
    date: fecha,
    hipodromo: existingJornada?.hipodromo || 'importado',
    status: existingJornada?.status || 'pending',
    alerts: Array.isArray(existingJornada?.alerts) ? existingJornada.alerts : [],
    races: { ...(existingJornada?.races || {}) },
    createdAt: existingJornada?.createdAt || now,
    updatedAt: now,
  }

  const programsForDate = getProgramsForDate(appData, fecha)
  const events = Array.isArray(appData?.events) ? appData.events : Object.values(appData?.events || {})
  const eventsForDate = events.filter((event) => extractImportedEventDate(event) === fecha)

  for (const eventData of eventsForDate) {
    const normalizedResults = normalizeResultsObject(eventData?.results)

    for (const [raceKey, raceResult] of Object.entries(normalizedResults)) {
      const raceNum = Number(raceResult?.race || raceKey)
      if (!Number.isFinite(raceNum) || raceNum <= 0) continue

      const existingRace = jornadaData.races[String(raceNum)] || null
      const raceProgram = findRaceProgram(programsForDate, raceNum)
      const winnerNumber = raceResult?.primero || raceResult?.winner?.number || raceResult?.first || ''
      const secondNumber = raceResult?.segundo || raceResult?.second?.number || ''
      const thirdNumber = raceResult?.tercero || raceResult?.third?.number || ''
      const favoriteNumber = raceResult?.favorito || raceResult?.favorite?.number || raceResult?.favorite || ''

      const importedRace = {
        raceNumber: raceNum,
        raceName: raceProgram?.title || raceProgram?.name || `Carrera ${raceNum}`,
        winner: buildRunnerResult(winnerNumber, findRunner(raceProgram, winnerNumber), {
          dividend: raceResult?.ganador,
          divSegundo: raceResult?.divSegundoPrimero,
          divTercero: raceResult?.divTerceroPrimero,
        }),
        second: buildRunnerResult(secondNumber, findRunner(raceProgram, secondNumber), {
          dividend: raceResult?.divSegundo,
          divTercero: raceResult?.divTerceroSegundo,
        }),
        third: buildRunnerResult(thirdNumber, findRunner(raceProgram, thirdNumber), {
          dividend: raceResult?.divTercero,
        }),
        favorite: favoriteNumber
          ? buildRunnerResult(favoriteNumber, findRunner(raceProgram, favoriteNumber))
          : null,
        withdrawals: Array.isArray(raceResult?.retiros || raceResult?.withdrawals)
          ? (raceResult?.retiros || raceResult?.withdrawals)
          : [],
        ties: Array.isArray(raceResult?.empates || raceResult?.ties) && (raceResult?.empates || raceResult?.ties).length > 0
          ? (raceResult?.empates || raceResult?.ties)
          : buildImportedTies(raceResult, raceProgram),
        confirmedByTeletac: Boolean(raceResult?.complete || raceResult?.confirmedByTeletac),
        sourceStatus: 'imported',
        manualOverrides: existingRace?.manualOverrides || [],
        createdAt: existingRace?.createdAt || eventData?.meta?.importedAt || now,
        updatedAt: eventData?.meta?.lastUpdated || now,
      }

      jornadaData.races[String(raceNum)] = mergeRaceEntries(existingRace, importedRace)
    }
  }

  Object.entries(jornadaData.races).forEach(([raceKey, race]) => {
    jornadaData.races[raceKey] = mergeRaceEntries(race, null)
  })

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
      const date = normalizeDateValue(prog.date || prog.key)
      if (date) {
        allDates.add(date)
      }
    }

    setDates(Array.from(allDates).sort().reverse())
  }, [appData])

  return dates
}
