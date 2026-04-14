/**
 * ThemeSelector.jsx
 *
 * Selector de tema visual para campañas.
 * Se usa dentro del CampaignWizard o edición de campañas.
 */

import React from 'react'
import { THEME_PRESETS, DEFAULT_THEME } from '../context/ThemeContext'
import styles from './ThemeSelector.module.css'

const PRESET_KEYS = Object.keys(THEME_PRESETS)

export default function ThemeSelector({ value, onChange }) {
  const currentTheme = typeof value === 'string' ? THEME_PRESETS[value] || DEFAULT_THEME : { ...DEFAULT_THEME, ...value }

  return (
    <div className={styles.themeSelector}>
      <label className={styles.label}>Tema visual</label>

      {/* Presets */}
      <div className={styles.presetGrid}>
        {PRESET_KEYS.map(key => {
          const preset = THEME_PRESETS[key]
          const isSelected = value === key
          return (
            <button
              key={key}
              className={`${styles.presetBtn} ${isSelected ? styles.selected : ''}`}
              onClick={() => onChange(key)}
            >
              <div className={styles.preview} style={{
                background: preset.background,
                borderColor: preset.primary,
              }}>
                <div className={styles.previewBar} style={{ background: preset.primary }} />
                <div className={styles.previewDots}>
                  <span style={{ background: preset.qualified }} />
                  <span style={{ background: preset.featured }} />
                  <span style={{ background: preset.eliminated }} />
                </div>
              </div>
              <span className={styles.presetLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
            </button>
          )
        })}
      </div>

      {/* Preview en vivo */}
      <div className={styles.livePreview} style={{
        background: currentTheme.surface,
        color: currentTheme.text,
        borderColor: currentTheme.border,
      }}>
        <div className={styles.previewHeader} style={{ borderBottom: `1px solid ${currentTheme.border}` }}>
          <span className={styles.previewTitle} style={{ color: currentTheme.text }}>Vista previa</span>
          <span className={styles.previewBadge} style={{
            background: currentTheme.primary + '20',
            color: currentTheme.primary,
          }}>
            Activa
          </span>
        </div>
        <div className={styles.previewRow}>
          <span className={styles.previewMedal}>🥇</span>
          <span className={styles.previewName} style={{ color: currentTheme.text }}>Stud Alpha</span>
          <span className={styles.previewScore} style={{ color: currentTheme.primary }}>1,240</span>
          <span className={`${styles.previewBadge} ${styles.qualified}`} style={{
            background: currentTheme.qualified + '20',
            color: currentTheme.qualified,
          }}>
            Clasificado
          </span>
        </div>
        <div className={styles.previewRow}>
          <span className={styles.previewMedal}>🥈</span>
          <span className={styles.previewName} style={{ color: currentTheme.text }}>Stud Beta</span>
          <span className={styles.previewScore} style={{ color: currentTheme.primary }}>1,180</span>
          <span className={`${styles.previewBadge} ${styles.pending}`} style={{
            background: currentTheme.pending + '20',
            color: currentTheme.pending,
          }}>
            En carrera
          </span>
        </div>
      </div>
    </div>
  )
}
