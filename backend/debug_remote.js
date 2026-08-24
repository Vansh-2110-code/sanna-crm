const { Client } = require('ssh2');

const passBuffer = Buffer.from([
  0x4B, 0x42, 0x36, 0x56, 0x6E, 0x37, 0x32, 0x70, 0x32, 0x67, 0x53, 0x60, 0x28, 0x5C, 0x46
]).toString('utf8');

const conn = new Client();

conn.on('ready', () => {
  const cmds = [
    'cat /etc/nginx/sites-enabled/mis',
  ];

  let idx = 0;
  function runNext() {
    if (idx >= cmds.length) { conn.end(); return; }
    conn.exec(cmds[idx], (err, stream) => {
      if (err) { console.error('Error:', err); idx++; runNext(); return; }
      let out = '';
      stream.on('data', d => out += d.toString());
      stream.stderr.on('data', d => out += d.toString());
      stream.on('close', () => { console.log(out.trim()); idx++; runNext(); });
    });
  }
  runNext();
});

conn.on('error', err => console.error('SSH Error:', err.message));
conn.connect({ host: '103.160.144.225', port: 22, username: 'root', password: passBuffer, readyTimeout: 30000 });
