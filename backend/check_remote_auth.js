const { Client } = require('ssh2');

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

async function checkRemoteAuth() {
  console.log('=== 1. PM2 STATUS ===');
  const pm2 = await runSSH('pm2 list || true');
  console.log(pm2.stdout);

  console.log('=== 2. LISTENING PORTS ===');
  const ports = await runSSH('ss -tlpn | grep -E "5055|5000|5001|node" || true');
  console.log(ports.stdout);

  console.log('=== 3. REMOTE AuthService.js check ===');
  const authService = await runSSH('grep -A 30 "USER_ALIASES" /var/www/sanna-crm/backend/services/AuthService.js || true');
  console.log(authService.stdout);

  console.log('=== 4. TEST LOGIN API ON SERVER (empsi17) ===');
  const test1 = await runSSH(`curl -s -X POST http://127.0.0.1:5055/api/auth/login -H "Content-Type: application/json" -d '{"identifier":"empsi17","password":"empsi17"}' || true`);
  console.log('Login with empsi17 / empsi17:', test1.stdout);

  const test2 = await runSSH(`curl -s -X POST http://127.0.0.1:5055/api/auth/login -H "Content-Type: application/json" -d '{"identifier":"vidhurshan","password":"vidhurshan123"}' || true`);
  console.log('Login with vidhurshan / vidhurshan123:', test2.stdout);

  const test3 = await runSSH(`curl -s -X POST http://127.0.0.1:5055/api/auth/login -H "Content-Type: application/json" -d '{"identifier":"empsi12","password":"empsi12"}' || true`);
  console.log('Login with empsi12 / empsi12:', test3.stdout);
}

checkRemoteAuth().catch(console.error);
