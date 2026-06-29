export function buildParticipantActivity(registry = [], events = [], { referenceDate = todayIsoDate() } = {}) {
  const activityByName = new Map()
  const normalizedReferenceDate = normalizeDate(referenceDate) || todayIsoDate()

  ;(events || []).forEach((event) => {
    const eventDate = getEventDate(event)
    if (!eventDate) return

    ;(event?.participants || []).forEach((participant) => {
      const name = getParticipantName(participant)
      if (!name || !hasPlayedPicks(participant?.picks)) return

      const key = normalizeName(name)
      const current = activityByName.get(key)
      if (!current || eventDate > current.lastPlayedDate) {
        activityByName.set(key, {
          lastPlayedDate: eventDate,
          lastEventName: event?.sheetName || event?.title || event?.name || event?.id || '',
        })
      }
    })
  })

  return (registry || []).map((participant) => {
    const activity = activityByName.get(normalizeName(participant?.name))
    const daysInactive = activity?.lastPlayedDate
      ? diffDays(activity.lastPlayedDate, normalizedReferenceDate)
      : null

    return {
      ...participant,
      lastPlayedDate: activity?.lastPlayedDate || null,
      lastEventName: activity?.lastEventName || '',
      daysInactive: daysInactive === null ? null : Math.max(0, daysInactive),
    }
  })
}

export function filterInactiveParticipants(participants = [], minInactiveDays = 30) {
  const threshold = Math.max(0, Number(minInactiveDays) || 0)

  return (participants || [])
    .filter((participant) => (
      participant?.lastPlayedDate
        ? Number(participant.daysInactive || 0) >= threshold
        : true
    ))
    .sort((left, right) => {
      if (!left.lastPlayedDate && right.lastPlayedDate) return -1
      if (left.lastPlayedDate && !right.lastPlayedDate) return 1
      if (left.daysInactive !== right.daysInactive) return Number(right.daysInactive || 0) - Number(left.daysInactive || 0)
      return String(left.name || '').localeCompare(String(right.name || ''), 'es')
    })
}

function getParticipantName(participant) {
  return String(
    participant?.name ||
    participant?.participant ||
    participant?.stud ||
    participant?.originalName ||
    '',
  ).trim()
}

function hasPlayedPicks(picks) {
  if (Array.isArray(picks)) {
    return picks.some((pick) => normalizePickValue(pick))
  }

  if (picks && typeof picks === 'object') {
    return Object.values(picks).some((pick) => normalizePickValue(pick))
  }

  return false
}

function normalizePickValue(value) {
  const raw = value && typeof value === 'object'
    ? (value.horse ?? value.pick ?? value.number ?? value.value ?? '')
    : value

  return String(raw ?? '').trim()
}

function getEventDate(event) {
  return normalizeDate(event?.meta?.date || event?.date || event?.id || event?.sheetName)
}

function normalizeDate(value) {
  if (!value) return ''
  const raw = String(value).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw

  const latinDate = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (latinDate) {
    const [, day, month, year] = latinDate
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  const embeddedDate = raw.match(/(\d{4}-\d{2}-\d{2})/)
  return embeddedDate ? embeddedDate[1] : ''
}

function diffDays(fromDate, toDate) {
  const start = new Date(`${fromDate}T12:00:00`)
  const end = new Date(`${toDate}T12:00:00`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0
  return Math.floor((end.getTime() - start.getTime()) / 86_400_000)
}

function todayIsoDate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function normalizeName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}
