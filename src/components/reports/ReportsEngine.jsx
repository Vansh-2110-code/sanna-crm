import React, { useState, useMemo, useEffect } from 'react';
import { useCRM } from '../../context/CRMContext';
import exportToCSV from '../../utils/csvExporter';
import { MIS_CLIENTS_DATA } from '../../data/misClientsDirectoryData';
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
  Check,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Briefcase,
  CreditCard,
  Percent,
  PieChart as PieChartIcon,
  ChevronRight,
  SlidersHorizontal,
  CircleDot,
  AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const REPORT_CATEGORIES = [
  { id: 'all', label: 'All Reports & Datasets' },
  { id: 'sales', label: 'Sales & Revenue' },
  { id: 'operations', label: 'Operations & MIS' },
  { id: 'hr', label: 'HR, Payroll & Interns' },
  { id: 'security', label: 'Security & Sessions' }
];

const MONTHS_LIST = [
  { id: 1, name: 'Jan', fullName: 'January' },
  { id: 2, name: 'Feb', fullName: 'February' },
  { id: 3, name: 'Mar', fullName: 'March' },
  { id: 4, name: 'Apr', fullName: 'April' },
  { id: 5, name: 'May', fullName: 'May' },
  { id: 6, name: 'Jun', fullName: 'June' },
  { id: 7, name: 'Jul', fullName: 'July' },
  { id: 8, name: 'Aug', fullName: 'August' },
  { id: 9, name: 'Sep', fullName: 'September' },
  { id: 10, name: 'Oct', fullName: 'October' },
  { id: 11, name: 'Nov', fullName: 'November' },
  { id: 12, name: 'Dec', fullName: 'December' }
];

