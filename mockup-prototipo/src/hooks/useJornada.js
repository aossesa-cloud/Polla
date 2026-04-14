/**
 * useJornada.js
 *
 * Hook para acceder y manipular datos de jornadas.
 * Lee de DOS fuentes:
 * 1. Storage local de jornadas (nuevo modelo)
 * 2. Backend legacy (eventos importados automáticamente por el scheduler)
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import useAppStore from '../store/useAppStore'
import {
  getJornada,
  saveJornada,
  getResultados as getLocalResultados,
  getResultadoCarrera as getLocalResultadoCarrera,
  applyManualOverride,
  resolveAlert,
  getAuditLog,
} from '../services/jornadaStorage'
import { RACE_STATUS, ALERT_TYPES } from '../engine/raceWatcher'

export function useJornada(fecha) {
  const { appData } = useAppStore()
  const [jornada, setJornada] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Cargar jornada (local + legacy)
  useEffect(() => {
    if (!fecha) return
    setLoading(true)

    // Obtener eventos importados del backend (appData.events puede ser array u objeto)
    const events = appData?.events || []
    const eventsArray = Array.isArray(events) ? events : Object.values(events || {})
    
    const importedEvents = eventsArray.filter(ev => {
      const isImported = (ev.id || '').startsWith('imported-') || ev.meta?.autoImported
      const eventDate = ev.meta?.date || (ev.id || '').replace('imported-', '')
      return isImported && eventDate === fecha
    })

    getJornada(fecha).catch(() => null)
      .then(localJornada => {
        // Si hay eventos importados, crear jornada si no existe
        let jornadaData = localJornada

        if (importedEvents.length > 0) {
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

          // Merge de resultados importadas
          for (const eventData of importedEvents) {
            // results viene como array del adaptador
            const resultsArray = Array.isArray(eventData.results)
              ? eventData.results
              : []

            // Obtener número total de carreras del programa
            const programs = appData?.programs || []
            const programsList = Array.isArray(programs) ? programs : Object.values(programs || {})
            const program = programsList.find(p => {
              const pDate = p.date || p.key?.split('::')[0] || ''
              return pDate === fecha || pDate?.includes(fecha) || fecha?.includes(pDate)
            })
            const racesData = program?.races || {}
            const raceCount = Array.isArray(racesData) ? racesData.length : Object.keys(racesData).length

            // Crear un mapa de resultados por número de carrera
            const resultsMap = {}
            for (const raceResult of resultsArray) {
              const raceKey = String(raceResult.race || raceResult.raceNumber || '')
              if (raceKey) {
                resultsMap[raceKey] = raceResult
              }
            }

            // Iterar por TODAS las carreras del programa (1 a raceCount)
            for (let raceNum = 1; raceNum <= raceCount; raceNum++) {
              const correctedRaceNum = String(raceNum)
              const displayRaceNum = raceNum
              const raceResult = resultsMap[correctedRaceNum] || null

              // Obtener datos del programa para esta carrera
              const racesArray = Array.isArray(racesData) ? racesData : Object.values(racesData)
              const raceData = racesArray.find(r => Number(r.raceNumber || r.race) === raceNum) || racesArray[raceNum - 1]
              const raceName = raceData?.label || raceData?.name || `Carrera ${raceNum}`
              const runners = Array.isArray(raceData?.runners)
                ? raceData.runners
                : (Array.isArray(raceData?.entries) ? raceData.entries : [])

              // Buscar runner por número
              const findRunnerByNumber = (number) => {
                if (!number || !runners.length) return null
                const numStr = String(number).trim()
                return runners.find(r => {
                  const rNum = String(r.number || r.programNumber || r.runnerNumber || '').trim()
                  return rNum === numStr
                }) || null
              }

              if (!jornadaData.races[correctedRaceNum]) {
                if (!raceResult) {
                  // No hay resultado para esta carrera - crear con alerta
                  jornadaData.races[correctedRaceNum] = {
                    raceNumber: displayRaceNum,
                    status: RACE_STATUS.RESULTS_PARTIAL,
                    raceName: raceName,
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
                } else {
                  // Hay resultado: buscar nombres y generar alertas si faltan datos
                  const firstRunner = findRunnerByNumber(raceResult.primero)
                  const secondRunner = findRunnerByNumber(raceResult.segundo)
                  const thirdRunner = findRunnerByNumber(raceResult.tercero)
                  const favRunner = findRunnerByNumber(raceResult.favorito || raceResult.favorite)

                  // Verificar datos incompletos y generar alertas
                  const alerts = []
                  if (!raceResult.ganador && raceResult.primero) {
                    alerts.push({ type: ALERT_TYPES.MISSING_WIN_DIVIDEND, message: `Falta dividendo ganador`, severity: 'high', createdAt: new Date().toISOString() })
                  }
                  if (!raceResult.favorito && !raceResult.favorite) {
                    alerts.push({ type: ALERT_TYPES.MISSING_FAVORITE, message: `Falta favorito`, severity: 'medium', createdAt: new Date().toISOString() })
                  }

                  jornadaData.races[correctedRaceNum] = {
                    raceNumber: displayRaceNum,
                    status: raceResult.complete ? RACE_STATUS.OFFICIAL : (alerts.length > 0 ? RACE_STATUS.RESULTS_PARTIAL : RACE_STATUS.RESULTS_READY),
                    raceName: raceName,
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
                    alerts: alerts,
                    manualOverrides: [],
                    createdAt: eventData.meta?.importedAt || new Date().toISOString(),
                    updatedAt: eventData.meta?.lastUpdated || new Date().toISOString(),
                  }
                }
              }
            }
          }

          jornadaData.updatedAt = new Date().toISOString()
        }

        setJornada(jornadaData)
        setError(null)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [fecha, appData])

  // Obtener resultados
  const resultados = useMemo(() => {
    return jornada?.races || {}
  }, [jornada])

  // Obtener carrera específica
  const getCarrera = useCallback((raceNumber) => {
    return jornada?.races?.[String(raceNumber)] || null
  }, [jornada])

  // Alertas activas
  const alertas = useMemo(() => {
    if (!jornada?.races) return []
    return Object.entries(jornada.races).flatMap(([num, race]) =>
      (race.alerts || [])
        .filter(a => !a.resolvedAt)
        .map(a => ({ ...a, raceNumber: num }))
    )
  }, [jornada])

  // Aplicar override manual
  const aplicarOverride = useCallback(async (raceNumber, field, oldValue, newValue, user, reason) => {
    const updated = await applyManualOverride(fecha, raceNumber, field, oldValue, newValue, user, reason)
    setJornada(prev => ({
      ...prev,
      races: { ...prev.races, [String(raceNumber)]: updated }
    }))
    return updated
  }, [fecha])

  // Resolver alerta
  const resolverAlerta = useCallback(async (raceNumber, alertIndex, user) => {
    const updated = await resolveAlert(fecha, raceNumber, alertIndex, user)
    setJornada(prev => ({
      ...prev,
      races: { ...prev.races, [String(raceNumber)]: updated }
    }))
    return updated
  }, [fecha])

  // Log de auditoría
  const auditLog = useMemo(() => getAuditLog(fecha), [fecha])

  // Refresh manual
  const refresh = useCallback(async () => {
    if (!fecha) return
    try {
      const data = await getJornada(fecha)
      setJornada(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    }
  }, [fecha])

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

/**
 * Hook para obtener lista de fechas con jornadas disponibles.
 * Combina:
 * 1. Jornadas del storage local (nuevo modelo)
 * 2. Eventos importados automáticamente del backend (legacy)
 * 3. Programas cargados
 */
