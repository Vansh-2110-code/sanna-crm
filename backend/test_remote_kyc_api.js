const { Client } = require('ssh2');

const passBuffer = Buffer.from([0x4B,0x42,0x36,0x56,0x6E,0x37,0x32,0x70,0x32,0x67,0x53,0x60,0x28,0x5C,0x46]).toString('utf8');
const conn = new Client();

conn.on('ready', () => {
  conn.exec(`node -e "
    const http = require('http');
    const payload = JSON.stringify({ identifier: 'admin', password: 'admin' });
    const req = http.request({ hostname: '127.0.0.1', port: 5055, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } }, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => {
        const auth = JSON.parse(d);
        const token = auth.accessToken || auth.token;
        const kycReq = http.request({ hostname: '127.0.0.1', port: 5055, path: '/api/kyc', method: 'GET', headers: { 'Authorization': 'Bearer ' + token } }, (kRes) => {
          let kd = ''; kRes.on('data', kc => kd += kc);
          kRes.on('end', () => {
            const docs = JSON.parse(kd);
            const vivek = docs.filter(x => (x.entityName && x.entityName.includes('Vivek')) || (x.title && x.title.includes('Vivek')));
            console.log('Vivek docs count:', vivek.length);
            console.log('Vivek docs:', JSON.stringify(vivek, null, 2));
          });
        });
        kycReq.end();
      });
    });
    req.write(payload);
    req.end();
  "`, (err, stream) => {
    let out = '';
    stream.on('data', d => out += d).stderr.on('data', d => out += d);
    stream.on('close', () => {
      console.log(out);
      conn.end();
    });
  });
}).connect({ host: '103.160.144.225', port: 22, username: 'root', password: passBuffer, tryKeyboard: true });
