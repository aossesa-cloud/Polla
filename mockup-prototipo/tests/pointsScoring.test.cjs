const assert = require('node:assert/strict')
const fs = require('node:fs')
const Module = require('node:module')
const path = require('node:path')
const test = require('node:test')
const { buildSync } = require('esbuild')

const ROOT = path.resolve(__dirname, '..', '..')

function loadScoreEngine() {
  const sourcePath = path.join(ROOT, 'mockup-prototipo', 'src', 'engine', 'scoreEngine.js')
  const bundledSource = buildSync({
    entryPoints: [sourcePath],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    write: false,
  }).outputFiles[0].text
  const scoreModule = new Module(sourcePath, module)
  scoreModule.filename = sourcePath
  scoreModule._compile(bundledSource, sourcePath)
  return scoreModule.exports
}

const { calculateDailyScores, enrichPicksWithScores } = loadScoreEngine()
const parser = require(path.join(ROOT, 'parser.js')).__test

const pointConfig = {
  mode: 'points',
  doubleLastRace: false,
  points: { first: 11, second: 6, third: 2, exclusiveFirst: 23 },
}

test('el ganador compartido recibe primero y el exclusivo se decide por caballo ganador', () => {
  const sharedPicks = [
    { participant: 'Ana', picks: ['7'] },
    { participant: 'Beto', picks: ['7'] },
    { participant: 'Cata', picks: ['7'] },
  ]
  const results = { 1: { first: '7' } }

  assert.deepEqual(calculateDailyScores(sharedPicks, results, pointConfig), {
    Ana: 11,
    Beto: 11,
    Cata: 11,
  })

  const exclusivePicks = [
    { participant: 'Ana', picks: ['7'] },
    { participant: 'Beto', picks: ['4'] },
  ]
  assert.deepEqual(calculateDailyScores(exclusivePicks, results, pointConfig), {
    Ana: 23,
    Beto: 0,
  })
})

test('en empate de primero la exclusividad se evalúa por cada caballo', () => {
  const picks = [
    { participant: 'Ana', picks: ['5'] },
    { participant: 'Beto', picks: ['6'] },
    { participant: 'Cata', picks: ['6'] },
  ]
  const results = { 1: { first: '5', empatePrimero: '6' } }

  assert.deepEqual(calculateDailyScores(picks, results, pointConfig), {
    Ana: 23,
    Beto: 11,
    Cata: 11,
  })
})

test('la exclusividad reconoce resultados con nombres de campos backend y ganadores agrupados', () => {
  assert.deepEqual(
    calculateDailyScores(
      [
        { participant: 'Ana', picks: ['5'] },
        { participant: 'Beto', picks: ['6'] },
        { participant: 'Cata', picks: ['6'] },
      ],
      { 1: { first: '', primero: '5 / 6' } },
      pointConfig,
    ),
    { Ana: 23, Beto: 11, Cata: 11 },
  )
})

test('empates en segundo y tercero usan exactamente los puntos de su posición', () => {
  const picks = [
    { participant: 'Ana', picks: ['4'] },
    { participant: 'Beto', picks: ['9'] },
    { participant: 'Cata', picks: ['8'] },
    { participant: 'Dani', picks: ['3'] },
  ]
  const results = {
    1: {
      first: '1',
      second: '4',
      empateSegundo: '9',
      third: '8',
      empateTercero: '3',
    },
  }

  assert.deepEqual(calculateDailyScores(picks, results, pointConfig), {
    Ana: 6,
    Beto: 6,
    Cata: 2,
    Dani: 2,
  })
})

test('un retiro defiende al favorito y el pick efectivo participa en exclusividad', () => {
  const result = { first: '5', favorito: '5', retiros: ['9'] }
  const shared = [
    { participant: 'Ana', picks: ['9'] },
    { participant: 'Beto', picks: ['5'] },
  ]
  const exclusive = [
    { participant: 'Ana', picks: ['9'] },
    { participant: 'Beto', picks: ['4'] },
  ]

  assert.deepEqual(calculateDailyScores(shared, { 1: result }, pointConfig), { Ana: 11, Beto: 11 })
  assert.deepEqual(calculateDailyScores(exclusive, { 1: result }, pointConfig), { Ana: 23, Beto: 0 })
})

