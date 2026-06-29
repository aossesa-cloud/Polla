export function findDuplicatePickGroups(entries = [], raceCount = 0) {
  const groupsBySignature = new Map()
  const races = Number(raceCount) || getMaxPickCount(entries)

  ;(entries || []).forEach((entry) => {
    const name = getEntryName(entry)
    if (!name) return

    const normalizedPicks = normalizeEntryPicks(entry?.picks, races)
    if (!normalizedPicks.some(Boolean)) return

    const signature = normalizedPicks.join('|')
    if (!groupsBySignature.has(signature)) {
      groupsBySignature.set(signature, {
        key: signature,
        picks: normalizedPicks,
        members: [],
      })
    }

    groupsBySignature.get(signature).members.push({
      name,
      index: entry?.originalParticipant?.index ?? entry?.index ?? '',
      entry,
    })
  })

  return Array.from(groupsBySignature.values())
    .filter((group) => group.members.length > 1)
    .sort((left, right) => right.members.length - left.members.length || left.members[0].name.localeCompare(right.members[0].name))
}

export function filterAcknowledgedDuplicateGroups(groups = [], acknowledgedKeys = new Set()) {
  const acknowledged = toSet(acknowledgedKeys)

  return (groups || [])
    .map((group) => {
      const pendingGroup = narrowGroupToPendingMembers(group, acknowledged)
      if (!pendingGroup) return null

      const approvalKeys = getDuplicateGroupApprovalKeys(pendingGroup)
      const hasPendingKey = approvalKeys.some((key) => !acknowledged.has(key))
      return hasPendingKey ? { ...pendingGroup, approvalKeys } : null
    })
    .filter(Boolean)
}

export function getDuplicateGroupApprovalKeys(group) {
  const members = (group?.members || [])
    .map((member) => normalizeName(member?.name))
    .filter(Boolean)
    .sort()

  const keys = []
  for (let left = 0; left < members.length; left += 1) {
    for (let right = left + 1; right < members.length; right += 1) {
      keys.push(`${group?.key || ''}::${members[left]}::${members[right]}`)
    }
  }
  return keys
}

export function collectDuplicateGroupApprovalKeys(groups = []) {
  return Array.from(
    new Set(
      (groups || [])
        .flatMap((group) => getDuplicateGroupApprovalKeys(group))
        .filter(Boolean)
    )
  )
}

export function getDuplicateApprovalScopeKey({ eventId, date, fallback = 'general' } = {}) {
  return String(date || eventId || fallback || 'general').trim() || 'general'
}

export function getCampaignDuplicateApprovalKeys(campaign, scopeKey) {
  const approvals = campaign?.duplicatePickApprovals || {}
  const raw = approvals?.[scopeKey]
  const keys = Array.isArray(raw)
    ? raw
    : (Array.isArray(raw?.keys) ? raw.keys : [])

  return new Set(keys.filter(Boolean))
}

export function withCampaignDuplicateApprovals(campaign, scopeKey, keys = [], metadata = {}) {
  const currentKeys = getCampaignDuplicateApprovalKeys(campaign, scopeKey)
  ;(keys || []).forEach((key) => {
    if (key) currentKeys.add(key)
  })

  const currentRecord = campaign?.duplicatePickApprovals?.[scopeKey]
  const normalizedRecord = currentRecord && typeof currentRecord === 'object' && !Array.isArray(currentRecord)
    ? currentRecord
    : {}

  return {
    ...(campaign || {}),
    duplicatePickApprovals: {
      ...(campaign?.duplicatePickApprovals || {}),
      [scopeKey]: {
        ...normalizedRecord,
        ...metadata,
        keys: Array.from(currentKeys).sort(),
        updatedAt: new Date().toISOString(),
      },
    },
  }
}

function narrowGroupToPendingMembers(group, acknowledgedKeys) {
  const members = group?.members || []
  if (members.length < 2) return null

  const approvedNames = getApprovedNamesForGroup(group, acknowledgedKeys)
  if (approvedNames.size === 0) return group

  const newMembers = members.filter((member) => !approvedNames.has(normalizeName(member?.name)))
  if (newMembers.length === 0) return null

  if (newMembers.length >= 2) {
    return { ...group, members: newMembers }
  }

  const referenceMember = members.find((member) => approvedNames.has(normalizeName(member?.name)))
  const pendingMembers = [newMembers[0], referenceMember].filter(Boolean)

  return pendingMembers.length >= 2 ? { ...group, members: pendingMembers } : null
}

function getApprovedNamesForGroup(group, acknowledgedKeys) {
  const approvedNames = new Set()
  const prefix = `${group?.key || ''}::`

  toSet(acknowledgedKeys).forEach((key) => {
    if (!String(key).startsWith(prefix)) return

    String(key)
      .slice(prefix.length)
      .split('::')
      .map(normalizeName)
      .filter(Boolean)
      .forEach((name) => approvedNames.add(name))
  })

  return approvedNames
}

function toSet(value) {
  if (value instanceof Set) return value
  if (Array.isArray(value)) return new Set(value)
  return new Set()
}

function getMaxPickCount(entries = []) {
  return Math.max(
    0,
    ...(entries || []).map((entry) => (Array.isArray(entry?.picks) ? entry.picks.length : 0)),
  )
}

function normalizeEntryPicks(picks, raceCount) {
  return Array.from({ length: raceCount }, (_, index) => normalizePickValue(picks?.[index]))
}

function normalizePickValue(value) {
  const raw = typeof value === 'object' && value !== null
    ? (value.horse ?? value.pick ?? value.number ?? value.value ?? '')
    : value

  return String(raw ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase()
}

function getEntryName(entry) {
  return String(
    entry?.participant ||
    entry?.name ||
    entry?.originalParticipant?.name ||
    '',
  ).trim()
}

function normalizeName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim()
}
