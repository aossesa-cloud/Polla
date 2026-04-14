/**
 * ResultadosJornada.jsx
 *
 * Vista de resultados por fecha con:
 * - Selector de fecha
 * - Selector de carrera
 * - Detalle completo de carrera
 * - Badges de estado
 * - Alertas visibles
 * - Edición solo para admins
 * - Auditoría de cambios
 */

import React, { useState, useCallback, useEffect } from 'react'
import useAppStore from '../store/useAppStore'
import { useJornada, useJornadaDates } from '../hooks/useJornada'
import { RACE_STATUS, ALERT_TYPES } from '../engine/raceWatcher'
import api from '../api'
import { API_URL } from '../config/api'
import styles from './ResultadosJornada.module.css'

const STATUS_LABELS = {
  [RACE_STATUS.PENDING]: 'Pendiente',
  [RACE_STATUS.CLOSED]: 'Cerrada',
  [RACE_STATUS.RESULTS_PARTIAL]: 'Resultados parciales',
  [RACE_STATUS.RESULTS_READY]: 'Resultados listos',
  [RACE_STATUS.OFFICIAL]: 'Oficial',
  [RACE_STATUS.ERROR]: 'Error',
  [RACE_STATUS.OFFICIAL_WITH_ALERT]: 'Oficial con alertas',
}

const STATUS_COLORS = {
  [RACE_STATUS.PENDING]: '#6b7280',
  [RACE_STATUS.CLOSED]: '#3b82f6',
  [RACE_STATUS.RESULTS_PARTIAL]: '#f59e0b',
  [RACE_STATUS.RESULTS_READY]: '#10b981',
  [RACE_STATUS.OFFICIAL]: '#10b981',
  [RACE_STATUS.ERROR]: '#ef4444',
  [RACE_STATUS.OFFICIAL_WITH_ALERT]: '#f59e0b',
}

const ALERT_LABELS = {
  [ALERT_TYPES.MISSING_FAVORITE]: 'Falta favorito',
  [ALERT_TYPES.MISSING_WIN_DIVIDEND]: 'Falta dividendo ganador',
  [ALERT_TYPES.MISSING_PLACE_DIVIDEND]: 'Falta dividendo segundo',
  [ALERT_TYPES.MISSING_SHOW_DIVIDEND]: 'Falta dividendo tercero',
  [ALERT_TYPES.MISSING_RESULT_NAME]: 'Falta nombre',
  [ALERT_TYPES.INCOMPLETE_RESULTS]: 'Resultados incompletos',
  [ALERT_TYPES.RESULTS_TIMEOUT]: 'Timeout resultados',
  [ALERT_TYPES.DATA_INCONSISTENCY]: 'Inconsistencia de datos',
}

