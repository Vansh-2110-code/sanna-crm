import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useCRM } from '../../context/CRMContext';
import { getAppConfig } from '../../utils/appMode';
import {
  getMonthBirthdays,
  getTodayBirthdays,
  MONTH_NAMES
} from '../../utils/birthdayUtils';
import {
  Search,
  Bell,
  Building,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Menu,
  Clock,
  LogIn,
  LogOut,
  CalendarDays,
  Gift,
  PartyPopper,
  Sparkles,
  ChevronDown,
  Video,
  FileCheck,
  Wallet,
  AlertCircle
} from 'lucide-react';

const TAB_TITLES = {
  'dashboard': { title: 'Executive Dashboard', category: 'Analytics' },
  'reports': { title: 'Reports & Intelligence Vault', category: 'Analytics' },
  'security': { title: 'Security & Access Control', category: 'Administration' },
  'leads': { title: 'Lead Pipeline & Acquisition', category: 'Sales' },
  'ai-assistant': { title: 'AI Sales Copilot & Analysis', category: 'Sales' },
  'contacts': { title: 'Client Contacts & Accounts', category: 'Sales' },
  'pipeline': { title: 'Sales Pipeline Kanban Board', category: 'Sales' },
  'products': { title: 'Enterprise Product Catalog', category: 'Sales' },
  'service-catalog': { title: 'MIS Service Catalog', category: 'Sales' },
  'quotes': { title: 'Quotation Engine & Proposals', category: 'Sales' },
  'orders': { title: 'Orders, Invoices & Revenue', category: 'Sales' },
  'client-directory': { title: 'Client Organization Directory', category: 'Operations' },
  'activities': { title: 'Call Logs & Activity Feed', category: 'Operations' },
  'tasks': { title: 'Task Matrix & Deadlines', category: 'Operations' },
  'daily-logs': { title: 'Daily Work & Team Logs', category: 'Operations' },
  'content-calendar': { title: 'Media & Content Calendar', category: 'Operations' },
  'deliverables': { title: 'Client Deliverables Matrix', category: 'Operations' },
  'ongoing-projects': { title: 'Ongoing Client Projects', category: 'Operations' },
  'completed-projects': { title: 'Archived Completed Projects', category: 'Operations' },
  'support': { title: 'Helpdesk & Ticket Management', category: 'Operations' },
  'customers': { title: 'Customer Accounts & Portals', category: 'Operations' },
  'marketing': { title: 'Omnichannel Campaigns', category: 'Growth' },
  'documents': { title: 'Encrypted Document Vault', category: 'Security' },
  'integrations': { title: 'Integrations & Webhooks', category: 'Growth' },
  'salary': { title: 'Attendance, Salary & Payroll', category: 'Human Resources' },
  'kyc': { title: 'KYC & Verification Vault', category: 'Human Resources' },
  'performance-board': { title: 'Performance Board & Celebrations', category: 'Human Resources' },
  'gst-invoices': { title: 'GST Invoices & Billing', category: 'Finance' },
  'financial-ledger': { title: 'Corporate Financial Ledger', category: 'Finance' }
};

