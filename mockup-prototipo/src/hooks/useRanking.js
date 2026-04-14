import { useMemo } from 'react'
import useAppStore from '../store/useAppStore'
import { calculateDailyScores } from '../engine/scoreEngine'

const PROMO_RELATIONS_STORAGE_KEY = 'pollas-promo-relations'

const TYPE_TO_BACKEND_KEY = {
  diaria: 'daily',
  semanal: 'weekly',
  mensual: 'monthly',
}

export function useRanking({ selectedDate, selectedCampaignId, preferredType = 'diaria' } = {}) {
  const { appData } = useAppStore()

  const availableDates = useMemo(() => {
    const dates = new Set()
    const allCampaigns = getAllCampaigns(appData)
    const events = appData?.events || []

    allCampaigns.forEach((campaign) => {
      if (campaign.type === 'diaria' && campaign.date) {
        dates.add(normalizeDate(campaign.date))
      }
      if (campaign.startDate) dates.add(normalizeDate(campaign.startDate))
      if (campaign.endDate) dates.add(normalizeDate(campaign.endDate))
    })

    events.forEach((event) => {
      const eventDate = getEventDate(event)
      if (eventDate) dates.add(eventDate)
    })

    return Array.from(dates).filter(Boolean).sort((a, b) => b.localeCompare(a))
  }, [appData])

  const effectiveDate = selectedDate || availableDates[0] || getTodayDate()

  const availableCampaigns = useMemo(() => {
    return getAllCampaigns(appData)
      .filter((campaign) => isCampaignActiveForDate(campaign, effectiveDate))
      .sort(compareCampaigns)
  }, [appData, effectiveDate])

  const selectedCampaign = useMemo(() => {
    const byId = availableCampaigns.find((campaign) => campaign.id === selectedCampaignId)
    if (byId) return byId

    const byType = availableCampaigns.find((campaign) => campaign.type === preferredType)
    return byType || availableCampaigns[0] || null
  }, [availableCampaigns, preferredType, selectedCampaignId])

  const rankingData = useMemo(() => {
    if (!selectedCampaign) {
      return createEmptyRankingData(effectiveDate)
    }

    const rankedEvents = collectCampaignEvents(appData, selectedCampaign, effectiveDate)
    const scoredEntries = buildRankedEntries(rankedEvents)
    const leaderboard = buildLeaderboard(scoredEntries)
    const participantsWithPicks = extractParticipantsWithPicks(rankedEvents)
    const prizeSummary = buildPrizeSummary(appData, selectedCampaign, participantsWithPicks)

    return {
      selectedDate: effectiveDate,
      availableDates,
      availableCampaigns,
      selectedCampaign,
      rankingType: selectedCampaign.type,
      isAccumulated: selectedCampaign.type !== 'diaria',
      rankedEvents,
      leaderboard,
      topThree: leaderboard.slice(0, 3),
      remainder: leaderboard.slice(3),
      uniqueParticipantsWithPicks: participantsWithPicks.length,
      prizeSummary,
      breakdownDates: getBreakdownDates(leaderboard),
    }
  }, [appData, availableCampaigns, availableDates, effectiveDate, selectedCampaign])

  return rankingData
}

function createEmptyRankingData(selectedDate) {
  return {
    selectedDate,
    availableDates: [],
    availableCampaigns: [],
    selectedCampaign: null,
    rankingType: null,
    isAccumulated: false,
    rankedEvents: [],
    leaderboard: [],
    topThree: [],
    remainder: [],
    uniqueParticipantsWithPicks: 0,
    prizeSummary: {
      poolGross: 0,
      poolNet: 0,
      prizes: { 1: 0, 2: 0, 3: 0 },
    },
    breakdownDates: [],
  }
}

function getAllCampaigns(appData) {
  const campaigns = appData?.campaigns || {}
  return ['diaria', 'semanal', 'mensual'].flatMap((type) =>
    (campaigns[type] || [])
      .filter((campaign) => campaign?.enabled)
      .map((campaign) => ({ ...campaign, type }))
  )
}

function compareCampaigns(a, b) {
  const typeOrder = ['diaria', 'semanal', 'mensual']
  const orderDiff = typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type)
  if (orderDiff !== 0) return orderDiff
  return (a.name || '').localeCompare(b.name || '', 'es')
}

