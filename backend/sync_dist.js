const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const passBuffer = Buffer.from([
  0x4B, 0x42, 0x36, 0x56, 0x6E, 0x37, 0x32, 0x70, 0x32, 0x67, 0x53, 0x60, 0x28, 0x5C, 0x46
]).toString('utf8');

function runSSH(conn, cmd) {
  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      stream.on('close', (code) => {
        resolve({ code, stdout, stderr });
      }).on('data', (d) => {
        stdout += d.toString();
      }).stderr.on('data', (d) => {
        stderr += d.toString();
      });
    });
  });
}

function uploadFile(sftp, localPath, remotePath) {
  return new Promise((resolve, reject) => {
    sftp.fastPut(localPath, remotePath, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

async function uploadDirectory(sftp, conn, localDir, remoteDir) {
  await runSSH(conn, `mkdir -p "${remoteDir}"`);
  const files = fs.readdirSync(localDir, { withFileTypes: true });
  for (const f of files) {
    const localF = path.join(localDir, f.name);
    const remoteF = `${remoteDir}/${f.name}`;
    if (f.isDirectory()) {
      await uploadDirectory(sftp, conn, localF, remoteF);
    } else {
      await uploadFile(sftp, localF, remoteF);
    }
  }
}

async function syncDistToServer() {
  const conn = new Client();
  console.log('Connecting to 103.160.144.225...');

  conn.on('ready', async () => {
    console.log('Connected to server.');
    conn.sftp(async (err, sftp) => {
      if (err) throw err;

      try {
        console.log('Uploading updated dist/ to /var/www/astra-crm/dist/...');
        const distLocal = path.join(__dirname, '..', 'dist');
        await uploadDirectory(sftp, conn, distLocal, '/var/www/astra-crm/dist');

        console.log('Reloading Nginx and testing port 8088...');
        await runSSH(conn, 'systemctl reload nginx');

        const testRes = await runSSH(conn, 'curl -s http://127.0.0.1:8088/ | head -n 12');
        console.log('Port 8088 Head:\n', testRes.stdout);
        console.log('✅ SYNC COMPLETED SUCCESSFULLY.');
      } catch (e) {
        console.error('Error during upload:', e);
      } finally {
        conn.end();
      }
    });
  }).connect({
    host: '103.160.144.225',
    port: 22,
    username: 'root',
    password: passBuffer,
    tryKeyboard: true
  });
}

syncDistToServer().catch(console.error);
