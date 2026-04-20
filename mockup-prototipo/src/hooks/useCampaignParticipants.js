/**
 * useCampaignParticipants.js
 *
 * Hook para obtener y filtrar participantes por campaña.
 * Permite saber qué studs ya están registrados en campañas específicas.
 */

import { useMemo, useCallback } from 'react'
import useAppStore from '../store/useAppStore'
import api from '../api'

const PARTICIPANT_RELATIONS_KEY = 'pollas-participant-relations'
import {
  getCampaignFirstActiveDate,
  isCampaignActiveForDate,
  isCampaignEventEligible,
  normalizeDate as normalizeCampaignDate,
} from '../services/campaignEligibility'
import { determinePhase, getQualifiers } from '../engine/phaseManager'
import { calculateDailyScores } from '../engine/scoreEngine'
import { resolveCampaignPickTargetEventIds } from '../services/campaignEventTargets'
import { resolveEventOperationalData } from '../services/campaignOperationalData'

function buildCampaignPhaseSettings(campaign) {
  const modeConfig = campaign?.modeConfig || {}
  const mode = modeConfig.format || campaign?.format || campaign?.competitionMode || 'individual'
  const hasFinalStageSource = modeConfig.hasFinalStage ?? campaign?.hasFinalStage ?? false
  const hasFinalStage = mode === 'head-to-head' || mode === 'final-qualification'
    ? true
    : Boolean(hasFinalStageSource)

  return {
    hasFinalStage,
    finalDays: modeConfig.finalDays || campaign?.finalDays || [],
    mode,
    qualifiersCount: modeConfig.qualifiersCount ?? campaign?.qualifiersCount ?? null,
    qualifiersPerGroup: modeConfig.qualifiersPerGroup ?? campaign?.qualifiersPerGroup ?? 4,
    groups: modeConfig.groups || campaign?.groups || [],
    pairs: modeConfig.pairs || campaign?.pairs || [],
    matchups: modeConfig.matchups || campaign?.matchups || [],
  }
}

function isOperationDateInFinalPhase(campaign, settings, operationDate) {
  const normalizedOperationDate = normalizeCampaignDate(operationDate)
  if (!normalizedOperationDate) return false

  if (determinePhase(normalizedOperationDate, settings) === 'final') {
    return true
  }

  if (settings?.mode === 'head-to-head') {
    const endDate = normalizeCampaignDate(campaign?.endDate)
    if (endDate && normalizedOperationDate >= endDate) {
      return true
    }
  }

  return false
}

function loadMatchupsForCampaign(campaignId, participantNames) {
  const normalizeKey = (value) => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

  const getRelationByName = (relations, participantName) => {
    const direct = relations?.[participantName]
    if (direct) return direct
    const target = normalizeKey(participantName)
    const entry = Object.entries(relations || {}).find(([key]) => normalizeKey(key) === target)
    return entry?.[1] || null
  }

  try {
    const raw = typeof window !== 'undefined' ? window.localStorage?.getItem(PARTICIPANT_RELATIONS_KEY) : null
    const relations = raw ? JSON.parse(raw)?.[campaignId] || {} : {}
    const names = Array.from(new Set((participantNames || []).filter(Boolean)))
    const nameSet = new Set(names.map((n) => normalizeKey(n)))
    const matchups = new Map()
    const assigned = new Set()
    names.forEach((name) => {
      const key = normalizeKey(name)
      if (assigned.has(key)) return
      const relation = getRelationByName(relations, name)
      const opponent = String(relation?.opponent || '').trim()
      const opponentKey = normalizeKey(opponent)
      if (opponentKey && nameSet.has(opponentKey)) {
        const members = [name, opponent].sort((a, b) => a.localeCompare(b, 'es'))
        const mapKey = members.map((m) => normalizeKey(m)).sort().join('::')
        if (!matchups.has(mapKey)) {
          matchups.set(mapKey, { id: mapKey, name: members.join(' vs '), members, player1: members[0], player2: members[1] })
        }
        assigned.add(key)
        assigned.add(opponentKey)
      }
    })
    return Array.from(matchups.values())
  } catch {
    return []
  }
}

