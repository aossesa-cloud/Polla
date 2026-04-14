import React, { useState } from 'react'
import styles from './Settings.module.css'

const TEMAS_PRESET = {
  oscuro: {
    nombre: 'Oscuro (Default)',
    bgPrimary: '#0a0e17',
    bgCard: '#1a2235',
    accent: '#3b82f6',
    textPrimary: '#f1f5f9',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444'
  },
  claro: {
    nombre: 'Claro',
    bgPrimary: '#f8fafc',
    bgCard: '#ffffff',
    accent: '#2563eb',
    textPrimary: '#1e293b',
    success: '#059669',
    warning: '#d97706',
    danger: '#dc2626'
  },
  azul: {
    nombre: 'Azul Noche',
    bgPrimary: '#0c1929',
    bgCard: '#162d4a',
    accent: '#60a5fa',
    textPrimary: '#e2e8f0',
    success: '#34d399',
    warning: '#fbbf24',
    danger: '#f87171'
  },
  verde: {
    nombre: 'Verde Bosque',
    bgPrimary: '#0a1a0f',
    bgCard: '#1a2e1a',
    accent: '#4ade80',
    textPrimary: '#e2e8f0',
    success: '#22c55e',
    warning: '#facc15',
    danger: '#ef4444'
  }
}

const FONT_SIZES = {
  pequeno: { label: 'Pequeño', tableHeader: 10, pickNumero: 26, jugadorNombre: 12, jugadorPts: 16 },
  normal: { label: 'Normal', tableHeader: 11, pickNumero: 30, jugadorNombre: 13, jugadorPts: 18 },
  grande: { label: 'Grande', tableHeader: 12, pickNumero: 34, jugadorNombre: 15, jugadorPts: 20 }
}

export default function Settings() {
  const [temaActivo, setTemaActivo] = useState('oscuro')
  const [tamanoFuente, setTamanoFuente] = useState('normal')
  const [colorPersonalizado, setColorPersonalizado] = useState('#3b82f6')

  const tema = TEMAS_PRESET[temaActivo]

  return (
    <div className={styles.settings}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Configuración de Estilos</h1>
          <p className={styles.subtitle}>Personaliza colores y tamaño de las tablas</p>
        </div>
      </header>

      <div className={styles.layout}>
        {/* Temas */}
        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>🎨 Temas Predefinidos</h2>
          <div className={styles.temasGrid}>
            {Object.entries(TEMAS_PRESET).map(([key, t]) => (
              <button
                key={key}
                className={`${styles.temaCard} ${temaActivo === key ? styles.active : ''}`}
                onClick={() => setTemaActivo(key)}
              >
                <div className={styles.temaPreview} style={{ background: t.bgPrimary }}>
                  <div className={styles.temaBar} style={{ background: t.accent }}></div>
                  <div className={styles.temaDots}>
                    <span style={{ background: t.success }}></span>
                    <span style={{ background: t.warning }}></span>
                    <span style={{ background: t.danger }}></span>
                  </div>
                </div>
                <span className={styles.temaNombre}>{t.nombre}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Color personalizado */}
        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>🖌️ Color de Acento</h2>
          <div className={styles.colorSection}>
            <div className={styles.colorPreview}>
              <input
                type="color"
                value={colorPersonalizado}
                onChange={(e) => setColorPersonalizado(e.target.value)}
                className={styles.colorPicker}
              />
              <div className={styles.colorInfo}>
                <span className={styles.colorLabel}>Color seleccionado</span>
                <span className={styles.colorHex} style={{ color: colorPersonalizado }}>{colorPersonalizado}</span>
              </div>
            </div>
            <div className={styles.colorSamples}>
              {['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#84cc16'].map(c => (
                <button
                  key={c}
                  className={`${styles.colorSample} ${colorPersonalizado === c ? styles.active : ''}`}
                  style={{ background: c }}
                  onClick={() => setColorPersonalizado(c)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Tamaño de fuente */}
        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>📏 Tamaño de Fuente</h2>
          <div className={styles.fontSection}>
            {Object.entries(FONT_SIZES).map(([key, fs]) => (
              <button
                key={key}
                className={`${styles.fontOption} ${tamanoFuente === key ? styles.active : ''}`}
                onClick={() => setTamanoFuente(key)}
              >
                <span className={styles.fontOptionName}>{fs.label}</span>
                <span className={styles.fontOptionPreview} style={{ fontSize: fs.pickNumero + 'px' }}>
                  3
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Preview en vivo */}
        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>👁️ Vista Previa</h2>
          <div className={styles.previewContainer} style={{ background: tema.bgPrimary }}>
            <div className={styles.previewHeader} style={{ background: tema.bgCard }}>
              <span className={styles.previewTitle} style={{ color: tema.textPrimary }}>Polla Hípica</span>
              <div className={styles.previewBadge} style={{ background: tema.accent + '20', color: tema.accent }}>
                Ranking
              </div>
            </div>
            <div className={styles.previewRow} style={{ background: tema.bgCard }}>
              <span className={styles.previewMedal}>🥇</span>
              <span className={styles.previewNombre} style={{ color: tema.textPrimary, fontSize: FONT_SIZES[tamanoFuente].jugadorNombre + 'px' }}>Carlos M.</span>
              <span className={styles.previewPts} style={{ color: colorPersonalizado, fontSize: FONT_SIZES[tamanoFuente].jugadorPts + 'px' }}>160</span>
            </div>
            <div className={styles.previewRow} style={{ background: tema.bgCard }}>
              <span className={styles.previewMedal}>🥈</span>
              <span className={styles.previewNombre} style={{ color: tema.textPrimary, fontSize: FONT_SIZES[tamanoFuente].jugadorNombre + 'px' }}>Roberto S.</span>
              <span className={styles.previewPts} style={{ color: colorPersonalizado, fontSize: FONT_SIZES[tamanoFuente].jugadorPts + 'px' }}>140</span>
            </div>
            <div className={styles.previewRow} style={{ background: tema.bgCard }}>
              <span className={styles.previewPick} style={{ fontSize: FONT_SIZES[tamanoFuente].pickNumero + 'px' }}>3</span>
              <span className={styles.previewPick} style={{ fontSize: FONT_SIZES[tamanoFuente].pickNumero + 'px', color: tema.success }}>7</span>
              <span className={styles.previewPick} style={{ fontSize: FONT_SIZES[tamanoFuente].pickNumero + 'px' }}>1</span>
              <span className={styles.previewPick} style={{ fontSize: FONT_SIZES[tamanoFuente].pickNumero + 'px', color: tema.success }}>9</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
