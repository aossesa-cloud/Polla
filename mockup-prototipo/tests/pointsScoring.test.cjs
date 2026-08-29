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

function loadPicksTable() {
  const sourcePath = path.join(ROOT, 'mockup-prototipo', 'src', 'components', 'tables', 'PicksTable.jsx')
  const bundledSource = buildSync({
    entryPoints: [sourcePath],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    write: false,
    outdir: path.join(ROOT, '.test-build'),
    loader: { '.css': 'text' },
  }).outputFiles.find((file) => file.path.endsWith('.js')).text
  const tableModule = new Module(sourcePath, module)
  tableModule.filename = sourcePath
  tableModule.paths = Module._nodeModulePaths(path.dirname(sourcePath))
  tableModule._compile(bundledSource, sourcePath)
  return tableModule.exports
}

function loadBundledModule(relativePath) {
  const sourcePath = path.join(ROOT, 'mockup-prototipo', 'src', ...relativePath.split('/'))
  const bundledSource = buildSync({
    entryPoints: [sourcePath],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    write: false,
  }).outputFiles[0].text
  const bundledModule = new Module(sourcePath, module)
  bundledModule.filename = sourcePath
  bundledModule._compile(bundledSource, sourcePath)
  return bundledModule.exports
}

const { calculateDailyScores, calculatePendingExclusivePickMap, enrichPicksWithScores } = loadScoreEngine()
const { ensurePicksWithScores, formatPickScore, getPointScoreBadgeStyle } = loadPicksTable()
const { generateExportHTML, getExportScoreColors, getExportStyleColors } = loadBundledModule('services/exportStyles.js')
const { DEFAULT_POINT_COLORS, resolveScoringConfig } = loadBundledModule('services/scoringConfig.js')
const {
  PICKS_PNG_LAYOUTS,
  buildCampaignStylePayload,
  getDefaultCampaignStyleForm,
  resolveCampaignExportConfig,
} = loadBundledModule('services/campaignStyles.js')
const parser = require(path.join(ROOT, 'parser.js')).__test

const pointConfig = {
  mode: 'points',
  doubleLastRace: false,
  points: { first: 11, second: 6, third: 2, exclusiveFirst: 23 },
}

test('bono por dividendo igual o mayor a 10 suma 3 al primero normal', () => {
  const scoring = {
    mode: 'points',
    points: { first: 10, second: 5, third: 1, exclusiveFirst: 20 },
  }

  assert.deepEqual(
    calculateDailyScores(
      [{ participant: 'Ana', picks: ['1'] }, { participant: 'Beto', picks: ['1'] }],
      { 1: { first: '1', ganador: '10' } },
      scoring,
    ),
    { Ana: 13, Beto: 13 },
  )
  assert.deepEqual(
    calculateDailyScores(
      [{ participant: 'Ana', picks: ['1'] }, { participant: 'Beto', picks: ['1'] }],
      { 1: { first: '1', ganador: '10,01' } },
      scoring,
    ),
    { Ana: 13, Beto: 13 },
  )
})

test('bono por dividendo alto se suma al exclusivo primero y no a segundo o tercero', () => {
  const scoring = {
    mode: 'points',
    points: { first: 10, second: 5, third: 1, exclusiveFirst: 20 },
  }

  assert.deepEqual(
    calculateDailyScores(
      [{ participant: 'Ana', picks: ['1'] }],
      { 1: { first: '1', ganador: '12' } },
      scoring,
    ),
    { Ana: 23 },
  )
  assert.deepEqual(
    calculateDailyScores(
      [{ participant: 'Ana', picks: ['2'] }],
      { 1: { first: '1', second: '2', ganador: '99' } },
      scoring,
    ),
    { Ana: 5 },
  )
  assert.deepEqual(
    calculateDailyScores(
      [{ participant: 'Ana', picks: ['3'] }],
      { 1: { first: '1', second: '2', third: '3', ganador: '99' } },
      scoring,
    ),
    { Ana: 1 },
  )
})

test('bono de primero evalúa el dividendo propio en empates y retiros defendidos', () => {
  const scoring = {
    mode: 'points',
    points: { first: 10, second: 5, third: 1, exclusiveFirst: 20 },
  }

  assert.deepEqual(
    calculateDailyScores(
      [{ participant: 'Principal', picks: ['1'] }, { participant: 'Empatado', picks: ['2'] }],
      { 1: { first: '1', empatePrimero: '2', ganador: '9 / 14' } },
      scoring,
    ),
    { Principal: 20, Empatado: 23 },
  )
  assert.deepEqual(
    calculateDailyScores(
      [{ participant: 'Defendido', picks: ['9'] }],
      { 1: { first: '1', favorito: '1', retiros: ['9'], ganador: '12' } },
      scoring,
    ),
    { Defendido: 23 },
  )
})

test('bono de primero resuelve aliases y nombres con dígitos sin desplazar el dividendo', () => {
  const scoring = {
    mode: 'points',
    points: { first: 10, second: 5, third: 1, exclusiveFirst: 20 },
  }

  assert.deepEqual(
    calculateDailyScores(
      [{ participant: 'Principal', picks: ['5'] }, { participant: 'Alias', picks: ['6'] }],
      { 1: { first: '5 - Foo 2024', primero: '6 - Bar', ganador: '12' } },
      scoring,
    ),
    { Principal: 23, Alias: 23 },
  )
  assert.deepEqual(
    calculateDailyScores(
      [{ participant: 'Ganador objeto', picks: ['5'] }],
      { 1: { winner: { number: '5', dividend: 12 } } },
      scoring,
    ),
    { 'Ganador objeto': 23 },
  )
  assert.deepEqual(
    calculateDailyScores(
      [{ participant: 'Duplicado', picks: ['6'] }],
      { 1: { first: '5', primero: '5 / 6', ganador: '12 / 9' } },
      scoring,
    ),
    { Duplicado: 20 },
  )
  assert.deepEqual(
    calculateDailyScores(
      [{ participant: 'Cinco', picks: ['5'] }, { participant: 'Seis', picks: ['6'] }, { participant: 'Siete', picks: ['7'] }],
      { 1: { first: '1', empatePrimero: '5 / 6 / 7', ganador: '12 / 9 / 11 / 8' } },
    scoring,
    ),
    { Cinco: 20, Seis: 23, Siete: 20 },
  )
})

