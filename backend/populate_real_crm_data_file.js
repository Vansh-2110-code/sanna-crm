const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const unifiedDb = new sqlite3.Database(path.join(__dirname, 'unified_sanna_crm.db'));

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    unifiedDb.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

async function run() {
  const users = await query('SELECT * FROM users ORDER BY username ASC');
  const clients = await query('SELECT * FROM clients_projects ORDER BY id ASC');
  const deliverables = await query('SELECT * FROM project_deliverables ORDER BY id DESC');
  const holidays = await query('SELECT * FROM holiday_posts ORDER BY id ASC');
  const adReports = await query('SELECT * FROM ad_spent_reports ORDER BY id ASC');
  const adTx = await query('SELECT * FROM ad_spent_transactions ORDER BY id ASC');
  const editors = await query('SELECT * FROM editor_assignments ORDER BY id ASC');
  const servers = await query('SELECT * FROM server_details ORDER BY id ASC');
  const creds = await query('SELECT * FROM project_credentials ORDER BY id ASC');
  const finance = await query('SELECT * FROM financial_records ORDER BY id ASC');
  const content = await query('SELECT * FROM content_tasks ORDER BY id ASC');
  const perf = await query('SELECT * FROM employee_performances ORDER BY id ASC');
  const logs = await query('SELECT * FROM intern_work_logs ORDER BY date DESC');
  const sessions = await query('SELECT * FROM sessions ORDER BY login_time DESC');
  const attendance = await query('SELECT * FROM attendance ORDER BY date DESC');

  const realCrmDataFile = path.join(__dirname, '..', 'src', 'data', 'realCrmData.js');
  
  // Read current employees from realCrmData.js if exists to preserve rich metadata
  let existingEmployees = [];
  try {
    const currentContent = fs.readFileSync(realCrmDataFile, 'utf8');
    const match = currentContent.match(/employees:\s*(\[[\s\S]*?\]),\s*clients:/);
    if (match) {
      existingEmployees = eval(`(${match[1]})`);
    }
  } catch (e) {
    console.warn('Could not parse existing employees:', e.message);
  }

  const mappedClients = clients.map(c => ({
    id: c.id,
    name: c.name,
    clientName: c.name,
    clientType: c.client_type,
    isDm: c.is_dm ? true : false,
    billingCycle: c.billing_cycle || 'Monthly',
    ticketSize: c.ticket_size || 0,
    advancePayment: c.advance_payment || 0,
    paymentStatus: c.payment_status || 'Unpaid',
    status: c.status || 'active',
    onboardedDate: c.onboarded_date,
    deadline: c.deadline,
    assignedLead: c.assigned_lead || 'Aarav Sharma',
    contactPerson: c.contact_person || c.name,
    contactEmail: c.contact_email || 'contact@sannainnovations.com'
  }));

  const mappedDeliverables = deliverables.map(d => ({
    id: `deliv-${d.id}`,
    projectId: `deal-${d.project_id || d.id}`,
    projectName: d.project_name,
    clientName: d.project_name,
    month: d.month || 8,
    year: d.year || 2026,
    deliveryDate: d.delivery_date || '',
    reelsPlanned: d.reels_planned || 0,
    reelsDelivered: d.reels_delivered || 0,
    postsPlanned: d.posts_planned || 0,
    postsDelivered: d.posts_delivered || 0,
    service: d.service || 'Social Media Management',
    totalFollowers: d.total_followers || '',
    viewsReached: d.views_reached || '',
    backlinksCreated: parseInt(d.backlinks_created, 10) || 0,
    approvalPendingRemarks: d.approval_pending_remarks || '',
    otherRemarks: d.other_remarks || ''
  }));

  const mappedHolidays = holidays.map(h => ({
    id: `hol-${h.id}`,
    holidayName: h.holiday_name,
    date: h.date || '2026-08-15',
    clientProject: h.client_project || 'All Clients',
    creativeStatus: h.creative_status || 'Completed',
    captionStatus: h.caption_status || 'Approved',
    approvalStatus: h.approval_status || 'Approved',
    scheduledPosted: h.scheduled_posted || 'Scheduled',
    creativeUrl: ''
  }));

  const mappedAdReports = adReports.map(a => ({
    id: `ad-${a.id}`,
    projectId: a.project_id,
    clientProject: a.client_name,
    clientName: a.client_name,
    month: a.month || 8,
    year: a.year || 2026,
    date: a.date,
    amountAllotted: a.amount_allotted || 0,
    metaAdsSpent: a.meta_ads_spent || 0,
    instaBoostingSpent: a.insta_boosting_spent || 0,
    googleAdsSpent: a.google_ads_spent || 0,
    linkedinAdsSpent: a.linkedin_ads_spent || 0,
    spentAmount: a.total_spent || (a.meta_ads_spent + a.insta_boosting_spent + a.google_ads_spent + a.linkedin_ads_spent),
    paymentMode: a.mode_of_payment || 'UPI',
    remark: a.remark || ''
  }));

  const mappedAdTx = adTx.map(t => ({
    id: `TX-${t.id}`,
    projectId: t.project_id,
    clientProject: t.client_name,
    clientName: t.client_name,
    date: t.date,
    amount: t.amount || 0,
    purpose: t.purpose || 'Ad Spend',
    paymentMode: t.mode_of_payment || 'UPI',
    month: t.month || 8,
    year: t.year || 2026
  }));

  const mappedEditors = editors.map(e => ({
    id: `edit-${e.id}`,
    editorName: e.editor_name,
    email: e.email || 'editor@sannainnovations.com',
    clientProject: e.client_project,
    taskDescription: e.task_description,
    assignedDate: e.assignment_date,
    submissionDate: e.submission_date,
    status: e.status || 'Completed',
    amount: e.amount || 0,
    paymentStatus: e.payment_status || 'Paid',
    deliverableUrl: e.deliverable_url || ''
  }));

  const mappedServers = servers.map(s => ({
    id: `srv-${s.id}`,
    serverName: s.server_name,
    clientProject: s.client_name || s.server_name,
    clientName: s.client_name || s.server_name,
    serverIp: s.server_ip,
    sshUsername: s.ssh_username,
    sshPassword: s.ssh_password,
    sshPort: s.ssh_port || '22',
    serverProvider: s.server_provider || 'Hostinger',
    serverType: s.server_type || 'VPS',
    osInfo: s.os_info || 'Ubuntu 22.04 LTS',
    monthlyCost: s.monthly_cost || 0,
    renewalDate: s.renewal_date,
    remarks: s.remarks
  }));

  const mappedCreds = creds.map(c => ({
    id: `cred-${c.id}`,
    projectId: c.project_id,
    clientName: c.client_name,
    platform: c.platform,
    username: c.username,
    password: c.password,
    loginUrl: c.login_url || 'https://mis.sannainnovations.com',
    notes: c.notes
  }));

  const mappedFinance = finance.map(f => ({
    id: `fin-${f.id}`,
    date: f.date || '2026-08-01',
    month: f.month || 8,
    year: f.year || 2026,
    type: f.type || 'Income',
    category: f.category || 'Client Retainer',
    particulars: f.particulars || 'Client Services',
    amount: f.amount || 0,
    description: f.description || f.particulars || '',
    paymentMode: f.payment_mode || 'Bank Transfer',
    referenceNo: f.reference_no || `TXN-FIN-${f.id}`,
    status: f.status || 'Cleared',
    remarks: f.remarks || ''
  }));

  const mappedContent = content.map(ct => ({
    id: `ct-${ct.id}`,
    projectId: ct.project_id,
    clientName: ct.client_name,
    title: ct.title,
    platform: ct.platform || 'Instagram',
    contentType: ct.content_type || 'Carousel',
    scheduledDate: ct.scheduled_date || '2026-08-15',
    status: ct.status || 'Scheduled',
    assignedTo: ct.assigned_to || 'Creative Team',
    caption: ct.caption || '',
    driveLink: ct.drive_link || ''
  }));

  const mappedPerformances = perf.map(p => ({
    id: `perf-${p.id}`,
    employeeId: p.employee_id,
    month: p.month,
    year: p.year,
    roleId: p.role_id,
    monthlyMetrics: p.monthly_metrics,
    taskCompletionRate: p.task_completion_rate,
    qualityScore: p.quality_score,
    peerReview: p.peer_review,
    attendancePunctuality: p.attendance_punctuality,
    notes: p.notes,
    compositeScore: p.composite_score,
    tier: p.tier,
    aiSummary: p.ai_summary
  }));

  const out = `// Clean Unified Data Structure with Sanna Innovations Employees & Real MIS Data
export const REAL_CRM_DATA = {
  tenants: [
    {
      id: "client-sanna",
      name: "Sanna Innovations Pvt Ltd",
      subdomain: "sannacrm",
      customDomain: "sannacrm.sannainnovations.com",
      plan: "Enterprise Elite",
      status: "Active",
      maxUsers: 100,
      createdAt: "2026-01-01",
      contactEmail: "admin@sannainnovations.com"
    }
  ],
  employees: ${JSON.stringify(existingEmployees.length > 0 ? existingEmployees : users, null, 2)},
  clients: ${JSON.stringify(mappedClients, null, 2)},
  deliverables: ${JSON.stringify(mappedDeliverables, null, 2)},
  holidayPosts: ${JSON.stringify(mappedHolidays, null, 2)},
  adSpendLedger: ${JSON.stringify(mappedAdReports, null, 2)},
  adSpendTransactions: ${JSON.stringify(mappedAdTx, null, 2)},
  editorAssignments: ${JSON.stringify(mappedEditors, null, 2)},
  servers: ${JSON.stringify(mappedServers, null, 2)},
  credentials: ${JSON.stringify(mappedCreds, null, 2)},
  financialLedger: ${JSON.stringify(mappedFinance, null, 2)},
  contentCalendar: ${JSON.stringify(mappedContent, null, 2)},
  employeePerformances: ${JSON.stringify(mappedPerformances, null, 2)},
  internLogs: ${JSON.stringify(logs.slice(0, 50), null, 2)}
};
`;

  fs.writeFileSync(realCrmDataFile, out, 'utf8');
  console.log(`✅ [COMPLETE] Exported ${mappedClients.length} clients, ${mappedDeliverables.length} deliverables, ${mappedFinance.length} financial records to src/data/realCrmData.js!`);
  unifiedDb.close();
}

run().catch(e => {
  console.error(e);
  unifiedDb.close();
});
