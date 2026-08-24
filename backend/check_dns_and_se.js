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

async function checkDomains() {
  const domains = [
    'sannacrm.sannainnovations.com',
    'crm.sannainnovations.com',
    'astracrm.sannainnovations.com',
    'astracrm.theastraai.com',
    'mis.sannainnovations.com'
  ];

  for (const d of domains) {
    const res = await runSSH(`dig +short ${d} @8.8.8.8`);
    console.log(`DNS ${d}:`, res.stdout.trim());
  }

  console.log('=== Checking files in /etc/nginx/sites-enabled ===');
  const se = await runSSH('ls -la /etc/nginx/sites-enabled');
  console.log(se.stdout);
}

checkDomains().catch(console.error);
