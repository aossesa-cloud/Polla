import React, { useEffect, useMemo, useState } from 'react'
import api from '../../api'
import useAppStore from '../../store/useAppStore'
import { usePromoRelations } from '../../hooks/usePromoRelations'
import { calculateDailyScores } from '../../engine/scoreEngine'
import { resolveEventOperationalData } from '../../services/campaignOperationalData'
import { formatPicksForAPI } from '../../utils/pickParser'
import RankingContainer from '../ranking/RankingContainer'
import PicksTable from '../tables/PicksTable'
import styles from './CampaignDetailModal.module.css'

const TAB_OPTIONS = [
  { id: 'pronosticos', label: 'Pronósticos' },
  { id: 'participantes', label: 'Participantes' },
  { id: 'ranking', label: 'Ranking' },
  { id: 'resultados', label: 'Resultados' },
]

export default function CampaignDetailModal({ campaign, initialTab = 'pronosticos', registryGroups = [], onClose, onRefresh }) {
  const { appData } = useAppStore()
  const [activeTab, setActiveTab] = useState(initialTab)
  const [editingPick, setEditingPick] = useState(null)
  const [pickDraft, setPickDraft] = useState([])
  const [pickMessage, setPickMessage] = useState(null)
  const [savingPick, setSavingPick] = useState(false)
  const [savingParticipantName, setSavingParticipantName] = useState('')
  const [editingPromoName, setEditingPromoName] = useState('')
  const {
    getPromoPartners,
    savePromoRelation,
    removePromoRelation,
  } = usePromoRelations(campaign.id, campaign.groupId)

  const registry = appData?.registry || []
  const campaignGroupName = registryGroups.find((group) => group.id === campaign.groupId)?.name || 'Todos'

  const campaignEvents = useMemo(() => (
    collectCampaignEvents(appData, campaign, getPreferredCampaignDate(campaign))
  ), [appData, campaign])

  const preferredDate = useMemo(() => (
    getPreferredCampaignDate(campaign, campaignEvents)
  ), [campaign, campaignEvents])

  const promoRegistryOptions = useMemo(() => (
    registry
      .filter((participant) => participant?.promo === true)
      .filter((participant) => !campaign.groupId || participant.group === campaign.groupId)
      .map((participant) => participant.name)
      .sort((a, b) => a.localeCompare(b, 'es'))
  ), [campaign.groupId, registry])

  const eventSections = useMemo(() => (
    buildEventSections(appData, campaign, campaignEvents)
  ), [appData, campaign, campaignEvents])

  const participantEvents = campaignEvents
  const participantSections = eventSections

  const enrolledParticipants = useMemo(() => {
    const map = new Map()

    eventSections.forEach((section) => {
      section.picks.forEach((entry) => {
        const key = normalizeText(entry.participant)
        const registryEntry = registry.find((item) => matchParticipantName(item.name, entry.participant)) || null
        const existing = map.get(key)
        const promoPartners = registryEntry?.promoPartners || []
        const localPartners = getPromoPartners(entry.participant)
        const enrolledNames = section.picks.map((pickEntry) => pickEntry.participant)
        const campaignPartner = [...promoPartners, ...localPartners]
          .find((partner) => enrolledNames.some((name) => normalizeText(name) === normalizeText(partner)))

        const next = existing || {
          name: entry.participant,
          normalizedName: key,
          promoEnabledOnRegistry: registryEntry?.promo === true,
          registryEntry,
          totalPoints: 0,
          appearances: 0,
          eventIds: new Set(),
          partner: null,
        }

        next.totalPoints += Number(entry.points || 0)
        next.appearances += 1
        next.eventIds.add(section.eventId)
        if (campaignPartner) next.partner = campaignPartner
        if (!next.registryEntry && registryEntry) {
          next.registryEntry = registryEntry
          next.promoEnabledOnRegistry = registryEntry?.promo === true
        }

        map.set(key, next)
      })
    })

    const promoRegistrySet = new Set(promoRegistryOptions.map(normalizeText))

    return Array.from(map.values())
      .map((participant) => {
        const currentPartner = participant.partner
        const partnerOptions = Array.from(map.values())
          .filter((candidate) => candidate.name !== participant.name)
          .filter((candidate) => (
            promoRegistrySet.has(candidate.normalizedName) ||
            (currentPartner && matchParticipantName(candidate.name, currentPartner))
          ))
          .map((candidate) => candidate.name)
          .sort((a, b) => a.localeCompare(b, 'es'))

        return {
          ...participant,
          eventIds: Array.from(participant.eventIds),
          partnerOptions,
          canConfigurePromo: campaign.promoEnabled && participant.promoEnabledOnRegistry,
        }
      })
      .sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints
        return a.name.localeCompare(b.name, 'es')
      })
  }, [campaign.promoEnabled, eventSections, getPromoPartners, promoRegistryOptions, registry])

  useEffect(() => {
    if (!editingPick) return

    const section = eventSections.find((item) => item.eventId === editingPick.eventId)
    const participantEntry = section?.picks.find((item) => item.participant === editingPick.participantName)
    if (!participantEntry) {
      setEditingPick(null)
      setPickDraft([])
      return
    }

    setPickDraft(normalizeParticipantPicks(participantEntry.originalParticipant?.picks, section.raceCount))
  }, [editingPick, eventSections])

  const handleOpenPickEditor = (eventId, participantName) => {
    setPickMessage(null)
    setEditingPick({ eventId, participantName })
  }

  const handleClosePickEditor = () => {
    setEditingPick(null)
    setPickDraft([])
    setPickMessage(null)
  }

  const handlePickDraftChange = (index, value) => {
    setPickDraft((current) => {
      const next = [...current]
      next[index] = value
      return next
    })
  }

  const handleSavePick = async () => {
    if (!editingPick) return

    const section = eventSections.find((item) => item.eventId === editingPick.eventId)
    const participantEntry = section?.picks.find((item) => item.participant === editingPick.participantName)
    if (!section || !participantEntry?.originalParticipant) return

    setSavingPick(true)
    setPickMessage(null)

    try {
      await api.savePickForEvent(section.eventId, {
        ...participantEntry.originalParticipant,
        picks: formatPicksForAPI(pickDraft),
      })
      await onRefresh?.()
      setPickMessage({ type: 'ok', text: 'Pronóstico actualizado correctamente.' })
      handleClosePickEditor()
    } catch (error) {
      setPickMessage({ type: 'error', text: error.message || 'No se pudo actualizar el pronóstico.' })
    } finally {
      setSavingPick(false)
    }
  }

  const handlePromoChange = async (participantName, value) => {
    setSavingParticipantName(participantName)
    try {
      if (!value) {
        await removePromoRelation(participantName)
      } else {
        await savePromoRelation(participantName, [value])
      }
      setEditingPromoName('')
      await onRefresh?.()
    } finally {
      setSavingParticipantName('')
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
        <header className={styles.header}>
          <div className={styles.headerCopy}>
            <span className={styles.eyebrow}>{campaign.type}</span>
            <h2 className={styles.title}>{campaign.name}</h2>
            <p className={styles.subtitle}>
              {campaignGroupName} · {participantEvents.length} jornada{participantEvents.length === 1 ? '' : 's'} · {sumParticipants(participantSections)} inscritos
            </p>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>Cerrar</button>
        </header>

        <div className={styles.tabBar}>
          {TAB_OPTIONS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className={styles.body}>
          {activeTab === 'pronosticos' && (
            <div className={styles.sectionStack}>
              {pickMessage && (
                <div className={`${styles.message} ${pickMessage.type === 'ok' ? styles.messageOk : styles.messageError}`}>
                  {pickMessage.text}
                </div>
              )}

              {editingPick && (
                <PickEditorPanel
                  editingPick={editingPick}
                  eventSections={eventSections}
                  pickDraft={pickDraft}
                  onChange={handlePickDraftChange}
                  onCancel={handleClosePickEditor}
                  onSave={handleSavePick}
                  saving={savingPick}
                />
              )}

              {eventSections.length === 0 ? (
                <EmptyState text="No hay pronósticos cargados para esta campaña." />
              ) : eventSections.map((section) => (
                <article key={section.eventId} className={styles.panel}>
                  <div className={styles.panelHeader}>
                    <div>
                      <h3 className={styles.panelTitle}>Pronósticos {formatShortDate(section.date)}</h3>
                      <p className={styles.panelMeta}>{section.title} · {section.picks.length} participantes · {section.raceCount} carreras</p>
                    </div>
                  </div>

                  <PicksTable
                    picks={section.picks}
                    results={section.results}
                    date={section.date}
                    raceCount={section.raceCount}
                    onEditPick={(entry) => handleOpenPickEditor(section.eventId, entry.participant)}
                  />
                </article>
              ))}
            </div>
          )}

          {activeTab === 'participantes' && (
            <div className={styles.sectionStack}>
              <article className={styles.panel}>
                <div className={styles.panelHeader}>
                  <div>
                    <h3 className={styles.panelTitle}>Participantes inscritos</h3>
                    <p className={styles.panelMeta}>
                      Solo inscritos en esta campaña. Puedes ajustar si entran individual o con promo.
                    </p>
                  </div>
                </div>

                {enrolledParticipants.length === 0 ? (
                  <EmptyState text="No hay participantes inscritos para esta campaña." />
                ) : (
                  <div className={styles.participantsTable}>
                    <div className={styles.participantsHead}>
                      <span>Participante</span>
                      <span>Estado</span>
                      <span>Partner promo</span>
                      <span>Total puntos</span>
                    </div>

                    {enrolledParticipants.map((participant) => {
                      const currentPartner = participant.partnerOptions.find((candidate) =>
                        normalizeText(candidate) === normalizeText(participant.partner)
                      ) || ''
                      const promoApplied = Boolean(currentPartner)

                      return (
                        <div key={participant.name} className={styles.participantsRow}>
                          <div>
                            <strong>{participant.name}</strong>
                            <div className={styles.rowSubmeta}>{participant.appearances} ingreso(s) · {participant.eventIds.length} jornada(s)</div>
                          </div>

                          <span className={promoApplied ? styles.statusPromo : styles.statusIndividual}>
                            {promoApplied ? 'Promo 2x' : 'Individual'}
                          </span>

                          <div className={styles.partnerCell}>
                            {participant.canConfigurePromo ? (
                              editingPromoName === participant.name ? (
                                <div className={styles.partnerEditor}>
                                  <select
                                    className={styles.partnerSelect}
                                    value={currentPartner}
                                    disabled={savingParticipantName === participant.name}
                                    onChange={(event) => handlePromoChange(participant.name, event.target.value)}
                                  >
                                    <option value="">Jugar individual</option>
                                    {participant.partnerOptions.map((option) => (
                                      <option key={`${participant.name}-${option}`} value={option}>{option}</option>
                                    ))}
                                  </select>
                                  <button
                                    type="button"
                                    className={styles.secondaryBtn}
                                    onClick={() => setEditingPromoName('')}
                                    disabled={savingParticipantName === participant.name}
                                  >
                                    Cerrar
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  className={styles.secondaryBtn}
                                  onClick={() => setEditingPromoName(participant.name)}
                                >
                                  {promoApplied ? 'Editar promo' : 'Activar promo'}
                                </button>
                              )
                            ) : (
                              <span className={styles.disabledHint}>
                                {campaign.promoEnabled
                                  ? (participant.promoEnabledOnRegistry ? 'Sin partners promo inscritos' : 'Sin promo 2x en grupo')
                                  : 'Promo desactivada'}
                              </span>
                            )}
                          </div>

                          <span className={styles.pointsCell}>{formatScore(participant.totalPoints)}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </article>
            </div>
          )}

          {activeTab === 'ranking' && (
            <div className={styles.sectionStack}>
              <article className={styles.panel}>
                <RankingContainer
                  type={campaign.type}
                  initialDate={preferredDate}
                  initialCampaignId={campaign.id}
                  lockedCampaignId={campaign.id}
                  showFilters={false}
                  compact
                />
              </article>
            </div>
          )}

          {activeTab === 'resultados' && (
            <div className={styles.sectionStack}>
              {eventSections.length === 0 ? (
                <EmptyState text="No hay jornadas asociadas a esta campaña." />
              ) : eventSections.map((section) => {
                const raceResults = getSortedRaceResults(section.results)
                return (
                  <article key={`${section.eventId}-results`} className={styles.panel}>
                    <div className={styles.panelHeader}>
                      <div>
                        <h3 className={styles.panelTitle}>Resultados {formatShortDate(section.date)}</h3>
                        <p className={styles.panelMeta}>{section.title} · {raceResults.length} carrera(s) con datos</p>
                      </div>
                    </div>

                    {raceResults.length === 0 ? (
                      <EmptyState text="Aún no hay resultados cargados para esta jornada." compact />
                    ) : (
                      <div className={styles.resultsGrid}>
                        {raceResults.map((result) => (
                          <div key={`${section.eventId}-race-${result.race}`} className={styles.resultCard}>
                            <div className={styles.resultRace}>Carrera {result.race}</div>
                            <div className={styles.resultRow}><span>1°</span><strong>{formatRunner(result.primero, result.nombrePrimero)}</strong></div>
                            <div className={styles.resultRow}><span>2°</span><strong>{formatRunner(result.segundo, result.nombreSegundo)}</strong></div>
                            <div className={styles.resultRow}><span>3°</span><strong>{formatRunner(result.tercero, result.nombreTercero)}</strong></div>
                            <div className={styles.resultMeta}>
                              <span>Div. ganador: {formatDividend(result.ganador)}</span>
                              <span>Div. 2° primero: {formatDividend(result.divSegundoPrimero)}</span>
                              <span>Div. 3° primero: {formatDividend(result.divTerceroPrimero)}</span>
                              <span>Div. 2° lugar: {formatDividend(result.divSegundo)}</span>
                              <span>Div. 3° segundo: {formatDividend(result.divTerceroSegundo)}</span>
                              <span>Div. 3° lugar: {formatDividend(result.divTercero)}</span>
                              <span>Favorito: {formatRunner(result.favorito, result.nombreFavorito)}</span>
                              <span>Retiros: {formatWithdrawals(result)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function PickEditorPanel({ editingPick, eventSections, pickDraft, onChange, onCancel, onSave, saving }) {
  const section = eventSections.find((item) => item.eventId === editingPick.eventId)
  if (!section) return null

  return (
    <article className={`${styles.panel} ${styles.editorPanel}`}>
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>Editar pronóstico</h3>
          <p className={styles.panelMeta}>{editingPick.participantName} · {formatShortDate(section.date)} · {section.raceCount} carreras</p>
        </div>
      </div>

      <div className={styles.pickGrid}>
        {Array.from({ length: section.raceCount }, (_, index) => index).map((index) => (
          <label key={`${editingPick.eventId}-race-${index + 1}`} className={styles.pickField}>
            <span>C{index + 1}</span>
            <input
              type="text"
              value={pickDraft[index] || ''}
              onChange={(event) => onChange(index, event.target.value)}
              maxLength={3}
            />
          </label>
        ))}
      </div>

      <div className={styles.editorActions}>
        <button type="button" className={styles.secondaryBtn} onClick={onCancel}>Cancelar</button>
        <button type="button" className={styles.primaryBtn} onClick={onSave} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </article>
  )
}

function EmptyState({ text, compact = false }) {
  return (
    <div className={`${styles.emptyState} ${compact ? styles.emptyStateCompact : ''}`}>
      {text}
    </div>
  )
}

function buildEventSections(appData, campaign, events) {
  return (events || []).map((event) => {
    const operationalData = resolveEventOperationalData(appData, campaign, event)
    const raceCount = operationalData.raceCount
    const scoringConfig = event.scoring || { mode: 'dividend', doubleLastRace: true }
    const fallbackPicks = (event.participants || []).map((participant) => ({
      participant: participant.name || participant.index,
      picks: normalizeParticipantPicks(participant.picks, raceCount),
    }))
    const recalculatedScores = hasResultEntries(operationalData.results)
      ? calculateDailyScores(fallbackPicks, operationalData.results, scoringConfig)
      : {}
    const picks = (event.participants || [])
      .map((participant) => {
        const participantName = participant.name || participant.index
        const backendPoints = Number(participant.points)
        const resolvedPoints = hasResultEntries(operationalData.results)
          ? Number(recalculatedScores[participantName] || 0)
          : (Number.isFinite(backendPoints) ? backendPoints : 0)

        return {
          participant: participantName,
          name: participantName,
          points: resolvedPoints,
          score: resolvedPoints,
          picks: normalizeParticipantPicks(participant.picks, raceCount),
          originalParticipant: participant,
        }
      })
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points
        return normalizeText(a.participant).localeCompare(normalizeText(b.participant), 'es')
      })

    return {
      event,
      eventId: event.id,
      title: operationalData.trackName || event.title || event.sheetName || event.id,
      date: operationalData.date || getEventDate(event),
      raceCount,
      picks,
      results: operationalData.results,
    }
  })
}

function collectCampaignEvents(appData, campaign, selectedDate) {
  const events = (appData?.events || []).filter((event) => {
    if (!Array.isArray(event?.participants) || event.participants.length === 0) return false
    const eventDate = getEventDate(event)
    if (!eventDate) return false
    if (!isEventEligibleForCampaign(eventDate, campaign, selectedDate)) return false
    if (hasExplicitCampaignMatch(event, campaign)) return true
    return isFallbackCampaignMatch(event, campaign, eventDate)
  })

  const uniqueEvents = new Map()
  events.forEach((event) => {
    uniqueEvents.set(event.id, event)
  })

  return Array.from(uniqueEvents.values()).sort((a, b) => {
    const dateDiff = getEventDate(a).localeCompare(getEventDate(b))
    if (dateDiff !== 0) return dateDiff
    return (a.id || '').localeCompare(b.id || '')
  })
}

function collectRelatedCampaignEvents(appData, campaign) {
  const relatedCampaigns = getRelatedCampaigns(appData?.campaigns, campaign)
  if (relatedCampaigns.length === 0) return []

  const uniqueEvents = new Map()

  relatedCampaigns.forEach((relatedCampaign) => {
    const relatedEvents = collectCampaignEvents(
      appData,
      relatedCampaign,
      getPreferredCampaignDate(relatedCampaign),
    )

    relatedEvents.forEach((event) => {
      if (event?.id) {
        uniqueEvents.set(event.id, event)
      }
    })
  })

  return Array.from(uniqueEvents.values()).sort((a, b) => {
    const dateDiff = getEventDate(a).localeCompare(getEventDate(b))
    if (dateDiff !== 0) return dateDiff
    return (a.id || '').localeCompare(b.id || '')
  })
}

function getRelatedCampaigns(campaigns, campaign) {
  const allCampaigns = [
    ...(campaigns?.diaria || []),
    ...(campaigns?.semanal || []),
    ...(campaigns?.mensual || []),
  ]

  return allCampaigns.filter((candidate) => {
    if (!candidate || candidate.id === campaign.id) return false
    if ((candidate.type || inferCampaignType(candidate)) !== campaign.type) return false
    if (!candidate.enabled) return false
    if (campaign.groupId) return candidate.groupId === campaign.groupId
    return true
  })
}

function inferCampaignType(campaign) {
  if (campaign?.type) return campaign.type
  if (campaign?.date) return 'diaria'
  if (campaign?.selectedEventIds?.length) return 'mensual'
  if (campaign?.activeDays?.length) return 'semanal'
  return 'diaria'
}

function hasExplicitCampaignMatch(event, campaign) {
  const eventId = event.id || ''
  const campaignId = campaign.id || ''
  const eventIds = campaign.eventIds || []

  return Boolean(
    (campaignId && eventId.includes(campaignId)) ||
    (campaign.eventId && (campaign.eventId === eventId || eventId.includes(campaign.eventId))) ||
    event.campaignId === campaignId ||
    eventIds.some((id) => id === eventId || eventId.includes(id))
  )
}

function isFallbackCampaignMatch(event, campaign, eventDate) {
  const eventTitle = `${event.title || ''} ${event.sheetName || ''}`.toLowerCase()
  const campaignName = (campaign.name || '').toLowerCase()

  if (campaign.type === 'diaria') {
    return eventDate === normalizeDate(campaign.date) && (eventTitle.includes(campaignName) || !campaignName)
  }

  return isEventEligibleForCampaign(eventDate, campaign, eventDate)
}

function isEventEligibleForCampaign(eventDate, campaign, selectedDate) {
  if (!eventDate) return false

  if (campaign.type === 'diaria') {
    return eventDate === normalizeDate(campaign.date || selectedDate)
  }

  if (campaign.startDate && eventDate < normalizeDate(campaign.startDate)) return false
  if (campaign.endDate && eventDate > normalizeDate(campaign.endDate)) return false

  if (campaign.type === 'semanal' && !isWeeklyDayEnabled(campaign, eventDate)) return false

  if (campaign.type === 'mensual') {
    const selectedEventDates = getSelectedEventDates(campaign)
    if (selectedEventDates.size > 0 && !selectedEventDates.has(eventDate)) return false
  }

  return true
}

function isWeeklyDayEnabled(campaign, date) {
  const activeDays = (campaign.activeDays || []).map(normalizeText)
  if (activeDays.length === 0) return true

  const dayNames = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']
  const dayName = dayNames[new Date(`${date}T12:00:00`).getDay()]
  return activeDays.includes(dayName)
}

function getSelectedEventDates(campaign) {
  return new Set(
    (campaign.selectedEventIds || [])
      .map((eventId) => {
        const match = String(eventId).match(/(\d{4}-\d{2}-\d{2})/)
        return match ? match[1] : null
      })
      .filter(Boolean)
  )
}

function getPreferredCampaignDate(campaign, events = []) {
  if (campaign?.date) return normalizeDate(campaign.date)
  if (campaign?.startDate) return normalizeDate(campaign.startDate)
  const eventDates = events.map(getEventDate).filter(Boolean).sort((a, b) => b.localeCompare(a))
  return eventDates[0] || new Date().toISOString().slice(0, 10)
}

function getEventDate(event) {
  return normalizeDate(event?.meta?.date || event?.date || event?.sheetName)
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

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function normalizeParticipantPicks(picks, raceCount = 0) {
  const normalized = (picks || []).map((pick) => {
    if (pick && typeof pick === 'object') {
      return String(pick.horse ?? pick.number ?? pick.pick ?? pick.value ?? '').trim()
    }
    return String(pick || '').trim()
  })

  if (raceCount > normalized.length) {
    return [...normalized, ...Array.from({ length: raceCount - normalized.length }, () => '')]
  }
  return normalized
}

function getSortedRaceResults(results) {
  return Object.values(results || {})
    .filter(Boolean)
    .sort((a, b) => Number(a.race || 0) - Number(b.race || 0))
}

function hasResultEntries(results) {
  return Object.values(results || {}).some((race) => race && (race.primero || race.winner?.number))
}

function sumParticipants(eventSections) {
  const unique = new Set()
  eventSections.forEach((section) => {
    section.picks.forEach((pickEntry) => unique.add(normalizeText(pickEntry.participant)))
  })
  return unique.size
}

function formatShortDate(date) {
  if (!date) return 'Sin fecha'
  return new Date(`${date}T12:00:00`).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatScore(value) {
  return Number(value || 0).toLocaleString('es-CL', {
    minimumFractionDigits: Number.isInteger(Number(value || 0)) ? 0 : 1,
    maximumFractionDigits: 2,
  })
}

function formatRunner(number, name) {
  if (!number && !name) return 'Sin datos'
  if (number && name) return `${number} - ${name}`
  return `${number || ''}${name || ''}`.trim()
}

function formatDividend(value) {
  if (value === undefined || value === null || value === '') return '-'
  return String(value).replace('.', ',')
}

function formatWithdrawals(result) {
  const retiros = [
    ...(Array.isArray(result?.retiros) ? result.retiros : []),
    result?.retiro1,
    result?.retiro2,
  ]
    .filter(Boolean)
    .map((item) => (typeof item === 'object' ? item.number || item.name || '' : item))
    .filter(Boolean)

  return retiros.length ? retiros.join(', ') : 'Sin retiros'
}

function matchParticipantName(left, right) {
  return normalizeKey(left) === normalizeKey(right)
}

function normalizeKey(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim()
}
