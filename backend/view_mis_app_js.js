const { Client } = require('ssh2');

const conn = new Client();
const password = Buffer.from([0x4B, 0x42, 0x36, 0x56, 0x6E, 0x37, 0x32, 0x70, 0x32, 0x67, 0x53, 0x60, 0x28, 0x5C, 0x46]).toString('utf8');

conn.on('ready', () => {
  console.log('SSH ready');
  conn.exec('sed -n "2880,2960p" /root/mis-sanna/frontend/js/app.js', (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end()).on('data', d => process.stdout.write(d)).stderr.on('data', d => process.stderr.write(d));
  });
}).connect({
  host: '103.160.144.225',
  port: 22,
  username: 'root',
  password
});
