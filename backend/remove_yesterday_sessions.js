const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, 'unified_sanna_crm.db'));

db.serialize(() => {
  db.run("DELETE FROM sessions WHERE id LIKE '%0817%' OR login_time LIKE '%2026-08-17%'", [], function(err) {
    if (err) console.error(err);
    else console.log(`Deleted ${this.changes} yesterday session records.`);
  });

  db.all("SELECT id, user_name, login_time, punch_in_time, status FROM sessions ORDER BY id ASC", [], (err, rows) => {
    if (err) throw err;
    console.log(`Remaining sessions count in DB: ${rows.length}`);
    console.log('Remaining sessions:', rows);
    db.close();
  });
});
