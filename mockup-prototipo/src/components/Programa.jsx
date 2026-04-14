import React, { useState, useEffect } from 'react'
import api from '../api'
import useAppStore from '../store/useAppStore'
import { getChileDateString } from '../utils/dateChile'
import styles from './Programa.module.css'

export default function Programa() {
  const { appData, refresh } = useAppStore()
  const [programaActivo, setProgramaActivo] = useState('')
  const [carreraActiva, setCarreraActiva] = useState(0)
  const [importando, setImportando] = useState(false)
  const [importMsg, setImportMsg] = useState(null)

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

  const programaActual = programList.find(p => p.key === programaActivo) || {}
  const races = programaActual.races || []
  const raceList = Array.isArray(races) ? races : Object.values(races)

  const carreraActual = raceList[carreraActiva]

  const handleImportProgram = async () => {
    setImportando(true)
    setImportMsg(null)
    try {
      const date = getChileDateString()
      await api.importTeletrakProgram(date, 'hipodromo-chile')
      setImportMsg({ tipo: 'ok', texto: 'Programa importado desde Teletrak' })
      refresh()
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
          <button className={styles.importBtn} onClick={handleImportProgram} disabled={importando}>
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
                  <span className={styles.raceTitle}>{race.title || race.name || `Carrera ${race.raceNumber || i + 1}`}</span>
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
                  <span className={styles.raceTitle}>{carreraActual.title || carreraActual.name}</span>
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
                    {(carreraActual.runners || carreraActual.entries || []).map((runner, i) => (
                      <div key={i} className={styles.runnerRow}>
                        <span className={styles.colNum}>
                          <span className={styles.runnerNumber}>{runner.number || runner.numero || i + 1}</span>
                        </span>
                        <span className={styles.colNombre}>
                          <span className={styles.runnerName}>{runner.name || runner.ejemplar || runner.nombre || '?'}</span>
                        </span>
                        <span className={styles.colJinete}>{runner.riderName || runner.jinete || '-'}</span>
                        <span className={styles.colPeso}>{runner.weight || runner.peso || '-'}</span>
                      </div>
                    ))}
                    {(!carreraActual.runners || carreraActual.runners.length === 0) && (
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
