import React, { useState, useMemo } from 'react';
import { useCRM } from '../../context/CRMContext';
import { useQueryClient } from '@tanstack/react-query';
import {
  Film,
  Image,
  Eye,
  TrendingUp,
  Users,
  Search,
  Award,
  Calendar,
  RefreshCw,
  LogOut,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  MessageSquare,
  LifeBuoy,
  Plus,
  FileText,
  ShieldCheck,
  Layers,
  ArrowUpRight,
  BarChart2,
  Globe,
  Share2,
  X
} from 'lucide-react';
import QuotePreviewModal from '../quotes/QuotePreviewModal';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const CustomerDashboard = ({ onNavigate }) => {
  const {
    currentUser,
    logout,
    deliverables = [],
    clients = [],
    allClients = [],
    tickets = [],
    createTicket,
    quotes = [],
    theme
  } = useCRM();

  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRaiseModal, setShowRaiseModal] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'deliverables' | 'support' | 'quotes'

  // New Ticket Form State
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Digital Marketing Campaign');
  const [priority, setPriority] = useState('Medium');
  const [description, setDescription] = useState('');

  // Determine if logged-in user is a real external customer or an admin previewing
  const isRealCustomer = currentUser?.roleId === 'role-customer' ||
    currentUser?.role === 'Customer' ||
    currentUser?.role === 'Customer / Portal User';

  // Extract client company name from user profile
  const rawCompanyName = (
    currentUser?.company && currentUser.company !== 'Sanna Innovations Pvt Ltd'
      ? currentUser.company
      : (currentUser?.name || '')
  ).replace(/\(Client\)/gi, '').trim();

  // For Admin preview, allow selecting any client; for real client, strictly lock
  const [previewClientName, setPreviewClientName] = useState(rawCompanyName || 'Alis');
  const activeClientName = isRealCustomer ? (rawCompanyName || 'Alis') : previewClientName;

  // Selected Month filter: 'all' or month number (1-12)
  const currentMonthNum = new Date().getMonth() + 1;
  const [selectedMonth, setSelectedMonth] = useState('all');

  // Trigger Live Refresh from Backend
  const handleLiveRefresh = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['mis_deliverables'] });
      await queryClient.invalidateQueries({ queryKey: ['clients'] });
    } catch (e) {
      console.warn('Live refresh notice:', e.message);
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  // Helper to match client name robustly (case-insensitive, trimmed, partial match)
  const isMatchingClient = (candidateName, targetName) => {
    if (!candidateName || !targetName) return false;
    const a = String(candidateName).toLowerCase().trim();
    const b = String(targetName).toLowerCase().trim();
    return a === b || a.includes(b) || b.includes(a);
  };

  // Filter deliverables strictly for the active client
  const clientDeliverables = useMemo(() => {
    if (!Array.isArray(deliverables)) return [];
    return deliverables.filter(d => isMatchingClient(d.clientName || d.projectName, activeClientName));
  }, [deliverables, activeClientName]);

  // Month-filtered deliverables
  const displayDeliverables = useMemo(() => {
    if (selectedMonth === 'all') return clientDeliverables;
    return clientDeliverables.filter(d => {
      const m = parseInt(d.month, 10);
      return m === parseInt(selectedMonth, 10);
    });
  }, [clientDeliverables, selectedMonth]);

  // Client project info from client directory
  const clientProject = useMemo(() => {
    const list = Array.isArray(clients) && clients.length > 0 ? clients : allClients;
    return list.find(c => isMatchingClient(c.name || c.client_name, activeClientName)) || null;
  }, [clients, allClients, activeClientName]);

  // Aggregate Metrics across the filtered deliverables
  const metrics = useMemo(() => {
    let plannedReels = 0;
    let deliveredReels = 0;
    let plannedPosts = 0;
    let deliveredPosts = 0;
    let backlinks = 0;
    let keywords = 0;
    let latestViews = '';
    let latestViewGain = '';
    let latestFollowers = '';
    let latestFollowerGain = '';
    let latestGmb = '';

    displayDeliverables.forEach(d => {
      plannedReels += parseInt(d.reelsPlanned || 0, 10);
      deliveredReels += parseInt(d.reelsDelivered || 0, 10);
      plannedPosts += parseInt(d.postsPlanned || 0, 10);
      deliveredPosts += parseInt(d.postsDelivered || 0, 10);
      backlinks += parseInt(d.backlinksCreated || d.backlinks || 0, 10);
      keywords += parseInt(d.keywordsInjected || d.keywords || 0, 10);

      if (d.viewsReached || d.views) latestViews = d.viewsReached || d.views;
      if (d.viewGain) latestViewGain = d.viewGain;
      if (d.totalFollowers || d.followers) latestFollowers = d.totalFollowers || d.followers;
      if (d.followerGain) latestFollowerGain = d.followerGain;
      if (d.gmbPosition || d.gmbPos) latestGmb = d.gmbPosition || d.gmbPos;
    });

    const reelsCompletion = plannedReels > 0 ? Math.min(100, Math.round((deliveredReels / plannedReels) * 100)) : (deliveredReels > 0 ? 100 : 0);
    const postsCompletion = plannedPosts > 0 ? Math.min(100, Math.round((deliveredPosts / plannedPosts) * 100)) : (deliveredPosts > 0 ? 100 : 0);

    return {
      plannedReels,
      deliveredReels,
      reelsCompletion,
      plannedPosts,
      deliveredPosts,
      postsCompletion,
      backlinks,
      keywords,
      latestViews: latestViews || '0',
      latestViewGain,
      latestFollowers: latestFollowers || '0',
      latestFollowerGain,
      latestGmb: latestGmb || 'Optimized'
    };
  }, [displayDeliverables]);

  // Available client names for Admin preview switcher
  const availableClients = useMemo(() => {
    const names = new Set();
    deliverables.forEach(d => {
      if (d.clientName) names.add(d.clientName);
    });
    const list = Array.isArray(clients) && clients.length > 0 ? clients : allClients;
    list.forEach(c => {
      if (c.name) names.add(c.name);
    });
    return Array.from(names).sort();
  }, [deliverables, clients, allClients]);

  // Filter support tickets strictly for this client
  const customerTickets = useMemo(() => {
    return tickets.filter(t =>
      isMatchingClient(t.customerName, activeClientName) ||
      (currentUser?.email && t.contactEmail && t.contactEmail.toLowerCase() === currentUser.email.toLowerCase())
    );
  }, [tickets, activeClientName, currentUser]);

  // Filter quotes strictly for this client
  const customerQuotes = useMemo(() => {
    return quotes.filter(q =>
      isMatchingClient(q.customerName, activeClientName) ||
      (currentUser?.email && q.contactEmail && q.contactEmail.toLowerCase() === currentUser.email.toLowerCase())
    );
  }, [quotes, activeClientName, currentUser]);

  const handleRaiseTicket = (e) => {
    e.preventDefault();
    if (!subject || !description) return;

    createTicket({
      subject,
      category,
      priority,
      description,
      customerName: activeClientName,
      contactPerson: currentUser?.name || activeClientName,
      contactEmail: currentUser?.email || '',
      phone: ''
    });

    setSubject('');
    setDescription('');
    setShowRaiseModal(false);
    alert('Support request submitted successfully. Your dedicated account manager has been notified.');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '24px 32px' }}>
      
      {/* Top Admin Preview Banner (Rendered only when Admin is previewing, never visible to real clients) */}
      {!isRealCustomer && (
        <div style={{
          background: 'rgba(99, 102, 241, 0.12)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: '8px',
          padding: '10px 16px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem' }}>
            <span style={{ fontWeight: '800', color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Admin Customer Portal Preview
            </span>
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <span style={{ color: 'var(--text-secondary)' }}>
              Viewing live client perspective as:
            </span>
            <select
              value={previewClientName}
              onChange={(e) => setPreviewClientName(e.target.value)}
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                color: '#ffffff',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '0.82rem',
                fontWeight: '700',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {availableClients.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {onNavigate && (
            <button
              onClick={() => onNavigate('deliverables')}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '5px 12px' }}
            >
              Return to Internal CRM Matrix
            </button>
          )}
        </div>
      )}

      {/* Main Top Header */}
      <div className="glass-panel" style={{
        padding: '20px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(255, 255, 255, 0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: '#ffffff',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
            flexShrink: 0
          }}>
            <img
              src="/logo.png"
              alt="Sanna Innovations"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.72rem', color: '#818cf8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Client Growth & Deliverables Hub
              </span>
              <span style={{
                fontSize: '0.68rem',
                padding: '2px 8px',
                borderRadius: '9999px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                Real-Time Sync Active
              </span>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '900', margin: '2px 0', letterSpacing: '-0.02em' }}>
              {activeClientName}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: 0 }}>
              Authorized Portal • Managed Campaign Services • Ongoing Deliverables Tracker
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleLiveRefresh}
            title="Refresh Deliverables from Matrix"
            className="btn btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              fontSize: '0.78rem',
              fontWeight: '700'
            }}
          >
            <RefreshCw style={{
              width: '14px',
              height: '14px',
              animation: isRefreshing ? 'spin 0.6s linear infinite' : 'none'
            }} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Live Data'}</span>
          </button>

          <button
            onClick={logout}
            className="btn btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              fontSize: '0.78rem',
              fontWeight: '700'
            }}
          >
            <LogOut style={{ width: '14px', height: '14px' }} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Month & Period Filter Bar */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '10px',
        padding: '10px 16px',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginRight: '4px' }}>
            Reporting Period:
          </span>
          <button
            onClick={() => setSelectedMonth('all')}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '0.75rem',
              fontWeight: '700',
              cursor: 'pointer',
              background: selectedMonth === 'all' ? '#6366f1' : 'rgba(255, 255, 255, 0.05)',
              color: selectedMonth === 'all' ? '#ffffff' : 'var(--text-secondary)'
            }}
          >
            All Cycles ({clientDeliverables.length})
          </button>
          {[6, 7, 8, 9, 10, 11, 12].map(m => {
            const hasData = clientDeliverables.some(d => parseInt(d.month, 10) === m);
            return (
              <button
                key={m}
                onClick={() => setSelectedMonth(m)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  background: selectedMonth === m ? '#6366f1' : hasData ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                  color: selectedMonth === m ? '#ffffff' : hasData ? '#818cf8' : 'var(--text-muted)'
                }}
              >
                {MONTH_NAMES[m - 1]}
              </button>
            );
          })}
        </div>

        {/* View Switcher Tabs */}
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(0, 0, 0, 0.25)', padding: '3px', borderRadius: '8px' }}>
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              padding: '5px 14px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '0.75rem',
              fontWeight: '700',
              cursor: 'pointer',
              background: activeTab === 'overview' ? '#6366f1' : 'transparent',
              color: activeTab === 'overview' ? '#ffffff' : 'var(--text-secondary)'
            }}
          >
            Performance Overview
          </button>
          <button
            onClick={() => setActiveTab('deliverables')}
            style={{
              padding: '5px 14px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '0.75rem',
              fontWeight: '700',
              cursor: 'pointer',
              background: activeTab === 'deliverables' ? '#6366f1' : 'transparent',
              color: activeTab === 'deliverables' ? '#ffffff' : 'var(--text-secondary)'
            }}
          >
            Tasks & Deliverables Log
          </button>
          <button
            onClick={() => setActiveTab('support')}
            style={{
              padding: '5px 14px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '0.75rem',
              fontWeight: '700',
              cursor: 'pointer',
              background: activeTab === 'support' ? '#6366f1' : 'transparent',
              color: activeTab === 'support' ? '#ffffff' : 'var(--text-secondary)'
            }}
          >
            Support Requests ({customerTickets.length})
          </button>
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Top Performance Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
            
            {/* Card 1: Reels Delivered */}
            <div className="glass-card" style={{
              padding: '18px 20px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase' }}>
                  Reels Delivered
                </span>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(236, 72, 153, 0.12)', color: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Film style={{ width: '16px', height: '16px' }} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.8rem', fontWeight: '900', color: '#ffffff' }}>
                  {metrics.deliveredReels}
                </span>
                <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: '700' }}>
                  / {metrics.plannedReels} Planned
                </span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '9999px', overflow: 'hidden' }}>
                <div style={{
                  width: `${metrics.reelsCompletion}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #ec4899, #f43f5e)',
                  borderRadius: '9999px'
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                <span>Completion</span>
                <span style={{ fontWeight: '800', color: '#ec4899' }}>{metrics.reelsCompletion}%</span>
              </div>
            </div>

            {/* Card 2: Posts Delivered */}
            <div className="glass-card" style={{
              padding: '18px 20px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase' }}>
                  Posts Delivered
                </span>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.12)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Image style={{ width: '16px', height: '16px' }} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.8rem', fontWeight: '900', color: '#ffffff' }}>
                  {metrics.deliveredPosts}
                </span>
                <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: '700' }}>
                  / {metrics.plannedPosts} Planned
                </span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '9999px', overflow: 'hidden' }}>
                <div style={{
                  width: `${metrics.postsCompletion}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #6366f1, #38bdf8)',
                  borderRadius: '9999px'
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                <span>Completion</span>
                <span style={{ fontWeight: '800', color: '#818cf8' }}>{metrics.postsCompletion}%</span>
              </div>
            </div>

            {/* Card 3: Reach & Video Views */}
            <div className="glass-card" style={{
              padding: '18px 20px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase' }}>
                  Audience Reach & Views
                </span>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.12)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Eye style={{ width: '16px', height: '16px' }} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.8rem', fontWeight: '900', color: '#ffffff' }}>
                  {metrics.latestViews}
                </span>
              </div>
              {metrics.latestViewGain ? (
                <div style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <TrendingUp style={{ width: '12px', height: '12px' }} />
                  <span>+{metrics.latestViewGain} Net View Gain</span>
                </div>
              ) : (
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Total Impressions Tracked
                </div>
              )}
            </div>

            {/* Card 4: Followers Growth */}
            <div className="glass-card" style={{
              padding: '18px 20px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase' }}>
                  Follower Growth
                </span>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users style={{ width: '16px', height: '16px' }} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.8rem', fontWeight: '900', color: '#ffffff' }}>
                  {metrics.latestFollowers}
                </span>
              </div>
              {metrics.latestFollowerGain ? (
                <div style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <TrendingUp style={{ width: '12px', height: '12px' }} />
                  <span>+{metrics.latestFollowerGain} New Followers</span>
                </div>
              ) : (
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Community Audience Size
                </div>
              )}
            </div>

            {/* Card 5: SEO Keywords & Backlinks */}
            <div className="glass-card" style={{
              padding: '18px 20px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase' }}>
                  SEO & Search Authority
                </span>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Globe style={{ width: '16px', height: '16px' }} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: '800', color: '#ffffff' }}>
                  {metrics.keywords}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Keywords</span>
                <span style={{ color: 'var(--text-muted)' }}>•</span>
                <span style={{ fontSize: '1.2rem', fontWeight: '800', color: '#ffffff' }}>
                  {metrics.backlinks}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Backlinks</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                GMB Status: <strong style={{ color: '#34d399' }}>{metrics.latestGmb}</strong>
              </div>
            </div>

          </div>

          {/* Deliverables Overview Table */}
          <div className="glass-panel" style={{
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(255, 255, 255, 0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: '0 0 4px 0' }}>
                  Campaign Performance & Deliverables Schedule
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                  Real-time synchronization with Sanna Innovations Digital Marketing Execution Matrix.
                </p>
              </div>

              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '700' }}>
                Showing {displayDeliverables.length} cycle(s)
              </span>
            </div>

            {displayDeliverables.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                <Layers style={{ width: '42px', height: '42px', margin: '0 auto 12px auto', opacity: 0.4 }} />
                <p style={{ fontSize: '0.88rem' }}>No deliverables logged for this specific period yet.</p>
                <button onClick={() => setSelectedMonth('all')} className="btn btn-secondary" style={{ fontSize: '0.75rem', marginTop: '8px' }}>
                  Show All Deliverables
                </button>
              </div>
            ) : (
              <div className="custom-table-container" style={{ overflowX: 'auto' }}>
                <table className="custom-table" style={{ width: '100%', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'left' }}>
                      <th style={{ padding: '10px 12px', fontWeight: '800', color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Cycle / Period</th>
                      <th style={{ padding: '10px 12px', fontWeight: '800', color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Service Scope</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '800', color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Reels</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '800', color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Posts</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '800', color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Views Reached</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '800', color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Followers</th>
                      <th style={{ padding: '10px 12px', fontWeight: '800', color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Campaign Remarks & Highlights</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '800', color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayDeliverables.map((deliv, idx) => {
                      const mNum = parseInt(deliv.month, 10);
                      const monthLabel = !isNaN(mNum) && mNum >= 1 && mNum <= 12 ? MONTH_NAMES[mNum - 1] : `Cycle ${deliv.month || idx + 1}`;
                      const yearLabel = deliv.year || '2026';
                      const reelsDone = parseInt(deliv.reelsDelivered || 0, 10);
                      const reelsTarget = parseInt(deliv.reelsPlanned || 0, 10);
                      const postsDone = parseInt(deliv.postsDelivered || 0, 10);
                      const postsTarget = parseInt(deliv.postsPlanned || 0, 10);
                      const viewsText = deliv.viewsReached || deliv.views || '—';
                      const followersText = deliv.totalFollowers || deliv.followers || '—';
                      const remarksText = deliv.achievement || deliv.remarks || deliv.otherRemarks || deliv.approvalPendingRemarks || 'Deliverables scheduled and progressing per plan.';

                      return (
                        <tr key={deliv.id || idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                          <td style={{ padding: '12px' }}>
                            <div style={{ fontWeight: '800', color: '#ffffff' }}>
                              {monthLabel} {yearLabel}
                            </div>
                            {deliv.deliveryDate && (
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                Due: {deliv.deliveryDate}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              background: 'rgba(99, 102, 241, 0.1)',
                              color: '#818cf8',
                              fontWeight: '700',
                              fontSize: '0.75rem'
                            }}>
                              {deliv.service || 'Social Media Management'}
                            </span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <div style={{ fontWeight: '800', color: reelsDone >= reelsTarget && reelsTarget > 0 ? '#34d399' : '#ffffff' }}>
                              {reelsDone} / {reelsTarget}
                            </div>
                            {reelsTarget > 0 && (
                              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                {Math.round((reelsDone / reelsTarget) * 100)}%
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <div style={{ fontWeight: '800', color: postsDone >= postsTarget && postsTarget > 0 ? '#34d399' : '#ffffff' }}>
                              {postsDone} / {postsTarget}
                            </div>
                            {postsTarget > 0 && (
                              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                {Math.round((postsDone / postsTarget) * 100)}%
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center', fontWeight: '700' }}>
                            <div>{viewsText}</div>
                            {deliv.viewGain && (
                              <div style={{ fontSize: '0.68rem', color: '#34d399' }}>+{deliv.viewGain}</div>
                            )}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center', fontWeight: '700' }}>
                            <div>{followersText}</div>
                            {deliv.followerGain && (
                              <div style={{ fontSize: '0.68rem', color: '#34d399' }}>+{deliv.followerGain}</div>
                            )}
                          </td>
                          <td style={{ padding: '12px', maxWidth: '320px' }}>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                              {remarksText}
                            </div>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '6px',
                              background: 'rgba(16, 185, 129, 0.12)',
                              color: '#34d399',
                              border: '1px solid rgba(16, 185, 129, 0.25)',
                              fontSize: '0.7rem',
                              fontWeight: '700'
                            }}>
                              Active Execution
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Account Governance & Dedicated Contacts Card */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px'
          }}>
            <div className="glass-panel" style={{
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(255, 255, 255, 0.02)'
            }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: '800', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck style={{ width: '18px', height: '18px', color: '#34d399' }} />
                <span>Account Governance & Confidentiality</span>
              </h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 12px 0' }}>
                Your client portal is securely encrypted with dedicated organization credentials. You have direct visibility into all ongoing digital marketing production, reels, posts, search rankings, and audience reach.
              </p>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Client Organization: <strong style={{ color: '#ffffff' }}>{activeClientName}</strong>
                {clientProject?.onboarded_date && (
                  <span> • Partner Since: <strong style={{ color: '#818cf8' }}>{clientProject.onboarded_date}</strong></span>
                )}
              </div>
            </div>

            <div className="glass-panel" style={{
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(255, 255, 255, 0.02)'
            }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: '800', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare style={{ width: '18px', height: '18px', color: '#818cf8' }} />
                <span>Dedicated Agency Representative</span>
              </h4>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div>Agency: <strong>Sanna Innovations Pvt Ltd</strong></div>
                <div>Digital Marketing Lead: <strong>Priya / Mohana (Content Specialist)</strong></div>
                <div>Support Email: <strong>support@sannainnovations.com</strong></div>
              </div>
              <button
                onClick={() => setShowRaiseModal(true)}
                className="btn gradient-btn-primary"
                style={{
                  marginTop: '12px',
                  padding: '6px 14px',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Plus style={{ width: '14px', height: '14px' }} />
                <span>Submit Query to Account Manager</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* DELIVERABLES TAB */}
      {activeTab === 'deliverables' && (
        <div className="glass-panel" style={{
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: '0 0 4px 0' }}>
            Full Task & Deliverables Breakdown
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Chronological log of delivered creative assets, reels, graphics, and performance indicators.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {displayDeliverables.map((deliv, idx) => {
              const mNum = parseInt(deliv.month, 10);
              const monthLabel = !isNaN(mNum) && mNum >= 1 && mNum <= 12 ? MONTH_NAMES[mNum - 1] : `Cycle ${deliv.month || idx + 1}`;
              const reelsDone = parseInt(deliv.reelsDelivered || 0, 10);
              const reelsTarget = parseInt(deliv.reelsPlanned || 0, 10);
              const postsDone = parseInt(deliv.postsDelivered || 0, 10);
              const postsTarget = parseInt(deliv.postsPlanned || 0, 10);

              return (
                <div key={deliv.id || idx} className="glass-card" style={{
                  padding: '18px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  background: 'rgba(255, 255, 255, 0.03)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <h4 style={{ margin: '0 0 2px 0', fontSize: '1rem', fontWeight: '800', color: '#ffffff' }}>
                        {monthLabel} {deliv.year || '2026'}
                      </h4>
                      <span style={{ fontSize: '0.72rem', color: '#818cf8', fontWeight: '700' }}>
                        {deliv.service || 'Digital Marketing Service'}
                      </span>
                    </div>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.68rem',
                      fontWeight: '700',
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#34d399'
                    }}>
                      Ongoing
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px', background: 'rgba(0, 0, 0, 0.2)', padding: '10px', borderRadius: '8px' }}>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Reels Delivered</div>
                      <div style={{ fontSize: '1rem', fontWeight: '800', color: '#ffffff' }}>
                        {reelsDone} / {reelsTarget}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Posts Delivered</div>
                      <div style={{ fontSize: '1rem', fontWeight: '800', color: '#ffffff' }}>
                        {postsDone} / {postsTarget}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Views / Reach</div>
                      <div style={{ fontSize: '1rem', fontWeight: '800', color: '#ffffff' }}>
                        {deliv.viewsReached || deliv.views || '—'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Followers</div>
                      <div style={{ fontSize: '1rem', fontWeight: '800', color: '#ffffff' }}>
                        {deliv.totalFollowers || deliv.followers || '—'}
                      </div>
                    </div>
                  </div>

                  {(deliv.achievement || deliv.remarks || deliv.otherRemarks || deliv.approvalPendingRemarks) && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4, borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '8px' }}>
                      <strong>Progress Notes:</strong> {deliv.achievement || deliv.remarks || deliv.otherRemarks || deliv.approvalPendingRemarks}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUPPORT TAB */}
      {activeTab === 'support' && (
        <div className="glass-panel" style={{
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: '0 0 4px 0' }}>
                Account Queries & Support Requests
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Direct communication channel with your Sanna Innovations account team.
              </p>
            </div>
            <button
              onClick={() => setShowRaiseModal(true)}
              className="btn gradient-btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '0.8rem' }}
            >
              <Plus style={{ width: '16px', height: '16px' }} />
              <span>Raise Support Request</span>
            </button>
          </div>

          {customerTickets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <LifeBuoy style={{ width: '44px', height: '44px', margin: '0 auto 12px auto', opacity: 0.4 }} />
              <p style={{ fontSize: '0.9rem' }}>No open support queries filed. Need assistance or campaign revisions?</p>
              <button onClick={() => setShowRaiseModal(true)} className="btn btn-secondary" style={{ fontSize: '0.75rem', marginTop: '8px' }}>
                Submit New Request
              </button>
            </div>
          ) : (
            <div className="custom-table-container">
              <table className="custom-table" style={{ width: '100%', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'left' }}>
                    <th style={{ padding: '10px 12px', fontWeight: '800', color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Subject</th>
                    <th style={{ padding: '10px 12px', fontWeight: '800', color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Category</th>
                    <th style={{ padding: '10px 12px', fontWeight: '800', color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Priority</th>
                    <th style={{ padding: '10px 12px', fontWeight: '800', color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '10px 12px', fontWeight: '800', color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Last Update</th>
                  </tr>
                </thead>
                <tbody>
                  {customerTickets.map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: '800', color: '#ffffff' }}>{t.subject}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ID: {t.id}</div>
                      </td>
                      <td style={{ padding: '12px' }}>{t.category}</td>
                      <td style={{ padding: '12px' }}>
                        <span className="badge" style={{
                          background: t.priority === 'High' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                          color: t.priority === 'High' ? '#f87171' : '#818cf8',
                          fontSize: '0.72rem'
                        }}>
                          {t.priority}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span className="badge" style={{
                          background: t.status === 'Resolved' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: t.status === 'Resolved' ? '#34d399' : '#fbbf24',
                          fontSize: '0.72rem'
                        }}>
                          {t.status || 'In Progress'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                        {t.lastUpdated || 'Just now'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* RAISE SUPPORT TICKET MODAL */}
      {showRaiseModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '24px', maxWidth: '500px', background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: '0 0 2px 0' }}>Submit Campaign Query</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                  Contact your dedicated marketing team regarding post plans or reviews.
                </p>
              </div>
              <button
                onClick={() => setShowRaiseModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X style={{ width: '18px', height: '18px' }} />
              </button>
            </div>

            <form onSubmit={handleRaiseTicket} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: '700' }}>Subject / Request Title</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Inquire about next reel script"
                  className="form-input"
                  style={{ fontSize: '0.8rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: '700' }}>Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="form-select"
                    style={{ fontSize: '0.8rem' }}
                  >
                    <option value="Digital Marketing Campaign">Digital Marketing</option>
                    <option value="Reel Script Approval">Reel Script Approval</option>
                    <option value="SEO & Rankings">SEO & Rankings</option>
                    <option value="General Query">General Query</option>
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: '700' }}>Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="form-select"
                    style={{ fontSize: '0.8rem' }}
                  >
                    <option value="Low">Low - Normal</option>
                    <option value="Medium">Medium - Important</option>
                    <option value="High">High - Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: '700' }}>Description</label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide any details, links, or notes for the team."
                  className="form-input"
                  style={{ minHeight: '90px', fontSize: '0.8rem', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowRaiseModal(false)}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '7px 16px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn gradient-btn-primary"
                  style={{ fontSize: '0.8rem', padding: '7px 18px' }}
                >
                  Send Query
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quote Preview Modal */}
      {selectedQuote && (
        <QuotePreviewModal quote={selectedQuote} onClose={() => setSelectedQuote(null)} />
      )}

    </div>
  );
};

export default CustomerDashboard;
