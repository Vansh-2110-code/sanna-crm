const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const devDb = new sqlite3.Database(path.join(__dirname, 'astra_crm_dev.sqlite'));
const unifiedDb = new sqlite3.Database(path.join(__dirname, 'unified_sanna_crm.db'));

unifiedDb.all('SELECT * FROM users', [], (err, users) => {
  if (err) {
    console.error('Failed to read unified users:', err);
    return;
  }

  console.log(`Read ${users.length} users from unified_sanna_crm.db`);

  devDb.serialize(() => {
    try {
      devDb.run('ALTER TABLE employees ADD COLUMN username VARCHAR(255)', () => {});
    } catch (e) {}

    // 1. Clear old demo employees
    devDb.run('DELETE FROM employees', [], (delErr) => {
      if (delErr) console.error('Error clearing employees:', delErr);
      else console.log('Cleared old demo employees from astra_crm_dev.sqlite');
    });

    // 2. Insert the 24 MIS employees
    const stmt = devDb.prepare(`
      INSERT OR REPLACE INTO employees 
      (id, client_id, name, email, designation, role_id, password_hash, avatar, base_salary, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    const salt = bcrypt.genSaltSync(10);

    users.forEach(u => {
      const pass = u.plain_password || u.username || 'admin123';
      const hash = u.password_hash?.startsWith('$2') ? u.password_hash : bcrypt.hashSync(pass, salt);
      const roleId = u.role_id || (u.role?.includes('Admin') ? 'role-admin' : (u.role?.includes('Manager') ? 'role-mgr' : 'role-exec'));
      const salary = parseInt(u.stipend || u.base_salary || 50000, 10);
      const avatar = u.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80";

      stmt.run([
        u.id,
        'client-sanna',
        u.full_name || u.name || u.username,
        u.email,
        u.designation || u.role || 'Staff Member',
        roleId,
        hash,
        avatar,
        salary
      ]);
    });

    stmt.finalize(() => {
      console.log('Inserted 24 MIS employees into astra_crm_dev.sqlite');
      devDb.all('SELECT id, name, email, designation FROM employees', [], (qErr, rows) => {
        console.log('Dev DB employees count:', rows?.length, rows);
      });
    });
  });
});
