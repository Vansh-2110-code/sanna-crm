import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext';
import {
  Kanban,
  Plus,
  DollarSign,
  Calendar,
  User,
  Shield,
  Layers,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  AlertCircle,
  Sparkles,
  Building,
  Target,
  Clock,
  CheckCircle2,
  X
} from 'lucide-react';

const STAGES = [
  { id: 'Lead Intake', label: 'Lead Intake', color: '#60a5fa', prob: 20 },
  { id: 'Qualified', label: 'Qualified Opportunity', color: '#06b6d4', prob: 40 },
  { id: 'Need Analysis', label: 'Need Analysis', color: '#8b5cf6', prob: 55 },
  { id: 'Proposal Sent', label: 'Proposal Sent', color: '#f59e0b', prob: 70 },
  { id: 'Negotiation', label: 'Negotiation', color: '#ec4899', prob: 85 },
  { id: 'Won', label: 'Closed Won', color: '#10b981', prob: 100 },
  { id: 'Lost', label: 'Closed Lost', color: '#f43f5e', prob: 0 },
  { id: 'Not Interested', label: 'Not Interested', color: '#64748b', prob: 0 },
];

const normalizeStage = (stg) => {
  if (!stg) return 'Lead Intake';
  const s = String(stg).trim().toLowerCase();
  if (s === 'lead' || s === 'lead intake' || s === 'prospecting' || s === 'intake' || s === 'new') return 'Lead Intake';
  if (s === 'qualified' || s === 'qualification' || s === 'qualified opportunity') return 'Qualified';
  if (s === 'need analysis' || s === 'needs analysis' || s === 'analysis' || s === 'discovery') return 'Need Analysis';
  if (s === 'proposal sent' || s === 'proposal' || s === 'quote sent' || s === 'pitch') return 'Proposal Sent';
  if (s === 'negotiation' || s === 'negotiating' || s === 'contract' || s === 'review') return 'Negotiation';
  if (s === 'won' || s === 'closed won' || s === 'closed_won' || s === 'converted to order') return 'Won';
  if (s === 'lost' || s === 'closed lost' || s === 'closed_lost') return 'Lost';
  if (s === 'not interested' || s === 'junk' || s === 'unqualified') return 'Not Interested';
  return stg;
};

