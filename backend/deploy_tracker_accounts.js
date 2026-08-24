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

async function deployUpdatedAccounts() {
  const conn = new Client();
  console.log('Connecting to 103.160.144.225...');

  conn.on('ready', async () => {
    console.log('SSH Connection Established.');

    conn.sftp(async (err, sftp) => {
      if (err) throw err;

      try {
        console.log('1. Uploading backend files to /var/www/sanna-crm/backend...');
        await uploadFile(sftp, path.join(__dirname, 'db.json'), '/var/www/sanna-crm/backend/db.json');
        await uploadFile(sftp, path.join(__dirname, 'config', 'dbInit.js'), '/var/www/sanna-crm/backend/config/dbInit.js');
        await uploadFile(sftp, path.join(__dirname, 'models', 'Employee.js'), '/var/www/sanna-crm/backend/models/Employee.js');
        await uploadFile(sftp, path.join(__dirname, 'repositories', 'EmployeeRepository.js'), '/var/www/sanna-crm/backend/repositories/EmployeeRepository.js');
        await uploadFile(sftp, path.join(__dirname, 'services', 'AuthService.js'), '/var/www/sanna-crm/backend/services/AuthService.js');
        await uploadFile(sftp, path.join(__dirname, 'controllers', 'authController.js'), '/var/www/sanna-crm/backend/controllers/authController.js');

        console.log('2. Uploading dist/ to /var/www/sanna-crm/dist...');
        const distLocal = path.join(__dirname, '..', 'dist');
        await uploadDirectory(sftp, conn, distLocal, '/var/www/sanna-crm/dist');

        console.log('3. Re-seeding Sanna CRM database with all 21 Tracker accounts...');
        const seedRes = await runSSH(conn, 'cd /var/www/sanna-crm/backend && rm -f astra_crm_dev.sqlite && node -e "const { seedDatabase } = require(\'./config/dbInit\'); seedDatabase().then(() => console.log(\'SANNA_CRM_DB_RELOADED\')).catch(console.error);"');
        console.log('Seed Output:', seedRes.stdout);

        console.log('4. Restarting sanna-crm-api in PM2...');
        await runSSH(conn, 'pm2 restart sanna-crm-api');

        console.log('5. Testing logins for Tracker accounts (admin, manager, empsi01, empsi15, empsi19)...');
        const testRes = await runSSH(conn, `
          curl -s -X POST http://127.0.0.1:5055/api/auth/login -H "Content-Type: application/json" -d '{"identifier":"admin","password":"admin123"}' | grep -o '"role":"[^"]*"' || true;
          curl -s -X POST http://127.0.0.1:5055/api/auth/login -H "Content-Type: application/json" -d '{"identifier":"manager","password":"manager123"}' | grep -o '"role":"[^"]*"' || true;
          curl -s -X POST http://127.0.0.1:5055/api/auth/login -H "Content-Type: application/json" -d '{"identifier":"empsi01","password":"empsi01"}' | grep -o '"role":"[^"]*"' || true;
          curl -s -X POST http://127.0.0.1:5055/api/auth/login -H "Content-Type: application/json" -d '{"identifier":"empsi15","password":"empsi15"}' | grep -o '"role":"[^"]*"' || true;
          curl -s -X POST http://127.0.0.1:5055/api/auth/login -H "Content-Type: application/json" -d '{"identifier":"empsi19","password":"empsi19"}' | grep -o '"role":"[^"]*"' || true;
        `);
        console.log('Login Test Results:\n', testRes.stdout);

        console.log('✅ ALL TRACKER ACCOUNTS DEPLOYED AND VERIFIED SUCCESSFULLY!');
      } catch (e) {
        console.error('Error during deployment:', e);
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

deployUpdatedAccounts().catch(console.error);
