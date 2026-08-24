import React, { useState, useMemo } from 'react';
import { useCRM } from '../../context/CRMContext';
import exportToCSV from '../../utils/csvExporter';
import {
  getMonthBirthdays,
  isBirthdayInMonth,
  isBirthdayToday,
  isBirthdayOnDay,
  formatBirthday
} from '../../utils/birthdayUtils';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Users,
  CheckSquare,
  Save,
  Filter,
  Download,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Info,
  DollarSign,
  Gift,
  PartyPopper
} from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const STATUS_CONFIG = {
  P: { label: 'Present', short: 'P', color: '#34d399', bg: 'rgba(16, 185, 129, 0.2)', value: 1.0, isLOP: false },
  A: { label: 'Absent', short: 'A', color: '#f87171', bg: 'rgba(239, 68, 68, 0.2)', value: 0.0, isLOP: true },
  HD: { label: 'Half Day', short: 'HD', color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.2)', value: 0.5, isLOP: true }, // 0.5 LOP
  H: { label: 'Holiday / Weekend', short: 'H', color: '#c084fc', bg: 'rgba(168, 85, 247, 0.2)', value: 1.0, isLOP: false },
  SL: { label: 'Sick Leave', short: 'SL', color: '#60a5fa', bg: 'rgba(59, 130, 246, 0.2)', value: 1.0, isLOP: false },
  CL: { label: 'Casual Leave', short: 'CL', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.2)', value: 1.0, isLOP: false },
  LOP: { label: 'Loss of Pay', short: 'LOP', color: '#fb7185', bg: 'rgba(244, 63, 94, 0.25)', value: 0.0, isLOP: true }
};

const STATUS_CYCLE = ['P', 'HD', 'LOP', 'A', 'SL', 'CL', 'H'];

