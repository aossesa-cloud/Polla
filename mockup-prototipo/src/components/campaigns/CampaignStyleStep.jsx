import React, { useEffect, useMemo, useState } from 'react'
import { getExportStyleColors, getExportStylesArray } from '../../services/exportStyles'
import {
  getRankingPreviewTheme,
} from '../../services/campaignStyles'
import styles from './CampaignStyleStep.module.css'

const APPEARANCE_OPTIONS = [
  {
    id: 'whatsapp',
    name: 'WhatsApp claro',
    description: 'Legible para enviar',
    rankingTheme: 'claro-minimalista',
    pngTheme: 'excel-classic',
    swatches: ['#eef2ff', '#2563eb', '#f59e0b', '#ffffff'],
  },
  {
    id: 'competition',
    name: 'Competencia',
    description: 'Ranking deportivo',
    rankingTheme: 'azul-deportivo',
    pngTheme: 'compact-dense',
    swatches: ['#081525', '#38bdf8', '#facc15', '#10233d'],
  },
  {
    id: 'classic',
    name: 'Hipodromo clasico',
    description: 'Look tradicional',
    rankingTheme: 'verde-turf',
    pngTheme: 'hipodromo-classic',
    swatches: ['#07140c', '#22c55e', '#facc15', '#112218'],
  },
  {
    id: 'dark',
    name: 'Pantalla oscura',
    description: 'Premium oscuro',
    rankingTheme: 'dark-pro',
    pngTheme: 'blue-premium',
    swatches: ['#0a0f1c', '#3b82f6', '#fbbf24', '#1b2438'],
  },
  {
    id: 'custom',
    name: 'Personalizado',
    description: 'Ajustar colores',
    rankingTheme: 'custom',
    pngTheme: 'custom',
    swatches: ['#140b07', '#fb923c', '#111111', '#ffe39a'],
  },
]

const SCREEN_COLOR_GROUPS = [
  {
    title: 'Base del ranking',
    hint: 'Paneles, textos y acentos dentro del sistema.',
    fields: [
      { key: 'primary', label: 'Principal' },
      { key: 'secondary', label: 'Secundario' },
      { key: 'accent', label: 'Acento' },
      { key: 'background', label: 'Fondo' },
      { key: 'surface', label: 'Paneles' },
      { key: 'text', label: 'Texto' },
    ],
  },
  {
    title: 'Tabla ranking',
    hint: 'La tabla que se copia o descarga con el banner.',
    fields: [
      { key: 'sheetHeaderBg', label: 'Encabezado' },
      { key: 'sheetHeaderText', label: 'Texto encabezado' },
      { key: 'sheetBodyFrom', label: 'Fila inicio' },
      { key: 'sheetBodyTo', label: 'Fila fin' },
      { key: 'sheetBodyText', label: 'Texto filas' },
      { key: 'sheetPositionBg', label: 'Columna L' },
      { key: 'sheetPositionText', label: 'Texto L' },
      { key: 'sheetBorder', label: 'Lineas' },
      { key: 'sheetPronoHeaderBg', label: 'Header prono' },
      { key: 'sheetPronoHeaderText', label: 'Texto prono' },
      { key: 'sheetPickBg', label: 'Celdas prono' },
      { key: 'sheetPickText', label: 'Texto celdas' },
    ],
  },
  {
    title: 'Premios',
    hint: 'Solo se aplican a los lugares que tengan premio configurado.',
    fields: [
      { key: 'prize1', label: '1er premio' },
      { key: 'prize2', label: '2do premio' },
      { key: 'prize3', label: '3er premio' },
      { key: 'sheetPrizeText', label: 'Texto premios' },
      { key: 'sheetQualifiedBg', label: 'Clasificado' },
      { key: 'sheetEliminatedBg', label: 'Eliminado' },
    ],
  },
]

