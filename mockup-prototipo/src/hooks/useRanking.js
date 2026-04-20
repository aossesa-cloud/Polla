import { useMemo } from 'react'
import useAppStore from '../store/useAppStore'
import { calculateDailyScores } from '../engine/scoreEngine'
import { computeRankings } from '../engine/rankingEngine'
import { determinePhase, getEliminated, getQualifiers } from '../engine/phaseManager'
import { getModeRules } from '../engine/modeEngine'
import { resolveEventOperationalData } from '../services/campaignOperationalData'
import { collectCampaignTrackHints, isCampaignActiveForDate, isCampaignEventEligible } from '../services/campaignEligibility'

const PROMO_RELATIONS_STORAGE_KEY = 'pollas-promo-relations'
const PARTICIPANT_RELATIONS_STORAGE_KEY = 'pollas-participant-relations'

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
      .filter((campaign) => isCampaignActiveForDate(campaign, effectiveDate, appData))
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

    const rankedEvents = hydrateCampaignEvents(
      appData,
      selectedCampaign,
      collectCampaignEvents(appData, selectedCampaign, effectiveDate),
      effectiveDate,
    )
    const participantsWithPicks = extractParticipantsWithPicks(rankedEvents)

    if (selectedCampaign.type === 'diaria') {
      const scoredEntries = buildRankedEntries(rankedEvents)
      const leaderboard = buildLeaderboard(scoredEntries)
      const prizeSummary = buildPrizeSummary(appData, selectedCampaign, participantsWithPicks)
      const dailyRankingViews = rankedEvents.map((event) => buildDailyRankingViewData(appData, selectedCampaign, event))

      return {
        selectedDate: effectiveDate,
        availableDates,
        availableCampaigns,
        selectedCampaign,
        rankingType: selectedCampaign.type,
        isAccumulated: false,
        rankedEvents,
        leaderboard,
        topThree: leaderboard.slice(0, 3),
        remainder: leaderboard.slice(3),
        uniqueParticipantsWithPicks: participantsWithPicks.length,
        prizeSummary,
        breakdownDates: getBreakdownDates(leaderboard),
        dailyRankingViews,
        competitionState: null,
        qualifiers: [],
        eliminated: [],
      }
    }

    const competitionRanking = buildCompetitionRankingData(
      appData,
      selectedCampaign,
      rankedEvents,
      effectiveDate,
      participantsWithPicks,
    )

    return {
      selectedDate: effectiveDate,
      availableDates,
      availableCampaigns,
      selectedCampaign,
      rankingType: selectedCampaign.type,
      isAccumulated: selectedCampaign.type !== 'diaria',
      rankedEvents,
      ...competitionRanking,
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
    dailyRankingViews: [],
  }
}

