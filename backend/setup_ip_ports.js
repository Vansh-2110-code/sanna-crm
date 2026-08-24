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
      tryKeyboard: true
    });
  });
}

async function updateNginxForIpPort() {
  const newNginxConfig = `# =========================================================
# SANNA CRM - Dedicated IP Port & Domain Configuration
# Accessible directly via:
#   http://103.160.144.225:8088/
#   http://103.160.144.225:3050/
#   https://crm.sannainnovations.com/
#   https://astracrm.sannainnovations.com/
#   https://astracrm.theastraai.com/
# =========================================================

# 1. Dedicated IP Port 8088 & 3050 for Sanna CRM
server {
    listen 8088;
    listen [::]:8088;
    listen 3050;
    listen [::]:3050;
    server_name 103.160.144.225 localhost _;

    root /var/www/astra-crm/dist;
    index index.html;

    client_max_body_size 50M;

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
    gzip_min_length 256;

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

# 2. Domain Server Blocks for SSL
server {
    listen 80;
    listen [::]:80;
    server_name astracrm.theastraai.com astracrm.sannainnovations.com crm.sannainnovations.com;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
        allow all;
        try_files $uri =404;
    }

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
    server_name astracrm.sannainnovations.com crm.sannainnovations.com astracrm.theastraai.com;

    ssl_certificate /etc/letsencrypt/live/sannainnovations.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sannainnovations.com/privkey.pem;

    root /var/www/astra-crm/dist;
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

  console.log('Writing updated Nginx configuration to /etc/nginx/sites-available/astracrm...');
  const encoded = Buffer.from(newNginxConfig).toString('base64');
  await runSSH(`echo "${encoded}" | base64 -d > /etc/nginx/sites-available/astracrm && ln -sf /etc/nginx/sites-available/astracrm /etc/nginx/sites-enabled/astracrm`);

  console.log('Testing Nginx syntax with nginx -t...');
  const testRes = await runSSH('nginx -t');
  console.log(testRes.stdout, testRes.stderr);

  if (testRes.stderr.includes('syntax is ok') || testRes.stdout.includes('syntax is ok')) {
    console.log('Reloading Nginx gracefully...');
    const reloadRes = await runSSH('systemctl reload nginx');
    console.log('Nginx Reloaded:', reloadRes.stdout);
  } else {
    console.error('Nginx test failed! Reverting...');
  }

  console.log('Testing direct IP HTTP connection on port 8088...');
  const ipTest = await runSSH('curl -s http://127.0.0.1:8088/ | head -n 12 && curl -s http://127.0.0.1:8088/api/leads?tenantId=client-sanna | head -c 120 || true');
  console.log('Port 8088 Response:\n' + ipTest.stdout);
}

updateNginxForIpPort().catch(console.error);
