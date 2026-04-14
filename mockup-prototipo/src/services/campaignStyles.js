const BASE_EXPORT_CUSTOM_COLORS = {
  bg: '#FFFFFF',
  headerBg: '#1F4E79',
  headerText: '#FFFFFF',
  pickBg: '#F4B183',
  pickBorder: '#E8913A',
  pickText: '#000000',
  divBg: '#2F5496',
  divText: '#FFFFFF',
  emptyBg: '#FFFFFF',
  emptyBorder: '#D9D9D9',
  studBg: '#FFFFFF',
  studBorder: '#D9D9D9',
  pointsBg: '#FFFFFF',
  pointsText: '#1F4E79',
  rowNumBg: '#1F4E79',
  rowNumText: '#FFFFFF',
}

export const RANKING_THEME_PRESETS = {
  'dark-pro': {
    id: 'dark-pro',
    name: 'Dark Pro',
    description: 'Oscuro premium, contraste alto y top 3 elegante.',
    theme: {
      primary: '#3b82f6',
      secondary: '#8b5cf6',
      background: '#0a0f1c',
      surface: '#1b2438',
      surfaceHover: '#25324c',
      text: '#f8fafc',
      textMuted: '#7f8ca8',
      border: 'rgba(148, 163, 184, 0.18)',
      qualified: '#22c55e',
      eliminated: '#ef4444',
      featured: '#f59e0b',
      pending: '#64748b',
      mode: 'dark',
      top1: '#fbbf24',
      top2: '#94a3b8',
      top3: '#d97706',
      highlight: '#38bdf8',
    },
  },
  'azul-deportivo': {
    id: 'azul-deportivo',
    name: 'Azul Deportivo',
    description: 'Azules intensos y look de scoreboard competitivo.',
    theme: {
      primary: '#38bdf8',
      secondary: '#2563eb',
      background: '#081525',
      surface: '#10233d',
      surfaceHover: '#163154',
      text: '#eff6ff',
      textMuted: '#8ea9c7',
      border: 'rgba(125, 211, 252, 0.2)',
      qualified: '#22c55e',
      eliminated: '#ef4444',
      featured: '#facc15',
      pending: '#64748b',
      mode: 'dark',
      top1: '#facc15',
      top2: '#cbd5e1',
      top3: '#fb923c',
      highlight: '#38bdf8',
    },
  },
  'verde-turf': {
    id: 'verde-turf',
    name: 'Verde Turf',
    description: 'Inspirado en pista y dividendos, con acentos verdes.',
    theme: {
      primary: '#22c55e',
      secondary: '#10b981',
      background: '#07140c',
      surface: '#112218',
      surfaceHover: '#173022',
      text: '#f0fdf4',
      textMuted: '#87a88f',
      border: 'rgba(110, 231, 183, 0.18)',
      qualified: '#34d399',
      eliminated: '#ef4444',
      featured: '#fbbf24',
      pending: '#64748b',
      mode: 'dark',
      top1: '#facc15',
      top2: '#cbd5e1',
      top3: '#fb923c',
      highlight: '#4ade80',
    },
  },
  'naranja-competitivo': {
    id: 'naranja-competitivo',
    name: 'Naranja Competitivo',
    description: 'Más agresivo, cálido y orientado a rendimiento.',
    theme: {
      primary: '#fb923c',
      secondary: '#f97316',
      background: '#140b07',
      surface: '#26160f',
      surfaceHover: '#352015',
      text: '#fff7ed',
      textMuted: '#c3a18e',
      border: 'rgba(251, 146, 60, 0.2)',
      qualified: '#22c55e',
      eliminated: '#ef4444',
      featured: '#fbbf24',
      pending: '#78716c',
      mode: 'dark',
      top1: '#facc15',
      top2: '#d6d3d1',
      top3: '#ea580c',
      highlight: '#fb923c',
    },
  },
  'claro-minimalista': {
    id: 'claro-minimalista',
    name: 'Claro Minimalista',
    description: 'Ligero, limpio y listo para reportes sobrios.',
    theme: {
      primary: '#2563eb',
      secondary: '#0ea5e9',
      background: '#eef2ff',
      surface: '#ffffff',
      surfaceHover: '#f8fafc',
      text: '#0f172a',
      textMuted: '#64748b',
      border: 'rgba(15, 23, 42, 0.12)',
      qualified: '#16a34a',
      eliminated: '#dc2626',
      featured: '#d97706',
      pending: '#94a3b8',
      mode: 'light',
      top1: '#f59e0b',
      top2: '#94a3b8',
      top3: '#c2410c',
      highlight: '#2563eb',
    },
  },
}

