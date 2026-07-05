/**
 * useAppStore.js
 *
 * Global state store using Zustand.
 * Replaces manual prop-drilling from App.jsx to all components.
 */

import { create } from 'zustand'
import api from '../api'
import { adaptData } from '../services/dataAdapter'
import { getDefaultView } from '../config/routes'
import { syncStartupJornadasToServer } from '../services/jornadaStorage'
import { dedupeCampaignCollections, dedupeCampaignList, getFrontendCampaignCollections } from '../services/campaignDeduplication'

const useAppStore = create((set, get) => ({
  // ===== STATE =====
  user: null,
  loading: true,
  activeView: getDefaultView(false), // Start with public view
  campaignType: 'diaria', // 'diaria' | 'semanal' | 'mensual'
  appData: null, // Adapted data shape
  loadingError: null,

  // ===== ACTIONS =====

  setUser: (user) => set({ user }),

  setLoading: (loading) => set({ loading }),

  setActiveView: (view) => set({ activeView: view }),

  setCampaignType: (type) => set({ campaignType: type }),

  setAppData: (data) => set({ appData: data }),

  setLoadingError: (error) => set({ loadingError: error }),

  // ===== ASYNC: Initialize app (check session + load data) =====
  initialize: async () => {
    const session = api.getSession()
    if (session) {
      set({ user: session, activeView: getDefaultView(true) })
    }

    try {
      await syncStartupJornadasToServer()
    } catch (err) {
      console.warn('No se pudieron sincronizar las jornadas al iniciar:', err)
    }

    await get().loadInitialData()
    set({ loading: false })
  },

  loadInitialData: async () => {
    try {
      const raw = await api.getBootstrapData()
      const adapted = adaptData(raw)
      set({ appData: adapted, loadingError: null })
    } catch (err) {
      console.error('Error cargando datos iniciales:', err)
      set({ loadingError: err.message, appData: null })
    }
  },

  // ===== ASYNC: Load all data from API =====
  loadData: async () => {
    try {
      const raw = await api.getData()
      const adapted = adaptData(raw)
      set({ appData: adapted, loadingError: null })
    } catch (err) {
      console.error('Error cargando datos:', err)
      set({ loadingError: err.message, appData: null })
    }
  },

  // ===== ASYNC: Login =====
  login: async (credentials) => {
    const result = await api.login(credentials)
    set({ user: result.user, activeView: getDefaultView(true) }) // Redirect to dashboard after login
    await get().loadInitialData()
    return result
  },

  // ===== ASYNC: Logout =====
  logout: async () => {
    api.logout()
    set({ user: null, activeView: getDefaultView(false) })
    await get().loadInitialData()
  },

  // ===== ASYNC: Refresh data (after mutation) =====
  refresh: async () => {
    await get().loadInitialData()
  },

  mergeDateData: (payload = {}) => {
    set((state) => {
      if (!state.appData) return state
      return {
        appData: mergeDatePayloadIntoAppData(state.appData, payload),
      }
    })
  },

  mergeEventUpdates: (events = []) => {
    set((state) => {
      if (!state.appData) return state
      return {
        appData: mergeDatePayloadIntoAppData(state.appData, { events }),
      }
    })
  },

  mergeMutationResponse: (response = {}) => {
    set((state) => {
      if (!state.appData) return state
      return {
        appData: mergeDatePayloadIntoAppData(state.appData, response),
      }
    })
  },

  mergeCampaignResponse: (response = {}) => {
    set((state) => {
      if (!state.appData) return state
      return {
        appData: mergeCampaignPayloadIntoAppData(state.appData, response),
      }
    })
  },

  mergeAdminResponse: (response = {}) => {
    set((state) => {
      if (!state.appData) return state
      return {
        appData: mergeAdminPayloadIntoAppData(state.appData, response),
      }
    })
  },

  refreshDateData: async (date) => {
    if (!date) return null
    const payload = await api.getDateData(date)
    get().mergeDateData(payload)
    return payload
  },

  refreshCampaignData: async (kind, campaignId, date) => {
    if (!kind || !campaignId) return null
    const payload = await api.getCampaignData(kind, campaignId, date)
    get().mergeDateData(payload)
    return payload
  },
}))

function mergeDatePayloadIntoAppData(appData, payload = {}) {
  const nextEvents = mergeEvents(appData.events || [], payload.events || [])
  const nextPrograms = mergePrograms(
    appData.programs || [],
    payload.programs || [],
    payload.deletedPrograms || [],
  )

  return {
    ...appData,
    events: nextEvents,
    programs: nextPrograms,
    jornadas: {
      ...(appData.jornadas || {}),
      ...(payload.jornadas || {}),
    },
    updatedAt: payload.updatedAt || appData.updatedAt,
  }
}