test('totales y picks enriquecidos comparten la misma regla de puntuación', () => {
  const picks = [
    { participant: 'Ana', picks: ['7', '4'] },
    { participant: 'Beto', picks: ['7', '9'] },
  ]
  const results = {
    1: { first: '7' },
    2: { first: '1', second: '4', empateSegundo: '9' },
  }

  assert.deepEqual(calculateDailyScores(picks, results, pointConfig), { Ana: 17, Beto: 17 })
  assert.deepEqual(
    enrichPicksWithScores(picks, results, pointConfig).map((entry) => entry.picks.map((pick) => pick.score)),
    [[11, 6], [11, 6]],
  )
})

test('valores cero se conservan en frontend, wizard y normalización backend', () => {
  const zeroConfig = {
    mode: 'points',
    points: { first: 0, second: 0, third: 0, exclusiveFirst: 0 },
  }
  assert.deepEqual(calculateDailyScores([{ participant: 'Ana', picks: ['7'] }], { 1: { first: '7' } }, zeroConfig), { Ana: 0 })
  assert.deepEqual(parser.normalizeScoring(zeroConfig).points, {
    first: 0,
    second: 0,
    third: 0,
    exclusiveFirst: 0,
  })

  const wizardSource = fs.readFileSync(
    path.join(ROOT, 'mockup-prototipo', 'src', 'components', 'CampaignWizard.jsx'),
    'utf8',
  )
  assert.match(wizardSource, /pointsFirst:\s*toFiniteNumberOrDefault\(normalizedWeeklyCampaign\.scoring\?\.points\?\.first, 10\)/)
  assert.match(wizardSource, /first:\s*toFiniteNumberOrDefault\(form\.pointsFirst, 10\)/)
  assert.doesNotMatch(wizardSource, /Number\(form\.points(?:First|Second|Third|ExclusiveFirst)\) \|\|/)
})

test('el parser replica exclusividad, retiro defendido y empate en segundo', () => {
  const participants = [
    {
      index: 1,
      name: 'Ana',
      picks: [
        { race: 1, raceLabel: '1', horse: '9', score: 0 },
        { race: 2, raceLabel: '2', horse: '4', score: 0 },
      ],
    },
    {
      index: 2,
      name: 'Beto',
      picks: [
        { race: 1, raceLabel: '1', horse: '5', score: 0 },
        { race: 2, raceLabel: '2', horse: '9', score: 0 },
      ],
    },
  ]
  const results = [
    { race: '1', primero: '5', favorito: '5', retiros: ['9'] },
    { race: '2', primero: '1', segundo: '4', empateSegundo: '9' },
  ]

  const scored = parser.scoreParticipants(participants, results, pointConfig, 2)
  assert.deepEqual(scored.map((entry) => entry.picks.map((pick) => pick.score)), [[11, 6], [11, 6]])
  assert.deepEqual(scored.map((entry) => entry.points), [17, 17])
})

test('el parser reconoce ganadores agrupados y deduplica una misma persona por nombre', () => {
  const participants = [
    { index: 1, name: 'Ana', picks: [{ race: 1, raceLabel: '1', horse: '5' }] },
    { index: 99, name: ' ANA ', picks: [{ race: 1, raceLabel: '1', horse: '5' }] },
    { index: 2, name: 'Beto', picks: [{ race: 1, raceLabel: '1', horse: '6' }] },
    { index: 3, name: 'Cata', picks: [{ race: 1, raceLabel: '1', horse: '6' }] },
  ]
  const scored = parser.scoreParticipants(
    participants,
    [{ race: '1', primero: '5 / 6' }],
    pointConfig,
    1,
  )

  assert.deepEqual(scored.map((entry) => entry.points), [23, 23, 11, 11])
})

test('frontend y parser mantienen identidades con namespace y resultados de caballo como objeto', () => {
  const resultObject = { primero: { numero: 5 } }
  const participants = [
    { index: 1, name: 'index:2', picks: [{ race: 1, raceLabel: '1', horse: '5' }] },
    { index: 2, name: '', picks: [{ race: 1, raceLabel: '1', horse: '5' }] },
  ]

  assert.deepEqual(
    calculateDailyScores(
      [
        { participant: 'index:2', picks: ['5'] },
        { index: 2, picks: ['5'] },
      ],
      { 1: { first: { number: 5 } } },
      pointConfig,
    ),
    { 'index:2': 11, undefined: 11 },
  )
  assert.deepEqual(
    parser.scoreParticipants(participants, [{ race: '1', ...resultObject }], pointConfig, 1)
      .map((entry) => entry.points),
    [11, 11],
  )
})

