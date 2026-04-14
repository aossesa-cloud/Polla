/**
 * PickForm.jsx - CORREGIDO
 *
 * Formulario de ingreso de pronósticos con parsing automático inteligente.
 *
 * FIXES:
 * 1. Eliminado input manual duplicado de "Stud / Participante"
 * 2. Selector de participante integrado (viene de PickEntry)
 * 3. Multi-stud muestra selector para Participante 2
 * 4. "Pareja" SOLO si la campaña es modo pairs
 */

import React, { useState, useCallback, useMemo } from 'react'
import api from '../../api'
import { useCampaignParticipants } from '../../hooks/useCampaignParticipants'
import PromoPartnersSelector from './PromoPartnersSelector'
import { parsePicks, validatePicks, formatPicksForAPI } from '../../utils/pickParser'
import styles from '../PickEntry.module.css'

export default function PickForm({
  campaigns,
  numCarreras,
  availableParticipants,
  allParticipants = [],  // Lista completa del registry
  hasPairsMode,
  participant1,
  participant2,
  onSelectParticipant1,
  onSelectParticipant2,
  onSuccess
}) {
  // Verificar si alguna campaña tiene promo habilitada
  const hasPromoEnabled = useMemo(() => {
    return campaigns?.some(c => c.promoEnabled)
  }, [campaigns])

  // Obtener groupId de la primera campaña con promo
  const promoGroupId = useMemo(() => {
    const promoCampaign = campaigns?.find(c => c.promoEnabled)
    return promoCampaign?.groupId || null
  }, [campaigns])

  // Obtener promoPrice
  const promoPrice = useMemo(() => {
    const promoCampaign = campaigns?.find(c => c.promoEnabled)
    return promoCampaign?.promoPrice || 0
  }, [campaigns])

  // Obtener campaignId para promo relations
  const campaignId = useMemo(() => {
    return campaigns?.[0]?.id || ''
  }, [campaigns])
  const [picks, setPicks] = useState([]) // Stud 1
  const [picks2, setPicks2] = useState([]) // Stud 2 (si aplica)
  const [bulkText, setBulkText] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  const raceCount = numCarreras || 12

  // Hook para validación de participantes duplicados
  const { validateParticipant } = useCampaignParticipants()

  // Detectar si hay multi-stud
  const hasMultiStud = picks2.length > 0

  // ============================================
  // PARSING AUTOMÁTICO EN TIEMPO REAL
  // ============================================
  const parseResult = useMemo(() => {
    if (!bulkText.trim()) return null
    return parsePicks(bulkText, raceCount)
  }, [bulkText, raceCount])

  // Actualizar picks cuando cambia el parse result
  React.useEffect(() => {
    if (parseResult && parseResult.isValid) {
      if (parseResult.studCount === 2) {
        setPicks(parseResult.studs[0] || [])
        setPicks2(parseResult.studs[1] || [])
        setMensaje({
          tipo: 'info',
          texto: `⚠️ Se detectaron múltiples pronósticos. Selecciona el segundo participante.`
        })
      } else {
        setPicks(parseResult.studs[0] || [])
        setPicks2([])
        setMensaje({
          tipo: 'ok',
          texto: `✅ Formato detectado: ${parseResult.format.toUpperCase()} → ${parseResult.raceCount} carreras`
        })
      }
    } else if (!bulkText.trim()) {
      setPicks([])
      setPicks2([])
      setMensaje(null)
    }
  }, [parseResult, raceCount])

  // ============================================
  // HANDLERS
  // ============================================
  const handleBulkChange = useCallback((e) => {
    setBulkText(e.target.value)
  }, [])

  const handleClear = useCallback(() => {
    setBulkText('')
    setPicks([])
    setPicks2([])
    setMensaje(null)
  }, [])

  // Guardar picks en múltiples campañas
  const handleGuardar = useCallback(async () => {
    if (!campaigns || campaigns.length === 0 || picks.length === 0) {
      setMensaje({ tipo: 'error', texto: '⚠️ Selecciona campañas y completa al menos un pick' })
      return
    }

    // Validar participante 1
    if (!participant1) {
      setMensaje({ tipo: 'error', texto: '⚠️ Selecciona el participante' })
      return
    }

    // Validar participante 2 si hay multi-stud
    if (hasMultiStud && !participant2) {
      setMensaje({ tipo: 'error', texto: '⚠️ Se detectaron 2 studs. Selecciona el segundo participante.' })
      return
    }

    // Validar picks
    const validation = validatePicks(picks, { maxRace: raceCount })
    if (!validation.isValid) {
      setMensaje({ tipo: 'error', texto: `❌ Errores: ${validation.errors.join(', ')}` })
      return
    }

    if (hasMultiStud && picks2.length > 0) {
      const validation2 = validatePicks(picks2, { maxRace: raceCount })
      if (!validation2.isValid) {
        setMensaje({ tipo: 'error', texto: `❌ Errores Stud B: ${validation2.errors.join(', ')}` })
        return
      }
    }

    // Validar duplicados
    const eventIds = campaigns.map(c => c.eventId || c.eventIds?.[0] || `campaign-${c.id}`)
    const participantValidation1 = validateParticipant(participant1, eventIds)
    
    if (!participantValidation1.isValid) {
      setMensaje({ tipo: 'error', texto: `❌ ${participantValidation1.error}` })
      return
    }

    if (hasMultiStud && participant2) {
      const participantValidation2 = validateParticipant(participant2, eventIds)
      if (!participantValidation2.isValid) {
        setMensaje({ tipo: 'error', texto: `❌ ${participantValidation2.error}` })
        return
      }
    }

    setGuardando(true)
    try {
      let successCount = 0
      let errorMessages = []

      for (const campaign of campaigns) {
        const eventId = campaign.eventId || campaign.eventIds?.[0] || `campaign-${campaign.id}`
        
        try {
          // Guardar stud 1 - index único basado en nombre
          const index1 = participant1.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 10000
          const result1 = await api.savePickForEvent(eventId, {
            index: index1,
            name: participant1,
            picks: formatPicksForAPI(picks)
          })

          if (result1?.error?.includes('ya existe') || result1?.error?.includes('duplicado')) {
            errorMessages.push(`"${participant1}" ya existe en "${campaign.name}"`)
            continue
          }

          successCount++

          // Guardar stud 2 si existe - index único basado en nombre
          if (hasMultiStud && picks2.length > 0 && participant2) {
            const index2 = (participant2.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 10000) + 10000
            const result2 = await api.savePickForEvent(eventId, {
              index: index2,
              name: participant2,
              picks: formatPicksForAPI(picks2)
            })

            if (result2?.error?.includes('ya existe') || result2?.error?.includes('duplicado')) {
              errorMessages.push(`"${participant2}" ya existe en "${campaign.name}"`)
            } else {
              successCount++
            }
          }
        } catch (err) {
          if (err.message.includes('ya existe') || err.message.includes('duplicado')) {
            errorMessages.push(`"${participant1}" ya está registrado en "${campaign.name}"`)
          } else {
            errorMessages.push(`Error en "${campaign.name}": ${err.message}`)
          }
        }
      }

      if (errorMessages.length > 0) {
        if (successCount > 0) {
          setMensaje({
            tipo: 'info',
            texto: `⚠️ Parcial: ${successCount} guardados. Errores: ${errorMessages.join('; ')}`
          })
        } else {
          setMensaje({ tipo: 'error', texto: `❌ ${errorMessages.join('; ')}` })
        }
      } else {
        const studCount = hasMultiStud ? '2 studs' : '1 stud'
        setMensaje({
          tipo: 'ok',
          texto: `✅ Pronóstico guardado en ${campaigns.length} campaña${campaigns.length > 1 ? 's' : ''} (${studCount})`
        })

        setBulkText('')
        setPicks([])
        setPicks2([])
        onSuccess?.()
      }
    } catch (err) {
      setMensaje({ tipo: 'error', texto: `❌ Error: ${err.message}` })
    } finally {
      setGuardando(false)
    }
  }, [campaigns, participant1, participant2, picks, picks2, hasMultiStud, raceCount, onSuccess, validateParticipant])

  const handlePickChange = useCallback((carrera, valor, studNum = 1) => {
    if (studNum === 2) {
      setPicks2(prev => {
        const newPicks = [...prev]
        newPicks[carrera - 1] = valor
        return newPicks
      })
    } else {
      setPicks(prev => {
        const newPicks = [...prev]
        newPicks[carrera - 1] = valor
        return newPicks
      })
    }
  }, [])

  // ============================================
  // RENDER
  // ============================================
  const completedCount = picks.filter(p => p).length
  const completedCount2 = picks2.filter(p => p).length

  return (
    <div className={styles.pickForm}>
      {/* Mensaje de estado */}
      {mensaje && (
        <div className={`${styles.message} ${styles[mensaje.tipo]}`}>
          {mensaje.texto}
        </div>
      )}

      {/* SELECTOR DE PARTICIPANTE(S) */}
      <div className={styles.section}>
        {/* Participante 1 */}
        <label className={styles.sectionLabel}>
          👤 Participante{hasMultiStud ? ' 1' : ''}
          {availableParticipants.length > 0 && (
            <span className={styles.participantCount}>
              {' '}({availableParticipants.length} disponibles)
            </span>
          )}
        </label>
        <select
          className={styles.select}
          value={participant1}
          onChange={e => onSelectParticipant1(e.target.value)}
        >
          <option value="">Seleccionar participante...</option>
          {availableParticipants.map(r => (
            <option key={r.name} value={r.name}>{r.name}</option>
          ))}
        </select>

        {/* Participante 2 (SOLO si multi-stud detectado) */}
        {hasMultiStud && (
          <div className={styles.participant2Section}>
            <label className={styles.sectionLabel}>
              👤 Participante 2
              <span className={styles.multiStudWarning}>
                {' '}(⚠️ Selecciona el segundo stud)
              </span>
            </label>
            <select
              className={`${styles.select} ${styles.selectStud2}`}
              value={participant2}
              onChange={e => onSelectParticipant2(e.target.value)}
            >
              <option value="">Seleccionar segundo participante...</option>
              {availableParticipants
                .filter(r => r.name !== participant1) // Excluir el ya seleccionado
                .map(r => (
                  <option key={r.name} value={r.name}>{r.name}</option>
                ))}
            </select>
          </div>
        )}

        {/* Setup de pareja (SOLO si la campaña es modo pairs) */}
        {hasPairsMode && participant1 && (
          <div className={styles.pairsSetup}>
            <label className={styles.sectionLabel}>
              💑 ¿Quién es tu pareja?
            </label>
            <select
              className={styles.select}
              value={participant1} // TODO: implementar lógica de pareja real
            >
              <option value="">Seleccionar pareja...</option>
              {availableParticipants
                .filter(r => r.name !== participant1)
                .map(r => (
                  <option key={r.name} value={r.name}>{r.name}</option>
                ))}
            </select>
          </div>
        )}

        {/* PROMO 2X - Selector de partners (SOLO si campaña y participante tienen promo) */}
        {hasPromoEnabled && participant1 && (() => {
          // Verificar si el participante tiene promo activada (usar allParticipants, no availableParticipants)
          console.log('[PickForm] === PROMO DEBUG ===')
          console.log('[PickForm] hasPromoEnabled:', hasPromoEnabled)
          console.log('[PickForm] participant1:', participant1)
          console.log('[PickForm] allParticipants:', allParticipants)
          
          const participantData = allParticipants.find(p => p.name === participant1)
          console.log('[PickForm] Found participant data:', participantData)
          
          const participantHasPromo = participantData?.promo === true
          console.log('[PickForm] participantHasPromo:', participantHasPromo)
          console.log('[PickForm] participantData?.promo:', participantData?.promo)
          
          // Log which participants DO have promo enabled
          const participantsWithPromo = allParticipants.filter(p => p.promo === true)
          console.log('[PickForm] Participants WITH promo enabled:', participantsWithPromo.map(p => p.name))
          console.log('[PickForm] ======================================')
          
          if (!participantHasPromo) {
            console.log('[PickForm] NOT showing promo selector - participant does not have promo enabled')
            return null
          }
          
          console.log('[PickForm] SHOWING promo selector')
          return (
            <PromoPartnersSelector
              campaignId={campaignId}
              groupId={promoGroupId}
              participantName={participant1}
              campaignPromoEnabled={hasPromoEnabled}
              campaignPromoPrice={promoPrice}
              allParticipants={allParticipants}
              onPartnersChange={(partners) => {
                console.log('Promo partners actualizados:', partners)
              }}
            />
          )
        })()}
      </div>

      {/* Input automático */}
      <div className={styles.section}>
        <label className={styles.sectionLabel}>
          📋 Ingreso Automático
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
              🗑️ Limpiar
            </button>
            <span className={styles.parseInfo}>
              {parseResult?.studCount === 2
                ? `2 studs detectados · ${parseResult.raceCount} carreras`
                : `${completedCount}/${raceCount} carreras parseadas`
              }
            </span>
            <button
              className={`${styles.saveBtnInline} ${(!campaigns || campaigns.length === 0 || !participant1 || picks.length === 0 || (hasMultiStud && !participant2)) ? styles.disabled : ''}`}
              onClick={handleGuardar}
              disabled={guardando || !campaigns || campaigns.length === 0 || !participant1 || picks.length === 0 || (hasMultiStud && !participant2)}
            >
              {guardando ? '⏳ Guardando...' : `💾 Guardar (${picks.filter(p => p).length} picks)`}
            </button>
          </div>
        )}
      </div>

      {/* Picks Grid - Stud 1 */}
      {picks.length > 0 && (
        <div className={styles.picksSection}>
          <h3 className={styles.picksTitle}>
            🎯 {hasMultiStud ? 'Stud A' : 'Pronósticos'}: {completedCount}/{raceCount}
          </h3>
          <div className={`${styles.picksGrid} ${hasMultiStud ? styles.picksGridDual : ''}`}>
            {Array.from({ length: Math.max(raceCount, picks.length) }, (_, i) => i + 1).map(carrera => (
              <div key={`s1-${carrera}`} className={styles.pickCell}>
                <label className={styles.pickLabel}>C{carrera}</label>
                <input
                  className={`${styles.pickInput} ${picks[carrera - 1] ? styles.pickInputFilled : ''}`}
                  type="text"
                  value={picks[carrera - 1] || ''}
                  onChange={e => handlePickChange(carrera, e.target.value, 1)}
                  placeholder="—"
                  maxLength={3}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Picks Grid - Stud 2 (si aplica) */}
      {hasMultiStud && picks2.length > 0 && (
        <div className={`${styles.picksSection} ${styles.picksSectionStud2}`}>
          <h3 className={`${styles.picksTitle} ${styles.picksTitleStud2}`}>
            🎯 Stud B: {completedCount2}/{Math.max(raceCount, picks2.length)}
          </h3>
          <div className={`${styles.picksGrid} ${styles.picksGridDual}`}>
            {Array.from({ length: Math.max(raceCount, picks2.length) }, (_, i) => i + 1).map(carrera => (
              <div key={`s2-${carrera}`} className={`${styles.pickCell} ${styles.pickCellStud2}`}>
                <label className={`${styles.pickLabel} ${styles.pickLabelStud2}`}>C{carrera}</label>
                <input
                  className={`${styles.pickInput} ${styles.pickInputStud2} ${picks2[carrera - 1] ? styles.pickInputFilled : ''}`}
                  type="text"
                  value={picks2[carrera - 1] || ''}
                  onChange={e => handlePickChange(carrera, e.target.value, 2)}
                  placeholder="—"
                  maxLength={3}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview */}
      {picks.length > 0 && (
        <div className={styles.previewSection}>
          <label className={styles.sectionLabel}>👁️ Vista Previa</label>
          <div className={styles.preview}>
            {hasMultiStud ? (
              <>
                <div><strong>Stud A ({participant1 || '?'}):</strong> {picks.join(' · ') || 'vacío'}</div>
                <div><strong>Stud B ({participant2 || '?'}):</strong> {picks2.join(' · ') || 'vacío'}</div>
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