const PNG_CUSTOM_FIELDS = [
  ['headerBg', 'Encabezado'],
  ['headerText', 'Texto encabezado'],
  ['pickBg', 'Celdas picks'],
  ['pickText', 'Texto picks'],
  ['divBg', 'Dividendos'],
  ['divText', 'Texto dividendos'],
  ['bg', 'Fondo general'],
  ['pointsText', 'Texto puntos'],
  ['rowNumBg', 'Columna N'],
  ['rowNumText', 'Texto N'],
]

const PREVIEW_DATA = [
  { pos: 1, name: 'MANZOR', pts: '177,8', diff: '' },
  { pos: 2, name: 'STORMILORD', pts: '173,3', diff: '4,5' },
  { pos: 3, name: 'ARRE DEMONIO', pts: '141,3', diff: '36,5' },
  { pos: 4, name: 'SIN FE-IA', pts: '87,7', diff: '90,1' },
  { pos: 5, name: 'KUME', pts: '78,6', diff: '99,2' },
  { pos: 6, name: 'BANDIDO CRACK', pts: '57,9', diff: '119,9' },
]

const PICKS_PREVIEW_DATA = [
  {
    pos: 1,
    name: 'MANZOR',
    points: '177,8',
    picks: ['5', '12', '3', '8', '1'],
    dividends: ['4,2', '', '12,6', '', ''],
  },
  {
    pos: 2,
    name: 'STORMILORD',
    points: '173,3',
    picks: ['2', '7', '9', '4', '11'],
    dividends: ['', '8,5', '', '', '6,1'],
  },
  {
    pos: 3,
    name: 'ARRE DEMONIO',
    points: '141,3',
    picks: ['6', '1', '5', '10', '2'],
    dividends: ['3,8', '', '', '15,2', ''],
  },
]

