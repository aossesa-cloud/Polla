import React, { useCallback, useMemo, useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import useAppStore from '../store/useAppStore'
import { isCampaignActiveForDate as isCampaignActiveForDateShared } from '../services/campaignEligibility'
import { getChileDateString } from '../utils/dateChile'
import { html2canvasOptions } from '../utils/html2canvasHelper'
import styles from './Premios.module.css'

const DEFAULT_PAYOUT = {
  firstPct: 70,
  secondPct: 20,
  thirdPct: 10,
  adminPct: 10,
}

const PROMO_RELATIONS_STORAGE_KEY = 'pollas-promo-relations'

const TYPE_TO_PRIZES_KEY = {
  diaria: 'daily',
  semanal: 'weekly',
}

const TYPE_FILTERS = [
  { id: 'all', label: 'Diaria y semanal' },
  { id: 'diaria', label: 'Solo diaria' },
  { id: 'semanal', label: 'Solo semanal' },
]

export default function Premios() {
  const { appData } = useAppStore()
  const [fechaOperativa, setFechaOperativa] = useState(getChileDateString())
  const [selectedGroupId, setSelectedGroupId] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  const [copyMessage, setCopyMessage] = useState('')
  const [copyingKey, setCopyingKey] = useState('')
  const exportRefs = useRef(new Map())

  const prizes = appData?.settings?.prizes || {}
  const campaigns = appData?.settings?.campaigns || appData?.campaigns || {}
  const registry = Array.isArray(appData?.registry) ? appData.registry : []
  const events = useMemo(() => normalizeEvents(appData?.events), [appData])
  const promoRelations = useMemo(() => loadPromoRelations(), [])

  const allCampaigns = useMemo(() => collectPrizeCampaigns(campaigns), [campaigns])

  const groupOptions = useMemo(() => (
    buildGroupOptions({
      campaigns: allCampaigns,
      registry,
      registryGroups: appData?.registryGroups || appData?.settings?.registryGroups || [],
    })
  ), [allCampaigns, appData, registry])

  const summaries = useMemo(() => {
    return allCampaigns
      .filter((campaign) => isCampaignActiveForDate(campaign, fechaOperativa, appData))
      .filter((campaign) => selectedType === 'all' || campaign.tipo === selectedType)
      .filter((campaign) => selectedGroupId === 'all' || getCampaignGroupId(campaign) === selectedGroupId)
      .map((campaign) => buildPrizeSummary({
        campaign,
        date: fechaOperativa,
        events,
        groupOptions,
        prizes,
        promoRelations,
        registry,
      }))
      .sort((a, b) => {
        if (a.groupName !== b.groupName) return a.groupName.localeCompare(b.groupName, 'es')
        return typeOrder(a.tipo) - typeOrder(b.tipo)
      })
  }, [allCampaigns, appData, events, fechaOperativa, groupOptions, prizes, promoRelations, registry, selectedGroupId, selectedType])

  const summariesByGroup = useMemo(() => {
    const grouped = new Map()
    summaries.forEach((summary) => {
      const key = summary.groupId || 'sin-grupo'
      if (!grouped.has(key)) {
        grouped.set(key, {
          groupId: key,
          groupName: summary.groupName,
          summaries: [],
        })
      }
      grouped.get(key).summaries.push(summary)
    })
    return Array.from(grouped.values())
  }, [summaries])

  const setExportRef = useCallback((key) => (node) => {
    if (!key) return
    if (node) exportRefs.current.set(key, node)
    else exportRefs.current.delete(key)
  }, [])

  const handleCopyImage = useCallback(async (key, message) => {
    const node = exportRefs.current.get(key)
    if (!node) {
      setCopyMessage('No se encontró el panel para copiar')
      return
    }

    setCopyingKey(key)
    try {
      const canvas = await html2canvas(node, html2canvasOptions({
        backgroundColor: '#08111f',
        scale: Math.min(2, window.devicePixelRatio || 1.6),
        onclone: (clonedDoc) => {
          clonedDoc.querySelectorAll('[data-export-hidden="true"]').forEach((element) => {
            element.style.display = 'none'
          })
        },
      }))
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 1))
      if (!blob) throw new Error('No se pudo generar la imagen')
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ])
      setCopyMessage(message)
      window.setTimeout(() => setCopyMessage(''), 2200)
    } catch (error) {
      setCopyMessage('No se pudo copiar la imagen')
      console.error('No se pudo copiar premios como imagen:', error)
    } finally {
      setCopyingKey('')
    }
  }, [])

  return (
    <div className={styles.premios}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Premios</h1>
          <p className={styles.subtitle}>Resumen por grupo, fecha y tipo de polla.</p>
        </div>
        {copyMessage && <span className={styles.copyMessage}>{copyMessage}</span>}
      </header>

      <section className={styles.filtersBar}>
        <label className={styles.filterField}>
          <span className={styles.filterLabel}>Grupo</span>
          <select
            className={styles.filterInput}
            value={selectedGroupId}
            onChange={(event) => setSelectedGroupId(event.target.value)}
          >
            <option value="all">Todos los grupos</option>
            {groupOptions.map((group) => (
              <option key={group.id} value={group.id}>{group.name}</option>
            ))}
          </select>
        </label>

        <label className={styles.filterField}>
          <span className={styles.filterLabel}>Fecha</span>
          <input
            className={styles.filterInput}
            type="date"
            value={fechaOperativa}
            onChange={(event) => setFechaOperativa(event.target.value)}
          />
        </label>

        <label className={styles.filterField}>
          <span className={styles.filterLabel}>Tipo de polla</span>
          <select
            className={styles.filterInput}
            value={selectedType}
            onChange={(event) => setSelectedType(event.target.value)}
          >
            {TYPE_FILTERS.map((type) => (
              <option key={type.id} value={type.id}>{type.label}</option>
            ))}
          </select>
        </label>
      </section>

      {summariesByGroup.length > 0 ? (
        <div className={styles.groupStack}>
          {summariesByGroup.map((group) => {
            const canCopyBoth = group.summaries.length > 1
            const groupKey = `group-${group.groupId}`
            return (
              <section key={group.groupId} className={styles.groupBlock} ref={setExportRef(groupKey)}>
                <div className={styles.groupHeader}>
                  <div>
                    <h2 className={styles.groupTitle}>{group.groupName}</h2>
                    <p className={styles.groupMeta}>{formatDateForDisplay(fechaOperativa)}</p>
                  </div>
                  {canCopyBoth && (
                    <button
                      type="button"
                      className={styles.copyBtn}
                      data-export-hidden="true"
                      onClick={() => handleCopyImage(groupKey, 'Imagen de ambos premios copiada')}
                      disabled={copyingKey === groupKey}
                    >
                      {copyingKey === groupKey ? 'Copiando...' : 'Copiar imagen ambos'}
                    </button>
                  )}
                </div>

                <div className={styles.summaryGrid}>
                  {group.summaries.map((summary) => (
                    <PrizeSummaryCard
                      key={summary.campaign.id}
                      summary={summary}
                      exportRef={setExportRef(`summary-${summary.campaign.id}`)}
                      copying={copyingKey === `summary-${summary.campaign.id}`}
                      onCopy={() => handleCopyImage(
                        `summary-${summary.campaign.id}`,
                        `Imagen de premios ${summary.typeLabel.toLowerCase()} copiada`
                      )}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>Medalla</span>
          <p>No hay pollas activas para los filtros seleccionados.</p>
        </div>
      )}
    </div>
  )
}

function PrizeSummaryCard({ summary, onCopy, exportRef, copying }) {
  return (
    <article className={styles.prizeCard} ref={exportRef}>
      <header className={styles.cardHeader}>
        <div>
          <span className={styles.typeBadge}>{summary.typeLabel}</span>
          <h3 className={styles.campaignName}>{summary.campaign.name}</h3>
        </div>
        <button
          type="button"
          className={styles.copyBtn}
          data-export-hidden="true"
          onClick={onCopy}
          disabled={copying}
        >
          {copying ? 'Copiando...' : `Copiar imagen ${summary.typeLabel.toLowerCase()}`}
        </button>
      </header>

      <div className={styles.statGrid}>
        <SummaryStat label="Pozo bruto" value={formatCurrency(summary.grossPool)} hint={`${summary.singleCount} individuales · ${summary.promoPairs} promos`} />
        <SummaryStat label="Administración" value={formatCurrency(summary.adminAmount)} hint={`${formatPercent(summary.payout.adminPct)}% del pozo`} />
        <SummaryStat label="Pozo a repartir" value={formatCurrency(summary.netPool)} hint="Base para premios" />
      </div>

      <div className={styles.payoutList}>
        {summary.payoutRows.map((row) => (
          <div key={row.key} className={styles.payoutRow}>
            <span>{row.label}</span>
            <strong>{formatCurrency(row.amount)}</strong>
            <small>{formatPercent(row.percent)}%</small>
          </div>
        ))}
      </div>

      <div className={styles.participantsTable} data-export-hidden="true">
        <div className={styles.participantsHeader}>
          <span>Participante</span>
          <span>Modalidad</span>
          <span>Aporte</span>
        </div>
        {summary.participants.length > 0 ? (
          summary.participants.map((participant) => (
            <div key={participant.name} className={styles.participantRow}>
              <span>{participant.name}</span>
              <span className={participant.hasPromoPair ? styles.promoPill : styles.singlePill}>
                {participant.hasPromoPair ? 'Promo 2x' : 'Individual'}
              </span>
              <strong>{formatCurrency(participant.contribution)}</strong>
            </div>
          ))
        ) : (
          <div className={styles.participantEmpty}>Sin participantes ingresados.</div>
        )}
      </div>
    </article>
  )
}

function SummaryStat({ label, value, hint }) {
  return (
    <div className={styles.statBox}>
      <span className={styles.statLabel}>{label}</span>
      <strong className={styles.statValue}>{value}</strong>
      <small className={styles.statHint}>{hint}</small>
    </div>
  )
}

function collectPrizeCampaigns(campaigns) {
  return [
    ...(campaigns.daily || campaigns.diaria || []).map((campaign) => ({ ...campaign, tipo: 'diaria', type: campaign.type || 'diaria' })),
    ...(campaigns.weekly || campaigns.semanal || []).map((campaign) => ({ ...campaign, tipo: 'semanal', type: campaign.type || 'semanal' })),
  ].filter((campaign) => campaign && campaign.enabled !== false)
}

function buildPrizeSummary({ campaign, date, events, groupOptions, prizes, promoRelations, registry }) {
  const groupId = getCampaignGroupId(campaign)
  const groupName = getGroupName(groupOptions, groupId)
  const campaignEvents = resolveCampaignEvents(events, campaign, date)
  const eventParticipants = mergeEventParticipants(campaignEvents)
  const enrolledNames = new Set(eventParticipants.map((participant) => normalizeText(participant.name)))
  const payout = normalizePayout(campaign.payout || prizes?.payout || DEFAULT_PAYOUT)
  const entryValue = Number(campaign.entryValue || getDefaultEntryValue(prizes, campaign.tipo))
  const promoPrice = Number(campaign.promoPrice || prizes?.[TYPE_TO_PRIZES_KEY[campaign.tipo]]?.promoPrice || 0)

  const participants = eventParticipants.map((eventParticipant) => {
    const registryParticipant = registry.find((participant) => matchParticipantName(participant.name, eventParticipant.name)) || {}
    const localPromoState = getLocalPromoState(promoRelations, campaign.id, eventParticipant.name)
    const isIndividualToday = eventParticipant.promoMode === 'individual' || localPromoState.mode === 'individual'
    const promoPartners = uniqueTextValues([
      ...(Array.isArray(eventParticipant.promoPartners) ? eventParticipant.promoPartners : []),
      ...(isIndividualToday ? [] : getRegistryPromoPartners(registry, eventParticipant.name)),
      ...localPromoState.partners,
    ])
    const hasPromoPair = Boolean(
      campaign.promoEnabled &&
      !isIndividualToday &&
      promoPartners.some((partner) => enrolledNames.has(normalizeText(partner)))
    )

    return {
      name: eventParticipant.name,
      promo: eventParticipant.promo === true || registryParticipant.promo === true || promoPartners.length > 0,
      promoMode: isIndividualToday ? 'individual' : (hasPromoPair ? 'pair' : ''),
      promoPartners,
      hasPromoPair,
      contribution: hasPromoPair ? promoPrice / 2 : entryValue,
    }
  }).sort((a, b) => a.name.localeCompare(b.name, 'es'))

  const promoPairs = countPromoPairs(participants)
  const promoCount = promoPairs * 2
  const singleCount = Math.max(0, participants.length - promoCount)
  const grossPool = Math.round(singleCount * entryValue + promoPairs * promoPrice)
  const adminAmount = Math.round(grossPool * (Number(payout.adminPct || 0) / 100))
  const netPool = Math.max(0, grossPool - adminAmount)
  const payoutRows = [
    { key: 'firstPct', label: '1° Lugar', percent: payout.firstPct, amount: Math.round(netPool * payout.firstPct / 100) },
    { key: 'secondPct', label: '2° Lugar', percent: payout.secondPct, amount: Math.round(netPool * payout.secondPct / 100) },
    { key: 'thirdPct', label: '3° Lugar', percent: payout.thirdPct, amount: Math.round(netPool * payout.thirdPct / 100) },
  ].filter(hasVisiblePrizeRow)

  return {
    campaign,
    date,
    groupId,
    groupName,
    tipo: campaign.tipo,
    typeLabel: campaign.tipo === 'diaria' ? 'Diaria' : 'Semanal',
    payout,
    participants,
    singleCount,
    promoPairs,
    grossPool,
    adminAmount,
    netPool,
    payoutRows,
  }
}

function normalizeEvents(events) {
  return Array.isArray(events) ? events : Object.values(events || {})
}

function resolveCampaignEvents(events, campaign, date) {
  const directMatches = events.filter((event) => {
    const eventId = String(event?.id || '')
    const eventCampaignId = String(event?.campaignId || event?.meta?.campaignId || '')
    const campaignId = String(campaign?.id || '')
    return (
      eventCampaignId === campaignId ||
      eventId.includes(campaignId) ||
      (Array.isArray(campaign?.eventIds) && campaign.eventIds.includes(event?.id))
    )
  })

  if (directMatches.length > 0) return directMatches

  if (campaign?.tipo === 'diaria') {
    return events.filter((event) => {
      const eventDate = event?.meta?.date || event?.date || event?.sheetName || ''
      return String(eventDate).includes(date) && Array.isArray(event?.participants) && event.participants.length > 0
    })
  }

  return []
}

function mergeEventParticipants(events) {
  const map = new Map()
  events.forEach((event) => {
    ;(event?.participants || []).forEach((participant) => {
      const name = String(participant?.name || '').trim()
      if (!name) return
      const key = normalizeText(name)
      const existing = map.get(key) || {
        name,
        promo: false,
        promoPartners: [],
      }
      map.set(key, {
        ...existing,
        name,
        promo: existing.promo || participant?.promo === true,
        promoMode: participant?.promoMode === 'individual' ? 'individual' : existing.promoMode,
        promoPartners: uniqueTextValues([
          ...(existing.promoPartners || []),
          ...(Array.isArray(participant?.promoPartners) ? participant.promoPartners : []),
        ]),
      })
    })
  })
  return Array.from(map.values())
}

function buildGroupOptions({ campaigns, registry, registryGroups }) {
  const groups = new Map()
  ;(registryGroups || []).forEach((group) => {
    const id = String(group?.id || group?.name || '').trim()
    if (id) groups.set(id, { id, name: String(group?.name || id).trim() })
  })
  ;(campaigns || []).forEach((campaign) => {
    const id = getCampaignGroupId(campaign)
    if (id && !groups.has(id)) groups.set(id, { id, name: id })
  })
  ;(registry || []).forEach((participant) => {
    const id = String(participant?.group || '').trim()
    if (id && !groups.has(id)) groups.set(id, { id, name: id })
  })
  return Array.from(groups.values()).sort((a, b) => a.name.localeCompare(b.name, 'es'))
}

function getDefaultEntryValue(prizes, tipo) {
  const pricesKey = TYPE_TO_PRIZES_KEY[tipo]
  return prizes?.[pricesKey]?.entryPrice || prizes?.[pricesKey]?.singlePrice || 0
}

function loadPromoRelations() {
  try {
    const raw = localStorage.getItem(PROMO_RELATIONS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function getLocalPromoState(promoRelations, campaignId, participantName) {
  const campaignRelations = promoRelations?.[campaignId] || {}
  const directRelation = campaignRelations?.[participantName]
  if (directRelation?.mode === 'individual') {
    return { mode: 'individual', partners: [] }
  }

  const direct = directRelation?.partners || []
  if (direct.length > 0) return { mode: 'pair', partners: direct }

  const reverse = Object.entries(campaignRelations).find(([, relation]) =>
    relation?.mode !== 'individual' &&
    (relation?.partners || []).some((partner) => matchParticipantName(partner, participantName))
  )
  return reverse ? { mode: 'pair', partners: [reverse[0]] } : { mode: 'none', partners: [] }
}

function getRegistryPromoPartners(registry, participantName) {
  const directEntry = registry.find((participant) => matchParticipantName(participant.name, participantName)) || {}
  const direct = Array.isArray(directEntry.promoPartners) ? directEntry.promoPartners : []
  const reverse = registry
    .filter((participant) => (
      Array.isArray(participant?.promoPartners) &&
      participant.promoPartners.some((partner) => matchParticipantName(partner, participantName))
    ))
    .map((participant) => participant.name)
  return uniqueTextValues([...direct, ...reverse])
}

function countPromoPairs(participants) {
  const pairs = new Set()
  participants.forEach((participant) => {
    if (!participant.hasPromoPair) return
    const partner = participant.promoPartners.find((candidate) =>
      participants.some((other) => matchParticipantName(other.name, candidate) && other.hasPromoPair)
    )
    if (!partner) return
    pairs.add([normalizeText(participant.name), normalizeText(partner)].sort().join('::'))
  })
  return pairs.size
}

function getCampaignGroupId(campaign) {
  return String(campaign?.groupId || campaign?.group || '').trim()
}

function getGroupName(groupOptions, groupId) {
  if (!groupId) return 'Sin grupo'
  return groupOptions.find((group) => group.id === groupId)?.name || groupId
}

function isCampaignActiveForDate(campaign, date, appData) {
  return isCampaignActiveForDateShared({ ...campaign, type: campaign.tipo }, date, appData)
}

function normalizePayout(payout) {
  return {
    firstPct: clampPercent(payout?.firstPct, DEFAULT_PAYOUT.firstPct),
    secondPct: clampPercent(payout?.secondPct, DEFAULT_PAYOUT.secondPct),
    thirdPct: clampPercent(payout?.thirdPct, DEFAULT_PAYOUT.thirdPct),
    adminPct: clampPercent(payout?.adminPct, DEFAULT_PAYOUT.adminPct),
  }
}

function clampPercent(value, fallback = 0) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return fallback
  return Math.max(0, Math.min(100, Math.round(numeric * 1_000_000) / 1_000_000))
}

function hasVisiblePrizeRow(row) {
  return Number(row?.percent || 0) > 0 && Number(row?.amount || 0) > 0
}

function uniqueTextValues(values) {
  const seen = new Set()
  return (values || [])
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .filter((value) => {
      const key = normalizeText(value)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function matchParticipantName(left, right) {
  return normalizeText(left) === normalizeText(right)
}

function typeOrder(tipo) {
  return tipo === 'diaria' ? 1 : 2
}

function formatCurrency(value) {
  return `$${Math.round(Number(value || 0)).toLocaleString('es-CL')}`
}

function formatPercent(value) {
  return Number(value || 0).toLocaleString('es-CL', {
    minimumFractionDigits: Number.isInteger(Number(value || 0)) ? 0 : 1,
    maximumFractionDigits: 2,
  })
}

function formatDateForDisplay(value) {
  if (!value) return ''
  const [year, month, day] = String(value).split('-')
  if (!year || !month || !day) return value
  return `${day}-${month}-${year}`
}

function formatPrizeText(summary) {
  return [
    `Grupo: ${summary.groupName}`,
    `Fecha: ${summary.date}`,
    '',
    `Polla ${summary.typeLabel}: ${summary.campaign.name}`,
    `Participantes: ${summary.participants.length}`,
    `Pozo bruto: ${formatCurrency(summary.grossPool)}`,
    `Administración: ${formatCurrency(summary.adminAmount)}`,
    `Pozo a repartir: ${formatCurrency(summary.netPool)}`,
    '',
    ...summary.payoutRows.map((row) => `${row.label}: ${formatCurrency(row.amount)}`),
  ].join('\n')
}

function formatGroupPrizeText(groupName, date, summaries) {
  return [
    `Grupo: ${groupName}`,
    `Fecha: ${date}`,
    '',
    ...summaries.flatMap((summary) => [
      `Polla ${summary.typeLabel}: ${summary.campaign.name}`,
      ...summary.payoutRows.map((row) => `${row.label}: ${formatCurrency(row.amount)}`),
      '',
    ]),
  ].join('\n').trim()
}
