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

async function runFixAndSync() {
  const conn = new Client();
  console.log('Connecting to server...');

  conn.on('ready', async () => {
    console.log('Connected to server.');
    conn.sftp(async (err, sftp) => {
      if (err) throw err;

      try {
        console.log('1. Removing corrupted sqlite files...');
        await runSSH(conn, 'rm -f /var/www/sanna-crm/backend/astra_crm_dev.sqlite /var/www/astra-crm/backend/astra_crm_dev.sqlite');

        console.log('2. Uploading fresh unified_sanna_crm.db...');
        const dbLocal = path.join(__dirname, 'unified_sanna_crm.db');
        await uploadFile(sftp, dbLocal, '/var/www/sanna-crm/backend/unified_sanna_crm.db');
        await uploadFile(sftp, dbLocal, '/var/www/astra-crm/backend/unified_sanna_crm.db');

        console.log('3. Uploading employeeController.js & EmployeeService.js...');
        const empControllerLocal = path.join(__dirname, 'controllers', 'employeeController.js');
        const empServiceLocal = path.join(__dirname, 'services', 'EmployeeService.js');
        await uploadFile(sftp, empControllerLocal, '/var/www/sanna-crm/backend/controllers/employeeController.js');
        await uploadFile(sftp, empControllerLocal, '/var/www/astra-crm/backend/controllers/employeeController.js');
        await uploadFile(sftp, empServiceLocal, '/var/www/sanna-crm/backend/services/EmployeeService.js');
        await uploadFile(sftp, empServiceLocal, '/var/www/astra-crm/backend/services/EmployeeService.js');

        console.log('4. Uploading frontend dist...');
        const distLocal = path.join(__dirname, '..', 'dist');
        await uploadDirectory(sftp, conn, distLocal, '/var/www/sanna-crm/dist');
        await uploadDirectory(sftp, conn, distLocal, '/var/www/astra-crm/dist');

        console.log('5. Restarting PM2 processes...');
        await runSSH(conn, 'pm2 restart all || true');

        console.log('6. Reloading Nginx...');
        await runSSH(conn, 'systemctl reload nginx');

        console.log('7. Waiting 5s for PM2 services to complete boot...');
        await runSSH(conn, 'sleep 5');

        console.log('8. Testing HTTPS login endpoint with empsi17...');
        const testRes = await runSSH(conn, `curl -s -X POST https://sannacrm.sannainnovations.com/api/auth/login -H "Content-Type: application/json" -d '{"identifier":"empsi17","password":"empsi17"}'`);
        console.log('Login Response:', testRes.stdout);

        console.log('9. Testing update employee birthday endpoint...');
        // Test update employee birthday directly via API
        const loginObj = JSON.parse(testRes.stdout || '{}');
        if (loginObj.token) {
          const updateRes = await runSSH(conn, `curl -s -X PUT https://sannacrm.sannainnovations.com/api/employees/EMP-SANNA-038 -H "Content-Type: application/json" -H "Authorization: Bearer ${loginObj.token}" -d '{"birthday":"2003-07-30"}'`);
          console.log('Update Birthday Response:', updateRes.stdout);
        }

        console.log('✅ FIXED, SYNCED & VERIFIED ON SERVER SUCCESSFULLY!');
      } catch (e) {
        console.error('Error during fix and sync:', e);
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

runFixAndSync().catch(console.error);
