import React, { useState, useMemo, useRef } from 'react';
import { useCRM } from '../../context/CRMContext';
import { 
  Award, Plus, Edit2, Trash2, X, Download, Star, Target, Users, TrendingUp, Trophy, Search, 
  Cake, Gift, Heart, PartyPopper, Calendar, Upload, FileSpreadsheet, Crown, CheckCircle2, 
  AlertCircle, Sparkles, Medal, ArrowUpRight, BarChart3, RefreshCw, Eye, ThumbsUp
} from 'lucide-react';
import { exportToCSV } from '../../utils/csvExporter';
import { parsePerformanceSpreadsheet, downloadOfficialPerformanceTemplate } from '../../utils/sheetParser';
import { calculateEmployeePerformance, rankEmployeesForEOTM, ROLE_BENCHMARKS } from '../../utils/kpiEngine';
import {
  getMonthBirthdays,
  formatBirthday,
  isBirthdayToday,
  isBirthdayInMonth,
  MONTH_NAMES
} from '../../utils/birthdayUtils';

const INITIAL_ROLE_KPIS = [
  {
    role: 'Sales Executive',
    department: 'Sales & Growth',
    iconColor: '#3b82f6',
    kpis: [
      '15 Leads Qualified / Month',
      '80% Call Follow-up Rate',
      '3 Deals Closed / Month',
      '₹2L Revenue Target'
    ]
  },
  {
    role: 'Content Specialist',
    department: 'Content & Social',
    iconColor: '#ec4899',
    kpis: [
      '12 Reels / Month',
      '20 Posts / Month',
      '95% On-Time Delivery',
      '2 Campaign Launches / Month'
    ]
  },
  {
    role: 'Sr. Graphic Designer',
    department: 'Design & Creative',
    iconColor: '#8b5cf6',
    kpis: [
      '40+ Brand Creatives & Social Assets / Month',
      '< 2 Revision Rounds on Client Graphics',
      '100% Brand Guidelines & Typography Adherence',
      'Same-Day Turnaround for Ad Creatives & Thumbnails',
      'High Visual Engagement Rating (> 4.5/5)'
    ]
  },
  {
    role: 'Software Intern',
    department: 'Engineering & Tech',
    iconColor: '#06b6d4',
    kpis: [
      '15+ PRs & Feature Tasks Merged / Month',
      '100% Code Standards & Lint Quality Adherence',
      'Daily Work Log & Weekly Progress Submission',
      '< 48hr Bug Resolution on Assigned Tickets',
      'Active Participation in Sprint Standups & Demos'
    ]
  },
  {
    role: 'Software Developer',
    department: 'Engineering & Tech',
    iconColor: '#10b981',
    kpis: [
      'Sprint Feature Velocity > 90%',
      '< 2% Production Bugs on Shipped Code',
      'Code Review & Architecture Compliance',
      'Zero Server & API Downtime (< 99.9% Uptime)'
    ]
  },
  {
    role: 'Digital Marketer',
    department: 'Paid Media & SEO',
    iconColor: '#f59e0b',
    kpis: [
      'Campaign ROAS > 3.5x on Active Ad Sets',
      'Cost Per Lead (CPL) Target Met (< ₹500)',
      'Daily Ad Spend Reconciliations & Ledger Logging',
      'CTR > 2.5% on Meta & Google Ads'
    ]
  },
  {
    role: 'Video Editor',
    department: 'Media & Production',
    iconColor: '#f43f5e',
    kpis: [
      '4 Reels / Week',
      '< 2 Revision Rounds',
      'Delivery by Deadline',
      'HD / 4K Quality Standard & Color Grading'
    ]
  },
  {
    role: 'Operations Head',
    department: 'Operations & Delivery',
    iconColor: '#6366f1',
    kpis: [
      '100% Client SLA Adherence',
      '< 24hr Ticket Resolution',
      '0 Server Downtime',
      'Monthly MIS Report & Deliverables Audit'
    ]
  },
  {
    role: 'HR Manager',
    department: 'Human Resources',
    iconColor: '#14b8a6',
    kpis: [
      'Payroll Processed by 1st of Every Month',
      'Attendance Accuracy 100%',
      'Monthly Performance Reviews Completed',
      'Internship Evaluations & Certificates Issued'
    ]
  },
];

