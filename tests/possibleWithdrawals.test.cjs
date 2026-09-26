const test = require('node:test')
const assert = require('node:assert/strict')

const { extractPossibleWithdrawalReview } = require('../teletrak')

function oddsPayload({ runners, winPools, placePools, showPools, extraPools = {} }) {
  return {
    runners: { currentRace: runners },
    wps: {
      win: { oddsBoard: { pools: winPools } },
      ...(placePools ? { place: { oddsBoard: { pools: placePools } } } : {}),
      ...(showPools ? { show: { oddsBoard: { pools: showPools } } } : {}),
      ...extraPools,
    },
  }
}

const runners = [
  { programNumber: '1', horse: { horseName: 'Ganda' } },
  { programNumber: '2', horse: { horseName: 'Pastorella Bella' } },
]

test('reports an active runner when the WIN pool amount is explicitly zero', () => {
  const result = extractPossibleWithdrawalReview(oddsPayload({ runners, winPools: ['$0', '$740.500'] }))

  assert.equal(result.checked, true)
  assert.deepEqual(result.candidates, [{ number: '1', name: 'Ganda' }])
})

test('does not report a positive WIN pool amount', () => {
  const result = extractPossibleWithdrawalReview(oddsPayload({ runners, winPools: ['$740.500', '$1.136.100'] }))

  assert.equal(result.checked, true)
  assert.deepEqual(result.candidates, [])
})

test('does not treat malformed WIN pool text as an explicit zero', () => {
  const result = extractPossibleWithdrawalReview(oddsPayload({ runners, winPools: ['$0pending', '$740.500'] }))

  assert.equal(result.checked, false)
  assert.deepEqual(result.candidates, [])
})

test('reports WIN zero even when computed Prob is -0.01', () => {
  const withProb = runners.map((runner, index) => ({ ...runner, prob: index === 0 ? '-0.01' : '1.7' }))
  const result = extractPossibleWithdrawalReview(oddsPayload({ runners: withProb, winPools: ['$0', '$740.500'] }))

  assert.equal(result.checked, true)
  assert.deepEqual(result.candidates, [{ number: '1', name: 'Ganda' }])
})

test('does not require Place, Show, Exacta, or Double market data', () => {
  const result = extractPossibleWithdrawalReview(oddsPayload({ runners, winPools: ['$0', '$740.500'] }))

  assert.equal(result.checked, true)
  assert.deepEqual(result.candidates, [{ number: '1', name: 'Ganda' }])
})

test('leaves the race unchecked when any active runner has no WIN pool value', () => {
  const result = extractPossibleWithdrawalReview(oddsPayload({ runners, winPools: ['$0', null] }))

  assert.equal(result.checked, false)
  assert.deepEqual(result.candidates, [])
})

test('leaves the race unchecked when a zero-pool runner has no program number', () => {
  const unidentifiedRunners = [{ horse: { horseName: 'Sin número' } }, runners[1]]
  const result = extractPossibleWithdrawalReview(oddsPayload({ runners: unidentifiedRunners, winPools: ['$0', '$740.500'] }))

  assert.equal(result.checked, false)
  assert.deepEqual(result.candidates, [])
})

test('ignores runners already marked scratched by Teletrak', () => {
  const raceRunners = [
    runners[0],
    { ...runners[1], scratch: { scratched: true } },
  ]
  const result = extractPossibleWithdrawalReview(oddsPayload({ runners: raceRunners, winPools: ['$740.500', '$0'] }))

  assert.equal(result.checked, true)
  assert.deepEqual(result.candidates, [])
})
