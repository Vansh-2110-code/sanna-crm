const { Client } = require('ssh2');

const passBuffer = Buffer.from([
  0x4B, 0x42, 0x36, 0x56, 0x6E, 0x37, 0x32, 0x70, 0x32, 0x67, 0x53, 0x60, 0x28, 0x5C, 0x46
]).toString('utf8');

const conn = new Client();
conn.on('ready', () => {
  console.log('Connected to SSH.');
  const cmd = `
    cd /var/www/sanna-crm/backend && node -e "
      const sqlite3 = require('sqlite3');
      const db1 = new sqlite3.Database('/root/mis-sanna/backend/mis.db');
      db1.all('SELECT * FROM leads', (err, rows) => {
        if (err) console.error('mis.db leads err:', err);
        else console.log('mis.db leads count:', rows ? rows.length : 0);
      });
      db1.all('SELECT * FROM project_deliverables', (err, rows) => {
        if (err) console.error('mis.db deliverables err:', err);
        else console.log('mis.db deliverables count:', rows ? rows.length : 0);
      });

      const db2 = new sqlite3.Database('/var/www/sanna-crm/backend/unified_sanna_crm.db');
      db2.all('SELECT * FROM leads', (err, rows) => {
        if (err) console.error('unified leads err:', err);
        else console.log('unified leads count:', rows ? rows.length : 0);
      });
      db2.all('SELECT * FROM project_deliverables', (err, rows) => {
        if (err) console.error('unified deliverables err:', err);
        else console.log('unified deliverables count:', rows ? rows.length : 0);
      });
    "
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
