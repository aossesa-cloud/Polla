import React, { useEffect, useMemo, useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import { useRanking } from '../../hooks/useRanking'
import { ThemeProvider } from '../../context/ThemeContext'
import { resolveCampaignTheme } from '../../services/campaignStyles'
import { detectRaceStatus, generateHeaderText, getHeaderInfo } from '../../services/raceStatus'
import { getChileDateString } from '../../utils/dateChile'
import RankingStatusBadge from './RankingStatusBadge'
import styles from '../RankingTable.module.css'

export default function RankingContainer({
  type = 'diaria',
  initialDate = '',
  initialCampaignId = '',
  lockedDate = '',
  lockedCampaignId = '',
  showFilters = true,
  compact = false,
  showCopyButton = true,
  showExportButton = true,
}) {
  const [selectedDate, setSelectedDate] = useState(initialDate || lockedDate || getChileDateString())
  const [selectedCampaignId, setSelectedCampaignId] = useState(initialCampaignId || lockedCampaignId || '')
  const [selectedRankingView, setSelectedRankingView] = useState('total')
  const exportRef = useRef(null)

  const {
    availableDates,
    availableCampaigns,
    selectedCampaign,
    rankingType,
    selectedDate: effectiveDate,
    leaderboard,
    topThree,
    remainder,
    uniqueParticipantsWithPicks,
    prizeSummary,
    breakdownDates,
    dailyRankingViews,
    isAccumulated,
    rankedEvents,
    competitionState,
    qualifiers,
    eliminated,
  } = useRanking({ selectedDate, selectedCampaignId, preferredType: type })

  useEffect(() => {
    if (lockedDate) {
      if (selectedDate !== lockedDate) setSelectedDate(lockedDate)
      return
    }

    if (!selectedDate && availableDates.length > 0) {
      setSelectedDate(availableDates[0])
    }
  }, [availableDates, lockedDate, selectedDate])

  useEffect(() => {
    if (lockedCampaignId) {
      if (selectedCampaignId !== lockedCampaignId) setSelectedCampaignId(lockedCampaignId)
      return
    }

    if (!availableCampaigns.length) {
      if (selectedCampaignId) setSelectedCampaignId('')
      return
    }

    const isCurrentCampaignValid = availableCampaigns.some((campaign) => campaign.id === selectedCampaignId)
    if (!isCurrentCampaignValid) {
      const preferred = availableCampaigns.find((campaign) => campaign.type === type)
      setSelectedCampaignId((preferred || availableCampaigns[0]).id)
    }
  }, [availableCampaigns, lockedCampaignId, selectedCampaignId, type])

  useEffect(() => {
    if (rankingType === 'diaria' || !dailyRankingViews.length) {
      setSelectedRankingView('total')
      return
    }

    setSelectedRankingView((current) => {
      if (current === 'total') return current
      return dailyRankingViews.some((view) => view.eventId === current) ? current : 'total'
    })
  }, [dailyRankingViews, rankingType])

  const title = useMemo(() => {
    if (!selectedCampaign) return 'Ranking'
    return rankingType === 'diaria'
      ? 'Ranking Diario'
      : rankingType === 'semanal'
        ? 'Ranking Semanal'
        : 'Ranking Mensual'
  }, [rankingType, selectedCampaign])

  const subtitle = useMemo(() => {
    if (!selectedCampaign) return 'Selecciona una fecha con campañas activas.'

    const metrics = [
      selectedCampaign.name,
      `${leaderboard.length} con puntaje`,
      `${uniqueParticipantsWithPicks} con picks`,
    ]

    if (isAccumulated && breakdownDates.length > 0) {
      metrics.push(`${breakdownDates.length} jornadas`)
    }

    return metrics.join(' • ')
  }, [breakdownDates.length, isAccumulated, leaderboard.length, selectedCampaign, uniqueParticipantsWithPicks])

  const raceCount = useMemo(() => (
    Math.max(
      0,
      ...rankedEvents.map((event) => Number(
        event?.raceCount ||
        event?.races ||
        event?.meta?.raceCount ||
        selectedCampaign?.raceCount ||
        0
      )),
      0
    )
  ), [rankedEvents, selectedCampaign?.raceCount])

  const mergedResults = useMemo(() => (
    rankedEvents.reduce((acc, event) => ({ ...acc, ...(event?.results || {}) }), {})
  ), [rankedEvents])

  const headerInfo = useMemo(() => {
    const primaryEvent = rankedEvents[0]
    const trackName = resolveRankingTrackName(selectedCampaign, primaryEvent)
    return getHeaderInfo(
      selectedCampaign,
      trackName ? { trackName } : null,
      effectiveDate
    )
  }, [effectiveDate, rankedEvents, selectedCampaign])

  const raceStatus = useMemo(() => (
    detectRaceStatus(mergedResults, raceCount || 0)
  ), [mergedResults, raceCount])

  const dynamicHeader = useMemo(() => (
    generateHeaderText(headerInfo, raceStatus)
  ), [headerInfo, raceStatus])

  const totalRange = useMemo(
    () => resolveRankingRange(selectedCampaign, rankedEvents),
    [selectedCampaign, rankedEvents]
  )

  const totalHeaderText = useMemo(() => {
    if (!selectedCampaign) return 'Ranking'

    if (rankingType === 'semanal') {
      const rangeLabel = totalRange
        ? `${formatDisplayDate(totalRange.start)} al ${formatDisplayDate(totalRange.end)}`
        : selectedCampaign.name
      return `🏇 Ranking total semanal - ${rangeLabel}`
    }

    if (rankingType === 'mensual') {
      return `🏇 Ranking total mensual - ${selectedCampaign.name}`
    }

    return dynamicHeader.replace('Pronósticos', 'Ranking')
  }, [dynamicHeader, rankingType, selectedCampaign, totalRange])

  const hasFinalStage = useMemo(() => Boolean(
    selectedCampaign?.hasFinalStage ||
    selectedCampaign?.modeConfig?.hasFinalStage ||
    selectedCampaign?.competitionMode === 'final-qualification' ||
    selectedCampaign?.format === 'final-qualification' ||
    selectedCampaign?.competitionMode === 'head-to-head' ||
    selectedCampaign?.format === 'head-to-head' ||
    selectedCampaign?.modeConfig?.format === 'head-to-head'
  ), [selectedCampaign])

  const totalStatusLabel = useMemo(() => {
    if (!selectedCampaign) return raceStatus.label
    if (rankingType === 'diaria') return raceStatus.label

    if (!hasFinalStage) {
      const jornadas = breakdownDates.length
      return `${jornadas} jornada${jornadas === 1 ? '' : 's'} acumuladas`
    }

    return competitionState?.phase === 'final' ? '🏁 Total (fase final)' : '🟡 Fase clasificacion'
  }, [breakdownDates.length, competitionState?.phase, hasFinalStage, rankingType, raceStatus.label, selectedCampaign])

  const selectedDailyRanking = useMemo(() => {
    if (!dailyRankingViews.length || selectedRankingView === 'total') return null
    return dailyRankingViews.find((view) => view.eventId === selectedRankingView) || dailyRankingViews[0]
  }, [dailyRankingViews, selectedRankingView])

  const competitionModeEarly = useMemo(() => (
    selectedCampaign?.modeConfig?.format ||
    selectedCampaign?.format ||
    selectedCampaign?.competitionMode ||
    competitionState?.mode ||
    'individual'
  ), [competitionState?.mode, selectedCampaign])

  const isHeadToHead = competitionModeEarly === 'head-to-head'

  const showTotalTab = useMemo(
    () => rankingType !== 'diaria',
    [rankingType]
  )

  useEffect(() => {
    if (rankingType === 'diaria') return
    if (showTotalTab) return
    if (selectedRankingView === 'total' && dailyRankingViews.length > 0) {
      setSelectedRankingView(dailyRankingViews[0].eventId)
    }
  }, [dailyRankingViews, rankingType, selectedRankingView, showTotalTab])

  const selectedDailyEvent = useMemo(() => {
    if (!selectedDailyRanking) return null
    return rankedEvents.find((event) => String(event?.id || '') === String(selectedDailyRanking.eventId || '')) || null
  }, [rankedEvents, selectedDailyRanking])

  const selectedDailyRaceStatus = useMemo(() => {
    if (!selectedDailyRanking) return raceStatus

    const dayResults = selectedDailyEvent?.results || {}
    const dayRaceCount = Number(
      selectedDailyEvent?.raceCount ||
      selectedDailyEvent?.races ||
      selectedDailyEvent?.meta?.raceCount ||
      selectedCampaign?.raceCount ||
      selectedDailyRanking?.raceCount ||
      raceCount ||
      0
    )

    return detectRaceStatus(dayResults, dayRaceCount)
  }, [raceCount, raceStatus, selectedCampaign?.raceCount, selectedDailyEvent, selectedDailyRanking])

  const selectedDailyPrizeSummary = useMemo(() => {
    if (!selectedDailyRanking) return prizeSummary
    if (rankingType === 'semanal' && hasFinalStage) {
      // En semanal con final, los premios de la jornada final deben reflejar
      // la configuración global de la campaña, no solo los finalistas del día.
      return prizeSummary
    }
    return selectedDailyRanking.prizeSummary
  }, [hasFinalStage, prizeSummary, rankingType, selectedDailyRanking])

  const competitionMode = competitionModeEarly

  const captureRankingCanvas = async () => {
    if (!exportRef.current || !selectedCampaign) return null
    const el = exportRef.current

    // Temporalmente quitar overflow para que html2canvas capture el ancho completo
    const overflowEls = [el, ...el.querySelectorAll('*')].filter(e => {
      const s = window.getComputedStyle(e)
      return s.overflowX === 'auto' || s.overflowX === 'scroll'
    })
    const prevOverflows = overflowEls.map(e => e.style.overflowX)
    overflowEls.forEach(e => { e.style.overflowX = 'visible' })

    await new Promise(resolve => setTimeout(resolve, 50))

    const canvas = await html2canvas(el, {
      backgroundColor: '#0a0e17',
      scale: 2,
      useCORS: true,
      logging: false,
      width: el.scrollWidth,
      height: el.scrollHeight,
    })

    // Restaurar overflow
    overflowEls.forEach((e, i) => { e.style.overflowX = prevOverflows[i] })

    return canvas
  }

  const handleExportImage = async () => {
    const canvas = await captureRankingCanvas()
    if (!canvas || !selectedCampaign) return

    const link = document.createElement('a')
    link.download = `ranking-${selectedCampaign.id || selectedCampaign.name || Date.now()}.png`
    link.href = canvas.toDataURL('image/png', 1.0)
    link.click()
  }

  const handleCopyImage = async () => {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': captureRankingCanvas().then(canvas => {
            if (!canvas) throw new Error('No canvas')
            return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
          }),
        }),
      ])
    } catch (error) {
      console.error('No se pudo copiar el ranking como PNG:', error)
    }
  }

  const rankingContent = !selectedCampaign || leaderboard.length === 0 ? (
    <div className={styles.emptyState}>
      <span className={styles.emptyIcon}>🏆</span>
      <p>No hay ranking disponible para la selección actual.</p>
    </div>
  ) : rankingType === 'diaria' ? (
    <>
      <RankingBanner
        headerText={dynamicHeader.replace('Pronósticos', 'Ranking')}
        statusLabel={raceStatus.label}
      />
      <DailyRankingView
        topThree={topThree}
        remainder={remainder}
        prizeSummary={prizeSummary}
      />
    </>
  ) : (
    <>
      <RankingBanner headerText={totalHeaderText} statusLabel={totalStatusLabel} />
      <AccumulatedRankingView
        rankingType={rankingType}
        leaderboard={leaderboard}
        breakdownDates={breakdownDates}
        prizeSummary={prizeSummary}
        mode={competitionMode}
        qualifiers={qualifiers}
        eliminated={eliminated}
        phase={competitionState?.phase}
        showPrize={competitionState?.phase === 'final'}
      />
    </>
  )

  const resolvedRankingContent = rankingType === 'diaria'
    ? rankingContent
    : (!selectedCampaign || (leaderboard.length === 0 && dailyRankingViews.length === 0) ? (
      <div className={styles.emptyState}>
        <span className={styles.emptyIcon}>ðŸ†</span>
        <p>No hay ranking disponible para la selecciÃ³n actual.</p>
      </div>
    ) : (
      <>
        {dailyRankingViews.length > 0 && (
          <div className={styles.eventSelectorRow}>
            {showTotalTab && (
              <button
                type="button"
                className={`${styles.eventSelectorBtn} ${selectedRankingView === 'total' ? styles.eventSelectorBtnActive : ''}`}
                onClick={() => setSelectedRankingView('total')}
              >
                <span className={styles.eventSelectorType}>Total</span>
                <span className={styles.eventSelectorText}>{selectedCampaign.name}</span>
              </button>
            )}
            {!isHeadToHead && dailyRankingViews.map((view) => (
              <button
                key={`ranking-view-${view.eventId}`}
                type="button"
                className={`${styles.eventSelectorBtn} ${selectedRankingView === view.eventId ? styles.eventSelectorBtnActive : ''}`}
                onClick={() => setSelectedRankingView(view.eventId)}
              >
                <span className={styles.eventSelectorType}>{view.phase === 'final' ? 'Final' : rankingType}</span>
                <span className={styles.eventSelectorText}>{formatLongDate(view.date)}</span>
              </button>
            ))}
          </div>
        )}

        {(showTotalTab && selectedRankingView === 'total') || !selectedDailyRanking ? (
          <>
            <RankingBanner headerText={totalHeaderText} statusLabel={totalStatusLabel} />
            <AccumulatedRankingView
              rankingType={rankingType}
              leaderboard={leaderboard}
              breakdownDates={breakdownDates}
              prizeSummary={prizeSummary}
              mode={competitionMode}
              qualifiers={qualifiers}
              eliminated={eliminated}
              phase={competitionState?.phase}
              showPrize={competitionState?.phase === 'final'}
            />
          </>
        ) : (
          <>
            <RankingBanner
              headerText={`${selectedDailyRanking?.phase === 'final' ? 'Final · ' : ''}Ranking ${formatLongDate(selectedDailyRanking.date)} - ${selectedCampaign.name}`}
              statusLabel={selectedDailyRaceStatus.label}
            />
            <DailyRankingView
              leaderboard={selectedDailyRanking.leaderboard}
              topThree={selectedDailyRanking.topThree}
              remainder={selectedDailyRanking.remainder}
              prizeSummary={selectedDailyPrizeSummary}
              showPrizeSummary={rankingType === 'semanal' && hasFinalStage}
              showPrizeAmounts={rankingType === 'semanal' && hasFinalStage}
              mode={competitionMode}
              qualifiers={selectedDailyRanking.qualifiers || qualifiers}
              eliminated={selectedDailyRanking.eliminated || eliminated}
              phase={selectedDailyRanking.phase || competitionState?.phase}
            />
          </>
        )}
      </>
    ))

  return (
    <ThemeProvider theme={resolveCampaignTheme(selectedCampaign)}>
      <div className={`${styles.rankingContainer} ${compact ? styles.rankingContainerCompact : ''}`}>
        <div className={styles.desktopScroll}>
          <div className={styles.desktopCanvas}>
        <div className={styles.rankingHeader}>
          <div>
            <h1 className={styles.rankingTitle}>{title}</h1>
            <p className={styles.rankingSubtitle}>{subtitle}</p>
          </div>
          {selectedCampaign && (
            <div className={styles.exportActions}>
              {showCopyButton && (
                <button type="button" className={styles.copyBtn} onClick={handleCopyImage}>
                  Copiar imagen
                </button>
              )}
              {showExportButton && (
                <button type="button" className={styles.exportBtn} onClick={handleExportImage}>
                  Descargar PNG
                </button>
              )}
            </div>
          )}
        </div>

        {showFilters && (
          <section className={styles.filtersPanel}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Fecha</label>
              <input
                className={styles.dateInput}
                type="date"
                value={selectedDate || effectiveDate || ''}
                onChange={(event) => setSelectedDate(event.target.value)}
                disabled={Boolean(lockedDate)}
              />
            </div>

            <div className={styles.filterGroupWide}>
              <label className={styles.filterLabel}>Campaña</label>
              <div className={styles.campaignTabs}>
                {availableCampaigns.length > 0 ? (
                  availableCampaigns.map((campaign) => (
                    <button
                      key={campaign.id}
                      type="button"
                      className={`${styles.campaignTab} ${selectedCampaign?.id === campaign.id ? styles.campaignTabActive : ''}`}
                      onClick={() => setSelectedCampaignId(campaign.id)}
                      disabled={Boolean(lockedCampaignId)}
                    >
                      <span className={styles.campaignTypeBadge}>{getTypeLabel(campaign.type)}</span>
                      <span>{campaign.name}</span>
                    </button>
                  ))
                ) : (
                  <div className={styles.inlineEmpty}>No hay campañas activas para esta fecha.</div>
                )}
              </div>
            </div>
          </section>
        )}

        <div ref={exportRef}>
          {resolvedRankingContent}
        </div>
          </div>
        </div>
      </div>
    </ThemeProvider>
  )
}

