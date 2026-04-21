import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import api from '../../api'
import useAppStore from '../../store/useAppStore'
import { ThemeProvider } from '../../context/ThemeContext'
import { usePromoRelations } from '../../hooks/usePromoRelations'
import { useRanking } from '../../hooks/useRanking'
import { calculateDailyScores, enrichPicksWithScores } from '../../engine/scoreEngine'
import { resolveEventOperationalData } from '../../services/campaignOperationalData'
import { isCampaignActiveForDate, isCampaignEventEligible } from '../../services/campaignEligibility'
import { resolveCampaignExportConfig, resolveCampaignTheme } from '../../services/campaignStyles'
import { detectRaceStatus } from '../../services/raceStatus'
import { buildCompetitionTableSections } from '../../services/competitionTableSections'
import { generateExportHTML } from '../../services/exportStyles'
import { formatPicksForAPI } from '../../utils/pickParser'
import { AccumulatedRankingView, DailyRankingView, RankingBanner } from '../ranking/RankingContainer'
import PicksTable from '../tables/PicksTable'
import styles from './CampaignDetailModal.module.css'

const TAB_OPTIONS = [
  { id: 'pronosticos', label: 'Pronósticos' },
  { id: 'participantes', label: 'Participantes' },
  { id: 'ranking', label: 'Ranking' },
  { id: 'premios', label: 'Premios' },
  { id: 'resultados', label: 'Resultados' },
]

const DEFAULT_PAYOUT = {
  firstPct: 70,
  secondPct: 20,
  thirdPct: 10,
  adminPct: 10,
}

const TYPE_TO_PRIZES_KEY = {
  diaria: 'daily',
  semanal: 'weekly',
  mensual: 'monthly',
}

