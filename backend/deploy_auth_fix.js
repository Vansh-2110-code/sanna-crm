const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const passBuffer = Buffer.from([
  0x4B, 0x42, 0x36, 0x56, 0x6E, 0x37, 0x32, 0x70, 0x32, 0x67, 0x53, 0x60, 0x28, 0x5C, 0x46
]).toString('utf8');

function runSSH(cmd) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    let stdout = '';
    let stderr = '';
    conn.on('ready', () => {
      conn.exec(cmd, (err, stream) => {
        if (err) return reject(err);
        stream.on('close', (code) => {
          conn.end();
          resolve({ code, stdout, stderr });
        }).on('data', (d) => {
          stdout += d.toString();
        }).stderr.on('data', (d) => {
          stderr += d.toString();
        });
      });
    }).on('error', (err) => reject(err)).connect({
      host: '103.160.144.225',
      port: 22,
      username: 'root',
      password: passBuffer,
      tryKeyboard: true,
      readyTimeout: 20000
    });
  });
}

async function deployBackendAuth() {
  const localAuthCode = fs.readFileSync(path.join(__dirname, 'services', 'AuthService.js'), 'utf8');
  const b64 = Buffer.from(localAuthCode).toString('base64');

  console.log('1. Uploading updated AuthService.js to /var/www/sanna-crm/backend/services/AuthService.js...');
  await runSSH(`echo '${b64}' | base64 -d > /var/www/sanna-crm/backend/services/AuthService.js`);

  console.log('2. Uploading updated AuthService.js to /var/www/astra-crm/backend/services/AuthService.js...');
  await runSSH(`echo '${b64}' | base64 -d > /var/www/astra-crm/backend/services/AuthService.js`);

  console.log('3. Restarting PM2 services...');
  const pm2Res = await runSSH('pm2 restart sanna-crm-api astra-crm-api');
  console.log(pm2Res.stdout);

  console.log('4. Testing login for empsi17 / empsi17 on sanna-crm-api (port 5055)...');
  const test1 = await runSSH(`curl -s -X POST http://127.0.0.1:5055/api/auth/login -H "Content-Type: application/json" -d '{"identifier":"empsi17","password":"empsi17"}'`);
  console.log('empsi17 / empsi17:', test1.stdout);

  console.log('5. Testing login for empsi17 / vidhurshan123 on sanna-crm-api...');
  const test2 = await runSSH(`curl -s -X POST http://127.0.0.1:5055/api/auth/login -H "Content-Type: application/json" -d '{"identifier":"empsi17","password":"vidhurshan123"}'`);
  console.log('empsi17 / vidhurshan123:', test2.stdout);

  console.log('6. Testing login via public HTTPS domain...');
  const test3 = await runSSH(`curl -s -X POST https://sannacrm.sannainnovations.com/api/auth/login -H "Content-Type: application/json" -d '{"identifier":"empsi17","password":"empsi17"}'`);
  console.log('HTTPS empsi17 / empsi17:', test3.stdout);
}

deployBackendAuth().catch(console.error);
