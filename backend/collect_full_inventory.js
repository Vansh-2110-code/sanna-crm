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

async function collectAllServerData() {
  console.log('=== 1. System Overview ===');
  const sys = await runSSH('uname -a && lsb_release -d && uptime && free -h && df -h /');
  console.log(sys.stdout);

  console.log('=== 2. All Docker Containers ===');
  const docker = await runSSH('docker ps --format "{{.Names}} | {{.Image}} | {{.Status}} | {{.Ports}}"');
  console.log(docker.stdout);

  console.log('=== 3. All PM2 Services ===');
  const pm2 = await runSSH('pm2 list');
  console.log(pm2.stdout);

  console.log('=== 4. All Nginx Enabled Sites & Server Names ===');
  const nginx = await runSSH('grep -rn "server_name\\|listen\\|proxy_pass\\|root " /etc/nginx/sites-enabled/ || true');
  console.log(nginx.stdout);
}

collectAllServerData().catch(console.error);
