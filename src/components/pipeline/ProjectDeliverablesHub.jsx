import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext';
import { REAL_CRM_DATA } from '../../data/realCrmData';
import DeliverablesMatrix from './DeliverablesMatrix';
import ClientDirectory from './ClientDirectory';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Calendar,
  DollarSign,
  TrendingUp,
  Server,
  Building,
  Video,
  Megaphone,
  Sparkles,
  Shield,
  Layers,
  Search,
  Eye,
  EyeOff,
  Copy,
  Check,
  Key,
  X,
  FileSpreadsheet,
  Globe,
  Wifi,
  Lock,
  BarChart2,
  Activity,
  Award,
  Target,
  Users,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  RotateCcw,
  SlidersHorizontal,
  CheckCircle,
  Terminal,
  Cpu,
  HardDrive,
  Link2
} from 'lucide-react';

const ProjectDeliverablesHub = () => {
  const {
    allClients = [],
    deliverables = [],
    updateProjectDeliverables,
    addDeliverableRecord,
    deleteDeliverableRecord,
    holidayPosts = [],
    addHolidayPost,
    updateHolidayPost,
    deleteHolidayPost,
    adSpendLedger = [],
    adSpendTransactions = [],
    addAdSpendTransaction,
    addAdTransaction,
    deleteAdTransaction,
    updateAdSpendTransaction,
    deleteAdSpendTransaction,
    editorAssignments = [],
    addEditorAssignment,
    updateEditorAssignment,
    deleteEditorAssignment,
    serverCredentials = [],
    addServerCredential,
    updateServerCredential,
    deleteServerCredential,
    projectCredentials = [],
    addProjectCredential,
    deleteProjectCredential,
    deals = [],
    employees = [],
    leads = [],
    campaigns = []
  } = useCRM();

  const [activeSubTab, setActiveSubTab] = useState('deliverables'); // 'deliverables' | 'holiday_posts' | 'ad_spend' | 'editors' | 'servers' | 'performance'

  // Server & Credential Vault View States
  const [serverVaultTab, setServerVaultTab] = useState('servers'); // 'servers' | 'credentials'
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [credSearch, setCredSearch] = useState('');
  const [credPlatformFilter, setCredPlatformFilter] = useState('ALL');

  const copyToClipboard = (text, id) => {
    if (!text) return;
    try {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      console.warn('Clipboard write failed:', e);
    }
  };

  const togglePasswordVisibility = (id) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Monthly Deliverables Filter & Search States
  const [delivSearch, setDelivSearch] = useState('');
  const [delivMonthFilter, setDelivMonthFilter] = useState('ALL');
  const [delivYearFilter, setDelivYearFilter] = useState('ALL');
  const [delivServiceFilter, setDelivServiceFilter] = useState('ALL');
  const [delivStatusFilter, setDelivStatusFilter] = useState('ALL');
  const [delivSortBy, setDelivSortBy] = useState('DEFAULT');

  const isDeliverableFiltered = delivSearch !== '' || delivMonthFilter !== 'ALL' || delivYearFilter !== 'ALL' || delivServiceFilter !== 'ALL' || delivStatusFilter !== 'ALL' || delivSortBy !== 'DEFAULT';

  const resetDeliverableFilters = () => {
    setDelivSearch('');
    setDelivMonthFilter('ALL');
    setDelivYearFilter('ALL');
    setDelivServiceFilter('ALL');
    setDelivStatusFilter('ALL');
    setDelivSortBy('DEFAULT');
  };

  // Filtered Deliverables logic
  const filteredDeliverables = deliverables.filter(d => {
    // Search match
    if (delivSearch.trim()) {
      const q = delivSearch.toLowerCase();
      const matchProj = (d.projectName || '').toLowerCase().includes(q);
      const matchClient = (d.clientName || '').toLowerCase().includes(q);
      const matchService = (d.service || '').toLowerCase().includes(q);
      const matchRemarks = (d.approvalPendingRemarks || '').toLowerCase().includes(q) || (d.otherRemarks || '').toLowerCase().includes(q);
      if (!matchProj && !matchClient && !matchService && !matchRemarks) return false;
    }

    // Month filter
    if (delivMonthFilter !== 'ALL') {
      if (Number(d.month) !== Number(delivMonthFilter)) return false;
    }

    // Year filter
    if (delivYearFilter !== 'ALL') {
      if (Number(d.year) !== Number(delivYearFilter)) return false;
    }

    // Service filter
    if (delivServiceFilter !== 'ALL') {
      if (!(d.service || '').toLowerCase().includes(delivServiceFilter.toLowerCase())) return false;
    }

    // Status filter
    const reelRate = d.reelsPlanned > 0 ? (d.reelsDelivered / d.reelsPlanned) : 1;
    const postRate = d.postsPlanned > 0 ? (d.postsDelivered / d.postsPlanned) : 1;
    const isCompleted = reelRate >= 1 && postRate >= 1;
    const isPending = (d.reelsDelivered === 0 && d.postsDelivered === 0);
    const hasApprovalPending = !!(d.approvalPendingRemarks && d.approvalPendingRemarks.trim());

    if (delivStatusFilter === 'COMPLETED' && !isCompleted) return false;
    if (delivStatusFilter === 'IN_PROGRESS' && (isCompleted || isPending)) return false;
    if (delivStatusFilter === 'PENDING' && !isPending) return false;
    if (delivStatusFilter === 'APPROVAL_PENDING' && !hasApprovalPending) return false;

    return true;
  }).sort((a, b) => {
    if (delivSortBy === 'CLIENT_ASC') {
      return (a.clientName || '').localeCompare(b.clientName || '');
    }
    if (delivSortBy === 'REEL_RATE') {
      const rateA = a.reelsPlanned > 0 ? (a.reelsDelivered / a.reelsPlanned) : 0;
      const rateB = b.reelsPlanned > 0 ? (b.reelsDelivered / b.reelsPlanned) : 0;
      return rateB - rateA;
    }
    if (delivSortBy === 'POST_RATE') {
      const rateA = a.postsPlanned > 0 ? (a.postsDelivered / a.postsPlanned) : 0;
      const rateB = b.postsPlanned > 0 ? (b.postsDelivered / b.postsPlanned) : 0;
      return rateB - rateA;
    }
    return 0;
  });

  // Ad Spend Filters & Quick Add State
  const [selectedAdMonth, setSelectedAdMonth] = useState(6); // default June
  const [selectedAdYear, setSelectedAdYear] = useState(2026);
  const [txDate, setTxDate] = useState('2026-08-14');
  const [txClientId, setTxClientId] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txCurrency, setTxCurrency] = useState('INR'); // 'INR' (₹) or 'USD' ($)
  const [txPurpose, setTxPurpose] = useState('Meta Ads');
  const [txPaymentMode, setTxPaymentMode] = useState('UPI');

  const handleQuickAddTx = (e) => {
    e.preventDefault();
    if (!txClientId || !txAmount) return;
    if (addAdTransaction) {
      addAdTransaction({
        clientName: txClientId,
        date: txDate,
        amount: parseFloat(txAmount) || 0,
        currency: txCurrency || 'INR',
        purpose: txPurpose,
        paymentMode: txPaymentMode,
        month: selectedAdMonth || 8,
        year: selectedAdYear || 2026
      });
    }
    setTxAmount('');
  };

  // Add Modals State
  const [showAddDeliverableModal, setShowAddDeliverableModal] = useState(false);
  const [showAddHolidayModal, setShowAddHolidayModal] = useState(false);
  const [showAddAdSpendModal, setShowAddAdSpendModal] = useState(false);
  const [showAddEditorModal, setShowAddEditorModal] = useState(false);
  const [showAddServerModal, setShowAddServerModal] = useState(false);

  // Edit Modals State
  const [editingDeliverable, setEditingDeliverable] = useState(null);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [editingAdSpend, setEditingAdSpend] = useState(null);
  const [editingEditor, setEditingEditor] = useState(null);
  const [editingServer, setEditingServer] = useState(null);

  // Add Forms State
  const [newDeliverableForm, setNewDeliverableForm] = useState({
    projectName: 'Acme Corporation Cloud Retainer',
    clientName: 'Acme Corporation',
    month: 8,
    year: 2026,
    reelsPlanned: 12,
    reelsDelivered: 10,
    postsPlanned: 20,
    postsDelivered: 18,
    service: 'Digital Marketing & SEO',
    totalFollowers: '125K',
    followerGrowth: '+4.5K',
    viewsReached: '850K',
    backlinksCreated: 50,
    keywordsInjected: 38,
    gmbPosition: '#1 in Regional Cloud Services',
    approvalPendingRemarks: '2 video reels pending final stakeholder approval.',
    otherRemarks: 'Campaign engagement up 32% M-o-M.'
  });

  const [newHolidayForm, setNewHolidayForm] = useState({
    holidayName: 'Independence Day Campaign',
    date: '2026-08-15',
    clientProject: 'Acme Corporation',
    creativeStatus: 'Completed',
    captionStatus: 'Approved',
    approvalStatus: 'Approved',
    scheduledPosted: 'Scheduled for 15 Aug 09:00 AM',
    creativeUrl: ''
  });

  const [newAdSpendForm, setNewAdSpendForm] = useState({
    clientProject: 'Acme Corporation Cloud Retainer',
    month: 8,
    year: 2026,
    platform: 'Meta Ads (Facebook & Instagram)',
    currency: 'INR',
    spentAmount: 45000,
    leadsGenerated: 65,
    paymentMode: 'Corporate Credit Card (HDFC ****9921)',
    transactionId: 'TXN-META-90182',
    status: 'Reconciled',
    remarks: 'Top-of-funnel lead generation for Enterprise Cloud Overhaul.'
  });

  const [newEditorForm, setNewEditorForm] = useState({
    editorName: 'Karan Johal',
    email: 'karan.edits@creatives.io',
    clientProject: 'Acme Corporation',
    taskDescription: 'Edit 4x 60-second 4K Instagram Reels on Cloud Security Best Practices',
    assignedDate: new Date().toISOString().split('T')[0],
    submissionDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    status: 'In Progress',
    amount: 12000,
    paymentStatus: 'Pending',
    deliverableUrl: ''
  });

  const [newServerForm, setNewServerForm] = useState({
    clientProject: 'Acme Corporation',
    serverProvider: 'AWS (Amazon Web Services)',
    ipAddress: '13.235.144.82',
    region: 'ap-south-1 (Mumbai)',
    osType: 'Ubuntu 22.04 LTS',
    environment: 'Production Cluster',
    sshPort: 22,
    username: 'ubuntu',
    authMethod: 'SSH Key Pair',
    sslExpiryDate: '2027-04-15',
    annualHostingCost: 145000,
    status: 'Active & Healthy',
    remarks: 'Auto-scaling group with 2x t4g.xlarge instances and RDS Postgres.'
  });

  // Handle Add Submissions
  const handleCreateDeliverable = (e) => {
    e.preventDefault();
    addDeliverableRecord({
      ...newDeliverableForm,
      month: parseInt(newDeliverableForm.month, 10) || 8,
      year: parseInt(newDeliverableForm.year, 10) || 2026,
      service: newDeliverableForm.service || 'Social Media Management',
      reelsPlanned: parseInt(newDeliverableForm.reelsPlanned, 10) || 0,
      reelsDelivered: parseInt(newDeliverableForm.reelsDelivered, 10) || 0,
      postsPlanned: parseInt(newDeliverableForm.postsPlanned, 10) || 0,
      postsDelivered: parseInt(newDeliverableForm.postsDelivered, 10) || 0,
      backlinksCreated: parseInt(newDeliverableForm.backlinksCreated, 10) || 0
    });
    setShowAddDeliverableModal(false);
  };

  const handleCreateHoliday = (e) => {
    e.preventDefault();
    addHolidayPost(newHolidayForm);
    setShowAddHolidayModal(false);
  };

  const handleCreateAdSpend = (e) => {
    e.preventDefault();
    const spent = parseFloat(newAdSpendForm.spentAmount) || 0;
    const leads = parseInt(newAdSpendForm.leadsGenerated, 10) || 1;
    const cpl = leads > 0 ? (spent / leads).toFixed(2) : 0;
    addAdSpendTransaction({
      ...newAdSpendForm,
      spentAmount: spent,
      leadsGenerated: leads,
      costPerLead: parseFloat(cpl)
    });
    setShowAddAdSpendModal(false);
  };

  const handleCreateEditor = (e) => {
    e.preventDefault();
    addEditorAssignment({
      ...newEditorForm,
      amount: parseFloat(newEditorForm.amount) || 0
    });
    setShowAddEditorModal(false);
  };

  const handleCreateServer = (e) => {
    e.preventDefault();
    addServerCredential({
      ...newServerForm,
      annualHostingCost: parseFloat(newServerForm.annualHostingCost) || 0
    });
    setShowAddServerModal(false);
  };

  // Handle Edit Submissions
  const handleSaveEditDeliverable = (e) => {
    e.preventDefault();
    if (!editingDeliverable) return;
    updateProjectDeliverables(editingDeliverable.id, {
      ...editingDeliverable,
      month: parseInt(editingDeliverable.month, 10) || 8,
      year: parseInt(editingDeliverable.year, 10) || 2026,
      service: editingDeliverable.service || 'Social Media Management',
      reelsPlanned: parseInt(editingDeliverable.reelsPlanned, 10) || 0,
      reelsDelivered: parseInt(editingDeliverable.reelsDelivered, 10) || 0,
      postsPlanned: parseInt(editingDeliverable.postsPlanned, 10) || 0,
      postsDelivered: parseInt(editingDeliverable.postsDelivered, 10) || 0,
      backlinksCreated: parseInt(editingDeliverable.backlinksCreated, 10) || 0
    });
    setEditingDeliverable(null);
  };

  const handleSaveEditHoliday = (e) => {
    e.preventDefault();
    if (!editingHoliday) return;
    updateHolidayPost(editingHoliday.id, editingHoliday);
    setEditingHoliday(null);
  };

  const handleSaveEditAdSpend = (e) => {
    e.preventDefault();
    if (!editingAdSpend) return;
    const spent = parseFloat(editingAdSpend.spentAmount) || 0;
    const leads = parseInt(editingAdSpend.leadsGenerated, 10) || 1;
    const cpl = leads > 0 ? (spent / leads).toFixed(2) : 0;
    if (updateAdSpendTransaction) {
      updateAdSpendTransaction(editingAdSpend.id, {
        ...editingAdSpend,
        spentAmount: spent,
        leadsGenerated: leads,
        costPerLead: parseFloat(cpl)
      });
    }
    setEditingAdSpend(null);
  };

  const handleSaveEditEditor = (e) => {
    e.preventDefault();
    if (!editingEditor) return;
    updateEditorAssignment(editingEditor.id, {
      ...editingEditor,
      amount: parseFloat(editingEditor.amount) || 0
    });
    setEditingEditor(null);
  };

  const handleSaveEditServer = (e) => {
    e.preventDefault();
    if (!editingServer) return;
    updateServerCredential(editingServer.id, {
      ...editingServer,
      annualHostingCost: parseFloat(editingServer.annualHostingCost) || 0
    });
    setEditingServer(null);
  };

  // Aggregates
  const totalReelsDelivered = deliverables.reduce((s, d) => s + (d.reelsDelivered || 0), 0);
  const totalReelsPlanned = deliverables.reduce((s, d) => s + (d.reelsPlanned || 0), 0);
  const totalPostsDelivered = deliverables.reduce((s, d) => s + (d.postsDelivered || 0), 0);
  const totalPostsPlanned = deliverables.reduce((s, d) => s + (d.postsPlanned || 0), 0);
  const totalAdSpend = adSpendLedger.reduce((s, a) => s + (a.spentAmount || 0), 0);
  const totalAdLeads = adSpendLedger.reduce((s, a) => s + (a.leadsGenerated || 0), 0);

  // Performance Dashboard Aggregates
  const reelDeliveryRate = totalReelsPlanned > 0 ? Math.round((totalReelsDelivered / totalReelsPlanned) * 100) : 100;
  const postDeliveryRate = totalPostsPlanned > 0 ? Math.round((totalPostsDelivered / totalPostsPlanned) * 100) : 100;
  const avgCPL = totalAdLeads > 0 ? (totalAdSpend / totalAdLeads).toFixed(0) : 0;
  const wonDeals = deals.filter(d => d.stage === 'Won' || d.stage === 'Closed Won');
  const totalRevenue = wonDeals.reduce((s, d) => s + (parseFloat(d.dealValue || d.value || d.amount || 0)), 0);
  const totalPipelineValue = deals.reduce((s, d) => s + (parseFloat(d.dealValue || d.value || d.amount || 0)), 0);
  const winRate = deals.length > 0 ? Math.round((wonDeals.length / deals.length) * 100) : 0;
  const editorsActive = editorAssignments.filter(e => e.status === 'In Progress').length;
  const editorsCompleted = editorAssignments.filter(e => e.status === 'Completed' || e.status === 'Delivered').length;
  const serversHealthy = serverCredentials.filter(s => (s.status || '').toLowerCase().includes('active') || (s.status || '').toLowerCase().includes('healthy')).length;
  const totalFollowers = deliverables.reduce((s, d) => {
    const f = String(d.totalFollowers || '0').replace(/[^0-9.]/g, '');
    return s + (parseFloat(f) || 0);
  }, 0);
  const totalViews = deliverables.reduce((s, d) => {
    const v = String(d.viewsReached || '0').replace(/[^0-9.]/g, '');
    return s + (parseFloat(v) || 0);
  }, 0);
  const pendingApprovals = deliverables.filter(d => d.approvalPendingRemarks && d.approvalPendingRemarks.trim()).length;
  const totalAdSpendBudget = adSpendLedger.reduce((s, a) => s + (parseFloat(a.budget || a.spentAmount || 0) * 1.1), 0);
  const adROAS = totalAdSpend > 0 ? ((totalRevenue / totalAdSpend) || 0).toFixed(2) : '0.00';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Banner */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: '#818cf8', fontWeight: '700', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles style={{ width: '15px', height: '15px' }} />
            Enterprise Operations & Agency Deliverables MIS
          </div>
          <h2 style={{ fontSize: '1.55rem', fontWeight: '900', margin: '4px 0 6px', color: 'var(--text-primary)' }}>
            Project Deliverables & Operations Hub
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
            Unified tracking for social deliverables, festival creatives, paid ad spend, video editor work orders, and server infrastructure. <strong>All entries are fully editable.</strong>
          </p>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="glass-card" style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'directory', label: 'Client Directory (MIS)', icon: Building, count: 57 },
            { id: 'performance', label: 'Performance Dashboard', icon: BarChart2, count: null },
            { id: 'deliverables', label: 'Monthly Deliverables (Reels/Posts)', icon: Video, count: deliverables.length },
            { id: 'holiday_posts', label: 'Holiday Creative Planner', icon: Calendar, count: holidayPosts.length },
            { id: 'ad_spend', label: 'Ad Spend Ledger', icon: TrendingUp, count: adSpendLedger.length },
            { id: 'editors', label: 'Video Editor Work Orders', icon: Video, count: editorAssignments.length },
            { id: 'servers', label: 'Server Infrastructure Vault', icon: Server, count: serverCredentials.length }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                style={{
                  padding: '7px 12px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: active ? '700' : '500',
                  border: active ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
                  background: active ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(168, 85, 247, 0.15) 100%)' : 'transparent',
                  color: active ? '#818cf8' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <Icon style={{ width: '14px', height: '14px' }} />
                <span>{tab.label}</span>
                <span style={{
                  padding: '1px 5px',
                  borderRadius: '10px',
                  background: active ? '#6366f1' : 'rgba(255,255,255,0.08)',
                  color: active ? '#fff' : 'var(--text-muted)',
                  fontSize: '0.68rem',
                  fontWeight: '700'
                }}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div>
          {activeSubTab === 'deliverables' && (
            <button onClick={() => setShowAddDeliverableModal(true)} className="btn gradient-btn-primary" style={{ padding: '8px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus style={{ width: '14px', height: '14px' }} />
              <span>+ Add Deliverables Record</span>
            </button>
          )}
          {activeSubTab === 'holiday_posts' && (
            <button onClick={() => setShowAddHolidayModal(true)} className="btn gradient-btn-primary" style={{ padding: '8px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus style={{ width: '14px', height: '14px' }} />
              <span>+ Add Holiday Campaign</span>
            </button>
          )}
          {activeSubTab === 'ad_spend' && (
            <button onClick={() => setShowAddAdSpendModal(true)} className="btn gradient-btn-primary" style={{ padding: '8px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus style={{ width: '14px', height: '14px' }} />
              <span>+ Log Ad Spend</span>
            </button>
          )}
          {activeSubTab === 'editors' && (
            <button onClick={() => setShowAddEditorModal(true)} className="btn gradient-btn-primary" style={{ padding: '8px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus style={{ width: '14px', height: '14px' }} />
              <span>+ Assign Editor Task</span>
            </button>
          )}
          {activeSubTab === 'servers' && (
            <button onClick={() => setShowAddServerModal(true)} className="btn gradient-btn-primary" style={{ padding: '8px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus style={{ width: '14px', height: '14px' }} />
              <span>+ Add Server Entry</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW -1: CLIENT DIRECTORY                                                 */}
      {/* ========================================================================= */}
      {activeSubTab === 'directory' && (
        <ClientDirectory />
      )}

      {/* ========================================================================= */}
      {/* VIEW 0: PERFORMANCE DASHBOARD                                             */}
      {/* ========================================================================= */}
      {activeSubTab === 'performance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Dashboard Header */}
          <div className="glass-card" style={{ padding: '20px 24px', background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(168,85,247,0.08) 100%)', borderLeft: '4px solid #6366f1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <Activity style={{ width: '20px', height: '20px', color: '#818cf8' }} />
              <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>MIS Performance Dashboard</span>
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: '900', margin: 0, color: 'var(--text-primary)' }}>Agency & Operations KPI Overview</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: '4px 0 0' }}>Live metrics across content delivery, ad performance, sales pipeline, editor output, and infrastructure health.</p>
          </div>

          {/* KPI Row 1 — Revenue & Deals */}
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <DollarSign style={{ width: '13px', height: '13px' }} /> Sales & Revenue Performance
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              {[
                { label: 'Total Pipeline Value', value: `₹${(totalPipelineValue / 100000).toFixed(1)}L`, sub: `${deals.length} active deals`, color: '#6366f1', icon: Target },
                { label: 'Revenue Won', value: `₹${(totalRevenue / 100000).toFixed(1)}L`, sub: `${wonDeals.length} closed deals`, color: '#10b981', icon: Award },
                { label: 'Win Rate', value: `${winRate}%`, sub: `of ${deals.length} total deals`, color: winRate >= 50 ? '#34d399' : '#f59e0b', icon: TrendingUp },
                { label: 'Ad ROAS', value: `${adROAS}x`, sub: `₹${(totalAdSpend / 1000).toFixed(0)}K spend`, color: '#f59e0b', icon: Zap },
              ].map(kpi => {
                const Icon = kpi.icon;
                return (
                  <div key={kpi.label} className="glass-card" style={{ padding: '18px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', right: '-8px', top: '-8px', width: '60px', height: '60px', borderRadius: '50%', background: `${kpi.color}15` }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>{kpi.label}</div>
                        <div style={{ fontSize: '1.6rem', fontWeight: '900', color: kpi.color, marginTop: '4px', lineHeight: 1 }}>{kpi.value}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>{kpi.sub}</div>
                      </div>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${kpi.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon style={{ width: '18px', height: '18px', color: kpi.color }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* KPI Row 2 — Content Delivery */}
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Video style={{ width: '13px', height: '13px' }} /> Content Delivery & Social Performance
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              {[
                { label: 'Reel Delivery Rate', value: `${reelDeliveryRate}%`, sub: `${totalReelsDelivered} / ${totalReelsPlanned} Reels`, color: '#34d399' },
                { label: 'Post Delivery Rate', value: `${postDeliveryRate}%`, sub: `${totalPostsDelivered} / ${totalPostsPlanned} Posts`, color: '#60a5fa' },
                { label: 'Total Views Reached', value: totalViews >= 1000000 ? `${(totalViews / 1000000).toFixed(1)}M` : `${(totalViews / 1000).toFixed(0)}K`, sub: 'across all clients', color: '#a78bfa' },
                { label: 'Pending Approvals', value: `${pendingApprovals}`, sub: 'deliverables awaiting sign-off', color: pendingApprovals > 0 ? '#f59e0b' : '#34d399' },
              ].map(kpi => (
                <div key={kpi.label} className="glass-card" style={{ padding: '18px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>{kpi.label}</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: '900', color: kpi.color, marginTop: '4px', lineHeight: 1 }}>{kpi.value}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>{kpi.sub}</div>
                  {/* Progress bar */}
                  {kpi.label.includes('Rate') && (
                    <div style={{ marginTop: '10px', height: '4px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${kpi.value}`, borderRadius: '4px', background: kpi.color, transition: 'width 0.6s ease' }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* KPI Row 3 — Ad Spend & Paid Media */}
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Megaphone style={{ width: '13px', height: '13px' }} /> Paid Media & Ad Performance
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              {[
                { label: 'Total Ad Spend', value: `₹${(totalAdSpend / 1000).toFixed(0)}K`, sub: `across ${adSpendLedger.length} campaigns`, color: '#f43f5e' },
                { label: 'Total Leads Generated', value: `${totalAdLeads}`, sub: 'from paid media', color: '#10b981' },
                { label: 'Avg. Cost Per Lead', value: `₹${Number(avgCPL).toLocaleString()}`, sub: 'blended CPL', color: '#60a5fa' },
                { label: 'Campaigns Active', value: `${adSpendLedger.filter(a => a.status === 'Active' || a.status === 'Running').length}`, sub: `of ${adSpendLedger.length} total`, color: '#f59e0b' },
              ].map(kpi => (
                <div key={kpi.label} className="glass-card" style={{ padding: '18px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>{kpi.label}</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: '900', color: kpi.color, marginTop: '4px', lineHeight: 1 }}>{kpi.value}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>{kpi.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* KPI Row 4 — Editors & Infrastructure */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Editor Workload */}
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Video style={{ width: '13px', height: '13px' }} /> Editor Workload Status
              </div>
              <div className="glass-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { label: 'In Progress', count: editorsActive, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
                  { label: 'Completed / Delivered', count: editorsCompleted, color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
                  { label: 'Total Assignments', count: editorAssignments.length, color: '#818cf8', bg: 'rgba(129,140,248,0.12)' },
                  { label: 'Total Paid to Editors', count: `₹${editorAssignments.reduce((s,e) => s + (parseFloat(e.amount)||0), 0).toLocaleString()}`, color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '8px', background: row.bg }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: '600' }}>{row.label}</span>
                    <span style={{ fontSize: '1rem', fontWeight: '800', color: row.color }}>{row.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Server Health */}
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Server style={{ width: '13px', height: '13px' }} /> Infrastructure Health
              </div>
              <div className="glass-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { label: 'Servers Active & Healthy', count: serversHealthy, color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
                  { label: 'Total Servers Tracked', count: serverCredentials.length, color: '#818cf8', bg: 'rgba(129,140,248,0.12)' },
                  { label: 'Annual Hosting Cost', count: `₹${serverCredentials.reduce((s,s2) => s + (parseFloat(s2.annualHostingCost)||0), 0).toLocaleString()}`, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
                  { label: 'SSL Renewals Due (30d)', count: serverCredentials.filter(s => { if (!s.sslExpiryDate) return false; const diff = (new Date(s.sslExpiryDate) - new Date()) / 86400000; return diff >= 0 && diff <= 30; }).length, color: '#f43f5e', bg: 'rgba(244,63,94,0.12)' },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '8px', background: row.bg }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: '600' }}>{row.label}</span>
                    <span style={{ fontSize: '1rem', fontWeight: '800', color: row.color }}>{row.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Per-client Deliverable Breakdown Table */}
          {deliverables.length > 0 && (
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BarChart2 style={{ width: '13px', height: '13px' }} /> Per-Client Content Scorecard
              </div>
              <div className="glass-card" style={{ overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.03)' }}>
                      {['Client / Project', 'Month', 'Reels', 'Posts', 'Ad Spend', 'Followers', 'Views', 'Status'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {deliverables.map((d, idx) => {
                      const reel = d.reelsPlanned > 0 ? Math.round((d.reelsDelivered / d.reelsPlanned) * 100) : 100;
                      const post = d.postsPlanned > 0 ? Math.round((d.postsDelivered / d.postsPlanned) * 100) : 100;
                      const matchingSpend = adSpendLedger.filter(a => a.clientProject && a.clientProject.toLowerCase().includes((d.clientName || '').toLowerCase())).reduce((s, a) => s + (a.spentAmount || 0), 0);
                      const health = reel >= 90 && post >= 90 ? { label: 'On Track', color: '#34d399' } : reel >= 70 ? { label: 'At Risk', color: '#f59e0b' } : { label: 'Behind', color: '#f43f5e' };
                      return (
                        <tr key={d.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={{ padding: '12px 14px', fontWeight: '700', color: 'var(--text-primary)' }}>{d.clientName}</td>
                          <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>{d.month}/{d.year}</td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{ color: reel >= 90 ? '#34d399' : reel >= 70 ? '#f59e0b' : '#f43f5e', fontWeight: '700' }}>{d.reelsDelivered}/{d.reelsPlanned}</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginLeft: '4px' }}>({reel}%)</span>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{ color: post >= 90 ? '#34d399' : post >= 70 ? '#f59e0b' : '#f43f5e', fontWeight: '700' }}>{d.postsDelivered}/{d.postsPlanned}</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginLeft: '4px' }}>({post}%)</span>
                          </td>
                          <td style={{ padding: '12px 14px', color: '#f59e0b', fontWeight: '700' }}>{matchingSpend > 0 ? `₹${matchingSpend.toLocaleString()}` : '—'}</td>
                          <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>{d.totalFollowers || '—'}</td>
                          <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>{d.viewsReached || '—'}</td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{ padding: '3px 8px', borderRadius: '6px', background: `${health.color}18`, color: health.color, fontSize: '0.72rem', fontWeight: '700' }}>{health.label}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 1: MONTHLY DELIVERABLES                                             */}
      {/* ========================================================================= */}
      {activeSubTab === 'deliverables' && (
        <DeliverablesMatrix />
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: HOLIDAY CREATIVE PLANNER                                         */}
      {/* ========================================================================= */}
      {activeSubTab === 'holiday_posts' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {holidayPosts.map(post => (
            <div key={post.id} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                    {post.holidayName}
                  </h4>
                  <div style={{ fontSize: '0.78rem', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <Calendar style={{ width: '13px', height: '13px' }} />
                    <span>{post.date}</span> · <strong>{post.clientProject}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={() => setEditingHoliday({ ...post })}
                    className="btn btn-secondary"
                    style={{ padding: '4px 8px', fontSize: '0.72rem', color: '#818cf8' }}
                    title="Edit Holiday Post"
                  >
                    <Edit2 style={{ width: '12px', height: '12px' }} />
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm(`Delete holiday campaign ${post.holidayName}?`)) {
                        deleteHolidayPost(post.id);
                      }
                    }}
                    className="btn btn-secondary"
                    style={{ padding: '4px 6px', color: '#f87171' }}
                    title="Delete"
                  >
                    <Trash2 style={{ width: '12px', height: '12px' }} />
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.75rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px 10px', borderRadius: '6px' }}>
                  <div style={{ color: 'var(--text-muted)' }}>Creative Design</div>
                  <strong style={{ color: post.creativeStatus === 'Completed' ? '#34d399' : '#fbbf24' }}>
                    {post.creativeStatus}
                  </strong>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px 10px', borderRadius: '6px' }}>
                  <div style={{ color: 'var(--text-muted)' }}>Approval Status</div>
                  <strong style={{ color: post.approvalStatus === 'Approved' ? '#34d399' : '#818cf8' }}>
                    {post.approvalStatus}
                  </strong>
                </div>
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', padding: '8px 10px', borderRadius: '6px' }}>
                <strong>Scheduled: </strong>{post.scheduledPosted || 'On Schedule'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: AD SPEND LEDGER                                                  */}
      {/* ========================================================================= */}
      {activeSubTab === 'ad_spend' && (() => {
        // Filter by selected month and year if specified
        const filteredSummaryReports = adSpendLedger.filter(ad => {
          if (selectedAdMonth !== 0 && ad.month !== selectedAdMonth) return false;
          if (selectedAdYear !== 0 && ad.year !== selectedAdYear) return false;
          return true;
        });

        const clientList = REAL_CRM_DATA.clients || [];

        // Build list of all 57 clients merged with their ad spend report for the selected month
        const summaryRows = clientList.map(client => {
          const cId = parseInt(String(client.id || client.projectId || '').replace(/\D/g, ''), 10);
          const cName = (client.name || client.clientName || client.client_name || '').trim().toLowerCase();

          const report = filteredSummaryReports.find(r => {
            const rId = parseInt(String(r.projectId || r.project_id || '').replace(/\D/g, ''), 10);
            const rName = (r.clientName || r.client_name || r.clientProject || r.project_name || '').trim().toLowerCase();
            return (rId && rId === cId) || (rName && (rName === cName || cName.includes(rName) || rName.includes(cName)));
          }) || {};

          const meta = parseFloat(report.metaAdsSpent || report.meta_ads_spent) || 0;
          const insta = parseFloat(report.instaBoostingSpent || report.insta_boosting_spent) || 0;
          const google = parseFloat(report.googleAdsSpent || report.google_ads_spent) || 0;
          const linkedin = parseFloat(report.linkedinAdsSpent || report.linkedin_ads_spent) || 0;
          const allotted = parseFloat(report.amountAllotted || report.amount_allotted) || 0;
          const total = parseFloat(report.totalSpent || report.total_spent) || (meta + insta + google + linkedin);

          return {
            clientId: client.id,
            clientName: client.name || client.clientName || client.client_name,
            date: report.date || 'dd-mm-yyyy',
            amountAllotted: allotted,
            metaAdsSpent: meta,
            instaBoostingSpent: insta,
            googleAdsSpent: google,
            linkedinAdsSpent: linkedin,
            totalSpent: total,
            paymentMode: report.paymentMode || report.mode_of_payment || '',
            remark: report.remark || '',
            hasReport: !!(report.id || total > 0 || allotted > 0),
            reportId: report.id
          };
        });

        const totalAllottedSum = summaryRows.reduce((s, r) => s + r.amountAllotted, 0);
        const totalOutlaySum = summaryRows.reduce((s, r) => s + r.totalSpent, 0);

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Header with Title and Month/Year Filters */}
            <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
                  Ad Spend Ledger
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Log monthly platform advertising budgets across Meta, Instagram, Google, and LinkedIn.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <select
                  value={selectedAdMonth}
                  onChange={(e) => setSelectedAdMonth(parseInt(e.target.value, 10))}
                  className="form-select"
                  style={{ fontSize: '0.8rem', padding: '6px 12px', background: 'var(--bg-input)' }}
                >
                  <option value={0}>All Months</option>
                  <option value={6}>June</option>
                  <option value={7}>July</option>
                  <option value={8}>August</option>
                </select>

                <select
                  value={selectedAdYear}
                  onChange={(e) => setSelectedAdYear(parseInt(e.target.value, 10))}
                  className="form-select"
                  style={{ fontSize: '0.8rem', padding: '6px 12px', background: 'var(--bg-input)' }}
                >
                  <option value={2026}>2026</option>
                  <option value={2025}>2025</option>
                </select>

                <div style={{ padding: '6px 14px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', fontSize: '0.78rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Total Allotted: </span>
                  <strong style={{ color: '#818cf8' }}>₹{totalAllottedSum.toLocaleString('en-IN')}.00</strong>
                  <span style={{ color: 'var(--text-muted)', margin: '0 8px' }}>|</span>
                  <span style={{ color: 'var(--text-muted)' }}>Total Outlay: </span>
                  <strong style={{ color: '#34d399' }}>₹{totalOutlaySum.toLocaleString('en-IN')}.00</strong>
                </div>
              </div>
            </div>

            {/* Table 1: Monthly Ads Spent & Boosting Ledger (Summary) */}
            <div className="glass-card" style={{ padding: '20px' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: '800', marginBottom: '14px', color: 'var(--text-primary)' }}>
                Monthly Ads Spent & Boosting Ledger (Summary)
              </h4>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '10px 14px', textAlign: 'left' }}>Client Name</th>
                      <th style={{ padding: '10px 10px', textAlign: 'center' }}>Date</th>
                      <th style={{ padding: '10px 10px', textAlign: 'right' }}>Allotted</th>
                      <th style={{ padding: '10px 10px', textAlign: 'right' }}>Meta Ads</th>
                      <th style={{ padding: '10px 10px', textAlign: 'right' }}>Insta Boost</th>
                      <th style={{ padding: '10px 10px', textAlign: 'right' }}>Google Ads</th>
                      <th style={{ padding: '10px 10px', textAlign: 'right' }}>LinkedIn Ads</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Total Spent</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left' }}>Payment Mode</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left' }}>Remark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryRows.map((row, idx) => (
                      <tr
                        key={row.clientId || idx}
                        style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '10px 14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                          {row.clientName}
                        </td>
                        <td style={{ padding: '10px 10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                          {row.date}
                        </td>
                        <td style={{ padding: '10px 10px', textAlign: 'right', color: row.amountAllotted > 0 ? '#818cf8' : 'var(--text-muted)', fontWeight: row.amountAllotted > 0 ? '700' : '400' }}>
                          {row.amountAllotted.toFixed(2)}
                        </td>
                        <td style={{ padding: '10px 10px', textAlign: 'right', color: row.metaAdsSpent > 0 ? '#38bdf8' : 'var(--text-muted)', fontWeight: row.metaAdsSpent > 0 ? '700' : '400' }}>
                          {row.metaAdsSpent.toFixed(2)}
                        </td>
                        <td style={{ padding: '10px 10px', textAlign: 'right', color: row.instaBoostingSpent > 0 ? '#f472b6' : 'var(--text-muted)', fontWeight: row.instaBoostingSpent > 0 ? '700' : '400' }}>
                          {row.instaBoostingSpent.toFixed(2)}
                        </td>
                        <td style={{ padding: '10px 10px', textAlign: 'right', color: row.googleAdsSpent > 0 ? '#fbbf24' : 'var(--text-muted)', fontWeight: row.googleAdsSpent > 0 ? '700' : '400' }}>
                          {row.googleAdsSpent.toFixed(2)}
                        </td>
                        <td style={{ padding: '10px 10px', textAlign: 'right', color: row.linkedinAdsSpent > 0 ? '#60a5fa' : 'var(--text-muted)', fontWeight: row.linkedinAdsSpent > 0 ? '700' : '400' }}>
                          {row.linkedinAdsSpent.toFixed(2)}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '800', color: row.totalSpent > 0 ? ((row.currency === 'USD' || (row.paymentMode && String(row.paymentMode).includes('USD'))) ? '#38bdf8' : '#34d399') : 'var(--text-muted)' }}>
                          {((row.currency === 'USD' || row.currency === '$' || (row.paymentMode && String(row.paymentMode).includes('USD'))) ? '$' : '₹')}
                          {row.totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                          {row.paymentMode || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.7rem' }}>e.g. UPI or Visa</span>}
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>
                          {row.remark || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.7rem' }}>Add remark...</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table 2: Detailed Ad Spend Transaction Log */}
            <div className="glass-card" style={{ padding: '20px' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: '800', marginBottom: '14px', color: 'var(--text-primary)' }}>
                Detailed Ad Spend Transaction Log
              </h4>

              {/* Add Transaction Bar */}
              <form onSubmit={handleQuickAddTx} style={{ display: 'grid', gridTemplateColumns: '130px 1.2fr 185px 150px 140px 110px', gap: '10px', marginBottom: '16px', alignItems: 'flex-end', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Date</label>
                  <input
                    type="date"
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="form-input"
                    style={{ fontSize: '0.75rem', padding: '6px 8px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Client Name</label>
                  <select
                    value={txClientId}
                    onChange={(e) => setTxClientId(e.target.value)}
                    required
                    className="form-select"
                    style={{ fontSize: '0.75rem', padding: '6px 8px' }}
                  >
                    <option value="">Select Client...</option>
                    {clientList.map(c => (
                      <option key={c.id} value={c.name || c.clientName}>{c.name || c.clientName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Currency & Amount</label>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <select
                      value={txCurrency}
                      onChange={(e) => setTxCurrency(e.target.value)}
                      className="form-select"
                      style={{
                        fontSize: '0.75rem',
                        padding: '6px 6px',
                        width: '78px',
                        flexShrink: 0,
                        fontWeight: '700',
                        color: txCurrency === 'USD' ? '#38bdf8' : '#34d399',
                        background: txCurrency === 'USD' ? 'rgba(56, 189, 248, 0.1)' : 'rgba(52, 211, 153, 0.1)',
                        borderColor: txCurrency === 'USD' ? 'rgba(56, 189, 248, 0.4)' : 'rgba(52, 211, 153, 0.4)'
                      }}
                    >
                      <option value="INR">₹ (INR)</option>
                      <option value="USD">$ (USD)</option>
                    </select>
                    <input
                      type="number"
                      step="any"
                      placeholder="Amount"
                      required
                      value={txAmount}
                      onChange={(e) => setTxAmount(e.target.value)}
                      className="form-input"
                      style={{ fontSize: '0.75rem', padding: '6px 8px', flex: 1 }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Purpose</label>
                  <input
                    type="text"
                    placeholder="Purpose (e.g. Meta Ads)"
                    value={txPurpose}
                    onChange={(e) => setTxPurpose(e.target.value)}
                    className="form-input"
                    style={{ fontSize: '0.75rem', padding: '6px 8px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Mode of Payment</label>
                  <input
                    type="text"
                    placeholder="e.g. UPI, Stripe, Wire"
                    value={txPaymentMode}
                    onChange={(e) => setTxPaymentMode(e.target.value)}
                    className="form-input"
                    style={{ fontSize: '0.75rem', padding: '6px 8px' }}
                  />
                </div>

                <div>
                  <button type="submit" className="btn gradient-btn-primary" style={{ width: '100%', padding: '7px 10px', fontSize: '0.75rem', borderRadius: '8px' }}>
                    + Add Entry
                  </button>
                </div>
              </form>

              {/* Transactions Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '10px 14px', textAlign: 'left' }}>Date</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left' }}>Client Name</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right' }}>Amount</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left' }}>Purpose</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left' }}>Mode of Payment</th>
                      <th style={{ padding: '10px 14px', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(adSpendTransactions || []).map(tx => {
                      const isUsd = tx.currency === 'USD' || tx.currency === '$' || String(tx.currency).toUpperCase() === 'USD' ||
                        (tx.paymentMode && String(tx.paymentMode).includes('USD')) ||
                        (tx.mode_of_payment && String(tx.mode_of_payment).includes('USD'));
                      const symbol = isUsd ? '$' : '₹';
                      const badgeColor = isUsd ? '#38bdf8' : '#34d399';
                      return (
                        <tr key={tx.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{tx.date}</td>
                          <td style={{ padding: '10px 14px', fontWeight: '700', color: 'var(--text-primary)' }}>{tx.clientName || tx.client_name}</td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '800', color: badgeColor }}>
                            {symbol}{(tx.amount || 0).toLocaleString(isUsd ? 'en-US' : 'en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '10px 14px', color: '#818cf8' }}>{tx.purpose}</td>
                          <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>
                            {tx.paymentMode || tx.mode_of_payment}
                            {isUsd && !(tx.paymentMode || tx.mode_of_payment || '').includes('USD') && (
                              <span style={{ marginLeft: '6px', fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontWeight: '600' }}>USD</span>
                            )}
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                            <button
                              onClick={() => deleteAdTransaction && deleteAdTransaction(tx.id)}
                              className="btn btn-secondary"
                              style={{ padding: '3px 6px', color: '#f87171', fontSize: '0.7rem' }}
                              title="Delete"
                            >
                              <Trash2 style={{ width: '12px', height: '12px' }} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* VIEW 4: VIDEO EDITOR ASSIGNMENTS                                         */}
      {/* ========================================================================= */}
      {activeSubTab === 'editors' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
          {editorAssignments.map(ed => (
            <div key={ed.id} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                    {ed.editorName}
                  </h4>
                  <div style={{ fontSize: '0.75rem', color: '#818cf8' }}>
                    {ed.email} · <strong>{ed.clientProject}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: ed.status === 'Completed' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                    color: ed.status === 'Completed' ? '#34d399' : '#818cf8',
                    fontSize: '0.72rem',
                    fontWeight: '700'
                  }}>
                    {ed.status}
                  </span>

                  <button
                    onClick={() => setEditingEditor({ ...ed })}
                    className="btn btn-secondary"
                    style={{ padding: '4px 8px', fontSize: '0.72rem', color: '#818cf8' }}
                    title="Edit Task"
                  >
                    <Edit2 style={{ width: '12px', height: '12px' }} />
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm(`Delete editor task for ${ed.editorName}?`)) {
                        deleteEditorAssignment(ed.id);
                      }
                    }}
                    className="btn btn-secondary"
                    style={{ padding: '4px 6px', color: '#f87171' }}
                    title="Delete"
                  >
                    <Trash2 style={{ width: '12px', height: '12px' }} />
                  </button>
                </div>
              </div>

              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5, background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px' }}>
                {ed.taskDescription}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--border-color)', fontSize: '0.78rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Payout: </span>
                  <strong style={{ color: '#34d399' }}>₹{(ed.amount || 0).toLocaleString('en-IN')}</strong> ({ed.paymentStatus})
                </div>
                <div style={{ color: 'var(--text-muted)' }}>
                  Due: <strong>{ed.submissionDate}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 5: SERVER INFRASTRUCTURE & CREDENTIALS VAULT                         */}
      {/* ========================================================================= */}
      {activeSubTab === 'servers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Sub-vault Selector Pills */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <button
                type="button"
                onClick={() => setServerVaultTab('servers')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: serverVaultTab === 'servers' ? '800' : '600',
                  background: serverVaultTab === 'servers' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
                  color: serverVaultTab === 'servers' ? '#fff' : 'var(--text-secondary)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Server style={{ width: '14px', height: '14px' }} />
                <span>Dedicated Servers & Cloud VPS</span>
                <span style={{ padding: '1px 6px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', fontSize: '0.68rem' }}>
                  {serverCredentials.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setServerVaultTab('credentials')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: serverVaultTab === 'credentials' ? '800' : '600',
                  background: serverVaultTab === 'credentials' ? 'linear-gradient(135deg, #10b981, #06b6d4)' : 'transparent',
                  color: serverVaultTab === 'credentials' ? '#fff' : 'var(--text-secondary)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Key style={{ width: '14px', height: '14px' }} />
                <span>Project & Platform Credentials Vault</span>
                <span style={{ padding: '1px 6px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', fontSize: '0.68rem' }}>
                  {projectCredentials?.length || 0}
                </span>
              </button>
            </div>

            {serverVaultTab === 'credentials' && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', minWidth: '220px' }}>
                  <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search client, username, platform..."
                    value={credSearch}
                    onChange={(e) => setCredSearch(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '32px', fontSize: '0.75rem', height: '34px' }}
                  />
                </div>

                <select
                  value={credPlatformFilter}
                  onChange={(e) => setCredPlatformFilter(e.target.value)}
                  className="form-select"
                  style={{ fontSize: '0.75rem', height: '34px', minWidth: '130px' }}
                >
                  <option value="ALL">All Platforms</option>
                  <option value="Gmail">Gmail</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Facebook">Facebook</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="YouTube">YouTube</option>
                  <option value="Portal">Portal / Other</option>
                </select>
              </div>
            )}
          </div>

          {/* TAB 1: DEDICATED SERVERS */}
          {serverVaultTab === 'servers' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '16px' }}>
              {serverCredentials.map(srv => {
                const srvId = srv.id || `srv-${srv.rawId}`;
                const clientName = srv.clientProject || srv.clientName || srv.serverName || srv.client_name || srv.server_name || 'Production Server';
                const provider = srv.serverProvider || srv.server_provider || srv.serverName || 'Hostinger';
                const ip = srv.ipAddress || srv.serverIp || srv.server_ip || srv.ip_address || '93.127.206.213';
                const os = srv.osType || srv.osInfo || srv.os_info || 'Ubuntu 22.04 LTS';
                const user = srv.username || srv.sshUsername || srv.ssh_username || 'root';
                const pass = srv.password || srv.sshPassword || srv.ssh_password || '';
                const port = srv.sshPort || srv.ssh_port || '22';
                const renewal = srv.sslExpiryDate || srv.renewalDate || srv.renewal_date || '2026-12-31';
                const cost = srv.annualHostingCost || (srv.monthlyCost ? srv.monthlyCost * 12 : 0) || (srv.monthly_cost ? srv.monthly_cost * 12 : 0) || 12000;
                const remarks = srv.remarks || srv.domainsHosted || 'Main Production Node';
                const isPassVisible = visiblePasswords[srvId];

                return (
                  <div key={srvId} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.2) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Server style={{ width: '20px', height: '20px', color: '#818cf8' }} />
                        </div>
                        <div>
                          <h4 style={{ fontSize: '1.05rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                            {clientName}
                          </h4>
                          <span style={{ fontSize: '0.74rem', color: '#a5b4fc', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <HardDrive style={{ width: '11px', height: '11px' }} /> {provider} · {srv.serverType || 'Cloud VPS'}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#34d399',
                          fontSize: '0.7rem',
                          fontWeight: '700'
                        }}>
                          {srv.status || 'Active'}
                        </span>

                        <button
                          onClick={() => setEditingServer({ ...srv, clientProject: clientName, serverProvider: provider, ipAddress: ip, username: user, password: pass, osType: os, annualHostingCost: cost, remarks })}
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.72rem', color: '#818cf8' }}
                          title="Edit Server"
                        >
                          <Edit2 style={{ width: '12px', height: '12px' }} />
                        </button>

                        <button
                          onClick={() => {
                            if (window.confirm(`Delete server credential for ${clientName}?`)) {
                              deleteServerCredential(srv.id);
                            }
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '4px 6px', color: '#f87171' }}
                          title="Delete"
                        >
                          <Trash2 style={{ width: '12px', height: '12px' }} />
                        </button>
                      </div>
                    </div>

                    {/* Server Specs Matrix */}
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.76rem' }}>
                      <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginBottom: '2px' }}>IP Host / Hostname</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <code style={{ color: '#34d399', fontWeight: '700', fontSize: '0.8rem' }}>{ip}</code>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(ip, `${srvId}-ip`)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px', color: copiedId === `${srvId}-ip` ? '#34d399' : 'var(--text-muted)' }}
                            title="Copy IP"
                          >
                            {copiedId === `${srvId}-ip` ? <Check style={{ width: '12px', height: '12px' }} /> : <Copy style={{ width: '12px', height: '12px' }} />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginBottom: '2px' }}>Operating System</div>
                        <strong style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Cpu style={{ width: '12px', height: '12px', color: '#60a5fa' }} /> {os}
                        </strong>
                      </div>

                      <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginBottom: '2px' }}>SSH User & Port</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <code style={{ color: '#818cf8', fontWeight: '700' }}>{user}</code>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>:{port}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(user, `${srvId}-user`)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px', color: copiedId === `${srvId}-user` ? '#34d399' : 'var(--text-muted)' }}
                            title="Copy Username"
                          >
                            {copiedId === `${srvId}-user` ? <Check style={{ width: '12px', height: '12px' }} /> : <Copy style={{ width: '12px', height: '12px' }} />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginBottom: '2px' }}>SSH Password / Auth</div>
                        {pass ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <code style={{ color: '#f43f5e', fontWeight: '700', fontSize: '0.78rem' }}>
                              {isPassVisible ? pass : '••••••••••••'}
                            </code>
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility(srvId)}
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--text-muted)' }}
                              title={isPassVisible ? 'Hide Password' : 'Show Password'}
                            >
                              {isPassVisible ? <EyeOff style={{ width: '12px', height: '12px' }} /> : <Eye style={{ width: '12px', height: '12px' }} />}
                            </button>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(pass, `${srvId}-pass`)}
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px', color: copiedId === `${srvId}-pass` ? '#34d399' : 'var(--text-muted)' }}
                              title="Copy Password"
                            >
                              {copiedId === `${srvId}-pass` ? <Check style={{ width: '12px', height: '12px' }} /> : <Copy style={{ width: '12px', height: '12px' }} />}
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>SSH Key / Portal Auth</span>
                        )}
                      </div>
                    </div>

                    {/* Footer Details */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', color: 'var(--text-secondary)', paddingTop: '4px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <div>
                        <strong>Hosting Cost: </strong>
                        <span style={{ color: '#34d399', fontWeight: '700' }}>₹{cost.toLocaleString('en-IN')}/yr</span>
                      </div>
                      <div>
                        <strong>Renewal: </strong>
                        <span style={{ color: '#fbbf24', fontWeight: '600' }}>{renewal}</span>
                      </div>
                    </div>

                    {remarks && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.01)', padding: '6px 10px', borderRadius: '6px' }}>
                        {remarks}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: PROJECT CREDENTIALS VAULT (94 RECORDS) */}
          {serverVaultTab === 'credentials' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: '16px' }}>
              {(projectCredentials || [])
                .filter(c => {
                  if (credPlatformFilter !== 'ALL') {
                    if (credPlatformFilter === 'Portal') {
                      if (['Gmail', 'Instagram', 'Facebook', 'LinkedIn', 'YouTube'].includes(c.platform)) return false;
                    } else if (c.platform !== credPlatformFilter) return false;
                  }
                  if (credSearch.trim()) {
                    const q = credSearch.toLowerCase();
                    const matchClient = (c.clientName || '').toLowerCase().includes(q);
                    const matchUser = (c.username || '').toLowerCase().includes(q);
                    const matchPlatform = (c.platform || '').toLowerCase().includes(q);
                    const matchNotes = (c.notes || '').toLowerCase().includes(q);
                    if (!matchClient && !matchUser && !matchPlatform && !matchNotes) return false;
                  }
                  return true;
                })
                .map(c => {
                  const credId = c.id || `cred-${c.rawId}`;
                  const isPassVisible = visiblePasswords[credId];
                  const platform = c.platform || 'General Access';
                  const isGmail = platform.toLowerCase().includes('gmail') || platform.toLowerCase().includes('email');
                  const isInsta = platform.toLowerCase().includes('instagram');
                  const isFB = platform.toLowerCase().includes('facebook');
                  const isLI = platform.toLowerCase().includes('linkedin');
                  const isYT = platform.toLowerCase().includes('youtube');

                  const badgeColor = isGmail ? '#ef4444' : (isInsta ? '#ec4899' : (isFB ? '#3b82f6' : (isLI ? '#0ea5e9' : (isYT ? '#f43f5e' : '#10b981'))));
                  const badgeBg = isGmail ? 'rgba(239, 68, 68, 0.15)' : (isInsta ? 'rgba(236, 72, 153, 0.15)' : (isFB ? 'rgba(59, 130, 246, 0.15)' : (isLI ? 'rgba(14, 165, 233, 0.15)' : (isYT ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)'))));

                  return (
                    <div key={credId} className="glass-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h4 style={{ fontSize: '1rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                            {c.clientName}
                          </h4>
                          <span style={{ fontSize: '0.72rem', color: badgeColor, fontWeight: '700', background: badgeBg, padding: '2px 8px', borderRadius: '6px', display: 'inline-block', marginTop: '4px' }}>
                            {platform}
                          </span>
                        </div>

                        {c.loginUrl && (
                          <a
                            href={c.loginUrl.startsWith('http') ? c.loginUrl : `https://${c.loginUrl}`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.72rem', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '4px' }}
                            title="Open Login URL"
                          >
                            <ExternalLink style={{ width: '12px', height: '12px' }} />
                            <span>Launch</span>
                          </a>
                        )}
                      </div>

                      {/* Credential Data Box */}
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.76rem' }}>
                        <div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem', marginBottom: '2px' }}>Username / Account Identifier</div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                            <code style={{ color: 'var(--text-primary)', fontWeight: '700', wordBreak: 'break-all' }}>{c.username || '—'}</code>
                            {c.username && (
                              <button
                                type="button"
                                onClick={() => copyToClipboard(c.username, `${credId}-u`)}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px', color: copiedId === `${credId}-u` ? '#34d399' : 'var(--text-muted)', flexShrink: 0 }}
                                title="Copy Username"
                              >
                                {copiedId === `${credId}-u` ? <Check style={{ width: '13px', height: '13px' }} /> : <Copy style={{ width: '13px', height: '13px' }} />}
                              </button>
                            )}
                          </div>
                        </div>

                        <div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem', marginBottom: '2px' }}>Access Password</div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                            <code style={{ color: '#f43f5e', fontWeight: '700' }}>
                              {c.password ? (isPassVisible ? c.password : '••••••••••••') : <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>Direct Access / OAuth</span>}
                            </code>
                            {c.password && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <button
                                  type="button"
                                  onClick={() => togglePasswordVisibility(credId)}
                                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--text-muted)' }}
                                  title={isPassVisible ? 'Hide Password' : 'Show Password'}
                                >
                                  {isPassVisible ? <EyeOff style={{ width: '13px', height: '13px' }} /> : <Eye style={{ width: '13px', height: '13px' }} />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(c.password, `${credId}-p`)}
                                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px', color: copiedId === `${credId}-p` ? '#34d399' : 'var(--text-muted)' }}
                                  title="Copy Password"
                                >
                                  {copiedId === `${credId}-p` ? <Check style={{ width: '13px', height: '13px' }} /> : <Copy style={{ width: '13px', height: '13px' }} />}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {c.notes && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.01)', padding: '6px 8px', borderRadius: '6px' }}>
                          {c.notes}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT DELIVERABLES RECORD                                           */}
      {/* ========================================================================= */}
      {editingDeliverable && (
        <div className="modal-overlay" style={{ zIndex: 1000, padding: '16px' }}>
          <div className="modal-content" style={{ maxWidth: '640px', padding: '24px', background: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Edit2 style={{ width: '18px', height: '18px', color: '#818cf8' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0 }}>Edit Deliverables Record</h3>
              </div>
              <button onClick={() => setEditingDeliverable(null)} className="btn btn-secondary" style={{ padding: '6px 8px' }}>
                <X style={{ width: '16px', height: '16px' }} />
              </button>
            </div>

            <form onSubmit={handleSaveEditDeliverable} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Project Name *</label>
                  <input
                    type="text"
                    required
                    value={editingDeliverable.projectName}
                    onChange={(e) => setEditingDeliverable({ ...editingDeliverable, projectName: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Client Name *</label>
                  <input
                    type="text"
                    required
                    value={editingDeliverable.clientName}
                    onChange={(e) => setEditingDeliverable({ ...editingDeliverable, clientName: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Service, Month, Year Selection */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Service Package / Category *</label>
                  <select
                    value={editingDeliverable.service || 'Social Media Management'}
                    onChange={(e) => setEditingDeliverable({ ...editingDeliverable, service: e.target.value })}
                    className="form-input"
                  >
                    <option value="Social Media Management">Social Media Management (Reels + Posts)</option>
                    <option value="SEO & Content">SEO & Website Content</option>
                    <option value="Paid Media (PPC/Meta)">Paid Media (Meta & Google PPC)</option>
                    <option value="Web Design & Development">Web & App Development</option>
                    <option value="Video Production">Video Production & Motion Graphics</option>
                    <option value="Branding & Design">Branding & Identity Design</option>
                    <option value="Digital Marketing & SEO">Digital Marketing & SEO</option>
                    <option value="Other">Other / Custom Retainer</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Month *</label>
                  <select
                    value={editingDeliverable.month || 8}
                    onChange={(e) => setEditingDeliverable({ ...editingDeliverable, month: parseInt(e.target.value, 10) })}
                    className="form-input"
                  >
                    <option value="1">1 - January</option>
                    <option value="2">2 - February</option>
                    <option value="3">3 - March</option>
                    <option value="4">4 - April</option>
                    <option value="5">5 - May</option>
                    <option value="6">6 - June</option>
                    <option value="7">7 - July</option>
                    <option value="8">8 - August</option>
                    <option value="9">9 - September</option>
                    <option value="10">10 - October</option>
                    <option value="11">11 - November</option>
                    <option value="12">12 - December</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Year *</label>
                  <select
                    value={editingDeliverable.year || 2026}
                    onChange={(e) => setEditingDeliverable({ ...editingDeliverable, year: parseInt(e.target.value, 10) })}
                    className="form-input"
                  >
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                    <option value="2028">2028</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">Reels Planned</label>
                  <input
                    type="number"
                    value={editingDeliverable.reelsPlanned}
                    onChange={(e) => setEditingDeliverable({ ...editingDeliverable, reelsPlanned: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Reels Done</label>
                  <input
                    type="number"
                    value={editingDeliverable.reelsDelivered}
                    onChange={(e) => setEditingDeliverable({ ...editingDeliverable, reelsDelivered: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Posts Planned</label>
                  <input
                    type="number"
                    value={editingDeliverable.postsPlanned}
                    onChange={(e) => setEditingDeliverable({ ...editingDeliverable, postsPlanned: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Posts Done</label>
                  <input
                    type="number"
                    value={editingDeliverable.postsDelivered}
                    onChange={(e) => setEditingDeliverable({ ...editingDeliverable, postsDelivered: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">Total Followers</label>
                  <input
                    type="text"
                    value={editingDeliverable.totalFollowers || ''}
                    onChange={(e) => setEditingDeliverable({ ...editingDeliverable, totalFollowers: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Views Reached</label>
                  <input
                    type="text"
                    value={editingDeliverable.viewsReached || ''}
                    onChange={(e) => setEditingDeliverable({ ...editingDeliverable, viewsReached: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">SEO Backlinks</label>
                  <input
                    type="number"
                    value={editingDeliverable.backlinksCreated || 0}
                    onChange={(e) => setEditingDeliverable({ ...editingDeliverable, backlinksCreated: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Remarks & Highlights</label>
                <textarea
                  rows={2}
                  value={editingDeliverable.approvalPendingRemarks || ''}
                  onChange={(e) => setEditingDeliverable({ ...editingDeliverable, approvalPendingRemarks: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setEditingDeliverable(null)} className="btn btn-secondary">
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
      {/* MODAL: EDIT HOLIDAY POST                                                  */}
      {/* ========================================================================= */}
      {editingHoliday && (
        <div className="modal-overlay" style={{ zIndex: 1000, padding: '16px' }}>
          <div className="modal-content" style={{ maxWidth: '540px', padding: '24px', background: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0 }}>Edit Holiday Post</h3>
              <button onClick={() => setEditingHoliday(null)} className="btn btn-secondary" style={{ padding: '6px 8px' }}>
                <X style={{ width: '16px', height: '16px' }} />
              </button>
            </div>

            <form onSubmit={handleSaveEditHoliday} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Holiday / Festival Name *</label>
                <input
                  type="text"
                  required
                  value={editingHoliday.holidayName}
                  onChange={(e) => setEditingHoliday({ ...editingHoliday, holidayName: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input
                    type="date"
                    required
                    value={editingHoliday.date}
                    onChange={(e) => setEditingHoliday({ ...editingHoliday, date: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Client Project</label>
                  <input
                    type="text"
                    value={editingHoliday.clientProject}
                    onChange={(e) => setEditingHoliday({ ...editingHoliday, clientProject: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Creative Status</label>
                  <select
                    value={editingHoliday.creativeStatus}
                    onChange={(e) => setEditingHoliday({ ...editingHoliday, creativeStatus: e.target.value })}
                    className="form-input"
                  >
                    <option value="Completed">Completed</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Pending Design">Pending Design</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Approval Status</label>
                  <select
                    value={editingHoliday.approvalStatus}
                    onChange={(e) => setEditingHoliday({ ...editingHoliday, approvalStatus: e.target.value })}
                    className="form-input"
                  >
                    <option value="Approved">Approved</option>
                    <option value="Pending Review">Pending Review</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Posting Schedule Notes</label>
                <input
                  type="text"
                  value={editingHoliday.scheduledPosted || ''}
                  onChange={(e) => setEditingHoliday({ ...editingHoliday, scheduledPosted: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setEditingHoliday(null)} className="btn btn-secondary">
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
      {/* MODAL: EDIT AD SPEND TRANSACTION                                         */}
      {/* ========================================================================= */}
      {editingAdSpend && (
        <div className="modal-overlay" style={{ zIndex: 1000, padding: '16px' }}>
          <div className="modal-content" style={{ maxWidth: '540px', padding: '24px', background: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0 }}>Edit Ad Spend Transaction</h3>
              <button onClick={() => setEditingAdSpend(null)} className="btn btn-secondary" style={{ padding: '6px 8px' }}>
                <X style={{ width: '16px', height: '16px' }} />
              </button>
            </div>

            <form onSubmit={handleSaveEditAdSpend} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Client Project *</label>
                  <input
                    type="text"
                    required
                    value={editingAdSpend.clientProject}
                    onChange={(e) => setEditingAdSpend({ ...editingAdSpend, clientProject: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Platform *</label>
                  <input
                    type="text"
                    required
                    value={editingAdSpend.platform}
                    onChange={(e) => setEditingAdSpend({ ...editingAdSpend, platform: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Spent Amount *</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <select
                      value={editingAdSpend.currency || 'INR'}
                      onChange={(e) => setEditingAdSpend({ ...editingAdSpend, currency: e.target.value })}
                      className="form-select"
                      style={{
                        width: '85px',
                        flexShrink: 0,
                        fontWeight: '700',
                        color: editingAdSpend.currency === 'USD' ? '#38bdf8' : '#34d399'
                      }}
                    >
                      <option value="INR">₹ (INR)</option>
                      <option value="USD">$ (USD)</option>
                    </select>
                    <input
                      type="number"
                      step="any"
                      required
                      value={editingAdSpend.spentAmount}
                      onChange={(e) => setEditingAdSpend({ ...editingAdSpend, spentAmount: e.target.value })}
                      className="form-input"
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Leads Generated</label>
                  <input
                    type="number"
                    value={editingAdSpend.leadsGenerated}
                    onChange={(e) => setEditingAdSpend({ ...editingAdSpend, leadsGenerated: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Payment Mode</label>
                  <input
                    type="text"
                    value={editingAdSpend.paymentMode || ''}
                    onChange={(e) => setEditingAdSpend({ ...editingAdSpend, paymentMode: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    value={editingAdSpend.status}
                    onChange={(e) => setEditingAdSpend({ ...editingAdSpend, status: e.target.value })}
                    className="form-input"
                  >
                    <option value="Reconciled">Reconciled</option>
                    <option value="Pending Verification">Pending Verification</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setEditingAdSpend(null)} className="btn btn-secondary">
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
      {/* MODAL: EDIT EDITOR WORK ORDER                                             */}
      {/* ========================================================================= */}
      {editingEditor && (
        <div className="modal-overlay" style={{ zIndex: 1000, padding: '16px' }}>
          <div className="modal-content" style={{ maxWidth: '540px', padding: '24px', background: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0 }}>Edit Editor Work Order</h3>
              <button onClick={() => setEditingEditor(null)} className="btn btn-secondary" style={{ padding: '6px 8px' }}>
                <X style={{ width: '16px', height: '16px' }} />
              </button>
            </div>

            <form onSubmit={handleSaveEditEditor} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Editor Name *</label>
                  <input
                    type="text"
                    required
                    value={editingEditor.editorName}
                    onChange={(e) => setEditingEditor({ ...editingEditor, editorName: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Client Project *</label>
                  <input
                    type="text"
                    required
                    value={editingEditor.clientProject}
                    onChange={(e) => setEditingEditor({ ...editingEditor, clientProject: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Task Description</label>
                <textarea
                  rows={2}
                  value={editingEditor.taskDescription}
                  onChange={(e) => setEditingEditor({ ...editingEditor, taskDescription: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Amount (₹)</label>
                  <input
                    type="number"
                    value={editingEditor.amount}
                    onChange={(e) => setEditingEditor({ ...editingEditor, amount: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    value={editingEditor.status}
                    onChange={(e) => setEditingEditor({ ...editingEditor, status: e.target.value })}
                    className="form-input"
                  >
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Under Review">Under Review</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setEditingEditor(null)} className="btn btn-secondary">
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
      {/* MODAL: EDIT SERVER CREDENTIAL                                             */}
      {/* ========================================================================= */}
      {editingServer && (
        <div className="modal-overlay" style={{ zIndex: 1000, padding: '16px' }}>
          <div className="modal-content" style={{ maxWidth: '560px', padding: '24px', background: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0 }}>Edit Server Credential</h3>
              <button onClick={() => setEditingServer(null)} className="btn btn-secondary" style={{ padding: '6px 8px' }}>
                <X style={{ width: '16px', height: '16px' }} />
              </button>
            </div>

            <form onSubmit={handleSaveEditServer} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Client Project *</label>
                  <input
                    type="text"
                    required
                    value={editingServer.clientProject}
                    onChange={(e) => setEditingServer({ ...editingServer, clientProject: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Server Provider *</label>
                  <input
                    type="text"
                    required
                    value={editingServer.serverProvider}
                    onChange={(e) => setEditingServer({ ...editingServer, serverProvider: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">IP Address *</label>
                  <input
                    type="text"
                    required
                    value={editingServer.ipAddress}
                    onChange={(e) => setEditingServer({ ...editingServer, ipAddress: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">SSH User</label>
                  <input
                    type="text"
                    value={editingServer.username}
                    onChange={(e) => setEditingServer({ ...editingServer, username: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">SSL Expiry Date</label>
                  <input
                    type="date"
                    value={editingServer.sslExpiryDate || ''}
                    onChange={(e) => setEditingServer({ ...editingServer, sslExpiryDate: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Annual Hosting Cost (₹)</label>
                  <input
                    type="number"
                    value={editingServer.annualHostingCost || 0}
                    onChange={(e) => setEditingServer({ ...editingServer, annualHostingCost: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setEditingServer(null)} className="btn btn-secondary">
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
      {/* MODAL: ADD DELIVERABLE                                                    */}
      {/* ========================================================================= */}
      {showAddDeliverableModal && (
        <div className="modal-overlay" style={{ zIndex: 1000, padding: '16px' }}>
          <div className="modal-content" style={{ maxWidth: '640px', padding: '24px', background: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0 }}>Add Deliverables Plan</h3>
              <button onClick={() => setShowAddDeliverableModal(false)} className="btn btn-secondary" style={{ padding: '6px 8px' }}>
                <X style={{ width: '16px', height: '16px' }} />
              </button>
            </div>

            <form onSubmit={handleCreateDeliverable} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Project Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Omnichannel Growth Retainer"
                    value={newDeliverableForm.projectName}
                    onChange={(e) => setNewDeliverableForm({ ...newDeliverableForm, projectName: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Client Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Corporation"
                    value={newDeliverableForm.clientName}
                    onChange={(e) => setNewDeliverableForm({ ...newDeliverableForm, clientName: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Service, Month, Year Selection */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Service Package / Category *</label>
                  <select
                    value={newDeliverableForm.service || 'Social Media Management'}
                    onChange={(e) => setNewDeliverableForm({ ...newDeliverableForm, service: e.target.value })}
                    className="form-input"
                  >
                    <option value="Social Media Management">Social Media Management (Reels + Posts)</option>
                    <option value="SEO & Content">SEO & Website Content</option>
                    <option value="Paid Media (PPC/Meta)">Paid Media (Meta & Google PPC)</option>
                    <option value="Web Design & Development">Web & App Development</option>
                    <option value="Video Production">Video Production & Motion Graphics</option>
                    <option value="Branding & Design">Branding & Identity Design</option>
                    <option value="Digital Marketing & SEO">Digital Marketing & SEO</option>
                    <option value="Other">Other / Custom Retainer</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Month *</label>
                  <select
                    value={newDeliverableForm.month || 8}
                    onChange={(e) => setNewDeliverableForm({ ...newDeliverableForm, month: parseInt(e.target.value, 10) })}
                    className="form-input"
                  >
                    <option value="1">1 - January</option>
                    <option value="2">2 - February</option>
                    <option value="3">3 - March</option>
                    <option value="4">4 - April</option>
                    <option value="5">5 - May</option>
                    <option value="6">6 - June</option>
                    <option value="7">7 - July</option>
                    <option value="8">8 - August</option>
                    <option value="9">9 - September</option>
                    <option value="10">10 - October</option>
                    <option value="11">11 - November</option>
                    <option value="12">12 - December</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Year *</label>
                  <select
                    value={newDeliverableForm.year || 2026}
                    onChange={(e) => setNewDeliverableForm({ ...newDeliverableForm, year: parseInt(e.target.value, 10) })}
                    className="form-input"
                  >
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                    <option value="2028">2028</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">Reels Plan</label>
                  <input
                    type="number"
                    value={newDeliverableForm.reelsPlanned}
                    onChange={(e) => setNewDeliverableForm({ ...newDeliverableForm, reelsPlanned: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Reels Done</label>
                  <input
                    type="number"
                    value={newDeliverableForm.reelsDelivered}
                    onChange={(e) => setNewDeliverableForm({ ...newDeliverableForm, reelsDelivered: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Posts Plan</label>
                  <input
                    type="number"
                    value={newDeliverableForm.postsPlanned}
                    onChange={(e) => setNewDeliverableForm({ ...newDeliverableForm, postsPlanned: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Posts Done</label>
                  <input
                    type="number"
                    value={newDeliverableForm.postsDelivered}
                    onChange={(e) => setNewDeliverableForm({ ...newDeliverableForm, postsDelivered: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">Total Followers</label>
                  <input
                    type="text"
                    placeholder="e.g. 120K"
                    value={newDeliverableForm.totalFollowers || ''}
                    onChange={(e) => setNewDeliverableForm({ ...newDeliverableForm, totalFollowers: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Views Reached</label>
                  <input
                    type="text"
                    placeholder="e.g. 850K"
                    value={newDeliverableForm.viewsReached || ''}
                    onChange={(e) => setNewDeliverableForm({ ...newDeliverableForm, viewsReached: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">SEO Backlinks</label>
                  <input
                    type="number"
                    placeholder="e.g. 50"
                    value={newDeliverableForm.backlinksCreated || 0}
                    onChange={(e) => setNewDeliverableForm({ ...newDeliverableForm, backlinksCreated: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Approval Pending Remarks & Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. 2 video reels pending final stakeholder approval..."
                  value={newDeliverableForm.approvalPendingRemarks || ''}
                  onChange={(e) => setNewDeliverableForm({ ...newDeliverableForm, approvalPendingRemarks: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddDeliverableModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn gradient-btn-primary">
                  Add Deliverable
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD HOLIDAY POST                                                   */}
      {/* ========================================================================= */}
      {showAddHolidayModal && (
        <div className="modal-overlay" style={{ zIndex: 1000, padding: '16px' }}>
          <div className="modal-content" style={{ maxWidth: '540px', padding: '24px', background: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0 }}>Add Holiday Campaign</h3>
              <button onClick={() => setShowAddHolidayModal(false)} className="btn btn-secondary" style={{ padding: '6px 8px' }}>
                <X style={{ width: '16px', height: '16px' }} />
              </button>
            </div>

            <form onSubmit={handleCreateHoliday} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Holiday / Festival Name *</label>
                <input
                  type="text"
                  required
                  value={newHolidayForm.holidayName}
                  onChange={(e) => setNewHolidayForm({ ...newHolidayForm, holidayName: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input
                    type="date"
                    required
                    value={newHolidayForm.date}
                    onChange={(e) => setNewHolidayForm({ ...newHolidayForm, date: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Client Project</label>
                  <input
                    type="text"
                    value={newHolidayForm.clientProject}
                    onChange={(e) => setNewHolidayForm({ ...newHolidayForm, clientProject: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddHolidayModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn gradient-btn-primary">
                  Save Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD AD SPEND                                                       */}
      {/* ========================================================================= */}
      {showAddAdSpendModal && (
        <div className="modal-overlay" style={{ zIndex: 1000, padding: '16px' }}>
          <div className="modal-content" style={{ maxWidth: '540px', padding: '24px', background: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0 }}>Log Ad Spend</h3>
              <button onClick={() => setShowAddAdSpendModal(false)} className="btn btn-secondary" style={{ padding: '6px 8px' }}>
                <X style={{ width: '16px', height: '16px' }} />
              </button>
            </div>

            <form onSubmit={handleCreateAdSpend} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Client Project *</label>
                  <input
                    type="text"
                    required
                    value={newAdSpendForm.clientProject}
                    onChange={(e) => setNewAdSpendForm({ ...newAdSpendForm, clientProject: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Platform *</label>
                  <input
                    type="text"
                    required
                    value={newAdSpendForm.platform}
                    onChange={(e) => setNewAdSpendForm({ ...newAdSpendForm, platform: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Spent Amount *</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <select
                      value={newAdSpendForm.currency || 'INR'}
                      onChange={(e) => setNewAdSpendForm({ ...newAdSpendForm, currency: e.target.value })}
                      className="form-select"
                      style={{
                        width: '85px',
                        flexShrink: 0,
                        fontWeight: '700',
                        color: newAdSpendForm.currency === 'USD' ? '#38bdf8' : '#34d399'
                      }}
                    >
                      <option value="INR">₹ (INR)</option>
                      <option value="USD">$ (USD)</option>
                    </select>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="Amount"
                      value={newAdSpendForm.spentAmount}
                      onChange={(e) => setNewAdSpendForm({ ...newAdSpendForm, spentAmount: e.target.value })}
                      className="form-input"
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Leads Generated</label>
                  <input
                    type="number"
                    value={newAdSpendForm.leadsGenerated}
                    onChange={(e) => setNewAdSpendForm({ ...newAdSpendForm, leadsGenerated: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddAdSpendModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn gradient-btn-primary">
                  Log Spend
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD VIDEO EDITOR WORK ORDER                                        */}
      {/* ========================================================================= */}
      {showAddEditorModal && (
        <div className="modal-overlay" style={{ zIndex: 1000, padding: '16px' }}>
          <div className="modal-content" style={{ maxWidth: '540px', padding: '24px', background: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0 }}>Assign Video Editor Task</h3>
              <button onClick={() => setShowAddEditorModal(false)} className="btn btn-secondary" style={{ padding: '6px 8px' }}>
                <X style={{ width: '16px', height: '16px' }} />
              </button>
            </div>

            <form onSubmit={handleCreateEditor} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Editor Name *</label>
                  <input
                    type="text"
                    required
                    value={newEditorForm.editorName}
                    onChange={(e) => setNewEditorForm({ ...newEditorForm, editorName: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Client Project *</label>
                  <input
                    type="text"
                    required
                    value={newEditorForm.clientProject}
                    onChange={(e) => setNewEditorForm({ ...newEditorForm, clientProject: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Task Description *</label>
                <textarea
                  required
                  rows={2}
                  value={newEditorForm.taskDescription}
                  onChange={(e) => setNewEditorForm({ ...newEditorForm, taskDescription: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Payout Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    value={newEditorForm.amount}
                    onChange={(e) => setNewEditorForm({ ...newEditorForm, amount: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Deadline</label>
                  <input
                    type="date"
                    value={newEditorForm.submissionDate}
                    onChange={(e) => setNewEditorForm({ ...newEditorForm, submissionDate: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddEditorModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn gradient-btn-primary">
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT SERVER ENTRY                                                  */}
      {/* ========================================================================= */}
      {editingServer && (
        <div className="modal-overlay" style={{ zIndex: 1000, padding: '16px' }}>
          <div className="modal-content" style={{ maxWidth: '580px', padding: '24px', background: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Server style={{ width: '18px', height: '18px', color: '#818cf8' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0 }}>Edit Server Details</h3>
              </div>
              <button onClick={() => setEditingServer(null)} className="btn btn-secondary" style={{ padding: '6px 8px' }}>
                <X style={{ width: '16px', height: '16px' }} />
              </button>
            </div>

            <form onSubmit={handleSaveEditServer} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Client / Node Name *</label>
                  <input
                    type="text"
                    required
                    value={editingServer.clientProject || ''}
                    onChange={(e) => setEditingServer({ ...editingServer, clientProject: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Cloud Provider *</label>
                  <input
                    type="text"
                    required
                    value={editingServer.serverProvider || ''}
                    onChange={(e) => setEditingServer({ ...editingServer, serverProvider: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">IP Host Address *</label>
                  <input
                    type="text"
                    required
                    value={editingServer.ipAddress || ''}
                    onChange={(e) => setEditingServer({ ...editingServer, ipAddress: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Operating System</label>
                  <input
                    type="text"
                    value={editingServer.osType || ''}
                    onChange={(e) => setEditingServer({ ...editingServer, osType: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">SSH Username</label>
                  <input
                    type="text"
                    value={editingServer.username || ''}
                    onChange={(e) => setEditingServer({ ...editingServer, username: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">SSH Password</label>
                  <input
                    type="text"
                    value={editingServer.password || ''}
                    onChange={(e) => setEditingServer({ ...editingServer, password: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Annual Hosting Cost (₹)</label>
                  <input
                    type="number"
                    value={editingServer.annualHostingCost || 0}
                    onChange={(e) => setEditingServer({ ...editingServer, annualHostingCost: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">SSL Renewal Date</label>
                  <input
                    type="date"
                    value={editingServer.sslExpiryDate || ''}
                    onChange={(e) => setEditingServer({ ...editingServer, sslExpiryDate: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Remarks / Hosted Domains</label>
                <input
                  type="text"
                  value={editingServer.remarks || ''}
                  onChange={(e) => setEditingServer({ ...editingServer, remarks: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setEditingServer(null)} className="btn btn-secondary">
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
      {/* MODAL: ADD SERVER ENTRY                                                   */}
      {/* ========================================================================= */}
      {showAddServerModal && (
        <div className="modal-overlay" style={{ zIndex: 1000, padding: '16px' }}>
          <div className="modal-content" style={{ maxWidth: '560px', padding: '24px', background: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0 }}>Add Server Entry</h3>
              <button onClick={() => setShowAddServerModal(false)} className="btn btn-secondary" style={{ padding: '6px 8px' }}>
                <X style={{ width: '16px', height: '16px' }} />
              </button>
            </div>

            <form onSubmit={handleCreateServer} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Client Project *</label>
                  <input
                    type="text"
                    required
                    value={newServerForm.clientProject}
                    onChange={(e) => setNewServerForm({ ...newServerForm, clientProject: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Provider *</label>
                  <input
                    type="text"
                    required
                    value={newServerForm.serverProvider}
                    onChange={(e) => setNewServerForm({ ...newServerForm, serverProvider: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">IP Address *</label>
                  <input
                    type="text"
                    required
                    value={newServerForm.ipAddress}
                    onChange={(e) => setNewServerForm({ ...newServerForm, ipAddress: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">SSH User</label>
                  <input
                    type="text"
                    value={newServerForm.username}
                    onChange={(e) => setNewServerForm({ ...newServerForm, username: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddServerModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn gradient-btn-primary">
                  Save Server
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProjectDeliverablesHub;
