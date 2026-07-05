/**
 * CampaignWizard.jsx
 *
 * Formulario wizard único para crear campañas de cualquier tipo y modo.
 * Un solo flujo dinámico. No se duplica lógica.
 *
 * Flujo:
 * 1. Tipo (diaria/semanal/mensual)
 * 2. Modo (individual/parejas/grupos/duelo/elim./clasif.)
 * 3. Configuración
 * 4. Estilo
 */

import React, { useState, useMemo, useCallback } from 'react'
import useAppStore from '../store/useAppStore'
import { useCampaigns } from '../hooks/useCampaigns'
import { MODE_IDS, MODE_LABELS, MODE_DESCRIPTIONS, getModeOptions, getModeRules } from '../engine/modeEngine'
import {
  buildCampaignStylePayload,
  getDefaultCampaignStyleForm,
  getLegacyThemeFromRankingTheme,
} from '../services/campaignStyles'
import {
  buildMonthlySelectedEventIds,
  CAMPAIGN_TRACK_OPTIONS,
  getCampaignEligibleDateList,
  isCampaignEventEligible,
  normalizeCampaignTrackSelection,
} from '../services/campaignEligibility'
import { applyWeeklyModeConfig, normalizeWeeklyModeConfig } from '../services/campaignModeConfig'
import { resolveCampaignStatus } from '../services/campaignStatus'
import { isParticipantInGroup } from '../services/participantGroups'
import { getChileDateString, normalizeDateToChile } from '../utils/dateChile'
import CampaignDetailModal from './campaigns/CampaignDetailModal'
import CampaignStyleStep from './campaigns/CampaignStyleStep'
import styles from './CampaignWizard.module.css'

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const HIPODROMOS = CAMPAIGN_TRACK_OPTIONS

// Modos que permiten configurar final
const MODES_WITH_FINAL = [MODE_IDS.PAIRS, MODE_IDS.GROUPS, MODE_IDS.HEAD_TO_HEAD]

function formatIsoDate(date) {
  return date.toISOString().slice(0, 10)
}

function addIsoDays(value, amount) {
  const normalized = normalizeDate(value)
  if (!normalized) return ''
  const [year, month, day] = normalized.split('-').map(Number)
  return formatIsoDate(new Date(Date.UTC(year, month - 1, day + amount)))
}

function getDefaultDateRange(type, anchorValue = getChileDateString()) {
  const anchor = normalizeDate(anchorValue) || getChileDateString()
  const [year, month, day] = anchor.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))

  if (type === 'mensual') {
    return {
      startDate: formatIsoDate(new Date(Date.UTC(year, month - 1, 1))),
      endDate: formatIsoDate(new Date(Date.UTC(year, month, 0))),
    }
  }

  if (type === 'semanal') {
    const daysSinceMonday = (date.getUTCDay() + 6) % 7
    const startDate = addIsoDays(anchor, -daysSinceMonday)
    return { startDate, endDate: addIsoDays(startDate, 6) }
  }

  return { startDate: '', endDate: '' }
}

function getCampaignFormDates(campaign, type) {
  if (type === 'diaria') {
    return {
      date: normalizeDate(campaign?.date) || normalizeDate(campaign?.createdAt) || getChileDateString(),
      startDate: '',
      endDate: '',
    }
  }

  const storedStartDate = normalizeDate(campaign?.startDate)
  const storedEndDate = normalizeDate(campaign?.endDate)
  const anchor = storedStartDate || storedEndDate || normalizeDate(campaign?.date) || normalizeDate(campaign?.createdAt) || getChileDateString()
  const fallback = getDefaultDateRange(type, anchor)
  let startDate = storedStartDate
  let endDate = storedEndDate

  if (!startDate && endDate) {
    startDate = type === 'mensual'
      ? getDefaultDateRange('mensual', endDate).startDate
      : addIsoDays(endDate, -6)
  }
  if (startDate && !endDate) {
    endDate = type === 'mensual'
      ? getDefaultDateRange('mensual', startDate).endDate
      : addIsoDays(startDate, 6)
  }

  return {
    date: getChileDateString(),
    startDate: startDate || fallback.startDate,
    endDate: endDate || fallback.endDate,
  }
}

function getInitialCampaignForm(settings = {}) {
  return {
    name: '',
    date: getChileDateString(),
    startDate: '',
    endDate: '',
    hipodromos: normalizeCampaignTrackSelection(settings.monthly?.hipodromos || []),
    group: '',
    value: 0,
    promoEnabled: false,
    promoPrice: 0,
    raceCount: 12,
    scoring: 'dividend',
    pointsFirst: 10,
    pointsSecond: 5,
    pointsThird: 1,
    pointsExclusiveFirst: 20,
    doubleLastRace: true,
    activeDays: settings.weekly?.activeDays || ['Lunes', 'Martes', 'Mi\u00e9rcoles', 'Jueves', 'Viernes', 'S\u00e1bado'],
    hasFinalStage: false,
    finalDays: settings.weekly?.finalDays || ['S\u00e1bado'],
    groupCount: settings.weekly?.groupCount || 4,
    groupSize: settings.weekly?.groupSize || 8,
    qualifiersPerGroup: settings.weekly?.qualifiersPerGroup || 4,
    qualifiersByGroup: settings.weekly?.qualifiersByGroup || {},
    qualifiersCount: '',
    eliminatePerDay: 1,
    ...getDefaultCampaignStyleForm(),
  }
}

function getCampaignGroupParticipantCount(registry = [], groupId = '') {
  if (!Array.isArray(registry)) return 0
  if (!groupId) return registry.length
  return registry.filter((participant) => isParticipantInGroup(participant, groupId)).length
}

function getDefaultFinalQualifiersCount(participantCount) {
  const numericCount = Number(participantCount || 0)
  if (!Number.isFinite(numericCount) || numericCount <= 0) return null
  return Math.max(1, Math.floor(numericCount / 2))
}

function getDefaultPairQualifiersCount(pairCount) {
  const numericCount = Number(pairCount || 0)
  if (!Number.isFinite(numericCount) || numericCount <= 0) return null
  return Math.max(1, Math.ceil(numericCount / 2))
}

function buildNumberedGroupList(groupCount) {
  const numericCount = Number(groupCount || 0)
  const safeCount = Number.isFinite(numericCount) && numericCount > 0
    ? Math.round(numericCount)
    : 1

  return Array.from({ length: safeCount }, (_, index) => ({
    id: `group-${index + 1}`,
    name: `Grupo ${index + 1}`,
  }))
}

function buildQualifiersByGroupPayload(groupCount, qualifiersByGroup = {}, fallbackValue) {
  const fallback = Number(fallbackValue)
  const payload = {}

  buildNumberedGroupList(groupCount).forEach((group) => {
    const rawValue = qualifiersByGroup?.[group.id] ?? fallback
    const numeric = Number(rawValue)
    if (Number.isFinite(numeric) && numeric > 0) {
      payload[group.id] = Math.round(numeric)
    }
  })

  return payload
}

function countConfiguredPairs(campaign) {
  const pairs = campaign?.modeConfig?.pairs || campaign?.pairs || []
  if (!Array.isArray(pairs)) return 0
  return pairs.filter((pair) => Array.isArray(pair?.members) && pair.members.length > 0).length
}

function getCampaignMode(campaign) {
  return campaign?.modeConfig?.format || campaign?.format || campaign?.competitionMode || ''
}

