const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const misDb = new sqlite3.Database(path.join(__dirname, '..', 'mis_backup_20260814.db'));
const unifiedDb = new sqlite3.Database(path.join(__dirname, 'unified_sanna_crm.db'));

misDb.all("SELECT name FROM sqlite_master WHERE type='table'", async (err, tables) => {
  console.log('=== MIS Backup Database Tables & Counts ===');
  for (const t of tables) {
    await new Promise(resolve => {
      misDb.get(`SELECT count(*) as cnt FROM ${t.name}`, (e, r) => {
        console.log(`[MIS] ${t.name}: ${r ? r.cnt : 0} rows`);
        resolve();
      });
    });
  }

  console.log('\n=== Unified DB Tables & Counts ===');
  unifiedDb.all("SELECT name FROM sqlite_master WHERE type='table'", async (err2, tables2) => {
    for (const t of tables2) {
      await new Promise(resolve => {
        unifiedDb.get(`SELECT count(*) as cnt FROM ${t.name}`, (e, r) => {
          console.log(`[UNIFIED] ${t.name}: ${r ? r.cnt : 0} rows`);
          resolve();
        });
      });
    }
    misDb.close();
    unifiedDb.close();
  });
});
