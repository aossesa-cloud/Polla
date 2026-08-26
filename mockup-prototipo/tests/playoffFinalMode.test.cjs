const assert = require('node:assert/strict')
const Module = require('node:module')
const path = require('node:path')
const test = require('node:test')
const { buildSync } = require('esbuild')

const ROOT = path.resolve(__dirname, '..')

function loadBundledModule(relativePath, options = {}) {
  const sourcePath = path.join(ROOT, 'src', ...relativePath.split('/'))
  const bundledSource = buildSync({
    entryPoints: [sourcePath],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    write: false,
    outdir: path.join(ROOT, '.test-build'),
    loader: options.loader,
    define: options.define,
  }).outputFiles.find((file) => file.path.endsWith('.js')).text
  const bundledModule = new Module(sourcePath, module)
  bundledModule.filename = sourcePath
  bundledModule.paths = Module._nodeModulePaths(path.dirname(sourcePath))
  bundledModule._compile(bundledSource, sourcePath)
  return bundledModule.exports
}

const {
  buildSingleGroupPlayoffMatchups,
  normalizePlayoffFinalConfig,
  splitPlayoffFinalLeaderboard,
} = loadBundledModule('services/playoffFinalMode.js')
const {
  applyWeeklyModeConfig,
  normalizeWeeklyModeConfig,
} = loadBundledModule('services/campaignModeConfig.js')
const { MODE_DESCRIPTIONS } = loadBundledModule('engine/modeEngine.js')
const { getInitialCampaignForm, isValidDirectQualifiersCount } = loadBundledModule(
  'components/CampaignWizard.jsx',
  {
    loader: { '.css': 'text' },
    define: { 'import.meta.env.VITE_API_URL': '""' },
  },
)

function buildLeaderboard(count) {
  return Array.from({ length: count }, (_, index) => ({
    participant: `P${String(index + 1).padStart(2, '0')}`,
    total: count - index,
    rawTotal: count - index,
  }))
}

test('playoff-final conserva cero al guardar y volver a normalizar', () => {
  const saved = applyWeeklyModeConfig({
    format: 'playoff-final',
    directQualifiersCount: 0,
    eliminatedBeforePlayoffCount: 2,
  })

  assert.equal(saved.directQualifiersCount, 0)
  assert.equal(saved.modeConfig.directQualifiersCount, 0)
  assert.equal(normalizeWeeklyModeConfig(saved).directQualifiersCount, 0)
  assert.equal(normalizePlayoffFinalConfig(saved).directQualifiersCount, 0)
})

test('35 participantes con cero directos y dos eliminados deja 33 en repechaje', () => {
  const split = splitPlayoffFinalLeaderboard(buildLeaderboard(35), {
    mode: 'playoff-final',
    directQualifiersCount: 0,
    eliminatedBeforePlayoffCount: 2,
  })
  const matchups = buildSingleGroupPlayoffMatchups(split.playoff, split.direct.length)
  const matchupNames = matchups.flatMap((matchup) => matchup.members)

  assert.deepEqual(split.directNames, [])
  assert.equal(split.playoffNames.length, 33)
  assert.deepEqual(split.eliminatedNames, ['P34', 'P35'])
  assert.equal(matchups.length, 17)
  assert.equal(matchups.filter((matchup) => !matchup.bye).length, 16)
  assert.equal(matchups.filter((matchup) => matchup.bye).length, 1)
  assert.equal(new Set(matchupNames).size, 33)
})

test('cero directos y cero eliminados manda a los 35 al repechaje', () => {
  const split = splitPlayoffFinalLeaderboard(buildLeaderboard(35), {
    format: 'playoff-final',
    directQualifiersCount: 0,
    eliminatedBeforePlayoffCount: 0,
  })

  assert.equal(split.direct.length, 0)
  assert.equal(split.eliminated.length, 0)
  assert.equal(split.playoff.length, 35)
})

test('campañas antiguas o valores inválidos mantienen el predeterminado de dos', () => {
  assert.equal(normalizeWeeklyModeConfig({ format: 'playoff-final' }).directQualifiersCount, 2)
  assert.equal(normalizePlayoffFinalConfig({ mode: 'playoff-final' }).directQualifiersCount, 2)
  assert.equal(normalizeWeeklyModeConfig({ format: 'playoff-final', directQualifiersCount: -1 }).directQualifiersCount, 2)
  assert.equal(normalizeWeeklyModeConfig({ format: 'playoff-final', directQualifiersCount: '' }).directQualifiersCount, 2)
  assert.equal(normalizeWeeklyModeConfig({ format: 'playoff-final', directQualifiersCount: false }).directQualifiersCount, 2)
  assert.equal(normalizePlayoffFinalConfig({ mode: 'playoff-final', directQualifiersCount: 'x' }).directQualifiersCount, 2)
  assert.equal(normalizePlayoffFinalConfig({ mode: 'playoff-final', directQualifiersCount: ' ' }).directQualifiersCount, 2)
  assert.equal(normalizePlayoffFinalConfig({ mode: 'playoff-final', directQualifiersCount: false }).directQualifiersCount, 2)
})

test('una campaña nueva mantiene dos directos y puede iniciar con cero eliminados', () => {
  const form = getInitialCampaignForm({
    weekly: {
      directQualifiersCount: 0,
      eliminatedBeforePlayoffCount: 0,
    },
  })

  assert.equal(form.directQualifiersCount, 2)
  assert.equal(form.eliminatedBeforePlayoffCount, 0)
})

test('el formato raíz prevalece ante metadatos de modo heredados en conflicto', () => {
  const normalized = normalizePlayoffFinalConfig({
    format: 'playoff-final',
    directQualifiersCount: 0,
    modeConfig: { format: 'group-playoff-final' },
  })

  assert.equal(normalized.directQualifiersCount, 0)
})

test('cero sigue rechazado en el formato agrupado y en los demás formatos', () => {
  assert.equal(normalizeWeeklyModeConfig({
    format: 'group-playoff-final',
    directQualifiersCount: 0,
  }).directQualifiersCount, 2)
  assert.equal(normalizePlayoffFinalConfig({
    mode: 'group-playoff-final',
    directQualifiersCount: 0,
  }).directQualifiersCount, 2)
  assert.equal(isValidDirectQualifiersCount(0, 'group-playoff-final'), false)
  assert.equal(isValidDirectQualifiersCount(0, 'final-qualification'), false)
})

test('el formulario acepta solo enteros no negativos en playoff-final', () => {
  assert.equal(isValidDirectQualifiersCount(0, 'playoff-final'), true)
  assert.equal(isValidDirectQualifiersCount('0', 'playoff-final'), true)
  assert.equal(isValidDirectQualifiersCount('', 'playoff-final'), false)
  assert.equal(isValidDirectQualifiersCount(-1, 'playoff-final'), false)
  assert.equal(isValidDirectQualifiersCount(1.5, 'playoff-final'), false)
  assert.equal(isValidDirectQualifiersCount('abc', 'playoff-final'), false)
  assert.equal(isValidDirectQualifiersCount(false, 'playoff-final'), false)
  assert.equal(isValidDirectQualifiersCount(Number.MAX_SAFE_INTEGER + 1, 'playoff-final'), false)
})

test('la tarjeta del formato ya no promete un top dos fijo', () => {
  assert.doesNotMatch(MODE_DESCRIPTIONS['playoff-final'], /top\s*2/i)
  assert.match(MODE_DESCRIPTIONS['playoff-final'], /se configuran/i)
})
