/**
 * useCompetition.js
 *
 * Hook central para el estado de la competencia activa.
 * Provee: modo actual, configuración, fase, participantes.
 */

import { useMemo } from 'react'
import useAppStore from '../store/useAppStore'
import { getCompetitionState } from '../engine/phaseManager'
import { getModeRules } from '../engine/modeEngine'

export function useCompetition(type = 'semanal') {
  const { appData, campaignType } = useAppStore()
  const activeType = type || campaignType || 'semanal'

  const campaigns = useMemo(() => {
    return appData?.campaigns?.[activeType] || []
  }, [appData, activeType])

  const activeCampaign = useMemo(() => {
    return campaigns.find(c => c.enabled) || campaigns[0] || null
  }, [campaigns])

  const settings = useMemo(() => {
    return activeCampaign ? {
      mode: activeCampaign.format || activeCampaign.competitionMode || 'individual',
      ...activeCampaign,
      ...(appData?.settings?.[activeType] || {})
    } : null
  }, [activeCampaign, appData, activeType])

  const state = useMemo(() => {
    if (!settings) return null
    return getCompetitionState({ settings }, new Date().toISOString().split('T')[0])
  }, [settings])

  const modeRules = useMemo(() => {
    if (!settings) return null
    return getModeRules(settings.mode)
  }, [settings])

  const participants = useMemo(() => {
    const events = appData?.events || []
    const parts = []
    for (const ev of events) {
      if (Array.isArray(ev.participants)) {
        parts.push(...ev.participants)
      }
    }
    // Deduplicate
    const seen = new Set()
    return parts.filter(p => {
      if (seen.has(p.name)) return false
      seen.add(p.name)
      return true
    })
  }, [appData])

  return {
    type: activeType,
    campaigns,
    activeCampaign,
    settings,
    state,
    modeRules,
    participants,
  }
}