function collectCampaignEvents(appData, campaign, selectedDate) {
  const events = (appData?.events || []).filter((event) => {
    if (!Array.isArray(event?.participants) || event.participants.length === 0) return false
    const eventDate = getEventDate(event)
    if (!eventDate) return false
    if (!isEventEligibleForCampaign(eventDate, campaign, selectedDate)) return false
    if (hasExplicitCampaignMatch(event, campaign)) return true
    return isFallbackCampaignMatch(event, campaign, eventDate)
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

function hasExplicitCampaignMatch(event, campaign) {
  const eventId = event.id || ''
  const campaignId = campaign.id || ''
  const eventIds = campaign.eventIds || []

  return Boolean(
    campaignId && eventId.includes(campaignId) ||
    campaign.eventId && (campaign.eventId === eventId || eventId.includes(campaign.eventId)) ||
    event.campaignId === campaignId ||
    eventIds.some((id) => id === eventId || eventId.includes(id))
  )
}

function isFallbackCampaignMatch(event, campaign, eventDate) {
  const eventTitle = `${event.title || ''} ${event.sheetName || ''}`.toLowerCase()
  const campaignName = (campaign.name || '').toLowerCase()

  if (campaign.type === 'diaria') {
    return eventDate === normalizeDate(campaign.date) &&
      (eventTitle.includes(campaignName) || !campaignName)
  }

  return isEventEligibleForCampaign(eventDate, campaign, eventDate)
}

function isEventEligibleForCampaign(eventDate, campaign, selectedDate) {
  if (!eventDate) return false

  if (campaign.type === 'diaria') {
    return eventDate === normalizeDate(campaign.date || selectedDate)
  }

  if (campaign.startDate && eventDate < normalizeDate(campaign.startDate)) return false
  if (campaign.endDate && eventDate > normalizeDate(campaign.endDate)) return false

  if (campaign.type === 'semanal' && !isWeeklyDayEnabled(campaign, eventDate)) return false

  if (campaign.type === 'mensual') {
    const selectedEventDates = getSelectedEventDates(campaign)
    if (selectedEventDates.size > 0 && !selectedEventDates.has(eventDate)) return false
  }

  return true
}

function buildRankedEntries(events) {
  const perParticipant = new Map()

  events.forEach((event) => {
    const eventDate = getEventDate(event)
    const scoringConfig = event.scoring || { mode: 'dividend', doubleLastRace: true }
    const fallbackPicks = (event.participants || []).map((participant) => ({
      participant: participant.name || participant.index,
      picks: normalizeParticipantPicks(participant.picks),
    }))

    const fallbackScores = calculateDailyScores(fallbackPicks, event.results || {}, scoringConfig)

    ;(event.participants || []).forEach((participantRow) => {
      const participant = participantRow?.name || participantRow?.index
      const backendPoints = Number(participantRow?.points)
      const score = Number.isFinite(backendPoints) ? backendPoints : Number(fallbackScores[participant] || 0)

      if (!participant) return
      if (!perParticipant.has(participant)) {
        perParticipant.set(participant, {
          participant,
          total: 0,
          dailyTotals: new Map(),
        })
      }

      const entry = perParticipant.get(participant)
      entry.total += score
      entry.dailyTotals.set(eventDate, roundScore((entry.dailyTotals.get(eventDate) || 0) + score))
    })
  })

  return Array.from(perParticipant.values())
    .map((entry) => ({
      participant: entry.participant,
      total: roundScore(entry.total),
      dailyTotals: Array.from(entry.dailyTotals.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, score]) => ({ date, score: roundScore(score) })),
    }))
    .filter((entry) => entry.total > 0)
}

function buildLeaderboard(entries) {
  if (entries.length === 0) return []

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

function extractParticipantsWithPicks(events) {
  const uniqueParticipants = new Map()

  events.forEach((event) => {
    ;(event.participants || []).forEach((participant) => {
      const name = participant?.name || participant?.index
      if (!name) return
      if (normalizeParticipantPicks(participant.picks).every((pick) => !pick)) return
      uniqueParticipants.set(name, participant)
    })
  })

  return Array.from(uniqueParticipants.keys())
}

function buildPrizeSummary(appData, campaign, participantNames) {
  const payout = appData?.settings?.prizes?.payout || {}
  const adminPct = Number(payout.adminPct || 0)
  const promoRelations = loadPromoRelations()
  const poolGross = roundScore(
    participantNames.reduce((sum, participantName) => (
      sum + getParticipantEntryValue(appData, campaign, participantName, participantNames, promoRelations)
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

function getParticipantEntryValue(appData, campaign, participantName, participantNames, promoRelations) {
  const registry = appData?.registry || []
  const participant = registry.find((entry) => normalizeText(entry.name) === normalizeText(participantName))
  const prizes = appData?.settings?.prizes || {}
  const backendType = TYPE_TO_BACKEND_KEY[campaign.type]

  const defaultEntryValue =
    Number(campaign.entryValue) ||
    Number(prizes?.[backendType]?.entryPrice) ||
    Number(prizes?.[backendType]?.singlePrice) ||
    0

  if (
    campaign.promoEnabled &&
    Number(campaign.promoPrice) > 0 &&
    hasPromoPartnerInCampaign(participant, participantName, participantNames, promoRelations, campaign.id)
  ) {
    return Number(campaign.promoPrice) / 2
  }

  return defaultEntryValue
}

function loadPromoRelations() {
  try {
    const raw = localStorage.getItem(PROMO_RELATIONS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function hasPromoPartnerInCampaign(participant, participantName, participantNames, promoRelations, campaignId) {
  const enrolledNames = new Set((participantNames || []).map(normalizeText))
  const ownPartners = Array.isArray(participant?.promoPartners) ? participant.promoPartners : []
  if (ownPartners.some((partner) => enrolledNames.has(normalizeText(partner)))) {
    return true
  }

  const localPartners = promoRelations?.[campaignId]?.[participantName]?.partners || []
  return localPartners.some((partner) => enrolledNames.has(normalizeText(partner)))
}

function getBreakdownDates(leaderboard) {
  const dates = new Set()
  leaderboard.forEach((entry) => {
    entry.dailyTotals.forEach((daily) => dates.add(daily.date))
  })
  return Array.from(dates).sort((a, b) => a.localeCompare(b))
}

function isCampaignActiveForDate(campaign, date) {
  const normalizedDate = normalizeDate(date)
  if (!normalizedDate) return false

  if (campaign.type === 'diaria') {
    return normalizeDate(campaign.date) === normalizedDate
  }

  if (campaign.startDate && normalizedDate < normalizeDate(campaign.startDate)) return false
  if (campaign.endDate && normalizedDate > normalizeDate(campaign.endDate)) return false

  if (campaign.type === 'semanal') {
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

function getEventDate(event) {
  return normalizeDate(event?.meta?.date || event?.date || event?.sheetName)
}

function normalizeParticipantPicks(picks) {
  return (picks || []).map((pick) => {
    if (pick && typeof pick === 'object') {
      return pick.horse ?? pick.number ?? pick.pick ?? pick.value ?? null
    }
    return pick
  })
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

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function roundScore(value) {
  return Math.round(Number(value || 0) * 100) / 100
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10)
}
