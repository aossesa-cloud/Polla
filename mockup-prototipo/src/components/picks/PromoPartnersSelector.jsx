import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { usePromoRelations } from '../../hooks/usePromoRelations'
import styles from '../PickEntry.module.css'

export default function PromoPartnersSelector({
  campaignId,
  groupId,
  participantName,
  campaignPromoEnabled,
  campaignPromoPrice,
  onPartnersChange,
  allParticipants = []
}) {
  const {
    getPromoPartners,
    savePromoRelation,
    removePromoRelation,
    hasPromoPartners,
    validatePromoRelation,
    campaignRelations,
  } = usePromoRelations(campaignId, groupId)

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [playIndividual, setPlayIndividual] = useState(false)
  const [showPartnerPicker, setShowPartnerPicker] = useState(false)

  const currentPartners = useMemo(() => {
    return getPromoPartners(participantName)
  }, [getPromoPartners, participantName])

  const currentPartner = currentPartners[0] || ''

  const assignedPromoNames = useMemo(() => {
    const assigned = new Set()
    Object.entries(campaignRelations || {}).forEach(([owner, relation]) => {
      const partners = relation?.partners || []
      if (partners.length === 0) return

      assigned.add(normalizePartnerName(owner))
      partners.forEach((partner) => assigned.add(normalizePartnerName(partner)))
    })
    return assigned
  }, [campaignRelations])

  const availablePartners = useMemo(() => {
    return allParticipants.filter((participant) =>
      participant.name !== participantName &&
      participant.promo === true &&
      (!groupId || participant.group === groupId) &&
      !assignedPromoNames.has(normalizePartnerName(participant.name))
    )
  }, [allParticipants, assignedPromoNames, participantName, groupId])

  const [selectedPartner, setSelectedPartner] = useState(currentPartner)

  useEffect(() => {
    setSelectedPartner(currentPartner)
    setShowPartnerPicker(!currentPartner)
  }, [currentPartner])

  useEffect(() => {
    setPlayIndividual(false)
    setMessage(null)
  }, [participantName])

  const saveSelection = useCallback(async (partnerName) => {
    if (!participantName) {
      setMessage({ tipo: 'error', texto: 'Selecciona un participante primero' })
      return
    }

    setSaving(true)
    try {
      if (!partnerName) {
        await savePromoRelation(participantName, [])
        setSelectedPartner('')
        setPlayIndividual(true)
        setShowPartnerPicker(false)
        setMessage({
          tipo: 'ok',
          texto: `${participantName} jugara individual y sin dupla promo`
        })
        onPartnersChange?.([])
        return
      }

      const partners = [partnerName]
      const validation = validatePromoRelation(participantName, partners)
      if (!validation.isValid) {
        setMessage({ tipo: 'error', texto: validation.errors.join(', ') })
        return
      }

      await savePromoRelation(participantName, partners)
      setSelectedPartner(partnerName)
      setPlayIndividual(false)
      setShowPartnerPicker(false)
      setMessage({
        tipo: 'ok',
        texto: `Dupla promo guardada: ${participantName} + ${partnerName}`
      })
      onPartnersChange?.(partners)
    } catch (err) {
      setMessage({ tipo: 'error', texto: `Error: ${err.message}` })
    } finally {
      setSaving(false)
    }
  }, [onPartnersChange, participantName, savePromoRelation, validatePromoRelation])

  const togglePartner = useCallback(async (partnerName) => {
    const nextPartner = selectedPartner === partnerName ? '' : partnerName
    await saveSelection(nextPartner)
  }, [saveSelection, selectedPartner])

  const handlePlayIndividual = useCallback(async () => {
    await saveSelection('')
  }, [saveSelection])

  const handleClear = useCallback(async () => {
    setSaving(true)
    try {
      await removePromoRelation(participantName)
      setSelectedPartner('')
      setPlayIndividual(false)
      setShowPartnerPicker(true)
      setMessage({ tipo: 'ok', texto: 'Dupla promo eliminada' })
      onPartnersChange?.([])
    } catch (err) {
      setMessage({ tipo: 'error', texto: `Error: ${err.message}` })
    } finally {
      setSaving(false)
    }
  }, [onPartnersChange, participantName, removePromoRelation])

  if (!campaignPromoEnabled || !participantName) {
    return null
  }

  const hasCurrentPair = Boolean(currentPartner && !playIndividual)
  const showAvailablePartners = !playIndividual && (!hasCurrentPair || showPartnerPicker)

  return (
    <div className={styles.promoSection}>
      <div className={styles.promoHeaderCompact}>
        <div className={styles.promoHeading}>
          <span className={styles.promoIcon}>2x</span>
          <h4 className={styles.promoTitle}>Promo 2x para {participantName}</h4>
        </div>
        {campaignPromoPrice ? (
          <span className={styles.promoPrice}>
            ${Number(campaignPromoPrice).toLocaleString('es-CL')} total / {Math.round(Number(campaignPromoPrice) / 2).toLocaleString('es-CL')} c/u
          </span>
        ) : null}
      </div>

      {message && (
        <div className={`${styles.message} ${styles[message.tipo]}`}>
          {message.texto}
        </div>
      )}

      {hasCurrentPair && (
        <div className={styles.promoSummaryCompact}>
          <div>
            <span className={styles.promoSummaryLabel}>Dupla actual</span>
            <strong className={styles.partnerList}>{participantName} + {currentPartner}</strong>
          </div>
          <div className={styles.promoSummaryActions}>
            <button
              type="button"
              className={styles.promoTinyBtn}
              onClick={() => setShowPartnerPicker((value) => !value)}
              disabled={saving}
            >
              {showPartnerPicker ? 'Ocultar' : 'Cambiar dupla'}
            </button>
            <button
              type="button"
              className={styles.promoTinyBtn}
              onClick={handleClear}
              disabled={saving}
            >
              Limpiar
            </button>
          </div>
        </div>
      )}

      {!hasCurrentPair && (
        <div className={styles.promoOption}>
          <button
            type="button"
            className={`${styles.promoOptionBtn} ${playIndividual ? styles.promoOptionSelected : ''}`}
            onClick={handlePlayIndividual}
            disabled={saving}
          >
            <span className={styles.promoOptionIcon}>1</span>
            <div className={styles.promoOptionContent}>
              <strong>Jugar individual</strong>
              <span className={styles.promoOptionDesc}>Sin dupla promo</span>
            </div>
            {playIndividual && <span className={styles.promoOptionCheck}>OK</span>}
          </button>
        </div>
      )}

      {showAvailablePartners && (
        <div className={styles.partnersList}>
          <p className={styles.partnersLabel}>
            Participantes libres para dupla ({availablePartners.length})
          </p>

          {availablePartners.length === 0 ? (
            <div className={styles.promoWarning}>
              <span className={styles.promoIcon}>!</span>
              <div>
                <p className={styles.promoMessage}>No quedan participantes libres con Promo 2x en este grupo</p>
                {groupId && <p className={styles.promoHint}>Grupo actual: {groupId}</p>}
              </div>
            </div>
          ) : (
            <div className={styles.partnersGrid}>
              {availablePartners.map((partner) => {
                const isSelected = selectedPartner === partner.name

                return (
                  <button
                    key={partner.name}
                    type="button"
                    className={`${styles.partnerChip} ${isSelected ? styles.partnerChipSelected : ''}`}
                    onClick={() => togglePartner(partner.name)}
                    disabled={saving}
                  >
                    <span className={styles.partnerCheck}>
                      {isSelected ? '✓' : ''}
                    </span>
                    <span className={styles.partnerName}>{partner.name}</span>
                    {partner.group && <span className={styles.partnerGroup}>{partner.group}</span>}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      <div className={styles.promoActions}>
        <span className={styles.promoHint}>
          {saving ? 'Guardando dupla promo...' : 'Se guarda automaticamente'}
        </span>
        {hasPromoPartners(participantName) && !hasCurrentPair && (
          <button className={styles.promoClearBtn} onClick={handleClear}>
            Limpiar dupla
          </button>
        )}
      </div>
    </div>
  )
}

function normalizePartnerName(value) {
  return String(value || '').trim().toLowerCase()
}
