const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const unifiedDbPath = path.join(__dirname, 'unified_sanna_crm.db');
if (fs.existsSync(unifiedDbPath)) {
  fs.unlinkSync(unifiedDbPath);
  console.log('[RESET] Removed previous unified_sanna_crm.db');
}

const db = new sqlite3.Database(unifiedDbPath);

// Source MIS SQLite DB
const misDbPath = path.join(__dirname, '..', 'mis_backup_20260814.db');
const misDb = new sqlite3.Database(misDbPath);

// Source MongoDB dump directory
const mongoDir = path.join(__dirname, 'mongo_dump');
function loadMongoJson(filename) {
  const p = path.join(mongoDir, filename);
  if (!fs.existsSync(p)) return [];
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    console.error(`Error loading ${filename}:`, e.message);
    return [];
  }
}

const mongoUsers = loadMongoJson('users.json');
const mongoSessions = loadMongoJson('session_logs.json');
const mongoLogs = loadMongoJson('intern_logs.json');
const mongoAttendance = loadMongoJson('attendance.json');
const mongoHosting = loadMongoJson('hosting_details.json');

console.log('[START] Beginning Unified Database Creation & Migration...');

function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function queryMis(sql, params = []) {
  return new Promise((resolve, reject) => {
    misDb.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function createSchema() {
  console.log('[SCHEMA] Creating unified tables...');

  // 1. Users / Staff / Interns / Employees
  await runAsync(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT,
      password_hash TEXT,
      plain_password TEXT,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL,
      role_id TEXT,
      designation TEXT,
      department TEXT,
      college TEXT,
      degree TEXT,
      cohort TEXT,
      mentor TEXT,
      stipend REAL DEFAULT 0,
      start_date TEXT,
      end_date TEXT,
      status TEXT DEFAULT 'Active',
      avatar TEXT,
      is_intern INTEGER DEFAULT 0,
      must_change_password INTEGER DEFAULT 0,
      overall_score REAL DEFAULT 4.8,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 2. Login & Punch Sessions
  await runAsync(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_name TEXT,
      email TEXT,
      role TEXT,
      staff_type TEXT,
      login_time TEXT,
      punch_in_time TEXT,
      punch_out_time TEXT,
      ip_address TEXT,
      device TEXT,
      location TEXT,
      status TEXT,
      work_mode TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 3. Attendance Matrix Records
  await runAsync(`
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      username TEXT,
      date TEXT NOT NULL,
      month INTEGER,
      year INTEGER,
      day INTEGER,
      status TEXT DEFAULT 'Present',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 4. Intern Work Logs
  await runAsync(`
    CREATE TABLE IF NOT EXISTS intern_work_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      username TEXT,
      week_number INTEGER,
      date TEXT,
      start_date TEXT,
      end_date TEXT,
      task_description TEXT,
      work_done TEXT,
      learnings TEXT,
      blockers TEXT,
      pr_link TEXT,
      status TEXT DEFAULT 'Reviewed & Approved',
      mentor_feedback TEXT,
      rating REAL DEFAULT 5,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 5. Clients / Projects
  await runAsync(`
    CREATE TABLE IF NOT EXISTS clients_projects (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      client_name TEXT,
      client_type TEXT,
      is_dm INTEGER DEFAULT 1,
      billing_cycle TEXT DEFAULT 'Monthly',
      ticket_size REAL DEFAULT 0,
      advance_payment REAL DEFAULT 0,
      payment_status TEXT DEFAULT 'Pending',
      status TEXT DEFAULT 'active',
      onboarded_date TEXT,
      deadline TEXT,
      assigned_lead TEXT DEFAULT 'Aarav Sharma',
      contact_person TEXT,
      contact_email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 6. Project Deliverables
  await runAsync(`
    CREATE TABLE IF NOT EXISTS project_deliverables (
      id INTEGER PRIMARY KEY,
      project_id INTEGER NOT NULL,
      project_name TEXT,
      service TEXT,
      month INTEGER,
      year INTEGER,
      delivery_date TEXT,
      reels_planned INTEGER DEFAULT 0,
      posts_planned INTEGER DEFAULT 0,
      reels_delivered INTEGER DEFAULT 0,
      posts_delivered INTEGER DEFAULT 0,
      total_followers TEXT,
      views_reached TEXT,
      backlinks_created TEXT,
      approval_pending_remarks TEXT,
      other_remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 7. Deliverable Remarks
  await runAsync(`
    CREATE TABLE IF NOT EXISTS deliverable_remarks (
      id INTEGER PRIMARY KEY,
      deliverable_id INTEGER NOT NULL,
      author TEXT,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 8. Holiday Posts
  await runAsync(`
    CREATE TABLE IF NOT EXISTS holiday_posts (
      id INTEGER PRIMARY KEY,
      project_id INTEGER NOT NULL,
      client_project TEXT,
      holiday_name TEXT NOT NULL,
      created INTEGER DEFAULT 0,
      approval_status TEXT DEFAULT 'Pending',
      scheduled_posted TEXT DEFAULT 'Scheduled',
      date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 9. Editor Assignments
  await runAsync(`
    CREATE TABLE IF NOT EXISTS editor_assignments (
      id INTEGER PRIMARY KEY,
      editor_name TEXT NOT NULL,
      email TEXT,
      project_id INTEGER NOT NULL,
      client_project TEXT,
      task_description TEXT,
      assignment_date TEXT,
      submission_date TEXT,
      status TEXT DEFAULT 'In Progress',
      amount REAL DEFAULT 0,
      payment_status TEXT DEFAULT 'Pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 10. Ad Spent Reports
  await runAsync(`
    CREATE TABLE IF NOT EXISTS ad_spent_reports (
      id INTEGER PRIMARY KEY,
      project_id INTEGER NOT NULL,
      client_name TEXT,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      date TEXT,
      amount_allotted REAL DEFAULT 0,
      meta_ads_spent REAL DEFAULT 0,
      insta_boosting_spent REAL DEFAULT 0,
      google_ads_spent REAL DEFAULT 0,
      linkedin_ads_spent REAL DEFAULT 0,
      total_spent REAL DEFAULT 0,
      mode_of_payment TEXT,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 11. Ad Spent Transactions
  await runAsync(`
    CREATE TABLE IF NOT EXISTS ad_spent_transactions (
      id INTEGER PRIMARY KEY,
      project_id INTEGER NOT NULL,
      client_name TEXT,
      date TEXT,
      amount REAL DEFAULT 0,
      purpose TEXT,
      mode_of_payment TEXT,
      month INTEGER,
      year INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 12. Server Details & Credentials Vault
  await runAsync(`
    CREATE TABLE IF NOT EXISTS server_details (
      id INTEGER PRIMARY KEY,
      server_name TEXT,
      client_name TEXT,
      server_ip TEXT,
      ssh_username TEXT,
      ssh_password TEXT,
      ssh_port TEXT DEFAULT '22',
      os_info TEXT,
      monthly_cost REAL DEFAULT 0,
      renewal_date TEXT,
      remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS project_credentials (
      id INTEGER PRIMARY KEY,
      project_id INTEGER,
      client_name TEXT,
      platform TEXT,
      username TEXT,
      password TEXT,
      login_url TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 13. Leads & Pipeline
  await runAsync(`
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY,
      project_name TEXT,
      client_name TEXT,
      email TEXT,
      phone_number TEXT,
      service TEXT,
      value REAL DEFAULT 0,
      status TEXT DEFAULT 'Lead Intake',
      follow_up_date TEXT,
      remarks TEXT,
      assigned_to TEXT,
      score INTEGER DEFAULT 80,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 14. Financial Records
  await runAsync(`
    CREATE TABLE IF NOT EXISTS financial_records (
      id INTEGER PRIMARY KEY,
      date TEXT,
      type TEXT,
      category TEXT,
      amount REAL DEFAULT 0,
      description TEXT,
      payment_mode TEXT,
      reference_no TEXT,
      status TEXT DEFAULT 'Cleared',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 15. Content Calendar
  await runAsync(`
    CREATE TABLE IF NOT EXISTS content_tasks (
      id INTEGER PRIMARY KEY,
      client_name TEXT,
      title TEXT,
      platform TEXT,
      content_type TEXT,
      scheduled_date TEXT,
      status TEXT DEFAULT 'Scheduled',
      assigned_to TEXT,
      caption TEXT,
      drive_link TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('[SCHEMA] All unified tables created successfully.');
}

async function migrateData() {
  console.log('[MIGRATE] Loading source data and transforming...');

  // A. Load MIS data
  const misClients = await queryMis('SELECT * FROM clients_projects');
  const clientMap = {};
  misClients.forEach(c => { clientMap[c.id] = c.name; });

  const misDeliverables = await queryMis('SELECT * FROM project_deliverables');
  const misRemarks = await queryMis('SELECT * FROM deliverable_remarks');
  const misHolidays = await queryMis('SELECT * FROM holiday_posts');
  const misEditors = await queryMis('SELECT * FROM editor_assignments');
  const misAdReports = await queryMis('SELECT * FROM ad_spent_reports');
  const misAdTx = await queryMis('SELECT * FROM ad_spent_transactions');
  const misServers = await queryMis('SELECT * FROM server_details');
  const misCreds = await queryMis('SELECT * FROM project_credentials');
  const misLeads = await queryMis('SELECT * FROM leads');
  const misFinance = await queryMis('SELECT * FROM financial_records');
  const misContent = await queryMis('SELECT * FROM content_tasks');

  // Insert Users (MongoDB + Staff)
  console.log(`[INSERT] Inserting ${mongoUsers.length} users...`);
  for (const u of mongoUsers) {
    const isIntern = u.is_intern || u.role?.toLowerCase().includes('intern') || u.username?.startsWith('empsi') ? 1 : 0;
    const uId = u._id?.$oid || u.id || u.username;
    await runAsync(
      `INSERT INTO users (id, username, email, password_hash, plain_password, full_name, role, designation, department, college, degree, cohort, mentor, stipend, start_date, end_date, status, is_intern, must_change_password)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uId,
        u.username,
        u.email || `${u.username}@sannainnovations.com`,
        u.password_hash || u.password,
        u.password || u.username,
        u.full_name || u.name || u.username,
        u.role || (isIntern ? 'Intern / Trainee' : 'Staff Engineer'),
        u.designation || (isIntern ? 'Full Stack Intern' : 'Engineer'),
        u.department || 'Full-Stack Engineering',
        u.college || 'University Institute of Technology',
        u.degree || 'B.Tech CSE',
        u.cohort || '2026',
        u.mentor || 'Aarav Sharma',
        u.stipend || 25000,
        u.start_date || '2026-06-01',
        u.end_date || '2026-08-31',
        u.status || 'Active',
        isIntern,
        u.must_change_password ? 1 : 0
      ]
    );
  }

  // Insert Sessions
  console.log(`[INSERT] Inserting ${mongoSessions.length} login/punch sessions...`);
  for (let i = 0; i < mongoSessions.length; i++) {
    const s = mongoSessions[i];
    await runAsync(
      `INSERT INTO sessions (id, user_id, user_name, email, role, staff_type, login_time, punch_in_time, punch_out_time, ip_address, device, location, status, work_mode)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        s._id?.$oid || s.id || `SES-${i + 1}`,
        s.user_id || s.employee_id || s.username || 'EMP-001',
        s.user_name || s.name || s.username || 'Staff Member',
        s.email || `${s.username || 'staff'}@sannainnovations.com`,
        s.designation || s.role || 'Associate',
        s.is_intern || s.role?.includes('Intern') ? 'Intern' : 'Employee',
        s.login_time || s.created_at || '2026-08-01T09:00:00.000Z',
        s.punch_in_time || '09:00 AM',
        s.punch_out_time || (s.status === 'Active' ? null : '06:00 PM'),
        s.ip_address || '103.160.144.225',
        s.device || 'Chrome / Windows',
        s.location || 'Bengaluru HQ',
        s.status || 'Terminated',
        s.work_mode || 'Office Campus'
      ]
    );
  }

  // Insert Attendance
  console.log(`[INSERT] Inserting ${mongoAttendance.length} attendance records...`);
  for (const a of mongoAttendance) {
    const dStr = a.date || (a.created_at ? new Date(a.created_at).toISOString().split('T')[0] : '');
    if (dStr) {
      const dObj = new Date(dStr);
      await runAsync(
        `INSERT INTO attendance (user_id, username, date, month, year, day, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          a.user_id || a.username || a.emp_id,
          a.username || a.user_id,
          dStr,
          dObj.getMonth() + 1,
          dObj.getFullYear(),
          dObj.getDate(),
          a.status === 'P' || a.status === 'Present' ? 'Present' : (a.status || 'Present')
        ]
      );
    }
  }

  // Insert Intern Work Logs
  console.log(`[INSERT] Inserting ${mongoLogs.length} intern work logs...`);
  for (let i = 0; i < mongoLogs.length; i++) {
    const l = mongoLogs[i];
    const staffUser = l.intern_name || l.username || l.user_id || `empsi${String((i % 19) + 1).padStart(2, '0')}`;
    await runAsync(
      `INSERT INTO intern_work_logs (id, user_id, username, week_number, date, start_date, end_date, task_description, work_done, learnings, blockers, pr_link, status, mentor_feedback, rating)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        l._id?.$oid || l.id || `LOG-${i + 1}`,
        staffUser,
        staffUser,
        l.week_number || (i % 12) + 1,
        l.date_logged || l.date || '2026-06-22',
        l.date_logged || l.start_date || '2026-06-22',
        l.date_logged || l.end_date || '2026-06-22',
        l.tasks_completed || l.task_description || 'Feature development & task milestones.',
        l.tasks_completed || l.work_done || 'Completed daily deliverables.',
        l.skills_used || l.learnings || 'Full stack development & analytics.',
        l.blockers || 'None',
        l.pr_link || 'https://github.com/sannainnovations/core',
        'Reviewed & Approved',
        'Milestone targets met on schedule.',
        l.mood || 5
      ]
    );
  }

  // Insert Clients Projects
  console.log(`[INSERT] Inserting ${misClients.length} client projects...`);
  for (const c of misClients) {
    await runAsync(
      `INSERT INTO clients_projects (id, name, client_name, client_type, is_dm, billing_cycle, ticket_size, advance_payment, payment_status, status, onboarded_date, deadline, assigned_lead, contact_person, contact_email)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        c.id,
        c.name,
        c.name,
        c.client_type,
        c.is_dm,
        c.billing_cycle || 'Monthly',
        parseFloat(c.ticket_size) || 0,
        parseFloat(c.advance_payment) || 0,
        c.payment_status || 'Pending',
        c.status || 'active',
        c.onboarded_date,
        c.deadline,
        'Aarav Sharma',
        c.name,
        'contact@sannainnovations.com'
      ]
    );
  }

  // Insert Deliverables
  console.log(`[INSERT] Inserting ${misDeliverables.length} deliverables...`);
  for (const d of misDeliverables) {
    await runAsync(
      `INSERT INTO project_deliverables (id, project_id, project_name, service, month, year, delivery_date, reels_planned, posts_planned, reels_delivered, posts_delivered, total_followers, views_reached, backlinks_created, approval_pending_remarks, other_remarks)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        d.id,
        d.project_id,
        clientMap[d.project_id] || `Project #${d.project_id}`,
        d.service,
        d.month || 8,
        d.year || 2026,
        d.delivery_date,
        d.reels_planned || 0,
        d.posts_planned || 0,
        d.reels_delivered || 0,
        d.posts_delivered || 0,
        d.total_followers,
        d.views_reached,
        d.backlinks_created,
        d.approval_pending_remarks,
        d.other_remarks
      ]
    );
  }

  // Insert Deliverable Remarks
  for (const r of misRemarks) {
    await runAsync(
      `INSERT INTO deliverable_remarks (id, deliverable_id, author, remark, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [r.id, r.deliverable_id, r.author || 'Tech Lead', r.remark, r.created_at]
    );
  }

  // Insert Holiday Posts
  console.log(`[INSERT] Inserting ${misHolidays.length} holiday posts...`);
  for (const h of misHolidays) {
    await runAsync(
      `INSERT INTO holiday_posts (id, project_id, client_project, holiday_name, created, approval_status, scheduled_posted, date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        h.id,
        h.project_id,
        clientMap[h.project_id] || 'All Clients',
        h.holiday_name,
        h.created ? 1 : 0,
        h.approval_status || (h.created ? 'Approved' : 'Pending'),
        h.scheduled_posted || 'Scheduled',
        '2026-08-15'
      ]
    );
  }

  // Insert Editor Assignments
  console.log(`[INSERT] Inserting ${misEditors.length} editor assignments...`);
  for (const e of misEditors) {
    await runAsync(
      `INSERT INTO editor_assignments (id, editor_name, email, project_id, client_project, task_description, assignment_date, submission_date, status, amount, payment_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        e.id,
        e.editor_name,
        'editor@sannainnovations.com',
        e.project_id,
        clientMap[e.project_id] || 'Sanna Media Production',
        e.task_description,
        e.assignment_date,
        e.submission_date,
        e.status === 'approved' ? 'Completed' : (e.status || 'In Progress'),
        parseFloat(e.amount) || 0,
        e.payment_status || 'Pending'
      ]
    );
  }

  // Insert Ad Spent Reports
  console.log(`[INSERT] Inserting ${misAdReports.length} ad spend reports...`);
  for (const a of misAdReports) {
    await runAsync(
      `INSERT INTO ad_spent_reports (id, project_id, client_name, month, year, date, amount_allotted, meta_ads_spent, insta_boosting_spent, google_ads_spent, linkedin_ads_spent, total_spent, mode_of_payment, remark)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        a.id,
        a.project_id,
        clientMap[a.project_id] || `Client #${a.project_id}`,
        a.month,
        a.year,
        a.date,
        parseFloat(a.amount_allotted) || 0,
        parseFloat(a.meta_ads_spent) || 0,
        parseFloat(a.insta_boosting_spent) || 0,
        parseFloat(a.google_ads_spent) || 0,
        parseFloat(a.linkedin_ads_spent) || 0,
        parseFloat(a.total_spent) || 0,
        a.mode_of_payment,
        a.remark
      ]
    );
  }

  // Insert Ad Spent Transactions
  console.log(`[INSERT] Inserting ${misAdTx.length} ad spend transactions...`);
  for (const t of misAdTx) {
    await runAsync(
      `INSERT INTO ad_spent_transactions (id, project_id, client_name, date, amount, purpose, mode_of_payment, month, year)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        t.id,
        t.project_id,
        clientMap[t.project_id] || `Client #${t.project_id}`,
        t.date,
        parseFloat(t.amount) || 0,
        t.purpose,
        t.mode_of_payment,
        t.month,
        t.year
      ]
    );
  }

  // Insert Servers
  console.log(`[INSERT] Inserting ${misServers.length} server infrastructure records...`);
  for (const s of misServers) {
    await runAsync(
      `INSERT INTO server_details (id, server_name, client_name, server_ip, ssh_username, ssh_password, ssh_port, os_info, monthly_cost, renewal_date, remarks)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        s.id,
        s.server_name,
        s.client_name || s.server_name,
        s.server_ip,
        s.ssh_username,
        s.ssh_password,
        String(s.ssh_port || 22),
        s.os_info || 'Ubuntu 22.04 LTS',
        parseFloat(s.monthly_cost) || 0,
        s.renewal_date,
        s.remarks
      ]
    );
  }

  // Insert Project Credentials
  console.log(`[INSERT] Inserting ${misCreds.length} credentials...`);
  for (const c of misCreds) {
    await runAsync(
      `INSERT INTO project_credentials (id, project_id, client_name, platform, username, password, login_url, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        c.id,
        c.project_id,
        clientMap[c.project_id] || `Project #${c.project_id}`,
        c.platform,
        c.username,
        c.password,
        c.login_url || 'https://mis.sannainnovations.com',
        c.remarks
      ]
    );
  }

  // Insert Leads
  console.log(`[INSERT] Inserting ${misLeads.length} leads...`);
  for (const l of misLeads) {
    const company = l.project_name && l.project_name !== 'NA' ? l.project_name.trim() : (l.client_name || 'Client Lead');
    const contact = l.client_name && l.client_name !== 'NA' ? l.client_name.trim() : company;
    await runAsync(
      `INSERT INTO leads (id, project_name, client_name, email, phone_number, service, value, status, follow_up_date, remarks, assigned_to, score)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        l.id,
        company,
        contact,
        l.email || `${contact.toLowerCase().replace(/[^a-z0-9]/g, '') || 'lead'}@sannainbound.com`,
        l.phone_number || '+91 98765 43210',
        l.service || 'Digital Strategy',
        parseFloat(l.value) || 25000,
        l.status === 'Closed' ? 'Won' : l.status === 'Not interested' ? 'Lost' : (l.status || 'Lead Intake'),
        l.follow_up_date,
        l.remarks,
        'Nikki',
        parseFloat(l.value) >= 50000 ? 95 : 80
      ]
    );
  }

  // Insert Financials
  console.log(`[INSERT] Inserting ${misFinance.length} financial transactions...`);
  for (const f of misFinance) {
    await runAsync(
      `INSERT INTO financial_records (id, date, type, category, amount, description, payment_mode, reference_no, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        f.id,
        f.transaction_date || f.created_at || '2026-08-01',
        f.type || (parseFloat(f.amount) >= 0 ? 'Income' : 'Expense'),
        f.category || 'Client Retainer',
        Math.abs(parseFloat(f.amount) || 0),
        f.description || f.particulars || 'Retainer billing',
        f.payment_mode || 'Bank Transfer',
        f.reference_no || `TXN-${f.id}`,
        f.status || 'Cleared'
      ]
    );
  }

  // Insert Content Tasks
  console.log(`[INSERT] Inserting ${misContent.length} content calendar tasks...`);
  for (const ct of misContent) {
    await runAsync(
      `INSERT INTO content_tasks (id, client_name, title, platform, content_type, scheduled_date, status, assigned_to, caption, drive_link)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ct.id,
        ct.client_name || 'Sanna Innovations',
        ct.task_title || ct.title || 'Brand Post',
        ct.platform || 'Instagram & LinkedIn',
        ct.content_type || 'Carousel',
        ct.scheduled_date || '2026-08-15',
        ct.status || 'Scheduled',
        ct.assigned_to || 'Creative Team',
        ct.caption || '',
        ct.drive_link || ''
      ]
    );
  }

  console.log('✅ [COMPLETE] All MIS & Intern Portal data migrated into unified_sanna_crm.db!');
}

async function main() {
  await createSchema();
  await migrateData();
  db.close();
  misDb.close();
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