export function useJornadaDates() {
  const { appData } = useAppStore()
  const [dates, setDates] = useState([])

  useEffect(() => {
    const allDates = new Set()

    // 1. Fechas del storage local de jornadas
    try {
      const raw = localStorage.getItem('pollas-jornadas')
      const jornadas = raw ? JSON.parse(raw) : {}
      Object.keys(jornadas).forEach(d => allDates.add(d))
    } catch {}

    // 2. Fechas de eventos importados del backend
    // appData.events puede ser un array (adaptado) o un objeto (raw)
    const events = appData?.events || []
    const eventsList = Array.isArray(events) ? events : Object.values(events)
    
    for (const ev of eventsList) {
      const eventObj = Array.isArray(events) ? ev : null
      const eventId = Array.isArray(events) ? ev.id : ev
      const eventData = Array.isArray(events) ? ev : (events[ev] || {})
      
      // Imported events
      if ((eventId || '').startsWith('imported-') || eventData.meta?.autoImported) {
        const date = eventData.meta?.date || (eventId || '').replace('imported-', '')
        if (date && /\d{4}-\d{2}-\d{2}/.test(date)) {
          allDates.add(date)
        }
      }
      
      // Cualquier evento con fecha en meta
      if (eventData.meta?.date && /\d{4}-\d{2}-\d{2}/.test(eventData.meta.date)) {
        allDates.add(eventData.meta.date)
      }
    }

    // 3. Fechas de programas cargados
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