const AttendanceTracker = () => {
  const {
    employees = [],
    interns = [],
    attendanceMatrix = {},
    updateAttendanceDay,
    batchUpdateAttendanceMonth,
    markAllStaffDayAttendance,
    syncAllSessionsToAttendance,
    leaveBalances = {},
    currentUser,
    activeRole,
    loginSessions = []
  } = useCRM();

  const isAdmin = (activeRole?.permissions || []).includes('super_admin') ||
    (activeRole?.permissions || []).includes('security_admin') ||
    activeRole?.id === 'role-admin' ||
    (activeRole?.name || '').toLowerCase().includes('admin') ||
    currentUser?.roleId === 'role-admin' ||
    currentUser?.role === 'Super Admin / Org Admin' ||
    (currentUser?.role || '').toLowerCase().includes('admin') ||
    currentUser?.username === 'admin';

  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1); // 1-12
  const [staffFilter, setStaffFilter] = useState('all'); // 'all' | 'employees' | 'interns' | 'birthdays'
  const [highlightStaffId, setHighlightStaffId] = useState(null);
  const [customWorkingDays, setCustomWorkingDays] = useState(26);
  const [saveBanner, setSaveBanner] = useState(false);

  // Number of days in selected month
  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth, 0).getDate();
  }, [selectedYear, selectedMonth]);

  const daysArray = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  }, [daysInMonth]);

  // Helper to parse time strings like '09:00 AM'
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

  // Combined Staff List (Employees + Active Interns)
  const allStaffList = useMemo(() => {
    let list = [];
    const empItems = employees.map(e => ({
      id: e.id,
      name: e.name,
      type: 'Employee',
      designation: e.designation || 'Specialist',
      salary: parseInt(e.baseSalary || e.salary || 50000, 10),
      birthday: e.birthday || e.dob || null,
      avatar: e.avatar
    }));
    list = [...list, ...empItems];

    const internItems = (interns || []).map(i => ({
      id: i.id,
      name: `${i.name} (Intern)`,
      type: 'Intern',
      designation: `Intern - ${i.department}`,
      salary: parseInt(i.stipend || 25000, 10),
      birthday: i.birthday || i.dob || null,
      avatar: i.avatar
    }));
    list = [...list, ...internItems];

    return list.filter(s => {
      const n = (s.name || '').toLowerCase();
      const id = String(s.id || '');
      return (
        !n.includes('aarav sharma') &&
        !n.includes('priya sundaram') &&
        !n.includes('rohan varma') &&
        id !== 'INT-2026-01' &&
        id !== 'INT-2026-02' &&
        id !== 'INT-2025-01'
      );
    });
  }, [employees, interns]);

  // Birthdays for currently selected month
  const monthBirthdays = useMemo(() => {
    return getMonthBirthdays(allStaffList, selectedMonth, selectedYear);
  }, [allStaffList, selectedMonth, selectedYear]);

  // Filtered staff list based on staffFilter
  const staffList = useMemo(() => {
    if (staffFilter === 'birthdays') {
      return allStaffList.filter(s => isBirthdayInMonth(s.birthday, selectedMonth));
    }
    if (staffFilter === 'employees') {
      return allStaffList.filter(s => s.type === 'Employee');
    }
    if (staffFilter === 'interns') {
      return allStaffList.filter(s => s.type === 'Intern');
    }
    return allStaffList;
  }, [allStaffList, staffFilter, selectedMonth]);

  // Get status of specific staff for a specific day
  // Default is 'A' (Absent) unless >= 9.0 hours of work sessions are logged or Weekend 'H'
  const getStaffStatus = (staffId, day) => {
    const key = `${staffId}-${selectedYear}-${selectedMonth}`;
    const staffMonth = attendanceMatrix[key];
    if (staffMonth && staffMonth[day]) {
      return staffMonth[day];
    }

    // Check if session logs on this day total >= 9.0 hours
    const mStr = String(selectedMonth).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    const dateStr = `${selectedYear}-${mStr}-${dStr}`;

    const matchingSessions = (loginSessions || []).filter(s => {
      const sDate = s.loginTime ? s.loginTime.split('T')[0] : '';
      return (s.userId === staffId || s.userEmail === staffId) && sDate === dateStr;
    });

    let totalMins = 0;
    matchingSessions.forEach(session => {
      if (session.punchInTime && session.punchOutTime) {
        let diff = parseTimeToMinutes(session.punchOutTime) - parseTimeToMinutes(session.punchInTime);
        if (diff < 0) diff += 1440;
        totalMins += diff;
      } else if (session.status === 'Active' && session.punchInTime) {
        const now = new Date();
        const curMins = now.getHours() * 60 + now.getMinutes();
        const inMins = parseTimeToMinutes(session.punchInTime);
        const diff = curMins - inMins;
        if (diff > 0) totalMins += diff;
      }
    });

    if ((totalMins / 60) >= 9.0) {
      return 'P';
    }

    // Default fallback: Only Sunday (dayOfWeek === 0) is Holiday (H).
    // Monday through Saturday (including Saturday) are working days and default as 'A' (Absent) unless 9h+ logged!
    const dateObj = new Date(selectedYear, selectedMonth - 1, day);
    const dayOfWeek = dateObj.getDay();
    return dayOfWeek === 0 ? 'H' : 'A';
  };

  // Cycle status on cell click (Strictly Admin only)
  const handleCellClick = (staffId, day) => {
    if (!isAdmin) {
      return; // Only Admin can manually modify attendance records
    }
    const currentStatus = getStaffStatus(staffId, day);
    const currentIdx = STATUS_CYCLE.indexOf(currentStatus);
    const nextStatus = STATUS_CYCLE[(currentIdx + 1) % STATUS_CYCLE.length];
    updateAttendanceDay(staffId, selectedYear, selectedMonth, day, nextStatus);
  };

  // Calculate monthly stats per staff member
  const staffMonthlyMetrics = useMemo(() => {
    return staffList.map(staff => {
      let presentDays = 0;
      let lopDays = 0;
      let holidays = 0;
      let sickLeaves = 0;
      let casualLeaves = 0;

      daysArray.forEach(day => {
        const st = getStaffStatus(staff.id, day);
        if (st === 'P') presentDays += 1;
        else if (st === 'HD') {
          presentDays += 0.5;
          lopDays += 0.5;
        } else if (st === 'LOP' || st === 'A') {
          lopDays += 1;
        } else if (st === 'H') {
          holidays += 1;
        } else if (st === 'SL') {
          sickLeaves += 1;
          presentDays += 1;
        } else if (st === 'CL') {
          casualLeaves += 1;
          presentDays += 1;
        }
      });

      // Annual 12 ML + 12 CL Leaves Calculation for current year
      let annualMedicalUsed = 0;
      let annualCasualUsed = 0;
      for (let m = 1; m <= 12; m++) {
        const mKey = `${staff.id}-${selectedYear}-${m}`;
        const mData = attendanceMatrix[mKey] || {};
        Object.values(mData).forEach(st => {
          if (st === 'SL') annualMedicalUsed += 1;
          if (st === 'CL') annualCasualUsed += 1;
        });
      }

      const totalMedicalQuota = 12;
      const totalCasualQuota = 12;
      const medicalRemaining = Math.max(0, totalMedicalQuota - annualMedicalUsed);
      const casualRemaining = Math.max(0, totalCasualQuota - annualCasualUsed);

      const perDayRate = Math.round(staff.salary / customWorkingDays);
      const lopDeduction = Math.round(perDayRate * lopDays);
      const netPayable = Math.max(0, staff.salary - lopDeduction);

      return {
        ...staff,
        presentDays,
        lopDays,
        holidays,
        sickLeaves,
        casualLeaves,
        annualMedicalUsed,
        annualCasualUsed,
        totalMedicalQuota,
        totalCasualQuota,
        medicalRemaining,
        casualRemaining,
        perDayRate,
        lopDeduction,
        netPayable
      };
    });
  }, [staffList, daysArray, selectedYear, selectedMonth, attendanceMatrix, customWorkingDays]);

  // Bulk quick fill
  const handleMarkAllPresentForMonth = () => {
    staffList.forEach(staff => {
      const dayMap = {};
      daysArray.forEach(d => {
        const dateObj = new Date(selectedYear, selectedMonth - 1, d);
        const dayOfWeek = dateObj.getDay();
        dayMap[d] = (dayOfWeek === 0) ? 'H' : 'P';
      });
      batchUpdateAttendanceMonth(staff.id, selectedYear, selectedMonth, dayMap);
    });
    setSaveBanner(true);
    setTimeout(() => setSaveBanner(false), 3000);
  };

  const handleAutoSyncSessions = () => {
    if (syncAllSessionsToAttendance) {
      const count = syncAllSessionsToAttendance();
      setSaveBanner(`⚡ Auto-Synced Attendance: Employees with daily session logs totaling 9.0+ hours have been verified and marked as Present (P)!`);
      setTimeout(() => setSaveBanner(false), 5000);
    }
  };

  // Export Attendance Register as CSV
  const handleExportCSV = () => {
    let csv = `MIS SANNA ATTENDANCE REGISTER - ${MONTH_NAMES[selectedMonth - 1].toUpperCase()} ${selectedYear}\n`;
    csv += `Emp ID,Name,Designation,Type,Base Salary,Working Days,Present Days,LOP Days,Med Leave Remaining (of 12),Cas Leave Remaining (of 12),LOP Deduction (INR),Net Payable (INR),`;
    daysArray.forEach(d => {
      csv += `Day ${d},`;
    });
    csv += `\n`;

    staffMonthlyMetrics.forEach(m => {
      csv += `"${m.id}","${m.name}","${m.designation}","${m.type}",${m.salary},${customWorkingDays},${m.presentDays},${m.lopDays},${m.medicalRemaining},${m.casualRemaining},${m.lopDeduction},${m.netPayable},`;
      daysArray.forEach(d => {
        csv += `"${getStaffStatus(m.id, d)}",`;
      });
      csv += `\n`;
    });

    exportToCSV(csv, `MIS_Attendance_Register_${selectedYear}_${selectedMonth}.csv`);
  };

  const totalPayrollGross = staffMonthlyMetrics.reduce((sum, s) => sum + s.salary, 0);
  const totalLopDeductions = staffMonthlyMetrics.reduce((sum, s) => sum + s.lopDeduction, 0);
  const totalNetPayable = staffMonthlyMetrics.reduce((sum, s) => sum + s.netPayable, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Month & Period Selector Toolbar */}
      <div className="glass-card" style={{ padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Left: Month/Year navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar style={{ width: '22px', height: '22px', color: '#6366f1' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
              31-Day Attendance Calendar Matrix
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
              className="form-input"
              style={{ width: '130px', padding: '6px 10px', fontSize: '0.82rem', fontWeight: '700' }}
            >
              {MONTH_NAMES.map((m, idx) => (
                <option key={idx} value={idx + 1}>{m}</option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="form-input"
              style={{ width: '90px', padding: '6px 10px', fontSize: '0.82rem', fontWeight: '700' }}
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
              <option value={2024}>2024</option>
            </select>
          </div>
        </div>

        {/* Right: Filter & Export Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>Staff Filter:</span>
            <select
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              className="form-input"
              style={{ width: '170px', padding: '6px 10px', fontSize: '0.78rem' }}
            >
              <option value="all">All Staff ({allStaffList.length})</option>
              <option value="employees">Employees ({employees.length})</option>
              <option value="interns">Interns ({interns.length})</option>
              <option value="birthdays">🎂 {MONTH_NAMES[selectedMonth - 1]} Birthdays ({monthBirthdays.length})</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>Working Days:</span>
            <input
              type="number"
              min="20"
              max="31"
              value={customWorkingDays}
              onChange={(e) => setCustomWorkingDays(parseInt(e.target.value, 10) || 26)}
              className="form-input"
              style={{ width: '60px', padding: '6px 8px', fontSize: '0.78rem', textAlign: 'center' }}
            />
          </div>

          <button
            onClick={handleAutoSyncSessions}
            className="btn btn-secondary"
            style={{
              padding: '7px 12px',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderColor: 'rgba(16, 185, 129, 0.4)',
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#34d399'
            }}
            title="Auto-Mark Present (P) for any employee who logged 9+ hours in Daily Sessions"
          >
            <Sparkles style={{ width: '14px', height: '14px', color: '#34d399' }} />
            <span>⚡ Sync 9h+ Logs</span>
          </button>

          <button
            onClick={handleMarkAllPresentForMonth}
            className="btn btn-secondary"
            style={{ padding: '7px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Auto-fill Weekdays as Present and Weekends as Holiday"
          >
            <CheckCircle2 style={{ width: '14px', height: '14px', color: '#34d399' }} />
            <span>Fill Weekdays</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="btn gradient-btn-primary"
            style={{ padding: '7px 14px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <FileSpreadsheet style={{ width: '14px', height: '14px' }} />
            <span>Export Register (.CSV)</span>
          </button>
        </div>
      </div>

      {/* 🎂 Monthly Birthday Spotlight Banner */}
      {monthBirthdays.length > 0 && (
        <div
          className="glass-card"
          style={{
            padding: '16px 20px',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(236, 72, 153, 0.12) 50%, rgba(99, 102, 241, 0.12) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            boxShadow: '0 4px 20px rgba(245, 158, 11, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #ec4899 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)',
              flexShrink: 0
            }}>
              🎂
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: '800', color: '#fff' }}>
                  {MONTH_NAMES[selectedMonth - 1]} Birthday Milestones
                </h4>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: '800',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: 'rgba(245, 158, 11, 0.25)',
                  color: '#fbbf24',
                  border: '1px solid rgba(245, 158, 11, 0.4)'
                }}>
                  {monthBirthdays.length} Celebrations
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Staff birthdays are highlighted with 🎂 markers in the attendance matrix. Wish your teammates a Happy Birthday!
              </p>
            </div>
          </div>

          {/* Birthday Celebrants Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {monthBirthdays.map(emp => {
              const isToday = emp.birthdayData?.isToday;
              return (
                <div
                  key={emp.id}
                  onClick={() => {
                    setHighlightStaffId(prev => prev === emp.id ? null : emp.id);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '5px 10px',
                    borderRadius: '20px',
                    background: isToday
                      ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.35) 0%, rgba(236, 72, 153, 0.35) 100%)'
                      : 'rgba(255, 255, 255, 0.06)',
                    border: isToday ? '1.5px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.12)',
                    cursor: 'pointer',
                    boxShadow: isToday ? '0 0 12px rgba(245, 158, 11, 0.4)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                  title={`Click to focus ${emp.name}'s row on Day ${emp.birthdayData.day}`}
                >
                  <img
                    src={emp.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80"}
                    alt={emp.name}
                    style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <span style={{ fontSize: '0.78rem', fontWeight: '700', color: isToday ? '#fbbf24' : 'var(--text-primary)' }}>
                    {emp.name.split(' ')[0]}
                  </span>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: '800',
                    color: isToday ? '#fff' : '#a855f7',
                    background: isToday ? '#f59e0b' : 'rgba(168, 85, 247, 0.18)',
                    padding: '1px 6px',
                    borderRadius: '10px'
                  }}>
                    {isToday ? '🎉 Today!' : `${MONTH_NAMES[selectedMonth - 1].slice(0, 3)} ${emp.birthdayData.day}`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Save Success Banner */}
      {saveBanner && (
        <div className="glass-card" style={{ padding: '12px 18px', background: 'rgba(16, 185, 129, 0.15)', borderLeft: '4px solid #10b981', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle2 style={{ width: '18px', height: '18px', color: '#10b981' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#34d399' }}>
            {typeof saveBanner === 'string' ? saveBanner : `Attendance matrix successfully updated for ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}! Per-day payroll loss calculations recalculated.`}
          </span>
        </div>
      )}

      {/* Leave & Auto-Attendance Policy Header Banner */}
      <div className="glass-card" style={{ padding: '14px 20px', background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(16,185,129,0.08) 100%)', border: '1px solid rgba(99,102,241,0.2)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Sparkles style={{ width: '20px', height: '20px', color: '#60a5fa', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-primary)' }}>
              9.0+ Hours Session Auto-Mark Rule
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              Any staff member with session logs totaling 9+ hours in a day is automatically marked <strong>Present (P)</strong>.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Info style={{ width: '20px', height: '20px', color: '#34d399', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-primary)' }}>
              Annual Leave Entitlement: 12 ML + 12 CL (24 Total Days)
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              Every employee is entitled to <strong>12 Medical Leaves (ML)</strong> and <strong>12 Casual Leaves (CL)</strong> per year at 100% full pay.
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        <div className="glass-card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Active Workforce</div>
          <div style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px' }}>
            {staffList.length} Headcount
          </div>
          <div style={{ fontSize: '0.7rem', color: '#818cf8', fontWeight: '600' }}>
            {allStaffList.filter(s => s.type === 'Employee').length} Full-Time · {allStaffList.filter(s => s.type === 'Intern').length} Interns
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Monthly Gross Base</div>
          <div style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px' }}>
            ₹{totalPayrollGross.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Standard monthly baseline</div>
        </div>

        <div className="glass-card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.72rem', color: '#fb7185', textTransform: 'uppercase', fontWeight: '700' }}>Loss of Pay (LOP) Deductions</div>
          <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#fb7185', marginTop: '4px' }}>
            -₹{totalLopDeductions.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#fb7185' }}>Computed dynamically from grid</div>
        </div>

        <div className="glass-card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.72rem', color: '#34d399', textTransform: 'uppercase', fontWeight: '700' }}>Net Payable Payroll</div>
          <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#34d399', marginTop: '4px' }}>
            ₹{totalNetPayable.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#34d399' }}>Final accumulated disbursal</div>
        </div>
      </div>

      {/* Status Legends Bar */}
      <div className="glass-card" style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>Status Legends:</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>(Click any cell to toggle)</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {Object.entries(STATUS_CONFIG).map(([code, cfg]) => (
            <div key={code} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{
                display: 'inline-block',
                padding: '2px 7px',
                borderRadius: '4px',
                background: cfg.bg,
                color: cfg.color,
                fontWeight: '800',
                fontSize: '0.72rem',
                border: `1px solid ${cfg.color}40`
              }}>
                {code}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{cfg.label}</span>
            </div>
          ))}

          {/* Birthday Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginLeft: '6px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '2px',
              padding: '2px 7px',
              borderRadius: '4px',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.3) 0%, rgba(236, 72, 153, 0.3) 100%)',
              color: '#fbbf24',
              fontWeight: '800',
              fontSize: '0.72rem',
              border: '1px solid #f59e0b'
            }}>
              🎂 Birthday
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Staff Birthday Day</span>
          </div>
        </div>
      </div>

      {/* 31-Day Interactive Spreadsheet Matrix Table */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', minWidth: '1300px' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '12px 14px', textAlign: 'left', position: 'sticky', left: 0, background: 'var(--bg-secondary)', zIndex: 10, minWidth: '200px' }}>
                  Staff Member / Role
                </th>
                <th style={{ padding: '12px 10px', textAlign: 'right', minWidth: '90px' }}>Base Salary</th>
                <th style={{ padding: '12px 8px', textAlign: 'center', minWidth: '60px' }}>Present</th>
                <th style={{ padding: '12px 8px', textAlign: 'center', minWidth: '60px' }}>LOP</th>
                <th style={{ padding: '12px 8px', textAlign: 'center', minWidth: '90px' }} title="12 Medical + 12 Casual Leaves annual quota">Leave Quota (ML/CL)</th>
                <th style={{ padding: '12px 10px', textAlign: 'right', minWidth: '95px' }}>Net Pay</th>

                {/* Day 1 to Day 31 Columns */}
                {daysArray.map(day => {
                  const dateObj = new Date(selectedYear, selectedMonth - 1, day);
                  const dayName = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][dateObj.getDay()];
                  const isSunday = dateObj.getDay() === 0;
                  const isSaturday = dateObj.getDay() === 6;
                  const hasBirthdayOnDay = monthBirthdays.some(b => b.birthdayData?.day === day);

                  return (
                    <th
                      key={day}
                      style={{
                        padding: '8px 2px',
                        textAlign: 'center',
                        minWidth: '32px',
                        background: hasBirthdayOnDay
                          ? 'rgba(245, 158, 11, 0.15)'
                          : isSunday
                            ? 'rgba(168, 85, 247, 0.08)'
                            : isSaturday
                              ? 'rgba(59, 130, 246, 0.05)'
                              : 'transparent',
                        borderLeft: '1px solid rgba(255,255,255,0.05)'
                      }}
                      title={hasBirthdayOnDay ? `🎂 Employee Birthday on Day ${day}!` : undefined}
                    >
                      <div style={{
                        fontWeight: '800',
                        color: hasBirthdayOnDay ? '#fbbf24' : isSunday ? '#c084fc' : isSaturday ? '#93c5fd' : 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '2px'
                      }}>
                        {day} {hasBirthdayOnDay && <span style={{ fontSize: '0.65rem' }}>🎂</span>}
                      </div>
                      <div style={{ fontSize: '0.62rem', color: isSunday ? '#a855f7' : isSaturday ? '#60a5fa' : 'var(--text-muted)' }}>{dayName}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {staffMonthlyMetrics.map((staff, sIdx) => {
                const staffHasBdayInMonth = isBirthdayInMonth(staff.birthday, selectedMonth);
                const staffBdayToday = isBirthdayToday(staff.birthday);
                const isSelected = highlightStaffId === staff.id;

                return (
                  <tr
                    key={staff.id}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      background: isSelected
                        ? 'rgba(99, 102, 241, 0.12)'
                        : staffBdayToday
                          ? 'rgba(245, 158, 11, 0.07)'
                          : staffHasBdayInMonth
                            ? 'rgba(245, 158, 11, 0.03)'
                            : sIdx % 2 === 0
                              ? 'transparent'
                              : 'rgba(255,255,255,0.01)',
                      transition: 'background 0.2s ease'
                    }}
                  >
                    {/* Sticky Staff Info Cell */}
                    <td style={{
                      padding: '10px 14px',
                      position: 'sticky',
                      left: 0,
                      background: isSelected ? '#1e1b4b' : 'var(--bg-secondary)',
                      zIndex: 10,
                      borderRight: '1px solid var(--border-color)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ position: 'relative' }}>
                          <img
                            src={staff.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80"}
                            alt={staff.name}
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: staffBdayToday
                                ? '2px solid #f59e0b'
                                : staffHasBdayInMonth
                                  ? '1.5px solid #ec4899'
                                  : 'none'
                            }}
                          />
                          {staffHasBdayInMonth && (
                            <span
                              style={{
                                position: 'absolute',
                                bottom: '-3px',
                                right: '-3px',
                                fontSize: '0.65rem',
                                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))'
                              }}
                              title={`Birthday on ${formatBirthday(staff.birthday, false)}`}
                            >
                              🎂
                            </span>
                          )}
                        </div>

                        <div style={{ overflow: 'hidden', flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <div style={{ fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {staff.name}
                            </div>
                            {staffBdayToday && (
                              <span style={{
                                fontSize: '0.62rem',
                                fontWeight: '800',
                                padding: '1px 5px',
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, #f59e0b, #ec4899)',
                                color: '#fff',
                                boxShadow: '0 0 8px rgba(245, 158, 11, 0.5)'
                              }}>
                                🎉 Birthday Today!
                              </span>
                            )}
                            {!staffBdayToday && staffHasBdayInMonth && (
                              <span style={{
                                fontSize: '0.62rem',
                                fontWeight: '700',
                                padding: '1px 5px',
                                borderRadius: '8px',
                                background: 'rgba(245, 158, 11, 0.18)',
                                color: '#fbbf24',
                                border: '1px solid rgba(245, 158, 11, 0.3)'
                              }} title={`Birthday: ${formatBirthday(staff.birthday, true)}`}>
                                🎂 {formatBirthday(staff.birthday, false)}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: staff.type === 'Intern' ? '#818cf8' : 'var(--text-muted)' }}>
                            {staff.designation}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Base Salary */}
                    <td style={{ padding: '10px 10px', textAlign: 'right', fontWeight: '600', color: 'var(--text-primary)' }}>
                      ₹{staff.salary.toLocaleString('en-IN')}
                    </td>

                    {/* Present Days */}
                    <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '800', color: '#34d399' }}>
                      {staff.presentDays}
                    </td>

                    {/* LOP Days */}
                    <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '800', color: staff.lopDays > 0 ? '#fb7185' : 'var(--text-muted)' }}>
                      {staff.lopDays}
                    </td>

                    {/* Leave Balances: Medical (ML) & Casual (CL) */}
                    <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.66rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(96, 165, 250, 0.15)', color: '#60a5fa', fontWeight: '700' }} title={`Medical Leave (ML): ${staff.medicalRemaining} remaining of 12 days`}>
                          ML: {staff.medicalRemaining}/12
                        </span>
                        <span style={{ fontSize: '0.66rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontWeight: '700' }} title={`Casual Leave (CL): ${staff.casualRemaining} remaining of 12 days`}>
                          CL: {staff.casualRemaining}/12
                        </span>
                      </div>
                    </td>

                    {/* Net Payable */}
                    <td style={{ padding: '10px 10px', textAlign: 'right', fontWeight: '800', color: '#34d399' }}>
                      ₹{staff.netPayable.toLocaleString('en-IN')}
                    </td>

                    {/* Day 1 - 31 Interactive Matrix Cells */}
                    {daysArray.map(day => {
                      const status = getStaffStatus(staff.id, day);
                      const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.P;
                      const isBirthdayCell = isBirthdayOnDay(staff.birthday, selectedMonth, day);

                      return (
                        <td
                          key={day}
                          onClick={() => handleCellClick(staff.id, day)}
                          style={{
                            padding: '4px 2px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            borderLeft: '1px solid rgba(255,255,255,0.05)',
                            userSelect: 'none',
                            transition: 'all 0.15s ease',
                            background: isBirthdayCell
                              ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.22) 0%, rgba(236, 72, 153, 0.18) 100%)'
                              : 'transparent'
                          }}
                          title={isBirthdayCell
                            ? `🎂 Birthday: ${staff.name} on Day ${day} (${MONTH_NAMES[selectedMonth - 1]})! 🎉 Status: ${cfg.label}. Click to cycle.`
                            : `${staff.name} on Day ${day}: ${cfg.label}. Click to cycle.`
                          }
                        >
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '2px',
                            width: isBirthdayCell ? '30px' : '26px',
                            height: '24px',
                            borderRadius: '4px',
                            background: isBirthdayCell
                              ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.35) 0%, rgba(236, 72, 153, 0.3) 100%)'
                              : cfg.bg,
                            color: isBirthdayCell ? '#fbbf24' : cfg.color,
                            fontWeight: '800',
                            fontSize: '0.72rem',
                            border: isBirthdayCell
                              ? '1.5px solid #f59e0b'
                              : `1px solid ${cfg.color}35`,
                            boxShadow: isBirthdayCell ? '0 0 8px rgba(245, 158, 11, 0.4)' : 'none'
                          }}>
                            {isBirthdayCell && <span style={{ fontSize: '0.62rem' }}>🎂</span>}
                            {status}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceTracker;
