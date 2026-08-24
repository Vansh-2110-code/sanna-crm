import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext';
import { getAppConfig } from '../../utils/appMode';
import {
  LayoutDashboard,
  Users,
  Building2,
  Kanban,
  Package,
  FileText,
  ShoppingBag,
  Clock,
  CheckSquare,
  Headphones,
  Megaphone,
  FolderLock,
  Boxes,
  ShieldCheck,
  Building,
  Sun,
  Moon,
  LogOut,
  ChevronRight,
  Sparkles,
  Wallet,
  CheckCircle2,
  FolderKanban,
  GraduationCap,
  BookOpen,
  BarChart3,
  Receipt,
  BookMarked,
  CalendarDays,
  Award,
  Tag,
  Layers
} from 'lucide-react';

const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard & Analytics', icon: LayoutDashboard, category: 'Main' },
  { id: 'reports', label: 'Reports & Intelligence', icon: BarChart3, category: 'Main' },
  { id: 'security', label: 'Security & Audit Vault', icon: ShieldCheck, category: 'Tenant' },
  
  { id: 'leads', label: 'Lead Management', icon: Users, category: 'Sales' },
  { id: 'ai-assistant', label: 'AI Sales Assistant', icon: Sparkles, category: 'Sales' },
  { id: 'contacts', label: 'Contacts & Accounts', icon: Building2, category: 'Sales' },
  { id: 'pipeline', label: 'Sales Pipeline Kanban', icon: Kanban, category: 'Sales' },
  { id: 'products', label: 'Product Catalog', icon: Package, category: 'Sales' },
  { id: 'service-catalog', label: 'Service Catalog', icon: Tag, category: 'Sales' },
  { id: 'quotes', label: 'Quotation Engine', icon: FileText, category: 'Sales' },
  { id: 'orders', label: 'Orders & Invoices', icon: ShoppingBag, category: 'Sales' },

  { id: 'client-directory', label: 'Client Directory', icon: Building, category: 'Operations' },
  { id: 'activities', label: 'Activities & Call Logs', icon: Clock, category: 'Operations' },
  { id: 'tasks', label: 'Tasks & Follow-ups', icon: CheckSquare, category: 'Operations' },
  { id: 'daily-logs', label: 'Daily Work & Intern Logs', icon: BookOpen, category: 'Operations' },
  { id: 'content-calendar', label: 'Content Calendar', icon: CalendarDays, category: 'Operations' },
  { id: 'deliverables', label: 'Deliverables Matrix', icon: Layers, category: 'Operations' },
  { id: 'ongoing-projects', label: 'Ongoing Projects & MIS Hub', icon: FolderKanban, category: 'Operations' },
  { id: 'completed-projects', label: 'Completed Projects', icon: CheckCircle2, category: 'Operations' },
  { id: 'support', label: 'Customer Support Desk', icon: Headphones, category: 'Operations' },
  { id: 'customers', label: 'Customer Accounts & Login', icon: Users, category: 'Operations' },
  
  { id: 'marketing', label: 'Marketing Campaigns', icon: Megaphone, category: 'Growth' },
  { id: 'documents', label: 'Document Vault', icon: FolderLock, category: 'Growth' },
  { id: 'integrations', label: 'Integrations Hub', icon: Boxes, category: 'Growth' },

  { id: 'gst-invoices', label: 'GST Invoice Manager', icon: Receipt, category: 'Finance' },
  { id: 'financial-ledger', label: 'Financial Ledger', icon: BookMarked, category: 'Finance' },

  { id: 'salary', label: 'Salary, Attendance & Payroll', icon: Wallet, category: 'HR' },
  { id: 'kyc', label: 'KYC & Verification Vault', icon: ShieldCheck, category: 'HR' },
  { id: 'performance-board', label: 'Performance Board', icon: Award, category: 'HR' },
];

