/**
 * useCampaigns.js
 *
 * Custom hook for campaign-related operations.
 * Encapsulates logic so components don't need to know data shape.
 */

import { useMemo, useCallback } from 'react'
import api from '../api'
import useAppStore from '../store/useAppStore'
import { getModeRules, MODE_IDS } from '../engine/modeEngine'

export function useCampaigns() {
  const { appData, refresh } = useAppStore()

  // Mapear del backend (daily/weekly/monthly) al frontend (diaria/semanal/mensual)
  // IMPORTANTE: Las campañas están en settings.campaigns, no en campaigns directamente
  const campaigns = useMemo(() => {
    const raw = appData?.settings?.campaigns || appData?.campaigns || {}
    const mapped = {
      diaria: raw.daily || raw.diaria || [],
      semanal: raw.weekly || raw.semanal || [],
      mensual: raw.monthly || raw.mensual || []
    }
    return mapped
  }, [appData])

  const registryGroups = useMemo(() => {
    return appData?.registryGroups || []
  }, [appData])

  const settings = useMemo(() => {
    return appData?.settings || {}
  }, [appData])

  const getActive = useCallback((type) => {
    const list = campaigns[type] || []
    return list.find(c => c.enabled) || list[0] || null
  }, [campaigns])

  const getModeRulesForCampaign = useCallback((campaign) => {
    const mode = campaign?.format || campaign?.competitionMode || MODE_IDS.INDIVIDUAL
    return getModeRules(mode)
  }, [])

  const createCampaign = useCallback(async (type, campaignData) => {
    const newCampaign = {
      id: `${type}-${Date.now()}`,
      enabled: true,
      ...campaignData,
    }

    // Mapear tipos de español a inglés (backend espera: daily/weekly/monthly)
    const typeMap = {
      'diaria': 'daily',
      'semanal': 'weekly',
      'mensual': 'monthly'
    }
    const backendType = typeMap[type] || type

    try {
      const response = await api.createCampaign(backendType, newCampaign)
      await refresh()
      return response.campaign || newCampaign
    } catch (error) {
      throw error
    }
  }, [refresh])

  const saveCampaign = useCallback(async (type, campaignData) => {
    const typeMap = {
      diaria: 'daily',
      semanal: 'weekly',
      mensual: 'monthly',
    }
    const backendType = typeMap[type] || type

    if (!campaignData?.id) {
      return createCampaign(type, campaignData)
    }

    const current = campaigns[type] || []
    const nextCampaigns = current.map((campaign) =>
      campaign.id === campaignData.id
        ? {
            ...campaign,
            ...campaignData,
            lastModified: new Date().toISOString(),
          }
        : campaign
    )

    await api.updateSettings({
      campaigns: {
        daily: backendType === 'daily' ? nextCampaigns : (campaigns.diaria || []),
        weekly: backendType === 'weekly' ? nextCampaigns : (campaigns.semanal || []),
        monthly: backendType === 'monthly' ? nextCampaigns : (campaigns.mensual || []),
      },
    })
    await refresh()
    return campaignData
  }, [campaigns, createCampaign, refresh])

  const toggleCampaign = useCallback(async (type, campaignId) => {
    const typeMap = { 'diaria': 'daily', 'semanal': 'weekly', 'mensual': 'monthly' }
    const backendType = typeMap[type] || type
    const current = campaigns[type] || []
    await api.updateSettings({
      settings: {
        campaigns: {
          ...campaigns,
          [backendType]: current.map(c =>
            c.id === campaignId ? { ...c, enabled: !c.enabled } : c
          )
        }
      }
    })
    await refresh()
  }, [campaigns, refresh])

  const deleteCampaign = useCallback(async (type, campaignId) => {
    const typeMap = { 'diaria': 'daily', 'semanal': 'weekly', 'mensual': 'monthly' }
    const backendType = typeMap[type] || type
    await api.campaignAction(backendType, campaignId, 'delete')
    await refresh()
  }, [refresh])

  return {
    campaigns,
    registryGroups,
    settings,
    getActive,
    getModeRulesForCampaign,
    createCampaign,
    saveCampaign,
    toggleCampaign,
    deleteCampaign,
  }
}
