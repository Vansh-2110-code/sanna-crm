const https = require('https');
const axios = require('axios');

async function testFull() {
  console.log('--- 1. Testing GET https://sannacrm.sannainnovations.com ---');
  try {
    const res = await axios.get('https://sannacrm.sannainnovations.com');
    console.log('Status:', res.status);
    console.log('HTML snippet:', res.data.substring(0, 100));
  } catch (e) {
    console.error('GET error:', e.message);
  }

  console.log('\n--- 2. Testing GET https://sannacrm.sannainnovations.com/health ---');
  try {
    const res = await axios.get('https://sannacrm.sannainnovations.com/health');
    console.log('Status:', res.status);
    console.log('Data:', res.data);
  } catch (e) {
    console.error('Health error:', e.message);
  }

  console.log('\n--- 3. Testing POST https://sannacrm.sannainnovations.com/api/auth/login ---');
  try {
    const res = await axios.post('https://sannacrm.sannainnovations.com/api/auth/login', {
      identifier: 'empsi17',
      password: 'empsi17'
    });
    console.log('Status:', res.status);
    console.log('User:', res.data.user ? res.data.user.name : res.data);
  } catch (e) {
    console.error('Login error:', e.message);
  }
}

testFull();