function mergeCampaignPayloadIntoAppData(appData, payload = {}) {
  const campaign = payload?.campaign
  const backendKind = normalizeBackendCampaignKind(payload?.kind || campaign?.kind || campaign?.type)
  const frontendType = normalizeFrontendCampaignType(backendKind || campaign?.type)

  if (!campaign || !backendKind || !frontendType) return appData

  const settings = appData.settings || {}
  const settingsCampaigns = settings.campaigns || {}
  const currentSettingsList = settingsCampaigns[backendKind] || settingsCampaigns[frontendType] || []
  const nextSettingsCampaigns = dedupeCampaignCollections({
    ...settingsCampaigns,
    [backendKind]: upsertCampaign(currentSettingsList, campaign),
  })

  if (Object.prototype.hasOwnProperty.call(settingsCampaigns, frontendType)) {
    nextSettingsCampaigns[frontendType] = dedupeCampaignList(
      upsertCampaign(settingsCampaigns[frontendType] || [], campaign),
      frontendType,
    )
  }

  const currentCampaigns = appData.campaigns || {}
  const currentFrontendList = currentCampaigns[frontendType] || []

  return {
    ...appData,
    settings: {
      ...settings,
      campaigns: nextSettingsCampaigns,
    },
    campaigns: {
      ...currentCampaigns,
      [frontendType]: dedupeCampaignList(upsertCampaign(currentFrontendList, campaign), frontendType),
    },
    updatedAt: payload?.updatedAt || appData.updatedAt,
  }
}

function mergeAdminPayloadIntoAppData(appData, payload = {}) {
  if (!payload || typeof payload !== 'object') return appData

  let nextData = mergeDatePayloadIntoAppData(appData, {
    events: payload.events || [],
    programs: payload.programs || [],
    deletedPrograms: payload.deletedPrograms || [],
    jornadas: payload.jornadas || {},
    updatedAt: payload.updatedAt,
  })

  if (Array.isArray(payload.deletedEventIds) && payload.deletedEventIds.length > 0) {
    nextData = {
      ...nextData,
      events: removeEventsByIds(nextData.events || [], payload.deletedEventIds),
    }
  }

  const nextSettings = payload.settings
    ? mergeSettingsPayload(nextData.settings || {}, payload.settings)
    : (nextData.settings || {})

  const nextRegistry = mergeRegistryPayload(nextData.registry || [], payload)
  const nextRegistryGroups = Array.isArray(payload.registryGroups)
    ? payload.registryGroups
    : (Array.isArray(nextSettings.registryGroups) ? nextSettings.registryGroups : nextData.registryGroups || [])

  let nextCampaigns = buildFrontendCampaignsFromSettings(
    nextSettings.campaigns || {},
    nextData.campaigns || {},
  )

  if (payload.campaign && payload.kind) {
    nextCampaigns = mergeCampaignPayloadIntoAppData(
      { ...nextData, settings: nextSettings, campaigns: nextCampaigns },
      payload,
    ).campaigns
  }

  return {
    ...nextData,
    settings: {
      ...nextSettings,
      registryGroups: nextRegistryGroups,
    },
    campaigns: nextCampaigns,
    registry: nextRegistry,
    registryGroups: nextRegistryGroups,
    updatedAt: payload.updatedAt || nextData.updatedAt,
  }
}

function mergeSettingsPayload(currentSettings = {}, incomingSettings = {}) {
  const campaigns = dedupeCampaignCollections({
    ...(currentSettings.campaigns || {}),
    ...(incomingSettings.campaigns || {}),
  })

  return {
    ...currentSettings,
    ...incomingSettings,
    campaigns,
    registryGroups: Array.isArray(incomingSettings.registryGroups)
      ? incomingSettings.registryGroups
      : currentSettings.registryGroups || [],
  }
}

function buildFrontendCampaignsFromSettings(settingsCampaigns = {}, currentCampaigns = {}) {
  return getFrontendCampaignCollections(settingsCampaigns, currentCampaigns)
}

function mergeRegistryPayload(currentRegistry = [], payload = {}) {
  if (Array.isArray(payload.registry)) {
    return payload.registry.map(normalizeRegistryEntry).filter((entry) => entry.name)
  }

  const deleted = new Set((payload.deletedRegistryParticipants || []).map(normalizeTextKey))
  const next = currentRegistry
    .filter((entry) => !deleted.has(normalizeTextKey(entry?.name)))
    .map(normalizeRegistryEntry)

  if (payload.participant?.name) {
    return upsertRegistryEntry(next, normalizeRegistryEntry(payload.participant))
  }

  return next
}

function normalizeRegistryEntry(entry = {}) {
  const primaryGroup = String(entry.group || '').trim()
  const groups = Array.from(new Set([
    ...(Array.isArray(entry.groups) ? entry.groups : []),
    primaryGroup,
  ].map((groupId) => String(groupId || '').trim()).filter(Boolean)))

  return {
    ...entry,
    name: entry.name || entry.originalName || '',
    group: groups.includes(primaryGroup) ? primaryGroup : groups[0] || '',
    groups,
    diaria: Boolean(entry.diaria),
    semanal: Boolean(entry.semanal),
    mensual: Boolean(entry.mensual),
    promo: Boolean(entry.promo),
    promoPartners: Array.isArray(entry.promoPartners) ? entry.promoPartners : [],
  }
}

