import React, { useMemo, useState } from 'react'
import useAppStore from '../store/useAppStore'
import { useCampaigns } from '../hooks/useCampaigns'
import { MODE_IDS, MODE_DESCRIPTIONS, getModeOptions } from '../engine/modeEngine'
import {
  CAMPAIGN_TRACK_OPTIONS,
  filterSelectedEventIdsByCampaign,
  getCampaignEligibleDateList,
  isCampaignEventEligible,
  normalizeCampaignTrackSelection,
} from '../services/campaignEligibility'
import { resolveCampaignStatus } from '../services/campaignStatus'
import CampaignDetailModal from './campaigns/CampaignDetailModal'
import styles from './Campaigns.module.css'

const Icons = {
  Calendar: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>),
  Users: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>),
  Trophy: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>),
  Target: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>),
  TrendingUp: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>),
  Trash: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>),
  Check: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>),
  X: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>),
  Plus: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>),
  Filter: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>),
  MapPin: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>),
  Eye: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>),
  List: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>),
  Award: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="6" /><path d="m8.21 13.89-1.42 7.11L12 18l5.21 3-1.42-7.11" /></svg>),
}

const HIPODROMOS = CAMPAIGN_TRACK_OPTIONS
const TYPE_ICONS = { diaria: '📅', semanal: '📆', mensual: '🗓️' }
const TYPE_COLORS = { diaria: '#10b981', semanal: '#3b82f6', mensual: '#8b5cf6' }