export default function ResultadosJornada() {
  const { appData, refresh: refreshApp } = useAppStore()
  const user = useAppStore(state => state.user)
  // Solo permitir edición si hay usuario autenticado con rol admin
  const isAdmin = user && (user.role === 'admin' || user.admin !== false)

  const [fecha, setFecha] = useState(() => {
    // Usar fecha local en vez de UTC
    const d = new Date()
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  })
  const [selectedRace, setSelectedRace] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [editReason, setEditReason] = useState('')
  const [importando, setImportando] = useState(false)
  const [importMsg, setImportMsg] = useState(null)
  const [tracks, setTracks] = useState([])
  const [reimporting, setReimporting] = useState(false)
  const [watcherStatus, setWatcherStatus] = useState(null)
  const [testMode, setTestMode] = useState(false)
  const [testStatus, setTestStatus] = useState(null)

  const { jornada, loading, getCarrera, alertas, aplicarOverride, resolverAlerta, auditLog, refresh } = useJornada(fecha)
  const dates = useJornadaDates()

  // Consultar estado del watcher
  useEffect(() => {
    fetch(`${API_URL}/watcher/status`)
      .then(r => r.json())
      .then(data => setWatcherStatus(data))
      .catch(() => setWatcherStatus(null))
  }, [])

  // Funciones para modo test
  const toggleTestMode = useCallback(async () => {
    try {
      const endpoint = testMode ? `${API_URL}/test/deactivate` : `${API_URL}/test/activate`
      await fetch(endpoint, { method: 'POST' })
      setTestMode(!testMode)
      if (!testMode) {
        refreshTestStatus()
      }
    } catch (err) {
      console.error('Error toggling test mode:', err)
    }
  }, [testMode])

  const refreshTestStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/test/status`)
      const data = await res.json()
      setTestStatus(data)
    } catch (err) {
      console.error('Error fetching test status:', err)
    }
  }, [])

  const runFullTest = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/test/run`, { method: 'POST' })
      const result = await res.json()
      setTestStatus(result)
      refreshTestStatus()
      refreshApp()
      refresh()
    } catch (err) {
      console.error('Error running full test:', err)
    }
  }, [refreshApp, refresh, refreshTestStatus])

  const runTestScenario = useCallback(async (scenario) => {
    try {
      await fetch(`${API_URL}/test/runScenario`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario, raceNumber: 1 })
      })
      refreshTestStatus()
      refreshApp()
      refresh()
    } catch (err) {
      console.error('Error running scenario:', err)
    }
  }, [refreshApp, refresh, refreshTestStatus])

  // Cargar hipódromos disponibles para la fecha
  useEffect(() => {
    if (!fecha) return
    setTracks([])
    api.getTracks?.(fecha).then(data => {
      if (data?.tracks) setTracks(data.tracks)
    }).catch(() => setTracks([]))
  }, [fecha])

  // Importar resultados desde Teletrak
  const handleImportResults = useCallback(async () => {
    if (!fecha || tracks.length === 0) return
    setImportando(true)
    setImportMsg(null)
    try {
      const trackId = tracks[0].id
      const result = await api.importTeletrakResults?.(fecha, trackId, [])
      setImportMsg({ tipo: 'ok', texto: `Resultados importados desde Teletrak (${tracks[0].name})` })
      refreshApp()
      refresh()
    } catch (err) {
      setImportMsg({ tipo: 'error', texto: err.message || 'Error al importar' })
    } finally {
      setImportando(false)
    }
  }, [fecha, tracks, refreshApp, refresh])

  // Importar programa desde Teletrak
  const handleImportProgram = useCallback(async () => {
    if (!fecha || tracks.length === 0) return
    setImportando(true)
    setImportMsg(null)
    try {
      const trackId = tracks[0].id
      await api.importTeletrakProgram?.(fecha, trackId)
      setImportMsg({ tipo: 'ok', texto: `Programa importado desde Teletrak (${tracks[0].name})` })
      refreshApp()
      refresh()
    } catch (err) {
      setImportMsg({ tipo: 'error', texto: err.message || 'Error al importar programa' })
    } finally {
      setImportando(false)
    }
  }, [fecha, tracks, refreshApp, refresh])

  // Re-importar carreras faltantes desde Teletrak
  const handleReimportMissing = useCallback(async () => {
    if (!fecha || tracks.length === 0) return
    setReimporting(true)
    setImportMsg(null)
    try {
      const trackId = tracks[0].id
      const res = await fetch(`${API_URL}/import/missing-races`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: fecha, trackId })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al re-importar')

      setImportMsg({
        tipo: 'ok',
        texto: `✓ ${data.importedCount} carreras importadas${data.failedRaces?.length ? `, ${data.failedRaces.length} fallidas` : ''}`
      })
      refreshApp()
      refresh()
    } catch (err) {
      setImportMsg({ tipo: 'error', texto: err.message || 'Error al re-importar' })
    } finally {
      setReimporting(false)
    }
  }, [fecha, tracks, refreshApp, refresh])

  // Carreras disponibles
  const carreras = Object.entries(jornada?.races || {})
    .sort(([a], [b]) => Number(a) - Number(b))

  // Auto-select first race when carreras change
  useEffect(() => {
    if (carreras.length > 0 && !selectedRace) {
      setSelectedRace(Number(carreras[0][0]))
    }
  }, [carreras, selectedRace])

  const carrera = getCarrera(selectedRace)

  // Iniciar edición
  const startEdit = useCallback(() => {
    if (!isAdmin || !carrera) return
    setEditMode(true)
    setEditForm({
      winner: carrera.winner ? { ...carrera.winner } : null,
      second: carrera.second ? { ...carrera.second } : null,
      third: carrera.third ? { ...carrera.third } : null,
      favorite: carrera.favorite ? { ...carrera.favorite } : null,
      withdrawals: carrera.withdrawals ? [...carrera.withdrawals] : [],
    })
    setEditReason('')
  }, [isAdmin, carrera])

  // Guardar cambio
  const saveChange = useCallback(async (field, oldValue, newValue) => {
    if (!isAdmin || !carrera) return
    try {
      await aplicarOverride(selectedRace, field, oldValue, newValue, { username: user?.username }, editReason)
      refresh()
    } catch (err) {
      alert('Error al guardar: ' + err.message)
    }
  }, [isAdmin, carrera, selectedRace, user, editReason, aplicarOverride, refresh])

  // Resolver alerta
  const handleResolveAlert = useCallback(async (raceNum, alertIndex) => {
    if (!isAdmin) return
    await resolverAlerta(raceNum, alertIndex, { username: user?.username })
    refresh()
  }, [isAdmin, resolverAlerta, refresh, user])

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Resultados</h1>
          <p className={styles.subtitle}>Monitoreo y edición de resultados por jornada</p>
        </div>
      </header>

      {/* Selector de fecha */}
      <div className={styles.toolbar}>
        <div className={styles.dateSelector}>
          <label className={styles.label}>Fecha</label>
          <input
            className={styles.dateInput}
            type="date"
            value={fecha}
            onChange={e => { setFecha(e.target.value); setSelectedRace(null) }}
          />
        </div>

        {/* Watcher Status Panel */}
        {watcherStatus && (
          <div className={styles.watcherPanel}>
            <div className={styles.watcherStatus}>
              <span className={`${styles.watcherDot} ${watcherStatus.active ? styles.active : styles.inactive}`}></span>
              <span>{watcherStatus.active ? 'Monitoreo activo' : 'Monitoreo inactivo'}</span>
            </div>
            {watcherStatus.state && (
              <div className={styles.watcherStats}>
                <span>Última verificación: {watcherStatus.state.lastCheck ? new Date(watcherStatus.state.lastCheck).toLocaleTimeString('es-CL') : 'Nunca'}</span>
                <span>Total verificaciones: {watcherStatus.state.totalChecks || 0}</span>
                <span>Carreras importadas: {watcherStatus.importedCount || 0}</span>
              </div>
            )}
          </div>
        )}

        {/* Re-import button - Solo admins */}
        {user && tracks.length > 0 && (
          <button
            className={styles.reimportBtn}
            onClick={handleReimportMissing}
            disabled={reimporting}
          >
            {reimporting ? 'Re-importando...' : '🔄 Re-importar carreras faltantes'}
          </button>
        )}

        {/* Test Mode Toggle - Solo admins */}
        {user && (
          <button
            className={`${styles.testModeBtn} ${testMode ? styles.active : ''}`}
            onClick={toggleTestMode}
          >
            {testMode ? '🧪 MODO TEST ON' : '🧪 Activar Modo Test'}
          </button>
        )}
      </div>

      {/* Test Panel */}
      {testMode && (
        <div className={styles.testPanel}>
          <div className={styles.testHeader}>
            <h3>🧪 Panel de Test</h3>
            <div className={styles.testActions}>
              <button className={styles.runFullTestBtn} onClick={runFullTest}>🚀 Ejecutar Test Completo</button>
              <button className={styles.refreshBtn} onClick={refreshTestStatus}>🔄 Actualizar</button>
            </div>
          </div>

          {testStatus && (
            <div className={styles.testResults}>
              <h4>📊 Resultados del Test:</h4>
              <div className={styles.summaryGrid}>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Total</span>
                  <span className={styles.summaryValue}>{testStatus.total || 0}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>✔ Passed</span>
                  <span className={`${styles.summaryValue} ${styles.passed}`}>{testStatus.passed || 0}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>❌ Failed</span>
                  <span className={`${styles.summaryValue} ${styles.failed}`}>{testStatus.failed || 0}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Success Rate</span>
                  <span className={styles.summaryValue}>{testStatus.successRate || 'N/A'}</span>
                </div>
              </div>

              {testStatus.errors && testStatus.errors.length > 0 && (
                <div className={styles.errors}>
                  <h4>❌ Errores encontrados:</h4>
                  <div className={styles.errorList}>
                    {testStatus.errors.map((err, i) => (
                      <div key={i} className={styles.errorItem}>❌ {err}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className={styles.scenarios}>
            <h4>Escenarios predefinidos:</h4>
            <div className={styles.scenarioGrid}>
              <button onClick={() => runTestScenario('complete')} className={styles.scenarioBtn}>✅ Carrera completa</button>
              <button onClick={() => runTestScenario('no-dividends')} className={styles.scenarioBtn}>⚠️ Sin dividendos</button>
              <button onClick={() => runTestScenario('no-favorite')} className={styles.scenarioBtn}>⚠️ Sin favorito</button>
              <button onClick={() => runTestScenario('with-tie')} className={styles.scenarioBtn}>🔗 Con empate</button>
              <button onClick={() => runTestScenario('with-scratch')} className={styles.scenarioBtn}>🚫 Con retiro</button>
              <button onClick={() => runTestScenario('incomplete')} className={styles.scenarioBtn}>❌ Incompleta</button>
              <button onClick={() => runTestScenario('all-races')} className={`${styles.scenarioBtn} ${styles.fullScenario}`}>🏁 Escenario completo (21 carreras)</button>
            </div>
          </div>
        </div>
      )}

      {!jornada ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>🏇</span>
          <p>{loading ? 'Cargando jornada...' : 'No hay resultados para esta fecha'}</p>
        </div>
      ) : (
        <div className={styles.layout}>
          {/* Sidebar - Lista de carreras */}
          <div className={styles.sidebar}>
            <h3 className={styles.sidebarTitle}>Carreras ({carreras.length})</h3>
            {carreras.map(([num, race]) => (
              <button
                key={num}
                className={`${styles.raceBtn} ${Number(num) === selectedRace ? styles.active : ''}`}
                onClick={() => setSelectedRace(Number(num))}
              >
                <span className={styles.raceNum}>C{num}</span>
                <span
                  className={styles.raceStatus}
                  style={{ color: STATUS_COLORS[race.status] || '#6b7280' }}
                >
                  {STATUS_LABELS[race.status] || race.status}
                </span>
                {race.alerts?.some(a => !a.resolvedAt) && (
                  <span className={styles.alertDot} title={`${race.alerts.filter(a => !a.resolvedAt).length} alertas`}>!</span>
                )}
                {race.confirmedByTeletac && <span className={styles.teletacBadge} title="Confirmado por Teletac">✓</span>}
              </button>
            ))}
          </div>

          {/* Detail */}
          <div className={styles.detail}>
            {carrera ? (
              <>
                <div className={styles.raceHeader}>
                  <div>
                    <h2 className={styles.raceTitle}>Carrera {carrera.raceNumber}</h2>
                    <div className={styles.raceMeta}>
                      <span className={styles.statusBadge} style={{ background: STATUS_COLORS[carrera.status] }}>
                        {STATUS_LABELS[carrera.status]}
                      </span>
                      {carrera.confirmedByTeletac && (
                        <span className={styles.teletacBadgeLarge}>✓ Teletac confirmado</span>
                      )}
                    </div>
                  </div>
                  {isAdmin && !editMode && (
                    <button className={styles.editBtn} onClick={startEdit}>✏️ Editar</button>
                  )}
                  {isAdmin && editMode && (
                    <div className={styles.editActions}>
                      <button className={styles.saveBtn} onClick={() => setEditMode(false)}>Guardar y cerrar</button>
                      <button className={styles.cancelBtn} onClick={() => setEditMode(false)}>Cancelar</button>
                    </div>
                  )}
                </div>

                {/* Alertas */}
                {carrera.alerts?.some(a => !a.resolvedAt) && (
                  <div className={styles.alertSection}>
                    <h4 className={styles.alertTitle}>⚠️ Alertas ({carrera.alerts.filter(a => !a.resolvedAt).length})</h4>
                    {carrera.alerts.filter(a => !a.resolvedAt).map((alert, i) => (
                      <div key={i} className={`${styles.alertItem} ${styles[alert.severity]}`}>
                        <span className={styles.alertType}>{ALERT_LABELS[alert.type] || alert.type}</span>
                        <span className={styles.alertMsg}>{alert.message}</span>
                        {isAdmin && (
                          <button className={styles.resolveBtn} onClick={() => handleResolveAlert(carrera.raceNumber, i)}>
                            ✓ Resolver
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Resultados o Formulario de edición */}
                {editMode ? (
                  <div className={styles.editForm}>
                    <div className={styles.editSection}>
                      <h4>🥇 Ganador</h4>
                      <div className={styles.editGrid}>
                        <div className={styles.editField}>
                          <label>Número</label>
                          <input value={editForm.winner?.number || ''} onChange={e => setEditForm(f => ({ ...f, winner: { ...f.winner, number: e.target.value } }))} />
                        </div>
                        <div className={styles.editField}>
                          <label>Nombre</label>
                          <input value={editForm.winner?.name || ''} onChange={e => setEditForm(f => ({ ...f, winner: { ...f.winner, name: e.target.value } }))} />
                        </div>
                        <div className={styles.editField}>
                          <label>Div Ganador</label>
                          <input value={editForm.winner?.dividend || ''} onChange={e => setEditForm(f => ({ ...f, winner: { ...f.winner, dividend: e.target.value } }))} />
                        </div>
                        <div className={styles.editField}>
                          <label>Div 2do</label>
                          <input value={editForm.winner?.divSegundo || ''} onChange={e => setEditForm(f => ({ ...f, winner: { ...f.winner, divSegundo: e.target.value } }))} />
                        </div>
                        <div className={styles.editField}>
                          <label>Div 3ro</label>
                          <input value={editForm.winner?.divTercero || ''} onChange={e => setEditForm(f => ({ ...f, winner: { ...f.winner, divTercero: e.target.value } }))} />
                        </div>
                      </div>
                    </div>

                    <div className={styles.editSection}>
                      <h4>🥈 Segundo</h4>
                      <div className={styles.editGrid}>
                        <div className={styles.editField}>
                          <label>Número</label>
                          <input value={editForm.second?.number || ''} onChange={e => setEditForm(f => ({ ...f, second: { ...f.second, number: e.target.value } }))} />
                        </div>
                        <div className={styles.editField}>
                          <label>Nombre</label>
                          <input value={editForm.second?.name || ''} onChange={e => setEditForm(f => ({ ...f, second: { ...f.second, name: e.target.value } }))} />
                        </div>
                        <div className={styles.editField}>
                          <label>Div Ganador</label>
                          <input value={editForm.second?.dividend || ''} onChange={e => setEditForm(f => ({ ...f, second: { ...f.second, dividend: e.target.value } }))} />
                        </div>
                        <div className={styles.editField}>
                          <label>Div 2do</label>
                          <input value={editForm.second?.divTercero || ''} onChange={e => setEditForm(f => ({ ...f, second: { ...f.second, divTercero: e.target.value } }))} />
                        </div>
                      </div>
                    </div>

                    <div className={styles.editSection}>
                      <h4>🥉 Tercero</h4>
                      <div className={styles.editGrid}>
                        <div className={styles.editField}>
                          <label>Número</label>
                          <input value={editForm.third?.number || ''} onChange={e => setEditForm(f => ({ ...f, third: { ...f.third, number: e.target.value } }))} />
                        </div>
                        <div className={styles.editField}>
                          <label>Nombre</label>
                          <input value={editForm.third?.name || ''} onChange={e => setEditForm(f => ({ ...f, third: { ...f.third, name: e.target.value } }))} />
                        </div>
                        <div className={styles.editField}>
                          <label>Div Ganador</label>
                          <input value={editForm.third?.dividend || ''} onChange={e => setEditForm(f => ({ ...f, third: { ...f.third, dividend: e.target.value } }))} />
                        </div>
                      </div>
                    </div>

                    <div className={styles.editSection}>
                      <h4>⭐ Favorito</h4>
                      <div className={styles.editGrid}>
                        <div className={styles.editField}>
                          <label>Número</label>
                          <input value={editForm.favorite?.number || ''} onChange={e => setEditForm(f => ({ ...f, favorite: { ...f.favorite, number: e.target.value } }))} />
                        </div>
                        <div className={styles.editField}>
                          <label>Nombre</label>
                          <input value={editForm.favorite?.name || ''} onChange={e => setEditForm(f => ({ ...f, favorite: { ...f.favorite, name: e.target.value } }))} />
                        </div>
                      </div>
                    </div>

                    <div className={styles.editSection}>
                      <h4>🚫 Retiros</h4>
                      <div className={styles.editField}>
                        <label>Números (separados por coma)</label>
                        <input value={editForm.withdrawals?.map(w => w.number || w).join(', ') || ''} onChange={e => {
                          const nums = e.target.value.split(',').map(s => s.trim()).filter(Boolean).map(n => ({ number: n }))
                          setEditForm(f => ({ ...f, withdrawals: nums }))
                        }} />
                      </div>
                    </div>

                    <div className={styles.editSection}>
                      <div className={styles.editField}>
                        <label>Motivo de la corrección</label>
                        <input
                          value={editReason}
                          onChange={e => setEditReason(e.target.value)}
                          placeholder="Ej: Corregido según Teletac oficial..."
                        />
                      </div>
                    </div>

                    <div className={styles.editActions}>
                      <button className={styles.saveBtn} onClick={() => {
                        // Guardar todos los cambios
                        if (editForm.winner) {
                          aplicarOverride(selectedRace, 'winner', carrera.winner, editForm.winner, { username: user?.username }, editReason)
                        }
                        if (editForm.second) {
                          aplicarOverride(selectedRace, 'second', carrera.second, editForm.second, { username: user?.username }, editReason)
                        }
                        if (editForm.third) {
                          aplicarOverride(selectedRace, 'third', carrera.third, editForm.third, { username: user?.username }, editReason)
                        }
                        if (editForm.favorite) {
                          aplicarOverride(selectedRace, 'favorite', carrera.favorite, editForm.favorite, { username: user?.username }, editReason)
                        }
                        aplicarOverride(selectedRace, 'withdrawals', carrera.withdrawals, editForm.withdrawals || [], { username: user?.username }, editReason)
                          .then(() => {
                            setEditMode(false)
                            refresh()
                          })
                      }}>💾 Guardar cambios</button>
                      <button className={styles.cancelBtn} onClick={() => {
                        setEditMode(false)
                        setEditForm({})
                        setEditReason('')
                      }}>Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <table className={styles.resultsTable}>
                    <thead>
                      <tr>
                        <th>Pos</th>
                        <th>Nombre</th>
                        <th>Div Gan</th>
                        <th>Div 2do</th>
                        <th>Div 3ro</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className={styles.winnerRow}>
                        <td>🥇 1°</td>
                        <td>
                          {carrera.winner?.number && (
                            <span className={styles.runnerNumber}>{carrera.winner.number}</span>
                          )}
                          <span className={styles.runnerSeparator}> - </span>
                          {carrera.winner?.name ? (
                            <span className={styles.runnerName}>{carrera.winner.name}</span>
                          ) : <span className={styles.missing}>Sin nombre</span>}
                        </td>
                        <td className={styles.divCell}>
                          {carrera.winner?.dividend ? String(carrera.winner.dividend).replace('.', ',') : '-'}
                        </td>
                        <td className={styles.divCell}>
                          {carrera.winner?.divSegundo ? String(carrera.winner.divSegundo).replace('.', ',') : '-'}
                        </td>
                        <td className={styles.divCell}>
                          {carrera.winner?.divTercero ? String(carrera.winner.divTercero).replace('.', ',') : '-'}
                        </td>
                      </tr>
                      <tr>
                        <td>🥈 2°</td>
                        <td>
                          {carrera.second?.number && (
                            <span className={styles.runnerNumber}>{carrera.second.number}</span>
                          )}
                          <span className={styles.runnerSeparator}> - </span>
                          {carrera.second?.name ? (
                            <span className={styles.runnerName}>{carrera.second.name}</span>
                          ) : <span className={styles.missing}>Sin datos</span>}
                        </td>
                        <td className={styles.divCell}>-</td>
                        <td className={styles.divCell}>
                          {carrera.second?.dividend ? String(carrera.second.dividend).replace('.', ',') : '-'}
                        </td>
                        <td className={styles.divCell}>
                          {carrera.second?.divTercero ? String(carrera.second.divTercero).replace('.', ',') : '-'}
                        </td>
                      </tr>
                      <tr>
                        <td>🥉 3°</td>
                        <td>
                          {carrera.third?.number && (
                            <span className={styles.runnerNumber}>{carrera.third.number}</span>
                          )}
                          <span className={styles.runnerSeparator}> - </span>
                          {carrera.third?.name ? (
                            <span className={styles.runnerName}>{carrera.third.name}</span>
                          ) : <span className={styles.missing}>Sin datos</span>}
                        </td>
                        <td className={styles.divCell}>-</td>
                        <td className={styles.divCell}>-</td>
                        <td className={styles.divCell}>
                          {carrera.third?.dividend ? String(carrera.third.dividend).replace('.', ',') : '-'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                )}

                {/* Favorito y Retiros */}
                {!editMode && (
                  <div className={styles.extraInfo}>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>⭐ Favorito</span>
                      <span className={styles.infoValue}>
                        {carrera.favorite ? (
                          <><span className={styles.runnerNumber}>{carrera.favorite.number}</span><span className={styles.runnerSeparator}> - </span>{carrera.favorite.name || 'Sin nombre'}</>
                        ) : <span className={styles.missing}>Sin datos</span>}
                      </span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>🚫 Retiros</span>
                      <span className={styles.infoValue}>
                        {carrera.withdrawals?.length > 0
                          ? carrera.withdrawals.map(w => w.number || w).join(', ')
                          : <span className={styles.missing}>Sin retiros</span>}
                      </span>
                    </div>
                  </div>
                )}

                {/* Reason input */}
                {editMode && (
                  <div className={styles.reasonSection}>
                    <label className={styles.label}>Motivo de la corrección</label>
                    <input
                      className={styles.reasonInput}
                      type="text"
                      value={editReason}
                      onChange={e => setEditReason(e.target.value)}
                      placeholder="Ej: Corregido según Teletac oficial..."
                    />
                  </div>
                )}

                {/* Manual overrides history - HIDDEN (stored internally only) */}
                {/* 
                {carrera.manualOverrides?.length > 0 && (
                  <div className={styles.overridesSection}>
                    <h4 className={styles.sectionTitle}>Historial de correcciones manuales</h4>
                    {carrera.manualOverrides.map((ov, i) => (
                      <div key={i} className={styles.overrideItem}>
                        <span className={styles.overrideField}>{ov.field}</span>
                        <span className={styles.overrideOld}>{ov.oldValue}</span>
                        <span className={styles.overrideArrow}>→</span>
                        <span className={styles.overrideNew}>{ov.newValue}</span>
                        <span className={styles.overrideMeta}>
                          por {ov.by} · {new Date(ov.at).toLocaleString('es-CL')}
                        </span>
                        {ov.reason && <span className={styles.overrideReason}>"{ov.reason}"</span>}
                      </div>
                    ))}
                  </div>
                )}
                */}

                {/* Audit log - HIDDEN (stored internally only) */}
                {/*
                {auditLog.length > 0 && (
                  <div className={styles.auditSection}>
                    <h4 className={styles.sectionTitle}>Auditoría reciente</h4>
                    {auditLog.slice(-5).reverse().map((entry, i) => (
                      <div key={i} className={styles.auditItem}>
                        <span className={styles.auditAction}>{entry.action}</span>
                        <span className={styles.auditDetail}>
                          C{entry.raceNumber} · {entry.field}
                        </span>
                        <span className={styles.auditMeta}>
                          {new Date(entry.timestamp).toLocaleString('es-CL')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                */}
              </>
            ) : (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>🏁</span>
                <p>Selecciona una carrera para ver el detalle</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
