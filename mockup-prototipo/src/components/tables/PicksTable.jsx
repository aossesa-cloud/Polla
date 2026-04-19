import React, { useMemo, useRef } from 'react'
import { resolveEffectivePick } from '../../engine/scoreEngine'
import { detectRaceStatus, generateHeaderText, getHeaderInfo } from '../../services/raceStatus'
import styles from '../PronosticosTable.module.css'

export default function PicksTable({ picks, results, date, raceCount, campaignInfo, onEditPick }) {
  const tableRef = useRef(null)
  const races = raceCount || (picks[0]?.picks?.length || 12)

  const raceMap = useMemo(() => {
    if (!results || typeof results !== 'object') return {}
    const map = {}
    Object.values(results).forEach((race) => {
      if (race?.race !== undefined) map[String(race.race)] = race
    })
    return map
  }, [results])

  const raceStatus = useMemo(() => detectRaceStatus(raceMap, races), [raceMap, races])
  const headerInfo = useMemo(() => getHeaderInfo(campaignInfo, null, date), [campaignInfo, date])
  const headerText = useMemo(() => generateHeaderText(headerInfo, raceStatus), [headerInfo, raceStatus])

  return (
    <div className={styles.tableWrapper} ref={tableRef}>
      <div className={styles.dynamicHeader}>
        <div className={styles.headerTitle}>{headerText}</div>
        <div className={styles.headerStatus}>{raceStatus.label}</div>
      </div>

      <div className={styles.tableScrollWrapper}>
        <table className={styles.matrixTable}>
          <thead>
            <tr>
              <th className={styles.stickyCol}>
                <div className={styles.stickyColHeader}>
                  <span className={styles.headerLabel}>Stud</span>
                  <span className={styles.headerLabel}>Total</span>
                </div>
              </th>
              {Array.from({ length: races }, (_, i) => i + 1).map((raceNum) => {
                const hasResult = raceMap[String(raceNum)] || null
                return (
                  <th key={raceNum} className={styles.raceHeaderCell}>
                    <span className={styles.carreraNum}>{raceNum}</span>
                    <span className={`${styles.carreraEstado} ${!hasResult ? styles.pendiente : ''}`}>
                      {hasResult ? '✓' : '⏳'}
                    </span>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {picks.map((entry, rowIndex) => {
              const picksList = Array.isArray(entry.picks) ? entry.picks : []
              const isTop = rowIndex < 3

              return (
                <tr key={`row-${rowIndex}-${entry.participant || entry.name}`} className={isTop ? styles.topTr : ''}>
                  <td className={styles.stickyCol}>
                    <div className={styles.colJugador}>
                      <span className={styles.rowNum}>{rowIndex + 1}</span>
                      <div className={styles.jugadorInfo}>
                        <div className={styles.jugadorNameRow}>
                          <span className={styles.jugadorNombre}>{entry.participant || entry.name}</span>
                          {typeof onEditPick === 'function' ? (
                            <button type="button" className={styles.inlineEditBtn} onClick={() => onEditPick(entry)}>
                              Editar
                            </button>
                          ) : null}
                        </div>
                      </div>
                      <span className={styles.jugadorPts}>{entry.score ?? entry.points ?? 0}</span>
                    </div>
                  </td>

                  {Array.from({ length: races }, (_, i) => i + 1).map((raceNum) => {
                    const pickObj = picksList[raceNum - 1]
                    const pick = typeof pickObj === 'string' ? pickObj : (pickObj?.horse || pickObj?.pick || '-')
                    const raceResult = raceMap[String(raceNum)] || null
                    const effectivePick = resolveEffectivePick(pick, raceResult)
                    const defendedByFavorite = raceResult && String(effectivePick ?? '') !== String(pick ?? '')

                    const winner = raceResult?.primero || raceResult?.first || raceResult?.ganador
                    const tiedWinner = raceResult?.empatePrimero
                    const tiedSecond = raceResult?.empateSegundo
                    const tiedThird = raceResult?.empateTercero
                    const favorite = raceResult?.favorito || raceResult?.favorite

                    const isWinner = winner && String(effectivePick) === String(winner)
                    const isTiedWinner = tiedWinner && String(effectivePick) === String(tiedWinner)
                    const isSecond = !isWinner && !isTiedWinner && (
                      (raceResult?.segundo && String(effectivePick) === String(raceResult.segundo)) ||
                      (tiedSecond && String(effectivePick) === String(tiedSecond))
                    )
                    const isThird = !isWinner && !isTiedWinner && !isSecond && (
                      (raceResult?.tercero && String(effectivePick) === String(raceResult.tercero)) ||
                      (tiedThird && String(effectivePick) === String(tiedThird))
                    )
                    const isFavorite = favorite && String(effectivePick) === String(favorite) &&
                      !isWinner && !isTiedWinner && !isSecond && !isThird
                    const isPending = !raceResult

                    const isTW = tiedWinner && String(effectivePick) === String(tiedWinner)
                    const iTS = tiedSecond && String(effectivePick) === String(tiedSecond)
                    const iTT = tiedThird && String(effectivePick) === String(tiedThird)

                    let dividend = isWinner
                      ? parseDiv(raceResult?.ganador) + parseDiv(raceResult?.divSegundoPrimero) + parseDiv(raceResult?.divTerceroPrimero)
                      : isTW
                        ? parseDiv(raceResult?.empatePrimeroGanador || raceResult?.ganador) +
                          parseDiv(raceResult?.empatePrimeroDivSegundo || raceResult?.divSegundoPrimero) +
                          parseDiv(raceResult?.empatePrimeroDivTercero || raceResult?.divTerceroPrimero)
                        : isSecond
                          ? iTS
                            ? parseDiv(raceResult?.empateSegundoDivSegundo || raceResult?.divSegundo) + parseDiv(raceResult?.empateSegundoDivTercero || raceResult?.divTerceroSegundo)
                            : parseDiv(raceResult?.divSegundo) + parseDiv(raceResult?.divTerceroSegundo)
                          : isThird
                            ? iTT
                              ? parseDiv(raceResult?.empateTerceroDivTercero || raceResult?.divTercero)
                              : parseDiv(raceResult?.divTercero)
                            : null

                    if (raceNum === races && dividend) dividend *= 2
                    dividend = dividend ? Math.round(dividend * 100) / 100 : null

                    return (
                      <td key={raceNum} className={styles.pickCell}>
                        <div className={styles.pickCol}>
                          <span className={`${styles.pickNumero} ${isWinner || isTiedWinner || isSecond || isThird ? styles.numAcierto : ''} ${isPending ? styles.numPendiente : ''}`}>
                            {pick}
                          </span>
                          <span className={`${styles.pickNombre} ${isWinner || isTiedWinner || isSecond || isThird ? styles.nombreAcierto : ''}`}>
                            {isWinner || isTiedWinner ? '✓1°' : isSecond ? '✓2°' : isThird ? '✓3°' : isFavorite ? 'Fav' : isPending ? '—' : ''}
                          </span>
                          {defendedByFavorite && !isPending ? <span className={styles.badgeDefensa}>Ret→Fav</span> : null}
                          {dividend ? <span className={styles.badgeAcierto}>${dividend}</span> : null}
                          {isFavorite && !dividend ? <span className={styles.badgeFavorito}>Fav</span> : null}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function parseDiv(value) {
  if (value === undefined || value === null || value === '') return 0
  const parsed = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : Number(value)
  return Number.isNaN(parsed) ? 0 : parsed
}
