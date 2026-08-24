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

async function diagnose() {
  console.log('=== 1. Checking certbot certificates ===');
  const certs = await runSSH('certbot certificates || true');
  console.log(certs.stdout, certs.stderr);

  console.log('=== 2. Checking /etc/nginx/sites-enabled/ ===');
  const sites = await runSSH('ls -la /etc/nginx/sites-enabled/ && ls -la /etc/nginx/sites-available/');
  console.log(sites.stdout);

  console.log('=== 3. Checking Nginx configs content ===');
  const nginxConf = await runSSH('tail -n +1 /etc/nginx/sites-enabled/*');
  console.log(nginxConf.stdout);

  console.log('=== 4. Checking Nginx status and test ===');
  const ngTest = await runSSH('nginx -t');
  console.log(ngTest.stdout, ngTest.stderr);

  console.log('=== 5. Checking DNS resolution on server ===');
  const dns = await runSSH('dig +short sannacrm.sannainnovations.com || host sannacrm.sannainnovations.com || ping -c 1 sannacrm.sannainnovations.com || true');
  console.log(dns.stdout, dns.stderr);
}

diagnose().catch(console.error);
