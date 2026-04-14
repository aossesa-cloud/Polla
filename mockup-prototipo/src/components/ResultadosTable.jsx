import React, { useState, useEffect } from 'react'
import api from '../api'
import { useResults } from '../hooks/useResults'
import styles from './ResultadosTable.module.css'

export default function ResultadosTable() {
  const [eventoActivo, setEventoActivo] = useState('')
  const [importando, setImportando] = useState(false)
  const [importMsg, setImportMsg] = useState(null)

  const { eventsWithResults, getEventById, importTeletrakResults } = useResults()

  useEffect(() => {
    if (eventsWithResults.length > 0 && !eventoActivo) {
      setEventoActivo(eventsWithResults[0].id)
    }
  }, [eventsWithResults])

  const eventoActual = getEventById(eventoActivo) || {}
  const results = eventoActual.results || {}
  const races = eventoActual.races || 12

  // Build carrera list from results
  const carrerasList = []
  for (let i = 1; i <= Math.max(races, Object.keys(results).length); i++) {
    const r = results[String(i)] || results[i] || {}
    carrerasList.push({
      numero: i,
      primero: r.primero || r.first || '-',
      primeroNombre: r.primeroNombre || r.first_name || '',
      segundo: r.segundo || r.second || '-',
      tercero: r.tercero || r.third || '-',
      favorito: r.favorito || r.favorite || '-',
      dividendo: r.ganador || r.dividendo || '-',
      retiros: r.retiros || r.withdrawals || []
    })
  }

  const handleImportResults = async () => {
    if (!eventoActivo) return
    setImportando(true)
    setImportMsg(null)
    try {
      const eventDate = eventoActual.meta?.date || eventoActual.date || new Date().toISOString().split('T')[0]
      const trackId = eventoActual.meta?.trackId || eventoActual.trackId || 'hipodromo-chile'
      await importTeletrakResults(eventDate, trackId)
      setImportMsg({ tipo: 'ok', texto: `Resultados importados` })
    } catch (err) {
      setImportMsg({ tipo: 'error', texto: `Error: ${err.message}` })
    } finally {
      setImportando(false)
    }
  }

  return (
    <div className={styles.resultados}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Resultados</h1>
          <p className={styles.subtitle}>Resultados oficiales de carreras</p>
        </div>
        <div className={styles.headerActions}>
          <select
            className={styles.eventSelect}
            value={eventoActivo}
            onChange={(e) => setEventoActivo(e.target.value)}
          >
            <option value="">Seleccionar evento...</option>
            {eventsWithResults.map(ev => (
              <option key={ev.id} value={ev.id}>
                {ev.sheetName || ev.title || ev.name || ev.id}
              </option>
            ))}
          </select>
          <button
            className={styles.importBtn}
            onClick={handleImportResults}
            disabled={importando || !eventoActivo}
          >
            {importando ? 'Importando...' : '📡 Teletrak'}
          </button>
        </div>
      </header>

      {importMsg && (
        <div className={`${styles.message} ${styles[importMsg.tipo]}`}>
          {importMsg.texto}
        </div>
      )}

      {!eventoActivo ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>🏁</span>
          <p>Selecciona un evento para ver resultados</p>
        </div>
      ) : (
        <div className={styles.resultsTable}>
          <div className={styles.resultsHeader}>
            <span className={styles.colNum}>#</span>
            <span className={styles.col1}>1° Lugar</span>
            <span className={styles.col2}>2° Lugar</span>
            <span className={styles.col3}>3° Lugar</span>
            <span className={styles.colFav}>Favorito</span>
            <span className={styles.colDiv}>Dividendo</span>
          </div>
          <div className={styles.resultsBody}>
            {carrerasList.map(c => (
              <div key={c.numero} className={styles.resultRow}>
                <span className={styles.colNum}>
                  <span className={styles.carreraBadge}>{c.numero}</span>
                </span>
                <span className={styles.col1}>
                  <span className={styles.place1}>{c.primero}</span>
                  {c.primeroNombre && <span className={styles.placeName}>{c.primeroNombre}</span>}
                </span>
                <span className={styles.col2}>
                  <span className={styles.place2}>{c.segundo}</span>
                </span>
                <span className={styles.col3}>
                  <span className={styles.place3}>{c.tercero}</span>
                </span>
                <span className={styles.colFav}>
                  <span className={styles.favBadge}>
                    <span className={styles.favDot}></span>
                    {c.favorito}
                  </span>
                </span>
                <span className={styles.colDiv}>
                  <span className={styles.divValue}>${c.dividendo}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
