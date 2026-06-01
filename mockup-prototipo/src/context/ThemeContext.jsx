/**
 * ThemeContext.jsx
 *
 * Contexto de theming dinámico por campaña.
 * Inyecta CSS variables según el theme de la campaña activa.
 *
 * Uso:
 *   <ThemeProvider theme={campaign.theme}>
 *     <CualquierComponente />
 *   </ThemeProvider>
 *
 * O con hook:
 *   const { colors, mode } = useTheme()
 */

import React, { createContext, useContext, useMemo, useEffect } from 'react'
import { resolveCampaignTheme } from '../services/campaignStyles'

// Theme por defecto (dark)
export const DEFAULT_THEME = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  background: '#0a0e17',
  surface: '#1a2235',
  surfaceHover: '#243049',
  text: '#f1f5f9',
  textMuted: '#64748b',
  border: 'rgba(255, 255, 255, 0.08)',
  // Estados
  qualified: '#10b981',
  eliminated: '#ef4444',
  featured: '#f59e0b',
  pending: '#6b7280',
  // Modo
  mode: 'dark',
  // Opcional
  logo: null,
  fontFamily: 'system-ui, -apple-system, sans-serif',
}

// Theme claro predefinido
export const LIGHT_THEME = {
  ...DEFAULT_THEME,
  background: '#f8fafc',
  surface: '#ffffff',
  surfaceHover: '#f1f5f9',
  text: '#1e293b',
  textMuted: '#94a3b8',
  border: 'rgba(0, 0, 0, 0.1)',
  mode: 'light',
}

// Mapa de temas por modo
export const THEME_PRESETS = {
  dark: DEFAULT_THEME,
  light: LIGHT_THEME,
  azul: { ...DEFAULT_THEME, primary: '#60a5fa', secondary: '#818cf8', surface: '#0c1929' },
  verde: { ...DEFAULT_THEME, primary: '#4ade80', secondary: '#22c55e', surface: '#0a1a0f' },
  rojo: { ...DEFAULT_THEME, primary: '#f87171', secondary: '#f472b6', surface: '#1a0a0a' },
  naranja: { ...DEFAULT_THEME, primary: '#fb923c', secondary: '#fbbf24' },
}

const ThemeContext = createContext(null)

