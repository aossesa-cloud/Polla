import React, { useState, useEffect } from 'react'
import api from '../api'
import useAppStore from '../store/useAppStore'
import styles from './Calendar.module.css'

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function generarCalendario(year, month) {
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  let startDay = firstDay.getDay() - 1
  if (startDay < 0) startDay = 6

  const semanas = []
  let semana = []
  for (let i = 0; i < startDay; i++) semana.push(null)

  for (let d = 1; d <= lastDay.getDate(); d++) {
    semana.push(d)
    if (semana.length === 7) { semanas.push(semana); semana = [] }
  }
  if (semana.length > 0) {
    while (semana.length < 7) semana.push(null)
    semanas.push(semana)
  }
  return semanas
}

export default function Calendar() {
  const { appData } = useAppStore()
  const [mesActual, setMesActual] = useState(new Date().getMonth() + 1)
  const [anioActual] = useState(new Date().getFullYear())
  const [diaSeleccionado, setDiaSeleccionado] = useState(null)

  const semanas = generarCalendario(anioActual, mesActual)
  const hoy = new Date().getDate()

  // Get programs and events for this month
  const programs = appData?.programs || {}
  const events = appData?.events || []

  // Build a map of date -> info
  const diasConInfo = {}
  for (const [key, prog] of Object.entries(programs)) {
    const date = prog.date || key.split('::')[0]
    if (date && date.startsWith(`${anioActual}-${String(mesActual).padStart(2, '0')}`)) {
      const trackName = prog.trackName || prog.trackId || key.split('::')[1] || ''
      diasConInfo[date] = { hipodromo: trackName, tipo: 'programa' }
    }
  }
  for (const ev of events) {
    if (ev.id?.startsWith('imported-')) {
      const date = ev.meta?.date || ev.date || ev.id.replace('imported-', '').split('-').slice(0, 3).join('-')
      if (date && date.startsWith(`${anioActual}-${String(mesActual).padStart(2, '0')}`)) {
        if (!diasConInfo[date]) {
          diasConInfo[date] = { hipodromo: ev.meta?.trackName || ev.meta?.trackId || '', tipo: 'resultados' }
        }
      }
    }
  }

  const stats = {
    programas: Object.values(diasConInfo).filter(d => d.tipo === 'programa').length,
    resultados: Object.values(diasConInfo).filter(d => d.tipo === 'resultados').length,
    total: Object.keys(diasConInfo).length
  }

  return (
    <div className={styles.calendar}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Calendario</h1>
          <p className={styles.subtitle}>Jornadas y programas del mes</p>
        </div>
      </header>

      <div className={styles.layout}>
        <div className={styles.calPanel}>
          <div className={styles.monthNav}>
            <button className={styles.navBtn} onClick={() => setMesActual(m => Math.max(1, m - 1))}>←</button>
            <h2 className={styles.monthTitle}>{MESES[mesActual - 1]} {anioActual}</h2>
            <button className={styles.navBtn} onClick={() => setMesActual(m => Math.min(12, m + 1))}>→</button>
          </div>

          <div className={styles.calGrid}>
            <div className={styles.weekdays}>
              {DIAS_SEMANA.map(d => <span key={d} className={styles.weekday}>{d}</span>)}
            </div>
            {semanas.map((semana, si) => (
              <div key={si} className={styles.weekRow}>
                {semana.map((dia, di) => {
                  if (!dia) return <div key={di} className={`${styles.dayCell} ${styles.empty}`} />
                  const fecha = `${anioActual}-${String(mesActual).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
                  const info = diasConInfo[fecha]
                  const esHoy = dia === hoy

                  return (
                    <button
                      key={di}
                      className={`
                        ${styles.dayCell}
                        ${esHoy ? styles.hoy : ''}
                        ${info ? styles.conInfo : ''}
                        ${diaSeleccionado === dia ? styles.selected : ''}
                      `}
                      onClick={() => setDiaSeleccionado(diaSeleccionado === dia ? null : dia)}
                    >
                      <span className={styles.dayNum}>{dia}</span>
                      {info && (
                        <>
                          <span className={styles.dayHipodromo}>{info.hipodromo.replace('Hipodromo ', '').replace('Club ', '').replace('Hipódromo ', '')}</span>
                          <span className={styles.dayBadge}>{info.tipo === 'programa' ? '📋' : '🏁'}</span>
                        </>
                      )}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>

          <div className={styles.legend}>
            <div className={styles.legendItem}>
              <span className={`${styles.dot} ${styles.dotPrograma}`}></span>
              <span>Programa</span>
            </div>
            <div className={styles.legendItem}>
              <span className={`${styles.dot} ${styles.dotResultados}`}></span>
              <span>Resultados</span>
            </div>
          </div>
        </div>

        <div className={styles.detailPanel}>
          {diaSeleccionado ? (
            <div className={styles.detailCard}>
              <h3 className={styles.detailTitle}>
                {diaSeleccionado} de {MESES[mesActual - 1]}
              </h3>
              {(() => {
                const fecha = `${anioActual}-${String(mesActual).padStart(2, '0')}-${String(diaSeleccionado).padStart(2, '0')}`
                const info = diasConInfo[fecha]
                if (!info) return <p className={styles.emptyText}>No hay actividad este día</p>
                return (
                  <>
                    <div className={styles.detailInfo}>
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Hipódromo</span>
                        <span className={styles.infoValue}>{info.hipodromo}</span>
                      </div>
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Tipo</span>
                        <span className={styles.infoValue}>{info.tipo === 'programa' ? 'Programa' : 'Resultados'}</span>
                      </div>
                    </div>
                  </>
                )
              })()}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📅</div>
              <p className={styles.emptyText}>Selecciona un día para ver detalles</p>
            </div>
          )}

          <div className={styles.statsCard}>
            <h3 className={styles.statsTitle}>Resumen del mes</h3>
            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{stats.programas}</span>
                <span className={styles.statLabel}>Programas</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{stats.resultados}</span>
                <span className={styles.statLabel}>Resultados</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{stats.total}</span>
                <span className={styles.statLabel}>Total días</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
