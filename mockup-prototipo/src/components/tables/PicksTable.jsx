import React, { useMemo, useRef } from 'react'
import { calculatePendingExclusivePickMap, enrichPicksWithScores, resolveEffectivePick, isPickMatchingPosition } from '../../engine/scoreEngine'
import { detectRaceStatus, generateHeaderText, getHeaderInfo, isCompletedRaceResult } from '../../services/raceStatus'
import { getContrastingTextColor, getPointColorKey, resolveScoringConfig } from '../../services/scoringConfig'
import styles from '../PronosticosTable.module.css'

const POINT_SCORE_KINDS = new Set(['first', 'second', 'third', 'exclusiveFirst', 'exclusiveSecond'])

export function formatPickScore(score, scoringMode = 'dividend') {
  const numericScore = Number(score)
  if (!Number.isFinite(numericScore) || numericScore <= 0) return null

  const formattedScore = String(Math.round(numericScore * 100) / 100)
  return scoringMode === 'points' ? formattedScore : `$${formattedScore}`
}

export function ensurePicksWithScores(picks, results, scoringConfig) {
  const rows = Array.isArray(picks) ? picks : []
  const alreadyEnriched = rows.every((entry) => {
    const entryScoringConfig = resolveScoringConfig(scoringConfig, entry?.scoring)
    const requiresScoreKind = entryScoringConfig.mode === 'points'
    return (Array.isArray(entry?.picks) ? entry.picks : []).every((pick) => (
      pick &&
      typeof pick === 'object' &&
      Object.prototype.hasOwnProperty.call(pick, 'score') &&
      (!requiresScoreKind || (
        Object.prototype.hasOwnProperty.call(pick, 'scoreKind') &&
        (pick.scoreKind === null
          ? Number(pick.score) <= 0
          : POINT_SCORE_KINDS.has(pick.scoreKind))
      ))
    ))
  })

  return alreadyEnriched ? rows : enrichPicksWithScores(rows, results, scoringConfig)
}

export function getPointScoreBadgeStyle(scoreKind, scoringConfig, options = {}) {
  const resolved = resolveScoringConfig(scoringConfig)
  if (resolved.mode !== 'points' || (!scoreKind && !options.pendingExclusive)) return null

  const colorKey = getPointColorKey(scoreKind, options)
  const backgroundColor = resolved.pointColors?.[colorKey]
  if (!backgroundColor) return null
  return {
    backgroundColor,
    color: getContrastingTextColor(backgroundColor),
  }
}