test('dividendo cero explícito e infinito no activan el bono', () => {
  const scoring = { mode: 'points', points: { first: 10, exclusiveFirst: 20 } }
  assert.deepEqual(
    calculateDailyScores([{ participant: 'Cero', picks: ['1'] }], { 1: { first: '1', ganador: 0, dividends: { winner: 12 } } }, scoring),
    { Cero: 20 },
  )
  assert.deepEqual(
    calculateDailyScores([{ participant: 'Infinito', picks: ['1'] }], { 1: { first: '1', ganador: '1e309' } }, scoring),
    { Infinito: 20 },
  )
})

test('parser y frontend aplican el mismo bono por dividendo alto', () => {
  const scoring = {
    mode: 'points',
    points: { first: 10, second: 5, third: 1, exclusiveFirst: 20 },
  }
  const picks = [
    { participant: 'Ana', index: 1, picks: ['1'] },
    { participant: 'Beto', index: 2, picks: ['1'] },
  ]
  const results = { 1: { first: '1', ganador: '12' } }
  const frontend = calculateDailyScores(picks, results, scoring)
  const parserParticipants = picks.map((entry) => ({
    ...entry,
    picks: [{ race: 1, raceLabel: 1, horse: '1' }],
  }))
  const parsed = parser.scoreParticipants(parserParticipants, [{ ...results[1], race: 1 }], scoring, 1)

  assert.deepEqual(frontend, { Ana: 13, Beto: 13 })
  assert.deepEqual(parsed.map((entry) => entry.points), [13, 13])
})

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

test('el segundo exclusivo usa su puntaje propio y el segundo compartido conserva el normal', () => {
  const scoring = {
    ...pointConfig,
    points: { ...pointConfig.points, exclusiveSecond: 17 },
  }
  const result = { 1: { first: '1', second: '7' } }

  const exclusivePicks = [
    { participant: 'Ana', picks: ['7'] },
    { participant: 'Beto', picks: ['4'] },
  ]
  assert.deepEqual(calculateDailyScores(exclusivePicks, result, scoring), { Ana: 17, Beto: 0 })
  assert.deepEqual(enrichPicksWithScores(exclusivePicks, result, scoring)[0].picks[0], {
    horse: '7',
    score: 17,
    scoreKind: 'exclusiveSecond',
  })

  const sharedPicks = [
    { participant: 'Ana', picks: ['7'] },
    { participant: 'Beto', picks: ['7'] },
  ]
  assert.deepEqual(calculateDailyScores(sharedPicks, result, scoring), { Ana: 6, Beto: 6 })
  assert.deepEqual(
    enrichPicksWithScores(sharedPicks, result, scoring).map((entry) => entry.picks[0].scoreKind),
    ['second', 'second'],
  )
})

test('el empate en segundo evalúa exclusividad por caballo y deduplica identidades', () => {
  const scoring = {
    ...pointConfig,
    points: { ...pointConfig.points, exclusiveSecond: 17 },
  }
  const picks = [
    { participant: 'Ana', picks: ['7'] },
    { participant: ' ANA ', picks: ['7'] },
    { participant: 'Beto', picks: ['8'] },
    { participant: 'Cata', picks: ['8'] },
  ]
  const results = { 1: { first: '1', second: '7', empateSegundo: '8' } }

  assert.deepEqual(calculateDailyScores(picks, results, scoring), {
    Ana: 17,
    ' ANA ': 17,
    Beto: 6,
    Cata: 6,
  })
  assert.deepEqual(
    enrichPicksWithScores(picks, results, scoring).map((entry) => entry.picks[0].scoreKind),
    ['exclusiveSecond', 'exclusiveSecond', 'second', 'second'],
  )
})

test('un retiro defendido participa en la exclusividad de segundo lugar', () => {
  const scoring = {
    ...pointConfig,
    points: { ...pointConfig.points, exclusiveSecond: 17 },
  }
  const result = { 1: { first: '1', second: '7', favorito: '7', retiros: ['9'] } }

  assert.deepEqual(calculateDailyScores([
    { participant: 'Ana', picks: ['9'] },
    { participant: 'Beto', picks: ['4'] },
  ], result, scoring), { Ana: 17, Beto: 0 })
  assert.deepEqual(calculateDailyScores([
    { participant: 'Ana', picks: ['9'] },
    { participant: 'Beto', picks: ['7'] },
  ], result, scoring), { Ana: 6, Beto: 6 })
})

test('campañas antiguas conservan el puntaje normal de segundo para el exclusivo', () => {
  const legacyScoring = {
    mode: 'points',
    points: { first: 11, second: 6, third: 2, exclusiveFirst: 23 },
  }
  const picks = [{ participant: 'Ana', picks: ['7'] }]
  const results = { 1: { first: '1', second: '7' } }

  assert.deepEqual(calculateDailyScores(picks, results, legacyScoring), { Ana: 6 })
  assert.equal(enrichPicksWithScores(picks, results, legacyScoring)[0].picks[0].scoreKind, 'exclusiveSecond')
  assert.equal(parser.normalizeScoring(legacyScoring).points.exclusiveSecond, 6)
})

