import React, { useState, useEffect } from 'react'
import api from '../api'
import useAppStore from '../store/useAppStore'
import { getChileDateString } from '../utils/dateChile'
import styles from './Alerts.module.css'

export default function Alerts() {
  const { appData, refresh } = useAppStore()
  const [importando, setImportando] = useState(false)
  const [importMsg, setImportMsg] = useState(null)

  if (!appData) return <div className={styles.loading}>Cargando datos...</div>

  const events = appData.events || []
  const programs = appData.programs || {}
  const settings = appData.settings || {}

  // Analizar eventos para generar alertas
  const alertas = []
  const carrerasEstado = []

  // Recorrer todos los eventos para verificar estado
  for (const event of events) {
    // Saltar eventos importados automáticamente (no campañas)
    if (event.id?.startsWith('imported-')) continue

    const eventId = event.id
    const participants = event.participants || []
    const results = event.results || {}
    const raceCount = event.meta?.raceCount || event.races || 12
    const eventTitle = event.sheetName || event.title || event.name || eventId

    // Determinar carreras finalizadas vs pendientes
    let cerradas = 0
    let abiertas = 0
    let sinFavorito = 0
    let sinResultados = 0

    for (let i = 1; i <= raceCount; i++) {
      const raceResult = results[String(i)] || results[i]
      const hasResult = raceResult && (raceResult.primero || raceResult.ganador || raceResult.first)
      const hasFavorito = raceResult && (raceResult.favorito || raceResult.favorite)

      if (hasResult) {
        cerradas++
      } else {
        // Verificar si la carrera ya pasó (hay picks y debería haber resultado)
        const hasPicks = participants.some(p => p.picks?.[i - 1])
        if (hasPicks) {
          abiertas++
          if (!hasFavorito) sinFavorito++
          sinResultados++
        }
      }
    }

    if (sinFavorito > 0) {
      alertas.push({
        tipo: 'favorito-faltante',
        gravedad: 'alta',
        evento: eventTitle,
        titulo: `Falta favorito en ${eventTitle}`,
        descripcion: `${sinFavorito} carrera(s) sin favorito registrado. Se necesita para defensa por retiro.`,
        hora: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
        resuelta: false
      })
    }

    if (sinResultados > 0) {
      alertas.push({
        tipo: 'resultados-faltantes',
        gravedad: 'media',
        evento: eventTitle,
        titulo: `Resultados pendientes en ${eventTitle}`,
        descripcion: `${sinResultados} carrera(s) con picks pero sin resultados oficiales.`,
        hora: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
        resuelta: false
      })
    }

    carrerasEstado.push({
      id: eventId,
      titulo: eventTitle,
      cerradas,
      abiertas,
      total: raceCount,
      participantes: participants.length,
      sinFavorito,
      sinResultados
    })
  }

  const alertasActivas = alertas.filter(a => !a.resuelta)
  const totalCerradas = carrerasEstado.reduce((s, c) => s + c.cerradas, 0)
  const totalAbiertas = carrerasEstado.reduce((s, c) => s + c.abiertas, 0)

  // Importar resultados desde Teletrak
  const handleImportResults = async () => {
    setImportando(true)
    setImportMsg(null)
    try {
      const today = getChileDateString()
      const tracks = await api.fetchTeletrakTracks(today)
      if (tracks.tracks && tracks.tracks.length > 0) {
        const trackId = tracks.tracks[0].id || tracks.tracks[0]
        await api.importTeletrakResults(today, trackId)
        setImportMsg({ tipo: 'ok', texto: `✓ Resultados importados desde Teletrak (${trackId})` })
        refresh()
      } else {
        setImportMsg({ tipo: 'error', texto: 'No hay tracks disponibles para hoy' })
      }
    } catch (err) {
      setImportMsg({ tipo: 'error', texto: `Error: ${err.message}` })
    } finally {
      setImportando(false)
    }
  }

  return (
    <div className={styles.alerts}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Panel de Control</h1>
          <p className={styles.subtitle}>
            {events.length} eventos cargados • {Object.keys(programs).length} programas
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.importBtn}
            onClick={handleImportResults}
            disabled={importando}
          >
            {importando ? 'Importando...' : '📡 Importar Teletrak'}
          </button>
          <div className={styles.summary}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryValue}>{alertasActivas.length}</span>
              <span className={styles.summaryLabel}>Alertas</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryValue}>{totalCerradas}</span>
              <span className={styles.summaryLabel}>Cerradas</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryValue}>{totalAbiertas}</span>
              <span className={styles.summaryLabel}>Abiertas</span>
            </div>
          </div>
        </div>
      </header>

      {importMsg && (
        <div className={`${styles.message} ${styles[importMsg.tipo]}`}>
          {importMsg.texto}
        </div>
      )}

      <div className={styles.layout}>
        {/* Alertas activas */}
        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>
            ⚠️ Alertas Activas ({alertasActivas.length})
          </h2>
          {alertasActivas.length === 0 ? (
            <div className={styles.emptyAlert}>
              <span className={styles.emptyIcon}>✅</span>
              <p>Todo en orden. No hay alertas pendientes.</p>
            </div>
          ) : (
            <div className={styles.alertList}>
              {alertasActivas.map((alerta, i) => {
                const config = gravedadConfig[alerta.gravedad]
                return (
                  <div key={i} className={styles.alertCard}>
                    <div className={styles.alertLeft}>
                      <span className={styles.alertIcon}>
                        {alerta.gravedad === 'alta' ? '🔴' : alerta.gravedad === 'media' ? '🟡' : '🔵'}
                      </span>
                      <div>
                        <span className={styles.alertTitle}>{alerta.titulo}</span>
                        <span className={styles.alertDesc}>{alerta.descripcion}</span>
                      </div>
                    </div>
                    <div className={styles.alertRight}>
                      <span className={styles.alertTime}>{alerta.hora}</span>
                      <span className={styles.alertBadge} style={{ background: config.bg, color: config.color }}>
                        {config.label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Estado de eventos */}
        <div className={styles.panel}>
          <h2 className={styles.panelTitle}> Estado de Eventos</h2>
          <div className={styles.eventsList}>
            {carrerasEstado.map(ev => (
              <div key={ev.id} className={styles.eventCard}>
                <div className={styles.eventHeader}>
                  <span className={styles.eventTitle}>{ev.titulo}</span>
                  <span className={styles.eventParticipants}>{ev.participantes} studs</span>
                </div>
                <div className={styles.eventStats}>
                  <div className={styles.eventStat}>
                    <span className={styles.eventStatValue}>{ev.cerradas}/{ev.total}</span>
                    <span className={styles.eventStatLabel}>Cerradas</span>
                  </div>
                  <div className={styles.eventStat}>
                    <span className={styles.eventStatValue}>{ev.abiertas}</span>
                    <span className={styles.eventStatLabel}>Abiertas</span>
                  </div>
                  {ev.sinFavorito > 0 && (
                    <div className={styles.eventStat}>
                      <span className={styles.eventStatValue} style={{ color: '#ef4444' }}>{ev.sinFavorito}</span>
                      <span className={styles.eventStatLabel}>Sin Fav.</span>
                    </div>
                  )}
                  {ev.sinResultados > 0 && (
                    <div className={styles.eventStat}>
                      <span className={styles.eventStatValue} style={{ color: '#f59e0b' }}>{ev.sinResultados}</span>
                      <span className={styles.eventStatLabel}>Sin Res.</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {carrerasEstado.length === 0 && (
              <div className={styles.emptyAlert}>
                <span className={styles.emptyIcon}>📋</span>
                <p>No hay eventos de campañas cargados. Crea una campaña desde la sección Campañas.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const gravedadConfig = {
  alta: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: 'Alta' },
  media: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'Media' },
  info: { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', label: 'Info' }
}