function getStoredRelationArray(campaign, key) {
  const modeConfigValue = campaign?.modeConfig?.[key]
  const topLevelValue = campaign?.[key]

  if (Array.isArray(modeConfigValue) && modeConfigValue.length > 0) return modeConfigValue
  if (Array.isArray(topLevelValue) && topLevelValue.length > 0) return topLevelValue
  if (Array.isArray(modeConfigValue)) return modeConfigValue
  if (Array.isArray(topLevelValue)) return topLevelValue
  return []
}

function getPreservedWeeklyRelationConfig(campaign, nextMode) {
  if (!campaign || getCampaignMode(campaign) !== nextMode) return {}

  if (nextMode === MODE_IDS.PAIRS) {
    return { pairs: getStoredRelationArray(campaign, 'pairs') }
  }

  if (nextMode === MODE_IDS.GROUPS) {
    return { groups: getStoredRelationArray(campaign, 'groups') }
  }

  if (nextMode === MODE_IDS.HEAD_TO_HEAD) {
    return { matchups: getStoredRelationArray(campaign, 'matchups') }
  }

  return {}
}

export default function CampaignWizard() {
  const { appData, mergeAdminResponse, mergeMutationResponse } = useAppStore()
  const { campaigns, registryGroups, settings, createCampaign, saveCampaign, toggleCampaign: toggle, deleteCampaign: del } = useCampaigns()

  // Wizard state
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState(null)
  const [step, setStep] = useState(1)
  const [type, setType] = useState('')
  const [mode, setMode] = useState('')

  // Filtros de campañas
  const [filtroTipo, setFiltroTipo] = useState('todas')
  const [filtroEstado, setFiltroEstado] = useState('activas') // Por defecto solo activas/en-curso
  const [showInactive, setShowInactive] = useState(false) // Checkbox para mostrar finalizadas/próximas
  const [detailCampaign, setDetailCampaign] = useState(null)
  const [detailTab, setDetailTab] = useState('pronosticos')
  const handleDetailRefresh = useCallback((response = null) => {
    if (!response) return
    if (response.settings || response.registry || response.registryGroups || response.deletedEventIds) {
      mergeAdminResponse(response)
      return
    }
    mergeMutationResponse(response)
  }, [mergeAdminResponse, mergeMutationResponse])
  const events = appData?.events || []
  const programs = appData?.programs || []

  const [form, setForm] = useState(() => getInitialCampaignForm(settings))

  const modeRules = useMemo(() => getModeRules(mode), [mode])
  const canHaveFinal = MODES_WITH_FINAL.includes(mode)
  const alwaysHasFinal = mode === MODE_IDS.FINAL_QUALIFICATION
  const showFinalConfig = canHaveFinal ? form.hasFinalStage : alwaysHasFinal
  const isPointsMode = form.scoring === 'points'
  const weeklyParticipantCountEstimate = useMemo(() => (
    type === 'semanal'
      ? getCampaignGroupParticipantCount(appData?.registry || [], form.group)
      : 0
  ), [appData?.registry, form.group, type])
  const weeklyPairCountEstimate = useMemo(() => {
    if (type !== 'semanal') return 0
    const configuredPairs = countConfiguredPairs(editingCampaign)
    if (configuredPairs > 0) return configuredPairs
    return weeklyParticipantCountEstimate > 0 ? Math.ceil(weeklyParticipantCountEstimate / 2) : 0
  }, [editingCampaign, type, weeklyParticipantCountEstimate])
  const effectiveQualifiersCount = useMemo(() => {
    const configured = Number(form.qualifiersCount || 0)
    if (Number.isFinite(configured) && configured > 0) {
      return Math.round(configured)
    }
    return getDefaultFinalQualifiersCount(weeklyParticipantCountEstimate)
  }, [form.qualifiersCount, weeklyParticipantCountEstimate])
  const effectivePairQualifiersCount = useMemo(() => {
    const configured = Number(form.qualifiersCount || 0)
    if (Number.isFinite(configured) && configured > 0) {
      return Math.round(configured)
    }
    return getDefaultPairQualifiersCount(weeklyPairCountEstimate)
  }, [form.qualifiersCount, weeklyPairCountEstimate])
  const showQualifierCountConfig = type === 'semanal' && showFinalConfig && (
    mode === MODE_IDS.FINAL_QUALIFICATION ||
    mode === MODE_IDS.PAIRS
  )
  const qualifierCountAutoValue = mode === MODE_IDS.PAIRS
    ? effectivePairQualifiersCount
    : effectiveQualifiersCount
  const qualifierCountMax = mode === MODE_IDS.PAIRS
    ? weeklyPairCountEstimate
    : weeklyParticipantCountEstimate
  const groupQualifierInputs = useMemo(() => (
    mode === MODE_IDS.GROUPS
      ? buildNumberedGroupList(form.groupCount).map((group) => ({
        ...group,
        value: form.qualifiersByGroup?.[group.id] ?? form.qualifiersPerGroup,
      }))
      : []
  ), [form.groupCount, form.qualifiersByGroup, form.qualifiersPerGroup, mode])

  // Iconos SVG inline (fuera de hooks para evitar problemas)
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
    Edit: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>)
  }

  const TYPE_ICONS = { diaria: '📅', semanal: '📆', mensual: '🗓️' }
  const TYPE_COLORS = { diaria: '#10b981', semanal: '#3b82f6', mensual: '#8b5cf6' }

  // Aplanar todas las campañas con metadata
  const allCampaigns = useMemo(() => {
    const flattened = []
    const types = ['diaria', 'semanal', 'mensual']
    const today = getChileDateString()

    types.forEach(type => {
      (campaigns[type] || []).forEach(c => {
        const campaignEvents = collectCampaignEvents(events, { ...c, type })
        const participantCount = Math.max(
          Number(c?.participantCount || 0),
          countRegisteredParticipants(c?.registeredParticipants),
          countUniqueParticipants(campaignEvents)
        )
        const raceCount = getCampaignRaceCount({ ...c, type }, campaignEvents, programs)
        const estado = resolveCampaignStatus({
          campaign: { ...c, type, raceCount },
          appData,
          campaignEvents,
          today,
        })

        flattened.push({
          ...c,
          type,
          typeLabel: type.charAt(0).toUpperCase() + type.slice(1),
          icon: TYPE_ICONS[type],
          color: TYPE_COLORS[type],
          estado,
          participantCount,
          raceCount,
        })
      })
    })
    return flattened
  }, [appData, campaigns, events, programs])

  // Filtrar campañas
  const filteredCampaigns = useMemo(() => {
    let filtered = allCampaigns
    if (filtroTipo !== 'todas') filtered = filtered.filter(c => c.type === filtroTipo)
    
    if (!showInactive) {
      filtered = filtered.filter(c => c.estado === 'activa' || c.estado === 'en-curso')
    } else {
      if (filtroEstado === 'activas') filtered = filtered.filter(c => c.estado === 'activa')
      else if (filtroEstado === 'en-curso') filtered = filtered.filter(c => c.estado === 'en-curso' || c.estado === 'proxima')
      else if (filtroEstado === 'finalizadas') filtered = filtered.filter(c => c.estado === 'finalizada')
    }
    return filtered
  }, [allCampaigns, filtroTipo, filtroEstado, showInactive])

  // Conteos para filtros
  const counts = useMemo(() => {
    return {
      todas: allCampaigns.length,
      activa: allCampaigns.filter(c => c.estado === 'activa').length,
      enCurso: allCampaigns.filter(c => c.estado === 'en-curso').length,
      proxima: allCampaigns.filter(c => c.estado === 'proxima').length,
      finalizada: allCampaigns.filter(c => c.estado === 'finalizada').length
    }
  }, [allCampaigns])

  // Toggle campaign
  const handleToggleCampaign = useCallback(async (campaign) => {
    try {
      await toggle(campaign.type, campaign.id)
    } catch (err) {
      console.error('Error toggling campaign:', err)
    }
  }, [toggle])

  const handleDeleteCampaign = useCallback(async (campaign) => {
    if (!confirm(`¿Eliminar campaña "${campaign.name}"?`)) return
    try {
      await del(campaign.type, campaign.id)
    } catch (err) {
      console.error('Error deleting campaign:', err)
    }
  }, [del])

  const handleOpenDetail = useCallback((campaign, tab = 'pronosticos') => {
    setDetailCampaign(campaign)
    setDetailTab(tab)
  }, [])

  // Start editing a campaign
  const handleStartEditing = useCallback((campaign) => {
    const normalizedWeeklyCampaign = campaign.type === 'semanal'
      ? applyWeeklyModeConfig(campaign, appData?.settings?.weekly || {})
      : campaign
    const weeklyModeConfig = normalizedWeeklyCampaign.type === 'semanal'
      ? normalizeWeeklyModeConfig(normalizedWeeklyCampaign, appData?.settings?.weekly || {})
      : null
    const campaignDates = getCampaignFormDates(normalizedWeeklyCampaign, normalizedWeeklyCampaign.type)

    setIsEditing(true)
    setIsCreating(true)
    setEditingCampaign(normalizedWeeklyCampaign)
    setType(normalizedWeeklyCampaign.type)
    setMode(normalizedWeeklyCampaign.format || normalizedWeeklyCampaign.competitionMode || 'individual')
    setStep(3) // Go directly to config step since type and mode are known
    
    // Load campaign data into form
    setForm({
      ...getInitialCampaignForm(settings),
      name: normalizedWeeklyCampaign.name || '',
      date: campaignDates.date,
      startDate: campaignDates.startDate,
      endDate: campaignDates.endDate,
      hipodromos: normalizeCampaignTrackSelection(normalizedWeeklyCampaign.hipodromos || []),
      group: normalizedWeeklyCampaign.groupId || '',
      value: normalizedWeeklyCampaign.entryValue || 0,
      promoEnabled: normalizedWeeklyCampaign.promoEnabled || false,
      promoPrice: normalizedWeeklyCampaign.promoPrice || 0,
      raceCount: normalizedWeeklyCampaign.raceCount || 12,
      scoring: normalizedWeeklyCampaign.scoring?.mode || 'dividend',
      pointsFirst: normalizedWeeklyCampaign.scoring?.points?.first || 10,
      pointsSecond: normalizedWeeklyCampaign.scoring?.points?.second || 5,
      pointsThird: normalizedWeeklyCampaign.scoring?.points?.third || 1,
      pointsExclusiveFirst: normalizedWeeklyCampaign.scoring?.points?.exclusiveFirst || 20,
      doubleLastRace: normalizedWeeklyCampaign.scoring?.doubleLastRace || false,
      activeDays: weeklyModeConfig?.activeDays || ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
      hasFinalStage: weeklyModeConfig?.hasFinalStage || false,
      finalDays: weeklyModeConfig?.finalDays || [],
      groupCount: weeklyModeConfig?.groupCount || 4,
      groupSize: weeklyModeConfig?.groupSize || 8,
      qualifiersPerGroup: weeklyModeConfig?.qualifiersPerGroup || 4,
      qualifiersByGroup: weeklyModeConfig?.qualifiersByGroup || {},
      qualifiersCount: weeklyModeConfig?.qualifiersCount || '',
      eliminatePerDay: weeklyModeConfig?.eliminatePerDay || 1,
      ...getDefaultCampaignStyleForm(normalizedWeeklyCampaign),
    })
  }, [appData?.settings?.weekly, settings])

  // Cancel editing
  const handleCancelEditing = useCallback(() => {
    setIsEditing(false)
    setEditingCampaign(null)
    setIsCreating(false)
    setStep(1)
    setType('')
    setMode('')
    setForm(getInitialCampaignForm(settings))
  }, [settings])

  const handleCancelCreating = useCallback(() => {
    setIsCreating(false)
    setIsEditing(false)
    setEditingCampaign(null)
    setStep(1)
    setType('')
    setMode('')
    setForm(getInitialCampaignForm(settings))
  }, [settings])

  const handleSelectType = useCallback((nextType) => {
    if (nextType === type) return
    const dateRange = getDefaultDateRange(nextType)
    setType(nextType)
    setForm((current) => ({
      ...current,
      date: getChileDateString(),
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    }))
  }, [type])

  // Helpers
  const updateForm = useCallback((updates) => {
    setForm(prev => ({ ...prev, ...updates }))
  }, [])

  const updateQualifierByGroup = useCallback((groupId, value) => {
    setForm((prev) => ({
      ...prev,
      qualifiersByGroup: {
        ...(prev.qualifiersByGroup || {}),
        [groupId]: value,
      },
    }))
  }, [])

  const toggleDia = useCallback((dia) => {
    setForm(prev => {
      const exists = prev.activeDays.includes(dia)
      return {
        ...prev,
        activeDays: exists ? prev.activeDays.filter(d => d !== dia) : [...prev.activeDays, dia]
      }
    })
  }, [])

  const toggleHipodromo = useCallback((h) => {
    setForm(prev => {
      const exists = prev.hipodromos.includes(h)
      return {
        ...prev,
        hipodromos: exists ? prev.hipodromos.filter(hh => hh !== h) : [...prev.hipodromos, h]
      }
    })
  }, [])

  // Validación por paso
  const canProceed = useMemo(() => {
    if (step === 1) return !!type
    if (step === 2) return !!mode
    if (step === 3) {
      if (!form.name) return false
      if (type === 'diaria' && !form.date) return false
      if ((type === 'semanal' || type === 'mensual') && (!form.startDate || !form.endDate)) return false
      if (type === 'mensual' && form.hipodromos.length === 0) return false
      if (mode === MODE_IDS.GROUPS && (!form.groupCount || form.groupCount < 1 || !form.groupSize || form.groupSize < 2)) return false
      if (mode === MODE_IDS.PROGRESSIVE_ELIMINATION && (!form.eliminatePerDay || form.eliminatePerDay < 1)) return false
      return true
    }
    if (step === 4) return true
    return true
  }, [step, type, mode, form, showFinalConfig])

  // Submit
  const handleSubmit = async () => {
    try {
      const stylePayload = buildCampaignStylePayload(form)
      const campaignData = {
        id: editingCampaign?.id, // Include ID for edit mode
        name: form.name,
        groupId: form.group,
        raceCount: parseInt(form.raceCount) || 12,
        entryValue: Number(form.value) || 0,
        promoEnabled: form.promoEnabled,
        promoPrice: Number(form.promoPrice) || 0,
        format: mode,
        competitionMode: mode,
        style: stylePayload,
        theme: getLegacyThemeFromRankingTheme(stylePayload.rankingTheme),
        exportStyle: stylePayload.pngTheme,
        customColors: stylePayload.pngTheme === 'custom' ? stylePayload.pngColors : undefined,
        enabled: editingCampaign?.enabled !== false, // Keep enabled status when editing
        scoring: {
          mode: form.scoring,
          doubleLastRace: form.scoring === 'dividend' ? form.doubleLastRace : false,
          points: {
            first: Number(form.pointsFirst) || 10,
            second: Number(form.pointsSecond) || 5,
            third: Number(form.pointsThird) || 1,
            exclusiveFirst: Number(form.pointsExclusiveFirst) || 20,
          }
        }
      }

      if (type === 'diaria') {
        campaignData.date = form.date
      } else if (type === 'semanal') {
        const preservedRelationConfig = getPreservedWeeklyRelationConfig(editingCampaign, mode)
        const weeklyCampaignData = applyWeeklyModeConfig({
          format: mode,
          competitionMode: mode,
          startDate: form.startDate,
          endDate: form.endDate,
          activeDays: form.activeDays,
          hasFinalStage: showFinalConfig,
          finalDays: showFinalConfig ? form.finalDays : [],
          groupCount: mode === MODE_IDS.GROUPS ? parseInt(form.groupCount) : undefined,
          groupSize: parseInt(form.groupSize),
          qualifiersPerGroup: parseInt(form.qualifiersPerGroup),
          qualifiersByGroup: mode === MODE_IDS.GROUPS
            ? buildQualifiersByGroupPayload(form.groupCount, form.qualifiersByGroup, form.qualifiersPerGroup)
            : undefined,
          qualifiersCount: showQualifierCountConfig
            ? (
              Number(form.qualifiersCount) > 0
                ? parseInt(form.qualifiersCount)
                : (mode === MODE_IDS.PAIRS
                  ? getDefaultPairQualifiersCount(weeklyPairCountEstimate)
                  : getDefaultFinalQualifiersCount(weeklyParticipantCountEstimate))
            )
            : undefined,
          eliminatePerDay: mode === MODE_IDS.PROGRESSIVE_ELIMINATION ? parseInt(form.eliminatePerDay) : undefined,
          pairMode: mode === MODE_IDS.PAIRS,
          ...preservedRelationConfig,
        }, settings.weekly || {})

        campaignData.startDate = weeklyCampaignData.startDate
        campaignData.endDate = weeklyCampaignData.endDate
        campaignData.modeConfig = weeklyCampaignData.modeConfig
        campaignData.activeDays = weeklyCampaignData.activeDays
        campaignData.finalDays = weeklyCampaignData.finalDays
        campaignData.hasFinalStage = weeklyCampaignData.hasFinalStage
        campaignData.groupCount = weeklyCampaignData.groupCount
        campaignData.groupSize = weeklyCampaignData.groupSize
        campaignData.qualifiersPerGroup = weeklyCampaignData.qualifiersPerGroup
        campaignData.qualifiersByGroup = weeklyCampaignData.qualifiersByGroup
        campaignData.qualifiersCount = weeklyCampaignData.qualifiersCount
        campaignData.pairMode = weeklyCampaignData.pairMode
        campaignData.eliminatePerDay = weeklyCampaignData.eliminatePerDay
        campaignData.groups = weeklyCampaignData.groups
        campaignData.pairs = weeklyCampaignData.pairs
        campaignData.matchups = weeklyCampaignData.matchups
      } else {
        campaignData.hipodromos = normalizeCampaignTrackSelection(form.hipodromos)
        campaignData.startDate = form.startDate
        campaignData.endDate = form.endDate
        campaignData.selectedEventIds = buildMonthlySelectedEventIds(
          { ...campaignData, type, hipodromos: campaignData.hipodromos },
          appData,
          [...(settings.monthly?.selectedEventIds || [])]
        )
      }

      const nameConflict = findCampaignNameConflict(
        campaigns[type] || [],
        type,
        campaignData,
        editingCampaign?.id,
      )
      if (nameConflict) {
        alert(`Ya existe una campaña llamada "${nameConflict.name}" para ese mismo periodo. Usa otro nombre o edita la campaña existente.`)
        return
      }

      if (editingCampaign?.id) {
        await saveCampaign(type, campaignData)
      } else {
        await createCampaign(type, campaignData)
      }

      // Reset and go back to campaigns list
      setIsCreating(false)
      setIsEditing(false)
      setEditingCampaign(null)
      setStep(1)
      setType('')
      setMode('')
      setForm(getInitialCampaignForm(settings))
    } catch (err) {
      alert(`Error al ${editingCampaign ? 'editar' : 'crear'} campaña: ` + err.message)
    }
  }

  const handleStartCreating = () => {
    setIsEditing(false)
    setEditingCampaign(null)
    setIsCreating(true)
    setStep(1)
    setType('')
    setMode('')
    setForm(getInitialCampaignForm(settings))
  }

  // Show campaigns list if not creating
  if (!isCreating) {

    return (
      <div className={styles.wizard}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Campañas</h1>
            <p className={styles.subtitle}>Administra tus campañas diarias, semanales y mensuales</p>
          </div>
          <button className={styles.createBtnLarge} onClick={handleStartCreating}>
            <Icons.Plus /> Nueva Campaña
          </button>
        </header>

        {/* FILTROS */}
        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <Icons.Filter />
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', marginRight: '4px' }}>Tipo:</span>
            {[
              { id: 'todas', label: 'Todas', count: counts.todas },
              { id: 'diaria', label: 'Diaria', count: counts.diaria },
              { id: 'semanal', label: 'Semanal', count: counts.semanal },
              { id: 'mensual', label: 'Mensual', count: counts.mensual }
            ].map(f => (
              <button
                key={f.id}
                className={`${styles.filterBtn} ${filtroTipo === f.id ? styles.filterActive : ''}`}
                onClick={() => setFiltroTipo(f.id)}
              >
                {f.label}
                <span className={styles.filterCount}>{f.count}</span>
              </button>
            ))}
          </div>
          
          {/* Checkbox para mostrar campañas inactivas */}
          <div className={styles.filterGroup}>
            <label className={styles.showInactiveLabel}>
              <input
                type="checkbox"
                checked={showInactive}
                onChange={e => setShowInactive(e.target.checked)}
              />
              <span>Mostrar finalizadas y próximas</span>
            </label>
          </div>

          {/* Filtro de estado (solo visible si showInactive está activo) */}
          {showInactive && (
            <div className={styles.filterGroup}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', marginRight: '4px' }}>Estado:</span>
              {[
                { id: 'todas', label: 'Todas', count: counts.todas },
                { id: 'activas', label: 'Activas', count: counts.activa },
                { id: 'en-curso', label: 'En curso', count: counts.enCurso + counts.proxima },
                { id: 'finalizadas', label: 'Finalizadas', count: counts.finalizada }
              ].map(f => (
                <button
                  key={f.id}
                  className={`${styles.filterBtn} ${filtroEstado === f.id ? styles.filterActive : ''}`}
                  onClick={() => setFiltroEstado(f.id)}
                >
                  {f.label}
                  <span className={styles.filterCount}>{f.count}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* GRID DE CARDS */}
        {filteredCampaigns.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>📋</span>
            {!showInactive ? (
              <>
                <p>No hay campañas activas o en curso{filtroTipo !== 'todas' ? ` de tipo ${filtroTipo}` : ''}</p>
                <p className={styles.emptyHint}>
                  <label className={styles.emptyHintLabel}>
                    <input
                      type="checkbox"
                      checked={showInactive}
                      onChange={e => setShowInactive(e.target.checked)}
                    />
                    Mostrar finalizadas y próximas
                  </label>
                </p>
              </>
            ) : (
              <p>No hay campañas {filtroEstado !== 'todas' ? filtroEstado : ''} {filtroTipo !== 'todas' ? filtroTipo : ''}</p>
            )}
            <button className={styles.createBtnLarge} onClick={handleStartCreating}>
              <Icons.Plus /> Crear primera campaña
            </button>
          </div>
        ) : (
          <div className={styles.cardsGrid}>
            {filteredCampaigns.map(c => {
              const estadoConfig = {
                'activa': { label: 'Activa', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
                'proxima': { label: 'Próxima', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
                'en-curso': { label: 'En curso', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
                'finalizada': { label: 'Finalizada', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' }
              }
              const estado = estadoConfig[c.estado] || estadoConfig['finalizada']
              const groupName = registryGroups.find(g => g.id === c.groupId)?.name || 'Todos'
              const dateLabel = formatCampaignDateLabel(c)
              const hipodromosLabel = formatCampaignHipodromosLabel(c)
              const finalStageLabel = formatCampaignFinalStageLabel(c)

              return (
                <div key={`${c.type}-${c.id}`} className={styles.campaignCardModern} style={{ borderTopColor: c.color }}>
                  {/* Header */}
                  <div className={styles.cardHeader}>
                    <div className={styles.cardHeaderLeft}>
                      <span className={styles.cardIcon}>{c.icon}</span>
                      <div>
                        <h3 className={styles.cardTitle}>{c.name}</h3>
                        <div className={styles.cardSubtitle}>
                          <span className={styles.typeBadge} style={{ background: c.color }}>{c.typeLabel}</span>
                          {c.date && (
                            <span className={styles.dateText}>
                              <Icons.Calendar /> {new Date(c.date + 'T12:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className={styles.statusBadge} style={{ background: estado.bg, color: estado.color }}>{estado.label}</span>
                  </div>

                  {/* Metrics */}
                  <div className={styles.metrics}>
                    <div className={styles.metric}>
                      <Icons.Users />
                      <div>
                        <span className={styles.metricValue}>{c.participantCount}</span>
                        <span className={styles.metricLabel}>Participantes</span>
                      </div>
                    </div>
                    <div className={styles.metric}>
                      <Icons.Target />
                      <div>
                        <span className={styles.metricValue}>{c.raceCount || 12}</span>
                        <span className={styles.metricLabel}>Carreras</span>
                      </div>
                    </div>
                    <div className={styles.metric}>
                      <Icons.TrendingUp />
                      <div>
                        <span className={styles.metricValue}>{c.entryValue ? `$${Number(c.entryValue).toLocaleString('es-CL')}` : '-'}</span>
                        <span className={styles.metricLabel}>Valor</span>
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className={styles.cardInfo}>
                    {dateLabel && (
                      <div className={styles.infoRow}>
                        <Icons.Calendar />
                        <span>{dateLabel}</span>
                      </div>
                    )}
                    <div className={styles.infoRow}>
                      <Icons.MapPin />
                      <span>{groupName}</span>
                    </div>
                    {finalStageLabel && (
                      <div className={styles.infoRow}>
                        <Icons.Trophy />
                        <span>{finalStageLabel}</span>
                      </div>
                    )}
                    {c.type === 'mensual' && hipodromosLabel && (
                      <div className={styles.infoRow}>
                        <Icons.MapPin />
                        <span>Hipodromos: {hipodromosLabel}</span>
                      </div>
                    )}
                    {c.type === 'mensual' && (
                      <div className={styles.infoRow}>
                        <Icons.Calendar />
                        <span>{formatEligibleDatesLabel(getCampaignEligibleDateList(c, appData))}</span>
                      </div>
                    )}
                    {c.promoEnabled && (
                      <div className={styles.infoRow}>
                        <span className={styles.promoBadge}>PROMO 2x</span>
                        {c.promoPrice && <span>${Number(c.promoPrice).toLocaleString('es-CL')}</span>}
                      </div>
                    )}
                    <div className={styles.infoRow}>
                      <Icons.Trophy />
                      <span>
                        {c.scoring?.mode === 'points' 
                          ? `Puntos (${c.scoring?.points?.first || 10}/${c.scoring?.points?.second || 5})`
                          : c.scoring?.doubleLastRace 
                            ? 'Dividendo + última x2'
                            : 'Dividendo'
                        }
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className={styles.cardActions}>
                    <button className={styles.actionBtn} title="Ver pronósticos" onClick={() => handleOpenDetail(c, 'pronosticos')}><Icons.Eye /> Pronósticos</button>
                    <button className={styles.actionBtn} title="Ver participantes" onClick={() => handleOpenDetail(c, 'participantes')}><Icons.Users /> Participantes</button>
                    <button className={styles.actionBtn} title="Ver ranking" onClick={() => handleOpenDetail(c, 'ranking')}><Icons.Trophy /> Ranking</button>
                    <button className={styles.actionBtn} title="Ver premios" onClick={() => handleOpenDetail(c, 'premios')}><Icons.Award /> Premios</button>
                    <button className={styles.actionBtn} title="Ver resultados" onClick={() => handleOpenDetail(c, 'resultados')}><Icons.List /> Resultados</button>
                    <button
                      className={`${styles.actionBtn} ${styles.editBtn}`}
                      onClick={() => handleStartEditing(c)}
                      title="Editar campaña"
                    >
                      <Icons.Edit /> Editar
                    </button>
                    <button
                      className={`${styles.actionBtn} ${styles.toggleBtn}`}
                      onClick={() => handleToggleCampaign(c)}
                    >
                      {c.enabled ? <><Icons.X /> Desactivar</> : <><Icons.Check /> Activar</>}
                    </button>
                    <button
                      className={`${styles.actionBtn} ${styles.dangerBtn}`}
                      onClick={() => handleDeleteCampaign(c)}
                      title="Eliminar"
                    >
                      <Icons.Trash />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        {detailCampaign && (
          <CampaignDetailModal
            campaign={detailCampaign}
            initialTab={detailTab}
            registryGroups={registryGroups}
            onRefresh={handleDetailRefresh}
            onClose={() => setDetailCampaign(null)}
          />
        )}
      </div>
    )
  }

  // Show wizard form when creating
  return (
    <div className={styles.wizard}>
      {/* Header */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{isEditing ? '✏️ Editar Campaña' : 'Nueva Campaña'}</h1>
          <p className={styles.subtitle}>
            {isEditing 
              ? `Editando: ${editingCampaign?.name}` 
              : 'Configuración guiada paso a paso'}
          </p>
        </div>
        {isEditing && (
          <button className={styles.cancelEditBtn} onClick={handleCancelEditing}>
            ✕ Cancelar edición
          </button>
        )}
      </header>

      {/* Progress */}
      <div className={styles.progress}>
        {[
          { num: 1, label: 'Tipo' },
          { num: 2, label: 'Modo' },
          { num: 3, label: 'Configuración' },
          { num: 4, label: 'Estilo' },
        ].map(s => (
          <div key={s.num} className={`${styles.progressStep} ${step >= s.num ? styles.active : ''} ${step > s.num ? styles.completed : ''}`}>
            <span className={styles.progressNum}>{step > s.num ? '✓' : s.num}</span>
            <span className={styles.progressLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Step 1: Tipo */}
      {step === 1 && (
        <div className={styles.step}>
          <h2 className={styles.stepTitle}>¿Qué tipo de campaña querés crear?</h2>
          <p className={styles.stepHint}>Esto define el rango de tiempo y la estructura base.</p>
          <div className={styles.typeGrid}>
            {[
              { id: 'diaria', icon: '📅', label: 'Diaria', desc: 'Una jornada puntual. Ideal para días con carrera.' },
              { id: 'semanal', icon: '📆', label: 'Semanal', desc: 'Múltiples días de competencia. Con o sin final.' },
              { id: 'mensual', icon: '🗓️', label: 'Mensual', desc: 'Campaña de largo plazo. Varios hipódromos y jornadas.' },
            ].map(t => (
              <button
                key={t.id}
                className={`${styles.typeCard} ${type === t.id ? styles.selected : ''}`}
                onClick={() => handleSelectType(t.id)}
              >
                <span className={styles.typeIcon}>{t.icon}</span>
                <span className={styles.typeLabel}>{t.label}</span>
                <span className={styles.typeDesc}>{t.desc}</span>
              </button>
            ))}
          </div>
          <div className={styles.stepActions}>
            <button className={styles.nextBtn} disabled={!canProceed} onClick={() => setStep(2)}>
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Modo */}
      {step === 2 && (
        <div className={styles.step}>
          <h2 className={styles.stepTitle}>¿Cómo van a competir los participantes?</h2>
          <p className={styles.stepHint}>Esto define la lógica de agrupación, clasificación y eliminación.</p>
          <div className={styles.modeGrid}>
            {getModeOptions().map(opt => (
              <button
                key={opt.id}
                className={`${styles.modeCard} ${mode === opt.id ? styles.selected : ''}`}
                onClick={() => setMode(opt.id)}
              >
                <span className={styles.modeIcon}>{getModeIcon(opt.id)}</span>
                <span className={styles.modeLabel}>{opt.label}</span>
                <span className={styles.modeDesc}>{MODE_DESCRIPTIONS[opt.id]}</span>
              </button>
            ))}
          </div>
          <div className={styles.stepActions}>
            <button className={styles.backBtn} onClick={() => setStep(1)}>← Atrás</button>
            <button className={styles.nextBtn} disabled={!canProceed} onClick={() => setStep(3)}>
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Configuración dinámica */}
      {step === 3 && (
        <div className={styles.step}>
          <h2 className={styles.stepTitle}>Configuración de la campaña</h2>
          <p className={styles.stepHint}>
            {type === 'diaria' && 'Campaña diaria'}
            {type === 'semanal' && `Campaña semanal — Modo: ${MODE_LABELS[mode]}`}
            {type === 'mensual' && 'Campaña mensual'}
          </p>

          <div className={styles.configGrid}>
            {/* Nombre */}
            <div className={styles.field}>
              <label className={styles.label}>Nombre</label>
              <input
                className={styles.input}
                value={form.name}
                onChange={e => updateForm({ name: e.target.value })}
                placeholder={`Ej: ${type} — ${new Date().toLocaleDateString('es-CL')}`}
              />
            </div>

            {/* Fecha (diaria) */}
            {type === 'diaria' && (
              <div className={styles.field}>
                <label className={styles.label}>Fecha</label>
                <input
                  className={styles.input}
                  type="date"
                  value={form.date}
                  onChange={e => updateForm({ date: e.target.value })}
                />
              </div>
            )}

            {/* Rango de fechas (semanal/mensual) */}
            {(type === 'semanal' || type === 'mensual') && (
              <>
                <div className={styles.field}>
                  <label className={styles.label}>Fecha inicio</label>
                  <input
                    className={styles.input}
                    type="date"
                    value={form.startDate}
                    onChange={e => updateForm({ startDate: e.target.value })}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Fecha fin</label>
                  <input
                    className={styles.input}
                    type="date"
                    value={form.endDate}
                    onChange={e => updateForm({ endDate: e.target.value })}
                  />
                </div>
              </>
            )}

            {/* Hipódromos (mensual) */}
            {type === 'mensual' && (
              <div className={styles.fieldFull}>
                <label className={styles.label}>Hipódromos</label>
                <div className={styles.checkGrid}>
                  {HIPODROMOS.map(h => (
                    <label key={h} className={styles.checkChip}>
                      <input
                        type="checkbox"
                        checked={form.hipodromos.includes(h)}
                        onChange={() => toggleHipodromo(h)}
                      />
                      {h}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Días activos (semanal) */}
            {type === 'semanal' && !showFinalConfig && (
              <div className={styles.fieldFull}>
                <label className={styles.label}>Días que se juegan</label>
                <div className={styles.checkGrid}>
                  {DIAS_SEMANA.map(d => (
                    <label key={d} className={styles.checkChip}>
                      <input
                        type="checkbox"
                        checked={form.activeDays.includes(d)}
                        onChange={() => toggleDia(d)}
                      />
                      {d}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Días de clasificación (semanal con final) */}
            {type === 'semanal' && showFinalConfig && (
              <>
                <div className={styles.fieldFull}>
                  <label className={styles.label}>Días de clasificación</label>
                  <div className={styles.checkGrid}>
                    {DIAS_SEMANA.map(d => (
                      <label key={d} className={styles.checkChip}>
                        <input
                          type="checkbox"
                          checked={form.activeDays.includes(d)}
                          onChange={() => toggleDia(d)}
                        />
                        {d}
                      </label>
                    ))}
                  </div>
                </div>
                <div className={styles.fieldFull}>
                  <label className={styles.label}>Días de final (opcional)</label>
                  <div className={styles.checkGrid}>
                    {DIAS_SEMANA.map(d => (
                      <label key={d} className={styles.checkChip}>
                        <input
                          type="checkbox"
                          checked={form.finalDays.includes(d)}
                          onChange={() => {
                            const exists = form.finalDays.includes(d)
                            updateForm({
                              finalDays: exists ? form.finalDays.filter(dd => dd !== d) : [...form.finalDays, d]
                            })
                          }}
                        />
                        {d}
                      </label>
                    ))}
                  </div>
                  <p className={styles.hint}>Si lo dejas vacío, todas las jornadas se tratan como clasificación.</p>
                </div>
              </>
            )}

            {/* ¿Tiene final? (solo modos que lo permiten) */}
            {canHaveFinal && (
              <div className={styles.field}>
                <label className={styles.checkChipLarge}>
                  <input
                    type="checkbox"
                    checked={form.hasFinalStage}
                    onChange={e => updateForm({ hasFinalStage: e.target.checked })}
                  />
                  <span>¿Tiene fase final?</span>
                </label>
                <p className={styles.hint}>Si activás la final, se agregarán campos para definir días de clasificación y final.</p>
              </div>
            )}

            {showQualifierCountConfig && (
              <div className={styles.field}>
                <label className={styles.label}>
                  {mode === MODE_IDS.PAIRS ? 'Parejas que pasan a la final' : 'Clasifican a la final'}
                </label>
                <input
                  className={styles.input}
                  type="number"
                  value={form.qualifiersCount}
                  onChange={e => updateForm({ qualifiersCount: e.target.value })}
                  min={1}
                  max={qualifierCountMax || undefined}
                  placeholder={qualifierCountAutoValue ? `Auto: ${qualifierCountAutoValue}` : 'Auto: mitad de los inscritos'}
                />
                {mode === MODE_IDS.PAIRS ? (
                  <p className={styles.hint}>
                    {weeklyPairCountEstimate > 0
                      ? `Con ${weeklyPairCountEstimate} parejas estimadas, pasarian ${effectivePairQualifiersCount ?? 0} parejas si usas la regla automatica.`
                      : 'Si lo dejas vacio, pasara automaticamente la mitad de las parejas configuradas.'}
                  </p>
                ) : (
                <p className={styles.hint}>
                  {weeklyParticipantCountEstimate > 0
                    ? `Con ${weeklyParticipantCountEstimate} participantes del grupo, pasarÃ­an ${effectiveQualifiersCount ?? 0} a la final si usas la regla automÃ¡tica.`
                    : 'Si lo dejas vacÃ­o, pasarÃ¡ automÃ¡ticamente la mitad de los participantes inscritos en la campaÃ±a.'}
                </p>
                )}
              </div>
            )}

            {/* Campos por modo */}
            {mode === MODE_IDS.GROUPS && (
              <>
                <div className={styles.field}>
                  <label className={styles.label}>Cantidad de grupos</label>
                  <input
                    className={styles.input}
                    type="number"
                    value={form.groupCount}
                    onChange={e => updateForm({ groupCount: e.target.value })}
                    min={1}
                    max={20}
                  />
                  <p className={styles.hint}>{`Se crear\u00e1n las opciones Grupo 1 hasta Grupo ${form.groupCount || 1}.`}</p>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Tamaño de grupo</label>
                  <input
                    className={styles.input}
                    type="number"
                    value={form.groupSize}
                    onChange={e => updateForm({ groupSize: e.target.value })}
                    min={2}
                    max={20}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Clasifican por grupo (defecto)</label>
                  <input
                    className={styles.input}
                    type="number"
                    value={form.qualifiersPerGroup}
                    onChange={e => updateForm({ qualifiersPerGroup: e.target.value })}
                    min={1}
                    max={10}
                  />
                  <p className={styles.hint}>Se usa cuando un grupo no tiene un valor propio.</p>
                </div>
                <div className={styles.fieldFull}>
                  <label className={styles.label}>Clasificados especificos por grupo</label>
                  <div className={styles.groupQualifierGrid}>
                    {groupQualifierInputs.map((group) => (
                      <label key={group.id} className={styles.groupQualifierItem}>
                        <span>{group.name}</span>
                        <input
                          className={styles.input}
                          type="number"
                          value={group.value}
                          onChange={e => updateQualifierByGroup(group.id, e.target.value)}
                          min={1}
                          max={50}
                        />
                      </label>
                    ))}
                  </div>
                  <p className={styles.hint}>Ejemplo: Grupo 1 = 7 y Grupo 2 = 6.</p>
                </div>
              </>
            )}

            {mode === MODE_IDS.PROGRESSIVE_ELIMINATION && (
              <div className={styles.field}>
                <label className={styles.label}>Eliminados por día</label>
                <input
                  className={styles.input}
                  type="number"
                  value={form.eliminatePerDay}
                  onChange={e => updateForm({ eliminatePerDay: e.target.value })}
                  min={1}
                />
              </div>
            )}

            {/* Grupo asociado */}
            <div className={styles.field}>
              <label className={styles.label}>Grupo asociado</label>
              <select
                className={styles.select}
                value={form.group}
                onChange={e => updateForm({ group: e.target.value })}
              >
                <option value="">Todos los participantes</option>
                {registryGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>

            {/* Valor */}
            <div className={styles.field}>
              <label className={styles.label}>Valor de la polla ($)</label>
              <input
                className={styles.input}
                type="number"
                value={form.value}
                onChange={e => updateForm({ value: e.target.value })}
                min="0"
                step="100"
                placeholder="Ej: 5000"
              />
            </div>

            {/* Promo */}
            <div className={styles.field}>
              <label className={styles.checkChipLarge}>
                <input
                  type="checkbox"
                  checked={form.promoEnabled}
                  onChange={e => updateForm({ promoEnabled: e.target.checked })}
                />
                <span>Activar promoción 2x</span>
              </label>
            </div>

            {form.promoEnabled && (
              <div className={styles.field}>
                <label className={styles.label}>Valor promo 2x ($)</label>
                <input
                  className={styles.input}
                  type="number"
                  value={form.promoPrice}
                  onChange={e => updateForm({ promoPrice: e.target.value })}
                  min="0"
                  step="100"
                  placeholder="Ej: 9000"
                />
              </div>
            )}

            {/* Scoring */}
            <div className={styles.field}>
              <label className={styles.label}>Tipo de puntuación</label>
              <select
                className={styles.select}
                value={form.scoring}
                onChange={e => updateForm({ scoring: e.target.value })}
              >
                <option value="dividend">Por dividendo</option>
                <option value="points">Por puntos</option>
              </select>
            </div>

            {/* Points config */}
            {isPointsMode && (
              <div className={styles.pointsConfig}>
                <p className={styles.pointsTitle}>Configuración de puntos</p>
                <div className={styles.pointsGrid}>
                  <div className={styles.pointField}>
                    <label className={styles.label}>1° lugar</label>
                    <input className={styles.input} type="number" value={form.pointsFirst} onChange={e => updateForm({ pointsFirst: e.target.value })} min="0" />
                  </div>
                  <div className={styles.pointField}>
                    <label className={styles.label}>2° lugar</label>
                    <input className={styles.input} type="number" value={form.pointsSecond} onChange={e => updateForm({ pointsSecond: e.target.value })} min="0" />
                  </div>
                  <div className={styles.pointField}>
                    <label className={styles.label}>3° lugar</label>
                    <input className={styles.input} type="number" value={form.pointsThird} onChange={e => updateForm({ pointsThird: e.target.value })} min="0" />
                  </div>
                  <div className={styles.pointField}>
                    <label className={styles.label}>Exclusivo 1°</label>
                    <input className={styles.input} type="number" value={form.pointsExclusiveFirst} onChange={e => updateForm({ pointsExclusiveFirst: e.target.value })} min="0" />
                  </div>
                </div>
              </div>
            )}

            {/* Double last race */}
            {!isPointsMode && (
              <div className={styles.field}>
                <label className={styles.checkChipLarge}>
                  <input
                    type="checkbox"
                    checked={form.doubleLastRace}
                    onChange={e => updateForm({ doubleLastRace: e.target.checked })}
                  />
                  <span>Última carrera x2 en dividendos</span>
                </label>
              </div>
            )}

            {/* Carreras */}
            <div className={styles.field}>
              <label className={styles.label}>Carreras por jornada</label>
              <input
                className={styles.input}
                type="number"
                value={form.raceCount}
                onChange={e => updateForm({ raceCount: e.target.value })}
                min="1"
                max="30"
              />
            </div>

          </div>

          <div className={styles.stepActions}>
            <button className={styles.cancelBtn} onClick={isEditing ? handleCancelEditing : handleCancelCreating}>{isEditing ? 'Cancelar edición' : 'Cancelar'}</button>
            <button className={styles.backBtn} onClick={() => setStep(2)}>← Atrás</button>
            <button className={styles.nextBtn} disabled={!canProceed} onClick={() => setStep(4)}>
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className={styles.step}>
          <h2 className={styles.stepTitle}>Estilo de tablas y ranking</h2>
          <p className={styles.stepHint}>Elige un formato rápido y ajusta cómo se verán el ranking y las imágenes PNG.</p>

          <CampaignStyleStep form={form} updateForm={updateForm} />

          <div className={styles.stepActions}>
            <button className={styles.cancelBtn} onClick={isEditing ? handleCancelEditing : handleCancelCreating}>{isEditing ? 'Cancelar edición' : 'Cancelar'}</button>
            <button className={styles.backBtn} onClick={() => setStep(3)}>← Atrás</button>
            <button className={styles.createBtn} disabled={!canProceed} onClick={handleSubmit}>
              {isEditing ? '💾 Guardar Cambios' : '✓ Crear Campaña'}
            </button>
          </div>
        </div>
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

function formatEligibleDatesLabel(dates = []) {
  if (!Array.isArray(dates) || dates.length === 0) return 'Sin jornadas detectadas en calendario'
  const visible = dates.map(formatShortDate)
  return `${dates.length} jornada${dates.length === 1 ? '' : 's'} · ${visible.join(', ')}`
}

function formatCampaignDateLabel(campaign) {
  if (!campaign) return ''

  if (campaign.type === 'diaria') {
    const date = formatFullDate(campaign.date)
    return date ? `Fecha: ${date}` : ''
  }

  const start = formatFullDate(campaign.startDate)
  const end = formatFullDate(campaign.endDate)

  if (start && end) return start === end ? `Fecha: ${start}` : `Rango: ${start} al ${end}`
  if (start) return `Desde: ${start}`
  if (end) return `Hasta: ${end}`
  return ''
}

function formatCampaignHipodromosLabel(campaign) {
  const hipodromos = normalizeCampaignTrackSelection(campaign?.hipodromos || [])
  return hipodromos.join(', ')
}

function formatCampaignFinalStageLabel(campaign) {
  if (campaign?.type !== 'semanal') return ''
  const config = normalizeWeeklyModeConfig(campaign)
  if (!config.hasFinalStage) return 'Fase final: No'
  if (config.finalDays.length === 0) return 'Fase final: S\u00ed (d\u00edas no definidos)'
  return `Fase final: S\u00ed \u00b7 ${config.finalDays.join(', ')}`
}

function formatFullDate(value) {
  const [year, month, day] = String(value || '').split('-')
  if (!year || !month || !day) return ''
  return `${day}-${month}-${year}`
}

function formatShortDate(value) {
  const [year, month, day] = String(value || '').split('-')
  if (!year || !month || !day) return value
  return `${day}-${month}`
}

function findCampaignNameConflict(campaigns = [], type, candidate = {}, excludeId = '') {
  const candidateName = normalizeCampaignName(candidate.name)
  if (!candidateName) return null

  return (campaigns || []).find((campaign) => (
    String(campaign?.id || '') !== String(excludeId || '') &&
    campaign?.enabled !== false &&
    normalizeCampaignName(campaign?.name) === candidateName &&
    campaignPeriodsOverlap(type, campaign, candidate)
  )) || null
}

function normalizeCampaignName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function campaignPeriodsOverlap(type, left = {}, right = {}) {
  if (type === 'diaria') {
    const leftDate = normalizeCampaignDate(left.date)
    const rightDate = normalizeCampaignDate(right.date)
    return !leftDate || !rightDate || leftDate === rightDate
  }

  const leftRange = getCampaignDateRange(type, left)
  const rightRange = getCampaignDateRange(type, right)
  if (!leftRange.start || !leftRange.end || !rightRange.start || !rightRange.end) return true
  return leftRange.start <= rightRange.end && rightRange.start <= leftRange.end
}

function getCampaignDateRange(type, campaign = {}) {
  if (type === 'semanal' || type === 'mensual') {
    const start = normalizeCampaignDate(campaign.startDate)
    const end = normalizeCampaignDate(campaign.endDate) || start
    return { start, end }
  }

  const date = normalizeCampaignDate(campaign.date)
  return { start: date, end: date }
}

function normalizeCampaignDate(value) {
  const text = String(value || '').trim()
  const iso = text.match(/\b\d{4}-\d{2}-\d{2}\b/)
  if (iso) return iso[0]
  const latin = text.match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b/)
  if (!latin) return ''
  const [, day, month, year] = latin
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

function collectRelatedCampaignEvents(events, campaignsByType, campaign) {
  const relatedCampaigns = getRelatedCampaigns(campaignsByType, campaign)
  if (relatedCampaigns.length === 0) return []

  const uniqueEvents = new Map()
  relatedCampaigns.forEach((relatedCampaign) => {
    collectCampaignEvents(events, relatedCampaign).forEach((event) => {
      if (event?.id) {
        uniqueEvents.set(event.id, event)
      }
    })
  })

  return Array.from(uniqueEvents.values())
}

function getRelatedCampaigns(campaignsByType, campaign) {
  const allCampaigns = [
    ...(campaignsByType?.diaria || []).map((item) => ({ ...item, type: 'diaria' })),
    ...(campaignsByType?.semanal || []).map((item) => ({ ...item, type: 'semanal' })),
    ...(campaignsByType?.mensual || []).map((item) => ({ ...item, type: 'mensual' })),
  ]

  return allCampaigns.filter((candidate) => {
    if (!candidate || candidate.id === campaign.id) return false
    if (candidate.type !== campaign.type) return false
    if (!candidate.enabled) return false
    if (campaign.groupId) return candidate.groupId === campaign.groupId
    return true
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

function countRegisteredParticipants(registeredParticipants = []) {
  const names = new Set()
  ;(Array.isArray(registeredParticipants) ? registeredParticipants : []).forEach((participant) => {
    const name = participant?.name || participant?.participant || participant?.index || participant
    if (name) names.add(String(name).trim().toLowerCase())
  })
  return names.size
}

function getCampaignRaceCount(campaign, events, programs) {
  const fromEvents = Math.max(
    0,
    ...(events || []).map((event) => Number(event?.races || event?.meta?.raceCount || 0))
  )

  const dateCandidates = new Set()
  if (campaign.type === 'diaria' && campaign.date) {
    dateCandidates.add(normalizeDate(campaign.date))
  }
  if (campaign.startDate) dateCandidates.add(normalizeDate(campaign.startDate))
  if (campaign.endDate) dateCandidates.add(normalizeDate(campaign.endDate))

  const normalizedPrograms = Array.isArray(programs) ? programs : Object.values(programs || {})
  const matchingPrograms = normalizedPrograms.filter((program) => {
    const programDate = normalizeDate(program?.date)
    if (!programDate || !dateCandidates.has(programDate)) return false

    const programTrack = normalizeText(program?.trackName || program?.trackId)
    const campaignName = normalizeText(campaign?.name)
    const campaignTracks = (campaign?.hipodromos || []).map(normalizeText)

    if (campaignTracks.length > 0) {
      return campaignTracks.some((track) => programTrack.includes(track) || track.includes(programTrack))
    }

    if (campaignName) {
      return campaignName.includes(programTrack) || programTrack.includes(campaignName) || true
    }

    return true
  })

  const fromPrograms = Math.max(
    0,
    ...matchingPrograms.map((program) => {
      if (Array.isArray(program?.races)) return program.races.length
      return Object.keys(program?.races || {}).length
    })
  )

  return Math.max(
    fromEvents,
    fromPrograms,
    Number(campaign?.raceCount) || 0,
    12
  )
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
    return normalizeDateToChile(value)
  } catch {
    return null
  }
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function getModeIcon(modeId) {
  const icons = {
    [MODE_IDS.INDIVIDUAL]: '🏃',
    [MODE_IDS.PAIRS]: '👥',
    [MODE_IDS.FINAL_QUALIFICATION]: '🏆',
    [MODE_IDS.GROUPS]: '👨‍👩‍👧‍👦',
    [MODE_IDS.HEAD_TO_HEAD]: '⚔️',
    [MODE_IDS.PROGRESSIVE_ELIMINATION]: '🔥',
  }
  return icons[modeId] || '📋'
}
