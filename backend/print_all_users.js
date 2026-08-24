const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, 'unified_sanna_crm.db'));

db.run('ALTER TABLE users ADD COLUMN base_salary REAL DEFAULT 50000', () => {
  db.all('SELECT id, username, plain_password, email, full_name, role, designation, stipend, base_salary FROM users ORDER BY id ASC', (err, rows) => {
    if (err) return console.error(err);
    console.log(`Total users in DB: ${rows.length}\n`);
    rows.forEach((u, i) => {
      console.log(`${i+1}. [${u.id}] Name: ${u.full_name || u.username} | Username: ${u.username} | Pass: ${u.plain_password || 'admin123'} | Email: ${u.email} | Role: ${u.role} | Salary: ₹${u.stipend || u.base_salary || 50000}`);
    });
    db.close();
  });
});
