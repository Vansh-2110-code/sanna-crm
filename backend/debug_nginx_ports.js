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

async function debugAllNginx() {
  console.log('=== 1. Check all files in /etc/nginx/sites-enabled ===');
  const se = await runSSH('ls -la /etc/nginx/sites-enabled/');
  console.log(se.stdout);

  console.log('=== 2. Check which site files listen on port 80 ===');
  const p80 = await runSSH('grep -rn "listen.*80" /etc/nginx/sites-enabled/ || true');
  console.log(p80.stdout);

  console.log('=== 3. Check which site files listen on port 443 ===');
  const p443 = await runSSH('grep -rn "listen.*443" /etc/nginx/sites-enabled/ || true');
  console.log(p443.stdout);

  console.log('=== 4. Check /etc/nginx/sites-enabled/000-hipapa-default or default files ===');
  const def = await runSSH('cat /etc/nginx/sites-enabled/000-hipapa-default || cat /etc/nginx/sites-enabled/default || true');
  console.log(def.stdout);

  console.log('=== 5. Check curl http://sannacrm.sannainnovations.com directly ===');
  const c1 = await runSSH('curl -I http://sannacrm.sannainnovations.com');
  console.log('curl http:\n', c1.stdout);

  console.log('=== 6. Check curl https://sannacrm.sannainnovations.com directly ===');
  const c2 = await runSSH('curl -I https://sannacrm.sannainnovations.com');
  console.log('curl https:\n', c2.stdout);
}

debugAllNginx().catch(console.error);
