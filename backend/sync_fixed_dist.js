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

async function syncDist() {
  const conn = new Client();
  console.log('Connecting to 103.160.144.225...');

  conn.on('ready', async () => {
    console.log('Connected to server.');

    conn.sftp(async (err, sftp) => {
      if (err) throw err;

      try {
        console.log('1. Uploading backend services, models, config, and database...');
        const authServiceLocal = path.join(__dirname, 'services', 'AuthService.js');
        await uploadFile(sftp, authServiceLocal, '/var/www/sanna-crm/backend/services/AuthService.js');

        const empServiceLocal = path.join(__dirname, 'services', 'EmployeeService.js');
        await uploadFile(sftp, empServiceLocal, '/var/www/sanna-crm/backend/services/EmployeeService.js');

        const empModelLocal = path.join(__dirname, 'models', 'Employee.js');
        await uploadFile(sftp, empModelLocal, '/var/www/sanna-crm/backend/models/Employee.js');

        const orderServiceLocal = path.join(__dirname, 'services', 'OrderService.js');
        await uploadFile(sftp, orderServiceLocal, '/var/www/sanna-crm/backend/services/OrderService.js');
        await uploadFile(sftp, orderServiceLocal, '/var/www/astra-crm/backend/services/OrderService.js');

        const orderModelLocal = path.join(__dirname, 'models', 'Order.js');
        await uploadFile(sftp, orderModelLocal, '/var/www/sanna-crm/backend/models/Order.js');
        await uploadFile(sftp, orderModelLocal, '/var/www/astra-crm/backend/models/Order.js');

        const dbConfigLocal = path.join(__dirname, 'config', 'database.js');
        await uploadFile(sftp, dbConfigLocal, '/var/www/sanna-crm/backend/config/database.js');

        const empRepoLocal = path.join(__dirname, 'repositories', 'EmployeeRepository.js');
        await uploadFile(sftp, empRepoLocal, '/var/www/sanna-crm/backend/repositories/EmployeeRepository.js');

        const misRoutesLocal = path.join(__dirname, 'routes', 'misRoutes.js');
        await uploadFile(sftp, misRoutesLocal, '/var/www/sanna-crm/backend/routes/misRoutes.js');

        const modelsIndexLocal = path.join(__dirname, 'models', 'index.js');
        await uploadFile(sftp, modelsIndexLocal, '/var/www/sanna-crm/backend/models/index.js');

        const leadServiceLocal = path.join(__dirname, 'services', 'LeadService.js');
        await uploadFile(sftp, leadServiceLocal, '/var/www/sanna-crm/backend/services/LeadService.js');

        const leadModelLocal = path.join(__dirname, 'models', 'Lead.js');
        await uploadFile(sftp, leadModelLocal, '/var/www/sanna-crm/backend/models/Lead.js');

        const planMiddlewareLocal = path.join(__dirname, 'middleware', 'planMiddleware.js');
        await uploadFile(sftp, planMiddlewareLocal, '/var/www/sanna-crm/backend/middleware/planMiddleware.js');
        await uploadFile(sftp, planMiddlewareLocal, '/var/www/astra-crm/backend/middleware/planMiddleware.js');

        const orderRoutesLocal = path.join(__dirname, 'routes', 'orderRoutes.js');
        await uploadFile(sftp, orderRoutesLocal, '/var/www/sanna-crm/backend/routes/orderRoutes.js');
        await uploadFile(sftp, orderRoutesLocal, '/var/www/astra-crm/backend/routes/orderRoutes.js');

        const orderControllerLocal = path.join(__dirname, 'controllers', 'orderController.js');
        await uploadFile(sftp, orderControllerLocal, '/var/www/sanna-crm/backend/controllers/orderController.js');
        await uploadFile(sftp, orderControllerLocal, '/var/www/astra-crm/backend/controllers/orderController.js');

        console.log('2. Restarting backend PM2 processes...');
        await runSSH(conn, 'pm2 restart all');

        console.log('3. Clearing and uploading dist to /var/www/sanna-crm/dist...');
        await runSSH(conn, 'rm -rf /var/www/sanna-crm/dist/*');
        const distLocal = path.join(__dirname, '..', 'dist');
        await uploadDirectory(sftp, conn, distLocal, '/var/www/sanna-crm/dist');

        console.log('4. Clearing and uploading dist to /var/www/astra-crm/dist...');
        await runSSH(conn, 'rm -rf /var/www/astra-crm/dist/*');
        await uploadDirectory(sftp, conn, distLocal, '/var/www/astra-crm/dist');

        console.log('5. Reloading Nginx...');
        await runSSH(conn, 'systemctl reload nginx');

        console.log('6. Checking Nginx status...');
        const nginxRes = await runSSH(conn, 'systemctl status nginx --no-pager | head -n 10');
        console.log(nginxRes.stdout);

        console.log('✅ BOTH SANNA-CRM & ASTRA-CRM FRONTENDS AND BACKENDS SYNCED.');
      } catch (e) {
        console.error('Error during sync:', e);
      } finally {
        conn.end();
      }
    });
  });

  conn.on('error', (err) => {
    console.error('SSH Connection Error:', err.message);
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

syncDist().catch(console.error);
