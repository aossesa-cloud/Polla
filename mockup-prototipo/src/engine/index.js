/**
 * engine/index.js
 * 
 * Barrel exports del motor de competencia.
 */

// Motor base
export { calculateDailyScores, buildDailyRanking } from './scoreEngine'
export { accumulateRankings, mergeRankings } from './accumulator'

// Motor de modos
export { MODE_IDS, MODE_LABELS, MODE_DESCRIPTIONS, MODE_RULES, getModeRules, isValidMode, getModeOptions } from './modeEngine'

// Fases
export { determinePhase, getQualifiers, getEliminated, applyPhaseFilter, getCompetitionState } from './phaseManager'

// Ranking (orquestador principal)
export { computeRankings, computeDailyScoresOnly } from './rankingEngine'

// Race Watcher
export { 
  watchRace, 
  watchJornada, 
  RACE_STATUS, 
  ALERT_TYPES, 
  POLLING_CONFIG,
  createRaceEntry,
  createJornada,
  validateRaceResult,
  determineRaceStatus,
  setRaceWatcherStorage,
  getJornada,
  saveJornada,
  saveRaceResult,
  getResultados,
  getResultadoCarrera,
} from './raceWatcher'
