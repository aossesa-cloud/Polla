import { useState, useCallback, useMemo } from 'react'
import useAppStore from '../store/useAppStore'
import api from '../api'

function normalizeName(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

function uniquePartnerNames(values, excludeName = '') {
  const seen = new Set()
  const excludeKey = normalizeName(excludeName)
  return (values || [])
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .filter((value) => {
      const key = normalizeName(value)
      if (!key || key === excludeKey || seen.has(key)) return false
      seen.add(key)
      return true
    })
}

function getEventsFromAppData(appData) {
  return Array.isArray(appData?.events) ? appData.events : Object.values(appData?.events || {})
}

function getEventParticipants(appData) {
  return getEventsFromAppData(appData).flatMap((event) => (
    Array.isArray(event?.participants) ? event.participants : []
  ))
}

function getParticipantPromoPartners(participants, participantName) {
  const participantKey = normalizeName(participantName)
  if (!participantKey) return []

  const direct = (participants || [])
    .filter((entry) => normalizeName(entry?.name) === participantKey)
    .filter((entry) => entry?.promoMode !== 'individual')
    .flatMap((entry) => (Array.isArray(entry?.promoPartners) ? entry.promoPartners : []))

  const reverse = (participants || [])
    .filter((entry) => entry?.promoMode !== 'individual')
    .filter((entry) => (
      Array.isArray(entry?.promoPartners) &&
      entry.promoPartners.some((partner) => normalizeName(partner) === participantKey)
    ))
    .map((entry) => entry.name)

  return uniquePartnerNames([...direct, ...reverse], participantName)
}

export function usePromoRelations(campaignId, groupId) {
  const { appData } = useAppStore()
  const [allRelations, setAllRelations] = useState({})

  const campaignRelations = useMemo(() => {
    return allRelations[campaignId] || {}
  }, [allRelations, campaignId])

  const getSameGroupParticipants = useCallback((excludeParticipant) => {
    const registry = appData?.registry || []

    return registry.filter((stud) => {
      if (stud.name === excludeParticipant) return false
      if (stud.promo !== true) return false
      if (!groupId) return true
      return stud.group === groupId
    })
  }, [appData, groupId])

  const getRegistryDefaultPartners = useCallback((participantName) => {
    const registry = appData?.registry || []
    const eventParticipants = getEventParticipants(appData)

    return uniquePartnerNames([
      ...getParticipantPromoPartners(registry, participantName),
      ...getParticipantPromoPartners(eventParticipants, participantName),
    ], participantName)
  }, [appData])

  const getPromoRelationState = useCallback((participantName) => {
    const directRelation = campaignRelations[participantName]
    const defaultPartners = getRegistryDefaultPartners(participantName)

    if (directRelation?.mode === 'individual') {
      return {
        mode: 'individual',
        source: 'campaign',
        partners: [],
        defaultPartners,
      }
    }

    const direct = Array.isArray(directRelation?.partners) ? directRelation.partners.filter(Boolean) : []
    if (direct.length > 0) {
      return {
        mode: 'pair',
        source: directRelation?.source || 'campaign',
        partners: direct,
        defaultPartners,
      }
    }

    const reverse = Object.entries(campaignRelations).find(([, relation]) =>
      relation?.mode !== 'individual' &&
      (relation?.partners || []).some((partner) => normalizeName(partner) === normalizeName(participantName))
    )

    if (reverse) {
      return {
        mode: 'pair',
        source: reverse[1]?.source || 'campaign',
        partners: [reverse[0]],
        defaultPartners,
      }
    }

    if (defaultPartners.length > 0) {
      return {
        mode: 'pair',
        source: 'registry',
        partners: defaultPartners,
        defaultPartners,
      }
    }

    return {
      mode: 'none',
      source: 'none',
      partners: [],
      defaultPartners,
    }
  }, [campaignRelations, getRegistryDefaultPartners])

  const getPromoPartners = useCallback((participantName) => {
    return getPromoRelationState(participantName).partners
  }, [getPromoRelationState])

  const hasPromoPartners = useCallback((participantName) => {
    return getPromoPartners(participantName).length > 0
  }, [getPromoPartners])

  const persistParticipantRelation = useCallback(async (participantName, partners) => {
    try {
      await api.upsertRegistryParticipant({
        name: participantName,
        group: groupId,
        promo: true,
        promoPartners: partners,
      })
    } catch (err) {
      console.error('Failed to save promo relation to backend:', err)
    }
  }, [groupId])

  const savePromoRelation = useCallback(async (participantName, partners, options = {}) => {
    if (!participantName || !Array.isArray(partners)) {
      throw new Error('Datos inválidos para relación promo')
    }

    const selectedPartner = [...new Set(partners)].filter(Boolean).slice(0, 1)
    const mode = selectedPartner[0] ? 'pair' : (options.mode === 'individual' ? 'individual' : 'none')
    const persistDefault = options.persistDefault !== false
    const nextRelations = JSON.parse(JSON.stringify(allRelations))
    if (!nextRelations[campaignId]) {
      nextRelations[campaignId] = {}
    }

    const participantsToClear = new Set()

    const detachParticipant = (name) => {
      if (!name) return
      if (nextRelations[campaignId][name]) {
        participantsToClear.add(name)
      }
      delete nextRelations[campaignId][name]

      Object.entries(nextRelations[campaignId]).forEach(([owner, relation]) => {
        const nextPartners = (relation?.partners || []).filter((partner) => partner !== name)
        if (nextPartners.length !== (relation?.partners || []).length) {
          participantsToClear.add(owner)
        }
        if (nextPartners.length === 0) {
          delete nextRelations[campaignId][owner]
        } else {
          nextRelations[campaignId][owner] = {
            ...relation,
            mode: 'pair',
            partners: nextPartners,
            updatedAt: new Date().toISOString(),
          }
        }
      })
    }

    detachParticipant(participantName)

    if (selectedPartner[0]) {
      const partnerName = selectedPartner[0]
      detachParticipant(partnerName)

      nextRelations[campaignId][participantName] = {
        mode: 'pair',
        source: 'campaign',
        partners: [partnerName],
        updatedAt: new Date().toISOString(),
      }
      nextRelations[campaignId][partnerName] = {
        mode: 'pair',
        source: 'campaign',
        partners: [participantName],
        updatedAt: new Date().toISOString(),
      }

      participantsToClear.delete(participantName)
      participantsToClear.delete(partnerName)
      if (persistDefault) {
        for (const name of participantsToClear) {
          await persistParticipantRelation(name, [])
        }
        await persistParticipantRelation(participantName, [partnerName])
        await persistParticipantRelation(partnerName, [participantName])
      }
    } else if (mode === 'individual') {
      participantsToClear.delete(participantName)
      nextRelations[campaignId][participantName] = {
        mode: 'individual',
        source: 'campaign',
        partners: [],
        updatedAt: new Date().toISOString(),
      }
    } else {
      participantsToClear.delete(participantName)
      if (persistDefault) {
        for (const name of participantsToClear) {
          await persistParticipantRelation(name, [])
        }
        await persistParticipantRelation(participantName, [])
      }
    }

    setAllRelations(nextRelations)

    return { success: true, partners: selectedPartner }
  }, [allRelations, campaignId, persistParticipantRelation])

  const clearPromoDayOverride = useCallback((participantName) => {
    const nextRelations = JSON.parse(JSON.stringify(allRelations))
    if (!nextRelations[campaignId]) return
    delete nextRelations[campaignId][participantName]
    setAllRelations(nextRelations)
  }, [allRelations, campaignId])

  const removePromoRelation = useCallback(async (participantName) => {
    const currentPartners = getPromoPartners(participantName)
    const nextRelations = JSON.parse(JSON.stringify(allRelations))
    if (!nextRelations[campaignId]) return

    delete nextRelations[campaignId][participantName]
    currentPartners.forEach((partnerName) => {
      delete nextRelations[campaignId][partnerName]
    })

    setAllRelations(nextRelations)

    await persistParticipantRelation(participantName, [])
    for (const partnerName of currentPartners) {
      await persistParticipantRelation(partnerName, [])
    }
  }, [allRelations, campaignId, getPromoPartners, persistParticipantRelation])

  const validatePromoRelation = useCallback((participantName, partners) => {
    const errors = []
    const registry = appData?.registry || []
    const promoRegistry = new Set(
      registry
        .filter((entry) => entry.promo === true)
        .map((entry) => entry.name)
    )

    if (!participantName) {
      errors.push('Selecciona un participante')
    }

    if (!partners || partners.length === 0) {
      errors.push('Selecciona un partner para promo')
    }

    if (partners && partners.length > 1) {
      errors.push('La promo 2x solo permite una dupla')
    }

    for (const partner of partners || []) {
      if (!promoRegistry.has(partner)) {
        errors.push(`"${partner}" no tiene promo 2x activada`)
      }
      if (partner === participantName) {
        errors.push('No puedes ser tu propio partner')
      }
      const assignedPartners = getPromoPartners(partner).filter((name) => name !== participantName)
      if (assignedPartners.length > 0) {
        errors.push(`"${partner}" ya esta en dupla con ${assignedPartners[0]}`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
    }
  }, [appData, getPromoPartners])

  const arePromoPartners = useCallback((participant1, participant2) => {
    return getPromoPartners(participant1).includes(participant2)
  }, [getPromoPartners])

  const getAllPartners = useCallback((participantName) => {
    return getPromoPartners(participantName)
  }, [getPromoPartners])

  return {
    hasPromoPartners,
    getPromoPartners,
    getPromoRelationState,
    getAllPartners,
    getSameGroupParticipants,
    arePromoPartners,
    savePromoRelation,
    removePromoRelation,
    clearPromoDayOverride,
    validatePromoRelation,
    campaignRelations,
  }
}
