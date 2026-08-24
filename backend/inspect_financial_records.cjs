const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'unified_sanna_crm.db'));

db.all("SELECT * FROM financial_records LIMIT 20", [], (err, rows) => {
  console.log('Financial records samples:', rows);
});

db.all("SELECT DISTINCT type, category FROM financial_records", [], (err, rows) => {
  console.log('Financial records distinct types/categories:', rows);
});