function extractEventDate(ev) {
  const direct = normalizeCampaignDate(ev?.meta?.date || ev?.date || '')
  if (direct) return direct
  const fromId = String(ev?.id || '').match(/(\d{4}-\d{2}-\d{2})/)
  return fromId ? fromId[1] : ''
}

function hasAnyExplicitCampaignLink(ev) {
  const eventId = String(ev?.id || '')
  const campaignId = String(ev?.campaignId || ev?.meta?.campaignId || '').trim()
  const explicitEventId = String(ev?.eventId || ev?.meta?.eventId || '').trim()
  const scopedCampaignPattern = /(?:^|::|-)campaign-(?:daily|weekly|monthly|diaria|semanal|mensual)-/i

  return Boolean(campaignId || explicitEventId || scopedCampaignPattern.test(eventId))
}

function normalizeName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function eventBelongsToCampaign(ev, campaign, appData) {
  const eventId = String(ev?.id || '')
  const campaignId = String(campaign?.id || '')
  const explicitMatch = eventExplicitlyBelongsToCampaign(ev, campaign)
  if (explicitMatch) return true
  if (hasAnyExplicitCampaignLink(ev)) return false

  const evDate = extractEventDate(ev)
  if (!evDate || !campaign) return false

  if (campaign.type === 'diaria') {
    return evDate === normalizeCampaignDate(campaign.date)
  }

  const eventTrackText = [ev?.meta?.trackName, ev?.meta?.trackId, ev?.sheetName, ev?.title, ev?.name]
    .filter(Boolean)
    .join(' ')

  return isCampaignEventEligible(campaign, evDate, eventTrackText, appData)
}

function eventExplicitlyBelongsToCampaign(ev, campaign) {
  const eventId = String(ev?.id || '')
  const campaignId = String(campaign?.id || '')
  return Boolean(
    (campaignId && eventId.includes(campaignId)) ||
    String(ev?.campaignId || ev?.meta?.campaignId || '') === String(campaign?.id || '')
  )
}

