import React, { useEffect, useMemo, useState } from 'react'
import api from '../api'
import useAppStore from '../store/useAppStore'
import { getChileDateString } from '../utils/dateChile'
import styles from './Premios.module.css'

const DEFAULT_PAYOUT = {
  firstPct: 70,
  secondPct: 20,
  thirdPct: 10,
  adminPct: 10,
}

const PROMO_RELATIONS_STORAGE_KEY = 'pollas-promo-relations'

const TYPE_TO_PRIZES_KEY = {
  diaria: 'daily',
  semanal: 'weekly',
  mensual: 'monthly',
}

export default function Premios() {
  const { appData, refresh } = useAppStore()
  const user = useAppStore(state => state.user)
  // Solo permitir edición si hay usuario autenticado
  const canEdit = !!user
  
  const [fechaOperativa, setFechaOperativa] = useState(getChileDateString())
  const [campanaActiva, setCampanaActiva] = useState(null)
  const [editando, setEditando] = useState(false)
  const [configTemp, setConfigTemp] = useState(null)
  const [guardando, setGuardando] = useState(false)

  const prizes = appData?.settings?.prizes || {}
  const campaigns = appData?.campaigns || {}
  const registry = appData?.registry || []
  const events = appData?.events || []
  const promoRelations = useMemo(() => loadPromoRelations(), [])

  const allCampaigns = useMemo(() => (
    [
      ...(campaigns.diaria || []).map((campaign) => ({ ...campaign, tipo: 'diaria' })),
      ...(campaigns.semanal || []).map((campaign) => ({ ...campaign, tipo: 'semanal' })),
      ...(campaigns.mensual || []).map((campaign) => ({ ...campaign, tipo: 'mensual' })),
    ].filter((campaign) => campaign.enabled)
  ), [campaigns])

  const visibleCampaigns = useMemo(() => (
    allCampaigns.filter((campaign) => isCampaignActiveForDate(campaign, fechaOperativa))
  ), [allCampaigns, fechaOperativa])

  useEffect(() => {
    if (!visibleCampaigns.length) {
      if (campanaActiva) setCampanaActiva(null)
      return
    }

    const stillVisible = visibleCampaigns.some((campaign) => campaign.id === campanaActiva)
    if (!stillVisible) {
      setCampanaActiva(visibleCampaigns[0].id)
    }
  }, [campanaActiva, visibleCampaigns])

  const campanaActual = useMemo(
    () => visibleCampaigns.find((campaign) => campaign.id === campanaActiva) || null,
    [visibleCampaigns, campanaActiva]
  )

  const baseConfig = editando ? configTemp : (prizes?.payout || DEFAULT_PAYOUT)
  const config = useMemo(() => ({
    firstPct: clampPercent(baseConfig?.firstPct, DEFAULT_PAYOUT.firstPct),
    secondPct: clampPercent(baseConfig?.secondPct, DEFAULT_PAYOUT.secondPct),
    thirdPct: clampPercent(baseConfig?.thirdPct, DEFAULT_PAYOUT.thirdPct),
    adminPct: clampPercent(baseConfig?.adminPct, DEFAULT_PAYOUT.adminPct),
  }), [baseConfig])

  const eventParticipants = useMemo(() => {
    if (!campanaActual) return []

    const campaignEvent = resolveCampaignEvent(events, campanaActual)
    if (!campaignEvent?.participants?.length) return []

    return campaignEvent.participants
      .map((participant) => participant?.name)
      .filter(Boolean)
  }, [campanaActual, events])

  const campaignParticipants = useMemo(() => {
    if (!campanaActual) return []

    return eventParticipants.map((participantName) => {
      const registryParticipant = registry.find(
        (participant) => normalizeText(participant.name) === normalizeText(participantName)
      )

      const participant = registryParticipant || {
        name: participantName,
        group: campanaActual.groupId || '',
        promo: false,
        promoPartners: [],
      }

      return {
        ...participant,
        name: participantName,
        hasPromoPair: campanaActual.promoEnabled && hasPromoPartnerInCampaign(
          participant,
          eventParticipants,
          promoRelations,
          campanaActual.id
        ),
      }
    })
  }, [campanaActual, eventParticipants, promoRelations, registry])

  const participantSummary = useMemo(() => {
    if (!campanaActual) {
      return {
        total: 0,
        promoCount: 0,
        singleCount: 0,
        singleAmount: 0,
        promoAmount: 0,
        grossPool: 0,
        entryValue: 0,
        promoPrice: 0,
      }
    }

    const entryValue = Number(campanaActual.entryValue || getDefaultEntryValue(prizes, campanaActual.tipo))
    const promoPrice = Number(campanaActual.promoPrice || prizes?.[TYPE_TO_PRIZES_KEY[campanaActual.tipo]]?.promoPrice || 0)
    const promoCount = campanaActual.promoEnabled
      ? campaignParticipants.filter((participant) => participant.hasPromoPair).length
      : 0
    const singleCount = campaignParticipants.length - promoCount
    const singleAmount = singleCount * entryValue
    const promoAmount = promoCount * (campanaActual.promoEnabled ? promoPrice / 2 : 0)
    const grossPool = singleAmount + promoAmount

    return {
      total: campaignParticipants.length,
      promoCount,
      singleCount,
      singleAmount,
      promoAmount,
      grossPool,
      entryValue,
      promoPrice,
    }
  }, [campanaActual, campaignParticipants, prizes])

  const totalRepartido = Number(config.firstPct || 0) + Number(config.secondPct || 0) + Number(config.thirdPct || 0)
  const adminPct = Number(config.adminPct || 0)
  const montoAdministracion = Math.round(participantSummary.grossPool * (adminPct / 100))
  const pozoLimpio = Math.max(0, participantSummary.grossPool - montoAdministracion)

  const payoutRows = [
    { key: 'firstPct', label: '🥇 1° Lugar' },
    { key: 'secondPct', label: '🥈 2° Lugar' },
    { key: 'thirdPct', label: '🥉 3° Lugar' },
  ]

  const handleConfigChange = (key, value) => {
    setConfigTemp((prev) => ({ ...(prev || config), [key]: parseInt(value, 10) || 0 }))
  }

  const handleStartEditing = () => {
    setEditando(true)
    setConfigTemp({ ...config })
  }

  const handleSaveConfig = async () => {
    if (totalRepartido !== 100) {
      alert('Los porcentajes de premios deben sumar 100% del pozo neto a repartir.')
      return
    }

    setGuardando(true)
    try {
      await api.updateSettings({
        prizes: {
          ...prizes,
          payout: config,
        },
      })

      setEditando(false)
      refresh()
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className={styles.premios}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Premios</h1>
          <p className={styles.subtitle}>Configuración de premios por campaña</p>
        </div>
      </header>

      <div className={styles.filtersBar}>
        <div className={styles.filterField}>
          <label className={styles.filterLabel}>Fecha operativa</label>
          <input
            className={styles.filterDateInput}
            type="date"
            value={fechaOperativa}
            onChange={(event) => {
              setFechaOperativa(event.target.value)
              setEditando(false)
            }}
          />
        </div>
      </div>

      <div className={styles.campanaSelector}>
        {visibleCampaigns.map((campaign) => (
          <button
            key={campaign.id}
            className={`${styles.campanaBtn} ${campanaActiva === campaign.id ? styles.active : ''}`}
            onClick={() => {
              setCampanaActiva(campaign.id)
              setEditando(false)
            }}
          >
            <span className={styles.campanaTipo}>{campaign.tipo}</span>
            <span className={styles.campanaNombre}>{campaign.name}</span>
          </button>
        ))}
      </div>

      {campanaActual ? (
        <div className={styles.layout}>
          <div className={styles.configPanel}>
            <div className={styles.configCard}>
              <div className={styles.configHeader}>
                <h3 className={styles.configTitle}>Configuración</h3>
                {canEdit && !editando && (
                  <button className={styles.editBtn} onClick={handleStartEditing}>
                    ✏️ Editar
                  </button>
                )}
              </div>

              <div className={styles.configRows}>
                <div className={styles.configRow}>
                  <span className={styles.configLabel}>Participantes campaña</span>
                  <span className={styles.configValueTotal}>{participantSummary.total}</span>
                </div>
                <div className={styles.configRow}>
                  <span className={styles.configLabel}>Individuales</span>
                  <span className={styles.configValue}>
                    {participantSummary.singleCount} • {formatCurrency(participantSummary.singleAmount)}
                  </span>
                </div>
                <div className={styles.configRow}>
                  <span className={styles.configLabel}>Promo 2x</span>
                  <span className={styles.configValue}>
                    {participantSummary.promoCount} • {formatCurrency(participantSummary.promoAmount)}
                  </span>
                </div>
                <div className={styles.configRow}>
                  <span className={styles.configLabel}>Valor individual</span>
                  <span className={styles.configValue}>{formatCurrency(participantSummary.entryValue)}</span>
                </div>
                <div className={styles.configRow}>
                  <span className={styles.configLabel}>Valor promo</span>
                  <span className={styles.configValue}>
                    {campanaActual.promoEnabled ? formatCurrency(participantSummary.promoPrice) : 'No activa'}
                  </span>
                </div>
                <div className={styles.configRow}>
                  <span className={styles.configLabel}>Pozo bruto real</span>
                  <span className={styles.configValueTotal}>{formatCurrency(participantSummary.grossPool)}</span>
                </div>
                <div className={styles.configRow}>
                  <span className={styles.configLabel}>% Administración</span>
                  <span className={styles.configValue}>
                    {editando ? (
                      <input
                        className={styles.configInput}
                        type="number"
                        value={config.adminPct || 0}
                        onChange={(event) => handleConfigChange('adminPct', event.target.value)}
                        min={0}
                        max={50}
                      />
                    ) : `${config.adminPct || 0}%`}
                  </span>
                </div>
                <div className={styles.configRow}>
                  <span className={styles.configLabel}>Monto administración</span>
                  <span className={styles.configValue}>{formatCurrency(montoAdministracion)}</span>
                </div>
                <div className={styles.configRow}>
                  <span className={styles.configLabel}>Pozo a repartir (nuevo 100%)</span>
                  <span className={styles.configValueHighlight}>{formatCurrency(pozoLimpio)}</span>
                </div>
              </div>
            </div>

            <div className={styles.detailCard}>
              <h3 className={styles.percentTitle}>Detalle campaña</h3>
              <div className={styles.detailList}>
                {campaignParticipants.map((participant) => (
                  <div key={participant.name} className={styles.detailRow}>
                    <span className={styles.detailName}>{participant.name}</span>
                    <span className={participant.hasPromoPair ? styles.detailPromo : styles.detailSingle}>
                      {participant.hasPromoPair ? 'Promo 2x' : 'Individual'}
                    </span>
                    <span className={styles.detailAmount}>
                      {formatCurrency(
                        participant.hasPromoPair
                          ? participantSummary.promoPrice / 2
                          : participantSummary.entryValue
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.percentCard}>
              <h3 className={styles.percentTitle}>% por lugar</h3>
              <p className={styles.percentNote}>
                Etapa 1: se descuenta administración del pozo bruto. Etapa 2: el pozo a repartir se resetea como 100%. Repartido: {totalRepartido}% {totalRepartido !== 100 && (
                  <span className={styles.percentWarn}>(debe ser 100%)</span>
                )}
              </p>
              <div className={styles.percentRows}>
                {payoutRows.map(({ key, label }) => {
                  const value = Number(config[key] || 0)
                  const amount = Math.round(pozoLimpio * value / 100)
                  return (
                    <div key={key} className={styles.percentRow}>
                      <span className={styles.percentLabel}>{label}</span>
                      <span className={styles.percentInput}>
                        {editando ? (
                          <input
                            className={styles.configInput}
                            type="number"
                            value={value}
                            onChange={(event) => handleConfigChange(key, event.target.value)}
                            min={0}
                            max={100}
                          />
                        ) : `${value}%`}
                      </span>
                      <span className={styles.percentMonto}>{formatCurrency(amount)}</span>
                    </div>
                  )
                })}
              </div>
              {editando && canEdit && (
                <div className={styles.editActions}>
                  <button className={styles.saveBtn} onClick={handleSaveConfig} disabled={guardando}>
                    {guardando ? 'Guardando...' : '✓ Guardar'}
                  </button>
                  <button className={styles.cancelBtn} onClick={() => setEditando(false)}>✕ Cancelar</button>
                </div>
              )}
            </div>
          </div>

          <div className={styles.winnersPanel}>
            <div className={styles.winnersCard}>
              <h3 className={styles.winnersTitle}>Premios estimados</h3>
              <div className={styles.winnersList}>
                {payoutRows.map(({ key, label }, index) => {
                  const pct = Number(config[key] || 0)
                  const amount = Math.round(pozoLimpio * pct / 100)
                  return (
                    <div key={key} className={`${styles.winnerRow} ${styles.topThree}`}>
                      <span className={styles.winnerPos}>{['🥇', '🥈', '🥉'][index]}</span>
                      <span className={styles.winnerName}>{label}</span>
                      <span className={styles.winnerPts}>{pct}%</span>
                      <span className={styles.winnerPrize}>{formatCurrency(amount)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>🏅</span>
          <p>No hay campañas activas para la fecha seleccionada.</p>
        </div>
      )}
    </div>
  )
}

function getDefaultEntryValue(prizes, tipo) {
  const pricesKey = TYPE_TO_PRIZES_KEY[tipo]
  return prizes?.[pricesKey]?.entryPrice || prizes?.[pricesKey]?.singlePrice || 0
}

function loadPromoRelations() {
  try {
    const raw = localStorage.getItem(PROMO_RELATIONS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function hasPromoPartnerInCampaign(participant, eventParticipants, promoRelations, campaignId) {
  const enrolledNames = new Set((eventParticipants || []).map(normalizeText))
  const ownPartners = Array.isArray(participant?.promoPartners) ? participant.promoPartners : []
  if (ownPartners.some((partner) => enrolledNames.has(normalizeText(partner)))) {
    return true
  }

  const localPartners = promoRelations?.[campaignId]?.[participant?.name]?.partners || []
  return localPartners.some((partner) => enrolledNames.has(normalizeText(partner)))
}

function resolveCampaignEvent(events, campaign) {
  if (!campaign) return null

  const directMatch = events.find((event) =>
    event.id?.includes(campaign.id) ||
    event.campaignId === campaign.id ||
    campaign.eventId === event.id ||
    (campaign.eventIds || []).includes(event.id)
  )
  if (directMatch) return directMatch

  if (campaign.tipo === 'diaria' && campaign.date) {
    return events.find((event) => {
      const eventDate = event?.meta?.date || event?.date || event?.sheetName
      return String(eventDate).includes(campaign.date) && Array.isArray(event.participants) && event.participants.length > 0
    }) || null
  }

  return null
}

function isCampaignActiveForDate(campaign, date) {
  const normalizedDate = normalizeDate(date)
  if (!normalizedDate) return false

  if (campaign.tipo === 'diaria') {
    return normalizeDate(campaign.date) === normalizedDate
  }

  if (campaign.startDate && normalizedDate < normalizeDate(campaign.startDate)) return false
  if (campaign.endDate && normalizedDate > normalizeDate(campaign.endDate)) return false

  if (campaign.tipo === 'semanal') {
    return isWeeklyDayEnabled(campaign, normalizedDate)
  }

  return true
}

function isWeeklyDayEnabled(campaign, date) {
  const activeDays = (campaign.activeDays || []).map(normalizeText)
  if (activeDays.length === 0) return true

  const dayNames = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']
  const dayName = dayNames[new Date(`${date}T12:00:00`).getDay()]
  return activeDays.includes(dayName)
}

function normalizeDate(value) {
  if (!value) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value

  const latinDate = String(value).match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (latinDate) {
    const [, day, month, year] = latinDate
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  const embeddedDate = String(value).match(/(\d{4}-\d{2}-\d{2})/)
  if (embeddedDate) return embeddedDate[1]

  try {
    return new Date(value).toISOString().slice(0, 10)
  } catch {
    return null
  }
}

function clampPercent(value, fallback = 0) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return fallback
  return Math.max(0, Math.min(100, Math.round(numeric)))
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function formatCurrency(value) {
  return `$${Math.round(Number(value || 0)).toLocaleString('es-CL')}`
}