import PricingPlansModal from '../billing/PricingPlansModal';
import {
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, mobileOpen, onCloseMobile, collapsed = false, onToggleCollapse }) => {
  const { activeTenant, activeRole, theme, setTheme, logout, currentUser } = useCRM();
  const [showPricingModal, setShowPricingModal] = useState(false);

  return (
    <>
      {/* Dark overlay backdrop on mobile */}
      <div
        className={`sidebar-overlay ${mobileOpen ? 'active' : ''}`}
        onClick={onCloseMobile}
      />
      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`} style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: collapsed ? '78px' : 'var(--sidebar-width)',
        height: '100vh',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden'
      }}>
      {/* Brand Header */}
      <div style={{
        padding: collapsed ? '18px 12px' : '20px 20px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(99, 102, 241, 0.25)',
            flexShrink: 0
          }}>
            <img
              src="/logo.png"
              alt="Sanna CRM Logo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                borderRadius: '8px'
              }}
            />
          </div>
          {!collapsed && (
            <div style={{ overflow: 'hidden' }}>
              <h1 style={{
                fontSize: '1.15rem',
                fontWeight: '900',
                letterSpacing: '-0.02em',
                background: 'linear-gradient(135deg, #ffffff 0%, #a5b4fc 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                lineHeight: 1.1
              }}>
                {getAppConfig().appName.toUpperCase()}
              </h1>
              <span style={{ fontSize: '0.65rem', color: '#818cf8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Enterprise CRM
              </span>
            </div>
          )}
        </div>

        {/* Collapse toggle button on desktop */}
        {!collapsed && onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            title="Collapse Sidebar"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
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
              color: '#818cf8',
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

      {/* Active Tenant Badge */}
      <div
        onClick={() => setShowPricingModal(true)}
        style={{
          margin: '14px 16px 6px 16px',
          padding: '10px 14px',
          background: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          cursor: 'pointer',
          transition: 'all 0.15s ease'
        }}
        title="Click to view Subscription Pricing & Seat Licensing"
      >
        <img
          src={activeTenant?.logo || '/logo.png'}
          alt={activeTenant?.name || 'Organization'}
          style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'cover' }}
        />
        <div style={{ overflow: 'hidden', flex: 1 }}>
          <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {activeTenant?.name && !activeTenant.name.includes('(Admin)') ? activeTenant.name : getAppConfig().companyName}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            Plan: <span style={{ color: '#34d399', fontWeight: '700' }}>{activeTenant?.plan || 'Enterprise Suite'}</span> ⚡
          </div>
        </div>
      </div>

      <PricingPlansModal isOpen={showPricingModal} onClose={() => setShowPricingModal(false)} />

      {/* Navigation Links */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
        {MENU_ITEMS.filter(item => {
          const perms = activeRole?.permissions || [];
          const roleId = activeRole?.id || currentUser?.roleId || '';
          const roleName = (activeRole?.name || currentUser?.role || '').toLowerCase();
          
          // Super Admin sees 100% of all data and modules entered under all roles
          if (roleId === 'role-admin' || perms.includes('super_admin')) {
            return true;
          }

          // 1. Software Developer: ONLY Ongoing Projects, Deliverables Matrix, Client Directory, MIS (Daily Work Logs), and Attendance
          if (roleId === 'role-dev' || roleName.includes('software developer') || roleName.includes('developer')) {
            return ['client-directory', 'ongoing-projects', 'deliverables', 'daily-logs', 'salary', 'kyc'].includes(item.id);
          }

          // 2. Digital Marketer: ONLY Ongoing Projects, Deliverables Matrix, Client Directory, MIS (Daily Work Logs), and Attendance
          if (roleId === 'role-marketer' || roleName.includes('digital marketer') || roleName.includes('marketer')) {
            return ['client-directory', 'ongoing-projects', 'deliverables', 'daily-logs', 'salary', 'kyc'].includes(item.id);
          }

          // 3. Video Editor: ONLY Ongoing Projects, Deliverables Matrix, Client Directory, Content Calendar, MIS (Daily Work Logs), and Attendance
          if (roleId === 'role-video' || roleName.includes('video editor') || roleName.includes('video')) {
            return ['client-directory', 'ongoing-projects', 'deliverables', 'content-calendar', 'daily-logs', 'salary', 'kyc'].includes(item.id);
          }

          // 4. Intern / Trainee
          if (roleId === 'role-intern' || roleName.includes('intern')) {
            return ['client-directory', 'ongoing-projects', 'deliverables', 'daily-logs', 'salary', 'kyc'].includes(item.id);
          }
          
          switch(item.id) {
            case 'dashboard':
              return perms.includes('view_all') || roleId === 'role-mgr' || roleId === 'role-ops';
            case 'reports':
              return perms.includes('view_reports') || perms.includes('export_data');
            case 'security':
              return perms.includes('security_admin') || perms.includes('manage_employees');
            case 'leads':
            case 'ai-assistant':
            case 'pipeline':
              return perms.includes('view_leads') || perms.includes('view_sales');
            case 'contacts':
              return perms.includes('view_contacts') || perms.includes('view_sales') || perms.includes('view_ops');
            case 'products':
            case 'service-catalog':
              return perms.includes('view_products') || perms.includes('view_sales') || perms.includes('view_ops');
            case 'quotes':
              return perms.includes('view_quotes') || perms.includes('create_quotes');
            case 'orders':
              return perms.includes('view_orders') || perms.includes('approve_quotes');
            case 'activities':
            case 'tasks':
              return perms.includes('log_activities') || perms.includes('view_leads') || perms.includes('view_ops') || perms.includes('view_sales');
            case 'daily-logs':
              return true;
            case 'content-calendar':
              return perms.includes('view_content_calendar') || perms.includes('view_ops') || perms.includes('view_sales') || perms.includes('view_marketing');
            case 'deliverables':
            case 'ongoing-projects':
              return perms.includes('view_projects') || perms.includes('view_ops') || perms.includes('view_sales') || perms.includes('log_activities');
            case 'completed-projects':
              return perms.includes('view_ops') || perms.includes('view_sales');
            case 'support':
              return perms.includes('manage_tickets') || perms.includes('view_ops');
            case 'customers':
              return perms.includes('manage_customers') || perms.includes('view_ops');
            case 'marketing':
              return perms.includes('view_marketing');
            case 'documents':
              return perms.includes('view_documents') || perms.includes('view_sales');
            case 'integrations':
              return perms.includes('view_integrations');
            case 'salary':
              return true;
            case 'kyc':
              return true; // All employees can access their own KYC view
            case 'performance-board':
              return perms.includes('manage_salary') || perms.includes('view_hr');
            case 'gst-invoices':
            case 'financial-ledger':
              return perms.includes('manage_salary') || perms.includes('view_orders') || perms.includes('approve_quotes') || perms.includes('view_hr');
            default:
              return false;
          }

        }).map((item, index, filteredArr) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const showCategoryHeader = !collapsed && (index === 0 || filteredArr[index - 1].category !== item.category);
          const isRestrictedEmployee = ['role-dev', 'role-marketer', 'role-video', 'role-intern'].includes(activeRole?.id || currentUser?.roleId);
          const displayLabel = (item.id === 'salary' && isRestrictedEmployee) ? 'Attendance & Logs' : item.label;

          return (
            <React.Fragment key={item.id}>
              {showCategoryHeader && (
                <div style={{
                  fontSize: '0.66rem',
                  fontWeight: '800',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  margin: index === 0 ? '4px 8px 8px 8px' : '16px 8px 8px 8px'
                }}>
                  {item.category}
                </div>
              )}

              <button
                onClick={() => setActiveTab(item.id)}
                title={collapsed ? displayLabel : undefined}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  gap: '12px',
                  padding: collapsed ? '10px 0' : '9px 12px',
                  marginBottom: '3px',
                  borderRadius: '10px',
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.22) 0%, rgba(168, 85, 247, 0.12) 100%)'
                    : 'transparent',
                  border: isActive ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
                  borderLeft: isActive ? '3.5px solid #6366f1' : '1px solid transparent',
                  color: isActive ? '#a5b4fc' : 'var(--text-secondary)',
                  fontWeight: isActive ? '800' : '500',
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  textAlign: 'left',
                  boxShadow: isActive ? '0 4px 14px rgba(99, 102, 241, 0.2)' : 'none'
                }}
              >
                <Icon style={{
                  width: '18px',
                  height: '18px',
                  flexShrink: 0,
                  color: isActive ? '#818cf8' : 'var(--text-muted)',
                  filter: isActive ? 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.6))' : 'none'
                }} />
                {!collapsed && <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayLabel}</span>}
                {!collapsed && isActive && <ChevronRight style={{ width: '14px', height: '14px', color: '#818cf8' }} />}
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {/* Footer & User / Theme Switcher */}
      <div style={{
        padding: collapsed ? '12px 8px' : '16px',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        background: 'rgba(0,0,0,0.18)'
      }}>
        {/* Digital Employee ID Badge */}
        {!collapsed ? (
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img
                src={currentUser?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80'}
                alt={currentUser?.name}
                style={{ width: '34px', height: '34px', borderRadius: '50%', border: '1.5px solid #6366f1', objectFit: 'cover' }}
              />
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentUser?.name}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentUser?.designation || 'Representative'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem', borderTop: '1px solid var(--border-color)', paddingTop: '6px', color: 'var(--text-muted)' }}>
              <span>ID: <strong style={{ color: '#6366f1' }}>{currentUser?.id || 'EMP-999'}</strong></span>
              <span style={{ textTransform: 'uppercase', fontWeight: '800', color: '#a855f7' }}>{currentUser?.role?.split(' ')[0]}</span>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <img
              src={currentUser?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80'}
              alt={currentUser?.name}
              title={`${currentUser?.name} (${currentUser?.designation || 'User'})`}
              style={{ width: '34px', height: '34px', borderRadius: '50%', border: '1.5px solid #6366f1', objectFit: 'cover' }}
            />
          </div>
        )}

        <div style={{ display: 'flex', gap: '6px', flexDirection: collapsed ? 'column' : 'row' }}>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="Toggle Theme"
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '7px',
              borderRadius: '8px',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontSize: '0.75rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {theme === 'dark' ? <Sun style={{ width: '14px', height: '14px', color: '#fbbf24' }} /> : <Moon style={{ width: '14px', height: '14px', color: '#8b5cf6' }} />}
            {!collapsed && <span>Theme</span>}
          </button>

          <button
            onClick={logout}
            title="Logout of session"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '7px 10px',
              borderRadius: '8px',
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#f43f5e',
              fontSize: '0.75rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            <LogOut style={{ width: '14px', height: '14px' }} />
            {!collapsed && <span>Exit</span>}
          </button>
        </div>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;
