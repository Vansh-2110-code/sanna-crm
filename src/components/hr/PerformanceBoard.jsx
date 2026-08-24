import React, { useState, useMemo } from 'react';
import { useCRM } from '../../context/CRMContext';
import { Award, Plus, Edit2, Trash2, X, Download, Star, Target, Users, TrendingUp, Trophy, Search, Cake, Gift, Heart, PartyPopper, Calendar } from 'lucide-react';
import { exportToCSV } from '../../utils/csvExporter';
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
          eotmNominations = [], addEOTMNomination, deleteEOTMNomination,
          employees = [], interns = [] } = useCRM();

  const [activeTab, setActiveTab] = useState('evaluations');
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [showEOTMModal, setShowEOTMModal] = useState(false);
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [editingEval, setEditingEval] = useState(null);
  const [searchQ, setSearchQ] = useState('');
  const [bdayMonth, setBdayMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [wishedStaffIds, setWishedStaffIds] = useState([]);

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => { setEotmForm(emptyEOTM); setShowEOTMModal(true); }} className="btn gradient-btn-primary" style={{ padding: '8px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Trophy style={{ width: '13px', height: '13px' }} /> Nominate Employee
            </button>
          </div>
          {eotmNominations.length === 0 ? (
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No nominations yet. Recognise your star performers!
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {eotmNominations.map(nom => (
                <div key={nom.id} className="glass-card" style={{ padding: '24px', textAlign: 'center', background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(251,146,60,0.08))', borderTop: '4px solid #f59e0b' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #fb923c)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: '1.8rem' }}>🏆</div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: '900', color: 'var(--text-primary)', margin: '0 0 4px' }}>{nom.employeeName}</h4>
                  <div style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: '700', marginBottom: '8px' }}>{nom.role}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '12px' }}>
                    {MONTHS[(nom.month||1)-1]} {nom.year}
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.5 }}>{nom.reason}</p>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Nominated by: <strong style={{ color: 'var(--text-secondary)' }}>{nom.nominatedBy}</strong></div>
                  <button onClick={() => deleteEOTMNomination(nom.id)} style={{ marginTop: '12px', background: 'rgba(244,63,94,0.1)', border: 'none', color: '#f43f5e', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600' }}>Remove</button>
                </div>
              ))}
            </div>
          )}
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
