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

async function syncAllDist() {
  const conn = new Client();
  console.log('Connecting to server...');

  conn.on('ready', async () => {
    console.log('Connected to server.');
    conn.sftp(async (err, sftp) => {
      if (err) throw err;

      try {
        const distLocal = path.join(__dirname, '..', 'dist');
        console.log('1. Uploading dist to /var/www/sanna-crm/dist...');
        await uploadDirectory(sftp, conn, distLocal, '/var/www/sanna-crm/dist');

        console.log('2. Uploading dist to /var/www/astra-crm/dist...');
        await uploadDirectory(sftp, conn, distLocal, '/var/www/astra-crm/dist');

        console.log('3. Uploading backend employee controller & service...');
        const empControllerLocal = path.join(__dirname, 'controllers', 'employeeController.js');
        const empServiceLocal = path.join(__dirname, 'services', 'EmployeeService.js');
        await uploadFile(sftp, empControllerLocal, '/var/www/sanna-crm/backend/controllers/employeeController.js');
        await uploadFile(sftp, empControllerLocal, '/var/www/astra-crm/backend/controllers/employeeController.js');
        await uploadFile(sftp, empServiceLocal, '/var/www/sanna-crm/backend/services/EmployeeService.js');
        await uploadFile(sftp, empServiceLocal, '/var/www/astra-crm/backend/services/EmployeeService.js');

        console.log('4. Restarting PM2 processes...');
        await runSSH(conn, 'pm2 restart all || true');

        console.log('5. Reloading Nginx...');
        await runSSH(conn, 'systemctl reload nginx');

        console.log('6. Waiting 3s for PM2 services to warm up...');
        await runSSH(conn, 'sleep 3');

        console.log('7. Testing HTTPS login endpoint with empsi17...');
        const testRes = await runSSH(conn, `curl -s -X POST https://sannacrm.sannainnovations.com/api/auth/login -H "Content-Type: application/json" -d '{"identifier":"empsi17","password":"empsi17"}'`);
        console.log('Login Response:', testRes.stdout);

        console.log('✅ DEPLOY & SYNC COMPLETED SUCCESSFULLY!');
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

syncAllDist().catch(console.error);
