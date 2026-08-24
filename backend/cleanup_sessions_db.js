const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, 'unified_sanna_crm.db'));

const VALID_EMAILS = [
  'admin@sannainnovations.com',
  'empsi02@sannainnovations.com',
  'empsi03@sannainnovations.com',
  'empsi06@sannainnovations.com',
  'empsi07@sannainnovations.com',
  'btia23001@joyuniversity.edu.in',
  'shalinisree17@gmail.com',
  'vanshgoyal.cc12345@gmail.com',
  'btai23026@joyuniversity.edu.in',
  'yashdesh191@gmail.com',
  'karthik@sannainnovations.com',
  'Priyadigitaldm@gmail.com',
  'vidhurshan@sannainnovations.com',
  'smitesh@sannainnovations.com'
];

db.serialize(() => {
  // Delete all dummy and obsolete entries from sessions table
  db.run("DELETE FROM sessions WHERE email NOT IN (" + VALID_EMAILS.map(() => '?').join(',') + ") AND user_id NOT LIKE 'EMP-SANNA-%'", VALID_EMAILS, function(err) {
    if (err) console.error(err);
    else console.log(`Deleted ${this.changes} obsolete sessions.`);
  });

  db.all("SELECT count(*) as total, count(CASE WHEN status='Active' THEN 1 END) as active FROM sessions", [], (err, rows) => {
    if (err) throw err;
    console.log('Sessions Summary in DB:', rows);
    db.close();
  });
});