function upsertRegistryEntry(registry = [], participant) {
  const key = normalizeTextKey(participant?.name)
  if (!key) return registry

  const next = [...registry]
  const existingIndex = next.findIndex((entry) => normalizeTextKey(entry?.name) === key)
  if (existingIndex >= 0) {
    next[existingIndex] = { ...next[existingIndex], ...participant }
  } else {
    next.push(participant)
  }
  return next.sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'es'))
}

function removeEventsByIds(events = [], eventIds = []) {
  const deleted = new Set(eventIds.map((eventId) => String(eventId || '')).filter(Boolean))
  if (deleted.size === 0) return events
  return events.filter((event) => !deleted.has(String(event?.id || '')))
}

function normalizeTextKey(value) {
  return String(value || '').trim().toLowerCase()
}

function upsertCampaign(campaigns = [], campaign) {
  const id = String(campaign?.id || '').trim()
  if (!id) return campaigns

  const next = [...campaigns]
  const existingIndex = next.findIndex((item) => String(item?.id || '').trim() === id)
  if (existingIndex >= 0) {
    next[existingIndex] = { ...next[existingIndex], ...campaign }
  } else {
    next.push(campaign)
  }
  return next
}

function normalizeBackendCampaignKind(value) {
  const text = String(value || '').toLowerCase().trim()
  if (text === 'daily' || text === 'diaria') return 'daily'
  if (text === 'weekly' || text === 'semanal') return 'weekly'
  if (text === 'monthly' || text === 'mensual') return 'monthly'
  return ''
}

function normalizeFrontendCampaignType(value) {
  const text = String(value || '').toLowerCase().trim()
  if (text === 'daily' || text === 'diaria') return 'diaria'
  if (text === 'weekly' || text === 'semanal') return 'semanal'
  if (text === 'monthly' || text === 'mensual') return 'mensual'
  return ''
}

function mergeEvents(currentEvents = [], incomingEvents = []) {
  if (!Array.isArray(incomingEvents) || incomingEvents.length === 0) return currentEvents

  const byId = new Map()
  currentEvents.forEach((event) => {
    if (event?.id) byId.set(String(event.id), event)
  })

  incomingEvents.forEach((event) => {
    const normalized = normalizeEventPatch(event)
    if (normalized?.id) byId.set(String(normalized.id), normalized)
  })

  return Array.from(byId.values())
}

function mergePrograms(currentPrograms = [], incomingPrograms = [], deletedProgramKeys = []) {
  const byKey = new Map()
  currentPrograms.forEach((program) => {
    const key = program?.key || buildProgramKey(program)
    if (key) byKey.set(String(key), program)
  })

  deletedProgramKeys.forEach((key) => byKey.delete(String(key)))

  incomingPrograms.forEach((program) => {
    const normalized = normalizeProgramPatch(program)
    const key = normalized?.key || buildProgramKey(normalized)
    if (key) byKey.set(String(key), normalized)
  })

  return Array.from(byKey.values())
}

function normalizeEventPatch(event = {}) {
  if (!event?.id) return null
  const meta = event.meta || {}
  const date = normalizeDateValue(meta.date || event.date || event.id || event.sheetName)
  return {
    ...event,
    id: event.id,
    sheetName: event.sheetName || meta.trackName || meta.title || event.title || event.name || event.id,
    campaignType: event.campaignType || meta.campaignType || 'manual',
    meta: { ...meta, date: meta.date || date },
    participants: Array.isArray(event.participants) ? event.participants : [],
    results: event.results && typeof event.results === 'object' ? event.results : {},
    races: event.races || event.raceCount || meta.raceCount || 12,
    scoring: event.scoring || { mode: 'dividend' },
    leaderboard: event.leaderboard || [],
    date: event.date || date,
  }
}

function normalizeProgramPatch(program = {}) {
  const key = program.key || buildProgramKey(program)
  return {
    key,
    date: program.date || normalizeDateValue(key),
    trackId: program.trackId || String(key || '').split('::')[1] || '',
    trackName: program.trackName || program.trackId || '',
    source: program.source,
    sourceUrl: program.sourceUrl,
    status: program.status,
    races: program.races ? (Array.isArray(program.races) ? program.races : Object.values(program.races)) : [],
  }
}

function buildProgramKey(program = {}) {
  if (!program?.date || !program?.trackId) return ''
  return `${program.date}::${program.trackId}`
}

function normalizeDateValue(value) {
  const text = String(value || '').trim()
  const iso = text.match(/\b\d{4}-\d{2}-\d{2}\b/)
  if (iso) return iso[0]
  const latin = text.match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b/)
  if (latin) {
    const [, day, month, year] = latin
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }
  return ''
}

export default useAppStore
