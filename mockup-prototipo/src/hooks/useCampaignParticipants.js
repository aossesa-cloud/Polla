/**
 * useCampaignParticipants.js
 *
 * Hook para obtener y filtrar participantes por campaña.
 * Permite saber qué studs ya están registrados en campañas específicas.
 */

import { useMemo, useCallback } from 'react'
import useAppStore from '../store/useAppStore'
import api from '../api'
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
  return {
    hasFinalStage: modeConfig.hasFinalStage ?? campaign?.hasFinalStage ?? false,
    finalDays: modeConfig.finalDays || campaign?.finalDays || [],
    mode: modeConfig.format || campaign?.format || campaign?.competitionMode || 'individual',
    qualifiersCount: modeConfig.qualifiersCount ?? campaign?.qualifiersCount ?? null,
    qualifiersPerGroup: modeConfig.qualifiersPerGroup ?? campaign?.qualifiersPerGroup ?? 4,
    groups: modeConfig.groups || campaign?.groups || [],
    pairs: modeConfig.pairs || campaign?.pairs || [],
    matchups: modeConfig.matchups || campaign?.matchups || [],
  }
}

function computeFinalQualifiers(appData, campaign, operationDate) {
  if (campaign.type !== 'semanal' && campaign.type !== 'mensual') return null

  const settings = buildCampaignPhaseSettings(campaign)
  if (!settings.hasFinalStage) return null
  if (determinePhase(operationDate, settings) !== 'final') return null

  const allEvents = appData?.events || []

  const classificationEvents = allEvents.filter(ev => {
    if (!ev?.participants?.length) return false
    const evDate = ev?.meta?.date || ev?.date || ''
    if (!evDate || evDate >= operationDate) return false
    if (determinePhase(evDate, settings) === 'final') return false
    if (ev.campaignType !== campaign.type) return false
    return isCampaignActiveForDate({ ...campaign }, evDate, appData)
  })

  if (classificationEvents.length === 0) return null

  const accumulatedScores = {}
  classificationEvents.forEach(ev => {
    const evDate = ev?.meta?.date || ev?.date || ''
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

    if (campaign.type !== 'diaria') {
      return explicitMatches
    }

    if (explicitMatches.length > 0) {
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
      const qualifiers = computeFinalQualifiers(appData, campaign, operationDate)
      if (qualifiers !== null) {
        qualifierSets.set(campaign.id, new Set(qualifiers.map(q => String(q).toLowerCase())))
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
          const name = String(participant?.name || '').toLowerCase().trim()
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

        const normalizedName = name.toLowerCase().trim()

        // Solo clasificados pueden ingresar picks en la fase final
        if (qualifierSets.has(campaign.id) && !qualifierSets.get(campaign.id).has(normalizedName)) {
          return false
        }

        const registeredNames = new Set(
          (registeredByCampaign.get(campaign.id) || []).map((entry) => String(entry || '').toLowerCase().trim())
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
        selectable.set(name.toLowerCase().trim(), participant)
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
