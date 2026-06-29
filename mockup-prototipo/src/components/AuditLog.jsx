import React, { useCallback, useEffect, useMemo, useState } from 'react'
import api from '../api'
import styles from './AuditLog.module.css'

const SOURCE_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'manual', label: 'Manual' },
  { value: 'legacy-migration', label: 'Migracion legacy' },
  { value: 'api-batch', label: 'API batch' },
  { value: 'bulk-api', label: 'Carga multiple' },
  { value: 'direct-event-api', label: 'API directa' },
]

const SOURCE_LABELS = SOURCE_OPTIONS.reduce((acc, item) => {
  acc[item.value] = item.label
  return acc
}, {})

export default function AuditLog() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dateFilter, setDateFilter] = useState(() => getTodayChileDate())
  const [participantFilter, setParticipantFilter] = useState('')
  const [campaignFilter, setCampaignFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('all')

  const loadLogs = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const payload = await api.getAuditLog({ limit: 500, date: dateFilter })
      setEntries(Array.isArray(payload.entries) ? payload.entries : [])
    } catch (loadError) {
      setError(loadError.message || 'No se pudieron cargar los logs.')
    } finally {
      setLoading(false)
    }
  }, [dateFilter])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  const filteredEntries = useMemo(() => {
    const participantNeedle = normalizeText(participantFilter)
    const campaignNeedle = normalizeText(campaignFilter)

    return entries.filter((entry) => {
      if (dateFilter && getEntryDate(entry) !== dateFilter) return false
      if (sourceFilter !== 'all' && entry.source !== sourceFilter) return false
      if (participantNeedle && !normalizeText(entry.participantName).includes(participantNeedle)) return false
      if (campaignNeedle) {
        const campaignText = normalizeText([
          entry.campaignName,
          entry.campaignId,
          entry.groupName,
          entry.groupId,
          entry.eventId,
        ].filter(Boolean).join(' '))
        if (!campaignText.includes(campaignNeedle)) return false
      }
      return true
    })
  }, [campaignFilter, dateFilter, entries, participantFilter, sourceFilter])

  const manualCount = entries.filter((entry) => entry.source === 'manual').length
  const migrationCount = entries.filter((entry) => entry.source === 'legacy-migration').length
  const lastEntry = entries[0]

  return (
    <div className={styles.audit}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Auditoria</span>
          <h1 className={styles.title}>Logs de Pronosticos</h1>
          <p className={styles.subtitle}>
            Revisa cuando se guardo cada ingreso y si fue manual, migracion o API.
          </p>
        </div>
        <button className={styles.refreshButton} type="button" onClick={loadLogs} disabled={loading}>
          {loading ? 'Actualizando...' : 'Actualizar'}
        </button>
      </header>

      <section className={styles.summary} aria-label="Resumen de logs">
        <div className={styles.metric}>
          <span>Total</span>
          <strong>{entries.length}</strong>
        </div>
        <div className={styles.metric}>
          <span>Manual</span>
          <strong>{manualCount}</strong>
        </div>
        <div className={styles.metric}>
          <span>Migracion</span>
          <strong>{migrationCount}</strong>
        </div>
        <div className={styles.metricWide}>
          <span>Ultimo registro</span>
          <strong>{lastEntry ? formatTime(lastEntry) : 'Sin registros'}</strong>
        </div>
      </section>

      <section className={styles.filters}>
        <label className={styles.filterField}>
          <span>Fecha</span>
          <div className={styles.dateField}>
            <input
              type="date"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
            />
            {dateFilter && (
              <button type="button" onClick={() => setDateFilter('')} aria-label="Limpiar fecha">
                x
              </button>
            )}
          </div>
        </label>
        <label className={styles.filterField}>
          <span>Participante</span>
          <input
            value={participantFilter}
            onChange={(event) => setParticipantFilter(event.target.value)}
            placeholder="Buscar participante..."
          />
        </label>
        <label className={styles.filterField}>
          <span>Campana / grupo</span>
          <input
            value={campaignFilter}
            onChange={(event) => setCampaignFilter(event.target.value)}
            placeholder="Buscar campana, grupo o evento..."
          />
        </label>
        <label className={styles.filterField}>
          <span>Origen</span>
          <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}>
            {SOURCE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </section>

      {error && <div className={styles.error}>{error}</div>}

      <section className={styles.tablePanel}>
        <div className={styles.tableHeader}>
          <h2>Historial</h2>
          <span>{filteredEntries.length} registros visibles</span>
        </div>

        {filteredEntries.length === 0 ? (
          <div className={styles.empty}>
            {loading ? 'Cargando logs...' : 'Aun no hay logs con esos filtros.'}
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Hora Chile</th>
                  <th>Origen</th>
                  <th>Accion</th>
                  <th>Campana</th>
                  <th>Grupo</th>
                  <th>Participante</th>
                  <th>Picks</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td className={styles.time}>{formatTime(entry)}</td>
                    <td>
                      <span className={`${styles.sourceBadge} ${getSourceClass(entry.source)}`}>
                        {SOURCE_LABELS[entry.source] || entry.sourceLabel || entry.source || 'Otro'}
                      </span>
                    </td>
                    <td>{formatAction(entry)}</td>
                    <td>
                      <strong>{entry.campaignName || 'Sin campana'}</strong>
                      <small>{entry.eventId}</small>
                    </td>
                    <td>{entry.groupName || entry.groupId || '-'}</td>
                    <td>
                      <strong>{entry.participantName || '-'}</strong>
                      <small>#{entry.participantIndex || '-'}</small>
                    </td>
                    <td className={styles.picks}>{formatPicks(entry.picks)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function formatTime(entry) {
  if (entry?.timestampChile) return entry.timestampChile
  if (!entry?.timestamp) return '-'
  try {
    return new Date(entry.timestamp).toLocaleString('es-CL', {
      timeZone: 'America/Santiago',
      hour12: false,
    })
  } catch {
    return entry.timestamp
  }
}

function getEntryDate(entry) {
  return (
    normalizeDate(entry?.timestampChile) ||
    normalizeDate(entry?.timestamp) ||
    normalizeDate(entry?.operationDate)
  )
}

function formatAction(entry) {
  if (entry?.wasUpdate || entry?.action === 'update-pick') return 'Actualizo picks'
  if (entry?.action === 'create-pick') return 'Creo picks'
  return entry?.action || '-'
}

function formatPicks(picks) {
  if (!Array.isArray(picks) || picks.length === 0) return '-'
  return picks.map((pick) => String(pick || '-')).join(' ')
}

function getSourceClass(source) {
  if (source === 'manual') return styles.sourceManual
  if (source === 'legacy-migration') return styles.sourceMigration
  return styles.sourceApi
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function normalizeDate(value) {
  const text = String(value || '').trim()
  if (!text) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text

  const latinDate = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (latinDate) {
    const [, day, month, year] = latinDate
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  const embeddedDate = text.match(/(\d{4}-\d{2}-\d{2})/)
  return embeddedDate ? embeddedDate[1] : ''
}

function getTodayChileDate() {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Santiago',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date())

    const year = parts.find((part) => part.type === 'year')?.value
    const month = parts.find((part) => part.type === 'month')?.value
    const day = parts.find((part) => part.type === 'day')?.value

    if (year && month && day) return `${year}-${month}-${day}`
  } catch {
    // Fallback for older browsers.
  }

  return new Date().toISOString().slice(0, 10)
}
