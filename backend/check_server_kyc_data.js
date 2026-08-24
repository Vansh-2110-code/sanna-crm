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
    console.log('Querying kyc_documents from server DB...');
    const records = await runSSH(conn,
      `node -e "const s=require('/var/www/sanna-crm/backend/node_modules/sqlite3').verbose();` +
      `const d=new s.Database('/var/www/sanna-crm/backend/unified_sanna_crm.db');` +
      `d.all('SELECT id, entity_name, doc_type, status, created_at FROM kyc_documents',(_,r)=>{console.log(JSON.stringify(r,null,2));d.close();})" 2>&1`
    );
    console.log('Records in SQLite kyc_documents:\n', records);

    console.log('Checking recent PM2 logs for sanna-crm-api...');
    const logs = await runSSH(conn, 'pm2 logs sanna-crm-api --lines 30 --nostream 2>&1');
    console.log('Logs:\n', logs);

    conn.end();
  }).connect({ host: '103.160.144.225', port: 22, username: 'root', password: passBuffer, tryKeyboard: true });
}
run().catch(console.error);
