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

async function fixNginxAndAstraQuant() {
  console.log('--- 1. Check docker ps for astraquant-nginx ---');
  const d1 = await runSSH('docker ps --filter "name=astraquant-nginx"');
  console.log(d1.stdout);

  console.log('--- 2. Stop astraquant-nginx to free port 80 ---');
  const stopRes = await runSSH('docker stop astraquant-nginx');
  console.log('Stopped:', stopRes.stdout);

  console.log('--- 3. Start host nginx service ---');
  const startNginx = await runSSH('systemctl start nginx && systemctl enable nginx');
  console.log('Nginx start result:', startNginx.stdout, startNginx.stderr);

  console.log('--- 4. Check nginx status ---');
  const statusNginx = await runSSH('systemctl status nginx --no-pager');
  console.log(statusNginx.stdout);

  console.log('--- 5. Test HTTPS connection to sannacrm.sannainnovations.com on server ---');
  const curlTest = await runSSH('curl -Iv https://sannacrm.sannainnovations.com 2>&1 | head -n 25');
  console.log(curlTest.stdout);
}

fixNginxAndAstraQuant();
