import { getModeRules } from '../engine/modeEngine'
import { determinePhase } from '../engine/phaseManager'
import { extractEventRotatingDuelMatchups, isRotatingDuelMode } from './rotatingDuelScoring'
import { getManualPlayoffMatchups, isPlayoffFinalMode } from './playoffFinalMode'

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

function getConfiguredPairSections(effectiveSettings, participantNames = []) {
  const participantSet = new Set(participantNames.map(normalizeText))
  const pairs = effectiveSettings?.pairs || []

  return (Array.isArray(pairs) ? pairs : [])
    .map((pair, index) => {
      const members = Array.isArray(pair?.members)
        ? pair.members.map((member) => String(member || '').trim()).filter(Boolean)
        : []

      if (!members.some((member) => participantSet.has(normalizeText(member)))) return null

      return {
        ...pair,
        id: String(pair?.id || members.map(normalizeText).sort().join('::') || `pair-${index + 1}`),
        name: pair?.name || members.join(' + '),
        members,
      }
    })
    .filter(Boolean)
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

function buildManualPlayoffDuelSections(matchups = [], participantNames = []) {
  if (!Array.isArray(matchups) || matchups.length === 0) return []

  const participantByKey = new Map(
    participantNames
      .map((name) => [normalizeText(name), String(name || '').trim()])
      .filter(([key, name]) => key && name)
  )
  const sections = new Map()
  const assigned = new Set()

  ;(matchups || []).forEach((matchup, index) => {
    const rawMembers = Array.isArray(matchup?.members)
      ? matchup.members
      : [matchup?.player1, matchup?.player2]
    const members = []
    const memberKeys = new Set()

    rawMembers.forEach((member) => {
      const key = normalizeText(member)
      if (!key || memberKeys.has(key)) return
      memberKeys.add(key)
      members.push(participantByKey.get(key) || String(member || '').trim())
    })

    const visibleMembers = members.filter((member) => participantByKey.has(normalizeText(member)))
    if (visibleMembers.length === 0) return

    const key = Array.from(memberKeys).sort().join('::') || `manual-playoff-${index + 1}`
    const name = members.length >= 2
      ? `${members[0]} vs ${members[1]}`
      : `${members[0]} libre`

    sections.set(key, { id: key, name, members })
    visibleMembers.forEach((member) => assigned.add(normalizeText(member)))
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
    playoffDays: effectiveSettings?.playoffDays || campaign?.playoffDays || [],
  })

  // En la final de duplas se elimina el duelo fijo, pero cada dupla sigue unida.
  if (rules.hasPairDuels && phase === 'final') {
    return getConfiguredPairSections(effectiveSettings, participantNames)
  }

  // En los demás duelos, la fase final se juega todos contra todos.
  const isPlayoffDuelPhase = isPlayoffFinalMode(mode) && phase === 'playoff'
  const hasRotatingMatchups = rules.hasRotatingMatchups || isRotatingDuelMode(mode) || isPlayoffDuelPhase

  if ((rules.hasMatchups || hasRotatingMatchups || rules.hasGroups) && phase === 'final') return []

  if (!rules.hasGroups && !rules.hasPairs && !rules.hasPairDuels && !rules.hasMatchups && !hasRotatingMatchups) return []

  if (isPlayoffDuelPhase) {
    const manualPlayoffMatchups = getManualPlayoffMatchups(effectiveSettings, date)
    const manualSections = buildManualPlayoffDuelSections(manualPlayoffMatchups, participantNames)
    if (manualSections.length > 0) return manualSections

    return buildRotatingDuelSections(picks, participantNames)
  }

  const staticGroupings = getStaticGroupings(rules, effectiveSettings)
  if (staticGroupings.length > 0) return staticGroupings

  // Los duelos de duplas necesitan cuatro integrantes configurados. Si aún no
  // existen duelos, no los degradamos a simples parejas independientes.
  if (rules.hasPairDuels) return []

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
