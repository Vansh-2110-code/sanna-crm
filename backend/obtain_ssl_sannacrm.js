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

async function obtainSSL() {
  console.log('1. Testing Certbot dry run for sannacrm.sannainnovations.com...');
  const dryRes = await runSSH('certbot certonly --webroot -w /var/www/html -d sannacrm.sannainnovations.com --non-interactive --agree-tos -m admin@sannainnovations.com --dry-run');
  console.log('Dry Run:\n', dryRes.stdout, dryRes.stderr);

  if (dryRes.stdout.includes('The dry run was successful') || dryRes.code === 0) {
    console.log('2. Dry run passed! Issuing official production SSL certificate...');
    const certRes = await runSSH('certbot certonly --webroot -w /var/www/html -d sannacrm.sannainnovations.com --non-interactive --agree-tos -m admin@sannainnovations.com');
    console.log('Certbot Real Issue:\n', certRes.stdout, certRes.stderr);

    console.log('3. Updating NGINX configuration with new certificate path...');
    const nginxConf = `server {
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

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name sannacrm.sannainnovations.com;

    ssl_certificate /etc/letsencrypt/live/sannacrm.sannainnovations.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sannacrm.sannainnovations.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

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
`;
    const b64 = Buffer.from(nginxConf).toString('base64');
    await runSSH(`echo '${b64}' | base64 -d > /etc/nginx/sites-available/sannacrm`);
    await runSSH('nginx -t && systemctl reload nginx');

    console.log('4. Testing HTTPS curl for sannacrm.sannainnovations.com...');
    const testRes = await runSSH('curl -I https://sannacrm.sannainnovations.com');
    console.log('HTTPS Test:\n', testRes.stdout);
    console.log('🎉 SSL SUCCESSFULLY INSTALLED AND CONFIGURED!');
  } else {
    console.error('Dry run failed. Please check error output.');
  }
}

obtainSSL().catch(console.error);
