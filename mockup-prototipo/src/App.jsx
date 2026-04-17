import React, { useEffect, useState, useMemo } from 'react'
import useAppStore from './store/useAppStore'
import { ThemeProvider } from './context/ThemeContext'
import { resolveCampaignExportConfig } from './services/campaignStyles'
import { resolveEventOperationalData } from './services/campaignOperationalData'
import { calculateDailyScores } from './engine/scoreEngine'
import { getChileDateString } from './utils/dateChile'
import { getDefaultView, isPrivateView } from './config/routes'
import { PickEntry, PicksTableContainer, RankingContainer, CampaignWizard, ResultadosJornada, Alerts, Groups, Calendar, Programa, Premios, Settings, Login, Sidebar } from './components'
import styles from './App.module.css'

const views = {
  dashboard: Alerts,
  grupos: Groups,
  campanas: CampaignWizard,
  calendario: Calendar,
  programa: Programa,
  resultados: ResultadosJornada,
  ingreso: PickEntry,
  premios: Premios,
  settings: Settings
}

export default function App() {
  const {
    user, loading, activeView, campaignType, appData, loadingError,
    setActiveView, setCampaignType, login, logout, refresh, initialize
  } = useAppStore()

  // Estado para mostrar modal de login desde vista pública
  const [showLoginModal, setShowLoginModal] = useState(false)

  // Initialize on mount
  useEffect(() => {
    initialize()
  }, [])

  const handleLogout = () => {
    logout()
  }

  const handleShowLogin = () => {
    setShowLoginModal(true)
  }

  const handleLoginSuccess = async (credentials) => {
    try {
      await login(credentials)
      setShowLoginModal(false)
    } catch (err) {
      throw err
    }
  }

  const handleViewChange = (viewId) => {
    // Si la vista es privada y no está autenticado, bloquear
    if (isPrivateView(viewId) && !user) {
      return
    }
    
    setActiveView(viewId)
    if (viewId !== 'settings') {
      refresh()
    }
  }

  // Si no está autenticado y está en una vista privada, redirigir a pública
  useEffect(() => {
    if (!user && isPrivateView(activeView)) {
      setActiveView(getDefaultView(false))
    }
  }, [user, activeView])

  // Loading state
  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}>🏇</div>
        <p>Cargando Polla Hípica...</p>
      </div>
    )
  }

  // Error state
  if (loadingError) {
    return (
      <div className={styles.loading}>
        <p style={{ color: '#ef4444' }}>⚠️ {loadingError}</p>
        <p style={{ color: '#9ca3af', fontSize: 12 }}>Verifica que el servidor legacy esté corriendo en puerto 3030</p>
      </div>
    )
  }

  // Si está en vista privada y no autenticado → mostrar login
  if (!user && isPrivateView(activeView)) {
    return <Login />
  }

  // Autenticado → app principal
  const ActiveComponent = views[activeView] || Alerts

  // Get active campaign theme
  return (
    <ThemeProvider theme="dark">
      <div className={styles.app}>
        <Sidebar
          activeView={activeView}
          onNavigate={handleViewChange}
          user={user}
          onLogout={handleLogout}
          onShowLogin={handleShowLogin}
        />

        <main className={styles.main}>
          {activeView === 'ranking' ? (
            <RankingContainer type={campaignType} />
          ) : activeView === 'pronosticos' ? (
            <PicksTableContainerWrapper />
          ) : (
            <ActiveComponent
              data={appData}
              refreshData={refresh}
            />
          )}
        </main>

        {/* Modal de Login para usuarios públicos */}
        {showLoginModal && !user && (
          <div className={styles.loginModal}>
            <Login
              onSuccess={() => setShowLoginModal(false)}
              onCancel={() => setShowLoginModal(false)}
            />
          </div>
        )}
      </div>
    </ThemeProvider>
  )
}

/**
 * Wrapper para PicksTableContainer que extrae los datos de appData.
 * Filtra por campañas activas y fechas.
 */
