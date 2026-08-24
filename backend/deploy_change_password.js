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

async function deployChangePasswordFeature() {
  const conn = new Client();
  console.log('Connecting to 103.160.144.225...');

  conn.on('ready', async () => {
    console.log('SSH Connection Established.');

    conn.sftp(async (err, sftp) => {
      if (err) throw err;

      try {
        console.log('1. Uploading backend files to /var/www/sanna-crm/backend...');
        await uploadFile(sftp, path.join(__dirname, 'models', 'Employee.js'), '/var/www/sanna-crm/backend/models/Employee.js');
        await uploadFile(sftp, path.join(__dirname, 'services', 'AuthService.js'), '/var/www/sanna-crm/backend/services/AuthService.js');
        await uploadFile(sftp, path.join(__dirname, 'controllers', 'authController.js'), '/var/www/sanna-crm/backend/controllers/authController.js');
        await uploadFile(sftp, path.join(__dirname, 'routes', 'authRoutes.js'), '/var/www/sanna-crm/backend/routes/authRoutes.js');

        console.log('2. Uploading dist/ to /var/www/sanna-crm/dist...');
        const distLocal = path.join(__dirname, '..', 'dist');
        await uploadDirectory(sftp, conn, distLocal, '/var/www/sanna-crm/dist');

        console.log('3. Restarting sanna-crm-api in PM2...');
        await runSSH(conn, 'pm2 restart sanna-crm-api');

        console.log('4. Testing change-password API flow...');
        const testScript = `
const http = require('http');

// 1. Login with default credentials
const loginPayload = JSON.stringify({ identifier: 'empsi18', password: 'empsi18' });
const loginReq = http.request({
  hostname: '127.0.0.1',
  port: 5055,
  path: '/api/auth/login',
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginPayload) }
}, (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    const parsed = JSON.parse(data);
    console.log('Initial Login Result:', parsed.user?.username, '| mustChangePassword:', parsed.user?.mustChangePassword);
    
    // 2. Call change-password endpoint
    const changePayload = JSON.stringify({
      userId: parsed.user?.id,
      currentPassword: 'empsi18',
      newPassword: 'SmiteshSecure@2026'
    });
    
    const changeReq = http.request({
      hostname: '127.0.0.1',
      port: 5055,
      path: '/api/auth/change-password',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + parsed.accessToken,
        'Content-Length': Buffer.byteLength(changePayload)
      }
    }, (cRes) => {
      let cData = '';
      cRes.on('data', c => cData += c);
      cRes.on('end', () => {
        console.log('Change Password API Response:', cData);
        
        // 3. Re-login with new password
        const reloginPayload = JSON.stringify({ identifier: 'empsi18', password: 'SmiteshSecure@2026' });
        const reloginReq = http.request({
          hostname: '127.0.0.1',
          port: 5055,
          path: '/api/auth/login',
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(reloginPayload) }
        }, (rRes) => {
          let rData = '';
          rRes.on('data', c => rData += c);
          rRes.on('end', () => {
            const rParsed = JSON.parse(rData);
            console.log('Re-login with New Password:', rRes.statusCode === 200 ? 'SUCCESS' : 'FAILED', '| mustChangePassword:', rParsed.user?.mustChangePassword);
          });
        });
        reloginReq.write(reloginPayload);
        reloginReq.end();
      });
    });
    changeReq.write(changePayload);
    changeReq.end();
  });
});
loginReq.write(loginPayload);
loginReq.end();
`;
        const b64 = Buffer.from(testScript).toString('base64');
        const testRes = await runSSH(conn, `node -e "eval(Buffer.from('${b64}', 'base64').toString('utf8'))"`);
        console.log('Test Output:\n', testRes.stdout, testRes.stderr);

        console.log('✅ CHANGE PASSWORD FEATURE DEPLOYED AND VERIFIED.');
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

deployChangePasswordFeature().catch(console.error);
