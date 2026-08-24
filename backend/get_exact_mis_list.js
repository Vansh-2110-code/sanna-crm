const { Client } = require('ssh2');

const conn = new Client();
const password = Buffer.from([0x4B, 0x42, 0x36, 0x56, 0x6E, 0x37, 0x32, 0x70, 0x32, 0x67, 0x53, 0x60, 0x28, 0x5C, 0x46]).toString('utf8');

conn.on('ready', () => {
  conn.exec(`python3 -c "
import sqlite3
conn = sqlite3.connect('/root/mis-sanna/backend/mis.db')
conn.row_factory = sqlite3.Row
cur = conn.cursor()
projects = cur.execute('''SELECT * FROM clients_projects WHERE status = 'active' AND client_type = 'active_dm' ORDER BY id ASC''').fetchall()
for idx, p in enumerate(projects):
    delivs = cur.execute('''SELECT * FROM project_deliverables WHERE project_id = ? AND year = 2026 AND month = 8 ORDER BY id ASC''', (p['id'],)).fetchall()
    d = delivs[0] if delivs else {}
    print(f'{idx+1}. ID:{d.get(\"id\", 0)} | Project:{p[\"name\"]} | Type:{\"DM\" if p[\"is_dm\"] else \"Non-DM\"} | DeliveryDate:{d.get(\"delivery_date\")} | Planned:{d.get(\"reels_planned\", 0)}R/{d.get(\\"posts_planned\\", 0)}P | Deliv:{d.get(\"reels_delivered\", 0)}R/{d.get(\"posts_delivered\", 0)}P | Remarks:{d.get(\"approval_pending_remarks\")} | InitialFollowers:{p[\"initial_followers\"]}')
"`, (err, stream) => {
    let out = '';
    stream.on('data', d => out += d);
    stream.on('close', () => {
      console.log('MIS August List:\n' + out);
      conn.end();
    });
  });
}).connect({
  host: '103.160.144.225',
  port: 22,
  username: 'root',
  password
});
