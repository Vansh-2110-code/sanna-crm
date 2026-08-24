import React, { useState, useMemo } from 'react';
import { useCRM } from '../../context/CRMContext';
import ProjectDeliverablesHub from './ProjectDeliverablesHub';
import ClientDirectory from './ClientDirectory';
import {
  FolderKanban,
  CheckCircle2,
  DollarSign,
  Calendar,
  User,
  Building2,
  Building,
  Search,
  Filter,
  TrendingUp,
  Clock,
  Star,
  ChevronRight,
  BarChart3,
  Award,
  Layers,
  ArrowUpRight,
  Target,
  Trash2
} from 'lucide-react';

const STATUS_OPTIONS = ['All', 'In Progress', 'On Hold', 'Delivered'];

const getProjectStatus = (deal) => {
  if (deal.projectStatus) return deal.projectStatus;
  // Default to 'In Progress' for won deals without explicit project status
  return 'In Progress';
};

const getStatusStyle = (status) => {
  switch (status) {
    case 'In Progress':
      return { bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' };
    case 'On Hold':
      return { bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' };
    case 'Delivered':
    case 'Completed':
      return { bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: 'rgba(16, 185, 129, 0.3)' };
    default:
      return { bg: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: 'rgba(99, 102, 241, 0.3)' };
  }
};

// Stable progress values using deal id hash (no re-render jitter)
const stableProgress = (deal) => {
  let hash = 0;
  for (let i = 0; i < deal.id.length; i++) {
    hash = ((hash << 5) - hash) + deal.id.charCodeAt(i);
    hash |= 0;
  }
  return (Math.abs(hash) % 50) + 35; // 35-85%
};

const getProgressValue = (deal) => {
  if (deal.projectProgress !== undefined && deal.projectProgress !== null) {
    return parseInt(deal.projectProgress, 10);
  }
  return stableProgress(deal);
};

const OngoingProjects = () => {
  const { deals = [], orders = [], clients = [], allClients = [], deliverables = [], updateDeal, deleteDeal, currentUser } = useCRM();

  const [moduleView, setModuleView] = useState('client_directory'); // 'client_directory' | 'projects' | 'deliverables_hub'
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedProject, setSelectedProject] = useState(null);

  const clientList = (Array.isArray(clients) && clients.length > 0) ? clients : (Array.isArray(allClients) ? allClients : []);

  const handleUpdateStatus = async (dealId, newStatus) => {
    try {
      if (updateDeal) {
        const target = (deals || []).find(d => d.id === dealId || `deal-${d.id}` === dealId) || selectedProject;
        await updateDeal(dealId, {
          company: target?.company,
          title: target?.title,
          dealValue: target?.dealValue,
          projectStatus: newStatus
        });
        if (selectedProject && (selectedProject.id === dealId || `deal-${selectedProject.id}` === dealId)) {
          setSelectedProject(prev => ({ ...prev, projectStatus: newStatus }));
        }
      }
    } catch (err) {
      console.error("Error updating project status:", err);
      alert("Failed to update status: " + (err.response?.data?.error || err.message));
    }
  };

  const handleUpdateProgress = async (dealId, newProgress) => {
    const val = Math.min(100, Math.max(0, parseInt(newProgress, 10) || 0));
    try {
      if (updateDeal) {
        const target = (deals || []).find(d => d.id === dealId || `deal-${d.id}` === dealId) || selectedProject;
        await updateDeal(dealId, {
          company: target?.company,
          title: target?.title,
          dealValue: target?.dealValue,
          projectProgress: val
        });
        if (selectedProject && (selectedProject.id === dealId || `deal-${selectedProject.id}` === dealId)) {
          setSelectedProject(prev => ({ ...prev, projectProgress: val }));
        }
      }
    } catch (err) {
      console.error("Error updating project progress:", err);
      alert("Failed to update progress: " + (err.response?.data?.error || err.message));
    }
  };

  const handleUpdateDeadline = async (dealId, newDeadline) => {
    try {
      if (updateDeal) {
        const target = (deals || []).find(d => d.id === dealId || `deal-${d.id}` === dealId) || selectedProject;
        await updateDeal(dealId, {
          company: target?.company,
          title: target?.title,
          dealValue: target?.dealValue,
          projectDeadline: newDeadline
        });
        if (selectedProject && (selectedProject.id === dealId || `deal-${selectedProject.id}` === dealId)) {
          setSelectedProject(prev => ({ ...prev, projectDeadline: newDeadline }));
        }
      }
    } catch (err) {
      console.error("Error updating deadline:", err);
      alert("Failed to update deadline: " + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteProject = async (dealId, e) => {
    if (e) e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      try {
        if (deleteDeal) {
          await deleteDeal(dealId);
          if (selectedProject && (selectedProject.id === dealId || `deal-${selectedProject.id}` === dealId)) {
            setSelectedProject(null);
          }
        }
      } catch (err) {
        console.error("Error deleting project:", err);
        alert("Failed to delete project: " + (err.response?.data?.error || err.message));
      }
    }
  };

  // All 7 Closed Won ongoing deals auto-populate here
  const wonDeals = useMemo(() => {
    return (deals || []).filter(d => {
      const isWon = d.stage === 'Won' || d.stage === 'Closed Won';
      const status = getProjectStatus(d);
      return isWon && status !== 'Delivered' && status !== 'Completed';
    });
  }, [deals]);

  // Helper to compute revenue received per deal from orders
  const getProjectRevenueStats = (deal) => {
    const projectOrders = (orders || []).filter(o => 
      (o.dealId && (o.dealId === deal.id || o.dealId === deal.clientId)) || 
      (o.customerName && deal.company && o.customerName.toLowerCase().trim() === deal.company.toLowerCase().trim())
    );

    const revenueReceived = projectOrders.reduce((sum, o) => {
      const totalVal = parseFloat(o.grandTotal || o.totalValue || o.totalAmount || 0);
      const paidAmt = parseFloat(o.paidAmount);
      const statusStr = (o.status || '').toLowerCase();
      const payStatusStr = (o.paymentStatus || '').toLowerCase();

      if (statusStr === 'paid' || statusStr === 'completed' || statusStr === 'shipped' || payStatusStr === 'paid') {
        return sum + ((!isNaN(paidAmt) && paidAmt > 0) ? paidAmt : totalVal);
      }
      if (!isNaN(paidAmt) && paidAmt > 0) {
        return sum + paidAmt;
      }
      if (statusStr.includes('partial') || payStatusStr.includes('partial')) {
        const remaining = parseFloat(o.remainingAmount);
        if (!isNaN(remaining) && remaining < totalVal) {
          return sum + Math.max(0, totalVal - remaining);
        }
      }
      return sum;
    }, 0);

    const totalCost = parseFloat(deal.dealValue) || 0;
    const remainingRevenue = Math.max(0, totalCost - revenueReceived);
    const collectionPercent = totalCost > 0 ? Math.min(100, Math.round((revenueReceived / totalCost) * 100)) : 0;

    return {
      revenueReceived,
      remainingRevenue,
      totalCost,
      collectionPercent,
      invoicesCount: projectOrders.length
    };
  };

  const filteredProjects = useMemo(() => {
    return wonDeals.filter(deal => {
      const matchesSearch =
        !search ||
        deal.title?.toLowerCase().includes(search.toLowerCase()) ||
        deal.company?.toLowerCase().includes(search.toLowerCase()) ||
        deal.owner?.toLowerCase().includes(search.toLowerCase());

      const projectStatus = getProjectStatus(deal);
      const matchesStatus = filterStatus === 'All' || projectStatus === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [wonDeals, search, filterStatus]);

  // Summary stats
  const totalValue = wonDeals.reduce((sum, d) => sum + (d.dealValue || 0), 0);
  const totalRevenueCollected = wonDeals.reduce((sum, d) => sum + getProjectRevenueStats(d).revenueReceived, 0);
  const totalRemainingRevenue = Math.max(0, totalValue - totalRevenueCollected);
  const inProgressCount = wonDeals.filter(d => getProjectStatus(d) === 'In Progress').length;
  const avgProgress = wonDeals.length
    ? Math.round(wonDeals.reduce((sum, d) => sum + getProgressValue(d), 0) / wonDeals.length)
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 style={{ width: '14px', height: '14px' }} />
            Auto-populated from Closed Won Deals
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '900', margin: '6px 0 4px', background: 'linear-gradient(135deg, #fff 0%, #34d399 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Ongoing Projects
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
            Track project deliverables, received revenue, and <strong style={{ color: '#fbbf24' }}>remaining project revenue to be collected</strong>.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {/* KPI chips */}
          <div style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '12px', padding: '12px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: '900', color: '#34d399' }}>{wonDeals.length}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Total Projects</div>
          </div>
          <div style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '12px', padding: '12px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: '900', color: '#60a5fa' }}>{inProgressCount}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>In Progress</div>
          </div>
          <div style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '12px', padding: '12px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: '900', color: '#fbbf24' }}>${totalRemainingRevenue.toLocaleString()}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Remaining Rev</div>
          </div>
          <div style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '12px', padding: '12px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: '900', color: '#c084fc' }}>{avgProgress}%</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Avg Completion</div>
          </div>
        </div>
      </div>

      {/* Module Navigation Switcher */}
      <div className="glass-card" style={{ padding: '8px 12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setModuleView('client_directory')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '8px',
            background: moduleView === 'client_directory' ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(168, 85, 247, 0.15) 100%)' : 'transparent',
            border: moduleView === 'client_directory' ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
            color: moduleView === 'client_directory' ? '#818cf8' : 'var(--text-secondary)',
            fontWeight: moduleView === 'client_directory' ? '700' : '500',
            fontSize: '0.85rem',
            cursor: 'pointer'
          }}
        >
          <Building style={{ width: '16px', height: '16px' }} />
          <span>Client Directory (MIS All Clients)</span>
        </button>

        <button
          onClick={() => setModuleView('projects')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '8px',
            background: moduleView === 'projects' ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(168, 85, 247, 0.15) 100%)' : 'transparent',
            border: moduleView === 'projects' ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
            color: moduleView === 'projects' ? '#818cf8' : 'var(--text-secondary)',
            fontWeight: moduleView === 'projects' ? '700' : '500',
            fontSize: '0.85rem',
            cursor: 'pointer'
          }}
        >
          <FolderKanban style={{ width: '16px', height: '16px' }} />
          <span>Projects & Revenue Milestones</span>
        </button>

        <button
          onClick={() => setModuleView('deliverables_hub')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '8px',
            background: moduleView === 'deliverables_hub' ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(168, 85, 247, 0.15) 100%)' : 'transparent',
            border: moduleView === 'deliverables_hub' ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
            color: moduleView === 'deliverables_hub' ? '#818cf8' : 'var(--text-secondary)',
            fontWeight: moduleView === 'deliverables_hub' ? '700' : '500',
            fontSize: '0.85rem',
            cursor: 'pointer'
          }}
        >
          <Layers style={{ width: '16px', height: '16px' }} />
          <span>Deliverables, Ad Spend & Operations Hub</span>
        </button>
      </div>

      {moduleView === 'client_directory' ? (
        <ClientDirectory />
      ) : moduleView === 'deliverables_hub' ? (
        <ProjectDeliverablesHub />
      ) : (
        <>
      {/* Filter Bar */}
      <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '240px' }}>
          <Search style={{ width: '16px', height: '16px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search projects by title, company, owner..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="form-input"
            style={{ width: '100%', fontSize: '0.85rem' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter style={{ width: '14px', height: '14px', color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700' }}>Status:</span>
          {STATUS_OPTIONS.map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: '700',
                cursor: 'pointer',
                border: filterStatus === status ? '1px solid #34d399' : '1px solid var(--border-color)',
                background: filterStatus === status ? 'rgba(16,185,129,0.18)' : 'var(--bg-input)',
                color: filterStatus === status ? '#34d399' : 'var(--text-secondary)',
                transition: 'all 0.15s ease'
              }}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Layers style={{ width: '44px', height: '44px', opacity: 0.4, marginBottom: '12px' }} />
          <h4 style={{ fontSize: '1.1rem', fontWeight: '800', margin: '0 0 6px', color: 'var(--text-primary)' }}>No Ongoing Projects Found</h4>
          <p style={{ fontSize: '0.85rem', margin: 0 }}>
            {wonDeals.length === 0
              ? 'Move deals to "Won" or "Closed Won" in the Sales Pipeline to auto-populate projects here.'
              : 'No projects match your current search or status filter.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {filteredProjects.map(deal => {
            const status = getProjectStatus(deal);
            const statusStyle = getStatusStyle(status);
            const progress = getProgressValue(deal);
            const revStats = getProjectRevenueStats(deal);

            return (
              <div
                key={deal.id}
                className="glass-card"
                onClick={() => setSelectedProject(deal)}
                style={{
                  padding: '20px',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  border: '1px solid var(--border-color)',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.border = '1px solid rgba(52,211,153,0.4)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(16,185,129,0.12)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.border = '1px solid var(--border-color)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Top accent bar */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #34d399, #818cf8)' }} />

                {/* Won Badge */}
                <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
                  <span style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.35)', color: '#34d399', fontSize: '0.65rem', fontWeight: '800', padding: '3px 8px', borderRadius: '20px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 style={{ width: '10px', height: '10px' }} /> Won
                  </span>
                </div>

                {/* Company */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', marginTop: '4px' }}>
                  <div style={{ background: 'rgba(99,102,241,0.15)', borderRadius: '8px', padding: '6px' }}>
                    <Building2 style={{ width: '14px', height: '14px', color: '#818cf8' }} />
                  </div>
                  <span style={{ fontSize: '0.78rem', color: '#818cf8', fontWeight: '700' }}>{deal.company}</span>
                </div>

                {/* Title */}
                <h3 style={{ fontSize: '0.98rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '14px', lineHeight: 1.3, paddingRight: '60px' }}>
                  {deal.title}
                </h3>

                {/* Meta info & Revenue Breakdown */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    <User style={{ width: '12px', height: '12px', color: 'var(--text-muted)' }} />
                    <span>Owner: <strong style={{ color: 'var(--text-primary)' }}>{deal.owner || 'Unassigned'}</strong></span>
                  </div>

                  {/* Revenue Card Summary Box */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px 12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.75rem' }}>
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>Total Cost</div>
                      <div style={{ fontWeight: '800', color: '#38bdf8' }}>${(revStats.totalCost).toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>Rev Collected</div>
                      <div style={{ fontWeight: '800', color: '#34d399' }}>${(revStats.revenueReceived).toLocaleString()}</div>
                    </div>
                    <div style={{ gridColumn: 'span 2', borderTop: '1px solid var(--border-color)', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#fbbf24', fontWeight: '700', fontSize: '0.7rem' }}>Remaining Revenue to Come:</span>
                      <span style={{ fontWeight: '900', color: '#fbbf24', fontSize: '0.85rem' }}>${(revStats.remainingRevenue).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Project Deliverable Progress</span>
                    <span style={{ fontSize: '0.78rem', fontWeight: '900', color: '#34d399' }}>{progress}%</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--bg-input)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${progress}%`,
                      background: 'linear-gradient(90deg, #10b981, #34d399)',
                      borderRadius: '99px',
                      transition: 'width 0.6s ease'
                    }} />
                  </div>
                </div>

                {/* Footer: status + open + delete */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <select
                    value={status}
                    onClick={e => e.stopPropagation()}
                    onChange={e => handleUpdateStatus(deal.id, e.target.value)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '20px',
                      background: statusStyle.bg,
                      color: statusStyle.color,
                      border: `1px solid ${statusStyle.border}`,
                      fontSize: '0.72rem',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="In Progress" style={{ background: '#1e293b', color: '#fff' }}>In Progress</option>
                    <option value="On Hold" style={{ background: '#1e293b', color: '#fff' }}>On Hold</option>
                    <option value="Delivered" style={{ background: '#1e293b', color: '#fff' }}>Delivered</option>
                  </select>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteProject(deal.id, e)}
                      style={{
                        background: 'rgba(244, 63, 94, 0.12)',
                        border: '1px solid rgba(244, 63, 94, 0.3)',
                        color: '#f43f5e',
                        borderRadius: '8px',
                        padding: '4px 8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease'
                      }}
                      title="Delete Project"
                    >
                      <Trash2 style={{ width: '13px', height: '13px' }} />
                    </button>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      View Details <ChevronRight style={{ width: '12px', height: '12px' }} />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Project Detail Modal */}
      {selectedProject && (
        <div className="modal-overlay" onClick={() => setSelectedProject(null)}>
          <div className="modal-content" style={{ padding: '0', maxWidth: '620px', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{ padding: '24px 28px', background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(99,102,241,0.1) 100%)', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 style={{ width: '12px', height: '12px' }} />
                    Ongoing Project · {selectedProject.company}
                  </div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: '900', margin: '0 0 4px', color: 'var(--text-primary)' }}>
                    {selectedProject.title}
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Pipeline: <strong>{selectedProject.pipelineId || 'Enterprise'}</strong>
                  </p>
                </div>
                <button
                  onClick={() => setSelectedProject(null)}
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.8rem', flexShrink: 0 }}
                >
                  ✕ Close
                </button>
              </div>
            </div>

            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Key metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                {[
                  { label: 'Deal Value', value: `$${(selectedProject.dealValue || 0).toLocaleString()}`, color: '#34d399' },
                  { label: 'Win Probability', value: `${selectedProject.probability || 100}%`, color: '#818cf8' },
                  { label: 'Progress', value: `${getProgressValue(selectedProject)}%`, color: '#60a5fa' },
                ].map(m => (
                  <div key={m.label} style={{ background: 'var(--bg-input)', borderRadius: '10px', padding: '12px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: '900', color: m.color }}>{m.value}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', marginTop: '2px' }}>{m.label}</div>
                  </div>
                ))}
              </div>

              {/* Details & Target Deadline Editor */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.83rem' }}>
                <div style={{ background: 'var(--bg-input)', borderRadius: '10px', padding: '12px', border: '1px solid var(--border-color)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>Deal Owner</div>
                  <div style={{ fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User style={{ width: '14px', height: '14px', color: '#818cf8' }} />
                    {selectedProject.owner || 'Unassigned'}
                  </div>
                </div>
                <div style={{ background: 'var(--bg-input)', borderRadius: '10px', padding: '12px', border: '1px solid var(--border-color)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>Target Deadline</div>
                  <div style={{ fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar style={{ width: '14px', height: '14px', color: '#34d399' }} />
                    <input
                      type="date"
                      value={selectedProject.projectDeadline || selectedProject.expectedCloseDate || ''}
                      onChange={e => handleUpdateDeadline(selectedProject.id, e.target.value)}
                      className="form-input"
                      style={{ padding: '2px 6px', fontSize: '0.8rem', width: 'auto', border: '1px solid var(--border-color)' }}
                    />
                  </div>
                </div>
              </div>

              {/* Completion Progress Slider */}
              <div style={{ background: 'var(--bg-input)', borderRadius: '10px', padding: '14px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Edit Completion Progress</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={getProgressValue(selectedProject)}
                      onChange={e => handleUpdateProgress(selectedProject.id, e.target.value)}
                      className="form-input"
                      style={{ width: '60px', padding: '2px 6px', fontSize: '0.85rem', fontWeight: '900', color: '#34d399', textAlign: 'center' }}
                    />
                    <span style={{ fontSize: '0.85rem', fontWeight: '900', color: '#34d399' }}>%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={getProgressValue(selectedProject)}
                  onChange={e => handleUpdateProgress(selectedProject.id, e.target.value)}
                  style={{ width: '100%', cursor: 'pointer', accentColor: '#34d399' }}
                />
              </div>

              {/* Update status buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Project Status:</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {STATUS_OPTIONS.filter(s => s !== 'All').map(s => {
                    const ss = getStatusStyle(s);
                    const isCurrentStatus = getProjectStatus(selectedProject) === s;
                    return (
                      <button
                        key={s}
                        onClick={() => handleUpdateStatus(selectedProject.id, s)}
                        style={{
                          padding: '5px 14px',
                          borderRadius: '20px',
                          border: isCurrentStatus ? `1px solid ${ss.border}` : '1px solid var(--border-color)',
                          background: isCurrentStatus ? ss.bg : 'var(--bg-input)',
                          color: isCurrentStatus ? ss.color : 'var(--text-secondary)',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Products interested */}
              {selectedProject.productsInterested?.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>Products / Services</div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {selectedProject.productsInterested.map((p, i) => (
                      <span key={i} style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', fontSize: '0.75rem', fontWeight: '700', padding: '4px 12px', borderRadius: '20px' }}>
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Last activity */}
              {selectedProject.lastActivity && (
                <div style={{ background: 'var(--bg-input)', borderRadius: '10px', padding: '12px', border: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Last Activity: </span>
                  {selectedProject.lastActivity}
                </div>
              )}

              {/* Danger Zone / Delete Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '14px', borderTop: '1px solid var(--border-color)' }}>
                <button
                  type="button"
                  onClick={() => handleDeleteProject(selectedProject.id)}
                  className="btn"
                  style={{
                    background: 'rgba(244, 63, 94, 0.15)',
                    color: '#f43f5e',
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.8rem',
                    fontWeight: '700'
                  }}
                >
                  <Trash2 style={{ width: '14px', height: '14px' }} /> Delete Project
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
};

export default OngoingProjects;
