const path = require('path');
const sqlite3 = require('sqlite3');

const misDbPath = path.join(__dirname, '..', 'mis_backup_20260814.db');
const misDb = new sqlite3.Database(misDbPath);

misDb.all('SELECT id, name FROM clients_projects ORDER BY id ASC', [], (e, rows) => {
  if (e) console.error(e);
  rows.forEach(r => console.log(`${r.id}: "${r.name}"`));
});
