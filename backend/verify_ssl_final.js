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

async function verifyAll() {
  console.log('=== 1. Testing HTTP to HTTPS redirect ===');
  const r1 = await runSSH('curl -I http://sannacrm.sannainnovations.com');
  console.log(r1.stdout);

  console.log('=== 2. Testing HTTPS root (index.html) ===');
  const r2 = await runSSH('curl -sI https://sannacrm.sannainnovations.com');
  console.log(r2.stdout);

  console.log('=== 3. Testing HTTPS API health ===');
  const r3 = await runSSH('curl -s https://sannacrm.sannainnovations.com/health');
  console.log(r3.stdout);

  console.log('=== 4. Testing HTTPS API endpoints ===');
  const r4 = await runSSH('curl -s https://sannacrm.sannainnovations.com/api/mis/deliverables | head -c 150');
  console.log(r4.stdout);
}

verifyAll().catch(console.error);
