const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, 'unified_sanna_crm.db'));

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS salary_slips (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL DEFAULT 'client-sanna',
      employee_id TEXT NOT NULL,
      employee_name TEXT NOT NULL,
      designation TEXT,
      month TEXT NOT NULL,
      year INTEGER NOT NULL,
      basic_salary REAL DEFAULT 0,
      hra REAL DEFAULT 0,
      transport_allowance REAL DEFAULT 0,
      medical_allowance REAL DEFAULT 0,
      special_allowance REAL DEFAULT 0,
      bonus REAL DEFAULT 0,
      gross_salary REAL DEFAULT 0,
      pf REAL DEFAULT 0,
      esi REAL DEFAULT 0,
      professional_tax REAL DEFAULT 0,
      income_tax REAL DEFAULT 0,
      lop_deduction REAL DEFAULT 0,
      total_deductions REAL DEFAULT 0,
      net_salary REAL DEFAULT 0,
      per_day_rate REAL DEFAULT 0,
      working_days INTEGER DEFAULT 26,
      days_worked REAL DEFAULT 26,
      status TEXT DEFAULT 'Generated',
      paid_date TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('Error creating salary_slips table:', err);
    else console.log('✅ salary_slips table created successfully in unified_sanna_crm.db.');
    db.close();
  });
});
