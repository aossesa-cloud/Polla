/**
 * rankingEngine.js
 * 
 * Orquestador: combina scoreEngine + accumulator + phaseManager + modeEngine
 * para producir rankings completos listos para el UI.
 * 
 * Este es el punto de entrada principal del motor.
 */

import { buildDailyRanking, calculateDailyScores } from './scoreEngine'
import { accumulateRankings } from './accumulator'
import { getModeRules } from './modeEngine'
import { determinePhase, getQualifiers, getEliminated } from './phaseManager'

/**
 * Calcula rankings completos para una competencia.
 * 
 * @param {Object} competition - competition config
 * @param {Object} picksByDate - { "2026-04-14": [{ participant, picks }] }
 * @param {Object} resultsByDate - { "2026-04-14": { "1": { first, ... } } }
 * @param {string} targetDate - fecha objetivo (default: última con datos)
 * @returns {Object} { dailyRanking, accumulatedRanking, phase, qualifiers, eliminated, state }
 */
export function computeRankings(competition, picksByDate, resultsByDate, targetDate) {
  const settings = competition?.settings || {}
  const mode = settings.mode || 'individual'
  const scoringConfig = settings.scoring || { mode: 'dividend', points: {} }
  const rules = getModeRules(mode)

  // Obtener todas las fechas ordenadas
  const allDates = Object.keys(picksByDate).sort()
  const date = targetDate || allDates[allDates.length - 1]

  // Calcular rankings diarios para cada fecha
  const allDailyRankings = []
  for (const d of allDates) {
    const picks = picksByDate[d] || []
    const results = resultsByDate[d] || {}

    if (picks.length > 0) {
      const daily = buildDailyRanking(picks, results, scoringConfig)
      allDailyRankings.push(...daily.map(r => ({ ...r, date: d })))
    }
  }

  // Ranking acumulado
  const accumulatedRanking = accumulateRankings(allDailyRankings)

  // Ranking diario específico para la fecha objetivo
  const dailyPicks = picksByDate[date] || []
  const dailyResults = resultsByDate[date] || {}
  const dailyRanking = buildDailyRanking(dailyPicks, dailyResults, scoringConfig)

  // Fase actual
  const phase = determinePhase(date, settings)

  // Clasificados
  const qualifiers = phase === 'final' ? getQualifiers(accumulatedRanking, settings) : []

  // Eliminados (progressive-elimination)
  const eliminated = rules.hasElimination
    ? getEliminated(accumulatedRanking, settings)
    : []

  // Estado de la competencia
  const state = {
    phase,
    mode,
    hasGroups: rules.hasGroups,
    hasPairs: rules.hasPairs,
    hasMatchups: rules.hasMatchups,
    hasFinals: rules.hasFinals,
    hasElimination: rules.hasElimination,
    requiresRelationSetup: rules.requiresRelationSetup,
    relationType: rules.relationType,
  }

  return {
    dailyRanking,
    accumulatedRanking,
    allDailyRankings,
    phase,
    qualifiers,
    eliminated,
    state,
  }
}

/**
 * Calcula solo puntajes diarios (sin ranking acumulado).
 * Útil para vistas rápidas.
 */
export function computeDailyScoresOnly(picks, results, scoringConfig) {
  return calculateDailyScores(picks, results, scoringConfig)
}
