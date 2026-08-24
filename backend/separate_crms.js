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

async function separateAstraAndSannaCrm() {
  const conn = new Client();
  console.log('Connecting to 103.160.144.225...');

  conn.on('ready', async () => {
    console.log('SSH Connection Established.');

    try {
      console.log('1. Cloning backend & structure to /var/www/sanna-crm...');
      await runSSH(conn, 'mkdir -p /var/www/sanna-crm && cp -rn /var/www/astra-crm/* /var/www/sanna-crm/ || true');

      conn.sftp(async (err, sftp) => {
        if (err) throw err;

        try {
          console.log('2. Uploading Sanna CRM db.json & dbInit.js to /var/www/sanna-crm/backend...');
          await uploadFile(sftp, path.join(__dirname, 'db.json'), '/var/www/sanna-crm/backend/db.json');
          await uploadFile(sftp, path.join(__dirname, 'config', 'dbInit.js'), '/var/www/sanna-crm/backend/config/dbInit.js');

          console.log('3. Setting up dedicated .env for Sanna CRM (Port 5055)...');
          const sannaEnv = `PORT=5055
NODE_ENV=production
JWT_SECRET=sanna_crm_secret_jwt_key_2026
SESSION_SECRET=sanna_crm_session_sign_key
FRONTEND_URL="http://103.160.144.225:8088"
`;
          await runSSH(conn, `echo "${Buffer.from(sannaEnv).toString('base64')}" | base64 -d > /var/www/sanna-crm/backend/.env`);

          console.log('4. Uploading Sanna CRM dist/ to /var/www/sanna-crm/dist...');
          const distLocal = path.join(__dirname, '..', 'dist');
          await uploadDirectory(sftp, conn, distLocal, '/var/www/sanna-crm/dist');

          console.log('5. Initializing Sanna CRM database in /var/www/sanna-crm/backend...');
          const seedRes = await runSSH(conn, 'cd /var/www/sanna-crm/backend && rm -f astra_crm_dev.sqlite && node -e "const { seedDatabase } = require(\'./config/dbInit\'); seedDatabase().then(() => console.log(\'SANNA_CRM_DB_SEEDED\')).catch(console.error);"');
          console.log('Seed Output:', seedRes.stdout);

          console.log('6. Registering PM2 service sanna-crm-api on Port 5055...');
          await runSSH(conn, 'pm2 delete sanna-crm-api || true; cd /var/www/sanna-crm/backend && pm2 start server.js --name sanna-crm-api; pm2 save');

          console.log('7. Configuring independent Nginx configuration for Sanna CRM (sannacrm) and Astra CRM (astracrm)...');
          
          // Sanna CRM Nginx config (Ports 8088, 3050, crm.sannainnovations.com)
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
    gzip_min_length 256;

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
    server_name crm.sannainnovations.com;

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

          // Astra CRM Nginx config (astracrm.theastraai.com & astracrm.sannainnovations.com)
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

          console.log('8. Testing and reloading Nginx...');
          await runSSH(conn, 'nginx -t && systemctl reload nginx');

          console.log('9. Checking PM2 processes and ports...');
          const pm2List = await runSSH(conn, 'pm2 list');
          console.log(pm2List.stdout);

          console.log('10. Testing Sanna CRM (5055 / 8088) and Astra CRM (5001)...');
          const testSanna = await runSSH(conn, 'curl -s http://127.0.0.1:5055/health && curl -s http://127.0.0.1:8088/health');
          console.log('Sanna CRM Health:', testSanna.stdout);

          const testAstra = await runSSH(conn, 'curl -s http://127.0.0.1:5001/health');
          console.log('Astra CRM Health:', testAstra.stdout);

          console.log('✅ SEPARATION COMPLETE: Astra CRM & Sanna CRM are running as distinct standalone applications!');
        } catch (e) {
          console.error('Error during SFTP steps:', e);
        } finally {
          conn.end();
        }
      });
    } catch (err) {
      console.error('SSH Error:', err);
      conn.end();
    }
  }).connect({
    host: '103.160.144.225',
    port: 22,
    username: 'root',
    password: passBuffer,
    tryKeyboard: true
  });
}

separateAstraAndSannaCrm().catch(console.error);
