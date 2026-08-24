import React, { useState, useEffect, useMemo } from 'react';
import { useCRM } from '../../context/CRMContext';
import { safeToISODate, getCurrentISTTimeString } from '../../utils/dateUtils';
import exportToCSV from '../../utils/csvExporter';
import {
  Shield,
  Laptop,
  Smartphone,
  Globe,
  Clock,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  LogIn,
  Search,
  Filter,
  FileSpreadsheet,
  Trash2,
  Edit2,
  Plus,
  RefreshCw,
  MapPin,
  Wifi,
  Radio,
  UserCheck,
  Zap,
  Lock,
  X,
  User,
  GraduationCap,
  Briefcase,
  Calendar,
  Link2,
  Layers,
  CheckSquare,
  Square
} from 'lucide-react';

const SHIFT_MODES = ['Office Campus', 'Remote / Hybrid', 'Client Site / Field'];

const LoginSessionsVault = () => {
  const {
    loginSessions = [],
    recordLoginSession,
    revokeLoginSession,
    punchInSession,
    punchOutSession,
    updateLoginSession,
    addLoginSession,
    deleteLoginSession,
    clubLoginSessions,
    autoMarkAttendanceFromSessions,
    syncAllSessionsToAttendance,
    currentUser,
    activeRole,
    employees = [],
    interns = []
  } = useCRM();

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

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All'); // 'All' | 'Active' | 'Logged Out' | 'Terminated'
  const [filterStaffType, setFilterStaffType] = useState('All'); // 'All' | 'Employee' | 'Intern'
  const [selectedDate, setSelectedDate] = useState('');
  const [liveElapsedSeconds, setLiveElapsedSeconds] = useState(0);
  const [syncFeedback, setSyncFeedback] = useState(null);

  // Club / Merge Sessions State
  const [selectedSessionIds, setSelectedSessionIds] = useState([]);
  const [showClubModal, setShowClubModal] = useState(false);
  const [clubTargetSession, setClubTargetSession] = useState(null);
  const [clubSecondarySessionId, setClubSecondarySessionId] = useState('');

  // Modals State
  const [showAddPunchModal, setShowAddPunchModal] = useState(false);
  const [editingSession, setEditingSession] = useState(null);

  // Add Manual Punch Form State
  const [addPunchForm, setAddPunchForm] = useState({
    userId: employees[0]?.id || 'EMP-SANNA-001',
    userName: employees[0]?.name || 'Srinivas (Admin)',
    userEmail: employees[0]?.email || 'admin@sannainnovations.com',
    role: employees[0]?.designation || 'Chief Executive Officer (CEO)',
    staffType: 'Employee',
    date: new Date().toISOString().split('T')[0],
    punchInTime: '09:00 AM',
    punchOutTime: '06:00 PM',
    workMode: 'Office Campus',
    status: 'Logged Out',
    ipAddress: '103.21.144.92 (Office Wi-Fi)',
    device: 'Windows 11 · Chrome (Desktop)',
    location: 'Hyderabad, India (Asia/Kolkata)'
  });

  // Edit Punch Form State
  const [editPunchForm, setEditPunchForm] = useState({
    id: '',
    userName: '',
    punchInTime: '',
    punchOutTime: '',
    workMode: 'Office Campus',
    status: 'Logged Out',
    location: ''
  });

  // Combined staff directory for selector
  const allStaff = useMemo(() => {
    const list = [];
    (employees || []).forEach(e => {
      list.push({ id: e.id, name: e.name, type: 'Employee', designation: e.designation, email: e.email });
    });
    (interns || []).forEach(i => {
      list.push({ id: i.id, name: i.name, type: 'Intern', designation: `${i.department} (Intern)`, email: i.email });
    });
    return list;
  }, [employees, interns]);

  // Find active session for current user
  const currentActiveSession = useMemo(() => {
    return (loginSessions || []).find(s => 
      (s.userId === currentUser?.id || 
       s.userEmail === currentUser?.email || 
       s.userName === currentUser?.name ||
       (currentUser?.name && s.userName && s.userName.toLowerCase().includes(currentUser.name.toLowerCase()))) && 
      s.status === 'Active'
    );
  }, [loginSessions, currentUser]);

  // Live timer for current active session - perfectly synchronized with punchInTime
  useEffect(() => {
    if (!currentActiveSession) {
      setLiveElapsedSeconds(0);
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      if (currentActiveSession.punchInTime) {
        const inMins = parseTimeToMinutes(currentActiveSession.punchInTime);
        const currentISTStr = getCurrentISTTimeString(now);
        const currentISTMins = parseTimeToMinutes(currentISTStr);
        let diffMins = currentISTMins - inMins;
        if (diffMins < 0) diffMins += 1440; // overnight handling
        const currentSecs = now.getSeconds();
        const diffSecs = Math.max(0, diffMins * 60 + currentSecs);
        setLiveElapsedSeconds(diffSecs);
      } else if (currentActiveSession.loginTime) {
        const sessionStart = new Date(currentActiveSession.loginTime).getTime();
        const diffSecs = Math.max(0, Math.floor((now.getTime() - sessionStart) / 1000));
        setLiveElapsedSeconds(diffSecs);
      } else {
        setLiveElapsedSeconds(0);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [currentActiveSession]);

  const formatTimer = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const parseTimeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const clean = String(timeStr).replace(/\s+/g, ' ').trim();
    const isPM = clean.toUpperCase().includes('PM');
    const isAM = clean.toUpperCase().includes('AM');
    const numPart = clean.replace(/AM|PM/gi, '').trim();
    const [h, m] = numPart.split(':').map(Number);
    let hours = h || 0;
    if (isPM && hours !== 12) hours += 12;
    if (isAM && hours === 12) hours = 0;
    return hours * 60 + (m || 0);
  };

  const getSessionDurationMinutes = (session) => {
    const currentISTStr = getCurrentISTTimeString(new Date());
    const currentISTMins = parseTimeToMinutes(currentISTStr);
    const inM = parseTimeToMinutes(session.punchInTime || '09:00 AM');

    if (session.status === 'Active') {
      if (session.punchInTime) {
        let diff = currentISTMins - inM;
        if (diff < 0) diff += 1440; // overnight handling
        return Math.max(0, diff);
      }
      if (session.loginTime) {
        const sessionStart = new Date(session.loginTime).getTime();
        if (!isNaN(sessionStart)) {
          const diffMins = Math.floor((Date.now() - sessionStart) / 60000);
          if (diffMins >= 0) return diffMins;
        }
      }
      return 0;
    }

    const outM = session.punchOutTime ? parseTimeToMinutes(session.punchOutTime) : currentISTMins;
    let diff = outM - inM;
    if (diff < 0) diff += 1440; // overnight handling
    return Math.max(0, diff);
  };

  const getSessionDurationHours = (session) => {
    return getSessionDurationMinutes(session) / 60;
  };

  // Helper to compute duration display badge from punch in & out
  const computeDurationDisplay = (session) => {
    const totalMins = getSessionDurationMinutes(session);
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    const decimalHrs = (totalMins / 60).toFixed(1);

    const formattedTime = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;

    if (session.status === 'Active') {
      return (
        <span style={{ color: '#34d399', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }}></span>
          Active ({formattedTime} · {decimalHrs} hrs)
        </span>
      );
    }

    const isNinePlus = (totalMins / 60) >= 9.0;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: '800', color: isNinePlus ? '#34d399' : 'var(--text-primary)' }}>
          {formattedTime} ({decimalHrs} hrs)
        </span>
        {isNinePlus ? (
          <span style={{
            fontSize: '0.65rem',
            padding: '2px 6px',
            borderRadius: '4px',
            background: 'rgba(16, 185, 129, 0.2)',
            color: '#34d399',
            fontWeight: '800'
          }}>
            ✓ Auto Present
          </span>
        ) : (
          <span style={{
            fontSize: '0.65rem',
            padding: '2px 6px',
            borderRadius: '4px',
            background: 'rgba(255, 255, 255, 0.06)',
            color: 'var(--text-muted)'
          }}>
            &lt; 9h
          </span>
        )}
      </div>
    );
  };

  // Open Edit Modal
  const handleOpenEdit = (session) => {
    setEditingSession(session);
    setEditPunchForm({
      id: session.id,
      userName: session.userName || 'Staff Member',
      punchInTime: session.punchInTime || '09:00 AM',
      punchOutTime: session.status === 'Active' ? '' : (session.punchOutTime || ''),
      workMode: session.workMode || 'Office Campus',
      status: session.status || 'Active',
      location: session.location || 'Hyderabad, India'
    });
  };

  // Save Edit Punch Form
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingSession) return;

    const isActiveStatus = editPunchForm.status === 'Active';
    const payload = {
      punchInTime: editPunchForm.punchInTime,
      punchOutTime: isActiveStatus ? null : (editPunchForm.punchOutTime || null),
      workMode: editPunchForm.workMode,
      status: editPunchForm.status,
      location: editPunchForm.location
    };

    if (updateLoginSession) {
      await updateLoginSession(editingSession.id, payload);
    }

    setEditingSession(null);
  };

  // Save Add Manual Punch Form
  const handleCreateManualPunch = async (e) => {
    e.preventDefault();

    const selectedStaff = allStaff.find(s => s.id === addPunchForm.userId);
    const candidateName = selectedStaff?.name || addPunchForm.userName;
    const candidateRole = selectedStaff?.designation || addPunchForm.role;
    const candidateEmail = selectedStaff?.email || addPunchForm.userEmail;
    const candidateType = selectedStaff?.type || addPunchForm.staffType;

    const dateISO = addPunchForm.date ? new Date(addPunchForm.date).toISOString() : new Date().toISOString();

    const newPunchPayload = {
      userId: addPunchForm.userId,
      userName: candidateName,
      userEmail: candidateEmail,
      role: candidateRole,
      staffType: candidateType,
      loginTime: dateISO,
      punchInTime: addPunchForm.punchInTime || '09:00 AM',
      punchOutTime: addPunchForm.punchOutTime || getCurrentISTTimeString(new Date()),
      workMode: addPunchForm.workMode,
      status: addPunchForm.status,
      ipAddress: addPunchForm.ipAddress,
      device: addPunchForm.device,
      location: addPunchForm.location
    };

    if (addLoginSession) {
      await addLoginSession(newPunchPayload);
    }

    setShowAddPunchModal(false);
  };

  const handleSaveAddPunch = handleCreateManualPunch;

  // Handle toggling session selection for clubbing
  const handleToggleSelectSession = (sessionId) => {
    setSelectedSessionIds(prev => {
      if (prev.includes(sessionId)) {
        return prev.filter(id => id !== sessionId);
      } else {
        if (prev.length >= 2) {
          return [prev[1], sessionId]; // Keep last 2
        }
        return [...prev, sessionId];
      }
    });
  };

  // Open club modal for a session
  const handleOpenClubModal = (session) => {
    setClubTargetSession(session);
    // Find another session of same staff member or default to first available
    const otherSession = (loginSessions || []).find(s => s.id !== session.id && (s.userId === session.userId || s.userName === session.userName));
    setClubSecondarySessionId(otherSession ? otherSession.id : '');
    setShowClubModal(true);
  };

  // Compute clubbed combined metrics for preview
  const clubCalculation = useMemo(() => {
    let s1 = null;
    let s2 = null;

    if (showClubModal && clubTargetSession) {
      s1 = clubTargetSession;
      s2 = (loginSessions || []).find(s => s.id === clubSecondarySessionId);
    } else if (selectedSessionIds.length === 2) {
      s1 = (loginSessions || []).find(s => s.id === selectedSessionIds[0]);
      s2 = (loginSessions || []).find(s => s.id === selectedSessionIds[1]);
    }

    if (!s1 || !s2) return null;

    const currentISTStr = getCurrentISTTimeString(new Date());
    const currentISTMins = parseTimeToMinutes(currentISTStr);

    const s1InM = parseTimeToMinutes(s1.punchInTime || '09:00 AM');
    const s1OutM = s1.punchOutTime ? parseTimeToMinutes(s1.punchOutTime) : currentISTMins;
    const s1Mins = Math.max(0, s1OutM - s1InM);

    const s2InM = parseTimeToMinutes(s2.punchInTime || '09:00 AM');
    const s2OutM = s2.punchOutTime ? parseTimeToMinutes(s2.punchOutTime) : currentISTMins;
    const s2Mins = Math.max(0, s2OutM - s2InM);

    const totalMins = s1Mins + s2Mins;
    const totalHrs = (totalMins / 60).toFixed(1);
    const isNinePlus = (totalMins / 60) >= 9.0;

    const isEitherActive = s1.status === 'Active' || s2.status === 'Active' || !s1.punchOutTime || !s2.punchOutTime;
    const earliestIn = s1InM <= s2InM ? (s1.punchInTime || '09:00 AM') : (s2.punchInTime || '09:00 AM');
    const latestOut = isEitherActive ? 'Online Now' : ((s1.punchOutTime && s2.punchOutTime)
      ? (s1OutM >= s2OutM ? s1.punchOutTime : s2.punchOutTime)
      : (s1.punchOutTime || s2.punchOutTime || currentISTStr));

    return {
      s1,
      s2,
      s1Hrs: (s1Mins / 60).toFixed(1),
      s2Hrs: (s2Mins / 60).toFixed(1),
      totalHrs,
      totalMins,
      isNinePlus,
      earliestIn,
      latestOut
    };
  }, [showClubModal, clubTargetSession, clubSecondarySessionId, selectedSessionIds, loginSessions]);

  // Execute Clubbing
  const handleConfirmClub = async () => {
    let s1Id = null;
    let s2Id = null;

    if (clubTargetSession && clubSecondarySessionId) {
      s1Id = clubTargetSession.id;
      s2Id = clubSecondarySessionId;
    } else if (selectedSessionIds.length === 2) {
      s1Id = selectedSessionIds[0];
      s2Id = selectedSessionIds[1];
    }

    if (!s1Id || !s2Id || s1Id === s2Id) return;

    if (clubLoginSessions) {
      await clubLoginSessions(s1Id, s2Id);
      setSyncFeedback('🔗 Sessions successfully clubbed together! Both logs were merged and their total added work time has been calculated.');
      setTimeout(() => setSyncFeedback(null), 5000);
    }

    setSelectedSessionIds([]);
    setShowClubModal(false);
    setClubTargetSession(null);
    setClubSecondarySessionId('');
  };

  const handleManualSyncAttendance = () => {
    if (syncAllSessionsToAttendance) {
      const count = syncAllSessionsToAttendance(loginSessions);
      setSyncFeedback(`Successfully synchronized: All ${loginSessions.length} sessions evaluated. Employees with 9.0+ hrs daily work logs marked as Present (P).`);
      setTimeout(() => setSyncFeedback(null), 5000);
    }
  };

  // Role Access Scope: ONLY Admin sees all employees. Non-admins ONLY see their own session logs.
  const visibleSessions = useMemo(() => {
    if (isAdmin) return loginSessions;
    return (loginSessions || []).filter(s => {
      const isMatchId = currentUser?.id && (s.userId === currentUser.id || s.userId?.toLowerCase() === currentUser.id?.toLowerCase());
      const isMatchEmail = currentUser?.email && s.userEmail?.toLowerCase() === currentUser.email?.toLowerCase();
      const isMatchUsername = currentUser?.username && (
        s.userId?.toLowerCase() === currentUser.username?.toLowerCase() ||
        s.userName?.toLowerCase() === currentUser.username?.toLowerCase() ||
        (s.userEmail && s.userEmail.toLowerCase().includes(currentUser.username.toLowerCase()))
      );
      const isMatchName = currentUser?.name && (
        s.userName?.toLowerCase().includes(currentUser.name?.toLowerCase()) ||
        currentUser.name?.toLowerCase().includes(s.userName?.toLowerCase())
      );
      // Special alias matching for empsi12 / vansh
      const isVansh = (currentUser?.username === 'empsi12' || currentUser?.username === 'vansh' || currentUser?.name?.toLowerCase().includes('vansh')) &&
        (s.userName?.toLowerCase().includes('vansh') || s.userEmail?.toLowerCase().includes('vansh') || s.userId === 'EMP-SANNA-014');

      return isMatchId || isMatchEmail || isMatchUsername || isMatchName || isVansh;
    });
  }, [loginSessions, isAdmin, currentUser]);

  // Filtered Sessions
  const filteredSessions = useMemo(() => {
    return visibleSessions.filter(s => {
      // Status Filter
      if (filterStatus !== 'All' && s.status !== filterStatus) return false;

      // Staff Type Filter
      if (filterStaffType === 'Employee' && (s.role?.includes('Intern') || s.staffType === 'Intern')) return false;
      if (filterStaffType === 'Intern' && (!s.role?.includes('Intern') && s.staffType !== 'Intern')) return false;

      // Date Filter
      if (selectedDate) {
        const sessionDate = safeToISODate(s.loginTime);
        if (sessionDate !== selectedDate) return false;
      }

      // Search Query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchUser = (s.userName || '').toLowerCase().includes(q);
        const matchEmail = (s.userEmail || '').toLowerCase().includes(q);
        const matchIp = (s.ipAddress || '').toLowerCase().includes(q);
        const matchDev = (s.device || '').toLowerCase().includes(q);
        const matchLoc = (s.location || '').toLowerCase().includes(q);
        const matchRole = (s.role || '').toLowerCase().includes(q);
        if (!matchUser && !matchEmail && !matchIp && !matchDev && !matchLoc && !matchRole) {
          return false;
        }
      }

      return true;
    });
  }, [visibleSessions, filterStatus, filterStaffType, selectedDate, searchQuery]);

  const activeSessionsCount = visibleSessions.filter(s => s.status === 'Active').length;
  const terminatedCount = visibleSessions.filter(s => s.status === 'Terminated').length;

  const handleExportCSV = () => {
    let csv = `Session ID,User ID,User Name,Email,Role,Date,Punch-In Time,Punch-Out Time,Status,Work Mode,IP Address,Location,Device\n`;
    filteredSessions.forEach(s => {
      const sDate = safeToISODate(s.loginTime);
      csv += `"${s.id}","${s.userId}","${s.userName}","${s.userEmail}","${s.role}","${sDate}","${s.punchInTime || ''}","${s.punchOutTime || ''}","${s.status}","${s.workMode || 'Office'}","${s.ipAddress}","${s.location}","${s.device}"\n`;
    });

    exportToCSV(csv, `Daily_Login_Logout_Register_${safeToISODate(new Date())}.csv`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Live Work Clock Hero Banner */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: currentActiveSession ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #475569 0%, #334155 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: currentActiveSession ? '0 0 20px rgba(16, 185, 129, 0.4)' : 'none'
          }}>
            <Clock style={{ width: '28px', height: '28px' }} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <span style={{
                padding: '2px 8px',
                borderRadius: '6px',
                background: currentActiveSession ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: currentActiveSession ? '#34d399' : '#f87171',
                fontSize: '0.7rem',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: currentActiveSession ? '#10b981' : '#ef4444' }} />
                {currentActiveSession ? 'LIVE SESSION ACTIVE' : 'PUNCHED OUT / INACTIVE'}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Session ID: <strong>{currentActiveSession?.id || 'NO ACTIVE SESSION'}</strong>
              </span>
            </div>

            <h3 style={{ fontSize: '1.3rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
              {currentUser?.name} <span style={{ fontSize: '0.85rem', color: '#818cf8', fontWeight: '600' }}>({currentUser?.role || 'Org Admin'})</span>
            </h3>

            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span>Device: {currentActiveSession?.device || 'Windows 11 · Chrome'}</span>
              <span>•</span>
              <span>IP: {currentActiveSession?.ipAddress || '103.21.144.92'}</span>
              <span>•</span>
              <span>Location: {currentActiveSession?.location || 'Mumbai, India'}</span>
            </div>
          </div>
        </div>

        {/* Live Work Timer & Punch In/Out Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Active Work Timer</div>
            <div style={{ fontSize: '1.8rem', fontWeight: '900', color: currentActiveSession ? '#34d399' : 'var(--text-muted)', fontFamily: 'monospace' }}>
              {formatTimer(liveElapsedSeconds)}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Punched In: <strong>{currentActiveSession?.punchInTime || '--:--'}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {currentActiveSession ? (
              <button
                onClick={punchOutSession}
                className="btn"
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  fontWeight: '700',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <LogOut style={{ width: '15px', height: '15px' }} />
                <span>Punch Out Session</span>
              </button>
            ) : (
              <button
                onClick={punchInSession}
                className="btn gradient-btn-primary"
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  fontWeight: '700',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <LogIn style={{ width: '15px', height: '15px' }} />
                <span>Punch In / Start Session</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserCheck style={{ width: '20px', height: '20px', color: '#34d399' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Active Login Sessions</div>
            <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#34d399' }}>{activeSessionsCount} Online</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Employees & Interns logged in</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Globe style={{ width: '20px', height: '20px', color: '#818cf8' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Total Logged Records</div>
            <div style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-primary)' }}>{loginSessions.length} Sessions</div>
            <div style={{ fontSize: '0.7rem', color: '#818cf8' }}>Full audit trail stored</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Lock style={{ width: '20px', height: '20px', color: '#f87171' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Terminated / Revoked</div>
            <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#f87171' }}>{terminatedCount} Revoked</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Security enforced logouts</div>
          </div>
        </div>
      </div>

      {/* Toolbar: Search, Filters & Action Buttons */}
      <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '220px' }}>
          <Search style={{ width: '16px', height: '16px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search employee, intern, IP address, device..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ width: '100%', fontSize: '0.82rem' }}
          />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          
          {/* Staff Type */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>Type:</span>
            <select
              value={filterStaffType}
              onChange={(e) => setFilterStaffType(e.target.value)}
              className="form-input"
              style={{ width: '120px', padding: '6px 10px', fontSize: '0.78rem' }}
            >
              <option value="All">All Staff</option>
              <option value="Employee">Employees</option>
              <option value="Intern">Interns</option>
            </select>
          </div>

          {/* Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="form-input"
              style={{ width: '120px', padding: '6px 10px', fontSize: '0.78rem' }}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active Online</option>
              <option value="Logged Out">Logged Out</option>
              <option value="Terminated">Terminated</option>
            </select>
          </div>

          {/* Date Picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar style={{ width: '14px', height: '14px', color: '#818cf8' }} />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="form-input"
              style={{ width: '130px', padding: '6px 10px', fontSize: '0.78rem' }}
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

          {/* Action Buttons */}
          <button
            onClick={handleManualSyncAttendance}
            className="btn btn-secondary"
            style={{
              padding: '7px 14px',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderColor: 'rgba(16, 185, 129, 0.4)',
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#34d399'
            }}
            title="Automatically mark all employees who worked 9+ hours as Present (P) in Attendance Register"
          >
            <Zap style={{ width: '14px', height: '14px', color: '#34d399' }} />
            <span>⚡ Sync 9h+ to Attendance</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="btn btn-secondary"
            style={{ padding: '7px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <FileSpreadsheet style={{ width: '14px', height: '14px' }} />
            <span>Export CSV</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => setShowAddPunchModal(true)}
              className="btn gradient-btn-primary"
              style={{ padding: '7px 14px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus style={{ width: '14px', height: '14px' }} />
              <span>+ Manual Punch</span>
            </button>
          )}
        </div>
      </div>

      {/* Sync Feedback Banner */}
      {syncFeedback && (
        <div className="glass-card" style={{ padding: '12px 18px', background: 'rgba(16, 185, 129, 0.15)', borderLeft: '4px solid #10b981', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle2 style={{ width: '18px', height: '18px', color: '#10b981' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#34d399' }}>
            {syncFeedback}
          </span>
        </div>
      )}

      {/* Auto Attendance Rule Banner */}
      <div className="glass-card" style={{ padding: '12px 18px', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Zap style={{ width: '18px', height: '18px', color: '#818cf8' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Automatic Attendance Rule:</strong> When an employee or intern's daily session logs accumulate to <strong>9.0+ hours</strong>, they are <strong>automatically marked as Present (P)</strong> in the 31-Day Attendance Matrix.
          </span>
        </div>
        <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: '700', background: 'rgba(16, 185, 129, 0.15)', padding: '3px 8px', borderRadius: '6px' }}>
          ✓ Active Policy
        </span>
      </div>

      {/* Admin Club Logs Interactive Banner */}
      {isAdmin && selectedSessionIds.length > 0 && (
        <div className="glass-card" style={{
          padding: '14px 20px',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.18), rgba(56, 189, 248, 0.15))',
          border: '1px solid rgba(99, 102, 241, 0.4)',
          borderRadius: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          boxShadow: '0 4px 20px rgba(99, 102, 241, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Link2 style={{ width: '18px', height: '18px' }} />
            </div>
            <div>
              {selectedSessionIds.length === 1 ? (
                <div>
                  <span style={{ fontWeight: '800', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                    1 Session Selected
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '8px' }}>
                    Select 1 more log for the same employee to club them together and add their times.
                  </span>
                </div>
              ) : (
                <div>
                  <div style={{ fontWeight: '800', color: 'var(--text-primary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🔗 2 Logs Ready to Club:</span>
                    <span style={{ color: '#38bdf8' }}>{clubCalculation?.s1?.userName || 'Employee'}</span>
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Log 1 ({clubCalculation?.s1Hrs} hrs) + Log 2 ({clubCalculation?.s2Hrs} hrs) = <strong style={{ color: '#34d399', fontSize: '0.85rem' }}>{clubCalculation?.totalHrs} hrs Total Added Time</strong>
                    {clubCalculation?.isNinePlus && (
                      <span style={{ marginLeft: '8px', padding: '1px 6px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.25)', color: '#34d399', fontWeight: '800' }}>
                        ✓ Qualifies for Auto Present (9h+)
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {selectedSessionIds.length === 2 && (
              <button
                onClick={handleConfirmClub}
                className="btn gradient-btn-primary"
                style={{
                  padding: '8px 18px',
                  borderRadius: '10px',
                  fontWeight: '800',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)'
                }}
              >
                <Link2 style={{ width: '15px', height: '15px' }} />
                <span>🔗 Club Both Logs (Add Times)</span>
              </button>
            )}

            <button
              onClick={() => setSelectedSessionIds([])}
              className="btn btn-secondary"
              style={{ padding: '8px 12px', fontSize: '0.78rem', color: 'var(--text-muted)' }}
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Recorded Sessions Table */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-color)' }}>
                {isAdmin && (
                  <th style={{ width: '40px', padding: '12px 10px', textAlign: 'center' }}>
                    <Layers style={{ width: '14px', height: '14px', color: 'var(--text-muted)' }} title="Select sessions to club" />
                  </th>
                )}
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Staff Member / Identity</th>
                <th style={{ padding: '12px 14px', textAlign: 'left' }}>Login / Punch-In</th>
                <th style={{ padding: '12px 14px', textAlign: 'left' }}>Logout / Punch-Out</th>
                <th style={{ padding: '12px 14px', textAlign: 'left' }}>Total Duration</th>
                <th style={{ padding: '12px 12px', textAlign: 'center' }}>Session Status</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>HR & Security Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No login session records found matching filter.
                  </td>
                </tr>
              ) : (
                filteredSessions.map((session, idx) => {
                  const isActive = session.status === 'Active';
                  const isTerminated = session.status === 'Terminated';
                  const isIntern = session.role?.includes('Intern') || session.staffType === 'Intern';
                  const isSelected = selectedSessionIds.includes(session.id);

                  return (
                    <tr
                      key={session.id || idx}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        background: isSelected ? 'rgba(99, 102, 241, 0.12)' : isActive ? 'rgba(16, 185, 129, 0.02)' : 'transparent',
                        transition: 'background 0.2s ease'
                      }}
                    >
                      {/* Checkbox for Admin Clubbing */}
                      {isAdmin && (
                        <td style={{ width: '40px', padding: '12px 10px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleToggleSelectSession(session.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: isSelected ? '#818cf8' : 'var(--text-muted)' }}
                            title="Select this log to club with another log"
                          >
                            {isSelected ? (
                              <CheckSquare style={{ width: '16px', height: '16px', color: '#818cf8' }} />
                            ) : (
                              <Square style={{ width: '16px', height: '16px', color: 'rgba(255,255,255,0.2)' }} />
                            )}
                          </button>
                        </td>
                      )}
                      
                      {/* User Identity */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: isIntern ? 'linear-gradient(135deg, #a855f7, #ec4899)' : 'linear-gradient(135deg, #3b82f6, #6366f1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontWeight: '800',
                            fontSize: '0.85rem'
                          }}>
                            {session.userName?.charAt(0) || 'U'}
                          </div>

                          <div>
                            <div style={{ fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{session.userName}</span>
                              <span style={{
                                padding: '1px 6px',
                                borderRadius: '4px',
                                background: isIntern ? 'rgba(168, 85, 247, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                                color: isIntern ? '#c084fc' : '#60a5fa',
                                fontSize: '0.65rem',
                                fontWeight: '700'
                              }}>
                                {isIntern ? 'Intern' : 'Employee'}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              {session.role} · {session.userEmail}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Login / Punch In */}
                      <td style={{ padding: '12px 14px', color: 'var(--text-primary)' }}>
                        <div style={{ fontWeight: '800', color: '#34d399', fontSize: '0.85rem' }}>
                          {session.punchInTime || '09:00 AM'}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {new Date(session.loginTime).toLocaleDateString()}
                        </div>
                      </td>

                      {/* Logout / Punch Out */}
                      <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                        {isActive || !session.punchOutTime ? (
                          <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }} />
                            Online Now
                          </span>
                        ) : (
                          <div style={{ fontWeight: '800', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                            {session.punchOutTime}
                          </div>
                        )}
                      </td>

                      {/* Duration */}
                      <td style={{ padding: '12px 14px', color: 'var(--text-primary)', fontWeight: '700' }}>
                        {computeDurationDisplay(session)}
                      </td>

                      {/* Status Badge */}
                      <td style={{ padding: '12px 12px', textAlign: 'center' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: isActive ? 'rgba(16, 185, 129, 0.15)' : isTerminated ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                          color: isActive ? '#34d399' : isTerminated ? '#f87171' : 'var(--text-muted)',
                          fontSize: '0.72rem',
                          fontWeight: '700'
                        }}>
                          {session.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          
                          {/* Club Log Action Button - ONLY Admin */}
                          {isAdmin && (
                            <button
                              onClick={() => handleOpenClubModal(session)}
                              className="btn btn-secondary"
                              style={{
                                padding: '4px 8px',
                                fontSize: '0.72rem',
                                color: '#38bdf8',
                                border: '1px solid rgba(56, 189, 248, 0.3)',
                                background: 'rgba(56, 189, 248, 0.08)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title="Club / Merge this log with another session to add work times together"
                            >
                              <Link2 style={{ width: '12px', height: '12px' }} />
                              <span>Club</span>
                            </button>
                          )}

                          {/* Edit Punch Time Button - ONLY Admin */}
                          {isAdmin && (
                            <button
                              onClick={() => handleOpenEdit(session)}
                              className="btn btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '0.72rem', color: '#818cf8' }}
                              title="Edit punch-in / punch-out time (Admin only)"
                            >
                              <Edit2 style={{ width: '12px', height: '12px' }} />
                              <span>Edit</span>
                            </button>
                          )}

                          {/* Revoke Button - ONLY Super Admin / Org Admin can revoke sessions */}
                          {isActive && (
                            isAdmin ? (
                              <button
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to forcibly terminate the active session for ${session.userName}?`)) {
                                    revokeLoginSession(session.id);
                                  }
                                }}
                                className="btn btn-secondary"
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '0.72rem',
                                  color: '#f87171',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  background: 'rgba(239, 68, 68, 0.08)'
                                }}
                                title="Forcibly terminate active session (Admin Authorization)"
                              >
                                <Lock style={{ width: '11px', height: '11px', marginRight: '4px' }} />
                                Revoke
                              </button>
                            ) : (
                              <span
                                style={{
                                  fontSize: '0.7rem',
                                  color: 'var(--text-muted)',
                                  fontStyle: 'italic',
                                  padding: '2px 6px'
                                }}
                                title="Only Super Admins can revoke active user sessions"
                              >
                                Active (Protected)
                              </span>
                            )
                          )}

                          {/* Delete Punch Record - ONLY Admin */}
                          {isAdmin && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Delete login record for ${session.userName}?`)) {
                                  deleteLoginSession(session.id);
                                }
                              }}
                              className="btn btn-secondary"
                              style={{ padding: '4px 6px', color: '#f87171' }}
                              title="Delete record (Admin only)"
                            >
                              <Trash2 style={{ width: '12px', height: '12px' }} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: CLUB TWO SESSIONS TOGETHER                                         */}
      {/* ========================================================================= */}
      {showClubModal && clubTargetSession && (
        <div className="modal-overlay" style={{ zIndex: 1000, padding: '16px' }}>
          <div className="modal-content" style={{ maxWidth: '620px', padding: '24px', background: '#0f172a', borderRadius: '16px', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #38bdf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <Link2 style={{ width: '20px', height: '20px' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                    🔗 Club Two Logs & Add Work Hours
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Staff Member: <strong style={{ color: '#38bdf8' }}>{clubTargetSession.userName}</strong> ({clubTargetSession.userId})
                  </span>
                </div>
              </div>
              <button onClick={() => { setShowClubModal(false); setClubTargetSession(null); }} className="btn btn-secondary" style={{ padding: '6px 8px' }}>
                <X style={{ width: '16px', height: '16px' }} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Explanation Note */}
              <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.25)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                ℹ️ <strong>Admin Authority:</strong> Merging these two punch logs will sum both durations together into one unified work record. If the total combined duration reaches <strong>9.0+ hours</strong>, the employee is automatically awarded <strong>Present (P)</strong> in the attendance registry.
              </div>

              {/* Side-by-Side Session Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '12px', alignItems: 'center' }}>
                
                {/* Session 1 Card */}
                <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <div style={{ fontSize: '0.72rem', color: '#818cf8', fontWeight: '800', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Log 1 (Primary)
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                    In: <span style={{ color: '#34d399' }}>{clubTargetSession.punchInTime || '09:00 AM'}</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '2px' }}>
                    Out: <span style={{ color: clubTargetSession.punchOutTime ? 'var(--text-primary)' : '#34d399' }}>{clubTargetSession.punchOutTime || 'Active'}</span>
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '0.75rem', fontWeight: '800', color: '#38bdf8' }}>
                    Duration: {clubCalculation?.s1Hrs || '0.0'} hrs
                  </div>
                </div>

                {/* Plus Indicator */}
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: '#818cf8', fontSize: '1.2rem' }}>
                  +
                </div>

                {/* Session 2 Selector Card */}
                <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <div style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: '800', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Log 2 (To Club)
                  </div>

                  <select
                    value={clubSecondarySessionId}
                    onChange={(e) => setClubSecondarySessionId(e.target.value)}
                    className="form-input"
                    style={{ width: '100%', padding: '6px 8px', fontSize: '0.75rem', marginBottom: '8px' }}
                  >
                    <option value="">-- Select Second Session --</option>
                    {(loginSessions || [])
                      .filter(s => s.id !== clubTargetSession.id)
                      .map(s => (
                        <option key={s.id} value={s.id}>
                          {s.userName} · {s.punchInTime || '09:00 AM'} - {s.punchOutTime || 'Active'} ({new Date(s.loginTime).toLocaleDateString()})
                        </option>
                      ))}
                  </select>

                  {clubCalculation?.s2 ? (
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                        In: <span style={{ color: '#34d399' }}>{clubCalculation.s2.punchInTime || '09:00 AM'}</span>
                      </div>
                      <div style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '2px' }}>
                        Out: <span>{clubCalculation.s2.punchOutTime || 'Active'}</span>
                      </div>
                      <div style={{ marginTop: '4px', fontSize: '0.75rem', fontWeight: '800', color: '#38bdf8' }}>
                        Duration: {clubCalculation.s2Hrs} hrs
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      Choose another log above to calculate added hours.
                    </div>
                  )}
                </div>
              </div>

              {/* Combined Added Time Summary Box */}
              {clubCalculation && (
                <div style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(99, 102, 241, 0.12))',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800' }}>
                      Total Combined Active Work Time
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#34d399', fontFamily: 'monospace' }}>
                      {clubCalculation.totalHrs} Hours
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      Consolidated window: <strong>{clubCalculation.earliestIn}</strong> to <strong>{clubCalculation.latestOut}</strong>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    {clubCalculation.isNinePlus ? (
                      <div style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        background: 'rgba(16, 185, 129, 0.25)',
                        border: '1px solid #10b981',
                        color: '#34d399',
                        fontWeight: '800',
                        fontSize: '0.82rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <CheckCircle2 style={{ width: '16px', height: '16px' }} />
                        <span>✓ Qualifies for Auto Present (9.0+ hrs)</span>
                      </div>
                    ) : (
                      <div style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        background: 'rgba(245, 158, 11, 0.15)',
                        border: '1px solid #f59e0b',
                        color: '#fbbf24',
                        fontWeight: '700',
                        fontSize: '0.78rem'
                      }}>
                        &lt; 9.0 hrs (Remains Absent unless 9h+)
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => { setShowClubModal(false); setClubTargetSession(null); }}
                  className="btn btn-secondary"
                  style={{ padding: '9px 18px' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!clubSecondarySessionId}
                  onClick={handleConfirmClub}
                  className="btn gradient-btn-primary"
                  style={{
                    padding: '9px 22px',
                    fontWeight: '800',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    opacity: clubSecondarySessionId ? 1 : 0.5,
                    cursor: clubSecondarySessionId ? 'pointer' : 'not-allowed'
                  }}
                >
                  <Link2 style={{ width: '16px', height: '16px' }} />
                  <span>Confirm & Club Logs</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT PUNCH RECORD                                                  */}
      {/* ========================================================================= */}
      {editingSession && (
        <div className="modal-overlay" style={{ zIndex: 1000, padding: '16px' }}>
          <div className="modal-content" style={{ maxWidth: '520px', padding: '24px', background: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Edit2 style={{ width: '18px', height: '18px', color: '#818cf8' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0 }}>
                    Edit Punch-In / Punch-Out Time
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Candidate: <strong>{editPunchForm.userName}</strong> (Session: {editPunchForm.id})
                  </span>
                </div>
              </div>
              <button onClick={() => setEditingSession(null)} className="btn btn-secondary" style={{ padding: '6px 8px' }}>
                <X style={{ width: '16px', height: '16px' }} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Punch-In Time *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 09:00 AM"
                    value={editPunchForm.punchInTime}
                    onChange={(e) => setEditPunchForm({ ...editPunchForm, punchInTime: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Punch-Out Time {editPunchForm.status === 'Active' ? <span style={{ color: '#34d399', fontSize: '0.72rem', fontWeight: '700' }}>(Active · Online Now)</span> : '*'}
                  </label>
                  <input
                    type="text"
                    required={editPunchForm.status !== 'Active'}
                    disabled={editPunchForm.status === 'Active'}
                    placeholder={editPunchForm.status === 'Active' ? 'Online Now (No logout time)' : 'e.g. 06:30 PM'}
                    value={editPunchForm.status === 'Active' ? '' : editPunchForm.punchOutTime}
                    onChange={(e) => setEditPunchForm({ ...editPunchForm, punchOutTime: e.target.value })}
                    className="form-input"
                    style={{
                      opacity: editPunchForm.status === 'Active' ? 0.6 : 1,
                      cursor: editPunchForm.status === 'Active' ? 'not-allowed' : 'text'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Work Mode</label>
                  <select
                    value={editPunchForm.workMode}
                    onChange={(e) => setEditPunchForm({ ...editPunchForm, workMode: e.target.value })}
                    className="form-input"
                  >
                    {SHIFT_MODES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Session Status</label>
                  <select
                    value={editPunchForm.status}
                    onChange={(e) => {
                      const newStatus = e.target.value;
                      setEditPunchForm({
                        ...editPunchForm,
                        status: newStatus,
                        punchOutTime: newStatus === 'Active' ? '' : (editPunchForm.punchOutTime || getCurrentISTTimeString(new Date()))
                      });
                    }}
                    className="form-input"
                  >
                    <option value="Active">Active Online</option>
                    <option value="Logged Out">Logged Out</option>
                    <option value="Terminated">Terminated</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Location / Workstation</label>
                <input
                  type="text"
                  placeholder="e.g. Mumbai Campus - Floor 4"
                  value={editPunchForm.location}
                  onChange={(e) => setEditPunchForm({ ...editPunchForm, location: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setEditingSession(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn gradient-btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD MANUAL PUNCH RECORD                                            */}
      {/* ========================================================================= */}
      {showAddPunchModal && (
        <div className="modal-overlay" style={{ zIndex: 1000, padding: '16px' }}>
          <div className="modal-content" style={{ maxWidth: '580px', padding: '24px', background: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus style={{ width: '18px', height: '18px', color: '#34d399' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0 }}>
                    Log Manual Punch-In / Punch-Out
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Record attendance session for staff who missed online punch
                  </span>
                </div>
              </div>
              <button onClick={() => setShowAddPunchModal(false)} className="btn btn-secondary" style={{ padding: '6px 8px' }}>
                <X style={{ width: '16px', height: '16px' }} />
              </button>
            </div>

            <form onSubmit={handleCreateManualPunch} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Staff Member *</label>
                  <select
                    value={addPunchForm.userId}
                    onChange={(e) => {
                      const selected = allStaff.find(s => s.id === e.target.value);
                      setAddPunchForm({
                        ...addPunchForm,
                        userId: e.target.value,
                        staffType: selected?.type || 'Employee'
                      });
                    }}
                    className="form-input"
                  >
                    {allStaff.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.designation})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Staff Category</label>
                  <select
                    value={addPunchForm.staffType}
                    onChange={(e) => setAddPunchForm({ ...addPunchForm, staffType: e.target.value })}
                    className="form-input"
                  >
                    <option value="Employee">Employee</option>
                    <option value="Intern">Intern</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input
                    type="date"
                    required
                    value={addPunchForm.date}
                    onChange={(e) => setAddPunchForm({ ...addPunchForm, date: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Punch-In Time *</label>
                  <input
                    type="text"
                    required
                    placeholder="09:00 AM"
                    value={addPunchForm.punchInTime}
                    onChange={(e) => setAddPunchForm({ ...addPunchForm, punchInTime: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Punch-Out Time *</label>
                  <input
                    type="text"
                    required
                    placeholder="06:30 PM"
                    value={addPunchForm.punchOutTime}
                    onChange={(e) => setAddPunchForm({ ...addPunchForm, punchOutTime: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Shift / Work Mode</label>
                  <select
                    value={addPunchForm.workMode}
                    onChange={(e) => setAddPunchForm({ ...addPunchForm, workMode: e.target.value })}
                    className="form-input"
                  >
                    {SHIFT_MODES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Session Status</label>
                  <select
                    value={addPunchForm.status}
                    onChange={(e) => setAddPunchForm({ ...addPunchForm, status: e.target.value })}
                    className="form-input"
                  >
                    <option value="Logged Out">Logged Out (Completed Shift)</option>
                    <option value="Active">Active Online</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddPunchModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn gradient-btn-primary">
                  Log Punch Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default LoginSessionsVault;
