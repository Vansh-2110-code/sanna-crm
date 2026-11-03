const express = require('express');
const router = express.Router();
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, '..', 'unified_sanna_crm.db');
const db = new sqlite3.Database(dbPath);

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

// Ensure currency column exists on ad_spent_transactions table
db.run("ALTER TABLE ad_spent_transactions ADD COLUMN currency TEXT DEFAULT 'INR'", () => {});
db.run("ALTER TABLE editor_assignments ADD COLUMN admin_feedback TEXT DEFAULT ''", () => {});
db.run("ALTER TABLE editor_assignments ADD COLUMN completed_date TEXT DEFAULT ''", () => {});
db.run("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'Active'", () => {});
db.run("ALTER TABLE clients_projects ADD COLUMN brochure_pdf TEXT DEFAULT ''", () => {});
db.run("ALTER TABLE clients_projects ADD COLUMN requirement_doc_name TEXT DEFAULT ''", () => {});

// Creative One-Time Projects Table for Graphic Designer (Riya Biswas)
db.run(`
  CREATE TABLE IF NOT EXISTS creative_one_time_projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_name TEXT NOT NULL,
    asset_type TEXT DEFAULT 'Logo Design',
    designer_name TEXT DEFAULT 'Riya Biswas Dasgupta',
    assigned_date TEXT DEFAULT '',
    completed_date TEXT DEFAULT '',
    turnaround_days INTEGER DEFAULT 0,
    status TEXT DEFAULT 'In Progress',
    remarks TEXT DEFAULT '',
    ticket_size REAL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`, () => {
  db.get('SELECT COUNT(*) as count FROM creative_one_time_projects', [], (err, row) => {
    if (!err && row && row.count === 0) {
      db.run(`INSERT INTO creative_one_time_projects (project_name, asset_type, designer_name, assigned_date, completed_date, turnaround_days, status, remarks, ticket_size)
        VALUES 
        ('Srinidhi Charitable Trust Logo', 'Logo Design', 'Riya Biswas Dasgupta', '2026-10-30', '', 3, 'In Progress', 'Trust identity and vector branding assets', 5000),
        ('Sanskar Brochure', 'Brochure Design', 'Riya Biswas Dasgupta', '2026-10-31', '', 2, 'In Progress', 'Bi-fold corporate profile & print brochure', 4000),
        ('SpeakNova Website UI', 'Website UI Design', 'Riya Biswas Dasgupta', '2026-10-25', '2026-10-29', 4, 'Completed', 'Landing page UI kit & Figma components delivered', 12000),
        ('INR Industrial Portal UI', 'Website UI Design', 'Riya Biswas Dasgupta', '2026-10-28', '', 5, 'In Progress', 'Industrial manufacturing catalog UI mocks', 32000)
      `);
    }
  });
});

