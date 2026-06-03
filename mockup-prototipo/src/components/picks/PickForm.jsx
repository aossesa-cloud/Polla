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
  loadRelations,
  persistParticipantRelation,
} from '../../hooks/useParticipantRelations'
import { useCampaigns } from '../../hooks/useCampaigns'
import {
  buildCampaignEventMeta,
  findLegacyCampaignContainerEvent,
  resolveCampaignPickTargetEventIds,
} from '../../services/campaignEventTargets'
import PromoPartnersSelector from './PromoPartnersSelector'
import PickRelationSetup from './PickRelationSetup'
import { parsePicks, validatePicks, formatPicksForAPI } from '../../utils/pickParser'
import styles from '../PickEntry.module.css'

const PROMO_RELATIONS_STORAGE_KEY = 'pollas-promo-relations'

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
  const { appData } = useAppStore()
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
  const [relationVersion, setRelationVersion] = useState(0)
  const [promoSelections, setPromoSelections] = useState({})

  const raceCount = numCarreras || 12
  const { canParticipantEnterCampaignOnDate, validateParticipant } = useCampaignParticipants()
  const hasMultiStud = picks2.length > 0
  const migratedRelationCampaignsRef = React.useRef(new Set())
  const participantPool = useMemo(() => {
    const pool = Array.isArray(allParticipants) && allParticipants.length > 0
      ? allParticipants
      : appData?.registry || []
    return Array.isArray(pool) ? pool : []
  }, [allParticipants, appData])
  const savedRelations = useMemo(() => loadRelations(), [relationVersion])
  const promoRelationsSnapshot = useMemo(() => loadPromoRelationsSnapshot(), [relationVersion])
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
      relationsSnapshot: promoRelationsSnapshot,
      appData,
      participantPool,
      participantName: participant1,
    })
  ), [appData, participant1, participantPool, promoRelationsSnapshot])
  const participant2HabitualPromoPartners = useMemo(() => (
    getHabitualPromoPartners({
      relationsSnapshot: promoRelationsSnapshot,
      appData,
      participantPool,
      participantName: participant2,
    })
  ), [appData, participant2, participantPool, promoRelationsSnapshot])
  const participant1PromoSelected = getPromoSelection(
    promoSelections,
    participant1,
    participant1Record,
    participant1HabitualPromoPartners
  )
  const participant2PromoSelected = getPromoSelection(
    promoSelections,
    participant2,
    participant2Record,
    participant2HabitualPromoPartners
  )
  const promoParticipantPool = useMemo(() => (
    participantPool.map((participant) => {
      if (participant1 && matchParticipantName(participant.name, participant1)) {
        return { ...participant, promo: participant1PromoSelected }
      }
      if (participant2 && matchParticipantName(participant.name, participant2)) {
        return { ...participant, promo: participant2PromoSelected }
      }
      return participant
    })
  ), [participant1, participant1PromoSelected, participant2, participant2PromoSelected, participantPool])

  const parseResult = useMemo(() => {
    if (!bulkText.trim()) return null
    return parsePicks(bulkText, raceCount)
  }, [bulkText, raceCount])

  const relationRequirements = useMemo(() => {
    const selectedParticipants = [
      participant1 ? { name: participant1, key: 'participant1' } : null,
      hasMultiStud && participant2 ? { name: participant2, key: 'participant2' } : null,
    ].filter(Boolean)

    if (!campaigns?.length || selectedParticipants.length === 0) return []

    return campaigns.flatMap((campaign) => {
      if (!campaignNeedsRelationSetup(campaign)) return []

      return selectedParticipants
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
            options: getRelationOptionsForCampaign(campaign, appData, name, participantPool),
          }
        })
    })
  }, [appData, campaigns, hasMultiStud, participant1, participant2, participantPool, savedRelations])

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
    persistParticipantRelation(campaign, participantName, relationType, value)
    setRelationVersion((current) => current + 1)
    setMensaje({
      tipo: 'ok',
      texto: `Relación guardada para "${participantName}" en "${campaign.name}"`,
    })
  }, [])

  const handlePersistedRelationSave = useCallback(async (campaign, participantName, relationType, value) => {
    persistParticipantRelation(campaign, participantName, relationType, value)
    const nextRelations = loadRelations()

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
        texto: `Se guardÃ³ la relaciÃ³n local, pero fallÃ³ la persistencia en campaÃ±a: ${error.message}`,
      })
      return
    }

    setRelationVersion((current) => current + 1)
    setMensaje({
      tipo: 'ok',
      texto: `RelaciÃ³n guardada para "${participantName}" en "${campaign.name}"`,
    })
  }, [participantPool, saveCampaign])

  const handlePromoSelectionChange = useCallback((participantName, checked) => {
    if (!participantName) return
    setPromoSelections((current) => ({
      ...current,
      [participantName]: checked,
    }))
  }, [])

  const handlePromoPartnersChange = useCallback((participantName) => {
    if (!participantName) return
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
      const promoRelationsSnapshot = loadPromoRelationsSnapshot()

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

          await api.upsertEventMeta(eventId, buildCampaignEventMeta(campaign, operationDate))

          const existingEvent = getEventById(appData, eventId)
          const legacyEvent = findLegacyCampaignContainerEvent(appData, campaign)

          if ((!existingEvent || !existingEvent.participants?.length) && legacyEvent?.participants?.length) {
            await api.upsertEventMeta(eventId, buildCampaignEventMeta(campaign, operationDate))
            for (const legacyParticipant of legacyEvent.participants) {
              await api.savePickForEvent(eventId, legacyParticipant)
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
            relationsSnapshot: promoRelationsSnapshot,
            appData,
            participantPool,
          })
          await persistPromoParticipantIfNeeded(participantPayload1, campaign, participant1Record)

          const result1 = await api.savePickForEvent(eventId, participantPayload1)

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
                relationsSnapshot: promoRelationsSnapshot,
                appData,
                participantPool,
              })
              await persistPromoParticipantIfNeeded(participantPayload2, campaign, participant2Record)

              const result2 = await api.savePickForEvent(eventId, participantPayload2)

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
    participant1PromoSelected,
    participant2Record,
    participant2PromoSelected,
    picks,
    picks2,
    canParticipantEnterCampaignOnDate,
    hasMultiStud,
    raceCount,
    onSuccess,
    relationRequirements.length,
    validateParticipant,
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

      <div className={styles.section}>
        <label className={styles.sectionLabel}>
          Participante{hasMultiStud ? ' 1' : ''}
          {availableParticipants.length > 0 && (
            <span className={styles.participantCount}>
              {' '}({availableParticipants.length} disponibles)
            </span>
          )}
        </label>
        <select
          className={styles.select}
          value={participant1}
          onChange={(event) => onSelectParticipant1(event.target.value)}
        >
          <option value="">Seleccionar participante...</option>
          {availableParticipants.map((participant) => (
            <option key={participant.name} value={participant.name}>{participant.name}</option>
          ))}
        </select>

        {hasMultiStud && (
          <div className={styles.participant2Section}>
            <label className={styles.sectionLabel}>
              Participante 2
              <span className={styles.multiStudWarning}> (selecciona el segundo stud)</span>
            </label>
            <select
              className={`${styles.select} ${styles.selectStud2}`}
              value={participant2}
              onChange={(event) => onSelectParticipant2(event.target.value)}
            >
              <option value="">Seleccionar segundo participante...</option>
              {availableParticipants
                .filter((participant) => participant.name !== participant1)
                .map((participant) => (
                  <option key={participant.name} value={participant.name}>{participant.name}</option>
                ))}
            </select>
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
                onPartnersChange={() => handlePromoPartnersChange(participant1)}
              />
            )}
          </div>
        )}

        {hasPromoEnabled && hasMultiStud && participant2 && (
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
                onPartnersChange={() => handlePromoPartnersChange(participant2)}
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
              className={`${styles.saveBtnInline} ${(!campaigns || campaigns.length === 0 || !participant1 || picks.length === 0 || (hasMultiStud && !participant2) || relationRequirements.length > 0) ? styles.disabled : ''}`}
              onClick={handleGuardar}
              disabled={guardando || !campaigns || campaigns.length === 0 || !participant1 || picks.length === 0 || (hasMultiStud && !participant2) || relationRequirements.length > 0}
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

function getEventById(appData, eventId) {
  const events = Array.isArray(appData?.events) ? appData.events : Object.values(appData?.events || {})
  return events.find((event) => String(event?.id || '') === String(eventId)) || null
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

function loadPromoRelationsSnapshot() {
  try {
    const raw = localStorage.getItem(PROMO_RELATIONS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function getStoredPromoPartnerState(relationsSnapshot, campaignId, participantName) {
  if (!campaignId || !participantName) return { partners: [], individualOverride: false }
  const campaignRelations = relationsSnapshot?.[campaignId] || {}
  const directRelation = campaignRelations?.[participantName]
  if (directRelation?.mode === 'individual') {
    return { partners: [], individualOverride: true }
  }

  const direct = directRelation?.partners || []
  if (direct.length > 0) return { partners: direct, individualOverride: false }

  const reverse = Object.entries(campaignRelations).find(([, relation]) =>
    relation?.mode !== 'individual' &&
    (relation?.partners || []).some((partner) => matchParticipantName(partner, participantName))
  )
  return reverse ? { partners: [reverse[0]], individualOverride: false } : { partners: [], individualOverride: false }
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

function getStoredHabitualPromoPartners(relationsSnapshot, participantName) {
  const partners = []
  Object.values(relationsSnapshot || {}).forEach((campaignRelations) => {
    Object.entries(campaignRelations || {}).forEach(([owner, relation]) => {
      if (relation?.mode === 'individual') return

      const relationPartners = Array.isArray(relation?.partners) ? relation.partners : []
      if (matchParticipantName(owner, participantName)) {
        partners.push(...relationPartners)
      }

      if (relationPartners.some((partner) => matchParticipantName(partner, participantName))) {
        partners.push(owner)
      }
    })
  })

  return uniqueParticipantNames(partners)
    .filter((partner) => !matchParticipantName(partner, participantName))
}

function getHabitualPromoPartners({ relationsSnapshot, appData, participantPool, participantName }) {
  return uniqueParticipantNames([
    ...getParticipantPromoPartners(participantPool, participantName),
    ...getParticipantPromoPartners(getEventParticipants(appData), participantName),
    ...getStoredHabitualPromoPartners(relationsSnapshot, participantName),
  ]).filter((partner) => !matchParticipantName(partner, participantName))
}

function buildParticipantPickPayload({
  index,
  name,
  picks,
  campaign,
  participantRecord,
  promoSelected,
  relationsSnapshot,
  appData,
  participantPool,
}) {
  const storedState = getStoredPromoPartnerState(relationsSnapshot, campaign?.id, name)
  const habitualPartners = storedState.individualOverride
    ? []
    : getHabitualPromoPartners({ relationsSnapshot, appData, participantPool, participantName: name })
  const promoPartners = uniqueParticipantNames([...storedState.partners, ...habitualPartners])
    .filter((partner) => !matchParticipantName(partner, name))
  const isPromo = Boolean(campaign?.promoEnabled && (promoSelected || participantRecord?.promo === true || promoPartners.length > 0))
  const promoMode = storedState.individualOverride
    ? 'individual'
    : (isPromo && promoPartners.length > 0 ? 'pair' : (isPromo ? 'individual' : ''))

  return {
    index,
    name,
    picks,
    promo: isPromo,
    promoPartners: isPromo ? promoPartners : [],
    promoMode,
  }
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
    })
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