function normalizeHexColor(value, fallback = '#000000') {
  if (!value || typeof value !== 'string') return fallback
  const trimmed = value.trim()
  const short = trimmed.match(/^#([0-9a-f]{3})$/i)
  if (short) {
    return `#${short[1].split('').map((char) => char + char).join('')}`.toUpperCase()
  }
  if (/^#[0-9a-f]{6}$/i.test(trimmed)) return trimmed.toUpperCase()
  return fallback
}

function mixHexColor(color, mixWith, weight) {
  const base = normalizeHexColor(color, null)
  const target = normalizeHexColor(mixWith, null)
  if (!base || !target) return normalizeHexColor(color, '#111111')

  const baseInt = Number.parseInt(base.slice(1), 16)
  const targetInt = Number.parseInt(target.slice(1), 16)
  const ratio = Math.max(0, Math.min(1, weight))
  const r = Math.round((((baseInt >> 16) & 255) * ratio) + (((targetInt >> 16) & 255) * (1 - ratio)))
  const g = Math.round((((baseInt >> 8) & 255) * ratio) + (((targetInt >> 8) & 255) * (1 - ratio)))
  const b = Math.round(((baseInt & 255) * ratio) + ((targetInt & 255) * (1 - ratio)))

  return `#${[r, g, b].map((part) => part.toString(16).padStart(2, '0')).join('')}`.toUpperCase()
}

function setRankingPrizeVariables(root, position, color, fallback) {
  const prizeColor = normalizeHexColor(color, fallback)
  root.style.setProperty(`--ranking-prize${position}`, prizeColor)
  root.style.setProperty(`--ranking-prize${position}-light`, mixHexColor(prizeColor, '#FFFFFF', 0.38))
  root.style.setProperty(`--ranking-prize${position}-dark`, mixHexColor(prizeColor, '#000000', 0.92))
}

/**
 * Aplica CSS variables al root del documento.
 * Incluye tanto las variables del tema como los aliases de compatibilidad.
 */
function applyCssVariables(theme) {
  const root = document.documentElement
  // Variables del tema
  root.style.setProperty('--theme-primary', theme.primary)
  root.style.setProperty('--theme-secondary', theme.secondary)
  root.style.setProperty('--theme-bg', theme.background)
  root.style.setProperty('--theme-surface', theme.surface)
  root.style.setProperty('--theme-surface-hover', theme.surfaceHover)
  root.style.setProperty('--theme-text', theme.text)
  root.style.setProperty('--theme-text-muted', theme.textMuted)
  root.style.setProperty('--theme-border', theme.border)
  root.style.setProperty('--theme-qualified', theme.qualified)
  root.style.setProperty('--theme-eliminated', theme.eliminated)
  root.style.setProperty('--theme-featured', theme.featured)
  root.style.setProperty('--theme-pending', theme.pending)
  root.style.setProperty('--theme-font', theme.fontFamily)
  root.style.setProperty('--ranking-highlight', theme.highlight || theme.primary)
  root.style.setProperty('--ranking-top1', theme.top1 || theme.featured)
  root.style.setProperty('--ranking-top2', theme.top2 || theme.secondary)
  root.style.setProperty('--ranking-top3', theme.top3 || theme.primary)
  setRankingPrizeVariables(root, 1, theme.prize1 || theme.top1 || theme.featured, '#111111')
  setRankingPrizeVariables(root, 2, theme.prize2 || theme.top2 || theme.secondary, '#3F4654')
  setRankingPrizeVariables(root, 3, theme.prize3 || theme.top3 || theme.primary, '#7C2D12')
  root.style.setProperty('--ranking-sheet-header-bg', theme.sheetHeaderBg || '#ffffff')
  root.style.setProperty('--ranking-sheet-header-text', theme.sheetHeaderText || '#000000')
  root.style.setProperty('--ranking-sheet-body-from', theme.sheetBodyFrom || '#ffe39a')
  root.style.setProperty('--ranking-sheet-body-to', theme.sheetBodyTo || '#f6bd83')
  root.style.setProperty('--ranking-sheet-body-text', theme.sheetBodyText || '#000000')
  root.style.setProperty('--ranking-sheet-position-bg', theme.sheetPositionBg || '#ff1515')
  root.style.setProperty('--ranking-sheet-position-text', theme.sheetPositionText || '#000000')
  root.style.setProperty('--ranking-sheet-qualified-bg', theme.sheetQualifiedBg || '#00b050')
  root.style.setProperty('--ranking-sheet-qualified-text', theme.sheetQualifiedText || '#000000')
  root.style.setProperty('--ranking-sheet-eliminated-bg', theme.sheetEliminatedBg || '#9f5c83')
  root.style.setProperty('--ranking-sheet-eliminated-text', theme.sheetEliminatedText || '#ffffff')
  root.style.setProperty('--ranking-sheet-prize-text', theme.sheetPrizeText || '#ffffff')
  root.style.setProperty('--ranking-sheet-border', theme.sheetBorder || '#5f6368')
  root.style.setProperty('--ranking-sheet-card-bg', theme.sheetCardBg || '#eeeeee')
  root.style.setProperty('--ranking-sheet-prono-header-bg', theme.sheetPronoHeaderBg || '#05245f')
  root.style.setProperty('--ranking-sheet-prono-header-text', theme.sheetPronoHeaderText || '#ffffff')
  root.style.setProperty('--ranking-sheet-pick-bg', theme.sheetPickBg || '#efefef')
  root.style.setProperty('--ranking-sheet-pick-text', theme.sheetPickText || '#2f343b')
  root.dataset.themeMode = theme.mode || 'dark'

  // Aliases de compatibilidad para CSS modules existentes
  root.style.setProperty('--text-primary', theme.text)
  root.style.setProperty('--text-secondary', theme.textMuted)
  root.style.setProperty('--text-muted', theme.textMuted)
  root.style.setProperty('--bg-primary', theme.background)
  root.style.setProperty('--bg-secondary', theme.surface)
  root.style.setProperty('--bg-tertiary', theme.surface)
  root.style.setProperty('--bg-card', theme.surface)
  root.style.setProperty('--bg-hover', theme.surfaceHover)
  root.style.setProperty('--border', theme.border)
  root.style.setProperty('--border-light', theme.border)
  root.style.setProperty('--accent', theme.primary)
  root.style.setProperty('--accent-hover', theme.primary)
  root.style.setProperty('--accent-glow', theme.primary + '25')
  root.style.setProperty('--success', theme.qualified)
  root.style.setProperty('--danger', theme.eliminated)
  root.style.setProperty('--warning', theme.featured)
}

/**
 * Resuelve un theme: aplica preset si es string, mergea con defaults.
 */
function resolveTheme(input) {
  if (!input) return DEFAULT_THEME

  // Si es string, buscar preset
  if (typeof input === 'string') {
    return { ...DEFAULT_THEME, ...(THEME_PRESETS[input] || {}) }
  }

  // Si es objeto, mergear con defaults
  return { ...DEFAULT_THEME, ...input }
}

export function ThemeProvider({ theme, children }) {
  const resolvedTheme = useMemo(() => resolveTheme(theme), [theme])

  useEffect(() => {
    applyCssVariables(resolvedTheme)
    return () => {
      // Cleanup: restaurar defaults al desmontar
      applyCssVariables(DEFAULT_THEME)
    }
  }, [resolvedTheme])

  const contextValue = useMemo(() => ({
    colors: resolvedTheme,
    mode: resolvedTheme.mode,
    isDark: resolvedTheme.mode === 'dark',
    isLight: resolvedTheme.mode === 'light',
  }), [resolvedTheme])

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  return ctx || { colors: DEFAULT_THEME, mode: 'dark', isDark: true, isLight: false }
}

/**
 * Hook para obtener un color específico del theme.
 * Útil para componentes que necesitan un solo color.
 */
export function useThemeColor(colorName) {
  const { colors } = useTheme()
  return colors[colorName] || DEFAULT_THEME[colorName] || colorName
}

/**
 * HOC que envuelve un componente con ThemeProvider.
 * Útil para aplicar theme desde datos de campaña.
 */
export function withCampaignTheme(Component) {
  return function ThemedComponent({ campaign, ...props }) {
    const theme = resolveCampaignTheme(campaign || campaign?.settings || {})
    return (
      <ThemeProvider theme={theme}>
        <Component campaign={campaign} {...props} />
      </ThemeProvider>
    )
  }
}
