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
    const campaignSummaries = appData?.campaignSummaries || {}
    const weeklyFallback = appData?.settings?.weekly || {}
    const monthlyFallbackIds = appData?.settings?.monthly?.selectedEventIds || []
    const deduped = dedupeCampaignCollections(raw)
    const dailyCampaigns = deduped.daily || deduped.diaria || []
    const weeklyCampaigns = deduped.weekly || deduped.semanal || []
    const monthlyCampaigns = deduped.monthly || deduped.mensual || []
    const mapped = {
      diaria: dailyCampaigns.map((campaign) => (
        enrichCampaignWithSummary(campaign, 'diaria', campaignSummaries)
      )),
      semanal: weeklyCampaigns.map((campaign) =>
        enrichCampaignWithSummary(
          applyWeeklyModeConfig(campaign, weeklyFallback),
          'semanal',
          campaignSummaries
        )
      ),
      mensual: monthlyCampaigns.map((campaign) => {
        const hipodromos = normalizeCampaignTrackSelection(campaign?.hipodromos || [])
        const monthlyCampaign = { ...campaign, type: 'mensual', hipodromos }
        return enrichCampaignWithSummary({
          ...campaign,
          hipodromos,
          selectedEventIds: buildMonthlySelectedEventIds(
            monthlyCampaign,
            appData,
            campaign?.selectedEventIds || monthlyFallbackIds
          ),
        }, 'mensual', campaignSummaries)
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

function enrichCampaignWithSummary(campaign, type, summaries = {}) {
  const summary = getCampaignSummary(summaries, type, campaign)
  if (!summary) return campaign

  return {
    ...campaign,
    participantCount: Math.max(
      Number(campaign?.participantCount || 0),
      Number(summary?.participantCount || 0)
    ),
    raceCount: Math.max(
      Number(campaign?.raceCount || 0),
      Number(summary?.raceCount || 0)
    ),
    summaryEventCount: Number(summary?.eventCount || 0),
  }
}

function getCampaignSummary(summaries = {}, type, campaign) {
  const backendType = toBackendCampaignKind(type)
  const campaignId = String(campaign?.id || campaign || '')
  const list = [
    ...(summaries?.[backendType] || []),
    ...(backendType !== type ? (summaries?.[type] || []) : []),
  ]

  return list.find((summary) => (
    String(summary?.id || '') === campaignId ||
    campaignLinkIdsOverlap(summary?.id, campaignId)
  )) || list.find((summary) => summaryMatchesCampaign(summary, campaign, type)) || null
}

function toBackendCampaignKind(type) {
  if (type === 'diaria' || type === 'daily') return 'daily'
  if (type === 'semanal' || type === 'weekly') return 'weekly'
  if (type === 'mensual' || type === 'monthly') return 'monthly'
  return ''
}

function normalizeCampaignLinkId(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^calendar-/, '')
    .replace(/^campaign-/, '')
}

function campaignLinkIdsOverlap(left, right) {
  const normalizedLeft = normalizeCampaignLinkId(left)
  const normalizedRight = normalizeCampaignLinkId(right)
  return Boolean(
    normalizedLeft &&
    normalizedRight &&
    (
      normalizedLeft === normalizedRight ||
      normalizedLeft.includes(normalizedRight) ||
      normalizedRight.includes(normalizedLeft)
    )
  )
}

function summaryMatchesCampaign(summary, campaign, type) {
  if (!summary || !campaign || typeof campaign !== 'object') return false

  const summaryName = normalizeIdentityPart(summary.name)
  const campaignName = normalizeIdentityPart(campaign.name)
  if (!summaryName || !campaignName || summaryName !== campaignName) return false

  const summaryGroup = normalizeIdentityPart(summary.groupId || summary.group)
  const campaignGroup = normalizeIdentityPart(campaign.groupId || campaign.group)
  if (summaryGroup && campaignGroup && summaryGroup !== campaignGroup) return false

  if (type === 'diaria') {
    const summaryDate = normalizeDate(summary.date)
    const campaignDate = normalizeDate(campaign.date)
    return Boolean(!summaryDate || !campaignDate || summaryDate === campaignDate)
  }

  const summaryStart = normalizeDate(summary.startDate)
  const summaryEnd = normalizeDate(summary.endDate)
  const campaignStart = normalizeDate(campaign.startDate)
  const campaignEnd = normalizeDate(campaign.endDate)

  return Boolean(
    (!summaryStart || !campaignStart || summaryStart === campaignStart) &&
    (!summaryEnd || !campaignEnd || summaryEnd === campaignEnd)
  )
}

function normalizeIdentityPart(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function normalizeDate(value) {
  if (!value) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value

  const latinDate = String(value).match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (latinDate) {
    const [, day, month, year] = latinDate
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  const embeddedDate = String(value).match(/(\d{4}-\d{2}-\d{2})/)
  if (embeddedDate) return embeddedDate[1]

  try {
    return new Date(value).toISOString().slice(0, 10)
  } catch {
    return null
  }
}
