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
      tryKeyboard: true
    });
  });
}

async function auditCrmDeployment() {
  console.log('=== 1. Checking /var/www/astra-crm/backend/.env ===');
  const env = await runSSH('cat /var/www/astra-crm/backend/.env');
  console.log(env.stdout);

  console.log('=== 2. Checking /var/www/astra-crm/dist files ===');
  const dist = await runSSH('ls -la /var/www/astra-crm/dist /var/www/astra-crm/dist/assets || true');
  console.log(dist.stdout);

  console.log('=== 3. Checking Nginx astracrm config details ===');
  const conf = await runSSH('cat /etc/nginx/sites-enabled/astracrm');
  console.log(conf.stdout);

  console.log('=== 4. Checking what port astra-crm-api is actually listening on ===');
  const ports = await runSSH('ss -tlpn | grep -E "5000|5001|node" || true');
  console.log(ports.stdout);

  console.log('=== 5. Testing curl to crm domains locally and externally ===');
  const curlDomains = await runSSH('curl -k -s -H "Host: crm.sannainnovations.com" https://127.0.0.1/ | head -n 15 && curl -k -s -H "Host: crm.sannainnovations.com" https://127.0.0.1/api/leads?tenantId=client-sanna | head -c 200 || true');
  console.log('Host crm.sannainnovations.com test:\n' + curlDomains.stdout);
}

auditCrmDeployment().catch(console.error);
