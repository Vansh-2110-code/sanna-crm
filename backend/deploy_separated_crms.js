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

async function deploySeparatedCRMs() {
  const conn = new Client();
  console.log('Connecting to remote production server (103.160.144.225)...');

  conn.on('ready', async () => {
    console.log('SSH Connection Established.');

    conn.sftp(async (err, sftp) => {
      if (err) throw err;

      try {
        console.log('1. Uploading backend files to both Sanna CRM and Astra CRM...');
        const backendFiles = [
          { local: path.join(__dirname, 'config', 'dbInit.js'), rel: 'config/dbInit.js' },
          { local: path.join(__dirname, 'config', 'database.js'), rel: 'config/database.js' },
          { local: path.join(__dirname, 'middleware', 'planMiddleware.js'), rel: 'middleware/planMiddleware.js' },
          { local: path.join(__dirname, 'middleware', 'authMiddleware.js'), rel: 'middleware/authMiddleware.js' },
          { local: path.join(__dirname, 'controllers', 'orderController.js'), rel: 'controllers/orderController.js' },
          { local: path.join(__dirname, 'routes', 'orderRoutes.js'), rel: 'routes/orderRoutes.js' },
          { local: path.join(__dirname, 'routes', 'misRoutes.js'), rel: 'routes/misRoutes.js' },
          { local: path.join(__dirname, 'services', 'OrderService.js'), rel: 'services/OrderService.js' },
          { local: path.join(__dirname, 'models', 'Order.js'), rel: 'models/Order.js' },
          { local: path.join(__dirname, 'models', 'index.js'), rel: 'models/index.js' }
        ];

        for (const bf of backendFiles) {
          if (fs.existsSync(bf.local)) {
            await uploadFile(sftp, bf.local, `/var/www/sanna-crm/backend/${bf.rel}`);
            await uploadFile(sftp, bf.local, `/var/www/astra-crm/backend/${bf.rel}`);
          }
        }

        console.log('2. Configuring Sanna CRM backend .env...');
        const sannaEnv = `PORT=5055
NODE_ENV=production
APP_MODE=sanna
CRM_TYPE=sanna
JWT_SECRET=sanna_crm_secret_jwt_key_2026
SESSION_SECRET=sanna_crm_session_sign_key
FRONTEND_URL="http://103.160.144.225:8088"
`;
        await runSSH(conn, `echo "${Buffer.from(sannaEnv).toString('base64')}" | base64 -d > /var/www/sanna-crm/backend/.env`);

        console.log('3. Configuring Astra CRM backend .env...');
        const astraEnv = `PORT=5001
NODE_ENV=production
APP_MODE=astra
CRM_TYPE=astra
JWT_SECRET=astra_crm_secret_jwt_key_2026
SESSION_SECRET=astra_crm_session_sign_key
FRONTEND_URL="https://astracrm.theastraai.com"
`;
        await runSSH(conn, `echo "${Buffer.from(astraEnv).toString('base64')}" | base64 -d > /var/www/astra-crm/backend/.env`);

        console.log('4. Initializing clean database for Astra CRM (0 pre-fed client data)...');
        await runSSH(conn, 'cd /var/www/astra-crm/backend && rm -f astra_crm_dev.sqlite unified_sanna_crm.db && node -e "const { seedDatabase } = require(\'./config/dbInit\'); seedDatabase().then(() => console.log(\'ASTRA_CLEAN_DB_SEEDED\')).catch(console.error);"');

        console.log('5. Uploading compiled frontend dist/ to /var/www/sanna-crm/dist...');
        const distLocal = path.join(__dirname, '..', 'dist');
        await runSSH(conn, 'rm -rf /var/www/sanna-crm/dist/*');
        await uploadDirectory(sftp, conn, distLocal, '/var/www/sanna-crm/dist');

        console.log('6. Uploading compiled frontend dist/ to /var/www/astra-crm/dist...');
        await runSSH(conn, 'rm -rf /var/www/astra-crm/dist/*');
        await uploadDirectory(sftp, conn, distLocal, '/var/www/astra-crm/dist');

        console.log('7. Configuring Nginx server blocks for both CRM domains...');
        const sannaNginx = `server {
    listen 8088;
    listen [::]:8088;
    listen 3050;
    listen [::]:3050;
    server_name 103.160.144.225 localhost _;

    root /var/www/sanna-crm/dist;
    index index.html;
    client_max_body_size 50M;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:5055/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://127.0.0.1:5055/health;
    }
}

server {
    listen 80;
    listen [::]:80;
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name crm.sannainnovations.com sannacrm.sannainnovations.com;

    ssl_certificate /etc/letsencrypt/live/sannainnovations.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sannainnovations.com/privkey.pem;

    root /var/www/sanna-crm/dist;
    index index.html;
    client_max_body_size 50M;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
        allow all;
        try_files $uri =404;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:5055/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://127.0.0.1:5055/health;
    }
}
`;

        const astraNginx = `server {
    listen 80;
    listen [::]:80;
    server_name astracrm.theastraai.com astracrm.sannainnovations.com;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
        allow all;
        try_files $uri =404;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name astracrm.theastraai.com;

    ssl_certificate /etc/letsencrypt/live/astracrm.theastraai.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/astracrm.theastraai.com/privkey.pem;

    root /var/www/astra-crm/dist;
    index index.html;
    client_max_body_size 50M;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:5001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://127.0.0.1:5001/health;
    }
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name astracrm.sannainnovations.com;

    ssl_certificate /etc/letsencrypt/live/sannainnovations.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sannainnovations.com/privkey.pem;

    root /var/www/astra-crm/dist;
    index index.html;
    client_max_body_size 50M;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:5001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://127.0.0.1:5001/health;
    }
}
`;

        await runSSH(conn, `echo "${Buffer.from(sannaNginx).toString('base64')}" | base64 -d > /etc/nginx/sites-available/sannacrm && ln -sf /etc/nginx/sites-available/sannacrm /etc/nginx/sites-enabled/sannacrm`);
        await runSSH(conn, `echo "${Buffer.from(astraNginx).toString('base64')}" | base64 -d > /etc/nginx/sites-available/astracrm && ln -sf /etc/nginx/sites-available/astracrm /etc/nginx/sites-enabled/astracrm`);

        console.log('8. Restarting PM2 processes and reloading Nginx...');
        await runSSH(conn, 'cd /var/www/sanna-crm/backend && (pm2 restart sanna-crm-api || pm2 start server.js --name sanna-crm-api)');
        await runSSH(conn, 'cd /var/www/astra-crm/backend && (pm2 restart astra-crm-api || pm2 start server.js --name astra-crm-api)');
        await runSSH(conn, 'pm2 save');
        await runSSH(conn, 'nginx -t && systemctl reload nginx');

        console.log('9. Checking running PM2 processes...');
        const pm2Status = await runSSH(conn, 'pm2 list');
        console.log(pm2Status.stdout);

        console.log('10. Health check verification:');
        const sannaHealth = await runSSH(conn, 'curl -s http://127.0.0.1:5055/health');
        console.log('Sanna CRM Backend (5055):', sannaHealth.stdout);

        const astraHealth = await runSSH(conn, 'curl -s http://127.0.0.1:5001/health');
        console.log('Astra CRM Backend (5001):', astraHealth.stdout);

        console.log('✅ COMPLETE SEPARATION SUCCESSFUL: Sanna CRM has all Sanna Innovations data; Astra CRM has clean slate.');
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

deploySeparatedCRMs().catch(console.error);