const Header = ({ activeTab = 'dashboard', onNavigate, onOpenQuickCreate, onToggleSidebar, sidebarCollapsed = false }) => {
  const {
    activeTenant,
    globalSearch,
    setGlobalSearch,
    notifications,
    setNotifications,
    loginSessions = [],
    punchInSession,
    punchOutSession,
    currentUser,
    employees = [],
    theme
  } = useCRM();

  const currentActiveSession = (loginSessions || []).find(s => 
    (s.userId === currentUser?.id || 
     s.userEmail === currentUser?.email || 
     s.userName === currentUser?.name ||
     (currentUser?.name && s.userName && s.userName.toLowerCase().includes(currentUser.name.toLowerCase()))) && 
    s.status === 'Active'
  );

  const [showNotifications, setShowNotifications] = useState(false);
  const [showBirthdayMenu, setShowBirthdayMenu] = useState(false);
  const notifRef = useRef(null);
  const [elapsedTime, setElapsedTime] = useState('');
  const [readIds, setReadIds] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('astra_read_notif_ids') || '[]'));
    } catch (e) {
      return new Set();
    }
  });
  const unreadCount = (notifications || []).filter(n => n.unread && !readIds.has(n.id)).length;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const today = new Date();
  const currentMonthNum = today.getMonth() + 1; // 1-12

  // Format today date: e.g. "Mon, 19 Oct"
  const formattedTodayDate = today.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });

  // Live timer for active punch-in session
  useEffect(() => {
    if (!currentActiveSession || !currentActiveSession.punchInTime) {
      setElapsedTime('');
      return;
    }

    const interval = setInterval(() => {
      try {
        const parts = currentActiveSession.punchInTime.split(':');
        if (parts.length >= 2) {
          const inH = parseInt(parts[0], 10);
          const inM = parseInt(parts[1], 10);
          const now = new Date();
          const sessionDate = new Date();
          sessionDate.setHours(inH, inM, 0, 0);
          let diffMs = now - sessionDate;
          if (diffMs < 0) diffMs = 0;
          const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
          const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          setElapsedTime(`${diffHrs}h ${diffMins}m`);
        }
      } catch (e) {
        // ignore
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [currentActiveSession]);

  const monthBirthdays = useMemo(() => {
    return getMonthBirthdays(employees, currentMonthNum, today.getFullYear());
  }, [employees, currentMonthNum]);

  const todayBirthdays = useMemo(() => {
    return getTodayBirthdays(employees, today);
  }, [employees]);

  const markAllRead = () => {
    const allIds = (notifications || []).map(n => n.id);
    setReadIds(new Set(allIds));
    try { localStorage.setItem('astra_read_notif_ids', JSON.stringify(allIds)); } catch (e) {}
  };

  const markAsRead = (id) => {
    setReadIds(prev => {
      const next = new Set(prev).add(id);
      try { localStorage.setItem('astra_read_notif_ids', JSON.stringify([...next])); } catch (e) {}
      return next;
    });
  };

  const currentTabMeta = TAB_TITLES[activeTab] || { title: 'Executive CRM', category: 'Main' };

  return (
    <header
      className="app-header"
      style={{
        position: 'fixed',
        top: 0,
        left: sidebarCollapsed ? '80px' : '260px',
        right: 0,
        height: '70px',
        background: theme === 'dark' ? '#121216' : '#FFFFFF',
        borderBottom: theme === 'dark' ? '1px solid #23232b' : '1px solid #EEF2F6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        zIndex: 90,
        gap: '16px',
        transition: 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)'
      }}
    >
      {/* Left side: Mobile Toggle + Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
        <button
          className="mobile-menu-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
          style={{
            background: 'none',
            border: 'none',
            color: '#64748B',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          <Menu style={{ width: '22px', height: '22px' }} />
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div
            style={{
              fontSize: '0.66rem',
              fontWeight: '800',
              color: '#4E3EFF',
              textTransform: 'uppercase',
              letterSpacing: '0.08em'
            }}
          >
            {currentTabMeta.category}
          </div>
          <h2
            style={{
              fontSize: '1rem',
              fontWeight: '800',
              margin: 0,
              color: theme === 'dark' ? '#F9FAFB' : '#1E1F24',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              letterSpacing: '-0.02em'
            }}
          >
            {currentTabMeta.title}
          </h2>
        </div>
      </div>

      {/* VERION Rounded Pill Search Box (Matching Reference Clean Layout) */}
      <div
        onClick={onOpenQuickCreate}
        style={{
          position: 'relative',
          width: '280px',
          maxWidth: '320px',
          flex: '0 1 280px',
          cursor: 'pointer'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: theme === 'dark' ? '#1c1c22' : '#F1F4F9',
            border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid transparent',
            borderRadius: '9999px',
            padding: '8px 14px',
            color: '#64748B',
            fontSize: '0.8rem',
            transition: 'all 0.18s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#4E3EFF';
            if (theme !== 'dark') e.currentTarget.style.background = '#FFFFFF';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'transparent';
            if (theme !== 'dark') e.currentTarget.style.background = '#F1F4F9';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
            <Search style={{ width: '14px', height: '14px', color: '#94A3B8', flexShrink: 0 }} />
            <span style={{ color: '#94A3B8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Search...
            </span>
          </div>
          <div
            style={{
              background: theme === 'dark' ? '#23232b' : '#FFFFFF',
              border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E2E8F0',
              padding: '2px 7px',
              borderRadius: '6px',
              fontSize: '0.66rem',
              fontWeight: '700',
              color: '#94A3B8',
              userSelect: 'none',
              flexShrink: 0
            }}
          >
            ⌘K
          </div>
        </div>
      </div>

      {/* Right Header Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>

        {/* Date Pill Badge (e.g. Today, Mon 19 Oct) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: theme === 'dark' ? '#1c1c22' : '#EFF6FF',
            border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #DBEAFE',
            padding: '7px 12px',
            borderRadius: '9999px',
            color: theme === 'dark' ? '#93FEBF' : '#2563EB',
            fontSize: '0.74rem',
            fontWeight: '700',
            whiteSpace: 'nowrap'
          }}
        >
          <CalendarDays style={{ width: '13px', height: '13px', color: theme === 'dark' ? '#93FEBF' : '#3B82F6' }} />
          <span>{formattedTodayDate}</span>
        </div>

        {/* Live Login Session & Work Clock Pill - Sleek Merged iOS Capsule */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: theme === 'dark' ? '#1c1c22' : '#F8FAFC',
            border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
            padding: '4px 6px 4px 10px',
            borderRadius: '9999px',
            whiteSpace: 'nowrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: currentActiveSession ? '#10B981' : '#94A3B8',
                boxShadow: currentActiveSession ? '0 0 6px rgba(16, 185, 129, 0.6)' : 'none',
                flexShrink: 0
              }}
            />
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: '700',
                color: currentActiveSession ? (theme === 'dark' ? '#93FEBF' : '#059669') : '#94A3B8'
              }}
            >
              {currentActiveSession ? (elapsedTime ? elapsedTime : 'Active') : 'Offline'}
            </span>
          </div>

          <button
            onClick={currentActiveSession ? punchOutSession : punchInSession}
            title={currentActiveSession ? 'Punch out current session' : 'Punch in and record session'}
            style={{
              background: currentActiveSession ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              border: currentActiveSession ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
              color: currentActiveSession ? '#EF4444' : '#10B981',
              borderRadius: '9999px',
              padding: '3px 9px',
              fontSize: '0.68rem',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.15s ease'
            }}
          >
            {currentActiveSession ? <LogOut style={{ width: '11px', height: '11px' }} /> : <LogIn style={{ width: '11px', height: '11px' }} />}
            <span>{currentActiveSession ? 'Punch Out' : 'Punch In'}</span>
          </button>
        </div>

        {/* Tenant Organization Pill - Compact Logo + Name */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: theme === 'dark' ? '#1c1c22' : '#F8FAFC',
            padding: '6px 11px',
            borderRadius: '9999px',
            border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
            whiteSpace: 'nowrap'
          }}
        >
          <Building style={{ width: '13px', height: '13px', color: '#4E3EFF', flexShrink: 0 }} />
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: '700',
              color: theme === 'dark' ? '#F9FAFB' : '#1E1F24'
            }}
          >
            {activeTenant?.name && !activeTenant.name.includes('(Admin)') ? activeTenant.name : 'Sanna Innovations'}
          </span>
        </div>

        {/* Celebrations Popover (100% Zero-Emoji with Lucide Gift) */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setShowBirthdayMenu(!showBirthdayMenu);
              if (showNotifications) setShowNotifications(false);
            }}
            title={`Employee Birthdays in ${MONTH_NAMES[currentMonthNum - 1]} (${monthBirthdays.length})`}
            style={{
              position: 'relative',
              background: todayBirthdays.length > 0
                ? 'linear-gradient(135deg, #F96E65 0%, #FFD144 100%)'
                : (theme === 'dark' ? '#1c1c22' : '#F8FAFC'),
              border: todayBirthdays.length > 0 ? 'none' : (theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0'),
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              boxShadow: todayBirthdays.length > 0 ? '0 4px 12px rgba(249, 110, 101, 0.35)' : 'none',
              color: todayBirthdays.length > 0 ? '#FFFFFF' : '#64748B'
            }}
          >
            <Gift style={{ width: '17px', height: '17px' }} />
            {monthBirthdays.length > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: '#4E3EFF',
                  color: '#FFFFFF',
                  fontSize: '0.62rem',
                  fontWeight: '800',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(78, 62, 255, 0.4)'
                }}
              >
                {monthBirthdays.length}
              </span>
            )}
          </button>

          {showBirthdayMenu && (
            <div
              style={{
                position: 'absolute',
                top: '48px',
                right: 0,
                width: '320px',
                background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                border: theme === 'dark' ? '1px solid #374151' : '1px solid #EEF2F6',
                borderRadius: '16px',
                boxShadow: '0 12px 36px rgba(0, 0, 0, 0.12)',
                padding: '16px',
                zIndex: 200
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
                  borderBottom: theme === 'dark' ? '1px solid #374151' : '1px solid #F1F4F9',
                  paddingBottom: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <PartyPopper style={{ width: '16px', height: '16px', color: '#4E3EFF' }} />
                  <h4
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: '800',
                      margin: 0,
                      color: theme === 'dark' ? '#F9FAFB' : '#1E1F24'
                    }}
                  >
                    {MONTH_NAMES[currentMonthNum - 1]} Celebrations
                  </h4>
                </div>
                <span
                  style={{
                    fontSize: '0.68rem',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    background: '#EFF6FF',
                    color: '#2563EB',
                    fontWeight: '800'
                  }}
                >
                  {monthBirthdays.length} Active
                </span>
              </div>

              {todayBirthdays.length > 0 && (
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, rgba(78, 62, 255, 0.1) 0%, rgba(147, 254, 191, 0.2) 100%)',
                    border: '1px solid #4E3EFF',
                    marginBottom: '10px'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.72rem',
                      fontWeight: '800',
                      color: '#4E3EFF',
                      textTransform: 'uppercase'
                    }}
                  >
                    <Sparkles style={{ width: '13px', height: '13px' }} />
                    <span>Today's Milestone</span>
                  </div>
                  <div
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: '800',
                      color: theme === 'dark' ? '#F9FAFB' : '#1E1F24',
                      marginTop: '2px'
                    }}
                  >
                    {todayBirthdays.map(b => b.name).join(' & ')}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                    Send executive greetings from team!
                  </div>
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  maxHeight: '240px',
                  overflowY: 'auto'
                }}
              >
                {monthBirthdays.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '16px', color: '#94A3B8', fontSize: '0.8rem' }}>
                    No staff milestones in {MONTH_NAMES[currentMonthNum - 1]}.
                  </div>
                ) : (
                  monthBirthdays.map(emp => {
                    const isToday = emp.birthdayData?.isToday;
                    return (
                      <div
                        key={emp.id}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '10px',
                          background: isToday
                            ? (theme === 'dark' ? 'rgba(78, 62, 255, 0.2)' : '#EFF6FF')
                            : (theme === 'dark' ? '#1F2937' : '#F8FAFC'),
                          border: isToday ? '1px solid #4E3EFF' : '1px solid #E2E8F0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                          <img
                            src={emp.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80"}
                            alt={emp.name}
                            style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                          <div style={{ overflow: 'hidden' }}>
                            <div
                              style={{
                                fontSize: '0.78rem',
                                fontWeight: '700',
                                color: theme === 'dark' ? '#F9FAFB' : '#1E1F24',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                            >
                              {emp.name}
                            </div>
                            <div style={{ fontSize: '0.66rem', color: '#64748B' }}>
                              {emp.designation || emp.role}
                            </div>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div
                            style={{
                              fontSize: '0.74rem',
                              fontWeight: '800',
                              color: isToday ? '#4E3EFF' : '#64748B'
                            }}
                          >
                            {MONTH_NAMES[currentMonthNum - 1].slice(0, 3)} {emp.birthdayData?.day}
                          </div>
                          {isToday && (
                            <span
                              style={{
                                fontSize: '0.62rem',
                                fontWeight: '800',
                                color: '#10B981'
                              }}
                            >
                              Today
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Notifications Pill */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (showBirthdayMenu) setShowBirthdayMenu(false);
            }}
            title="System Notifications"
            style={{
              position: 'relative',
              background: theme === 'dark' ? '#1F2937' : '#F8FAFC',
              border: theme === 'dark' ? '1px solid #374151' : '1px solid #E2E8F0',
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              color: '#64748B'
            }}
          >
            <Bell style={{ width: '17px', height: '17px' }} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: '#EF4444',
                  color: '#FFFFFF',
                  fontSize: '0.62rem',
                  fontWeight: '800',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)'
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div
              style={{
                position: 'absolute',
                top: '48px',
                right: 0,
                width: '320px',
                background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                border: theme === 'dark' ? '1px solid #374151' : '1px solid #EEF2F6',
                borderRadius: '16px',
                boxShadow: '0 12px 36px rgba(0,0,0,0.12)',
                padding: '16px',
                zIndex: 200
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px'
                }}
              >
                <h4
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: '800',
                    margin: 0,
                    color: theme === 'dark' ? '#F9FAFB' : '#1E1F24'
                  }}
                >
                  Notifications
                </h4>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#4E3EFF',
                      fontSize: '0.72rem',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  maxHeight: '340px',
                  overflowY: 'auto'
                }}
              >
                {(!notifications || notifications.length === 0) ? (
                  <div style={{ textAlign: 'center', padding: '24px 12px', color: '#64748B', fontSize: '0.78rem' }}>
                    All caught up! No active notifications.
                  </div>
                ) : (
                  notifications.map(n => {
                    const isUnread = n.unread && !readIds.has(n.id);
                    const getIcon = () => {
                      if (n.type === 'review') return <Video style={{ width: '14px', height: '14px', color: '#818cf8' }} />;
                      if (n.type === 'kyc') return <FileCheck style={{ width: '14px', height: '14px', color: '#06b6d4' }} />;
                      if (n.type === 'finance') return <Wallet style={{ width: '14px', height: '14px', color: '#f59e0b' }} />;
                      if (n.type === 'warning') return <AlertCircle style={{ width: '14px', height: '14px', color: '#ef4444' }} />;
                      if (n.type === 'success') return <CheckCircle2 style={{ width: '14px', height: '14px', color: '#10b981' }} />;
                      return <AlertTriangle style={{ width: '14px', height: '14px', color: '#f59e0b' }} />;
                    };

                    return (
                      <div
                        key={n.id}
                        onClick={() => {
                          markAsRead(n.id);
                          if (n.tab && typeof onNavigate === 'function') {
                            onNavigate(n.tab);
                            setShowNotifications(false);
                          }
                        }}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '10px',
                          background: isUnread
                            ? (theme === 'dark' ? 'rgba(78, 62, 255, 0.15)' : '#F1F4F9')
                            : (theme === 'dark' ? '#1F2937' : '#FAFAFA'),
                          border: isUnread
                            ? '1px solid rgba(78, 62, 255, 0.35)'
                            : (theme === 'dark' ? '1px solid #374151' : '1px solid #E2E8F0'),
                          fontSize: '0.8rem',
                          cursor: n.tab ? 'pointer' : 'default',
                          transition: 'all 0.15s ease'
                        }}
                        title={n.tab ? `Click to open ${n.tab}` : ''}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {getIcon()}
                            <span
                              style={{
                                fontWeight: '800',
                                color: isUnread ? '#818cf8' : (theme === 'dark' ? '#F9FAFB' : '#1E1F24')
                              }}
                            >
                              {n.title}
                            </span>
                          </div>
                          {isUnread && (
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6366f1' }}></span>
                          )}
                        </div>
                        <div style={{ color: theme === 'dark' ? '#94a3b8' : '#64748B', fontSize: '0.74rem', lineHeight: 1.35 }}>
                          {n.message}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '0.66rem', color: '#64748B' }}>
                          <span>{n.time}</span>
                          {n.tab && (
                            <span style={{ color: '#818cf8', fontWeight: '700' }}>Open &rarr;</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick Create: VERION Electric Blue Pill Button */}
        <button
          onClick={onOpenQuickCreate}
          style={{
            background: '#4E3EFF',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '9999px',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.78rem',
            fontWeight: '800',
            cursor: 'pointer',
            transition: 'all 0.18s ease',
            boxShadow: '0 4px 14px rgba(78, 62, 255, 0.3)',
            flexShrink: 0
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 6px 18px rgba(78, 62, 255, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(78, 62, 255, 0.3)';
          }}
        >
          <Plus style={{ width: '15px', height: '15px' }} />
          <span>Quick Create</span>
        </button>

      </div>
    </header>
  );
};

export default Header;
