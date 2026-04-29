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

export function normalizeParticipantName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
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

function getPersistedCompetitionRelations(campaignOrId) {
  if (!campaignOrId || typeof campaignOrId === 'string') return {}

  const relations = {}
  const modeConfig = campaignOrId?.modeConfig || {}

  ;(modeConfig.pairs || campaignOrId?.pairs || []).forEach((pair) => {
    const members = Array.isArray(pair?.members) ? pair.members.filter(Boolean) : []
    if (members.length < 2) return

    const [first, second] = members
    relations[first] = { ...(relations[first] || {}), pair: second }
    relations[second] = { ...(relations[second] || {}), pair: first }
  })

  ;(modeConfig.groups || campaignOrId?.groups || []).forEach((group, index) => {
    const groupId = String(group?.id || group?.name || `group-${index + 1}`).trim()
    if (!groupId) return

    ;(group?.members || []).filter(Boolean).forEach((member) => {
      relations[member] = { ...(relations[member] || {}), group: groupId }
    })
  })

  ;(modeConfig.matchups || campaignOrId?.matchups || []).forEach((matchup) => {
    const members = Array.isArray(matchup?.members)
      ? matchup.members.filter(Boolean)
      : [matchup?.player1, matchup?.player2].filter(Boolean)

    if (members.length < 2) return

    const [first, second] = members
    relations[first] = { ...(relations[first] || {}), opponent: second }
    relations[second] = { ...(relations[second] || {}), opponent: first }
  })

  return relations
}

export function getCompetitionRelations(allRelations, campaignOrId) {
  const competitionId = resolveCompetitionId(campaignOrId)
  return competitionId ? allRelations?.[competitionId] || {} : {}
}

function getRelationByName(relations, participantName) {
  const direct = relations?.[participantName]
  if (direct) return direct

  const target = normalizeParticipantName(participantName)
  const entry = Object.entries(relations || {}).find(([key]) => normalizeParticipantName(key) === target)
  return entry?.[1] || null
}

export function getParticipantRelation(allRelations, campaignOrId, participantName) {
  const persistedRelations = getPersistedCompetitionRelations(campaignOrId)
  const persistedRelation = getRelationByName(persistedRelations, participantName)
  if (persistedRelation) return persistedRelation

  const competitionRelations = getCompetitionRelations(allRelations, campaignOrId)
  return getRelationByName(competitionRelations, participantName) || {}
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
  const competitionRelations = nextRelations[competitionId]

  const clearInverse = (sourceName, relationKey) => {
    if (!sourceName || !['pair', 'opponent'].includes(relationKey)) return

    const sourceRelation = getRelationByName(competitionRelations, sourceName)
    const previousTarget = String(sourceRelation?.[relationKey] || '').trim()
    if (!previousTarget) return

    const previousTargetRelation = competitionRelations[previousTarget]
    if (previousTargetRelation?.[relationKey] === sourceName) {
      delete previousTargetRelation[relationKey]
      if (Object.keys(previousTargetRelation).length === 0) {
        delete competitionRelations[previousTarget]
      }
    }
  }

  clearInverse(participantName, type)
  clearInverse(value, type)

  if (!competitionRelations[participantName]) competitionRelations[participantName] = {}
  competitionRelations[participantName][type] = value

  if (type === 'opponent' || type === 'pair') {
    if (!competitionRelations[value]) competitionRelations[value] = {}
    competitionRelations[value][type] = participantName
  }

  saveRelations(nextRelations)
}

export function removeParticipantRelation(campaignOrId, participantName, type) {
  const competitionId = resolveCompetitionId(campaignOrId)
  if (!competitionId || !participantName || !type) return

  const nextRelations = loadRelations()
  const competitionRelations = nextRelations[competitionId]
  if (!competitionRelations) return

  const participantKey = Object.keys(competitionRelations).find(
    (key) => normalizeParticipantName(key) === normalizeParticipantName(participantName)
  )
  if (!participantKey) return

  const participantRelation = competitionRelations[participantKey]
  const linkedValue = String(participantRelation?.[type] || '').trim()
  delete participantRelation[type]

  if (Object.keys(participantRelation).length === 0) {
    delete competitionRelations[participantKey]
  }

  if (linkedValue && (type === 'pair' || type === 'opponent')) {
    const linkedKey = Object.keys(competitionRelations).find(
      (key) => normalizeParticipantName(key) === normalizeParticipantName(linkedValue)
    )

    if (linkedKey && competitionRelations[linkedKey]?.[type]) {
      delete competitionRelations[linkedKey][type]
      if (Object.keys(competitionRelations[linkedKey]).length === 0) {
        delete competitionRelations[linkedKey]
      }
    }
  }

  if (Object.keys(competitionRelations).length === 0) {
    delete nextRelations[competitionId]
  }

  saveRelations(nextRelations)
}

