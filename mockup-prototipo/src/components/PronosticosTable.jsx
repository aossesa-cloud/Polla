import React, { useRef, useState, useEffect } from 'react'
import html2canvas from 'html2canvas'
import { usePronosticos } from '../hooks/usePronosticos'
import useAppStore from '../store/useAppStore'
import { calculateDailyScores, isPickMatchingPosition } from '../engine/scoreEngine'
import { resolveEventOperationalData } from '../services/campaignOperationalData'
import styles from './PronosticosTable.module.css'

export default function PronosticosTable() {
  const tableRef = useRef(null)
  const [eventoId, setEventoId] = useState('')
  const { appData } = useAppStore()

  const { eventsWithParticipants, getEventById } = usePronosticos()

  useEffect(() => {
    if (eventsWithParticipants.length > 0 && !eventoId) {
      setEventoId(eventsWithParticipants[0].id)
    }
  }, [eventsWithParticipants])

  // Safe data extraction with error handling
  let eventoActual, participants, results, raceCount, sorted, carrerasFinalizadas
  try {
    eventoActual = getEventById(eventoId) || {}
    participants = Array.isArray(eventoActual.participants) ? eventoActual.participants : []
    const operationalData = resolveEventOperationalData(appData, null, eventoActual, eventoActual?.date || eventoActual?.meta?.date || '')
    const resultsRaw = operationalData.results
    results = resultsRaw && typeof resultsRaw === 'object' && !Array.isArray(resultsRaw) ? resultsRaw : {}
    raceCount = operationalData.raceCount || eventoActual.races || eventoActual.meta?.raceCount || 12
    
    // DEBUG: Log data structure
    console.log('[PronosticosTable] Event data:', {
      eventoId,
      participantCount: participants.length,
      resultsCount: Object.keys(results).length,
      raceCount,
      firstParticipant: participants[0],
      resultsSample: Object.keys(results).slice(0, 3).map(k => ({ race: k, ...results[k] }))
    })
    
    const fallbackPicks = participants.map((participant) => ({
      participant: participant.name || participant.index,
      picks: Array.isArray(participant.picks)
        ? participant.picks.map((pick) => (
          typeof pick === 'object'
            ? (pick.horse ?? pick.number ?? pick.pick ?? pick.value ?? '')
            : pick
        ))
        : [],
    }))
    const recalculatedScores = hasResultEntries(results)
      ? calculateDailyScores(fallbackPicks, results, eventoActual.scoring || { mode: 'dividend', doubleLastRace: true })
      : {}
    sorted = [...participants]
      .map((participant, participantIndex) => {
        const participantName = participant.name || participant.index
        const backendPoints = Number(participant.points)
        const displayPoints = hasResultEntries(results)
          ? Number(recalculatedScores[participantName] || 0)
          : (Number.isFinite(backendPoints) ? backendPoints : 0)

        return {
          ...participant,
          entryOrder: participantIndex,
          points: displayPoints,
        }
      })
    carrerasFinalizadas = results && typeof results === 'object' ? Object.keys(results).length : 0
  } catch (err) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>⚠️</span>
          <p>Error cargando pronósticos: {err.message}</p>
        </div>
      </div>
    )
  }

  const handleExport = async () => {
    if (!tableRef.current) return
    try {
      const innerTable = tableRef.current.querySelector('[class*="matrixTable"]')
      const fullWidth = innerTable ? innerTable.scrollWidth : tableRef.current.scrollWidth
      const canvas = await html2canvas(tableRef.current, {
        backgroundColor: '#0a0e17',
        scale: 2,
        useCORS: true,
        width: fullWidth,
        height: tableRef.current.scrollHeight,
        logging: false
      })
      const link = document.createElement('a')
      link.download = `pronosticos-${eventoId}-${Date.now()}.png`
      link.href = canvas.toDataURL('image/png', 1.0)
      link.click()
    } catch (err) {
      console.error('Error exporting:', err)
    }
  }

  if (!eventoId) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>📝</span>
          <p>No hay pronósticos cargados. Ingresa picks desde "Ingreso Picks".</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.desktopScroll}>
        <div className={styles.desktopCanvas}>
          <div className={styles.tableHeader}>
        <div>
          <h2 className={styles.tableTitle}>📝 Tabla de Pronósticos</h2>
          <p className={styles.tableSubtitle}>
            {eventoActual.sheetName || eventoActual.title || eventoActual.name || eventoId} • {sorted.length} studs • {raceCount} carreras
          </p>
        </div>
        <div className={styles.controls}>
          <select
            className={styles.select}
            value={eventoId}
            onChange={(e) => setEventoId(e.target.value)}
          >
            {eventsWithParticipants.map(ev => (
              <option key={ev.id} value={ev.id}>
                {ev.sheetName || ev.title || ev.name || ev.id}
              </option>
            ))}
          </select>
          <button className={styles.exportBtn} onClick={handleExport}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Exportar PNG
          </button>
        </div>
      </div>

      <div className={styles.tableWrapper} ref={tableRef}>
        <div className={styles.exportBanner}>
          <div className={styles.bannerLeft}>
            <span className={styles.bannerEmoji}>🏇</span>
            <div>
              <div className={styles.bannerTitle}>Polla Hípica — Pronósticos</div>
              <div className={styles.bannerMeta}>
                {eventoActual.sheetName || eventoActual.name || eventoId} • {carrerasFinalizadas}/{raceCount} finalizadas
              </div>
            </div>
          </div>
          <div className={styles.bannerRight}>
            <span className={styles.bannerBadge}>{sorted.length} studs</span>
            <span className={styles.bannerBadge}>{raceCount} carreras</span>
          </div>
        </div>

        <div className={styles.matrixTable}>
          <div className={styles.matrixHeader}>
            <div className={styles.colJugador}>
              <span className={styles.headerLabel}>Stud</span>
            </div>
            {Array.from({ length: raceCount }, (_, i) => i + 1).map(c => {
              const hasResult = results && typeof results === 'object' ? (results[String(c)] || results[c]) : null
              return (
                <div key={c} className={styles.colCarrera}>
                  <span className={styles.carreraNum}>{c}</span>
                  <span className={`${styles.carreraEstado} ${!hasResult ? styles.pendiente : ''}`}>
                    {hasResult ? '✓' : '⏳'}
                  </span>
                </div>
              )
            })}
          </div>

          <div className={styles.matrixBody}>
            {sorted.map((entry, rowIndex) => {
              const picks = Array.isArray(entry.picks) ? entry.picks : []
              
              // DEBUG: Log first participant's picks
              if (rowIndex === 0) {
                console.log(`[PronosticosTable] First participant (${entry.name}):`, {
                  points: entry.points,
                  pickCount: picks.length,
                  first3Picks: picks.slice(0, 3),
                  results: Object.keys(results).slice(0, 3).map(k => ({ race: k, primero: results[k]?.primero }))
                })
              }
              
              return (
              <div key={entry.index || entry.name} className={`${styles.matrixRow} ${rowIndex < 3 ? styles.topRow : ''}`}>
                <div className={styles.colJugador}>
                  <span className={styles.rowNum}>{rowIndex + 1}</span>
                  <span className={styles.jugadorNombre}>{entry.name}</span>
                  <span className={styles.jugadorPts}>{entry.points || 0}</span>
                </div>

                {Array.from({ length: raceCount }, (_, i) => i + 1).map(c => {
                  // Legacy picks are objects: { race, raceLabel, horse, score }
                  const pickObj = picks[c - 1]
                  const pick = typeof pickObj === 'string' ? pickObj : (pickObj?.horse || pickObj?.pick || '-')
                  
                  // IMPORTANT: Use the race field to find the correct result
                  // Results may have keys like "0", "1", "2"... but each has a race field
                  let raceResult = null
                  if (results && typeof results === 'object') {
                    Object.values(results).forEach(r => {
                      if (r && String(r.race) === String(c)) {
                        raceResult = r
                      }
                    })
                  }
                  
                  const winner = raceResult?.primero || raceResult?.first || raceResult?.ganador
                  const empatePrimero = raceResult?.empatePrimero
                  const empateSegundo = raceResult?.empateSegundo
                  const empateTercero = raceResult?.empateTercero
                  const favorito = raceResult?.favorito || raceResult?.favorite
                  const divGanador = raceResult?.ganador
                  const divSegundo = raceResult?.divSegundo
                  const divTercero = raceResult?.divTercero
                  
                  // Check if pick hit (first place or tie for first)
                  const esGanador = winner && isPickMatchingPosition(pick, winner)
                  const esEmpatePrimero = empatePrimero && isPickMatchingPosition(pick, empatePrimero)
                  const esSegundo = !esGanador && !esEmpatePrimero && (
                    (raceResult?.segundo && isPickMatchingPosition(pick, raceResult.segundo)) ||
                    (empateSegundo && isPickMatchingPosition(pick, empateSegundo))
                  )
                  const esTercero = !esGanador && !esEmpatePrimero && !esSegundo && (
                    (raceResult?.tercero && isPickMatchingPosition(pick, raceResult.tercero)) ||
                    (empateTercero && isPickMatchingPosition(pick, empateTercero))
                  )
                  const esFavorito = favorito && String(pick) === String(favorito) && !esGanador && !esEmpatePrimero && !esSegundo && !esTercero
                  const esPendiente = !raceResult
                  
                  // Calculate TOTAL dividend score using scoreEngine logic
                  const parseDiv = (val) => {
                    if (val === undefined || val === null || val === '') return 0
                    // Handle format like "1.40" or "1,40" or "34.80"
                    const num = typeof val === 'string' 
                      ? parseFloat(val.replace(',', '.'))  // "1,40" → "1.40"
                      : Number(val)
                    return isNaN(num) ? 0 : num
                  }
                  
                  const esEmpateSegundo = empateSegundo && isPickMatchingPosition(pick, empateSegundo)
                  const esEmpateTercero = empateTercero && isPickMatchingPosition(pick, empateTercero)

                  let dividendo = esGanador ? 
                    parseDiv(raceResult?.ganador) + parseDiv(raceResult?.divSegundoPrimero) + parseDiv(raceResult?.divTerceroPrimero) :
                    esEmpatePrimero ?
                    parseDiv(raceResult?.empatePrimeroGanador || raceResult?.ganador) + parseDiv(raceResult?.empatePrimeroDivSegundo || raceResult?.divSegundoPrimero) + parseDiv(raceResult?.empatePrimeroDivTercero || raceResult?.divTerceroPrimero) :
                    esSegundo ?
                    (
                      esEmpateSegundo
                        ? parseDiv(raceResult?.empateSegundoDivSegundo || raceResult?.divSegundo) + parseDiv(raceResult?.empateSegundoDivTercero || raceResult?.divTerceroSegundo)
                        : parseDiv(raceResult?.divSegundo) + parseDiv(raceResult?.divTerceroSegundo)
                    ) :
                    esTercero ?
                    (
                      esEmpateTercero
                        ? parseDiv(raceResult?.empateTerceroDivTercero || raceResult?.divTercero)
                        : parseDiv(raceResult?.divTercero)
                    ) :
                    null

                  // Apply "última x2" if it's the last race and dividend > 0
                  const isLastRace = c === raceCount
                  const doubleLastRace = true  // Default enabled
                  if (isLastRace && doubleLastRace && dividendo) {
                    dividendo = dividendo * 2
                  }
                  
                  // Round to avoid floating point errors
                  dividendo = dividendo ? Math.round(dividendo * 100) / 100 : null

                  return (
                    <div key={c} className={`${styles.colCarrera} ${styles.pickCol}`}>
                      <span className={`${styles.pickNumero} ${esGanador || esEmpatePrimero || esSegundo || esTercero ? styles.numAcierto : ''} ${esPendiente ? styles.numPendiente : ''}`}>
                        {pick}
                      </span>
                      <span className={`${styles.pickNombre} ${esGanador || esEmpatePrimero || esSegundo || esTercero ? styles.nombreAcierto : ''}`}>
                        {esGanador || esEmpatePrimero ? '✓1°' : 
                         esSegundo ? '✓2°' : 
                         esTercero ? '✓3°' : 
                         esFavorito ? 'Fav' : 
                         esPendiente ? '—' : ''}
                      </span>
                      {dividendo && <span className={styles.badgeAcierto}>${dividendo}</span>}
                      {esFavorito && !dividendo && <span className={styles.badgeFavorito}>Fav</span>}
                    </div>
                  )
                })}
              </div>
              )
            })}
          </div>
        </div>

        <div className={styles.exportFooter}>
          <span>📊 Generado automáticamente • Polla Hípica {new Date().getFullYear()}</span>
        </div>
      </div>

      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={styles.legendSwatch} style={{ background: '#10b981' }}></span>
          <span>Acierto</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendSwatch} style={{ background: '#f59e0b' }}></span>
          <span>Favorito</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendSwatch} style={{ background: '#64748b' }}></span>
          <span>Pendiente</span>
        </div>
        <div className={styles.legendNote}>
          Número = pick del stud • Verde = acertó
        </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function hasResultEntries(results) {
  return Object.values(results || {}).some((race) => race && (race.primero || race.winner?.number))
}
