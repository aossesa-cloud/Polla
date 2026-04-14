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

  // ============================================
  // OBTENER PARTICIPANTES DE UNA CAMPAÑA
  // ============================================
  
  /**
   * Obtiene todos los participantes de una campaña específica
   * @param {string} campaignId - ID de la campaña
   * @returns {Array} Array de participantes { index, name, picks }
   */
  const getParticipantsByCampaign = useCallback((campaignId) => {
    if (!appData?.events) {
      console.log('[useCampaignParticipants] No events in appData')
      return []
    }

    // Los eventos tienen IDs de carrera (0, 1, 2, etc.) no de campaña
    // Buscar participantes en TODOS los eventos ya que no hay vinculación directa
    const participants = []
    const seenNames = new Set()

    console.log('[useCampaignParticipants] Searching participants for campaign:', campaignId)
    console.log('[useCampaignParticipants] Events:', Object.keys(appData.events))

    // Recopilar todos los participantes únicos de todos los eventos
    Object.entries(appData.events).forEach(([eventId, event]) => {
      if (event.participants && Array.isArray(event.participants)) {
        event.participants.forEach(p => {
          const normalizedName = p.name?.toLowerCase().trim()
          if (normalizedName && !seenNames.has(normalizedName)) {
            seenNames.add(normalizedName)
            participants.push({
              ...p,
              eventId,
              campaignId: campaignId // Asignar el ID de campaña manualmente
            })
          }
        })
      }
    })

    console.log(`[useCampaignParticipants] Found ${participants.length} unique participants`)
    console.log(`[useCampaignParticipants] Participants:`, participants.map(p => p.name))
    return participants
  }, [appData])

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

    console.log(`[useCampaignParticipants] ${campaignIds.length} campaigns have ${participants.length} total participants`)
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

    if (!campaignIds || campaignIds.length === 0) {
      return allRegistry
    }

    console.log('[useCampaignParticipants] getAvailableStuds called with:', campaignIds)
    console.log('[useCampaignParticipants] Registry:', allRegistry.map(r => r.name))
    console.log('[useCampaignParticipants] Events:', appData?.events ? Object.keys(appData.events) : 'none')

    // Obtener todos los participantes ya registrados en estas campañas
    const registeredParticipants = getParticipantsByCampaigns(campaignIds)
    const registeredNames = new Set(
      registeredParticipants.map(p => p.name.toLowerCase().trim())
    )

    console.log('[useCampaignParticipants] Registered names:', Array.from(registeredNames))

    // Filtrar studs que NO están registrados
    const available = allRegistry.filter(stud =>
      !registeredNames.has(stud.name.toLowerCase().trim())
    )
    
    console.log('[useCampaignParticipants] Available studs:', available.map(s => s.name))
    return available
  }, [appData, getParticipantsByCampaigns])

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
