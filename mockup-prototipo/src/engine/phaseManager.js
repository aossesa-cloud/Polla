/**
 * phaseManager.js
 * 
 * Gestiona fases de competencia: clasificación → final.
 * Determina quién clasifica, quién queda eliminado, y qué fase estamos.
 */

import { getModeRules } from './modeEngine'

/**
 * Determina la fase actual según la fecha y configuración.
 * 
 * @param {string} date - "2026-04-14"
 * @param {Object} settings - competition.settings
 * @returns {string} "classification" | "final"
 */
export function determinePhase(date, settings) {
  if (!settings) return 'classification'

  const { finalDays } = settings
  if (!finalDays || finalDays.length === 0) return 'classification'

  const dayName = getDayNameFromDate(date)
  return finalDays.includes(dayName) ? 'final' : 'classification'
}

/**
 * Convierte una fecha ISO en nombre de día en español.
 */
function getDayNameFromDate(dateStr) {
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const date = new Date(dateStr + 'T12:00:00')  // Evitar problemas de timezone
  return dias[date.getDay()]
}

/**
 * Obtiene los IDs de participantes que clasifican a la final.
 * 
 * @param {Array} accumulatedRankings - [{ participant, total, position }]
 * @param {Object} settings - competition.settings
 * @returns {string[]} participant IDs
 */
export function getQualifiers(accumulatedRankings, settings) {
  if (!settings) return []
  const { mode, groups, qualifiersPerGroup, pairs } = settings
  const rules = getModeRules(mode)

  // Grupos: top N de cada grupo
  if (rules.hasGroups && groups) {
    const qualifiers = []
    for (const group of groups) {
      const groupRankings = accumulatedRankings
        .filter(r => group.members?.includes(r.participant))
        .sort((a, b) => b.total - a.total)
      qualifiers.push(...groupRankings.slice(0, qualifiersPerGroup || 2).map(r => r.participant))
    }
    return qualifiers
  }

  // Parejas: top N parejas por puntaje combinado
  if (rules.hasPairs && pairs) {
    const dailyScores = accumulatedRankings.reduce((map, r) => {
      map[r.participant] = r.total
      return map
    }, {})

    const pairScores = pairs.map(pair => ({
      pairId: pair.id,
      members: pair.members,
      score: pair.members.reduce((sum, m) => sum + (dailyScores[m] || 0), 0)
    }))

    pairScores.sort((a, b) => b.score - a.score)
    const qualifyingPairs = pairScores.slice(0, Math.ceil(pairScores.length / 2))
    return qualifyingPairs.flatMap(pc => pc.members)
  }

  // Head-to-head: ganadores reales de cada duelo
  if (rules.hasMatchups && Array.isArray(settings.matchups) && settings.matchups.length > 0) {
    const scoreMap = accumulatedRankings.reduce((map, ranking) => {
      map[ranking.participant] = Number(ranking.total || 0)
      return map
    }, {})

    return settings.matchups.flatMap((matchup) => {
      const members = Array.isArray(matchup?.members)
        ? matchup.members.filter(Boolean)
        : [matchup?.player1, matchup?.player2].filter(Boolean)

      if (members.length === 0) return []
      if (members.length === 1) return [members[0]]

      const [player1, player2] = members
      const player1Score = Number(scoreMap[player1] || 0)
      const player2Score = Number(scoreMap[player2] || 0)
      const winner = player1Score >= player2Score ? player1 : player2

      return winner ? [winner] : []
    })
  }

  // Final-qualification: top N general
  if (mode === 'final-qualification') {
    const count = settings.qualifiersCount || Math.ceil(accumulatedRankings.length / 2)
    return accumulatedRankings.slice(0, count).map(r => r.participant)
  }

  // Individual y progressive-elimination: todos
  return accumulatedRankings.map(r => r.participant)
}

/**
 * Obtiene los participantes eliminados (progressive-elimination).
 */
export function getEliminated(dailyRankings, settings, previouslyEliminated = []) {
  const rules = getModeRules(settings?.mode)
  if (!rules.hasElimination) return previouslyEliminated

  const previousSet = new Set((previouslyEliminated || []).map(p => String(p)))
  const activeRankings = [...dailyRankings].filter(r => !previousSet.has(String(r.participant)))
  const sorted = activeRankings.sort((a, b) => b.total - a.total)
  const eliminateCount = settings.eliminatePerDay || 1
  const newlyEliminated = sorted.slice(-eliminateCount).map(r => r.participant)

  return [...new Set([...previouslyEliminated, ...newlyEliminated])]
}

/**
 * Filtra picks según la fase actual.
 */
export function applyPhaseFilter(picks, phase, settings) {
  if (phase !== 'final') return picks

  // En fase final, solo clasificados
  // Necesitamos rankings previos para determinar clasificados
  return picks  // El caller debe pasar los picks ya filtrados
}

/**
 * Estado completo de la competencia para una fecha dada.
 */
export function getCompetitionState(competition, date) {
  const settings = competition?.settings || {}
  const mode = settings.mode || 'individual'
  const rules = getModeRules(mode)
  const phase = determinePhase(date, settings)

  return {
    phase,
    isClassification: phase === 'classification',
    isFinal: phase === 'final',
    mode,
    modeLabel: mode,
    hasGroups: rules.hasGroups,
    hasPairs: rules.hasPairs,
    hasMatchups: rules.hasMatchups,
    hasFinals: rules.hasFinals,
    hasFinalStage: settings.hasFinalStage !== false,
    hasElimination: rules.hasElimination,
    requiresRelationSetup: rules.requiresRelationSetup,
    relationType: rules.relationType,
  }
}