function getAllCampaigns(appData) {
  const campaigns = appData?.campaigns || appData?.settings?.campaigns || {}
  const keysByType = {
    diaria: ['diaria', 'daily'],
    semanal: ['semanal', 'weekly'],
    mensual: ['mensual', 'monthly'],
  }

  return ['diaria', 'semanal', 'mensual'].flatMap((type) => {
    const keys = keysByType[type] || [type]
    const items = keys.flatMap((key) => (Array.isArray(campaigns?.[key]) ? campaigns[key] : []))

    const unique = new Map()
    items.forEach((campaign) => {
      if (!campaign) return
      const id = String(campaign.id || `${type}-${campaign.name || Math.random()}`)
      if (!unique.has(id)) unique.set(id, campaign)
    })

    return Array.from(unique.values())
      .filter((campaign) => campaign?.enabled !== false)
      .map((campaign) => ({ ...campaign, type }))
  })
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
    const eventTrackText = [event?.meta?.trackName, event?.meta?.trackId, event?.sheetName, event?.title, event?.name].filter(Boolean).join(' ')
    if (hasExplicitCampaignMatch(event, campaign)) {
      return isCampaignActiveForDate(campaign, eventDate, appData)
    }
    if (hasAnyExplicitCampaignLink(event)) return false
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

function hasAnyExplicitCampaignLink(event) {
  const eventId = String(event?.id || '')
  const campaignId = String(event?.campaignId || event?.meta?.campaignId || '').trim()
  const explicitEventId = String(event?.eventId || event?.meta?.eventId || '').trim()
  const scopedCampaignPattern = /(?:^|::|-)campaign-(?:daily|weekly|monthly|diaria|semanal|mensual)-/i

  return Boolean(
    campaignId ||
    explicitEventId ||
    scopedCampaignPattern.test(eventId)
  )
}

function hydrateCampaignEvents(appData, campaign, events, selectedDate) {
  return (events || []).map((event) => {
    const operationalData = resolveEventOperationalData(appData, campaign, event, selectedDate)
    return {
      ...event,
      date: operationalData.date || event.date,
      raceCount: operationalData.raceCount,
      results: operationalData.results,
      meta: {
        ...(event.meta || {}),
        trackName: operationalData.trackName || event?.meta?.trackName || '',
        raceCount: operationalData.raceCount || event?.meta?.raceCount || 0,
      },
    }
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

function isFallbackCampaignMatch(event, campaign, eventDate, appData) {
  const eventTrackText = normalizeText([
    event?.meta?.trackName,
    event?.meta?.trackId,
    event?.sheetName,
    event?.title,
    event?.name,
  ].filter(Boolean).join(' '))

  if (campaign.type === 'diaria') {
    if (eventDate !== normalizeDate(campaign.date)) return false
    const trackHints = collectCampaignTrackHints(campaign)
      .map((hint) => normalizeText(String(hint || '').replace(/^raw:/, '')))
      .filter(Boolean)
    if (!trackHints.length) return true
    return trackHints.some((hint) => eventTrackText.includes(hint) || hint.includes(eventTrackText))
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

function buildCompetitionRankingData(appData, campaign, rankedEvents, effectiveDate, participantsWithPicks) {
  const sortedEvents = [...(rankedEvents || [])].sort((left, right) => {
    const dateDiff = getEventDate(left).localeCompare(getEventDate(right))
    if (dateDiff !== 0) return dateDiff
    return String(left?.id || '').localeCompare(String(right?.id || ''), 'es')
  })

  const competition = {
    settings: buildCompetitionSettings(campaign, sortedEvents, participantsWithPicks),
  }

  const eventsWithResults = sortedEvents.filter((event) => hasResultEntries(event?.results))
  const picksByDate = buildPicksByDate(eventsWithResults)
  const resultsByDate = buildResultsByDate(eventsWithResults)

  const rawDailyRankingViews = sortedEvents.map((event) =>
    buildCompetitionDailyRankingViewData(
      appData,
      campaign,
      event,
      competition,
      picksByDate,
      resultsByDate,
    )
  )

  const competitionMeta = resolveCompetitionMeta(
    rawDailyRankingViews,
    competition.settings,
    effectiveDate,
  )

  const dailyRankingViews = rawDailyRankingViews.map((view) =>
    finalizeCompetitionDailyRankingView(
      view,
      competition.settings,
      competitionMeta.qualifiers,
      competitionMeta.perViewEliminated?.[view.eventId] || competitionMeta.eliminated,
    )
  )

  // En fase final, el leaderboard acumulado muestra solo el día de la final
  const isFinalPhase = competitionMeta.phase === 'final'
  const viewsForLeaderboard = isFinalPhase
    ? rawDailyRankingViews.filter((v) => determinePhase(v.date, competition.settings) === 'final')
    : rawDailyRankingViews

  const accumulatedLeaderboard = decorateCompetitionLeaderboard(
    buildAccumulatedLeaderboardFromDailyViews(viewsForLeaderboard, competition.settings),
    competitionMeta.qualifiers,
    competitionMeta.eliminated,
    competitionMeta.phase,
    competition.settings,
  )

  const prizeSummary = buildPrizeSummary(appData, campaign, participantsWithPicks)

  return {
    leaderboard: accumulatedLeaderboard,
    topThree: accumulatedLeaderboard.slice(0, 3),
    remainder: accumulatedLeaderboard.slice(3),
    uniqueParticipantsWithPicks: resolveCompetitionEntryCount(competition.settings, accumulatedLeaderboard, participantsWithPicks.length),
    prizeSummary,
    breakdownDates: getBreakdownDates(accumulatedLeaderboard),
    dailyRankingViews,
    competitionState: competitionMeta.state,
    qualifiers: competitionMeta.qualifiers,
    eliminated: competitionMeta.eliminated,
  }
}

function buildCompetitionSettings(campaign, rankedEvents, participantsWithPicks = []) {
  const modeConfig = campaign?.modeConfig || {}
  const fallbackScoring = rankedEvents.find((event) => event?.scoring)?.scoring
  const resolvedPairs = resolveStructuredPairsForCompetition(campaign, participantsWithPicks)
  const resolvedGroups = resolveStructuredGroupsForCompetition(campaign, participantsWithPicks)
  const resolvedMatchups = resolveStructuredMatchupsForCompetition(campaign, participantsWithPicks)

  const mode = modeConfig.format || campaign?.format || campaign?.competitionMode || 'individual'
  const modeRules = getModeRules(mode)
  // head-to-head siempre tiene etapa final por diseño (igual que final-qualification)
  const defaultHasFinalStage = modeRules.hasMatchups ? true : false

  return {
    mode,
    scoring: {
      mode: 'dividend',
      doubleLastRace: true,
      ...(campaign?.scoring || fallbackScoring || {}),
    },
    activeDays: modeConfig.activeDays || campaign?.activeDays || [],
    hasFinalStage: modeConfig.hasFinalStage ?? campaign?.hasFinalStage ?? defaultHasFinalStage,
    finalDays: modeConfig.finalDays || campaign?.finalDays || [],
    groupSize: modeConfig.groupSize ?? campaign?.groupSize ?? 8,
    qualifiersPerGroup: modeConfig.qualifiersPerGroup ?? campaign?.qualifiersPerGroup ?? 4,
    qualifiersCount: modeConfig.qualifiersCount ?? campaign?.qualifiersCount ?? null,
    eliminatePerDay: modeConfig.eliminatePerDay ?? campaign?.eliminatePerDay ?? 1,
    pairMode: modeConfig.pairMode ?? campaign?.pairMode ?? false,
    groups: resolvedGroups,
    pairs: resolvedPairs,
    matchups: resolvedMatchups,
  }
}

function buildPicksByDate(events) {
  return (events || []).reduce((acc, event) => {
    const eventDate = getEventDate(event)
    if (!eventDate) return acc

    acc[eventDate] = (event?.participants || [])
      .map((participant) => ({
        participant: participant?.name || participant?.index,
        picks: normalizeParticipantPicks(participant?.picks),
      }))
      .filter((entry) => entry.participant)

    return acc
  }, {})
}

function buildResultsByDate(events) {
  return (events || []).reduce((acc, event) => {
    const eventDate = getEventDate(event)
    if (!eventDate) return acc
    acc[eventDate] = event?.results || {}
    return acc
  }, {})
}

function buildCompetitionDailyRankingViewData(appData, campaign, event, competition, picksByDate, resultsByDate) {
  const eventDate = getEventDate(event)
  const phase = determinePhase(eventDate, competition?.settings)
  const participantsWithPicks = extractParticipantsWithPicks(event ? [event] : [])

  let leaderboard = []
  let qualifiers = []
  let eliminated = []
  let competitionState = null

  if (hasResultEntries(event?.results) && eventDate) {
    const snapshot = buildCompetitionSnapshot(competition, picksByDate, resultsByDate, eventDate)
    leaderboard = buildLeaderboard(mapDailyRankingEntries(snapshot?.dailyRanking || [], eventDate))
    qualifiers = snapshot?.qualifiers || []
    eliminated = snapshot?.eliminated || []
    competitionState = snapshot?.state || null
  } else {
    leaderboard = buildLeaderboard(buildRankedEntries(event ? [event] : []))
  }

  return {
    eventId: event?.id || eventDate || '',
    date: eventDate,
    phase,
    leaderboard,
    topThree: leaderboard.slice(0, 3),
    remainder: leaderboard.slice(3),
    uniqueParticipantsWithPicks: participantsWithPicks.length,
    prizeSummary: buildPrizeSummary(appData, campaign, participantsWithPicks),
    qualifiers,
    eliminated,
    competitionState,
  }
}

function buildCompetitionSnapshot(competition, picksByDate, resultsByDate, targetDate) {
  const availableDates = Object.keys(picksByDate || {})
    .filter((date) => date <= targetDate)
    .sort((a, b) => a.localeCompare(b))

  if (availableDates.length === 0) {
    return {
      dailyRanking: [],
      accumulatedRanking: [],
      qualifiers: [],
      eliminated: [],
      phase: determinePhase(targetDate, competition?.settings),
      state: null,
    }
  }

  const scopedPicks = Object.fromEntries(availableDates.map((date) => [date, picksByDate[date] || []]))
  const scopedResults = Object.fromEntries(availableDates.map((date) => [date, resultsByDate[date] || {}]))
  const engineSnapshot = computeRankings(competition, scopedPicks, scopedResults, targetDate)
  const qualifierIds = resolveQualifierIds(competition, scopedPicks, scopedResults, targetDate, engineSnapshot)

  return {
    ...engineSnapshot,
    qualifiers: qualifierIds,
  }
}

function resolveQualifierIds(competition, picksByDate, resultsByDate, targetDate, engineSnapshot) {
  const settings = competition?.settings || {}
  const phase = determinePhase(targetDate, settings)

  if (phase !== 'final') {
    return []
  }

  const classificationDates = Object.keys(picksByDate || {})
    .filter((date) => date <= targetDate && determinePhase(date, settings) !== 'final')
    .sort((a, b) => a.localeCompare(b))

  if (classificationDates.length === 0) {
    return engineSnapshot?.qualifiers || []
  }

  const classificationPicks = Object.fromEntries(classificationDates.map((date) => [date, picksByDate[date] || []]))
  const classificationResults = Object.fromEntries(classificationDates.map((date) => [date, resultsByDate[date] || {}]))
  const classificationTarget = classificationDates[classificationDates.length - 1]
  const classificationSnapshot = computeRankings(competition, classificationPicks, classificationResults, classificationTarget)

  return getQualifiers(classificationSnapshot?.accumulatedRanking || [], settings)
}

function mapDailyRankingEntries(dailyRanking, date) {
  return (dailyRanking || []).map((entry) => ({
    participant: entry.participant,
    total: roundScore(entry.score || 0),
    dailyTotals: [{ date, score: roundScore(entry.score || 0) }],
  }))
}

function buildAccumulatedLeaderboardFromDailyViews(dailyViews, settings = {}) {
  const perParticipant = new Map()

  ;(dailyViews || []).forEach((view) => {
    ;(view?.leaderboard || []).forEach((entry) => {
      const participant = entry?.participant
      if (!participant) return

      if (!perParticipant.has(participant)) {
        perParticipant.set(participant, {
          participant,
          total: 0,
          dailyTotals: new Map(),
        })
      }

      const current = perParticipant.get(participant)
      current.total = roundScore(current.total + Number(entry.total || 0))
      current.dailyTotals.set(view.date, roundScore((current.dailyTotals.get(view.date) || 0) + Number(entry.total || 0)))
    })
  })

  const anyViewHasResults = (dailyViews || []).some((view) =>
    (view?.leaderboard || []).length > 0
  )

  const leaderboard = buildLeaderboard(
    Array.from(perParticipant.values())
      .map((entry) => ({
        participant: entry.participant,
        total: roundScore(entry.total),
        dailyTotals: Array.from(entry.dailyTotals.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([date, score]) => ({ date, score: roundScore(score) })),
      }))
      .filter((entry) => anyViewHasResults || entry.total > 0)
  )

  return aggregateCompetitionLeaderboard(leaderboard, settings)
}

function resolveCompetitionMeta(dailyRankingViews, settings, effectiveDate) {
  const fallbackDate = dailyRankingViews[dailyRankingViews.length - 1]?.date || effectiveDate
  const phase = determinePhase(effectiveDate || fallbackDate, settings)
  const classificationViews = dailyRankingViews.filter((view) => determinePhase(view.date, settings) !== 'final')
  const classificationLeaderboard = buildAccumulatedLeaderboardFromDailyViews(classificationViews)
  const hasFinalStage = Boolean(settings?.hasFinalStage)
  const modeRules = getModeRules(settings?.mode || 'individual')
  // Para head-to-head y parejas siempre se calculan los líderes actuales aunque no haya etapa final
  const alwaysComputeQualifiers = modeRules.hasMatchups || modeRules.hasPairs
  const qualifiers =
    alwaysComputeQualifiers || hasFinalStage || phase === 'final' || dailyRankingViews.some((view) => view.phase === 'final')
      ? getQualifiers(classificationLeaderboard, settings)
      : []

  const eliminationTimeline = resolveProgressiveEliminationTimeline(dailyRankingViews, settings)
  const latestDailyEntries = (dailyRankingViews[dailyRankingViews.length - 1]?.leaderboard || [])
    .map((entry) => ({
      participant: entry.participant,
      total: entry.total,
      position: entry.position,
    }))
  const eliminated = settings?.mode === 'progressive-elimination'
    ? eliminationTimeline.finalEliminated
    : getEliminated(latestDailyEntries, settings)

  return {
    phase,
    qualifiers,
    eliminated,
    perViewEliminated: eliminationTimeline.byEventId,
    state: {
      phase,
      mode: settings?.mode || 'individual',
      hasFinalStage: Boolean(settings?.hasFinalStage),
      hasElimination: Boolean(getModeRules(settings?.mode || 'individual')?.hasElimination),
    },
  }
}

function resolveProgressiveEliminationTimeline(dailyRankingViews, settings = {}) {
  if ((settings?.mode || 'individual') !== 'progressive-elimination') {
    return { byEventId: {}, finalEliminated: [] }
  }

  const byEventId = {}
  let eliminated = []

  ;(dailyRankingViews || []).forEach((view) => {
    const currentEntries = (view?.leaderboard || []).map((entry) => ({
      participant: entry.participant,
      total: entry.total,
      position: entry.position,
    }))

    eliminated = getEliminated(currentEntries, settings, eliminated)
    byEventId[view.eventId] = [...eliminated]
  })

  return {
    byEventId,
    finalEliminated: eliminated,
  }
}

function finalizeCompetitionDailyRankingView(view, settings, qualifiers, eliminated) {
  const rules = getModeRules(settings?.mode || 'individual')
  const filterIds = rules.getRankingFilter?.(view.phase, settings, qualifiers)
  const normalizedFilterIds = Array.isArray(filterIds) ? new Set(filterIds.map(normalizeText)) : null
  const filteredLeaderboard = normalizedFilterIds
    ? view.leaderboard.filter((entry) => normalizedFilterIds.has(normalizeText(entry.participant)))
    : view.leaderboard

  const baseLeaderboard = buildLeaderboard(
    filteredLeaderboard.map((entry) => ({
      participant: entry.participant,
      total: entry.total,
      dailyTotals: entry.dailyTotals,
    }))
  )

  const leaderboard = decorateCompetitionLeaderboard(
    aggregateCompetitionLeaderboard(baseLeaderboard, settings),
    qualifiers,
    eliminated,
    view.phase,
    settings,
  )

  return {
    ...view,
    leaderboard,
    topThree: leaderboard.slice(0, 3),
    remainder: leaderboard.slice(3),
    uniqueParticipantsWithPicks: resolveCompetitionEntryCount(settings, leaderboard, view.uniqueParticipantsWithPicks),
  }
}

function decorateCompetitionLeaderboard(leaderboard, qualifiers, eliminated, phase, settings = {}) {
  const qualifierIds = new Set((qualifiers || []).map(normalizeText))
  const eliminatedIds = new Set((eliminated || []).map(normalizeText))

  return (leaderboard || []).map((entry) => ({
    ...entry,
    status: resolveCompetitionEntryStatus(entry, qualifierIds, eliminatedIds, phase, settings),
  }))
}

function resolveCompetitionEntryStatus(entry, qualifierIds, eliminatedIds, phase, settings = {}) {
  const mode = settings?.mode || 'individual'
  const hasFinalStage = Boolean(settings?.hasFinalStage)
  const members = Array.isArray(entry?.members) && entry.members.length > 0
    ? entry.members.map(normalizeText)
    : [normalizeText(entry?.participant)]

  if (mode === 'pairs') {
    const isQualifiedPair = members.length > 0 && members.every((member) => qualifierIds.has(member))
    if (phase === 'final') {
      return isQualifiedPair ? 'qualified' : 'not-qualified'
    }
    if (hasFinalStage) {
      return isQualifiedPair ? 'qualified' : 'not-qualified'
    }
    return 'active'
  }

  if (mode === 'groups') {
    if (phase === 'final') {
      return qualifierIds.has(members[0]) ? 'qualified' : 'not-qualified'
    }
    if (hasFinalStage) {
      return qualifierIds.has(members[0]) ? 'qualified' : 'not-qualified'
    }
    return 'active'
  }

  if (mode === 'head-to-head') {
    if (phase === 'final') {
      return qualifierIds.has(members[0]) ? 'qualified' : 'not-qualified'
    }
    if (hasFinalStage) {
      return qualifierIds.has(members[0]) ? 'qualified' : 'not-qualified'
    }
    return 'active'
  }

  const normalizedParticipant = members[0]
  if (eliminatedIds.has(normalizedParticipant)) return 'eliminated'
  if (phase === 'final') {
    return qualifierIds.has(normalizedParticipant) ? 'qualified' : 'not-qualified'
  }
  if (hasFinalStage) {
    return qualifierIds.has(normalizedParticipant) ? 'qualified' : 'not-qualified'
  }
  return 'active'
}

function aggregateCompetitionLeaderboard(leaderboard, settings = {}) {
  const mode = settings?.mode || 'individual'

  if (mode === 'pairs') {
    const pairGroups = resolvePairGroups(settings, leaderboard.map((entry) => entry.participant))
    const membership = new Map()
    pairGroups.forEach((pair) => {
      pair.members.forEach((member) => membership.set(normalizeText(member), pair))
    })

    const perPair = new Map()
    ;(leaderboard || []).forEach((entry) => {
      const normalizedParticipant = normalizeText(entry.participant)
      const pair = membership.get(normalizedParticipant) || createSoloPair(entry.participant)
      const pairKey = pair.id

      if (!perPair.has(pairKey)) {
        perPair.set(pairKey, {
          participant: pair.name,
          members: pair.members,
          total: 0,
          dailyTotals: new Map(),
        })
      }

      const current = perPair.get(pairKey)
      current.total = roundScore(current.total + Number(entry.total || 0))
      ;(entry.dailyTotals || []).forEach((daily) => {
        current.dailyTotals.set(daily.date, roundScore((current.dailyTotals.get(daily.date) || 0) + Number(daily.score || 0)))
      })
    })

    return buildLeaderboard(
      Array.from(perPair.values())
        .map((entry) => ({
          participant: entry.participant,
          members: entry.members,
          total: roundScore(entry.total),
          dailyTotals: Array.from(entry.dailyTotals.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([date, score]) => ({ date, score: roundScore(score) })),
        }))
    )
  }

  if (mode === 'groups') {
    const groups = resolveGroupMembership(settings, leaderboard.map((entry) => entry.participant))
    return leaderboard.map((entry) => ({
      ...entry,
      groupId: groups.byParticipant.get(normalizeText(entry.participant))?.id || null,
      groupName: groups.byParticipant.get(normalizeText(entry.participant))?.name || null,
    }))
  }

  if (mode === 'head-to-head') {
    const matchups = resolveMatchupMembership(settings, leaderboard.map((entry) => entry.participant))
    return leaderboard.map((entry) => ({
      ...entry,
      matchupId: matchups.byParticipant.get(normalizeText(entry.participant))?.id || null,
      matchupName: matchups.byParticipant.get(normalizeText(entry.participant))?.name || null,
    }))
  }

  return leaderboard
}

function resolvePairGroups(settings = {}, participantNames = []) {
  const configuredPairs = Array.isArray(settings?.pairs) ? settings.pairs : []
  const participantSet = new Set((participantNames || []).map(normalizeText))
  const normalizedConfigured = configuredPairs
    .map((pair, index) => {
      const members = Array.isArray(pair?.members) ? pair.members.filter(Boolean) : []
      const filteredMembers = members.filter((member) => participantSet.size === 0 || participantSet.has(normalizeText(member)))
      if (filteredMembers.length === 0) return null
      const sortedMembers = [...filteredMembers].sort((a, b) => a.localeCompare(b, 'es'))
      return {
        id: String(pair?.id || sortedMembers.map(normalizeText).join('::') || `pair-${index + 1}`),
        name: pair?.name || sortedMembers.join(' + '),
        members: sortedMembers,
      }
    })
    .filter(Boolean)

  if (normalizedConfigured.length > 0) {
    return normalizedConfigured
  }

  return (participantNames || []).map(createSoloPair)
}

function resolveStructuredPairsForCompetition(campaign, participantNames = []) {
  const configuredPairs = campaign?.modeConfig?.pairs || campaign?.pairs || []
  if (Array.isArray(configuredPairs) && configuredPairs.length > 0) {
    return configuredPairs
  }

  const relations = loadParticipantRelationsForCampaign(campaign?.id)
  const names = Array.from(new Set((participantNames || []).filter(Boolean)))
  const participantSet = new Set(names.map(normalizeText))
  const pairs = new Map()
  const assigned = new Set()

  names.forEach((name) => {
    const normalizedName = normalizeText(name)
    if (!normalizedName || assigned.has(normalizedName)) return

    const related = String(relations?.[name]?.pair || '').trim()
    const normalizedRelated = normalizeText(related)

    if (normalizedRelated && participantSet.has(normalizedRelated)) {
      const members = names
        .filter((candidate) => {
          const normalizedCandidate = normalizeText(candidate)
          return normalizedCandidate === normalizedName || normalizedCandidate === normalizedRelated
        })
        .sort((a, b) => a.localeCompare(b, 'es'))

      const key = members.map(normalizeText).sort().join('::')
      if (!pairs.has(key)) {
        pairs.set(key, {
          id: key,
          name: members.join(' + '),
          members,
        })
      }

      assigned.add(normalizedName)
      assigned.add(normalizedRelated)
      return
    }

    const soloPair = createSoloPair(name)
    pairs.set(soloPair.id, soloPair)
    assigned.add(normalizedName)
  })

  return Array.from(pairs.values())
}

function resolveStructuredGroupsForCompetition(campaign, participantNames = []) {
  const configuredGroups = campaign?.modeConfig?.groups || campaign?.groups || []
  if (Array.isArray(configuredGroups) && configuredGroups.some((group) => Array.isArray(group?.members) && group.members.length > 0)) {
    return configuredGroups
  }

  const relations = loadParticipantRelationsForCampaign(campaign?.id)
  const groups = new Map()

  ;(participantNames || []).filter(Boolean).forEach((name) => {
    const groupValue = String(relations?.[name]?.group || '').trim()
    const normalizedGroup = normalizeText(groupValue)
    if (!normalizedGroup) return

    if (!groups.has(normalizedGroup)) {
      groups.set(normalizedGroup, {
        id: groupValue,
        name: groupValue,
        members: [],
      })
    }

    const current = groups.get(normalizedGroup)
    if (!current.members.some((member) => normalizeText(member) === normalizeText(name))) {
      current.members.push(name)
    }
  })

  return Array.from(groups.values()).map((group, index) => ({
    id: String(group.id || `group-${index + 1}`),
    name: group.name || `Grupo ${index + 1}`,
    members: [...group.members].sort((a, b) => a.localeCompare(b, 'es')),
  }))
}

function resolveStructuredMatchupsForCompetition(campaign, participantNames = []) {
  const configuredMatchups = campaign?.modeConfig?.matchups || campaign?.matchups || []
  if (Array.isArray(configuredMatchups) && configuredMatchups.length > 0) {
    return configuredMatchups.map((matchup, index) => {
      const members = Array.isArray(matchup?.members)
        ? matchup.members.filter(Boolean)
        : [matchup?.player1, matchup?.player2].filter(Boolean)

      const sortedMembers = [...new Set(members)].sort((a, b) => a.localeCompare(b, 'es'))
      return {
        id: String(matchup?.id || sortedMembers.map(normalizeText).join('::') || `matchup-${index + 1}`),
        name: matchup?.name || sortedMembers.join(' vs '),
        members: sortedMembers,
        player1: matchup?.player1 || sortedMembers[0] || '',
        player2: matchup?.player2 || sortedMembers[1] || '',
      }
    }).filter((matchup) => matchup.members.length > 0)
  }

  const relations = loadParticipantRelationsForCampaign(campaign?.id)
  const names = Array.from(new Set((participantNames || []).filter(Boolean)))
  const participantSet = new Set(names.map(normalizeText))
  const matchups = new Map()
  const assigned = new Set()

  names.forEach((name) => {
    const normalizedName = normalizeText(name)
    if (!normalizedName || assigned.has(normalizedName)) return

    const related = String(relations?.[name]?.opponent || '').trim()
    const normalizedRelated = normalizeText(related)

    if (normalizedRelated && participantSet.has(normalizedRelated)) {
      const members = names
        .filter((candidate) => {
          const normalizedCandidate = normalizeText(candidate)
          return normalizedCandidate === normalizedName || normalizedCandidate === normalizedRelated
        })
        .sort((a, b) => a.localeCompare(b, 'es'))

      const key = members.map(normalizeText).sort().join('::')
      if (!matchups.has(key)) {
        matchups.set(key, {
          id: key,
          name: members.join(' vs '),
          members,
          player1: members[0] || '',
          player2: members[1] || '',
        })
      }

      assigned.add(normalizedName)
      assigned.add(normalizedRelated)
      return
    }

    matchups.set(`solo::${normalizedName}`, {
      id: `solo::${normalizedName}`,
      name: `Sin duelo · ${name}`,
      members: [name],
      player1: name,
      player2: '',
    })
    assigned.add(normalizedName)
  })

  return Array.from(matchups.values())
}

function loadParticipantRelationsForCampaign(campaignId) {
  if (!campaignId || typeof window === 'undefined' || !window.localStorage) return {}

  try {
    const raw = window.localStorage.getItem(PARTICIPANT_RELATIONS_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return parsed?.[campaignId] || {}
  } catch {
    return {}
  }
}

function createSoloPair(participantName) {
  return {
    id: `solo::${normalizeText(participantName)}`,
    name: `Sin pareja · ${participantName}`,
    members: [participantName],
  }
}

function resolveGroupMembership(settings = {}, participantNames = []) {
  const groups = Array.isArray(settings?.groups) ? settings.groups : []
  const byParticipant = new Map()

  groups.forEach((group, index) => {
    const descriptor = {
      id: String(group?.id || group?.name || `group-${index + 1}`),
      name: group?.name || `Grupo ${index + 1}`,
    }

    ;(Array.isArray(group?.members) ? group.members : []).forEach((member) => {
      byParticipant.set(normalizeText(member), descriptor)
    })
  })

  ;(participantNames || []).forEach((participant) => {
    const normalizedParticipant = normalizeText(participant)
    if (!byParticipant.has(normalizedParticipant)) {
      byParticipant.set(normalizedParticipant, {
        id: 'sin-grupo',
        name: 'Sin grupo',
      })
    }
  })

  return { byParticipant }
}

function resolveMatchupMembership(settings = {}, participantNames = []) {
  const matchups = Array.isArray(settings?.matchups) ? settings.matchups : []
  const byParticipant = new Map()

  matchups.forEach((matchup, index) => {
    const members = Array.isArray(matchup?.members)
      ? matchup.members
      : [matchup?.player1, matchup?.player2].filter(Boolean)
    const descriptor = {
      id: String(matchup?.id || matchup?.name || `matchup-${index + 1}`),
      name: matchup?.name || members.filter(Boolean).join(' vs ') || `Duelo ${index + 1}`,
    }

    members.forEach((member) => {
      byParticipant.set(normalizeText(member), descriptor)
    })
  })

  ;(participantNames || []).forEach((participant) => {
    const normalizedParticipant = normalizeText(participant)
    if (!byParticipant.has(normalizedParticipant)) {
      byParticipant.set(normalizedParticipant, {
        id: 'sin-duelo',
        name: 'Sin duelo',
      })
    }
  })

  return { byParticipant }
}

function resolveCompetitionEntryCount(settings, leaderboard, fallbackCount) {
  if ((settings?.mode || 'individual') === 'pairs') {
    return leaderboard.length
  }
  return fallbackCount
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
    const hasOfficialResults = hasResultEntries(event.results)

    ;(event.participants || []).forEach((participantRow) => {
      const participant = participantRow?.name || participantRow?.index
      const backendPoints = Number(participantRow?.points)
      const score = hasOfficialResults
        ? Number(fallbackScores[participant] || 0)
        : (Number.isFinite(backendPoints) ? backendPoints : Number(fallbackScores[participant] || 0))

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

  const anyEventHasResults = events.some((event) => hasResultEntries(event.results))

  return Array.from(perParticipant.values())
    .map((entry) => ({
      participant: entry.participant,
      total: roundScore(entry.total),
      dailyTotals: Array.from(entry.dailyTotals.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, score]) => ({ date, score: roundScore(score) })),
    }))
    .filter((entry) => anyEventHasResults || entry.total > 0)
}

function hasResultEntries(results) {
  return Object.values(results || {}).some((race) => race && (race.primero || race.winner?.number))
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
  const payout = resolveCampaignPayout(campaign, appData?.settings?.prizes?.payout || {})
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

function resolveCampaignPayout(campaign, fallback = {}) {
  return {
    firstPct: Number(campaign?.payout?.firstPct ?? fallback.firstPct ?? 0),
    secondPct: Number(campaign?.payout?.secondPct ?? fallback.secondPct ?? 0),
    thirdPct: Number(campaign?.payout?.thirdPct ?? fallback.thirdPct ?? 0),
    adminPct: Number(campaign?.payout?.adminPct ?? fallback.adminPct ?? 0),
  }
}

function buildDailyRankingViewData(appData, campaign, event) {
  const leaderboard = buildLeaderboard(buildRankedEntries(event ? [event] : []))
  const participantsWithPicks = extractParticipantsWithPicks(event ? [event] : [])

  return {
    eventId: event?.id || '',
    date: getEventDate(event),
    leaderboard,
    topThree: leaderboard.slice(0, 3),
    remainder: leaderboard.slice(3),
    uniqueParticipantsWithPicks: participantsWithPicks.length,
    prizeSummary: buildPrizeSummary(appData, campaign, participantsWithPicks),
  }
}

function getEventDate(event) {
  return normalizeDate(event?.meta?.date || event?.date || event?.id || event?.sheetName)
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
