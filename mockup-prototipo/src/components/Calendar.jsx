import React, { useMemo, useState } from 'react'
import api from '../api'
import useAppStore from '../store/useAppStore'
import styles from './Calendar.module.css'

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const HIPODROMOS = [
  { id: 'hipodromo-chile', label: 'Hipódromo Chile' },
  { id: 'chs', label: 'Club Hípico' },
  { id: 'valparaiso', label: 'Valparaíso Sporting' },
  { id: 'concepcion', label: 'Concepción' },
]

function canonicalTrackId(value) {
  const text = String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  if (text.includes('hipodromo chile')) return 'hipodromo-chile'
  if (text.includes('valparaiso')) return 'valparaiso'
  if (text.includes('concepcion')) return 'concepcion'
  if (text.includes('club hipico') || text === 'chs' || text.includes('santiago')) return 'chs'
  return ''
}

function trackLabel(value) {
  return HIPODROMOS.find((track) => track.id === canonicalTrackId(value))?.label || String(value || '')
}

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
  const { appData, mergeAdminResponse } = useAppStore()
  const [mesActual, setMesActual] = useState(new Date().getMonth() + 1)
  const [anioActual, setAnioActual] = useState(new Date().getFullYear())
  const [diaSeleccionado, setDiaSeleccionado] = useState(null)
  const [nuevaFecha, setNuevaFecha] = useState('')
  const [nuevoHipodromo, setNuevoHipodromo] = useState(HIPODROMOS[0].id)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  const semanas = generarCalendario(anioActual, mesActual)
  const hoy = new Date().getDate()
  const fechaHoy = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(hoy).padStart(2, '0')}`

  // Get programs and events for this month
  const programs = appData?.programs || {}
  const events = Array.isArray(appData?.events) ? appData.events : Object.values(appData?.events || {})
  const manualSessions = Array.isArray(appData?.settings?.calendar?.manualSessions)
    ? appData.settings.calendar.manualSessions
    : []
  const mesPrefijo = `${anioActual}-${String(mesActual).padStart(2, '0')}`

  // Build a map of date -> info
  const diasConInfo = {}
  const addDayInfo = (date, info) => {
    if (!date || !date.startsWith(mesPrefijo)) return
    if (!diasConInfo[date]) diasConInfo[date] = []
    if (!diasConInfo[date].some((item) => item.hipodromo === info.hipodromo && item.tipo === info.tipo)) {
      diasConInfo[date].push(info)
    }
  }
  for (const [key, prog] of Object.entries(programs)) {
    const date = prog.date || key.split('::')[0]
      const trackName = prog.trackName || prog.trackId || key.split('::')[1] || ''
    addDayInfo(date, { hipodromo: trackLabel(trackName), tipo: 'programa' })
  }
  for (const ev of events) {
    if (ev.id?.startsWith('imported-')) {
      const date = ev.meta?.date || ev.date || ev.id.replace('imported-', '').split('-').slice(0, 3).join('-')
      addDayInfo(date, { hipodromo: trackLabel(ev.meta?.trackName || ev.meta?.trackId || ''), tipo: 'resultados' })
    }
  }
  manualSessions.forEach((session) => {
    addDayInfo(session.date, { hipodromo: trackLabel(session.trackId || session.trackName), tipo: 'manual' })
  })

  const stats = {
    programas: Object.values(diasConInfo).flat().filter((d) => d.tipo === 'programa').length,
    resultados: Object.values(diasConInfo).flat().filter((d) => d.tipo === 'resultados').length,
    manuales: Object.values(diasConInfo).flat().filter((d) => d.tipo === 'manual').length,
    total: Object.keys(diasConInfo).length,
  }

  const visibleManualSessions = useMemo(
    () => manualSessions.filter((session) => String(session.date || '').startsWith(mesPrefijo)),
    [manualSessions, mesPrefijo],
  )

  const saveManualSessions = async (nextSessions) => {
    setGuardando(true)
    setMensaje('')
    try {
      const response = await api.updateSettings({ calendar: { manualSessions: nextSessions } })
      if (response?.error) throw new Error(response.detail || response.error)
      mergeAdminResponse(response)
      setMensaje('Jornada guardada en el calendario.')
    } catch (error) {
      setMensaje(`No se pudo guardar la jornada: ${error.message}`)
    } finally {
      setGuardando(false)
    }
  }

  const handleAddSession = async (event) => {
    event.preventDefault()
    if (!nuevaFecha || !nuevoHipodromo) {
      setMensaje('Selecciona una fecha y un hipódromo.')
      return
    }
    const exists = manualSessions.some((session) => (
      session.date === nuevaFecha && canonicalTrackId(session.trackId || session.trackName) === nuevoHipodromo
    ))
    if (exists) {
      setMensaje('Esa jornada ya está agregada.')
      return
    }
    const track = HIPODROMOS.find((item) => item.id === nuevoHipodromo)
    await saveManualSessions([
      ...manualSessions,
      { id: `${nuevoHipodromo}-${nuevaFecha}`, date: nuevaFecha, trackId: nuevoHipodromo, trackName: track?.label || nuevoHipodromo },
    ])
    setAnioActual(Number(nuevaFecha.slice(0, 4)))
    setMesActual(Number(nuevaFecha.slice(5, 7)))
    setDiaSeleccionado(Number(nuevaFecha.slice(8, 10)))
  }

  const handleRemoveSession = (session) => {
    const nextSessions = manualSessions.filter((item) => !(
      item.date === session.date &&
      canonicalTrackId(item.trackId || item.trackName) === canonicalTrackId(session.trackId || session.trackName)
    ))
    saveManualSessions(nextSessions)
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
            <button className={styles.navBtn} onClick={() => {
              if (mesActual === 1) { setMesActual(12); setAnioActual((year) => year - 1) }
              else setMesActual((month) => month - 1)
            }}>←</button>
            <h2 className={styles.monthTitle}>{MESES[mesActual - 1]} {anioActual}</h2>
            <button className={styles.navBtn} onClick={() => {
              if (mesActual === 12) { setMesActual(1); setAnioActual((year) => year + 1) }
              else setMesActual((month) => month + 1)
            }}>→</button>
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
                  const infos = diasConInfo[fecha] || []
                  const info = infos[0]
                  const esHoy = fecha === fechaHoy

                  return (
                    <button
                      key={di}
                      className={`
                        ${styles.dayCell}
                        ${esHoy ? styles.hoy : ''}
                        ${infos.length ? styles.conInfo : ''}
                        ${diaSeleccionado === dia ? styles.selected : ''}
                      `}
                      onClick={() => setDiaSeleccionado(diaSeleccionado === dia ? null : dia)}
                    >
                      <span className={styles.dayNum}>{dia}</span>
                      {infos.length > 0 && (
                        <>
                          <span className={styles.dayHipodromo}>{info.hipodromo.replace('Hipódromo ', '').replace('Hipodromo ', '').replace('Club ', '')}{infos.length > 1 ? ` +${infos.length - 1}` : ''}</span>
                          <span className={styles.dayBadge}>{infos.some((item) => item.tipo === 'programa') ? '📋' : infos.some((item) => item.tipo === 'resultados') ? '🏁' : '📌'}</span>
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
            <div className={styles.legendItem}>
              <span className={styles.dotManual}></span>
              <span>Jornada agregada</span>
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
                const infos = diasConInfo[fecha] || []
                if (!infos.length) return <p className={styles.emptyText}>No hay actividad este día</p>
                return (
                  <div className={styles.detailInfo}>
                    {infos.map((info, index) => (
                      <div className={styles.infoRow} key={`${info.tipo}-${info.hipodromo}-${index}`}>
                        <span className={styles.infoLabel}>{info.hipodromo}</span>
                        <span className={styles.infoValue}>{info.tipo === 'programa' ? 'Programa' : info.tipo === 'resultados' ? 'Resultados' : 'Jornada agregada'}</span>
                      </div>
                    ))}
                  </div>
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
              <div className={styles.statItem}>
                <span className={styles.statValue}>{stats.manuales}</span>
                <span className={styles.statLabel}>Jornadas agregadas</span>
              </div>
            </div>
          </div>

          <div className={styles.detailCard}>
            <h3 className={styles.statsTitle}>Administrar calendario</h3>
            <p className={styles.calendarHelp}>Agrega fechas e hipódromos que no estén en la pauta cargada. También se considerarán al crear campañas mensuales.</p>
            <form className={styles.sessionForm} onSubmit={handleAddSession}>
              <label className={styles.formLabel} htmlFor="calendar-session-date">Fecha</label>
              <input id="calendar-session-date" className={styles.sessionInput} type="date" value={nuevaFecha} onChange={(event) => setNuevaFecha(event.target.value)} required />
              <label className={styles.formLabel} htmlFor="calendar-session-track">Hipódromo</label>
              <select id="calendar-session-track" className={styles.sessionInput} value={nuevoHipodromo} onChange={(event) => setNuevoHipodromo(event.target.value)}>
                {HIPODROMOS.map((track) => <option key={track.id} value={track.id}>{track.label}</option>)}
              </select>
              <button className={styles.saveSessionBtn} type="submit" disabled={guardando}>{guardando ? 'Guardando…' : 'Agregar jornada'}</button>
            </form>
            {mensaje && <p className={styles.calendarMessage} role="status">{mensaje}</p>}
            <div className={styles.manualSessionList}>
              <h4>Jornadas agregadas · {MESES[mesActual - 1]}</h4>
              {visibleManualSessions.length ? visibleManualSessions.map((session) => (
                <div className={styles.manualSession} key={session.id || `${session.trackId}-${session.date}`}>
                  <span><strong>{session.date}</strong> · {trackLabel(session.trackId || session.trackName)}</span>
                  <button type="button" onClick={() => handleRemoveSession(session)} disabled={guardando} aria-label="Quitar jornada">Quitar</button>
                </div>
              )) : <p className={styles.emptyText}>No hay jornadas agregadas este mes.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