export function RankingBanner({ headerText, statusLabel }) {
  return (
    <section className={styles.exportBanner}>
      <div className={styles.exportBannerTitle}>{headerText}</div>
      <div className={styles.exportBannerStatus}>{statusLabel}</div>
    </section>
  )
}

export function DailyRankingView({
  leaderboard = [],
  topThree = [],
  remainder = [],
  prizeSummary,
  showPrizeSummary = true,
  showPrizeAmounts = true,
  mode = 'individual',
  qualifiers = [],
  eliminated = [],
  phase = 'classification',
}) {
  const allEntries = leaderboard.length > 0 ? leaderboard : [...topThree, ...remainder]
  const midPoint = Math.ceil(remainder.length / 2)
  const leftColumn = remainder.slice(0, midPoint)
  const rightColumn = remainder.slice(midPoint)
  const showGroupedLayout = mode === 'groups' || (mode === 'head-to-head' && phase !== 'final')

  return (
    <>
      {showPrizeSummary && (
        <section className={styles.summaryGrid}>
          <SummaryCard
            label="Pozo total"
            value={formatCurrency(prizeSummary.poolGross)}
            hint={`Administración ${formatCurrency((prizeSummary.poolGross || 0) - (prizeSummary.poolNet || 0))}`}
          />
          <SummaryCard
            label="Pozo premios"
            value={formatCurrency(prizeSummary.poolNet)}
            hint={`${formatCurrency(prizeSummary.poolGross)} - administración`}
          />
          <SummaryCard
            label="Premios"
            value={renderPrizeBreakdown(prizeSummary.prizes)}
          />
        </section>
      )}

      {showGroupedLayout ? (
        <GroupedDailyRankingSections
          entries={allEntries}
          qualifiers={qualifiers}
          eliminated={eliminated}
          phase={phase}
          mode={mode}
        />
      ) : (
        <>
      <section className={styles.topThreeGrid}>
        {topThree.map((entry, index) => (
          <article key={entry.participant} className={`${styles.topCard} ${styles[`topCard${index + 1}`]}`}>
            <div className={styles.topCardPlace}>{getMedal(index)} {entry.position}°</div>
            <div className={styles.topCardName}>{entry.participant}</div>
            <div className={styles.topCardScore}>{formatScore(entry.total)} pts</div>
            {index > 0 && (
              <div className={styles.topCardDiff}>
                {formatDifference(entry.differenceFromLeader)} vs 1°
              </div>
            )}
            {showPrizeAmounts && (
              <div className={styles.topCardPrize}>
                Premio estimado {formatCurrency(prizeSummary.prizes[index + 1])}
              </div>
            )}
          </article>
        ))}
      </section>

      <section className={styles.doubleTableGrid}>
        <RankingColumn entries={leftColumn} />
        <RankingColumn entries={rightColumn} />
      </section>
        </>
      )}
    </>
  )
}

