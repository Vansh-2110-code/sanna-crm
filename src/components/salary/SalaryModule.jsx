import React, { useState, useMemo } from 'react';
import { useCRM } from '../../context/CRMContext';
import AttendanceTracker from './AttendanceTracker';
import LoginSessionsVault from '../security/LoginSessionsVault';
import { numberToWordsINR } from '../../utils/numberToWords';
import {
  DollarSign, Calendar, Download, Eye, CheckCircle2,
  Users, TrendingUp, FileText, Wallet, BadgeIndianRupee,
  Clock, PlusCircle, Printer, CheckSquare, Upload, ShieldCheck,
  HeartPulse, Sparkles, Shield, Info, Palmtree, UserCheck
} from 'lucide-react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const SalaryModule = () => {
  const {
    employees = [],
    activeTenant,
    attendanceRecords,
    attendanceMatrix = {},
    updateEmployeeRoleAndDesignation,
    activeRole,
    salarySlips: contextSlips,
    generateSalarySlip,
    markSalaryPaid,
    leaveBalances = {},
    setLeaveQuota
  } = useCRM();
  const salarySlips = contextSlips || [];
  const isManagerOrAdmin = (activeRole?.permissions || []).includes('manage_salary') || activeRole?.id === 'role-admin' || activeRole?.id === 'role-hr';
  const [activeView, setActiveView] = useState(() => isManagerOrAdmin ? 'accumulation' : 'sessions'); // 'accumulation' | 'attendance' | 'sessions' | 'leaves' | 'slips'
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showSlipModal, setShowSlipModal] = useState(null);
  const [editSalaryEmp, setEditSalaryEmp] = useState(null);
  const [newSalaryVal, setNewSalaryVal] = useState(50000);
  const [payslipLogoUrl, setPayslipLogoUrl] = useState('');

  // Auto-switch away from restricted views if role changes
  React.useEffect(() => {
    if (!isManagerOrAdmin && (activeView === 'accumulation' || activeView === 'leaves' || activeView === 'slips')) {
      setActiveView('sessions');
    }
  }, [isManagerOrAdmin, activeView]);

  const handlePayslipLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit. Please upload a smaller logo image.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvt) => {
        setPayslipLogoUrl(uploadEvt.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = MONTHS[today.getMonth()];
  const currentYear = today.getFullYear();
  const daysInMonth = new Date(currentYear, today.getMonth() + 1, 0).getDate();

  const [formData, setFormData] = useState({
    employeeId: '', basicSalary: 50000, hra: 20000,
    transportAllowance: 3000, medicalAllowance: 2500,
    specialAllowance: 5000, bonus: 0,
    workingDays: 26, daysWorked: 26,
    month: currentMonth, year: currentYear
  });

  // Employee salary configurations with attendance-driven per-day computation
  const employeeSalaryData = useMemo(() => {
    return (employees || []).map((emp, i) => {
      const base = emp.baseSalary || emp.salary || [65000, 55000, 42000, 60000, 48000][i % 5];
      const hra = Math.round(base * 0.40);
      const transport = 3000;
      const medical = 2500;
      const special = Math.round(base * 0.10);
      const gross = base + hra + transport + medical + special;
      const pf = Math.round(base * 0.12);
      const esi = gross <= 21000 ? Math.round(gross * 0.0075) : 0;
      const profTax = 200;
      const incomeTax = Math.round(gross * 0.10);
      const totalDeductions = pf + esi + profTax + incomeTax;
      const net = gross - totalDeductions;

      // Base per-day rate based on Base Monthly Salary (26 working days per month)
      const perDayBase = Math.round(base / 26);

      // Attendance-driven calculation
      const empAtt = (attendanceRecords || []).filter(r => r.employeeId === emp.id);
      let calculatedDaysWorked = Math.min(currentDay, 26);

      if (empAtt.length > 0) {
        let count = 0;
        empAtt.forEach(r => {
          if (r.status === 'Present' || r.status === 'Paid Leave') count += 1;
          else if (r.status === 'Half-Day') count += 0.5;
        });
        calculatedDaysWorked = count;
      }

      // Accumulated MTD Base Pay strictly capped at Base Salary (so Accumulated MTD <= Base Salary)
      const accumulatedBase = Math.min(base, Math.round(perDayBase * calculatedDaysWorked));
      const progress = Math.min((calculatedDaysWorked / 26) * 100, 100);

      return {
        ...emp,
        basicSalary: base, hra, transport, medical, special,
        grossSalary: gross, pf, esi, profTax, incomeTax,
        totalDeductions, netSalary: net,
        perDay: perDayBase,
        accumulated: accumulatedBase,
        progress, daysWorked: calculatedDaysWorked
      };
    });
  }, [employees, attendanceRecords, currentDay, daysInMonth]);

  const currentYearNum = today.getFullYear();
  const employeeLeaveData = useMemo(() => {
    return (employees || []).map(emp => {
      let annualMLUsed = 0;
      let annualCLUsed = 0;
      for (let m = 1; m <= 12; m++) {
        const mKey = `${emp.id}-${currentYearNum}-${m}`;
        const mData = attendanceMatrix[mKey] || {};
        Object.values(mData).forEach(st => {
          if (st === 'SL') annualMLUsed += 1;
          if (st === 'CL') annualCLUsed += 1;
        });
      }
      const quotaML = 12;
      const quotaCL = 12;
      const remML = Math.max(0, quotaML - annualMLUsed);
      const remCL = Math.max(0, quotaCL - annualCLUsed);
      const totalPaidLeaves = quotaML + quotaCL; // 24
      const totalUsed = annualMLUsed + annualCLUsed;
      const totalRem = remML + remCL;

      return {
        ...emp,
        quotaML,
        quotaCL,
        annualMLUsed,
        annualCLUsed,
        remML,
        remCL,
        totalPaidLeaves,
        totalUsed,
        totalRem
      };
    });
  }, [employees, attendanceMatrix, currentYearNum]);

  const totalBasePayroll = employeeSalaryData.reduce((s, e) => s + e.basicSalary, 0);
  const totalAccumulated = employeeSalaryData.reduce((s, e) => s + e.accumulated, 0);
  const avgSalary = employeeSalaryData.length > 0 ? Math.round(totalBasePayroll / employeeSalaryData.length) : 0;

  const handleGenerateSlip = (e) => {
    e.preventDefault();
    const emp = (employees || []).find(e => e.id === formData.employeeId);
    if (!emp) return;

    const gross = formData.basicSalary + formData.hra + formData.transportAllowance
      + formData.medicalAllowance + formData.specialAllowance + formData.bonus;
    const pf = Math.round(formData.basicSalary * 0.12);
    const esi = gross <= 21000 ? Math.round(gross * 0.0075) : 0;
    const profTax = 200;
    const incomeTax = Math.round(gross * 0.10);
    const statutoryDeductions = pf + esi + profTax + incomeTax;

    const days = formData.workingDays || 26;
    const daysWorked = formData.daysWorked !== undefined ? formData.daysWorked : days;
    const fullMonthNet = gross - statutoryDeductions;
    const perDay = Math.round(fullMonthNet / days);

    // LOP (Loss of Pay) Deduction for absent days
    const absentDays = Math.max(0, days - daysWorked);
    const lopDeduction = Math.round(perDay * absentDays);
    const net = Math.max(0, fullMonthNet - lopDeduction);
    const totalDeductions = statutoryDeductions + lopDeduction;

    const newSlip = {
      id: `SAL-${formData.year}-${String(salarySlips.length + 1).padStart(4, '0')}`,
      clientId: activeTenant?.id || 'client-001',
      employeeId: emp.id,
      employeeName: emp.name,
      designation: emp.designation,
      month: formData.month, year: formData.year,
      basicSalary: formData.basicSalary, hra: formData.hra,
      transportAllowance: formData.transportAllowance,
      medicalAllowance: formData.medicalAllowance,
      specialAllowance: formData.specialAllowance,
      bonus: formData.bonus,
      grossSalary: gross, pf, esi, professionalTax: profTax, incomeTax,
      lopDeduction, totalDeductions, netSalary: net, perDayRate: perDay,
      workingDays: days,
      daysWorked: daysWorked,
      status: 'Generated',
      createdAt: new Date().toISOString()
    };

    if (generateSalarySlip) {
      generateSalarySlip(newSlip);
    }
    setShowGenerateModal(false);
  };

  const markPaid = (slipId) => {
    if (markSalaryPaid) {
      markSalaryPaid(slipId);
    }
  };

  const formatCurrency = (val) => `₹${(val || 0).toLocaleString('en-IN')}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: isManagerOrAdmin ? '#f59e0b' : '#10b981', fontWeight: '700', textTransform: 'uppercase' }}>
            {isManagerOrAdmin ? 'Payroll & Compensation Management' : 'Employee Attendance & Work Sessions'}
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '4px 0' }}>
            {isManagerOrAdmin ? 'Salary & Payroll Module' : 'Attendance & Work Logs'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {isManagerOrAdmin 
              ? 'Track per-day salary accumulation, generate payslips, and manage payroll disbursements.'
              : 'Record live daily work punches, upload work session logs, and view your attendance records.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {isManagerOrAdmin && (
            <>
              <label className="btn btn-secondary" style={{
                padding: '10px 14px',
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                borderColor: 'rgba(245, 158, 11, 0.4)',
                background: 'rgba(245, 158, 11, 0.12)',
                color: '#fbbf24',
                whiteSpace: 'nowrap'
              }}>
                <Upload style={{ width: '15px', height: '15px', color: '#fbbf24' }} />
                <span>{payslipLogoUrl ? 'Change Payslip Logo' : 'Upload Payslip Logo'}</span>
                <input type="file" accept="image/*" onChange={handlePayslipLogoUpload} style={{ display: 'none' }} />
              </label>

              {payslipLogoUrl && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '4px 10px', borderRadius: '8px' }}>
                  <img src={payslipLogoUrl} alt="Payslip Logo" style={{ width: '22px', height: '22px', borderRadius: '4px', objectFit: 'contain', background: '#fff' }} />
                  <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: '700' }}>Custom Logo Active</span>
                </div>
              )}

              <button
                onClick={() => setActiveView('accumulation')}
                className={`btn ${activeView === 'accumulation' ? 'gradient-btn-primary' : 'btn-secondary'}`}
                style={{ padding: '10px 16px', fontSize: '0.8rem' }}
              >
                <TrendingUp style={{ width: '16px', height: '16px' }} /> Per Day Tracker
              </button>
            </>
          )}

          <button
            onClick={() => setActiveView('sessions')}
            className={`btn ${activeView === 'sessions' ? 'gradient-btn-primary' : 'btn-secondary'}`}
            style={{ padding: '10px 16px', fontSize: '0.8rem' }}
          >
            <Clock style={{ width: '16px', height: '16px' }} /> {isManagerOrAdmin ? 'Daily Login/Logout Times' : 'Upload Logs & Work Clock'}
          </button>

          <button
            onClick={() => setActiveView('attendance')}
            className={`btn ${activeView === 'attendance' ? 'gradient-btn-primary' : 'btn-secondary'}`}
            style={{ padding: '10px 16px', fontSize: '0.8rem' }}
          >
            <CheckSquare style={{ width: '16px', height: '16px' }} /> {isManagerOrAdmin ? '31-Day Attendance' : 'Attendance Register'}
          </button>

          {isManagerOrAdmin && (
            <>
              <button
                onClick={() => setActiveView('leaves')}
                className={`btn ${activeView === 'leaves' ? 'gradient-btn-primary' : 'btn-secondary'}`}
                style={{ padding: '10px 16px', fontSize: '0.8rem' }}
              >
                <HeartPulse style={{ width: '16px', height: '16px', color: '#f43f5e' }} /> Leave Quota
              </button>
              <button
                onClick={() => setActiveView('slips')}
                className={`btn ${activeView === 'slips' ? 'gradient-btn-primary' : 'btn-secondary'}`}
                style={{ padding: '10px 16px', fontSize: '0.8rem' }}
              >
                <FileText style={{ width: '16px', height: '16px' }} /> Salary Slips
              </button>
              <button
                onClick={() => setShowGenerateModal(true)}
                className="btn gradient-btn-primary"
                style={{ padding: '10px 16px', fontSize: '0.8rem' }}
              >
                <PlusCircle style={{ width: '16px', height: '16px' }} /> Generate Slip
              </button>
            </>
          )}
        </div>
      </div>

      {/* Summary KPIs - Only shown for Admin / Manager */}
      {isManagerOrAdmin && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          <div className="glass-card" style={{ padding: '20px', borderTop: '4px solid #f59e0b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Base Payroll</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#f59e0b' }}>{formatCurrency(totalBasePayroll)}</div>
              </div>
              <Wallet style={{ color: '#f59e0b', width: '28px', height: '28px' }} />
            </div>
          </div>
          <div className="glass-card" style={{ padding: '20px', borderTop: '4px solid #10b981' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Accumulated (MTD)</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#10b981' }}>{formatCurrency(totalAccumulated)}</div>
              </div>
              <TrendingUp style={{ color: '#10b981', width: '28px', height: '28px' }} />
            </div>
          </div>
          <div className="glass-card" style={{ padding: '20px', borderTop: '4px solid #3b82f6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Avg. Salary</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#3b82f6' }}>{formatCurrency(avgSalary)}</div>
              </div>
              <BadgeIndianRupee style={{ color: '#3b82f6', width: '28px', height: '28px' }} />
            </div>
          </div>
          <div className="glass-card" style={{ padding: '20px', borderTop: '4px solid #8b5cf6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Employees</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#8b5cf6' }}>{employeeSalaryData.length}</div>
              </div>
              <Users style={{ color: '#8b5cf6', width: '28px', height: '28px' }} />
            </div>
          </div>
        </div>
      )}

      {/* Salary Per Day Accumulation View */}
      {isManagerOrAdmin && activeView === 'accumulation' && (
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>
              Per Day Salary Accumulation — {currentMonth} {currentYear} (Day {currentDay}/{daysInMonth})
            </h3>
            <span className="badge badge-emerald">
              <Clock style={{ width: '12px', height: '12px' }} /> Live Tracking
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {employeeSalaryData.map(emp => (
              <div key={emp.id} className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <img src={emp.avatar} alt={emp.name} style={{ width: '44px', height: '44px', borderRadius: '12px', objectFit: 'cover' }} />
                <div style={{ flex: '0 0 180px' }}>
                  <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{emp.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.designation}</div>
                </div>

                <div style={{ flex: '0 0 110px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Per Day (Base)</div>
                  <div style={{ fontWeight: '800', color: '#3b82f6' }}>{formatCurrency(emp.perDay)}</div>
                </div>

                <div style={{ flex: 1, padding: '0 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {emp.daysWorked} of 26 working days
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: '700' }}>
                      {Math.round(emp.progress)}%
                    </span>
                  </div>
                  <div style={{
                    width: '100%', height: '8px', borderRadius: '4px',
                    background: 'var(--bg-input)', overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${emp.progress}%`, height: '100%', borderRadius: '4px',
                      background: 'linear-gradient(90deg, #10b981 0%, #34d399 100%)',
                      transition: 'width 0.6s ease'
                    }} />
                  </div>
                </div>

                <div style={{ flex: '0 0 130px', textAlign: 'right' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Accumulated (MTD)</div>
                  <div style={{ fontWeight: '800', fontSize: '1.05rem', color: '#10b981' }}>
                    {formatCurrency(emp.accumulated)}
                  </div>
                </div>

                <div style={{ flex: '0 0 110px', textAlign: 'right' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Base Monthly</div>
                  <div style={{ fontWeight: '700', color: '#34d399' }}>
                    {formatCurrency(emp.basicSalary)}
                  </div>
                </div>

                <div style={{ flex: '0 0 120px', textAlign: 'right' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Est. Net Pay</div>
                  <div style={{ fontWeight: '700', color: '#a855f7', fontSize: '0.85rem' }}>
                    {formatCurrency(emp.netSalary)}
                  </div>
                </div>

                {isManagerOrAdmin && (
                  <button
                    onClick={() => {
                      setEditSalaryEmp(emp);
                      setNewSalaryVal(emp.basicSalary);
                    }}
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '8px', color: '#818cf8', borderColor: 'rgba(99,102,241,0.3)' }}
                  >
                    ✏️ Edit Salary
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attendance Marking View */}
      {activeView === 'attendance' && (
        <div className="glass-panel" style={{ padding: '20px' }}>
          <AttendanceTracker />
        </div>
      )}

      {/* Daily Login & Logout Register View */}
      {activeView === 'sessions' && (
        <div className="glass-panel" style={{ padding: '20px' }}>
          <LoginSessionsVault />
        </div>
      )}

      {/* Leave Quota & Balance Vault View (12 Medical + 12 Casual Leaves) */}
      {isManagerOrAdmin && activeView === 'leaves' && (
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Header & Policy Summary Banner */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#f43f5e', fontWeight: '800', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <HeartPulse style={{ width: '15px', height: '15px' }} /> Leave Quota & Policy Vault
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: '800', margin: '4px 0', color: 'var(--text-primary)' }}>
                Annual Paid Leave Allocation — {currentYearNum}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                Every employee is entitled to <strong>12 Medical Leaves (ML)</strong> and <strong>12 Casual Leaves (CL)</strong> per year (24 total paid leave days).
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{
                padding: '6px 12px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                fontSize: '0.78rem',
                fontWeight: '700',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}>
                ✓ 100% Paid Leave Protection Active
              </span>
            </div>
          </div>

          {/* Policy Highlights Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid #60a5fa' }}>
              <div style={{ fontSize: '0.72rem', color: '#60a5fa', fontWeight: '800', textTransform: 'uppercase' }}>Medical Leave (ML)</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--text-primary)', marginTop: '4px' }}>12 Days / Year</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>Applicable for medical illness, recovery & health emergencies.</div>
            </div>

            <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid #38bdf8' }}>
              <div style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: '800', textTransform: 'uppercase' }}>Casual Leave (CL)</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--text-primary)', marginTop: '4px' }}>12 Days / Year</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>Applicable for personal matters, family events & urgent affairs.</div>
            </div>

            <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid #34d399' }}>
              <div style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: '800', textTransform: 'uppercase' }}>Total Paid Entitlement</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#34d399', marginTop: '4px' }}>24 Days Total</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>100% wage protection with zero loss of pay deductions.</div>
            </div>

            <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid #818cf8' }}>
              <div style={{ fontSize: '0.72rem', color: '#818cf8', fontWeight: '800', textTransform: 'uppercase' }}>Auto-Attendance Rule</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#818cf8', marginTop: '4px' }}>9.0+ Hours</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>Daily work duration &gt;= 9h is automatically marked Present (P).</div>
            </div>
          </div>

          {/* Employee Leave Quota Cards Table */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
            {employeeLeaveData.map(emp => (
              <div key={emp.id} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src={emp.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80"} alt={emp.name} style={{ width: '42px', height: '42px', borderRadius: '12px', objectFit: 'cover' }} />
                    <div>
                      <div style={{ fontWeight: '800', fontSize: '0.95rem', color: 'var(--text-primary)' }}>{emp.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.designation}</div>
                    </div>
                  </div>
                  <span style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: emp.totalRem > 10 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: emp.totalRem > 10 ? '#34d399' : '#fbbf24',
                    fontSize: '0.72rem',
                    fontWeight: '800'
                  }}>
                    {emp.totalRem} / 24 Days Available
                  </span>
                </div>

                {/* Medical Leave Meter */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.78rem' }}>
                    <span style={{ color: '#60a5fa', fontWeight: '700' }}>🏥 Medical Leave (ML)</span>
                    <span style={{ fontWeight: '800', color: 'var(--text-primary)' }}>
                      {emp.remML} / 12 Remaining <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>({emp.annualMLUsed} used)</span>
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', borderRadius: '4px', background: 'var(--bg-input)', overflow: 'hidden' }}>
                    <div style={{
                      width: `${(emp.remML / 12) * 100}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)',
                      borderRadius: '4px',
                      transition: 'width 0.4s ease'
                    }} />
                  </div>
                </div>

                {/* Casual Leave Meter */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.78rem' }}>
                    <span style={{ color: '#38bdf8', fontWeight: '700' }}>🌴 Casual Leave (CL)</span>
                    <span style={{ fontWeight: '800', color: 'var(--text-primary)' }}>
                      {emp.remCL} / 12 Remaining <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>({emp.annualCLUsed} used)</span>
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', borderRadius: '4px', background: 'var(--bg-input)', overflow: 'hidden' }}>
                    <div style={{
                      width: `${(emp.remCL / 12) * 100}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #0284c7 0%, #38bdf8 100%)',
                      borderRadius: '4px',
                      transition: 'width 0.4s ease'
                    }} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '10px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>Annual Quota: 12 ML + 12 CL</span>
                  <span style={{ color: '#34d399', fontWeight: '700' }}>✓ Full Pay Protected</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Salary Slips View */}
      {isManagerOrAdmin && activeView === 'slips' && (
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px' }}>
            Generated Salary Slips ({salarySlips.length})
          </h3>

          {salarySlips.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <FileText style={{ width: '48px', height: '48px', marginBottom: '12px', opacity: 0.4 }} />
              <p>No salary slips generated yet. Click "Generate Slip" to create one.</p>
            </div>
          ) : (
            <div className="custom-table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Slip ID</th>
                    <th>Employee</th>
                    <th>Period</th>
                    <th>Gross</th>
                    <th>Deductions</th>
                    <th>Net Pay</th>
                    <th>Per Day</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {salarySlips.map(slip => (
                    <tr key={slip.id}>
                      <td><code style={{ background: 'var(--bg-input)', padding: '2px 8px', borderRadius: '4px', color: '#f59e0b', fontSize: '0.8rem' }}>{slip.id}</code></td>
                      <td>
                        <div style={{ fontWeight: '700' }}>{slip.employeeName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{slip.designation}</div>
                      </td>
                      <td>{slip.month} {slip.year}</td>
                      <td style={{ fontWeight: '600' }}>{formatCurrency(slip.grossSalary)}</td>
                      <td style={{ color: '#ef4444' }}>-{formatCurrency(slip.totalDeductions)}</td>
                      <td style={{ fontWeight: '800', color: '#10b981' }}>{formatCurrency(slip.netSalary)}</td>
                      <td style={{ color: '#3b82f6', fontWeight: '700' }}>{formatCurrency(slip.perDayRate)}</td>
                      <td>
                        <span className={`badge ${slip.status === 'Paid' ? 'badge-emerald' : 'badge-purple'}`}>
                          {slip.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => setShowSlipModal(slip)}
                            className="btn btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '0.7rem' }}
                          >
                            <Eye style={{ width: '12px', height: '12px' }} /> View
                          </button>
                          {slip.status !== 'Paid' && (
                            <button
                              onClick={() => markPaid(slip.id)}
                              className="btn gradient-btn-primary"
                              style={{ padding: '4px 10px', fontSize: '0.7rem' }}
                            >
                              <CheckCircle2 style={{ width: '12px', height: '12px' }} /> Pay
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Generate Salary Slip Modal */}
      {showGenerateModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '28px', maxWidth: '560px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <DollarSign style={{ color: '#f59e0b', width: '24px', height: '24px' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Generate Salary Slip</h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Enter salary components to automatically compute deductions and generate the payslip.
            </p>

            <form onSubmit={handleGenerateSlip}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Payslip Company Logo</span>
                  <span style={{ fontSize: '0.72rem', color: '#fbbf24', fontWeight: '700' }}>Local System / Computer</span>
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <label className="btn btn-secondary" style={{
                    padding: '8px 12px',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    borderColor: 'rgba(245, 158, 11, 0.4)',
                    background: 'rgba(245, 158, 11, 0.12)',
                    color: '#fbbf24',
                    whiteSpace: 'nowrap'
                  }}>
                    <Upload style={{ width: '14px', height: '14px', color: '#fbbf24' }} />
                    <span>Upload Local Logo</span>
                    <input type="file" accept="image/*" onChange={handlePayslipLogoUpload} style={{ display: 'none' }} />
                  </label>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {payslipLogoUrl ? '✓ Custom Logo Selected' : 'Using Default Active Tenant Logo'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Select Employee</label>
                  <select
                    required
                    value={formData.employeeId}
                    onChange={(e) => {
                      const empId = e.target.value;
                      const selectedEmp = employeeSalaryData.find(emp => emp.id === empId);
                      if (selectedEmp) {
                        setFormData({
                          ...formData,
                          employeeId: empId,
                          basicSalary: selectedEmp.basicSalary,
                          hra: selectedEmp.hra,
                          transportAllowance: selectedEmp.transport,
                          medicalAllowance: selectedEmp.medical,
                          specialAllowance: selectedEmp.special,
                          bonus: 0,
                          workingDays: 26,
                          daysWorked: selectedEmp.daysWorked || 26
                        });
                      } else {
                        setFormData({ ...formData, employeeId: empId });
                      }
                    }}
                    className="form-select"
                  >
                    <option value="">-- Choose Employee --</option>
                    {(employees || []).map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.designation})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Month</label>
                  <select value={formData.month} onChange={(e) => setFormData({ ...formData, month: e.target.value })} className="form-select">
                    {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Year</label>
                  <input type="number" value={formData.year} onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })} className="form-input" />
                </div>

                <div className="form-group">
                  <label className="form-label">Basic Salary (₹)</label>
                  <input type="number" value={formData.basicSalary} onChange={(e) => setFormData({ ...formData, basicSalary: parseInt(e.target.value) || 0 })} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">HRA (₹)</label>
                  <input type="number" value={formData.hra} onChange={(e) => setFormData({ ...formData, hra: parseInt(e.target.value) || 0 })} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Transport Allowance (₹)</label>
                  <input type="number" value={formData.transportAllowance} onChange={(e) => setFormData({ ...formData, transportAllowance: parseInt(e.target.value) || 0 })} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Medical Allowance (₹)</label>
                  <input type="number" value={formData.medicalAllowance} onChange={(e) => setFormData({ ...formData, medicalAllowance: parseInt(e.target.value) || 0 })} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Special Allowance (₹)</label>
                  <input type="number" value={formData.specialAllowance} onChange={(e) => setFormData({ ...formData, specialAllowance: parseInt(e.target.value) || 0 })} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Bonus (₹)</label>
                  <input type="number" value={formData.bonus} onChange={(e) => setFormData({ ...formData, bonus: parseInt(e.target.value) || 0 })} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Working Days</label>
                  <input type="number" value={formData.workingDays} onChange={(e) => setFormData({ ...formData, workingDays: parseInt(e.target.value) || 26 })} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Days Worked</label>
                  <input type="number" value={formData.daysWorked} onChange={(e) => setFormData({ ...formData, daysWorked: parseInt(e.target.value) || 26 })} className="form-input" />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowGenerateModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn gradient-btn-primary">Generate Salary Slip</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Salary Slip Detail Modal */}
      {showSlipModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '28px', maxWidth: '540px' }}>
            {/* Payslip Company Branding Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', paddingBottom: '14px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img
                  src={showSlipModal.logoUrl || payslipLogoUrl || activeTenant?.logo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80'}
                  alt="Company Logo"
                  style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'contain', background: '#ffffff', padding: '3px', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0 }}>
                    {activeTenant?.name || 'Astra Corporate Group'}
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: '#fbbf24', fontWeight: '700' }}>
                    OFFICIAL REMUNERATION VOUCHER
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className={`badge ${showSlipModal.status === 'Paid' ? 'badge-emerald' : 'badge-purple'}`}>
                  {showSlipModal.status}
                </span>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {showSlipModal.id} • {showSlipModal.month} {showSlipModal.year}
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '16px', marginBottom: '16px' }}>
              <div style={{ fontWeight: '700', fontSize: '1.05rem' }}>{showSlipModal.employeeName}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{showSlipModal.designation}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Working Days: {showSlipModal.daysWorked} / {showSlipModal.workingDays} &nbsp;|&nbsp; Per Day Rate: {formatCurrency(showSlipModal.perDayRate)}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#10b981', marginBottom: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>Earnings</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Basic Salary</span><span>{formatCurrency(showSlipModal.basicSalary)}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>HRA</span><span>{formatCurrency(showSlipModal.hra)}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Transport Allowance</span><span>{formatCurrency(showSlipModal.transportAllowance)}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Medical Allowance</span><span>{formatCurrency(showSlipModal.medicalAllowance)}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Special Allowance</span><span>{formatCurrency(showSlipModal.specialAllowance)}</span></div>
                  {showSlipModal.bonus > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Bonus</span><span>{formatCurrency(showSlipModal.bonus)}</span></div>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', borderTop: '1px solid var(--border-color)', paddingTop: '6px', color: '#10b981' }}>
                    <span>Gross Salary</span><span>{formatCurrency(showSlipModal.grossSalary)}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#ef4444', marginBottom: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>Deductions</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Provident Fund (PF)</span><span>{formatCurrency(showSlipModal.pf)}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>ESI</span><span>{formatCurrency(showSlipModal.esi)}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Professional Tax</span><span>{formatCurrency(showSlipModal.professionalTax)}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Income Tax (TDS)</span><span>{formatCurrency(showSlipModal.incomeTax)}</span></div>
                  {(showSlipModal.workingDays - showSlipModal.daysWorked > 0) && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444', fontWeight: '700' }}>
                      <span>Loss of Pay ({showSlipModal.workingDays - showSlipModal.daysWorked} Days Unpaid)</span>
                      <span>{formatCurrency(showSlipModal.lopDeduction || Math.round(showSlipModal.perDayRate * (showSlipModal.workingDays - showSlipModal.daysWorked)))}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', borderTop: '1px solid var(--border-color)', paddingTop: '6px', color: '#ef4444' }}>
                    <span>Total Deductions</span>
                    <span>{formatCurrency((showSlipModal.pf + showSlipModal.esi + showSlipModal.professionalTax + showSlipModal.incomeTax) + (showSlipModal.workingDays > showSlipModal.daysWorked ? (showSlipModal.lopDeduction || Math.round(showSlipModal.perDayRate * (showSlipModal.workingDays - showSlipModal.daysWorked))) : 0))}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card" style={{
              padding: '16px', textAlign: 'center',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
              borderRadius: '12px'
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Net Disbursable Salary ({showSlipModal.daysWorked} of {showSlipModal.workingDays} Days Worked)
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#10b981' }}>
                {formatCurrency(showSlipModal.daysWorked < showSlipModal.workingDays ? Math.round(showSlipModal.perDayRate * showSlipModal.daysWorked) : showSlipModal.netSalary)}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#a5b4fc', fontWeight: '600', marginTop: '6px', fontStyle: 'italic' }}>
                Amount in Words: {numberToWordsINR(showSlipModal.daysWorked < showSlipModal.workingDays ? Math.round(showSlipModal.perDayRate * showSlipModal.daysWorked) : showSlipModal.netSalary)}
              </div>
            </div>

            {/* Official Signature & Verification Block */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', fontSize: '0.75rem' }}>
              <div style={{ color: 'var(--text-muted)' }}>
                <span>System Generated Payslip · Verified by Astra Payroll Engine</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: '800', color: 'var(--text-primary)' }}>Elena Rostova</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Head of Human Resources & Finance</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '18px' }}>
              <button onClick={() => setShowSlipModal(null)} className="btn btn-secondary">Close</button>
              <button onClick={() => window.print()} className="btn gradient-btn-primary">
                <Printer style={{ width: '14px', height: '14px' }} /> Print / Export PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Employee Base Salary Modal */}
      {editSalaryEmp && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '28px', maxWidth: '440px', borderRadius: '20px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '4px' }}>Modify Base Monthly Salary</h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Update compensation details for <strong>{editSalaryEmp.name}</strong> ({editSalaryEmp.designation}).
            </p>

            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                if (updateEmployeeRoleAndDesignation) {
                  await updateEmployeeRoleAndDesignation({
                    id: editSalaryEmp.id,
                    designation: editSalaryEmp.designation,
                    roleId: editSalaryEmp.roleId,
                    baseSalary: parseInt(newSalaryVal, 10)
                  });
                }
                alert(`Base salary updated to ${formatCurrency(newSalaryVal)} for ${editSalaryEmp.name}.`);
                setEditSalaryEmp(null);
              } catch (err) {
                alert(err.message || 'Failed to update salary');
              }
            }}>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">New Base Monthly Salary ($)</label>
                <input
                  type="number"
                  required
                  min="1000"
                  step="1000"
                  value={newSalaryVal}
                  onChange={(e) => setNewSalaryVal(parseInt(e.target.value || 0, 10))}
                  className="form-input"
                  style={{ fontSize: '1.1rem', fontWeight: '800', color: '#10b981' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setEditSalaryEmp(null)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn gradient-btn-primary">Update & Apply Salary</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalaryModule;
