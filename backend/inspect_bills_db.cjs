const sqlite3 = require('sqlite3').verbose();
const path = require('path');

function inspectDb(dbPath) {
  return new Promise((resolve) => {
    console.log(`\n=== Inspecting: ${dbPath} ===`);
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening db:', err.message);
        return resolve();
      }
    });

    db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
      if (err) {
        console.error('Error fetching tables:', err.message);
        return resolve();
      }
      console.log('Tables:', tables.map(t => t.name).join(', '));
      
      let done = 0;
      if (tables.length === 0) return resolve();

      tables.forEach(t => {
        if (t.name.includes('sqlite')) {
          done++;
          if (done === tables.length) resolve();
          return;
        }
        db.get(`SELECT count(*) as count FROM "${t.name}"`, (err2, row) => {
          console.log(`  Table [${t.name}]: ${row ? row.count : 0} rows`);
          if (t.name.toLowerCase().includes('bill') || t.name.toLowerCase().includes('inv') || t.name.toLowerCase().includes('order') || t.name.toLowerCase().includes('sale') || t.name.toLowerCase().includes('tax') || t.name.toLowerCase().includes('gst')) {
            db.all(`SELECT * FROM "${t.name}" LIMIT 5`, (err3, samples) => {
              console.log(`    Sample from [${t.name}]:`, samples);
              done++;
              if (done === tables.length) resolve();
            });
          } else {
            done++;
            if (done === tables.length) resolve();
          }
        });
      });
    });
  });
}

async function run() {
  await inspectDb(path.join(__dirname, 'mis_backup_20260814.db'));
  await inspectDb(path.join(__dirname, 'unified_sanna_crm.db'));
}

run();
