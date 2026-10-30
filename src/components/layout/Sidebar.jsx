import React, { useState, useEffect } from 'react';
import { useCRM } from '../../context/CRMContext';
import {
  LayoutDashboard,
  Users,
  Building2,
  Kanban,
  FileText,
  ShoppingBag,
  Clock,
  CheckSquare,
  ShieldCheck,
  Building,
  Sun,
  Moon,
  LogOut,
  ChevronRight,
  FolderKanban,
  BookOpen,
  BarChart3,
  Receipt,
  BookMarked,
  CalendarDays,
  Award,
  Layers,
  PanelLeftClose,
  PanelLeftOpen,
  CheckCircle2,
  FolderLock,
  Key
} from 'lucide-react';
import PricingPlansModal from '../billing/PricingPlansModal';

// 6 Core iOS Hubs Architecture
const IOS_CORE_HUBS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    subItems: [
      { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
      { id: 'reports', label: 'Analytics & Reports', icon: BarChart3 }
    ]
  },
  {
    id: 'ongoing-projects',
    label: 'Projects',
    icon: FolderKanban,
    subItems: [
      { id: 'ongoing-projects', label: 'Active Projects', icon: FolderKanban },
      { id: 'deliverables', label: 'Deliverables', icon: Layers },
      { id: 'content-calendar', label: 'Content Calendar', icon: CalendarDays },
      { id: 'completed-projects', label: 'Archived Projects', icon: CheckCircle2 }
    ]
  },
  {
    id: 'client-directory',
    label: 'Clients',
    icon: Building,
    subItems: [
      { id: 'client-directory', label: 'Client Directory', icon: Building },
      { id: 'leads', label: 'Leads', icon: Users },
      { id: 'contacts', label: 'Contacts', icon: Building2 },
      { id: 'pipeline', label: 'Sales Pipeline', icon: Kanban }
    ]
  },
  {
    id: 'daily-logs',
    label: 'Work Logs',
    icon: BookOpen,
    subItems: [
      { id: 'daily-logs', label: 'Daily Logs', icon: BookOpen },
      { id: 'activities', label: 'Team Activity', icon: Clock },
      { id: 'tasks', label: 'Tasks', icon: CheckSquare }
    ]
  },
  {
    id: 'gst-invoices',
    label: 'Finance',
    icon: Receipt,
    subItems: [
      { id: 'gst-invoices', label: 'GST Invoices', icon: Receipt },
      { id: 'financial-ledger', label: 'Ledger', icon: BookMarked },
      { id: 'quotes', label: 'Quotations', icon: FileText },
      { id: 'orders', label: 'Orders & Billing', icon: ShoppingBag }
    ]
  },
  {
    id: 'salary',
    label: 'HR & Attendance',
    icon: CalendarDays,
    subItems: [
      { id: 'salary', label: 'Attendance & Holidays', icon: CalendarDays },
      { id: 'kyc', label: 'KYC & Verification', icon: ShieldCheck },
      { id: 'performance-board', label: 'Performance', icon: Award },
      { id: 'security', label: 'Security & Access', icon: ShieldCheck },
      { id: 'documents', label: 'Document Vault', icon: FolderLock }
    ]
  }
];

