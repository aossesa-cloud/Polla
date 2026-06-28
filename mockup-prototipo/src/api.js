// ===== API Client para integración con el sistema real =====
// Usa el proxy de Vite → /api → http://localhost:3030/api

import { API_URL } from './config/api'

const API_BASE = API_URL
const ADMIN_SESSION_KEY = 'pollas-hipicas-admin-session'

async function readApiResponse(res, fallbackMessage = 'Error del servidor') {
  const text = await res.text()
  let data = null

  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      if (!res.ok) {
        throw new Error(`${fallbackMessage}: ${text.slice(0, 180)}`)
      }
      throw new Error('Respuesta invalida del servidor.')
    }
  }

  if (!res.ok) {
    throw new Error(data?.detail || data?.error || `${fallbackMessage} (${res.status})`)
  }

  return data || {}
}

function getSessionStore() {
  if (typeof window === 'undefined') return null
  return window.sessionStorage || null
}

const api = {
  // ===== AUTH =====
  async login(credentials) {
    let res
    try {
      res = await fetch(`${API_BASE}/admin/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      })
    } catch (networkError) {
      throw new Error('No se pudo conectar al servidor. Verifica que el servidor esté corriendo en puerto 3030.')
    }
    
    if (!res.ok) {
      const errorText = await res.text()
      let errorMessage
      try {
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.detail || errorData.error || 'Error del servidor'
      } catch {
        errorMessage = `Error ${res.status}: ${errorText || 'Respuesta inválida'}`
      }
      throw new Error(errorMessage)
    }
    
    let data
    try {
      data = await res.json()
    } catch {
      throw new Error('Respuesta inválida del servidor. Intenta nuevamente.')
    }
    
    if (!data.ok) throw new Error(data.error || 'Credenciales incorrectas')
    
    // Guardar solo la sesion de la pestana.
    getSessionStore()?.setItem(ADMIN_SESSION_KEY, JSON.stringify({
      user: data.user,
      ts: Date.now()
    }))
    return data
  },

  logout() {
    getSessionStore()?.removeItem(ADMIN_SESSION_KEY)
  },

  getSession() {
    const raw = getSessionStore()?.getItem(ADMIN_SESSION_KEY)
    if (!raw) return null
    try {
      const s = JSON.parse(raw)
      // Sesión válida por 24h
      if (Date.now() - s.ts > 24 * 60 * 60 * 1000) {
        this.logout()
        return null
      }
      return s.user
    } catch { return null }
  },

  async getUsers() {
    const res = await fetch(`${API_BASE}/admin/users`)
    return res.json()
  },

  // ===== DATA =====
  async getData() {
    const res = await fetch(`${API_BASE}/data`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
    })
    return res.json()
  },

  // ===== PICKS / PARTICIPANTS =====
  async savePick(targetEventIds, participant, audit = {}) {
    const body = { targetEventIds, participant }
    if (audit && Object.keys(audit).length > 0) body.audit = audit
    const res = await fetch(`${API_BASE}/operations/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    return res.json()
  },

  async savePickForEvent(eventId, participant, audit = {}) {
    return this.savePick([eventId], participant, audit)
  },

  async saveMultiplePicks(eventId, participants) {
    // Guardar varios participants en un evento
    for (const p of participants) {
      await this.savePickForEvent(eventId, p, { source: 'bulk-api' })
    }
    return true
  },

  async deletePick(eventId, index) {
    const res = await fetch(`${API_BASE}/events/${eventId}/participants/${index}`, {
      method: 'DELETE'
    })
    return res.json()
  },

  // Parsear texto de copia/pega
  parseDualBulkPicks(text) {
    // Formato: "1. 5-12" o "1) 5-12" o "1: 5-12"
    const lines = text.split('\n').filter(l => l.trim())
    const stud1 = []
    const stud2 = []

    for (const line of lines) {
      // Intentar formato estructurado: "N. VALOR-VALOR"
      const match = line.match(/^\s*(\d+)\s*(?:[.)@:a]|\-)\s*(.+?)\s*$/)
      if (match) {
        const values = match[2].split(/\s*-\s*/)
        if (values[0]) stud1.push(values[0].trim())
        if (values[1]) stud2.push(values[1].trim())
      } else {
        // Formato simple: espacio/coma/pipe separados
        const tokens = line.split(/[\s,;|]+/).filter(t => t)
        for (const t of tokens) {
          if (!stud1.includes(t) || stud1.length === 0) {
            stud1.push(t)
          }
        }
      }
    }

    return { stud1, stud2 }
  },

  parseSimplePicks(text) {
    // Formato: "5 12 11 3 7 8 2 9 1 6 4 10"
    const tokens = text.split(/[\s,;|]+/).filter(t => t && t !== '-')
    return tokens.map(t => t.trim())
  },

  // ===== RESULTS =====
  async saveResult(eventId, race, result) {
    const res = await fetch(`${API_BASE}/events/${eventId}/results/${race}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result)
    })
    return res.json()
  },

  async copyResults(sourceId, targetIds, options = {}) {
    const res = await fetch(`${API_BASE}/events/copy-results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceId, targetIds, ...options })
    })
    return res.json()
  },

  // ===== TELETRAK =====
  async getTracks(date) {
    const res = await fetch(`${API_BASE}/import/teletrak/tracks?date=${date}`)
    return res.json()
  },

  async fetchTeletrakTracks(date) {
    const res = await fetch(`${API_BASE}/import/teletrak/tracks?date=${date}`)
    return res.json()
  },

  async importTeletrakProgram(date, trackId) {
    const res = await fetch(`${API_BASE}/import/teletrak/program`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, trackId })
    })
    return res.json()
  },

  async importTeletrakResults(date, trackId, targetEventIds = []) {
    const res = await fetch(`${API_BASE}/import/teletrak/results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, trackId, targetEventIds })
    })
    return res.json()
  },

  // ===== PROGRAMS =====
  async getPrograms(date) {
    const res = await fetch(`${API_BASE}/programs${date ? `?date=${date}` : ''}`)
    return res.json()
  },

  async saveProgram(program) {
    const res = await fetch(`${API_BASE}/programs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(program)
    })
    return res.json()
  },

  async deleteProgram(date, trackId) {
    const res = await fetch(`${API_BASE}/programs/${date}/${trackId}`, {
      method: 'DELETE'
    })
    return res.json()
  },

  // ===== REGISTRY =====
  async upsertRegistryParticipant(entry) {
    const res = await fetch(`${API_BASE}/admin/registry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry)
    })
    return res.json()
  },

  async deleteRegistryParticipant(name) {
    const res = await fetch(`${API_BASE}/admin/registry/${encodeURIComponent(name)}`, {
      method: 'DELETE'
    })
    return res.json()
  },

  async upsertRegistryGroup(group) {
    const res = await fetch(`${API_BASE}/admin/registry-groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(group)
    })
    return res.json()
  },

  async deleteRegistryGroup(id) {
    const res = await fetch(`${API_BASE}/admin/registry-groups/${id}`, {
      method: 'DELETE'
    })
    return res.json()
  },

  async bulkDeleteRegistryParticipants(names) {
    const res = await fetch(`${API_BASE}/admin/registry/bulk-delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ names })
    })
    return res.json()
  },

  // ===== USERS =====
  async createUser(user) {
    const res = await fetch(`${API_BASE}/admin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    })
    return res.json()
  },

  async updateUser(id, user) {
    const res = await fetch(`${API_BASE}/admin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...user, id })
    })
    return res.json()
  },

  async deleteUser(id) {
    const res = await fetch(`${API_BASE}/admin/users/${id}`, {
      method: 'DELETE'
    })
    return res.json()
  },

  // ===== BATCH OPERATIONS =====
  async batchSave(targetEventIds, { participant, result, audit }) {
    const body = { targetEventIds }
    if (participant) body.participant = participant
    if (result) body.result = result
    if (audit) body.audit = audit
    const res = await fetch(`${API_BASE}/operations/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    return res.json()
  },

  async getAuditLog(params = {}) {
    const search = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        search.set(key, String(value))
      }
    })
    const query = search.toString()
    const res = await fetch(`${API_BASE}/admin/audit-log${query ? `?${query}` : ''}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
    })
    return readApiResponse(res, 'Error al cargar logs')
  },

  // ===== CAMPAIGNS =====
  async createCampaign(kind, campaign) {
    const res = await fetch(`${API_BASE}/admin/campaigns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, campaign })
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.detail || error.error || 'Error al crear campaña')
    }
    return res.json()
  },

  async saveCampaign(kind, campaign) {
    const res = await fetch(`${API_BASE}/admin/campaigns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, campaign })
    })
    return readApiResponse(res, 'Error al guardar campana')
  },

  async updateSettings(partial) {
    const res = await fetch(`${API_BASE}/admin/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partial)
    })
    return res.json()
  },

  async campaignAction(kind, id, action) {
    const res = await fetch(`${API_BASE}/admin/campaigns/${kind}/${id}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    })
    return res.json()
  },

  // ===== EVENT META =====
  async upsertEventMeta(eventId, meta) {
    const res = await fetch(`${API_BASE}/events/${eventId}/meta`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(meta)
    })
    return res.json()
  },

  // ===== HELPERS =====
  async findEventByCampaign(campaignId) {
    const data = await this.getData()
    // Buscar en todos los events
    for (const [eventId, event] of Object.entries(data.events || {})) {
      if (event.campaignId === campaignId || eventId.includes(campaignId)) {
        return { eventId, ...event }
      }
    }
    return null
  },

  // Buscar evento por tipo + fecha
  findEventForDate(data, tipo, date) {
    const key = `${tipo}-${date}`
    return data.events?.[key] || null
  },

  // Obtener todos los eventos de una campaña semanal
  getCampaignEvents(data, campaignId) {
    const events = []
    for (const [id, event] of Object.entries(data.events || {})) {
      if (event.campaignId === campaignId || id.includes(campaignId)) {
        events.push({ id, ...event })
      }
    }
    return events
  }
}

export default api
