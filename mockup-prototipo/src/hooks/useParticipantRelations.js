/**
 * useParticipantRelations.js
 *
 * Persiste y consulta relaciones especiales entre participantes:
 * - pareja (modo pairs)
 * - grupo (modo groups)
 * - contrincante (modo head-to-head)
 *
 * Se carga una sola vez por participante y se reutiliza.
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import api from '../api'
import useAppStore from '../store/useAppStore'
import { getModeRules } from '../engine/modeEngine'

const STORAGE_KEY = 'pollas-participant-relations'

/**
 * Obtiene relaciones desde localStorage.
 * Estructura: { competitionId: { participantName: { pair, group, opponent } } }
 */
function loadRelations() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

/**
 * Guarda relaciones en localStorage.
 */
function saveRelations(relations) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(relations))
}

export function useParticipantRelations(competitionId) {
  const [allRelations, setAllRelations] = useState(loadRelations)
  const { appData } = useAppStore()

  const competitionRelations = useMemo(() => {
    return allRelations[competitionId] || {}
  }, [allRelations, competitionId])

  const mode = appData?.settings?.weekly?.format || 'individual'
  const rules = useMemo(() => getModeRules(mode), [mode])

  /**
   * Verifica si un participante ya tiene su relación configurada.
   */
  const hasSetupRelation = useCallback((participantName) => {
    if (!rules.requiresRelationSetup) return true
    const rel = competitionRelations[participantName]
    if (!rel) return false

    if (rules.hasPairs) return !!rel.pair
    if (rules.hasGroups) return !!rel.group
    if (rules.hasMatchups) return !!rel.opponent
    return true
  }, [competitionRelations, rules])

  /**
   * Obtiene la relación de un participante.
   */
  const getRelation = useCallback((participantName) => {
    return competitionRelations[participantName] || {}
  }, [competitionRelations])

  /**
   * Guarda la relación de un participante.
   */
  const saveRelation = useCallback(async (participantName, type, value) => {
    const newRelations = { ...allRelations }
    if (!newRelations[competitionId]) {
      newRelations[competitionId] = {}
    }
    if (!newRelations[competitionId][participantName]) {
      newRelations[competitionId][participantName] = {}
    }
    newRelations[competitionId][participantName][type] = value
    setAllRelations(newRelations)
    saveRelations(newRelations)

    // Also save to backend
    try {
      await api.upsertRegistryParticipant({
        name: participantName,
        [type]: value,
        group: type === 'group' ? value : competitionRelations[participantName]?.group,
        diaria: competitionRelations[participantName]?.diaria,
        semanal: competitionRelations[participantName]?.semanal,
        mensual: competitionRelations[participantName]?.mensual,
      })
    } catch (err) {
      console.error('Failed to save relation to backend:', err)
    }
  }, [allRelations, competitionId, competitionRelations])

  /**
   * Obtiene todos los participantes que aún no tienen relación configurada.
   */
  const participantsNeedingRelation = useCallback((participantNames) => {
    if (!rules.requiresRelationSetup) return []
    return participantNames.filter(name => !hasSetupRelation(name))
  }, [rules, hasSetupRelation])

  /**
   * Determina qué tipo de relación necesita configurarse.
   */
  const relationType = useMemo(() => {
    if (!rules.requiresRelationSetup) return null
    return rules.relationType
  }, [rules])

  /**
   * Obtiene opciones para el selector de relaciones.
   */
  const relationOptions = useMemo(() => {
    if (!appData) return []

    if (rules.hasGroups && appData.settings?.weekly?.groups) {
      return appData.settings.weekly.groups.map(g => ({ id: g.id, label: g.name }))
    }

    if (rules.hasPairs && appData.settings?.weekly?.pairs) {
      return appData.settings.weekly.pairs.map(p => ({ id: p.id, label: p.name || `Pareja ${p.id}` }))
    }

    if (rules.hasMatchups) {
      // For head-to-head, opponent is another participant name
      return []  // Free text input
    }

    return []
  }, [appData, rules])

  return {
    hasSetupRelation,
    getRelation,
    saveRelation,
    participantsNeedingRelation,
    relationType,
    relationOptions,
    needsRelationSetup: rules.requiresRelationSetup,
  }
}
