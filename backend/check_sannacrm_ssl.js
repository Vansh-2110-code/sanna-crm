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

async function checkSSL() {
  console.log('=== CERTBOT CERTIFICATES ===');
  const certs = await runSSH('certbot certificates');
  console.log(certs.stdout);

  console.log('=== SITES ENABLED LIST ===');
  const sites = await runSSH('ls -la /etc/nginx/sites-enabled/');
  console.log(sites.stdout);

  console.log('=== SITES AVAILABLE LIST ===');
  const avail = await runSSH('ls -la /etc/nginx/sites-available/');
  console.log(avail.stdout);

  console.log('=== SANNACRM IN SITES-AVAILABLE/ENABLED ===');
  const sannacrm = await runSSH('cat /etc/nginx/sites-available/sannacrm || cat /etc/nginx/sites-enabled/sannacrm || true');
  console.log(sannacrm.stdout);

  console.log('=== CURL HTTPS LOCAL AND EXT ===');
  const curl = await runSSH('curl -k -v https://sannacrm.sannainnovations.com 2>&1 | head -n 30');
  console.log(curl.stdout);
}

checkSSL().catch(console.error);