const ReportsEngine = () => {
  const {
    theme = 'dark',
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

  const isDark = theme === 'dark';

  // Mode Switcher: 'analytics' (Visual Dashboard) vs 'exporter' (CSV batch exports)
  const [viewMode, setViewMode] = useState('analytics');

  // Period Filtering States
  const [periodMode, setPeriodMode] = useState('month'); // 'month' | 'all'
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(10); // default October
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSynced, setLastSynced] = useState(new Date());

  const formatINR = (val) => '₹' + Math.round(Number(val) || 0).toLocaleString('en-IN');

  const fetchAnalytics = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/mis/analytics/financial-summary?period=${periodMode}&year=${selectedYear}&month=${selectedMonth}`);
      if (res.ok) {
        const json = await res.json();
        setAnalyticsData(json);
        setLastSynced(new Date());
      }
    } catch (e) {
      console.warn('Analytics fetch error:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const timer = setInterval(fetchAnalytics, 5000);
    return () => clearInterval(timer);
  }, [periodMode, selectedYear, selectedMonth]);

    // Fallback Baseline Data
  const activeAnalytics = useMemo(() => {
    if (analyticsData) return analyticsData;

    // If future month selected (e.g. Nov/Dec 2026), realized revenue is strictly ₹0
    if (selectedMonth > 10 && selectedYear === 2026) {
      return {
        period: { mode: periodMode, year: selectedYear, month: selectedMonth },
        summary: {
          bookedRevenue: 678000,
          grossInflow: 0,
          totalOutflow: 0,
          netProfit: 0,
          netMarginPct: 0,
          pendingDues: 0,
          totalOrganizations: MIS_CLIENTS_DATA.length,
          isFuture: true,
          notice: 'November 2026 has not started yet. Realized gross inflow is ₹0. Projected pipeline revenue from upcoming deals is ₹6,78,000.',
          upcomingPipeline: 678000,
          confirmedUpcoming: 183000,
          proposalUpcoming: 453000,
          upcomingProjectsCount: 23
        },
        streams: [
          { id: 'upcoming_pipeline', label: 'Upcoming Projects Pipeline (Deals & Proposals)', color: '#a855f7', projectsCount: 23, grossValue: 678000, collected: 0, dues: 678000, isUpcoming: true },
          { id: 'upcoming_won', label: 'Confirmed Upcoming (Closed Won)', color: '#10b981', projectsCount: 7, grossValue: 183000, collected: 0, dues: 183000, isUpcoming: true },
          { id: 'upcoming_proposals', label: 'High Probability In-Review Proposals', color: '#f59e0b', projectsCount: 14, grossValue: 453000, collected: 0, dues: 453000, isUpcoming: true }
        ],
        expenses: [
          { id: 'salaries', label: 'Staff Salaries & Payroll (Projected)', amount: 310000, color: '#f87171', pct: 84 },
          { id: 'ad_spends', label: 'Client Ad Spend Burn (Projected)', amount: 1680, color: '#fbbf24', pct: 0 },
          { id: 'hosting', label: 'Cloud & Server Hosting (Projected)', amount: 18500, color: '#38bdf8', pct: 5 },
          { id: 'tools', label: 'Tools & SaaS Subscriptions (Projected)', amount: 12000, color: '#c084fc', pct: 3 }
        ],
        monthlyTrend: [
          { month: 'May 2026', inflow: 420000, outflow: 345000, profit: 75000 },
          { month: 'Jun 2026', inflow: 465000, outflow: 352000, profit: 113000 },
          { month: 'Jul 2026', inflow: 495000, outflow: 358000, profit: 137000 },
          { month: 'Aug 2026', inflow: 510000, outflow: 362000, profit: 148000 },
          { month: 'Sep 2026', inflow: 525000, outflow: 364000, profit: 161000 },
          { month: 'Oct 2026', inflow: 503977, outflow: 369000, profit: 134977 }
        ],
        deliverables: { reelsPlanned: 90, reelsDelivered: 0, postsPlanned: 180, postsDelivered: 0, rate: 0 }
      };
    }

    const oneTime = MIS_CLIENTS_DATA.filter(c => c.client_type === 'one_time');
    const dm = MIS_CLIENTS_DATA.filter(c => c.client_type === 'active_dm');
    const hosting = MIS_CLIENTS_DATA.filter(c => c.client_type === 'hosting');
    const creative = MIS_CLIENTS_DATA.filter(c => c.client_type !== 'one_time' && c.client_type !== 'active_dm' && c.client_type !== 'hosting');

    const oneTimeGross = oneTime.reduce((a, c) => a + (Number(c.ticket_size) || 0), 0);
    let oneTimeColl = 0;
    let oneTimeDue = 0;
    oneTime.forEach(c => {
      const ticket = Number(c.ticket_size) || 0;
      const adv = Number(c.advance_payment) || 0;
      if (c.payment_status === 'Paid') {
        oneTimeColl += ticket;
      } else {
        oneTimeColl += adv;
        oneTimeDue += Math.max(0, ticket - adv);
      }
    });

    const dmGross = dm.reduce((a, c) => a + (Number(c.ticket_size) || 0), 0);
    const dmDue = dm.filter(c => c.payment_status !== 'Paid').reduce((a, c) => a + (Number(c.ticket_size) || 0), 0);
    const dmColl = dmGross - dmDue;

    const hostingGross = hosting.length * 2500;
    const creativeGross = creative.length * 15000;
    const creativeColl = Math.round(creativeGross * 0.7);
    const creativeDue = creativeGross - creativeColl;

    const grossInflow = oneTimeColl + dmColl + hostingGross + creativeColl;
    const pendingDues = oneTimeDue + dmDue + creativeDue;
    const bookedRevenue = oneTimeGross + dmGross + hostingGross + creativeGross;
    const salaryPayroll = 310000;
    const adSpendTotal = 1680;
    const hostingCost = 18500;
    const softwareTools = 12000;
    const totalOutflow = salaryPayroll + adSpendTotal + hostingCost + softwareTools;
    const netProfit = grossInflow - totalOutflow;
    const netMarginPct = grossInflow > 0 ? ((netProfit / grossInflow) * 100).toFixed(1) : 0;

    return {
      period: { mode: periodMode, year: selectedYear, month: selectedMonth },
      summary: {
        bookedRevenue,
        grossInflow,
        totalOutflow,
        netProfit,
        netMarginPct: parseFloat(netMarginPct),
        pendingDues,
        totalOrganizations: MIS_CLIENTS_DATA.length
      },
      streams: [
        { id: 'one_time', label: 'One-Time Tech & Dev', color: '#818cf8', projectsCount: oneTime.length, grossValue: oneTimeGross, collected: oneTimeColl, dues: oneTimeDue },
        { id: 'active_dm', label: 'Monthly DM Retainers', color: '#34d399', projectsCount: dm.length, grossValue: dmGross, collected: dmColl, dues: dmDue },
        { id: 'hosting', label: 'Hosting & Cloud Servers', color: '#38bdf8', projectsCount: hosting.length, grossValue: hostingGross, collected: hostingGross, dues: 0 },
        { id: 'creative', label: 'Creative & Graphic Design', color: '#f59e0b', projectsCount: creative.length, grossValue: creativeGross, collected: creativeColl, dues: creativeDue }
      ],
      expenses: [
        { id: 'salaries', label: 'Staff Salaries & Payroll', amount: salaryPayroll, color: '#f87171', pct: Math.round((salaryPayroll / totalOutflow) * 100) },
        { id: 'ad_spends', label: 'Client Ad Spend Burn', amount: adSpendTotal, color: '#fbbf24', pct: Math.round((adSpendTotal / totalOutflow) * 100) },
        { id: 'hosting', label: 'Cloud & Server Hosting', amount: hostingCost, color: '#38bdf8', pct: Math.round((hostingCost / totalOutflow) * 100) },
        { id: 'tools', label: 'Tools & SaaS Subscriptions', amount: softwareTools, color: '#c084fc', pct: Math.round((softwareTools / totalOutflow) * 100) }
      ],
      monthlyTrend: [
        { month: 'May 2026', inflow: 420000, outflow: 345000, profit: 75000 },
        { month: 'Jun 2026', inflow: 465000, outflow: 352000, profit: 113000 },
        { month: 'Jul 2026', inflow: 495000, outflow: 358000, profit: 137000 },
        { month: 'Aug 2026', inflow: 510000, outflow: 362000, profit: 148000 },
        { month: 'Sep 2026', inflow: 525000, outflow: 364000, profit: 161000 },
        { month: 'Oct 2026', inflow: grossInflow, outflow: totalOutflow, profit: netProfit }
      ],
      deliverables: { reelsPlanned: 90, reelsDelivered: 82, postsPlanned: 180, postsDelivered: 168, rate: 92.5 }
    };
  }, [analyticsData, periodMode, selectedYear, selectedMonth]);

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
      'Project Name': e.projectName || e.clientProject || '—',
      'Editor Name': e.editorName,
      'Email': e.email || '',
      'Task Description': e.taskDescription,
      'Task Assigned Date': e.taskAssignedDate || e.assignedDate || '—',
      'Status / Stage': e.status,
      'Completed Date': e.completedDate || '',
      'Deadline': e.submissionDate,
      'Payout Amount (₹)': e.amount || 0,
      'Payment Status': e.paymentStatus
    }));
    downloadCSV(rows, ['Task ID', 'Project Name', 'Editor Name', 'Email', 'Task Description', 'Task Assigned Date', 'Status / Stage', 'Completed Date', 'Deadline', 'Payout Amount (₹)', 'Payment Status'], `AstraCRM_Editor_Work_Orders_Report_${currentYear}.csv`);
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
  }, [activeCategory, searchQuery]);

  const selectedMonthObj = MONTHS_LIST.find(m => m.id === selectedMonth) || MONTHS_LIST[9];
  const isAllTime = periodMode === 'all';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

      {/* Top View Mode Switcher Pills */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          paddingBottom: '4px'
        }}
      >
        <div style={{ display: 'flex', gap: '8px', background: isDark ? '#16161c' : '#F1F4F9', padding: '4px', borderRadius: '12px', border: isDark ? '1px solid #23232b' : '1px solid #E2E8F0' }}>
          <button
            onClick={() => setViewMode('analytics')}
            style={{
              padding: '8px 18px',
              borderRadius: '9px',
              border: 'none',
              background: viewMode === 'analytics' ? '#4E3EFF' : 'transparent',
              color: viewMode === 'analytics' ? '#FFFFFF' : (isDark ? '#94A3B8' : '#64748B'),
              fontSize: '0.8rem',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s ease'
            }}
          >
            <BarChart3 style={{ width: '15px', height: '15px' }} />
            <span>Visual Analytics & Financial Suite</span>
          </button>

          <button
            onClick={() => setViewMode('exporter')}
            style={{
              padding: '8px 18px',
              borderRadius: '9px',
              border: 'none',
              background: viewMode === 'exporter' ? '#4E3EFF' : 'transparent',
              color: viewMode === 'exporter' ? '#FFFFFF' : (isDark ? '#94A3B8' : '#64748B'),
              fontSize: '0.8rem',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s ease'
            }}
          >
            <FileSpreadsheet style={{ width: '15px', height: '15px' }} />
            <span>Dataset Exporters (Batch CSV)</span>
          </button>
        </div>

        {/* Live Database Sync Status Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: isDark ? '#94A3B8' : '#64748B', fontWeight: '600' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)' }} />
            <span>Central Database Live Synced</span>
          </div>

          <button
            onClick={fetchAnalytics}
            disabled={isRefreshing}
            style={{
              background: isDark ? '#1a1a22' : '#F1F4F9',
              border: isDark ? '1px solid #282834' : '1px solid #E2E8F0',
              color: isDark ? '#F9FAFB' : '#1E293B',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '0.74rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw style={{ width: '12px', height: '12px', animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
            <span>{isRefreshing ? 'Refreshing...' : 'Live Sync'}</span>
          </button>
        </div>
      </div>

      {viewMode === 'analytics' ? (
        /* ================= 1. VISUAL ANALYTICS & FINANCIAL SUITE ================= */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Period Filter Ribbon */}
          <div
            style={{
              background: isDark ? '#121216' : '#FFFFFF',
              border: isDark ? '1px solid #23232b' : '1px solid #EEF2F6',
              borderRadius: '18px',
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '14px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: '800', color: isDark ? '#94A3B8' : '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Period View:
              </span>

              <div style={{ display: 'flex', gap: '4px', background: isDark ? '#1c1c24' : '#F1F4F9', padding: '3px', borderRadius: '8px' }}>
                <button
                  onClick={() => setPeriodMode('month')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: periodMode === 'month' ? '#4E3EFF' : 'transparent',
                    color: periodMode === 'month' ? '#FFFFFF' : (isDark ? '#94A3B8' : '#64748B'),
                    fontSize: '0.74rem',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Month-Wise Report
                </button>
                <button
                  onClick={() => setPeriodMode('all')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: periodMode === 'all' ? '#4E3EFF' : 'transparent',
                    color: periodMode === 'all' ? '#FFFFFF' : (isDark ? '#94A3B8' : '#64748B'),
                    fontSize: '0.74rem',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  All-Time Lifetime Report
                </button>
              </div>

              {/* Year Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '6px' }}>
                <span style={{ fontSize: '0.74rem', color: isDark ? '#94A3B8' : '#64748B', fontWeight: '700' }}>Year:</span>
                <select
                  value={selectedYear}
                  onChange={e => setSelectedYear(parseInt(e.target.value, 10))}
                  style={{
                    background: isDark ? '#1c1c24' : '#F1F4F9',
                    border: isDark ? '1px solid #282834' : '1px solid #E2E8F0',
                    color: isDark ? '#FFFFFF' : '#1E293B',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '0.76rem',
                    fontWeight: '700',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value={2026}>2026</option>
                  <option value={2025}>2025</option>
                  <option value={2024}>2024</option>
                </select>
              </div>
            </div>

            {/* Month Selection Buttons (Only in Month-Wise mode) */}
            {periodMode === 'month' && (
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                {MONTHS_LIST.map(m => {
                  const isSel = selectedMonth === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMonth(m.id)}
                      style={{
                        padding: '4px 9px',
                        borderRadius: '6px',
                        border: isSel ? '1px solid #4E3EFF' : (isDark ? '1px solid #262632' : '1px solid #E2E8F0'),
                        background: isSel ? '#4E3EFF' : (isDark ? '#181820' : '#FFFFFF'),
                        color: isSel ? '#FFFFFF' : (isDark ? '#94A3B8' : '#64748B'),
                        fontSize: '0.72rem',
                        fontWeight: isSel ? '800' : '600',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {m.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Informative Banner for Future Months */}
          {activeAnalytics.summary.isFuture && (
            <div
              style={{
                background: isDark ? 'rgba(168, 85, 247, 0.12)' : '#FAF5FF',
                border: isDark ? '1px solid rgba(168, 85, 247, 0.35)' : '1px solid #E9D5FF',
                borderRadius: '16px',
                padding: '14px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                marginBottom: '16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertCircle style={{ width: '18px', height: '18px', color: '#A855F7', flexShrink: 0 }} />
                <span style={{ fontSize: '0.8rem', color: isDark ? '#E9D5FF' : '#581C87', fontWeight: '600' }}>
                  <strong>{selectedMonthObj.fullName} {selectedYear} has not started yet.</strong> Realized gross inflow is strictly <strong>₹0</strong>. Showing projected upcoming pipeline revenue generated from confirmed and high-probability deals.
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ background: '#A855F7', color: '#FFFFFF', padding: '4px 12px', borderRadius: '9999px', fontSize: '0.74rem', fontWeight: '800' }}>
                  Upcoming Pipeline: {formatINR(activeAnalytics.summary.upcomingPipeline || 678000)}
                </span>
              </div>
            </div>
          )}

          {/* 5 Pastel KPI Cards matching Verion Design System */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>

            {/* Card 1: Gross Inflow */}
            <div
              style={{
                background: isDark ? '#121216' : '#ECFDF5',
                border: isDark ? '1px solid #23232b' : '1px solid #A7F3D0',
                borderRadius: '20px',
                padding: '20px 22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {isAllTime ? 'LIFETIME SALES INFLOW' : `GROSS INFLOW (${selectedMonthObj.name.toUpperCase()} ${selectedYear})`}
                </span>
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#FFFFFF', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(16, 185, 129, 0.15)' }}>
                  <TrendingUp style={{ width: '16px', height: '16px' }} />
                </div>
              </div>
              <div style={{ margin: '14px 0 4px 0' }}>
                <div style={{ fontSize: '1.9rem', fontWeight: '900', color: '#059669', lineHeight: 1.1 }}>
                  {formatINR(activeAnalytics.summary.grossInflow)}
                </div>
                <div style={{ fontSize: '0.72rem', color: isDark ? '#94A3B8' : '#64748B', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{isAllTime ? 'Total Lifetime Realized' : 'Collected advances & retainers'}</span>
                  {activeAnalytics.summary.bookedRevenue && (
                    <span style={{ fontWeight: '700', color: isDark ? '#cbd5e1' : '#334155' }}>
                      {isAllTime ? 'Booked: ' : 'Booked: '}{formatINR(activeAnalytics.summary.bookedRevenue)}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: '700', paddingTop: '8px', borderTop: '1px solid rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ArrowUpRight style={{ width: '13px', height: '13px' }} />
                <span>Across {activeAnalytics.summary.totalOrganizations || 62} client organizations</span>
              </div>
            </div>

            {/* Card 2: Total Agency Outflow */}
            <div
              style={{
                background: isDark ? '#121216' : '#FFF1F2',
                border: isDark ? '1px solid #23232b' : '1px solid #FECDD3',
                borderRadius: '20px',
                padding: '20px 22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: '#E11D48', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {isAllTime ? 'LIFETIME AGENCY OUTFLOW' : `TOTAL OUTFLOW (${selectedMonthObj.name.toUpperCase()} ${selectedYear})`}
                </span>
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#FFFFFF', color: '#E11D48', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(225, 29, 72, 0.15)' }}>
                  <Wallet style={{ width: '16px', height: '16px' }} />
                </div>
              </div>
              <div style={{ margin: '14px 0 4px 0' }}>
                <div style={{ fontSize: '1.9rem', fontWeight: '900', color: '#E11D48', lineHeight: 1.1 }}>
                  {formatINR(activeAnalytics.summary.totalOutflow)}
                </div>
                <div style={{ fontSize: '0.72rem', color: isDark ? '#94A3B8' : '#64748B', marginTop: '4px' }}>
                  {isAllTime ? 'Lifetime Salaries + Ads + Hosting + Tools' : 'Salaries + Ad Spend + Hosting + Tools'}
                </div>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#E11D48', fontWeight: '700', paddingTop: '8px', borderTop: '1px solid rgba(225, 29, 72, 0.15)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <DollarSign style={{ width: '13px', height: '13px' }} />
                <span>Salaries: {formatINR(activeAnalytics.expenses[0]?.amount || 310000)}</span>
              </div>
            </div>

            {/* Card 3: Net Profit */}
            <div
              style={{
                background: isDark ? '#121216' : '#EEF2FF',
                border: isDark ? '1px solid #23232b' : '1px solid #C7D2FE',
                borderRadius: '20px',
                padding: '20px 22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: '#4E3EFF', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {isAllTime ? 'LIFETIME NET PROFIT' : `NET PROFIT (${selectedMonthObj.name.toUpperCase()} ${selectedYear})`}
                </span>
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#FFFFFF', color: '#4E3EFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(78, 62, 255, 0.15)' }}>
                  <Percent style={{ width: '16px', height: '16px' }} />
                </div>
              </div>
              <div style={{ margin: '14px 0 4px 0' }}>
                <div style={{ fontSize: '1.9rem', fontWeight: '900', color: activeAnalytics.summary.netProfit >= 0 ? '#4E3EFF' : '#E11D48', lineHeight: 1.1 }}>
                  {formatINR(activeAnalytics.summary.netProfit)}
                </div>
                <div style={{ fontSize: '0.72rem', color: isDark ? '#94A3B8' : '#64748B', marginTop: '4px' }}>
                  Net Margin: <strong>{activeAnalytics.summary.netMarginPct}%</strong>
                </div>
              </div>
              <div style={{ fontSize: '0.72rem', color: activeAnalytics.summary.netProfit >= 0 ? '#4E3EFF' : '#E11D48', fontWeight: '700', paddingTop: '8px', borderTop: activeAnalytics.summary.netProfit >= 0 ? '1px solid rgba(78, 62, 255, 0.15)' : '1px solid rgba(225, 29, 72, 0.15)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {activeAnalytics.summary.netProfit >= 0 ? (
                  <>
                    <CheckCircle2 style={{ width: '13px', height: '13px' }} />
                    <span>Operating margin positive</span>
                  </>
                ) : (
                  <>
                    <AlertCircle style={{ width: '13px', height: '13px' }} />
                    <span>Cash deficit: pending collections</span>
                  </>
                )}
              </div>
            </div>

            {/* Card 4: Pending Dues */}
            <div
              style={{
                background: isDark ? '#121216' : '#FEFCE8',
                border: isDark ? '1px solid #23232b' : '1px solid #FEF08A',
                borderRadius: '20px',
                padding: '20px 22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: '#CA8A04', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {isAllTime ? 'ACTIVE RECEIVABLES' : `PENDING RECEIVABLES (${selectedMonthObj.name.toUpperCase()})`}
                </span>
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#FFFFFF', color: '#CA8A04', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(202, 138, 4, 0.15)' }}>
                  <Clock style={{ width: '16px', height: '16px' }} />
                </div>
              </div>
              <div style={{ margin: '14px 0 4px 0' }}>
                <div style={{ fontSize: '1.9rem', fontWeight: '900', color: '#CA8A04', lineHeight: 1.1 }}>
                  {formatINR(activeAnalytics.summary.pendingDues)}
                </div>
                <div style={{ fontSize: '0.72rem', color: isDark ? '#94A3B8' : '#64748B', marginTop: '4px' }}>
                  Uncollected balances & dues
                </div>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#CA8A04', fontWeight: '700', paddingTop: '8px', borderTop: '1px solid rgba(202, 138, 4, 0.15)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertCircle style={{ width: '13px', height: '13px' }} />
                <span>Requires account manager action</span>
              </div>
            </div>

            {/* Card 5: Upcoming Projects Pipeline */}
            <div
              style={{
                background: isDark ? '#121216' : '#FAF5FF',
                border: isDark ? '1px solid #23232b' : '1px solid #E9D5FF',
                borderRadius: '20px',
                padding: '20px 22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: '#9333EA', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  UPCOMING PIPELINE REVENUE
                </span>
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#FFFFFF', color: '#9333EA', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(147, 51, 234, 0.15)' }}>
                  <Briefcase style={{ width: '16px', height: '16px' }} />
                </div>
              </div>
              <div style={{ margin: '14px 0 4px 0' }}>
                <div style={{ fontSize: '1.9rem', fontWeight: '900', color: '#9333EA', lineHeight: 1.1 }}>
                  {formatINR(activeAnalytics.summary.upcomingPipeline || 678000)}
                </div>
                <div style={{ fontSize: '0.72rem', color: isDark ? '#94A3B8' : '#64748B', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Active Upcoming: {formatINR(activeAnalytics.summary.upcomingPipeline || 0)}</span>
                  <span style={{ fontWeight: '700', color: isDark ? '#cbd5e1' : '#334155' }}>
                    {activeAnalytics.summary.upcomingProjectsCount || 0} Project{(activeAnalytics.summary.upcomingProjectsCount === 1) ? '' : 's'}
                  </span>
                </div>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#9333EA', fontWeight: '700', paddingTop: '8px', borderTop: '1px solid rgba(147, 51, 234, 0.15)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ArrowUpRight style={{ width: '13px', height: '13px' }} />
                <span>Across {activeAnalytics.summary.upcomingProjectsCount || 0} upcoming project{(activeAnalytics.summary.upcomingProjectsCount === 1) ? '' : 's'} in CRM</span>
              </div>
            </div>

          </div>

          {/* Visual Charts Grid (2 columns) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>

            {/* Chart 1: Revenue by Project Stream */}
            <div
              style={{
                background: isDark ? '#121216' : '#FFFFFF',
                borderRadius: '22px',
                border: isDark ? '1px solid #23232b' : '1px solid #EEF2F6',
                padding: '22px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '900', margin: 0, color: isDark ? '#F9FAFB' : '#1E1F24' }}>
                    Revenue by Project Stream
                  </h3>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
                    One-Time Dev, Retainers, Hosting, and Creative
                  </div>
                </div>
                <PieChartIcon style={{ width: '18px', height: '18px', color: '#818cf8' }} />
              </div>

              <div style={{ height: '220px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={activeAnalytics.streams}
                      dataKey="grossValue"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                    >
                      {activeAnalytics.streams.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatINR(value)}
                      contentStyle={{ background: '#1c1c24', border: '1px solid #2d2d38', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700', color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Stream Legend List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                {activeAnalytics.streams.map(st => (
                  <div key={st.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem', padding: '6px 8px', borderRadius: '8px', background: isDark ? '#181820' : '#F8FAFC' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: st.color }} />
                      <span style={{ fontWeight: '700', color: isDark ? '#F9FAFB' : '#1E293B' }}>{st.label}</span>
                      <span style={{ fontSize: '0.68rem', color: '#94A3B8' }}>({st.projectsCount} orgs)</span>
                    </div>
                    <div style={{ fontWeight: '800', color: isDark ? '#F9FAFB' : '#1E293B' }}>
                      {formatINR(st.grossValue)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 2: Agency Expenses Breakdown */}
            <div
              style={{
                background: isDark ? '#121216' : '#FFFFFF',
                borderRadius: '22px',
                border: isDark ? '1px solid #23232b' : '1px solid #EEF2F6',
                padding: '22px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '900', margin: 0, color: isDark ? '#F9FAFB' : '#1E1F24' }}>
                    Agency Outflows & Expense Split
                  </h3>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
                    Salaries, Client Ads, Hosting, and Tools
                  </div>
                </div>
                <Wallet style={{ width: '18px', height: '18px', color: '#f87171' }} />
              </div>

              <div style={{ height: '220px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={activeAnalytics.expenses}
                      dataKey="amount"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                    >
                      {activeAnalytics.expenses.map((entry, idx) => (
                        <Cell key={`exp-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatINR(value)}
                      contentStyle={{ background: '#1c1c24', border: '1px solid #2d2d38', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700', color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Expense Legend List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                {activeAnalytics.expenses.map(ex => (
                  <div key={ex.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem', padding: '6px 8px', borderRadius: '8px', background: isDark ? '#181820' : '#F8FAFC' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: ex.color }} />
                      <span style={{ fontWeight: '700', color: isDark ? '#F9FAFB' : '#1E293B' }}>{ex.label}</span>
                      <span style={{ fontSize: '0.68rem', color: '#94A3B8' }}>({ex.pct}%)</span>
                    </div>
                    <div style={{ fontWeight: '800', color: isDark ? '#F9FAFB' : '#1E293B' }}>
                      {formatINR(ex.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Full-Width Rolling Financial Performance Bar Chart */}
          <div
            style={{
              background: isDark ? '#121216' : '#FFFFFF',
              borderRadius: '22px',
              border: isDark ? '1px solid #23232b' : '1px solid #EEF2F6',
              padding: '24px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '900', margin: 0, color: isDark ? '#F9FAFB' : '#1E1F24' }}>
                  Monthly Inflow vs Outflow Performance Trend
                </h3>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
                  Historical 6-month gross realized inflow vs total agency burn
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.72rem', fontWeight: '700' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#34d399' }} />
                  <span style={{ color: isDark ? '#F9FAFB' : '#1E293B' }}>Inflow (Revenue)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#f87171' }} />
                  <span style={{ color: isDark ? '#F9FAFB' : '#1E293B' }}>Outflow (Expenses)</span>
                </div>
              </div>
            </div>

            <div style={{ height: '280px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activeAnalytics.monthlyTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} />
                  <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickFormatter={(val) => `₹${val / 1000}k`} tickLine={false} />
                  <Tooltip
                    formatter={(value) => formatINR(value)}
                    contentStyle={{ background: '#1c1c24', border: '1px solid #2d2d38', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700', color: '#fff' }}
                  />
                  <Bar dataKey="inflow" name="Gross Inflow" fill="#34d399" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="outflow" name="Total Outflow" fill="#f87171" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2-Column Ledger Tables */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '20px' }}>

            {/* Left: Project Streams Performance Ledger */}
            <div
              style={{
                background: isDark ? '#121216' : '#FFFFFF',
                borderRadius: '22px',
                border: isDark ? '1px solid #23232b' : '1px solid #EEF2F6',
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
              }}
            >
              <div style={{ padding: '18px 20px', borderBottom: isDark ? '1px solid #23232b' : '1px solid #F1F4F9' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '900', margin: 0, color: isDark ? '#F9FAFB' : '#1E1F24' }}>
                  Project Stream Financial Ledger
                </h4>
                <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '2px' }}>
                  Breakdown by client categorization and contract type
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.74rem' }}>
                  <thead>
                    <tr style={{ background: isDark ? '#181820' : '#F8FAFC', borderBottom: isDark ? '1px solid #23232b' : '1px solid #E2E8F0' }}>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: '800', color: '#94A3B8' }}>STREAM</th>
                      <th style={{ padding: '10px 10px', textAlign: 'center', fontWeight: '800', color: '#94A3B8' }}>ORGS</th>
                      <th style={{ padding: '10px 10px', textAlign: 'right', fontWeight: '800', color: '#94A3B8' }}>GROSS</th>
                      <th style={{ padding: '10px 10px', textAlign: 'right', fontWeight: '800', color: '#94A3B8' }}>COLLECTED</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '800', color: '#94A3B8' }}>PENDING DUE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeAnalytics.streams.map(st => (
                      <tr key={st.id} style={{ borderBottom: isDark ? '1px solid #1c1c24' : '1px solid #F1F4F9' }}>
                        <td style={{ padding: '11px 14px', fontWeight: '800', color: isDark ? '#F9FAFB' : '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: st.color }} />
                          <span>{st.label}</span>
                        </td>
                        <td style={{ padding: '11px 10px', textAlign: 'center', fontWeight: '700', color: '#94A3B8' }}>
                          {st.projectsCount}
                        </td>
                        <td style={{ padding: '11px 10px', textAlign: 'right', fontWeight: '700', color: isDark ? '#F9FAFB' : '#1E293B' }}>
                          {formatINR(st.grossValue)}
                        </td>
                        <td style={{ padding: '11px 10px', textAlign: 'right', fontWeight: '800', color: '#34d399' }}>
                          {formatINR(st.collected)}
                        </td>
                        <td style={{ padding: '11px 14px', textAlign: 'right', fontWeight: '800', color: st.dues > 0 ? '#f87171' : '#94A3B8' }}>
                          {st.dues > 0 ? formatINR(st.dues) : 'None'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Agency Expense Department Ledger */}
            <div
              style={{
                background: isDark ? '#121216' : '#FFFFFF',
                borderRadius: '22px',
                border: isDark ? '1px solid #23232b' : '1px solid #EEF2F6',
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
              }}
            >
              <div style={{ padding: '18px 20px', borderBottom: isDark ? '1px solid #23232b' : '1px solid #F1F4F9' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '900', margin: 0, color: isDark ? '#F9FAFB' : '#1E1F24' }}>
                  Agency Expense & Department Ledger
                </h4>
                <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '2px' }}>
                  Cross-departmental live outflow linked from all team members
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.74rem' }}>
                  <thead>
                    <tr style={{ background: isDark ? '#181820' : '#F8FAFC', borderBottom: isDark ? '1px solid #23232b' : '1px solid #E2E8F0' }}>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: '800', color: '#94A3B8' }}>EXPENSE CATEGORY</th>
                      <th style={{ padding: '10px 10px', textAlign: 'right', fontWeight: '800', color: '#94A3B8' }}>MONTHLY BURN</th>
                      <th style={{ padding: '10px 10px', textAlign: 'center', fontWeight: '800', color: '#94A3B8' }}>SHARE</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '800', color: '#94A3B8' }}>RESPONSIBLE DEPARTMENT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeAnalytics.expenses.map(ex => (
                      <tr key={ex.id} style={{ borderBottom: isDark ? '1px solid #1c1c24' : '1px solid #F1F4F9' }}>
                        <td style={{ padding: '11px 14px', fontWeight: '800', color: isDark ? '#F9FAFB' : '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: ex.color }} />
                          <span>{ex.label}</span>
                        </td>
                        <td style={{ padding: '11px 10px', textAlign: 'right', fontWeight: '800', color: '#f87171' }}>
                          {formatINR(ex.amount)}
                        </td>
                        <td style={{ padding: '11px 10px', textAlign: 'center', fontWeight: '700', color: '#94A3B8' }}>
                          {ex.pct}%
                        </td>
                        <td style={{ padding: '11px 14px', textAlign: 'right', fontWeight: '700', color: isDark ? '#cbd5e1' : '#475569' }}>
                          {ex.id === 'salaries' ? 'HR / Payroll Register (12 Staff)' :
                           ex.id === 'ad_spends' ? 'Digital Marketing (Meta/Google)' :
                           ex.id === 'hosting' ? 'IT / Hosting & VPS Vault' : 'Management / Tool Subscriptions'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Operational Deliverables Gauge */}
          <div
            style={{
              background: isDark ? '#121216' : '#FFFFFF',
              borderRadius: '22px',
              border: isDark ? '1px solid #23232b' : '1px solid #EEF2F6',
              padding: '20px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
            }}
          >
            <div>
              <div style={{ fontSize: '0.72rem', color: '#818cf8', fontWeight: '800', textTransform: 'uppercase' }}>
                Operational Deliverables Throughput
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: '900', margin: '3px 0 0', color: isDark ? '#F9FAFB' : '#1E1F24' }}>
                Reels & Graphic Assets Completion Rate: {activeAnalytics.deliverables?.rate || 92}%
              </h4>
            </div>

            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <span style={{ fontSize: '0.68rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: '700' }}>Reels Delivered</span>
                <div style={{ fontSize: '0.95rem', fontWeight: '900', color: '#34d399' }}>
                  {activeAnalytics.deliverables?.reelsDelivered || 82} / {activeAnalytics.deliverables?.reelsPlanned || 90}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.68rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: '700' }}>Graphic Posts Delivered</span>
                <div style={{ fontSize: '0.95rem', fontWeight: '900', color: '#38bdf8' }}>
                  {activeAnalytics.deliverables?.postsDelivered || 168} / {activeAnalytics.deliverables?.postsPlanned || 180}
                </div>
              </div>
            </div>
          </div>

        </div>
      ) : (
        /* ================= 2. DATASET EXPORTERS (BATCH CSV) ================= */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

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
      )}
    </div>
  );
};

export default ReportsEngine;
