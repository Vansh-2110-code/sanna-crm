const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, 'unified_sanna_crm.db');
const db = new sqlite3.Database(dbPath);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

async function cleanDatabase() {
  console.log('[CLEAN] Cleaning unified_sanna_crm.db while preserving complete schema...');

  // 1. Truncate all transactional & entity tables
  const tablesToTruncate = [
    'sessions',
    'attendance',
    'intern_work_logs',
    'clients_projects',
    'project_deliverables',
    'deliverable_remarks',
    'holiday_posts',
    'editor_assignments',
    'ad_spent_reports',
    'ad_spent_transactions',
    'server_details',
    'project_credentials',
    'leads',
    'financial_records',
    'content_tasks'
  ];

  for (const table of tablesToTruncate) {
    await run(`DELETE FROM ${table}`);
    console.log(`[CLEANED] Cleared table: ${table}`);
  }

  // 2. Clear users and retain ONLY 1 Admin employee
  await run('DELETE FROM users');
  await run(
    `INSERT INTO users (id, username, email, password_hash, plain_password, full_name, role, designation, department, college, degree, cohort, mentor, stipend, start_date, end_date, status, is_intern, must_change_password)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'EMP-SANNA-001',
      'admin',
      'admin@sannainnovations.com',
      'admin',
      'admin',
      'Srinivas (Admin)',
      'Super Admin / Org Admin',
      'Chief Executive Officer & Administrator',
      'Executive Leadership',
      'Sanna Innovations HQ',
      'Executive Management',
      '2026',
      'Board of Directors',
      0,
      '2026-01-01',
      '2099-12-31',
      'Active',
      0,
      0
    ]
  );
  console.log('[CLEANED] Preserved 1 Admin user in users table.');

  db.close();
  console.log('✅ [COMPLETE] Database cleaned. All schemas preserved with 1 Admin user.');
}

cleanDatabase().catch(err => {
  console.error('Error cleaning database:', err);
  process.exit(1);
});
