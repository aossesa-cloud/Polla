/**
 * dataAdapter.js
 *
 * Transforma la forma de datos que devuelve la API del legacy
 * en la forma que los componentes React esperan.
 *
 * Legacy shape:
 *   { settings, programs, studs, registry, programa, events, semanal, mensual }
 *
 * React shape:
 *   { settings, campaigns, registryGroups, events, programs, registry }
 */

// ===== SETTINGS =====
// El legacy ya tiene settings.campaigns.* y settings.registryGroups
// Solo normalizamos nombres y defaults
function adaptSettings(settings) {
  if (!settings) return {}

  const campaigns = settings.campaigns || {}
  const registryGroups = settings.registryGroups || []
  const prizes = settings.prizes || {}
  const themes = settings.themes || {}
  const weekly = settings.weekly || {}
  const monthly = settings.monthly || {}

  return {
    campaigns,
    registryGroups,
    prizes,
    themes,
    weekly: {
      format: weekly.format || 'todos-contra-todos',
      activeDays: weekly.activeDays || [],
      finalDays: weekly.finalDays || [],
      groupSize: weekly.groupSize || 8,
      qualifiersPerGroup: weekly.qualifiersPerGroup || 4,
      pairMode: weekly.pairMode || false,
      showTotalsByDefault: weekly.showTotalsByDefault || false,
    },
    monthly: {
      hipodromos: monthly.hipodromos || ['Hipodromo Chile'],
      startDate: monthly.startDate || '',
      endDate: monthly.endDate || '',
      selectedEventIds: monthly.selectedEventIds || [],
      showTotalsByDefault: monthly.showTotalsByDefault || false,
    },
  }
}

// ===== EVENTS =====
// Legacy: data.semanal.events[] + data.mensual.events[] + data.events{}
// React: unified events[] array
function adaptEvents(data) {
  const events = []

  // Semanal events
  if (data.semanal?.events) {
    data.semanal.events.forEach(ev => {
      events.push({
        id: ev.id,
        sheetName: ev.sheetName,
        campaignType: 'semanal',
        meta: ev.meta || {},
        participants: ev.participants || [],
        results: ev.results || {},
        races: ev.meta?.raceCount || 12,
        scoring: ev.scoring || { mode: 'dividend' },
        leaderboard: ev.leaderboard || [],
      })
    })
  }

  // Mensual events
  if (data.mensual?.events) {
    data.mensual.events.forEach(ev => {
      events.push({
        id: ev.id,
        sheetName: ev.sheetName,
        campaignType: 'mensual',
        meta: ev.meta || {},
        participants: ev.participants || [],
        results: ev.results || {},
        races: ev.meta?.raceCount || 12,
        scoring: ev.scoring || { mode: 'dividend' },
        leaderboard: ev.leaderboard || [],
      })
    })
  }

  // Imported events (from Teletrak auto-import)
  if (data.events) {
    Object.entries(data.events).forEach(([id, ev]) => {
      // Extract date from ID like "imported-2026-04-10::chs"
      const dateMatch = id.match(/imported-(\d{4}-\d{2}-\d{2})/)
      const date = dateMatch ? dateMatch[1] : (ev.meta?.date || '')

      // IMPORTANT: Keep results as OBJECT for PronosticosTable compatibility
      // Results should remain as object: { "1": {...}, "2": {...}, ... }
      const resultsObj = ev.results || {}

      events.push({
        id,
        sheetName: ev.meta?.trackName || ev.sheetName || id,
        campaignType: ev.meta?.campaignType || 'imported',
        meta: { ...ev.meta, date: date || ev.meta?.date },
        participants: ev.participants || [],
        results: resultsObj,  // ✅ Keep as OBJECT, not array
        races: ev.meta?.raceCount || 12,
        scoring: { mode: 'dividend' },
        leaderboard: [],
        date: date || ev.meta?.date || '',
      })
    })
  }

  return events
}

// ===== CAMPAIGNS =====
// Legacy ya tiene campaigns en settings, pero pueden no existir para web-only
// Generamos campañas default si no existen
// IMPORTANTE: El backend usa daily/weekly/monthly, el frontend usa diaria/semanal/mensual
function adaptCampaigns(settings, events) {
  const existing = settings.campaigns || {}

  return {
    // Mapear del backend (daily/weekly/monthly) al frontend (diaria/semanal/mensual)
    diaria: existing.diaria || existing.daily || [],
    semanal: existing.semanal || existing.weekly || [],
    mensual: existing.mensual || existing.monthly || [],
  }
}

// ===== PROGRAMS =====
// Legacy: { "2026-04-09::hipodromo-chile": { date, trackId, trackName, races: {...} } }
// React: array de programas
function adaptPrograms(programs) {
  if (!programs) return []
  return Object.entries(programs).map(([key, val]) => ({
    key,
    date: val.date || key.split('::')[0],
    trackId: val.trackId || key.split('::')[1],
    trackName: val.trackName || val.trackId,
    source: val.source,
    sourceUrl: val.sourceUrl,
    status: val.status,
    races: val.races ? (Array.isArray(val.races) ? val.races : Object.values(val.races)) : [],
  }))
}

// ===== REGISTRY =====
// Legacy: array de { name, group, diaria, semanal, mensual, promo }
// React: same shape, including promo field
function adaptRegistry(registry) {
  return (registry || []).map(r => ({
    name: r.name || r.originalName,
    group: r.group || '',
    diaria: r.diaria || false,
    semanal: r.semanal || false,
    mensual: r.mensual || false,
    promo: r.promo || false,  // ✅ CAMPO PROMO AGREGADO
    promoPartners: Array.isArray(r.promoPartners) ? r.promoPartners : [],
  }))
}

// ===== MONTHLY TABLE =====
// Legacy: mensual.tabla = { headers[], standings[] }
// React: same shape
function adaptMonthlyTable(data) {
  return data.mensual?.tabla || { headers: [], standings: [] }
}

// ===== MAIN ADAPTER =====
export function adaptData(legacyData) {
  if (!legacyData) return null

  const settings = adaptSettings(legacyData.settings)
  const events = adaptEvents(legacyData)
  const campaigns = adaptCampaigns(settings, events)
  const programs = adaptPrograms(legacyData.programs)
  const registry = adaptRegistry(legacyData.registry)
  const monthlyTable = adaptMonthlyTable(legacyData)

  return {
    settings,
    campaigns,
    events,
    programs,
    registry,
    registryGroups: settings.registryGroups,
    studs: legacyData.studs || { semanal: [], mensual: [] },
    mensual: { tabla: monthlyTable },
    updatedAt: legacyData.updatedAt,
  }
}

// ===== HELPER: Find event by campaign type + date =====
export function findEventByDate(events, campaignType, dateStr) {
  return events.find(ev =>
    ev.campaignType === campaignType &&
    (ev.sheetName?.includes(dateStr) || ev.meta?.date === dateStr)
  ) || null
}

// ===== HELPER: Get campaign events =====
export function getCampaignEvents(events, campaignId) {
  return events.filter(ev =>
    ev.id?.includes(campaignId) || ev.campaignId === campaignId
  )
}

// ===== HELPER: Get active campaign of type =====
export function getActiveCampaign(campaigns, type) {
  const list = campaigns[type] || []
  return list.find(c => c.enabled) || list[0] || null
}