function CampaignCard({ campaign, registryGroups, onToggle, onDelete, onOpenDetail, appData }) {
  const groupName = registryGroups.find((group) => group.id === campaign.groupId)?.name || 'Todos'
  const estadoConfig = {
    activa: { label: 'Activa', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
    proxima: { label: 'Próxima', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
    'en-curso': { label: 'En curso', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
    finalizada: { label: 'Finalizada', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
  }
  const estado = estadoConfig[campaign.estado] || estadoConfig.finalizada

  return (
    <div className={styles.campaignCard} style={{ borderTopColor: campaign.color }}>
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderLeft}>
          <span className={styles.cardIcon}>{campaign.icon}</span>
          <div>
            <h3 className={styles.cardTitle}>{campaign.name}</h3>
            <div className={styles.cardSubtitle}>
              <span className={styles.typeBadge} style={{ background: campaign.color }}>{campaign.typeLabel}</span>
              {campaign.date && (
                <span className={styles.dateText}>
                  <Icons.Calendar /> {new Date(`${campaign.date}T12:00:00`).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
                </span>
              )}
            </div>
          </div>
        </div>
        <span className={styles.statusBadge} style={{ background: estado.bg, color: estado.color }}>{estado.label}</span>
      </div>

      <div className={styles.metrics}>
        <div className={styles.metric}><Icons.Users /><div><span className={styles.metricValue}>{campaign.participantCount}</span><span className={styles.metricLabel}>Participantes</span></div></div>
        <div className={styles.metric}><Icons.Target /><div><span className={styles.metricValue}>{campaign.raceCount || 12}</span><span className={styles.metricLabel}>Carreras</span></div></div>
        <div className={styles.metric}><Icons.TrendingUp /><div><span className={styles.metricValue}>{campaign.entryValue ? `$${Number(campaign.entryValue).toLocaleString('es-CL')}` : '-'}</span><span className={styles.metricLabel}>Valor</span></div></div>
      </div>

      <div className={styles.cardInfo}>
        <div className={styles.infoRow}><Icons.MapPin /><span>{groupName}</span></div>
        {campaign.type === 'mensual' && (
          <div className={styles.infoRow}><Icons.Calendar /><span>{formatEligibleDatesLabel(getCampaignEligibleDateList(campaign, appData))}</span></div>
        )}
        {campaign.promoEnabled && (
          <div className={styles.infoRow}>
            <span className={styles.promoBadge}>PROMO 2x</span>
            {campaign.promoPrice ? <span>${Number(campaign.promoPrice).toLocaleString('es-CL')}</span> : null}
          </div>
        )}
        <div className={styles.infoRow}>
          <Icons.Trophy />
          <span>{campaign.scoring?.mode === 'points' ? `Puntos (${campaign.scoring?.points?.first || 10}/${campaign.scoring?.points?.second || 5})` : campaign.scoring?.doubleLastRace ? 'Dividendo + última x2' : 'Dividendo'}</span>
        </div>
      </div>

        <div className={styles.cardActions}>
          <button className={styles.actionBtn} type="button" onClick={() => onOpenDetail(campaign, 'pronosticos')}><Icons.Eye /> Pronósticos</button>
          <button className={styles.actionBtn} type="button" onClick={() => onOpenDetail(campaign, 'participantes')}><Icons.Users /> Participantes</button>
          <button className={styles.actionBtn} type="button" onClick={() => onOpenDetail(campaign, 'ranking')}><Icons.Trophy /> Ranking</button>
          <button className={styles.actionBtn} type="button" onClick={() => onOpenDetail(campaign, 'premios')}><Icons.Award /> Premios</button>
          <button className={styles.actionBtn} type="button" onClick={() => onOpenDetail(campaign, 'resultados')}><Icons.List /> Resultados</button>
        <button className={`${styles.actionBtn} ${styles.toggleBtn}`} type="button" onClick={() => onToggle(campaign)}>{campaign.enabled ? <><Icons.X /> Desactivar</> : <><Icons.Check /> Activar</>}</button>
        <button className={`${styles.actionBtn} ${styles.dangerBtn}`} type="button" onClick={() => onDelete(campaign)} title="Eliminar"><Icons.Trash /></button>
      </div>
    </div>
  )
}

function CampaignRow({ campaign, registryGroups, onToggle, onDelete, onOpenDetail }) {
  const estadoConfig = {
    activa: { label: 'Activa', color: '#10b981' },
    proxima: { label: 'Próxima', color: '#3b82f6' },
    'en-curso': { label: 'En curso', color: '#f59e0b' },
    finalizada: { label: 'Finalizada', color: '#ef4444' },
  }
  const estado = estadoConfig[campaign.estado] || estadoConfig.finalizada

  return (
    <div className={styles.campaignRow}>
      <div className={styles.rowLeft}>
        <span className={styles.rowIcon}>{campaign.icon}</span>
        <div className={styles.rowInfo}>
          <h4 className={styles.rowTitle}>{campaign.name}</h4>
          <div className={styles.rowSubtitle}>
            {campaign.date && <span>{campaign.date}</span>}
            {campaign.groupId && <span>• {registryGroups.find((group) => group.id === campaign.groupId)?.name || 'Todos'}</span>}
          </div>
        </div>
      </div>
      <div className={styles.rowMetrics}>
        <span className={styles.rowMetric}><Icons.Users /> {campaign.participantCount}</span>
        <span className={styles.rowMetric}>{campaign.entryValue ? `$${Number(campaign.entryValue).toLocaleString('es-CL')}` : '-'}</span>
      </div>
      <span className={styles.rowStatus} style={{ color: estado.color }}>{estado.label}</span>
      <div className={styles.rowActions}>
        <button className={styles.rowActionBtn} type="button" onClick={() => onOpenDetail(campaign, 'pronosticos')}>Abrir</button>
        <button className={styles.rowActionBtn} type="button" onClick={() => onToggle(campaign)}>{campaign.enabled ? 'Desactivar' : 'Activar'}</button>
        <button className={`${styles.rowActionBtn} ${styles.dangerBtn}`} type="button" onClick={() => onDelete(campaign)}>Eliminar</button>
      </div>
    </div>
  )
}

export default function Campaigns() {
  const { appData, refresh } = useAppStore()
  const { campaigns, registryGroups, createCampaign, toggleCampaign, deleteCampaign } = useCampaigns()
  const [tipoActivo, setTipoActivo] = useState('diaria')
  const [editando, setEditando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [filtroEstado, setFiltroEstado] = useState('todas')
  const [vista, setVista] = useState('cards')
  const [detailCampaign, setDetailCampaign] = useState(null)
  const [detailTab, setDetailTab] = useState('pronosticos')
  const events = appData?.events || []

  const weeklySettings = appData?.settings?.weekly || {}
  const monthlySettings = appData?.settings?.monthly || {}
  const [form, setForm] = useState({
    nombre: '',
    fecha: new Date().toISOString().split('T')[0],
    fechaInicio: monthlySettings.startDate || '',
    fechaFin: monthlySettings.endDate || '',
    hipodromo: 'Hipodromo Chile',
    carreras: 12,
    grupo: '',
    scoring: 'dividend',
    pointsFirst: 10,
    pointsSecond: 5,
    pointsThird: 1,
    pointsExclusiveFirst: 20,
    doubleLastRace: true,
    entryValue: 0,
    promoEnabled: false,
    promoPrice: 0,
    format: weeklySettings.format || MODE_IDS.INDIVIDUAL,
    dias: weeklySettings.activeDays || ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
    finalDays: weeklySettings.finalDays || [],
    groupSize: weeklySettings.groupSize || 8,
    qualifiersPerGroup: weeklySettings.qualifiersPerGroup || 4,
    selectedHipodromos: normalizeCampaignTrackSelection(monthlySettings.hipodromos || ['Hipodromo Chile']),
  })

  const allCampaigns = useMemo(() => {
    const types = ['diaria', 'semanal', 'mensual']
    return types.flatMap((type) => (
      (campaigns[type] || []).map((campaign) => {
        const campaignWithType = { ...campaign, type }
        const campaignEvents = collectCampaignEvents(events, campaignWithType)
        const participantCount = countUniqueParticipants(campaignEvents)
        const raceCount = campaignEvents[0]?.races || campaignEvents[0]?.meta?.raceCount || campaign.raceCount || 12
        const estado = resolveCampaignStatus({
          campaign: { ...campaignWithType, raceCount },
          appData,
          campaignEvents,
        })

        return {
          ...campaign,
          type,
          typeLabel: type.charAt(0).toUpperCase() + type.slice(1),
          icon: TYPE_ICONS[type],
          color: TYPE_COLORS[type],
          estado,
          participantCount,
          raceCount,
          pickCount: 0,
        }
      })
    ))
  }, [appData, campaigns, events])

  const currentCampaigns = useMemo(() => {
    let filtered = allCampaigns.filter((campaign) => campaign.type === tipoActivo)
    if (filtroEstado === 'activas') filtered = filtered.filter((campaign) => campaign.estado === 'activa' || campaign.estado === 'en-curso' || campaign.estado === 'proxima')
    if (filtroEstado === 'cerradas') filtered = filtered.filter((campaign) => campaign.estado === 'finalizada')
    return filtered
  }, [allCampaigns, filtroEstado, tipoActivo])

  const counts = useMemo(() => {
    const typeCampaigns = allCampaigns.filter((campaign) => campaign.type === tipoActivo)
    return {
      todas: typeCampaigns.length,
      activas: typeCampaigns.filter((campaign) => campaign.estado === 'activa' || campaign.estado === 'en-curso' || campaign.estado === 'proxima').length,
      cerradas: typeCampaigns.filter((campaign) => campaign.estado === 'finalizada').length,
    }
  }, [allCampaigns, tipoActivo])

  const isGroupsMode = form.format === MODE_IDS.GROUPS
  const isPairsMode = form.format === MODE_IDS.PAIRS
  const hasFinalStage = [MODE_IDS.ROUND_ROBIN, MODE_IDS.GROUPS, MODE_IDS.PAIRS].includes(form.format)
  const isPointsMode = form.scoring === 'points'

  const handleCreate = async () => {
    if (!form.nombre) return
    setGuardando(true)

    try {
      const newCampaign = {
        name: form.nombre,
        groupId: form.grupo,
        raceCount: parseInt(form.carreras, 10) || 12,
        entryValue: Number(form.entryValue) || 0,
        promoEnabled: form.promoEnabled,
        promoPrice: Number(form.promoPrice) || 0,
        scoring: {
          mode: form.scoring,
          doubleLastRace: form.scoring === 'dividend' ? form.doubleLastRace : false,
          points: {
            first: Number(form.pointsFirst) || 10,
            second: Number(form.pointsSecond) || 5,
            third: Number(form.pointsThird) || 1,
            exclusiveFirst: Number(form.pointsExclusiveFirst) || 20,
          },
        },
      }

      if (tipoActivo === 'diaria') {
        newCampaign.date = form.fecha
        newCampaign.competitionMode = 'individual'
      } else if (tipoActivo === 'semanal') {
        newCampaign.format = form.format
        newCampaign.competitionMode = form.format
        newCampaign.groupSize = parseInt(form.groupSize, 10)
        newCampaign.qualifiersPerGroup = parseInt(form.qualifiersPerGroup, 10)
        newCampaign.activeDays = form.dias
        newCampaign.finalDays = hasFinalStage ? (form.finalDays || ['Sábado', 'Domingo']) : []
        newCampaign.pairMode = isPairsMode
      } else {
        newCampaign.hipodromos = normalizeCampaignTrackSelection(form.selectedHipodromos)
        newCampaign.startDate = form.fechaInicio
        newCampaign.endDate = form.fechaFin
        newCampaign.selectedEventIds = filterSelectedEventIdsByCampaign(
          { ...newCampaign, type: 'mensual', hipodromos: newCampaign.hipodromos },
          [...(appData?.settings?.monthly?.selectedEventIds || [])]
        )
        newCampaign.competitionMode = form.format || 'individual'
      }

      await createCampaign(tipoActivo, newCampaign)
      setEditando(false)
      setForm((current) => ({ ...current, nombre: '' }))
    } catch (error) {
      alert(`Error al crear campaña: ${error.message}`)
    } finally {
      setGuardando(false)
    }
  }

  const handleToggle = async (campaign) => {
    await toggleCampaign(tipoActivo, campaign.id)
  }

  const handleDelete = async (campaign) => {
    if (!confirm(`¿Eliminar campaña "${campaign.name}"?`)) return
    await deleteCampaign(tipoActivo, campaign.id)
  }

  const handleOpenDetail = (campaign, tab = 'pronosticos') => {
    setDetailCampaign(campaign)
    setDetailTab(tab)
  }

  const toggleHipodromo = (hipodromo) => {
    setForm((current) => {
      const selected = current.selectedHipodromos || []
      return selected.includes(hipodromo)
        ? { ...current, selectedHipodromos: selected.filter((item) => item !== hipodromo) }
        : { ...current, selectedHipodromos: [...selected, hipodromo] }
    })
  }

  const toggleDia = (dia) => {
    setForm((current) => (
      current.dias.includes(dia)
        ? { ...current, dias: current.dias.filter((item) => item !== dia) }
        : { ...current, dias: [...current.dias, dia] }
    ))
  }

  return (
    <div className={styles.campaigns}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Campañas</h1>
          <p className={styles.subtitle}>Administra tus campañas diarias, semanales y mensuales</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className={styles.viewToggle} type="button" onClick={() => setVista(vista === 'cards' ? 'lista' : 'cards')} title={vista === 'cards' ? 'Vista lista' : 'Vista cards'}>
            {vista === 'cards' ? <Icons.List /> : <Icons.Trophy />}
          </button>
          <button className={styles.newBtn} type="button" onClick={() => setEditando(true)}><Icons.Plus /> Nueva Campaña</button>
        </div>
      </header>

      <div className={styles.tabs}>
        {[{ id: 'diaria', label: 'Diaria', count: campaigns.diaria?.length || 0 }, { id: 'semanal', label: 'Semanal', count: campaigns.semanal?.length || 0 }, { id: 'mensual', label: 'Mensual', count: campaigns.mensual?.length || 0 }].map((tab) => (
          <button key={tab.id} className={`${styles.tab} ${tipoActivo === tab.id ? styles.active : ''}`} type="button" onClick={() => setTipoActivo(tab.id)}>
            <span className={styles.tabIcon}>{TYPE_ICONS[tab.id]}</span>
            {tab.label}
            <span className={styles.tabCount}>{tab.count}</span>
          </button>
        ))}
      </div>

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <Icons.Filter />
          {[{ id: 'todas', label: 'Todas', count: counts.todas }, { id: 'activas', label: 'Activas', count: counts.activas }, { id: 'cerradas', label: 'Cerradas', count: counts.cerradas }].map((filter) => (
            <button key={filter.id} className={`${styles.filterBtn} ${filtroEstado === filter.id ? styles.filterActive : ''}`} type="button" onClick={() => setFiltroEstado(filter.id)}>
              {filter.label}
              <span className={styles.filterCount}>{filter.count}</span>
            </button>
          ))}
        </div>
      </div>

      {editando && (
        <div className={styles.newForm}>
          <h3 className={styles.formTitle}>Nueva Campaña {tipoActivo}</h3>
          <div className={styles.formGrid}>
            <div className={styles.formRow} style={{ gridColumn: '1 / -1' }}>
              <label className={styles.formLabel}>Nombre</label>
              <input className={styles.formInput} value={form.nombre} onChange={(event) => setForm({ ...form, nombre: event.target.value })} placeholder={`Ej: ${tipoActivo} - ${new Date().toLocaleDateString('es-CL')}`} />
            </div>

            {tipoActivo === 'diaria' && (
              <div className={styles.formRow}>
                <label className={styles.formLabel}>Fecha</label>
                <input className={styles.formInput} type="date" value={form.fecha} onChange={(event) => setForm({ ...form, fecha: event.target.value })} />
              </div>
            )}

            {tipoActivo === 'semanal' && (
              <>
                <div className={styles.formRow}>
                  <label className={styles.formLabel}>Tipo de Polla</label>
                  <select className={styles.formSelect} value={form.format} onChange={(event) => setForm({ ...form, format: event.target.value })}>
                    {getModeOptions().map((option) => (
                      <option key={option.id} value={option.id}>{option.label}</option>
                    ))}
                  </select>
                  <p className={styles.formHint}>{MODE_DESCRIPTIONS[form.format] || ''}</p>
                </div>

                <div className={styles.formRow}>
                  <label className={styles.formLabel}>Días que se juegan</label>
                  <div className={styles.daysCheck}>
                    {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((dia) => (
                      <label key={dia} className={styles.dayCheck}><input type="checkbox" checked={form.dias.includes(dia)} onChange={() => toggleDia(dia)} /> {dia}</label>
                    ))}
                  </div>
                </div>

                {isGroupsMode && (
                  <>
                    <div className={styles.formRow}>
                      <label className={styles.formLabel}>Tamaño de grupo</label>
                      <input className={styles.formInput} type="number" value={form.groupSize} onChange={(event) => setForm({ ...form, groupSize: event.target.value })} min={2} max={20} />
                    </div>
                    <div className={styles.formRow}>
                      <label className={styles.formLabel}>Clasifican por grupo</label>
                      <input className={styles.formInput} type="number" value={form.qualifiersPerGroup} onChange={(event) => setForm({ ...form, qualifiersPerGroup: event.target.value })} min={1} max={10} />
                    </div>
                  </>
                )}
              </>
            )}

            {tipoActivo === 'mensual' && (
              <>
                <div className={styles.formRow}>
                  <label className={styles.formLabel}>Fecha inicio</label>
                  <input className={styles.formInput} type="date" value={form.fechaInicio} onChange={(event) => setForm({ ...form, fechaInicio: event.target.value })} />
                </div>
                <div className={styles.formRow}>
                  <label className={styles.formLabel}>Fecha fin</label>
                  <input className={styles.formInput} type="date" value={form.fechaFin} onChange={(event) => setForm({ ...form, fechaFin: event.target.value })} />
                </div>
                <div className={styles.formRow}>
                  <label className={styles.formLabel}>Hipódromos</label>
                  <div className={styles.daysCheck}>
                    {HIPODROMOS.map((hipodromo) => (
                      <label key={hipodromo} className={styles.dayCheck}><input type="checkbox" checked={(form.selectedHipodromos || []).includes(hipodromo)} onChange={() => toggleHipodromo(hipodromo)} /> {hipodromo}</label>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className={styles.formRow}>
              <label className={styles.formLabel}>Valor de la polla ($)</label>
              <input className={styles.formInput} type="number" value={form.entryValue} onChange={(event) => setForm({ ...form, entryValue: event.target.value })} min="0" step="100" placeholder="Ej: 5000" />
            </div>

            <div className={styles.formRow}>
              <label className={styles.checkChip}><input type="checkbox" checked={form.promoEnabled} onChange={(event) => setForm({ ...form, promoEnabled: event.target.checked })} /> Activar promoción 2x</label>
            </div>

            {form.promoEnabled && (
              <div className={styles.formRow}>
                <label className={styles.formLabel}>Valor promo 2x ($)</label>
                <input className={styles.formInput} type="number" value={form.promoPrice} onChange={(event) => setForm({ ...form, promoPrice: event.target.value })} min="0" step="100" placeholder="Ej: 9000" />
              </div>
            )}

            <div className={styles.formRow}>
              <label className={styles.formLabel}>Grupo asociado</label>
              <select className={styles.formSelect} value={form.grupo} onChange={(event) => setForm({ ...form, grupo: event.target.value })}>
                <option value="">Todos los participantes</option>
                {registryGroups.map((group) => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>
            </div>

            <div className={styles.formRow}>
              <label className={styles.formLabel}>Tipo de puntuación</label>
              <select className={styles.formSelect} value={form.scoring} onChange={(event) => setForm({ ...form, scoring: event.target.value })}>
                <option value="dividend">Por dividendo</option>
                <option value="points">Por puntos</option>
              </select>
            </div>

            {isPointsMode && (
              <div className={styles.formRow} style={{ gridColumn: '1 / -1' }}>
                <div className={styles.pointsConfig}>
                  <p className={styles.pointsTitle}>Configuración de puntos</p>
                  <div className={styles.pointsGrid}>
                    <div className={styles.pointField}><label className={styles.formLabel}>1° lugar</label><input className={styles.formInput} type="number" value={form.pointsFirst} onChange={(event) => setForm({ ...form, pointsFirst: event.target.value })} min="0" /></div>
                    <div className={styles.pointField}><label className={styles.formLabel}>2° lugar</label><input className={styles.formInput} type="number" value={form.pointsSecond} onChange={(event) => setForm({ ...form, pointsSecond: event.target.value })} min="0" /></div>
                    <div className={styles.pointField}><label className={styles.formLabel}>3° lugar</label><input className={styles.formInput} type="number" value={form.pointsThird} onChange={(event) => setForm({ ...form, pointsThird: event.target.value })} min="0" /></div>
                    <div className={styles.pointField}><label className={styles.formLabel}>Exclusivo 1°</label><input className={styles.formInput} type="number" value={form.pointsExclusiveFirst} onChange={(event) => setForm({ ...form, pointsExclusiveFirst: event.target.value })} min="0" /></div>
                  </div>
                </div>
              </div>
            )}

            {!isPointsMode && tipoActivo !== 'mensual' && (
              <div className={styles.formRow}>
                <label className={styles.checkChip}><input type="checkbox" checked={form.doubleLastRace} onChange={(event) => setForm({ ...form, doubleLastRace: event.target.checked })} /> Última carrera x2</label>
              </div>
            )}

            <div className={styles.formRow}>
              <label className={styles.formLabel}>Carreras por jornada</label>
              <input className={styles.formInput} type="number" value={form.carreras} onChange={(event) => setForm({ ...form, carreras: event.target.value })} min="1" max="30" />
            </div>
          </div>

          <div className={styles.formActions}>
            <button className={styles.saveBtn} type="button" onClick={handleCreate} disabled={guardando || !form.nombre}>{guardando ? 'Creando...' : 'Crear Campaña'}</button>
            <button className={styles.cancelBtn} type="button" onClick={() => setEditando(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {vista === 'cards' ? (
        <div className={styles.cardsGrid}>
          {currentCampaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} appData={appData} registryGroups={registryGroups} onToggle={handleToggle} onDelete={handleDelete} onOpenDetail={handleOpenDetail} />
          ))}
          {currentCampaigns.length === 0 && (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>📋</span>
              <p>No hay campañas {filtroEstado !== 'todas' ? filtroEstado : ''} {tipoActivo}s</p>
              <button className={styles.emptyBtn} type="button" onClick={() => setEditando(true)}><Icons.Plus /> Crear primera campaña</button>
            </div>
          )}
        </div>
      ) : (
        <div className={styles.listView}>
          {currentCampaigns.map((campaign) => (
            <CampaignRow key={campaign.id} campaign={campaign} registryGroups={registryGroups} onToggle={handleToggle} onDelete={handleDelete} onOpenDetail={handleOpenDetail} />
          ))}
          {currentCampaigns.length === 0 && (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>📋</span>
              <p>No hay campañas</p>
            </div>
          )}
        </div>
      )}

      {detailCampaign && (
        <CampaignDetailModal
          campaign={detailCampaign}
          initialTab={detailTab}
          registryGroups={registryGroups}
          onRefresh={refresh}
          onClose={() => setDetailCampaign(null)}
        />
      )}
    </div>
  )
}

function collectCampaignEvents(events, campaign) {
  return (events || []).filter((event) => {
    if (!Array.isArray(event?.participants) || event.participants.length === 0) return false
    const eventDate = getEventDate(event)
    if (!eventDate) return false

    const directMatch =
      event.id?.includes(campaign.id) ||
      event.campaignId === campaign.id ||
      campaign.eventId === event.id ||
      (campaign.eventIds || []).includes(event.id)

    if (directMatch) return true

    if (campaign.type === 'diaria') {
      return eventDate === normalizeDate(campaign.date)
    }

    if (campaign.type === 'diaria') {
      const eventTrackText = [event?.meta?.trackName, event?.meta?.trackId, event?.sheetName, event?.title, event?.name].filter(Boolean).join(' ')
      return isCampaignEventEligible(campaign, eventDate, eventTrackText, { events })
    }

    return false
  })
}

function countUniqueParticipants(events) {
  const names = new Set()
  ;(events || []).forEach((event) => {
    ;(event.participants || []).forEach((participant) => {
      const name = participant?.name || participant?.index
      if (name) names.add(String(name).trim().toLowerCase())
    })
  })
  return names.size
}

function getEventDate(event) {
  return normalizeDate(event?.meta?.date || event?.date || event?.id || event?.sheetName)
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

function formatEligibleDatesLabel(dates = []) {
  if (!Array.isArray(dates) || dates.length === 0) return 'Sin jornadas detectadas en calendario'
  const visible = dates.slice(0, 4).map(formatShortDate)
  const extra = dates.length - visible.length
  return `${dates.length} jornada${dates.length === 1 ? '' : 's'} · ${visible.join(', ')}${extra > 0 ? ` +${extra}` : ''}`
}

function formatShortDate(value) {
  const [year, month, day] = String(value || '').split('-')
  if (!year || !month || !day) return value
  return `${day}-${month}`
}
