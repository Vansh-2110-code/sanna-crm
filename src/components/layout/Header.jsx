import React, { useState, useEffect, useMemo } from 'react';
import { useCRM } from '../../context/CRMContext';
import { getAppConfig } from '../../utils/appMode';
import {
  getMonthBirthdays,
  getTodayBirthdays,
  MONTH_NAMES,
  formatBirthday
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
  Radio,
  LogIn,
  LogOut,
  PartyPopper,
  Gift
} from 'lucide-react';

const TAB_TITLES = {
  'dashboard': { title: 'Executive Performance Cockpit', category: 'Analytics' },
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
  'performance-board': { title: 'Performance Board & Birthdays', category: 'Human Resources' },
  'gst-invoices': { title: 'GST Invoices & Billing', category: 'Finance' },
  'financial-ledger': { title: 'Corporate Financial Ledger', category: 'Finance' }
};

const Header = ({ activeTab = 'dashboard', onNavigate, onOpenQuickCreate, onToggleSidebar, sidebarCollapsed = false }) => {
  const {
    allClients,
    activeTenant,
    setActiveTenantId,
    roles,
    activeRole,
    setActiveRoleId,
    globalSearch,
    setGlobalSearch,
    notifications,
    setNotifications,
    loginSessions = [],
    punchInSession,
    punchOutSession,
    currentUser,
    employees = []
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
  const [elapsedTime, setElapsedTime] = useState('');
  const unreadCount = notifications.filter(n => n.unread).length;

  const today = new Date();
  const currentMonthNum = today.getMonth() + 1; // 1-12

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
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const currentTabMeta = TAB_TITLES[activeTab] || { title: 'Executive CRM', category: 'Main' };

  return (
    <header className="app-header" style={{
      position: 'fixed',
      top: 0,
      left: sidebarCollapsed ? '78px' : 'var(--sidebar-width)',
      right: 0,
      height: 'var(--header-height)',
      background: 'rgba(13, 18, 31, 0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px',
      zIndex: 90,
      gap: '16px',
      transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      {/* Left side: Hamburger + Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
        <button
          className="mobile-menu-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
        >
          <Menu style={{ width: '22px', height: '22px' }} />
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ fontSize: '0.66rem', fontWeight: '800', color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {currentTabMeta.category}
          </div>
          <h2 style={{ fontSize: '0.98rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {currentTabMeta.title}
          </h2>
        </div>
      </div>

      {/* Global Search & Spotlight Launcher */}
      <div
        onClick={onOpenQuickCreate}
        style={{
          position: 'relative',
          flex: '1',
          maxWidth: '420px',
          minWidth: '150px',
          cursor: 'pointer'
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.09)',
          borderRadius: '12px',
          padding: '8px 14px',
          color: 'var(--text-secondary)',
          fontSize: '0.825rem',
          transition: 'all 0.15s ease',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Search style={{ width: '15px', height: '15px', color: '#818cf8' }} />
            <span style={{ color: 'var(--text-muted)' }}>Search modules, records or actions...</span>
          </div>
          <div style={{
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            padding: '2px 7px',
            borderRadius: '6px',
            fontSize: '0.68rem',
            fontWeight: '700',
            color: '#a5b4fc',
            userSelect: 'none'
          }}>
            ⌘K
          </div>
        </div>
      </div>

      {/* Right Header Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>

        {/* Live Login Session & Work Clock Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: currentActiveSession ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: currentActiveSession ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
          padding: '6px 12px',
          borderRadius: '10px',
          boxShadow: currentActiveSession ? '0 0 12px rgba(16, 185, 129, 0.15)' : 'none'
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: currentActiveSession ? '#10b981' : '#ef4444',
            boxShadow: currentActiveSession ? '0 0 10px #10b981' : 'none',
            animation: currentActiveSession ? 'floatGlow 2s ease-in-out infinite alternate' : 'none'
          }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: '800', color: currentActiveSession ? '#34d399' : '#f87171', textTransform: 'uppercase' }}>
              {currentActiveSession ? 'Active Session' : 'Offline'}
            </span>
            <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
              {currentActiveSession?.punchInTime ? `In: ${currentActiveSession.punchInTime} ${elapsedTime ? `(${elapsedTime})` : ''}` : 'Punched Out'}
            </span>
          </div>

          <button
            onClick={currentActiveSession ? punchOutSession : punchInSession}
            title={currentActiveSession ? 'Punch out current session' : 'Punch in and record session'}
            style={{
              background: currentActiveSession ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
              border: 'none',
              borderRadius: '6px',
              padding: '4px 8px',
              cursor: 'pointer',
              color: currentActiveSession ? '#f87171' : '#34d399',
              fontSize: '0.72rem',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.2s ease'
            }}
          >
            {currentActiveSession ? <LogOut style={{ width: '12px', height: '12px' }} /> : <LogIn style={{ width: '12px', height: '12px' }} />}
            <span>{currentActiveSession ? 'Out' : 'In'}</span>
          </button>
        </div>

        {/* Tenant Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'var(--bg-primary)',
          padding: '6px 10px',
          borderRadius: '10px',
          border: '1px solid var(--border-color)',
          whiteSpace: 'nowrap'
        }}>
          <Building style={{ width: '14px', height: '14px', color: '#60a5fa', flexShrink: 0 }} />
          <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)' }}>Tenant:</span>
          <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {activeTenant?.name && !activeTenant.name.includes('(Admin)') ? activeTenant.name : getAppConfig().companyName}
          </span>
          <Lock style={{ width: '11px', height: '11px', color: '#a5b4fc' }} title="Locked to organization" />
        </div>

        {/* 🎂 Birthday Celebrations Popover */}
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
                ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(236, 72, 153, 0.25) 100%)'
                : 'var(--bg-primary)',
              border: todayBirthdays.length > 0 ? '1.5px solid #f59e0b' : '1px solid var(--border-color)',
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              boxShadow: todayBirthdays.length > 0 ? '0 0 10px rgba(245, 158, 11, 0.35)' : 'none',
              fontSize: '1.1rem'
            }}
          >
            🎂
            {monthBirthdays.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: todayBirthdays.length > 0 ? 'linear-gradient(135deg, #f59e0b, #ec4899)' : '#8b5cf6',
                color: '#fff',
                fontSize: '0.65rem',
                fontWeight: '800',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(245, 158, 11, 0.5)'
              }}>
                {todayBirthdays.length > 0 ? '🎉' : monthBirthdays.length}
              </span>
            )}
          </button>

          {showBirthdayMenu && (
            <div style={{
              position: 'absolute',
              top: '48px',
              right: 0,
              width: '320px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              padding: '16px',
              zIndex: 200
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '1.1rem' }}>🎂</span>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                    {MONTH_NAMES[currentMonthNum - 1]} Birthdays
                  </h4>
                </div>
                <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', fontWeight: '700' }}>
                  {monthBirthdays.length} Celebrations
                </span>
              </div>

              {todayBirthdays.length > 0 && (
                <div style={{
                  padding: '10px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(236, 72, 153, 0.25) 100%)',
                  border: '1px solid #f59e0b',
                  marginBottom: '10px'
                }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: '800', color: '#fbbf24', textTransform: 'uppercase' }}>
                    🎉 Today's Birthday!
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#fff', marginTop: '2px' }}>
                    {todayBirthdays.map(b => b.name).join(' & ')}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>
                    Wish them a wonderful year ahead! 🥳
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                {monthBirthdays.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    No employee birthdays in {MONTH_NAMES[currentMonthNum - 1]}.
                  </div>
                ) : (
                  monthBirthdays.map(emp => {
                    const isToday = emp.birthdayData?.isToday;
                    return (
                      <div
                        key={emp.id}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '8px',
                          background: isToday ? 'rgba(245, 158, 11, 0.12)' : 'var(--bg-primary)',
                          border: isToday ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid var(--border-color)',
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
                            <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {emp.name}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                              {emp.designation || emp.role}
                            </div>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: '800', color: isToday ? '#fbbf24' : '#818cf8' }}>
                            {MONTH_NAMES[currentMonthNum - 1].slice(0, 3)} {emp.birthdayData?.day}
                          </div>
                          {isToday && (
                            <span style={{ fontSize: '0.62rem', fontWeight: '800', color: '#f59e0b' }}>
                              Today!
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

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (showBirthdayMenu) setShowBirthdayMenu(false);
            }}
            style={{
              position: 'relative',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            <Bell style={{ width: '18px', height: '18px', color: 'var(--text-primary)' }} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: '#f43f5e',
                color: '#fff',
                fontSize: '0.65rem',
                fontWeight: '800',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(244, 63, 94, 0.5)'
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div style={{
              position: 'absolute',
              top: '48px',
              right: 0,
              width: '300px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              padding: '16px',
              zIndex: 200
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: '700' }}>Notifications</h4>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: '0.75rem', cursor: 'pointer' }}>
                    Mark read
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto' }}>
                {notifications.map(n => (
                  <div key={n.id} style={{
                    padding: '10px',
                    borderRadius: '8px',
                    background: n.unread ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.8rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      {n.unread
                        ? <AlertTriangle style={{ width: '13px', height: '13px', color: '#f59e0b' }} />
                        : <CheckCircle2 style={{ width: '13px', height: '13px', color: '#10b981' }} />}
                      <span style={{ fontWeight: '700', color: n.unread ? '#60a5fa' : 'var(--text-primary)' }}>{n.title}</span>
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{n.message}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px' }}>{n.time}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Create */}
        <button
          onClick={onOpenQuickCreate}
          className="btn gradient-btn-primary"
          style={{ borderRadius: '10px', flexShrink: 0 }}
        >
          <Plus style={{ width: '16px', height: '16px' }} />
          <span>Quick Create</span>
        </button>

      </div>
    </header>
  );
};

export default Header;
