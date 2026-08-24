import React, { useState, useMemo } from 'react';
import { useCRM } from '../../context/CRMContext';
import exportToCSV from '../../utils/csvExporter';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  FileText,
  TrendingUp,
  DollarSign,
  Users,
  Wallet,
  CheckCircle2,
  Calendar,
  Layers,
  GraduationCap,
  Megaphone,
  Headphones,
  ShoppingBag,
  Server,
  Video,
  Clock,
  Radio,
  ShieldCheck,
  Package,
  Search,
  Filter,
  Check
} from 'lucide-react';

const REPORT_CATEGORIES = [
  { id: 'all', label: 'All Reports & Datasets' },
  { id: 'sales', label: 'Sales & Revenue' },
  { id: 'operations', label: 'Operations & MIS' },
  { id: 'hr', label: 'HR, Payroll & Interns' },
  { id: 'security', label: 'Security & Sessions' }
];

const ReportsEngine = () => {
  const {
    deals = [],
    leads = [],
    orders = [],
    employees = [],
    attendanceMatrix = {},
    dailyTasks = [],
    deliverables = [],
    adSpendLedger = [],
    editorAssignments = [],
    serverCredentials = [],
    interns = [],
    tickets = [],
    campaigns = [],
    loginSessions = [],
    auditLogs = []
  } = useCRM();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [exportedMessage, setExportedMessage] = useState('');

  const currentYear = new Date().getFullYear();
  const today = new Date();
  const currentMonth = today.toLocaleString('default', { month: 'long' });

  // Robust CSV Helper using central export utility
  const downloadCSV = (rows, headers, filename) => {
    if (!rows || rows.length === 0) {
      alert(`No data available to export for ${filename}.`);
      return;
    }
    exportToCSV(rows, filename, headers);
    setExportedMessage(filename);
    setTimeout(() => setExportedMessage(''), 4000);
  };

  // 1. Revenue & Pipeline
  const handleExportRevenue = () => {
    const rows = deals.map(d => ({
      'Deal ID': d.id,
      'Deal Title': d.title || d.name || '',
      'Company': d.company || '',
      'Owner': d.owner || '',
      'Stage': d.stage || 'Lead',
      'Value ($)': d.dealValue || d.value || d.amount || 0,
      'Probability (%)': d.probability || 0,
      'Expected Close': d.expectedClose || d.createdAt || '',
      'Project Status': d.projectStatus || 'In Progress'
    }));
    downloadCSV(rows, ['Deal ID', 'Deal Title', 'Company', 'Owner', 'Stage', 'Value ($)', 'Probability (%)', 'Expected Close', 'Project Status'], `AstraCRM_Revenue_Pipeline_Report_${currentYear}.csv`);
  };

  // 2. Leads & Scoring
  const handleExportLeads = () => {
    const rows = leads.map(l => ({
      'Lead ID': l.id,
      'Name': l.name,
      'Email': l.email,
      'Phone': l.phone || '',
      'Company': l.company || '',
      'Status': l.status || 'Lead',
      'Source': l.source || 'Direct',
      'Score': l.score || 50,
      'Assigned Rep': l.assignedTo || '',
      'Estimated Value ($)': l.value || 0
    }));
    downloadCSV(rows, ['Lead ID', 'Name', 'Email', 'Phone', 'Company', 'Status', 'Source', 'Score', 'Assigned Rep', 'Estimated Value ($)'], `AstraCRM_Leads_Report_${currentYear}.csv`);
  };

  // 3. Orders & Invoices
  const handleExportOrders = () => {
    const rows = orders.map(o => ({
      'Invoice No': o.invoiceNumber || o.orderNumber || o.id,
      'Customer Name': o.customerName || '',
      'Invoice Date': o.invoiceDate || o.createdAt || '',
      'Type': o.invoiceType || 'Tax Invoice',
      'Subtotal (₹)': o.subtotal || 0,
      'Tax Amount (₹)': o.taxTotal || 0,
      'Grand Total (₹)': o.grandTotal || o.totalValue || 0,
      'Payment Status': o.paymentStatus || o.status || 'Paid',
      'GSTIN': o.customerGstin || ''
    }));
    downloadCSV(rows, ['Invoice No', 'Customer Name', 'Invoice Date', 'Type', 'Subtotal (₹)', 'Tax Amount (₹)', 'Grand Total (₹)', 'Payment Status', 'GSTIN'], `AstraCRM_Orders_Invoices_Report_${currentYear}.csv`);
  };

  // 4. Monthly Payroll & Salary
  const handleExportPayroll = () => {
    const rows = employees.map(e => {
      const base = e.baseSalary || e.salary || 50000;
      const gross = Math.round(base * 1.6);
      const deductions = Math.round(gross * 0.22);
      const net = gross - deductions;
      return {
        'Employee ID': e.id,
        'Employee Name': e.name,
        'Designation': e.designation || 'Specialist',
        'Base Salary (₹)': base,
        'Gross Earnings (₹)': gross,
        'Statutory Deductions (₹)': deductions,
        'Net Payable (₹)': net,
        'Payment Status': 'Paid'
      };
    });
    downloadCSV(rows, ['Employee ID', 'Employee Name', 'Designation', 'Base Salary (₹)', 'Gross Earnings (₹)', 'Statutory Deductions (₹)', 'Net Payable (₹)', 'Payment Status'], `AstraCRM_Payroll_Report_${currentMonth}_${currentYear}.csv`);
  };

  // 5. 31-Day Attendance & LOP Register
  const handleExportAttendance = () => {
    const rows = [];
    const allStaff = [
      ...employees.map(e => ({ id: e.id, name: e.name, type: 'Employee' })),
      ...interns.map(i => ({ id: i.id, name: `${i.name} (Intern)`, type: 'Intern' }))
    ];

    allStaff.forEach(st => {
      const key = `${st.id}-${currentYear}-${today.getMonth() + 1}`;
      const record = attendanceMatrix[key] || {};
      let presentCount = 0;
      let absentCount = 0;
      let lopCount = 0;

      for (let d = 1; d <= 31; d++) {
        const code = record[d] || 'P';
        if (code === 'P' || code === 'H' || code === 'SL' || code === 'CL') presentCount++;
        else if (code === 'HD') presentCount += 0.5;
        else if (code === 'LOP') lopCount++;
        else if (code === 'A') absentCount++;
      }

      rows.push({
        'Staff ID': st.id,
        'Staff Name': st.name,
        'Type': st.type,
        'Month/Year': `${currentMonth} ${currentYear}`,
        'Effective Present Days': presentCount,
        'Loss of Pay (LOP) Days': lopCount,
        'Absent Days': absentCount,
        'Attendance %': `${Math.round((presentCount / 31) * 100)}%`
      });
    });

    downloadCSV(rows, ['Staff ID', 'Staff Name', 'Type', 'Month/Year', 'Effective Present Days', 'Loss of Pay (LOP) Days', 'Absent Days', 'Attendance %'], `AstraCRM_Attendance_Register_${currentMonth}_${currentYear}.csv`);
  };

  // 6. Support Tickets
  const handleExportTickets = () => {
    const rows = tickets.map(t => ({
      'Ticket ID': t.id,
      'Subject': t.subject || t.title || '',
      'Customer': t.customerName || t.customer || '',
      'Priority': t.priority || 'Medium',
      'Status': t.status || 'Open',
      'Created Date': t.createdAt || '',
      'Assigned Agent': t.assignedTo || ''
    }));
    downloadCSV(rows, ['Ticket ID', 'Subject', 'Customer', 'Priority', 'Status', 'Created Date', 'Assigned Agent'], `AstraCRM_Support_Tickets_Report_${currentYear}.csv`);
  };

  // 7. Marketing Campaigns
  const handleExportCampaigns = () => {
    const rows = campaigns.map(c => ({
      'Campaign ID': c.id,
      'Campaign Name': c.name || c.title || '',
      'Channel': c.channel || 'Email Broadcast',
      'Target Audience': c.targetAudience || 'Prospects',
      'Sent Count': c.sentCount || 500,
      'Open Rate (%)': `${c.openRatePercent || 45}%`,
      'Click Rate (%)': `${c.clickRatePercent || 20}%`,
      'Converted Leads': c.convertedLeads || 0,
      'Estimated ROI': c.estimatedROI || '250%',
      'Status': c.status || 'Active'
    }));
    downloadCSV(rows, ['Campaign ID', 'Campaign Name', 'Channel', 'Target Audience', 'Sent Count', 'Open Rate (%)', 'Click Rate (%)', 'Converted Leads', 'Estimated ROI', 'Status'], `AstraCRM_Marketing_Campaigns_Report_${currentYear}.csv`);
  };

  // 8. Internships & Mentorship
  const handleExportInterns = () => {
    const rows = interns.map(i => ({
      'Intern ID': i.id,
      'Name': i.name,
      'College': i.college || '',
      'Cohort': i.cohort || '2026',
      'Department': i.department || '',
      'Mentor': i.mentor || '',
      'Stipend (₹)': i.stipend || 20000,
      'Status': i.status || 'Active',
      'Overall Rating': i.overallScore || 4.9,
      'Weekly Logs Count': (i.weeklyLogs || []).length,
      'Certificate Issued': i.certificateIssued?.issued ? 'YES' : 'NO'
    }));
    downloadCSV(rows, ['Intern ID', 'Name', 'College', 'Cohort', 'Department', 'Mentor', 'Stipend (₹)', 'Status', 'Overall Rating', 'Weekly Logs Count', 'Certificate Issued'], `AstraCRM_Intern_Progress_Report_${currentYear}.csv`);
  };

  // 9. Client Deliverables & Social Media
  const handleExportDeliverables = () => {
    const rows = deliverables.map(d => ({
      'Record ID': d.id,
      'Project Name': d.projectName,
      'Client Name': d.clientName,
      'Month/Year': `${d.month}/${d.year}`,
      'Reels Planned': d.reelsPlanned || 0,
      'Reels Delivered': d.reelsDelivered || 0,
      'Posts Planned': d.postsPlanned || 0,
      'Posts Delivered': d.postsDelivered || 0,
      'Views Reached': d.viewsReached || '',
      'Total Followers': d.totalFollowers || '',
      'SEO Backlinks': d.backlinksCreated || 0,
      'GMB Position': d.gmbPosition || ''
    }));
    downloadCSV(rows, ['Record ID', 'Project Name', 'Client Name', 'Month/Year', 'Reels Planned', 'Reels Delivered', 'Posts Planned', 'Posts Delivered', 'Views Reached', 'Total Followers', 'SEO Backlinks', 'GMB Position'], `AstraCRM_Client_Deliverables_Report_${currentYear}.csv`);
  };

  // 10. Multi-Platform Ad Spend
  const handleExportAdSpend = () => {
    const rows = adSpendLedger.map(a => ({
      'Transaction ID': a.transactionId || a.id,
      'Client Project': a.clientProject,
      'Platform': a.platform,
      'Amount Spent (₹)': a.spentAmount || 0,
      'Leads Generated': a.leadsGenerated || 0,
      'Cost Per Lead (₹)': a.costPerLead || 0,
      'Payment Mode': a.paymentMode || '',
      'Reconciliation Status': a.status || 'Reconciled'
    }));
    downloadCSV(rows, ['Transaction ID', 'Client Project', 'Platform', 'Amount Spent (₹)', 'Leads Generated', 'Cost Per Lead (₹)', 'Payment Mode', 'Reconciliation Status'], `AstraCRM_Ad_Spend_Ledger_Report_${currentYear}.csv`);
  };

  // 11. Video Editor Work Orders
  const handleExportEditors = () => {
    const rows = editorAssignments.map(e => ({
      'Task ID': e.id,
      'Editor Name': e.editorName,
      'Client Project': e.clientProject,
      'Task Description': e.taskDescription,
      'Assigned Date': e.assignedDate,
      'Deadline': e.submissionDate,
      'Status': e.status,
      'Payout Amount (₹)': e.amount || 0,
      'Payment Status': e.paymentStatus
    }));
    downloadCSV(rows, ['Task ID', 'Editor Name', 'Client Project', 'Task Description', 'Assigned Date', 'Deadline', 'Status', 'Payout Amount (₹)', 'Payment Status'], `AstraCRM_Editor_Work_Orders_Report_${currentYear}.csv`);
  };

  // 12. Server Infrastructure Vault
  const handleExportServers = () => {
    const rows = serverCredentials.map(s => ({
      'Server ID': s.id,
      'Client Project': s.clientProject,
      'Provider': s.serverProvider,
      'IP Address': s.ipAddress,
      'Region': s.region,
      'OS Type': s.osType,
      'SSH Port': s.sshPort || 22,
      'SSL Expiry Date': s.sslExpiryDate,
      'Annual Cost (₹)': s.annualHostingCost || 0,
      'Health Status': s.status
    }));
    downloadCSV(rows, ['Server ID', 'Client Project', 'Provider', 'IP Address', 'Region', 'OS Type', 'SSH Port', 'SSL Expiry Date', 'Annual Cost (₹)', 'Health Status'], `AstraCRM_Server_Infrastructure_Report_${currentYear}.csv`);
  };

  // 13. Daily Tasks & Timesheet
  const handleExportDailyTasks = () => {
    const rows = dailyTasks.map(t => ({
      'Task ID': t.id,
      'Date': t.date,
      'Staff Name': t.staffName,
      'Staff Type': t.staffType,
      'Project': t.project,
      'Category': t.category,
      'Hours Spent': t.hoursSpent,
      'Status': t.status,
      'Priority': t.priority,
      'Deliverable Notes': t.deliverableNotes,
      'Proof URL': t.proofUrl || '',
      'Approval Status': t.approvalStatus,
      'Manager Feedback': t.managerFeedback || ''
    }));
    downloadCSV(rows, ['Task ID', 'Date', 'Staff Name', 'Staff Type', 'Project', 'Category', 'Hours Spent', 'Status', 'Priority', 'Deliverable Notes', 'Proof URL', 'Approval Status', 'Manager Feedback'], `AstraCRM_Daily_Tasks_Timesheet_${currentYear}.csv`);
  };

  // 14. Login Sessions & Work Clock
  const handleExportLoginSessions = () => {
    const rows = loginSessions.map(s => ({
      'Session ID': s.id,
      'User Name': s.userName,
      'Email': s.userEmail,
      'Role': s.role,
      'Device': s.device,
      'IP Address': s.ipAddress,
      'Location': s.location,
      'Login Timestamp': s.loginTime,
      'Punch In': s.punchInTime || '',
      'Punch Out': s.punchOutTime || '',
      'Status': s.status
    }));
    downloadCSV(rows, ['Session ID', 'User Name', 'Email', 'Role', 'Device', 'IP Address', 'Location', 'Login Timestamp', 'Punch In', 'Punch Out', 'Status'], `AstraCRM_Login_Sessions_Audit_${currentYear}.csv`);
  };

  // 15. Security Audit Logs
  const handleExportAuditLogs = () => {
    const rows = (auditLogs || []).map(l => ({
      'Log ID': l.id,
      'Timestamp': l.timestamp,
      'User / Actor': l.userEmail || l.user || 'system@astracrm.io',
      'Action': l.action,
      'Resource Target': l.resource || '',
      'Severity': l.severity || 'INFO',
      'Details': l.details || '',
      'IP Address': l.ipAddress || '103.21.144.92'
    }));
    downloadCSV(rows, ['Log ID', 'Timestamp', 'User / Actor', 'Action', 'Resource Target', 'Severity', 'Details', 'IP Address'], `AstraCRM_Security_Audit_Logs_${currentYear}.csv`);
  };

  // Master Exporter for all reports
  const handleExportAllReports = () => {
    handleExportRevenue();
    setTimeout(() => handleExportLeads(), 300);
    setTimeout(() => handleExportOrders(), 600);
    setTimeout(() => handleExportPayroll(), 900);
    setTimeout(() => handleExportAttendance(), 1200);
    setTimeout(() => handleExportDailyTasks(), 1500);
    setTimeout(() => handleExportLoginSessions(), 1800);
    setTimeout(() => handleExportDeliverables(), 2100);
    setTimeout(() => handleExportAdSpend(), 2400);
    setTimeout(() => handleExportInterns(), 2700);
  };

  // Report Definitions
  const ALL_REPORTS = [
    {
      id: 'revenue',
      title: 'Sales Pipeline & Revenue Won',
      category: 'sales',
      icon: TrendingUp,
      color: '#10b981',
      recordsCount: deals.length,
      description: 'Stage breakdown, deal value, win probabilities, and expected close dates.',
      onExport: handleExportRevenue
    },
    {
      id: 'leads',
      title: 'Lead Attribution & Scoring',
      category: 'sales',
      icon: Users,
      color: '#8b5cf6',
      recordsCount: leads.length,
      description: 'Intake sources (Web, Social, Referral), lead scores, and rep assignments.',
      onExport: handleExportLeads
    },
    {
      id: 'orders',
      title: 'Orders, Invoices & Tax Ledger',
      category: 'sales',
      icon: ShoppingBag,
      color: '#3b82f6',
      recordsCount: orders.length,
      description: 'B2B/B2C GST tax invoices, line items, shipping fees, and payment status.',
      onExport: handleExportOrders
    },
    {
      id: 'payroll',
      title: 'Monthly Salary & Payroll Register',
      category: 'hr',
      icon: Wallet,
      color: '#f59e0b',
      recordsCount: employees.length,
      description: 'Base salary, gross earnings, statutory PF/ESI/TDS deductions, and net payouts.',
      onExport: handleExportPayroll
    },
    {
      id: 'attendance',
      title: '31-Day Attendance & LOP Register',
      category: 'hr',
      icon: Calendar,
      color: '#06b6d4',
      recordsCount: employees.length + interns.length,
      description: 'Daily P/A/HD/LOP matrix entries, leave types, and loss of pay deduction math.',
      onExport: handleExportAttendance
    },
    {
      id: 'daily_tasks',
      title: 'Daily Work Diary & Timesheet Logs',
      category: 'operations',
      icon: Clock,
      color: '#6366f1',
      recordsCount: dailyTasks.length,
      description: 'Staff daily task deliverables, hours worked, PR links, and supervisor reviews.',
      onExport: handleExportDailyTasks
    },
    {
      id: 'deliverables',
      title: 'Client Social Deliverables & SEO',
      category: 'operations',
      icon: Layers,
      color: '#ec4899',
      recordsCount: deliverables.length,
      description: 'Planned vs delivered Reels/Posts, views reached, follower growth, and backlinks.',
      onExport: handleExportDeliverables
    },
    {
      id: 'ad_spend',
      title: 'Multi-Platform Ad Spend Ledger',
      category: 'operations',
      icon: Megaphone,
      color: '#f97316',
      recordsCount: adSpendLedger.length,
      description: 'Meta Ads, Google Ads, LinkedIn spend, CPL math, and payment references.',
      onExport: handleExportAdSpend
    },
    {
      id: 'editors',
      title: 'Video Editor Work Orders & Payouts',
      category: 'operations',
      icon: Video,
      color: '#14b8a6',
      recordsCount: editorAssignments.length,
      description: 'Assigned creative briefs, submission deadlines, payout rates, and status.',
      onExport: handleExportEditors
    },
    {
      id: 'servers',
      title: 'Server Infrastructure & Credentials',
      category: 'operations',
      icon: Server,
      color: '#64748b',
      recordsCount: serverCredentials.length,
      description: 'Cloud hosting providers, IP addresses, OS, SSH auth, SSL expiry, and cost.',
      onExport: handleExportServers
    },
    {
      id: 'interns',
      title: 'Afkanerd Internship Progress Tracker',
      category: 'hr',
      icon: GraduationCap,
      color: '#a855f7',
      recordsCount: interns.length,
      description: 'Cohort batches, week-by-week progress logs, PR links, 5-star mentor reviews.',
      onExport: handleExportInterns
    },
    {
      id: 'tickets',
      title: 'Customer Support Desk & SLA',
      category: 'sales',
      icon: Headphones,
      color: '#ef4444',
      recordsCount: tickets.length,
      description: 'Support tickets, priority levels, resolution times, and assigned agents.',
      onExport: handleExportTickets
    },
    {
      id: 'campaigns',
      title: 'Marketing Campaigns Telemetry & ROI',
      category: 'sales',
      icon: BarChart3,
      color: '#84cc16',
      recordsCount: campaigns.length,
      description: 'Email/SMS broadcasts, open rates %, click rates %, and converted lead ROI.',
      onExport: handleExportCampaigns
    },
    {
      id: 'sessions',
      title: 'Recorded Login Sessions & Work Clock',
      category: 'security',
      icon: Radio,
      color: '#10b981',
      recordsCount: loginSessions.length,
      description: 'Live punch-in/out timestamps, IP telemetry, device OS, and active sessions.',
      onExport: handleExportLoginSessions
    },
    {
      id: 'audit',
      title: 'Zero-Trust Security & Audit Vault',
      category: 'security',
      icon: ShieldCheck,
      color: '#9333ea',
      recordsCount: auditLogs.length,
      description: 'Immutable administrative audit trail, security events, policy updates, and IPs.',
      onExport: handleExportAuditLogs
    }
  ];

  // Filter Reports by Category & Search
  const filteredReports = useMemo(() => {
    return ALL_REPORTS.filter(r => {
      const matchCat = activeCategory === 'all' || r.category === activeCategory;
      const q = searchQuery.toLowerCase();
      const matchSearch = !q || r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [activeCategory, searchQuery, deals, leads, orders, employees, dailyTasks, loginSessions, deliverables, adSpendLedger, interns, serverCredentials]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: '#60a5fa', fontWeight: '700', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileSpreadsheet style={{ width: '15px', height: '15px' }} />
            Enterprise Intelligence & Global Exporter
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '900', margin: '4px 0 6px', background: 'linear-gradient(135deg, #fff 0%, #60a5fa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Reports & CSV Intelligence Suite
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
            Instant, one-click <strong>CSV Export</strong> for all 15+ CRM modules, databases, attendance matrices, deliverables, and audit logs.
          </p>
        </div>

        <button
          onClick={handleExportAllReports}
          className="btn gradient-btn-primary"
          style={{ padding: '10px 18px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}
        >
          <Download style={{ width: '16px', height: '16px' }} />
          <span>Export All Datasets (Batch CSV)</span>
        </button>
      </div>

      {/* Export Confirmation Alert */}
      {exportedMessage && (
        <div className="saas-card" style={{ padding: '12px 18px', borderLeft: '4px solid #10b981', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle2 style={{ color: '#10b981', width: '18px', height: '18px' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#34d399' }}>
            Report Exported Successfully: <code>{exportedMessage}</code> (Check your Downloads folder)
          </span>
        </div>
      )}

      {/* Category Tabs & Search Toolbar */}
      <div className="saas-card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        
        {/* Category Tabs */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {REPORT_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: activeCategory === cat.id ? '700' : '500',
                border: activeCategory === cat.id ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
                background: activeCategory === cat.id ? 'rgba(99, 102, 241, 0.18)' : 'transparent',
                color: activeCategory === cat.id ? '#818cf8' : 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', width: '240px' }}>
          <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ width: '100%', paddingLeft: '32px', fontSize: '0.8rem', padding: '6px 12px 6px 32px' }}
          />
        </div>
      </div>

      {/* Reports Cards Grid with Unified SaaS Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '18px' }}>
        {filteredReports.map(rep => {
          const Icon = rep.icon;

          return (
            <div
              key={rep.id}
              className="saas-card-interactive"
              style={{
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '16px'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Icon style={{ width: '20px', height: '20px', color: rep.color || '#818cf8' }} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                        {rep.title}
                      </h3>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>
                        {rep.category} Dataset
                      </span>
                    </div>
                  </div>

                  <span className="tabular-nums" style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.72rem',
                    fontWeight: '700',
                    color: '#cbd5e1'
                  }}>
                    {rep.recordsCount} Records
                  </span>
                </div>

                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  {rep.description}
                </p>
              </div>

              {/* Action Button */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Format: <strong>.CSV (Excel Ready)</strong>
                </span>

                <button
                  onClick={rep.onExport}
                  className="btn btn-secondary"
                  style={{
                    fontSize: '0.78rem',
                    padding: '6px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Download style={{ width: '13px', height: '13px', color: '#818cf8' }} />
                  <span>Download CSV</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReportsEngine;