const PerformanceBoard = () => {
  const { performanceEvaluations = [], addPerformanceEvaluation, updatePerformanceEvaluation, deletePerformanceEvaluation,
          batchAddPerformanceEvaluations,
          eotmNominations = [], addEOTMNomination, deleteEOTMNomination,
          eotmLeaderboards = {}, saveMonthlyEOTMLeaderboard,
          employees = [], interns = [] } = useCRM();

  const [activeTab, setActiveTab] = useState('evaluations');
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [showEOTMModal, setShowEOTMModal] = useState(false);
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [editingEval, setEditingEval] = useState(null);
  const [searchQ, setSearchQ] = useState('');
  const [bdayMonth, setBdayMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [wishedStaffIds, setWishedStaffIds] = useState([]);

  // === EOTM Automated Ingestion & Leaderboard State ===
  const [eotmPeriod, setEotmPeriod] = useState('August 2026');
  const [eotmDeptFilter, setEotmDeptFilter] = useState('all');
  const [eotmSearch, setEotmSearch] = useState('');
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [parseError, setParseError] = useState(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [parsedPreviewRecords, setParsedPreviewRecords] = useState([]);
  const [syncToEvaluationsCheck, setSyncToEvaluationsCheck] = useState(true);
  const [uploadToast, setUploadToast] = useState(null);
  const [viewingBreakdownRecord, setViewingBreakdownRecord] = useState(null);
  const fileInputRef = useRef(null);

  // Baseline real records derived from Google Spreadsheet (August 2026)
  const INITIAL_AUGUST_RECORDS = useMemo(() => [
    {
      employeeId: 'EMP-SANNA-015',
      employeeName: 'Smitesh Pokharkar',
      workEmail: 'smitesh.pokharkar28@gmail.com',
      role: 'Software Developer Intern',
      department: 'Engineering & Development',
      month: 'August 2026',
      year: 2026,
      kpi_1: 28,     // 28 PRs (Target 20)
      kpi_2: 2.5,    // 2.5h bug turnaround (Target 12h)
      kpi_3: 96,     // 96% approval (Target 80%)
      kpi_4: 98,     // 98% task speed (Target 90%)
      taskCompletionRate: 118,
      qualityScore: 9.5,
      peerReview: 10,
      attendance: 10,
      notes: 'Spearheaded mission-critical production upgrades, resolved client tickets within 2.5 hours, and merged 28 production PRs.'
    },
    {
      employeeId: 'empsi07',
      employeeName: 'Riya Biswas Dasgupta',
      workEmail: 'riya@sannainnovations.com',
      role: 'Graphic Designer',
      department: 'Creative Design & Branding',
      month: 'August 2026',
      year: 2026,
      kpi_1: 40,     // 40 assets (Target 40)
      kpi_2: 2.5,    // 2-3 revision rounds (Target 2)
      kpi_3: 98,     // 98% approval (Target 90%)
      kpi_4: 9.5,    // 9.5 design quality (Target 9.0)
      taskCompletionRate: 100,
      qualityScore: 10,
      peerReview: 9,
      attendance: 10,
      notes: 'Executed 40 comprehensive brand asset packages with near-flawless client approval and exceptional visual aesthetics.'
    },
    {
      employeeId: 'empsi03',
      employeeName: 'Sowmya S',
      workEmail: 'sowmya.s@sannainnovations.com',
      role: 'Web Developer',
      department: 'Engineering & Web Solutions',
      month: 'August 2026',
      year: 2026,
      kpi_1: 98,     // 98% on-time (Target 95%)
      kpi_2: 9,      // 9 code quality (Target 9.0)
      kpi_3: 95,     // 95% bug-free (Target 90%)
      kpi_4: 9,      // 9 CSAT (Target 9.0)
      taskCompletionRate: 100,
      qualityScore: 9,
      peerReview: 9,
      attendance: 10,
      notes: 'Maintained 100% SLA milestone compliance across web apps with zero production regressions.'
    },
    {
      employeeId: 'EMP-SANNA-001',
      employeeName: 'Sanna Boss',
      workEmail: 'boss@sannainnovations.com',
      role: 'Boss & Main Sales Head',
      department: 'Sales & Executive Leadership',
      month: 'August 2026',
      year: 2026,
      kpi_1: 58500,  // $58,500 revenue vs $50k target
      kpi_2: 28.5,   // 28.5% close vs 25% target
      kpi_3: 95,     // 95% retention vs 92% target
      kpi_4: 8200,   // $8,200 deal vs $7,500 target
      taskCompletionRate: 95,
      qualityScore: 9.4,
      peerReview: 9.2,
      attendance: 9.8,
      notes: 'Surpassed company revenue target by 17% and closed high-ticket enterprise contracts.'
    },
    {
      employeeId: 'EMP-SANNA-021',
      employeeName: 'Yash Deshmukh',
      workEmail: 'yashdesh191@gmail.com',
      role: 'Software Developer Intern',
      department: 'Engineering & Development',
      month: 'August 2026',
      year: 2026,
      kpi_1: 26,
      kpi_2: 6.5,
      kpi_3: 88,
      kpi_4: 96,
      taskCompletionRate: 96,
      qualityScore: 9.3,
      peerReview: 10,
      attendance: 10,
      notes: 'Demonstrated rapid learning curve, shipped 26 PRs with high peer code review commendations.'
    }
  ], []);

  // Compute active monthly leaderboard
  const activeEOTMLeaderboard = useMemo(() => {
    if (eotmLeaderboards && eotmLeaderboards[eotmPeriod] && eotmLeaderboards[eotmPeriod].length > 0) {
      return eotmLeaderboards[eotmPeriod];
    }
    if (eotmPeriod === 'August 2026') {
      return rankEmployeesForEOTM(INITIAL_AUGUST_RECORDS);
    }
    return [];
  }, [eotmLeaderboards, eotmPeriod, INITIAL_AUGUST_RECORDS]);

  const filteredLeaderboard = useMemo(() => {
    return activeEOTMLeaderboard.filter(emp => {
      const matchDept = eotmDeptFilter === 'all' || emp.department === eotmDeptFilter;
      const q = eotmSearch.toLowerCase();
      const matchSearch = !q || (emp.employeeName || '').toLowerCase().includes(q) || (emp.role || '').toLowerCase().includes(q);
      return matchDept && matchSearch;
    });
  }, [activeEOTMLeaderboard, eotmDeptFilter, eotmSearch]);

  const eotmWinner = activeEOTMLeaderboard[0] || null;
  const eotmRunnerUp1 = activeEOTMLeaderboard[1] || null;
  const eotmRunnerUp2 = activeEOTMLeaderboard[2] || null;

  const handleSpreadsheetFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsParsingFile(true);
    setParseError(null);
    try {
      const records = await parsePerformanceSpreadsheet(file);
      if (!records || records.length === 0) {
        throw new Error('No valid employee performance records could be parsed from the file.');
      }
      const ranked = rankEmployeesForEOTM(records);
      setParsedPreviewRecords(ranked);
      if (ranked[0]?.month) {
        setEotmPeriod(ranked[0].month);
      }
      setPreviewModalOpen(true);
    } catch (err) {
      console.error('File parse error:', err);
      setParseError(err.message || 'Error parsing spreadsheet. Please check format.');
    } finally {
      setIsParsingFile(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleConfirmEOTMImport = () => {
    if (parsedPreviewRecords.length === 0) return;
    const period = eotmPeriod || 'August 2026';

    // 1. Save monthly leaderboard
    if (saveMonthlyEOTMLeaderboard) {
      saveMonthlyEOTMLeaderboard(period, parsedPreviewRecords);
    }

    // 2. Crown winner in nominations
    const winner = parsedPreviewRecords[0];
    if (winner && addEOTMNomination) {
      addEOTMNomination({
        employeeName: winner.employeeName,
        role: winner.role,
        month: 8,
        year: 2026,
        reason: `👑 Crowned Employee of the Month via Automated KPI Ingestion. ${winner.aiSummary}`,
        nominatedBy: 'Automated KPI Ingestion Engine',
        score: winner.compositeScore,
        tier: winner.tier
      });
    }

    // 3. Batch sync to performance evaluations
    if (syncToEvaluationsCheck && batchAddPerformanceEvaluations) {
      const evalsToSync = parsedPreviewRecords.map(r => ({
        employeeId: r.employeeId,
        employeeName: r.employeeName,
        role: r.role,
        month: 8,
        year: 2026,
        overallScore: r.scoreOutOf10,
        performanceGrade: r.tierGrade,
        taskDeliveryRate: r.taskVelocity,
        workQuality: r.workQuality,
        peerCollaboration: r.peerReview,
        attendancePunctuality: r.attendance,
        evaluatorComments: r.aiSummary,
        evaluatedBy: 'Automated KPI Engine'
      }));
      batchAddPerformanceEvaluations(evalsToSync);
    }

    setPreviewModalOpen(false);
    setUploadToast(`🎉 Ingestion successful! ${winner.employeeName} crowned Employee of the Month with ${winner.compositeScore}% composite score.`);
    setTimeout(() => setUploadToast(null), 8000);
  };

  const currentMonthBirthdays = useMemo(() => {
    return getMonthBirthdays(employees, bdayMonth, new Date().getFullYear());
  }, [employees, bdayMonth]);

  const allStaffBirthdayRoster = useMemo(() => {
    return [...employees].sort((a, b) => {
      const bA = a.birthday ? a.birthday.slice(5) : '99-99';
      const bB = b.birthday ? b.birthday.slice(5) : '99-99';
      return bA.localeCompare(bB);
    });
  }, [employees]);

  const [roleKPIs, setRoleKPIs] = useState(() => {
    const saved = localStorage.getItem('astra_role_kpis_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INITIAL_ROLE_KPIS;
  });

  React.useEffect(() => {
    try {
      localStorage.setItem('astra_role_kpis_v2', JSON.stringify(roleKPIs));
    } catch (e) {}
  }, [roleKPIs]);

  const [newRoleForm, setNewRoleForm] = useState({
    role: '',
    department: 'Operations & Delivery',
    kpisText: ''
  });

  const ROLE_DEFAULT_TARGETS = {
    'Sr. Graphic Designer': { metric: 'Brand Creatives & Assets', target: 40, unit: 'assets' },
    'Graphic Designer': { metric: 'Brand Creatives & Assets', target: 40, unit: 'assets' },
    'Software Intern': { metric: 'PRs & Feature Tasks Merged', target: 15, unit: 'PRs/tasks' },
    'Software Intern / Trainee': { metric: 'PRs & Feature Tasks Merged', target: 15, unit: 'PRs/tasks' },
    'Data Analyst Intern': { metric: 'MIS Reports & Datasets Processed', target: 20, unit: 'reports' },
    'Intern': { metric: 'Assigned Learning & Work Tasks', target: 20, unit: 'tasks' },
    'Software Developer': { metric: 'Sprint Feature Modules', target: 12, unit: 'modules' },
    'Senior Software Developer': { metric: 'Sprint Feature Modules', target: 12, unit: 'modules' },
    'Web Developer': { metric: 'Client Modules & Websites', target: 10, unit: 'modules' },
    'Digital Marketer': { metric: 'Campaign Lead Conversions', target: 100, unit: 'leads' },
    'Performance Marketer': { metric: 'Campaign Lead Conversions', target: 100, unit: 'leads' },
    'Video Editor': { metric: 'Video Reels & Final Cuts', target: 16, unit: 'reels' },
    'Sales Executive': { metric: 'Qualified Leads & Deals', target: 15, unit: 'deals' },
    'Content Specialist': { metric: 'Content Deliverables (Reels & Posts)', target: 32, unit: 'posts' },
    'Operations Head': { metric: 'SLA Milestone Adherence', target: 100, unit: '%' },
    'HR Manager': { metric: 'HR Compliance & Reviews', target: 100, unit: '%' }
  };

  const getRoleDefaults = (roleName) => {
    if (!roleName) return { metric: 'Role Deliverable Output', target: 20, unit: 'tasks' };
    for (const [key, val] of Object.entries(ROLE_DEFAULT_TARGETS)) {
      if (roleName.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(roleName.toLowerCase())) {
        return val;
      }
    }
    return { metric: 'Role Deliverable Output', target: 20, unit: 'tasks' };
  };

  const computeAutomaticScore = (data) => {
    const target = Math.max(1, parseFloat(data.targetMetricValue) || 1);
    const achieved = parseFloat(data.achievedMetricValue) || 0;
    const achievementRate = Math.round((achieved / target) * 100);
    
    // KPI Output Score (0 - 10)
    const kpiScore = Math.min(10, Math.max(0, (achieved / target) * 10));
    
    // Sliders
    const delivery = (parseFloat(data.taskDeliveryRate) || 0) / 10;
    const quality = parseFloat(data.workQuality) || 7;
    const collab = parseFloat(data.peerCollaboration) || 7;
    const attendance = parseFloat(data.attendancePunctuality) || 8;

    // Composite Formula (35% Target KPI + 25% Delivery Rate + 20% Quality + 10% Collab + 10% Attendance)
    const composite = (kpiScore * 0.35) + (delivery * 0.25) + (quality * 0.20) + (collab * 0.10) + (attendance * 0.10);
    const overall = Math.min(10, Math.max(1, Math.round(composite * 10) / 10));

    let grade = 'Meets Expectations';
    let badgeColor = '#f59e0b';
    let tierIcon = '⭐';
    if (overall >= 9.0) {
      grade = 'Outstanding (Top Performer)';
      badgeColor = '#34d399';
      tierIcon = '🌟';
    } else if (overall >= 8.0) {
      grade = 'Exceeds Expectations';
      badgeColor = '#60a5fa';
      tierIcon = '🟢';
    } else if (overall < 6.5) {
      grade = 'Needs Improvement';
      badgeColor = '#f43f5e';
      tierIcon = '🔴';
    }

    return {
      score: overall,
      achievementRate,
      grade,
      badgeColor,
      tierIcon,
      kpiScore: Math.round(kpiScore * 10) / 10
    };
  };

  const allStaff = useMemo(() => {
    const emps = employees.map(e => ({ id: e.id, name: e.name || e.fullName, role: e.designation || e.role }));
    const ints = interns.map(i => ({ id: i.id, name: i.name || i.fullName, role: 'Software Intern' }));
    return [...emps, ...ints];
  }, [employees, interns]);

  const initialStaff = allStaff[0];
  const initialDefs = getRoleDefaults(initialStaff?.role);
  const initialCalc = computeAutomaticScore({
    targetMetricValue: initialDefs.target,
    achievedMetricValue: initialDefs.target,
    taskDeliveryRate: 85,
    workQuality: 8,
    peerCollaboration: 8,
    attendancePunctuality: 9
  });

  const emptyEval = {
    employeeId: initialStaff?.id || '',
    employeeName: initialStaff?.name || '',
    role: initialStaff?.role || '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    targetMetricName: initialDefs.metric,
    targetMetricValue: initialDefs.target,
    achievedMetricValue: initialDefs.target,
    metricUnit: initialDefs.unit,
    taskDeliveryRate: 85,
    workQuality: 8,
    peerCollaboration: 8,
    attendancePunctuality: 9,
    overallScore: initialCalc.score,
    performanceGrade: initialCalc.grade,
    evaluatorComments: '',
    evaluatedBy: ''
  };

  const [evalForm, setEvalForm] = useState(emptyEval);

  const openEval = (ev = null) => {
    if (ev) {
      const defs = getRoleDefaults(ev.role);
      const data = {
        ...ev,
        targetMetricName: ev.targetMetricName || defs.metric,
        targetMetricValue: ev.targetMetricValue !== undefined ? ev.targetMetricValue : defs.target,
        achievedMetricValue: ev.achievedMetricValue !== undefined ? ev.achievedMetricValue : defs.target,
        metricUnit: ev.metricUnit || defs.unit,
        taskDeliveryRate: ev.taskDeliveryRate || ev.taskCompletionRate || 85,
        workQuality: ev.workQuality || ev.qualityScore || 8,
        peerCollaboration: ev.peerCollaboration || ev.peerReview || 8,
        attendancePunctuality: ev.attendancePunctuality || 9
      };
      const calc = computeAutomaticScore(data);
      setEditingEval(ev);
      setEvalForm({ ...data, overallScore: calc.score, performanceGrade: calc.grade });
    } else {
      setEditingEval(null);
      setEvalForm(emptyEval);
    }
    setShowEvalModal(true);
  };

  const handleStaffChange = (id) => {
    const staff = allStaff.find(s => s.id === id);
    if (staff) {
      const defs = getRoleDefaults(staff.role);
      setEvalForm(f => {
        const next = {
          ...f,
          employeeId: staff.id,
          employeeName: staff.name,
          role: staff.role,
          targetMetricName: defs.metric,
          targetMetricValue: defs.target,
          achievedMetricValue: defs.target,
          metricUnit: defs.unit
        };
        const calc = computeAutomaticScore(next);
        return { ...next, overallScore: calc.score, performanceGrade: calc.grade };
      });
    }
  };

  const updateEvalFormField = (field, value) => {
    setEvalForm(prev => {
      const next = { ...prev, [field]: value };
      const calc = computeAutomaticScore(next);
      return {
        ...next,
        overallScore: calc.score,
        performanceGrade: calc.grade
      };
    });
  };

  const handleEvalSubmit = (e) => {
    e.preventDefault();
    const calc = computeAutomaticScore(evalForm);
    const payload = {
      ...evalForm,
      overallScore: calc.score,
      performanceGrade: calc.grade,
      kpiAchievementRate: calc.achievementRate
    };
    if (editingEval) updatePerformanceEvaluation(editingEval.id, payload);
    else addPerformanceEvaluation(payload);
    setShowEvalModal(false);
  };

  const emptyEOTM = { month: new Date().getMonth() + 1, year: new Date().getFullYear(), employeeName: '', role: '', reason: '', nominatedBy: '' };
  const [eotmForm, setEotmForm] = useState(emptyEOTM);

  const normalizedEvals = useMemo(() => {
    return performanceEvaluations.map((ev, index) => {
      const staff = allStaff.find(s => s.id === ev.employeeId) || {};
      const empName = ev.employeeName || staff.name || (ev.employeeId === 10 ? 'Riya Biswas Dasgupta' : ev.employeeId === 15 ? 'Vansh Goyal' : ev.employeeId === 3 ? 'Sowmya' : ev.employeeId === 13 ? 'Karthik' : `Employee #${ev.employeeId || index + 1}`);
      const empRole = ev.role || staff.role || (ev.roleId === 'graphic_designer' ? 'Sr. Graphic Designer' : ev.roleId === 'web_developer' ? 'Software Developer' : ev.roleId === 'performance_marketer' ? 'Digital Marketer' : 'Staff Member');
      const defs = getRoleDefaults(empRole);

      let targetVal = ev.targetMetricValue !== undefined ? ev.targetMetricValue : defs.target;
      let achievedVal = ev.achievedMetricValue !== undefined ? ev.achievedMetricValue : (ev.monthlyMetrics ? (JSON.parse(ev.monthlyMetrics || '{}').assets_delivered || JSON.parse(ev.monthlyMetrics || '{}').sites_delivered || targetVal) : targetVal);
      let metricName = ev.targetMetricName || defs.metric;
      let unit = ev.metricUnit || defs.unit;

      const calc = computeAutomaticScore({
        targetMetricValue: targetVal,
        achievedMetricValue: achievedVal,
        taskDeliveryRate: ev.taskDeliveryRate || ev.taskCompletionRate || 90,
        workQuality: ev.workQuality || ev.qualityScore || 8,
        peerCollaboration: ev.peerCollaboration || ev.peerReview || 8,
        attendancePunctuality: ev.attendancePunctuality || 9
      });

      return {
        ...ev,
        employeeName: empName,
        role: empRole,
        targetMetricName: metricName,
        targetMetricValue: targetVal,
        achievedMetricValue: achievedVal,
        metricUnit: unit,
        taskDeliveryRate: ev.taskDeliveryRate || ev.taskCompletionRate || 90,
        workQuality: ev.workQuality || ev.qualityScore || 8,
        peerCollaboration: ev.peerCollaboration || ev.peerReview || 8,
        attendancePunctuality: ev.attendancePunctuality || 9,
        overallScore: ev.overallScore || calc.score,
        performanceGrade: ev.performanceGrade || calc.grade,
        achievementRate: calc.achievementRate,
        badgeColor: calc.badgeColor,
        tierIcon: calc.tierIcon
      };
    });
  }, [performanceEvaluations, allStaff]);

  const filteredEvals = useMemo(() => {
    const q = searchQ.toLowerCase();
    return normalizedEvals.filter(ev => !q || (ev.employeeName || '').toLowerCase().includes(q) || (ev.role || '').toLowerCase().includes(q));
  }, [normalizedEvals, searchQ]);

  const scoreColor = (s) => {
    if (s >= 8.5) return '#34d399';
    if (s >= 7.0) return '#60a5fa';
    if (s >= 5.5) return '#f59e0b';
    return '#f43f5e';
  };

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: '700', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Award style={{ width: '15px', height: '15px' }} /> HR — Performance
          </div>
          <h2 style={{ fontSize: '1.55rem', fontWeight: '900', margin: '4px 0 6px', background: 'linear-gradient(135deg, #fff 0%, #f59e0b 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Performance Board
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
            Employee evaluations with automatic role target scoring, Employee of the Month nominations, and Role KPI mappings.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-card" style={{ padding: '12px 20px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {[
          { id: 'evaluations', label: 'Evaluations', icon: Star, count: normalizedEvals.length },
          { id: 'eotm', label: 'Employee of the Month', icon: Trophy, count: eotmNominations.length },
          { id: 'kpi', label: 'Role KPI Mappings', icon: Target, count: roleKPIs.length },
          { id: 'birthdays', label: 'Birthdays & Celebrations', icon: Cake, count: currentMonthBirthdays.length },
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: '8px 14px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: active ? '700' : '500', border: active ? '1px solid rgba(99,102,241,0.4)' : '1px solid transparent', background: active ? 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(168,85,247,0.15))' : 'transparent', color: active ? '#818cf8' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px' }}>
              <Icon style={{ width: '14px', height: '14px' }} />
              <span>{tab.label}</span>
              {tab.count > 0 && <span style={{ padding: '1px 5px', borderRadius: '10px', background: active ? '#6366f1' : 'rgba(255,255,255,0.08)', color: active ? '#fff' : 'var(--text-muted)', fontSize: '0.68rem', fontWeight: '700' }}>{tab.count}</span>}
            </button>
          );
        })}
      </div>

      {/* === EVALUATIONS TAB === */}
      {activeTab === 'evaluations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: 'var(--text-muted)' }} />
              <input type="text" placeholder="Search employee or role..." value={searchQ} onChange={e => setSearchQ(e.target.value)} className="form-input" style={{ paddingLeft: '32px', width: '240px', fontSize: '0.8rem' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => exportToCSV(normalizedEvals, 'Performance_Evaluations.csv')} className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Download style={{ width: '13px', height: '13px' }} /> Export
              </button>
              <button onClick={() => openEval()} className="btn gradient-btn-primary" style={{ padding: '8px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Plus style={{ width: '13px', height: '13px' }} /> Evaluate Employee
              </button>
            </div>
          </div>

          <div className="glass-card" style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.03)' }}>
                  {['Employee', 'Role', 'Period', 'Role Target vs Output', 'Delivery %', 'Work Quality', 'Collab.', 'Attendance', 'Automatic Score & Grade', 'Evaluator', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '0.68rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredEvals.length === 0 ? (
                  <tr><td colSpan="11" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No evaluations yet. Click "Evaluate Employee" to start.</td></tr>
                ) : filteredEvals.map(ev => {
                  const achPercent = ev.achievementRate || (ev.targetMetricValue > 0 ? Math.round((ev.achievedMetricValue / ev.targetMetricValue) * 100) : 100);
                  const achColor = achPercent >= 100 ? '#34d399' : achPercent >= 80 ? '#60a5fa' : '#f59e0b';
                  return (
                    <tr key={ev.id} style={{ borderBottom: '1px solid var(--border-color)' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '11px 12px', fontWeight: '700', color: 'var(--text-primary)' }}>{ev.employeeName}</td>
                      <td style={{ padding: '11px 12px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>{ev.role}</td>
                      <td style={{ padding: '11px 12px', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{MONTHS[(ev.month||1)-1]} {ev.year}</td>
                      
                      {/* Target vs Achieved KPI */}
                      <td style={{ padding: '11px 12px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                            {ev.achievedMetricValue} / {ev.targetMetricValue} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{ev.metricUnit}</span>
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ padding: '2px 6px', borderRadius: '8px', background: `${achColor}20`, color: achColor, fontWeight: '800', fontSize: '0.68rem' }}>
                              {achPercent}% Target
                            </span>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{ev.targetMetricName}</span>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '11px 12px', fontWeight: '700', color: scoreColor((ev.taskDeliveryRate || 80)/10) }}>{ev.taskDeliveryRate}%</td>
                      <td style={{ padding: '11px 12px', fontWeight: '700', color: scoreColor(ev.workQuality || 7) }}>{ev.workQuality}/10</td>
                      <td style={{ padding: '11px 12px', fontWeight: '700', color: scoreColor(ev.peerCollaboration || 7) }}>{ev.peerCollaboration}/10</td>
                      <td style={{ padding: '11px 12px', fontWeight: '700', color: scoreColor(ev.attendancePunctuality || 8) }}>{ev.attendancePunctuality}/10</td>
                      
                      {/* Automatic Composite Score & Grade */}
                      <td style={{ padding: '11px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ padding: '4px 10px', borderRadius: '12px', background: `${scoreColor(ev.overallScore)}20`, color: scoreColor(ev.overallScore), fontWeight: '900', fontSize: '0.85rem' }}>
                            {ev.overallScore} / 10
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                            {ev.performanceGrade || (ev.overallScore >= 9 ? 'Outstanding' : ev.overallScore >= 8 ? 'Exceeds' : 'Meets')}
                          </span>
                        </div>
                      </td>

                      <td style={{ padding: '11px 12px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>{ev.evaluatedBy || '—'}</td>
                      <td style={{ padding: '11px 12px' }}>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button onClick={() => openEval(ev)} title="Edit Evaluation" style={{ background: 'rgba(129,140,248,0.15)', border: 'none', color: '#818cf8', padding: '5px', borderRadius: '6px', cursor: 'pointer' }}><Edit2 style={{ width: '12px', height: '12px' }} /></button>
                          <button onClick={() => deletePerformanceEvaluation(ev.id)} title="Delete" style={{ background: 'rgba(244,63,94,0.15)', border: 'none', color: '#f43f5e', padding: '5px', borderRadius: '6px', cursor: 'pointer' }}><Trash2 style={{ width: '12px', height: '12px' }} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* === EMPLOYEE OF THE MONTH TAB === */}
      {activeTab === 'eotm' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Top Ingestion & Action Card */}
          <div className="glass-card" style={{ padding: '22px 26px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderLeft: '4px solid #f59e0b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #f59e0b, #10b981)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                boxShadow: '0 4px 16px rgba(245, 158, 11, 0.25)',
                flexShrink: 0
              }}>
                👑
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '900', margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Employee of the Month — Automated KPI Leaderboard
                  <span style={{ fontSize: '0.72rem', fontWeight: '800', padding: '2px 8px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                    Live Engine
                  </span>
                </h3>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Upload your monthly performance spreadsheet (.xlsx / .csv) to auto-evaluate KPI metrics against benchmarks, rank team members, and crown the top performer.
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleSpreadsheetFileSelect}
                style={{ display: 'none' }}
              />

              <button
                onClick={() => downloadOfficialPerformanceTemplate()}
                className="btn btn-secondary"
                style={{ padding: '8px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                title="Download official Excel template with role benchmarks and sample records"
              >
                <Download style={{ width: '13px', height: '13px' }} />
                <span>Download KPI Template</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isParsingFile}
                className="btn gradient-btn-primary"
                style={{ padding: '8px 16px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '7px', fontWeight: '800' }}
              >
                {isParsingFile ? (
                  <>
                    <RefreshCw style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} />
                    <span>Parsing Sheet...</span>
                  </>
                ) : (
                  <>
                    <Upload style={{ width: '14px', height: '14px' }} />
                    <span>Upload Performance Sheet (.xlsx)</span>
                  </>
                )}
              </button>

              <button
                onClick={() => { setEotmForm(emptyEOTM); setShowEOTMModal(true); }}
                className="btn btn-secondary"
                style={{ padding: '8px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Trophy style={{ width: '13px', height: '13px' }} />
                <span>Manual Nomination</span>
              </button>
            </div>
          </div>

          {/* Toast Notification */}
          {uploadToast && (
            <div style={{ padding: '12px 18px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#34d399', fontSize: '0.85rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 style={{ width: '16px', height: '16px' }} />
                <span>{uploadToast}</span>
              </div>
              <button onClick={() => setUploadToast(null)} style={{ background: 'none', border: 'none', color: '#34d399', cursor: 'pointer' }}>
                <X style={{ width: '14px', height: '14px' }} />
              </button>
            </div>
          )}

          {/* Parse Error Notification */}
          {parseError && (
            <div style={{ padding: '12px 18px', borderRadius: '10px', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid #f43f5e', color: '#f43f5e', fontSize: '0.85rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle style={{ width: '16px', height: '16px' }} />
                <span>{parseError}</span>
              </div>
              <button onClick={() => setParseError(null)} style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer' }}>
                <X style={{ width: '14px', height: '14px' }} />
              </button>
            </div>
          )}

          {/* Controls Bar: Period, Department, Search */}
          <div className="glass-card" style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700' }}>Evaluation Period:</span>
                <select
                  className="form-input"
                  value={eotmPeriod}
                  onChange={e => setEotmPeriod(e.target.value)}
                  style={{ width: '160px', fontSize: '0.8rem', fontWeight: '800' }}
                >
                  <option value="August 2026">August 2026</option>
                  <option value="July 2026">July 2026</option>
                  <option value="June 2026">June 2026</option>
                  <option value="May 2026">May 2026</option>
                  <option value="September 2026">September 2026</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700' }}>Department:</span>
                <select
                  className="form-input"
                  value={eotmDeptFilter}
                  onChange={e => setEotmDeptFilter(e.target.value)}
                  style={{ width: '210px', fontSize: '0.8rem', fontWeight: '600' }}
                >
                  <option value="all">All Departments ({activeEOTMLeaderboard.length})</option>
                  <option value="Engineering & Development">Engineering & Development</option>
                  <option value="Creative Design & Branding">Creative Design & Branding</option>
                  <option value="Engineering & Web Solutions">Engineering & Web Solutions</option>
                  <option value="Sales & Executive Leadership">Sales & Executive Leadership</option>
                  <option value="Infrastructure & DevOps">Infrastructure & DevOps</option>
                  <option value="Digital Marketing & Growth">Digital Marketing & Growth</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ position: 'relative' }}>
                <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search staff or role..."
                  value={eotmSearch}
                  onChange={e => setEotmSearch(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '32px', width: '220px', fontSize: '0.8rem' }}
                />
              </div>

              <button
                onClick={() => exportToCSV(filteredLeaderboard.map(e => ({
                  Rank: e.rank,
                  Name: e.employeeName,
                  Role: e.role,
                  Department: e.department,
                  Period: e.month,
                  CompositeScore: `${e.compositeScore}%`,
                  ScoreOutOf10: e.scoreOutOf10,
                  Tier: e.tierGrade,
                  TaskVelocity: `${e.taskVelocity}%`,
                  Quality: `${e.workQuality}/10`,
                  PeerReview: `${e.peerReview}/10`,
                  Attendance: `${e.attendance}/10`
                })), `EOTM_Leaderboard_${eotmPeriod.replace(/\s+/g, '_')}.csv`)}
                className="btn btn-secondary"
                style={{ padding: '8px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Download style={{ width: '13px', height: '13px' }} /> Export
              </button>
            </div>
          </div>

          {/* 🌟 CROWN SPOTLIGHT: #1 EMPLOYEE OF THE MONTH */}
          {eotmWinner && (
            <div
              className="glass-card"
              style={{
                padding: '28px',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.16) 0%, rgba(16, 185, 129, 0.12) 50%, rgba(99, 102, 241, 0.1) 100%)',
                border: '2px solid rgba(245, 158, 11, 0.65)',
                boxShadow: '0 8px 32px rgba(245, 158, 11, 0.22)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Background ambient watermarks */}
              <div style={{ position: 'absolute', right: '-10px', top: '-15px', fontSize: '7rem', opacity: 0.08, pointerEvents: 'none', userSelect: 'none' }}>
                🏆
              </div>

              {/* Spotlight Ribbon */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    padding: '4px 14px',
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                    color: '#000',
                    fontSize: '0.78rem',
                    fontWeight: '900',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)'
                  }}>
                    <Crown style={{ width: '14px', height: '14px' }} />
                    <span>#1 TOP PERFORMER • {eotmPeriod.toUpperCase()} EMPLOYEE OF THE MONTH</span>
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Sparkles style={{ width: '13px', height: '13px' }} /> Highest Weighted KPI Output
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => setViewingBreakdownRecord(eotmWinner)}
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                  >
                    <Eye style={{ width: '13px', height: '13px' }} />
                    <span>View KPI Formula Breakdown</span>
                  </button>
                </div>
              </div>

              {/* Main Winner Profile & Score Header */}
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '22px', alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    width: '84px',
                    height: '84px',
                    borderRadius: '50%',
                    padding: '3px',
                    background: 'linear-gradient(135deg, #f59e0b, #10b981, #6366f1)',
                    boxShadow: '0 4px 20px rgba(245, 158, 11, 0.35)'
                  }}>
                    <img
                      src={eotmWinner.employeeName.toLowerCase().includes('smitesh')
                        ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80"
                        : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80"}
                      alt={eotmWinner.employeeName}
                      style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                    />
                  </div>
                  <div style={{
                    position: 'absolute',
                    bottom: '-6px',
                    right: '-4px',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: '#f59e0b',
                    color: '#000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.9rem',
                    fontWeight: '900',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
                  }}>
                    👑
                  </div>
                </div>

                <div>
                  <h2 style={{ fontSize: '1.65rem', fontWeight: '900', margin: '0 0 4px', color: 'var(--text-primary)' }}>
                    {eotmWinner.employeeName}
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.88rem', color: '#f59e0b', fontWeight: '800' }}>
                      {eotmWinner.role}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>•</span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
                      {eotmWinner.department}
                    </span>
                    {eotmWinner.workEmail && (
                      <>
                        <span style={{ color: 'var(--text-muted)' }}>•</span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {eotmWinner.workEmail}
                        </span>
                      </>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ padding: '3px 10px', borderRadius: '12px', background: `${eotmWinner.badgeColor}22`, color: eotmWinner.badgeColor, fontSize: '0.76rem', fontWeight: '800', border: `1px solid ${eotmWinner.badgeColor}44` }}>
                      {eotmWinner.tier}
                    </span>
                    <span style={{ padding: '3px 10px', borderRadius: '12px', background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)', fontSize: '0.76rem', fontWeight: '700' }}>
                      ID: {eotmWinner.employeeId}
                    </span>
                  </div>
                </div>

                {/* Score Big Display */}
                <div style={{
                  padding: '16px 22px',
                  borderRadius: '16px',
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  textAlign: 'center',
                  minWidth: '150px'
                }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800' }}>
                    COMPOSITE SCORE
                  </div>
                  <div style={{ fontSize: '2.4rem', fontWeight: '950', color: '#f59e0b', lineHeight: 1.1, margin: '4px 0' }}>
                    {eotmWinner.compositeScore}%
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#10b981' }}>
                    ⭐ {eotmWinner.scoreOutOf10} / 10 Evaluation
                  </div>
                </div>
              </div>

              {/* 4 Core KPI Highlights */}
              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Target style={{ width: '13px', height: '13px', color: '#f59e0b' }} />
                  <span>Key KPI Benchmark Achievements vs Target</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
                  {eotmWinner.kpiResults.map((kpi, idx) => {
                    const achColor = kpi.achievement >= 100 ? '#10b981' : kpi.achievement >= 80 ? '#3b82f6' : '#f59e0b';
                    return (
                      <div
                        key={idx}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '10px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '6px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600', lineHeight: 1.3 }}>
                            {kpi.name}
                          </span>
                          <span style={{ fontSize: '0.68rem', fontWeight: '800', padding: '2px 6px', borderRadius: '6px', background: `${achColor}22`, color: achColor }}>
                            {kpi.achievement}%
                          </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <span style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                            {kpi.achieved} <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{kpi.unit}</span>
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            Target: {kpi.target}{kpi.unit} ({Math.round(kpi.weight * 100)}% wt)
                          </span>
                        </div>

                        <div style={{ width: '100%', height: '5px', borderRadius: '3px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(100, kpi.achievement)}%`, height: '100%', background: achColor, borderRadius: '3px' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Core Competencies Row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '8px',
                padding: '12px 16px',
                borderRadius: '12px',
                background: 'rgba(0,0,0,0.18)',
                marginBottom: '16px'
              }}>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: '700' }}>Task Velocity</div>
                  <div style={{ fontSize: '0.92rem', fontWeight: '900', color: '#10b981' }}>{eotmWinner.taskVelocity}%</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: '700' }}>Quality Score</div>
                  <div style={{ fontSize: '0.92rem', fontWeight: '900', color: '#3b82f6' }}>{eotmWinner.workQuality} / 10</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: '700' }}>Peer Review</div>
                  <div style={{ fontSize: '0.92rem', fontWeight: '900', color: '#8b5cf6' }}>{eotmWinner.peerReview} / 10</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: '700' }}>Attendance</div>
                  <div style={{ fontSize: '0.92rem', fontWeight: '900', color: '#f59e0b' }}>{eotmWinner.attendance} / 10</div>
                </div>
              </div>

              {/* Citation Quote */}
              <div style={{
                padding: '14px 18px',
                borderRadius: '12px',
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px'
              }}>
                <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>💬</span>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: '800', textTransform: 'uppercase', marginBottom: '2px' }}>
                    EXECUTIVE ACCOMPLISHMENT CITATION
                  </div>
                  <div style={{ fontSize: '0.84rem', color: 'var(--text-primary)', fontStyle: 'italic', lineHeight: 1.5 }}>
                    "{eotmWinner.aiSummary}"
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 🥈 & 🥉 PODIUM RUNNER-UPS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {eotmRunnerUp1 && (
              <div className="glass-card" style={{ padding: '20px', borderTop: '4px solid #94a3b8', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, #94a3b8, #cbd5e1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
                      🥈
                    </div>
                    <div>
                      <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>1st Runner Up</span>
                      <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '900', color: 'var(--text-primary)' }}>{eotmRunnerUp1.employeeName}</h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{eotmRunnerUp1.role} • {eotmRunnerUp1.department}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#94a3b8' }}>{eotmRunnerUp1.compositeScore}%</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{eotmRunnerUp1.scoreOutOf10}/10</div>
                  </div>
                </div>

                <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {eotmRunnerUp1.notes || eotmRunnerUp1.aiSummary.slice(0, 140) + '...'}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ padding: '2px 8px', borderRadius: '10px', background: `${eotmRunnerUp1.badgeColor}20`, color: eotmRunnerUp1.badgeColor, fontSize: '0.72rem', fontWeight: '800' }}>
                    {eotmRunnerUp1.tier}
                  </span>
                  <button onClick={() => setViewingBreakdownRecord(eotmRunnerUp1)} style={{ background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '700' }}>
                    Breakdown →
                  </button>
                </div>
              </div>
            )}

            {eotmRunnerUp2 && (
              <div className="glass-card" style={{ padding: '20px', borderTop: '4px solid #b45309', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, #b45309, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
                      🥉
                    </div>
                    <div>
                      <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#d97706', textTransform: 'uppercase' }}>2nd Runner Up</span>
                      <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '900', color: 'var(--text-primary)' }}>{eotmRunnerUp2.employeeName}</h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{eotmRunnerUp2.role} • {eotmRunnerUp2.department}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#d97706' }}>{eotmRunnerUp2.compositeScore}%</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{eotmRunnerUp2.scoreOutOf10}/10</div>
                  </div>
                </div>

                <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {eotmRunnerUp2.notes || eotmRunnerUp2.aiSummary.slice(0, 140) + '...'}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ padding: '2px 8px', borderRadius: '10px', background: `${eotmRunnerUp2.badgeColor}20`, color: eotmRunnerUp2.badgeColor, fontSize: '0.72rem', fontWeight: '800' }}>
                    {eotmRunnerUp2.tier}
                  </span>
                  <button onClick={() => setViewingBreakdownRecord(eotmRunnerUp2)} style={{ background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '700' }}>
                    Breakdown →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 📋 MASTER RANKED PERFORMANCE LEADERBOARD TABLE */}
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '900', color: 'var(--text-primary)' }}>
                  {eotmPeriod} Official KPI Performance Leaderboard
                </h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {filteredLeaderboard.length} staff evaluated according to benchmark deliverable weightages
                </span>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.03)' }}>
                    <th style={{ padding: '11px 14px', textAlign: 'center', fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Rank</th>
                    <th style={{ padding: '11px 14px', textAlign: 'left', fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Staff Member</th>
                    <th style={{ padding: '11px 14px', textAlign: 'left', fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Role & Department</th>
                    <th style={{ padding: '11px 14px', textAlign: 'left', fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Core KPI Deliverables</th>
                    <th style={{ padding: '11px 14px', textAlign: 'center', fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Task Velocity</th>
                    <th style={{ padding: '11px 14px', textAlign: 'center', fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Quality</th>
                    <th style={{ padding: '11px 14px', textAlign: 'center', fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Attendance</th>
                    <th style={{ padding: '11px 14px', textAlign: 'center', fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Score (%) & Tier</th>
                    <th style={{ padding: '11px 14px', textAlign: 'center', fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeaderboard.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No records match the current filters. Try selecting another department or uploading an Excel sheet.
                      </td>
                    </tr>
                  ) : (
                    filteredLeaderboard.map((emp) => {
                      const isFirst = emp.rank === 1;
                      const isSecond = emp.rank === 2;
                      const isThird = emp.rank === 3;

                      return (
                        <tr
                          key={emp.employeeId || emp.rank}
                          style={{
                            borderBottom: '1px solid var(--border-color)',
                            background: isFirst ? 'rgba(245, 158, 11, 0.08)' : isSecond ? 'rgba(148, 163, 184, 0.05)' : isThird ? 'rgba(217, 119, 6, 0.05)' : 'transparent'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = isFirst ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255,255,255,0.03)'}
                          onMouseLeave={e => e.currentTarget.style.background = isFirst ? 'rgba(245, 158, 11, 0.08)' : isSecond ? 'rgba(148, 163, 184, 0.05)' : isThird ? 'rgba(217, 119, 6, 0.05)' : 'transparent'}
                        >
                          {/* Rank */}
                          <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                            {isFirst ? (
                              <span style={{ fontSize: '1.2rem' }}>👑</span>
                            ) : isSecond ? (
                              <span style={{ fontSize: '1.1rem' }}>🥈</span>
                            ) : isThird ? (
                              <span style={{ fontSize: '1.1rem' }}>🥉</span>
                            ) : (
                              <span style={{ fontWeight: '800', color: 'var(--text-muted)', fontSize: '0.82rem' }}>#{emp.rank}</span>
                            )}
                          </td>

                          {/* Employee Name */}
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: isFirst ? '#f59e0b' : 'rgba(255,255,255,0.1)',
                                color: isFirst ? '#000' : 'var(--text-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: '800',
                                fontSize: '0.8rem'
                              }}>
                                {emp.employeeName.charAt(0)}
                              </div>
                              <div>
                                <div style={{ fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {emp.employeeName}
                                  {isFirst && <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '6px', background: '#f59e0b', color: '#000', fontWeight: '900' }}>WINNER</span>}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                  {emp.workEmail || emp.employeeId}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Role & Dept */}
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{emp.role}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{emp.department}</div>
                          </td>

                          {/* Top Deliverables */}
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              {emp.kpiResults.slice(0, 2).map((kpi, kIdx) => (
                                <div key={kIdx} style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                                  <strong style={{ color: 'var(--text-primary)' }}>{kpi.achieved}{kpi.unit}</strong> {kpi.name.split('(')[0]}
                                  <span style={{ color: kpi.achievement >= 100 ? '#10b981' : '#f59e0b', fontWeight: '700', marginLeft: '4px' }}>
                                    ({kpi.achievement}%)
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>

                          {/* Velocity */}
                          <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: '800', color: emp.taskVelocity >= 100 ? '#10b981' : '#3b82f6' }}>
                            {emp.taskVelocity}%
                          </td>

                          {/* Quality */}
                          <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: '800', color: emp.workQuality >= 9 ? '#10b981' : '#f59e0b' }}>
                            {emp.workQuality}/10
                          </td>

                          {/* Attendance */}
                          <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: '800', color: emp.attendance >= 9.5 ? '#10b981' : '#f59e0b' }}>
                            {emp.attendance}/10
                          </td>

                          {/* Score & Tier */}
                          <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                              <span style={{ fontSize: '1rem', fontWeight: '950', color: emp.badgeColor }}>
                                {emp.compositeScore}%
                              </span>
                              <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '8px', background: `${emp.badgeColor}22`, color: emp.badgeColor, fontWeight: '800' }}>
                                {emp.tierGrade}
                              </span>
                            </div>
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                            <button
                              onClick={() => setViewingBreakdownRecord(emp)}
                              title="View full formula breakdown"
                              style={{
                                padding: '5px 9px',
                                borderRadius: '6px',
                                background: 'rgba(99, 102, 241, 0.15)',
                                border: '1px solid rgba(99, 102, 241, 0.3)',
                                color: '#818cf8',
                                fontSize: '0.72rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <BarChart3 style={{ width: '12px', height: '12px' }} /> Breakdown
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Historical Nominations Gallery */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                🏆 Historical Hall of Fame & Manual Nominations ({eotmNominations.length})
              </h4>
            </div>

            {eotmNominations.length === 0 ? (
              <div className="glass-card" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No prior historical nominations recorded yet.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '14px' }}>
                {eotmNominations.map(nom => (
                  <div key={nom.id} className="glass-card" style={{ padding: '20px', textAlign: 'center', background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(251,146,60,0.06))', borderTop: '4px solid #f59e0b', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '10px' }}>
                    <div>
                      <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #fb923c)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontSize: '1.5rem' }}>🏆</div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: '900', color: 'var(--text-primary)', margin: '0 0 3px' }}>{nom.employeeName}</h4>
                      <div style={{ fontSize: '0.78rem', color: '#f59e0b', fontWeight: '700', marginBottom: '6px' }}>{nom.role}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '10px' }}>
                        {MONTHS[(nom.month||1)-1]} {nom.year}
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0 0 10px', lineHeight: 1.4 }}>{nom.reason}</p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>By: <strong style={{ color: 'var(--text-secondary)' }}>{nom.nominatedBy}</strong></span>
                      <button onClick={() => deleteEOTMNomination(nom.id)} style={{ background: 'rgba(244,63,94,0.1)', border: 'none', color: '#f43f5e', padding: '4px 8px', borderRadius: '5px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: '700' }}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* === KPI MAPPINGS TAB === */}
      {activeTab === 'kpi' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="glass-card" style={{ padding: '16px 20px', background: 'rgba(99,102,241,0.08)', borderLeft: '3px solid #6366f1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: '800', color: 'var(--text-primary)' }}>Role KPI & Performance Benchmarks</h4>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Target metrics and deliverables for each organizational role, evaluated during monthly reviews.
              </p>
            </div>
            <button
              onClick={() => setShowAddRoleModal(true)}
              className="btn gradient-btn-primary"
              style={{ padding: '8px 16px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus style={{ width: '14px', height: '14px' }} />
              <span>+ Add Role KPI Mapping</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px' }}>
            {roleKPIs.map((rk, rIdx) => {
              const color = rk.iconColor || '#818cf8';
              return (
                <div key={rk.role || rIdx} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: `4px solid ${color}` }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Target style={{ width: '20px', height: '20px', color }} />
                        </div>
                        <div>
                          <h4 style={{ fontSize: '1rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>{rk.role}</h4>
                          {rk.department && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                              {rk.department}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <span style={{ padding: '3px 8px', borderRadius: '12px', background: `${color}18`, color, fontSize: '0.7rem', fontWeight: '800' }}>
                        {rk.kpis.length} KPIs
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {rk.kpis.map((kpi, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: color, marginTop: '6px', flexShrink: 0 }} />
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '500', lineHeight: 1.4 }}>{kpi}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Active Benchmark
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* === BIRTHDAYS & CELEBRATIONS TAB === */}
      {activeTab === 'birthdays' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header Bar with Month Filter */}
          <div className="glass-card" style={{ padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #f59e0b, #ec4899)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.3rem'
              }}>
                🎂
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                  Staff Birthdays & Team Milestones
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Employee birthdays across departments. Plan celebrations, awards, and gift vouchers.
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '600' }}>Filter Month:</span>
                <select
                  className="form-input"
                  value={bdayMonth}
                  onChange={e => setBdayMonth(parseInt(e.target.value, 10))}
                  style={{ width: '140px', fontSize: '0.8rem', fontWeight: '700' }}
                >
                  {MONTH_NAMES.map((m, idx) => (
                    <option key={idx} value={idx + 1}>{m}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => exportToCSV(allStaffBirthdayRoster.map(e => ({
                  ID: e.id,
                  Name: e.name,
                  Designation: e.designation || e.role,
                  Birthday: e.birthday || 'N/A'
                })), 'Staff_Birthdays_Roster.csv')}
                className="btn btn-secondary"
                style={{ padding: '8px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Download style={{ width: '13px', height: '13px' }} /> Export Birthday Roster
              </button>
            </div>
          </div>

          {/* Monthly Celebrants Spotlight Cards */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                {MONTH_NAMES[bdayMonth - 1]} Celebrants ({currentMonthBirthdays.length})
              </h4>
            </div>

            {currentMonthBirthdays.length === 0 ? (
              <div className="glass-card" style={{ padding: '30px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '6px' }}>🎈</div>
                <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
                  No staff birthdays in {MONTH_NAMES[bdayMonth - 1]}
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
                {currentMonthBirthdays.map(emp => {
                  const bData = emp.birthdayData || {};
                  const isToday = bData.isToday;
                  const isWished = wishedStaffIds.includes(emp.id);

                  return (
                    <div
                      key={emp.id}
                      className="glass-card"
                      style={{
                        padding: '18px',
                        background: isToday
                          ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(236, 72, 153, 0.15) 100%)'
                          : 'rgba(255, 255, 255, 0.03)',
                        border: isToday ? '1.5px solid #f59e0b' : '1px solid var(--border-color)',
                        boxShadow: isToday ? '0 4px 16px rgba(245, 158, 11, 0.25)' : 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '14px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ position: 'relative' }}>
                          <img
                            src={emp.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"}
                            alt={emp.name}
                            style={{
                              width: '46px',
                              height: '46px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: isToday ? '2px solid #f59e0b' : '2px solid rgba(255, 255, 255, 0.1)'
                            }}
                          />
                          <span style={{ position: 'absolute', bottom: '-4px', right: '-4px', fontSize: '0.85rem' }}>
                            🎂
                          </span>
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <div style={{ fontWeight: '800', fontSize: '0.92rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {emp.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {emp.designation || emp.role}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Date of Birth</div>
                          <div style={{ fontSize: '0.84rem', fontWeight: '800', color: isToday ? '#fbbf24' : '#fff' }}>
                            {MONTH_NAMES[bdayMonth - 1]} {bData.day}
                          </div>
                        </div>
                        <div>
                          {isToday ? (
                            <span style={{ fontSize: '0.72rem', fontWeight: '800', padding: '3px 8px', borderRadius: '12px', background: '#f59e0b', color: '#000' }}>
                              🎉 Birthday Today!
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '3px 8px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
                              {bData.daysUntil !== null ? `In ${bData.daysUntil} days` : 'Upcoming'}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => setWishedStaffIds(prev => [...new Set([...prev, emp.id])])}
                        className="btn btn-secondary"
                        style={{
                          width: '100%',
                          padding: '7px',
                          fontSize: '0.78rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          borderColor: isWished ? 'rgba(16, 185, 129, 0.4)' : undefined,
                          background: isWished ? 'rgba(16, 185, 129, 0.15)' : undefined,
                          color: isWished ? '#34d399' : undefined
                        }}
                      >
                        <PartyPopper style={{ width: '13px', height: '13px' }} />
                        <span>{isWished ? '✓ Celebration Card Sent' : 'Send Birthday Greeting 🎉'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Master Annual Birthday Roster Table */}
          <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                Annual Staff Birthday Roster (All 12 Months)
              </h4>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {allStaffBirthdayRoster.length} Total Team Members
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.03)' }}>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Staff Member</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Designation / Role</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Birthday Date</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Annual Milestone</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allStaffBirthdayRoster.map(emp => {
                    const isBdayInCurMonth = isBirthdayInMonth(emp.birthday, bdayMonth);
                    const isToday = isBirthdayToday(emp.birthday);

                    return (
                      <tr
                        key={emp.id}
                        style={{
                          borderBottom: '1px solid var(--border-color)',
                          background: isToday ? 'rgba(245, 158, 11, 0.08)' : isBdayInCurMonth ? 'rgba(99, 102, 241, 0.05)' : 'transparent'
                        }}
                      >
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <img
                              src={emp.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80"}
                              alt={emp.name}
                              style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                            <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{emp.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>
                          {emp.designation || emp.role}
                        </td>
                        <td style={{ padding: '10px 14px', fontWeight: '700', color: isToday ? '#fbbf24' : '#818cf8' }}>
                          🎂 {formatBirthday(emp.birthday, true)}
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>
                          {emp.birthday ? `Annual celebration on ${formatBirthday(emp.birthday, false)}` : 'Not configured'}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          {isToday ? (
                            <span style={{ padding: '2px 8px', borderRadius: '10px', background: '#f59e0b', color: '#000', fontSize: '0.72rem', fontWeight: '800' }}>
                              🎉 Today!
                            </span>
                          ) : isBdayInCurMonth ? (
                            <span style={{ padding: '2px 8px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', fontSize: '0.72rem', fontWeight: '700' }}>
                              This Month
                            </span>
                          ) : (
                            <span style={{ padding: '2px 8px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                              Upcoming
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Eval Modal */}
      {showEvalModal && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content glass-card" style={{ maxWidth: '620px', width: '92%', maxHeight: '90vh', overflowY: 'auto', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '900', margin: 0, color: 'var(--text-primary)' }}>
                  {editingEval ? 'Edit Employee Evaluation' : '🎯 Automated Role-Target Evaluation'}
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Enter target vs achieved output to compute weighted score automatically.
                </span>
              </div>
              <button onClick={() => setShowEvalModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <form onSubmit={handleEvalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Employee & Period */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: '700' }}>Employee *</label>
                  <select className="form-input" value={evalForm.employeeId} onChange={e => handleStaffChange(e.target.value)}>
                    {allStaff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: '700' }}>Evaluator / Manager</label>
                  <input className="form-input" value={evalForm.evaluatedBy} onChange={e => updateEvalFormField('evaluatedBy', e.target.value)} placeholder="e.g. Lead Manager" />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: '700' }}>Review Month</label>
                  <select className="form-input" value={evalForm.month} onChange={e => updateEvalFormField('month', parseInt(e.target.value))}>
                    {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m,i) => <option key={m} value={i+1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: '700' }}>Year</label>
                  <input type="number" className="form-input" value={evalForm.year} onChange={e => updateEvalFormField('year', parseInt(e.target.value))} min={2020} max={2030} />
                </div>
              </div>

              {/* 🎯 Role Specific Target & Achieved Section */}
              {(() => {
                const calc = computeAutomaticScore(evalForm);
                return (
                  <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.25)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Target style={{ width: '18px', height: '18px', color: '#818cf8' }} />
                        <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                          Role KPI Target & Deliverables
                        </span>
                      </div>
                      <span style={{ padding: '3px 8px', borderRadius: '10px', background: `${calc.badgeColor}20`, color: calc.badgeColor, fontSize: '0.72rem', fontWeight: '800' }}>
                        {calc.achievementRate}% Target Achieved {calc.tierIcon}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '10px' }}>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: '700' }}>Target Metric Name</label>
                        <input
                          className="form-input"
                          placeholder="e.g. Brand Creatives / Assets"
                          value={evalForm.targetMetricName || ''}
                          onChange={e => updateEvalFormField('targetMetricName', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: '700' }}>Target Goal</label>
                        <input
                          type="number"
                          min="1"
                          className="form-input"
                          value={evalForm.targetMetricValue || 0}
                          onChange={e => updateEvalFormField('targetMetricValue', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: '700' }}>Achieved Output</label>
                        <input
                          type="number"
                          min="0"
                          className="form-input"
                          value={evalForm.achievedMetricValue || 0}
                          onChange={e => updateEvalFormField('achievedMetricValue', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: '700' }}>Unit</label>
                        <input
                          className="form-input"
                          placeholder="assets"
                          value={evalForm.metricUnit || ''}
                          onChange={e => updateEvalFormField('metricUnit', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Live KPI Progress Bar */}
                    <div style={{ width: '100%', height: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginTop: '4px' }}>
                      <div style={{ width: `${Math.min(100, calc.achievementRate)}%`, height: '100%', background: `linear-gradient(90deg, #6366f1, ${calc.badgeColor})`, transition: 'width 0.3s ease' }} />
                    </div>
                  </div>
                );
              })()}

              {/* Performance Score Sliders */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-secondary)' }}>
                  Core Competencies & Quality Metrics
                </span>

                {[
                  { key: 'taskDeliveryRate', label: 'Task Delivery Rate (%)', min: 0, max: 100, suffix: '%', weight: '25%' },
                  { key: 'workQuality', label: 'Work Quality (1–10)', min: 1, max: 10, suffix: '/10', weight: '20%' },
                  { key: 'peerCollaboration', label: 'Peer Collaboration (1–10)', min: 1, max: 10, suffix: '/10', weight: '10%' },
                  { key: 'attendancePunctuality', label: 'Attendance & Punctuality (1–10)', min: 1, max: 10, suffix: '/10', weight: '10%' },
                ].map(field => {
                  const val = evalForm[field.key] || (field.key === 'taskDeliveryRate' ? 80 : 8);
                  return (
                    <div key={field.key} style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
                          {field.label} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>({field.weight} weight)</span>
                        </span>
                        <span style={{ color: scoreColor(field.key === 'taskDeliveryRate' ? val/10 : val), fontWeight: '800', fontSize: '0.82rem' }}>
                          {val}{field.suffix}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={field.min}
                        max={field.max}
                        value={val}
                        onChange={e => updateEvalFormField(field.key, parseInt(e.target.value))}
                        style={{ width: '100%', accentColor: '#6366f1' }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* 🌟 Real-Time Auto Score Summary Banner */}
              {(() => {
                const calc = computeAutomaticScore(evalForm);
                return (
                  <div style={{ padding: '16px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(168,85,247,0.08))', border: `1px solid ${calc.badgeColor}40`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
                        AUTOMATIC COMPOSITE SCORE
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                        <span style={{ fontSize: '1.6rem', fontWeight: '900', color: calc.badgeColor }}>
                          {calc.score} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/ 10</span>
                        </span>
                        <span style={{ padding: '3px 10px', borderRadius: '12px', background: `${calc.badgeColor}20`, color: calc.badgeColor, fontWeight: '800', fontSize: '0.75rem' }}>
                          {calc.tierIcon} {calc.grade}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Weighted: 35% Role KPI + 25% Delivery + 20% Quality + 10% Collab + 10% Attendance
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: '700' }}>Evaluator Review Comments</label>
                <textarea
                  className="form-input"
                  rows={2}
                  value={evalForm.evaluatorComments || ''}
                  onChange={e => updateEvalFormField('evaluatorComments', e.target.value)}
                  placeholder="Strengths, KPI achievements, and promotion/bonus recommendations..."
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <button type="button" onClick={() => setShowEvalModal(false)} className="btn btn-secondary" style={{ padding: '9px 18px' }}>
                  Cancel
                </button>
                <button type="submit" className="btn gradient-btn-primary" style={{ padding: '9px 24px', fontWeight: '800' }}>
                  {editingEval ? 'Update Evaluation' : 'Save & Score Employee ⭐'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EOTM Modal */}
      {showEOTMModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '460px', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0 }}>🏆 Nominate Employee of the Month</h3>
              <button onClick={() => setShowEOTMModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X style={{ width: '20px', height: '20px' }} /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); addEOTMNomination(eotmForm); setShowEOTMModal(false); }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Employee Name *</label>
                  <input className="form-input" value={eotmForm.employeeName} onChange={e => setEotmForm(f => ({ ...f, employeeName: e.target.value }))} required placeholder="Full name" list="staff-list" />
                  <datalist id="staff-list">{allStaff.map(s => <option key={s.id} value={s.name} />)}</datalist>
                </div>
                <div>
                  <label className="form-label">Role / Designation</label>
                  <input className="form-input" value={eotmForm.role} onChange={e => setEotmForm(f => ({ ...f, role: e.target.value }))} placeholder="Role" />
                </div>
                <div>
                  <label className="form-label">Month</label>
                  <select className="form-input" value={eotmForm.month} onChange={e => setEotmForm(f => ({ ...f, month: parseInt(e.target.value) }))}>
                    {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m,i) => <option key={m} value={i+1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Year</label>
                  <input type="number" className="form-input" value={eotmForm.year} onChange={e => setEotmForm(f => ({ ...f, year: parseInt(e.target.value) }))} />
                </div>
              </div>
              <div>
                <label className="form-label">Reason for Nomination *</label>
                <textarea className="form-input" rows={3} value={eotmForm.reason} onChange={e => setEotmForm(f => ({ ...f, reason: e.target.value }))} required placeholder="Why does this person deserve recognition this month?" />
              </div>
              <div>
                <label className="form-label">Nominated By</label>
                <input className="form-input" value={eotmForm.nominatedBy} onChange={e => setEotmForm(f => ({ ...f, nominatedBy: e.target.value }))} placeholder="Your name" />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowEOTMModal(false)} className="btn btn-secondary" style={{ padding: '9px 18px' }}>Cancel</button>
                <button type="submit" className="btn gradient-btn-primary" style={{ padding: '9px 22px' }}>Nominate 🏆</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 📊 SPREADSHEET INGESTION PREVIEW & CONFIRMATION MODAL */}
      {previewModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content glass-card" style={{ maxWidth: '840px', width: '94%', maxHeight: '90vh', overflowY: 'auto', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '900', margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  📊 Preview & Confirm Performance Sheet Ingestion
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Successfully extracted and scored {parsedPreviewRecords.length} staff records for {eotmPeriod}.
                </span>
              </div>
              <button onClick={() => setPreviewModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            {/* Spotlight On Detected Winner */}
            {parsedPreviewRecords[0] && (
              <div style={{
                padding: '16px 20px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.18), rgba(16, 185, 129, 0.12))',
                border: '1.5px solid #f59e0b',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '18px',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#f59e0b', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                    👑
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: '800', textTransform: 'uppercase' }}>
                      PROJECTED #1 EMPLOYEE OF THE MONTH
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: '900', color: 'var(--text-primary)' }}>
                      {parsedPreviewRecords[0].employeeName}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {parsedPreviewRecords[0].role} • {parsedPreviewRecords[0].department}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: '950', color: '#f59e0b' }}>
                    {parsedPreviewRecords[0].compositeScore}%
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#10b981' }}>
                    {parsedPreviewRecords[0].tier}
                  </div>
                </div>
              </div>
            )}

            {/* Table of Parsed Records */}
            <div className="glass-card" style={{ padding: 0, overflow: 'hidden', marginBottom: '18px' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.03)' }}>
                      <th style={{ padding: '9px 12px', textAlign: 'center', fontSize: '0.68rem', fontWeight: '800', color: 'var(--text-muted)' }}>RANK</th>
                      <th style={{ padding: '9px 12px', textAlign: 'left', fontSize: '0.68rem', fontWeight: '800', color: 'var(--text-muted)' }}>STAFF MEMBER</th>
                      <th style={{ padding: '9px 12px', textAlign: 'left', fontSize: '0.68rem', fontWeight: '800', color: 'var(--text-muted)' }}>ROLE</th>
                      <th style={{ padding: '9px 12px', textAlign: 'center', fontSize: '0.68rem', fontWeight: '800', color: 'var(--text-muted)' }}>VELOCITY</th>
                      <th style={{ padding: '9px 12px', textAlign: 'center', fontSize: '0.68rem', fontWeight: '800', color: 'var(--text-muted)' }}>QUALITY</th>
                      <th style={{ padding: '9px 12px', textAlign: 'center', fontSize: '0.68rem', fontWeight: '800', color: 'var(--text-muted)' }}>ATTENDANCE</th>
                      <th style={{ padding: '9px 12px', textAlign: 'center', fontSize: '0.68rem', fontWeight: '800', color: 'var(--text-muted)' }}>COMPOSITE SCORE</th>
                      <th style={{ padding: '9px 12px', textAlign: 'center', fontSize: '0.68rem', fontWeight: '800', color: 'var(--text-muted)' }}>TIER</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedPreviewRecords.map((emp) => (
                      <tr key={emp.employeeId || emp.rank} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '9px 12px', textAlign: 'center', fontWeight: '900' }}>
                          {emp.rank === 1 ? '👑 #1' : emp.rank === 2 ? '🥈 #2' : emp.rank === 3 ? '🥉 #3' : `#${emp.rank}`}
                        </td>
                        <td style={{ padding: '9px 12px', fontWeight: '700', color: 'var(--text-primary)' }}>
                          {emp.employeeName}
                        </td>
                        <td style={{ padding: '9px 12px', color: 'var(--text-secondary)' }}>
                          {emp.role}
                        </td>
                        <td style={{ padding: '9px 12px', textAlign: 'center', color: '#10b981', fontWeight: '700' }}>
                          {emp.taskVelocity}%
                        </td>
                        <td style={{ padding: '9px 12px', textAlign: 'center', fontWeight: '700' }}>
                          {emp.workQuality}/10
                        </td>
                        <td style={{ padding: '9px 12px', textAlign: 'center', fontWeight: '700' }}>
                          {emp.attendance}/10
                        </td>
                        <td style={{ padding: '9px 12px', textAlign: 'center', fontWeight: '950', color: emp.badgeColor }}>
                          {emp.compositeScore}%
                        </td>
                        <td style={{ padding: '9px 12px', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '6px', background: `${emp.badgeColor}22`, color: emp.badgeColor, fontWeight: '800' }}>
                            {emp.tierGrade}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sync to evaluations checkbox */}
            <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                id="sync-evals-check"
                checked={syncToEvaluationsCheck}
                onChange={e => setSyncToEvaluationsCheck(e.target.checked)}
                style={{ width: '17px', height: '17px', accentColor: '#6366f1', cursor: 'pointer' }}
              />
              <label htmlFor="sync-evals-check" style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: '600', cursor: 'pointer' }}>
                Automatically sync these imported scores to the system's <strong>Performance Evaluations</strong> list and employee records.
              </label>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="btn btn-secondary"
                style={{ padding: '9px 18px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmEOTMImport}
                className="btn gradient-btn-primary"
                style={{ padding: '9px 24px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Crown style={{ width: '15px', height: '15px' }} />
                <span>Confirm & Crown Employee of the Month 🏆</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔍 KPI FORMULA BREAKDOWN MODAL */}
      {viewingBreakdownRecord && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content glass-card" style={{ maxWidth: '680px', width: '92%', maxHeight: '90vh', overflowY: 'auto', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '900', margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🎯 KPI Benchmark & Score Breakdown
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {viewingBreakdownRecord.employeeName} — {viewingBreakdownRecord.role} ({viewingBreakdownRecord.month})
                </span>
              </div>
              <button onClick={() => setViewingBreakdownRecord(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            {/* Score Summary Box */}
            <div style={{
              padding: '16px 20px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(16, 185, 129, 0.1))',
              border: `1px solid ${viewingBreakdownRecord.badgeColor}40`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800' }}>
                  FINAL WEIGHTED COMPOSITE SCORE
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: '950', color: viewingBreakdownRecord.badgeColor, lineHeight: 1.1, margin: '4px 0' }}>
                  {viewingBreakdownRecord.compositeScore}%
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Evaluated as: <strong>{viewingBreakdownRecord.tier}</strong>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700' }}>EQUIVALENT RATING</div>
                <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#fbbf24' }}>
                  {viewingBreakdownRecord.scoreOutOf10} / 10
                </div>
              </div>
            </div>

            {/* 4 Role KPI Detailed Weights */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '0.76rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>
                1. Role-Specific Benchmarks (40% Total Weight)
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.03)' }}>
                    <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: '0.68rem', fontWeight: '800', color: 'var(--text-muted)' }}>KPI METRIC</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', fontSize: '0.68rem', fontWeight: '800', color: 'var(--text-muted)' }}>TARGET</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', fontSize: '0.68rem', fontWeight: '800', color: 'var(--text-muted)' }}>ACHIEVED</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', fontSize: '0.68rem', fontWeight: '800', color: 'var(--text-muted)' }}>ACHIEVEMENT %</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', fontSize: '0.68rem', fontWeight: '800', color: 'var(--text-muted)' }}>WEIGHT</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: '0.68rem', fontWeight: '800', color: 'var(--text-muted)' }}>CONTRIBUTION</th>
                  </tr>
                </thead>
                <tbody>
                  {viewingBreakdownRecord.kpiResults.map((k, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '9px 10px', fontWeight: '600', color: 'var(--text-primary)' }}>{k.name}</td>
                      <td style={{ padding: '9px 10px', textAlign: 'center', color: 'var(--text-muted)' }}>{k.target}{k.unit}</td>
                      <td style={{ padding: '9px 10px', textAlign: 'center', fontWeight: '800', color: 'var(--text-primary)' }}>{k.achieved}{k.unit}</td>
                      <td style={{ padding: '9px 10px', textAlign: 'center', fontWeight: '800', color: k.achievement >= 100 ? '#10b981' : '#f59e0b' }}>
                        {k.achievement}%
                      </td>
                      <td style={{ padding: '9px 10px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        {Math.round(k.weight * 100)}%
                      </td>
                      <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: '800', color: '#818cf8' }}>
                        +{k.weightedContribution}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 4 Core Competencies Breakdown */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '0.76rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>
                2. Core Competencies & Quality (60% Total Weight)
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    <span>Task Velocity (25% weight)</span>
                    <strong style={{ color: '#10b981' }}>{viewingBreakdownRecord.taskVelocity}%</strong>
                  </div>
                </div>

                <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    <span>Work Quality (15% weight)</span>
                    <strong style={{ color: '#3b82f6' }}>{viewingBreakdownRecord.workQuality} / 10</strong>
                  </div>
                </div>

                <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    <span>Peer Review (10% weight)</span>
                    <strong style={{ color: '#8b5cf6' }}>{viewingBreakdownRecord.peerReview} / 10</strong>
                  </div>
                </div>

                <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    <span>Attendance & Punctuality (10% weight)</span>
                    <strong style={{ color: '#f59e0b' }}>{viewingBreakdownRecord.attendance} / 10</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Citation */}
            <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.5 }}>
              "{viewingBreakdownRecord.aiSummary}"
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setViewingBreakdownRecord(null)} className="btn btn-secondary" style={{ padding: '8px 20px' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Role KPI Modal */}
      {showAddRoleModal && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content glass-card" style={{ maxWidth: '520px', width: '90%', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                  + Add Role KPI Mapping
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Define target deliverables and review benchmarks for a corporate role.
                </span>
              </div>
              <button onClick={() => setShowAddRoleModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (!newRoleForm.role.trim()) return;
              const kpiList = newRoleForm.kpisText
                .split('\n')
                .map(k => k.trim())
                .filter(Boolean);
              
              const newRole = {
                role: newRoleForm.role.trim(),
                department: newRoleForm.department,
                iconColor: '#6366f1',
                kpis: kpiList.length > 0 ? kpiList : ['Standard Monthly Performance Review']
              };

              setRoleKPIs(prev => [...prev.filter(r => r.role.toLowerCase() !== newRole.role.toLowerCase()), newRole]);
              setShowAddRoleModal(false);
              setNewRoleForm({ role: '', department: 'Operations & Delivery', kpisText: '' });
            }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: '700' }}>Role / Designation Title *</label>
                <input
                  className="form-input"
                  required
                  placeholder="e.g. Lead UI/UX Designer or DevOps Engineer"
                  value={newRoleForm.role}
                  onChange={e => setNewRoleForm(f => ({ ...f, role: e.target.value }))}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: '700' }}>Department</label>
                <select
                  className="form-input"
                  value={newRoleForm.department}
                  onChange={e => setNewRoleForm(f => ({ ...f, department: e.target.value }))}
                >
                  <option value="Engineering & Tech">Engineering & Tech</option>
                  <option value="Design & Creative">Design & Creative</option>
                  <option value="Content & Social">Content & Social</option>
                  <option value="Paid Media & SEO">Paid Media & SEO</option>
                  <option value="Sales & Growth">Sales & Growth</option>
                  <option value="Operations & Delivery">Operations & Delivery</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Finance & Accounting">Finance & Accounting</option>
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: '700' }}>
                  Target KPI Items (One per line) *
                </label>
                <textarea
                  className="form-input"
                  rows={4}
                  required
                  placeholder={"e.g.\n40+ Design Assets / Month\n< 2 Revision Rounds on Creatives\nSame-Day Turnaround for Ad Creatives\nHigh Visual Rating (> 4.5/5)"}
                  value={newRoleForm.kpisText}
                  onChange={e => setNewRoleForm(f => ({ ...f, kpisText: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddRoleModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn gradient-btn-primary">
                  Save Role KPI Mapping
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default PerformanceBoard;
