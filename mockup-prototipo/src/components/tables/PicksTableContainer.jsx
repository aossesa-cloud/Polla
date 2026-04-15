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
import { getModeRules } from '../../engine/modeEngine'
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

  const mode = settings?.mode || 'individual'
  const rules = useMemo(() => getModeRules(mode), [mode])
  const groupings = useMemo(() => rules.getTableGrouping(settings), [rules, settings])

  // Debug: Log incoming picks
  React.useEffect(() => {
    console.log('[PicksTableContainer] Incoming picks:', allPicks?.length || 0)
    console.log('[PicksTableContainer] Picks sample:', allPicks?.slice(0, 3))
  }, [allPicks])

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

  // Capturar tabla como canvas - VERSIÓN EXPORTACIÓN CON ESTILO PERSONALIZABLE
  const captureTable = useCallback(async () => {
    if (!tableContainerRef.current) return null
    
    try {
      // Mantener el mismo orden visible de la tabla para que la PNG coincida 1:1.
      const sorted = [...(allPicks || [])]

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
        results // ✅ Resultados para detectar estado de jornada
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
  }, [allPicks, raceCount, selectedDate, exportStyle, customColors, campaignInfo, results])

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
        <div className={styles.filterGroup}>
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
              <button
                key="all"
                className={`${styles.campaignTab} ${selectedCampaign === 'all' ? styles.campaignTabActive : ''}`}
                onClick={() => handleCampaignChange('all')}
              >
                Todas
              </button>
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
            {selectedDate || date || 'Selecciona fecha'} • {filteredPicks?.length || 0} studs • {raceCount || 12} carreras
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
        {filteredPicks && filteredPicks.length > 0 && (
          <div className={styles.totals}>
            <div className={styles.totalItem}>
              <span className={styles.totalValue}>{filteredPicks.length}</span>
              <span className={styles.totalLabel}>Studs</span>
            </div>
            <div className={styles.totalItem}>
              <span className={styles.totalValue}>{raceCount || 12}</span>
              <span className={styles.totalLabel}>Carreras</span>
            </div>
            <div className={styles.totalItem}>
              <span className={styles.totalValue}>{filteredPicks.reduce((sum, p) => sum + (p.picks?.filter(Boolean).length || 0), 0)}</span>
              <span className={styles.totalLabel}>Picks</span>
            </div>
          </div>
        )}
      </div>

      {/* Tables */}
      <div ref={tableContainerRef}>
        {filteredPicks && filteredPicks.length > 0 ? (
          (!groupings || groupings.length === 0) ? (
            <PicksTable 
              picks={filteredPicks} 
              results={results} 
              date={selectedDate || date} 
              raceCount={raceCount}
              campaignInfo={campaignInfo}
            />
          ) : (
            groupings.map(grouping => {
              const memberNames = grouping.members || []
              const groupPicks = filteredPicks.filter(p =>
                memberNames.includes(p.participant) || memberNames.includes(p.name)
              )

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