function PicksTableContainerWrapper() {
  const { appData, campaignType } = useAppStore()
  const [selectedDate, setSelectedDate] = useState(() => getChileDateString())
  const [selectedCampaign, setSelectedCampaign] = useState('all')

  const allEvents = appData?.events || []
  const campaigns = appData?.campaigns || {}
  const programs = appData?.programs || {}

  const availableDates = useMemo(() => {
    const dates = new Set()
    allEvents.forEach((event) => {
      const date = getEventDateKey(event)
      if (date) dates.add(date)
    })
    Object.values(programs).forEach((program) => {
      if (program?.date) dates.add(program.date)
    })
    return Array.from(dates).sort().reverse()
  }, [allEvents, programs])

  const activeCampaignsForDisplay = useMemo(() => {
    const allActive = [
      ...(campaigns.diaria || []).filter((campaign) => campaign.enabled).map((campaign) => ({ ...campaign, type: 'diaria' })),
      ...(campaigns.semanal || []).filter((campaign) => campaign.enabled).map((campaign) => ({ ...campaign, type: 'semanal' })),
      ...(campaigns.mensual || []).filter((campaign) => campaign.enabled).map((campaign) => ({ ...campaign, type: 'mensual' })),
    ]

    if (!selectedDate) return allActive

    return allActive.filter((campaign) => {
      if (campaign.type === 'diaria' && campaign.date) {
        return campaign.date === selectedDate
      }
      if (campaign.startDate && campaign.endDate) {
        return selectedDate >= campaign.startDate && selectedDate <= campaign.endDate
      }
      return true
    })
  }, [campaigns, selectedDate])

  const activeCampaigns = useMemo(() => {
    if (selectedCampaign === 'all') return activeCampaignsForDisplay
    return activeCampaignsForDisplay.filter((campaign) => campaign.id === selectedCampaign || campaign.type === selectedCampaign)
  }, [activeCampaignsForDisplay, selectedCampaign])

  const campaignExportStyle = useMemo(() => {
    const campaign = selectedCampaign === 'all'
      ? activeCampaignsForDisplay[0]
      : activeCampaignsForDisplay.find((entry) => entry.id === selectedCampaign)
    return resolveCampaignExportConfig(campaign).exportStyle
  }, [selectedCampaign, activeCampaignsForDisplay])

  const campaignCustomColors = useMemo(() => {
    const campaign = selectedCampaign === 'all'
      ? activeCampaignsForDisplay[0]
      : activeCampaignsForDisplay.find((entry) => entry.id === selectedCampaign)
    return resolveCampaignExportConfig(campaign).customColors
  }, [selectedCampaign, activeCampaignsForDisplay])

  const campaignEvents = useMemo(() => {
    if (activeCampaigns.length === 0) return []
    return allEvents.filter((event) => activeCampaigns.some((campaign) => eventMatchesCampaign(event, campaign)))
  }, [allEvents, activeCampaigns])

  const filteredEvents = useMemo(() => {
    if (!selectedDate) return campaignEvents
    return campaignEvents.filter((event) => {
      const eventDate = getEventDateKey(event)
      if (eventDate) return eventDate === selectedDate
      return String(event?.id || '').includes(selectedDate)
    })
  }, [campaignEvents, selectedDate])

  const resolvedEvents = useMemo(() => {
    return filteredEvents.map((event) => {
      const matchedCampaign = activeCampaigns.find((campaign) => eventMatchesCampaign(event, campaign)) || null
      const operationalData = resolveEventOperationalData(appData, matchedCampaign, event, selectedDate)
      const resolvedRaceCount = Number(
        operationalData.raceCount ||
        event?.races ||
        event?.meta?.raceCount ||
        matchedCampaign?.raceCount ||
        12
      )
      const scoringConfig = event.scoring || matchedCampaign?.scoring || { mode: 'dividend', doubleLastRace: true }
      const fallbackPicks = (event.participants || []).map((participant) => ({
        participant: participant.name || participant.index,
        picks: normalizeParticipantPicks(participant.picks, resolvedRaceCount),
      }))
      const recalculatedScores = hasResultEntries(operationalData.results)
        ? calculateDailyScores(fallbackPicks, operationalData.results, scoringConfig)
        : {}

      const picks = (event.participants || []).map((participant) => {
        const participantName = participant.name || participant.index
        const backendPoints = Number(participant.points)
        const resolvedPoints = hasResultEntries(operationalData.results)
          ? Number(recalculatedScores[participantName] || 0)
          : (Number.isFinite(backendPoints) ? backendPoints : 0)

        return {
          participant: participantName,
          name: participantName,
          picks: normalizeParticipantPicks(participant.picks, resolvedRaceCount),
          points: resolvedPoints,
          score: resolvedPoints,
          date: operationalData.date || getEventDateKey(event),
          campaignType: event.campaignType,
          scoring: scoringConfig,
        }
      })

      return {
        event,
        campaign: matchedCampaign,
        raceCount: resolvedRaceCount,
        date: operationalData.date || getEventDateKey(event),
        results: operationalData.results || {},
        picks,
      }
    })
  }, [filteredEvents, activeCampaigns, appData, selectedDate])

  const picks = useMemo(() => resolvedEvents.flatMap((entry) => entry.picks), [resolvedEvents])

  const mergedResults = useMemo(() => {
    return resolvedEvents.reduce((acc, entry) => ({
      ...acc,
      ...(entry.results || {}),
    }), {})
  }, [resolvedEvents])

  const resolvedRaceCount = useMemo(() => {
    const maxFromEvents = Math.max(0, ...resolvedEvents.map((entry) => Number(entry.raceCount || 0)), 0)
    const selectedCampaignConfig = activeCampaignsForDisplay.find((campaign) => campaign.id === selectedCampaign)
    return maxFromEvents || Number(selectedCampaignConfig?.raceCount || 0) || 12
  }, [resolvedEvents, activeCampaignsForDisplay, selectedCampaign])

  const firstResolvedEvent = resolvedEvents[0]

  if (picks.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Fecha:</label>
            <input
              className={styles.dateInput}
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Campaña:</label>
            <div className={styles.campaignTabs}>
              <button
                className={`${styles.campaignTab} ${selectedCampaign === 'all' ? styles.campaignTabActive : ''}`}
                onClick={() => setSelectedCampaign('all')}
              >
                Todas ({activeCampaignsForDisplay.length})
              </button>
              {activeCampaignsForDisplay.map((campaign) => (
                <button
                  key={campaign.id}
                  className={`${styles.campaignTab} ${selectedCampaign === campaign.id ? styles.campaignTabActive : ''}`}
                  onClick={() => setSelectedCampaign(campaign.id)}
                >
                  {campaign.name}
                </button>
              ))}
              {activeCampaignsForDisplay.length === 0 && (
                <span style={{ color: '#64748b', fontSize: '13px', padding: '8px' }}>
                  No hay campañas para esta fecha
                </span>
              )}
            </div>
          </div>
        </div>
        <div style={{ padding: 64, textAlign: 'center', color: '#9ca3af' }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>Tabla</p>
          <p style={{ fontSize: 18 }}>
            No hay pronósticos cargados
            {activeCampaigns.length === 0 ? ' en campañas activas.' : selectedDate ? ` para ${selectedDate}.` : '.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <PicksTableContainer
      picks={picks}
      results={mergedResults}
      date={firstResolvedEvent?.date || ''}
      raceCount={resolvedRaceCount}
      settings={appData?.settings?.[campaignType] || {}}
      availableDates={availableDates}
      availableCampaigns={activeCampaignsForDisplay}
      selectedDate={selectedDate}
      onDateChange={setSelectedDate}
      selectedCampaign={selectedCampaign}
      onCampaignChange={setSelectedCampaign}
      exportStyle={campaignExportStyle}
      customColors={campaignCustomColors}
      campaignInfo={activeCampaignsForDisplay.find((campaign) => campaign.id === selectedCampaign) || firstResolvedEvent?.campaign || activeCampaignsForDisplay[0]}
    />
  )
}

function eventMatchesCampaign(event, campaign) {
  if (!event || !campaign) return false
  const eventId = String(event.id || '')
  const campaignId = String(campaign.id || '')
  const campaignEventId = String(campaign.eventId || '')
  const explicitIds = Array.isArray(campaign.eventIds) ? campaign.eventIds : []

  return [
    campaignId && eventId.includes(campaignId),
    campaignEventId && campaignEventId === eventId,
    campaignEventId && eventId.includes(campaignEventId),
    campaignEventId && campaignEventId.includes(eventId),
    ...explicitIds.map((id) => eventId.includes(id) || id.includes(eventId)),
  ].some(Boolean)
}

function getEventDateKey(event) {
  const value = event?.date || event?.meta?.date || ''
  return value ? String(value).split('T')[0] : ''
}

function normalizeParticipantPicks(picks, raceCount = 0) {
  const normalized = Array.isArray(picks) ? [...picks] : []
  if (raceCount > normalized.length) {
    return [...normalized, ...Array.from({ length: raceCount - normalized.length }, () => '')]
  }
  return normalized.slice(0, raceCount || normalized.length)
}

function hasResultEntries(results) {
  return Object.values(results || {}).some((race) => race && (race.primero || race.winner?.number))
}
