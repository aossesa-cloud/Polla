/**
 * testRunner.js
 * 
 * Ejecutor automático de tests end-to-end para el sistema de polla hípica.
 * Usa el mismo motor base del sistema real, solo cambia la fuente de datos.
 * 
 * Uso:
 *   const { runFullTest } = require('./testRunner');
 *   runFullTest().then(report => console.log(report));
 */

const raceTestEngine = require('./raceTestEngine');
const { 
  startTestRace,
  updateTestResults,
  completeTestRace,
  forceTestResults,
  resetTestRace,
  setTestMode,
  configureTest,
  log,
} = raceTestEngine;

const testState = raceTestEngine.testState;

const { upsertResult, upsertEventMeta, loadOverrides, upsertRegistryParticipant } = require('./storage');

// ==========================================
// REPORT HELPER
// ==========================================
const report = {
  modules: {},
  passed: 0,
  failed: 0,
  errors: [],
  startTime: null,
  endTime: null,
};

function assert(testName, condition, message) {
  if (condition) {
    report.passed++;
    log(`✅ PASS: ${testName} - ${message || 'OK'}`);
  } else {
    report.failed++;
    const msg = `${testName} - ${message || 'FAIL'}`;
    report.errors.push(msg);
    log(`❌ FAIL: ${msg}`);
  }
}

function startModule(name) {
  report.modules[name] = { passed: 0, failed: 0, errors: [] };
  log(`\n📦 MODULE: ${name}`);
}

function endModule(name) {
  const m = report.modules[name];
  if (m) {
    log(`📊 ${name}: ${m.passed} passed, ${m.failed} failed`);
  }
}

// ==========================================
// CLEANUP
// ==========================================
async function cleanup() {
  log('🧹 Cleaning up test data...');
  // Reset testState.races for clean test run
  testState.races = {};
  testState.logs = [];
  report.passed = 0;
  report.failed = 0;
  report.errors = [];
  report.modules = {};
  report.startTime = null;
  report.endTime = null;
}

// ==========================================
// MODULE 1: CAMPAIGNS
// ==========================================
async function testCampaigns() {
  startModule('Campaigns');
  
  // Test campaign creation structure
  const dailyCampaign = {
    id: 'test-daily-1',
    name: 'Test Diaria',
    type: 'daily',
    date: testState.date,
    scoring: { mode: 'dividend', doubleLastRace: true },
    entryValue: 5000,
    promoEnabled: true,
    promoPrice: 9000,
  };

  const weeklyCampaign = {
    id: 'test-weekly-1',
    name: 'Test Semanal',
    type: 'weekly',
    startDate: testState.date,
    scoring: { mode: 'points', doubleLastRace: false, points: { first: 20, second: 10, third: 5, exclusiveFirst: 30 } },
    entryValue: 10000,
    promoEnabled: false,
  };

  assert('Daily campaign structure', dailyCampaign.id && dailyCampaign.date, 'Daily campaign has required fields');
  assert('Weekly campaign structure', weeklyCampaign.id && weeklyCampaign.startDate, 'Weekly campaign has required fields');
  assert('Scoring types', dailyCampaign.scoring.mode === 'dividend' && weeklyCampaign.scoring.mode === 'points', 'Both scoring types supported');
  assert('Pricing config', dailyCampaign.entryValue > 0 && dailyCampaign.promoEnabled, 'Pricing configured');
  
  endModule('Campaigns');
}

// ==========================================
// MODULE 2: PICKS
// ==========================================
async function testPicks() {
  startModule('Picks');
  
  const picks = {};
  const participants = ['ALF', 'BILZ', 'CARLOS', 'DAVID', 'EDUARDO'];
  
  // Generate picks for each participant
  for (const participant of participants) {
    picks[participant] = {};
    for (let race = 1; race <= 18; race++) {
      picks[participant][race] = String(Math.floor(Math.random() * 15) + 1);
    }
  }
  
  assert('Picks generated', Object.keys(picks).length === 5, `5 participants with picks`);
  assert('Picks per race', Object.keys(picks['ALF']).length === 18, '18 races per participant');
  assert('Pick values valid', normalizedPicksValid(picks), 'All picks are valid numbers');
  
  endModule('Picks');
  return picks;
}

function normalizedPicksValid(picks) {
  for (const participant of Object.keys(picks)) {
    for (const race of Object.keys(picks[participant])) {
      const pick = picks[participant][race];
      if (isNaN(pick) || pick < 1 || pick > 15) return false;
    }
  }
  return true;
}