test('la tabla conserva la categoría de un exclusivo segundo configurado en cero', () => {
  const scoring = {
    mode: 'points',
    points: { ...pointConfig.points, exclusiveSecond: 0 },
  }
  const enriched = [{
    participant: 'Ana',
    picks: [{ horse: '7', score: 0, scoreKind: 'exclusiveSecond' }],
  }]

  assert.equal(ensurePicksWithScores(enriched, {}, scoring), enriched)
  assert.equal(enriched[0].picks[0].scoreKind, 'exclusiveSecond')
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

test('la tabla visible formatea puntos sin $ y dividendos con $ usando el puntaje enriquecido', () => {
  const scoring = {
    mode: 'points',
    doubleLastRace: false,
    points: { first: 10, second: 5, third: 1, exclusiveFirst: 20 },
  }
  const picks = [
    { participant: 'MANZANA', picks: ['12', '6', '3'] },
    { participant: 'ROMATRI', picks: ['8', '7', '3'] },
  ]
  const results = {
    1: { first: '4', second: '12', third: '7' },
    2: { first: '1', second: '2', third: '3' },
    3: { first: '3', second: '5', third: '8' },
  }
  const enriched = enrichPicksWithScores(picks, results, scoring)
  const manzanaScores = enriched[0].picks.map((pick) => pick.score)

  assert.deepEqual(manzanaScores, [5, 0, 10])
  assert.deepEqual(
    enriched[0].picks.map((pick) => formatPickScore(pick.score, scoring.mode)),
    ['5', null, '10'],
  )
  assert.equal(formatPickScore(3.2, 'dividend'), '$3.2')
})

test('la tabla enriquece picks crudos para conservar las insignias en todos sus consumidores', () => {
  const scoring = {
    mode: 'points',
    doubleLastRace: false,
    points: { first: 10, second: 5, third: 1, exclusiveFirst: 20 },
  }
  const rawPicks = [
    { participant: 'MANZANA', picks: ['12', '6', '3'] },
    { participant: 'ROMATRI', picks: ['8', '7', '3'] },
  ]
  const results = {
    1: { first: '4', second: '12', third: '7' },
    2: { first: '1', second: '2', third: '3' },
    3: { first: '3', second: '5', third: '8' },
  }

  const enriched = ensurePicksWithScores(rawPicks, results, scoring)

  assert.deepEqual(enriched[0].picks.map((pick) => pick.score), [5, 0, 10])
  assert.deepEqual(
    enriched[0].picks.map((pick) => formatPickScore(pick.score, scoring.mode)),
    ['5', null, '10'],
  )
  assert.equal(ensurePicksWithScores(enriched, results, scoring), enriched)
})

test('pantalla y exportación reutilizan una sola colección enriquecida', () => {
  const containerSource = fs.readFileSync(
    path.join(ROOT, 'mockup-prototipo', 'src', 'components', 'tables', 'PicksTableContainer.jsx'),
    'utf8',
  )
  const enrichmentCalls = containerSource.match(/enrichPicksWithScores\s*\(/g) || []

  assert.equal(enrichmentCalls.length, 1)
  assert.match(containerSource, /const enrichedVisiblePicks = useMemo/)
  assert.match(containerSource, /const sorted = \[\.\.\.enrichedVisiblePicks\]/)
  assert.match(containerSource, /picks=\{enrichedVisiblePicks\}/)
})

test('valores cero se conservan en frontend, wizard y normalización backend', () => {
  const zeroConfig = {
    mode: 'points',
    points: { first: 0, second: 0, third: 0, exclusiveFirst: 0, exclusiveSecond: 0 },
  }
  assert.deepEqual(calculateDailyScores([{ participant: 'Ana', picks: ['7'] }], { 1: { first: '7' } }, zeroConfig), { Ana: 0 })
  assert.deepEqual(parser.normalizeScoring(zeroConfig).points, {
    first: 0,
    second: 0,
    third: 0,
    exclusiveFirst: 0,
    exclusiveSecond: 0,
  })

  const wizardSource = fs.readFileSync(
    path.join(ROOT, 'mockup-prototipo', 'src', 'components', 'CampaignWizard.jsx'),
    'utf8',
  )
  assert.match(wizardSource, /pointsFirst:\s*toFiniteNumberOrDefault\(normalizedWeeklyCampaign\.scoring\?\.points\?\.first, 10\)/)
  assert.match(wizardSource, /first:\s*toFiniteNumberOrDefault\(form\.pointsFirst, 10\)/)
  assert.match(wizardSource, /pointsExclusiveSecond:\s*toFiniteNumberOrDefault\(\s*normalizedWeeklyCampaign\.scoring\?\.points\?\.exclusiveSecond,/)
  assert.match(wizardSource, /exclusiveSecond:\s*toFiniteNumberOrDefault\(\s*form\.pointsExclusiveSecond,/)
  assert.doesNotMatch(wizardSource, /Number\(form\.points(?:First|Second|Third|ExclusiveFirst|ExclusiveSecond)\) \|\|/)
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

test('el parser replica exclusivo segundo, empate por caballo y retiro defendido', () => {
  const scoring = {
    ...pointConfig,
    points: { ...pointConfig.points, exclusiveSecond: 17 },
  }
  const participants = [
    {
      index: 1,
      name: 'Ana',
      picks: [
        { race: 1, raceLabel: '1', horse: '9' },
        { race: 2, raceLabel: '2', horse: '7' },
        { race: 3, raceLabel: '3', horse: '8' },
      ],
    },
    {
      index: 2,
      name: 'Beto',
      picks: [
        { race: 1, raceLabel: '1', horse: '4' },
        { race: 2, raceLabel: '2', horse: '6' },
        { race: 3, raceLabel: '3', horse: '8' },
      ],
    },
    {
      index: 3,
      name: 'Cata',
      picks: [
        { race: 1, raceLabel: '1', horse: '4' },
        { race: 2, raceLabel: '2', horse: '6' },
        { race: 3, raceLabel: '3', horse: '5' },
      ],
    },
  ]
  const results = [
    { race: '1', primero: '1', segundo: '7', favorito: '7', retiros: ['9'] },
    { race: '2', primero: '1', segundo: '7', empateSegundo: '6' },
    { race: '3', primero: '1', segundo: '8' },
  ]

  const scored = parser.scoreParticipants(participants, results, scoring, 3)
  assert.deepEqual(scored.map((entry) => entry.picks.map((pick) => pick.score)), [
    [17, 17, 6],
    [0, 6, 6],
    [0, 6, 0],
  ])
  assert.deepEqual(scored.map((entry) => entry.points), [40, 12, 6])
})

test('frontend y parser reconocen aliases ingleses para exclusivo segundo', () => {
  const scoring = {
    ...pointConfig,
    points: { ...pointConfig.points, exclusiveSecond: 17 },
  }
  const frontendPicks = [{ participant: 'Ana', picks: ['7'] }]
  const frontendResults = { 1: { first: '1', second: '7' } }
  const parserParticipants = [{
    index: 1,
    name: 'Ana',
    picks: [{ race: 1, raceLabel: '1', horse: '7' }],
  }]
  const parserResults = [{ race: '1', first: '1', second: '7' }]

  assert.deepEqual(calculateDailyScores(frontendPicks, frontendResults, scoring), { Ana: 17 })
  assert.equal(parser.scoreParticipants(parserParticipants, parserResults, scoring, 1)[0].points, 17)
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
      points: { first: 0, second: 4, third: 2, exclusiveFirst: 9, exclusiveSecond: 12 },
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

test('el primero normal y exclusivo reciben bono de 3 con dividendo ganador mayor a 10', () => {
  const scoring = {
    mode: 'points',
    doubleLastRace: true,
    points: { first: 10, second: 5, third: 1, exclusiveFirst: 20 },
  }
  const result = { 1: { first: '5', ganador: '12' } }

  assert.deepEqual(calculateDailyScores([
    { participant: 'Ana', picks: ['5'] },
    { participant: 'Beto', picks: ['5'] },
  ], result, scoring), { Ana: 13, Beto: 13 })
  assert.deepEqual(calculateDailyScores([
    { participant: 'Ana', picks: ['5'] },
    { participant: 'Beto', picks: ['4'] },
  ], result, scoring), { Ana: 23, Beto: 0 })
  assert.deepEqual(
    enrichPicksWithScores([{ participant: 'Ana', picks: ['5'] }], result, scoring)[0].picks[0],
    { horse: '5', score: 23, scoreKind: 'exclusiveFirst', bonusApplied: true },
  )
})

test('el bono usa umbral inclusivo y no afecta posiciones distintas o dividendos inválidos', () => {
  const scoring = {
    mode: 'points',
    points: { first: 10, second: 5, third: 1, exclusiveFirst: 20 },
  }

  assert.deepEqual(calculateDailyScores([
    { participant: 'Exacto', picks: ['5'] },
    { participant: 'Compartido', picks: ['5'] },
    { participant: 'Segundo', picks: ['2'] },
    { participant: 'Tercero', picks: ['3'] },
  ], { 1: { first: '5', second: '2', third: '3', ganador: '10' } }, scoring), {
    Exacto: 13,
    Compartido: 13,
    Segundo: 5,
    Tercero: 1,
  })
  assert.deepEqual(calculateDailyScores([{ participant: 'Ana', picks: ['5'] }], {
    1: { first: '5', ganador: '' },
  }, scoring), { Ana: 20 })
  assert.deepEqual(calculateDailyScores([{ participant: 'Ana', picks: ['5'] }], {
    1: { first: '5', ganador: 'no disponible' },
  }, scoring), { Ana: 20 })
  assert.deepEqual(calculateDailyScores([{ participant: 'Ana', picks: ['5'] }], {
    1: { first: '5', ganador: '10,01' },
  }, scoring), { Ana: 23 })
})

test('en empate de primero cada ejemplar usa su dividendo y el fallback conserva el token correspondiente', () => {
  const scoring = {
    mode: 'points',
    points: { first: 10, second: 5, third: 1, exclusiveFirst: 20 },
  }

  assert.deepEqual(calculateDailyScores([
    { participant: 'Ana', picks: ['5'] },
    { participant: 'Beto', picks: ['5'] },
    { participant: 'Cata', picks: ['6'] },
  ], { 1: {
    first: '5',
    empatePrimero: '6',
    ganador: '12',
    empatePrimeroGanador: '10',
  } }, scoring), { Ana: 13, Beto: 13, Cata: 23 })

  assert.deepEqual(calculateDailyScores([
    { participant: 'Ana', picks: ['5'] },
    { participant: 'Beto', picks: ['6'] },
  ], { 1: { primero: '5 / 6', ganador: '12 / 9' } }, scoring), {
    Ana: 23,
    Beto: 20,
  })
  assert.deepEqual(calculateDailyScores([
    { participant: 'Ana', picks: ['5'] },
    { participant: 'Beto', picks: ['6'] },
  ], { 1: { first: '5', empatePrimero: '6', ganador: '12 / 9' } }, scoring), {
    Ana: 23,
    Beto: 20,
  })
})

test('el retiro defendido usa el dividendo del favorito efectivo y solo bonifica primero', () => {
  const scoring = {
    mode: 'points',
    points: { first: 10, second: 5, third: 1, exclusiveFirst: 20 },
  }
  const result = { 1: { first: '5', second: '2', favorito: '5', ganador: '12', retiros: ['9'] } }

  assert.deepEqual(calculateDailyScores([
    { participant: 'Ana', picks: ['9'] },
    { participant: 'Beto', picks: ['4'] },
  ], result, scoring), { Ana: 23, Beto: 0 })
  assert.deepEqual(calculateDailyScores([
    { participant: 'Ana', picks: ['9'] },
    { participant: 'Beto', picks: ['5'] },
  ], result, scoring), { Ana: 13, Beto: 13 })
})

test('el parser replica el bono de primero y no altera dividendos ni el multiplicador de última carrera', () => {
  const scoring = {
    mode: 'points',
    doubleLastRace: true,
    points: { first: 10, second: 5, third: 1, exclusiveFirst: 20 },
  }
  const participants = [
    { index: 1, name: 'Ana', picks: [{ race: 1, raceLabel: '1', horse: '5' }] },
    { index: 2, name: 'Beto', picks: [{ race: 1, raceLabel: '1', horse: '4' }] },
  ]
  const results = [{ race: '1', primero: '5', ganador: '12', favorito: '5', retiros: [] }]
  const scored = parser.scoreParticipants(participants, results, scoring, 1)

  assert.deepEqual(scored.map((entry) => entry.picks[0].score), [23, 0])
  assert.deepEqual(scored.map((entry) => entry.points), [23, 0])
  assert.deepEqual(calculateDailyScores([
    { participant: 'Ana', picks: ['5'] },
    { participant: 'Beto', picks: ['4'] },
  ], { 1: results[0] }, scoring), { Ana: 23, Beto: 0 })
  assert.deepEqual(calculateDailyScores([{ participant: 'Ana', picks: ['5'] }], {
    1: { first: '5', ganador: '12', divSegundoPrimero: '4', divTerceroPrimero: '2' },
  }, { mode: 'dividend', doubleLastRace: false, points: {} }), { Ana: 18 })

  const tiedParticipants = [
    { index: 1, name: 'Cata', picks: [{ race: 1, raceLabel: '1', horse: '5' }] },
    { index: 2, name: 'Dani', picks: [{ race: 1, raceLabel: '1', horse: '6' }] },
  ]
  const tiedResults = [{
    race: '1',
    primero: '5',
    empatePrimero: '6',
    ganador: '12',
    empatePrimeroGanador: '10',
  }]
  assert.deepEqual(
    parser.scoreParticipants(tiedParticipants, tiedResults, scoring, 1).map((entry) => entry.picks[0].score),
    [23, 23],
  )
  assert.deepEqual(
    parser.scoreParticipants(tiedParticipants, [{ race: '1', primero: '5 / 6', ganador: '12 / 9' }], scoring, 1)
      .map((entry) => entry.picks[0].score),
    [23, 20],
  )

  const defendedParticipants = [
    { index: 1, name: 'Eva', picks: [{ race: 1, raceLabel: '1', horse: '9' }] },
  ]
  const defendedResult = [{
    race: '1', primero: '5', ganador: '12', favorito: '5', retiros: ['9'],
  }]
  assert.equal(parser.scoreParticipants(defendedParticipants, defendedResult, scoring, 1)[0].picks[0].score, 23)
})

test('parser y frontend mantienen el bono con ganador anidado y retiro defendido', () => {
  const scoring = {
    mode: 'points',
    points: { first: 10, second: 5, third: 1, exclusiveFirst: 20 },
  }
  const result = {
    race: '1',
    winner: { number: '5', dividend: '12' },
    favorite: { number: '5' },
    withdrawals: [{ horse: '9' }],
  }
  const participants = [
    { index: 1, name: 'Ana', picks: [{ race: 1, horse: '9' }] },
  ]

  assert.equal(parser.scoreParticipants(participants, [result], scoring, 1)[0].picks[0].score, 23)
  assert.deepEqual(calculateDailyScores([{ participant: 'Ana', picks: ['9'] }], { 1: result }, scoring), { Ana: 23 })
})

test('cada pick enriquecido conserva su categoría aunque las posiciones entreguen el mismo puntaje', () => {
  const scoring = {
    mode: 'points',
    points: { first: 5, second: 5, third: 5, exclusiveFirst: 5 },
  }
  const picks = [
    { participant: 'Ana', picks: ['1', '2', '3', '4'] },
    { participant: 'Beto', picks: ['1', '9', '9', '9'] },
  ]
  const results = {
    1: { first: '1' },
    2: { first: '8', second: '2' },
    3: { first: '8', second: '7', third: '3' },
    4: { first: '4' },
  }

  const enriched = enrichPicksWithScores(picks, results, scoring)
  assert.deepEqual(enriched[0].picks.map((pick) => pick.score), [5, 5, 5, 5])
  assert.deepEqual(enriched[0].picks.map((pick) => pick.scoreKind), [
    'first',
    'exclusiveSecond',
    'third',
    'exclusiveFirst',
  ])
})

test('empates y retiros defendidos transportan la categoría de la posición efectiva', () => {
  const picks = [
    { participant: 'Ana', picks: ['9', '5', '6'] },
    { participant: 'Beto', picks: ['2', '8', '7'] },
  ]
  const results = {
    1: { first: '7', favorito: '7', retiros: ['9'] },
    2: { first: '1', second: '4', empateSegundo: '5' },
    3: { first: '1', second: '2', third: '3', empateTercero: '6' },
  }

  const enriched = enrichPicksWithScores(picks, results, pointConfig)
  assert.deepEqual(enriched[0].picks.map((pick) => pick.scoreKind), [
    'exclusiveFirst',
    'exclusiveSecond',
    'third',
  ])
})

test('picks antiguos con score pero sin scoreKind se vuelven a enriquecer en modo puntos', () => {
  const legacy = [{ participant: 'Ana', picks: [{ horse: '4', score: 6 }] }]
  const enriched = ensurePicksWithScores(
    legacy,
    { 1: { first: '8', second: '4' } },
    pointConfig,
  )

  assert.notEqual(enriched, legacy)
  assert.equal(enriched[0].picks[0].scoreKind, 'exclusiveSecond')

  const invalidKind = [{ participant: 'Ana', picks: [{ horse: '4', score: 6, scoreKind: 'segundo' }] }]
  const repaired = ensurePicksWithScores(invalidKind, { 1: { first: '8', second: '4' } }, pointConfig)
  assert.notEqual(repaired, invalidKind)
  assert.equal(repaired[0].picks[0].scoreKind, 'exclusiveSecond')
})

test('colores de puntos se normalizan, usan defaults y calculan contraste solo en points', () => {
  const resolved = resolveScoringConfig({
    mode: 'points',
    pointColors: { first: '#abcdef', second: 'red', third: '#FFFFFF' },
  })

  assert.deepEqual(resolved.pointColors, {
    first: '#ABCDEF',
    second: DEFAULT_POINT_COLORS.second,
    third: '#FFFFFF',
    exclusiveFirst: DEFAULT_POINT_COLORS.exclusiveFirst,
    exclusiveSecond: DEFAULT_POINT_COLORS.exclusiveSecond,
    firstBonus: DEFAULT_POINT_COLORS.firstBonus,
    exclusiveFirstBonus: DEFAULT_POINT_COLORS.exclusiveFirstBonus,
    exclusivePending: DEFAULT_POINT_COLORS.exclusivePending,
  })
  assert.deepEqual(getPointScoreBadgeStyle('first', resolved), {
    backgroundColor: '#ABCDEF',
    color: '#111111',
  })
  assert.equal(getPointScoreBadgeStyle('first', {
    mode: 'points',
    pointColors: { first: DEFAULT_POINT_COLORS.first },
  }).color, '#111111')
  assert.equal(getPointScoreBadgeStyle('first', { ...resolved, mode: 'dividend' }), null)
})

test('colores parciales se fusionan sin borrar personalizaciones de fuentes anteriores', () => {
  const resolved = resolveScoringConfig(
    { mode: 'points', pointColors: { first: '#112233', third: '#334455' } },
    { pointColors: { second: '#223344' } },
  )

  assert.deepEqual(resolved.pointColors, {
    first: '#112233',
    second: '#223344',
    third: '#334455',
    exclusiveFirst: DEFAULT_POINT_COLORS.exclusiveFirst,
    exclusiveSecond: DEFAULT_POINT_COLORS.exclusiveSecond,
    firstBonus: DEFAULT_POINT_COLORS.firstBonus,
    exclusiveFirstBonus: DEFAULT_POINT_COLORS.exclusiveFirstBonus,
    exclusivePending: DEFAULT_POINT_COLORS.exclusivePending,
  })
})

test('PNG usa los cinco colores por categoría y conserva el color de dividendos', () => {
  const pointColors = {
    first: '#112233',
    second: '#224466',
    third: '#336699',
    exclusiveFirst: '#8844AA',
    exclusiveSecond: '#CC3377',
  }
  const entries = [{
    participant: 'Ana',
    points: 20,
    scoring: { mode: 'points', pointColors },
    picks: [
      { horse: '1', score: 10, scoreKind: 'first' },
      { horse: '2', score: 5, scoreKind: 'second' },
      { horse: '3', score: 1, scoreKind: 'third' },
      { horse: '4', score: 20, scoreKind: 'exclusiveFirst' },
      { horse: '5', score: 12, scoreKind: 'exclusiveSecond' },
    ],
  }]
  const html = generateExportHTML(entries, 5, 'Puntos', '2026-08-18')

  Object.values(pointColors).forEach((color) => assert.match(html, new RegExp(`background:${color}`, 'i')))

  const exportColors = getExportStyleColors('excel-classic')
  assert.deepEqual(
    getExportScoreColors(
      { score: 3.2, scoreKind: 'first' },
      { mode: 'dividend', pointColors },
      exportColors,
    ),
    { backgroundColor: exportColors.divBg, textColor: exportColors.divText },
  )
})

test('wizard y parser guardan colores válidos y reemplazan inválidos por defaults', () => {
  assert.deepEqual(parser.normalizeScoring({
    mode: 'points',
    pointColors: {
      first: '#010203',
      second: 'javascript:alert(1)',
      third: '#aabbcc',
    },
  }).pointColors, {
    first: '#010203',
    second: DEFAULT_POINT_COLORS.second,
    third: '#AABBCC',
    exclusiveFirst: DEFAULT_POINT_COLORS.exclusiveFirst,
    exclusiveSecond: DEFAULT_POINT_COLORS.exclusiveSecond,
    firstBonus: DEFAULT_POINT_COLORS.firstBonus,
    exclusiveFirstBonus: DEFAULT_POINT_COLORS.exclusiveFirstBonus,
    exclusivePending: DEFAULT_POINT_COLORS.exclusivePending,
  })

  const wizardSource = fs.readFileSync(
    path.join(ROOT, 'mockup-prototipo', 'src', 'components', 'CampaignWizard.jsx'),
    'utf8',
  )
  assert.match(wizardSource, /type="color"[^>]+Color 1° lugar/)
  assert.match(wizardSource, /pointsExclusiveSecond:\s*10/)
  assert.match(wizardSource, /type="color"[^>]+Color exclusivo 2°/)
  assert.match(wizardSource, /type="color"[^>]+Color primero más 3/)
  assert.match(wizardSource, /type="color"[^>]+Color exclusivo primero más 3/)
  assert.match(wizardSource, /type="color"[^>]+Color exclusivo carrera futura/)
  assert.match(wizardSource, /pointColors:\s*resolvePointColors\(form\.pointColors\)/)
})

test('bonos y exclusivos futuros usan colores configurables en tabla y PNG', () => {
  const pointColors = {
    ...DEFAULT_POINT_COLORS,
    firstBonus: '#123456',
    exclusiveFirstBonus: '#654321',
    exclusivePending: '#ABC123',
  }
  const scoring = { mode: 'points', pointColors }

  assert.deepEqual(getPointScoreBadgeStyle('first', scoring, { bonusApplied: true }), {
    backgroundColor: '#123456',
    color: '#FFFFFF',
  })
  assert.deepEqual(getPointScoreBadgeStyle('exclusiveFirst', scoring, { bonusApplied: true }), {
    backgroundColor: '#654321',
    color: '#FFFFFF',
  })
  const exportColors = getExportStyleColors('excel-classic')
  assert.deepEqual(getExportScoreColors(
    { scoreKind: 'first', bonusApplied: true },
    scoring,
    exportColors,
  ), {
    backgroundColor: '#123456',
    textColor: '#FFFFFF',
  })
  assert.deepEqual(getExportScoreColors(
    { pendingExclusive: true },
    scoring,
    exportColors,
  ), {
    backgroundColor: '#ABC123',
    textColor: '#111111',
  })

  const picks = [
    { participant: 'Ana', picks: ['1', '7'] },
    { participant: 'Beto', picks: ['2', '7'] },
    { participant: 'Cata', picks: ['3', '8'] },
  ]
  const pending = calculatePendingExclusivePickMap(picks)
  assert.deepEqual([...pending.get('1')].sort(), ['1', '2', '3'])
  assert.deepEqual([...pending.get('2')].sort(), ['8'])

  const results = { 1: { first: '1', ganador: '10' } }
  const enriched = enrichPicksWithScores(picks, results, scoring)
  assert.equal(Boolean(enriched[0].picks[1].pendingExclusive), false)
  assert.equal(enriched[2].picks[1].pendingExclusive, true)

  const partial = enrichPicksWithScores(picks, { 1: results[1], 2: { race: 2 } }, scoring)
  assert.equal(partial[2].picks[1].pendingExclusive, true)

  const html = generateExportHTML(
    enriched,
    2,
    'Puntos',
    '2026-08-28',
    'excel-classic',
    null,
    { scoring },
    results,
    null,
    { picksLayout: PICKS_PNG_LAYOUTS.RANKING_PICKS },
  )
  assert.match(html, /1° \+3/)
  assert.match(html, /Exclusivo futuro/)
  assert.match(html, new RegExp(`background:${pointColors.exclusivePending}`, 'i'))
})

test('PNG por dividendos no marca exclusivos pendientes', () => {
  const exportColors = getExportStyleColors('excel-classic')
  const html = generateExportHTML(
    [{
      participant: 'Ana',
      picks: [{ horse: '7', pendingExclusive: true }],
      scoring: { mode: 'dividend' },
    }],
    1,
    'Dividendos',
    '2026-08-29',
  )

  assert.doesNotMatch(html, new RegExp(`background:${DEFAULT_POINT_COLORS.exclusivePending}`, 'i'))
  assert.match(html, new RegExp(`background:${exportColors.pickBg}`, 'i'))
})

test('formato PNG de pronósticos conserva ranking-picks y usa standard como fallback', () => {
  const payload = buildCampaignStylePayload({
    rankingTheme: 'dark-pro',
    pngTheme: 'excel-classic',
    pngOptions: { picksLayout: PICKS_PNG_LAYOUTS.RANKING_PICKS },
  })

  assert.equal(payload.pngOptions.picksLayout, PICKS_PNG_LAYOUTS.RANKING_PICKS)
  assert.equal(
    resolveCampaignExportConfig({ style: payload }).pngOptions.picksLayout,
    PICKS_PNG_LAYOUTS.RANKING_PICKS,
  )
  assert.equal(
    getDefaultCampaignStyleForm({ style: payload }).pngOptions.picksLayout,
    PICKS_PNG_LAYOUTS.RANKING_PICKS,
  )
  assert.equal(resolveCampaignExportConfig({}).pngOptions.picksLayout, PICKS_PNG_LAYOUTS.STANDARD)
  assert.equal(
    resolveCampaignExportConfig({ style: { pngOptions: { picksLayout: 'desconocido' } } }).pngOptions.picksLayout,
    PICKS_PNG_LAYOUTS.STANDARD,
  )
})

test('PNG ranking-picks usa una fila, orden estable y colorea el caballo incluso con cero puntos', () => {
  const pointColors = {
    first: '#112233',
    second: '#224466',
    third: '#336699',
    exclusiveFirst: '#8844AA',
    exclusiveSecond: '#CC3377',
  }
  const scoring = { mode: 'points', pointColors }
  const entries = [
    {
      participant: 'Menor',
      points: 5,
      scoring,
      picks: [{ horse: '91', score: 0, scoreKind: 'third' }],
    },
    {
      participant: 'Empate primero',
      points: 10,
      scoring,
      picks: [
        { horse: '101', score: 0, scoreKind: 'first' },
        { horse: '102', score: 0, scoreKind: 'second' },
        { horse: '103', score: 0, scoreKind: 'third' },
        { horse: '104', score: 0, scoreKind: 'exclusiveFirst' },
        { horse: '105', score: 0, scoreKind: 'exclusiveSecond' },
      ],
    },
    {
      participant: 'Empate segundo',
      points: 10,
      scoring,
      picks: [{ horse: '81', score: 0, scoreKind: null }],
    },
  ]

  const html = generateExportHTML(
    entries,
    5,
    'Puntos',
    '2026-08-28',
    'excel-classic',
    null,
    { scoring },
    {},
    null,
    { picksLayout: PICKS_PNG_LAYOUTS.RANKING_PICKS },
  )

  assert.equal((html.match(/<tr>/g) || []).length, entries.length + 1)
  assert.ok(html.indexOf('Empate primero') < html.indexOf('Empate segundo'))
  assert.ok(html.indexOf('Empate segundo') < html.indexOf('Menor'))
  assert.match(html, />TOTAL<\/th>/)
  assert.doesNotMatch(html, />N°<\/th>/)
  Object.values(pointColors).forEach((color) => assert.match(html, new RegExp(`background:${color}`, 'i')))
  assert.match(html, />101<\/td>/)
  assert.doesNotMatch(html, />0<\/td>/)
})

test('PNG ranking-picks conserva grupos y ordena dentro de cada sección', () => {
  const scoring = { mode: 'points', pointColors: DEFAULT_POINT_COLORS }
  const entries = [
    { participant: 'Fuera', points: 99, scoring, picks: [{ horse: '9', score: 10, scoreKind: 'first' }] },
    { participant: 'Bajo', points: 2, scoring, picks: [{ horse: '2', score: 0, scoreKind: null }] },
    { participant: 'Empate B', points: 8, scoring, picks: [{ horse: '3', score: 1, scoreKind: 'third' }] },
    { participant: 'Empate A', points: 8, scoring, picks: [{ horse: '4', score: 5, scoreKind: 'second' }] },
  ]
  const html = generateExportHTML(
    entries,
    1,
    'Grupo',
    '2026-08-28',
    'excel-classic',
    null,
    { scoring },
    {},
    [{ id: 'g1', name: 'Grupo 1', members: ['Bajo', 'Empate A', 'Empate B'] }],
    { picksLayout: PICKS_PNG_LAYOUTS.RANKING_PICKS },
  )

  assert.doesNotMatch(html, />Fuera<\/td>/)
  assert.ok(html.indexOf('Empate B') < html.indexOf('Empate A'))
  assert.ok(html.indexOf('Empate A') < html.indexOf('Bajo'))
})

test('ranking-picks usa score cuando points viene vacío o no numérico', () => {
  const scoring = { mode: 'points', pointColors: DEFAULT_POINT_COLORS }
  const entries = [
    { participant: 'Vacío', points: '', score: 10, scoring, picks: [] },
    { participant: 'No numérico', points: Number.NaN, score: 8, scoring, picks: [] },
    { participant: 'Cero real', points: 0, score: 99, scoring, picks: [] },
  ]
  const html = generateExportHTML(
    entries,
    1,
    'Totales',
    '2026-08-28',
    'excel-classic',
    null,
    { scoring },
    {},
    null,
    { picksLayout: PICKS_PNG_LAYOUTS.RANKING_PICKS },
  )

  assert.ok(html.indexOf('Vacío') < html.indexOf('No numérico'))
  assert.ok(html.indexOf('No numérico') < html.indexOf('Cero real'))
  assert.match(html, />10<\/td>/)
  assert.match(html, />8<\/td>/)
  assert.match(html, />0<\/td>/)
})

test('formato antiguo y dividendos mantienen dos filas y el orden original', () => {
  const pointEntries = [
    { participant: 'Primero original', points: 1, scoring: { mode: 'points' }, picks: [{ horse: '1', score: 0, scoreKind: null }] },
    { participant: 'Segundo original', points: 20, scoring: { mode: 'points' }, picks: [{ horse: '2', score: 10, scoreKind: 'first' }] },
  ]
  const standardHtml = generateExportHTML(pointEntries, 1, 'Actual', '2026-08-28')
  assert.equal((standardHtml.match(/<tr>/g) || []).length, 5)
  assert.ok(standardHtml.indexOf('Primero original') < standardHtml.indexOf('Segundo original'))

  const dividendEntries = [{
    participant: 'Dividendos',
    points: 4.2,
    scoring: { mode: 'dividend' },
    picks: [{ horse: '7', score: 4.2, scoreKind: null }],
  }]
  const dividendHtml = generateExportHTML(
    dividendEntries,
    1,
    'Dividendos',
    '2026-08-28',
    'excel-classic',
    null,
    { scoring: { mode: 'dividend' } },
    {},
    null,
    { picksLayout: PICKS_PNG_LAYOUTS.RANKING_PICKS },
  )
  assert.equal((dividendHtml.match(/<tr>/g) || []).length, 3)
  assert.match(dividendHtml, />Puntos<\/th>/)
})

test('ranking-picks deja neutros los datos ausentes y no compacta una mezcla con dividendos', () => {
  const emptyColor = '#010203'
  const scoring = {
    mode: 'points',
    pointColors: { ...DEFAULT_POINT_COLORS, first: emptyColor },
  }
  const emptyHtml = generateExportHTML(
    [{ participant: 'Vacío', points: 0, scoring, picks: [{ horse: '', score: 0, scoreKind: 'first' }] }],
    1,
    'Vacío',
    '2026-08-28',
    'excel-classic',
    null,
    { scoring },
    {},
    null,
    { picksLayout: PICKS_PNG_LAYOUTS.RANKING_PICKS },
  )
  assert.match(emptyHtml, new RegExp(`background:${emptyColor}`, 'i'))
  assert.match(emptyHtml, /background:#FFFFFF;color:transparent/i)

  const mixedEntries = [
    { participant: 'Puntos', points: 10, scoring, picks: [{ horse: '1', score: 10, scoreKind: 'first' }] },
    { participant: 'Dividendos', points: 2.5, scoring: { mode: 'dividend' }, picks: [{ horse: '2', score: 2.5, scoreKind: null }] },
  ]
  const mixedHtml = generateExportHTML(
    mixedEntries,
    1,
    'Mixto',
    '2026-08-28',
    'excel-classic',
    null,
    null,
    {},
    null,
    { picksLayout: PICKS_PNG_LAYOUTS.RANKING_PICKS },
  )
  assert.equal((mixedHtml.match(/<tr>/g) || []).length, 5)
  assert.match(mixedHtml, />Puntos<\/th>/)
})

test('selector y ambas rutas de exportación propagan el formato PNG', () => {
  const styleStepSource = fs.readFileSync(
    path.join(ROOT, 'mockup-prototipo', 'src', 'components', 'campaigns', 'CampaignStyleStep.jsx'),
    'utf8',
  )
  const styleStepCss = fs.readFileSync(
    path.join(ROOT, 'mockup-prototipo', 'src', 'components', 'campaigns', 'CampaignStyleStep.module.css'),
    'utf8',
  )
  const appSource = fs.readFileSync(path.join(ROOT, 'mockup-prototipo', 'src', 'App.jsx'), 'utf8')
  const containerSource = fs.readFileSync(
    path.join(ROOT, 'mockup-prototipo', 'src', 'components', 'tables', 'PicksTableContainer.jsx'),
    'utf8',
  )
  const detailSource = fs.readFileSync(
    path.join(ROOT, 'mockup-prototipo', 'src', 'components', 'campaigns', 'CampaignDetailModal.jsx'),
    'utf8',
  )

  assert.match(styleStepSource, /Ranking con pronósticos/)
  assert.match(styleStepSource, /form\.scoring === 'points'/)
  assert.match(styleStepCss, /input:focus-visible \+ \.layoutOptionMarker/)
  assert.match(appSource, /pngOptions=\{campaignPngOptions\}/)
  assert.match(appSource, /selectedCampaign === 'all' && activeCampaignsForDisplay\.length > 1[\s\S]+return DEFAULT_PNG_OPTIONS/)
  assert.match(containerSource, /groupings,\s*pngOptions,/)
  assert.match(detailSource, /groupings,\s*campaignExportConfig\.pngOptions,/)
  assert.match(detailSource, /scoring:\s*scoringConfig,/)
})
