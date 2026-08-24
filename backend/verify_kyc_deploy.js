const { Client } = require('ssh2');

const passBuffer = Buffer.from([
  0x4B, 0x42, 0x36, 0x56, 0x6E, 0x37, 0x32, 0x70, 0x32, 0x67, 0x53, 0x60, 0x28, 0x5C, 0x46
]).toString('utf8');

function runSSH(conn, cmd) {
  return new Promise((resolve, reject) => {
    let out = '';
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      stream.on('close', () => resolve(out))
        .on('data', d => out += d)
        .stderr.on('data', d => out += d);
    });
  });
}

async function run() {
  const conn = new Client();
  conn.on('ready', async () => {
    console.log('Connected. Checking kyc_documents table...');

    // Check tables in sanna-crm db
    const tables = await runSSH(conn,
      `node -e "const s=require('/var/www/sanna-crm/backend/node_modules/sqlite3').verbose();` +
      `const d=new s.Database('/var/www/sanna-crm/backend/unified_sanna_crm.db');` +
      `d.all('SELECT name FROM sqlite_master WHERE type=\\'table\\'',(_,r)=>{console.log(r.map(x=>x.name).join(', '));d.close();})" 2>&1`
    );
    console.log('Tables on server:', tables);

    // Test auth API
    const authTest = await runSSH(conn,
      `curl -s -X POST http://127.0.0.1:5055/api/auth/login -H "Content-Type: application/json" -d '{"identifier":"admin","password":"admin"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print('kycStatus:', d.get('user',{}).get('kycStatus','NOT IN RESPONSE'))" 2>&1 || echo "curl/python failed"`
    );
    console.log('Login kycStatus field:', authTest);

    conn.end();
  }).connect({ host: '103.160.144.225', port: 22, username: 'root', password: passBuffer, tryKeyboard: true });
}
run().catch(console.error);