function computeFinalQualifiers(appData, campaign, operationDate) {
  if (campaign.type !== 'semanal' && campaign.type !== 'mensual') return null

  const settings = buildCampaignPhaseSettings(campaign)
  const isHeadToHead = settings.mode === 'head-to-head'
  const allEvents = appData?.events || []

  const candidateEvents = allEvents.filter(ev => {
    if (!ev?.participants?.length) return false
    const evDate = extractEventDate(ev)
    if (!evDate) return false
    return true
  })

  const explicitCampaignEvents = candidateEvents.filter((ev) => eventExplicitlyBelongsToCampaign(ev, campaign))
  const campaignEvents = explicitCampaignEvents.length > 0
    ? explicitCampaignEvents
    : candidateEvents.filter((ev) => eventBelongsToCampaign(ev, campaign, appData))

  // Head-to-head: mostrar ganadores de duelos una vez que la clasificación ya pasó
  if (isHeadToHead) {
    const pastEvents = campaignEvents.filter(ev => extractEventDate(ev) < operationDate)
    if (pastEvents.length === 0) return null

    // Acumular puntajes de todos los eventos pasados
    const accumulatedScores = {}
    pastEvents.forEach(ev => {
      const evDate = extractEventDate(ev)
      const picks = (ev.participants || []).map(p => ({
        participant: p.name || String(p.index || ''),
        picks: Array.isArray(p.picks) ? p.picks : [],
      }))
      const operationalData = resolveEventOperationalData(appData, campaign, ev, evDate)
      const dayScores = calculateDailyScores(picks, operationalData.results, ev.scoring || campaign.scoring || { mode: 'dividend' })
      picks.forEach(({ participant }) => {
        if (!(participant in accumulatedScores)) accumulatedScores[participant] = 0
      })
      Object.entries(dayScores).forEach(([name, score]) => {
        accumulatedScores[name] = (accumulatedScores[name] || 0) + Number(score || 0)
      })
    })

    const rankings = Object.entries(accumulatedScores)
      .map(([participant, total]) => ({ participant, total }))
      .sort((a, b) => b.total - a.total)
    if (rankings.length === 0) return null

    // Usar matchups del config o cargar desde localStorage
    let matchups = settings.matchups || []
    if (matchups.length === 0) {
      matchups = loadMatchupsForCampaign(campaign.id, rankings.map(r => r.participant))
    }
    if (matchups.length === 0) {
      const fallbackCount = Math.floor(rankings.length / 2)
      return rankings.slice(0, Math.max(1, fallbackCount)).map((entry) => entry.participant)
    }

    const winners = getQualifiers(rankings, { ...settings, matchups })
    if (Array.isArray(winners) && winners.length > 0) {
      return winners
    }

    const fallbackCount = Math.floor(rankings.length / 2)
    return rankings.slice(0, Math.max(1, fallbackCount)).map((entry) => entry.participant)
  }

  if (!settings.hasFinalStage) return null

  // Si ya existe cualquier evento final con participantes (hoy o pasado), esos son los clasificados reales
  const anyFinalEvent = campaignEvents
    .filter(ev => {
      const evDate = extractEventDate(ev)
      return determinePhase(evDate, settings) === 'final' && ev.participants?.length > 0
    })
    .sort((a, b) => extractEventDate(b).localeCompare(extractEventDate(a)))[0]

  if (anyFinalEvent) {
    return (anyFinalEvent.participants || [])
      .map(p => p.name || String(p.index || ''))
      .filter(Boolean)
  }

  // No hay evento final aún — solo aplicar filtro si estamos en fase final hoy
  if (determinePhase(operationDate, settings) !== 'final') return null

  const classificationEvents = campaignEvents.filter(ev => {
    const evDate = extractEventDate(ev)
    if (evDate >= operationDate) return false
    if (determinePhase(evDate, settings) === 'final') return false
    return true
  })

  if (classificationEvents.length === 0) return null

  const accumulatedScores = {}
  classificationEvents.forEach(ev => {
    const evDate = extractEventDate(ev)
    const picks = (ev.participants || []).map(p => ({
      participant: p.name || String(p.index || ''),
      picks: Array.isArray(p.picks) ? p.picks : [],
    }))
    const operationalData = resolveEventOperationalData(appData, campaign, ev, evDate)
    const dayScores = calculateDailyScores(picks, operationalData.results, ev.scoring || campaign.scoring || { mode: 'dividend' })

    picks.forEach(({ participant }) => {
      if (!(participant in accumulatedScores)) accumulatedScores[participant] = 0
    })
    Object.entries(dayScores).forEach(([name, score]) => {
      accumulatedScores[name] = (accumulatedScores[name] || 0) + Number(score || 0)
    })
  })

  const accumulatedRankings = Object.entries(accumulatedScores)
    .map(([participant, total]) => ({ participant, total }))
    .sort((a, b) => b.total - a.total)

  return accumulatedRankings.length > 0 ? getQualifiers(accumulatedRankings, settings) : null
}

/**
 * Hook principal para gestión de participantes por campaña
 */
