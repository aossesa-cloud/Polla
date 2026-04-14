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
    validatePromoRelation
  } = usePromoRelations(campaignId, groupId)

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [playIndividual, setPlayIndividual] = useState(false)

  const currentPartners = useMemo(() => {
    return getPromoPartners(participantName)
  }, [getPromoPartners, participantName])

  const currentPartner = currentPartners[0] || ''

  const availablePartners = useMemo(() => {
    return allParticipants.filter((participant) =>
      participant.name !== participantName &&
      participant.promo === true &&
      (!groupId || participant.group === groupId)
    )
  }, [allParticipants, participantName, groupId])

  const [selectedPartner, setSelectedPartner] = useState(currentPartner)

  useEffect(() => {
    setSelectedPartner(currentPartner)
    setPlayIndividual(false)
    setMessage(null)
  }, [currentPartner, participantName])

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
        setMessage({
          tipo: 'ok',
          texto: `${participantName} jugará individual y sin dupla promo`
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

  return (
    <div className={styles.promoSection}>
      <div className={styles.promoHeader}>
        <span className={styles.promoIcon}>💑</span>
        <div className={styles.promoHeaderContent}>
          <h4 className={styles.promoTitle}>Promo 2x para {participantName}</h4>
          <p className={styles.promoSubtitle}>
            Elige una sola dupla promo. Con una selección queda asociado para ambos participantes.
          </p>
          {campaignPromoPrice ? (
            <span className={styles.promoPrice}>
              Valor promo: ${Number(campaignPromoPrice).toLocaleString('es-CL')} ({Math.round(Number(campaignPromoPrice) / 2).toLocaleString('es-CL')} por participante)
            </span>
          ) : null}
        </div>
      </div>

      {message && (
        <div className={`${styles.message} ${styles[message.tipo]}`}>
          {message.texto}
        </div>
      )}

      {currentPartner && !playIndividual && (
        <div className={styles.promoSummary}>
          <strong>Dupla actual:</strong>
          <span className={styles.partnerList}>{participantName} + {currentPartner}</span>
        </div>
      )}

      <div className={styles.promoOption}>
        <button
          type="button"
          className={`${styles.promoOptionBtn} ${playIndividual ? styles.promoOptionSelected : ''}`}
          onClick={handlePlayIndividual}
          disabled={saving}
        >
          <span className={styles.promoOptionIcon}>👤</span>
          <div className={styles.promoOptionContent}>
            <strong>Jugar Individual</strong>
            <span className={styles.promoOptionDesc}>Participar sin promo (modo normal)</span>
          </div>
          {playIndividual && <span className={styles.promoOptionCheck}>✓</span>}
        </button>
      </div>

      {!playIndividual && (
        <div className={styles.partnersList}>
          <p className={styles.partnersLabel}>
            Participantes con Promo 2x disponibles ({availablePartners.length}):
          </p>

          {availablePartners.length === 0 ? (
            <div className={styles.promoWarning}>
              <span className={styles.promoIcon}>⚠️</span>
              <div>
                <p className={styles.promoMessage}>No hay otros participantes con Promo 2x activa en este grupo</p>
                {groupId && <p className={styles.promoHint}>Grupo actual: {groupId}</p>}
              </div>
            </div>
          ) : (
            <div className={styles.partnersGrid}>
              {availablePartners.map((partner) => {
                const isSelected = selectedPartner === partner.name
                const isCurrentPartner = currentPartner === partner.name

                return (
                  <button
                    key={partner.name}
                    type="button"
                    className={`${styles.partnerChip} ${isSelected ? styles.partnerChipSelected : ''}`}
                    onClick={() => togglePartner(partner.name)}
                    disabled={saving}
                  >
                    <span className={styles.partnerCheck}>
                      {isSelected ? '✓' : isCurrentPartner ? '●' : '○'}
                    </span>
                    <span className={styles.partnerName}>{partner.name}</span>
                    {partner.group && <span className={styles.partnerGroup}>{partner.group}</span>}
                    {isCurrentPartner && !isSelected && (
                      <span className={styles.partnerExisting}>dupla actual</span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      <div className={styles.promoActions}>
        <span className={styles.promoHint}>
          {saving ? 'Guardando asociación promo...' : 'La selección se guarda automáticamente'}
        </span>
        {hasPromoPartners(participantName) && (
          <button className={styles.promoClearBtn} onClick={handleClear}>
            🗑️ Limpiar dupla
          </button>
        )}
      </div>
    </div>
  )
}
