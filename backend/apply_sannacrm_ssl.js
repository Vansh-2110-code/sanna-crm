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

async function fixSSL() {
  console.log('1. Checking Let\'s Encrypt files for sannacrm.sannainnovations.com...');
  const checkCerts = await runSSH('ls -la /etc/letsencrypt/live/sannacrm.sannainnovations.com/');
  console.log(checkCerts.stdout);

  console.log('2. Preparing clean Nginx configuration for sannacrm...');
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

# HTTP Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name sannacrm.sannainnovations.com;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
        allow all;
        try_files $uri =404;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name sannacrm.sannainnovations.com;

    ssl_certificate /etc/letsencrypt/live/sannacrm.sannainnovations.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sannacrm.sannainnovations.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

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
  console.log('3. Writing /etc/nginx/sites-available/sannacrm...');
  await runSSH(`echo '${b64}' | base64 -d > /etc/nginx/sites-available/sannacrm`);

  console.log('4. Ensuring symlink in /etc/nginx/sites-enabled/ and removing backup file...');
  await runSSH('ln -sf /etc/nginx/sites-available/sannacrm /etc/nginx/sites-enabled/sannacrm');
  await runSSH('rm -f /etc/nginx/sites-enabled/mis.bak');

  console.log('5. Testing Nginx config...');
  const testRes = await runSSH('nginx -t');
  console.log('nginx -t output:', testRes.stdout, testRes.stderr);

  if (testRes.code === 0 || testRes.stderr.includes('syntax is ok')) {
    console.log('6. Reloading Nginx service...');
    const reloadRes = await runSSH('systemctl reload nginx');
    console.log('Reload output:', reloadRes.stdout, reloadRes.stderr);

    console.log('7. Verifying SSL with curl...');
    const curlRes = await runSSH('curl -Iv https://sannacrm.sannainnovations.com 2>&1 | head -n 35');
    console.log('Curl Verification Output:\n', curlRes.stdout);
  } else {
    console.error('Nginx test failed!');
  }
}

fixSSL().catch(console.error);
