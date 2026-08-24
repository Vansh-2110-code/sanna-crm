const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const passBuffer = Buffer.from([
  0x4B, 0x42, 0x36, 0x56, 0x6E, 0x37, 0x32, 0x70, 0x32, 0x67, 0x53, 0x60, 0x28, 0x5C, 0x46
]).toString('utf8');

const conn = new Client();
conn.on('ready', () => {
  console.log('Connected. Uploading script and running on remote...');
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const localScript = path.join(__dirname, 'update_14_sessions_db.js');
    sftp.fastPut(localScript, '/var/www/sanna-crm/backend/update_14_sessions_db.js', (err) => {
      if (err) throw err;
      conn.exec('cd /var/www/sanna-crm/backend && node update_14_sessions_db.js', (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.stderr.on('data', d => out += d.toString());
        stream.on('close', (code) => {
          console.log('Remote execution output:', out);
          conn.end();
        });
      });
    });
  });
}).connect({
  host: '103.160.144.225',
  port: 22,
  username: 'root',
  password: passBuffer,
  readyTimeout: 30000
});