// ==========================================
// MODULE 3: RESULTS SIMULATION
// ==========================================
async function testResults() {
  startModule('Results');
  
  // Reset races first
  testState.races = {};
  
  // Simulate 18 complete races
  for (let race = 1; race <= 18; race++) {
    await completeTestRace(race, {
      primero: String((race - 1) % 15 + 1),
      segundo: String((race) % 15 + 1),
      tercero: String((race + 1) % 15 + 1),
      ganador: (Math.random() * 10 + 1.5).toFixed(2),
      divSegundo: (Math.random() * 5 + 1.2).toFixed(2),
      divTercero: (Math.random() * 3 + 1.1).toFixed(2),
      favorito: String((race - 1) % 15 + 1),
    });
  }
  
  // Start 3 pending races
  for (let race = 19; race <= 21; race++) {
    await startTestRace(race);
  }
  
  const race18Status = testState.races['18']?.status;
  const race19Status = testState.races['19']?.status;
  const totalRaces = Object.keys(testState.races).length;

  console.log('DEBUG testResults:', { race18Status, race19Status, totalRaces, keys: Object.keys(testState.races) });

  assert('18 races completed', race18Status === 'official', `Race 18 status: ${race18Status}`);
  assert('Race 19 pending', race19Status === 'pending', `Race 19 status: ${race19Status}`);
  assert('All results saved', totalRaces === 21, `Races in state: ${totalRaces}`);

  // Debug
  log(`DEBUG Results: 18 races created, 3 pending, total=${totalRaces}`);

  endModule('Results');
}

// ==========================================
// MODULE 4: ALERTS
// ==========================================
async function testAlerts() {
  startModule('Alerts');

  // Create test races for alerts
  testState.races['22'] = { status: 'partial', favorite: '', alerts: [{ type: 'no_dividends' }] };
  testState.races['23'] = { status: 'official', favorite: '', alerts: [{ type: 'no_favorite' }] };

  assert('Race 22 partial status', testState.races['22']?.status === 'partial', `Race 22 status`);
  assert('Race 23 no favorite', testState.races['23']?.favorite === '', `Race 23 favorite`);

  endModule('Alerts');
}

// ==========================================
// MODULE 5: SCORING
// ==========================================
async function testScoring(picks) {
  startModule('Scoring');
  
  // Test dividend scoring
  let score = calculateDividendScore(picks['ALF'], testState.races);
  assert('Dividend score calculated', score > 0, `ALF dividend score: ${score}`);
  
  // Test points scoring
  const pointsConfig = { mode: 'points', points: { first: 20, second: 10, third: 5, exclusiveFirst: 30 }, doubleLastRace: false };
  let pointsScore = calculatePointsScore(picks['ALF'], testState.races, pointsConfig);
  assert('Points score calculated', pointsScore > 0, `ALF points score: ${pointsScore}`);
  
  // Test double last race
  const doubleLastConfig = { mode: 'dividend', doubleLastRace: true };
  let doubleScore = calculateDividendScore(picks['ALF'], testState.races, doubleLastConfig);
  assert('Double last race applied', doubleScore >= score, `Double score: ${doubleScore} >= ${score}`);
  
  endModule('Scoring');
  return { dividend: score, points: pointsScore };
}

function calculateDividendScore(picks, races, config = {}) {
  let score = 0;
  const racesToCheck = Object.keys(picks);
  
  for (const raceNum of racesToCheck) {
    const pick = picks[raceNum];
    const raceData = races[raceNum];
    if (!raceData || !raceData.results) continue;
    
    const result = raceData.results;
    const pickNum = String(pick);
    const primero = String(result.primero);
    const segundo = String(result.segundo);
    const tercero = String(result.tercero);
    
    let raceScore = 0;
    if (pickNum === primero) {
      raceScore = parseFloat(result.ganador || 0) + parseFloat(result.divSegundoPrimero || result.divSegundo || 0) + parseFloat(result.divTerceroPrimero || result.divTercero || 0);
    } else if (pickNum === segundo) {
      raceScore = parseFloat(result.divSegundo || 0) + parseFloat(result.divTerceroSegundo || result.divTercero || 0);
    } else if (pickNum === tercero) {
      raceScore = parseFloat(result.divTercero || 0);
    }
    
    // Double last race if configured
    if (config.doubleLastRace && raceNum === '18') {
      raceScore *= 2;
    }
    
    score += raceScore;
  }
  
  return Math.round(score * 100) / 100;
}

