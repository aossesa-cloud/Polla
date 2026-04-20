/**
 * PicksTableContainer.jsx
 *
 * Contenedor que decide la agrupación de tablas según el modo.
 * - Individual/progressive-elimination: una sola tabla
 * - Groups/Pairs/Head-to-head: una sección por agrupación
 *
 * Reutiliza PicksTable y TableSection. No duplica tablas.
 */

import React, { useMemo, useState, useCallback, useRef } from 'react'
import html2canvas from 'html2canvas'
import useAppStore from '../../store/useAppStore'
import { buildCompetitionTableSections } from '../../services/competitionTableSections'
import { calculateDailyScores } from '../../engine/scoreEngine'
import { getEliminated } from '../../engine/phaseManager'
import PicksTable from './PicksTable'
import TableSection from './TableSection'
import PicksTableExportView from './PicksTableExportView'
import { generateExportHTML } from '../../services/exportStyles'
import styles from '../PronosticosTable.module.css'

export default function PicksTableContainer({
  picks: allPicks,
  results,
  date,
  raceCount,
  settings,
  availableDates,
  availableCampaigns,
  // Props from wrapper for synchronized state
  selectedDate: propSelectedDate,
  onDateChange,
  selectedCampaign: propSelectedCampaign,
  onCampaignChange,
  exportStyle = 'excel-classic', // ✅ Estilo de exportación PNG de la campaña
  customColors = null, // ✅ Colores personalizados (para estilo 'custom')
  campaignInfo = null, // ✅ Información de la campaña para header dinámico
}) {
  const user = useAppStore(state => state.user)
  const appData = useAppStore(state => state.appData)
  
  // Use props if provided, otherwise fallback to local state (backward compatibility)
  const [selectedDate, setSelectedDate] = useState(propSelectedDate || date || '')
  const [selectedCampaign, setSelectedCampaign] = useState(propSelectedCampaign || 'all')
  const [exportMessage, setExportMessage] = useState(null)
  const tableContainerRef = useRef(null)

  // Sync with props when they change
  React.useEffect(() => {
    if (propSelectedDate !== undefined && propSelectedDate !== selectedDate) {
      setSelectedDate(propSelectedDate)
    }
  }, [propSelectedDate])

  React.useEffect(() => {
    if (propSelectedCampaign !== undefined && propSelectedCampaign !== selectedCampaign) {
      setSelectedCampaign(propSelectedCampaign)
    }
  }, [propSelectedCampaign])

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate)
    if (onDateChange) onDateChange(newDate)
  }

  const handleCampaignChange = (newCampaign) => {
    setSelectedCampaign(newCampaign)
    if (onCampaignChange) onCampaignChange(newCampaign)
  }

  // Filter picks by selected date
  const filteredPicks = useMemo(() => {
    if (!selectedDate || !allPicks || allPicks.length === 0) return allPicks
    return allPicks
  }, [allPicks, selectedDate])

  // Campañas disponibles para la fecha seleccionada (ya vienen filtradas desde App.jsx)
  const campaignsForDate = useMemo(() => {
    // availableCampaigns ya viene filtrado por fecha desde App.jsx
    return availableCampaigns || []
  }, [availableCampaigns, selectedDate])

  // Auto-select primera campaña si ninguna está seleccionada (respaldo por si el wrapper no lo hizo aún)
  React.useEffect(() => {
    if ((selectedCampaign === 'all' || !selectedCampaign) && campaignsForDate.length > 0) {
      setSelectedCampaign(campaignsForDate[0].id)
      if (onCampaignChange) onCampaignChange(campaignsForDate[0].id)
    }
  }, [campaignsForDate])

  const selectedCampaignInfo = useMemo(() => {
    if (selectedCampaign === 'all') {
      return campaignsForDate.length === 1 ? campaignsForDate[0] : campaignInfo || null
    }

    return campaignsForDate.find((campaign) => campaign.id === selectedCampaign) || campaignInfo || null
  }, [campaignInfo, campaignsForDate, selectedCampaign])

  const effectiveSettings = useMemo(() => (
    selectedCampaignInfo?.modeConfig || selectedCampaignInfo || settings || {}
  ), [selectedCampaignInfo, settings])

  const mode =
    effectiveSettings?.format ||
    selectedCampaignInfo?.format ||
    selectedCampaignInfo?.competitionMode ||
    settings?.mode ||
    'individual'

  const eliminatedParticipants = useMemo(() => {
    if (mode !== 'progressive-elimination' || !selectedCampaignInfo?.id || !selectedDate) {
      return []
    }

    const matchingEvents = (appData?.events || [])
      .filter((event) => String(event?.id || '').includes(selectedCampaignInfo.id))
      .map((event) => ({
        ...event,
        eventDate: normalizeDate(event?.meta?.date || event?.date || event?.id || event?.sheetName),
      }))
      .filter((event) => event.eventDate && event.eventDate < selectedDate)
      .sort((left, right) => left.eventDate.localeCompare(right.eventDate))

    let eliminated = []

    matchingEvents.forEach((event) => {
      const eventPicks = (event?.participants || [])
        .map((participant) => ({
          participant: participant?.name || participant?.index,
          picks: participant?.picks || [],
        }))
        .filter((entry) => entry.participant)

      const scores = calculateDailyScores(
        eventPicks,
        event?.results || {},
        event?.scoring || { mode: 'dividend', doubleLastRace: true },
      )

      const rankings = Object.entries(scores).map(([participant, total]) => ({ participant, total }))
      eliminated = getEliminated(rankings, effectiveSettings, eliminated)
    })

    return eliminated
  }, [appData?.events, effectiveSettings, mode, selectedCampaignInfo?.id, selectedDate])

  const visiblePicks = useMemo(() => {
    if (mode !== 'progressive-elimination' || eliminatedParticipants.length === 0) {
      return filteredPicks
    }

    const eliminatedSet = new Set(
      eliminatedParticipants.map((participant) => String(participant || '').trim().toLowerCase())
    )

    return (filteredPicks || []).filter((pick) => {
      const participantName = String(pick?.participant || pick?.name || '').trim().toLowerCase()
      return participantName && !eliminatedSet.has(participantName)
    })
  }, [eliminatedParticipants, filteredPicks, mode])

  const groupings = useMemo(() => {
    if (selectedCampaign === 'all' && campaignsForDate.length > 1) return []

    return buildCompetitionTableSections({
      campaign: selectedCampaignInfo,
      picks: visiblePicks || [],
      settings: effectiveSettings,
      date: selectedDate || date || '',
    })
  }, [campaignsForDate.length, date, effectiveSettings, selectedCampaign, selectedCampaignInfo, selectedDate, visiblePicks])

  // Capturar tabla como canvas - VERSIÓN EXPORTACIÓN CON ESTILO PERSONALIZABLE
  const captureTable = useCallback(async () => {
    if (!tableContainerRef.current) return null
    
    try {
      // Mantener el mismo orden visible de la tabla para que la PNG coincida 1:1.
      const sorted = [...(visiblePicks || [])]

      const numRaces = raceCount || 12
      const tableTitle = selectedDate ? `Pronósticos ${selectedDate}` : 'Tabla de Pronósticos'

      // Generar HTML usando el estilo de la campaña + colores personalizados
      const html = generateExportHTML(
        sorted.map(p => ({
          participant: p.participant || p.name,
          picks: p.picks || [],
          points: p.points || p.score || 0,
        })),
        numRaces,
        tableTitle,
        selectedDate,
        exportStyle, // ✅ Usa el estilo de la campaña
        customColors, // ✅ Usa colores personalizados si es estilo 'custom'
        campaignInfo, // ✅ Información de la campaña para header dinámico
        results, // ✅ Resultados para detectar estado de jornada
        groupings // ✅ Agrupaciones para duelos/parejas/grupos
      )

      // Crear contenedor temporal
      const exportContainer = document.createElement('div')
      exportContainer.style.position = 'absolute'
      exportContainer.style.left = '-9999px'
      exportContainer.style.top = '0'
      exportContainer.style.zIndex = '-1'
      exportContainer.innerHTML = html
      document.body.appendChild(exportContainer)

      // Esperar renderizado
      await new Promise(resolve => setTimeout(resolve, 200))

      // Capturar con html2canvas
      const canvas = await html2canvas(exportContainer, {
        backgroundColor: '#FFFFFF',
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
      })

      // Limpiar
      document.body.removeChild(exportContainer)

      return canvas
    } catch (err) {
      console.error('Error capturing table:', err)
      return null
    }
  }, [visiblePicks, raceCount, selectedDate, exportStyle, customColors, campaignInfo, results, groupings])

  // Copiar imagen al portapapeles
  const handleCopyToClipboard = useCallback(async () => {
    setExportMessage(null)
    const canvas = await captureTable()
    if (!canvas) {
      setExportMessage({ tipo: 'error', texto: '❌ Error al capturar la tabla' })
      return
    }

    try {
      // Convertir canvas a blob y copiar al clipboard
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
      if (!blob) {
        setExportMessage({ tipo: 'error', texto: '❌ Error al generar la imagen' })
        return
      }

      // Clipboard API
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ])

      setExportMessage({ tipo: 'ok', texto: '✅ Imagen copiada correctamente al portapapeles' })
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setExportMessage(null), 3000)
    } catch (err) {
      console.error('Error copiando al portapapeles:', err)
      // Fallback: copiar como data URL si clipboard falla
      try {
        const dataUrl = canvas.toDataURL('image/png')
        await navigator.clipboard.writeText(dataUrl)
        setExportMessage({ tipo: 'ok', texto: '✅ Imagen copiada como URL (fallback)' })
        setTimeout(() => setExportMessage(null), 3000)
      } catch (fallbackErr) {
        console.error('Fallback error:', fallbackErr)
        setExportMessage({ tipo: 'error', texto: '❌ No se pudo copiar la imagen' })
      }
    }
  }, [captureTable])

  // Exportar PNG como archivo
  const handleExportPNG = useCallback(async () => {
    setExportMessage(null)
    const canvas = await captureTable()
    if (!canvas) {
      setExportMessage({ tipo: 'error', texto: '❌ Error al capturar la tabla' })
      return
    }

    try {
      const link = document.createElement('a')
      link.download = `pronosticos-${selectedDate || date || Date.now()}.png`
      link.href = canvas.toDataURL('image/png', 1.0)
      link.click()
      setExportMessage({ tipo: 'ok', texto: '✅ PNG exportado correctamente' })
      setTimeout(() => setExportMessage(null), 3000)
    } catch (err) {
      console.error('Error exporting PNG:', err)
      setExportMessage({ tipo: 'error', texto: '❌ Error al exportar PNG' })
    }
  }, [captureTable, selectedDate, date])

  return (
    <div className={styles.container}>
      <div className={styles.desktopScroll}>
        <div className={styles.desktopCanvas}>
      {/* Filtros */}
      <div className={styles.filters}>
        {/* Selector de fecha con calendario */}
        <div className={styles.filterGroupDate}>
          <label className={styles.filterLabel}>📅 Fecha:</label>
          <input
            className={styles.dateInput}
            type="date"
            value={selectedDate || ''}
            onChange={e => handleDateChange(e.target.value)}
          />
        </div>

        {/* Tabs de campañas */}
        {campaignsForDate.length > 0 && (
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>📋 Campaña:</label>
            <div className={styles.campaignTabs}>
              {campaignsForDate.map(c => (
                <button
                  key={c.id}
                  className={`${styles.campaignTab} ${selectedCampaign === c.id ? styles.campaignTabActive : ''}`}
                  onClick={() => handleCampaignChange(c.id)}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Table Header */}
      <div className={styles.tableHeader}>
        <div>
          <h2 className={styles.tableTitle}>📝 Tabla de Pronósticos</h2>
          <p className={styles.tableSubtitle}>
            {selectedDate || date || 'Selecciona fecha'} • {visiblePicks?.length || 0} studs • {raceCount || 12} carreras
          </p>
          {/* Export message */}
          {exportMessage && (
            <div className={`${styles.exportMessage} ${styles[exportMessage.tipo]}`}>
              {exportMessage.texto}
            </div>
          )}
        </div>
        <div className={styles.exportButtons}>
          {user && (
            <>
              <button className={styles.copyBtn} onClick={handleCopyToClipboard}>
                📋 Copiar imagen
              </button>
              <button className={styles.pngBtn} onClick={handleExportPNG}>
                📤 Exportar PNG
              </button>
            </>
          )}
        </div>
        {/* Totales destacados */}
        {visiblePicks && visiblePicks.length > 0 && (
          <div className={styles.totals}>
            <div className={styles.totalItem}>
              <span className={styles.totalValue}>{visiblePicks.length}</span>
              <span className={styles.totalLabel}>Studs</span>
            </div>
            <div className={styles.totalItem}>
              <span className={styles.totalValue}>{raceCount || 12}</span>
              <span className={styles.totalLabel}>Carreras</span>
            </div>
            <div className={styles.totalItem}>
              <span className={styles.totalValue}>{visiblePicks.reduce((sum, p) => sum + (p.picks?.filter(Boolean).length || 0), 0)}</span>
              <span className={styles.totalLabel}>Picks</span>
            </div>
          </div>
        )}
      </div>

      {/* Tables */}
      <div ref={tableContainerRef}>
        {visiblePicks && visiblePicks.length > 0 ? (
          (!groupings || groupings.length === 0) ? (
            <PicksTable 
              picks={visiblePicks} 
              results={results} 
              date={selectedDate || date} 
              raceCount={raceCount}
              campaignInfo={campaignInfo}
            />
          ) : (
            groupings.map(grouping => {
              const memberNames = grouping.members || []
              const groupPicks = visiblePicks.filter(p =>
                memberNames.includes(p.participant) || memberNames.includes(p.name)
              )

              if (groupPicks.length === 0) return null

              return (
                <TableSection
                  key={grouping.id}
                  title={grouping.name || grouping.id}
                  visualId={grouping.id}
                  mode={mode}
                >
                  <PicksTable
                    picks={groupPicks}
                    results={results}
                    date={selectedDate || date}
                    raceCount={raceCount}
                    campaignInfo={campaignInfo}
                  />
                </TableSection>
              )
            })
          )
        ) : (
          <div style={{ padding: 64, textAlign: 'center', color: '#9ca3af' }}>
            <p style={{ fontSize: 48, marginBottom: 16 }}>📝</p>
            <p style={{ fontSize: 18 }}>No hay pronósticos cargados{selectedDate ? ` para ${selectedDate}` : ''}.</p>
          </div>
        )}
      </div>
        </div>
      </div>
    </div>
  )
}
