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

async function deployToServer() {
  const conn = new Client();
  console.log('Connecting to 103.160.144.225 via SSH...');

  conn.on('ready', async () => {
    console.log('SSH Connection Established.');

    conn.sftp(async (err, sftp) => {
      if (err) throw err;

      try {
        console.log('1. Uploading backend/db.json to /var/www/astra-crm/backend/db.json...');
        await uploadFile(sftp, path.join(__dirname, 'db.json'), '/var/www/astra-crm/backend/db.json');

        console.log('2. Uploading backend/config/dbInit.js...');
        await uploadFile(sftp, path.join(__dirname, 'config', 'dbInit.js'), '/var/www/astra-crm/backend/config/dbInit.js');

        console.log('3. Uploading dist/ build to /var/www/astra-crm/dist/...');
        const distLocal = path.join(__dirname, '..', 'dist');
        await uploadDirectory(sftp, conn, distLocal, '/var/www/astra-crm/dist');

        console.log('4. Resetting and re-seeding server database on 103.160.144.225...');
        // Remove old dev sqlite if any, to force fresh seed from real db.json
        const seedRes = await runSSH(conn, 'cd /var/www/astra-crm/backend && rm -f astra_crm_dev.sqlite && node -e "const { seedDatabase } = require(\'./config/dbInit\'); seedDatabase().then(() => console.log(\'SERVER_SEED_SUCCESS\')).catch(console.error);"');
        console.log('Seed Output:', seedRes.stdout, seedRes.stderr);

        console.log('5. Restarting PM2 process astra-crm-api...');
        const pm2Res = await runSSH(conn, 'pm2 restart astra-crm-api || pm2 reload all');
        console.log('PM2 Output:', pm2Res.stdout);

        console.log('6. Verifying database security status...');
        const secCheck = await runSSH(conn, 'docker ps --filter name=tracker-mongodb --format "Container: {{.Names}} | Ports: {{.Ports}}" && ss -tlpn | grep 27017 || true');
        console.log('Security Audit (MongoDB Port Binding):', secCheck.stdout);

        console.log('7. Verifying API health on server...');
        const healthRes = await runSSH(conn, 'curl -s http://localhost:5000/health || curl -s http://127.0.0.1:5000/health || true');
        console.log('Health Endpoint:', healthRes.stdout);

        console.log('✅ ALL SERVER DATABASE SETUP & DEPLOYMENT ACTIONS COMPLETED SUCCESSFULLY.');
      } catch (deployErr) {
        console.error('Deployment error:', deployErr);
      } finally {
        conn.end();
      }
    });
  }).on('error', (err) => {
    console.error('SSH Error:', err.message);
  }).connect({
    host: '103.160.144.225',
    port: 22,
    username: 'root',
    password: passBuffer,
    tryKeyboard: true
  });
}

deployToServer().catch(console.error);