function getRelationParticipantNames(relations, candidateParticipants = []) {
  const namesByKey = new Map()

  Object.entries(relations || {}).forEach(([participantName, relation]) => {
    const normalizedName = normalizeParticipantName(participantName)
    if (normalizedName && !namesByKey.has(normalizedName)) {
      namesByKey.set(normalizedName, String(participantName).trim())
    }

    ;['pair', 'opponent'].forEach((key) => {
      const value = String(relation?.[key] || '').trim()
      const normalizedValue = normalizeParticipantName(value)
      if (normalizedValue && !namesByKey.has(normalizedValue)) {
        namesByKey.set(normalizedValue, value)
      }
    })
  })

  ;(candidateParticipants || []).forEach((entry) => {
    const name = typeof entry === 'string' ? entry : entry?.name
    const normalized = normalizeParticipantName(name)
    if (!normalized || namesByKey.has(normalized)) return

    const relation = getRelationByName(relations, name)
    if (!relation?.pair && !relation?.group && !relation?.opponent) return
    namesByKey.set(normalized, String(name).trim())
  })

  return Array.from(namesByKey.values())
}

function buildPairEntries(relations, participantNames) {
  const names = Array.from(new Set((participantNames || []).filter(Boolean)))
  const participantSet = new Set(names.map(normalizeParticipantName))
  const pairs = new Map()
  const assigned = new Set()

  names.forEach((name) => {
    const normalizedName = normalizeParticipantName(name)
    if (!normalizedName || assigned.has(normalizedName)) return

    const relation = getRelationByName(relations, name)
    const related = String(relation?.pair || '').trim()
    const normalizedRelated = normalizeParticipantName(related)

    if (normalizedRelated && participantSet.has(normalizedRelated)) {
      const members = names
        .filter((candidate) => {
          const normalizedCandidate = normalizeParticipantName(candidate)
          return normalizedCandidate === normalizedName || normalizedCandidate === normalizedRelated
        })
        .sort((a, b) => a.localeCompare(b, 'es'))

      const key = members.map(normalizeParticipantName).sort().join('::')
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

    const soloKey = `solo::${normalizedName}`
    pairs.set(soloKey, {
      id: soloKey,
      name: `Sin pareja · ${name}`,
      members: [name],
    })
    assigned.add(normalizedName)
  })

  return Array.from(pairs.values())
}

function buildGroupEntries(relations, participantNames, configuredGroups = []) {
  const configuredNameById = new Map(
    (configuredGroups || []).map((group, index) => [
      String(group?.id || group?.name || `group-${index + 1}`),
      group?.name || `Grupo ${index + 1}`,
    ])
  )

  const groups = new Map()
  Array.from(new Set((participantNames || []).filter(Boolean))).forEach((name) => {
    const relation = getRelationByName(relations, name)
    const groupValue = String(relation?.group || '').trim()
    if (!groupValue) return

    const id = String(groupValue)
    if (!groups.has(id)) {
      groups.set(id, {
        id,
        name: configuredNameById.get(id) || groupValue,
        members: [],
      })
    }

    const current = groups.get(id)
    if (!current.members.some((member) => normalizeParticipantName(member) === normalizeParticipantName(name))) {
      current.members.push(name)
    }
  })

  return Array.from(groups.values())
    .filter((group) => group.members.length > 0)
    .map((group) => ({
      ...group,
      members: [...group.members].sort((a, b) => a.localeCompare(b, 'es')),
    }))
}

function buildMatchupEntries(relations, participantNames) {
  const names = Array.from(new Set((participantNames || []).filter(Boolean)))
  const participantSet = new Set(names.map(normalizeParticipantName))
  const matchups = new Map()
  const assigned = new Set()

  names.forEach((name) => {
    const normalizedName = normalizeParticipantName(name)
    if (!normalizedName || assigned.has(normalizedName)) return

    const relation = getRelationByName(relations, name)
    const related = String(relation?.opponent || '').trim()
    const normalizedRelated = normalizeParticipantName(related)

    if (normalizedRelated && participantSet.has(normalizedRelated)) {
      const members = names
        .filter((candidate) => {
          const normalizedCandidate = normalizeParticipantName(candidate)
          return normalizedCandidate === normalizedName || normalizedCandidate === normalizedRelated
        })
        .sort((a, b) => a.localeCompare(b, 'es'))

      const key = members.map(normalizeParticipantName).sort().join('::')
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

    const soloKey = `solo::${normalizedName}`
    matchups.set(soloKey, {
      id: soloKey,
      name: `Sin duelo · ${name}`,
      members: [name],
      player1: name,
      player2: '',
    })
    assigned.add(normalizedName)
  })

  return Array.from(matchups.values())
}

export function buildStructuredRelationConfig(campaign, candidateParticipants = [], allRelations = null) {
  const mode = resolveCampaignMode(campaign)
  const rules = getModeRules(mode)
  const relations = allRelations ? getCompetitionRelations(allRelations, campaign) : getCompetitionRelations(loadRelations(), campaign)
  const participantNames = getRelationParticipantNames(relations, candidateParticipants)

  if (rules.hasPairs) {
    return { pairs: buildPairEntries(relations, participantNames) }
  }

  if (rules.hasGroups) {
    return {
      groups: buildGroupEntries(relations, participantNames, campaign?.modeConfig?.groups || campaign?.groups || []),
    }
  }

  if (rules.hasMatchups) {
    return { matchups: buildMatchupEntries(relations, participantNames) }
  }

  return {}
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
    if (value) {
      persistParticipantRelation(campaign || campaignOrId, participantName, type, value)
    } else {
      removeParticipantRelation(campaign || campaignOrId, participantName, type)
    }
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
