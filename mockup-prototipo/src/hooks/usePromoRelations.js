import { useState, useCallback, useMemo } from 'react'
import useAppStore from '../store/useAppStore'
import api from '../api'

const STORAGE_KEY = 'pollas-promo-relations'

function loadPromoRelations() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function savePromoRelations(relations) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(relations))
}

export function usePromoRelations(campaignId, groupId) {
  const { appData } = useAppStore()
  const [allRelations, setAllRelations] = useState(loadPromoRelations)

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

  const getPromoPartners = useCallback((participantName) => {
    const direct = campaignRelations[participantName]?.partners || []
    if (direct.length > 0) return direct

    const reverse = Object.entries(campaignRelations).find(([, relation]) =>
      (relation?.partners || []).includes(participantName)
    )

    return reverse ? [reverse[0]] : []
  }, [campaignRelations])

  const hasPromoPartners = useCallback((participantName) => {
    return getPromoPartners(participantName).length > 0
  }, [getPromoPartners])

  const persistParticipantRelation = useCallback(async (participantName, partners) => {
    try {
      await api.upsertRegistryParticipant({
        name: participantName,
        group: groupId,
        promoPartners: partners,
      })
    } catch (err) {
      console.error('Failed to save promo relation to backend:', err)
    }
  }, [groupId])

  const savePromoRelation = useCallback(async (participantName, partners) => {
    if (!participantName || !Array.isArray(partners)) {
      throw new Error('Datos inválidos para relación promo')
    }

    const selectedPartner = [...new Set(partners)].filter(Boolean).slice(0, 1)
    const nextRelations = JSON.parse(JSON.stringify(allRelations))
    if (!nextRelations[campaignId]) {
      nextRelations[campaignId] = {}
    }

    const detachParticipant = (name) => {
      delete nextRelations[campaignId][name]

      Object.entries(nextRelations[campaignId]).forEach(([owner, relation]) => {
        const nextPartners = (relation?.partners || []).filter((partner) => partner !== name)
        if (nextPartners.length === 0) {
          delete nextRelations[campaignId][owner]
        } else {
          nextRelations[campaignId][owner] = {
            ...relation,
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
        partners: [partnerName],
        updatedAt: new Date().toISOString(),
      }
      nextRelations[campaignId][partnerName] = {
        partners: [participantName],
        updatedAt: new Date().toISOString(),
      }

      await persistParticipantRelation(participantName, [partnerName])
      await persistParticipantRelation(partnerName, [participantName])
    } else {
      await persistParticipantRelation(participantName, [])
    }

    setAllRelations(nextRelations)
    savePromoRelations(nextRelations)

    return { success: true, partners: selectedPartner }
  }, [allRelations, campaignId, persistParticipantRelation])

  const removePromoRelation = useCallback(async (participantName) => {
    const currentPartners = getPromoPartners(participantName)
    const nextRelations = JSON.parse(JSON.stringify(allRelations))
    if (!nextRelations[campaignId]) return

    delete nextRelations[campaignId][participantName]
    currentPartners.forEach((partnerName) => {
      delete nextRelations[campaignId][partnerName]
    })

    setAllRelations(nextRelations)
    savePromoRelations(nextRelations)

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
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
    }
  }, [appData])

  const arePromoPartners = useCallback((participant1, participant2) => {
    return getPromoPartners(participant1).includes(participant2)
  }, [getPromoPartners])

  const getAllPartners = useCallback((participantName) => {
    return getPromoPartners(participantName)
  }, [getPromoPartners])

  return {
    hasPromoPartners,
    getPromoPartners,
    getAllPartners,
    getSameGroupParticipants,
    arePromoPartners,
    savePromoRelation,
    removePromoRelation,
    validatePromoRelation,
    campaignRelations,
  }
}