export default function CampaignDetailModal({ campaign, initialTab = 'pronosticos', registryGroups = [], onClose, onRefresh }) {
  const { appData } = useAppStore()
  const user = useAppStore((state) => state.user)
  const [activeTab, setActiveTab] = useState(initialTab)
  const [jornadaVersion, setJornadaVersion] = useState(0)
  const [selectedPronosticosEventId, setSelectedPronosticosEventId] = useState('')
  const [selectedRankingView, setSelectedRankingView] = useState('total')
  const [editingPick, setEditingPick] = useState(null)
  const [pickDraft, setPickDraft] = useState([])
  const [participantNameDraft, setParticipantNameDraft] = useState('')
  const [pickMessage, setPickMessage] = useState(null)
  const [savingPick, setSavingPick] = useState(false)
  const [savingParticipantName, setSavingParticipantName] = useState('')
  const [editingPromoName, setEditingPromoName] = useState('')
  const [editingPrizeConfig, setEditingPrizeConfig] = useState(false)
  const [savingPrizeConfig, setSavingPrizeConfig] = useState(false)
  const [prizeConfigTemp, setPrizeConfigTemp] = useState(null)
  const [prizeDraftsTemp, setPrizeDraftsTemp] = useState(null)
  const [prizeMessage, setPrizeMessage] = useState(null)
  const exportRefs = useRef({ pronosticos: {}, premios: {}, resultados: {} })
  const {
    getPromoPartners,
    savePromoRelation,
    removePromoRelation,
  } = usePromoRelations(campaign.id, campaign.groupId)

  const registry = appData?.registry || []
  const campaignGroupName = registryGroups.find((group) => group.id === campaign.groupId)?.name || 'Todos'

  const campaignEvents = useMemo(() => (
    collectCampaignEvents(appData, campaign, getPreferredCampaignDate(campaign))
  ), [appData, campaign])

  const preferredDate = useMemo(() => (
    getPreferredCampaignDate(campaign, campaignEvents)
  ), [campaign, campaignEvents])

  const {
    leaderboard: rankingLeaderboard = [],
    prizeSummary: rankingPrizeSummary = { poolGross: 0, poolNet: 0, prizes: { 1: 0, 2: 0, 3: 0 } },
    breakdownDates: rankingBreakdownDates = [],
    dailyRankingViews: rankingDailyViews = [],
    qualifiers: rankingQualifiers = [],
    eliminated: rankingEliminated = [],
    competitionState: rankingCompetitionState = null,
  } = useRanking({
    selectedDate: preferredDate,
    selectedCampaignId: campaign.id,
    preferredType: campaign.type,
  })

  const campaignExportConfig = useMemo(() => (
    resolveCampaignExportConfig(campaign)
  ), [campaign])

  const campaignRankingTheme = useMemo(() => (
    resolveCampaignTheme(campaign)
  ), [campaign])

  const prizes = appData?.settings?.prizes || {}

  const promoRegistryOptions = useMemo(() => (
    registry
      .filter((participant) => participant?.promo === true)
      .filter((participant) => !campaign.groupId || participant.group === campaign.groupId)
      .map((participant) => participant.name)
      .sort((a, b) => a.localeCompare(b, 'es'))
  ), [campaign.groupId, registry])

  const registryNameOptions = useMemo(() => (
    Array.from(
      new Set(
        (registry || [])
          .map((participant) => String(participant?.name || '').trim())
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b, 'es'))
  ), [registry])

  const eventSections = useMemo(() => (
    buildEventSections(appData, campaign, campaignEvents)
  ), [appData, campaign, campaignEvents, jornadaVersion])

  const participantEvents = campaignEvents
  const participantSections = eventSections
  const selectedPronosticosSection = useMemo(() => {
    if (!eventSections.length) return null
    return eventSections.find((section) => section.eventId === selectedPronosticosEventId) || eventSections[0]
  }, [eventSections, selectedPronosticosEventId])
  const selectedPronosticosGroupings = useMemo(() => (
    buildCompetitionTableSections({
      campaign,
      picks: selectedPronosticosSection?.picks || [],
      settings: campaign?.modeConfig || campaign,
      date: selectedPronosticosSection?.date || '',
    })
  ), [campaign, selectedPronosticosSection])
  const fallbackRankingDailyViews = useMemo(() => (
    eventSections.map((section) => ({
      eventId: section.eventId,
      date: section.date,
      raceCount: section.raceCount,
      results: section.results,
      picks: section.picks,
      qualifiers: [],
      eliminated: [],
      phase: 'classification',
      ...buildDailyRankingData(section, campaign, appData, getPromoPartners),
    }))
  ), [appData, campaign, eventSections, getPromoPartners])
  const hasRankingDailyData = useMemo(() => (
    (rankingDailyViews || []).some((section) => (
      (section?.leaderboard?.length || 0) > 0 ||
      (section?.topThree?.length || 0) > 0 ||
      (section?.remainder?.length || 0) > 0
    ))
  ), [rankingDailyViews])

  const hasFallbackDailyData = useMemo(() => (
    (fallbackRankingDailyViews || []).some((section) => (
      (section?.leaderboard?.length || 0) > 0 ||
      (section?.topThree?.length || 0) > 0 ||
      (section?.remainder?.length || 0) > 0 ||
      (section?.picks?.length || 0) > 0
    ))
  ), [fallbackRankingDailyViews])

  const effectiveRankingDailyViews = useMemo(() => {
    if (hasRankingDailyData) return rankingDailyViews
    if (hasFallbackDailyData) return fallbackRankingDailyViews
    return rankingDailyViews.length > 0 ? rankingDailyViews : fallbackRankingDailyViews
  }, [fallbackRankingDailyViews, hasFallbackDailyData, hasRankingDailyData, rankingDailyViews])
  const shouldShowTotalRankingOption = useMemo(() => {
    const campaignType = campaign?.type || inferCampaignType(campaign)
    if (campaignType === 'diaria') return false
    return true
  }, [campaign, effectiveRankingDailyViews.length])
  const selectedRankingSection = useMemo(() => {
    if (!effectiveRankingDailyViews.length) return null
    if (selectedRankingView === 'total') {
      if (!shouldShowTotalRankingOption) return effectiveRankingDailyViews[0] || null
      return null
    }
    const rankingSection = effectiveRankingDailyViews.find((section) => section.eventId === selectedRankingView) || effectiveRankingDailyViews[0]
    const sourceSection = eventSections.find((section) => section.eventId === rankingSection?.eventId) || null

    return {
      ...rankingSection,
      title: sourceSection?.title || rankingSection?.title || '',
      picks: sourceSection?.picks || [],
      raceCount: sourceSection?.raceCount || rankingSection?.raceCount || 0,
      results: sourceSection?.results || rankingSection?.results || {},
    }
  }, [effectiveRankingDailyViews, eventSections, selectedRankingView, shouldShowTotalRankingOption])

  const rankingDailyCampaignLabel = useMemo(() => {
    const sectionTitle = String(selectedRankingSection?.title || '').trim()
    if (sectionTitle) return sectionTitle
    return String(campaign?.name || '')
      .replace(/\b\d{2}[/-]\d{2}[/-]\d{4}\b/g, '')
      .replace(/\b\d{4}-\d{2}-\d{2}\b/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim()
  }, [campaign?.name, selectedRankingSection?.title])

  const selectedRankingRaceStatus = useMemo(() => {
    if (!selectedRankingSection) return null
    return detectRaceStatus(
      selectedRankingSection?.results || {},
      Number(selectedRankingSection?.raceCount || 0)
    )
  }, [selectedRankingSection])

  const enrolledParticipants = useMemo(() => {
    const map = new Map()

    eventSections.forEach((section) => {
      section.picks.forEach((entry) => {
        const key = normalizeText(entry.participant)
        const registryEntry = registry.find((item) => matchParticipantName(item.name, entry.participant)) || null
        const existing = map.get(key)
        const promoPartners = registryEntry?.promoPartners || []
        const localPartners = getPromoPartners(entry.participant)
        const enrolledNames = section.picks.map((pickEntry) => pickEntry.participant)
        const campaignPartner = [...promoPartners, ...localPartners]
          .find((partner) => enrolledNames.some((name) => normalizeText(name) === normalizeText(partner)))

        const next = existing || {
          name: entry.participant,
          normalizedName: key,
          promoEnabledOnRegistry: registryEntry?.promo === true,
          registryEntry,
          totalPoints: 0,
          appearances: 0,
          eventIds: new Set(),
          partner: null,
        }

        next.totalPoints += Number(entry.points || 0)
        next.appearances += 1
        next.eventIds.add(section.eventId)
        if (campaignPartner) next.partner = campaignPartner
        if (!next.registryEntry && registryEntry) {
          next.registryEntry = registryEntry
          next.promoEnabledOnRegistry = registryEntry?.promo === true
        }

        map.set(key, next)
      })
    })

    const promoRegistrySet = new Set(promoRegistryOptions.map(normalizeText))

    return Array.from(map.values())
      .map((participant) => {
        const currentPartner = participant.partner
        const partnerOptions = Array.from(map.values())
          .filter((candidate) => candidate.name !== participant.name)
          .filter((candidate) => (
            promoRegistrySet.has(candidate.normalizedName) ||
            (currentPartner && matchParticipantName(candidate.name, currentPartner))
          ))
          .map((candidate) => candidate.name)
          .sort((a, b) => a.localeCompare(b, 'es'))

        return {
          ...participant,
          eventIds: Array.from(participant.eventIds),
          partnerOptions,
          canConfigurePromo: campaign.promoEnabled && participant.promoEnabledOnRegistry,
        }
      })
      .sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints
        return a.name.localeCompare(b.name, 'es')
      })
  }, [campaign.promoEnabled, eventSections, getPromoPartners, promoRegistryOptions, registry])

  const canEditPrizes = Boolean(user)
  const basePrizeConfig = editingPrizeConfig ? prizeConfigTemp : (campaign?.payout || prizes?.payout || DEFAULT_PAYOUT)

  const prizeConfig = useMemo(() => {
    const payout = basePrizeConfig || DEFAULT_PAYOUT
    return {
      firstPct: clampPercent(payout.firstPct, DEFAULT_PAYOUT.firstPct),
      secondPct: clampPercent(payout.secondPct, DEFAULT_PAYOUT.secondPct),
      thirdPct: clampPercent(payout.thirdPct, DEFAULT_PAYOUT.thirdPct),
      adminPct: clampPercent(payout.adminPct, DEFAULT_PAYOUT.adminPct),
    }
  }, [basePrizeConfig])

  const prizeParticipants = useMemo(() => {
    return enrolledParticipants.map((participant) => {
      const partnerName = participant.partner || ''
      const normalizedPartner = normalizeText(partnerName)
      const hasPromoPair = Boolean(
        campaign.promoEnabled &&
        partnerName &&
        enrolledParticipants.some((candidate) => (
          candidate.name !== participant.name &&
          normalizeText(candidate.name) === normalizedPartner
        ))
      )

      return {
        ...participant,
        hasPromoPair,
      }
    })
  }, [campaign.promoEnabled, enrolledParticipants])

  const participantSummary = useMemo(() => {
    const promoPairs = new Set()
    let promoCount = 0

    prizeParticipants.forEach((participant) => {
      if (!participant.hasPromoPair) return
      const pairKey = [normalizeText(participant.name), normalizeText(participant.partner)].sort().join('::')
      if (!promoPairs.has(pairKey)) {
        promoPairs.add(pairKey)
        promoCount += 2
      }
    })

    const entryValue = Number(campaign.entryValue || getDefaultEntryValue(prizes, campaign.type))
    const promoPrice = Number(campaign.promoPrice || prizes?.[TYPE_TO_PRIZES_KEY[campaign.type]]?.promoPrice || 0)
    const singleCount = Math.max(0, prizeParticipants.length - promoCount)
    const singleAmount = singleCount * entryValue
    const promoAmount = promoPairs.size * promoPrice
    const grossPool = singleAmount + promoAmount

    return {
      total: prizeParticipants.length,
      promoCount,
      singleCount,
      singleAmount,
      promoAmount,
      grossPool,
      entryValue,
      promoPrice,
    }
  }, [campaign, prizeParticipants, prizes])

  const fallbackTotalRankingData = useMemo(() => (
    buildAccumulatedRankingData(eventSections, campaign, appData, getPromoPartners)
  ), [appData, campaign, eventSections, getPromoPartners])

  const totalRankingData = useMemo(() => {
    if (rankingLeaderboard.length > 0) {
      return {
        leaderboard: rankingLeaderboard,
        breakdownDates: rankingBreakdownDates,
        prizeSummary: rankingPrizeSummary,
      }
    }

    return fallbackTotalRankingData
  }, [fallbackTotalRankingData, rankingBreakdownDates, rankingLeaderboard, rankingPrizeSummary])

  const dailyRankingData = selectedRankingSection

  const totalRepartido = Number(prizeConfig.firstPct || 0) + Number(prizeConfig.secondPct || 0) + Number(prizeConfig.thirdPct || 0)
  const montoAdministracion = Math.round(participantSummary.grossPool * (Number(prizeConfig.adminPct || 0) / 100))
  const pozoLimpio = Math.max(0, participantSummary.grossPool - montoAdministracion)
  const payoutRows = [
    { key: 'firstPct', label: '1° Lugar' },
    { key: 'secondPct', label: '2° Lugar' },
    { key: 'thirdPct', label: '3° Lugar' },
  ]

  const handlePrizeConfigChange = (key, value) => {
    setPrizeDraftsTemp((prev) => ({
      ...(prev || createPrizeEditDrafts(prizeConfig, pozoLimpio, participantSummary.grossPool)),
      [key]: value,
    }))
    setPrizeConfigTemp((prev) => ({ ...(prev || prizeConfig), [key]: parseLocaleNumber(value) }))
  }

  const handlePrizeAmountChange = (key, value) => {
    const amount = parseLocaleNumber(value)
    const pct = pozoLimpio > 0 ? (amount / pozoLimpio) * 100 : 0
    setPrizeDraftsTemp((prev) => ({
      ...(prev || createPrizeEditDrafts(prizeConfig, pozoLimpio, participantSummary.grossPool)),
      [`${key}Amount`]: value,
      [key]: value === '' ? '' : formatPercentDraft(pct),
    }))
    setPrizeConfigTemp((prev) => ({ ...(prev || prizeConfig), [key]: normalizePercent(pct) }))
  }

  const handleAdminAmountChange = (value) => {
    const amount = parseLocaleNumber(value)
    const pct = participantSummary.grossPool > 0 ? (amount / participantSummary.grossPool) * 100 : 0
    setPrizeDraftsTemp((prev) => ({
      ...(prev || createPrizeEditDrafts(prizeConfig, pozoLimpio, participantSummary.grossPool)),
      adminAmount: value,
      adminPct: value === '' ? '' : formatPercentDraft(pct),
    }))
    setPrizeConfigTemp((prev) => ({ ...(prev || prizeConfig), adminPct: normalizePercent(pct) }))
  }

  const handleStartEditingPrizes = () => {
    setEditingPrizeConfig(true)
    setPrizeMessage(null)
    setPrizeConfigTemp({ ...prizeConfig })
    setPrizeDraftsTemp(createPrizeEditDrafts(prizeConfig, pozoLimpio, participantSummary.grossPool))
  }

  const handleCancelEditingPrizes = () => {
    setEditingPrizeConfig(false)
    setPrizeConfigTemp(null)
    setPrizeDraftsTemp(null)
    setPrizeMessage(null)
  }

  const handleSavePrizeConfig = async () => {
    if (Math.abs(totalRepartido - 100) > 0.01) {
      setPrizeMessage({ type: 'error', text: 'Los porcentajes de premios deben sumar 100% del pozo a repartir.' })
      return
    }

    setSavingPrizeConfig(true)
    setPrizeMessage(null)

    const keyMap = {
      diaria: 'daily',
      semanal: 'weekly',
      mensual: 'monthly',
      daily: 'daily',
      weekly: 'weekly',
      monthly: 'monthly',
    }

    const backendType = keyMap[campaign?.type] || inferCampaignType(campaign)
    const sourceCampaigns = appData?.settings?.campaigns || appData?.campaigns || {}
    const currentDaily = Array.isArray(sourceCampaigns?.daily)
      ? sourceCampaigns.daily
      : (Array.isArray(sourceCampaigns?.diaria) ? sourceCampaigns.diaria : [])
    const currentWeekly = Array.isArray(sourceCampaigns?.weekly)
      ? sourceCampaigns.weekly
      : (Array.isArray(sourceCampaigns?.semanal) ? sourceCampaigns.semanal : [])
    const currentMonthly = Array.isArray(sourceCampaigns?.monthly)
      ? sourceCampaigns.monthly
      : (Array.isArray(sourceCampaigns?.mensual) ? sourceCampaigns.mensual : [])

    const nextPayout = {
      firstPct: normalizePercent(prizeConfig.firstPct),
      secondPct: normalizePercent(prizeConfig.secondPct),
      thirdPct: normalizePercent(prizeConfig.thirdPct),
      adminPct: normalizePercent(prizeConfig.adminPct),
    }

    const patchCampaignList = (list) => {
      const currentList = Array.isArray(list) ? list : []
      let found = false
      const updated = currentList.map((item) => {
        if (String(item?.id || '') !== String(campaign?.id || '')) return item
        found = true
        return {
          ...item,
          payout: nextPayout,
          lastModified: new Date().toISOString(),
        }
      })
      if (!found) {
        updated.push({
          ...campaign,
          payout: nextPayout,
          lastModified: new Date().toISOString(),
        })
      }
      return updated
    }

    try {
      await api.updateSettings({
        campaigns: {
          daily: backendType === 'daily' ? patchCampaignList(currentDaily) : currentDaily,
          weekly: backendType === 'weekly' ? patchCampaignList(currentWeekly) : currentWeekly,
          monthly: backendType === 'monthly' ? patchCampaignList(currentMonthly) : currentMonthly,
        },
      })
      await onRefresh?.()
      setPrizeMessage({ type: 'ok', text: 'Configuración de premios actualizada en la campaña.' })
      setEditingPrizeConfig(false)
      setPrizeConfigTemp(null)
      setPrizeDraftsTemp(null)
    } catch (error) {
      setPrizeMessage({ type: 'error', text: error.message || 'No se pudo guardar la configuración de premios.' })
    } finally {
      setSavingPrizeConfig(false)
    }
  }

  useEffect(() => {
    const bumpJornadaVersion = () => setJornadaVersion((current) => current + 1)

    window.addEventListener('pollas-jornadas-updated', bumpJornadaVersion)
    window.addEventListener('focus', bumpJornadaVersion)
    document.addEventListener('visibilitychange', bumpJornadaVersion)

    return () => {
      window.removeEventListener('pollas-jornadas-updated', bumpJornadaVersion)
      window.removeEventListener('focus', bumpJornadaVersion)
      document.removeEventListener('visibilitychange', bumpJornadaVersion)
    }
  }, [])

  useEffect(() => {
    if (!editingPick) return

    const section = eventSections.find((item) => item.eventId === editingPick.eventId)
    const participantEntry = section?.picks.find((item) => {
      if (editingPick.participantIndex !== undefined && editingPick.participantIndex !== null) {
        return Number(item?.originalParticipant?.index) === Number(editingPick.participantIndex)
      }
      return item.participant === editingPick.participantName
    })
    if (!participantEntry) {
      setEditingPick(null)
      setPickDraft([])
      setParticipantNameDraft('')
      return
    }

    setParticipantNameDraft(String(participantEntry.originalParticipant?.name || participantEntry.participant || '').trim())
    setPickDraft(normalizeEditableParticipantPicks(participantEntry.originalParticipant?.picks, section.raceCount))
  }, [editingPick, eventSections])

  useEffect(() => {
    if (!eventSections.length) {
      setSelectedPronosticosEventId('')
      return
    }

    setSelectedPronosticosEventId((current) => (
      eventSections.some((section) => section.eventId === current)
        ? current
        : eventSections[0].eventId
    ))
  }, [eventSections])

  useEffect(() => {
    if (!effectiveRankingDailyViews.length) {
      setSelectedRankingView(shouldShowTotalRankingOption ? 'total' : '')
      return
    }

    setSelectedRankingView((current) => {
      if (current === 'total') {
        return shouldShowTotalRankingOption ? current : effectiveRankingDailyViews[0].eventId
      }
      return effectiveRankingDailyViews.some((section) => section.eventId === current)
        ? current
        : (shouldShowTotalRankingOption ? 'total' : effectiveRankingDailyViews[0].eventId)
    })
  }, [effectiveRankingDailyViews, shouldShowTotalRankingOption])

  const handleOpenPickEditor = (eventId, participantEntry) => {
    setPickMessage(null)
    const participantName = participantEntry?.participant || participantEntry?.name || ''
    const participantIndex = participantEntry?.originalParticipant?.index
    setEditingPick({ eventId, participantName, participantIndex })
  }

  const handleClosePickEditor = () => {
    setEditingPick(null)
    setPickDraft([])
    setParticipantNameDraft('')
    setPickMessage(null)
  }

  const handlePickDraftChange = (index, value) => {
    setPickDraft((current) => {
      const next = [...current]
      next[index] = value
      return next
    })
  }

  const handleSavePick = async () => {
    if (!editingPick) return

    const section = eventSections.find((item) => item.eventId === editingPick.eventId)
    const participantEntry = section?.picks.find((item) => {
      if (editingPick.participantIndex !== undefined && editingPick.participantIndex !== null) {
        return Number(item?.originalParticipant?.index) === Number(editingPick.participantIndex)
      }
      return item.participant === editingPick.participantName
    })
    if (!section || !participantEntry?.originalParticipant) return

    const participantName = String(participantNameDraft || '').trim()
    if (!participantName) {
      setPickMessage({ type: 'error', text: 'Debes seleccionar un participante.' })
      return
    }

    const registryMatch = registryNameOptions.find((name) => matchParticipantName(name, participantName))
    if (!registryMatch) {
      setPickMessage({ type: 'error', text: 'Solo puedes asignar studs registrados.' })
      return
    }

    setSavingPick(true)
    setPickMessage(null)

    try {
      await api.savePickForEvent(section.eventId, {
        ...participantEntry.originalParticipant,
        name: registryMatch,
        picks: formatPicksForAPI(pickDraft),
      })
      await onRefresh?.()
      setPickMessage({ type: 'ok', text: 'Pronóstico actualizado correctamente.' })
      handleClosePickEditor()
    } catch (error) {
      setPickMessage({ type: 'error', text: error.message || 'No se pudo actualizar el pronóstico.' })
    } finally {
      setSavingPick(false)
    }
  }

  const handleDeleteParticipantPick = async () => {
    if (!editingPick) return

    const section = eventSections.find((item) => item.eventId === editingPick.eventId)
    const participantEntry = section?.picks.find((item) => {
      if (editingPick.participantIndex !== undefined && editingPick.participantIndex !== null) {
        return Number(item?.originalParticipant?.index) === Number(editingPick.participantIndex)
      }
      return item.participant === editingPick.participantName
    })
    if (!section || !participantEntry?.originalParticipant) return

    const participantName = participantEntry.originalParticipant?.name || participantEntry.participant || 'este participante'
    const participantIndex = participantEntry.originalParticipant?.index
    if (participantIndex === undefined || participantIndex === null) {
      setPickMessage({ type: 'error', text: 'No se pudo identificar el participante para eliminar.' })
      return
    }

    const confirmed = window.confirm(`¿Eliminar a "${participantName}" de esta jornada? Esta acción no se puede deshacer.`)
    if (!confirmed) return

    setSavingPick(true)
    setPickMessage(null)
    try {
      await api.deletePick(section.eventId, participantIndex)
      await onRefresh?.()
      setPickMessage({ type: 'ok', text: 'Participante eliminado correctamente de la jornada.' })
      handleClosePickEditor()
    } catch (error) {
      setPickMessage({ type: 'error', text: error.message || 'No se pudo eliminar el participante.' })
    } finally {
      setSavingPick(false)
    }
  }

  const handlePromoChange = async (participantName, value) => {
    setSavingParticipantName(participantName)
    try {
      if (!value) {
        await removePromoRelation(participantName)
      } else {
        await savePromoRelation(participantName, [value])
      }
      setEditingPromoName('')
      await onRefresh?.()
    } finally {
      setSavingParticipantName('')
    }
  }

  const setExportRef = useCallback((sectionType, sectionKey) => (node) => {
    if (!exportRefs.current[sectionType]) {
      exportRefs.current[sectionType] = {}
    }

    if (node) {
      exportRefs.current[sectionType][sectionKey] = node
    } else {
      delete exportRefs.current[sectionType][sectionKey]
    }
  }, [])

  const captureSectionCanvas = useCallback(async (sectionType, sectionKey, backgroundColor = '#111c30') => {
    const node = exportRefs.current[sectionType]?.[sectionKey]
    if (!node) return null

    return html2canvas(node, {
      backgroundColor,
      scale: 2,
      useCORS: true,
      logging: false,
      ignoreElements: (element) => element?.dataset?.exportIgnore === 'true',
    })
  }, [])

  const copySectionAsImage = useCallback(async (sectionType, sectionKey) => {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': captureSectionCanvas(sectionType, sectionKey).then(canvas => {
            if (!canvas) throw new Error('No canvas')
            return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
          }),
        }),
      ])
    } catch (error) {
      console.error('No se pudo copiar la imagen del panel:', error)
    }
  }, [captureSectionCanvas])

  const exportSectionAsImage = useCallback(async (sectionType, sectionKey, filename) => {
    const canvas = await captureSectionCanvas(sectionType, sectionKey)
    if (!canvas) return

    const link = document.createElement('a')
    link.download = filename
    link.href = canvas.toDataURL('image/png', 1.0)
    link.click()
  }, [captureSectionCanvas])

  const capturePronosticosCanvas = useCallback(async (section) => {
    if (!section) return null

    try {
      const groupings = buildCompetitionTableSections({
        campaign,
        picks: section.picks || [],
        settings: campaign?.modeConfig || campaign,
        date: section.date || '',
      })

      const scoringConfig = campaign?.scoring || campaign?.modeConfig?.scoring || { mode: 'dividend', doubleLastRace: true }
      const basePicks = (section.picks || []).map((entry) => ({
        participant: entry.participant || entry.name,
        picks: entry.picks || [],
        points: entry.points || entry.score || 0,
        score: entry.score || entry.points || 0,
      }))
      const enrichedPicks = enrichPicksWithScores(basePicks, section.results || {}, scoringConfig)

      const html = generateExportHTML(
        enrichedPicks,
        section.raceCount || 12,
        `Pronósticos ${section.date || ''}`.trim(),
        section.date,
        campaignExportConfig.exportStyle,
        campaignExportConfig.customColors,
        campaign,
        section.results,
        groupings,
      )

      const exportContainer = document.createElement('div')
      exportContainer.style.position = 'absolute'
      exportContainer.style.left = '-9999px'
      exportContainer.style.top = '0'
      exportContainer.style.zIndex = '-1'
      exportContainer.innerHTML = html
      document.body.appendChild(exportContainer)

      await new Promise((resolve) => setTimeout(resolve, 200))

      const canvas = await html2canvas(exportContainer, {
        backgroundColor: '#FFFFFF',
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
      })

      document.body.removeChild(exportContainer)
      return canvas
    } catch (error) {
      console.error('No se pudo generar la exportación de pronósticos:', error)
      return null
    }
  }, [campaign, campaignExportConfig])

  const copyPronosticosAsImage = useCallback(async (section) => {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': capturePronosticosCanvas(section).then(canvas => {
            if (!canvas) throw new Error('No canvas')
            return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
          }),
        }),
      ])
    } catch (error) {
      console.error('No se pudo copiar la imagen de pronósticos:', error)
    }
  }, [capturePronosticosCanvas])

  const exportPronosticosAsImage = useCallback(async (section, filename) => {
    const canvas = await capturePronosticosCanvas(section)
    if (!canvas) return

    const link = document.createElement('a')
    link.download = filename
    link.href = canvas.toDataURL('image/png', 1.0)
    link.click()
  }, [capturePronosticosCanvas])

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
        <header className={styles.header}>
          <div className={styles.headerCopy}>
            <span className={styles.eyebrow}>{campaign.type}</span>
            <h2 className={styles.title}>{campaign.name}</h2>
            <p className={styles.subtitle}>
              {campaignGroupName} · {participantEvents.length} jornada{participantEvents.length === 1 ? '' : 's'} · {sumParticipants(participantSections)} inscritos
            </p>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>Cerrar</button>
        </header>

        <div className={styles.tabBar}>
          {TAB_OPTIONS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className={styles.body}>
            {activeTab === 'pronosticos' && (
              <div className={styles.sectionStack}>
                {pickMessage && (
                <div className={`${styles.message} ${pickMessage.type === 'ok' ? styles.messageOk : styles.messageError}`}>
                  {pickMessage.text}
                </div>
              )}

                {editingPick && (
                  <PickEditorPanel
                    editingPick={editingPick}
                    eventSections={eventSections}
                    registryNameOptions={registryNameOptions}
                    participantNameDraft={participantNameDraft}
                    pickDraft={pickDraft}
                    onParticipantNameChange={setParticipantNameDraft}
                    onChange={handlePickDraftChange}
                    onCancel={handleClosePickEditor}
                    onDelete={handleDeleteParticipantPick}
                    onSave={handleSavePick}
                    saving={savingPick}
                  />
                )}

                {eventSections.length === 0 ? (
                  <EmptyState text="No hay pronósticos cargados para esta campaña." />
                ) : (
                  <>
                    {eventSections.length > 1 && (
                      <div className={styles.eventSelectorRow}>
                        {eventSections.map((section) => {
                          const isActive = selectedPronosticosSection?.eventId === section.eventId
                          return (
                            <button
                              key={`selector-${section.eventId}`}
                              type="button"
                              className={`${styles.eventSelectorBtn} ${isActive ? styles.eventSelectorBtnActive : ''}`}
                              onClick={() => setSelectedPronosticosEventId(section.eventId)}
                            >
                              <span className={styles.eventSelectorType}>{campaign.type}</span>
                              <span className={styles.eventSelectorText}>
                                {campaign.name} · {formatShortDate(section.date)}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    )}

                    {selectedPronosticosSection && (
                  <article key={selectedPronosticosSection.eventId} className={styles.panel}>
                    <div ref={setExportRef('pronosticos', selectedPronosticosSection.eventId)}>
                      <div className={styles.panelHeader}>
                        <div>
                          <h3 className={styles.panelTitle}>Pronósticos {formatShortDate(selectedPronosticosSection.date)}</h3>
                          <p className={styles.panelMeta}>{selectedPronosticosSection.title} · {selectedPronosticosSection.picks.length} participantes · {selectedPronosticosSection.raceCount} carreras</p>
                        </div>
                        <div className={styles.panelActions} data-export-ignore="true">
                          <button
                            type="button"
                            className={styles.copyBtn}
                            onClick={() => copyPronosticosAsImage(selectedPronosticosSection)}
                          >
                            Copiar imagen
                          </button>
                          <button
                            type="button"
                            className={styles.exportBtn}
                            onClick={() => exportPronosticosAsImage(selectedPronosticosSection, `pronosticos-${selectedPronosticosSection.date || selectedPronosticosSection.eventId}.png`)}
                          >
                            Exportar PNG
                          </button>
                        </div>
                      </div>

                      {selectedPronosticosGroupings.length === 0 ? (
                        <PicksTable
                          picks={selectedPronosticosSection.picks}
                          results={selectedPronosticosSection.results}
                          date={selectedPronosticosSection.date}
                          raceCount={selectedPronosticosSection.raceCount}
                          onEditPick={(entry) => handleOpenPickEditor(selectedPronosticosSection.eventId, entry)}
                        />
                      ) : (
                        <div className={styles.pronosticosGrouped}>
                          {selectedPronosticosGroupings.map((grouping) => {
                            const memberNames = grouping.members || []
                            const groupedPicks = selectedPronosticosSection.picks.filter((entry) => (
                              memberNames.includes(entry.participant) || memberNames.includes(entry.name)
                            ))

                            if (groupedPicks.length === 0) return null

                            return (
                              <section key={grouping.id} className={styles.pronosticosGroupCard}>
                                <div className={styles.pronosticosGroupHeader}>
                                  <span className={styles.pronosticosGroupBadge}>
                                    {campaign.modeConfig?.format === 'groups'
                                      ? 'Grupo'
                                      : campaign.modeConfig?.format === 'head-to-head'
                                        ? 'Duelo'
                                        : 'Pareja'}
                                  </span>
                                  <h4 className={styles.pronosticosGroupTitle}>{grouping.name}</h4>
                                </div>
                                <PicksTable
                                  picks={groupedPicks}
                                  results={selectedPronosticosSection.results}
                                  date={selectedPronosticosSection.date}
                                  raceCount={selectedPronosticosSection.raceCount}
                                  onEditPick={(entry) => handleOpenPickEditor(selectedPronosticosSection.eventId, entry)}
                                />
                              </section>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </article>
                    )}
                  </>
                )}
              </div>
            )}

          {activeTab === 'participantes' && (
            <div className={styles.sectionStack}>
              <article className={styles.panel}>
                <div className={styles.panelHeader}>
                  <div>
                    <h3 className={styles.panelTitle}>Participantes inscritos</h3>
                    <p className={styles.panelMeta}>
                      Solo inscritos en esta campaña. Puedes ajustar si entran individual o con promo.
                    </p>
                  </div>
                </div>

                {enrolledParticipants.length === 0 ? (
                  <EmptyState text="No hay participantes inscritos para esta campaña." />
                ) : (
                  <div className={styles.participantsTable}>
                    <div className={styles.participantsHead}>
                      <span>Participante</span>
                      <span>Estado</span>
                      <span>Partner promo</span>
                      <span>Total puntos</span>
                    </div>

                    {enrolledParticipants.map((participant) => {
                      const currentPartner = participant.partnerOptions.find((candidate) =>
                        normalizeText(candidate) === normalizeText(participant.partner)
                      ) || ''
                      const promoApplied = Boolean(currentPartner)

                      return (
                        <div key={participant.name} className={styles.participantsRow}>
                          <div>
                            <strong>{participant.name}</strong>
                            <div className={styles.rowSubmeta}>{participant.appearances} ingreso(s) · {participant.eventIds.length} jornada(s)</div>
                          </div>

                          <span className={promoApplied ? styles.statusPromo : styles.statusIndividual}>
                            {promoApplied ? 'Promo 2x' : 'Individual'}
                          </span>

                          <div className={styles.partnerCell}>
                            {participant.canConfigurePromo ? (
                              editingPromoName === participant.name ? (
                                <div className={styles.partnerEditor}>
                                  <select
                                    className={styles.partnerSelect}
                                    value={currentPartner}
                                    disabled={savingParticipantName === participant.name}
                                    onChange={(event) => handlePromoChange(participant.name, event.target.value)}
                                  >
                                    <option value="">Jugar individual</option>
                                    {participant.partnerOptions.map((option) => (
                                      <option key={`${participant.name}-${option}`} value={option}>{option}</option>
                                    ))}
                                  </select>
                                  <button
                                    type="button"
                                    className={styles.secondaryBtn}
                                    onClick={() => setEditingPromoName('')}
                                    disabled={savingParticipantName === participant.name}
                                  >
                                    Cerrar
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  className={styles.secondaryBtn}
                                  onClick={() => setEditingPromoName(participant.name)}
                                >
                                  {promoApplied ? 'Editar promo' : 'Activar promo'}
                                </button>
                              )
                            ) : (
                              <span className={styles.disabledHint}>
                                {campaign.promoEnabled
                                  ? (participant.promoEnabledOnRegistry ? 'Sin partners promo inscritos' : 'Sin promo 2x en grupo')
                                  : 'Promo desactivada'}
                              </span>
                            )}
                          </div>

                          <span className={styles.pointsCell}>{formatScore(participant.totalPoints)}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </article>
            </div>
          )}

            {activeTab === 'ranking' && (
              <div className={styles.sectionStack}>
                {effectiveRankingDailyViews.length > 0 && (
                  <div className={`${styles.eventSelectorRow} ${styles.rankingSelectorRow}`}>
                    {shouldShowTotalRankingOption && (
                      <button
                        type="button"
                        className={`${styles.eventSelectorBtn} ${styles.rankingSelectorBtn} ${selectedRankingView === 'total' ? styles.eventSelectorBtnActive : ''}`}
                        onClick={() => setSelectedRankingView('total')}
                      >
                        <span className={styles.eventSelectorType}>Total</span>
                        <span className={`${styles.eventSelectorText} ${styles.rankingSelectorTextStrong}`}>{campaign.name}</span>
                      </button>
                    )}
                    {effectiveRankingDailyViews.map((section) => (
                      <button
                        key={`ranking-${section.eventId}`}
                        type="button"
                        className={`${styles.eventSelectorBtn} ${styles.rankingSelectorBtn} ${selectedRankingView === section.eventId ? styles.eventSelectorBtnActive : ''}`}
                        onClick={() => setSelectedRankingView(section.eventId)}
                      >
                        <span className={styles.eventSelectorType}>{campaign.type}</span>
                        <span className={`${styles.eventSelectorText} ${styles.rankingSelectorTextStrong}`}>{formatShortDate(section.date)}</span>
                      </button>
                    ))}
                  </div>
                )}

                <article className={styles.panel}>
                  <ThemeProvider theme={campaignRankingTheme}>
                    <div ref={setExportRef('ranking', selectedRankingView)}>
                      <div className={styles.panelHeader}>
                        <div>
                          <h3 className={styles.panelTitle}>
                            {selectedRankingView === 'total'
                              ? 'Ranking acumulado'
                              : `Ranking ${formatShortDate(selectedRankingSection?.date)}`}
                          </h3>
                          <p className={styles.panelMeta}>
                            {selectedRankingView === 'total'
                              ? `${campaign.name} · ${totalRankingData.breakdownDates.length} jornada${totalRankingData.breakdownDates.length === 1 ? '' : 's'}`
                              : `${campaign.name} · ${selectedRankingSection?.picks.length || 0} participantes`}
                          </p>
                        </div>
                        <div className={styles.panelActions} data-export-ignore="true">
                          <button
                            type="button"
                            className={styles.copyBtn}
                            onClick={() => copySectionAsImage('ranking', selectedRankingView)}
                          >
                            Copiar imagen
                          </button>
                        </div>
                      </div>

                      {selectedRankingView === 'total' ? (
                        totalRankingData.leaderboard.length === 0 ? (
                          <EmptyState text="No hay ranking total disponible para esta campaña." />
                        ) : (
                          <>
                            <RankingBanner
                              headerText={`Ranking Total - ${campaign.name}`}
                              statusLabel={`${totalRankingData.breakdownDates.length} jornada${totalRankingData.breakdownDates.length === 1 ? '' : 's'}`}
                            />
                            <AccumulatedRankingView
                              rankingType={campaign.type}
                              leaderboard={totalRankingData.leaderboard}
                              breakdownDates={totalRankingData.breakdownDates}
                              prizeSummary={totalRankingData.prizeSummary}
                              mode={campaign?.modeConfig?.format || campaign?.format || 'individual'}
                              qualifiers={rankingQualifiers}
                              eliminated={rankingEliminated}
                              phase={rankingCompetitionState?.phase || 'classification'}
                            />
                          </>
                        )
                      ) : dailyRankingData && dailyRankingData.leaderboard.length > 0 ? (
                        <>
                          <RankingBanner
                            headerText={`Ranking ${formatShortDate(selectedRankingSection?.date)} - ${rankingDailyCampaignLabel}`}
                            statusLabel={selectedRankingRaceStatus?.label || '🟡 Inicio de jornada'}
                          />
                          <DailyRankingView
                            topThree={dailyRankingData.topThree}
                            remainder={dailyRankingData.remainder}
                            prizeSummary={dailyRankingData.prizeSummary}
                            showPrizeSummary={false}
                            showPrizeAmounts={false}
                            mode={campaign?.modeConfig?.format || campaign?.format || 'individual'}
                            qualifiers={selectedRankingSection?.qualifiers || []}
                            eliminated={selectedRankingSection?.eliminated || []}
                            phase={selectedRankingSection?.phase || 'classification'}
                          />
                        </>
                      ) : (
                        <EmptyState text="No hay ranking diario disponible para esa jornada." />
                      )}
                    </div>
                  </ThemeProvider>
                </article>
              </div>
            )}

          {activeTab === 'premios' && (
            <div className={styles.sectionStack}>
              <article className={styles.panel}>
                <div ref={setExportRef('premios', campaign.id)}>
                  <div className={styles.panelHeader}>
                    <div>
                      <h3 className={styles.panelTitle}>Premios estimados</h3>
                      <p className={styles.panelMeta}>
                        {campaign.name} · {participantSummary.total} participantes · reparto {totalRepartido}%
                      </p>
                    </div>
                    <div className={styles.panelActions} data-export-ignore="true">
                      {canEditPrizes && !editingPrizeConfig && (
                        <button
                          type="button"
                          className={styles.secondaryBtn}
                          onClick={handleStartEditingPrizes}
                        >
                          Editar
                        </button>
                      )}
                      <button
                        type="button"
                        className={styles.copyBtn}
                        onClick={() => copySectionAsImage('premios', campaign.id)}
                      >
                        Copiar imagen
                      </button>
                    </div>
                  </div>

                  {prizeMessage && (
                    <div className={`${styles.message} ${prizeMessage.type === 'ok' ? styles.messageOk : styles.messageError}`} data-export-ignore="true">
                      {prizeMessage.text}
                    </div>
                  )}

                  <div className={styles.prizesSummaryGrid}>
                    <div className={styles.prizeSummaryCard}>
                      <span className={styles.prizeSummaryLabel}>Pozo bruto</span>
                      <strong className={styles.prizeSummaryValue}>{formatCurrency(participantSummary.grossPool)}</strong>
                      <span className={styles.prizeSummaryHint}>
                        {participantSummary.singleCount} individuales · {promoPairCount(prizeParticipants)} promos
                      </span>
                    </div>
                    <div className={styles.prizeSummaryCard}>
                      <span className={styles.prizeSummaryLabel}>Administración</span>
                      <strong className={styles.prizeSummaryValue}>{formatCurrency(montoAdministracion)}</strong>
                      <span className={styles.prizeSummaryHint}>
                        {editingPrizeConfig ? (
                          <span className={styles.prizeEditStack}>
                            <input
                              className={styles.prizeInput}
                              type="text"
                              inputMode="decimal"
                              value={prizeDraftsTemp?.adminPct ?? ''}
                              onChange={(event) => handlePrizeConfigChange('adminPct', event.target.value)}
                              data-export-ignore="true"
                            />
                            <input
                              className={styles.prizeInput}
                              type="text"
                              inputMode="decimal"
                              value={prizeDraftsTemp?.adminAmount ?? ''}
                              onChange={(event) => handleAdminAmountChange(event.target.value)}
                              data-export-ignore="true"
                            />
                          </span>
                        ) : `${formatPercent(prizeConfig.adminPct)}% del pozo bruto`}
                      </span>
                    </div>
                    <div className={styles.prizeSummaryCard}>
                      <span className={styles.prizeSummaryLabel}>Pozo a repartir</span>
                      <strong className={styles.prizeSummaryValue}>{formatCurrency(pozoLimpio)}</strong>
                      <span className={styles.prizeSummaryHint}>Base para 1°, 2° y 3° lugar</span>
                    </div>
                  </div>

                  <div className={styles.prizeBreakdownGrid}>
                    {payoutRows.map(({ key, label }) => {
                      const pct = Number(prizeConfig[key] || 0)
                      const amount = Math.round(pozoLimpio * pct / 100)
                      return (
                        <div key={key} className={styles.prizeBreakdownCard}>
                          <span className={styles.prizeBreakdownLabel}>{label}</span>
                          <strong className={styles.prizeBreakdownValue}>
                            {editingPrizeConfig ? (
                              <input
                                className={styles.prizeInput}
                                type="text"
                                inputMode="decimal"
                                value={prizeDraftsTemp?.[`${key}Amount`] ?? ''}
                                onChange={(event) => handlePrizeAmountChange(key, event.target.value)}
                                data-export-ignore="true"
                              />
                            ) : formatCurrency(amount)}
                          </strong>
                          <span className={styles.prizeBreakdownHint}>
                            {editingPrizeConfig ? (
                              <input
                                className={styles.prizeInput}
                                type="text"
                                inputMode="decimal"
                                value={prizeDraftsTemp?.[key] ?? ''}
                                onChange={(event) => handlePrizeConfigChange(key, event.target.value)}
                                data-export-ignore="true"
                              />
                            ) : `${formatPercent(pct)}% del pozo neto`}
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  {editingPrizeConfig && canEditPrizes && (
                    <div className={styles.prizeEditActions} data-export-ignore="true">
                      <button
                        type="button"
                        className={styles.primaryBtn}
                        onClick={handleSavePrizeConfig}
                        disabled={savingPrizeConfig}
                      >
                        {savingPrizeConfig ? 'Guardando...' : 'Guardar cambios'}
                      </button>
                      <button
                        type="button"
                        className={styles.secondaryBtn}
                        onClick={handleCancelEditingPrizes}
                        disabled={savingPrizeConfig}
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>

                <div className={styles.prizeParticipantsTable}>
                  <div className={styles.prizeParticipantsHead}>
                    <span>Participante</span>
                    <span>Modalidad</span>
                    <span>Aporte</span>
                  </div>
                  {prizeParticipants.length === 0 ? (
                    <EmptyState text="No hay participantes inscritos para estimar premios." compact />
                  ) : prizeParticipants.map((participant) => (
                    <div key={`prize-${participant.name}`} className={styles.prizeParticipantsRow}>
                      <span>{participant.name}</span>
                      <span className={participant.hasPromoPair ? styles.statusPromo : styles.statusIndividual}>
                        {participant.hasPromoPair ? `Promo 2x${participant.partner ? ` · ${participant.partner}` : ''}` : 'Individual'}
                      </span>
                      <span className={styles.prizeParticipantAmount}>
                        {formatCurrency(participant.hasPromoPair ? participantSummary.promoPrice / 2 : participantSummary.entryValue)}
                      </span>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          )}

          {activeTab === 'resultados' && (
            <div className={styles.sectionStack}>
              {eventSections.length === 0 ? (
                <EmptyState text="No hay jornadas asociadas a esta campaña." />
              ) : eventSections.map((section) => {
                const raceResults = getSortedRaceResults(section.results)
                return (
                  <article key={`${section.eventId}-results`} className={styles.panel}>
                    <div ref={setExportRef('resultados', section.eventId)}>
                      <div className={styles.panelHeader}>
                        <div>
                          <h3 className={styles.panelTitle}>Resultados {formatShortDate(section.date)}</h3>
                          <p className={styles.panelMeta}>{section.title} · {raceResults.length} carrera(s) con datos</p>
                        </div>
                        <div className={styles.panelActions} data-export-ignore="true">
                          <button
                            type="button"
                            className={styles.copyBtn}
                            onClick={() => copySectionAsImage('resultados', section.eventId)}
                          >
                            Copiar imagen
                          </button>
                          <button
                            type="button"
                            className={styles.exportBtn}
                            onClick={() => exportSectionAsImage('resultados', section.eventId, `resultados-${section.date || section.eventId}.png`)}
                          >
                            Exportar PNG
                          </button>
                        </div>
                      </div>

                      {raceResults.length === 0 ? (
                        <EmptyState text="Aún no hay resultados cargados para esta jornada." compact />
                      ) : (
                        <div className={styles.resultsGrid}>
                          {raceResults.map((result) => (
                            <div key={`${section.eventId}-race-${result.race}`} className={styles.resultCard}>
                              <div className={styles.resultRace}>Carrera {result.race}</div>
                              <div className={styles.resultRow}><span>1°</span><strong>{formatRunnerWithTie(result, 'primero')}</strong></div>
                              <div className={styles.resultRow}><span>2°</span><strong>{formatRunnerWithTie(result, 'segundo')}</strong></div>
                              <div className={styles.resultRow}><span>3°</span><strong>{formatRunnerWithTie(result, 'tercero')}</strong></div>
                              <div className={styles.resultMeta}>
                                <span>Div. ganador: {formatDividend(result.ganador)}</span>
                                <span>Div. 2° primero: {formatDividend(result.divSegundoPrimero)}</span>
                                <span>Div. 3° primero: {formatDividend(result.divTerceroPrimero)}</span>
                                <span>Div. 2° lugar: {formatDividend(result.divSegundo)}</span>
                                <span>Div. 3° segundo: {formatDividend(result.divTerceroSegundo)}</span>
                                <span>Div. 3° lugar: {formatDividend(result.divTercero)}</span>
                                <span>Favorito: {formatRunner(result.favorito, result.nombreFavorito)}</span>
                                <span>Retiros: {formatWithdrawals(result)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function PickEditorPanel({ editingPick, eventSections, registryNameOptions = [], participantNameDraft, pickDraft, onParticipantNameChange, onChange, onCancel, onDelete, onSave, saving }) {
  const section = eventSections.find((item) => item.eventId === editingPick.eventId)
  if (!section) return null

  return (
    <article className={`${styles.panel} ${styles.editorPanel}`}>
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>Editar pronóstico de {editingPick.participantName}</h3>
          <p className={styles.panelMeta}>{formatShortDate(section.date)} · {section.raceCount} carreras</p>
        </div>
      </div>

      <label className={styles.pickField}>
        <span>Participante</span>
        <select
          value={participantNameDraft || ''}
          onChange={(event) => onParticipantNameChange(event.target.value)}
        >
          <option value="">Seleccionar participante registrado...</option>
          {registryNameOptions.map((name) => (
            <option key={`participant-option-${name}`} value={name}>{name}</option>
          ))}
        </select>
      </label>

      <div className={styles.pickGrid}>
        {Array.from({ length: section.raceCount }, (_, index) => index).map((index) => (
          <label key={`${editingPick.eventId}-race-${index + 1}`} className={styles.pickField}>
            <span>C{index + 1}</span>
            <input
              type="text"
              value={pickDraft[index] || ''}
              onChange={(event) => onChange(index, event.target.value)}
              maxLength={3}
            />
          </label>
        ))}
      </div>

      <div className={styles.editorActions}>
        <button type="button" className={styles.dangerBtn} onClick={onDelete} disabled={saving}>
          Eliminar participante
        </button>
        <button type="button" className={styles.secondaryBtn} onClick={onCancel}>Cancelar</button>
        <button type="button" className={styles.primaryBtn} onClick={onSave} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </article>
  )
}

function EmptyState({ text, compact = false }) {
  return (
    <div className={`${styles.emptyState} ${compact ? styles.emptyStateCompact : ''}`}>
      {text}
    </div>
  )
}

function buildEventSections(appData, campaign, events) {
  return (events || []).map((event) => {
    const operationalData = resolveEventOperationalData(appData, campaign, event)
    const raceCount = operationalData.raceCount
    const scoringConfig = event.scoring || campaign?.scoring || { mode: 'dividend', doubleLastRace: true }
    const fallbackPicks = (event.participants || []).map((participant) => ({
      participant: participant.name || participant.index,
      picks: normalizeParticipantPicks(participant.picks, raceCount),
    }))
    const recalculatedScores = hasResultEntries(operationalData.results)
      ? calculateDailyScores(fallbackPicks, operationalData.results, scoringConfig)
      : {}
    const picks = (event.participants || [])
      .map((participant, participantIndex) => {
        const participantName = participant.name || participant.index
        const backendPoints = Number(participant.points)
        const resolvedPoints = hasResultEntries(operationalData.results)
          ? Number(recalculatedScores[participantName] || 0)
          : (Number.isFinite(backendPoints) ? backendPoints : 0)

        return {
          participant: participantName,
          name: participantName,
          points: resolvedPoints,
          score: resolvedPoints,
          entryOrder: participantIndex,
          picks: normalizeParticipantPicks(participant.picks, raceCount),
          originalParticipant: participant,
        }
      })

    return {
      event,
      eventId: event.id,
      title: operationalData.trackName || event.title || event.sheetName || event.id,
      date: operationalData.date || getEventDate(event),
      raceCount,
      picks,
      results: operationalData.results,
    }
  })
}

function collectCampaignEvents(appData, campaign, selectedDate) {
  const events = (appData?.events || []).filter((event) => {
    if (!Array.isArray(event?.participants) || event.participants.length === 0) return false
    const eventDate = getEventDate(event)
    if (!eventDate) return false
    const eventTrackText = [event?.meta?.trackName, event?.meta?.trackId, event?.sheetName, event?.title, event?.name].filter(Boolean).join(' ')
    if (hasExplicitCampaignMatch(event, campaign)) {
      return isExplicitCampaignDateMatch(campaign, eventDate, selectedDate, appData)
    }
    if (!isEventEligibleForCampaign(eventDate, eventTrackText, campaign, selectedDate, appData)) return false
    return isFallbackCampaignMatch(event, campaign, eventDate, appData)
  })

  const uniqueEvents = new Map()
  events.forEach((event) => {
    uniqueEvents.set(event.id, event)
  })

  return Array.from(uniqueEvents.values()).sort((a, b) => {
    const dateDiff = getEventDate(a).localeCompare(getEventDate(b))
    if (dateDiff !== 0) return dateDiff
    return (a.id || '').localeCompare(b.id || '')
  })
}

function collectRelatedCampaignEvents(appData, campaign) {
  const relatedCampaigns = getRelatedCampaigns(appData?.campaigns, campaign)
  if (relatedCampaigns.length === 0) return []

  const uniqueEvents = new Map()

  relatedCampaigns.forEach((relatedCampaign) => {
    const relatedEvents = collectCampaignEvents(
      appData,
      relatedCampaign,
      getPreferredCampaignDate(relatedCampaign),
    )

    relatedEvents.forEach((event) => {
      if (event?.id) {
        uniqueEvents.set(event.id, event)
      }
    })
  })

  return Array.from(uniqueEvents.values()).sort((a, b) => {
    const dateDiff = getEventDate(a).localeCompare(getEventDate(b))
    if (dateDiff !== 0) return dateDiff
    return (a.id || '').localeCompare(b.id || '')
  })
}

function getRelatedCampaigns(campaigns, campaign) {
  const allCampaigns = [
    ...(campaigns?.diaria || []),
    ...(campaigns?.semanal || []),
    ...(campaigns?.mensual || []),
  ]

  return allCampaigns.filter((candidate) => {
    if (!candidate || candidate.id === campaign.id) return false
    if ((candidate.type || inferCampaignType(candidate)) !== campaign.type) return false
    if (!candidate.enabled) return false
    if (campaign.groupId) return candidate.groupId === campaign.groupId
    return true
  })
}

function inferCampaignType(campaign) {
  if (campaign?.type) return campaign.type
  if (campaign?.date) return 'diaria'
  if (campaign?.selectedEventIds?.length) return 'mensual'
  if (campaign?.activeDays?.length) return 'semanal'
  return 'diaria'
}

function hasExplicitCampaignMatch(event, campaign) {
  const eventId = event.id || ''
  const campaignId = campaign.id || ''
  const eventIds = campaign.eventIds || []

  return Boolean(
    (campaignId && eventId.includes(campaignId)) ||
    (campaign.eventId && (campaign.eventId === eventId || eventId.includes(campaign.eventId))) ||
    event.campaignId === campaignId ||
    eventIds.some((id) => id === eventId || eventId.includes(id))
  )
}

function isExplicitCampaignDateMatch(campaign, eventDate, selectedDate, appData) {
  if (!campaign || !eventDate) return false

  if (campaign.type === 'diaria') {
    return eventDate === normalizeDate(campaign.date || selectedDate)
  }

  return isCampaignActiveForDate(campaign, eventDate, appData)
}

function isFallbackCampaignMatch(event, campaign, eventDate, appData) {
  const eventTitle = `${event.title || ''} ${event.sheetName || ''}`.toLowerCase()
  const campaignName = (campaign.name || '').toLowerCase()

  if (campaign.type === 'diaria') {
    return eventDate === normalizeDate(campaign.date) && (eventTitle.includes(campaignName) || !campaignName)
  }

  return false
}

function isEventEligibleForCampaign(eventDate, eventTrackText, campaign, selectedDate, appData) {
  if (!eventDate) return false

  if (campaign.type === 'diaria') {
    return eventDate === normalizeDate(campaign.date || selectedDate)
  }

  return isCampaignEventEligible(campaign, eventDate, eventTrackText, appData)
}

function isWeeklyDayEnabled(campaign, date) {
  const activeDays = (campaign.activeDays || []).map(normalizeText)
  if (activeDays.length === 0) return true

  const dayNames = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']
  const dayName = dayNames[new Date(`${date}T12:00:00`).getDay()]
  return activeDays.includes(dayName)
}

function getSelectedEventDates(campaign) {
  return new Set(
    (campaign.selectedEventIds || [])
      .map((eventId) => {
        const match = String(eventId).match(/(\d{4}-\d{2}-\d{2})/)
        return match ? match[1] : null
      })
      .filter(Boolean)
  )
}

function getPreferredCampaignDate(campaign, events = []) {
  if (campaign?.date) return normalizeDate(campaign.date)
  if (campaign?.startDate) return normalizeDate(campaign.startDate)
  const eventDates = events.map(getEventDate).filter(Boolean).sort((a, b) => b.localeCompare(a))
  return eventDates[0] || new Date().toISOString().slice(0, 10)
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

  return null
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function normalizeParticipantPicks(picks, raceCount = 0) {
  const normalized = Array.isArray(picks)
    ? [...picks]
    : Object.entries(picks || {})
      .sort((left, right) => Number(left[0]) - Number(right[0]))
      .map(([, value]) => value)

  if (raceCount > normalized.length) {
    return [...normalized, ...Array.from({ length: raceCount - normalized.length }, () => '')]
  }
  return normalized.slice(0, raceCount || normalized.length)
}

function normalizeEditableParticipantPicks(picks, raceCount = 0) {
  const sourcePicks = Array.isArray(picks)
    ? picks
    : Object.entries(picks || {})
      .sort((left, right) => Number(left[0]) - Number(right[0]))
      .map(([, value]) => value)

  const normalized = sourcePicks.map((pick) => {
    if (pick && typeof pick === 'object') {
      return String(pick.horse ?? pick.number ?? pick.pick ?? pick.value ?? '').trim()
    }
    return String(pick || '').trim()
  })

  if (raceCount > normalized.length) {
    return [...normalized, ...Array.from({ length: raceCount - normalized.length }, () => '')]
  }
  return normalized.slice(0, raceCount || normalized.length)
}

function getSortedRaceResults(results) {
  return Object.values(results || {})
    .filter(Boolean)
    .sort((a, b) => Number(a.race || 0) - Number(b.race || 0))
}

function hasResultEntries(results) {
  return Object.values(results || {}).some((race) => race && (race.primero || race.winner?.number))
}

function sumParticipants(eventSections) {
  const unique = new Set()
  eventSections.forEach((section) => {
    section.picks.forEach((pickEntry) => unique.add(normalizeText(pickEntry.participant)))
  })
  return unique.size
}

function buildDailyRankingData(section, campaign, appData, getPromoPartners) {
  const leaderboard = buildLeaderboardFromEntries(
    (section?.picks || []).map((entry) => ({
      participant: entry.participant,
      total: roundScore(entry.score || entry.points || 0),
      dailyTotals: [{ date: section.date, score: roundScore(entry.score || entry.points || 0) }],
    }))
      .filter((entry) => entry.total > 0)
  )

  const participantNames = (section?.picks || [])
    .map((entry) => entry.participant)
    .filter(Boolean)

  return {
    leaderboard,
    topThree: leaderboard.slice(0, 3),
    remainder: leaderboard.slice(3),
    prizeSummary: buildPrizeSummaryForNames(appData, campaign, participantNames, getPromoPartners),
  }
}

function buildAccumulatedRankingData(eventSections, campaign, appData, getPromoPartners) {
  const perParticipant = new Map()

  ;(eventSections || []).forEach((section) => {
    ;(section.picks || []).forEach((entry) => {
      const participant = entry.participant
      const score = roundScore(entry.score || entry.points || 0)
      if (!participant) return

      if (!perParticipant.has(participant)) {
        perParticipant.set(participant, {
          participant,
          total: 0,
          dailyTotals: new Map(),
        })
      }

      const current = perParticipant.get(participant)
      current.total = roundScore(current.total + score)
      current.dailyTotals.set(section.date, roundScore((current.dailyTotals.get(section.date) || 0) + score))
    })
  })

  const leaderboard = buildLeaderboardFromEntries(
    Array.from(perParticipant.values())
      .map((entry) => ({
        participant: entry.participant,
        total: roundScore(entry.total),
        dailyTotals: Array.from(entry.dailyTotals.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([date, score]) => ({ date, score: roundScore(score) })),
      }))
      .filter((entry) => entry.total > 0)
  )

  return {
    leaderboard,
    breakdownDates: Array.from(new Set(
      leaderboard.flatMap((entry) => entry.dailyTotals.map((item) => item.date))
    )).sort((a, b) => a.localeCompare(b)),
    prizeSummary: buildPrizeSummaryForNames(
      appData,
      campaign,
      Array.from(new Set((eventSections || []).flatMap((section) => section.picks.map((entry) => entry.participant)).filter(Boolean))),
      getPromoPartners,
    ),
  }
}

function buildLeaderboardFromEntries(entries) {
  if (!entries.length) return []

  const sorted = [...entries].sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total
    return a.participant.localeCompare(b.participant, 'es')
  })

  const leaderTotal = sorted[0].total
  let lastScore = null
  let lastPosition = 0

  return sorted.map((entry, index) => {
    if (lastScore === null || entry.total !== lastScore) {
      lastPosition = index + 1
      lastScore = entry.total
    }

    return {
      ...entry,
      position: lastPosition,
      differenceFromLeader: roundScore(entry.total - leaderTotal),
    }
  })
}

function buildPrizeSummaryForNames(appData, campaign, participantNames, getPromoPartners) {
  const payout = resolveCampaignPayout(campaign, appData?.settings?.prizes?.payout)
  const adminPct = Number(payout.adminPct || 0)
  const poolGross = roundScore(
    (participantNames || []).reduce((sum, participantName) => (
      sum + getParticipantEntryValueForCampaign(appData, campaign, participantName, participantNames, getPromoPartners)
    ), 0)
  )
  const poolNet = roundScore(poolGross * (1 - adminPct / 100))

  return {
    poolGross,
    poolNet,
    prizes: {
      1: roundScore(poolNet * Number(payout.firstPct || 0) / 100),
      2: roundScore(poolNet * Number(payout.secondPct || 0) / 100),
      3: roundScore(poolNet * Number(payout.thirdPct || 0) / 100),
    },
  }
}

function getParticipantEntryValueForCampaign(appData, campaign, participantName, participantNames, getPromoPartners) {
  const registry = appData?.registry || []
  const participant = registry.find((entry) => normalizeText(entry.name) === normalizeText(participantName))
  const prizes = appData?.settings?.prizes || {}
  const typeKey = TYPE_TO_PRIZES_KEY[campaign.type]
  const defaultEntryValue =
    Number(campaign.entryValue) ||
    Number(prizes?.[typeKey]?.entryPrice) ||
    Number(prizes?.[typeKey]?.singlePrice) ||
    0

  const enrolledNames = new Set((participantNames || []).map(normalizeText))
  const ownPartners = Array.isArray(participant?.promoPartners) ? participant.promoPartners : []
  const localPartners = getPromoPartners?.(participantName) || []
  const hasPromoPartner = campaign.promoEnabled &&
    Number(campaign.promoPrice) > 0 &&
    [...ownPartners, ...localPartners].some((partner) => enrolledNames.has(normalizeText(partner)))

  if (hasPromoPartner) {
    return Number(campaign.promoPrice) / 2
  }

  return defaultEntryValue
}

function roundScore(value) {
  return Math.round(Number(value || 0) * 100) / 100
}

function formatShortDate(date) {
  if (!date) return 'Sin fecha'
  return new Date(`${date}T12:00:00`).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatScore(value) {
  return Number(value || 0).toLocaleString('es-CL', {
    minimumFractionDigits: Number.isInteger(Number(value || 0)) ? 0 : 1,
    maximumFractionDigits: 2,
  })
}

function formatCurrency(value) {
  return `$${Math.round(Number(value || 0)).toLocaleString('es-CL')}`
}

function formatRunner(number, name) {
  if (!number && !name) return 'Sin datos'
  if (number && name) return `${number} - ${name}`
  return `${number || ''}${name || ''}`.trim()
}

function formatRunnerWithTie(result, baseKey) {
  const configs = {
    primero: {
      tieKey: 'empatePrimero',
      numberKey: 'primero',
      nameKey: 'nombrePrimero',
      tieNameKey: 'nombreEmpatePrimero',
    },
    segundo: {
      tieKey: 'empateSegundo',
      numberKey: 'segundo',
      nameKey: 'nombreSegundo',
      tieNameKey: 'nombreEmpateSegundo',
    },
    tercero: {
      tieKey: 'empateTercero',
      numberKey: 'tercero',
      nameKey: 'nombreTercero',
      tieNameKey: 'nombreEmpateTercero',
    },
  }

  const config = configs[baseKey]
  if (!config) return 'Sin datos'

  const primary = formatRunner(result?.[config.numberKey], result?.[config.nameKey])
  const tiedNumber = result?.[config.tieKey]
  const tiedText = tiedNumber
    ? formatRunner(tiedNumber, result?.[config.tieNameKey])
    : ''

  return tiedText && tiedText !== 'Sin datos'
    ? `${primary} / ${tiedText}`
    : primary
}

function formatDividend(value) {
  if (value === undefined || value === null || value === '') return '-'
  return String(value).replace('.', ',')
}

function formatWithdrawals(result) {
  const retiros = [
    ...(Array.isArray(result?.retiros) ? result.retiros : []),
    result?.retiro1,
    result?.retiro2,
  ]
    .filter(Boolean)
    .map((item) => (typeof item === 'object' ? item.number || item.name || '' : item))
    .filter(Boolean)

  return retiros.length ? retiros.join(', ') : 'Sin retiros'
}

function matchParticipantName(left, right) {
  return normalizeKey(left) === normalizeKey(right)
}

function normalizeKey(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim()
}

function clampPercent(value, fallback = 0) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return fallback
  return Math.max(0, Math.min(100, Math.round(numeric * 1_000_000) / 1_000_000))
}

function resolveCampaignPayout(campaign, fallback = DEFAULT_PAYOUT) {
  const payout = campaign?.payout || fallback || DEFAULT_PAYOUT
  return {
    firstPct: clampPercent(payout.firstPct, DEFAULT_PAYOUT.firstPct),
    secondPct: clampPercent(payout.secondPct, DEFAULT_PAYOUT.secondPct),
    thirdPct: clampPercent(payout.thirdPct, DEFAULT_PAYOUT.thirdPct),
    adminPct: clampPercent(payout.adminPct, DEFAULT_PAYOUT.adminPct),
  }
}

function parseLocaleNumber(value) {
  if (value === '' || value === null || value === undefined) return 0
  const normalized = String(value).replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '')
  const numeric = Number(normalized)
  return Number.isFinite(numeric) ? numeric : 0
}

function normalizePercent(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value || 0) * 1_000_000) / 1_000_000))
}

function formatPercent(value) {
  return Number(value || 0).toLocaleString('es-CL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

function formatPercentDraft(value) {
  return String(formatPercent(normalizePercent(value))).replace(/\./g, '')
}

function formatAmountDraft(value) {
  const numeric = Number(value || 0)
  if (!numeric) return ''
  return Math.round(numeric).toLocaleString('es-CL')
}

function createPrizeEditDrafts(config, poolNet, grossPool) {
  return {
    firstPct: formatPercentDraft(config?.firstPct),
    secondPct: formatPercentDraft(config?.secondPct),
    thirdPct: formatPercentDraft(config?.thirdPct),
    adminPct: formatPercentDraft(config?.adminPct),
    firstPctAmount: formatAmountDraft((Number(poolNet || 0) * Number(config?.firstPct || 0)) / 100),
    secondPctAmount: formatAmountDraft((Number(poolNet || 0) * Number(config?.secondPct || 0)) / 100),
    thirdPctAmount: formatAmountDraft((Number(poolNet || 0) * Number(config?.thirdPct || 0)) / 100),
    adminAmount: formatAmountDraft((Number(grossPool || 0) * Number(config?.adminPct || 0)) / 100),
  }
}

function getDefaultEntryValue(prizes, type) {
  const pricesKey = TYPE_TO_PRIZES_KEY[type]
  return prizes?.[pricesKey]?.entryPrice || prizes?.[pricesKey]?.singlePrice || 0
}

function promoPairCount(participants) {
  const pairs = new Set()

  ;(participants || []).forEach((participant) => {
    if (!participant?.hasPromoPair || !participant?.partner) return
    const pairKey = [normalizeText(participant.name), normalizeText(participant.partner)].sort().join('::')
    pairs.add(pairKey)
  })

  return pairs.size
}
