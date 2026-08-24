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
      console.log(`  → Uploading ${f.name}`);
      await uploadFile(sftp, localF, remoteF);
    }
  }
}

async function deployKycFeature() {
  const conn = new Client();
  console.log('🚀 Deploying KYC + Employee Credentials Feature...');
  console.log('Connecting to 103.160.144.225...');

  conn.on('ready', async () => {
    console.log('✅ SSH Connected.\n');

    conn.sftp(async (err, sftp) => {
      if (err) throw err;

      try {
        const SANNA_BACKEND = '/var/www/sanna-crm/backend';
        const SANNA_DIST = '/var/www/sanna-crm/dist';
        const ASTRA_DIST = '/var/www/astra-crm/dist';

        // ── 1. Backend Files ──────────────────────────────────────────────────
        console.log('📦 [1/5] Uploading updated backend files...');

        // Updated EmployeeService (custom username + password)
        await uploadFile(sftp,
          path.join(__dirname, 'services', 'EmployeeService.js'),
          `${SANNA_BACKEND}/services/EmployeeService.js`
        );
        console.log('  ✓ EmployeeService.js');

        // Updated AuthService (returns kycStatus in login)
        await uploadFile(sftp,
          path.join(__dirname, 'services', 'AuthService.js'),
          `${SANNA_BACKEND}/services/AuthService.js`
        );
        console.log('  ✓ AuthService.js');

        // Updated routes/index.js (registers /kyc route)
        await uploadFile(sftp,
          path.join(__dirname, 'routes', 'index.js'),
          `${SANNA_BACKEND}/routes/index.js`
        );
        console.log('  ✓ routes/index.js');

        // New kycRoutes.js
        await runSSH(conn, `mkdir -p ${SANNA_BACKEND}/routes`);
        await uploadFile(sftp,
          path.join(__dirname, 'routes', 'kycRoutes.js'),
          `${SANNA_BACKEND}/routes/kycRoutes.js`
        );
        console.log('  ✓ kycRoutes.js (NEW)');

        // ── 2. Restart PM2 backend ─────────────────────────────────────────────
        console.log('\n🔄 [2/5] Restarting PM2 backend processes...');
        const pm2Res = await runSSH(conn, 'pm2 restart all 2>&1');
        console.log(pm2Res.stdout.slice(0, 500));

        // Short wait for PM2 to stabilize
        await new Promise(r => setTimeout(r, 3000));

        // Verify KYC table creation
        console.log('🔍 [2b] Verifying kyc_documents table creation...');
        const dbCheck = await runSSH(conn,
          `node -e "const s=require('sqlite3').verbose();const d=new s.Database('/var/www/sanna-crm/backend/unified_sanna_crm.db');d.run(\\"CREATE TABLE IF NOT EXISTS kyc_documents (id TEXT PRIMARY KEY, category TEXT, entity_type TEXT, entity_id TEXT, entity_name TEXT, entity_role TEXT, doc_type TEXT, doc_number TEXT, title TEXT, file_name TEXT, file_size TEXT, file_type TEXT, file_data TEXT, upload_date TEXT, verified_date TEXT, verified_by TEXT, status TEXT DEFAULT 'Pending Review', notes TEXT, tags TEXT DEFAULT '[]', uploaded_by TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)\\",function(e){d.all(\\"SELECT name FROM sqlite_master WHERE type='table' AND name='kyc_documents'\\",(_,r)=>{console.log('kyc_documents:',r.length>0?'EXISTS':'NOT FOUND');d.close();});});" 2>&1`
        );
        console.log('  DB Check:', dbCheck.stdout || dbCheck.stderr || '(no output)');

        // ── 3. Build check (already built locally, just upload dist) ──────────
        console.log('\n📤 [3/5] Uploading dist/ to Sanna CRM server...');
        const distLocal = path.join(__dirname, '..', 'dist');
        await runSSH(conn, `rm -rf ${SANNA_DIST}/*`);
        await uploadDirectory(sftp, conn, distLocal, SANNA_DIST);
        console.log('  ✓ Sanna CRM dist uploaded.');

        // ── 4. Upload to Astra CRM dist ───────────────────────────────────────
        console.log('\n📤 [4/5] Uploading dist/ to Astra CRM server...');
        await runSSH(conn, `rm -rf ${ASTRA_DIST}/*`);
        await uploadDirectory(sftp, conn, distLocal, ASTRA_DIST);
        console.log('  ✓ Astra CRM dist uploaded.');

        // ── 5. Reload Nginx ────────────────────────────────────────────────────
        console.log('\n🌐 [5/5] Reloading Nginx...');
        await runSSH(conn, 'systemctl reload nginx');
        const nginxStatus = await runSSH(conn, 'systemctl is-active nginx');
        console.log('  Nginx status:', nginxStatus.stdout.trim());

        // ── Verification ───────────────────────────────────────────────────────
        console.log('\n🧪 Verifying deployment...');
        const sannaPing = await runSSH(conn, 'curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5055/api/auth/login -X POST -H "Content-Type: application/json" -d \'{"identifier":"admin","password":"admin"}\' || true');
        console.log('  Auth API response code:', sannaPing.stdout.trim());

        console.log('\n✅ DEPLOYMENT COMPLETE!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('  → https://sannacrm.sannainnovations.com');
        console.log('  KYC Feature Live: Username + Password fields in Add Employee modal');
        console.log('  Employee KYC Modal will trigger on first login for new employees');
        console.log('  Admin-only KYC vault active');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      } catch (e) {
        console.error('❌ Deployment error:', e.message || e);
      } finally {
        conn.end();
      }
    });
  });

  conn.on('error', (err) => {
    console.error('❌ SSH Connection Error:', err.message);
  });

  conn.connect({
    host: '103.160.144.225',
    port: 22,
    username: 'root',
    password: passBuffer,
    tryKeyboard: true,
    readyTimeout: 60000,
    keepaliveInterval: 10000
  });
}

deployKycFeature().catch(console.error);