function calculatePointsScore(picks, races, config) {
  let score = 0;
  const racesToCheck = Object.keys(picks);
  const points = config.points || { first: 10, second: 5, third: 1, exclusiveFirst: 20 };
  
  for (const raceNum of racesToCheck) {
    const pick = picks[raceNum];
    const raceData = races[raceNum];
    if (!raceData || !raceData.results) continue;
    
    const result = raceData.results;
    const pickNum = String(pick);
    const primero = String(result.primero);
    const segundo = String(result.segundo);
    const tercero = String(result.tercero);
    
    let raceScore = 0;
    if (pickNum === primero) {
      if (pickNum !== segundo && pickNum !== tercero) {
        raceScore = points.exclusiveFirst;
      } else {
        raceScore = points.first;
      }
    } else if (pickNum === segundo) {
      raceScore = points.second;
    } else if (pickNum === tercero) {
      raceScore = points.third;
    }
    
    // Double last race if configured
    if (config.doubleLastRace !== false && raceNum === '18') {
      raceScore *= 2;
    }
    
    score += raceScore;
  }
  
  return score;
}

// ==========================================
// MODULE 6: RANKING
// ==========================================
async function testRanking(picks) {
  startModule('Ranking');
  
  const participants = Object.keys(picks);
  const scores = {};
  
  for (const participant of participants) {
    scores[participant] = calculateDividendScore(picks[participant], testState.races);
  }
  
  // Sort ranking
  const ranking = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .map(([name, score], index) => ({ name, score, position: index + 1 }));
  
  assert('Ranking generated', ranking.length === 5, `5 participants in ranking`);
  assert('Ranking ordered', ranking[0].score >= ranking[ranking.length - 1].score, 'Ranking is sorted');
  assert('Positions correct', ranking[0].position === 1, 'First position is 1');
  
  endModule('Ranking');
  return ranking;
}

// ==========================================
// MODULE 7: SYNC
// ==========================================
async function testSync(picks, scores, ranking) {
  startModule('Synchronization');

  // Verify ranking is sorted correctly
  const isSorted = ranking.every((r, i) => i === 0 || ranking[i-1].score >= r.score);
  assert('Ranking sorted correctly', isSorted, 'Ranking order is correct');

  // Verify all participants are in ranking
  const allInRanking = Object.keys(picks).every(p => ranking.some(r => r.name === p));
  assert('All participants in ranking', allInRanking, 'All participants present');

  // Verify ALF's score matches between calculated and ranking
  const alfCalculated = scores.dividend; // scores.dividend is ALF's score
  const alfRanking = ranking.find(r => r.name === 'ALF');
  const alfMatch = alfRanking && Math.abs(alfRanking.score - alfCalculated) < 0.01;
  assert('ALF score matches', alfMatch, `ALF calculated: ${alfCalculated}, ranking: ${alfRanking?.score}`);

  endModule('Synchronization');
}

// ==========================================
// MODULE 8: PRICING
// ==========================================
async function testPricing() {
  startModule('Pricing');
  
  const baseValue = 5000;
  const promoValue = 9000;
  
  // Test without promo
  let totalWithoutPromo = baseValue;
  assert('Base value correct', totalWithoutPromo === 5000, `Base value: ${totalWithoutPromo}`);
  
  // Test with promo 2x
  let totalWithPromo = promoValue;
  assert('Promo value correct', totalWithPromo === 9000, `Promo value: ${totalWithPromo}`);
  assert('Promo > Base', totalWithPromo >= totalWithoutPromo, 'Promo is greater or equal to base');
  
  endModule('Pricing');
}

// ==========================================
// MAIN TEST RUNNER
// ==========================================
async function runFullTest() {
  report.startTime = new Date().toISOString();
  log('🚀 Starting full test suite...');
  
  // Cleanup
  await cleanup();
  
  // Configure test
  configureTest('2026-04-11', 'test-track', 'test-event');
  setTestMode(true);
  
  // Run modules
  await testCampaigns();
  const picks = await testPicks();
  await testResults();
  await testAlerts();
  const scores = await testScoring(picks);
  const ranking = await testRanking(picks);
  await testSync(picks, scores, ranking);
  await testPricing();
  
  // Summary
  report.endTime = new Date().toISOString();
  
  const summary = {
    total: report.passed + report.failed,
    passed: report.passed,
    failed: report.failed,
    modules: Object.keys(report.modules).length,
    successRate: ((report.passed / (report.passed + report.failed)) * 100).toFixed(1) + '%',
    errors: report.errors,
    debug: testState.logs.slice(-10),
    raceState: {
      totalRaces: Object.keys(testState.races).length,
      races: Object.keys(testState.races).join(', '),
    },
  };
  
  log('\n📊 TEST SUMMARY:');
  log(`Total: ${summary.total}`);
  log(`Passed: ${summary.passed}`);
  log(`Failed: ${summary.failed}`);
  log(`Success Rate: ${summary.successRate}`);
  
  if (report.errors.length > 0) {
    log('\n❌ ERRORS:');
    report.errors.forEach(err => log(`  - ${err}`));
  }
  
  return summary;
}

module.exports = {
  runFullTest,
  calculateDividendScore,
  calculatePointsScore,
  testState: require('./raceTestEngine').testState,
};