test('eventos fechados heredan scoring por campaignId y por ID seguro', () => {
  const campaign = {
    id: 'daily-123',
    enabled: true,
    scoring: {
      mode: 'points',
      points: { first: 0, second: 4, third: 2, exclusiveFirst: 9 },
    },
  }
  const overrides = {
    settings: { campaigns: { daily: [campaign], weekly: [], monthly: [] } },
    events: {
      'jornada-con-vinculo': { meta: { campaignId: 'daily-123' } },
      'campaign-daily-123-2026-08-18': { meta: {} },
      'campaign-daily-1234-2026-08-18': { meta: {} },
    },
  }
  const scoringMap = parser.buildEventScoringMap(overrides)

  assert.deepEqual(scoringMap.get('jornada-con-vinculo').points, campaign.scoring.points)
  assert.deepEqual(scoringMap.get('campaign-daily-123-2026-08-18').points, campaign.scoring.points)
  assert.equal(scoringMap.has('campaign-daily-1234-2026-08-18'), false)
})

test('el vínculo de campaña prioriza IDs exactos y no revive campañas deshabilitadas', () => {
  const shortCampaign = {
    id: 'daily-1',
    scoring: { mode: 'points', points: { first: 1 } },
  }
  const longCampaign = {
    id: 'daily-1-final',
    scoring: { mode: 'points', points: { first: 8 } },
  }
  const disabledCampaign = {
    id: 'daily-disabled',
    enabled: false,
    scoring: { mode: 'points', points: { first: 99 } },
  }
  const legacyCampaign = {
    id: 'diaria-legacy',
    eventId: 'legacy-explicit-event',
    scoring: { mode: 'points', points: { first: 4 } },
  }
  const ownEventScoring = { mode: 'points', points: { first: 3 } }
  const overrides = {
    settings: {
      campaigns: {
        daily: [shortCampaign, longCampaign, disabledCampaign],
        diaria: [legacyCampaign],
        weekly: [],
        monthly: [],
      },
    },
    events: {
      'campaign-daily-1-final-2026-08-18': { meta: {} },
      'campaign-daily-disabled-2026-08-18': { meta: {} },
      'campaign-daily-disabled-2026-08-19': { meta: {}, scoring: ownEventScoring },
      'campaign-daily-1-2026-08-20': { meta: { campaignId: 'missing-campaign' } },
      'own-scoring-event': { meta: { campaignId: 'daily-1' }, scoring: ownEventScoring },
    },
  }
  shortCampaign.scoring = undefined
  const scoringMap = parser.buildEventScoringMap(overrides)

  assert.equal(scoringMap.get('campaign-daily-1-final-2026-08-18').points.first, 8)
  assert.equal(scoringMap.has('campaign-daily-disabled-2026-08-18'), false)
  assert.equal(scoringMap.get('campaign-daily-disabled-2026-08-19').points.first, 3)
  assert.equal(scoringMap.has('campaign-daily-1-2026-08-20'), false)
  assert.equal(scoringMap.get('own-scoring-event').points.first, 3)
  assert.equal(scoringMap.get('legacy-explicit-event').points.first, 4)
})

test('una campaña deshabilitada más específica elimina asignaciones residuales de otra colección', () => {
  const overrides = {
    settings: {
      campaigns: {
        daily: [{ id: 'daily-1', scoring: { mode: 'points', points: { first: 4 } } }],
        weekly: [{ id: 'daily-1-final', enabled: false, scoring: { mode: 'points', points: { first: 99 } } }],
        monthly: [],
      },
    },
    events: {
      'campaign-daily-1-final-2026-08-18': { meta: {} },
    },
  }

  assert.equal(
    parser.buildEventScoringMap(overrides).has('campaign-daily-1-final-2026-08-18'),
    false,
  )
})

test('dividendos y última carrera x2 conservan su comportamiento', () => {
  const picks = [{ participant: 'Ana', picks: ['7', '7'] }]
  const results = {
    1: { first: '7', ganador: 2, divSegundoPrimero: 1, divTerceroPrimero: 0.5 },
    2: { first: '7', ganador: 2, divSegundoPrimero: 1, divTerceroPrimero: 0.5 },
  }
  const scoring = { mode: 'dividend', doubleLastRace: true }

  assert.deepEqual(calculateDailyScores(picks, results, scoring), { Ana: 10.5 })
  assert.deepEqual(
    enrichPicksWithScores(picks, results, scoring)[0].picks.map((pick) => pick.score),
    [3.5, 7],
  )
})
