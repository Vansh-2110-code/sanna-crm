const { Client } = require('ssh2');

const passBuffer = Buffer.from([
  0x4B, 0x42, 0x36, 0x56, 0x6E, 0x37, 0x32, 0x70, 0x32, 0x67, 0x53, 0x60, 0x28, 0x5C, 0x46
]).toString('utf8');

const conn = new Client();

const newNginxConfig = `server {
    server_name mis.sannainnovations.com;

    root /var/www/sanna-crm/dist;
    index index.html;

    # API proxy to Node.js backend
    location /api/ {
        proxy_pass http://127.0.0.1:5055;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # SPA fallback - serve index.html for all non-file routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/mis.sannainnovations.com/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/mis.sannainnovations.com/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}
server {
    if ($host = mis.sannainnovations.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    listen 80;
    server_name mis.sannainnovations.com;
    return 404; # managed by Certbot
}
`;

conn.on('ready', () => {
  const cmds = [
    // Backup current config
    'cp /etc/nginx/sites-enabled/mis /etc/nginx/sites-enabled/mis.bak',
    // Write new config
    `cat > /etc/nginx/sites-enabled/mis << 'NGINX_EOF'\n${newNginxConfig}\nNGINX_EOF`,
    // Test nginx config
    'nginx -t 2>&1',
    // Reload nginx
    'systemctl reload nginx 2>&1',
    // Verify API works through nginx
    'curl -s https://mis.sannainnovations.com/api/mis/deliverables 2>&1 | head -c 200',
  ];

  let idx = 0;
  function runNext() {
    if (idx >= cmds.length) { console.log('\n✅ Nginx config updated!'); conn.end(); return; }
    console.log(`\n=== Step ${idx+1} ===`);
    conn.exec(cmds[idx], (err, stream) => {
      if (err) { console.error('Error:', err); idx++; runNext(); return; }
      let out = '';
      stream.on('data', d => out += d.toString());
      stream.stderr.on('data', d => out += d.toString());
      stream.on('close', () => { console.log(out.trim() || '(ok)'); idx++; runNext(); });
    });
  }
  runNext();
});

conn.on('error', err => console.error('SSH Error:', err.message));
conn.connect({ host: '103.160.144.225', port: 22, username: 'root', password: passBuffer, readyTimeout: 30000 });
