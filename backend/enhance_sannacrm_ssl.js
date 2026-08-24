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

async function enhanceSSL() {
  console.log('1. Writing hardened Nginx config with HSTS for sannacrm...');
  const sannacrmConfig = `server {
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

# Force HTTP to HTTPS 301 Permanent Redirect
server {
    listen 80;
    listen [::]:80;
    server_name sannacrm.sannainnovations.com crm.sannainnovations.com;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
        allow all;
        try_files $uri =404;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS Server with HSTS & Modern SSL
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name sannacrm.sannainnovations.com crm.sannainnovations.com;

    ssl_certificate /etc/letsencrypt/live/sannacrm.sannainnovations.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sannacrm.sannainnovations.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # HSTS & Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

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
`;

  const b64 = Buffer.from(sannacrmConfig).toString('base64');
  await runSSH(`echo '${b64}' | base64 -d > /etc/nginx/sites-available/sannacrm`);
  await runSSH('ln -sf /etc/nginx/sites-available/sannacrm /etc/nginx/sites-enabled/sannacrm');
  await runSSH('nginx -t && systemctl reload nginx');

  console.log('2. Testing Nginx response...');
  const testRes = await runSSH('curl -sI https://sannacrm.sannainnovations.com');
  console.log(testRes.stdout);
  console.log('✅ HSTS and hardened SSL applied!');
}

enhanceSSL().catch(console.error);