const KanbanBoard = () => {
  const { deals = [], leads = [], updateDealStage, updateLeadStatus, createDeal, employees = [], currentUser } = useCRM();

  // Get list of sales reps/employees for the active organization
  const availableReps = employees.length > 0 
    ? employees.map(e => e.name)
    : [currentUser?.name || 'Unassigned'];
    
  if (currentUser?.name && !availableReps.includes(currentUser.name)) {
    availableReps.unshift(currentUser.name);
  }

  // Unified deals source: use deals, or convert leads directly if deals is empty
  const safeDeals = (Array.isArray(deals) && deals.length > 0)
    ? deals
    : (Array.isArray(leads) ? leads.map(l => ({
        id: l.id,
        title: l.name || l.company,
        company: l.company || l.name,
        contactName: l.name,
        dealValue: parseFloat(l.potentialValue || l.value || 25000),
        probability: l.status === 'Won' ? 100 : l.status === 'Qualified' ? 40 : 25,
        stage: l.status || 'Lead Intake',
        pipelineId: 'pipe-enterprise',
        owner: l.assignedTo || 'Nikki',
        source: l.source,
        score: l.score || 80,
        expectedCloseDate: '2026-08-30'
      })) : []);

  const [activePipeline, setActivePipeline] = useState('pipe-enterprise');
  const [draggedDealId, setDraggedDealId] = useState(null);
  const [activeDropStage, setActiveDropStage] = useState(null);
  const [showAddDealModal, setShowAddDealModal] = useState(false);
  const [prefilledStage, setPrefilledStage] = useState('Lead Intake');

  const [newDealForm, setNewDealForm] = useState({
    title: '',
    company: '',
    contactName: '',
    dealValue: 25000,
    expectedCloseDate: '2026-08-30',
    owner: availableReps[0] || '',
    stage: 'Lead Intake',
    competitors: '',
    productsInterested: ''
  });

  // Calculate total weighted forecast revenue
  const totalWeightedForecast = safeDeals.reduce((sum, d) => {
    const stgNorm = normalizeStage(d?.stage);
    const prob = d?.probability !== undefined 
      ? parseFloat(d.probability) 
      : (STAGES.find(s => s.id === stgNorm)?.prob || 25);
    return sum + ((parseFloat(d?.dealValue || d?.potentialValue) || 0) * (prob / 100));
  }, 0);

  // Drag & Drop handlers
  const handleDragStart = (e, dealId) => {
    setDraggedDealId(dealId);
    e.dataTransfer.setData('text/plain', dealId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, stageId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (activeDropStage !== stageId) {
      setActiveDropStage(stageId);
    }
  };

  const handleDragLeave = (e, stageId) => {
    if (activeDropStage === stageId) {
      setActiveDropStage(null);
    }
  };

  const handleDrop = (e, targetStageId) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData('text/plain') || draggedDealId;
    if (dealId) {
      if (updateDealStage) updateDealStage(dealId, targetStageId);
      if (updateLeadStatus) updateLeadStatus(dealId, targetStageId);
    }
    setDraggedDealId(null);
    setActiveDropStage(null);
  };

  const handleOpenAddModal = (stageId = 'Lead Intake') => {
    setPrefilledStage(stageId);
    setNewDealForm(prev => ({ ...prev, stage: stageId }));
    setShowAddDealModal(true);
  };

  const handleAddDealSubmit = (e) => {
    e.preventDefault();
    if (!newDealForm.title || !newDealForm.company) return;

    createDeal({
      title: newDealForm.title,
      company: newDealForm.company,
      contactName: newDealForm.contactName || 'Lead Executive',
      pipelineId: activePipeline,
      stage: newDealForm.stage || prefilledStage,
      dealValue: parseFloat(newDealForm.dealValue) || 100000,
      expectedCloseDate: newDealForm.expectedCloseDate || '2026-08-30',
      owner: newDealForm.owner || availableReps[0],
      competitors: newDealForm.competitors ? newDealForm.competitors.split(',').map(c => c.trim()) : ['Direct'],
      productsInterested: newDealForm.productsInterested ? newDealForm.productsInterested.split(',').map(p => p.trim()) : ['Enterprise Suite'],
      lastActivity: 'Opportunity created on Kanban pipeline.'
    });

    setShowAddDealModal(false);
    setNewDealForm({
      title: '',
      company: '',
      contactName: '',
      dealValue: 120000,
      expectedCloseDate: '2026-08-30',
      owner: availableReps[0] || 'Alex Rivera',
      stage: 'Lead Intake',
      competitors: '',
      productsInterested: ''
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '24px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: '#c084fc', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles style={{ width: '14px', height: '14px' }} />
            Visual Sales Pipeline & Opportunity Kanban
          </div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: '900', margin: '4px 0 6px', color: 'var(--text-primary)' }}>
            Sales Pipeline Kanban Board
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
            Drag and drop deals across stages to dynamically compute win probability & forecast expected revenue yield.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Pipeline Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-primary)', padding: '6px 12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <Layers style={{ width: '15px', height: '15px', color: '#60a5fa' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)' }}>Pipeline:</span>
            <select
              value={activePipeline}
              onChange={(e) => setActivePipeline(e.target.value)}
              className="form-select"
              style={{ fontSize: '0.8rem', border: 'none', background: 'transparent', padding: '2px 6px' }}
            >
              <option value="pipe-enterprise">Enterprise Hardware & Cloud</option>
              <option value="pipe-smb">SMB Retail Direct Pipeline</option>
              <option value="pipe-renewal">Annual Renewal & Upsell</option>
            </select>
          </div>

          <button
            onClick={() => handleOpenAddModal('Lead Intake')}
            className="btn gradient-btn-primary"
            style={{ borderRadius: '10px', padding: '9px 16px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus style={{ width: '16px', height: '16px' }} />
            <span>New Opportunity</span>
          </button>
        </div>
      </div>

      {/* Weighted Revenue Forecast Banner */}
      <div
        className="saas-card"
        style={{
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
          background: 'linear-gradient(135deg, rgba(17, 21, 35, 0.95) 0%, rgba(13, 16, 28, 0.98) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 12px 35px -8px rgba(0, 0, 0, 0.7), 0 0 25px -5px rgba(99, 102, 241, 0.15)'
        }}
      >
        {/* Left: Main Forecast Metric */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(139, 92, 246, 0.2) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.25)',
            flexShrink: 0
          }}>
            <TrendingUp style={{ color: '#818cf8', width: '26px', height: '26px' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                WEIGHTED PIPELINE FORECAST
              </span>
              <span className="status-pill status-pill-indigo" style={{ fontSize: '0.62rem', padding: '1px 6px' }}>
                Probability Adjusted
              </span>
            </div>
            <div className="tabular-nums" style={{ fontSize: '1.75rem', fontWeight: '900', color: '#ffffff', marginTop: '2px', letterSpacing: '-0.02em', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span>${Math.round(totalWeightedForecast).toLocaleString()}</span>
              <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-muted)' }}>USD</span>
            </div>
          </div>
        </div>

        {/* Right: Metric Stat Capsules */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Total Pipeline Capsule */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '10px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            minWidth: '150px'
          }}>
            <span style={{ fontSize: '0.68rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              TOTAL PIPELINE
            </span>
            <span className="tabular-nums" style={{ fontSize: '1.1rem', fontWeight: '800', color: '#ffffff' }}>
              ${safeDeals.reduce((sum, d) => sum + (parseFloat(d?.dealValue) || 0), 0).toLocaleString()}
            </span>
          </div>

          {/* Active Deals Capsule */}
          <div style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '12px',
            padding: '10px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            minWidth: '160px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
              <span style={{ fontSize: '0.68rem', fontWeight: '800', color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                ACTIVE OPPORTUNITIES
              </span>
            </div>
            <span className="tabular-nums" style={{ fontSize: '1.1rem', fontWeight: '800', color: '#34d399' }}>
              {safeDeals.filter(d => d && d.stage !== 'Won' && d.stage !== 'Lost').length} Active Deals
            </span>
          </div>
        </div>
      </div>

      {/* Kanban Board Columns Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${STAGES.length}, minmax(285px, 1fr))`,
        gap: '16px',
        overflowX: 'auto',
        paddingBottom: '20px'
      }}>
        {STAGES.map((stage, sIdx) => {
          const stageDeals = safeDeals.filter(d => d && normalizeStage(d.stage) === stage.id && (d.pipelineId === activePipeline || !d.pipelineId));
          const stageTotalValue = stageDeals.reduce((sum, d) => sum + (parseFloat(d?.dealValue) || 0), 0);
          const isDropTarget = activeDropStage === stage.id;

          return (
            <div
              key={stage.id}
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragLeave={(e) => handleDragLeave(e, stage.id)}
              onDrop={(e) => handleDrop(e, stage.id)}
              style={{
                background: isDropTarget ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-secondary)',
                border: isDropTarget ? '1.5px dashed #6366f1' : '1px solid var(--border-color)',
                borderRadius: '14px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                minHeight: '560px',
                boxShadow: isDropTarget ? '0 0 25px rgba(99, 102, 241, 0.25)' : 'var(--shadow-card)',
                transition: 'all 0.15s ease'
              }}
            >
              {/* Column Sticky Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: stage.color, boxShadow: `0 0 8px ${stage.color}` }} />
                  <h4 style={{ fontSize: '0.84rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>{stage.label}</h4>
                </div>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: '800',
                  color: 'var(--text-secondary)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  border: '1px solid var(--border-subtle)'
                }}>
                  {stageDeals.length}
                </span>
              </div>

              {/* Column Total Value Strip */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                <span>Yield Total:</span>
                <span className="tabular-nums" style={{ color: '#34d399', fontWeight: '800', fontSize: '0.8rem' }}>
                  ${stageTotalValue.toLocaleString()}
                </span>
              </div>

              {/* Inline Quick Add Opportunity Button */}
              <button
                onClick={() => handleOpenAddModal(stage.id)}
                style={{
                  width: '100%',
                  padding: '6px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px dashed rgba(255, 255, 255, 0.08)',
                  color: 'var(--text-muted)',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <Plus style={{ width: '13px', height: '13px' }} />
                <span>Add deal</span>
              </button>

              {/* Deal Cards Container */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                {stageDeals.length === 0 ? (
                  <div style={{
                    padding: '28px 14px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '0.75rem',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.01)',
                    border: '1px dashed rgba(255, 255, 255, 0.04)'
                  }}>
                    Drop deals here
                  </div>
                ) : (
                  stageDeals.map(deal => {
                    const prob = deal.probability !== undefined ? deal.probability : stage.prob;

                    return (
                      <div
                        key={deal.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, deal.id)}
                        className="saas-card-interactive"
                        style={{
                          padding: '14px',
                          cursor: 'grab',
                          background: '#151926',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          userSelect: 'none'
                        }}
                      >
                        {/* Company & Move Arrows */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: '800' }}>
                            {deal.company}
                          </span>

                          <div style={{ display: 'flex', gap: '4px' }}>
                            {sIdx > 0 && (
                              <button
                                onClick={() => {
                                  if (updateDealStage) updateDealStage(deal.id, STAGES[sIdx - 1].id);
                                  if (updateLeadStatus) updateLeadStatus(deal.id, STAGES[sIdx - 1].id);
                                }}
                                title={`Move to ${STAGES[sIdx - 1].label}`}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                              >
                                <ChevronLeft style={{ width: '13px', height: '13px' }} />
                              </button>
                            )}
                            {sIdx < STAGES.length - 1 && (
                              <button
                                onClick={() => {
                                  if (updateDealStage) updateDealStage(deal.id, STAGES[sIdx + 1].id);
                                  if (updateLeadStatus) updateLeadStatus(deal.id, STAGES[sIdx + 1].id);
                                }}
                                title={`Move to ${STAGES[sIdx + 1].label}`}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                              >
                                <ChevronRight style={{ width: '13px', height: '13px' }} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Title */}
                        <div style={{ fontSize: '0.88rem', fontWeight: '800', marginBottom: '10px', color: '#ffffff', lineHeight: 1.3 }}>
                          {deal.title}
                        </div>

                        {/* Deal Value & Win Probability Badge */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span className="tabular-nums" style={{ fontSize: '1.05rem', fontWeight: '900', color: '#34d399' }}>
                            ${(deal.dealValue || 0).toLocaleString()}
                          </span>
                          <span className="status-pill status-pill-indigo" style={{ fontSize: '0.65rem' }}>
                            {prob}% Prob
                          </span>
                        </div>

                        {/* Probability Progress Meter Bar */}
                        <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px', overflow: 'hidden', marginBottom: '10px' }}>
                          <div style={{
                            width: `${prob}%`,
                            height: '100%',
                            background: prob >= 70 ? '#10b981' : prob >= 40 ? '#f59e0b' : '#60a5fa',
                            borderRadius: '2px'
                          }} />
                        </div>

                        {/* Metadata Footer */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', paddingTop: '6px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Calendar style={{ width: '12px', height: '12px' }} />
                            <span>{deal.expectedCloseDate || 'End of Month'}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <User style={{ width: '12px', height: '12px', color: '#a78bfa' }} />
                            <span>{(deal.owner || 'Rep').split(' ')[0]}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Deal / Opportunity Modal */}
      {showAddDealModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '26px', maxWidth: '520px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Kanban style={{ color: '#818cf8', width: '20px', height: '20px' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0 }}>Create Sales Opportunity</h3>
              </div>
              <button onClick={() => setShowAddDealModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X style={{ width: '18px', height: '18px' }} />
              </button>
            </div>

            <form onSubmit={handleAddDealSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Deal / Opportunity Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 500-Seat SaaS Renewal or Cloud Migration"
                  value={newDealForm.title}
                  onChange={(e) => setNewDealForm({ ...newDealForm, title: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Organization Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Corp"
                    value={newDealForm.company}
                    onChange={(e) => setNewDealForm({ ...newDealForm, company: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Person</label>
                  <input
                    type="text"
                    placeholder="e.g. Jane Doe"
                    value={newDealForm.contactName}
                    onChange={(e) => setNewDealForm({ ...newDealForm, contactName: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Deal Value ($ USD)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="120000"
                    value={newDealForm.dealValue}
                    onChange={(e) => setNewDealForm({ ...newDealForm, dealValue: e.target.value })}
                    className="form-input tabular-nums"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Target Close Date</label>
                  <input
                    type="date"
                    value={newDealForm.expectedCloseDate}
                    onChange={(e) => setNewDealForm({ ...newDealForm, expectedCloseDate: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Lifecycle Stage</label>
                  <select
                    value={newDealForm.stage}
                    onChange={(e) => setNewDealForm({ ...newDealForm, stage: e.target.value })}
                    className="form-select"
                  >
                    {STAGES.map(stg => (
                      <option key={stg.id} value={stg.id}>{stg.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Assigned Representative</label>
                  <select
                    value={newDealForm.owner}
                    onChange={(e) => setNewDealForm({ ...newDealForm, owner: e.target.value })}
                    className="form-select"
                  >
                    {availableReps.map(rep => (
                      <option key={rep} value={rep}>{rep}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddDealModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn gradient-btn-primary">
                  Create Opportunity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default KanbanBoard;
