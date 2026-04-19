/**
 * useParticipantRelations.js
 *
 * Persiste y consulta relaciones especiales entre participantes:
 * - pareja (modo pairs)
 * - grupo (modo groups)
 * - contrincante (modo head-to-head)
 *
 * Las relaciones viven por campaña, no en settings.weekly global.
 */

import { useState, useCallback, useMemo } from 'react'
import useAppStore from '../store/useAppStore'
import { getModeRules } from '../engine/modeEngine'

const STORAGE_KEY = 'pollas-participant-relations'

export function loadRelations() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveRelations(relations) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(relations))
}

function resolveCompetitionId(campaignOrId) {
  return typeof campaignOrId === 'string' ? campaignOrId : campaignOrId?.id || ''
}

function resolveCampaignMode(campaign) {
  return (
    campaign?.modeConfig?.format ||
    campaign?.format ||
    campaign?.competitionMode ||
    'individual'
  )
}

export function getCompetitionRelations(allRelations, campaignOrId) {
  const competitionId = resolveCompetitionId(campaignOrId)
  return competitionId ? allRelations?.[competitionId] || {} : {}
}

export function getParticipantRelation(allRelations, campaignOrId, participantName) {
  const competitionRelations = getCompetitionRelations(allRelations, campaignOrId)
  return competitionRelations?.[participantName] || {}
}

export function campaignNeedsRelationSetup(campaign) {
  return getModeRules(resolveCampaignMode(campaign)).requiresRelationSetup
}

export function hasParticipantRelationSetup(allRelations, campaign, participantName) {
  const rules = getModeRules(resolveCampaignMode(campaign))
  if (!rules.requiresRelationSetup) return true

  const relation = getParticipantRelation(allRelations, campaign, participantName)
  if (!relation) return false

  if (rules.hasPairs) return !!relation.pair
  if (rules.hasGroups) return !!relation.group
  if (rules.hasMatchups) return !!relation.opponent
  return true
}

export function persistParticipantRelation(campaignOrId, participantName, type, value) {
  const competitionId = resolveCompetitionId(campaignOrId)
  if (!competitionId || !participantName || !type || !value) return

  const nextRelations = loadRelations()
  if (!nextRelations[competitionId]) nextRelations[competitionId] = {}
  if (!nextRelations[competitionId][participantName]) nextRelations[competitionId][participantName] = {}
  nextRelations[competitionId][participantName][type] = value
  saveRelations(nextRelations)
}

export function getRelationOptionsForCampaign(
  campaign,
  appData,
  participantName,
  candidateParticipants = []
) {
  const rules = getModeRules(resolveCampaignMode(campaign))

  if (rules.hasGroups) {
    const groups = campaign?.modeConfig?.groups || campaign?.groups || []
    return groups.map((group, index) => ({
      id: String(group?.id || group?.name || `group-${index + 1}`),
      label: group?.name || `Grupo ${index + 1}`,
    }))
  }

  if (rules.hasPairs || rules.hasMatchups) {
    const candidates = (candidateParticipants?.length ? candidateParticipants : appData?.registry || [])
      .map((entry) => (typeof entry === 'string' ? entry : entry?.name))
      .filter(Boolean)

    const currentName = String(participantName || '').trim().toLowerCase()
    const uniqueNames = []
    const seen = new Set()

    candidates.forEach((name) => {
      const normalized = String(name).trim().toLowerCase()
      if (!normalized || normalized === currentName || seen.has(normalized)) return
      seen.add(normalized)
      uniqueNames.push(String(name))
    })

    return uniqueNames.map((name) => ({ id: name, label: name }))
  }

  return []
}

export function useParticipantRelations(campaignOrId, campaignData = null, candidateParticipants = []) {
  const [allRelations, setAllRelations] = useState(loadRelations)
  const { appData } = useAppStore()
  const campaign = campaignData || (typeof campaignOrId === 'object' ? campaignOrId : null)
  const mode = resolveCampaignMode(campaign)
  const rules = useMemo(() => getModeRules(mode), [mode])

  const hasSetupRelation = useCallback((participantName) => {
    if (!rules.requiresRelationSetup) return true
    return hasParticipantRelationSetup(allRelations, campaign || campaignOrId, participantName)
  }, [allRelations, campaign, campaignOrId, rules])

  const getRelation = useCallback((participantName) => {
    return getParticipantRelation(allRelations, campaign || campaignOrId, participantName)
  }, [allRelations, campaign, campaignOrId])

  const saveRelation = useCallback((participantName, type, value) => {
    persistParticipantRelation(campaign || campaignOrId, participantName, type, value)
    setAllRelations(loadRelations())
  }, [campaign, campaignOrId])

  const participantsNeedingRelation = useCallback((participantNames) => {
    if (!rules.requiresRelationSetup) return []
    return participantNames.filter((name) => !hasSetupRelation(name))
  }, [hasSetupRelation, rules])

  const relationType = useMemo(() => {
    if (!rules.requiresRelationSetup) return null
    return rules.relationType
  }, [rules])

  const relationOptions = useMemo(() => {
    return getRelationOptionsForCampaign(campaign, appData, null, candidateParticipants)
  }, [appData, campaign, candidateParticipants])

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