export default function PicksTable({ picks, results, date, raceCount, campaignInfo, scoringConfig, onEditPick, pendingExclusivePickMap }) {
  const tableRef = useRef(null)
  const races = raceCount || (picks[0]?.picks?.length || 12)
  const tableScoringConfig = useMemo(() => (
    resolveScoringConfig(
      campaignInfo?.modeConfig?.scoring,
      campaignInfo?.scoring,
      scoringConfig,
    )
  ), [campaignInfo, scoringConfig])

  const raceMap = useMemo(() => {
    if (!results || typeof results !== 'object') return {}
    const map = {}
    Object.values(results).forEach((race) => {
      if (race?.race !== undefined) map[String(race.race)] = race
    })
    return map
  }, [results])

  const displayPicks = useMemo(() => (
    ensurePicksWithScores(picks, raceMap, tableScoringConfig)
  ), [picks, raceMap, tableScoringConfig])
  const localPendingExclusivePickMap = useMemo(() => calculatePendingExclusivePickMap(picks), [picks])
  const exclusivePickMap = pendingExclusivePickMap || localPendingExclusivePickMap

  const raceStatus = useMemo(() => detectRaceStatus(raceMap, races), [raceMap, races])
  const headerInfo = useMemo(() => getHeaderInfo(campaignInfo, null, date), [campaignInfo, date])
  const headerText = useMemo(() => generateHeaderText(headerInfo, raceStatus), [headerInfo, raceStatus])

  return (
    <div className={styles.tableWrapper} ref={tableRef}>
      <div className={styles.dynamicHeader}>
        <div className={styles.headerTitle}>{headerText}</div>
        <div className={styles.headerStatus}>{raceStatus.label}</div>
        {tableScoringConfig.mode === 'points' ? <PointLegend scoringConfig={tableScoringConfig} /> : null}
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
                const hasResult = isCompletedRaceResult(raceMap[String(raceNum)])
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
            {displayPicks.map((entry, rowIndex) => {
              const picksList = Array.isArray(entry.picks) ? entry.picks : []
              const isTop = rowIndex < 3
              const entryScoringConfig = entry?.scoring
                ? resolveScoringConfig(tableScoringConfig, entry.scoring)
                : tableScoringConfig

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

                    const winner = raceResult?.primero || raceResult?.first || raceResult?.winner?.number || raceResult?.ganador
                    const tiedWinner = raceResult?.empatePrimero
                    const tiedSecond = raceResult?.empateSegundo
                    const tiedThird = raceResult?.empateTercero
                    const favorite = raceResult?.favorito || raceResult?.favorite?.number || raceResult?.favorite

                    const isWinner = winner && isPickMatchingPosition(effectivePick, winner)
                    const isTiedWinner = tiedWinner && isPickMatchingPosition(effectivePick, tiedWinner)
                    const isSecond = !isWinner && !isTiedWinner && (
                      (raceResult?.segundo && isPickMatchingPosition(effectivePick, raceResult.segundo)) ||
                      (tiedSecond && isPickMatchingPosition(effectivePick, tiedSecond))
                    )
                    const isThird = !isWinner && !isTiedWinner && !isSecond && (
                      (raceResult?.tercero && isPickMatchingPosition(effectivePick, raceResult.tercero)) ||
                      (tiedThird && isPickMatchingPosition(effectivePick, tiedThird))
                    )
                    const isFavorite = favorite && String(effectivePick) === String(favorite) &&
                      !isWinner && !isTiedWinner && !isSecond && !isThird
                    const isPending = !isCompletedRaceResult(raceResult)
                    const isPendingExclusive = isPending && exclusivePickMap.get(String(raceNum))?.has(String(pick ?? '').trim()) === true

                    const scoreBadge = formatPickScore(pickObj?.score, entryScoringConfig?.mode)
                    const scoreBadgeStyle = getPointScoreBadgeStyle(pickObj?.scoreKind, entryScoringConfig, {
                      bonusApplied: pickObj?.bonusApplied === true,
                    })
                    const pendingExclusiveStyle = getPointScoreBadgeStyle(null, entryScoringConfig, {
                      pendingExclusive: isPendingExclusive,
                    })

                    return (
                      <td key={raceNum} className={styles.pickCell} style={pendingExclusiveStyle ? { backgroundColor: pendingExclusiveStyle.backgroundColor } : undefined}>
                        <div className={styles.pickCol}>
                          <span className={`${styles.pickNumero} ${isWinner || isTiedWinner || isSecond || isThird ? styles.numAcierto : ''} ${isPending ? styles.numPendiente : ''}`} style={pendingExclusiveStyle ? { color: pendingExclusiveStyle.color } : undefined}>
                            {pick}
                          </span>
                          <span className={`${styles.pickNombre} ${isWinner || isTiedWinner || isSecond || isThird ? styles.nombreAcierto : ''}`}>
                            {isWinner || isTiedWinner ? '✓1°' : isSecond ? '✓2°' : isThird ? '✓3°' : isFavorite ? 'Fav' : isPending ? '—' : ''}
                          </span>
                          {defendedByFavorite && !isPending ? <span className={styles.badgeDefensa}>Ret→Fav</span> : null}
                          {scoreBadge ? <span className={styles.badgeAcierto} style={scoreBadgeStyle || undefined}>{scoreBadge}</span> : null}
                          {isFavorite && !scoreBadge ? <span className={styles.badgeFavorito}>Fav</span> : null}
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

function PointLegend({ scoringConfig }) {
  const points = scoringConfig.points || {}
  const first = Number.isFinite(Number(points.first)) ? Number(points.first) : 10
  const second = Number.isFinite(Number(points.second)) ? Number(points.second) : 5
  const third = Number.isFinite(Number(points.third)) ? Number(points.third) : 1
  const exclusiveFirst = Number.isFinite(Number(points.exclusiveFirst)) ? Number(points.exclusiveFirst) : 20
  const exclusiveSecond = Number.isFinite(Number(points.exclusiveSecond)) ? Number(points.exclusiveSecond) : second
  const items = [
    ['first', `1° (${first} pts)`],
    ['second', `2° (${second} pts)`],
    ['third', `3° (${third} pts)`],
    ['exclusiveFirst', `Exclusivo 1° (${exclusiveFirst} pts)`],
    ['exclusiveSecond', `Exclusivo 2° (${exclusiveSecond} pts)`],
    ['firstBonus', `1° +3 (${first + 3} pts)`],
    ['exclusiveFirstBonus', `Exclusivo 1° +3 (${exclusiveFirst + 3} pts)`],
    ['exclusivePending', 'Exclusivo futuro (sin puntos)'],
  ]

  return (
    <div className={styles.pointLegend} aria-label="Leyenda de colores de puntos">
      {items.map(([key, label]) => {
        const color = scoringConfig.pointColors?.[key]
        return (
          <span key={key} className={styles.pointLegendItem}>
            <span className={styles.pointLegendSwatch} style={{ backgroundColor: color, color: getContrastingTextColor(color) }} />
            <span>{label}</span>
          </span>
        )
      })}
    </div>
  )
}
