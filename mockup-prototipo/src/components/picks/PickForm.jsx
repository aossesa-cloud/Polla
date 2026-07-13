/**
 * PickForm.jsx - CORREGIDO
 *
 * Formulario de ingreso de pronósticos con parsing automático inteligente.
 */

import React, { useState, useCallback, useMemo } from 'react'
import api from '../../api'
import useAppStore from '../../store/useAppStore'
import { useCampaignParticipants } from '../../hooks/useCampaignParticipants'
import {
  buildStructuredRelationConfig,
  campaignNeedsRelationSetup,
  getParticipantRelation,
  getRelationOptionsForCampaign,
  hasParticipantRelationSetup,
  persistParticipantRelation,
} from '../../hooks/useParticipantRelations'
import { useCampaigns } from '../../hooks/useCampaigns'
import {
  buildCampaignEventMeta,
  findLegacyCampaignContainerEvent,
  resolveCampaignPickTargetEventIds,
} from '../../services/campaignEventTargets'
import { getCampaignFirstActiveDate, normalizeDate } from '../../services/campaignEligibility'
import { isParticipantInGroup } from '../../services/participantGroups'
import { isRotatingDuelMode } from '../../services/rotatingDuelScoring'
import { isPlayoffFinalMode } from '../../services/playoffFinalMode'
import { determinePhase } from '../../engine/phaseManager'
import PromoPartnersSelector from './PromoPartnersSelector'
import PickRelationSetup from './PickRelationSetup'
import { parsePicks, validatePicks, formatPicksForAPI } from '../../utils/pickParser'
import styles from '../PickEntry.module.css'

