import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CRMProvider, useCRM } from './context/CRMContext';
import AuthPage from './components/auth/AuthPage';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import ExecutiveDashboard from './components/dashboard/ExecutiveDashboard';
import SecurityDashboard from './components/security/SecurityDashboard';
import LeadList from './components/leads/LeadList';
import ContactManager from './components/contacts/ContactManager';
import KanbanBoard from './components/pipeline/KanbanBoard';
import ProductCatalog from './components/products/ProductCatalog';
import QuoteBuilder from './components/quotes/QuoteBuilder';
import OrderInvoiceManager from './components/orders/OrderInvoiceManager';
import TaskBoard from './components/activities/TaskBoard';
import TicketManager from './components/support/TicketManager';
import CampaignManager from './components/marketing/CampaignManager';
import DocumentVault from './components/documents/DocumentVault';
import IntegrationHub from './components/integrations/IntegrationHub';
import CustomerDashboard from './components/customer/CustomerDashboard';
import CustomerManager from './components/customers/CustomerManager';
import SalaryModule from './components/salary/SalaryModule';
import AISalesAssistant from './components/leads/AISalesAssistant';
import ReportsEngine from './components/reports/ReportsEngine';
import OngoingProjects from './components/pipeline/OngoingProjects';
import CompletedProjects from './components/pipeline/CompletedProjects';
import DailyWorkLogsManager from './components/activities/DailyWorkLogsManager';
import GSTInvoiceManager from './components/finance/GSTInvoiceManager';
import FinancialLedger from './components/finance/FinancialLedger';
import ServiceCatalogMIS from './components/mis/ServiceCatalogMIS';
import ContentCalendar from './components/mis/ContentCalendar';
import PerformanceBoard from './components/hr/PerformanceBoard';
import DeliverablesMatrix from './components/pipeline/DeliverablesMatrix';
import ClientDirectory from './components/pipeline/ClientDirectory';
import KYCManager from './components/kyc/KYCManager';
import LandingPage from './components/landing/LandingPage';
import ChangeDefaultPasswordModal from './components/auth/ChangeDefaultPasswordModal';
import EmployeeKYCModal from './components/auth/EmployeeKYCModal';
import SpotlightCommandCenter from './components/layout/SpotlightCommandCenter';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', color: '#fff', textAlign: 'center', background: '#0b0f19', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h2 style={{ fontSize: '1.4rem', color: '#f43f5e', marginBottom: '12px' }}>An interface component encountered an error</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', maxWidth: '500px', marginBottom: '20px' }}>
            {this.state.error?.message || 'Unexpected render issue. Click below to reload.'}
          </p>
          <button 
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
            className="btn gradient-btn-primary"
            style={{ padding: '10px 20px' }}
          >
            Reload Platform
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false
    }
  }
});

