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

async function updateServerDb() {
  const conn = new Client();
  console.log('Connecting to 103.160.144.225...');

  conn.on('ready', async () => {
    console.log('Connected to server.');

    conn.sftp(async (err, sftp) => {
      if (err) throw err;

      try {
        console.log('1. Uploading updated db.json to /var/www/sanna-crm/backend/db.json...');
        await uploadFile(sftp, path.join(__dirname, 'db.json'), '/var/www/sanna-crm/backend/db.json');

        console.log('2. Running SQL cleanup on /var/www/sanna-crm/backend/sanna_crm_prod.sqlite...');
        const sqlCmd = `sqlite3 /var/www/sanna-crm/backend/sanna_crm_prod.sqlite "DELETE FROM leads WHERE name = 'Prospective Client' OR company = 'Prospective Client'; SELECT count(*) FROM leads;"`;
        const res = await runSSH(conn, sqlCmd);
        console.log('Leads remaining after cleanup in prod SQLite:', res.stdout);

        console.log('3. Restarting sanna-crm-api PM2 process...');
        await runSSH(conn, 'pm2 restart sanna-crm-api');

        console.log('✅ SERVER LEADS UPDATED.');
      } catch (e) {
        console.error('Error during update:', e);
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

updateServerDb().catch(console.error);