function RankingColumn({ entries }) {
  return (
    <section className={styles.tableCard}>
      <div className={styles.tableHeader}>
        <span>#</span>
        <span>Nombre</span>
        <span>Puntaje</span>
        <span>Diferencia con 1°</span>
      </div>

      <div className={styles.tableBody}>
        {entries.map((entry) => (
          <div key={entry.participant} className={styles.tableRow}>
            <span>{entry.position}</span>
            <span className={styles.nameCell}>{entry.participant}</span>
            <span className={styles.scoreCell}>{formatScore(entry.total)}</span>
            <span className={styles.diffCell}>{formatDifference(entry.differenceFromLeader)}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

export function AccumulatedRankingView({
  rankingType,
  leaderboard,
  breakdownDates,
  prizeSummary,
  mode = 'individual',
  qualifiers = [],
  eliminated = [],
  phase = 'classification',
  showPrize = true,
}) {
  const prizeWinners = new Set(leaderboard.slice(0, 3).map((entry) => entry.participant))
  const hasBreakdownDates = breakdownDates.length > 0
  const showGroupedLayout = mode === 'groups' || (mode === 'head-to-head' && phase !== 'final')

  return (
    <>
      <section className={styles.summaryGrid}>
        <SummaryCard
          label={rankingType === 'semanal' ? 'Pozo total semanal' : 'Pozo total mensual'}
          value={formatCurrency(prizeSummary.poolGross)}
          hint={`Administración ${formatCurrency((prizeSummary.poolGross || 0) - (prizeSummary.poolNet || 0))}`}
        />
        <SummaryCard
          label="Pozo premios"
          value={formatCurrency(prizeSummary.poolNet)}
          hint={`${formatCurrency(prizeSummary.poolGross)} - administración`}
        />
        <SummaryCard
          label="Premios"
          value={renderPrizeBreakdown(prizeSummary.prizes)}
        />
      </section>

      {showGroupedLayout ? (
        <GroupedAccumulatedRankingSections
          entries={leaderboard}
          breakdownDates={breakdownDates}
          prizeSummary={prizeSummary}
          prizeWinners={prizeWinners}
          rankingType={rankingType}
          qualifiers={qualifiers}
          eliminated={eliminated}
          phase={phase}
          mode={mode}
          showPrize={showPrize}
        />
      ) : (
      <section className={styles.tableCard}>
        <div
          className={`${styles.tableHeader} ${showPrize ? styles.tableHeaderAccumulated : styles.tableHeaderAccumulatedNoPrize}`}
          style={{ '--ranking-breakdown-count': hasBreakdownDates ? breakdownDates.length : 1 }}
        >
          <span>#</span>
          <span>Participante</span>
          <span>Total acumulado</span>
          <span className={styles.diffHeaderCell}>Dif. 1°</span>
          {showPrize && <span className={styles.prizeHeaderCell}>Premio</span>}
          {hasBreakdownDates ? (
            breakdownDates.map((date) => (
              <span key={`header-${date}`} className={styles.dayHeaderCell}>
                <span>{shortDate(date)}</span>
                <small>{shortWeekday(date)}</small>
              </span>
            ))
          ) : (
            <span>Jornadas</span>
          )}
        </div>

        <div className={styles.tableBody}>
          {leaderboard.map((entry, index) => (
            <div
              key={entry.participant}
              className={`${styles.tableRow} ${showPrize ? styles.tableRowAccumulated : styles.tableRowAccumulatedNoPrize}`}
              style={{ '--ranking-breakdown-count': hasBreakdownDates ? breakdownDates.length : 1 }}
            >
              <span className={styles.positionCell}>{entry.position}.</span>
              <span className={`${styles.nameCell} ${styles.nameCellStack}`}>
                <span>{entry.participant}</span>
                <RankingStatusBadge
                  participant={entry.participant}
                  qualifiers={qualifiers}
                  eliminated={eliminated}
                  phase={phase}
                  mode={mode}
                  status={entry.status}
                />
              </span>
              <span className={styles.scoreCell}>{formatScore(entry.total)}</span>
              <span className={styles.diffCell}>{formatDifference(entry.differenceFromLeader)}</span>
              {showPrize && (
              <span className={styles.prizeCell}>
                {prizeWinners.has(entry.participant) ? formatCurrency(prizeSummary.prizes[index + 1]) : '—'}
              </span>
              )}
              {hasBreakdownDates ? (
                breakdownDates.map((date) => {
                  const dailyEntry = entry.dailyTotals.find((day) => day.date === date)
                  return (
                    <span key={`${entry.participant}-${date}`} className={styles.breakdownScoreCell}>
                      {dailyEntry ? formatScore(dailyEntry.score) : '—'}
                    </span>
                  )
                })
              ) : (
                <span className={styles.mutedText}>
                  {rankingType === 'semanal' ? 'Sin jornadas semanales' : 'Sin jornadas mensuales'}
                </span>
              )}
            </div>
          ))}
        </div>
      </section>
      )}
    </>
  )
}

function GroupedDailyRankingSections({ entries, qualifiers, eliminated, phase, mode = 'groups' }) {
  const groups = buildRankingGroups(entries, mode)
  const sectionLabel = mode === 'head-to-head' ? 'Duelo' : 'Grupo'

  return (
    <div className={styles.groupedRankingStack}>
      {groups.map((group) => (
        <section key={group.id} className={`${styles.tableCard} ${styles.groupedRankingCard}`}>
          <div className={styles.groupedRankingHeader}>
            <div className={styles.groupedRankingTitleWrap}>
              <span className={styles.groupBadge}>{sectionLabel}</span>
              <strong className={styles.groupedRankingTitle}>{group.name}</strong>
            </div>
            <span className={styles.groupedRankingMeta}>{group.entries.length} participante{group.entries.length === 1 ? '' : 's'}</span>
          </div>

          <div className={styles.tableHeader}>
            <span>#</span>
            <span>Participante</span>
            <span>Puntaje</span>
            <span>Dif. grupo</span>
          </div>

          <div className={styles.tableBody}>
            {group.entries.map((entry) => (
              <div key={`${group.id}-${entry.participant}`} className={styles.tableRow}>
                <span className={styles.positionCell}>{entry.position}.</span>
                <span className={`${styles.nameCell} ${styles.nameCellStack}`}>
                  <span>{entry.participant}</span>
                  <RankingStatusBadge
                    participant={entry.participant}
                    qualifiers={qualifiers}
                    eliminated={eliminated}
                    phase={phase}
                    mode={mode}
                  />
                </span>
                <span className={styles.scoreCell}>{formatScore(entry.total)}</span>
                <span className={styles.diffCell}>
                  {mode === 'head-to-head' ? formatDifference(entry.differenceFromLeader) : formatDifference(entry.differenceFromLeader)}
                </span>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function GroupedAccumulatedRankingSections({
  entries,
  breakdownDates,
  prizeSummary,
  prizeWinners,
  rankingType,
  qualifiers,
  eliminated,
  phase,
  mode = 'groups',
  showPrize = true,
}) {
  const groups = buildRankingGroups(entries, mode)
  const hasBreakdownDates = breakdownDates.length > 0
  const sectionLabel = mode === 'head-to-head' ? 'Duelo' : 'Grupo'

  return (
    <div className={styles.groupedRankingStack}>
      {groups.map((group) => (
        <section key={group.id} className={`${styles.tableCard} ${styles.groupedRankingCard}`}>
          <div className={styles.groupedRankingHeader}>
            <div className={styles.groupedRankingTitleWrap}>
              <span className={styles.groupBadge}>{sectionLabel}</span>
              <strong className={styles.groupedRankingTitle}>{group.name}</strong>
            </div>
            <span className={styles.groupedRankingMeta}>{group.entries.length} participante{group.entries.length === 1 ? '' : 's'}</span>
          </div>

          <div
            className={`${styles.tableHeader} ${showPrize ? styles.tableHeaderAccumulated : styles.tableHeaderAccumulatedNoPrize}`}
            style={{ '--ranking-breakdown-count': hasBreakdownDates ? breakdownDates.length : 1 }}
          >
            <span>#</span>
            <span>Participante</span>
            <span>Total acumulado</span>
            <span className={styles.diffHeaderCell}>Dif. 1°</span>
            {showPrize && <span className={styles.prizeHeaderCell}>Premio</span>}
            {hasBreakdownDates ? (
              breakdownDates.map((date) => (
                <span key={`group-header-${group.id}-${date}`} className={styles.dayHeaderCell}>
                  <span>{shortDate(date)}</span>
                  <small>{shortWeekday(date)}</small>
                </span>
              ))
            ) : (
              <span>Jornadas</span>
            )}
          </div>

          <div className={styles.tableBody}>
            {group.entries.map((entry, index) => (
              <div
                key={`${group.id}-${entry.participant}`}
                className={`${styles.tableRow} ${showPrize ? styles.tableRowAccumulated : styles.tableRowAccumulatedNoPrize}`}
                style={{ '--ranking-breakdown-count': hasBreakdownDates ? breakdownDates.length : 1 }}
              >
                <span className={styles.positionCell}>{entry.position}.</span>
                <span className={`${styles.nameCell} ${styles.nameCellStack}`}>
                  <span>{entry.participant}</span>
                  <RankingStatusBadge
                    participant={entry.participant}
                    qualifiers={qualifiers}
                    eliminated={eliminated}
                    phase={phase}
                    mode={mode}
                  />
                </span>
                <span className={styles.scoreCell}>{formatScore(entry.total)}</span>
                <span className={styles.diffCell}>{formatDifference(entry.differenceFromLeader)}</span>
                {showPrize && (
                <span className={styles.prizeCell}>
                  {prizeWinners.has(entry.participant) ? formatCurrency(prizeSummary.prizes[index + 1]) : '—'}
                </span>
                )}
                {hasBreakdownDates ? (
                  breakdownDates.map((date) => {
                    const dailyEntry = entry.dailyTotals.find((day) => day.date === date)
                    return (
                      <span key={`${group.id}-${entry.participant}-${date}`} className={styles.breakdownScoreCell}>
                        {dailyEntry ? formatScore(dailyEntry.score) : '—'}
                      </span>
                    )
                  })
                ) : (
                  <span className={styles.mutedText}>
                    {rankingType === 'semanal' ? 'Sin jornadas semanales' : 'Sin jornadas mensuales'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function buildRankingGroups(entries = [], mode = 'groups') {
  const groups = new Map()

  entries.forEach((entry) => {
    const groupId = mode === 'head-to-head'
      ? String(entry?.matchupId || entry?.matchupName || 'sin-duelo')
      : String(entry?.groupId || entry?.groupName || 'sin-grupo')
    const groupName = mode === 'head-to-head'
      ? String(entry?.matchupName || 'Sin duelo')
      : String(entry?.groupName || 'Sin grupo')

    if (!groups.has(groupId)) {
      groups.set(groupId, {
        id: groupId,
        name: groupName,
        entries: [],
      })
    }

    groups.get(groupId).entries.push(entry)
  })

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      entries: normalizeGroupRankingEntries(group.entries),
    }))
    .sort((left, right) => left.name.localeCompare(right.name, 'es'))
}

function normalizeGroupRankingEntries(entries = []) {
  const sorted = [...entries].sort((left, right) => {
    const scoreDiff = Number(right?.total || 0) - Number(left?.total || 0)
    if (scoreDiff !== 0) return scoreDiff
    return String(left?.participant || '').localeCompare(String(right?.participant || ''), 'es')
  })

  const leaderTotal = Number(sorted[0]?.total || 0)
  let lastScore = null
  let lastPosition = 0

  return sorted.map((entry, index) => {
    const currentScore = Number(entry?.total || 0)
    if (lastScore === null || currentScore !== lastScore) {
      lastPosition = index + 1
      lastScore = currentScore
    }

    return {
      ...entry,
      position: lastPosition,
      differenceFromLeader: roundScore(currentScore - leaderTotal),
    }
  })
}

function roundScore(value) {
  return Math.round(Number(value || 0) * 100) / 100
}

function SummaryCard({ label, value, hint = '' }) {
  return (
    <article className={styles.summaryCard}>
      <span className={styles.summaryLabel}>{label}</span>
      {typeof value === 'string' ? (
        <strong className={styles.summaryValue}>{value}</strong>
      ) : (
        <div className={styles.summaryCustomValue}>{value}</div>
      )}
      {hint ? <span className={styles.summaryHint}>{hint}</span> : null}
    </article>
  )
}

function getTypeLabel(type) {
  return type === 'diaria' ? 'Diaria' : type === 'semanal' ? 'Semanal' : 'Mensual'
}

function getMedal(index) {
  return ['🥇', '🥈', '🥉'][index] || '🏅'
}

function shortDate(date) {
  const [, month, day] = String(date).split('-')
  return `${day}/${month}`
}

function shortWeekday(date) {
  const parsed = new Date(`${date}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed
    .toLocaleDateString('es-CL', { weekday: 'long' })
    .replace('.', '')
    .toLowerCase()
}

function resolveRankingRange(campaign, events = []) {
  const explicitStart = normalizeIsoDate(campaign?.startDate)
  const explicitEnd = normalizeIsoDate(campaign?.endDate)
  if (explicitStart || explicitEnd) {
    return {
      start: explicitStart || explicitEnd,
      end: explicitEnd || explicitStart,
    }
  }

  const dates = (events || [])
    .map((event) => normalizeIsoDate(event?.date || event?.meta?.date))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))

  if (!dates.length) return null
  return {
    start: dates[0],
    end: dates[dates.length - 1],
  }
}

function normalizeIsoDate(value) {
  if (!value) return ''
  const raw = String(value)
  const iso = raw.match(/\b(\d{4}-\d{2}-\d{2})\b/)
  if (iso) return iso[1]
  return ''
}

function formatDisplayDate(value) {
  if (!value) return ''
  const [year, month, day] = String(value).split('-')
  if (!year || !month || !day) return String(value)
  return `${day}-${month}-${year}`
}

function formatLongDate(date) {
  if (!date) return ''

  const [year, month, day] = String(date).split('-')
  const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  const monthIndex = Number(month) - 1
  const monthLabel = monthNames[monthIndex] || month

  return `${day} ${monthLabel} ${year}`
}

function formatCurrency(value) {
  return `$${Math.round(Number(value || 0)).toLocaleString('es-CL')}`
}

function formatScore(value) {
  return Number(value || 0).toLocaleString('es-CL', {
    minimumFractionDigits: Number.isInteger(Number(value || 0)) ? 0 : 1,
    maximumFractionDigits: 2,
  })
}

function formatDifference(value) {
  if (!value) return '0'
  return Number(value).toLocaleString('es-CL', {
    minimumFractionDigits: Number.isInteger(Number(value)) ? 0 : 1,
    maximumFractionDigits: 2,
  })
}

function renderPrizeBreakdown(prizes) {
  const rows = [1, 2, 3]
    .filter((position) => Number(prizes?.[position] || 0) > 0)

  if (rows.length === 0) {
    return <strong className={styles.summaryValue}>Sin premios</strong>
  }

  return (
    <div className={styles.prizeBreakdown}>
      {rows.map((position) => (
        <div key={position} className={styles.prizeBreakdownRow}>
          <span className={styles.prizeBreakdownLabel}>{position}°</span>
          <strong className={styles.prizeBreakdownAmount}>{formatCurrency(prizes[position])}</strong>
        </div>
      ))}
    </div>
  )
}

function resolveRankingTrackName(campaign, event) {
  const directTrackName = String(event?.meta?.trackName || '').trim()
  if (directTrackName && !looksLikeDate(directTrackName)) return directTrackName

  const fromCampaignName = String(campaign?.name || '')
    .replace(/^diaria\s+/i, '')
    .replace(/^semanal\s+/i, '')
    .replace(/^mensual\s+/i, '')
    .replace(/\b\d{2}-\d{2}-\d{4}\b/g, '')
    .replace(/\b\d{4}-\d{2}-\d{2}\b/g, '')
    .trim()

  if (fromCampaignName && !looksLikeDate(fromCampaignName)) return fromCampaignName

  return ''
}

function looksLikeDate(value) {
  return /\b\d{4}-\d{2}-\d{2}\b/.test(value) || /\b\d{2}-\d{2}-\d{4}\b/.test(value)
}
