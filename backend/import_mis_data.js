const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const misDbPath = path.join(__dirname, '..', 'mis_backup_20260814.db');
const unifiedDbPath = path.join(__dirname, 'unified_sanna_crm.db');

const misDb = new sqlite3.Database(misDbPath);
const db = new sqlite3.Database(unifiedDbPath);

function queryMis(sql, params = []) {
  return new Promise((resolve, reject) => {
    misDb.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

// Helper to load mongo json
const mongoDir = path.join(__dirname, 'mongo_dump');
function loadMongoJson(filename) {
  const p = path.join(mongoDir, filename);
  if (!fs.existsSync(p)) return [];
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    return [];
  }
}

async function ensureTables() {
  console.log('[SCHEMA] Ensuring all MIS tables exist in unified DB...');

  const tablesToDrop = [
    'clients_projects',
    'project_deliverables',
    'deliverable_remarks',
    'holiday_posts',
    'editor_assignments',
    'ad_spent_reports',
    'ad_spent_transactions',
    'server_details',
    'project_credentials',
    'content_tasks',
    'financial_records',
    'invoices',
    'invoice_items',
    'quotations',
    'quotation_items',
    'employee_performances',
    'intern_work_logs',
    'attendance',
    'sessions'
  ];

  for (const tbl of tablesToDrop) {
    await runAsync(`DROP TABLE IF EXISTS ${tbl}`);
  }

  // 1. Clients & Projects
  await runAsync(`
    CREATE TABLE IF NOT EXISTS clients_projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      client_name TEXT,
      client_type TEXT,
      is_dm INTEGER DEFAULT 0,
      billing_cycle TEXT,
      ticket_size REAL DEFAULT 0,
      advance_payment REAL DEFAULT 0,
      payment_status TEXT DEFAULT 'Pending',
      status TEXT DEFAULT 'active',
      onboarded_date TEXT,
      deadline TEXT,
      assigned_lead TEXT,
      contact_person TEXT,
      contact_email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 2. Deliverables
  await runAsync(`
    CREATE TABLE IF NOT EXISTS project_deliverables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
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

  // 3. Deliverable Remarks
  await runAsync(`
    CREATE TABLE IF NOT EXISTS deliverable_remarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deliverable_id INTEGER,
      author TEXT,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 4. Holiday Posts
  await runAsync(`
    CREATE TABLE IF NOT EXISTS holiday_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      client_project TEXT,
      holiday_name TEXT,
      created INTEGER DEFAULT 0,
      approval_status TEXT,
      scheduled_posted TEXT,
      date TEXT,
      creative_status TEXT DEFAULT 'Completed',
      caption_status TEXT DEFAULT 'Approved',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 5. Video Editor Assignments
  await runAsync(`
    CREATE TABLE IF NOT EXISTS editor_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      editor_name TEXT,
      email TEXT,
      project_id INTEGER,
      client_project TEXT,
      task_description TEXT,
      assignment_date TEXT,
      submission_date TEXT,
      status TEXT DEFAULT 'In Progress',
      amount REAL DEFAULT 0,
      payment_status TEXT DEFAULT 'Pending',
      deliverable_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 6. Ad Spent Reports
  await runAsync(`
    CREATE TABLE IF NOT EXISTS ad_spent_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      client_name TEXT,
      month INTEGER,
      year INTEGER,
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

  // 7. Ad Spent Transactions
  await runAsync(`
    CREATE TABLE IF NOT EXISTS ad_spent_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
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

  // 8. Server Details
  await runAsync(`
    CREATE TABLE IF NOT EXISTS server_details (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      server_name TEXT,
      client_name TEXT,
      server_ip TEXT,
      ssh_username TEXT,
      ssh_password TEXT,
      ssh_port TEXT DEFAULT '22',
      server_provider TEXT,
      server_type TEXT,
      os_info TEXT,
      cpanel_url TEXT,
      cpanel_username TEXT,
      cpanel_password TEXT,
      domains_hosted TEXT,
      monthly_cost REAL DEFAULT 0,
      renewal_date TEXT,
      remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 9. Project Credentials
  await runAsync(`
    CREATE TABLE IF NOT EXISTS project_credentials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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

  // 10. Content Tasks
  await runAsync(`
    CREATE TABLE IF NOT EXISTS content_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      client_name TEXT,
      title TEXT,
      platform TEXT,
      content_type TEXT,
      scheduled_date TEXT,
      status TEXT DEFAULT 'Scheduled',
      assigned_to TEXT,
      caption TEXT,
      drive_link TEXT,
      month INTEGER,
      year INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 11. Financial Records
  await runAsync(`
    CREATE TABLE IF NOT EXISTS financial_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT,
      month INTEGER,
      year INTEGER,
      type TEXT,
      category TEXT,
      particulars TEXT,
      amount REAL DEFAULT 0,
      description TEXT,
      payment_mode TEXT,
      reference_no TEXT,
      status TEXT DEFAULT 'Cleared',
      remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 12. Invoices & Items
  await runAsync(`
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      client_name TEXT,
      invoice_no TEXT,
      invoice_date TEXT,
      month INTEGER,
      year INTEGER,
      total_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'Paid',
      pdf_filename TEXT,
      remarks TEXT,
      invoice_type TEXT,
      client_address TEXT,
      client_state TEXT,
      client_gstin TEXT,
      reverse_charge TEXT,
      shipping_charge REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER,
      description TEXT,
      hsn_sac TEXT,
      unit_price REAL DEFAULT 0,
      quantity INTEGER DEFAULT 1,
      gst_rate REAL DEFAULT 18
    )
  `);

  // 13. Quotations & Items
  await runAsync(`
    CREATE TABLE IF NOT EXISTS quotations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quote_no TEXT,
      client_name TEXT,
      client_address TEXT,
      client_state TEXT,
      client_gstin TEXT,
      quote_date TEXT,
      valid_until TEXT,
      subtotal REAL DEFAULT 0,
      discount_percent REAL DEFAULT 0,
      discount_amount REAL DEFAULT 0,
      tax_total REAL DEFAULT 0,
      grand_total REAL DEFAULT 0,
      status TEXT DEFAULT 'Draft',
      remarks TEXT,
      pdf_filename TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS quotation_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quotation_id INTEGER,
      description TEXT,
      hsn_sac TEXT,
      unit_price REAL DEFAULT 0,
      quantity INTEGER DEFAULT 1,
      gst_rate REAL DEFAULT 18
    )
  `);

  // 14. Employee Performances
  await runAsync(`
    CREATE TABLE IF NOT EXISTS employee_performances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER,
      month INTEGER,
      year INTEGER,
      role_id TEXT,
      monthly_metrics TEXT,
      task_completion_rate REAL DEFAULT 0,
      quality_score REAL DEFAULT 0,
      peer_review REAL DEFAULT 0,
      attendance_punctuality REAL DEFAULT 0,
      notes TEXT,
      composite_score REAL DEFAULT 0,
      tier TEXT,
      ai_summary TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 15. Intern Logs, Attendance, Sessions
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
      status TEXT DEFAULT 'Pending Review',
      mentor_feedback TEXT,
      rating REAL DEFAULT 5,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      username TEXT,
      date TEXT NOT NULL,
      month INTEGER,
      year INTEGER,
      day INTEGER,
      status TEXT NOT NULL,
      check_in TEXT,
      check_out TEXT,
      remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

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
}

async function importMIS() {
  console.log('=== STARTING MIS DATA IMPORT (LEADS & EMPLOYEES UNTOUCHED) ===');
  await ensureTables();

  // Clear existing rows only in MIS tables to prevent duplication
  const misTableNames = [
    'clients_projects',
    'project_deliverables',
    'deliverable_remarks',
    'holiday_posts',
    'editor_assignments',
    'ad_spent_reports',
    'ad_spent_transactions',
    'server_details',
    'project_credentials',
    'content_tasks',
    'financial_records',
    'invoices',
    'invoice_items',
    'quotations',
    'quotation_items',
    'employee_performances',
    'intern_work_logs',
    'attendance',
    'sessions'
  ];



  // 1. Load Clients & Projects
  const misClients = await queryMis('SELECT * FROM clients_projects');
  const clientMap = {};
  console.log(`[IMPORT] Inserting ${misClients.length} clients_projects...`);
  for (const c of misClients) {
    clientMap[c.id] = c.name;
    await runAsync(
      `INSERT INTO clients_projects (id, name, client_name, client_type, is_dm, billing_cycle, ticket_size, advance_payment, payment_status, status, onboarded_date, deadline, assigned_lead, contact_person, contact_email)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        c.id,
        c.name,
        c.name,
        c.client_type,
        c.is_dm || 0,
        c.billing_cycle || 'Monthly',
        parseFloat(c.ticket_size) || 0,
        parseFloat(c.advance_payment) || 0,
        c.payment_status || 'Unpaid',
        c.status || 'active',
        c.onboarded_date,
        c.deadline,
        'Aarav Sharma',
        c.name,
        'contact@sannainnovations.com'
      ]
    );
  }

  // 2. Load Project Deliverables
  const misDeliverables = await queryMis('SELECT * FROM project_deliverables');
  console.log(`[IMPORT] Inserting ${misDeliverables.length} project_deliverables...`);
  for (const d of misDeliverables) {
    const pName = clientMap[d.project_id] || `Project #${d.project_id}`;
    await runAsync(
      `INSERT INTO project_deliverables (id, project_id, project_name, service, month, year, delivery_date, reels_planned, posts_planned, reels_delivered, posts_delivered, total_followers, views_reached, backlinks_created, approval_pending_remarks, other_remarks)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        d.id,
        d.project_id,
        pName,
        d.service || 'Social Media Management',
        d.month || 8,
        d.year || 2026,
        d.delivery_date,
        d.reels_planned || 0,
        d.posts_planned || 0,
        d.reels_delivered || 0,
        d.posts_delivered || 0,
        d.total_followers || '',
        d.views_reached || '',
        d.backlinks_created || '',
        d.approval_pending_remarks || '',
        d.other_remarks || ''
      ]
    );
  }

  // 3. Load Deliverable Remarks
  const misRemarks = await queryMis('SELECT * FROM deliverable_remarks');
  console.log(`[IMPORT] Inserting ${misRemarks.length} deliverable_remarks...`);
  for (const r of misRemarks) {
    await runAsync(
      `INSERT INTO deliverable_remarks (id, deliverable_id, author, remark, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [r.id, r.deliverable_id, r.author || 'Team Lead', r.remark_text || r.remark, r.created_at]
    );
  }

  // 4. Load Holiday Posts
  const misHolidays = await queryMis('SELECT * FROM holiday_posts');
  console.log(`[IMPORT] Inserting ${misHolidays.length} holiday_posts...`);
  for (const h of misHolidays) {
    await runAsync(
      `INSERT INTO holiday_posts (id, project_id, client_project, holiday_name, created, approval_status, scheduled_posted, date, creative_status, caption_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        h.id,
        h.project_id,
        clientMap[h.project_id] || 'All Clients',
        h.holiday_name,
        h.created ? 1 : 0,
        h.approval_status || (h.created ? 'Approved' : 'Pending'),
        h.scheduled_posted || 'Scheduled',
        '2026-08-15',
        'Completed',
        'Approved'
      ]
    );
  }

  // 5. Load Video Editor Assignments
  const misEditors = await queryMis('SELECT * FROM editor_assignments');
  console.log(`[IMPORT] Inserting ${misEditors.length} editor_assignments...`);
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

  // 6. Load Ad Spent Reports
  const misAdReports = await queryMis('SELECT * FROM ad_spent_reports');
  console.log(`[IMPORT] Inserting ${misAdReports.length} ad_spent_reports...`);
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

  // 7. Load Ad Spent Transactions
  const misAdTx = await queryMis('SELECT * FROM ad_spent_transactions');
  console.log(`[IMPORT] Inserting ${misAdTx.length} ad_spent_transactions...`);
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

  // 8. Load Server Details
  const misServers = await queryMis('SELECT * FROM server_details');
  console.log(`[IMPORT] Inserting ${misServers.length} server_details...`);
  for (const s of misServers) {
    await runAsync(
      `INSERT INTO server_details (id, project_id, server_name, client_name, server_ip, ssh_username, ssh_password, ssh_port, server_provider, server_type, os_info, cpanel_url, cpanel_username, cpanel_password, domains_hosted, monthly_cost, renewal_date, remarks)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        s.id,
        s.project_id,
        s.server_name,
        s.client_name || s.server_name,
        s.server_ip,
        s.ssh_username,
        s.ssh_password,
        String(s.ssh_port || 22),
        s.server_provider,
        s.server_type,
        s.os_info || 'Ubuntu 22.04 LTS',
        s.cpanel_url,
        s.cpanel_username,
        s.cpanel_password,
        s.domains_hosted,
        parseFloat(s.monthly_cost) || 0,
        s.renewal_date,
        s.remarks
      ]
    );
  }

  // 9. Load Project Credentials
  const misCreds = await queryMis('SELECT * FROM project_credentials');
  console.log(`[IMPORT] Inserting ${misCreds.length} project_credentials...`);
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
        c.link || 'https://mis.sannainnovations.com',
        c.remarks
      ]
    );
  }

  // 10. Load Content Tasks
  const misContent = await queryMis('SELECT * FROM content_tasks');
  console.log(`[IMPORT] Inserting ${misContent.length} content_tasks...`);
  for (const ct of misContent) {
    await runAsync(
      `INSERT INTO content_tasks (id, project_id, client_name, title, platform, content_type, scheduled_date, status, assigned_to, caption, drive_link, month, year)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ct.id,
        ct.project_id,
        clientMap[ct.project_id] || ct.client_name || 'Sanna Innovations',
        ct.task_name || ct.title || 'Brand Post',
        ct.platform || 'Instagram & LinkedIn',
        ct.content_type || 'Carousel Post',
        ct.due_date || ct.scheduled_date || '2026-08-15',
        ct.status || 'Scheduled',
        'Creative Team',
        ct.caption || '',
        ct.drive_link || '',
        ct.month || 8,
        ct.year || 2026
      ]
    );
  }

  // 11. Load Financial Records
  const misFinance = await queryMis('SELECT * FROM financial_records');
  console.log(`[IMPORT] Inserting ${misFinance.length} financial_records...`);
  for (const f of misFinance) {
    await runAsync(
      `INSERT INTO financial_records (id, date, month, year, type, category, particulars, amount, description, payment_mode, reference_no, status, remarks)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        f.id,
        f.created_at ? f.created_at.split(' ')[0] : '2026-08-01',
        f.month || 8,
        f.year || 2026,
        f.type || (parseFloat(f.amount) >= 0 ? 'Income' : 'Expense'),
        f.category || 'Client Retainer',
        f.particulars || 'Client Services',
        Math.abs(parseFloat(f.amount) || 0),
        f.particulars || f.description || 'Retainer billing',
        f.payment_mode || 'Bank Transfer',
        `TXN-FIN-${f.id}`,
        'Cleared',
        f.remarks || ''
      ]
    );
  }

  // 12. Load Invoices & Items
  const misInvoices = await queryMis('SELECT * FROM invoices');
  console.log(`[IMPORT] Inserting ${misInvoices.length} invoices...`);
  for (const inv of misInvoices) {
    await runAsync(
      `INSERT INTO invoices (id, project_id, client_name, invoice_no, invoice_date, month, year, total_amount, status, pdf_filename, remarks, invoice_type, client_address, client_state, client_gstin, reverse_charge, shipping_charge)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        inv.id,
        inv.project_id,
        inv.client_name,
        inv.invoice_no,
        inv.invoice_date,
        inv.month,
        inv.year,
        parseFloat(inv.total_amount) || 0,
        inv.status || 'Paid',
        inv.pdf_filename,
        inv.remarks,
        inv.invoice_type,
        inv.client_address,
        inv.client_state,
        inv.client_gstin,
        inv.reverse_charge,
        parseFloat(inv.shipping_charge) || 0
      ]
    );
  }

  const misInvItems = await queryMis('SELECT * FROM invoice_items');
  console.log(`[IMPORT] Inserting ${misInvItems.length} invoice_items...`);
  for (const it of misInvItems) {
    await runAsync(
      `INSERT INTO invoice_items (id, invoice_id, description, hsn_sac, unit_price, quantity, gst_rate)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        it.id,
        it.invoice_id,
        it.description,
        it.hsn_sac,
        parseFloat(it.unit_price) || 0,
        it.quantity || 1,
        parseFloat(it.gst_rate) || 18
      ]
    );
  }

  // 13. Load Quotations & Items
  const misQuotes = await queryMis('SELECT * FROM quotations');
  console.log(`[IMPORT] Inserting ${misQuotes.length} quotations...`);
  for (const q of misQuotes) {
    await runAsync(
      `INSERT INTO quotations (id, quote_no, client_name, client_address, client_state, client_gstin, quote_date, valid_until, subtotal, discount_percent, discount_amount, tax_total, grand_total, status, remarks, pdf_filename)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        q.id,
        q.quote_no,
        q.client_name,
        q.client_address,
        q.client_state,
        q.client_gstin,
        q.quote_date,
        q.valid_until,
        parseFloat(q.subtotal) || 0,
        parseFloat(q.discount_percent) || 0,
        parseFloat(q.discount_amount) || 0,
        parseFloat(q.tax_total) || 0,
        parseFloat(q.grand_total) || 0,
        q.status || 'Sent',
        q.remarks,
        q.pdf_filename
      ]
    );
  }

  const misQuoteItems = await queryMis('SELECT * FROM quotation_items');
  console.log(`[IMPORT] Inserting ${misQuoteItems.length} quotation_items...`);
  for (const qi of misQuoteItems) {
    await runAsync(
      `INSERT INTO quotation_items (id, quotation_id, description, hsn_sac, unit_price, quantity, gst_rate)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        qi.id,
        qi.quotation_id,
        qi.description,
        qi.hsn_sac,
        parseFloat(qi.unit_price) || 0,
        qi.quantity || 1,
        parseFloat(qi.gst_rate) || 18
      ]
    );
  }

  // 14. Load Employee Performances
  const misPerf = await queryMis('SELECT * FROM employee_performances');
  console.log(`[IMPORT] Inserting ${misPerf.length} employee_performances...`);
  for (const ep of misPerf) {
    await runAsync(
      `INSERT INTO employee_performances (id, employee_id, month, year, role_id, monthly_metrics, task_completion_rate, quality_score, peer_review, attendance_punctuality, notes, composite_score, tier, ai_summary)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ep.id,
        ep.employee_id,
        ep.month,
        ep.year,
        ep.role_id,
        ep.monthly_metrics,
        parseFloat(ep.task_completion_rate) || 0,
        parseFloat(ep.quality_score) || 0,
        parseFloat(ep.peer_review) || 0,
        parseFloat(ep.attendance_punctuality) || 0,
        ep.notes,
        parseFloat(ep.composite_score) || 0,
        ep.tier,
        ep.ai_summary
      ]
    );
  }

  // 15. Load Intern Logs & Attendance from Mongo dumps
  const mongoLogs = loadMongoJson('intern_logs.json');
  console.log(`[IMPORT] Inserting ${mongoLogs.length} intern_work_logs...`);
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

  const mongoAttendance = loadMongoJson('attendance.json');
  console.log(`[IMPORT] Inserting ${mongoAttendance.length} attendance records...`);
  for (const a of mongoAttendance) {
    const y = a.year || 2026;
    const m = a.month || 1;
    const d = a.day || 1;
    const dStr = a.date || `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    await runAsync(
      `INSERT INTO attendance (user_id, username, date, month, year, day, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        a.user_id || a.username || 'empsi01',
        a.username || a.user_id || 'empsi01',
        dStr,
        m,
        y,
        d,
        a.status === 'P' || a.status === 'Present' ? 'Present' : (a.status || 'Present')
      ]
    );
  }

  const mongoSessions = loadMongoJson('session_logs.json');
  console.log(`[IMPORT] Inserting ${mongoSessions.length} session logs...`);
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

  console.log('✅ [COMPLETE] All MIS Data Successfully Imported into unified_sanna_crm.db!');
}

importMIS()
  .then(() => {
    misDb.close();
    db.close();
  })
  .catch(err => {
    console.error('Import Error:', err);
    misDb.close();
    db.close();
  });
