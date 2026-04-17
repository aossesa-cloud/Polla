import React, { useMemo } from 'react'
import ColorPicker from '../tables/ColorPicker'
import ExportPreview from '../tables/ExportPreview'
import { getExportStylesArray } from '../../services/exportStyles'
import { getRankingThemeOptions, getRankingPreviewTheme } from '../../services/campaignStyles'
import styles from './CampaignStyleStep.module.css'

const COLOR_FIELDS = [
  { key: 'primary', label: 'Primario' },
  { key: 'secondary', label: 'Secundario' },
  { key: 'accent', label: 'Acento' },
  { key: 'background', label: 'Fondo' },
  { key: 'surface', label: 'Filas / tarjetas' },
  { key: 'text', label: 'Texto' },
  { key: 'highlight', label: 'Highlights' },
  { key: 'top1', label: 'Top 1' },
  { key: 'top2', label: 'Top 2' },
  { key: 'top3', label: 'Top 3' },
]

const PNG_CUSTOM_FIELDS = [
  ['headerBg', 'Fondo Header'],
  ['headerText', 'Texto Header'],
  ['pickBg', 'Fondo Picks'],
  ['pickText', 'Texto Picks'],
  ['divBg', 'Fondo Dividendos'],
  ['divText', 'Texto Dividendos'],
  ['bg', 'Fondo General'],
  ['pointsText', 'Texto Puntos'],
  ['rowNumBg', 'Fondo N°'],
  ['rowNumText', 'Texto N°'],
]

export default function CampaignStyleStep({ form, updateForm }) {
  const rankingOptions = useMemo(() => getRankingThemeOptions(), [])
  const pngOptions = useMemo(() => getExportStylesArray(), [])
  const previewTheme = useMemo(
    () => getRankingPreviewTheme(form.rankingTheme, form.styleColors),
    [form.rankingTheme, form.styleColors]
  )

  const handleStyleColorChange = (key, value) => {
    updateForm({
      styleColors: {
        ...form.styleColors,
        [key]: value,
      },
    })
  }

  const handlePngColorChange = (key, value) => {
    updateForm({
      pngCustomColors: {
        ...form.pngCustomColors,
        [key]: value,
      },
    })
  }

  return (
    <div className={styles.styleStep}>
      <div className={styles.block}>
        <div className={styles.blockHeader}>
          <div>
            <h3 className={styles.blockTitle}>Estilo de Ranking</h3>
            <p className={styles.blockHint}>Cada campaña puede tener su propia identidad visual en ranking.</p>
          </div>
        </div>

        <div className={styles.themeGrid}>
          {rankingOptions.map((option) => {
            const theme = option.theme
            const selected = form.rankingTheme === option.id
            return (
              <button
                key={option.id}
                type="button"
                className={`${styles.themeCard} ${selected ? styles.selected : ''}`}
                onClick={() => updateForm({ rankingTheme: option.id })}
              >
                <div className={styles.themePreview} style={{ background: theme.background, borderColor: theme.primary }}>
                  <div className={styles.themePreviewBar} style={{ background: theme.primary }} />
                  <div className={styles.themePreviewBody} style={{ background: theme.surface }}>
                    <span style={{ background: theme.top1 }} />
                    <span style={{ background: theme.top2 }} />
                    <span style={{ background: theme.top3 }} />
                  </div>
                </div>
                <span className={styles.themeName}>{option.name}</span>
                <span className={styles.themeDesc}>{option.description}</span>
              </button>
            )
          })}
        </div>

        <div className={styles.previewCard} style={{ background: previewTheme.surface, color: previewTheme.text, borderColor: previewTheme.border }}>
          <div className={styles.previewHeader}>
            <div>
              <strong>Vista previa Ranking</strong>
              <p>Así se vería el top y la tabla para esta campaña.</p>
            </div>
            <span className={styles.previewBadge} style={{ background: `${previewTheme.highlight}22`, color: previewTheme.highlight }}>
              {rankingOptions.find((option) => option.id === form.rankingTheme)?.name}
            </span>
          </div>

          <div className={styles.previewTopGrid}>
            {[previewTheme.top1, previewTheme.top2, previewTheme.top3].map((color, index) => (
              <div key={index} className={styles.previewTopCard} style={{ background: `linear-gradient(160deg, ${hexToRgba(color, 0.28)}, ${hexToRgba(color, 0.06)})` }}>
                <span className={styles.previewPlace}>{index + 1}°</span>
                <strong>{['EL CAPO', 'PASASTE BANDIDO', 'REGALON 6 AÑOS'][index]}</strong>
                <span>{['162,6 pts', '64,3 pts', '49,1 pts'][index]}</span>
              </div>
            ))}
          </div>

          <div className={styles.previewRows}>
            {[
              ['4', 'MANZOR', '48,6', '-114'],
              ['5', 'TOCOCO', '47,2', '-115,4'],
            ].map((row) => (
              <div key={row[0]} className={styles.previewRow} style={{ borderColor: previewTheme.border }}>
                <span>{row[0]}</span>
                <span>{row[1]}</span>
                <span>{row[2]}</span>
                <span>{row[3]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.block}>
        <div className={styles.blockHeader}>
          <div>
            <h3 className={styles.blockTitle}>Estilo Exportación PNG</h3>
            <p className={styles.blockHint}>Se guarda por campaña y se aplica automáticamente al exportar.</p>
          </div>
        </div>

        <div className={styles.themeGrid}>
          {pngOptions.map((option) => {
            const selected = form.pngTheme === option.id
            return (
              <button
                key={option.id}
                type="button"
                className={`${styles.themeCard} ${selected ? styles.selected : ''}`}
                onClick={() => updateForm({ pngTheme: option.id })}
              >
                <div className={styles.pngPreview}>
                  <div className={styles.pngEmoji}>{option.preview || 'IMG'}</div>
                  <span className={styles.themeName}>{option.name}</span>
                </div>
                <span className={styles.themeDesc}>{option.description}</span>
              </button>
            )
          })}
        </div>

        {form.pngTheme === 'custom' && (
          <div className={styles.colorGrid}>
            {PNG_CUSTOM_FIELDS.map(([key, label]) => (
              <div key={key} className={styles.colorField}>
                <label className={styles.colorLabel}>{label}</label>
                <ColorPicker value={form.pngCustomColors?.[key]} onChange={(value) => handlePngColorChange(key, value)} />
              </div>
            ))}
          </div>
        )}

        <ExportPreview
          colors={form.pngCustomColors}
          exportStyle={form.pngTheme}
        />
      </div>

      <div className={styles.block}>
        <div className={styles.blockHeader}>
          <div>
            <h3 className={styles.blockTitle}>Colores del Ranking</h3>
            <p className={styles.blockHint}>Opcional. Este bloque ajusta el ranking de la campaña y no cambia la exportación PNG.</p>
          </div>
        </div>

        <div className={styles.colorGrid}>
          {COLOR_FIELDS.map((field) => (
            <div key={field.key} className={styles.colorField}>
              <label className={styles.colorLabel}>{field.label}</label>
              <ColorPicker
                value={form.styleColors?.[field.key] || ''}
                onChange={(value) => handleStyleColorChange(field.key, value)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function hexToRgba(hex, alpha) {
  if (!hex || typeof hex !== 'string') return `rgba(255,255,255,${alpha})`
  const normalized = hex.replace('#', '')
  const value = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized
  const int = Number.parseInt(value, 16)
  const r = (int >> 16) & 255
  const g = (int >> 8) & 255
  const b = int & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
