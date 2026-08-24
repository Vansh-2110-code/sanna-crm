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
  console.log('--- 1. NGINX STATUS ---');
  try {
    const s1 = await runSSH('systemctl status nginx --no-pager');
    console.log(s1.stdout || s1.stderr);
  } catch (e) {
    console.error('Error checking nginx status:', e.message);
  }

  console.log('--- 2. LISTENING PORTS (80, 443, 3000, 5000, etc.) ---');
  try {
    const s2 = await runSSH('ss -tulpn || netstat -tulpn');
    console.log(s2.stdout);
  } catch (e) {
    console.error('Error checking ports:', e.message);
  }

  console.log('--- 3. PM2 STATUS ---');
  try {
    const s3 = await runSSH('pm2 list || pm2 status');
    console.log(s3.stdout);
  } catch (e) {
    console.error('Error checking pm2:', e.message);
  }

  console.log('--- 4. NGINX TEST CONFIG ---');
  try {
    const s4 = await runSSH('nginx -t');
    console.log(s4.stdout, s4.stderr);
  } catch (e) {
    console.error('Error testing nginx config:', e.message);
  }

  console.log('--- 5. UFW / FIREWALL STATUS ---');
  try {
    const s5 = await runSSH('ufw status || iptables -L -n -v');
    console.log(s5.stdout);
  } catch (e) {
    console.error('Error checking ufw:', e.message);
  }
}

diagnose();
