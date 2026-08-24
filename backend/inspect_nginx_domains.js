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

async function inspectAllNginx() {
  console.log('=== GREP SANNACRM IN NGINX ===');
  const grep1 = await runSSH('grep -rn "sannacrm" /etc/nginx/ || true');
  console.log(grep1.stdout);

  console.log('=== GREP CRM.SANNAINNOVATIONS IN NGINX ===');
  const grep2 = await runSSH('grep -rn "crm.sannainnovations" /etc/nginx/ || true');
  console.log(grep2.stdout);

  console.log('=== CHECK ASTRACRM CONFIG ===');
  const conf1 = await runSSH('cat /etc/nginx/sites-available/astracrm || true');
  console.log(conf1.stdout);

  console.log('=== CHECK SANNACRM CONFIG ===');
  const conf2 = await runSSH('cat /etc/nginx/sites-available/sannacrm || true');
  console.log(conf2.stdout);

  console.log('=== CHECK MIS CONFIG ===');
  const conf3 = await runSSH('cat /etc/nginx/sites-available/mis || true');
  console.log(conf3.stdout);
}

inspectAllNginx().catch(console.error);
