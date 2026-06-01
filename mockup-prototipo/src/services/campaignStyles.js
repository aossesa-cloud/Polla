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

const BASE_RANKING_SHEET_COLORS = {
  sheetHeaderBg: '#FFFFFF',
  sheetHeaderText: '#000000',
  sheetBodyFrom: '#FFE39A',
  sheetBodyTo: '#F6BD83',
  sheetBodyText: '#000000',
  sheetPositionBg: '#FF1515',
  sheetPositionText: '#000000',
  sheetQualifiedBg: '#00B050',
  sheetQualifiedText: '#000000',
  sheetEliminatedBg: '#9F5C83',
  sheetEliminatedText: '#FFFFFF',
  sheetPrizeText: '#FFFFFF',
  sheetBorder: '#5F6368',
  sheetCardBg: '#EEEEEE',
  sheetPronoHeaderBg: '#05245F',
  sheetPronoHeaderText: '#FFFFFF',
  sheetPickBg: '#EFEFEF',
  sheetPickText: '#2F343B',
  prize1: '#111111',
  prize2: '#3F4654',
  prize3: '#7C2D12',
}

const RANKING_COLOR_KEYS = [
  'primary',
  'secondary',
  'accent',
  'background',
  'surface',
  'text',
  'mutedText',
  'highlight',
  'top1',
  'top2',
  'top3',
  ...Object.keys(BASE_RANKING_SHEET_COLORS),
]

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
      ...BASE_RANKING_SHEET_COLORS,
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
      ...BASE_RANKING_SHEET_COLORS,
      sheetPronoHeaderBg: '#0B3A78',
      prize1: '#082F49',
      prize2: '#1D4ED8',
      prize3: '#FB923C',
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
      ...BASE_RANKING_SHEET_COLORS,
      sheetQualifiedBg: '#00B050',
      prize1: '#064E3B',
      prize2: '#15803D',
      prize3: '#B45309',
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
      ...BASE_RANKING_SHEET_COLORS,
      prize1: '#2B130A',
      prize2: '#3F2A20',
      prize3: '#7C2D12',
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
      ...BASE_RANKING_SHEET_COLORS,
      sheetBodyFrom: '#F8FAFC',
      sheetBodyTo: '#E0F2FE',
      prize1: '#1D4ED8',
      prize2: '#64748B',
      prize3: '#C2410C',
    },
  },
  custom: {
    id: 'custom',
    name: 'Personalizado',
    description: 'Elige tus propios colores para el ranking de esta campaña.',
    theme: {
      ...{
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
        ...BASE_RANKING_SHEET_COLORS,
      },
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
  custom: 'dark',
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

  const styleColors = style.colors || {}

  return {
    rankingTheme,
    pngTheme: style.pngTheme || campaign?.exportStyle || DEFAULT_PNG_THEME_ID,
    colors: RANKING_COLOR_KEYS.reduce((acc, key) => {
      acc[key] = styleColors[key] || ''
      return acc
    }, {}),
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
  const resolvedMutedText =
    colors.mutedText ||
    (normalized.rankingTheme === 'custom' ? (colors.text || '') : '') ||
    preset.theme.textMuted

  const theme = {
    ...preset.theme,
    primary: colors.primary || preset.theme.primary,
    secondary: colors.secondary || preset.theme.secondary,
    background: colors.background || preset.theme.background,
    surface: colors.surface || preset.theme.surface,
    surfaceHover: colors.surface || preset.theme.surfaceHover,
    text: colors.text || preset.theme.text,
    textMuted: resolvedMutedText,
    featured: colors.accent || preset.theme.featured,
    top1: colors.top1 || preset.theme.top1,
    top2: colors.top2 || preset.theme.top2,
    top3: colors.top3 || preset.theme.top3,
    highlight: colors.highlight || colors.accent || preset.theme.highlight || preset.theme.primary,
  }

  Object.keys(BASE_RANKING_SHEET_COLORS).forEach((key) => {
    if (key === 'prize1') {
      theme.prize1 = colors.prize1 || preset.theme.prize1 || theme.top1
      return
    }
    if (key === 'prize2') {
      theme.prize2 = colors.prize2 || preset.theme.prize2 || theme.top2
      return
    }
    if (key === 'prize3') {
      theme.prize3 = colors.prize3 || preset.theme.prize3 || theme.top3
      return
    }
    theme[key] = colors[key] || preset.theme[key] || BASE_RANKING_SHEET_COLORS[key]
  })

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
    pngOptions: { ...DEFAULT_PNG_OPTIONS, ...(form.pngOptions || {}) },
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
    pngOptions: { ...DEFAULT_PNG_OPTIONS, ...(campaign?.style?.pngOptions || {}) },
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

export const DEFAULT_PNG_OPTIONS = {
  highlightPrizes: true,
  showDiff: true,
  showProno: true,
  showMedals: false,
  compactRows: false,
}

export function getPrizeStyle(position, prizeCount = 3) {
  if (position < 1 || position > prizeCount) return null
  const presets = {
    1: { label: 'Oro',    emoji: '🥇', bg: '#FFD700', text: '#1a1a1a', border: '#E6C200', glow: 'rgba(255,215,0,0.22)' },
    2: { label: 'Plata',  emoji: '🥈', bg: '#C0C0C0', text: '#1a1a1a', border: '#A0A0A0', glow: 'rgba(192,192,192,0.18)' },
    3: { label: 'Bronce', emoji: '🥉', bg: '#CD7F32', text: '#ffffff', border: '#A8631E', glow: 'rgba(205,127,50,0.20)' },
  }
  if (presets[position]) return presets[position]
  const hues = [199, 142, 265, 22, 162, 315, 47, 195]
  const hue = hues[(position - 4) % hues.length]
  return {
    label: `Premio ${position}`,
    emoji: `${position}°`,
    bg: `hsl(${hue}, 55%, 42%)`,
    text: '#ffffff',
    border: `hsl(${hue}, 55%, 30%)`,
    glow: `hsla(${hue}, 55%, 42%, 0.18)`,
  }
}