const Sidebar = ({ activeTab, setActiveTab, mobileOpen, onCloseMobile, collapsed = false, onToggleCollapse }) => {
  const { activeTenant, activeRole, theme, setTheme, logout, currentUser } = useCRM();
  const [showPricingModal, setShowPricingModal] = useState(false);

  // Expanded submenus state
  const [openHubs, setOpenHubs] = useState(() => {
    const initial = {};
    IOS_CORE_HUBS.forEach(hub => {
      if (hub.id === activeTab || hub.subItems.some(sub => sub.id === activeTab)) {
        initial[hub.id] = true;
      }
    });
    return initial;
  });

  // Keep hub containing activeTab open when tab changes
  useEffect(() => {
    IOS_CORE_HUBS.forEach(hub => {
      if (hub.id === activeTab || hub.subItems.some(sub => sub.id === activeTab)) {
        setOpenHubs(prev => ({ ...prev, [hub.id]: true }));
      }
    });
  }, [activeTab]);

  const toggleHub = (hubId, e) => {
    e.stopPropagation();
    setOpenHubs(prev => ({
      ...prev,
      [hubId]: !prev[hubId]
    }));
  };

  const isHubVisible = (hubId) => {
    const perms = activeRole?.permissions || [];
    const roleId = activeRole?.id || currentUser?.roleId || '';
    const roleName = (activeRole?.name || currentUser?.role || '').toLowerCase();
    const userEmail = (currentUser?.email || '').toLowerCase();
    const userName = (currentUser?.name || '').toLowerCase();
    const assigned = currentUser?.assignedModules || [];
    const isSowmya = userEmail.includes('sowmya') || userName.includes('sowmya');

    // Super Admin or View All permission sees all hubs
    if (roleId === 'role-admin' || perms.includes('super_admin') || perms.includes('view_all')) return true;

    // Assigned module override
    if (assigned.includes(hubId)) return true;

    switch (hubId) {
      case 'dashboard':
      case 'ongoing-projects':
      case 'client-directory':
      case 'daily-logs':
      case 'salary':
        // Universal access for all employees (Dev, Intern, Marketer, Video Editor, etc.)
        return true;
      case 'gst-invoices':
        // Admin, Finance clearance, or Sowmya
        return isSowmya || assigned.includes('finance') || assigned.includes('ad-spend') || perms.includes('manage_salary') || perms.includes('view_orders') || perms.includes('view_all');
      default:
        return false;
    }
  };

  const isSubItemVisible = (subId) => {
    const perms = activeRole?.permissions || [];
    const roleId = activeRole?.id || currentUser?.roleId || '';
    const roleName = (activeRole?.name || currentUser?.role || '').toLowerCase();
    const userEmail = (currentUser?.email || '').toLowerCase();
    const userName = (currentUser?.name || '').toLowerCase();
    const assigned = currentUser?.assignedModules || [];
    const isSowmya = userEmail.includes('sowmya') || userName.includes('sowmya');

    if (roleId === 'role-admin' || perms.includes('super_admin') || perms.includes('view_all')) return true;
    if (assigned.includes(subId)) return true;

    // Developers & Interns share identical permissions
    if (roleId === 'role-dev' || roleId === 'role-intern' || roleName.includes('developer') || roleName.includes('intern')) {
      return ['dashboard', 'ongoing-projects', 'deliverables', 'client-directory', 'daily-logs', 'salary', 'kyc'].includes(subId);
    }
    // Marketers
    if (roleId === 'role-marketer' || roleName.includes('marketer')) {
      const allowed = ['dashboard', 'ongoing-projects', 'deliverables', 'client-directory', 'leads', 'daily-logs', 'salary', 'kyc'];
      if (isSowmya) allowed.push('gst-invoices', 'financial-ledger');
      return allowed.includes(subId);
    }
    // Video Editors
    if (roleId === 'role-video' || roleName.includes('video')) {
      return ['dashboard', 'ongoing-projects', 'deliverables', 'content-calendar', 'client-directory', 'daily-logs', 'salary', 'kyc'].includes(subId);
    }

    return isHubVisible(subId);
  };

  return (
    <>
      {/* Mobile overlay backdrop */}
      <div
        className={`sidebar-overlay ${mobileOpen ? 'active' : ''}`}
        onClick={onCloseMobile}
      />

      <aside
        className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: collapsed ? '80px' : '260px',
          height: '100vh',
          background: theme === 'dark' ? '#121216' : '#FFFFFF',
          borderRight: theme === 'dark' ? '1px solid #23232b' : '1px solid #EEF2F6',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 100,
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.12)'
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: collapsed ? '20px 14px' : '20px 18px',
            borderBottom: theme === 'dark' ? '1px solid #23232b' : '1px solid #F1F4F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            gap: '12px',
            background: theme === 'dark' ? '#121216' : '#FFFFFF'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: '#1c1c22',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                flexShrink: 0
              }}
            >
              <img
                src="/sanna_logo.png"
                alt="Sanna Innovations"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain'
                }}
              />
            </div>

            {!collapsed && (
              <div style={{ overflow: 'hidden' }}>
                <h1
                  style={{
                    fontSize: '0.98rem',
                    fontWeight: '900',
                    letterSpacing: '-0.02em',
                    color: theme === 'dark' ? '#F9FAFB' : '#1E1F24',
                    margin: 0,
                    lineHeight: 1.15
                  }}
                >
                  SANNA CRM
                </h1>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    marginTop: '2px'
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.62rem',
                      color: '#4E3EFF',
                      fontWeight: '800',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase'
                    }}
                  >
                    Verion Matte
                  </span>
                  <span
                    style={{
                      display: 'inline-block',
                      width: '5px',
                      height: '5px',
                      borderRadius: '50%',
                      background: '#93FEBF'
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Collapse toggle button */}
          {!collapsed && onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              title="Collapse Sidebar"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
            >
              <PanelLeftClose style={{ width: '18px', height: '18px' }} />
            </button>
          )}

          {collapsed && onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              title="Expand Sidebar"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#4E3EFF',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <PanelLeftOpen style={{ width: '16px', height: '16px' }} />
            </button>
          )}
        </div>

        {/* Tenant Organization Pill Card */}
        {!collapsed && (
          <div
            onClick={() => setShowPricingModal(true)}
            style={{
              margin: '12px 14px 4px 14px',
              padding: '9px 12px',
              background: theme === 'dark' ? '#1c1c22' : '#F8FAFC',
              border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Suite Subscription & Licensing"
          >
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: '#4E3EFF',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                fontSize: '0.8rem',
                flexShrink: 0
              }}
            >
              <Building style={{ width: '15px', height: '15px' }} />
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div
                style={{
                  fontSize: '0.78rem',
                  fontWeight: '800',
                  color: theme === 'dark' ? '#F9FAFB' : '#1E1F24',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {activeTenant?.name && !activeTenant.name.includes('(Admin)') ? activeTenant.name : 'Sanna Innovations'}
              </div>
              <div
                style={{
                  fontSize: '0.66rem',
                  color: '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>Enterprise Suite</span>
                <span style={{ color: '#10B981', fontWeight: '800' }}>● Active</span>
              </div>
            </div>
          </div>
        )}

        <PricingPlansModal isOpen={showPricingModal} onClose={() => setShowPricingModal(false)} />

        {/* 6 Core iOS Hubs Dock Navigation */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: collapsed ? '12px 8px' : '14px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}
        >
          {IOS_CORE_HUBS.map((hub) => {
            if (!isHubVisible(hub.id)) return null;

            const visibleSubItems = hub.subItems.filter(sub => isSubItemVisible(sub.id));
            const isDirectActive = activeTab === hub.id;
            const hasSubActive = visibleSubItems.some(sub => sub.id === activeTab);
            const isActive = isDirectActive || hasSubActive;
            const isOpen = openHubs[hub.id] && visibleSubItems.length > 1;
            const HubIcon = hub.icon;

            return (
              <div key={hub.id} style={{ marginBottom: '2px' }}>
                {/* Main Hub Squircle Button */}
                <div
                  onClick={() => {
                    setActiveTab(hub.id);
                    if (!isOpen && visibleSubItems.length > 1) {
                      setOpenHubs(prev => ({ ...prev, [hub.id]: true }));
                    }
                  }}
                  title={collapsed ? hub.label : undefined}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'space-between',
                    padding: collapsed ? '11px 0' : '10px 12px',
                    borderRadius: '12px',
                    background: isActive
                      ? (theme === 'dark' ? '#1c1c22' : '#F1F4F9')
                      : 'transparent',
                    border: isActive
                      ? (theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0')
                      : '1px solid transparent',
                    color: isActive
                      ? (theme === 'dark' ? '#FFFFFF' : '#1E1F24')
                      : (theme === 'dark' ? '#94A3B8' : '#475467'),
                    fontWeight: isActive ? '700' : '500',
                    fontSize: '0.825rem',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    userSelect: 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = theme === 'dark' ? '#18181f' : '#F8FAFC';
                      e.currentTarget.style.color = theme === 'dark' ? '#F9FAFB' : '#1E1F24';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = theme === 'dark' ? '#94A3B8' : '#475467';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '11px', overflow: 'hidden' }}>
                    <HubIcon
                      style={{
                        width: '18px',
                        height: '18px',
                        flexShrink: 0,
                        color: isActive ? '#4E3EFF' : (theme === 'dark' ? '#94A3B8' : '#64748B')
                      }}
                    />
                    {!collapsed && (
                      <span
                        style={{
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          letterSpacing: '-0.01em'
                        }}
                      >
                        {hub.label}
                      </span>
                    )}
                  </div>

                  {!collapsed && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {isActive && (
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: '#93FEBF',
                            flexShrink: 0
                          }}
                        />
                      )}
                      {visibleSubItems.length > 1 && (
                        <button
                          onClick={(e) => toggleHub(hub.id, e)}
                          title="Toggle sub-views"
                          style={{
                            background: isOpen
                              ? (theme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)')
                              : 'transparent',
                            border: 'none',
                            borderRadius: '6px',
                            color: isOpen ? (theme === 'dark' ? '#F1F5F9' : '#1E1F24') : '#64748B',
                            cursor: 'pointer',
                            width: '22px',
                            height: '22px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                          }}
                        >
                          <ChevronRight style={{ width: '13px', height: '13px' }} />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Sub-items (iOS Grouped Inset Capsule) */}
                {!collapsed && isOpen && visibleSubItems.length > 1 && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      padding: '4px',
                      marginTop: '4px',
                      marginBottom: '6px',
                      marginLeft: '12px',
                      marginRight: '2px',
                      background: theme === 'dark' ? 'rgba(255, 255, 255, 0.025)' : 'rgba(0, 0, 0, 0.025)',
                      border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.04)',
                      borderRadius: '12px',
                      backdropFilter: 'blur(10px)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {visibleSubItems.map((sub) => {
                      const SubIcon = sub.icon;
                      const isSubActive = activeTab === sub.id;

                      return (
                        <button
                          key={sub.id}
                          onClick={() => setActiveTab(sub.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '7px 10px',
                            borderRadius: '8px',
                            background: isSubActive
                              ? (theme === 'dark' ? 'rgba(78, 62, 255, 0.18)' : '#EEF2FF')
                              : 'transparent',
                            border: isSubActive
                              ? (theme === 'dark' ? '1px solid rgba(78, 62, 255, 0.3)' : '1px solid rgba(78, 62, 255, 0.2)')
                              : '1px solid transparent',
                            color: isSubActive
                              ? (theme === 'dark' ? '#FFFFFF' : '#4E3EFF')
                              : (theme === 'dark' ? '#94A3B8' : '#64748B'),
                            fontSize: '0.78rem',
                            fontWeight: isSubActive ? '600' : '500',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.16s cubic-bezier(0.16, 1, 0.3, 1)',
                            width: '100%'
                          }}
                          onMouseEnter={(e) => {
                            if (!isSubActive) {
                              e.currentTarget.style.background = theme === 'dark' ? 'rgba(255, 255, 255, 0.045)' : 'rgba(0, 0, 0, 0.035)';
                              e.currentTarget.style.color = theme === 'dark' ? '#FFFFFF' : '#1E1F24';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSubActive) {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = theme === 'dark' ? '#94A3B8' : '#64748B';
                            }
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                            <SubIcon
                              style={{
                                width: '13px',
                                height: '13px',
                                flexShrink: 0,
                                color: isSubActive ? '#4E3EFF' : (theme === 'dark' ? '#64748B' : '#94A3B8')
                              }}
                            />
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {sub.label}
                            </span>
                          </div>
                          {isSubActive && (
                            <span
                              style={{
                                width: '5px',
                                height: '5px',
                                borderRadius: '50%',
                                background: '#93FEBF',
                                flexShrink: 0,
                                boxShadow: '0 0 6px rgba(147, 254, 191, 0.6)'
                              }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Drawer & User Profile */}
        <div
          style={{
            padding: collapsed ? '12px 8px' : '14px 14px',
            borderTop: theme === 'dark' ? '1px solid #23232b' : '1px solid #F1F4F9',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            background: theme === 'dark' ? '#121216' : '#FAFAFA'
          }}
        >
          {/* User Profile Pill - Clean & Egalitarian (No artificial Lead badges) */}
          {!collapsed ? (
            <div
              style={{
                background: theme === 'dark' ? '#1c1c22' : '#FFFFFF',
                border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '8px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <img
                  src={currentUser?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80'}
                  alt={currentUser?.name}
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    objectFit: 'cover',
                    border: '1.5px solid #4E3EFF'
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    bottom: -1,
                    right: -1,
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#10B981',
                    border: '1.5px solid #121216'
                  }}
                />
              </div>

              <div style={{ overflow: 'hidden', flex: 1 }}>
                <div
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: '800',
                    color: theme === 'dark' ? '#F9FAFB' : '#1E1F24',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {currentUser?.name || 'Smitesh'}
                </div>
                <div
                  style={{
                    fontSize: '0.66rem',
                    color: '#94A3B8',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {(() => {
                    const nameLower = (currentUser?.name || '').toLowerCase();
                    const userLower = (currentUser?.username || '').toLowerCase();
                    if (nameLower.includes('smitesh') || userLower === 'smitesh') {
                      return 'Lead Developer';
                    }
                    const des = currentUser?.designation;
                    const role = currentUser?.role;
                    if (des && des !== 'Intern' && des !== 'Employee') return des;
                    if (role && !role.includes('Intern / Engineering Trainee')) return role;
                    return des || role || 'Team Member';
                  })()}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <img
                src={currentUser?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80'}
                alt={currentUser?.name}
                title={`${currentUser?.name} (${currentUser?.designation || 'User'})`}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  objectFit: 'cover',
                  border: '1.5px solid #4E3EFF'
                }}
              />
            </div>
          )}

          {/* Quick Actions (Password & Logout) */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-change-password-modal'))}
              title="Change Password"
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '9px 10px',
                borderRadius: '10px',
                background: 'rgba(78, 62, 255, 0.1)',
                border: '1px solid rgba(78, 62, 255, 0.25)',
                color: '#818CF8',
                fontSize: '0.76rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(78, 62, 255, 0.2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(78, 62, 255, 0.1)'; }}
            >
              <Key style={{ width: '13px', height: '13px' }} />
              {!collapsed && <span>Password</span>}
            </button>

            <button
              onClick={logout}
              title="Sign Out"
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '9px 10px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#EF4444',
                fontSize: '0.76rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.16)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'; }}
            >
              <LogOut style={{ width: '13px', height: '13px' }} />
              {!collapsed && <span>Sign Out</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
