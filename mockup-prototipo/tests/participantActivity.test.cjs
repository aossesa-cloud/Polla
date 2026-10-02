const assert = require('node:assert/strict')
const Module = require('node:module')
const path = require('node:path')
const test = require('node:test')
const { buildSync } = require('esbuild')

const ROOT = path.resolve(__dirname, '..', '..')
const sourcePath = path.join(ROOT, 'mockup-prototipo', 'src', 'services', 'participantActivity.js')
const bundledSource = buildSync({
  entryPoints: [sourcePath],
  bundle: true,
  format: 'cjs',
  platform: 'node',
  write: false,
}).outputFiles[0].text
const activityModule = new Module(sourcePath, module)
activityModule.filename = sourcePath
activityModule._compile(bundledSource, sourcePath)
const { buildParticipantActivityFromHistory, filterInactiveParticipants } = activityModule.exports

test('actividad histórica usa el último pick registrado aunque no provenga del evento cargado en pantalla', () => {
  const members = [{ name: 'Álvaro', group: 'encuentro-hipico' }]
  const history = [
    { name: 'ALVARO', lastPlayedDate: '2026-09-02', lastEventName: 'Jornada anterior' },
    { name: 'alvaro', lastPlayedDate: '2026-09-20', lastEventName: 'Jornada reciente' },
  ]

  const result = buildParticipantActivityFromHistory(members, history, { referenceDate: '2026-09-30' })

  assert.equal(result[0].lastPlayedDate, '2026-09-20')
  assert.equal(result[0].lastEventName, 'Jornada reciente')
  assert.equal(result[0].daysInactive, 10)
})

test('el umbral marca inactividad desde N días y conserva a quien jugó antes del umbral', () => {
  const members = [
    { name: 'Veinte días' },
    { name: 'Treinta días' },
    { name: 'Sin historial' },
  ]
  const history = [
    { name: 'Veinte días', lastPlayedDate: '2026-09-10' },
    { name: 'Treinta días', lastPlayedDate: '2026-08-31' },
  ]
  const activity = buildParticipantActivityFromHistory(members, history, { referenceDate: '2026-09-30' })

  assert.deepEqual(
    filterInactiveParticipants(activity, 30).map((member) => member.name),
    ['Sin historial', 'Treinta días'],
  )
})

test('registros sin fecha no se presentan como una participación fechada', () => {
  const result = buildParticipantActivityFromHistory(
    [{ name: 'Participante' }],
    [{ name: 'participante', lastPlayedDate: '', lastEventName: 'Sin fecha' }],
    { referenceDate: '2026-09-30' },
  )

  assert.equal(result[0].lastPlayedDate, null)
  assert.equal(result[0].daysInactive, null)
})
