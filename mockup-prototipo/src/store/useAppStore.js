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
import { migrateLocalStorageJornadasToServer } from '../services/jornadaStorage'

const useAppStore = create((set, get) => ({
  // ===== STATE =====
  user: null,
  loading: true,
  activeView: getDefaultView(false), // Start with public view
  campaignType: 'diaria', // 'diaria' | 'semanal' | 'mensual'
  appData: null,           // Adapted data shape
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
    // Cargar datos siempre — la vista pública también necesita appData
    await get().loadData()
    set({ loading: false })
    // Migrar jornadas del localStorage al servidor para que la vista pública las vea
    migrateLocalStorageJornadasToServer().catch(() => {})
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
    await get().loadData()
    return result
  },

  // ===== ASYNC: Logout =====
  logout: async () => {
    api.logout()
    set({ user: null, activeView: getDefaultView(false) })
    await get().loadData() // Reload data so public view still works after logout
  },

  // ===== ASYNC: Refresh data (after mutation) =====
  refresh: async () => {
    await get().loadData()
  },
}))

export default useAppStore