export function useCampaignParticipants() {
  const { appData, refresh } = useAppStore()

  const getAllCampaigns = useCallback(() => {
    const campaigns = appData?.campaigns || {}
    return [
      ...(campaigns.diaria || []).map((campaign) => ({ ...campaign, type: 'diaria' })),
      ...(campaigns.semanal || []).map((campaign) => ({ ...campaign, type: 'semanal' })),
      ...(campaigns.mensual || []).map((campaign) => ({ ...campaign, type: 'mensual' })),
    ]
  }, [appData])

  const findCampaignById = useCallback((campaignId) => {
    return getAllCampaigns().find((campaign) => campaign.id === campaignId) || null
  }, [getAllCampaigns])

  const getExplicitEventIds = useCallback((campaign) => {
    if (!campaign) return []
    const eventIds = new Set()
    if (campaign.eventId) eventIds.add(String(campaign.eventId))
    ;(campaign.eventIds || []).forEach((eventId) => {
      if (eventId) eventIds.add(String(eventId))
    })
    return Array.from(eventIds)
  }, [])

  const matchesCampaignEvent = useCallback((event, campaign) => {
    if (!event || !campaign) return false
    const eventId = String(event.id || '')
    const explicitIds = getExplicitEventIds(campaign)
    const campaignId = String(campaign.id || '')

    return explicitIds.some((targetId) => targetId === eventId || eventId.includes(targetId))
      || (campaignId && eventId.includes(campaignId))
      || event.campaignId === campaign.id
  }, [getExplicitEventIds])

  const matchesCampaignEventFallback = useCallback((event, campaign) => {
    const eventDate = normalizeCampaignDate(event?.meta?.date || event?.date || event?.sheetName)
    if (!eventDate || !campaign) return false

    if (campaign.type === 'diaria') {
      return eventDate === normalizeCampaignDate(campaign.date)
    }

    const eventTrackText = [event?.meta?.trackName, event?.meta?.trackId, event?.sheetName, event?.title, event?.name].filter(Boolean).join(' ')
    return isCampaignEventEligible(campaign, eventDate, eventTrackText, appData)
  }, [appData])

  const getParticipantEventsForCampaign = useCallback((campaign) => {
    if (!Array.isArray(appData?.events) || !campaign) return []

    const explicitMatches = appData.events.filter((event) => (
      matchesCampaignEvent(event, campaign)
    ))

    if (campaign.type !== 'diaria' && explicitMatches.length > 0) {
      return explicitMatches
    }

    if (campaign.type === 'diaria' && explicitMatches.length > 0) {
      return explicitMatches
    }

    return appData.events.filter((event) => (
      matchesCampaignEventFallback(event, campaign)
    ))
  }, [appData, matchesCampaignEvent, matchesCampaignEventFallback])

  const getRelatedCampaigns = useCallback((campaignIds) => {
    const selectedCampaigns = (campaignIds || [])
      .map((campaignId) => findCampaignById(campaignId))
      .filter(Boolean)

    if (selectedCampaigns.length === 0) return []

    const allCampaigns = getAllCampaigns()
    const related = new Map()

    selectedCampaigns.forEach((campaign) => {
      allCampaigns.forEach((candidate) => {
        if (!candidate || candidate.id === campaign.id) return
        if ((candidate.type || 'diaria') !== (campaign.type || 'diaria')) return
        if (campaign.groupId && candidate.groupId !== campaign.groupId) return
        if (!candidate.enabled) return
        related.set(candidate.id, candidate)
      })
    })

    return Array.from(related.values())
  }, [findCampaignById, getAllCampaigns])

  const getParticipantsFromRelatedCampaigns = useCallback((campaignIds) => {
    if (!Array.isArray(appData?.events) || !campaignIds || campaignIds.length === 0) return []

    const relatedCampaigns = getRelatedCampaigns(campaignIds)
    const seenNames = new Set()
    const participants = []

    relatedCampaigns.forEach((campaign) => {
      const matchingEvents = getParticipantEventsForCampaign(campaign)

      matchingEvents.forEach((event) => {
        ;(event.participants || []).forEach((participant) => {
          const normalizedName = String(participant?.name || '').toLowerCase().trim()
          if (!normalizedName || seenNames.has(normalizedName)) return
          seenNames.add(normalizedName)

          const registryParticipant = (appData?.registry || []).find((item) =>
            String(item?.name || '').toLowerCase().trim() === normalizedName
          )

          participants.push({
            ...participant,
            ...(registryParticipant || {}),
            name: registryParticipant?.name || participant.name,
            group: registryParticipant?.group || campaign.groupId || '',
            source: 'related-campaign',
            relatedCampaignId: campaign.id,
          })
        })
      })
    })

    return participants
  }, [appData, getParticipantEventsForCampaign, getRelatedCampaigns])

  // ============================================
  // OBTENER PARTICIPANTES DE UNA CAMPAÑA
  // ============================================
  
  /**
   * Obtiene todos los participantes de una campaña específica
   * @param {string} campaignId - ID de la campaña
   * @returns {Array} Array de participantes { index, name, picks }
   */
  const getParticipantsByCampaign = useCallback((campaignId) => {
    if (!Array.isArray(appData?.events)) {
      return []
    }

    const campaign = findCampaignById(campaignId)
    if (!campaign) return []

    const participants = []
    const seenNames = new Set()
    const matchingEvents = getParticipantEventsForCampaign(campaign)

    matchingEvents.forEach((event) => {
      ;(event.participants || []).forEach((participant) => {
        const normalizedName = String(participant?.name || '').toLowerCase().trim()
        if (!normalizedName || seenNames.has(normalizedName)) return
        seenNames.add(normalizedName)
        participants.push({
          ...participant,
          eventId: event.id,
          campaignId,
        })
      })
    })

    return participants
  }, [appData, findCampaignById, getParticipantEventsForCampaign])

  /**
   * Obtiene participantes de múltiples campañas
   * @param {Array} campaignIds - Array de IDs de campañas
   * @returns {Array} Array de participantes
   */
  const getParticipantsByCampaigns = useCallback((campaignIds) => {
    if (!campaignIds || campaignIds.length === 0) return []

    const participants = []

    campaignIds.forEach(campaignId => {
      participants.push(...getParticipantsByCampaign(campaignId))
    })

    return participants
  }, [getParticipantsByCampaign])

  // ============================================
  // VERIFICAR SI UN PARTICIPANTE EXISTE
  // ============================================
  
  /**
   * Verifica si un participante ya existe en una campaña
   * @param {string} participantName - Nombre del participante
   * @param {string} campaignId - ID de la campaña
   * @returns {boolean}
   */
  const isParticipantInCampaign = useCallback((participantName, campaignId) => {
    const participants = getParticipantsByCampaign(campaignId)
    return participants.some(p => 
      p.name.toLowerCase().trim() === participantName.toLowerCase().trim()
    )
  }, [getParticipantsByCampaign])

  /**
   * Verifica si un participante existe en cualquiera de las campañas dadas
   * @param {string} participantName - Nombre del participante
   * @param {Array} campaignIds - Array de IDs de campañas
   * @returns {boolean}
   */
  const isParticipantInAnyCampaign = useCallback((participantName, campaignIds) => {
    if (!campaignIds || campaignIds.length === 0) return false
    
    const participants = getParticipantsByCampaigns(campaignIds)
    return participants.some(p => 
      p.name.toLowerCase().trim() === participantName.toLowerCase().trim()
    )
  }, [getParticipantsByCampaigns])

  const canParticipantEnterCampaignOnDate = useCallback((campaign, participantName, operationDate) => {
    if (!campaign || !participantName) {
      return { allowed: false, reason: 'Faltan datos del participante o de la campaña.' }
    }

    if (campaign.type === 'diaria') {
      return { allowed: true }
    }

    const normalizedOperationDate = normalizeCampaignDate(operationDate)
    const firstActiveDate = getCampaignFirstActiveDate(campaign, appData)

    if (!normalizedOperationDate || !firstActiveDate || normalizedOperationDate <= firstActiveDate) {
      return { allowed: true }
    }

    const isAlreadyEnrolled = isParticipantInCampaign(participantName, campaign.id)
    if (isAlreadyEnrolled) {
      return { allowed: true }
    }

    return {
      allowed: false,
      reason: `El stud "${participantName}" no quedó inscrito el primer día de la campaña.`,
    }
  }, [appData, isParticipantInCampaign])

  // ============================================
  // FILTRAR STUDS DISPONIBLES
  // ============================================
  
  /**
   * Filtra los studs disponibles (excluye los ya registrados en las campañas)
   * @param {Array} campaignIds - IDs de campañas seleccionadas
   * @returns {Array} Studs disponibles { name, group, ... }
   */
  const getAvailableStuds = useCallback((campaignIds) => {
    const allRegistry = appData?.registry || []
    const relatedCampaignParticipants = getParticipantsFromRelatedCampaigns(campaignIds)

    if (!campaignIds || campaignIds.length === 0) {
      return allRegistry
    }

    const registeredParticipants = getParticipantsByCampaigns(campaignIds)
    const registeredNames = new Set(
      registeredParticipants.map(p => p.name.toLowerCase().trim())
    )

    // Filtrar studs que NO están registrados
    const mergedParticipants = new Map()

    allRegistry.forEach((stud) => {
      if (!stud?.name) return
      mergedParticipants.set(stud.name.toLowerCase().trim(), stud)
    })

    relatedCampaignParticipants.forEach((participant) => {
      if (!participant?.name) return
      const key = participant.name.toLowerCase().trim()
      if (!mergedParticipants.has(key)) {
        mergedParticipants.set(key, participant)
      }
    })

    return Array.from(mergedParticipants.values()).filter((stud) =>
      !registeredNames.has(stud.name.toLowerCase().trim())
    )
  }, [appData, getParticipantsByCampaigns, getParticipantsFromRelatedCampaigns])

  const getSelectableStudsForCampaigns = useCallback((campaignIds, operationDate) => {
    const allRegistry = appData?.registry || []
    if (!campaignIds || campaignIds.length === 0) return allRegistry

    const campaigns = campaignIds
      .map((campaignId) => findCampaignById(campaignId))
      .filter(Boolean)

    if (campaigns.length === 0) return allRegistry

    const selectable = new Map()
    const registeredByCampaign = new Map()
    const registeredByCurrentEvent = new Map()

    // Pre-compute qualifier sets for campaigns in final phase
    const qualifierSets = new Map()
    campaigns.forEach((campaign) => {
      const settings = buildCampaignPhaseSettings(campaign)
      const isFinalPhase = isOperationDateInFinalPhase(campaign, settings, operationDate)
      const isHeadToHead = settings.mode === 'head-to-head'
      const hasMissingFinalDays = !Array.isArray(settings.finalDays) || settings.finalDays.length === 0
      if (!isFinalPhase && !(isHeadToHead && settings.hasFinalStage && hasMissingFinalDays)) return

      const qualifiers = computeFinalQualifiers(appData, campaign, operationDate)
      if (Array.isArray(qualifiers)) {
        qualifierSets.set(campaign.id, new Set(qualifiers.map((q) => normalizeName(q))))
      }
    })

    campaigns.forEach((campaign) => {
      registeredByCampaign.set(
        campaign.id,
        getParticipantsByCampaign(campaign.id).map((participant) => participant.name)
      )

      const currentEventIds = resolveCampaignPickTargetEventIds(campaign, operationDate)
      const currentEventNames = new Set()

      currentEventIds.forEach((eventId) => {
        const event = (appData?.events || []).find((entry) => String(entry?.id || '') === String(eventId))
        ;(event?.participants || []).forEach((participant) => {
          const name = normalizeName(participant?.name)
          if (name) currentEventNames.add(name)
        })
      })

      registeredByCurrentEvent.set(campaign.id, currentEventNames)
    })

    allRegistry.forEach((participant) => {
      const name = participant?.name
      if (!name) return

      const allowedSomewhere = campaigns.some((campaign) => {
        const dateRule = canParticipantEnterCampaignOnDate(campaign, name, operationDate)
        if (!dateRule.allowed) return false

        const normalizedName = normalizeName(name)

        // Solo clasificados pueden ingresar picks en la fase final
        if (qualifierSets.has(campaign.id) && !qualifierSets.get(campaign.id).has(normalizedName)) {
          return false
        }

        const registeredNames = new Set(
          (registeredByCampaign.get(campaign.id) || []).map((entry) => normalizeName(entry))
        )
        const currentEventNames = registeredByCurrentEvent.get(campaign.id) || new Set()

        if (campaign.type === 'diaria') {
          return !currentEventNames.has(normalizedName)
        }

        const firstActiveDate = getCampaignFirstActiveDate(campaign, appData)
        const normalizedOperationDate = normalizeCampaignDate(operationDate)
        const isFirstActiveDay = Boolean(
          normalizedOperationDate &&
          firstActiveDate &&
          normalizedOperationDate <= firstActiveDate
        )

        if (isFirstActiveDay) {
          return !registeredNames.has(normalizedName) && !currentEventNames.has(normalizedName)
        }

        return registeredNames.has(normalizedName) && !currentEventNames.has(normalizedName)
      })

      if (allowedSomewhere) {
        selectable.set(normalizeName(name), participant)
      }
    })

    return Array.from(selectable.values())
  }, [appData, canParticipantEnterCampaignOnDate, findCampaignById, getParticipantsByCampaign])

  // ============================================
  // VALIDAR PARTICIPANTE ANTES DE GUARDAR
  // ============================================
  
  /**
   * Valida que un participante no exista en las campañas objetivo
   * @param {string} participantName - Nombre del participante
   * @param {Array} targetEventIds - IDs de eventos donde se guardará
   * @returns {{ isValid: boolean, error?: string }}
   */
  const validateParticipant = useCallback((participantName, targetEventIds) => {
    if (!participantName || !targetEventIds || targetEventIds.length === 0) {
      return { isValid: false, error: 'Faltan datos del participante o campañas' }
    }
    
    const trimmedName = participantName.trim().toLowerCase()
    const events = Array.isArray(appData?.events) ? appData.events : Object.values(appData?.events || {})
    
    // Buscar en todos los eventos objetivo
    for (const eventId of targetEventIds) {
      const event = events.find((item) => String(item?.id || '') === String(eventId))
      if (event?.participants) {
        const exists = event.participants.some(p => 
          p.name.toLowerCase().trim() === trimmedName
        )
        if (exists) {
          return { 
            isValid: false, 
            error: `El stud "${participantName}" ya está registrado en esta campaña` 
          }
        }
      }
    }
    
    return { isValid: true }
  }, [appData])

  // ============================================
  // GUARDAR PARTICIPANTE CON VALIDACIÓN
  // ============================================
  
  /**
   * Guarda un participante con validación de duplicados
   * @param {string} eventId - ID del evento
   * @param {Object} participant - Datos del participante { index, name, picks }
   * @returns {{ success: boolean, error?: string }}
   */
  const saveParticipantSafe = useCallback(async (eventId, participant) => {
    try {
      const events = Array.isArray(appData?.events) ? appData.events : Object.values(appData?.events || {})
      // Primero verificar si existe
      const event = events.find((item) => String(item?.id || '') === String(eventId))
      if (event?.participants) {
        const exists = event.participants.some(p => 
          p.name.toLowerCase().trim() === participant.name.toLowerCase().trim() ||
          p.index === participant.index
        )
        
        if (exists) {
          return { 
            success: false, 
            error: `El stud "${participant.name}" (índice ${participant.index}) ya está registrado en esta campaña` 
          }
        }
      }
      
      // Si no existe, guardar
      await api.savePickForEvent(eventId, participant)
      
      // Recargar datos
      await refresh()
      
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [appData, refresh])

  return {
    // Getters
    getParticipantsByCampaign,
    getParticipantsByCampaigns,
    getAvailableStuds,
    getSelectableStudsForCampaigns,
    canParticipantEnterCampaignOnDate,
    
    // Validators
    isParticipantInCampaign,
    isParticipantInAnyCampaign,
    validateParticipant,
    
    // Safe save
    saveParticipantSafe,
  }
}

// ============================================
// HOOK AUXILIAR PARA PICKENTRY
// ============================================

/**
 * Hook optimizado para el componente PickEntry
 * Filtra participantes basado en campañas seleccionadas
 */
export function usePickEntryParticipants(selectedCampaignIds) {
  const { appData } = useAppStore()
  const { getAvailableStuds } = useCampaignParticipants()
  
  // Studs disponibles filtrados
  const availableStuds = useMemo(() => {
    return getAvailableStuds(selectedCampaignIds)
  }, [getAvailableStuds, selectedCampaignIds])
  
  // Conteo de studs ya registrados
  const registeredCount = useMemo(() => {
    if (!selectedCampaignIds || selectedCampaignIds.length === 0) return 0
    const allRegistry = appData?.registry || []
    return allRegistry.length - availableStuds.length
  }, [appData, availableStuds, selectedCampaignIds])
  
  return {
    availableStuds,
    registeredCount,
    totalCount: appData?.registry?.length || 0
  }
}
