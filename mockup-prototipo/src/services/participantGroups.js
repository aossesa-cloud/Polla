export function getParticipantGroupIds(participant) {
  const values = [
    ...(Array.isArray(participant?.groups) ? participant.groups : []),
    ...(Array.isArray(participant?.groupIds) ? participant.groupIds : []),
    participant?.group,
    participant?.groupId,
  ]

  return Array.from(
    new Set(values.map((value) => String(value || '').trim()).filter(Boolean))
  )
}

export function isParticipantInGroup(participant, groupId) {
  const targetGroupId = String(groupId || '').trim()
  if (!targetGroupId) return true
  return getParticipantGroupIds(participant).includes(targetGroupId)
}

export function withParticipantGroup(participant, groupId) {
  const targetGroupId = String(groupId || '').trim()
  const groups = targetGroupId
    ? Array.from(new Set([...getParticipantGroupIds(participant), targetGroupId]))
    : getParticipantGroupIds(participant)

  return {
    ...(participant || {}),
    group: participant?.group || groups[0] || '',
    groups,
  }
}

export function withoutParticipantGroup(participant, groupId) {
  const targetGroupId = String(groupId || '').trim()
  const groups = getParticipantGroupIds(participant).filter((id) => id !== targetGroupId)

  return {
    ...(participant || {}),
    group: groups.includes(participant?.group) ? participant.group : groups[0] || '',
    groups,
  }
}
