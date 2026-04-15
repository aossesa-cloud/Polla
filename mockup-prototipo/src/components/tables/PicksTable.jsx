/**
 * PicksTable.jsx
 *
 * Tabla BASE de pronósticos.
 * Idéntica para TODOS los modos.
 * No sabe de agrupaciones ni fases.
 */

import React, { useRef, useMemo } from 'react'
import { detectRaceStatus, getHeaderInfo, generateHeaderText } from '../../services/raceStatus'
import styles from '../PronosticosTable.module.css'

export default function PicksTable({ picks, results, date, raceCount, campaignInfo, onEditPick }) {
  const tableRef = useRef(null)
  const races = raceCount || (picks[0]?.picks?.length || 12)

  // Build a proper race map using the race field inside each result
  const raceMap = useMemo(() => {
    if (!results || typeof results !== 'object') return {}
    const map = {}
    Object.values(results).forEach(r => {
      if (r?.race !== undefined) {
        map[String(r.race)] = r
      }
    })
    return map
  }, [results])

  // Detectar estado de la jornada
  const raceStatus = useMemo(() => {
    return detectRaceStatus(results, races)
  }, [results, races])

  // Generar header dinámico
  const headerInfo = useMemo(() => {
    return getHeaderInfo(campaignInfo, null, date)
  }, [campaignInfo, date])

  const headerText = useMemo(() => {
    return generateHeaderText(headerInfo, raceStatus)
  }, [headerInfo, raceStatus])

  return (
    <div className={styles.tableWrapper} ref={tableRef}>
      {/* Header dinámico */}
      <div className={styles.dynamicHeader}>
        <div className={styles.headerTitle}>{headerText}</div>
        <div className={styles.headerStatus}>{raceStatus.label}</div>
      </div>

      <div className={styles.matrixTable}>
        <div className={styles.matrixHeader}>
          <div className={styles.colJugador}>
            <span className={styles.headerLabel}>Stud</span>
          </div>
          {Array.from({ length: races }, (_, i) => i + 1).map(c => {
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
          {picks.map((entry, rowIndex) => {
            const picksList = Array.isArray(entry.picks) ? entry.picks : []
            // Use index to ensure unique keys even if participant names are duplicated
            return (
              <div key={`row-${rowIndex}-${entry.participant || entry.name}`} className={`${styles.matrixRow} ${rowIndex < 3 ? styles.topRow : ''}`}>
                <div className={styles.colJugador}>
                  <span className={styles.rowNum}>{rowIndex + 1}</span>
                  <div className={styles.jugadorInfo}>
                    <div className={styles.jugadorNameRow}>
                      <span className={styles.jugadorNombre}>{entry.participant || entry.name}</span>
                      {typeof onEditPick === 'function' ? (
                        <button
                          type="button"
                          className={styles.inlineEditBtn}
                          onClick={() => onEditPick(entry)}
                        >
                          Editar
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <span className={styles.jugadorPts}>{entry.score ?? entry.points ?? 0}</span>
                </div>

                {Array.from({ length: races }, (_, i) => i + 1).map(c => {
                  const pickObj = picksList[c - 1]
                  const pick = typeof pickObj === 'string' ? pickObj : (pickObj?.horse || pickObj?.pick || '-')

                  // IMPORTANT: Use raceMap which is properly indexed by the race field
                  const raceResult = raceMap[String(c)] || null
                  
                  const winner = raceResult?.primero || raceResult?.first || raceResult?.ganador
                  const empatePrimero = raceResult?.empatePrimero
                  const favorito = raceResult?.favorito || raceResult?.favorite
                  const divGanador = raceResult?.ganador  // Dividendo del ganador
                  const divSegundo = raceResult?.divSegundo  // Dividendo del segundo
                  const divTercero = raceResult?.divTercero  // Dividendo del tercero
                  
                  // Check if pick hit (first place or tie for first)
                  const esGanador = winner && String(pick) === String(winner)
                  const esEmpatePrimero = empatePrimero && String(pick) === String(empatePrimero)
                  const esSegundo = !esGanador && !esEmpatePrimero && raceResult?.segundo && String(pick) === String(raceResult.segundo)
                  const esTercero = !esGanador && !esEmpatePrimero && !esSegundo && raceResult?.tercero && String(pick) === String(raceResult.tercero)
                  const esFavorito = favorito && String(pick) === String(favorito) && !esGanador && !esEmpatePrimero && !esSegundo && !esTercero
                  const esPendiente = !raceResult
                  
                  // Calculate TOTAL dividend score using scoreEngine logic
                  // 1st place: ganador + divSegundoPrimero + divTerceroPrimero
                  // 2nd place: divSegundo + divTerceroSegundo  
                  // 3rd place: divTercero
                  const parseDiv = (val) => {
                    if (val === undefined || val === null || val === '') return 0
                    // Handle format like "1.40" or "1,40" or "34.80"
                    const num = typeof val === 'string' 
                      ? parseFloat(val.replace(',', '.'))  // "1,40" → "1.40"
                      : Number(val)
                    return isNaN(num) ? 0 : num
                  }
                  
                  let dividendo = esGanador || esEmpatePrimero ? 
                    parseDiv(raceResult?.ganador) + parseDiv(raceResult?.divSegundoPrimero) + parseDiv(raceResult?.divTerceroPrimero) :
                    esSegundo ?
                    parseDiv(raceResult?.divSegundo) + parseDiv(raceResult?.divTerceroSegundo) :
                    esTercero ?
                    parseDiv(raceResult?.divTercero) :
                    null

                  // Apply "última x2" if it's the last race and dividend > 0
                  const isLastRace = c === races
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
    </div>
  )
}
