// Script para verificar el estado actual de las carreras 19, 20, 21 en Teletrak
const https = require('https');

async function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'Accept': 'application/json' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function checkRaces() {
  const date = '2026-04-11';
  
  // Track IDs comunes: 1=Club Hipico, 2=Hipodromo Chile, 3=Valparaiso, 4=Concepcion
  const trackIds = [1, 2, 3, 4];
  
  for (const trackId of trackIds) {
    try {
      console.log(`\n=== Track ${trackId} - ${date} ===`);
      const payload = await fetchJson(`https://apuestas.teletrak.cl/api/falcon/v1/results/races/${trackId}/${date}`);
      
      if (payload && payload.results && Array.isArray(payload.results)) {
        const races19to21 = payload.results.filter(r => r.raceNumber >= 19 && r.raceNumber <= 21);
        
        if (races19to21.length > 0) {
          console.log(`Carreras 19-21 encontradas:`);
          for (const race of races19to21) {
            console.log(`  Carrera ${race.raceNumber}:`);
            console.log(`    complete: ${race.complete}`);
            console.log(`    runnersResults: ${race.runnersResults?.length || 0} posiciones`);
            if (race.runnersResults && race.runnersResults.length > 0) {
              for (const pos of race.runnersResults.slice(0, 3)) {
                console.log(`      ${pos.position}: #${pos.programNumber} - ${pos.horseName || 'N/A'}`);
              }
            }
          }
        } else {
          console.log(`No se encontraron carreras 19-21`);
          console.log(`Total de carreras en Teletrak: ${payload.results.length}`);
        }
      } else {
        console.log(`Sin resultados para este track`);
      }
    } catch (error) {
      console.log(`Error para track ${trackId}: ${error.message}`);
    }
  }
}

checkRaces().then(() => console.log('\n=== Verificación completada ==='));
