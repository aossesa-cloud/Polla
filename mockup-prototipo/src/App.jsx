import React, { useEffect, useState, useMemo } from 'react'
import useAppStore from './store/useAppStore'
import { ThemeProvider } from './context/ThemeContext'
import { resolveCampaignExportConfig } from './services/campaignStyles'
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
  // Inicializar con fecha actual
  const [selectedDate, setSelectedDate] = useState(() => getChileDateString())
  const [selectedCampaign, setSelectedCampaign] = useState('all')

  // Get all events as array
  const allEvents = appData?.events || []

  // Get campaigns by type
  const campaigns = appData?.campaigns || {}

  // Get programs to determine race count
  const programs = appData?.programs || {}

  // Debug: Log programs on change
  React.useEffect(() => {
    console.log('[PicksTable] Programas cargados:', Object.keys(programs).length)
    console.log('[PicksTable] Keys:', Object.keys(programs))
    Object.entries(programs).forEach(([key, prog]) => {
      console.log(`[PicksTable] Programa ${key}: date=${prog?.date}, races=${Object.keys(prog?.races || {}).length}`)
    })
  }, [programs])

  // Get unique dates from events
  const availableDates = useMemo(() => {
    const dates = new Set()
    allEvents.forEach(ev => {
      const date = ev.date || ev.meta?.date
      if (date) dates.add(date)
    })
    // Also add dates from programs
    Object.values(programs).forEach(prog => {
      if (prog?.date) dates.add(prog.date)
    })
    return Array.from(dates).sort().reverse()
  }, [allEvents, programs])

  // Get race count from program for selected date
  const programRaceCount = useMemo(() => {
    if (!selectedDate) return 12

    // Find program for selected date
    const datePrograms = Object.values(programs).filter(p => p?.date === selectedDate)
    console.log('[PicksTable] Fecha seleccionada:', selectedDate)
    console.log('[PicksTable] Programas para esa fecha:', datePrograms)

    if (datePrograms.length > 0) {
      // Get max race count from all programs for this date
      const maxRaces = Math.max(...datePrograms.map(p => {
        const races = p?.races || {}
        const count = Object.keys(races).length
        console.log(`[PicksTable] Programa ${p.trackId}: ${count} carreras`)
        return count
      }))
      console.log(`[PicksTable] Max carreras: ${maxRaces}`)
      return maxRaces > 0 ? maxRaces : 12
    }
    console.log('[PicksTable] No hay programas para la fecha, usando 12')
    return 12
  }, [programs, selectedDate])

  // Get active campaigns with proper names for display
  const activeCampaignsForDisplay = useMemo(() => {
    const allActive = [
      ...(campaigns.diaria || []).filter(c => c.enabled).map(c => ({ ...c, type: 'diaria' })),
      ...(campaigns.semanal || []).filter(c => c.enabled).map(c => ({ ...c, type: 'semanal' })),
      ...(campaigns.mensual || []).filter(c => c.enabled).map(c => ({ ...c, type: 'mensual' })),
    ]

    // Filter by selected date if set
    if (selectedDate) {
      return allActive.filter(c => {
        // For diaria, match exact date
        if (c.type === 'diaria' && c.date) {
          return c.date === selectedDate
        }
        // For semanal/mensual, check if date is in range
        if (c.startDate && c.endDate) {
          return selectedDate >= c.startDate && selectedDate <= c.endDate
        }
        return true
      })
    }

    return allActive
  }, [campaigns, selectedDate])

  // Get export style from selected campaign (or default)
  const campaignExportStyle = useMemo(() => {
    const campaign = selectedCampaign === 'all'
      ? activeCampaignsForDisplay[0]
      : activeCampaignsForDisplay.find(c => c.id === selectedCampaign)
    return resolveCampaignExportConfig(campaign).exportStyle
  }, [selectedCampaign, activeCampaignsForDisplay])

  // Get custom colors from selected campaign (for 'custom' style)
  const campaignCustomColors = useMemo(() => {
    const campaign = selectedCampaign === 'all'
      ? activeCampaignsForDisplay[0]
      : activeCampaignsForDisplay.find(c => c.id === selectedCampaign)
    return resolveCampaignExportConfig(campaign).customColors
  }, [selectedCampaign, activeCampaignsForDisplay])

  // Get active campaigns for filtering events
  const activeCampaigns = useMemo(() => {
    if (selectedCampaign === 'all') {
      return activeCampaignsForDisplay
    } else {
      // selectedCampaign es el ID de la campaña
      const byId = activeCampaignsForDisplay.find(c => c.id === selectedCampaign)
      console.log('[PicksTable] Searching for campaign:', selectedCampaign)
      console.log('[PicksTable] Available campaigns IDs:', activeCampaignsForDisplay.map(c => c.id))
      console.log('[PicksTable] Available campaigns full:', activeCampaignsForDisplay)
      if (byId) {
        console.log('[PicksTable] ✓ Found campaign by ID:', byId)
        return [byId]
      }
      
      // Si no es ID, filtrar por type
      const byType = activeCampaignsForDisplay.filter(c => c.type === selectedCampaign)
      console.log('[PicksTable] Filtering by type:', selectedCampaign, 'found:', byType.length)
      return byType
    }
  }, [activeCampaignsForDisplay, selectedCampaign])

  // Filter events that belong to active campaigns
  const campaignEvents = useMemo(() => {
    if (activeCampaigns.length === 0) {
      console.log('[PicksTable] No active campaigns, returning empty')
      return []
    }
    
    console.log('[PicksTable] === EVENT MATCHING DEBUG ===')
    console.log('[PicksTable] selectedCampaign:', selectedCampaign)
    console.log('[PicksTable] activeCampaigns:', activeCampaigns.map(c => ({ 
      id: c.id, 
      name: c.name, 
      eventId: c.eventId, 
      eventIds: c.eventIds,
      type: c.type 
    })))
    console.log('[PicksTable] allEvents:', allEvents.map(ev => ({ 
      id: ev.id, 
      date: ev.date || ev.meta?.date,
      participants: (ev.participants || []).length 
    })))
    
    const matched = allEvents.filter(ev => {
      const match = activeCampaigns.some(campaign => {
        // Multiple matching strategies
        const strategies = [
          { name: 'ev.id includes campaign.id', result: ev.id?.includes(campaign.id) },
          { name: 'campaign.eventId === ev.id', result: campaign.eventId === ev.id },
          { name: 'ev.id includes campaign.eventId', result: ev.id?.includes(campaign.eventId) },
          { name: 'campaign.eventId includes ev.id', result: campaign.eventId?.includes(ev.id) },
          ...(campaign.eventIds || []).map(eid => ({ 
            name: `eventIds[${eid}] match`, 
            result: ev.id?.includes(eid) || eid.includes(ev.id || '') 
          }))
        ]
        console.log(`[PicksTable] Event ${ev.id} vs Campaign ${campaign.id}:`, strategies)
        return strategies.some(s => s.result)
      })
      if (match) {
        console.log(`[PicksTable] ✓ Event ${ev.id} matched!`)
      }
      return match
    })
    
    console.log(`[PicksTable] Matched ${matched.length} events out of ${allEvents.length}`)
    console.log('[PicksTable] Matched events:', matched.map(ev => ev.id))
    console.log('[PicksTable] ===============================')
    return matched
  }, [allEvents, activeCampaigns, selectedCampaign])

  // Filter events by selected date
  const filteredEvents = useMemo(() => {
    if (!selectedDate) return campaignEvents
    
    const selectedDateStr = selectedDate.split('T')[0]
    
    console.log('[PicksTable] Date filtering - selectedDateStr:', selectedDateStr)
    console.log('[PicksTable] campaignEvents before date filter:', campaignEvents.map(ev => ({
      id: ev.id,
      date: ev.date,
      metaDate: ev.meta?.date,
      metaTrackId: ev.meta?.trackId
    })))
    console.log('[PicksTable] activeCampaigns for date check:', activeCampaigns.map(c => ({ id: c.id, date: c.date })))
    
    const filtered = campaignEvents.filter(ev => {
      const eventDate = ev.date || ev.meta?.date
      const eventDateStr = eventDate ? eventDate.split('T')[0] : ''
      
      console.log(`[PicksTable] Event ${ev.id} date check:`, {
        eventDate,
        eventDateStr,
        selectedDateStr,
        directMatch: eventDateStr === selectedDateStr,
        idContainsDate: ev.id?.includes(selectedDateStr),
        campaignHasDate: activeCampaigns.some(c => c.date === selectedDateStr)
      })
      
      // Primary match: event has a date field
      if (eventDateStr && eventDateStr === selectedDateStr) return true
      
      // Fallback match: event ID contains the date (e.g., "campaign-daily-2026-04-12" or "imported-2026-04-12")
      if (ev.id?.includes(selectedDateStr)) return true
      
      // Fallback match: if campaign has this date and event belongs to campaign
      if (activeCampaigns.some(c => c.date === selectedDateStr)) return true
      
      return false
    })
    
    console.log('[PicksTable] filteredEvents after date filter:', filtered.map(ev => ev.id))
    return filtered
  }, [campaignEvents, selectedDate, activeCampaigns])

  // Get picks from filtered events
  const picks = useMemo(() => {
    console.log('[PicksTable] filteredEvents:', filteredEvents.map(ev => ({
      id: ev.id,
      date: ev.date || ev.meta?.date,
      participantsCount: (ev.participants || []).length,
      hasPicks: (ev.participants || []).some(p => (p.picks || []).length > 0)
    })))

    const result = filteredEvents.flatMap(ev => {
      const eventDate = ev.date || ev.meta?.date
      const scoring = ev.scoring || { mode: 'dividend', doubleLastRace: true }
      return (ev.participants || []).map(p => ({
        participant: p.name || p.index,
        picks: p.picks || [],
        points: p.points || 0,  // ✅ Include backend-calculated points
        score: p.points || 0,   // ✅ Also as score for compatibility
        date: eventDate,
        campaignType: ev.campaignType,
        scoring: scoring,  // ✅ Include scoring config for frontend calc if needed
      }))
    })

    console.log('[PicksTable] Generated picks:', result.length, 'from', filteredEvents.length, 'events')
    console.log('[PicksTable] Picks participants:', result.map(p => ({ name: p.participant, points: p.points })))
    return result
  }, [filteredEvents])

  // Get results (merge all filtered event results)
  const mergedResults = useMemo(() => {
    const result = filteredEvents.reduce((acc, ev) => {
      if (ev.results) {
        Object.assign(acc, ev.results)
      }
      return acc
    }, {})
    
    // DEBUG: Log merged results
    console.log('[PicksTable] mergedResults created:', {
      keyCount: Object.keys(result).length,
      keys: Object.keys(result).slice(0, 5),
      firstResult: result[Object.keys(result)[0]]
    })
    
    return result
  }, [filteredEvents])

  // Get first event for date/raceCount fallback
  const firstEvent = filteredEvents[0] || allEvents[0]

  if (picks.length === 0) {
    return (
      <div className={styles.container}>
        {/* Filtros nuevos */}
        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>📅 Fecha:</label>
            <input
              className={styles.dateInput}
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>📋 Campaña:</label>
            <div className={styles.campaignTabs}>
              <button
                className={`${styles.campaignTab} ${selectedCampaign === 'all' ? styles.campaignTabActive : ''}`}
                onClick={() => setSelectedCampaign('all')}
              >
                Todas ({activeCampaignsForDisplay.length})
              </button>
              {activeCampaignsForDisplay.map(c => (
                <button
                  key={c.id}
                  className={`${styles.campaignTab} ${selectedCampaign === c.id ? styles.campaignTabActive : ''}`}
                  onClick={() => setSelectedCampaign(c.id)}
                >
                  {c.type === 'diaria' ? '📅' : c.type === 'semanal' ? '📆' : '🗓️'} {c.name}
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
          <p style={{ fontSize: 48, marginBottom: 16 }}>📝</p>
          <p style={{ fontSize: 18 }}>
            No hay pronósticos cargados
            {activeCampaigns.length === 0 ? ' en campañas activas.' :
             selectedDate ? ` para ${selectedDate}.` : '.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <PicksTableContainer
      picks={picks}
      results={mergedResults}
      date={firstEvent?.date || ''}
      raceCount={programRaceCount}
      settings={appData?.settings?.[campaignType] || {}}
      availableDates={availableDates}
      availableCampaigns={activeCampaignsForDisplay}
      selectedDate={selectedDate}
      onDateChange={setSelectedDate}
      selectedCampaign={selectedCampaign}
      onCampaignChange={setSelectedCampaign}
      exportStyle={campaignExportStyle}
      customColors={campaignCustomColors}
      campaignInfo={activeCampaignsForDisplay.find(c => c.id === selectedCampaign) || activeCampaignsForDisplay[0]}
    />
  )
}
