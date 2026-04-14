/**
 * useCampaignParticipants.js
 *
 * Hook para obtener y filtrar participantes por campaña.
 * Permite saber qué studs ya están registrados en campañas específicas.
 */

import { useMemo, useCallback } from 'react'
import useAppStore from '../store/useAppStore'
import api from '../api'

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

    return explicitIds.some((targetId) => targetId === eventId || eventId.includes(targetId))
      || event.campaignId === campaign.id
  }, [getExplicitEventIds])

  const normalizeDate = useCallback((value) => {
    if (!value) return null
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value

    const latinDate = String(value).match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
    if (latinDate) {
      const [, day, month, year] = latinDate
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }

    const embeddedDate = String(value).match(/(\d{4}-\d{2}-\d{2})/)
    return embeddedDate ? embeddedDate[1] : null
  }, [])

  const matchesCampaignEventFallback = useCallback((event, campaign) => {
    const eventDate = normalizeDate(event?.meta?.date || event?.date || event?.sheetName)
    if (!eventDate || !campaign) return false

    if (campaign.type === 'diaria') {
      return eventDate === normalizeDate(campaign.date)
    }

    if (campaign.startDate && eventDate < normalizeDate(campaign.startDate)) return false
    if (campaign.endDate && eventDate > normalizeDate(campaign.endDate)) return false

    return true
  }, [normalizeDate])

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
      const matchingEvents = appData.events.filter((event) => (
        matchesCampaignEvent(event, campaign) || matchesCampaignEventFallback(event, campaign)
      ))

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
  }, [appData, getRelatedCampaigns, matchesCampaignEvent, matchesCampaignEventFallback])

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
    const matchingEvents = appData.events.filter((event) => matchesCampaignEvent(event, campaign))

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
  }, [appData, findCampaignById, matchesCampaignEvent])

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
    
    // Buscar en todos los eventos objetivo
    for (const eventId of targetEventIds) {
      const event = appData?.events?.[eventId]
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
      // Primero verificar si existe
      const event = appData?.events?.[eventId]
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
