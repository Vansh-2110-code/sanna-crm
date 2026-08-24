const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, 'unified_sanna_crm.db'));

db.serialize(() => {
  // Delete corrupted sessions with UTC 05:52 AM or 05:50 AM
  db.run("DELETE FROM sessions WHERE punch_in_time LIKE '%05:5%' OR punch_out_time LIKE '%05:5%'", [], function(err) {
    if (err) console.error(err);
    else console.log(`Deleted ${this.changes} erroneous UTC session records.`);
  });

  // Ensure Srinivas has an active session
  db.get("SELECT * FROM sessions WHERE user_id = 'EMP-SANNA-001' AND status = 'Active'", [], (err, row) => {
    if (!row) {
      console.log('Re-inserting clean active session for Srinivas (Admin)...');
      db.run(`
        INSERT INTO sessions (id, user_id, user_name, email, role, staff_type, login_time, punch_in_time, status, work_mode, ip_address, device, location)
        VALUES ('SES-2026-0818-001', 'EMP-SANNA-001', 'Srinivas (Admin)', 'admin@sannainnovations.com', 'Super Admin / Org Admin', 'Employee', '2026-08-18T03:30:00.000Z', '09:00 AM', 'Active', 'Office Campus', '103.21.144.92 (Office Fiber)', 'Windows 11 · Chrome 127.0 (Desktop)', 'Hyderabad, India (Asia/Kolkata)')
      `, (err) => {
        if (err) console.error(err);
        else console.log('Re-inserted Srinivas session.');
      });
    }

    db.all("SELECT id, user_name, punch_in_time, punch_out_time, status FROM sessions", [], (err, all) => {
      if (err) throw err;
      console.log(`Current sessions count in DB: ${all.length}`);
      console.log('All DB Sessions:', all);
      db.close();
    });
  });
});
