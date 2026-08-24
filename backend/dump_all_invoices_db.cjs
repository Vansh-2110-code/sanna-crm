const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'unified_sanna_crm.db'));

db.all("SELECT * FROM invoices", [], (err, invs) => {
  console.log('--- ALL INVOICES in unified_sanna_crm.db ---');
  console.log(invs);
});

db.all("SELECT * FROM invoice_items", [], (err, items) => {
  console.log('--- ALL INVOICE ITEMS in unified_sanna_crm.db ---');
  console.log(items);
});

db.all("SELECT * FROM quotations", [], (err, quotes) => {
  console.log('--- ALL QUOTATIONS in unified_sanna_crm.db ---');
  console.log(quotes);
});