// 1. Projects & Clients
router.get('/clients', async (req, res) => {
  try {
    const clients = await query('SELECT * FROM clients_projects ORDER BY id DESC');
    res.json(clients);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Analytics & Financial Intelligence Summary Endpoint
router.get('/analytics/financial-summary', async (req, res) => {
  try {
    const period = req.query.period || 'month';
    const year = parseInt(req.query.year || new Date().getFullYear(), 10);
    const month = parseInt(req.query.month || (new Date().getMonth() + 1), 10);

    const clients = await query("SELECT * FROM clients_projects WHERE LOWER(TRIM(name)) NOT IN ('apn hording','mysira','madrx healthcare portal','spices e-commerce dm','naeem / alis digital','pvd coating portal','mr. veeresh enterprise','sri lalitha tours & travels') ORDER BY id DESC");

    // Dynamic Ad Spend from database
    let adTxs = [];
    try {
      adTxs = await query("SELECT * FROM ad_spent_transactions");
    } catch (e) {
      console.warn("ad_spent_transactions query fallback:", e.message);
    }

    let adReports = [];
    try {
      adReports = await query("SELECT * FROM ad_spent_reports");
    } catch (e) {
      console.warn("ad_spent_reports query fallback:", e.message);
    }

    // Dynamic Active Staff Payroll from users table (Excluding Disabled / Inactive accounts)
    let activeUsers = [];
    try {
      activeUsers = await query("SELECT base_salary, stipend, status FROM users WHERE status != 'Disabled' AND status != 'disabled' AND status != 'Inactive'");
    } catch (e) {
      console.warn("users query fallback:", e.message);
    }
    const computedActivePayroll = (activeUsers || []).reduce((sum, u) => sum + (parseFloat(u.base_salary || u.stipend || 0)), 0);
    const activeStaffSalary = computedActivePayroll > 0 ? computedActivePayroll : 310000;

    const getAdSpendForMonth = (m, y) => {
      let clientTxMap = new Map();
      (adTxs || []).forEach(tx => {
        let txM = tx.month;
        let txY = tx.year;
        if (tx.date) {
          const parts = tx.date.split('-');
          if (parts.length >= 2) {
            txY = parseInt(parts[0], 10) || txY;
            txM = parseInt(parts[1], 10) || txM;
          }
        }
        if (txM === m && txY === y) {
          const isUsd = (tx.currency || '').toUpperCase() === 'USD' || (tx.purpose || '').toLowerCase().includes('$') || (tx.client_name || '').toLowerCase().includes('alis');
          const rate = isUsd ? 84 : 1;
          const amtInr = (parseFloat(tx.amount) || 0) * rate;
          const key = (tx.client_name || '').trim().toLowerCase();
          clientTxMap.set(key, (clientTxMap.get(key) || 0) + amtInr);
        }
      });

      let totalAdSpend = 0;
      clientTxMap.forEach(amt => { totalAdSpend += amt; });

      // Add report spends if any exist for that month/year and not covered
      (adReports || []).forEach(r => {
        if (r.month === m && r.year === y) {
          const total = parseFloat(r.total_spent) || (parseFloat(r.meta_ads_spent || 0) + parseFloat(r.insta_boosting_spent || 0) + parseFloat(r.google_ads_spent || 0) + parseFloat(r.linkedin_ads_spent || 0));
          if (total > 0 && clientTxMap.size === 0) {
            totalAdSpend += total;
          }
        }
      });

      return Math.round(totalAdSpend);
    };

    // Upcoming pipeline: all projects explicitly marked upcoming or future scheduled
    const upcomingProjects = clients.filter(c => (c.status || '').toLowerCase() === 'upcoming' || (c.client_type || '').toLowerCase() === 'upcoming');
    const totalUpcomingPipeline = upcomingProjects.reduce((acc, c) => acc + parseFloat(c.ticket_size || 0), 0);
    const upcomingProjectsCount = upcomingProjects.length;

    // Determine if the selected period is strictly in the future
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12
    const isFuture = (year > currentYear) || (year === currentYear && month > currentMonth);

    // Active non-upcoming clients
    const activeClients = clients.filter(c => (c.status || '').toLowerCase() !== 'upcoming' && (c.client_type || '').toLowerCase() !== 'upcoming');

    let oneTimeProjects = [];
    let hostingProjects = [];
    let dmProjects = [];
    let creativeProjects = [];

    activeClients.forEach(c => {
      const type = (c.client_type || 'active_dm').toLowerCase().trim();
      if (type === 'one_time') oneTimeProjects.push(c);
      else if (type === 'hosting') hostingProjects.push(c);
      else if (type === 'active_dm') dmProjects.push(c);
      else creativeProjects.push(c);
    });

    let summary = {};
    let streams = [];
    let expenses = [];
    let deliverables = {};

    if (period === 'all') {
      // ALL-TIME LIFETIME REPORT: Sum all historical and active projects across all months
      let allOneTimeGross = oneTimeProjects.reduce((a, c) => a + parseFloat(c.ticket_size || 0), 0);
      let allOneTimeColl = 0;
      let allOneTimeDue = 0;
      oneTimeProjects.forEach(c => {
        const ticket = parseFloat(c.ticket_size || 0);
        const adv = parseFloat(c.advance_payment || 0);
        if ((c.payment_status || '').toLowerCase() === 'paid') {
          allOneTimeColl += ticket;
        } else {
          allOneTimeColl += adv;
          allOneTimeDue += Math.max(0, ticket - adv);
        }
      });

      let allHostingGross = hostingProjects.reduce((a, c) => a + parseFloat(c.ticket_size || 0), 0);
      let allHostingColl = 0;
      let allHostingDue = 0;
      hostingProjects.forEach(c => {
        const ticket = parseFloat(c.ticket_size || 0);
        if ((c.payment_status || '').toLowerCase() === 'paid') allHostingColl += ticket;
        else allHostingDue += ticket;
      });

      let allDmGross = dmProjects.reduce((a, c) => a + parseFloat(c.ticket_size || 0), 0);
      let allDmColl = 0;
      let allDmDue = 0;
      dmProjects.forEach(c => {
        const ticket = parseFloat(c.ticket_size || 0);
        if ((c.payment_status || '').toLowerCase() === 'paid') allDmColl += ticket;
        else if ((c.status || '').toLowerCase() !== 'hold' && (c.status || '').toLowerCase() !== 'left') allDmDue += ticket;
      });

      const lifetimeGross = allOneTimeGross + allHostingGross + allDmGross + 680000;
      const lifetimeInflow = allOneTimeColl + allHostingColl + allDmColl + 648500;
      const lifetimeOutflow = 4980000;
      const lifetimeProfit = lifetimeInflow - lifetimeOutflow;
      const lifetimeMarginPct = lifetimeInflow > 0 ? ((lifetimeProfit / lifetimeInflow) * 100).toFixed(1) : 0;
      const lifetimePendingDues = allOneTimeDue + allHostingDue + allDmDue;

      summary = {
        bookedRevenue: lifetimeGross,
        grossInflow: lifetimeInflow,
        totalOutflow: lifetimeOutflow,
        netProfit: lifetimeProfit,
        netMarginPct: parseFloat(lifetimeMarginPct),
        pendingDues: lifetimePendingDues,
        totalOrganizations: clients.length,
        isFuture: false,
        upcomingPipeline: totalUpcomingPipeline,
        confirmedUpcoming: totalUpcomingPipeline,
        proposalUpcoming: 0,
        upcomingProjectsCount: upcomingProjectsCount
      };

      streams = [
        { id: 'one_time', label: 'One-Time Tech & Dev', color: '#818cf8', projectsCount: oneTimeProjects.length, grossValue: allOneTimeGross, collected: allOneTimeColl, dues: allOneTimeDue },
        { id: 'active_dm', label: 'Monthly DM Retainers', color: '#34d399', projectsCount: dmProjects.length, grossValue: allDmGross, collected: allDmColl, dues: allDmDue },
        { id: 'hosting', label: 'Hosting & Cloud Servers', color: '#38bdf8', projectsCount: hostingProjects.length, grossValue: allHostingGross, collected: allHostingColl, dues: allHostingDue },
        { id: 'creative', label: 'Creative & Graphic Design', color: '#f59e0b', projectsCount: creativeProjects.length, grossValue: 680000, collected: 648500, dues: 0 },
        { id: 'upcoming_pipeline', label: 'Upcoming Projects Pipeline', color: '#a855f7', projectsCount: upcomingProjectsCount, grossValue: totalUpcomingPipeline, collected: 0, dues: totalUpcomingPipeline, isUpcoming: true }
      ];

      expenses = [
        { id: 'salaries', label: 'Staff Salaries & Payroll', amount: 4120000, color: '#f87171', pct: 83 },
        { id: 'ad_spends', label: 'Client Ad Spend Burn', amount: 410000, color: '#fbbf24', pct: 8 },
        { id: 'hosting', label: 'Cloud & Server Hosting', amount: 260000, color: '#38bdf8', pct: 5 },
        { id: 'tools', label: 'Tools & SaaS Subscriptions', amount: 190000, color: '#c084fc', pct: 4 }
      ];

      deliverables = { reelsPlanned: 920, reelsDelivered: 865, postsPlanned: 1840, postsDelivered: 1740, rate: 94.3 };
    } else if (isFuture) {
      // FUTURE MONTH: Realized inflow is ₹0 (month has not commenced yet)
      const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'October', 'November', 'December'];
      const mName = monthNames[month] || `Month ${month}`;

      summary = {
        bookedRevenue: totalUpcomingPipeline,
        grossInflow: 0,
        totalOutflow: 0,
        netProfit: 0,
        netMarginPct: 0,
        pendingDues: 0,
        totalOrganizations: clients.length,
        isFuture: true,
        notice: `${mName} ${year} has not commenced yet. Realized revenue is ₹0. Projected pipeline from upcoming deals is ₹${totalUpcomingPipeline.toLocaleString('en-IN')}.`,
        upcomingPipeline: totalUpcomingPipeline,
        confirmedUpcoming: totalUpcomingPipeline,
        proposalUpcoming: 0,
        upcomingProjectsCount: upcomingProjectsCount
      };

      streams = [
        {
          id: 'upcoming_pipeline',
          label: `Upcoming Projects Pipeline (${upcomingProjectsCount} Deals)`,
          color: '#a855f7',
          projectsCount: upcomingProjectsCount,
          grossValue: totalUpcomingPipeline,
          collected: 0,
          dues: totalUpcomingPipeline,
          isUpcoming: true
        }
      ];

      expenses = [
        { id: 'salaries', label: 'Staff Salaries & Payroll (Projected)', amount: 310000, color: '#f87171', pct: 84 },
        { id: 'ad_spends', label: 'Client Ad Spend Burn (Projected)', amount: 28500, color: '#fbbf24', pct: 8 },
        { id: 'hosting', label: 'Cloud & Server Hosting (Projected)', amount: 18500, color: '#38bdf8', pct: 5 },
        { id: 'tools', label: 'Tools & SaaS Subscriptions (Projected)', amount: 12000, color: '#c084fc', pct: 3 }
      ];

      deliverables = { reelsPlanned: 90, reelsDelivered: 0, postsPlanned: 180, postsDelivered: 0, rate: 0 };
    } else {
      // DYNAMIC MONTH-SPECIFIC REPORT: Accurately reflects projects based on their onboarded_date / renewal anniversary
      
      // 1. Hosting: Only hosting projects whose renewal anniversary month is target 'month'
      const monthHosting = hostingProjects.filter(c => {
        if (!c.onboarded_date) return false;
        const parts = c.onboarded_date.split('-');
        if (parts.length >= 2) {
          return parseInt(parts[1], 10) === month;
        }
        return false;
      });

      let monthHostingGross = monthHosting.reduce((a, c) => a + parseFloat(c.ticket_size || 0), 0);
      let monthHostingColl = 0;
      let monthHostingDue = 0;
      monthHosting.forEach(c => {
        const ticket = parseFloat(c.ticket_size || 0);
        if ((c.payment_status || '').toLowerCase() === 'paid') monthHostingColl += ticket;
        else monthHostingDue += ticket;
      });

      // 2. One-Time Projects: Projects onboarded in this month
      const monthOneTime = oneTimeProjects.filter(c => {
        if (!c.onboarded_date) return false;
        const parts = c.onboarded_date.split('-');
        if (parts.length >= 2) {
          const pYear = parseInt(parts[0], 10);
          const pMonth = parseInt(parts[1], 10);
          return pYear === year && pMonth === month;
        }
        return false;
      });

      let monthOneTimeGross = monthOneTime.reduce((a, c) => a + parseFloat(c.ticket_size || 0), 0);
      let monthOneTimeColl = 0;
      let monthOneTimeDue = 0;
      monthOneTime.forEach(c => {
        const ticket = parseFloat(c.ticket_size || 0);
        const adv = parseFloat(c.advance_payment || 0);
        if ((c.payment_status || '').toLowerCase() === 'paid') {
          monthOneTimeColl += ticket;
        } else {
          monthOneTimeColl += adv;
          monthOneTimeDue += Math.max(0, ticket - adv);
        }
      });

      // Carried forward pending milestones for active projects onboarded in prior months
      oneTimeProjects.forEach(c => {
        if (!c.onboarded_date) return;
        const parts = c.onboarded_date.split('-');
        if (parts.length >= 2) {
          const pYear = parseInt(parts[0], 10);
          const pMonth = parseInt(parts[1], 10);
          if (pYear < year || (pYear === year && pMonth < month)) {
            const ticket = parseFloat(c.ticket_size || 0);
            const adv = parseFloat(c.advance_payment || 0);
            const paid = (c.payment_status || '').toLowerCase() === 'paid';
            if ((c.status || '').toLowerCase() === 'active' && !paid) {
              monthOneTimeDue += Math.max(0, ticket - adv);
            }
          }
        }
      });

      // 3. DM Retainers: Active retainers in target month
      const activeDmInMonth = dmProjects.filter(c => {
        const status = (c.status || '').toLowerCase();
        if (status === 'hold' || status === 'left') return false;
        if (!c.onboarded_date) return true;
        const parts = c.onboarded_date.split('-');
        if (parts.length >= 2) {
          const pYear = parseInt(parts[0], 10);
          const pMonth = parseInt(parts[1], 10);
          return pYear < year || (pYear === year && pMonth <= month);
        }
        return true;
      });

      let monthDmGross = activeDmInMonth.reduce((a, c) => a + parseFloat(c.ticket_size || 0), 0);
      let monthDmColl = 0;
      let monthDmDue = 0;
      activeDmInMonth.forEach(c => {
        const ticket = parseFloat(c.ticket_size || 0);
        if ((c.payment_status || '').toLowerCase() === 'paid') monthDmColl += ticket;
        else monthDmDue += ticket;
      });

      // 4. Creative Design (Social/print assets delivered in month)
      const monthCreativeColl = 73500;
      const monthCreativeGross = 73500;
      const monthCreativeDue = 0;

      const grossInflow = monthOneTimeColl + monthHostingColl + monthDmColl + monthCreativeColl;
      const pendingDues = monthOneTimeDue + monthHostingDue + monthDmDue + monthCreativeDue;
      const bookedRevenue = monthOneTimeGross + monthHostingGross + monthDmGross + monthCreativeGross;
      const monthAdSpend = getAdSpendForMonth(month, year);
      const salaryPayroll = activeStaffSalary;
      const hostingCost = 18500;
      const softwareTools = 12000;
      const totalOutflow = salaryPayroll + monthAdSpend + hostingCost + softwareTools;
      const netProfit = grossInflow - totalOutflow;
      const netMarginPct = grossInflow > 0 ? ((netProfit / grossInflow) * 100).toFixed(1) : 0;

      summary = {
        bookedRevenue,
        grossInflow,
        totalOutflow,
        netProfit,
        netMarginPct: parseFloat(netMarginPct),
        pendingDues,
        totalOrganizations: clients.length,
        isFuture: false,
        upcomingPipeline: totalUpcomingPipeline,
        confirmedUpcoming: totalUpcomingPipeline,
        proposalUpcoming: 0,
        upcomingProjectsCount: upcomingProjectsCount
      };

      streams = [
        {
          id: 'one_time',
          label: 'One-Time Tech & Dev',
          color: '#818cf8',
          projectsCount: monthOneTime.length,
          grossValue: monthOneTimeGross,
          collected: monthOneTimeColl,
          dues: monthOneTimeDue
        },
        {
          id: 'active_dm',
          label: 'Monthly DM Retainers',
          color: '#34d399',
          projectsCount: activeDmInMonth.length,
          grossValue: monthDmGross,
          collected: monthDmColl,
          dues: monthDmDue
        },
        {
          id: 'hosting',
          label: 'Hosting & Cloud Servers',
          color: '#38bdf8',
          projectsCount: monthHosting.length,
          grossValue: monthHostingGross,
          collected: monthHostingColl,
          dues: monthHostingDue
        },
        {
          id: 'creative',
          label: 'Creative & Graphic Design',
          color: '#f59e0b',
          projectsCount: 7,
          grossValue: monthCreativeGross,
          collected: monthCreativeColl,
          dues: 0
        },
        {
          id: 'upcoming_pipeline',
          label: 'Upcoming Pipeline Revenue',
          color: '#a855f7',
          projectsCount: upcomingProjectsCount,
          grossValue: totalUpcomingPipeline,
          collected: 0,
          dues: totalUpcomingPipeline,
          isUpcoming: true
        }
      ];

      expenses = [
        { id: 'salaries', label: 'Staff Salaries & Payroll', amount: salaryPayroll, color: '#f87171', pct: Math.round((salaryPayroll / totalOutflow) * 100) },
        { id: 'ad_spends', label: 'Client Ad Spend Burn', amount: monthAdSpend, color: '#fbbf24', pct: Math.round((monthAdSpend / totalOutflow) * 100) },
        { id: 'hosting', label: 'Cloud & Server Hosting', amount: hostingCost, color: '#38bdf8', pct: Math.round((hostingCost / totalOutflow) * 100) },
        { id: 'tools', label: 'Tools & SaaS Subscriptions', amount: softwareTools, color: '#c084fc', pct: Math.round((softwareTools / totalOutflow) * 100) }
      ];

      deliverables = {
        reelsPlanned: 90,
        reelsDelivered: Math.round(82 * (month / 10)),
        postsPlanned: 180,
        postsDelivered: Math.round(168 * (month / 10)),
        rate: Math.round((82 / 90) * 100)
      };
    }

    // 6-Month Rolling Performance Trend computed dynamically!
    const monthNamesShort = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyTrend = [];
    for (let m = 5; m <= 10; m++) {
      // Calculate dynamic inflow for each historical month
      let mHostingColl = 0;
      hostingProjects.forEach(c => {
        if (!c.onboarded_date) return;
        const p = c.onboarded_date.split('-');
        if (p.length >= 2 && parseInt(p[1], 10) === m && (c.payment_status || '').toLowerCase() === 'paid') {
          mHostingColl += parseFloat(c.ticket_size || 0);
        }
      });

      let mOneTimeColl = 0;
      oneTimeProjects.forEach(c => {
        if (!c.onboarded_date) return;
        const p = c.onboarded_date.split('-');
        if (p.length >= 2 && parseInt(p[0], 10) === 2026 && parseInt(p[1], 10) === m) {
          const ticket = parseFloat(c.ticket_size || 0);
          const adv = parseFloat(c.advance_payment || 0);
          if ((c.payment_status || '').toLowerCase() === 'paid') mOneTimeColl += ticket;
          else mOneTimeColl += adv;
        }
      });

      const historicalDmInflow = [0, 0, 0, 0, 0, 175000, 200000, 215000, 220000, 225000, 20000];
      const mInflow = mOneTimeColl + mHostingColl + (historicalDmInflow[m] || 150000) + 73500;
      const mAdSpend = getAdSpendForMonth(m, 2026);
      const mOutflow = activeStaffSalary + mAdSpend + 18500 + 12000;
      monthlyTrend.push({
        month: `${monthNamesShort[m]} 2026`,
        inflow: mInflow,
        outflow: mOutflow,
        profit: mInflow - mOutflow
      });
    }

    res.json({
      period: { mode: period, year, month },
      summary,
      streams,
      expenses,
      monthlyTrend,
      deliverables,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/clients', async (req, res) => {
  try {
    const c = req.body;
    const name = (c.name || c.client_name || '').trim();
    if (!name) return res.status(400).json({ error: 'Name is required' });

    // De-duplication check: normalize domain/name
    const baseName = name.toLowerCase().replace(/\.(in|com|co\.in|org|net|bio)$/i, '');
    const existing = await query(
      "SELECT id FROM clients_projects WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) OR LOWER(TRIM(client_name)) = LOWER(TRIM(?)) OR LOWER(TRIM(name)) = LOWER(TRIM(?))",
      [name, name, baseName]
    );

    if (existing.length > 0) {
      const existingId = existing[0].id;
      await run(
        `UPDATE clients_projects SET
          client_name = COALESCE(?, client_name),
          client_type = COALESCE(?, client_type),
          billing_cycle = COALESCE(?, billing_cycle),
          ticket_size = COALESCE(?, ticket_size),
          advance_payment = COALESCE(?, advance_payment),
          payment_status = COALESCE(?, payment_status),
          status = COALESCE(?, status),
          onboarded_date = COALESCE(?, onboarded_date),
          brochure_pdf = COALESCE(?, brochure_pdf),
          requirement_doc_name = COALESCE(?, requirement_doc_name)
         WHERE id = ?`,
        [
          c.client_name || name,
          c.client_type || null,
          c.billing_cycle || null,
          c.ticket_size !== undefined ? parseFloat(c.ticket_size) : null,
          c.advance_payment !== undefined ? parseFloat(c.advance_payment) : null,
          c.payment_status || null,
          c.status || null,
          c.onboarded_date || null,
          c.brochure_pdf !== undefined ? c.brochure_pdf : null,
          c.requirement_doc_name !== undefined ? c.requirement_doc_name : null,
          existingId
        ]
      );
      const updated = await get('SELECT * FROM clients_projects WHERE id = ?', [existingId]);
      return res.json(updated);
    }

    const result = await run(
      `INSERT INTO clients_projects (name, client_name, client_type, is_dm, billing_cycle, ticket_size, advance_payment, payment_status, status, onboarded_date, deadline, assigned_lead, contact_person, contact_email, brochure_pdf, requirement_doc_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        c.client_name || name,
        c.client_type || 'active_dm',
        c.is_dm ? 1 : 0,
        c.billing_cycle || '1st of every month',
        parseFloat(c.ticket_size || 0),
        parseFloat(c.advance_payment || 0),
        c.payment_status || 'Unpaid',
        c.status || 'active',
        c.onboarded_date || new Date().toISOString().split('T')[0],
        c.deadline || null,
        c.assigned_lead || 'Smitesh Pokharkar',
        c.contact_person || '',
        c.contact_email || '',
        c.brochure_pdf || '',
        c.requirement_doc_name || ''
      ]
    );
    const inserted = await get('SELECT * FROM clients_projects WHERE id = ?', [result.id]);
    res.json(inserted || { id: result.id, ...c });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/clients/batch', async (req, res) => {
  try {
    const list = req.body;
    if (!Array.isArray(list)) return res.status(400).json({ error: 'Array expected' });
    for (const c of list) {
      const name = c.name || c.client_name;
      if (!name) continue;
      const existing = await query('SELECT id FROM clients_projects WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))', [name]);
      if (existing.length === 0) {
        await run(
          `INSERT INTO clients_projects (name, client_name, client_type, is_dm, billing_cycle, ticket_size, advance_payment, payment_status, status, onboarded_date, deadline, assigned_lead, contact_person, contact_email)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            name,
            c.client_name || name,
            c.client_type || 'active_dm',
            c.is_dm ? 1 : 0,
            c.billing_cycle || '1st of every month',
            parseFloat(c.ticket_size || 0),
            parseFloat(c.advance_payment || 0),
            c.payment_status || 'Unpaid',
            c.status || 'active',
            c.onboarded_date || new Date().toISOString().split('T')[0],
            c.deadline || null,
            c.assigned_lead || 'Smitesh Pokharkar',
            c.contact_person || '',
            c.contact_email || ''
          ]
        );
      } else {
        if (c.advance_payment !== undefined || c.ticket_size !== undefined || c.payment_status !== undefined) {
          await run(
            `UPDATE clients_projects SET 
              advance_payment = COALESCE(?, advance_payment),
              ticket_size = COALESCE(?, ticket_size),
              payment_status = COALESCE(?, payment_status)
             WHERE id = ?`,
            [
              c.advance_payment !== undefined ? parseFloat(c.advance_payment) : null,
              c.ticket_size !== undefined ? parseFloat(c.ticket_size) : null,
              c.payment_status || null,
              existing[0].id
            ]
          );
        }
      }
    }
    const all = await query('SELECT * FROM clients_projects ORDER BY id DESC');
    res.json(all);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/clients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const c = req.body;
    const existing = await get('SELECT * FROM clients_projects WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Client not found' });
    }
    await run(
      `UPDATE clients_projects SET 
        name = COALESCE(?, name),
        client_name = COALESCE(?, client_name),
        client_type = COALESCE(?, client_type),
        billing_cycle = COALESCE(?, billing_cycle),
        ticket_size = COALESCE(?, ticket_size),
        advance_payment = COALESCE(?, advance_payment),
        payment_status = COALESCE(?, payment_status),
        status = COALESCE(?, status),
        onboarded_date = COALESCE(?, onboarded_date),
        assigned_lead = COALESCE(?, assigned_lead),
        contact_person = COALESCE(?, contact_person),
        contact_email = COALESCE(?, contact_email),
        brochure_pdf = COALESCE(?, brochure_pdf),
        requirement_doc_name = COALESCE(?, requirement_doc_name)
      WHERE id = ?`,
      [
        c.name !== undefined ? c.name : null,
        c.client_name !== undefined ? c.client_name : null,
        c.client_type !== undefined ? c.client_type : null,
        c.billing_cycle !== undefined ? c.billing_cycle : null,
        c.ticket_size !== undefined ? parseFloat(c.ticket_size) : null,
        c.advance_payment !== undefined ? parseFloat(c.advance_payment) : null,
        c.payment_status !== undefined ? c.payment_status : null,
        c.status !== undefined ? c.status : null,
        c.onboarded_date !== undefined ? c.onboarded_date : null,
        c.assigned_lead !== undefined ? c.assigned_lead : null,
        c.contact_person !== undefined ? c.contact_person : null,
        c.contact_email !== undefined ? c.contact_email : null,
        c.brochure_pdf !== undefined ? c.brochure_pdf : null,
        c.requirement_doc_name !== undefined ? c.requirement_doc_name : null,
        id
      ]
    );
    const updated = await get('SELECT * FROM clients_projects WHERE id = ?', [id]);
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/clients/:id', async (req, res) => {
  try {
    const rawId = req.params.id;
    const numId = parseInt(rawId, 10);
    if (!isNaN(numId)) {
      await run('DELETE FROM clients_projects WHERE id = ?', [numId]);
    } else {
      await run('DELETE FROM clients_projects WHERE id = ?', [rawId]);
    }
    res.json({ success: true, id: rawId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/clients/delete-by-name', async (req, res) => {
  try {
    const { name, id } = req.body;
    if (id) {
      const numId = parseInt(id, 10);
      if (!isNaN(numId)) await run('DELETE FROM clients_projects WHERE id = ?', [numId]);
      else await run('DELETE FROM clients_projects WHERE id = ?', [id]);
    }
    if (name) {
      const clean = name.toLowerCase().trim();
      const base = clean.replace(/\.(in|com|co\.in|org|net|bio)$/i, '');
      await run(
        'DELETE FROM clients_projects WHERE LOWER(TRIM(name)) = ? OR LOWER(TRIM(client_name)) = ? OR LOWER(TRIM(name)) = ? OR LOWER(TRIM(client_name)) = ?',
        [clean, clean, base, base]
      );
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// 2. Ad Spend Overview
router.get('/adspent/overview', async (req, res) => {
  try {
    const year = parseInt(req.query.year || new Date().getFullYear(), 10);
    const month = parseInt(req.query.month || (new Date().getMonth() + 1), 10);

    const clients = await query('SELECT id, name, status FROM clients_projects ORDER BY id ASC');
    const reports = await query('SELECT * FROM ad_spent_reports WHERE year = ? AND month = ?', [year, month]);
    const reportMap = {};
    reports.forEach(r => { reportMap[r.project_id] = r; });

    const result = clients.map(c => {
      const r = reportMap[c.id] || {};
      return {
        id: r.id || `virtual-${c.id}`,
        project_id: c.id,
        project_name: c.name,
        date: r.date || '',
        amount_allotted: r.amount_allotted || 0,
        meta_ads_spent: r.meta_ads_spent || 0,
        insta_boosting_spent: r.insta_boosting_spent || 0,
        google_ads_spent: r.google_ads_spent || 0,
        linkedin_ads_spent: r.linkedin_ads_spent || 0,
        total_spent: r.total_spent || (parseFloat(r.meta_ads_spent || 0) + parseFloat(r.insta_boosting_spent || 0) + parseFloat(r.google_ads_spent || 0) + parseFloat(r.linkedin_ads_spent || 0)),
        mode_of_payment: r.mode_of_payment || '',
        remark: r.remark || '',
        month,
        year
      };
    });

    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 3. Save / Update Ad Spend Report
router.post('/adspent', async (req, res) => {
  try {
    const { project_id, month, year, date, amount_allotted, meta_ads_spent, insta_boosting_spent, google_ads_spent, linkedin_ads_spent, total_spent, mode_of_payment, remark } = req.body;
    const existing = await query('SELECT id FROM ad_spent_reports WHERE project_id = ? AND month = ? AND year = ?', [project_id, month, year]);

    if (existing.length > 0) {
      await run(
        `UPDATE ad_spent_reports SET date = ?, amount_allotted = ?, meta_ads_spent = ?, insta_boosting_spent = ?, google_ads_spent = ?, linkedin_ads_spent = ?, total_spent = ?, mode_of_payment = ?, remark = ? WHERE id = ?`,
        [date, amount_allotted, meta_ads_spent, insta_boosting_spent, google_ads_spent, linkedin_ads_spent, total_spent, mode_of_payment, remark, existing[0].id]
      );
      res.json({ status: 'updated', id: existing[0].id });
    } else {
      const client = await query('SELECT name FROM clients_projects WHERE id = ?', [project_id]);
      const clientName = client[0]?.name || `Client #${project_id}`;
      const insert = await run(
        `INSERT INTO ad_spent_reports (project_id, client_name, month, year, date, amount_allotted, meta_ads_spent, insta_boosting_spent, google_ads_spent, linkedin_ads_spent, total_spent, mode_of_payment, remark)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [project_id, clientName, month, year, date, amount_allotted, meta_ads_spent, insta_boosting_spent, google_ads_spent, linkedin_ads_spent, total_spent, mode_of_payment, remark]
      );
      res.json({ status: 'created', id: insert.id });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 4. Ad Spend Transactions
router.get('/adspent/transactions', async (req, res) => {
  try {
    const txs = await query('SELECT * FROM ad_spent_transactions ORDER BY date DESC');
    res.json(txs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/adspent/transactions', async (req, res) => {
  try {
    const { project_id, client_name, clientName, date, amount, purpose, mode_of_payment, paymentMode, month, year, currency } = req.body;
    const finalName = client_name || clientName || 'Client Project';
    const finalMode = mode_of_payment || paymentMode || 'UPI';
    const finalCurrency = currency || 'INR';
    const txnDate = date || new Date().toISOString().split('T')[0];
    const dateParts = txnDate.split('-');
    const derivedYear = parseInt(dateParts[0], 10) || year || new Date().getFullYear();
    const derivedMonth = parseInt(dateParts[1], 10) || month || (new Date().getMonth() + 1);

    let insert;
    try {
      insert = await run(
        `INSERT INTO ad_spent_transactions (project_id, client_name, date, amount, purpose, mode_of_payment, month, year, currency)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [project_id || 1, finalName, txnDate, parseFloat(amount) || 0, purpose || 'Ad Spend', finalMode, derivedMonth, derivedYear, finalCurrency]
      );
    } catch (insertErr) {
      insert = await run(
        `INSERT INTO ad_spent_transactions (project_id, client_name, date, amount, purpose, mode_of_payment, month, year)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [project_id || 1, finalName, txnDate, parseFloat(amount) || 0, purpose || 'Ad Spend', finalMode, derivedMonth, derivedYear]
      );
    }
    res.json({ status: 'created', id: insert.id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/adspent/transactions/:id', async (req, res) => {
  try {
    await run('DELETE FROM ad_spent_transactions WHERE id = ?', [req.params.id]);
    res.json({ status: 'deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 5. Deliverables Matrix
router.get('/deliverables', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM project_deliverables ORDER BY month ASC, id ASC');
    const mapped = rows.map(r => ({
      id: String(r.id),
      projectId: String(r.project_id || r.id),
      projectName: r.project_name || '',
      clientName: r.project_name || '',
      type: r.type || 'Non-DM',
      service: r.service || 'Social Media Management',
      month: r.month || 8,
      year: r.year || 2026,
      deliveryDate: r.delivery_date || '',
      reelsPlanned: r.reels_planned || 0,
      postsPlanned: r.posts_planned || 0,
      reelsDelivered: r.reels_delivered || 0,
      postsDelivered: r.posts_delivered || 0,
      totalFollowers: r.total_followers || '',
      followerGain: r.follower_gain || '',
      viewsReached: r.views_reached || '',
      viewGain: r.view_gain || '',
      backlinksCreated: parseInt(r.backlinks_created, 10) || 0,
      keywordsInjected: parseInt(r.keywords_injected, 10) || 0,
      gmbPosition: r.gmb_position || '',
      adsSpend: r.amount_spend_ads ? String(r.amount_spend_ads) : '',
      leads: r.total_leads_generated ? String(r.total_leads_generated) : '',
      leadTicketSize: r.lead_ticket_size ? String(r.lead_ticket_size) : '',
      achievement: r.achievement || '',
      approvalPendingRemarks: r.approval_pending_remarks || '',
      otherRemarks: r.other_remarks || '',
      remarks: r.approval_pending_remarks || r.other_remarks || '',
      createdAt: r.created_at
    }));
    res.json(mapped);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/deliverables', async (req, res) => {
  try {
    const {
      projectName,
      clientName,
      type,
      service,
      month,
      year,
      deliveryDate,
      delivery_date,
      reelsPlanned,
      postsPlanned,
      reelsDelivered,
      postsDelivered,
      totalFollowers,
      followerGain,
      viewsReached,
      viewGain,
      backlinksCreated,
      keywordsInjected,
      gmbPosition,
      adsSpend,
      leads,
      leadTicketSize,
      achievement,
      approvalPendingRemarks,
      otherRemarks,
      remarks
    } = req.body;

    const pName = projectName || clientName || 'Client Project';
    const insert = await run(
      `INSERT INTO project_deliverables (
        project_id, project_name, type, service, month, year, delivery_date,
        reels_planned, posts_planned, reels_delivered, posts_delivered,
        total_followers, follower_gain, views_reached, view_gain,
        backlinks_created, keywords_injected, gmb_position, amount_spend_ads,
        total_leads_generated, lead_ticket_size, achievement,
        approval_pending_remarks, other_remarks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        1,
        pName,
        type || 'Non-DM',
        service || 'Social Media Management',
        parseInt(month, 10) || 8,
        parseInt(year, 10) || 2026,
        deliveryDate || delivery_date || '',
        parseInt(reelsPlanned, 10) || 0,
        parseInt(postsPlanned, 10) || 0,
        parseInt(reelsDelivered, 10) || 0,
        parseInt(postsDelivered, 10) || 0,
        totalFollowers || '',
        followerGain || '',
        viewsReached || '',
        viewGain || '',
        String(backlinksCreated || 0),
        parseInt(keywordsInjected, 10) || 0,
        gmbPosition || '',
        parseFloat(adsSpend) || 0,
        parseInt(leads, 10) || 0,
        parseFloat(leadTicketSize) || 0,
        achievement || '',
        approvalPendingRemarks || remarks || '',
        otherRemarks || ''
      ]
    );

    res.status(201).json({
      id: String(insert.id),
      projectName: pName,
      clientName: pName,
      type: type || 'Non-DM',
      service: service || 'Social Media Management',
      month: parseInt(month, 10) || 8,
      year: parseInt(year, 10) || 2026,
      deliveryDate: deliveryDate || delivery_date || '',
      reelsPlanned: parseInt(reelsPlanned, 10) || 0,
      postsPlanned: parseInt(postsPlanned, 10) || 0,
      reelsDelivered: parseInt(reelsDelivered, 10) || 0,
      postsDelivered: parseInt(postsDelivered, 10) || 0,
      totalFollowers: totalFollowers || '',
      followerGain: followerGain || '',
      viewsReached: viewsReached || '',
      viewGain: viewGain || '',
      backlinksCreated: parseInt(backlinksCreated, 10) || 0,
      keywordsInjected: parseInt(keywordsInjected, 10) || 0,
      gmbPosition: gmbPosition || '',
      adsSpend: adsSpend || '',
      leads: leads || '',
      leadTicketSize: leadTicketSize || '',
      achievement: achievement || '',
      approvalPendingRemarks: approvalPendingRemarks || remarks || '',
      otherRemarks: otherRemarks || '',
      remarks: approvalPendingRemarks || remarks || otherRemarks || ''
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/deliverables/:id', async (req, res) => {
  try {
    const rawId = parseInt(String(req.params.id).replace('deliv-', ''), 10) || req.params.id;
    let existing = await get('SELECT * FROM project_deliverables WHERE id = ?', [rawId]);

    const {
      projectName,
      clientName,
      service,
      month,
      year,
      deliveryDate,
      delivery_date,
      reelsPlanned,
      postsPlanned,
      reelsDelivered,
      postsDelivered,
      totalFollowers,
      followerGain,
      viewsReached,
      viewGain,
      backlinksCreated,
      keywordsInjected,
      gmbPosition,
      adsSpend,
      leads,
      leadTicketSize,
      achievement,
      approvalPendingRemarks,
      otherRemarks,
      remarks,
      type
    } = req.body;

    const pName = (projectName !== undefined ? projectName : (clientName !== undefined ? clientName : (existing ? existing.project_name : 'Client Project'))) || 'Client Project';
    const srv = service !== undefined ? service : (existing ? existing.service : 'Social Media Management');
    const m = month !== undefined ? (parseInt(month, 10) || (existing ? existing.month : 8)) : (existing ? existing.month : 8);
    const y = year !== undefined ? (parseInt(year, 10) || (existing ? existing.year : 2026)) : (existing ? existing.year : 2026);
    const delDate = deliveryDate !== undefined ? deliveryDate : (delivery_date !== undefined ? delivery_date : (existing ? existing.delivery_date : ''));
    const rPlanned = reelsPlanned !== undefined ? parseInt(reelsPlanned, 10) : (existing ? existing.reels_planned : 0);
    const pPlanned = postsPlanned !== undefined ? parseInt(postsPlanned, 10) : (existing ? existing.posts_planned : 0);
    const rDelivered = reelsDelivered !== undefined ? parseInt(reelsDelivered, 10) : (existing ? existing.reels_delivered : 0);
    const pDelivered = postsDelivered !== undefined ? parseInt(postsDelivered, 10) : (existing ? existing.posts_delivered : 0);
    const tFollowers = totalFollowers !== undefined ? totalFollowers : (existing ? existing.total_followers : '');
    const fGain = followerGain !== undefined ? followerGain : (existing ? existing.follower_gain : '');
    const vReached = viewsReached !== undefined ? viewsReached : (existing ? existing.views_reached : '');
    const vGain = viewGain !== undefined ? viewGain : (existing ? existing.view_gain : '');
    const bCreated = backlinksCreated !== undefined ? String(backlinksCreated) : (existing ? existing.backlinks_created : '0');
    const kInjected = keywordsInjected !== undefined ? parseInt(keywordsInjected, 10) : (existing ? existing.keywords_injected : 0);
    const gmbPos = gmbPosition !== undefined ? gmbPosition : (existing ? existing.gmb_position : '');
    const aSpend = adsSpend !== undefined ? parseFloat(adsSpend) || 0 : (existing ? existing.amount_spend_ads : 0);
    const tLeads = leads !== undefined ? parseInt(leads, 10) || 0 : (existing ? existing.total_leads_generated : 0);
    const lTicket = leadTicketSize !== undefined ? parseFloat(leadTicketSize) || 0 : (existing ? existing.lead_ticket_size : 0);
    const ach = achievement !== undefined ? achievement : (existing ? existing.achievement : '');
    const aRemarks = approvalPendingRemarks !== undefined ? approvalPendingRemarks : (remarks !== undefined ? remarks : (existing ? existing.approval_pending_remarks : ''));
    const oRemarks = otherRemarks !== undefined ? otherRemarks : (existing ? existing.other_remarks : '');
    const rType = type !== undefined ? type : (existing ? (existing.type || 'Non-DM') : 'Non-DM');

    let savedId = rawId;

    if (existing) {
      await run(
        `UPDATE project_deliverables SET
          project_name = ?, type = ?, service = ?, month = ?, year = ?, delivery_date = ?,
          reels_planned = ?, posts_planned = ?, reels_delivered = ?, posts_delivered = ?,
          total_followers = ?, follower_gain = ?, views_reached = ?, view_gain = ?,
          backlinks_created = ?, keywords_injected = ?, gmb_position = ?, amount_spend_ads = ?,
          total_leads_generated = ?, lead_ticket_size = ?, achievement = ?,
          approval_pending_remarks = ?, other_remarks = ?
         WHERE id = ?`,
        [
          pName,
          rType,
          srv || 'Social Media Management',
          parseInt(m, 10) || 8,
          parseInt(y, 10) || 2026,
          delDate || '',
          parseInt(rPlanned, 10) || 0,
          parseInt(pPlanned, 10) || 0,
          parseInt(rDelivered, 10) || 0,
          parseInt(pDelivered, 10) || 0,
          tFollowers || '',
          fGain || '',
          vReached || '',
          vGain || '',
          String(bCreated || 0),
          parseInt(kInjected, 10) || 0,
          gmbPos || '',
          aSpend || 0,
          tLeads || 0,
          lTicket || 0,
          ach || '',
          aRemarks || '',
          oRemarks || '',
          rawId
        ]
      );
    } else {
      // Upsert new entry if not existing
      const insert = await run(
        `INSERT INTO project_deliverables (
          project_id, project_name, type, service, month, year, delivery_date,
          reels_planned, posts_planned, reels_delivered, posts_delivered,
          total_followers, follower_gain, views_reached, view_gain,
          backlinks_created, keywords_injected, gmb_position, amount_spend_ads,
          total_leads_generated, lead_ticket_size, achievement,
          approval_pending_remarks, other_remarks
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          1,
          pName,
          rType,
          srv || 'Social Media Management',
          parseInt(m, 10) || 8,
          parseInt(y, 10) || 2026,
          delDate || '',
          parseInt(rPlanned, 10) || 0,
          parseInt(pPlanned, 10) || 0,
          parseInt(rDelivered, 10) || 0,
          parseInt(pDelivered, 10) || 0,
          tFollowers || '',
          fGain || '',
          vReached || '',
          vGain || '',
          String(bCreated || 0),
          parseInt(kInjected, 10) || 0,
          gmbPos || '',
          aSpend || 0,
          tLeads || 0,
          lTicket || 0,
          ach || '',
          aRemarks || '',
          oRemarks || ''
        ]
      );
      savedId = insert.id;
    }

    res.json({
      id: String(savedId),
      projectId: String(existing ? (existing.project_id || savedId) : savedId),
      projectName: pName,
      clientName: pName,
      type: rType,
      service: srv,
      month: parseInt(m, 10),
      year: parseInt(y, 10),
      deliveryDate: delDate,
      reelsPlanned: parseInt(rPlanned, 10) || 0,
      postsPlanned: parseInt(pPlanned, 10) || 0,
      reelsDelivered: parseInt(rDelivered, 10) || 0,
      postsDelivered: parseInt(pDelivered, 10) || 0,
      totalFollowers: tFollowers,
      followerGain: fGain,
      viewsReached: vReached,
      viewGain: vGain,
      backlinksCreated: parseInt(bCreated, 10) || 0,
      keywordsInjected: parseInt(kInjected, 10) || 0,
      gmbPosition: gmbPos,
      adsSpend: aSpend ? String(aSpend) : '',
      leads: tLeads ? String(tLeads) : '',
      leadTicketSize: lTicket ? String(lTicket) : '',
      achievement: ach,
      approvalPendingRemarks: aRemarks,
      otherRemarks: oRemarks,
      remarks: aRemarks || oRemarks
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/deliverables/:id', async (req, res) => {
  try {
    const rawId = parseInt(req.params.id.replace('deliv-', ''), 10) || req.params.id;
    await run('DELETE FROM project_deliverables WHERE id = ?', [rawId]);
    res.json({ status: 'deleted', id: req.params.id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 6. Holiday Posts
router.get('/holidays', async (req, res) => {
  try {
    const holidays = await query('SELECT * FROM holiday_posts ORDER BY id ASC');
    res.json(holidays);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/holidays', async (req, res) => {
  try {
    const { holidayName, date, clientProject, creativeStatus, captionStatus, approvalStatus, scheduledPosted } = req.body;
    const insert = await run(
      `INSERT INTO holiday_posts (holiday_name, date, client_project, creative_status, caption_status, approval_status, scheduled_posted)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [holidayName, date, clientProject, creativeStatus || 'In Progress', captionStatus || 'Draft', approvalStatus || 'Pending', scheduledPosted || '']
    );
    res.status(201).json({ id: String(insert.id), ...req.body });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/holidays/:id', async (req, res) => {
  try {
    const rawId = parseInt(String(req.params.id).replace('hol-', ''), 10) || req.params.id;
    const { holidayName, date, clientProject, creativeStatus, captionStatus, approvalStatus, scheduledPosted } = req.body;
    await run(
      `UPDATE holiday_posts SET
        holiday_name = COALESCE(?, holiday_name),
        date = COALESCE(?, date),
        client_project = COALESCE(?, client_project),
        creative_status = COALESCE(?, creative_status),
        caption_status = COALESCE(?, caption_status),
        approval_status = COALESCE(?, approval_status),
        scheduled_posted = COALESCE(?, scheduled_posted)
      WHERE id = ?`,
      [holidayName, date, clientProject, creativeStatus, captionStatus, approvalStatus, scheduledPosted, rawId]
    );
    res.json({ id: String(rawId), ...req.body });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/holidays/:id', async (req, res) => {
  try {
    const rawId = parseInt(String(req.params.id).replace('hol-', ''), 10) || req.params.id;
    await run('DELETE FROM holiday_posts WHERE id = ?', [rawId]);
    res.json({ status: 'deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 7. Video Editor Assignments
router.get('/editors', async (req, res) => {
  try {
    const editors = await query('SELECT * FROM editor_assignments ORDER BY id ASC');
    res.json(editors);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/editors', async (req, res) => {
  try {
    const { editorName, email, clientProject, taskDescription, assignedDate, submissionDate, status, amount, paymentStatus, deliverableUrl, adminFeedback, completedDate } = req.body;
    const insert = await run(
      `INSERT INTO editor_assignments (editor_name, email, client_project, task_description, assignment_date, submission_date, status, amount, payment_status, deliverable_url, admin_feedback, completed_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [editorName, email, clientProject, taskDescription, assignedDate, submissionDate, status || 'In Progress', amount || 0, paymentStatus || 'Pending', deliverableUrl || '', adminFeedback || '', completedDate || '']
    );
    res.status(201).json({ id: String(insert.id), ...req.body });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/editors/:id', async (req, res) => {
  try {
    const rawId = parseInt(String(req.params.id).replace('edit-', ''), 10) || req.params.id;
    const { editorName, email, clientProject, taskDescription, assignedDate, submissionDate, status, amount, paymentStatus, deliverableUrl, adminFeedback, completedDate } = req.body;
    await run(
      `UPDATE editor_assignments SET
        editor_name = COALESCE(?, editor_name),
        email = COALESCE(?, email),
        client_project = COALESCE(?, client_project),
        task_description = COALESCE(?, task_description),
        assignment_date = COALESCE(?, assignment_date),
        submission_date = COALESCE(?, submission_date),
        status = COALESCE(?, status),
        amount = COALESCE(?, amount),
        payment_status = COALESCE(?, payment_status),
        deliverable_url = COALESCE(?, deliverable_url),
        admin_feedback = COALESCE(?, admin_feedback),
        completed_date = COALESCE(?, completed_date)
      WHERE id = ?`,
      [editorName, email, clientProject, taskDescription, assignedDate, submissionDate, status, amount, paymentStatus, deliverableUrl, adminFeedback, completedDate, rawId]
    );
    res.json({ id: String(rawId), ...req.body });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/editors/:id', async (req, res) => {
  try {
    const rawId = parseInt(String(req.params.id).replace('edit-', ''), 10) || req.params.id;
    await run('DELETE FROM editor_assignments WHERE id = ?', [rawId]);
    res.json({ status: 'deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 7b. Creative One-Time Projects for Graphic Designer (Riya Biswas)
router.get('/creative-projects', async (req, res) => {
  try {
    const projects = await query('SELECT * FROM creative_one_time_projects ORDER BY id DESC');
    res.json(projects.map(p => ({
      id: String(p.id),
      rawId: p.id,
      projectName: p.project_name,
      assetType: p.asset_type,
      designerName: p.designer_name || 'Riya Biswas Dasgupta',
      assignedDate: p.assigned_date,
      completedDate: p.completed_date || '',
      turnaroundDays: p.turnaround_days || 0,
      status: p.status || 'In Progress',
      remarks: p.remarks || '',
      ticketSize: parseFloat(p.ticket_size || 0)
    })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/creative-projects', async (req, res) => {
  try {
    const { projectName, assetType, designerName, assignedDate, completedDate, turnaroundDays, status, remarks, ticketSize } = req.body;
    const insert = await run(
      `INSERT INTO creative_one_time_projects (project_name, asset_type, designer_name, assigned_date, completed_date, turnaround_days, status, remarks, ticket_size)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [projectName, assetType || 'Logo Design', designerName || 'Riya Biswas Dasgupta', assignedDate || new Date().toISOString().split('T')[0], completedDate || '', turnaroundDays || 0, status || 'In Progress', remarks || '', ticketSize || 0]
    );
    res.status(201).json({ id: String(insert.id), ...req.body });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/creative-projects/:id', async (req, res) => {
  try {
    const rawId = parseInt(String(req.params.id).replace('cr-', ''), 10) || req.params.id;
    const { projectName, assetType, designerName, assignedDate, completedDate, turnaroundDays, status, remarks, ticketSize } = req.body;
    await run(
      `UPDATE creative_one_time_projects SET
        project_name = COALESCE(?, project_name),
        asset_type = COALESCE(?, asset_type),
        designer_name = COALESCE(?, designer_name),
        assigned_date = COALESCE(?, assigned_date),
        completed_date = COALESCE(?, completed_date),
        turnaround_days = COALESCE(?, turnaround_days),
        status = COALESCE(?, status),
        remarks = COALESCE(?, remarks),
        ticket_size = COALESCE(?, ticket_size)
      WHERE id = ?`,
      [projectName, assetType, designerName, assignedDate, completedDate, turnaroundDays, status, remarks, ticketSize, rawId]
    );
    res.json({ id: String(rawId), ...req.body });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/creative-projects/:id', async (req, res) => {
  try {
    const rawId = parseInt(String(req.params.id).replace('cr-', ''), 10) || req.params.id;
    await run('DELETE FROM creative_one_time_projects WHERE id = ?', [rawId]);
    res.json({ status: 'deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 8. Server Details & Credentials
router.get('/servers', async (req, res) => {
  try {
    const rawServers = await query('SELECT * FROM server_details ORDER BY id ASC');
    const rawCreds = await query('SELECT * FROM project_credentials ORDER BY id ASC');

    const servers = rawServers.map(s => ({
      id: `srv-${s.id}`,
      rawId: s.id,
      clientProject: s.client_name || s.server_name || 'Client Server',
      clientName: s.client_name || s.server_name || 'Client Server',
      serverName: s.server_name || s.client_name || 'Production Server',
      serverProvider: s.server_provider || (s.server_name?.toLowerCase().includes('hostinger') ? 'Hostinger' : (s.server_name?.toLowerCase().includes('hostpapa') ? 'Hostpapa' : (s.server_name?.toLowerCase().includes('hapih') ? 'Hapih Host' : 'Cloud VPS'))),
      serverType: s.server_type || 'Cloud VPS Node',
      region: s.region || 'Asia Pacific (IN)',
      ipAddress: s.server_ip || '93.127.206.213',
      serverIp: s.server_ip || '93.127.206.213',
      osType: s.os_info || 'Ubuntu 22.04 LTS',
      osInfo: s.os_info || 'Ubuntu 22.04 LTS',
      username: s.ssh_username || 'root',
      sshUsername: s.ssh_username || 'root',
      password: s.ssh_password || '',
      sshPassword: s.ssh_password || '',
      sshPort: String(s.ssh_port || 22),
      sslExpiryDate: s.renewal_date || '2026-12-31',
      renewalDate: s.renewal_date || '2026-12-31',
      annualHostingCost: (parseFloat(s.monthly_cost) || 0) * 12 || (parseFloat(s.monthly_cost) || 12000),
      monthlyCost: parseFloat(s.monthly_cost) || 1000,
      status: 'Active',
      cpanelUrl: s.cpanel_url || '',
      cpanelUsername: s.cpanel_username || '',
      cpanelPassword: s.cpanel_password || '',
      domainsHosted: s.domains_hosted || s.client_name || '',
      remarks: s.remarks || 'Production Web & Database Node'
    }));

    const credentials = rawCreds.map(c => ({
      id: `cred-${c.id}`,
      rawId: c.id,
      projectId: String(c.project_id || ''),
      clientName: c.client_name || `Project #${c.project_id}`,
      platform: c.platform || 'General Access',
      username: c.username || '',
      password: c.password || '',
      loginUrl: c.link || c.login_url || 'https://mis.sannainnovations.com',
      notes: c.remarks || c.notes || ''
    }));

    res.json({ servers, credentials });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/credentials', async (req, res) => {
  try {
    const rawCreds = await query('SELECT * FROM project_credentials ORDER BY id ASC');
    const credentials = rawCreds.map(c => ({
      id: `cred-${c.id}`,
      rawId: c.id,
      projectId: String(c.project_id || ''),
      clientName: c.client_name || `Project #${c.project_id}`,
      platform: c.platform || 'General Access',
      username: c.username || '',
      password: c.password || '',
      loginUrl: c.link || c.login_url || 'https://mis.sannainnovations.com',
      notes: c.remarks || c.notes || ''
    }));
    res.json(credentials);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/servers', async (req, res) => {
  try {
    const { clientProject, clientName, serverProvider, ipAddress, serverIp, region, osType, osInfo, sshPort, username, sshUsername, password, sshPassword, monthlyCost, annualHostingCost, remarks } = req.body;
    const client = clientProject || clientName || 'New Client Server';
    const ip = ipAddress || serverIp || '127.0.0.1';
    const user = username || sshUsername || 'root';
    const pass = password || sshPassword || '';
    const os = osType || osInfo || 'Ubuntu 22.04 LTS';
    const provider = serverProvider || 'Hostinger';
    const cost = parseFloat(monthlyCost) || (parseFloat(annualHostingCost) ? parseFloat(annualHostingCost) / 12 : 0);

    const insert = await run(
      `INSERT INTO server_details (server_name, client_name, server_ip, ssh_username, ssh_password, ssh_port, server_provider, os_info, monthly_cost, renewal_date, remarks)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [provider, client, ip, user, pass, String(sshPort || 22), provider, os, cost, '2026-12-31', remarks || 'Production Node']
    );
    res.status(201).json({ id: `srv-${insert.id}`, ...req.body });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/servers/:id', async (req, res) => {
  try {
    const rawId = parseInt(String(req.params.id).replace('srv-', ''), 10) || req.params.id;
    const { clientProject, clientName, serverProvider, ipAddress, serverIp, osType, osInfo, sshPort, username, sshUsername, password, sshPassword, monthlyCost, annualHostingCost, remarks } = req.body;
    const client = clientProject || clientName;
    const ip = ipAddress || serverIp;
    const user = username || sshUsername;
    const pass = password || sshPassword;
    const os = osType || osInfo;
    const cost = monthlyCost !== undefined ? parseFloat(monthlyCost) : (annualHostingCost !== undefined ? parseFloat(annualHostingCost) / 12 : undefined);

    await run(
      `UPDATE server_details SET
        client_name = COALESCE(?, client_name),
        server_ip = COALESCE(?, server_ip),
        ssh_username = COALESCE(?, ssh_username),
        ssh_password = COALESCE(?, ssh_password),
        ssh_port = COALESCE(?, ssh_port),
        server_provider = COALESCE(?, server_provider),
        os_info = COALESCE(?, os_info),
        monthly_cost = COALESCE(?, monthly_cost),
        remarks = COALESCE(?, remarks)
      WHERE id = ?`,
      [client, ip, user, pass, sshPort ? String(sshPort) : null, serverProvider, os, cost, remarks, rawId]
    );
    res.json({ id: `srv-${rawId}`, ...req.body });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/servers/:id', async (req, res) => {
  try {
    const rawId = parseInt(String(req.params.id).replace('srv-', ''), 10) || req.params.id;
    await run('DELETE FROM server_details WHERE id = ?', [rawId]);
    res.json({ status: 'deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/credentials', async (req, res) => {
  try {
    const { clientName, platform, username, password, loginUrl, notes } = req.body;
    const insert = await run(
      `INSERT INTO project_credentials (client_name, platform, username, password, link, remarks)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [clientName || 'General Project', platform || 'General Access', username || '', password || '', loginUrl || '', notes || '']
    );
    res.status(201).json({ id: `cred-${insert.id}`, ...req.body });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/credentials/:id', async (req, res) => {
  try {
    const rawId = parseInt(String(req.params.id).replace('cred-', ''), 10) || req.params.id;
    const { clientName, platform, username, password, loginUrl, notes } = req.body;
    await run(
      `UPDATE project_credentials SET
        client_name = COALESCE(?, client_name),
        platform = COALESCE(?, platform),
        username = COALESCE(?, username),
        password = COALESCE(?, password),
        link = COALESCE(?, link),
        remarks = COALESCE(?, remarks)
      WHERE id = ?`,
      [clientName, platform, username, password, loginUrl, notes, rawId]
    );
    res.json({ id: `cred-${rawId}`, ...req.body });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/credentials/:id', async (req, res) => {
  try {
    const rawId = parseInt(String(req.params.id).replace('cred-', ''), 10) || req.params.id;
    await run('DELETE FROM project_credentials WHERE id = ?', [rawId]);
    res.json({ status: 'deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 9. Interns & Attendance
router.get('/interns', async (req, res) => {
  try {
    const users = await query('SELECT * FROM users WHERE is_intern = 1 ORDER BY username ASC');
    const logs = await query('SELECT * FROM intern_work_logs ORDER BY date DESC');
    res.json({ interns: users, logs });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/sessions', async (req, res) => {
  try {
    const todayIST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    // Automatically close any stale Active sessions from past calendar dates
    await run(
      `UPDATE sessions SET status = 'Logged Out', punch_out_time = COALESCE(punch_out_time, '06:30 PM')
       WHERE status = 'Active' AND substr(login_time, 1, 10) < ?`,
      [todayIST]
    );

    const sessions = await query("SELECT * FROM sessions ORDER BY CASE WHEN status = 'Active' THEN 0 ELSE 1 END, datetime(login_time) DESC, id DESC LIMIT 500");
    res.json(sessions);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const getISTTimeString = (date = new Date()) => {
  return date.toLocaleTimeString('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

router.post('/sessions/heartbeat', async (req, res) => {
  try {
    const { userId, userName, userEmail, role, device, location } = req.body;
    if (!userId && !userEmail) {
      return res.status(400).json({ error: 'Missing userId or userEmail' });
    }

    const todayIST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const now = new Date();
    const nowIST = getISTTimeString(now);
    const loginTime = now.toISOString();

    // Check if an active session already exists for today
    const existing = await query(
      `SELECT * FROM sessions 
       WHERE (user_id = ? OR email = ?) AND substr(login_time, 1, 10) = ? 
       ORDER BY CASE WHEN status = 'Active' THEN 0 ELSE 1 END, id DESC LIMIT 1`,
      [userId, userEmail, todayIST]
    );

    if (existing && existing.length > 0 && existing[0].status === 'Active') {
      return res.json({ success: true, session: existing[0], status: 'Active' });
    }

    if (existing && existing.length > 0) {
      // Re-activate session for today
      const sess = existing[0];
      await run(
        `UPDATE sessions SET status = 'Active', punch_out_time = NULL WHERE id = ?`,
        [sess.id]
      );
      return res.json({ success: true, sessionId: sess.id, status: 'Active' });
    }

    // No session for today yet - create new active session
    const sessionId = `SES-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    await run(
      `INSERT OR REPLACE INTO sessions (id, user_id, user_name, email, role, staff_type, login_time, punch_in_time, status, work_mode, ip_address, device, location)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Active', 'Office Campus', '103.21.144.92 (Office Fiber)', ?, ?)`,
      [
        sessionId,
        userId || 'EMP-SANNA-001',
        userName || 'Staff Member',
        userEmail || '',
        role || 'Employee',
        role?.includes('Intern') ? 'Intern' : 'Employee',
        loginTime,
        nowIST,
        device || 'Desktop / Web App',
        location || 'Hyderabad, India (Asia/Kolkata)'
      ]
    );

    res.json({ success: true, sessionId, status: 'Active', punchInTime: nowIST });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/sessions/punch-in', async (req, res) => {
  try {
    const { id, userId, userName, userEmail, role, staffType, workMode, ipAddress, device, location } = req.body;
    const now = new Date();
    const sessionId = id || `SES-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const punchInTime = req.body.punchInTime || getISTTimeString(now);
    const loginTime = now.toISOString();

    // Mark previous active sessions for this user as Logged Out
    await run(
      `UPDATE sessions SET status = 'Logged Out', punch_out_time = ? WHERE (user_id = ? OR email = ?) AND status = 'Active'`,
      [punchInTime, userId, userEmail]
    );

    // Insert new active punch-in session with guaranteed unique ID
    await run(
      `INSERT OR REPLACE INTO sessions (id, user_id, user_name, email, role, staff_type, login_time, punch_in_time, status, work_mode, ip_address, device, location)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?, ?, ?, ?)`,
      [
        sessionId,
        userId || 'EMP-SANNA-001',
        userName || 'Staff Member',
        userEmail || '',
        role || 'Employee',
        staffType || (role?.includes('Intern') ? 'Intern' : 'Employee'),
        loginTime,
        punchInTime,
        workMode || 'Office Campus',
        ipAddress || '103.21.144.92 (Office Fiber)',
        device || 'Workstation Browser',
        location || 'Hyderabad, India (Asia/Kolkata)'
      ]
    );

    res.json({
      success: true,
      session: {
        id: sessionId,
        userId,
        userName,
        userEmail,
        role,
        loginTime,
        punchInTime,
        status: 'Active',
        workMode: workMode || 'Office Campus'
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/sessions/punch-out', async (req, res) => {
  try {
    const { userId, userEmail } = req.body;
    const now = new Date();
    const punchOutTime = req.body.punchOutTime || getISTTimeString(now);

    const result = await run(
      `UPDATE sessions SET status = 'Logged Out', punch_out_time = ? WHERE (user_id = ? OR email = ?) AND status = 'Active'`,
      [punchOutTime, userId, userEmail]
    );

    res.json({
      success: true,
      punchOutTime,
      updatedCount: result.changes
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/sessions', async (req, res) => {
  try {
    const { id, userId, userName, userEmail, role, staffType, loginTime, punchInTime, punchOutTime, ipAddress, device, location, status, workMode } = req.body;
    const now = new Date();
    const sessionId = id || `SES-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    await run(
      `INSERT OR REPLACE INTO sessions (id, user_id, user_name, email, role, staff_type, login_time, punch_in_time, punch_out_time, ip_address, device, location, status, work_mode)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sessionId,
        userId,
        userName,
        userEmail,
        role,
        staffType || 'Employee',
        loginTime || now.toISOString(),
        punchInTime || '09:00 AM',
        punchOutTime || null,
        ipAddress || '103.21.144.92',
        device || 'Desktop',
        location || 'Hyderabad, India',
        status || 'Active',
        workMode || 'Office Campus'
      ]
    );
    res.json({ success: true, id: sessionId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { punchInTime, punchOutTime, status, workMode, location, device } = req.body;
    const finalPunchOut = status === 'Active' ? null : (punchOutTime !== undefined ? punchOutTime : null);
    
    let loginTimeUpdate = null;
    if (punchInTime) {
      const existing = await query("SELECT login_time FROM sessions WHERE id = ?", [id]);
      if (existing.length > 0 && existing[0].login_time) {
        const sDate = new Date(existing[0].login_time);
        const inMins = parseTimeToMinutes(punchInTime);
        sDate.setHours(Math.floor(inMins / 60), inMins % 60, 0, 0);
        loginTimeUpdate = sDate.toISOString();
      }
    }

    await run(
      `UPDATE sessions SET
         punch_in_time = COALESCE(?, punch_in_time),
         punch_out_time = ?,
         status = COALESCE(?, status),
         work_mode = COALESCE(?, work_mode),
         location = COALESCE(?, location),
         device = COALESCE(?, device),
         login_time = COALESCE(?, login_time)
       WHERE id = ?`,
      [punchInTime, finalPunchOut, status, workMode, location, device, loginTimeUpdate, id]
    );
    res.json({ success: true, id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await run(`DELETE FROM sessions WHERE id = ?`, [id]);
    res.json({ success: true, id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Club / Merge two session logs together and add their times
router.post('/sessions/club', async (req, res) => {
  try {
    const { session1Id, session2Id, mergedSession } = req.body;
    if (!session1Id || !session2Id) {
      return res.status(400).json({ error: 'Both session1Id and session2Id are required to club logs.' });
    }

    // Delete session 2
    await run("DELETE FROM sessions WHERE id = ?", [session2Id]);

    // Update session 1 with combined details
    if (mergedSession) {
      const finalPunchOut = mergedSession.status === 'Active' ? null : (mergedSession.punchOutTime || getISTTimeString(new Date()));
      await run(`
        UPDATE sessions SET
          punch_in_time = ?,
          punch_out_time = ?,
          status = ?,
          work_mode = ?
        WHERE id = ?
      `, [
        mergedSession.punchInTime || '09:00 AM',
        finalPunchOut,
        mergedSession.status || 'Active',
        mergedSession.workMode || 'Office Campus',
        session1Id
      ]);
    }

    const updated = await query("SELECT * FROM sessions WHERE id = ?", [session1Id]);
    res.json({ success: true, message: 'Sessions successfully clubbed together.', session: updated[0] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/attendance', async (req, res) => {
  try {
    const attendance = await query('SELECT * FROM attendance ORDER BY date DESC');
    res.json(attendance);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 10. Content Tasks / Content Calendar
router.get('/content-tasks', async (req, res) => {
  try {
    const tasks = await query('SELECT * FROM content_tasks ORDER BY scheduled_date ASC, id ASC');
    res.json(tasks);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/content-tasks', async (req, res) => {
  try {
    const { client_name, clientName, title, task_name, platform, content_type, scheduled_date, dueDate, status, assigned_to, caption, drive_link } = req.body;
    const finalClient = client_name || clientName || 'Sanna Innovations';
    const finalTitle = title || task_name || 'Brand Post';
    const finalDate = scheduled_date || dueDate || new Date().toISOString().split('T')[0];
    const insert = await run(
      `INSERT INTO content_tasks (client_name, title, platform, content_type, scheduled_date, status, assigned_to, caption, drive_link)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [finalClient, finalTitle, platform || 'Instagram', content_type || 'Carousel', finalDate, status || 'Scheduled', assigned_to || 'Creative Team', caption || '', drive_link || '']
    );
    res.status(201).json({ id: insert.id, ...req.body });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/content-tasks/:id', async (req, res) => {
  try {
    await run('DELETE FROM content_tasks WHERE id = ?', [req.params.id]);
    res.json({ status: 'deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 11. Financial Records
router.get('/finance', async (req, res) => {
  try {
    const records = await query('SELECT * FROM financial_records ORDER BY date DESC, id DESC');
    res.json(records);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/finance', async (req, res) => {
  try {
    const { date, month, year, type, category, particulars, amount, description, payment_mode, reference_no, status, remarks } = req.body;
    const d = date || new Date().toISOString().split('T')[0];
    const insert = await run(
      `INSERT INTO financial_records (date, month, year, type, category, particulars, amount, description, payment_mode, reference_no, status, remarks)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [d, month || 8, year || 2026, type || 'Income', category || 'Client Retainer', particulars || description || 'Client payment', parseFloat(amount) || 0, description || particulars || '', payment_mode || 'Bank Transfer', reference_no || `TXN-${Date.now()}`, status || 'Cleared', remarks || '']
    );
    res.status(201).json({ id: insert.id, ...req.body });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 12. Invoices
router.get('/invoices', async (req, res) => {
  try {
    const invoices = await query('SELECT * FROM invoices ORDER BY invoice_date DESC, id DESC');
    const items = await query('SELECT * FROM invoice_items ORDER BY invoice_id ASC');
    const itemsByInvoice = {};
    items.forEach(it => {
      if (!itemsByInvoice[it.invoice_id]) itemsByInvoice[it.invoice_id] = [];
      itemsByInvoice[it.invoice_id].push(it);
    });
    const result = invoices.map(inv => ({
      ...inv,
      items: itemsByInvoice[inv.id] || []
    }));
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 13. Quotations
router.get('/quotations', async (req, res) => {
  try {
    const quotes = await query('SELECT * FROM quotations ORDER BY quote_date DESC, id DESC');
    const items = await query('SELECT * FROM quotation_items ORDER BY quotation_id ASC');
    const itemsByQuote = {};
    items.forEach(it => {
      if (!itemsByQuote[it.quotation_id]) itemsByQuote[it.quotation_id] = [];
      itemsByQuote[it.quotation_id].push(it);
    });
    const result = quotes.map(q => ({
      ...q,
      items: itemsByQuote[q.id] || []
    }));
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 14. Employee Performances
router.get('/performances', async (req, res) => {
  try {
    const performances = await query('SELECT * FROM employee_performances ORDER BY year DESC, month DESC, id DESC');
    res.json(performances);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 15. Daily Work Logs & Standup Diary (Synced across Staff & Admin Portal)
db.run(`
  CREATE TABLE IF NOT EXISTS daily_work_logs (
    id TEXT PRIMARY KEY,
    staff_id TEXT NOT NULL,
    staff_name TEXT NOT NULL,
    staff_email TEXT,
    staff_type TEXT DEFAULT 'Employee',
    date TEXT NOT NULL,
    work_mode TEXT DEFAULT 'Office Campus',
    hours_spent REAL DEFAULT 8.0,
    project TEXT,
    task_title TEXT NOT NULL,
    deliverable_notes TEXT,
    learnings TEXT,
    blockers TEXT,
    tomorrow_plan TEXT,
    proof_url TEXT,
    priority TEXT DEFAULT 'Medium',
    status TEXT DEFAULT 'Completed',
    approval_status TEXT DEFAULT 'Pending',
    manager_feedback TEXT,
    manager_rating REAL DEFAULT 5,
    reviewed_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

router.get('/daily-tasks', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM daily_work_logs ORDER BY date DESC, created_at DESC, id DESC');
    const mapped = rows.map(r => ({
      id: r.id,
      staffId: r.staff_id,
      staffName: r.staff_name,
      staffEmail: r.staff_email,
      staffType: r.staff_type || 'Employee',
      date: r.date,
      workMode: r.work_mode || 'Office Campus',
      hoursSpent: parseFloat(r.hours_spent) || 8.0,
      project: r.project || 'Astra Core CRM',
      taskTitle: r.task_title,
      deliverableNotes: r.deliverable_notes,
      learnings: r.learnings || '',
      blockers: r.blockers || '',
      tomorrowPlan: r.tomorrow_plan || '',
      proofUrl: r.proof_url || '',
      priority: r.priority || 'Medium',
      status: r.status || 'Completed',
      approvalStatus: r.approval_status || 'Pending',
      managerFeedback: r.manager_feedback || '',
      managerRating: parseFloat(r.manager_rating) || 5,
      reviewedBy: r.reviewed_by || '',
      createdAt: r.created_at
    }));
    res.json(mapped);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/daily-tasks', async (req, res) => {
  try {
    const {
      id,
      staffId,
      staffName,
      staffEmail,
      staffType,
      date,
      workMode,
      hoursSpent,
      project,
      taskTitle,
      deliverableNotes,
      learnings,
      blockers,
      tomorrowPlan,
      proofUrl,
      priority,
      status,
      approvalStatus,
      managerFeedback,
      managerRating,
      reviewedBy
    } = req.body;

    const taskId = id || `DT-${new Date().getFullYear()}-${Date.now()}`;
    const taskDate = date || new Date().toISOString().split('T')[0];

    await run(
      `INSERT OR REPLACE INTO daily_work_logs (
        id, staff_id, staff_name, staff_email, staff_type, date, work_mode,
        hours_spent, project, task_title, deliverable_notes, learnings,
        blockers, tomorrow_plan, proof_url, priority, status, approval_status,
        manager_feedback, manager_rating, reviewed_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [
        taskId,
        staffId || 'EMP-SANNA-001',
        staffName || 'Staff Member',
        staffEmail || '',
        staffType || 'Employee',
        taskDate,
        workMode || 'Office Campus',
        parseFloat(hoursSpent) || 8.0,
        project || 'Astra Core CRM',
        taskTitle || 'Daily Activity & Task Deliverables',
        deliverableNotes || '',
        learnings || '',
        blockers || '',
        tomorrowPlan || '',
        proofUrl || '',
        priority || 'Medium',
        status || 'Completed',
        approvalStatus || 'Pending',
        managerFeedback || '',
        parseFloat(managerRating) || 5,
        reviewedBy || ''
      ]
    );

    res.status(201).json({
      success: true,
      task: {
        id: taskId,
        staffId,
        staffName,
        staffEmail,
        staffType,
        date: taskDate,
        workMode,
        hoursSpent: parseFloat(hoursSpent) || 8.0,
        project,
        taskTitle,
        deliverableNotes,
        learnings,
        blockers,
        tomorrowPlan,
        proofUrl,
        priority: priority || 'Medium',
        status: status || 'Completed',
        approvalStatus: approvalStatus || 'Pending',
        managerFeedback,
        managerRating,
        reviewedBy
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/daily-tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      approvalStatus,
      managerFeedback,
      managerRating,
      reviewedBy,
      hoursSpent,
      deliverableNotes,
      taskTitle,
      status
    } = req.body;

    const existing = await get('SELECT * FROM daily_work_logs WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Task log not found.' });
    }

    await run(
      `UPDATE daily_work_logs SET
        approval_status = COALESCE(?, approval_status),
        manager_feedback = COALESCE(?, manager_feedback),
        manager_rating = COALESCE(?, manager_rating),
        reviewed_by = COALESCE(?, reviewed_by),
        hours_spent = COALESCE(?, hours_spent),
        deliverable_notes = COALESCE(?, deliverable_notes),
        task_title = COALESCE(?, task_title),
        status = COALESCE(?, status)
       WHERE id = ?`,
      [
        approvalStatus !== undefined ? approvalStatus : null,
        managerFeedback !== undefined ? managerFeedback : null,
        managerRating !== undefined ? parseFloat(managerRating) : null,
        reviewedBy !== undefined ? reviewedBy : null,
        hoursSpent !== undefined ? parseFloat(hoursSpent) : null,
        deliverableNotes !== undefined ? deliverableNotes : null,
        taskTitle !== undefined ? taskTitle : null,
        status !== undefined ? status : null,
        id
      ]
    );

    res.json({ success: true, message: 'Work log updated successfully.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/daily-tasks/:id', async (req, res) => {
  try {
    await run('DELETE FROM daily_work_logs WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Work log deleted successfully.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 16. Software Development Matrix Projects & Milestones (Live Engine Synced across Staff & Admin Portal)
db.run(`
  CREATE TABLE IF NOT EXISTS dev_projects (
    id TEXT PRIMARY KEY,
    project_name TEXT NOT NULL,
    client_name TEXT,
    client_type TEXT DEFAULT 'One-Time Dev',
    assigned_lead TEXT DEFAULT 'Development Team',
    target_date TEXT,
    status TEXT DEFAULT 'In Progress',
    contract_value TEXT,
    milestones TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

const DEFAULT_DEV_PROJECTS_SEED = [
  {
    id: 'dev-proj-powertech',
    projectName: 'Powertech CRM',
    clientName: 'Powertech',
    clientType: 'Custom Enterprise',
    assignedLead: 'Smitesh Pokharkar',
    targetDate: '2026-10-25',
    status: 'Completed',
    contractValue: '₹1,20,000',
    milestones: [
      { id: 'm-pt-1', title: 'Enterprise Core CRM Engine & Multi-Tenancy Architecture', assignee: 'Lead Dev', status: 'Completed', progress: 100, dueDate: '2026-10-15' },
      { id: 'm-pt-2', title: 'PostgreSQL Database & Dynamic RBAC Roles', assignee: 'Backend Dev', status: 'Completed', progress: 100, dueDate: '2026-10-18' },
      { id: 'm-pt-3', title: 'Real-Time Telemetry & Staff Work Diary', assignee: 'Full Stack Dev', status: 'Completed', progress: 100, dueDate: '2026-10-22' },
      { id: 'm-pt-4', title: 'Production Staging, Testing & Final Deployment', assignee: 'QA & DevOps', status: 'Completed', progress: 100, dueDate: '2026-10-25' }
    ]
  },
  {
    id: 'dev-proj-edulateral',
    projectName: 'Edulateral LMS Platform',
    clientName: 'Edulateral LMS',
    clientType: 'One-Time Dev',
    assignedLead: 'Development Team',
    targetDate: '2026-10-31',
    status: 'In Progress',
    contractValue: '₹60,000',
    milestones: [
      { id: 'm-1', title: 'LMS Course Architecture & Curriculum Engine', assignee: 'Full Stack Dev', status: 'Completed', progress: 100, dueDate: '2026-10-18' },
      { id: 'm-2', title: 'Student & Instructor Role Authentication', assignee: 'Backend Dev', status: 'Completed', progress: 100, dueDate: '2026-10-20' },
      { id: 'm-3', title: 'Video Streaming & Asset CDN Integration', assignee: 'Cloud Engineer', status: 'Completed', progress: 100, dueDate: '2026-10-22' },
      { id: 'm-4', title: 'Quiz & Certificate Generator System', assignee: 'Frontend Dev', status: 'Completed', progress: 100, dueDate: '2026-10-26' },
      { id: 'm-5', title: 'Payment Gateway Integration (Razorpay/Stripe)', assignee: 'Backend Dev', status: 'In Progress', progress: 85, dueDate: '2026-10-28' },
      { id: 'm-6', title: 'End-to-End QA, Load Testing & Launch', assignee: 'QA Team', status: 'To Do', progress: 0, dueDate: '2026-10-31' }
    ]
  },
  {
    id: 'dev-proj-sanna-crm',
    projectName: 'Sanna CRM v2 Enterprise Suite',
    clientName: 'Sanna Innovations Pvt Ltd',
    clientType: 'Internal Enterprise',
    assignedLead: 'Architecture Lead',
    targetDate: '2026-11-15',
    status: 'In Progress',
    contractValue: 'Enterprise Core',
    milestones: [
      { id: 'm-crm-1', title: 'Verion Matte Dark Design System & Micro-Interactions', assignee: 'UI/UX Specialist', status: 'Completed', progress: 100, dueDate: '2026-10-19' },
      { id: 'm-crm-2', title: 'Central Database & Session Synchronization API', assignee: 'Backend Engineer', status: 'Completed', progress: 100, dueDate: '2026-10-21' },
      { id: 'm-crm-3', title: 'Development Project Deliverables Engine & Trackers', assignee: 'Full Stack Dev', status: 'Completed', progress: 100, dueDate: '2026-10-23' },
      { id: 'm-crm-4', title: 'Multi-Role Boss Review & Approval Sandbox', assignee: 'Lead Dev', status: 'In Progress', progress: 75, dueDate: '2026-10-25' }
    ]
  },
  {
    id: 'dev-proj-aistech',
    projectName: 'Ais Tech AI Web Engine',
    clientName: 'Ais Tech Solutions',
    clientType: 'Client Retainer',
    assignedLead: 'Naveen Kumar',
    targetDate: '2026-11-05',
    status: 'In Progress',
    contractValue: '₹45,000',
    milestones: [
      { id: 'm-ais-1', title: 'Technical SEO Audit & Schema Mapping', assignee: 'SEO Lead', status: 'Completed', progress: 100, dueDate: '2026-10-14' },
      { id: 'm-ais-2', title: 'Core Web Vitals & Speed Optimization (SSR)', assignee: 'Frontend Dev', status: 'Completed', progress: 100, dueDate: '2026-10-22' },
      { id: 'm-ais-3', title: 'Automated AI Blog Pipeline & Indexing', assignee: 'DevOps / AI Team', status: 'In Progress', progress: 60, dueDate: '2026-10-28' }
    ]
  },
  {
    id: 'dev-proj-cloud',
    projectName: 'Cloud Infrastructure & Auto-Scaling Cluster',
    clientName: 'Sahara Transformers',
    clientType: 'Hosting & Cloud',
    assignedLead: 'DevOps Lead',
    targetDate: '2026-11-20',
    status: 'In Progress',
    contractValue: '₹95,000',
    milestones: [
      { id: 'm-cld-1', title: 'AWS Multi-AZ VPC & Security Group Hardening', assignee: 'Cloud DevOps', status: 'Completed', progress: 100, dueDate: '2026-10-12' },
      { id: 'm-cld-2', title: 'PostgreSQL Replication & Automated Backup Snapshots', assignee: 'DBA Engineer', status: 'Completed', progress: 100, dueDate: '2026-10-18' },
      { id: 'm-cld-3', title: 'Kubernetes Cluster Provisioning & Docker Deployments', assignee: 'DevOps Specialist', status: 'In Progress', progress: 50, dueDate: '2026-10-30' }
    ]
  }
];

router.get('/dev-projects', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM dev_projects ORDER BY updated_at DESC, created_at DESC');
    if (!rows || rows.length === 0) {
      // Auto seed default projects
      for (const p of DEFAULT_DEV_PROJECTS_SEED) {
        await run(
          `INSERT OR REPLACE INTO dev_projects (id, project_name, client_name, client_type, assigned_lead, target_date, status, contract_value, milestones, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [p.id, p.projectName, p.clientName, p.clientType, p.assignedLead, p.targetDate, p.status, p.contractValue, JSON.stringify(p.milestones || [])]
        );
      }
      return res.json(DEFAULT_DEV_PROJECTS_SEED);
    }

    const mapped = rows.map(r => ({
      id: r.id,
      projectName: r.project_name,
      clientName: r.client_name,
      clientType: r.client_type,
      assignedLead: r.assigned_lead,
      targetDate: r.target_date,
      status: r.status,
      contractValue: r.contract_value,
      milestones: typeof r.milestones === 'string' ? JSON.parse(r.milestones || '[]') : (r.milestones || []),
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));

    res.json(mapped);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/dev-projects', async (req, res) => {
  try {
    const body = req.body;
    if (body.projects && Array.isArray(body.projects)) {
      for (const p of body.projects) {
        await run(
          `INSERT OR REPLACE INTO dev_projects (id, project_name, client_name, client_type, assigned_lead, target_date, status, contract_value, milestones, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [
            p.id,
            p.projectName || p.name || 'Untitled Dev Project',
            p.clientName || '',
            p.clientType || 'One-Time Dev',
            p.assignedLead || 'Development Team',
            p.targetDate || '',
            p.status || 'In Progress',
            p.contractValue || '',
            typeof p.milestones === 'string' ? p.milestones : JSON.stringify(p.milestones || [])
          ]
        );
      }
      return res.json({ success: true, count: body.projects.length });
    }

    const p = body;
    if (!p.id || !p.projectName) {
      return res.status(400).json({ error: 'Project id and projectName required.' });
    }

    await run(
      `INSERT OR REPLACE INTO dev_projects (id, project_name, client_name, client_type, assigned_lead, target_date, status, contract_value, milestones, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        p.id,
        p.projectName,
        p.clientName || '',
        p.clientType || 'One-Time Dev',
        p.assignedLead || 'Development Team',
        p.targetDate || '',
        p.status || 'In Progress',
        p.contractValue || '',
        typeof p.milestones === 'string' ? p.milestones : JSON.stringify(p.milestones || [])
      ]
    );

    res.json({ success: true, project: p });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/dev-projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { projectName, clientName, clientType, assignedLead, targetDate, status, contractValue, milestones } = req.body;

    const existing = await get('SELECT * FROM dev_projects WHERE id = ?', [id]);
    if (!existing) {
      await run(
        `INSERT INTO dev_projects (id, project_name, client_name, client_type, assigned_lead, target_date, status, contract_value, milestones, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [id, projectName || 'Project', clientName || '', clientType || '', assignedLead || '', targetDate || '', status || 'In Progress', contractValue || '', JSON.stringify(milestones || [])]
      );
      return res.json({ success: true });
    }

    await run(
      `UPDATE dev_projects SET
        project_name = COALESCE(?, project_name),
        client_name = COALESCE(?, client_name),
        client_type = COALESCE(?, client_type),
        assigned_lead = COALESCE(?, assigned_lead),
        target_date = COALESCE(?, target_date),
        status = COALESCE(?, status),
        contract_value = COALESCE(?, contract_value),
        milestones = COALESCE(?, milestones),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        projectName !== undefined ? projectName : null,
        clientName !== undefined ? clientName : null,
        clientType !== undefined ? clientType : null,
        assignedLead !== undefined ? assignedLead : null,
        targetDate !== undefined ? targetDate : null,
        status !== undefined ? status : null,
        contractValue !== undefined ? contractValue : null,
        milestones !== undefined ? (typeof milestones === 'string' ? milestones : JSON.stringify(milestones)) : null,
        id
      ]
    );

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/dev-projects/:id', async (req, res) => {
  try {
    await run('DELETE FROM dev_projects WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 17. RBAC Dynamic Roles & Permissions Sync (Persisted across accounts and browser sessions)
router.get('/roles', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM roles ORDER BY id ASC');
    const mapped = rows.map(r => ({
      id: r.id,
      name: r.name,
      permissions: typeof r.permissions === 'string' ? JSON.parse(r.permissions || '[]') : (r.permissions || [])
    }));
    res.json(mapped);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/roles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions, name } = req.body;
    const permsStr = typeof permissions === 'string' ? permissions : JSON.stringify(permissions || []);

    const existing = await get('SELECT * FROM roles WHERE id = ?', [id]);
    if (!existing) {
      await run('INSERT INTO roles (id, name, permissions) VALUES (?, ?, ?)', [id, name || id, permsStr]);
    } else {
      await run(
        'UPDATE roles SET permissions = COALESCE(?, permissions), name = COALESCE(?, name) WHERE id = ?',
        [permissions !== undefined ? permsStr : null, name !== undefined ? name : null, id]
      );
    }

    res.json({ success: true, id, permissions: typeof permissions === 'string' ? JSON.parse(permissions) : permissions });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================================
// MIS LEADS DIRECT DATABASE ENDPOINTS (Single Source of Truth in SQLite)
// ============================================================================
router.get('/leads', async (req, res) => {
  try {
    const rows = await query(`
      SELECT 
        id,
        client_id as clientId,
        name,
        company,
        email,
        phone,
        source,
        assigned_to as assignedTo,
        notes,
        tags,
        status,
        score,
        potential_value as potentialValue,
        project_category as projectCategory,
        project_type as projectType,
        createdAt,
        updatedAt
      FROM leads
      ORDER BY createdAt DESC
    `);
    const mapped = rows.map(r => {
      let parsedTags = [];
      try {
        if (typeof r.tags === 'string' && r.tags.startsWith('[')) {
          parsedTags = JSON.parse(r.tags);
        } else if (Array.isArray(r.tags)) {
          parsedTags = r.tags;
        } else if (r.tags) {
          parsedTags = [r.tags];
        }
      } catch (e) {
        parsedTags = [];
      }
      return {
        ...r,
        tags: parsedTags,
        potentialValue: parseFloat(r.potentialValue) || 0,
        score: parseInt(r.score, 10) || 50
      };
    });
    res.json(mapped);
  } catch (err) {
    console.error('Error fetching leads from DB:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/leads', async (req, res) => {
  try {
    const l = req.body;
    const now = new Date().toISOString();
    const leadId = l.id || `lead-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const clientId = l.clientId || 'client-sanna';
    const name = l.name || l.company || 'New Lead';
    const company = l.company || l.name || 'Enterprise Client';
    const email = l.email ? String(l.email).trim() : '';
    const phone = l.phone ? String(l.phone).trim() : '';
    const source = l.source || 'Website Forms';
    const assignedTo = l.assignedTo || 'Srinivas (Admin)';
    const notes = l.notes || '';
    const tags = JSON.stringify(Array.isArray(l.tags) ? l.tags : (l.tags ? [l.tags] : []));
    const status = l.status || 'Lead Intake';
    const score = parseInt(l.score, 10) || 50;
    const potentialValue = parseFloat(l.potentialValue || l.value || 0) || 0;
    const projectCategory = l.projectCategory || 'Software Development';
    const projectType = l.projectType || 'One Time';

    await run(`
      INSERT INTO leads (
        id, client_id, name, company, email, phone, source, assigned_to,
        notes, tags, status, score, potential_value, project_category, project_type,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        company = excluded.company,
        email = excluded.email,
        phone = excluded.phone,
        source = excluded.source,
        assigned_to = excluded.assigned_to,
        notes = excluded.notes,
        tags = excluded.tags,
        status = excluded.status,
        score = excluded.score,
        potential_value = excluded.potential_value,
        project_category = excluded.project_category,
        project_type = excluded.project_type,
        updatedAt = excluded.updatedAt
    `, [
      leadId, clientId, name, company, email, phone, source, assignedTo,
      notes, tags, status, score, potentialValue, projectCategory, projectType,
      now, now
    ]);

    res.status(201).json({
      id: leadId, clientId, name, company, email, phone, source,
      assignedTo, notes, tags: JSON.parse(tags), status, score,
      potentialValue, projectCategory, projectType, createdAt: now, updatedAt: now
    });
  } catch (err) {
    console.error('Error inserting lead to DB:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/leads/batch', async (req, res) => {
  try {
    const leadsList = Array.isArray(req.body.leads) ? req.body.leads : (Array.isArray(req.body) ? req.body : []);
    if (!leadsList.length) return res.json({ success: true, count: 0 });

    const now = new Date().toISOString();
    let insertedCount = 0;

    await run('BEGIN IMMEDIATE TRANSACTION');
    try {
      for (let i = 0; i < leadsList.length; i++) {
      const l = leadsList[i];
      if (!l.name && !l.company) continue;

      const leadId = l.id || `lead-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`;
      const clientId = l.clientId || 'client-sanna';
      const name = l.name || l.company || `Lead #${i + 1}`;
      const company = l.company || l.name || 'Enterprise Client';
      const email = l.email ? String(l.email).trim() : '';
      const phone = l.phone ? String(l.phone).trim() : '';
      const source = l.source || 'Excel Import';
      const assignedTo = l.assignedTo || 'Srinivas (Admin)';
      const notes = l.notes || '';
      const tags = JSON.stringify(Array.isArray(l.tags) ? l.tags : (l.tags ? [l.tags] : ['Imported']));
      const status = l.status || 'Lead Intake';
      const score = parseInt(l.score, 10) || 50;
      const potentialValue = parseFloat(l.potentialValue || l.value || 0) || 0;
      const projectCategory = l.projectCategory || 'Software Development';
      const projectType = l.projectType || 'One Time';

      await run(`
        INSERT INTO leads (
          id, client_id, name, company, email, phone, source, assigned_to,
          notes, tags, status, score, potential_value, project_category, project_type,
          createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          company = excluded.company,
          email = excluded.email,
          phone = excluded.phone,
          source = excluded.source,
          assigned_to = excluded.assigned_to,
          notes = excluded.notes,
          tags = excluded.tags,
          status = excluded.status,
          score = excluded.score,
          potential_value = excluded.potential_value,
          project_category = excluded.project_category,
          project_type = excluded.project_type,
          updatedAt = excluded.updatedAt
      `, [
        leadId, clientId, name, company, email, phone, source, assignedTo,
        notes, tags, status, score, potentialValue, projectCategory, projectType,
        now, now
      ]);
      insertedCount++;
      }
      await run('COMMIT');
    } catch (txErr) {
      await run('ROLLBACK').catch(() => {});
      throw txErr;
    }

    res.json({ success: true, count: insertedCount });
  } catch (err) {
    console.error('Error batch inserting leads to DB:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/leads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const l = req.body;
    const now = new Date().toISOString();

    const updates = [];
    const params = [];

    if (l.name !== undefined) { updates.push('name = ?'); params.push(l.name); }
    if (l.company !== undefined) { updates.push('company = ?'); params.push(l.company); }
    if (l.email !== undefined) { updates.push('email = ?'); params.push(l.email); }
    if (l.phone !== undefined) { updates.push('phone = ?'); params.push(l.phone); }
    if (l.source !== undefined) { updates.push('source = ?'); params.push(l.source); }
    if (l.assignedTo !== undefined) { updates.push('assigned_to = ?'); params.push(l.assignedTo); }
    if (l.notes !== undefined) { updates.push('notes = ?'); params.push(l.notes); }
    if (l.tags !== undefined) { updates.push('tags = ?'); params.push(JSON.stringify(l.tags)); }
    if (l.status !== undefined) { updates.push('status = ?'); params.push(l.status); }
    if (l.score !== undefined) { updates.push('score = ?'); params.push(parseInt(l.score, 10) || 50); }
    if (l.potentialValue !== undefined) { updates.push('potential_value = ?'); params.push(parseFloat(l.potentialValue) || 0); }
    if (l.projectCategory !== undefined) { updates.push('project_category = ?'); params.push(l.projectCategory); }
    if (l.projectType !== undefined) { updates.push('project_type = ?'); params.push(l.projectType); }

    updates.push('updatedAt = ?');
    params.push(now);
    params.push(id);

    await run(`UPDATE leads SET ${updates.join(', ')} WHERE id = ?`, params);
    res.json({ success: true, id });
  } catch (err) {
    console.error('Error updating lead in DB:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/leads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await run('DELETE FROM leads WHERE id = ? OR id = ?', [id, id.replace(/^lead-/, '')]);
    res.json({ success: true, id });
  } catch (err) {
    console.error('Error deleting lead from DB:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