const MainLayout = () => {
  const { isAuthenticated, currentUser, login } = useCRM();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [viewMode, setViewMode] = useState('auth'); // 'auth' | 'landing'
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
  const [showKYCModal, setShowKYCModal] = useState(false);

  // Trigger password change prompt on initial login if using default password
  React.useEffect(() => {
    if (isAuthenticated && currentUser) {
      const userKey = `pwd_changed_${currentUser.id || currentUser.username}`;
      const hasChangedLocally = localStorage.getItem(userKey) === 'true';
      if (currentUser.mustChangePassword && !hasChangedLocally) {
        setShowPasswordChangeModal(true);
      }
    }
  }, [isAuthenticated, currentUser]);

  // Trigger KYC upload modal for employees who haven't submitted KYC yet
  React.useEffect(() => {
    if (isAuthenticated && currentUser) {
      const roleId = currentUser.roleId || '';
      const roleName = (currentUser.role || '').toLowerCase();
      const isAdmin = roleId === 'role-admin' || roleName.includes('super admin') || roleName.includes('org admin');
      // Only non-admin employees need to submit KYC
      if (!isAdmin) {
        const kycKey = `kyc_submitted_${currentUser.id || currentUser.username}`;
        const kycSubmittedLocally = localStorage.getItem(kycKey) === 'true';
        const kycStatus = currentUser.kycStatus || 'Not Submitted';
        if (!kycSubmittedLocally && kycStatus === 'Not Submitted') {
          // Delay slightly so password modal shows first if both are needed
          const timer = setTimeout(() => setShowKYCModal(true), showPasswordChangeModal ? 0 : 800);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [isAuthenticated, currentUser, showPasswordChangeModal]);

  // Ensure active tab matches role permissions on login or navigation
  React.useEffect(() => {
    if (isAuthenticated && currentUser) {
      const roleId = currentUser.roleId || '';
      const roleName = (currentUser.role || '').toLowerCase();
      
      const isDev = roleId === 'role-dev' || roleName.includes('software developer') || roleName.includes('developer');
      const isMarketer = roleId === 'role-marketer' || roleName.includes('digital marketer') || roleName.includes('marketer');
      const isVideo = roleId === 'role-video' || roleName.includes('video editor') || roleName.includes('video');
      const isIntern = roleId === 'role-intern' || roleName.includes('intern');

      if (isDev || isMarketer) {
        const allowed = ['ongoing-projects', 'daily-logs', 'salary', 'kyc'];
        if (!allowed.includes(activeTab)) {
          setActiveTab('ongoing-projects');
        }
      } else if (isVideo) {
        const allowed = ['ongoing-projects', 'content-calendar', 'daily-logs', 'salary', 'kyc'];
        if (!allowed.includes(activeTab)) {
          setActiveTab('ongoing-projects');
        }
      } else if (isIntern) {
        const allowed = ['ongoing-projects', 'daily-logs', 'salary', 'kyc'];
        if (!allowed.includes(activeTab)) {
          setActiveTab('ongoing-projects');
        }
      }
    }
  }, [isAuthenticated, currentUser, activeTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setMobileSidebarOpen(false); // auto-close sidebar on mobile when navigating
  };

  // Show Login/Signup screen or Landing page if not authenticated
  if (!isAuthenticated) {
    if (viewMode === 'landing') {
      return (
        <LandingPage
          onNavigateToAuth={() => setViewMode('auth')}
        />
      );
    }
    return <AuthPage onBackToLanding={() => setViewMode('landing')} />;
  }

  // Render customer portal if logged in user is client customer
  if (
    currentUser?.role === 'Customer' ||
    currentUser?.role === 'Customer / Portal User' ||
    currentUser?.roleId === 'role-customer' ||
    currentUser?.role === 'Customer / Portal User' ||
    currentUser?.role === 'Customer'
  ) {
    return (
      <div className="app-container">
        <Header onOpenQuickCreate={() => setShowQuickCreate(true)} />
        <main className="main-content" style={{ marginLeft: 0, width: '100%' }}>
          <ErrorBoundary>
            <CustomerDashboard />
          </ErrorBoundary>
        </main>
      </div>
    );
  }

  // Render Internal Enterprise CRM for Employees, Executives & Admins
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <ExecutiveDashboard />;
      case 'reports':
        return <ReportsEngine />;
      case 'security':
        return <SecurityDashboard />;
      case 'leads':
        return <LeadList />;
      case 'ai-assistant':
        return <AISalesAssistant />;
      case 'contacts':
        return <ContactManager />;
      case 'pipeline':
        return <KanbanBoard />;
      case 'products':
        return <ProductCatalog />;
      case 'quotes':
        return <QuoteBuilder />;
      case 'orders':
        return <OrderInvoiceManager />;
      case 'client-directory':
      case 'directory':
        return <ClientDirectory />;
      case 'activities':
      case 'tasks':
        return <TaskBoard />;
      case 'daily-logs':
        return <DailyWorkLogsManager />;
      case 'deliverables':
        return <DeliverablesMatrix />;
      case 'ongoing-projects':
        return <OngoingProjects />;
      case 'completed-projects':
        return <CompletedProjects />;
      case 'support':
        return <TicketManager />;
      case 'customers':
        return <CustomerManager />;
      case 'marketing':
        return <CampaignManager />;
      case 'documents':
        return <DocumentVault />;
      case 'integrations':
        return <IntegrationHub />;
      case 'salary':
        return <SalaryModule />;
      case 'kyc':
        return <KYCManager />;
      case 'gst-invoices':
        return <GSTInvoiceManager />;
      case 'financial-ledger':
        return <FinancialLedger />;
      case 'service-catalog':
        return <ServiceCatalogMIS />;
      case 'content-calendar':
        return <ContentCalendar />;
      case 'performance-board':
        return <PerformanceBoard />;
      default:
        return <ExecutiveDashboard />;
    }
  };

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Global Keyboard Shortcut: Ctrl+K / Cmd+K for Quick Action Command Palette
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowQuickCreate(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="app-container" style={{
      '--sidebar-width': sidebarCollapsed ? '78px' : '260px'
    }}>
      {/* Ambient background glow atmosphere */}
      <div className="ambient-glow-layer" aria-hidden="true">
        <div className="ambient-orb-1" />
        <div className="ambient-orb-2" />
        <div className="ambient-orb-3" />
        <div className="ambient-orb-4" />
      </div>

      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
      />
      <Header
        activeTab={activeTab}
        onNavigate={handleTabChange}
        onOpenQuickCreate={() => setShowQuickCreate(true)}
        onToggleSidebar={() => setMobileSidebarOpen(prev => !prev)}
        sidebarCollapsed={sidebarCollapsed}
      />
      
      {/* Employee KYC Onboarding Modal — triggers for new employees on first login */}
      <EmployeeKYCModal
        isOpen={showKYCModal && !showPasswordChangeModal}
        onClose={() => setShowKYCModal(false)}
        onSubmitted={() => {
          setShowKYCModal(false);
          // Mark locally so modal doesn't re-appear every session
          const kycKey = `kyc_submitted_${currentUser?.id || currentUser?.username}`;
          localStorage.setItem(kycKey, 'true');
        }}
      />

      <main className="main-content" style={{
        marginLeft: sidebarCollapsed ? '78px' : '260px',
        maxWidth: sidebarCollapsed ? 'calc(100vw - 78px)' : 'calc(100vw - 260px)',
        paddingTop: 'calc(var(--header-height) + 24px)',
        paddingLeft: '32px',
        paddingRight: '32px',
        paddingBottom: '48px',
        minHeight: '100vh',
        boxSizing: 'border-box',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        <ErrorBoundary>
          {renderContent()}
        </ErrorBoundary>
      </main>

      {/* Raycast-Style Spotlight Command Center (Ctrl+K / ⌘K) */}
      <SpotlightCommandCenter
        isOpen={showQuickCreate}
        onClose={() => setShowQuickCreate(false)}
        onNavigate={handleTabChange}
      />

      {/* Force Change Default Password Modal on Initial Login */}
      <ChangeDefaultPasswordModal
        isOpen={showPasswordChangeModal}
        onClose={() => setShowPasswordChangeModal(false)}
        onPasswordChanged={() => setShowPasswordChangeModal(false)}
      />
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <CRMProvider>
          <MainLayout />
        </CRMProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
