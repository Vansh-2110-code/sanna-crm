const sqlite3 = require('sqlite3').verbose();
const path = require('path');
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

async function inspectUsers() {
  console.log('=== LOCAL USERS ===');
  const localDb = new sqlite3.Database(path.join(__dirname, 'unified_sanna_crm.db'));
  localDb.all('SELECT id, username, plain_password, email, full_name, role FROM users', (err, rows) => {
    if (err) console.error('Local err:', err);
    else console.log('Local users count:', rows.length, rows);
    localDb.close();
  });

  console.log('=== REMOTE SVR USERS (sanna-crm) ===');
  const r1 = await runSSH(`sqlite3 /var/www/sanna-crm/backend/unified_sanna_crm.db "SELECT id, username, plain_password, email, full_name, role FROM users;" || true`);
  console.log('Remote /var/www/sanna-crm users:\n', r1.stdout);

  console.log('=== REMOTE SVR USERS (all dbs) ===');
  const r2 = await runSSH(`find /var/www -name "*.db" -o -name "*.sqlite"`);
  console.log('Remote DB paths:\n', r2.stdout);
}

inspectUsers().catch(console.error);
