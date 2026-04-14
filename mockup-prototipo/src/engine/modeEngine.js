/**
 * modeEngine.js
 * 
 * Reglas específicas por modo de competencia.
 * Cada modo configura: agrupación, clasificación, eliminación, setup de relaciones.
 * 
 * ESTRATEGIA: Config Map + Strategy Pattern.
 * Un solo objeto con las reglas de cada modo.
 * Los componentes consultan las reglas, no hardcodean lógica.
 */

export const MODE_IDS = {
  INDIVIDUAL: 'individual',
  PAIRS: 'pairs',
  FINAL_QUALIFICATION: 'final-qualification',
  GROUPS: 'groups',
  HEAD_TO_HEAD: 'head-to-head',
  PROGRESSIVE_ELIMINATION: 'progressive-elimination'
}

export const MODE_LABELS = {
  individual: 'Individual (tabla simple)',
  pairs: 'Parejas',
  'final-qualification': 'Clasificación a final',
  groups: 'Por grupos',
  'head-to-head': 'Duelo / Mano a mano',
  'progressive-elimination': 'Eliminación progresiva'
}

export const MODE_DESCRIPTIONS = {
  individual: 'Todos compiten en una sola tabla. Sin grupos, finales ni eliminación.',
  pairs: 'Los participantes se agrupan en duplas que suman puntaje conjunto.',
  'final-qualification': 'Todos compiten en fase regular. Solo algunos pasan a la final.',
  groups: 'Se divide en grupos competitivos. Clasifican algunos de cada grupo a la final.',
  'head-to-head': 'Enfrentamientos 1 contra 1. Avanza el mejor puntaje.',
  'progressive-elimination': 'Todos parten juntos. Se eliminan los peores por jornada.'
}

/**
 * Reglas de cada modo.
 * Esta es la ÚNICA fuente de verdad para la lógica por modo.
 */
export const MODE_RULES = {
  individual: {
    hasGroups: false,
    hasPairs: false,
    hasMatchups: false,
    hasFinals: false,
    hasElimination: false,
    requiresRelationSetup: false,
    relationType: null,
    getTableGrouping: () => null,
    getRankingFilter: () => null,
    getEliminated: () => [],
  },

  pairs: {
    hasGroups: false,
    hasPairs: true,
    hasMatchups: false,
    hasFinals: true,                    // configurable: con/sin final
    hasElimination: false,
    requiresRelationSetup: true,        // Pregunta "¿quién es tu pareja?"
    relationType: 'pair',
    getTableGrouping: (settings) => settings.pairs || [],
    getRankingFilter: (phase, settings, qualifierIds) =>
      (phase === 'final' && settings.hasFinalStage) ? qualifierIds : null,
    getPairScore: (pair, dailyScores) =>
      pair.members.reduce((sum, m) => sum + (dailyScores[m] || 0), 0),
  },

  'final-qualification': {
    hasGroups: false,
    hasPairs: false,
    hasMatchups: false,
    hasFinals: true,                    // obligatorio
    hasElimination: false,
    requiresRelationSetup: false,
    relationType: null,
    getTableGrouping: () => null,
    getRankingFilter: (phase, settings, qualifierIds) =>
      phase === 'final' ? qualifierIds : null,
  },

  groups: {
    hasGroups: true,
    hasPairs: false,
    hasMatchups: false,
    hasFinals: true,                    // obligatorio
    hasElimination: false,
    requiresRelationSetup: true,        // Pregunta "¿a qué grupo perteneces?"
    relationType: 'group',
    getTableGrouping: (settings) => settings.groups || [],
    getRankingFilter: (phase, settings, qualifierIds) =>
      phase === 'final' ? qualifierIds : null,
  },

  'head-to-head': {
    hasGroups: false,
    hasPairs: false,
    hasMatchups: true,
    hasFinals: true,                    // obligatorio
    hasElimination: false,
    requiresRelationSetup: true,        // Pregunta "¿quién es tu contrincante?"
    relationType: 'opponent',
    getTableGrouping: (settings) => settings.matchups || [],
    getRankingFilter: (phase, settings, qualifierIds) =>
      phase === 'final' ? qualifierIds : null,
    getMatchupWinner: (player1Score, player2Score) =>
      player1Score >= player2Score ? 'player1' : 'player2',
  },

  'progressive-elimination': {
    hasGroups: false,
    hasPairs: false,
    hasMatchups: false,
    hasFinals: false,
    hasElimination: true,
    requiresRelationSetup: false,
    relationType: null,
    getTableGrouping: () => null,
    getRankingFilter: (phase, settings, qualifierIds) => null,  // Todos siempre visibles
    getEliminated: (rankings, settings, alreadyEliminated = []) => {
      const eliminatePerDay = settings.eliminatePerDay || 1
      const sorted = [...rankings].sort((a, b) => b.total - a.total)
      const bottom = sorted.slice(-eliminatePerDay)
      return bottom.map(r => r.participant).filter(p => !alreadyEliminated.includes(p))
    },
  }
}

/**
 * Obtiene las reglas de un modo. Fallback a individual.
 */
export function getModeRules(mode) {
  return MODE_RULES[mode] || MODE_RULES.individual
}

/**
 * Verifica si un modo es válido.
 */
export function isValidMode(mode) {
  return Object.keys(MODE_RULES).includes(mode)
}

/**
 * Retorna todos los modos disponibles como opciones de selector.
 */
export function getModeOptions() {
  return Object.entries(MODE_LABELS).map(([id, label]) => ({
    id,
    label,
    description: MODE_DESCRIPTIONS[id]
  }))
}
