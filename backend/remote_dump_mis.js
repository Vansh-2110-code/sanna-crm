const { Client } = require('ssh2');

const conn = new Client();
const password = Buffer.from([0x4B, 0x42, 0x36, 0x56, 0x6E, 0x37, 0x32, 0x70, 0x32, 0x67, 0x53, 0x60, 0x28, 0x5C, 0x46]).toString('utf8');

conn.on('ready', () => {
  conn.exec(`cat << 'EOF' > /tmp/dump_mis.py
import sqlite3, json

conn = sqlite3.connect('/root/mis-sanna/backend/mis.db')
conn.row_factory = sqlite3.Row
cur = conn.cursor()

projects = cur.execute("SELECT * FROM clients_projects WHERE status = 'active' AND client_type = 'active_dm' ORDER BY id ASC").fetchall()
print(f"Total active projects: {len(projects)}")

for idx, p in enumerate(projects):
    p_dict = dict(p)
    delivs = cur.execute("SELECT * FROM project_deliverables WHERE project_id = ? AND year = 2026 AND month = 8 ORDER BY id ASC", (p_dict['id'],)).fetchall()
    d_dict = dict(delivs[0]) if delivs else {}
    print(f"{idx+1}. ID:{d_dict.get('id', 0)} | ProjectID:{p_dict['id']} | Name:{p_dict['name']} | Type:{'DM' if p_dict.get('is_dm') else 'Non-DM'} | Date:{d_dict.get('delivery_date')} | Plan:{d_dict.get('reels_planned', 0)}R/{d_dict.get('posts_planned', 0)}P | Deliv:{d_dict.get('reels_delivered', 0)}R/{d_dict.get('posts_delivered', 0)}P | Service:{d_dict.get('service')} | Rem:{d_dict.get('approval_pending_remarks')}")

EOF
python3 /tmp/dump_mis.py
`, (err, stream) => {
    let out = '';
    stream.on('data', d => out += d);
    stream.on('close', () => {
      console.log('Output:\n' + out);
      conn.end();
    });
  });
}).connect({
  host: '103.160.144.225',
  port: 22,
  username: 'root',
  password
});
