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
import { buildMonthlySelectedEventIds, normalizeCampaignTrackSelection } from '../services/campaignEligibility'
import { applyWeeklyModeConfig } from '../services/campaignModeConfig'
import { dedupeCampaignCollections } from '../services/campaignDeduplication'

export function useCampaigns() {
  const { appData, mergeCampaignResponse, mergeAdminResponse } = useAppStore()

  // Mapear del backend (daily/weekly/monthly) al frontend (diaria/semanal/mensual)
  // IMPORTANTE: Las campañas están en settings.campaigns, no en campaigns directamente
  const campaigns = useMemo(() => {
    const raw = appData?.settings?.campaigns || appData?.campaigns || {}
    const weeklyFallback = appData?.settings?.weekly || {}
    const monthlyFallbackIds = appData?.settings?.monthly?.selectedEventIds || []
    const deduped = dedupeCampaignCollections(raw)
    const dailyCampaigns = deduped.daily || deduped.diaria || []
    const weeklyCampaigns = deduped.weekly || deduped.semanal || []
    const monthlyCampaigns = deduped.monthly || deduped.mensual || []
    const mapped = {
      diaria: dailyCampaigns,
      semanal: weeklyCampaigns.map((campaign) =>
        applyWeeklyModeConfig(campaign, weeklyFallback)
      ),
      mensual: monthlyCampaigns.map((campaign) => {
        const hipodromos = normalizeCampaignTrackSelection(campaign?.hipodromos || [])
        const monthlyCampaign = { ...campaign, type: 'mensual', hipodromos }
        return {
          ...campaign,
          hipodromos,
          selectedEventIds: buildMonthlySelectedEventIds(
            monthlyCampaign,
            appData,
            campaign?.selectedEventIds || monthlyFallbackIds
          ),
        }
      })
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

  const sanitizeCampaignPayload = useCallback((type, campaignData) => {
    if (type === 'mensual') {
      const hipodromos = normalizeCampaignTrackSelection(campaignData?.hipodromos || [])
      const monthlyCampaign = { ...campaignData, type: 'mensual', hipodromos }
      return {
        ...campaignData,
        hipodromos,
        selectedEventIds: buildMonthlySelectedEventIds(
          monthlyCampaign,
          appData,
          campaignData?.selectedEventIds || appData?.settings?.monthly?.selectedEventIds || []
        ),
      }
    }

    if (type === 'semanal') {
      return applyWeeklyModeConfig(campaignData, appData?.settings?.weekly || {})
    }

    return campaignData
  }, [appData])

  const createCampaign = useCallback(async (type, campaignData) => {
    const sanitizedCampaignData = sanitizeCampaignPayload(type, campaignData)
    const newCampaign = {
      id: `${type}-${Date.now()}`,
      enabled: true,
      ...sanitizedCampaignData,
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
      mergeCampaignResponse(response)
      return response.campaign || newCampaign
    } catch (error) {
      throw error
    }
  }, [mergeCampaignResponse, sanitizeCampaignPayload])

  const saveCampaign = useCallback(async (type, campaignData) => {
    const typeMap = {
      diaria: 'daily',
      semanal: 'weekly',
      mensual: 'monthly',
    }
    const backendType = typeMap[type] || type

    const sanitizedCampaignData = sanitizeCampaignPayload(type, campaignData)

    if (!sanitizedCampaignData?.id) {
      return createCampaign(type, sanitizedCampaignData)
    }

    const response = await api.saveCampaign(backendType, sanitizedCampaignData)
    mergeCampaignResponse(response)
    return response.campaign || sanitizedCampaignData
  }, [createCampaign, mergeCampaignResponse, sanitizeCampaignPayload])

  const toggleCampaign = useCallback(async (type, campaignId) => {
    const typeMap = { 'diaria': 'daily', 'semanal': 'weekly', 'mensual': 'monthly' }
    const backendType = typeMap[type] || type
    const current = campaigns[type] || []
    const campaign = current.find((item) => item.id === campaignId)
    const action = campaign?.enabled ? 'deactivate' : 'activate'
    const response = await api.campaignAction(backendType, campaignId, action)
    if (response?.error) throw new Error(response.detail || response.error)
    mergeAdminResponse(response)
  }, [campaigns, mergeAdminResponse])

  const deleteCampaign = useCallback(async (type, campaignId) => {
    const typeMap = { 'diaria': 'daily', 'semanal': 'weekly', 'mensual': 'monthly' }
    const backendType = typeMap[type] || type
    const response = await api.campaignAction(backendType, campaignId, 'delete')
    if (response?.error) throw new Error(response.detail || response.error)
    mergeAdminResponse(response)
  }, [mergeAdminResponse])

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
