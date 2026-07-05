/**
 * PickEntry.jsx - CORREGIDO
 *
 * Contenedor que decide qué mostrar:
 * - Selección de campañas
 * - Selección de participante(s) - inteligente según modo
 * - PickForm con parsing automático
 *
 * FIXES:
 * 1. "Pareja" SOLO se muestra si alguna campaña es modo "pairs"
 * 2. Multi-stud muestra selector para Participante 2
 * 3. Eliminado input manual duplicado de stud
 */

import React, { useState, useEffect, useMemo } from 'react'
import useAppStore from '../../store/useAppStore'
import { useCampaignParticipants } from '../../hooks/useCampaignParticipants'
import { isCampaignActiveForDate, normalizeDate } from '../../services/campaignEligibility'
import PickForm from './PickForm'
import { getChileDateString } from '../../utils/dateChile'
import styles from '../PickEntry.module.css'

export default function PickEntry() {
  const { appData, refreshCampaignData } = useAppStore()

  // Fecha operativa
  const [operationDate, setOperationDate] = useState(getChileDateString())

  // Campañas seleccionadas (checkboxes)
  const [selectedCampaigns, setSelectedCampaigns] = useState({})

  // Participantes
  const [selectedParticipant1, setSelectedParticipant1] = useState('')
  const [selectedParticipant2, setSelectedParticipant2] = useState('')
  const [campaignDataLoading, setCampaignDataLoading] = useState(false)
  const [campaignDataError, setCampaignDataError] = useState('')

  // ============================================
  // OBTENER CAMPAÑAS ACTIVAS
  // ============================================
  const activeCampaigns = useMemo(() => {
    const allCampaigns = []
    const types = ['diaria', 'semanal', 'mensual']

    for (const type of types) {
      const campaigns = appData?.campaigns?.[type] || []
      for (const c of campaigns) {
        if (!c.enabled) continue
        
        const campaignDate = c.date ? normalizeDate(c.date) : null
        const selectedDate = normalizeDate(operationDate)

        if (type === 'diaria') {
          if (campaignDate === selectedDate) {
            allCampaigns.push({ ...c, type })
          }
        } else if (type === 'semanal' && isCampaignActiveForDate({ ...c, type }, operationDate, appData)) {
          allCampaigns.push({ ...c, type })
        } else if (type === 'mensual' && isCampaignActiveForDate({ ...c, type }, operationDate, appData)) {
          allCampaigns.push({ ...c, type })
        }
      }
    }
    return allCampaigns
  }, [appData, operationDate])

  // Auto-seleccionar campañas cuando cambian
  useEffect(() => {
    if (activeCampaigns.length === 0) return
    setSelectedCampaigns(prev => {
      const next = {}
      for (const c of activeCampaigns) {
        next[c.id] = prev[c.id] !== undefined ? prev[c.id] : true
      }
      return next
    })
  }, [activeCampaigns])

  const toggleCampaign = (campaignId) => {
    setSelectedCampaigns(prev => ({
      ...prev,
      [campaignId]: !prev[campaignId]
    }))
  }

  const selectedCampaignList = useMemo(() => {
    return activeCampaigns.filter(c => selectedCampaigns[c.id])
  }, [activeCampaigns, selectedCampaigns])

  const selectedCampaignLoadKey = useMemo(() => (
    selectedCampaignList
      .map((campaign) => `${campaign.type}:${campaign.id}`)
      .sort()
      .join('|')
  ), [selectedCampaignList])

  useEffect(() => {
    const campaignsToLoad = selectedCampaignList
      .map((campaign) => ({
        kind: getBackendCampaignKind(campaign.type),
        id: campaign.id,
      }))
      .filter((campaign) => campaign.kind && campaign.id)

    if (campaignsToLoad.length === 0) {
      setCampaignDataLoading(false)
      setCampaignDataError('')
      return undefined
    }

    let cancelled = false
    setCampaignDataLoading(true)
    setCampaignDataError('')

    Promise.all(campaignsToLoad.map((campaign) => (
      refreshCampaignData(campaign.kind, campaign.id, operationDate)
    )))
      .catch((error) => {
        if (!cancelled) {
          console.warn('No se pudo cargar el acumulado de campanas para ingreso de picks:', error)
          setCampaignDataError('No se pudo cargar la lista de inscritos. Actualiza e intenta nuevamente.')
        }
      })
      .finally(() => {
        if (!cancelled) setCampaignDataLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [operationDate, refreshCampaignData, selectedCampaignLoadKey])

  // ============================================
  // DETECTAR SI ALGUNA CAMPAÑA ES MODO "PAREJA"
  // ============================================
  const hasPairsMode = useMemo(() => {
    return selectedCampaignList.some(c => c.format === 'pairs' || c.competitionMode === 'pairs')
  }, [selectedCampaignList])

  // ============================================
  // OBTENER PARTICIPANTES DISPONIBLES
  // ============================================
  const { getSelectableStudsForCampaigns } = useCampaignParticipants()
  const availableParticipants = useMemo(() => {
    if (campaignDataLoading || campaignDataError) return []
    const campaignIds = selectedCampaignList.map(c => c.id)
    return getSelectableStudsForCampaigns(campaignIds, operationDate)
  }, [campaignDataError, campaignDataLoading, getSelectableStudsForCampaigns, operationDate, selectedCampaignList])

  // ============================================
  // HANDLERS
  // ============================================
  useEffect(() => {
    const availableNames = new Set(availableParticipants.map((participant) => participant?.name).filter(Boolean))

    if (selectedParticipant1 && !availableNames.has(selectedParticipant1)) {
      setSelectedParticipant1('')
    }

    if (selectedParticipant2 && !availableNames.has(selectedParticipant2)) {
      setSelectedParticipant2('')
    }
  }, [availableParticipants, selectedParticipant1, selectedParticipant2])

  const handlePickSuccess = async () => {
    setSelectedParticipant1('')
    setSelectedParticipant2('')
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className={styles.pickEntry}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Ingreso de Pronósticos</h1>
          <p className={styles.subtitle}>Selecciona la fecha y las campañas a las que ingresar picks</p>
        </div>
      </header>

      {/* Fecha operativa */}
      <div className={styles.section}>
        <label className={styles.sectionLabel}>📅 Fecha operativa</label>
        <input
          className={styles.dateInput}
          type="date"
          value={operationDate}
          onChange={e => setOperationDate(e.target.value)}
        />
      </div>

      {/* Campañas activas con checkboxes */}
      <div className={styles.section}>
        <label className={styles.sectionLabel}>
          📋 Campañas activas ({activeCampaigns.length} disponibles{selectedCampaignList.length > 0 ? `, ${selectedCampaignList.length} seleccionadas` : ''})
        </label>
        {activeCampaigns.length === 0 ? (
          <div className={styles.emptyCampaigns}>
            <span className={styles.emptyIcon}>📋</span>
            <p>No hay campañas activas para esta fecha. Crea una campaña primero.</p>
          </div>
        ) : (
          <div className={styles.campaignCheckList}>
            <label className={styles.checkAllChip}>
              <input
                type="checkbox"
                checked={activeCampaigns.length > 0 && activeCampaigns.every(c => selectedCampaigns[c.id])}
                onChange={() => {
                  const allSelected = activeCampaigns.every(c => selectedCampaigns[c.id])
                  const newState = {}
                  for (const c of activeCampaigns) {
                    newState[c.id] = !allSelected
                  }
                  setSelectedCampaigns(newState)
                }}
              />
              <strong>Seleccionar todas</strong>
            </label>
            {activeCampaigns.map(c => (
              <label key={c.id} className={styles.campaignCheckItem}>
                <input
                  type="checkbox"
                  checked={!!selectedCampaigns[c.id]}
                  onChange={() => toggleCampaign(c.id)}
                />
                <span className={styles.campaignTypeBadge}>{getTypeBadge(c.type)}</span>
                <span className={styles.campaignCheckName}>{c.name}</span>
                {c.groupId && <span className={styles.campaignGroup}>({getGroupName(appData, c.groupId)})</span>}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* PickForm (si hay campañas seleccionadas) */}
      {selectedCampaignList.length === 0 ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>👆</span>
          <p>Selecciona al menos una campaña para ingresar pronósticos</p>
        </div>
      ) : (
        <div className={styles.multiCampaignForm}>
          <div className={styles.selectedCampaignsBanner}>
            <span>📋 Ingresando a {selectedCampaignList.length} campaña{selectedCampaignList.length > 1 ? 's' : ''}:</span>
            <span className={styles.selectedCampaignNames}>
              {selectedCampaignList.map(c => `${getTypeBadge(c.type)} ${c.name}`).join(' · ')}
            </span>
          </div>
          {campaignDataLoading && (
            <div className={`${styles.message} ${styles.info}`}>
              Cargando inscritos acumulados de la campana...
            </div>
          )}
          {campaignDataError && (
            <div className={`${styles.message} ${styles.error}`}>
              {campaignDataError}
            </div>
          )}
          <PickForm
            campaigns={selectedCampaignList}
            operationDate={operationDate}
            numCarreras={selectedCampaignList[0]?.raceCount || 12}
            availableParticipants={availableParticipants}
            allParticipants={appData?.registry || availableParticipants}
            hasPairsMode={hasPairsMode}
            participant1={selectedParticipant1}
            participant2={selectedParticipant2}
            onSelectParticipant1={setSelectedParticipant1}
            onSelectParticipant2={setSelectedParticipant2}
            onSuccess={handlePickSuccess}
          />
        </div>
      )}
    </div>
  )
}

function getTypeBadge(type) {
  const labels = { diaria: 'D', semanal: 'S', mensual: 'M' }
  return labels[type] || type
}

function getGroupName(appData, groupId) {
  const group = (appData?.settings?.registryGroups || []).find(g => g.id === groupId)
  return group?.name || groupId
}

function getBackendCampaignKind(type) {
  if (type === 'diaria' || type === 'daily') return 'daily'
  if (type === 'semanal' || type === 'weekly') return 'weekly'
  if (type === 'mensual' || type === 'monthly') return 'monthly'
  return ''
}
