import React, { useEffect, useMemo, useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import { useRanking } from '../../hooks/useRanking'
import { ThemeProvider } from '../../context/ThemeContext'
import { resolveCampaignTheme } from '../../services/campaignStyles'
import { detectRaceStatus, generateHeaderText, getHeaderInfo } from '../../services/raceStatus'
import styles from '../RankingTable.module.css'

export default function RankingContainer({
  type = 'diaria',
  initialDate = '',
  initialCampaignId = '',
  lockedDate = '',
  lockedCampaignId = '',
  showFilters = true,
  compact = false,
}) {
  const [selectedDate, setSelectedDate] = useState(initialDate || lockedDate || '')
  const [selectedCampaignId, setSelectedCampaignId] = useState(initialCampaignId || lockedCampaignId || '')
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
    isAccumulated,
    rankedEvents,
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
    Math.max(0, ...rankedEvents.map((event) => Number(event?.races || event?.meta?.raceCount || 0)), 0)
  ), [rankedEvents])

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

  const handleExportImage = async () => {
    if (!exportRef.current || !selectedCampaign) return

    const canvas = await html2canvas(exportRef.current, {
      backgroundColor: '#0a0e17',
      scale: 2,
      useCORS: true,
      logging: false,
    })
    const link = document.createElement('a')
    link.download = `ranking-${selectedCampaign.id || selectedCampaign.name || Date.now()}.png`
    link.href = canvas.toDataURL('image/png', 1.0)
    link.click()
  }

  const rankingContent = !selectedCampaign || leaderboard.length === 0 ? (
    <div className={styles.emptyState}>
      <span className={styles.emptyIcon}>🏆</span>
      <p>No hay ranking disponible para la selección actual.</p>
    </div>
  ) : rankingType === 'diaria' ? (
    <>
      <RankingBanner headerText={dynamicHeader} statusLabel={raceStatus.label} />
      <DailyRankingView
        topThree={topThree}
        remainder={remainder}
        prizeSummary={prizeSummary}
      />
    </>
  ) : (
    <>
      <RankingBanner headerText={dynamicHeader} statusLabel={raceStatus.label} />
      <AccumulatedRankingView
        rankingType={rankingType}
        leaderboard={leaderboard}
        breakdownDates={breakdownDates}
        prizeSummary={prizeSummary}
      />
    </>
  )

  return (
    <ThemeProvider theme={resolveCampaignTheme(selectedCampaign)}>
      <div className={`${styles.rankingContainer} ${compact ? styles.rankingContainerCompact : ''}`}>
        <div className={styles.rankingHeader}>
          <div>
            <h1 className={styles.rankingTitle}>{title}</h1>
            <p className={styles.rankingSubtitle}>{subtitle}</p>
          </div>
          {selectedCampaign && (
            <button type="button" className={styles.exportBtn} onClick={handleExportImage}>
              Descargar PNG
            </button>
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
          {rankingContent}
        </div>
      </div>
    </ThemeProvider>
  )
}

function RankingBanner({ headerText, statusLabel }) {
  return (
    <section className={styles.exportBanner}>
      <div className={styles.exportBannerTitle}>{headerText}</div>
      <div className={styles.exportBannerStatus}>{statusLabel}</div>
    </section>
  )
}

function DailyRankingView({ topThree, remainder, prizeSummary }) {
  const midPoint = Math.ceil(remainder.length / 2)
  const leftColumn = remainder.slice(0, midPoint)
  const rightColumn = remainder.slice(midPoint)

  return (
    <>
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
            <div className={styles.topCardPrize}>
              Premio estimado {formatCurrency(prizeSummary.prizes[index + 1])}
            </div>
          </article>
        ))}
      </section>

      <section className={styles.doubleTableGrid}>
        <RankingColumn entries={leftColumn} />
        <RankingColumn entries={rightColumn} />
      </section>
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

function AccumulatedRankingView({ rankingType, leaderboard, breakdownDates, prizeSummary }) {
  const prizeWinners = new Set(leaderboard.slice(0, 3).map((entry) => entry.participant))

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

      <section className={styles.tableCard}>
        <div className={`${styles.tableHeader} ${styles.tableHeaderAccumulated}`}>
          <span>Participante</span>
          <span>Total acumulado</span>
          <span>Premio</span>
          <span>Desglose por día</span>
        </div>

        <div className={styles.tableBody}>
          {leaderboard.map((entry, index) => (
            <div key={entry.participant} className={`${styles.tableRow} ${styles.tableRowAccumulated}`}>
              <span className={styles.nameCell}>
                <strong>{entry.position}.</strong> {entry.participant}
              </span>
              <span className={styles.scoreCell}>{formatScore(entry.total)}</span>
              <span className={styles.prizeCell}>
                {prizeWinners.has(entry.participant) ? formatCurrency(prizeSummary.prizes[index + 1]) : '—'}
              </span>
              <span className={styles.breakdownCell}>
                {entry.dailyTotals.length > 0 ? (
                  entry.dailyTotals.map((day) => (
                    <span key={`${entry.participant}-${day.date}`} className={styles.breakdownPill}>
                      {shortDate(day.date)}: {formatScore(day.score)}
                    </span>
                  ))
                ) : breakdownDates.length > 0 ? (
                  <span className={styles.mutedText}>Sin jornadas con puntaje</span>
                ) : (
                  <span className={styles.mutedText}>
                    {rankingType === 'semanal' ? 'Sin jornadas semanales' : 'Sin jornadas mensuales'}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      </section>
    </>
  )
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
