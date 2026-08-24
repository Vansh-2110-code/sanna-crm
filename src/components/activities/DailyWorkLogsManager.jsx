import React, { useState, useMemo } from 'react';
import { useCRM } from '../../context/CRMContext';
import exportToCSV from '../../utils/csvExporter';
import {
  BookOpen,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  User,
  GraduationCap,
  Briefcase,
  GitPullRequest,
  ExternalLink,
  FileSpreadsheet,
  Trash2,
  Edit2,
  Check,
  X,
  Sparkles,
  MessageSquare,
  Radio,
  Star,
  Layers,
  Building
} from 'lucide-react';

const SHIFT_MODES = ['Office Campus', 'Remote / Hybrid', 'Client Site / Field'];

const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const clean = timeStr.trim();
  const isPM = clean.toUpperCase().includes('PM');
  const isAM = clean.toUpperCase().includes('AM');
  const numPart = clean.replace(/AM|PM/gi, '').trim();
  const parts = numPart.split(':').map(Number);
  let hours = parts[0] || 0;
  const minutes = parts[1] || 0;
  if (isPM && hours !== 12) hours += 12;
  if (isAM && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

const DailyWorkLogsManager = () => {
  const {
    dailyTasks = [],
    loginSessions = [],
    addDailyTask,
    updateDailyTask,
    deleteDailyTask,
    approveDailyTask,
    employees = [],
    interns = [],
    currentUser,
    activeRole
  } = useCRM();

  const calculateRealActiveHours = (log) => {
    if (!loginSessions || !Array.isArray(loginSessions)) {
      return log.hoursSpent && parseFloat(log.hoursSpent) > 4 ? parseFloat(log.hoursSpent) : 8.0;
    }

    const logStaffId = (log.staffId || '').toLowerCase().trim();
    const logStaffName = (log.staffName || '').toLowerCase().trim();
    const logDate = log.date;

    const matchingSessions = loginSessions.filter(s => {
      const sUserId = (s.userId || s.user_id || '').toLowerCase().trim();
      const sUserName = (s.userName || s.user_name || '').toLowerCase().trim();
      const isStaff = (logStaffId && (sUserId === logStaffId || sUserId.includes(logStaffId) || logStaffId.includes(sUserId))) ||
                      (logStaffName && (sUserName === logStaffName || sUserName.includes(logStaffName) || logStaffName.includes(sUserName)));
      
      const sDate = s.date || (s.loginTime ? s.loginTime.split('T')[0] : '') || (s.login_time ? s.login_time.split('T')[0] : '');
      const isDate = !logDate || !sDate || sDate === logDate;
      return isStaff && isDate;
    });

    if (matchingSessions.length > 0) {
      let totalMins = 0;
      matchingSessions.forEach(s => {
        const inM = parseTimeToMinutes(s.punchInTime || '09:00 AM');
        if (s.status === 'Active') {
          const now = new Date();
          const currentISTHours = (now.getUTCHours() + 5 + Math.floor((now.getUTCMinutes() + 30) / 60)) % 24;
          const currentISTMinutes = (now.getUTCMinutes() + 30) % 60;
          const currentM = currentISTHours * 60 + currentISTMinutes;
          let diff = currentM - inM;
          if (diff < 0) diff += 1440;
          totalMins += Math.max(0, diff);
        } else {
          const outM = s.punchOutTime ? parseTimeToMinutes(s.punchOutTime) : inM + 480;
          let diff = outM - inM;
          if (diff < 0) diff += 1440;
          totalMins += Math.max(0, diff);
        }
      });

      if (totalMins > 0) {
        const calculatedHours = Math.round((totalMins / 60) * 10) / 10;
        return calculatedHours >= 0.5 ? calculatedHours : 8.0;
      }
    }

    if (log.hoursSpent && parseFloat(log.hoursSpent) > 4) {
      return parseFloat(log.hoursSpent);
    }
    return 8.0;
  };

  const isManagerOrAdmin = (activeRole?.permissions || []).includes('super_admin') ||
    activeRole?.id === 'role-admin' ||
    activeRole?.id === 'role-mgr' ||
    activeRole?.id === 'role-hr';

  const isAdmin = (activeRole?.permissions || []).includes('super_admin') ||
    (activeRole?.permissions || []).includes('security_admin') ||
    activeRole?.id === 'role-admin' ||
    (activeRole?.name || '').toLowerCase().includes('admin') ||
    currentUser?.roleId === 'role-admin' ||
    currentUser?.role === 'Super Admin / Org Admin' ||
    (currentUser?.role || '').toLowerCase().includes('admin') ||
    currentUser?.username === 'admin';

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'EMPLOYEES' | 'INTERNS' | 'PENDING' | 'MY_LOGS'
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [reviewModalTask, setReviewModalTask] = useState(null);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewRating, setReviewRating] = useState(5);

  // Combined staff directory for selector
  const allStaff = useMemo(() => {
    if (!isAdmin) {
      return [{
        id: currentUser?.id || 'EMP-001',
        name: currentUser?.name || 'Staff Member',
        type: currentUser?.role?.includes('Intern') ? 'Intern' : 'Employee',
        designation: currentUser?.designation || currentUser?.role || 'Developer',
        email: currentUser?.email || ''
      }];
    }
    const list = [];
    (employees || []).forEach(e => {
      list.push({ id: e.id, name: e.name, type: 'Employee', designation: e.designation, email: e.email });
    });
    (interns || []).forEach(i => {
      list.push({ id: i.id, name: i.name, type: 'Intern', designation: `${i.department} (Intern)`, email: i.email });
    });
    return list;
  }, [employees, interns, isAdmin, currentUser]);

  // Form State
  const [logForm, setLogForm] = useState({
    staffId: currentUser?.id || allStaff[0]?.id || 'EMP-001',
    staffType: currentUser?.role?.includes('Intern') ? 'Intern' : 'Employee',
    date: todayStr,
    workMode: 'Office Campus',
    hoursSpent: 8.0,
    project: 'Astra Core CRM Platform',
    taskTitle: '',
    deliverableNotes: '',
    learnings: '',
    blockers: '',
    tomorrowPlan: '',
    proofUrl: '',
    priority: 'Medium'
  });

  const handleOpenSubmitModal = () => {
    const defaultStaff = allStaff.find(s => s.id === currentUser?.id) || allStaff[0];
    const liveHours = calculateRealActiveHours({ staffId: defaultStaff?.id, staffName: defaultStaff?.name, date: todayStr });
    setLogForm({
      staffId: defaultStaff?.id || 'EMP-001',
      staffType: defaultStaff?.type || 'Employee',
      date: todayStr,
      workMode: 'Office Campus',
      hoursSpent: liveHours || 8.0,
      project: 'Astra Core CRM Platform',
      taskTitle: '',
      deliverableNotes: '',
      learnings: '',
      blockers: '',
      tomorrowPlan: '',
      proofUrl: '',
      priority: 'Medium'
    });
    setShowSubmitModal(true);
  };

  const handleSubmitLog = (e) => {
    e.preventDefault();
    if (!logForm.taskTitle || !logForm.deliverableNotes) {
      alert('Please provide a summary title and detailed work deliverables notes.');
      return;
    }

    const assignedStaff = allStaff.find(s => s.id === logForm.staffId) || { name: currentUser?.name || 'Staff' };

    addDailyTask({
      taskTitle: logForm.taskTitle,
      date: logForm.date,
      staffId: logForm.staffId,
      staffName: assignedStaff.name,
      staffType: logForm.staffType,
      workMode: logForm.workMode,
      hoursSpent: parseFloat(logForm.hoursSpent) || 8.0,
      project: logForm.project,
      category: logForm.staffType === 'Intern' ? 'Intern Learning & Deliverables' : 'Core Engineering & Sales',
      status: 'Completed',
      priority: logForm.priority,
      deliverableNotes: logForm.deliverableNotes,
      learnings: logForm.learnings,
      blockers: logForm.blockers,
      tomorrowPlan: logForm.tomorrowPlan,
      proofUrl: logForm.proofUrl,
      approvalStatus: 'Pending',
      managerFeedback: ''
    });

    setShowSubmitModal(false);
  };

  const handleApproveWithReview = (e) => {
    e.preventDefault();
    if (!reviewModalTask) return;

    approveDailyTask(reviewModalTask.id, reviewNote);
    if (updateDailyTask) {
      updateDailyTask(reviewModalTask.id, {
        managerRating: reviewRating,
        reviewedBy: currentUser?.name || 'Supervisor'
      });
    }

    setReviewModalTask(null);
    setReviewNote('');
  };

  // Role Access Scope: ONLY Admin sees all staff work logs. Non-admins ONLY see their own work logs.
  const visibleLogs = useMemo(() => {
    if (isAdmin) return dailyTasks || [];
    return (dailyTasks || []).filter(task => {
      const isMatchId = currentUser?.id && (task.staffId === currentUser.id || task.staffId?.toLowerCase() === currentUser.id?.toLowerCase());
      const isMatchName = currentUser?.name && task.staffName?.toLowerCase() === currentUser.name?.toLowerCase();
      const isMatchUsername = currentUser?.username && (task.staffId?.toLowerCase() === currentUser.username?.toLowerCase() || task.staffName?.toLowerCase() === currentUser.username?.toLowerCase());
      const isMatchEmail = currentUser?.email && task.staffEmail?.toLowerCase() === currentUser.email?.toLowerCase();
      return isMatchId || isMatchName || isMatchUsername || isMatchEmail;
    });
  }, [dailyTasks, isAdmin, currentUser]);

  // Filtered Daily Logs
  const filteredLogs = useMemo(() => {
    return visibleLogs.filter(task => {
      // Type Filter
      if (filterType === 'EMPLOYEES' && task.staffType === 'Intern') return false;
      if (filterType === 'INTERNS' && task.staffType !== 'Intern') return false;
      if (filterType === 'PENDING' && task.approvalStatus === 'Approved') return false;
      if (filterType === 'MY_LOGS' && task.staffId !== currentUser?.id && task.staffName !== currentUser?.name) return false;

      // Date Filter
      if (selectedDate && task.date !== selectedDate) return false;

      // Search Query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (task.taskTitle || '').toLowerCase().includes(q);
        const matchStaff = (task.staffName || '').toLowerCase().includes(q);
        const matchProject = (task.project || '').toLowerCase().includes(q);
        const matchNotes = (task.deliverableNotes || '').toLowerCase().includes(q);
        const matchLearnings = (task.learnings || '').toLowerCase().includes(q);
        const matchBlockers = (task.blockers || '').toLowerCase().includes(q);
        if (!matchTitle && !matchStaff && !matchProject && !matchNotes && !matchLearnings && !matchBlockers) {
          return false;
        }
      }

      return true;
    });
  }, [visibleLogs, filterType, selectedDate, searchQuery, currentUser]);

  // Aggregate Metrics
  const totalLogsCount = filteredLogs.length;
  const totalHoursLogged = Math.round(filteredLogs.reduce((sum, l) => sum + (parseFloat(calculateRealActiveHours(l)) || 0), 0) * 10) / 10;
  const employeeLogsCount = visibleLogs.filter(t => t.staffType !== 'Intern').length;
  const internLogsCount = visibleLogs.filter(t => t.staffType === 'Intern').length;
  const pendingReviewsCount = visibleLogs.filter(t => t.approvalStatus !== 'Approved').length;
  const blockersCount = visibleLogs.filter(t => t.blockers && t.blockers.trim().length > 0 && t.blockers.toLowerCase() !== 'none').length;

  // Export to CSV
  const handleExportCSV = () => {
    let csv = `Log ID,Date,Staff Name,Type,Work Mode,Project,Summary Milestone,Hours,Deliverables Notes,Learnings,Blockers,Tomorrow Plan,PR/Commit URL,Approval Status,Supervisor Review\n`;
    filteredLogs.forEach(l => {
      csv += `"${l.id}","${l.date}","${l.staffName}","${l.staffType || 'Employee'}","${l.workMode || 'Office'}","${l.project || ''}","${(l.taskTitle || '').replace(/"/g, '""')}",${calculateRealActiveHours(l)},"${(l.deliverableNotes || '').replace(/"/g, '""')}","${(l.learnings || '').replace(/"/g, '""')}","${(l.blockers || '').replace(/"/g, '""')}","${(l.tomorrowPlan || '').replace(/"/g, '""')}","${l.proofUrl || ''}","${l.approvalStatus || 'Pending'}","${(l.managerFeedback || '').replace(/"/g, '""')}"\n`;
    });

    exportToCSV(csv, `Daily_Work_Logs_${todayStr}.csv`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Banner */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: '#60a5fa', fontWeight: '700', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <BookOpen style={{ width: '15px', height: '15px' }} />
            Workforce Activity & Daily Standup Center
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '900', margin: '4px 0 6px', background: 'linear-gradient(135deg, #fff 0%, #60a5fa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Staff & Intern Daily Work Logs
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
            Unified daily submission portal for <strong>employees & interns</strong> to record completed deliverables, skills learned, blockers faced, and supervisor reviews.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={handleExportCSV}
            className="btn btn-secondary"
            style={{ padding: '10px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}
          >
            <FileSpreadsheet style={{ width: '16px', height: '16px' }} />
            <span>Export Logs (.CSV)</span>
          </button>

          <button
            onClick={handleOpenSubmitModal}
            className="btn gradient-btn-primary"
            style={{ padding: '10px 18px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}
          >
            <Plus style={{ width: '18px', height: '18px' }} />
            <span>+ Submit Today's Work Log</span>
          </button>
        </div>
      </div>

      {/* Overview Metric Badges */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        
        <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen style={{ width: '20px', height: '20px', color: '#818cf8' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Total Logs Recorded</div>
            <div style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-primary)' }}>{totalLogsCount} Logs</div>
            <div style={{ fontSize: '0.7rem', color: '#818cf8' }}>{employeeLogsCount} Employees · {internLogsCount} Interns</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock style={{ width: '20px', height: '20px', color: '#34d399' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Hours Logged</div>
            <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#34d399' }}>{totalHoursLogged.toFixed(1)} hrs</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Daily timesheet accumulation</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 style={{ width: '20px', height: '20px', color: '#fbbf24' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Pending Review</div>
            <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#fbbf24' }}>{pendingReviewsCount} Awaiting</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Supervisor feedback required</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle style={{ width: '20px', height: '20px', color: '#f87171' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Blockers Flagged</div>
            <div style={{ fontSize: '1.3rem', fontWeight: '800', color: blockersCount > 0 ? '#f87171' : '#34d399' }}>
              {blockersCount} Blockers
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Roadblocks reported by staff</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        
        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: 'All Daily Logs', count: dailyTasks.length },
            { id: 'EMPLOYEES', label: 'Employees Only', count: employeeLogsCount },
            { id: 'INTERNS', label: 'Interns Only', count: internLogsCount },
            { id: 'PENDING', label: 'Pending Review', count: pendingReviewsCount },
            { id: 'MY_LOGS', label: 'My Submissions', count: dailyTasks.filter(t => t.staffId === currentUser?.id || t.staffName === currentUser?.name).length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: filterType === tab.id ? '700' : '500',
                border: filterType === tab.id ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
                background: filterType === tab.id ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(168, 85, 247, 0.15) 100%)' : 'transparent',
                color: filterType === tab.id ? '#818cf8' : 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>{tab.label}</span>
              <span style={{
                padding: '1px 5px',
                borderRadius: '10px',
                background: filterType === tab.id ? '#6366f1' : 'rgba(255,255,255,0.08)',
                color: filterType === tab.id ? '#fff' : 'var(--text-muted)',
                fontSize: '0.68rem',
                fontWeight: '700'
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Date Filter & Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar style={{ width: '15px', height: '15px', color: '#818cf8' }} />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="form-input"
              style={{ padding: '6px 10px', fontSize: '0.78rem', width: '135px' }}
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate('')}
                title="Clear date filter"
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
              >
                <X style={{ width: '14px', height: '14px' }} />
              </button>
            )}
          </div>

          <div style={{ position: 'relative', width: '200px' }}>
            <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '13px', height: '13px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search logs & deliverables..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ width: '100%', paddingLeft: '30px', fontSize: '0.78rem' }}
            />
          </div>
        </div>
      </div>

      {/* Daily Logs Feed List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredLogs.length === 0 ? (
          <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <BookOpen style={{ width: '48px', height: '48px', margin: '0 auto 12px auto', opacity: 0.3 }} />
            <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 6px' }}>
              No Daily Work Logs Found
            </h4>
            <p style={{ fontSize: '0.85rem', margin: '0 0 16px' }}>
              No work logs match the selected filter or date. Click below to submit your daily activity diary.
            </p>
            <button onClick={handleOpenSubmitModal} className="btn gradient-btn-primary" style={{ padding: '8px 18px', fontSize: '0.82rem' }}>
              + Submit Today's Work Log
            </button>
          </div>
        ) : (
          filteredLogs.map(log => {
            const isIntern = log.staffType === 'Intern';
            const isApproved = log.approvalStatus === 'Approved';
            const hasBlockers = log.blockers && log.blockers.trim().length > 0 && log.blockers.toLowerCase() !== 'none';

            return (
              <div
                key={log.id}
                className="glass-card"
                style={{
                  padding: '22px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  borderLeft: hasBlockers ? '4px solid #ef4444' : isApproved ? '4px solid #10b981' : '4px solid #6366f1'
                }}
              >
                {/* Header: User Avatar, Name, Type, Date, Hours */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: isIntern ? 'linear-gradient(135deg, #a855f7, #ec4899)' : 'linear-gradient(135deg, #3b82f6, #6366f1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontWeight: '800',
                      fontSize: '1.1rem'
                    }}>
                      {log.staffName?.charAt(0) || 'S'}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                          {log.staffName}
                        </h4>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: isIntern ? 'rgba(168, 85, 247, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                          color: isIntern ? '#c084fc' : '#60a5fa',
                          fontSize: '0.7rem',
                          fontWeight: '800',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {isIntern ? <GraduationCap style={{ width: '12px', height: '12px' }} /> : <Briefcase style={{ width: '12px', height: '12px' }} />}
                          {log.staffType || 'Employee'}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.78rem', color: '#a5b4fc', marginTop: '2px' }}>
                        Project: <strong>{log.project || 'Astra Core CRM'}</strong> · Mode: <span style={{ color: 'var(--text-secondary)' }}>{log.workMode || 'Office Campus'}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border-color)',
                      padding: '5px 10px',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      <Calendar style={{ width: '13px', height: '13px', color: '#818cf8' }} />
                      <span>{log.date}</span>
                    </div>

                    <div style={{
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      padding: '5px 10px',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: '800',
                      color: '#34d399',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      <Clock style={{ width: '13px', height: '13px' }} />
                      <span>{calculateRealActiveHours(log)} hrs</span>
                    </div>

                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      background: isApproved ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: isApproved ? '#34d399' : '#fbbf24',
                      fontSize: '0.72rem',
                      fontWeight: '800'
                    }}>
                      {isApproved ? '✓ Reviewed & Approved' : '⏳ Pending Supervisor Review'}
                    </span>
                  </div>
                </div>

                {/* Milestone Summary Title */}
                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  📌 {log.taskTitle}
                </div>

                {/* Deliverables / Completed Tasks Section */}
                <div style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-color)',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  lineHeight: 1.6,
                  color: 'var(--text-secondary)'
                }}>
                  <div style={{ color: 'var(--text-primary)', fontWeight: '800', marginBottom: '4px', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Completed Deliverables & Output:
                  </div>
                  {log.deliverableNotes}
                </div>

                {/* Key Learnings & Skills (If present) */}
                {log.learnings && (
                  <div style={{
                    background: 'rgba(168, 85, 247, 0.05)',
                    border: '1px solid rgba(168, 85, 247, 0.2)',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    color: '#e9d5ff'
                  }}>
                    <strong style={{ color: '#c084fc' }}>💡 Key Learnings & Skills Explored: </strong>
                    {log.learnings}
                  </div>
                )}

                {/* Blockers & Roadblocks (If present) */}
                {hasBlockers && (
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    color: '#fca5a5'
                  }}>
                    <strong style={{ color: '#f87171' }}>⚠️ Blockers / Assistance Needed: </strong>
                    {log.blockers}
                  </div>
                )}

                {/* Tomorrow's Plan (If present) */}
                {log.tomorrowPlan && (
                  <div style={{
                    background: 'rgba(59, 130, 246, 0.05)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    color: '#bfdbfe'
                  }}>
                    <strong style={{ color: '#60a5fa' }}>🎯 Tomorrow's Planned Priorities: </strong>
                    {log.tomorrowPlan}
                  </div>
                )}

                {/* Bottom Bar: PR Links, Supervisor Feedback & Actions */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px',
                  paddingTop: '10px',
                  borderTop: '1px solid var(--border-color)',
                  fontSize: '0.78rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                    {log.proofUrl && (
                      <a
                        href={log.proofUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '5px', textDecoration: 'none', fontWeight: '700' }}
                      >
                        <GitPullRequest style={{ width: '14px', height: '14px' }} />
                        <span>View Pull Request / Commit / Output Proof</span>
                        <ExternalLink style={{ width: '12px', height: '12px' }} />
                      </a>
                    )}

                    {log.managerFeedback && (
                      <div style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle2 style={{ width: '13px', height: '13px' }} />
                        <span><strong>Supervisor Review:</strong> "{log.managerFeedback}"</span>
                        {log.managerRating && (
                          <span style={{ color: '#fbbf24', fontWeight: '800' }}>({log.managerRating}★)</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Supervisor Review Action */}
                    {isManagerOrAdmin && (
                      <button
                        onClick={() => {
                          setReviewModalTask(log);
                          setReviewNote(log.managerFeedback || 'Reviewed and approved with distinction.');
                          setReviewRating(log.managerRating || 5);
                        }}
                        className="btn gradient-btn-primary"
                        style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                      >
                        <Check style={{ width: '13px', height: '13px' }} />
                        <span>{isApproved ? 'Update Feedback' : 'Approve Daily Log'}</span>
                      </button>
                    )}

                    {(isManagerOrAdmin || log.staffId === currentUser?.id || log.staffName === currentUser?.name) && (
                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this daily work log entry?')) {
                            deleteDailyTask(log.id);
                          }
                        }}
                        className="btn btn-secondary"
                        style={{ padding: '6px 8px', color: '#f87171' }}
                        title="Delete work log entry"
                      >
                        <Trash2 style={{ width: '13px', height: '13px' }} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: SUBMIT DAILY WORK LOG                                              */}
      {/* ========================================================================= */}
      {showSubmitModal && (
        <div className="modal-overlay" style={{ zIndex: 1000, padding: '16px' }}>
          <div className="modal-content" style={{ maxWidth: '720px', width: '100%', maxHeight: '92vh', padding: '28px', borderRadius: '16px', background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.15)', boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8)' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '18px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(168, 85, 247, 0.25) 100%)', border: '1px solid rgba(99, 102, 241, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BookOpen style={{ width: '22px', height: '22px', color: '#818cf8' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: '0 0 3px 0', color: '#fff' }}>
                    Submit Daily Work Log
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                    Log today's completed deliverables, skills learned, blockers, and proof links.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="btn btn-secondary"
                style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <X style={{ width: '16px', height: '16px' }} />
              </button>
            </div>

            <form onSubmit={handleSubmitLog} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Section 1: Staff Member & Shift */}
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  1. Staff Profile & Schedule
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Staff Member *</label>
                    <select
                      value={logForm.staffId}
                      onChange={(e) => {
                        const selected = allStaff.find(s => s.id === e.target.value);
                        setLogForm({
                          ...logForm,
                          staffId: e.target.value,
                          staffType: selected?.type || 'Employee'
                        });
                      }}
                      className="form-input"
                      style={{ width: '100%', height: '42px' }}
                    >
                      {allStaff.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.designation})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Work Type *</label>
                    <select
                      value={logForm.staffType}
                      onChange={(e) => setLogForm({ ...logForm, staffType: e.target.value })}
                      className="form-input"
                      style={{ width: '100%', height: '42px' }}
                    >
                      <option value="Employee">Employee</option>
                      <option value="Intern">Intern (Learning & Deliverables)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Date *</label>
                    <input
                      type="date"
                      required
                      value={logForm.date}
                      onChange={(e) => setLogForm({ ...logForm, date: e.target.value })}
                      className="form-input"
                      style={{ width: '100%', height: '42px' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Shift / Work Mode *</label>
                    <select
                      value={logForm.workMode}
                      onChange={(e) => setLogForm({ ...logForm, workMode: e.target.value })}
                      className="form-input"
                      style={{ width: '100%', height: '42px' }}
                    >
                      {SHIFT_MODES.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Hours Logged *</label>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      max="18"
                      required
                      value={logForm.hoursSpent}
                      onChange={(e) => setLogForm({ ...logForm, hoursSpent: e.target.value })}
                      className="form-input"
                      style={{ width: '100%', height: '42px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Project & Milestone */}
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  2. Project & Daily Deliverable Milestone
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Project / Client Stream *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Astra Core CRM Platform / Acme Retainer"
                      value={logForm.project}
                      onChange={(e) => setLogForm({ ...logForm, project: e.target.value })}
                      className="form-input"
                      style={{ width: '100%', height: '42px' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Milestone Headline Summary *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Implemented 31-day attendance calendar grid with LOP math"
                      value={logForm.taskTitle}
                      onChange={(e) => setLogForm({ ...logForm, taskTitle: e.target.value })}
                      className="form-input"
                      style={{ width: '100%', height: '42px' }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Completed Tasks & Deliverable Details *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Detailed breakdown of code modules written, clients contacted, bugs resolved, or designs finished today..."
                    value={logForm.deliverableNotes}
                    onChange={(e) => setLogForm({ ...logForm, deliverableNotes: e.target.value })}
                    className="form-input form-textarea"
                    style={{ width: '100%', minHeight: '90px' }}
                  />
                </div>
              </div>

              {/* Section 3: Learnings & Roadblocks */}
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  3. Key Learnings & Roadblocks
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">💡 Key Learnings / Skills Acquired</label>
                    <textarea
                      rows={3}
                      placeholder="Technologies mastered, architecture insights learned..."
                      value={logForm.learnings}
                      onChange={(e) => setLogForm({ ...logForm, learnings: e.target.value })}
                      className="form-input form-textarea"
                      style={{ width: '100%', minHeight: '75px' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">⚠️ Blockers / Roadblocks Faced</label>
                    <textarea
                      rows={3}
                      placeholder="Any blockers, missing dependencies, or help needed..."
                      value={logForm.blockers}
                      onChange={(e) => setLogForm({ ...logForm, blockers: e.target.value })}
                      className="form-input form-textarea"
                      style={{ width: '100%', minHeight: '75px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Tomorrow's Plan & Proof Link */}
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  4. Tomorrow's Plan & Work Evidence
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">🎯 Tomorrow's Planned Priorities</label>
                    <input
                      type="text"
                      placeholder="e.g. Unit tests, PR review, and staging deployment"
                      value={logForm.tomorrowPlan}
                      onChange={(e) => setLogForm({ ...logForm, tomorrowPlan: e.target.value })}
                      className="form-input"
                      style={{ width: '100%', height: '42px' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">🔗 PR / Git Commit / Proof URL</label>
                    <input
                      type="url"
                      placeholder="https://github.com/astracrm/core/pull/142"
                      value={logForm.proofUrl}
                      onChange={(e) => setLogForm({ ...logForm, proofUrl: e.target.value })}
                      className="form-input"
                      style={{ width: '100%', height: '42px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="btn btn-secondary"
                  style={{ padding: '10px 18px', borderRadius: '10px', fontSize: '0.85rem' }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn gradient-btn-primary"
                  style={{ padding: '10px 24px', borderRadius: '10px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <CheckCircle2 style={{ width: '17px', height: '17px' }} />
                  <span>Submit Work Log</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SUPERVISOR APPROVAL & FEEDBACK                                     */}
      {/* ========================================================================= */}
      {reviewModalTask && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '6px' }}>
              Supervisor Review & Approval
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Candidate: <strong>{reviewModalTask.staffName}</strong> ({reviewModalTask.staffType}) · {reviewModalTask.date}
            </p>

            <form onSubmit={handleApproveWithReview} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="form-label">Performance Rating</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        color: star <= reviewRating ? '#fbbf24' : 'var(--text-muted)'
                      }}
                    >
                      <Star style={{ width: '22px', height: '22px', fill: star <= reviewRating ? '#fbbf24' : 'none' }} />
                    </button>
                  ))}
                  <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#fbbf24', marginLeft: '6px' }}>
                    {reviewRating}.0 / 5.0 Stars
                  </span>
                </div>
              </div>

              <div>
                <label className="form-label">Supervisor Feedback Notes *</label>
                <textarea
                  required
                  rows={3}
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  className="form-input"
                  placeholder="e.g. Excellent progress on the scheduled deliverables and prompt blocker resolution."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" onClick={() => setReviewModalTask(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn gradient-btn-primary">
                  Approve Daily Log & Post Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default DailyWorkLogsManager;
