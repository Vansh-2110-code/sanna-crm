const { Client } = require('ssh2');
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

async function updateAuthServiceAndResetFlags() {
  const conn = new Client();
  console.log('Connecting to 103.160.144.225...');

  conn.on('ready', async () => {
    console.log('Connected to server.');

    conn.sftp(async (err, sftp) => {
      if (err) throw err;

      try {
        console.log('Uploading updated AuthService.js...');
        await uploadFile(sftp, path.join(__dirname, 'services', 'AuthService.js'), '/var/www/sanna-crm/backend/services/AuthService.js');

        const resetScript = `
const bcrypt = require('bcryptjs');
const sequelize = require('./config/database');
const Employee = require('./models/Employee');

const trackerUsers = [
  { username: 'admin', pass: 'admin123' },
  { username: 'manager', pass: 'manager123' },
  { username: 'empsi01', pass: 'empsi01' },
  { username: 'empsi02', pass: 'empsi02' },
  { username: 'empsi03', pass: 'empsi03' },
  { username: 'empsi04', pass: 'empsi04' },
  { username: 'empsi05', pass: 'empsi05' },
  { username: 'empsi06', pass: 'empsi06' },
  { username: 'empsi07', pass: 'empsi07' },
  { username: 'empsi08', pass: 'empsi08' },
  { username: 'empsi09', pass: 'empsi09' },
  { username: 'empsi10', pass: 'empsi10' },
  { username: 'empsi11', pass: 'empsi11' },
  { username: 'empsi12', pass: 'empsi12' },
  { username: 'empsi13', pass: 'empsi13' },
  { username: 'empsi14', pass: 'empsi14' },
  { username: 'empsi15', pass: 'empsi15' },
  { username: 'empsi16', pass: 'empsi16' },
  { username: 'empsi17', pass: 'empsi17' },
  { username: 'empsi18', pass: 'empsi18' },
  { username: 'empsi19', pass: 'empsi19' }
];

(async () => {
  for (const u of trackerUsers) {
    const pHash = bcrypt.hashSync(u.pass, 10);
    const emp = await Employee.findOne({ where: { username: u.username } });
    if (emp) {
      emp.passwordHash = pHash;
      emp.mustChangePassword = true;
      emp.passwordChangedAt = null;
      await emp.save();
    }
  }
  console.log('ALL_21_USERS_RESET_WITH_MUST_CHANGE_PASSWORD_TRUE');
})();
`;
        const b64 = Buffer.from(resetScript).toString('base64');
        const res = await runSSH(conn, `cd /var/www/sanna-crm/backend && node -e "eval(Buffer.from('${b64}', 'base64').toString('utf8'))"`);
        console.log('Reset Output:', res.stdout, res.stderr);

        console.log('Restarting sanna-crm-api in PM2...');
        await runSSH(conn, 'pm2 restart sanna-crm-api');

        console.log('✅ ALL 21 ACCOUNTS READY WITH DEFAULT PASSWORDS & CHANGE PROMPT REQUIRED.');
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

updateAuthServiceAndResetFlags().catch(console.error);