export default function PickForm({
  campaigns,
  operationDate,
  numCarreras,
  availableParticipants,
  allParticipants = [],
  hasPairsMode,
  participant1,
  participant2,
  onSelectParticipant1,
  onSelectParticipant2,
  onSuccess,
}) {
  const { appData, mergeMutationResponse } = useAppStore()
  const { saveCampaign } = useCampaigns()
  const hasPromoEnabled = useMemo(() => campaigns?.some((campaign) => campaign.promoEnabled), [campaigns])
  const promoGroupId = useMemo(() => campaigns?.find((campaign) => campaign.promoEnabled)?.groupId || null, [campaigns])
  const promoPrice = useMemo(() => campaigns?.find((campaign) => campaign.promoEnabled)?.promoPrice || 0, [campaigns])
  const campaignId = useMemo(() => campaigns?.[0]?.id || '', [campaigns])

  const [picks, setPicks] = useState([])
  const [picks2, setPicks2] = useState([])
  const [bulkText, setBulkText] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState(null)
  const [savedRelations, setSavedRelations] = useState({})
  const [dailyDuelOpponents, setDailyDuelOpponents] = useState({})
  const [promoSelections, setPromoSelections] = useState({})
  const [promoPartnerOverrides, setPromoPartnerOverrides] = useState({})

  const raceCount = numCarreras || 12
  const { canParticipantEnterCampaignOnDate, validateParticipant } = useCampaignParticipants()
  const hasMultiStud = picks2.length > 0
  const participantCampaignConflicts = useMemo(() => {
    const selectedParticipantNames = [
      participant1,
      hasMultiStud ? participant2 : '',
    ].filter(Boolean)

    return (campaigns || []).flatMap((campaign) => (
      selectedParticipantNames.flatMap((participantName) => {
        const rule = canParticipantEnterCampaignOnDate(campaign, participantName, operationDate)
        return rule.allowed
          ? []
          : [{ campaign, participantName, reason: rule.reason }]
      })
    ))
  }, [campaigns, canParticipantEnterCampaignOnDate, hasMultiStud, operationDate, participant1, participant2])
  const participantCampaignConflictText = useMemo(() => (
    participantCampaignConflicts
      .map(({ campaign, participantName, reason }) => (
        `"${participantName}" no se puede agregar a "${campaign.name}": ${reason}`
      ))
      .join(' | ')
  ), [participantCampaignConflicts])
  const migratedRelationCampaignsRef = React.useRef(new Set())
  const participantPool = useMemo(() => {
    const pool = Array.isArray(allParticipants) && allParticipants.length > 0
      ? allParticipants
      : appData?.registry || []
    return Array.isArray(pool) ? pool : []
  }, [allParticipants, appData])
  const participant1Record = useMemo(
    () => findParticipantRecord(participantPool, participant1),
    [participantPool, participant1]
  )
  const participant2Record = useMemo(
    () => findParticipantRecord(participantPool, participant2),
    [participantPool, participant2]
  )
  const participant1HabitualPromoPartners = useMemo(() => (
    getHabitualPromoPartners({
      appData,
      participantPool,
      participantName: participant1,
    })
  ), [appData, participant1, participantPool])
  const participant2HabitualPromoPartners = useMemo(() => (
    getHabitualPromoPartners({
      appData,
      participantPool,
      participantName: participant2,
    })
  ), [appData, participant2, participantPool])
  const participant1CurrentPromoPartners = getPromoPartnerOverride(
    promoPartnerOverrides,
    participant1,
    participant1HabitualPromoPartners
  )
  const participant2CurrentPromoPartners = getPromoPartnerOverride(
    promoPartnerOverrides,
    participant2,
    participant2HabitualPromoPartners
  )
  const participant1PromoSelected = getPromoSelection(
    promoSelections,
    participant1,
    participant1Record,
    participant1CurrentPromoPartners
  )
  const participant2PromoSelected = getPromoSelection(
    promoSelections,
    participant2,
    participant2Record,
    participant2CurrentPromoPartners
  )
  const participantsSharePromoPair = Boolean(
    participant1 &&
    participant2 &&
    participant1CurrentPromoPartners.some((partner) => matchParticipantName(partner, participant2))
  )
  const promoParticipantPool = useMemo(() => (
    participantPool.map((participant) => {
      if (participant1 && matchParticipantName(participant.name, participant1)) {
        return { ...participant, promo: participant1PromoSelected, promoPartners: participant1CurrentPromoPartners }
      }
      if (participant2 && matchParticipantName(participant.name, participant2)) {
        return { ...participant, promo: participant2PromoSelected, promoPartners: participant2CurrentPromoPartners }
      }
      return participant
    })
  ), [
    participant1,
    participant1CurrentPromoPartners,
    participant1PromoSelected,
    participant2,
    participant2CurrentPromoPartners,
    participant2PromoSelected,
    participantPool,
  ])

  const parseResult = useMemo(() => {
    if (!bulkText.trim()) return null
    return parsePicks(bulkText, raceCount)
  }, [bulkText, raceCount])

  const selectedParticipantEntries = useMemo(() => ([
    participant1 ? { name: participant1, key: 'participant1' } : null,
    hasMultiStud && participant2 ? { name: participant2, key: 'participant2' } : null,
  ].filter(Boolean)), [hasMultiStud, participant1, participant2])

  const relationRequirements = useMemo(() => {
    if (!campaigns?.length || selectedParticipantEntries.length === 0) return []

    return campaigns.flatMap((campaign) => {
      if (!campaignNeedsRelationSetup(campaign)) return []

      return selectedParticipantEntries
        .filter(({ name }) => !hasParticipantRelationSetup(savedRelations, campaign, name))
        .map(({ name, key }) => {
          const currentRelation = getParticipantRelation(savedRelations, campaign, name)
          const mode = campaign?.modeConfig?.format || campaign?.format || campaign?.competitionMode
          return {
            id: `${campaign.id}-${key}-${name}`,
            campaign,
            participantName: name,
            relationType:
              mode === 'groups'
                ? 'group'
                : mode === 'head-to-head'
                  ? 'opponent'
                  : 'pair',
            currentValue:
              currentRelation?.pair ||
              currentRelation?.group ||
              currentRelation?.opponent ||
              '',
            options: getRelationOptionsForCampaign(campaign, appData, name, participantPool, savedRelations),
          }
        })
    })
  }, [appData, campaigns, participantPool, savedRelations, selectedParticipantEntries])

  const dailyDuelRequirements = useMemo(() => {
    if (!campaigns?.length || selectedParticipantEntries.length === 0) return []

    return campaigns.flatMap((campaign) => {
      if (!campaignUsesDailyDuelSetup(campaign, operationDate)) return []

      return selectedParticipantEntries
        .map(({ name, key }) => {
          const currentValue = getDailyDuelOpponentValue({
            appData,
            campaign,
            participantName: name,
            operationDate,
            dailyDuelOpponents,
          })

          return {
            id: `${campaign.id}-${operationDate || 'sin-fecha'}-${key}-${name}-duel`,
            campaign,
            participantName: name,
            currentValue,
            options: getDailyDuelOpponentOptions({
              appData,
              campaign,
              participantName: name,
              participantPool,
              availableParticipants,
              operationDate,
            }),
          }
        })
        .filter((requirement) => !requirement.currentValue)
    })
  }, [
    appData,
    availableParticipants,
    campaigns,
    dailyDuelOpponents,
    operationDate,
    participantPool,
    selectedParticipantEntries,
  ])

  React.useEffect(() => {
    let cancelled = false

    const syncStructuredRelations = async () => {
      for (const campaign of campaigns || []) {
        if (!campaignNeedsRelationSetup(campaign)) continue
        if (migratedRelationCampaignsRef.current.has(campaign.id)) continue

        const currentRelations = savedRelations?.[campaign.id]
        if (!currentRelations || Object.keys(currentRelations).length === 0) continue

        const structuredConfig = buildStructuredRelationConfig(campaign, participantPool, savedRelations)
        const hasPairs = Array.isArray(structuredConfig.pairs) && structuredConfig.pairs.length > 0
        const hasGroups = Array.isArray(structuredConfig.groups) && structuredConfig.groups.length > 0
        const hasMatchups = Array.isArray(structuredConfig.matchups) && structuredConfig.matchups.length > 0
        if (!hasPairs && !hasGroups && !hasMatchups) continue

        const currentModeConfig = campaign?.modeConfig || {}
        const alreadyPersisted = (
          (hasPairs && Array.isArray(currentModeConfig.pairs) && currentModeConfig.pairs.length > 0) ||
          (hasGroups && Array.isArray(currentModeConfig.groups) && currentModeConfig.groups.some((group) => Array.isArray(group?.members) && group.members.length > 0)) ||
          (hasMatchups && Array.isArray(currentModeConfig.matchups) && currentModeConfig.matchups.length > 0)
        )

        if (alreadyPersisted) {
          migratedRelationCampaignsRef.current.add(campaign.id)
          continue
        }

        try {
          await saveCampaign(campaign.type || 'semanal', {
            ...campaign,
            modeConfig: {
              ...currentModeConfig,
              ...structuredConfig,
            },
            ...structuredConfig,
          })
          if (cancelled) return
          migratedRelationCampaignsRef.current.add(campaign.id)
        } catch {
          if (cancelled) return
        }
      }
    }

    syncStructuredRelations()
    return () => {
      cancelled = true
    }
  }, [campaigns, participantPool, saveCampaign, savedRelations])

  React.useEffect(() => {
    if (parseResult && parseResult.isValid) {
      if (parseResult.studCount === 2) {
        setPicks(parseResult.studs[0] || [])
        setPicks2(parseResult.studs[1] || [])
        setMensaje({
          tipo: 'info',
          texto: 'Se detectaron múltiples pronósticos. Selecciona el segundo participante.',
        })
      } else {
        setPicks(parseResult.studs[0] || [])
        setPicks2([])
        setMensaje({
          tipo: 'ok',
          texto: `Formato detectado: ${parseResult.format.toUpperCase()} -> ${parseResult.raceCount} carreras`,
        })
      }
    } else if (!bulkText.trim()) {
      setPicks([])
      setPicks2([])
      setMensaje(null)
    }
  }, [parseResult, raceCount])

  React.useEffect(() => {
    if (!hasMultiStud || !participant1 || participant2 || !participant1PromoSelected) return

    const habitualPartner = participant1CurrentPromoPartners[0] || ''
    if (!habitualPartner || matchParticipantName(habitualPartner, participant1)) return

    const isAvailable = (availableParticipants || []).some((participant) =>
      matchParticipantName(participant?.name, habitualPartner)
    )
    if (!isAvailable) return

    onSelectParticipant2?.(habitualPartner)
  }, [
    availableParticipants,
    hasMultiStud,
    onSelectParticipant2,
    participant1,
    participant1CurrentPromoPartners,
    participant1PromoSelected,
    participant2,
  ])

  const handleBulkChange = useCallback((event) => {
    setBulkText(event.target.value)
  }, [])

  const handleClear = useCallback(() => {
    setBulkText('')
    setPicks([])
    setPicks2([])
    setMensaje(null)
  }, [])

  const handleSaveRelation = useCallback((campaign, participantName, relationType, value) => {
    const nextRelations = persistParticipantRelation(campaign, participantName, relationType, value)
    setSavedRelations((current) => ({
      ...current,
      ...nextRelations,
    }))
    setMensaje({
      tipo: 'ok',
      texto: `Relación guardada para "${participantName}" en "${campaign.name}"`,
    })
  }, [])

  const handleDailyDuelOpponentSave = useCallback((campaign, participantName, _relationType, value) => {
    const opponent = String(value || '').trim()
    if (!opponent || matchParticipantName(opponent, participantName)) {
      setMensaje({
        tipo: 'error',
        texto: 'Selecciona un rival distinto al participante.',
      })
      return
    }

    setDailyDuelOpponents((current) => {
      const participantKey = buildDailyDuelKey(campaign, participantName, operationDate)
      const opponentKey = buildDailyDuelKey(campaign, opponent, operationDate)
      const next = { ...current }

      const previousOpponent = next[participantKey]
      if (previousOpponent && !matchParticipantName(previousOpponent, opponent)) {
        delete next[buildDailyDuelKey(campaign, previousOpponent, operationDate)]
      }

      const previousOwner = next[opponentKey]
      if (previousOwner && !matchParticipantName(previousOwner, participantName)) {
        delete next[buildDailyDuelKey(campaign, previousOwner, operationDate)]
      }

      next[participantKey] = opponent
      next[opponentKey] = participantName

      return next
    })
    setMensaje({
      tipo: 'ok',
      texto: `Duelo guardado para hoy: "${participantName}" vs "${opponent}"`,
    })
  }, [operationDate])

  const handlePersistedRelationSave = useCallback(async (campaign, participantName, relationType, value) => {
    const campaignWithLocalRelations = mergeCampaignWithLocalRelations(campaign, participantPool, savedRelations)
    const nextRelations = persistParticipantRelation(campaignWithLocalRelations, participantName, relationType, value)

    try {
      const structuredConfig = buildStructuredRelationConfig(campaign, participantPool, nextRelations)
      const nextModeConfig = {
        ...(campaign?.modeConfig || {}),
        ...structuredConfig,
      }

      await saveCampaign(campaign.type || 'semanal', {
        ...campaign,
        modeConfig: nextModeConfig,
        ...structuredConfig,
      })
    } catch (error) {
      setMensaje({
        tipo: 'error',
        texto: `Se guardó la relación local, pero falló la persistencia en campaña: ${error.message}`,
      })
      return
    }

    setSavedRelations(nextRelations)
    setMensaje({
      tipo: 'ok',
      texto: `Relación guardada para "${participantName}" en "${campaign.name}"`,
    })
  }, [participantPool, saveCampaign, savedRelations])

  const handlePromoSelectionChange = useCallback((participantName, checked) => {
    if (!participantName) return
    setPromoSelections((current) => ({
      ...current,
      [participantName]: checked,
    }))
  }, [])

  const handlePromoPartnersChange = useCallback((participantName, partners = []) => {
    if (!participantName) return
    const normalizedPartners = uniqueParticipantNames(partners)

    setPromoPartnerOverrides((current) => {
      const next = {
        ...current,
        [participantName]: normalizedPartners,
      }

      const [partnerName] = normalizedPartners
      if (partnerName) {
        next[partnerName] = [participantName]
      }

      return next
    })
    setPromoSelections((current) => ({
      ...current,
      [participantName]: true,
    }))
  }, [])

  const handleGuardar = useCallback(async () => {
    if (!campaigns || campaigns.length === 0 || picks.length === 0) {
      setMensaje({ tipo: 'error', texto: 'Selecciona campañas y completa al menos un pick.' })
      return
    }

    if (!participant1) {
      setMensaje({ tipo: 'error', texto: 'Selecciona el participante.' })
      return
    }

    if (hasMultiStud && !participant2) {
      setMensaje({ tipo: 'error', texto: 'Se detectaron 2 studs. Selecciona el segundo participante.' })
      return
    }

    if (relationRequirements.length > 0) {
      setMensaje({
        tipo: 'error',
        texto: 'Completa primero la configuración de pareja, grupo o contrincante para las campañas que lo requieren.',
      })
      return
    }

    if (dailyDuelRequirements.length > 0) {
      setMensaje({
        tipo: 'error',
        texto: 'Completa primero el rival del duelo para esta jornada.',
      })
      return
    }

    if (participantCampaignConflicts.length > 0) {
      setMensaje({
        tipo: 'error',
        texto: `Revisa las campa\u00f1as seleccionadas. ${participantCampaignConflictText}`,
      })
      return
    }

    const validation = validatePicks(picks, { maxRace: raceCount })
    if (!validation.isValid) {
      setMensaje({ tipo: 'error', texto: `Errores: ${validation.errors.join(', ')}` })
      return
    }

    if (hasMultiStud && picks2.length > 0) {
      const validation2 = validatePicks(picks2, { maxRace: raceCount })
      if (!validation2.isValid) {
        setMensaje({ tipo: 'error', texto: `Errores Stud B: ${validation2.errors.join(', ')}` })
        return
      }
    }

    const targetIdsByCampaign = campaigns.map((campaign) => ({
      campaign,
      eventIds: resolveCampaignPickTargetEventIds(campaign, operationDate),
    }))
    const allTargetEventIds = targetIdsByCampaign.flatMap(({ eventIds }) => eventIds)

    const participantValidation1 = validateParticipant(participant1, allTargetEventIds)
    if (!participantValidation1.isValid) {
      setMensaje({ tipo: 'error', texto: participantValidation1.error })
      return
    }

    if (hasMultiStud && participant2) {
      const participantValidation2 = validateParticipant(participant2, allTargetEventIds)
      if (!participantValidation2.isValid) {
        setMensaje({ tipo: 'error', texto: participantValidation2.error })
        return
      }
    }

    setGuardando(true)
    try {
      let successCount = 0
      const errorMessages = []

      for (const { campaign, eventIds } of targetIdsByCampaign) {
        const [eventId] = eventIds
        if (!eventId) {
          errorMessages.push(`No se pudo resolver la jornada destino para "${campaign.name}"`)
          continue
        }

        try {
          const enrollmentRule1 = canParticipantEnterCampaignOnDate(campaign, participant1, operationDate)
          if (!enrollmentRule1.allowed) {
            errorMessages.push(`"${participant1}" no se agregó a "${campaign.name}": no está inscrito desde el primer día`)
            continue
          }

          const enrollmentRule2 = hasMultiStud && participant2
            ? canParticipantEnterCampaignOnDate(campaign, participant2, operationDate)
            : { allowed: true }
          const skipSecondParticipant = !enrollmentRule2.allowed

          mergeMutationResponse(await api.upsertEventMeta(eventId, buildCampaignEventMeta(campaign, operationDate)))

          const existingEvent = getEventById(appData, eventId)
          const legacyEvent = findLegacyCampaignContainerEvent(appData, campaign)

          if ((!existingEvent || !existingEvent.participants?.length) && legacyEvent?.participants?.length) {
            mergeMutationResponse(await api.upsertEventMeta(eventId, buildCampaignEventMeta(campaign, operationDate)))
            for (const legacyParticipant of legacyEvent.participants) {
              mergeMutationResponse(await api.savePickForEvent(eventId, legacyParticipant, buildPickAuditMetadata({
                campaign,
                eventId,
                operationDate,
                appData,
                source: 'legacy-migration',
                inputMode: 'legacy-copy',
                role: 'legacy',
                reason: 'empty-event-bootstrap',
              })))
            }
          }

          const nextIndex = getNextParticipantOrder(existingEvent, legacyEvent)

          const participantPayload1 = buildParticipantPickPayload({
            index: nextIndex,
            name: participant1,
            picks: formatPicksForAPI(picks),
            campaign,
            participantRecord: participant1Record,
            promoSelected: participant1PromoSelected,
            promoPartnersOverride: participant1CurrentPromoPartners,
            dailyDuelOpponent: getDailyDuelOpponentValue({
              appData,
              campaign,
              participantName: participant1,
              operationDate,
              dailyDuelOpponents,
            }),
            dailyDuelDate: operationDate,
            appData,
            participantPool,
          })
          await persistPromoParticipantIfNeeded(participantPayload1, campaign, participant1Record)

          const result1 = await api.savePickForEvent(eventId, participantPayload1, buildPickAuditMetadata({
            campaign,
            eventId,
            operationDate,
            appData,
            source: 'manual',
            inputMode: getPickInputMode(parseResult, bulkText),
            role: 'principal',
          }))
          mergeMutationResponse(result1)

          if (result1?.error?.includes('ya existe') || result1?.error?.includes('duplicado')) {
            errorMessages.push(`"${participant1}" ya existe en "${campaign.name}"`)
            continue
          }

          successCount++

          if (hasMultiStud && picks2.length > 0 && participant2) {
            if (skipSecondParticipant) {
              errorMessages.push(`"${participant2}" no se agregó a "${campaign.name}": no está inscrito desde el primer día`)
            } else {
              const participantPayload2 = buildParticipantPickPayload({
                index: nextIndex + 1,
                name: participant2,
                picks: formatPicksForAPI(picks2),
                campaign,
                participantRecord: participant2Record,
                promoSelected: participant2PromoSelected,
                promoPartnersOverride: participant2CurrentPromoPartners,
                dailyDuelOpponent: getDailyDuelOpponentValue({
                  appData,
                  campaign,
                  participantName: participant2,
                  operationDate,
                  dailyDuelOpponents,
                }),
                dailyDuelDate: operationDate,
                appData,
                participantPool,
              })
              await persistPromoParticipantIfNeeded(participantPayload2, campaign, participant2Record)

              const result2 = await api.savePickForEvent(eventId, participantPayload2, buildPickAuditMetadata({
                campaign,
                eventId,
                operationDate,
                appData,
                source: 'manual',
                inputMode: getPickInputMode(parseResult, bulkText),
                role: 'secondary',
              }))
              mergeMutationResponse(result2)

              if (result2?.error?.includes('ya existe') || result2?.error?.includes('duplicado')) {
                errorMessages.push(`"${participant2}" ya existe en "${campaign.name}"`)
              } else {
                successCount++
              }
            }
          }
        } catch (error) {
          if (String(error?.message || '').includes('ya existe') || String(error?.message || '').includes('duplicado')) {
            errorMessages.push(`"${participant1}" ya está registrado en "${campaign.name}"`)
          } else {
            errorMessages.push(`Error en "${campaign.name}": ${error.message}`)
          }
        }
      }

      if (errorMessages.length > 0) {
        if (successCount > 0) {
          setMensaje({
            tipo: 'info',
            texto: `Parcial: ${successCount} guardados. Errores: ${errorMessages.join('; ')}`,
          })
        } else {
          setMensaje({ tipo: 'error', texto: errorMessages.join('; ') })
        }
      } else {
        const studCount = hasMultiStud ? '2 studs' : '1 stud'
        setMensaje({
          tipo: 'ok',
          texto: `Pronóstico guardado en ${campaigns.length} campaña${campaigns.length > 1 ? 's' : ''} (${studCount})`,
        })
        setBulkText('')
        setPicks([])
        setPicks2([])
        onSuccess?.()
      }
    } catch (error) {
      setMensaje({ tipo: 'error', texto: `Error: ${error.message}` })
    } finally {
      setGuardando(false)
    }
  }, [
    appData,
    campaigns,
    operationDate,
    participant1,
    participant2,
    participantPool,
    participant1Record,
    participant1CurrentPromoPartners,
    participant1PromoSelected,
    participant2Record,
    participant2CurrentPromoPartners,
    participant2PromoSelected,
    picks,
    picks2,
    canParticipantEnterCampaignOnDate,
    hasMultiStud,
    raceCount,
    onSuccess,
    relationRequirements.length,
    dailyDuelRequirements.length,
    dailyDuelOpponents,
    participantCampaignConflicts.length,
    participantCampaignConflictText,
    validateParticipant,
    mergeMutationResponse,
  ])

  const handlePickChange = useCallback((carrera, valor, studNum = 1) => {
    if (studNum === 2) {
      setPicks2((current) => {
        const next = [...current]
        next[carrera - 1] = valor
        return next
      })
      return
    }

    setPicks((current) => {
      const next = [...current]
      next[carrera - 1] = valor
      return next
    })
  }, [])

  const completedCount = picks.filter(Boolean).length
  const completedCount2 = picks2.filter(Boolean).length

  return (
    <div className={styles.pickForm}>
      {mensaje && (
        <div className={`${styles.message} ${styles[mensaje.tipo]}`}>
          {mensaje.texto}
        </div>
      )}

      {participantCampaignConflicts.length > 0 && (
        <div className={`${styles.message} ${styles.error}`}>
          <strong>{'Participante incompatible con una o m\u00e1s campa\u00f1as seleccionadas.'}</strong>
          {' '}{participantCampaignConflictText}
        </div>
      )}

      <div className={styles.section}>
        <label className={styles.sectionLabel}>
          Participante{hasMultiStud ? ' 1' : ''}
          {availableParticipants.length > 0 && (
            <span className={styles.participantCount}>
              {' '}({availableParticipants.length} disponibles)
            </span>
          )}
        </label>
        <SearchableParticipantSelect
          value={participant1}
          participants={availableParticipants}
          onChange={onSelectParticipant1}
          placeholder="Buscar participante..."
          emptyLabel="Sin participantes"
        />

        {hasMultiStud && (
          <div className={styles.participant2Section}>
            <label className={styles.sectionLabel}>
              Participante 2
              <span className={styles.multiStudWarning}> (selecciona el segundo stud)</span>
            </label>
            <SearchableParticipantSelect
              value={participant2}
              participants={availableParticipants.filter((participant) => participant.name !== participant1)}
              onChange={onSelectParticipant2}
              placeholder="Buscar segundo participante..."
              emptyLabel="Sin participantes"
              variant="stud2"
            />
          </div>
        )}

        {hasPromoEnabled && participant1 && (
          <div className={styles.promoInlineControls}>
            <label className={styles.promoToggle}>
              <input
                type="checkbox"
                checked={participant1PromoSelected}
                onChange={(event) => handlePromoSelectionChange(participant1, event.target.checked)}
              />
              <span>Con Promo 2x</span>
            </label>

            {participant1PromoSelected && (
              <PromoPartnersSelector
                campaignId={campaignId}
                groupId={promoGroupId}
                participantName={participant1}
                campaignPromoEnabled={hasPromoEnabled}
                campaignPromoPrice={promoPrice}
                allParticipants={promoParticipantPool}
                onPartnersChange={(partners) => handlePromoPartnersChange(participant1, partners)}
              />
            )}
          </div>
        )}

        {hasPromoEnabled && hasMultiStud && participant2 && !participantsSharePromoPair && (
          <div className={styles.promoInlineControls}>
            <label className={styles.promoToggle}>
              <input
                type="checkbox"
                checked={participant2PromoSelected}
                onChange={(event) => handlePromoSelectionChange(participant2, event.target.checked)}
              />
              <span>Con Promo 2x para participante 2</span>
            </label>

            {participant2PromoSelected && (
              <PromoPartnersSelector
                campaignId={campaignId}
                groupId={promoGroupId}
                participantName={participant2}
                campaignPromoEnabled={hasPromoEnabled}
                campaignPromoPrice={promoPrice}
                allParticipants={promoParticipantPool}
                onPartnersChange={(partners) => handlePromoPartnersChange(participant2, partners)}
              />
            )}
          </div>
        )}
      </div>

      {relationRequirements.length > 0 && (
        <div className={styles.relationSetupList}>
          {relationRequirements.map((requirement) => (
            <div key={requirement.id} className={styles.relationSetupCard}>
              <div className={styles.relationSetupHeader}>
                <span className={styles.relationCampaignBadge}>
                  {(requirement.campaign.type || 'campaña').toUpperCase()}
                </span>
                <strong className={styles.relationCampaignName}>{requirement.campaign.name}</strong>
                <span className={styles.relationParticipantBadge}>{requirement.participantName}</span>
              </div>
                <PickRelationSetup
                  relationType={requirement.relationType}
                  options={requirement.options}
                  participantName={requirement.participantName}
                  initialValue={requirement.currentValue}
                  onSave={(participantName, relationType, value) =>
                    handlePersistedRelationSave(requirement.campaign, participantName, relationType, value)
                  }
                />
            </div>
          ))}
        </div>
      )}

      {dailyDuelRequirements.length > 0 && (
        <div className={styles.relationSetupList}>
          {dailyDuelRequirements.map((requirement) => (
            <div key={requirement.id} className={styles.relationSetupCard}>
              <div className={styles.relationSetupHeader}>
                <span className={styles.relationCampaignBadge}>
                  {(requirement.campaign.type || 'campaña').toUpperCase()}
                </span>
                <strong className={styles.relationCampaignName}>{requirement.campaign.name}</strong>
                <span className={styles.relationParticipantBadge}>{requirement.participantName}</span>
              </div>
              <PickRelationSetup
                relationType="daily-opponent"
                options={requirement.options}
                participantName={requirement.participantName}
                initialValue={requirement.currentValue}
                onSave={(participantName, relationType, value) =>
                  handleDailyDuelOpponentSave(requirement.campaign, participantName, relationType, value)
                }
              />
            </div>
          ))}
        </div>
      )}

      <div className={styles.section}>
        <label className={styles.sectionLabel}>
          Ingreso Automático
          {parseResult && (
            <span className={styles.parseStatus}>
              {' '}(Detectado: {parseResult.format.toUpperCase()})
            </span>
          )}
        </label>
        <textarea
          className={`${styles.bulkTextarea} ${bulkText ? styles.bulkTextareaActive : ''}`}
          value={bulkText}
          onChange={handleBulkChange}
          placeholder={`Pega o escribe tus pronósticos aquí...

Ejemplos:
• Simple: 5 12 11 3 7 8 2 9 1 6 4 10
• Vertical: 5
           12
           11
• Multi-stud: 12-1
              6-3
              7-2`}
          rows={hasMultiStud ? 6 : 4}
        />
        {bulkText && (
          <div className={styles.pasteActions}>
            <button className={styles.clearBtn} onClick={handleClear}>
              Limpiar
            </button>
            <span className={styles.parseInfo}>
              {parseResult?.studCount === 2
                ? `2 studs detectados · ${parseResult.raceCount} carreras`
                : `${completedCount}/${raceCount} carreras parseadas`}
            </span>
            <button
              className={`${styles.saveBtnInline} ${(!campaigns || campaigns.length === 0 || !participant1 || picks.length === 0 || (hasMultiStud && !participant2) || relationRequirements.length > 0 || dailyDuelRequirements.length > 0 || participantCampaignConflicts.length > 0) ? styles.disabled : ''}`}
              onClick={handleGuardar}
              disabled={guardando || !campaigns || campaigns.length === 0 || !participant1 || picks.length === 0 || (hasMultiStud && !participant2) || relationRequirements.length > 0 || dailyDuelRequirements.length > 0 || participantCampaignConflicts.length > 0}
            >
              {guardando ? 'Guardando...' : `Guardar (${picks.filter(Boolean).length} picks)`}
            </button>
          </div>
        )}
      </div>

      {picks.length > 0 && (
        <div className={styles.picksSection}>
          <h3 className={styles.picksTitle}>
            {hasMultiStud ? 'Stud A' : 'Pronósticos'}: {completedCount}/{raceCount}
          </h3>
          <div className={`${styles.picksGrid} ${hasMultiStud ? styles.picksGridDual : ''}`}>
            {Array.from({ length: Math.max(raceCount, picks.length) }, (_, index) => index + 1).map((carrera) => (
              <div key={`s1-${carrera}`} className={styles.pickCell}>
                <label className={styles.pickLabel}>C{carrera}</label>
                <input
                  className={`${styles.pickInput} ${picks[carrera - 1] ? styles.pickInputFilled : ''}`}
                  type="text"
                  value={picks[carrera - 1] || ''}
                  onChange={(event) => handlePickChange(carrera, event.target.value, 1)}
                  placeholder="—"
                  maxLength={3}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {hasMultiStud && picks2.length > 0 && (
        <div className={`${styles.picksSection} ${styles.picksSectionStud2}`}>
          <h3 className={`${styles.picksTitle} ${styles.picksTitleStud2}`}>
            Stud B: {completedCount2}/{Math.max(raceCount, picks2.length)}
          </h3>
          <div className={`${styles.picksGrid} ${styles.picksGridDual}`}>
            {Array.from({ length: Math.max(raceCount, picks2.length) }, (_, index) => index + 1).map((carrera) => (
              <div key={`s2-${carrera}`} className={`${styles.pickCell} ${styles.pickCellStud2}`}>
                <label className={`${styles.pickLabel} ${styles.pickLabelStud2}`}>C{carrera}</label>
                <input
                  className={`${styles.pickInput} ${styles.pickInputStud2} ${picks2[carrera - 1] ? styles.pickInputFilled : ''}`}
                  type="text"
                  value={picks2[carrera - 1] || ''}
                  onChange={(event) => handlePickChange(carrera, event.target.value, 2)}
                  placeholder="—"
                  maxLength={3}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {picks.length > 0 && (
        <div className={styles.previewSection}>
          <label className={styles.sectionLabel}>Vista Previa</label>
          <div className={styles.preview}>
            {hasMultiStud ? (
              <>
                <div><strong>Stud A ({participant1 || '?'})</strong>: {picks.join(' · ') || 'vacío'}</div>
                <div><strong>Stud B ({participant2 || '?'})</strong>: {picks2.join(' · ') || 'vacío'}</div>
              </>
            ) : (
              <div><strong>{participant1 || '?'}</strong>: {picks.join(' · ') || 'vacío'}</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function SearchableParticipantSelect({
  value,
  participants = [],
  onChange,
  placeholder = 'Buscar participante...',
  emptyLabel = 'Sin resultados',
  variant = '',
}) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const rootRef = React.useRef(null)
  const normalizedQuery = normalizeParticipantName(query)
  const selectedParticipant = participants.find((participant) => matchParticipantName(participant?.name, value)) || null
  const filteredParticipants = useMemo(() => {
    const list = Array.isArray(participants) ? participants : []
    if (!normalizedQuery) return list

    return list.filter((participant) => (
      normalizeParticipantName(participant?.name).includes(normalizedQuery)
    ))
  }, [normalizedQuery, participants])
  const visibleParticipants = filteredParticipants.slice(0, 60)
  const inputValue = isOpen ? query : (selectedParticipant?.name || value || '')
  const variantClass = variant === 'stud2' ? styles.participantSearchStud2 : ''

  React.useEffect(() => {
    if (!isOpen) return undefined

    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setIsOpen(false)
        setQuery('')
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [isOpen])

  React.useEffect(() => {
    setActiveIndex(0)
  }, [query, participants])

  const selectParticipant = useCallback((name) => {
    onChange?.(name)
    setQuery('')
    setIsOpen(false)
  }, [onChange])

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setIsOpen(true)
      setActiveIndex((current) => Math.min(current + 1, Math.max(visibleParticipants.length - 1, 0)))
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((current) => Math.max(current - 1, 0))
      return
    }

    if (event.key === 'Enter') {
      if (!isOpen || visibleParticipants.length === 0) return
      event.preventDefault()
      selectParticipant(visibleParticipants[activeIndex]?.name || visibleParticipants[0]?.name)
      return
    }

    if (event.key === 'Escape') {
      setIsOpen(false)
      setQuery('')
    }
  }

  return (
    <div className={`${styles.participantSearch} ${variantClass}`} ref={rootRef}>
      <div className={styles.participantSearchInputWrap}>
        <input
          className={styles.participantSearchInput}
          type="search"
          value={inputValue}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          onFocus={() => {
            setIsOpen(true)
            setQuery('')
          }}
          onChange={(event) => {
            setQuery(event.target.value)
            setIsOpen(true)
          }}
          onKeyDown={handleKeyDown}
        />
        {value && (
          <button
            type="button"
            className={styles.participantSearchClear}
            onClick={() => selectParticipant('')}
            title="Limpiar"
            aria-label="Limpiar participante"
          >
            ×
          </button>
        )}
        <button
          type="button"
          className={styles.participantSearchToggle}
          onClick={() => {
            setIsOpen((current) => !current)
            setQuery('')
          }}
          aria-label="Abrir lista"
        >
          ▾
        </button>
      </div>

      {isOpen && (
        <div className={styles.participantSearchMenu} role="listbox">
          {visibleParticipants.length === 0 ? (
            <div className={styles.participantSearchEmpty}>{emptyLabel}</div>
          ) : (
            visibleParticipants.map((participant, index) => {
              const isSelected = matchParticipantName(participant.name, value)
              const isActive = index === activeIndex

              return (
                <button
                  key={participant.name}
                  type="button"
                  className={`${styles.participantSearchOption} ${isSelected ? styles.participantSearchOptionSelected : ''} ${isActive ? styles.participantSearchOptionActive : ''}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectParticipant(participant.name)}
                  role="option"
                  aria-selected={isSelected}
                >
                  <span>{participant.name}</span>
                  {participant.groupName && <small>{participant.groupName}</small>}
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

function getEventById(appData, eventId) {
  const events = Array.isArray(appData?.events) ? appData.events : Object.values(appData?.events || {})
  return events.find((event) => String(event?.id || '') === String(eventId)) || null
}

function mergeCampaignWithLocalRelations(campaign, participantPool, savedRelations) {
  const campaignId = campaign?.id || ''
  const hasLocalRelations = campaignId && Object.keys(savedRelations?.[campaignId] || {}).length > 0
  if (!hasLocalRelations) return campaign

  const structuredConfig = buildStructuredRelationConfig(campaign, participantPool, savedRelations)
  return {
    ...campaign,
    modeConfig: {
      ...(campaign?.modeConfig || {}),
      ...structuredConfig,
    },
    ...structuredConfig,
  }
}

function getNextParticipantOrder(...events) {
  const indexes = events.flatMap((event) => (
    Array.isArray(event?.participants) ? event.participants.map((participant) => Number(participant?.index) || 0) : []
  ))
  return (indexes.length ? Math.max(...indexes) : 0) + 1
}

function findParticipantRecord(participantPool, participantName) {
  if (!participantName) return null
  return (participantPool || []).find((participant) => matchParticipantName(participant?.name, participantName)) || null
}

function getPromoSelection(selections, participantName, participantRecord, habitualPartners = []) {
  if (!participantName) return false
  if (Object.prototype.hasOwnProperty.call(selections || {}, participantName)) {
    return Boolean(selections[participantName])
  }
  return Boolean(participantRecord?.promo || habitualPartners.length > 0)
}

function getPromoPartnerOverride(overrides, participantName, fallbackPartners = []) {
  if (!participantName) return []
  if (Object.prototype.hasOwnProperty.call(overrides || {}, participantName)) {
    return Array.isArray(overrides[participantName]) ? overrides[participantName] : []
  }
  return Array.isArray(fallbackPartners) ? fallbackPartners : []
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
  const direct = (participants || [])
    .filter((entry) => matchParticipantName(entry?.name, participantName))
    .filter((entry) => entry?.promoMode !== 'individual')
    .flatMap((entry) => (Array.isArray(entry?.promoPartners) ? entry.promoPartners : []))

  const reverse = (participants || [])
    .filter((entry) => entry?.promoMode !== 'individual')
    .filter((entry) => (
      Array.isArray(entry?.promoPartners) &&
      entry.promoPartners.some((partner) => matchParticipantName(partner, participantName))
    ))
    .map((entry) => entry.name)

  return uniqueParticipantNames([...direct, ...reverse])
    .filter((partner) => !matchParticipantName(partner, participantName))
}

function getHabitualPromoPartners({ appData, participantPool, participantName }) {
  return uniqueParticipantNames([
    ...getParticipantPromoPartners(participantPool, participantName),
    ...getParticipantPromoPartners(getEventParticipants(appData), participantName),
  ]).filter((partner) => !matchParticipantName(partner, participantName))
}

function campaignUsesRotatingDuel(campaign) {
  const mode = campaign?.modeConfig?.format || campaign?.format || campaign?.competitionMode
  return isRotatingDuelMode(mode)
}

function campaignUsesDailyDuelSetup(campaign, operationDate) {
  const mode = campaign?.modeConfig?.format || campaign?.format || campaign?.competitionMode
  const phase = getCampaignPhase(campaign, operationDate)

  if (isPlayoffFinalMode(mode)) {
    return phase === 'playoff'
  }

  return campaignUsesRotatingDuel(campaign) && phase !== 'final'
}

function isCampaignFinalPhase(campaign, operationDate) {
  return getCampaignPhase(campaign, operationDate) === 'final'
}

function getCampaignPhase(campaign, operationDate) {
  const normalizedOperationDate = normalizeDate(operationDate)
  if (!normalizedOperationDate) return 'classification'

  const modeConfig = campaign?.modeConfig || {}
  const finalDays = modeConfig.finalDays || campaign?.finalDays || []
  const playoffDays = modeConfig.playoffDays || campaign?.playoffDays || []

  return determinePhase(normalizedOperationDate, {
    finalDays,
    playoffDays,
    hasFinalStage: modeConfig.hasFinalStage ?? campaign?.hasFinalStage ?? false,
    mode: modeConfig.format || campaign?.format || campaign?.competitionMode || 'individual',
  })
}

function buildDailyDuelKey(campaign, participantName, operationDate) {
  return [
    campaign?.id || '',
    operationDate || '',
    normalizeParticipantName(participantName),
  ].join('::')
}

function getDailyDuelOpponentValue({
  appData,
  campaign,
  participantName,
  operationDate,
  dailyDuelOpponents,
}) {
  if (!campaignUsesDailyDuelSetup(campaign, operationDate) || !participantName) return ''

  const draftValue = dailyDuelOpponents?.[buildDailyDuelKey(campaign, participantName, operationDate)]
  if (draftValue) return draftValue

  return getExistingDailyDuelOpponent({
    appData,
    campaign,
    participantName,
    operationDate,
  })
}

function getExistingDailyDuelOpponent({ appData, campaign, participantName, operationDate }) {
  const targetEventIds = new Set(resolveCampaignPickTargetEventIds(campaign, operationDate).map(String))
  if (targetEventIds.size === 0) return ''

  for (const event of getEventsFromAppData(appData)) {
    if (!targetEventIds.has(String(event?.id || ''))) continue
    const participant = (event?.participants || []).find((entry) =>
      matchParticipantName(entry?.name || entry?.index, participantName)
    )
    const opponent = participant?.rotatingDuelOpponent || participant?.duelOpponent || participant?.dailyDuelOpponent
    if (opponent) return String(opponent).trim()

    const inverseParticipant = (event?.participants || []).find((entry) => {
      const entryOpponent = entry?.rotatingDuelOpponent || entry?.duelOpponent || entry?.dailyDuelOpponent
      return entryOpponent && matchParticipantName(entryOpponent, participantName)
    })
    const inverseName = inverseParticipant?.name || inverseParticipant?.participant || inverseParticipant?.index
    if (inverseName) return String(inverseName).trim()
  }

  return ''
}

function getDailyDuelOpponentOptions({
  appData,
  campaign,
  participantName,
  participantPool,
  availableParticipants,
  operationDate,
}) {
  const groupId = String(campaign?.groupId || campaign?.group || '').trim()
  const mode = campaign?.modeConfig?.format || campaign?.format || campaign?.competitionMode
  const isPlayoffFinalDuel = isPlayoffFinalMode(mode) && getCampaignPhase(campaign, operationDate) === 'playoff'
  const candidates = new Map()
  const knownParticipants = new Map()

  const rememberParticipant = (participant) => {
    const name = getParticipantDisplayName(participant)
    const key = normalizeParticipantName(name)
    if (!key) return
    knownParticipants.set(key, {
      ...(knownParticipants.get(key) || {}),
      ...(typeof participant === 'object' && participant ? participant : {}),
      name,
    })
  }

  ;(Array.isArray(participantPool) ? participantPool : []).forEach(rememberParticipant)
  ;(Array.isArray(appData?.registry) ? appData.registry : []).forEach(rememberParticipant)
  ;(Array.isArray(availableParticipants) ? availableParticipants : []).forEach(rememberParticipant)

  const seedParticipants = getRotatingDuelSeedParticipants({
    appData,
    campaign,
    operationDate,
  })
  const hasSeedParticipants = seedParticipants.length > 0
  const addCandidate = (participant, options = {}) => {
    const name = getParticipantDisplayName(participant)
    if (!name || matchParticipantName(name, participantName)) return
    const key = normalizeParticipantName(name)
    if (!key || candidates.has(key)) return

    const mergedParticipant = {
      ...(knownParticipants.get(key) || {}),
      ...(typeof participant === 'object' && participant ? participant : {}),
      name,
    }

    if (!options.trustCampaignEnrollment && groupId && !participantMatchesDailyDuelGroup(mergedParticipant, campaign)) {
      return
    }

    candidates.set(key, mergedParticipant)
  }

  if (hasSeedParticipants) {
    seedParticipants.forEach((participant) => addCandidate(participant, { trustCampaignEnrollment: true }))
    ;(Array.isArray(availableParticipants) ? availableParticipants : []).forEach(addCandidate)
  } else if (Array.isArray(availableParticipants) && availableParticipants.length > 0) {
    availableParticipants.forEach(addCandidate)
  } else if (isPlayoffFinalDuel) {
    return []
  } else {
    ;(Array.isArray(participantPool) ? participantPool : []).forEach(addCandidate)
    ;(Array.isArray(appData?.registry) ? appData.registry : []).forEach(addCandidate)
  }

  return Array.from(candidates.values())
    .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'es'))
    .map((participant) => ({
      id: participant.name,
      label: participant.groupName ? `${participant.name} (${participant.groupName})` : participant.name,
    }))
}

function getRotatingDuelSeedParticipants({ appData, campaign, operationDate }) {
  const normalizedOperationDate = normalizeDate(operationDate)
  const firstActiveDate = getCampaignFirstActiveDate(campaign, appData)
  if (!campaignUsesRotatingDuel(campaign) || !normalizedOperationDate || !firstActiveDate) return []
  if (normalizedOperationDate <= firstActiveDate) return []

  const firstEventIds = resolveCampaignPickTargetEventIds(campaign, firstActiveDate)
  const participants = []
  const seen = new Set()
  const addParticipant = (participant) => {
    const name = getParticipantDisplayName(participant)
    const key = normalizeParticipantName(name)
    if (!key || seen.has(key)) return
    seen.add(key)
    participants.push({
      ...(typeof participant === 'object' && participant ? participant : {}),
      name,
    })
  }

  ;(Array.isArray(campaign?.registeredParticipants) ? campaign.registeredParticipants : []).forEach(addParticipant)

  firstEventIds.forEach((eventId) => {
    const event = getEventById(appData, eventId)
    ;(event?.participants || []).forEach(addParticipant)
  })

  return participants
}

function getParticipantDisplayName(participant) {
  if (typeof participant === 'string') return participant.trim()
  return String(participant?.name || participant?.participant || participant?.index || '').trim()
}

function participantMatchesDailyDuelGroup(participant, campaign) {
  const groupId = String(campaign?.groupId || campaign?.group || '').trim()
  if (!groupId) return true
  if (isParticipantInGroup(participant, groupId)) return true

  const participantLabels = [
    participant?.groupName,
    participant?.groupLabel,
    participant?.group,
  ].map(normalizeParticipantName).filter(Boolean)
  const campaignLabels = [
    campaign?.groupName,
    campaign?.groupLabel,
    groupId,
  ].map(normalizeParticipantName).filter(Boolean)

  return participantLabels.some((participantLabel) => campaignLabels.includes(participantLabel))
}

function buildParticipantPickPayload({
  index,
  name,
  picks,
  campaign,
  participantRecord,
  promoSelected,
  promoPartnersOverride,
  dailyDuelOpponent,
  dailyDuelDate,
  appData,
  participantPool,
}) {
  const habitualPartners = Array.isArray(promoPartnersOverride)
    ? promoPartnersOverride
    : getHabitualPromoPartners({ appData, participantPool, participantName: name })
  const promoPartners = uniqueParticipantNames(habitualPartners)
    .filter((partner) => !matchParticipantName(partner, name))
  const isPromo = Boolean(campaign?.promoEnabled && (promoSelected || participantRecord?.promo === true || promoPartners.length > 0))
  const promoMode = isPromo && promoPartners.length > 0 ? 'pair' : (isPromo ? 'individual' : '')
  const campaignMode = campaign?.modeConfig?.format || campaign?.format || campaign?.competitionMode

  const payload = {
    index,
    name,
    picks,
    promo: isPromo,
    promoPartners: isPromo ? promoPartners : [],
    promoMode,
  }

  if (campaignUsesDailyDuelSetup(campaign, dailyDuelDate) && dailyDuelOpponent) {
    payload.duelMode = isPlayoffFinalMode(campaignMode) ? 'playoff-final' : 'rotating-head-to-head'
    payload.duelOpponent = dailyDuelOpponent
    payload.rotatingDuelOpponent = dailyDuelOpponent
    payload.duelDate = dailyDuelDate || ''
    payload.rotatingDuelDate = dailyDuelDate || ''
  }

  return payload
}

function buildPickAuditMetadata({
  campaign,
  eventId,
  operationDate,
  appData,
  source,
  inputMode,
  role,
  reason,
}) {
  return {
    source,
    inputMode,
    role,
    reason,
    eventId,
    operationDate,
    campaignId: campaign?.id || '',
    campaignName: campaign?.name || '',
    campaignType: campaign?.type || campaign?.kind || '',
    groupId: campaign?.groupId || campaign?.group || '',
    groupName: resolveCampaignGroupName(campaign, appData),
  }
}

function getPickInputMode(parseResult, bulkText) {
  if (bulkText?.trim()) {
    return parseResult?.format ? `paste-${parseResult.format}` : 'paste-text'
  }
  return 'manual-form'
}

function resolveCampaignGroupName(campaign, appData) {
  const groupId = String(campaign?.groupId || campaign?.group || '').trim()
  const groups = [
    ...(Array.isArray(appData?.settings?.registryGroups) ? appData.settings.registryGroups : []),
    ...(Array.isArray(appData?.registryGroups) ? appData.registryGroups : []),
  ]
  const found = groups.find((group) => (
    String(group?.id || '').trim() === groupId ||
    matchParticipantName(group?.name, groupId)
  ))
  return found?.name || campaign?.groupName || campaign?.groupLabel || groupId
}

async function persistPromoParticipantIfNeeded(participantPayload, campaign, participantRecord) {
  if (!participantPayload?.promo) return
  try {
    await api.upsertRegistryParticipant({
      name: participantPayload.name,
      group: campaign?.groupId || participantRecord?.group,
      promo: true,
      ...(participantPayload.promoMode === 'individual'
        ? {}
        : { promoPartners: participantPayload.promoPartners || [] }),
    }, { light: true })
  } catch (error) {
    console.error('No se pudo persistir el estado promo del participante:', error)
  }
}

function uniqueParticipantNames(values) {
  const seen = new Set()
  return (values || [])
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .filter((value) => {
      const key = normalizeParticipantName(value)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}

function matchParticipantName(left, right) {
  return normalizeParticipantName(left) === normalizeParticipantName(right)
}

function normalizeParticipantName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}
