const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3030,
  path: '/api/test/run',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log('\n📊 TEST SUMMARY:');
      console.log('==================');
      console.log('Total:', result.total);
      console.log('Passed:', result.passed);
      console.log('Failed:', result.failed);
      console.log('Success Rate:', result.successRate);
      console.log('==================');
      
      if (result.errors && result.errors.length > 0) {
        console.log('\n❌ ERRORS:');
        result.errors.forEach(e => console.log('  -', e));
      } else {
        console.log('\n✅ ALL TESTS PASSED');
      }
      
      if (result.debug && result.debug.length > 0) {
        console.log('\n🔍 DEBUG:');
        result.debug.forEach(d => console.log('  ', d));
      }
      
      if (result.currentState) {
        console.log('\n🏁 RACE STATE:');
        console.log('  Total races:', result.currentState.races);
        console.log('  Race 18:', result.currentState.race18?.status || 'undefined');
        console.log('  Race 19:', result.currentState.race19?.status || 'undefined');
      }
    } catch (e) {
      console.log('Error parsing result:', e.message);
      console.log('Raw data:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.end();
