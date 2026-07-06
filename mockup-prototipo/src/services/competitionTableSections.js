import { getModeRules } from '../engine/modeEngine'
import { determinePhase } from '../engine/phaseManager'
import { extractEventRotatingDuelMatchups, isRotatingDuelMode } from './rotatingDuelScoring'

function normalizeText(value) {
  return String(value || '').trim().toLowerCase()
}

function getParticipantName(entry) {
  return String(entry?.participant || entry?.name || '').trim()
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

function getEntryDuelOpponent(entry) {
  return String(
    entry?.rotatingDuelOpponent ||
    entry?.duelOpponent ||
    entry?.dailyDuelOpponent ||
    entry?.originalParticipant?.rotatingDuelOpponent ||
    entry?.originalParticipant?.duelOpponent ||
    entry?.originalParticipant?.dailyDuelOpponent ||
    ''
  ).trim()
}

function buildRotatingDuelSections(picks = [], participantNames = []) {
  const participantSet = new Set(participantNames.map(normalizeText))
  const participants = picks.map((entry) => ({
    ...(entry?.originalParticipant || {}),
    name: getParticipantName(entry),
    rotatingDuelOpponent: getEntryDuelOpponent(entry),
    duelOpponent: getEntryDuelOpponent(entry),
  }))

  const matchups = extractEventRotatingDuelMatchups({ participants })
  const sections = new Map()
  const assigned = new Set()

  matchups.forEach((matchup) => {
    const members = (matchup.members || [])
      .map((member) => String(member || '').trim())
      .filter((member) => participantSet.has(normalizeText(member)))

    if (members.length < 2) return

    const key = members.map(normalizeText).sort().join('::')
    const displayMembers = [...members].sort((a, b) => a.localeCompare(b, 'es'))
    sections.set(key, {
      id: key,
      name: displayMembers.join(' vs '),
      members: displayMembers,
    })

    displayMembers.forEach((member) => assigned.add(normalizeText(member)))
  })

  participantNames.forEach((name) => {
    const normalized = normalizeText(name)
    if (!normalized || assigned.has(normalized)) return

    const soloKey = `solo::${normalized}`
    sections.set(soloKey, {
      id: soloKey,
      name: `Sin duelo - ${name}`,
      members: [name],
    })
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
  const hasRotatingMatchups = rules.hasRotatingMatchups || isRotatingDuelMode(mode)

  if ((rules.hasMatchups || hasRotatingMatchups || rules.hasGroups) && phase === 'final') return []

  if (!rules.hasGroups && !rules.hasPairs && !rules.hasMatchups && !hasRotatingMatchups) return []

  const staticGroupings = getStaticGroupings(rules, effectiveSettings)
  if (staticGroupings.length > 0) return staticGroupings

  const relations = {}

  if (rules.hasGroups) {
    return buildGroupSections(effectiveSettings?.groups || [], relations, participantNames)
  }

  if (rules.hasPairs) {
    return buildPairLikeSections(participantNames, relations, 'pair', ' + ', 'Sin pareja')
  }

  if (rules.hasMatchups) {
    return buildPairLikeSections(participantNames, relations, 'opponent', ' vs ', 'Sin duelo')
  }

  if (hasRotatingMatchups) {
    return buildRotatingDuelSections(picks, participantNames)
  }

  return []
}
