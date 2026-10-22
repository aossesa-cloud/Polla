import React, { useState, useEffect } from 'react'
import api from '../api'
import useAppStore from '../store/useAppStore'
import { getChileDateString } from '../utils/dateChile'
import styles from './Programa.module.css'

export default function Programa() {
  const { appData, mergeMutationResponse } = useAppStore()
  const [programaActivo, setProgramaActivo] = useState('')
  const [carreraActiva, setCarreraActiva] = useState(0)
  const [importando, setImportando] = useState(false)
  const [importMsg, setImportMsg] = useState(null)
  const [fechaImportacion, setFechaImportacion] = useState(getChileDateString())
  const [tracksDisponibles, setTracksDisponibles] = useState([])
  const [trackImportacion, setTrackImportacion] = useState('')
  const [cargandoTracks, setCargandoTracks] = useState(false)

  const programs = appData?.programs || {}
  const programList = Object.entries(programs).map(([key, val]) => ({
    key,
    ...val,
    date: val.date || key.split('::')[0],
    trackId: val.trackId || key.split('::')[1]
  }))

  useEffect(() => {
    if (programList.length > 0 && !programaActivo) {
      setProgramaActivo(programList[0].key)
      setCarreraActiva(0)
    }
  }, [programList])

  // Reset carreraActiva cuando cambia el programa
  useEffect(() => {
    setCarreraActiva(0)
  }, [programaActivo])

  useEffect(() => {
    let cancelled = false
    const loadTracks = async () => {
      if (!fechaImportacion) {
        setTracksDisponibles([])
        setTrackImportacion('')
        return
      }
      setCargandoTracks(true)
      setTracksDisponibles([])
      setTrackImportacion('')
      try {
        const response = await api.fetchTeletrakTracks(fechaImportacion)
        if (response?.error) throw new Error(response.detail || response.error)
        if (cancelled) return
        const tracks = Array.isArray(response?.tracks) ? response.tracks : []
        setTracksDisponibles(tracks)
        setTrackImportacion(tracks.length ? String(tracks[0].id) : '')
        if (!tracks.length) {
          setImportMsg({ tipo: 'error', texto: 'Teletrak no informa hipódromos con carreras para esa fecha.' })
        }
      } catch (error) {
        if (!cancelled) {
          setTracksDisponibles([])
          setTrackImportacion('')
          setImportMsg({ tipo: 'error', texto: `No se pudieron consultar los hipódromos: ${error.message}` })
        }
      } finally {
        if (!cancelled) setCargandoTracks(false)
      }
    }
    loadTracks()
    return () => { cancelled = true }
  }, [fechaImportacion])

  const programaActual = programList.find(p => p.key === programaActivo) || {}
  const races = programaActual.races || []
  const raceList = Array.isArray(races) ? races : Object.values(races)

  const carreraActual = raceList[carreraActiva]
  const ejemplaresActuales = carreraActual?.runners || carreraActual?.entries || []

  const handleImportProgram = async () => {
    if (!fechaImportacion || !trackImportacion) {
      setImportMsg({ tipo: 'error', texto: 'Selecciona una fecha y un hipódromo con carreras disponibles.' })
      return
    }
    setImportando(true)
    setImportMsg(null)
    try {
      const selectedTrack = tracksDisponibles.find((track) => String(track.id) === String(trackImportacion))
      const response = await api.importTeletrakProgram(fechaImportacion, trackImportacion)
      if (response?.error) throw new Error(response.detail || response.error)
      mergeMutationResponse(response)
      if (selectedTrack?.localTrackId) setProgramaActivo(`${fechaImportacion}::${selectedTrack.localTrackId}`)
      setImportMsg({ tipo: 'ok', texto: 'Programa importado desde Teletrak' })
    } catch (err) {
      setImportMsg({ tipo: 'error', texto: `Error: ${err.message}` })
    } finally {
      setImportando(false)
    }
  }

  return (
    <div className={styles.programa}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Programa de Carreras</h1>
          <p className={styles.subtitle}>Cartilla de carreras importada desde Teletrak</p>
        </div>
        <div className={styles.headerActions}>
          <label className={styles.importField}>
            <span>Fecha</span>
            <input
              type="date"
              value={fechaImportacion}
              onChange={(e) => { setFechaImportacion(e.target.value); setImportMsg(null) }}
            />
          </label>
          <label className={styles.importField}>
            <span>Hipódromo</span>
            <select
              value={trackImportacion}
              onChange={(e) => setTrackImportacion(e.target.value)}
              disabled={cargandoTracks || tracksDisponibles.length === 0}
            >
              <option value="">{cargandoTracks ? 'Buscando carreras...' : 'Seleccionar hipódromo...'}</option>
              {tracksDisponibles.map((track) => (
                <option key={track.id} value={track.id}>{track.name}</option>
              ))}
            </select>
          </label>
          <select
            className={styles.eventSelect}
            value={programaActivo}
            onChange={(e) => { setProgramaActivo(e.target.value); setCarreraActiva(0) }}
          >
            <option value="">Seleccionar programa...</option>
            {programList.map(p => (
              <option key={p.key} value={p.key}>
                {p.trackName || p.trackId} — {p.date}
              </option>
            ))}
          </select>
          <button className={styles.importBtn} onClick={handleImportProgram} disabled={importando || cargandoTracks || !trackImportacion}>
            {importando ? 'Importando...' : '📡 Importar Teletrak'}
          </button>
        </div>
      </header>

      {importMsg && (
        <div className={`${styles.message} ${styles[importMsg.tipo]}`}>
          {importMsg.texto}
        </div>
      )}

      {!programaActivo || raceList.length === 0 ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>📄</span>
          <p>No hay programas cargados. Importa desde Teletrak.</p>
        </div>
      ) : (
        <div className={styles.layout}>
          <div className={styles.sidebar}>
            <h3 className={styles.sidebarTitle}>{raceList.length} Carreras</h3>
            <div className={styles.programInfo}>
              <span className={styles.infoItem}>{programaActual.trackName || programaActual.trackId}</span>
              <span className={styles.infoItem}>{programaActual.date}</span>
            </div>
            {raceList.map((race, i) => (
              <button
                key={i}
                className={`${styles.raceBtn} ${carreraActiva === i ? styles.active : ''}`}
                onClick={() => setCarreraActiva(i)}
              >
                <span className={styles.raceNum}>{race.raceNumber || race.numero || i + 1}</span>
                <span className={styles.raceInfo}>
                  <span className={styles.raceTitle}>{race.title || race.name || race.label || `Carrera ${race.raceNumber || i + 1}`}</span>
                  <span className={styles.raceMeta}>{race.distance || race.distancia || '?'}m</span>
                </span>
              </button>
            ))}
          </div>

          <div className={styles.detail}>
            {carreraActual && (
              <>
                <div className={styles.raceHeader}>
                  <span className={styles.raceBadge}>{carreraActual.raceNumber || carreraActual.numero || carreraActiva + 1}</span>
                  <span className={styles.raceTitle}>{carreraActual.title || carreraActual.name || carreraActual.label}</span>
                  <div className={styles.raceMeta}>
                    <span className={styles.metaTag}>{carreraActual.distance || carreraActual.distancia || '?'}m</span>
                    <span className={styles.metaTag}>{carreraActual.surface || carreraActual.pista || 'Arena'}</span>
                    {carreraActual.postTime && <span className={styles.metaTag}>{carreraActual.postTime}</span>}
                  </div>
                </div>

                <div className={styles.runnersTable}>
                  <div className={styles.runnersHeader}>
                    <span className={styles.colNum}>#</span>
                    <span className={styles.colNombre}>Ejemplar</span>
                    <span className={styles.colJinete}>Jinete</span>
                    <span className={styles.colPeso}>Peso</span>
                  </div>
                  <div className={styles.runnersBody}>
                    {ejemplaresActuales.map((runner, i) => (
                      <div key={i} className={styles.runnerRow}>
                        <span className={styles.colNum}>
                          <span className={styles.runnerNumber}>{runner.number || runner.numero || i + 1}</span>
                        </span>
                        <span className={styles.colNombre}>
                          <span className={styles.runnerName}>{runner.name || runner.ejemplar || runner.nombre || '?'}</span>
                        </span>
                        <span className={styles.colJinete}>{runner.riderName || runner.jinete || runner.jockey || '-'}</span>
                        <span className={styles.colPeso}>{runner.weight || runner.peso || '-'}</span>
                      </div>
                    ))}
                    {ejemplaresActuales.length === 0 && (
                      <div className={styles.noRunners}>Sin ejemplares cargados</div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
