/**
 * testRaceEndpoints.js
 * 
 * Endpoints REST para el sistema de test de carreras.
 * Permite controlar el modo test desde API o UI.
 */

const express = require('express');
const router = express.Router();
const {
  startTestRace,
  updateTestResults,
  completeTestRace,
  forceTestResults,
  resetTestRace,
  getTestStatus,
  setTestMode,
  configureTest,
  testState,
} = require('./raceTestEngine');
const { runFullTest } = require('./testRunner');

// GET /test/status - Estado actual del test
router.get('/status', (req, res) => {
  try {
    const status = getTestStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /test/activate - Activa modo test
router.post('/activate', (req, res) => {
  try {
    const { date, trackId, eventId } = req.body || {};
    configureTest(date, trackId, eventId);
    const result = setTestMode(true);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /test/deactivate - Desactiva modo test
router.post('/deactivate', (req, res) => {
  try {
    const result = setTestMode(false);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /test/configure - Configura fecha y evento
router.post('/configure', (req, res) => {
  try {
    const { date, trackId, eventId } = req.body || {};
    const result = configureTest(date, trackId, eventId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /test/startRace - Inicia una carrera simulada
router.post('/startRace', (req, res) => {
  try {
    const { raceNumber, config } = req.body || {};
    if (!raceNumber) {
      return res.status(400).json({ error: 'raceNumber es requerido' });
    }
    const result = startTestRace(raceNumber, config);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /test/updateResults - Actualiza resultados parciales
router.post('/updateResults', (req, res) => {
  try {
    const { raceNumber, config } = req.body || {};
    if (!raceNumber) {
      return res.status(400).json({ error: 'raceNumber es requerido' });
    }
    const result = updateTestResults(raceNumber, config);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /test/completeRace - Marca carrera como completa
router.post('/completeRace', (req, res) => {
  try {
    const { raceNumber, config } = req.body || {};
    if (!raceNumber) {
      return res.status(400).json({ error: 'raceNumber es requerido' });
    }
    const result = completeTestRace(raceNumber, config);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /test/setResults - Fuerza resultados específicos
router.post('/setResults', (req, res) => {
  try {
    const { raceNumber, results, config } = req.body || {};
    if (!raceNumber) {
      return res.status(400).json({ error: 'raceNumber es requerido' });
    }
    const result = forceTestResults(raceNumber, { ...config, results });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /test/setOfficial - Fuerza estado OFFICIAL
router.post('/setOfficial', (req, res) => {
  try {
    const { raceNumber, config } = req.body || {};
    if (!raceNumber) {
      return res.status(400).json({ error: 'raceNumber es requerido' });
    }
    const result = completeTestRace(raceNumber, config);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /test/reset - Resetea carrera o todo el test
router.post('/reset', (req, res) => {
  try {
    const { raceNumber } = req.body || {};
    if (raceNumber) {
      const result = resetTestRace(raceNumber);
      res.json(result);
    } else {
      // Reset completo
      testState.races = {};
      testState.logs = [];
      res.json({ success: true, message: 'Test completo reseteado' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /test/run - Ejecuta el test suite completo
router.post('/run', async (req, res) => {
  try {
    const { runFullTest } = require('./testRunner');
    const { testState } = require('./raceTestEngine');
    const result = await runFullTest();
    
    // Agregar estado actual para debug - usar la referencia directa
    result.raceState = {
      race18: testState.races['18'],
      race19: testState.races['19'],
      totalRaces: Object.keys(testState.races).length,
    };
    
    res.json(result);
  } catch (error) {
    console.error('Test run error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /test/runScenario - Ejecuta un escenario predefinido
router.post('/runScenario', async (req, res) => {
  try {
    const { scenario, raceNumber } = req.body || {};
    if (!scenario || !raceNumber) {
      return res.status(400).json({ error: 'scenario y raceNumber son requeridos' });
    }

    const scenarios = {
      'no-dividends': async () => {
        await startTestRace(raceNumber);
        await updateTestResults(raceNumber, { noDividends: true });
        return { message: 'Carrera sin dividendos creada' };
      },
      'no-favorite': async () => {
        await startTestRace(raceNumber);
        await updateTestResults(raceNumber, { noFavorite: true });
        return { message: 'Carrera sin favorito creada' };
      },
      'with-tie': async () => {
        await startTestRace(raceNumber);
        await updateTestResults(raceNumber, { tie: true });
        return { message: 'Carrera con empate creada' };
      },
      'with-scratch': async () => {
        await startTestRace(raceNumber, { retiros: ['3', '7'] });
        await updateTestResults(raceNumber, { retiros: ['3', '7'] });
        return { message: 'Carrera con retiros creada' };
      },
      'incomplete': async () => {
        await startTestRace(raceNumber);
        await updateTestResults(raceNumber, { incomplete: true });
        return { message: 'Carrera incompleta creada' };
      },
      'complete': async () => {
        await startTestRace(raceNumber);
        await completeTestRace(raceNumber);
        return { message: 'Carrera completa creada' };
      },
      'all-races': async () => {
        for (let i = 1; i <= 18; i++) {
          await completeTestRace(i, { 
            primero: String(Math.floor(Math.random() * 15) + 1),
            favorito: String(Math.floor(Math.random() * 15) + 1),
          });
        }
        // Carreras faltantes sin resultados
        for (let i = 19; i <= 21; i++) {
          await startTestRace(i);
        }
        return { message: '18 carreras completas, 3 pendientes' };
      },
    };

    if (!scenarios[scenario]) {
      return res.status(400).json({ error: `Escenario desconocido: ${scenario}` });
    }

    const result = await scenarios[scenario]();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