export default function CampaignStyleStep({ form, updateForm, prizeCount: prizeProp }) {
  const [activeTab, setActiveTab] = useState('screen')
  const [colorsOpen, setColorsOpen] = useState(false)

  const prizeCount = prizeProp ?? form.prizePositions ?? 3
  const pngThemeList = useMemo(() => getExportStylesArray(), [])
  const previewTheme = useMemo(
    () => getRankingPreviewTheme(form.rankingTheme, form.styleColors),
    [form.rankingTheme, form.styleColors]
  )
  const exportColors = useMemo(
    () => getExportStyleColors(form.pngTheme, form.pngCustomColors),
    [form.pngTheme, form.pngCustomColors]
  )

  const activeAppearanceId =
    APPEARANCE_OPTIONS.find(
      (option) => option.rankingTheme === form.rankingTheme && option.pngTheme === form.pngTheme
    )?.id ?? 'custom'

  useEffect(() => {
    if (activeAppearanceId === 'custom') setColorsOpen(true)
  }, [activeAppearanceId])

  const handleAppearanceSelect = (option) =>
    updateForm({ rankingTheme: option.rankingTheme, pngTheme: option.pngTheme })

  const handleColorChange = (key, value) =>
    updateForm({ styleColors: { ...(form.styleColors || {}), [key]: value } })

  const handlePngColorChange = (key, value) =>
    updateForm({ pngCustomColors: { ...(form.pngCustomColors || {}), [key]: value } })

  const handleResetColors = () => updateForm({ styleColors: {} })

  return (
    <div className={styles.styleWizard}>
      <div className={styles.tabBar} role="tablist">
        <button
          role="tab"
          type="button"
          aria-selected={activeTab === 'screen'}
          className={`${styles.tab} ${activeTab === 'screen' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('screen')}
        >
          Ranking
        </button>
        <button
          role="tab"
          type="button"
          aria-selected={activeTab === 'png'}
          className={`${styles.tab} ${activeTab === 'png' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('png')}
        >
          Pronosticos PNG
        </button>
      </div>

      <div className={styles.layout}>
        <div className={styles.controls}>
          {activeTab === 'screen' && (
            <>
              <section className={styles.panel}>
                <div className={styles.panelHeading}>
                  <div>
                    <h4 className={styles.panelTitle}>Formato rapido</h4>
                    <p>Elige una base y despues ajusta solo los colores necesarios.</p>
                  </div>
                  <button type="button" className={styles.btnGhost} onClick={handleResetColors}>
                    Restablecer colores
                  </button>
                </div>

                <div className={styles.appearanceList}>
                  {APPEARANCE_OPTIONS.map((option) => {
                    const active = option.id === activeAppearanceId
                    return (
                      <button
                        key={option.id}
                        type="button"
                        aria-pressed={active}
                        className={`${styles.appearanceRow} ${active ? styles.appearanceRowActive : ''}`}
                        onClick={() => handleAppearanceSelect(option)}
                      >
                        <span className={styles.radioRing} aria-hidden>
                          <span className={styles.radioDot} />
                        </span>
                        <span className={styles.appearanceSwatches}>
                          {option.swatches.map((color) => (
                            <span key={color} style={{ background: color }} />
                          ))}
                        </span>
                        <span className={styles.appearanceCopy}>
                          <strong>{option.name}</strong>
                          <small>{option.description}</small>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </section>

              <details
                className={styles.drawer}
                open={colorsOpen}
                onToggle={(event) => setColorsOpen(event.currentTarget.open)}
              >
                <summary className={styles.drawerSummary}>
                  <span>Colores personalizados</span>
                  <small>Base, tabla y premios en controles simples</small>
                </summary>
                <div className={styles.drawerBody}>
                  <div className={styles.compactColorGroups}>
                    {SCREEN_COLOR_GROUPS.map((group) => (
                      <section key={group.title} className={styles.colorGroup}>
                        <div className={styles.colorGroupHeader}>
                          <strong>{group.title}</strong>
                          <small>{group.hint}</small>
                        </div>
                        <div className={styles.compactColorGrid}>
                          {group.fields.map((field) => (
                            <CompactColorField
                              key={field.key}
                              label={field.label}
                              value={form.styleColors?.[field.key] || ''}
                              fallback={previewTheme[field.key]}
                              onChange={(value) => handleColorChange(field.key, value)}
                            />
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                </div>
              </details>
            </>
          )}

          {activeTab === 'png' && (
            <>
              <section className={styles.panel}>
                <h4 className={styles.panelTitle}>Estilo tabla pronosticos</h4>
                <div className={styles.pngThemeList}>
                  {pngThemeList.map((option) => {
                    const selected = form.pngTheme === option.id
                    const colors = getExportStyleColors(option.id, form.pngCustomColors)
                    return (
                      <button
                        key={option.id}
                        type="button"
                        className={`${styles.pngThemeRow} ${selected ? styles.pngThemeRowActive : ''}`}
                        onClick={() => updateForm({ pngTheme: option.id })}
                      >
                        <span className={styles.pngSwatches}>
                          <span style={{ background: colors.headerBg }} />
                          <span style={{ background: colors.pickBg }} />
                          <span style={{ background: colors.divBg }} />
                          <span style={{ background: colors.bg }} />
                        </span>
                        <span className={styles.appearanceCopy}>
                          <strong>{option.name}</strong>
                          <small>{option.description}</small>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </section>

              {form.pngTheme === 'custom' && (
                <details className={styles.drawer} open>
                  <summary className={styles.drawerSummary}>
                    <span>Colores personalizados pronosticos</span>
                    <small>Encabezado, picks, dividendos y celdas vacias</small>
                  </summary>
                  <div className={styles.drawerBody}>
                    <div className={styles.compactColorGrid}>
                      {PNG_CUSTOM_FIELDS.map(([key, label]) => (
                        <CompactColorField
                          key={key}
                          label={label}
                          value={form.pngCustomColors?.[key] || ''}
                          fallback={exportColors[key]}
                          onChange={(value) => handlePngColorChange(key, value)}
                        />
                      ))}
                    </div>
                  </div>
                </details>
              )}
            </>
          )}
        </div>

        <aside className={styles.previewColumn}>
          <div className={styles.previewSticky}>
            <p className={styles.previewLabel}>Vista previa</p>
            {activeTab === 'screen' ? (
              <SheetPreviewPanel theme={previewTheme} prizeCount={prizeCount} />
            ) : (
              <PicksPreviewPanel colors={exportColors} />
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

function CompactColorField({ label, value, fallback, onChange }) {
  const colorValue = toColorInputValue(value || fallback)
  const isCustom = Boolean(value)

  return (
    <label className={styles.compactColorField}>
      <span className={styles.compactColorCopy}>
        <strong>{label}</strong>
        <small>{isCustom ? 'Personalizado' : 'Preset'}</small>
      </span>
      <span className={styles.compactColorControl}>
        <input
          type="color"
          value={colorValue}
          aria-label={label}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
        />
        <span className={styles.colorCode}>{colorValue.toUpperCase()}</span>
        {isCustom && (
          <button
            type="button"
            className={styles.colorReset}
            aria-label={`Restablecer ${label}`}
            onClick={(event) => {
              event.preventDefault()
              onChange('')
            }}
          >
            Preset
          </button>
        )}
      </span>
    </label>
  )
}

function SheetPreviewPanel({ theme, prizeCount }) {
  return (
    <div className={styles.sheetPreview} style={{ borderColor: theme.sheetBorder, background: theme.sheetCardBg }}>
      <p className={styles.exportPreviewLabel} style={{ color: theme.sheetHeaderText }}>
        Tabla ranking
      </p>
      <div className={styles.sheetPreviewGrid} style={{ borderColor: theme.sheetBorder }}>
        {['L', 'STUD', 'TOTAL', 'Dif'].map((cell) => (
          <span
            key={cell}
            className={styles.sheetPreviewCell}
            style={{
              background: theme.sheetHeaderBg,
              color: theme.sheetHeaderText,
              borderColor: theme.sheetBorder,
            }}
          >
            {cell}
          </span>
        ))}

        {PREVIEW_DATA.slice(0, 5).map((row) => {
          const isPrize = row.pos <= prizeCount
          const prizeColor = getThemePrizeColor(theme, row.pos)
          const rowBackground = isPrize
            ? `linear-gradient(90deg, ${mixHex(prizeColor, '#FFFFFF', 0.38)} 0%, ${mixHex(prizeColor, '#000000', 0.92)} 100%)`
            : `linear-gradient(90deg, ${theme.sheetBodyFrom} 0%, ${theme.sheetBodyTo} 100%)`
          const rowText = isPrize ? theme.sheetPrizeText : theme.sheetBodyText
          const positionBackground = isPrize ? prizeColor : theme.sheetPositionBg
          const positionText = isPrize ? theme.sheetPrizeText : theme.sheetPositionText

          return (
            <React.Fragment key={row.pos}>
              <span
                className={styles.sheetPreviewCell}
                style={{ background: positionBackground, color: positionText, borderColor: theme.sheetBorder }}
              >
                {row.pos}
              </span>
              <span
                className={`${styles.sheetPreviewCell} ${styles.sheetPreviewName}`}
                style={{ background: rowBackground, color: rowText, borderColor: theme.sheetBorder }}
              >
                {row.name}
              </span>
              <span
                className={styles.sheetPreviewCell}
                style={{ background: rowBackground, color: rowText, borderColor: theme.sheetBorder }}
              >
                {row.pts}
              </span>
              <span
                className={styles.sheetPreviewCell}
                style={{ background: rowBackground, color: rowText, borderColor: theme.sheetBorder }}
              >
                {row.diff}
              </span>
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}

function PicksPreviewPanel({ colors }) {
  return (
    <div className={styles.exportPreview} style={{ background: colors.bg, borderColor: colors.tableBorder }}>
      <p className={styles.exportPreviewLabel} style={{ color: colors.titleText }}>
        Pronosticos PNG
      </p>
      <div className={styles.exportMiniTitle} style={{ color: colors.titleText }}>
        Tabla de Pronosticos
      </div>
      <div className={styles.exportGrid}>
        {['N', 'STUD', 'Puntos', '1', '2', '3', '4', '5'].map((cell) => (
          <span
            key={cell}
            className={styles.exportCell}
            style={{ background: colors.headerBg, color: colors.headerText, borderColor: colors.tableBorder }}
          >
            {cell}
          </span>
        ))}

        {PICKS_PREVIEW_DATA.map((row) => {
          return (
            <React.Fragment key={row.pos}>
              <span className={`${styles.exportCell} ${styles.exportCellSpanRows}`} style={{ background: colors.rowNumBg, color: colors.rowNumText, borderColor: colors.tableBorder }}>
                {row.pos}
              </span>
              <span className={`${styles.exportCell} ${styles.exportCellLeft} ${styles.exportCellSpanRows}`} style={{ background: colors.studBg, color: colors.studText, borderColor: colors.tableBorder }}>
                {row.name}
              </span>
              <span className={`${styles.exportCell} ${styles.exportCellSpanRows}`} style={{ background: colors.pointsBg, color: colors.pointsText, borderColor: colors.tableBorder }}>
                {row.points}
              </span>
              {row.picks.map((pick, index) => (
                <span key={`${row.pos}-pick-${index}`} className={styles.exportCell} style={{ background: colors.pickBg, color: colors.pickText, borderColor: colors.tableBorder }}>
                  {pick}
                </span>
              ))}
              {row.dividends.map((dividend, index) => (
                <span
                  key={`${row.pos}-dividend-${index}`}
                  className={styles.exportCell}
                  style={{
                    background: dividend ? colors.divBg : colors.emptyBg,
                    color: dividend ? colors.divText : 'transparent',
                    borderColor: colors.tableBorder,
                  }}
                >
                  {dividend || '-'}
                </span>
              ))}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}

function getThemePrizeColor(theme, position) {
  if (position === 1) return theme.prize1 || theme.top1 || '#FBBF24'
  if (position === 2) return theme.prize2 || theme.top2 || '#94A3B8'
  if (position === 3) return theme.prize3 || theme.top3 || '#D97706'
  return theme.highlight || theme.primary || '#38BDF8'
}

function toColorInputValue(value) {
  const fallback = '#FFFFFF'
  if (!value || typeof value !== 'string') return fallback
  const normalized = value.trim()
  const short = normalized.match(/^#([0-9a-f]{3})$/i)
  if (short) {
    return `#${short[1].split('').map((char) => char + char).join('')}`.toUpperCase()
  }
  if (/^#[0-9a-f]{6}$/i.test(normalized)) return normalized.toUpperCase()
  return fallback
}

function mixHex(hex, mixWith, weight) {
  const a = parseHex(hex)
  const b = parseHex(mixWith)
  if (!a || !b) return hex || mixWith
  const ratio = Math.max(0, Math.min(1, weight))
  const r = Math.round((a.r * ratio) + (b.r * (1 - ratio)))
  const g = Math.round((a.g * ratio) + (b.g * (1 - ratio)))
  const bValue = Math.round((a.b * ratio) + (b.b * (1 - ratio)))
  return `#${[r, g, bValue].map((part) => part.toString(16).padStart(2, '0')).join('')}`
}

function parseHex(hex) {
  if (!hex || typeof hex !== 'string') return null
  const value = toColorInputValue(hex).replace('#', '')
  const int = Number.parseInt(value, 16)
  if (!Number.isFinite(int)) return null
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  }
}