export const LEGACY_THEME_TO_RANKING = {
  dark: 'dark-pro',
  light: 'claro-minimalista',
  azul: 'azul-deportivo',
  verde: 'verde-turf',
  naranja: 'naranja-competitivo',
  rojo: 'naranja-competitivo',
}

export const LEGACY_RANKING_TO_THEME = {
  'dark-pro': 'dark',
  'claro-minimalista': 'light',
  'azul-deportivo': 'azul',
  'verde-turf': 'verde',
  'naranja-competitivo': 'naranja',
}

const DEFAULT_RANKING_THEME_ID = 'dark-pro'
const DEFAULT_PNG_THEME_ID = 'excel-classic'

export function getRankingThemeOptions() {
  return Object.values(RANKING_THEME_PRESETS)
}

export function getRankingThemePreset(id) {
  return RANKING_THEME_PRESETS[id] || RANKING_THEME_PRESETS[DEFAULT_RANKING_THEME_ID]
}

export function normalizeCampaignStyle(campaign) {
  const legacyTheme = campaign?.theme || DEFAULT_RANKING_THEME_ID
  const style = campaign?.style || {}
  const rankingTheme =
    style.rankingTheme ||
    LEGACY_THEME_TO_RANKING[legacyTheme] ||
    (RANKING_THEME_PRESETS[legacyTheme] ? legacyTheme : DEFAULT_RANKING_THEME_ID)

  return {
    rankingTheme,
    pngTheme: style.pngTheme || campaign?.exportStyle || DEFAULT_PNG_THEME_ID,
    colors: {
      primary: style.colors?.primary || '',
      secondary: style.colors?.secondary || '',
      accent: style.colors?.accent || '',
      background: style.colors?.background || '',
      surface: style.colors?.surface || '',
      text: style.colors?.text || '',
      mutedText: style.colors?.mutedText || '',
      highlight: style.colors?.highlight || '',
      top1: style.colors?.top1 || '',
      top2: style.colors?.top2 || '',
      top3: style.colors?.top3 || '',
    },
    pngColors: {
      ...BASE_EXPORT_CUSTOM_COLORS,
      ...(campaign?.customColors || {}),
      ...(style.pngColors || {}),
    },
  }
}

export function resolveCampaignTheme(campaign) {
  const normalized = normalizeCampaignStyle(campaign)
  const preset = getRankingThemePreset(normalized.rankingTheme)
  const colors = normalized.colors || {}
  const theme = {
    ...preset.theme,
    primary: colors.primary || preset.theme.primary,
    secondary: colors.secondary || preset.theme.secondary,
    background: colors.background || preset.theme.background,
    surface: colors.surface || preset.theme.surface,
    surfaceHover: colors.surface || preset.theme.surfaceHover,
    text: colors.text || preset.theme.text,
    textMuted: colors.mutedText || preset.theme.textMuted,
    featured: colors.accent || preset.theme.featured,
    top1: colors.top1 || preset.theme.top1,
    top2: colors.top2 || preset.theme.top2,
    top3: colors.top3 || preset.theme.top3,
    highlight: colors.highlight || colors.accent || preset.theme.highlight || preset.theme.primary,
  }

  return theme
}

export function resolveCampaignExportConfig(campaign) {
  const normalized = normalizeCampaignStyle(campaign)
  return {
    exportStyle: normalized.pngTheme || DEFAULT_PNG_THEME_ID,
    customColors: normalized.pngTheme === 'custom' ? normalized.pngColors : null,
  }
}

export function buildCampaignStylePayload(form) {
  return {
    rankingTheme: form.rankingTheme || DEFAULT_RANKING_THEME_ID,
    pngTheme: form.pngTheme || DEFAULT_PNG_THEME_ID,
    colors: { ...(form.styleColors || {}) },
    pngColors: form.pngTheme === 'custom' ? { ...(form.pngCustomColors || BASE_EXPORT_CUSTOM_COLORS) } : undefined,
  }
}

export function getLegacyThemeFromRankingTheme(rankingTheme) {
  return LEGACY_RANKING_TO_THEME[rankingTheme] || 'dark'
}

export function getDefaultCampaignStyleForm(campaign = null) {
  const normalized = normalizeCampaignStyle(campaign)
  return {
    rankingTheme: normalized.rankingTheme,
    pngTheme: normalized.pngTheme,
    styleColors: { ...normalized.colors },
    pngCustomColors: { ...normalized.pngColors },
  }
}

export function getRankingPreviewTheme(rankingTheme, styleColors = {}) {
  return resolveCampaignTheme({
    style: {
      rankingTheme,
      colors: styleColors,
    },
  })
}
