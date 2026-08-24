const { Client } = require('ssh2');

const passBuffer = Buffer.from([
  0x4B, 0x42, 0x36, 0x56, 0x6E, 0x37, 0x32, 0x70, 0x32, 0x67, 0x53, 0x60, 0x28, 0x5C, 0x46
]).toString('utf8');

const conn = new Client();
conn.on('ready', () => {
  console.log('Connected to SSH.');
  const cmd = `
    echo "=== LEADS IN /var/www/sanna-crm/backend/unified_sanna_crm.db ==="
    sqlite3 /var/www/sanna-crm/backend/unified_sanna_crm.db "SELECT id, name, company, phone, status FROM leads ORDER BY id ASC;"
    
    echo ""
    echo "=== LEADS IN /root/mis-sanna/backend/mis.db ==="
    sqlite3 /root/mis-sanna/backend/mis.db "SELECT id, name, company, phone, status FROM leads ORDER BY id ASC;"
  `;
  
  conn.exec(cmd, (err, stream) => {
    stream.on('data', d => console.log(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect({
  host: '103.160.144.225',
  port: 22,
  username: 'root',
  password: passBuffer,
  tryKeyboard: true
});
