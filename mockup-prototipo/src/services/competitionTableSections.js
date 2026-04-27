import { getModeRules } from '../engine/modeEngine'
import { determinePhase } from '../engine/phaseManager'

const RELATIONS_STORAGE_KEY = 'pollas-participant-relations'

function normalizeText(value) {
  return String(value || '').trim().toLowerCase()
}

function getParticipantName(entry) {
  return String(entry?.participant || entry?.name || '').trim()
}

function loadCampaignRelations(campaignId) {
  if (!campaignId || typeof window === 'undefined' || !window.localStorage) return {}

  try {
    const raw = window.localStorage.getItem(RELATIONS_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return parsed?.[campaignId] || {}
  } catch {
    return {}
  }
}

function getUniqueParticipantNames(picks = []) {
  const seen = new Set()
  const names = []

  picks.forEach((entry) => {
    const name = getParticipantName(entry)
    const normalized = normalizeText(name)
    if (!normalized || seen.has(normalized)) return
    seen.add(normalized)
    names.push(name)
  })

  return names
}

function getMode(campaign, settings) {
  return (
    campaign?.modeConfig?.format ||
    campaign?.format ||
    campaign?.competitionMode ||
    settings?.format ||
    settings?.mode ||
    'individual'
  )
}

function getEffectiveSettings(campaign, settings) {
  return campaign?.modeConfig || campaign || settings || {}
}

function getStaticGroupings(rules, effectiveSettings) {
  const groupings = rules.getTableGrouping?.(effectiveSettings) || []
  return Array.isArray(groupings)
    ? groupings.filter((grouping) => Array.isArray(grouping?.members) && grouping.members.length > 0)
    : []
}

function buildGroupSections(groups = [], relations = {}, participantNames = []) {
  const sections = new Map()

  groups.forEach((group, index) => {
    const id = String(group?.id || group?.name || `group-${index + 1}`)
    sections.set(id, {
      id,
      name: group?.name || `Grupo ${index + 1}`,
      members: [],
    })
  })

  participantNames.forEach((name) => {
    const relationGroup = relations?.[name]?.group
    if (!relationGroup) return

    const id = String(relationGroup)
    if (!sections.has(id)) {
      sections.set(id, { id, name: id, members: [] })
    }

    const section = sections.get(id)
    if (!section.members.some((member) => normalizeText(member) === normalizeText(name))) {
      section.members.push(name)
    }
  })

  return Array.from(sections.values()).filter((section) => section.members.length > 0)
}

function buildPairLikeSections(participantNames = [], relations = {}, relationKey, joinLabel, fallbackLabel) {
  const sections = new Map()
  const assigned = new Set()
  const participantSet = new Set(participantNames.map(normalizeText))

  participantNames.forEach((name) => {
    const normalizedName = normalizeText(name)
    if (assigned.has(normalizedName)) return

    const related = String(relations?.[name]?.[relationKey] || '').trim()
    const normalizedRelated = normalizeText(related)

    if (normalizedRelated && participantSet.has(normalizedRelated)) {
      const pairMembers = participantNames.filter((candidate) => {
        const normalizedCandidate = normalizeText(candidate)
        return normalizedCandidate === normalizedName || normalizedCandidate === normalizedRelated
      })
      const key = pairMembers
        .map((member) => normalizeText(member))
        .sort()
        .join('::')

      if (!sections.has(key)) {
        const displayMembers = [...pairMembers].sort((a, b) => a.localeCompare(b, 'es'))
        sections.set(key, {
          id: key,
          name: displayMembers.join(joinLabel),
          members: displayMembers,
        })
      }

      assigned.add(normalizedName)
      assigned.add(normalizedRelated)
      return
    }

    const soloKey = `solo::${normalizedName}`
    sections.set(soloKey, {
      id: soloKey,
      name: `${fallbackLabel} · ${name}`,
      members: [name],
    })
    assigned.add(normalizedName)
  })

  return Array.from(sections.values())
}

export function buildCompetitionTableSections({ campaign, picks = [], settings = {}, date = '' }) {
  const participantNames = getUniqueParticipantNames(picks)
  if (participantNames.length === 0) return []

  const effectiveSettings = getEffectiveSettings(campaign, settings)
  const mode = getMode(campaign, settings)
  const rules = getModeRules(mode)
  const phase = determinePhase(date, {
    mode,
    hasFinalStage: effectiveSettings?.hasFinalStage ?? campaign?.hasFinalStage ?? false,
    finalDays: effectiveSettings?.finalDays || campaign?.finalDays || [],
  })

  // En duelos, la fase final se juega todos contra todos (sin agrupación por duelo).
  if ((rules.hasMatchups || rules.hasGroups) && phase === 'final') return []

  if (!rules.hasGroups && !rules.hasPairs && !rules.hasMatchups) return []

  const staticGroupings = getStaticGroupings(rules, effectiveSettings)
  if (staticGroupings.length > 0) return staticGroupings

  const relations = loadCampaignRelations(campaign?.id)

  if (rules.hasGroups) {
    return buildGroupSections(effectiveSettings?.groups || [], relations, participantNames)
  }

  if (rules.hasPairs) {
    return buildPairLikeSections(participantNames, relations, 'pair', ' + ', 'Sin pareja')
  }

  if (rules.hasMatchups) {
    return buildPairLikeSections(participantNames, relations, 'opponent', ' vs ', 'Sin duelo')
  }

  return []
}
