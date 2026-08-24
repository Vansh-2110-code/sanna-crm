import React, { useState, useEffect } from 'react';
import { useCRM } from '../../context/CRMContext';
import exportToCSV from '../../utils/csvExporter';
import {
  Users,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Flame,
  UserCheck,
  Mail,
  Phone,
  Building,
  CheckCircle2,
  DollarSign,
  Tag,
  Package,
  Trash2,
  FileText,
  Edit3,
  X,
  FileSpreadsheet,
  Download,
  MoreVertical,
  ChevronRight,
  ExternalLink,
  CheckSquare,
  Square,
  Sparkles,
  ArrowRight,
  Clock,
  Shield,
  Layers
} from 'lucide-react';
import { safeToISODate } from '../../utils/dateUtils';
import LeadFormModal from './LeadFormModal';

const LeadList = () => {
  const { leads = [], updateLeadStatus, deleteLead, updateLeadNotes, globalSearch = '' } = useCRM();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSource, setSelectedSource] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  
  // Selection & Bulk Action state
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);
  
  // Dropdown menu state
  const [activeDropdownLeadId, setActiveDropdownLeadId] = useState(null);

  // Slide-Over Drawer state
  const [inspectedLead, setInspectedLead] = useState(null);
  
  // Notes Edit Modal state
  const [editingNotesLead, setEditingNotesLead] = useState(null);
  const [notesDraft, setNotesDraft] = useState('');

  const safeLeadsList = Array.isArray(leads) ? leads : [];

  // Close dropdown on outside click
  useEffect(() => {
    const handleWindowClick = () => setActiveDropdownLeadId(null);
    window.addEventListener('click', handleWindowClick);
    return () => window.removeEventListener('click', handleWindowClick);
  }, []);

  // Close slide-over on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (inspectedLead) setInspectedLead(null);
        if (activeDropdownLeadId) setActiveDropdownLeadId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inspectedLead, activeDropdownLeadId]);

  const filteredLeads = safeLeadsList.filter(l => {
    if (!l) return false;
    const normStatus = (!l.status || l.status === 'Lead') ? 'Lead Intake' : l.status;
    const matchesSource = selectedSource === 'ALL' || l.source === selectedSource;
    const matchesStatus = selectedStatus === 'ALL' || normStatus === selectedStatus;
    const sTerm = (globalSearch || '').trim().toLowerCase();
    const matchesSearch = !sTerm ||
                          (l.name || '').toLowerCase().includes(sTerm) ||
                          (l.company || '').toLowerCase().includes(sTerm) ||
                          (l.email || '').toLowerCase().includes(sTerm) ||
                          (l.phone || '').toLowerCase().includes(sTerm) ||
                          (l.productNeeded || '').toLowerCase().includes(sTerm);
    return matchesSource && matchesStatus && matchesSearch;
  });

  const duplicateCount = safeLeadsList.filter(l => l && l.duplicateFlag).length;

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedLeadIds(filteredLeads.map(l => l.id));
    } else {
      setSelectedLeadIds([]);
    }
  };

  const handleToggleSelectLead = (id, e) => {
    e.stopPropagation();
    setSelectedLeadIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleExportCSV = (exportSelectedOnly = false) => {
    const listToExport = exportSelectedOnly 
      ? filteredLeads.filter(l => selectedLeadIds.includes(l.id))
      : filteredLeads;

    let csv = `Lead ID,Name,Email,Phone,Company,Status,Source,Score,Assigned Rep,Estimated Value ($),Notes\n`;
    listToExport.forEach(l => {
      csv += `"${l.id || ''}","${l.name || ''}","${l.email || ''}","${l.phone || ''}","${l.company || ''}","${l.status || 'Lead Intake'}","${l.source || 'Direct'}",${l.score || 50},"${l.assignedTo || ''}",${l.potentialValue || l.value || 0},"${(l.notes || '').replace(/"/g, '""')}"\n`;
    });

    exportToCSV(csv, `AstraCRM_Leads_Export_${safeToISODate(new Date())}.csv`);
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete all ${selectedLeadIds.length} selected leads?`)) {
      if (deleteLead) {
        for (const id of selectedLeadIds) {
          await deleteLead(id);
        }
      }
      setSelectedLeadIds([]);
    }
  };

  const handleBulkStatusChange = async (newStatus) => {
    if (updateLeadStatus) {
      for (const id of selectedLeadIds) {
        await updateLeadStatus(id, newStatus);
      }
    }
    setSelectedLeadIds([]);
  };

  const handleOpenNotes = (lead, e) => {
    if (e) e.stopPropagation();
    setEditingNotesLead(lead);
    setNotesDraft(lead.notes || '');
  };

  const handleSaveNotes = async () => {
    if (editingNotesLead) {
      if (updateLeadNotes) {
        await updateLeadNotes(editingNotesLead.id, notesDraft);
      }
      if (inspectedLead && inspectedLead.id === editingNotesLead.id) {
        setInspectedLead(prev => ({ ...prev, notes: notesDraft }));
      }
      setEditingNotesLead(null);
    }
  };

  const handleDeleteLeadClick = async (lead, e) => {
    if (e) e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete lead "${lead.name || 'this lead'}"?`)) {
      if (deleteLead) {
        await deleteLead(lead.id);
      }
      if (inspectedLead?.id === lead.id) setInspectedLead(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '24px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles style={{ width: '14px', height: '14px' }} />
            Omnichannel Lead Pipeline & Scoring
          </div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: '900', margin: '4px 0 6px', color: 'var(--text-primary)' }}>
            Lead Management Directory ({safeLeadsList.length})
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
            Unified enterprise pipeline tracking inbound leads, hot scores, opportunity values, and assignments.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => handleExportCSV(false)}
            className="btn btn-secondary"
            style={{ padding: '9px 14px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Download style={{ width: '14px', height: '14px' }} />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn gradient-btn-primary"
            style={{ padding: '9px 18px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus style={{ width: '15px', height: '15px' }} />
            <span>Capture New Lead</span>
          </button>
        </div>
      </div>

      {/* Duplicate Alert Banner if duplicate exists */}
      {duplicateCount > 0 && (
        <div style={{
          padding: '14px 20px',
          borderRadius: '12px',
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <AlertTriangle style={{ color: '#fbbf24', width: '20px', height: '20px' }} />
          <div>
            <div style={{ fontWeight: '800', color: '#fbbf24', fontSize: '0.88rem' }}>
              Duplicate Leads Detected ({duplicateCount} Flagged)
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Matching email touchpoints detected in pipeline. Inspect flagged rows to merge or clean records.
            </div>
          </div>
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="saas-card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Filter style={{ width: '15px', height: '15px', color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)' }}>Source:</span>
          
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="form-select"
            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
          >
            <option value="ALL">All Sources</option>
            <option value="Website Forms">Website Forms</option>
            <option value="Social Media">Social Media</option>
            <option value="Email Campaigns">Email Campaigns</option>
            <option value="Referral">Referrals</option>
            <option value="Manual Entry">Manual Entry</option>
          </select>

          <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', marginLeft: '8px' }}>Stage:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="form-select"
            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
          >
            <option value="ALL">All Lifecycle Stages</option>
            <option value="Lead Intake">Lead Intake</option>
            <option value="Qualified">Qualified</option>
            <option value="Need Analysis">Need Analysis</option>
            <option value="Proposal Sent">Proposal Sent</option>
            <option value="Negotiation">Negotiation</option>
            <option value="Won">Won</option>
            <option value="Lost">Lost</option>
            <option value="Not Interested">Not Interested</option>
          </select>
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Showing <strong>{filteredLeads.length}</strong> matching records
        </div>
      </div>

      {/* Leads Table */}
      <div className="saas-card" style={{ padding: '0px', overflow: 'hidden' }}>
        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={filteredLeads.length > 0 && selectedLeadIds.length === filteredLeads.length}
                    onChange={handleSelectAll}
                    style={{ cursor: 'pointer', accentColor: '#6366f1' }}
                  />
                </th>
                <th>Lead & Organization</th>
                <th>Score</th>
                <th>Source</th>
                <th>Potential Value</th>
                <th>Assigned Rep</th>
                <th>Stage Status</th>
                <th style={{ textAlign: 'right', paddingRight: '20px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No matching leads found. Adjust your filters or click "Capture New Lead".
                  </td>
                </tr>
              ) : (
                filteredLeads.map(lead => {
                  const isSelected = selectedLeadIds.includes(lead.id);
                  const isDropdownOpen = activeDropdownLeadId === lead.id;

                  return (
                    <tr
                      key={lead.id}
                      onClick={() => setInspectedLead(lead)}
                      style={{
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(99, 102, 241, 0.08)' : undefined
                      }}
                    >
                      {/* Checkbox */}
                      <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleToggleSelectLead(lead.id, e)}
                          style={{ cursor: 'pointer', accentColor: '#6366f1' }}
                        />
                      </td>

                      {/* Lead & Company */}
                      <td>
                        <div style={{ fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{lead.name}</span>
                          {lead.duplicateFlag && (
                            <span className="status-pill status-pill-amber" style={{ fontSize: '0.62rem', padding: '1px 6px' }}>
                              DUP
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                          <span><Building style={{ width: '12px', height: '12px', display: 'inline', marginRight: '3px' }} />{lead.company}</span>
                          <span>•</span>
                          <span><Mail style={{ width: '12px', height: '12px', display: 'inline', marginRight: '3px' }} />{lead.email}</span>
                        </div>
                      </td>

                      {/* Score */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Flame style={{ width: '16px', height: '16px', color: lead.score >= 80 ? '#f43f5e' : lead.score >= 60 ? '#fbbf24' : '#60a5fa' }} />
                          <span className="tabular-nums" style={{ fontWeight: '800', fontSize: '0.88rem', color: lead.score >= 80 ? '#f43f5e' : lead.score >= 60 ? '#fbbf24' : '#60a5fa' }}>
                            {lead.score}/100
                          </span>
                        </div>
                      </td>

                      {/* Source */}
                      <td>
                        <span className="status-pill status-pill-indigo">
                          {lead.source || 'Direct'}
                        </span>
                      </td>

                      {/* Potential Value */}
                      <td>
                        <span className="tabular-nums" style={{ fontWeight: '800', color: '#34d399', fontSize: '0.92rem' }}>
                          ${(lead.potentialValue || lead.value || 0).toLocaleString()}
                        </span>
                      </td>

                      {/* Assigned Rep */}
                      <td>
                        <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                          {lead.assignedTo || 'Unassigned'}
                        </span>
                      </td>

                      {/* Stage Status */}
                      <td onClick={(e) => e.stopPropagation()}>
                        <select
                          value={(!lead.status || lead.status === 'Lead') ? 'Lead Intake' : lead.status}
                          onChange={(e) => updateLeadStatus && updateLeadStatus(lead.id, e.target.value)}
                          className="form-select"
                          style={{
                            fontSize: '0.75rem',
                            padding: '4px 8px',
                            fontWeight: '700',
                            borderRadius: '8px',
                            color: lead.status === 'Won' ? '#34d399' :
                                   lead.status === 'Lost' ? '#fb7185' :
                                   lead.status === 'Not Interested' ? '#94a3b8' :
                                   lead.status === 'Proposal Sent' ? '#fbbf24' :
                                   lead.status === 'Negotiation' ? '#f472b6' :
                                   lead.status === 'Qualified' ? '#38bdf8' : '#818cf8',
                            background: 'rgba(255, 255, 255, 0.04)'
                          }}
                        >
                          <option value="Lead Intake">Lead Intake</option>
                          <option value="Qualified">Qualified</option>
                          <option value="Need Analysis">Need Analysis</option>
                          <option value="Proposal Sent">Proposal Sent</option>
                          <option value="Negotiation">Negotiation</option>
                          <option value="Won">Won</option>
                          <option value="Lost">Lost</option>
                          <option value="Not Interested">Not Interested</option>
                        </select>
                      </td>

                      {/* Clean Actions: Primary Button + Dropdown */}
                      <td style={{ textAlign: 'right', paddingRight: '16px' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', position: 'relative' }}>
                          <button
                            onClick={() => setInspectedLead(lead)}
                            className="btn btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                          >
                            Inspect
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdownLeadId(isDropdownOpen ? null : lead.id);
                            }}
                            className="btn btn-secondary"
                            style={{ padding: '4px 6px', fontSize: '0.75rem' }}
                            title="More options"
                          >
                            <MoreVertical style={{ width: '14px', height: '14px' }} />
                          </button>

                          {/* Dropdown Menu */}
                          {isDropdownOpen && (
                            <div className="saas-dropdown">
                              <button
                                onClick={() => { setActiveDropdownLeadId(null); handleOpenNotes(lead); }}
                                className="saas-dropdown-item"
                              >
                                <FileText style={{ width: '14px', height: '14px', color: '#60a5fa' }} />
                                <span>Edit Activity Notes</span>
                              </button>
                              <button
                                onClick={() => { setActiveDropdownLeadId(null); setInspectedLead(lead); }}
                                className="saas-dropdown-item"
                              >
                                <ExternalLink style={{ width: '14px', height: '14px', color: '#818cf8' }} />
                                <span>View Full Profile</span>
                              </button>
                              <button
                                onClick={() => { setActiveDropdownLeadId(null); handleDeleteLeadClick(lead); }}
                                className="saas-dropdown-item danger"
                              >
                                <Trash2 style={{ width: '14px', height: '14px', color: '#f43f5e' }} />
                                <span>Delete Record</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedLeadIds.length > 0 && (
        <div className="floating-bulk-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              background: '#6366f1',
              color: '#fff',
              fontSize: '0.75rem',
              fontWeight: '800',
              padding: '2px 8px',
              borderRadius: '9999px'
            }}>
              {selectedLeadIds.length}
            </span>
            <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#fff' }}>Leads Selected</span>
          </div>

          <div style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,0.15)' }} />

          <button
            onClick={() => handleExportCSV(true)}
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
          >
            <Download style={{ width: '13px', height: '13px' }} />
            <span>Export Selected</span>
          </button>

          <button
            onClick={() => handleBulkStatusChange('Qualified')}
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.78rem', color: '#34d399' }}
          >
            <CheckCircle2 style={{ width: '13px', height: '13px' }} />
            <span>Mark Qualified</span>
          </button>

          <button
            onClick={handleBulkDelete}
            className="btn btn-danger"
            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
          >
            <Trash2 style={{ width: '13px', height: '13px' }} />
            <span>Delete Selected</span>
          </button>

          <button
            onClick={() => setSelectedLeadIds([])}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.78rem', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Clear
          </button>
        </div>
      )}

      {/* Slide-Over Inspection Side Drawer */}
      {inspectedLead && (
        <div className="slide-over-backdrop" onClick={() => setInspectedLead(null)}>
          <div className="slide-over-panel" onClick={(e) => e.stopPropagation()}>
            
            {/* Drawer Header */}
            <div style={{
              padding: '24px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              background: 'rgba(255, 255, 255, 0.02)'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span className="status-pill status-pill-indigo">{inspectedLead.source || 'Direct'}</span>
                  <span className="status-pill status-pill-emerald">Score: {inspectedLead.score}/100</span>
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#ffffff', margin: 0 }}>
                  {inspectedLead.name}
                </h3>
                <div style={{ fontSize: '0.85rem', color: '#818cf8', fontWeight: '700', marginTop: '2px' }}>
                  {inspectedLead.company}
                </div>
              </div>

              <button
                onClick={() => setInspectedLead(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'var(--text-secondary)',
                  borderRadius: '8px',
                  padding: '6px',
                  cursor: 'pointer'
                }}
              >
                <X style={{ width: '18px', height: '18px' }} />
              </button>
            </div>

            {/* Drawer Body Content */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
              
              {/* Key Metrics Strip */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="saas-card" style={{ padding: '14px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Potential Value</div>
                  <div className="tabular-nums" style={{ fontSize: '1.3rem', fontWeight: '900', color: '#34d399', marginTop: '2px' }}>
                    ${(inspectedLead.potentialValue || inspectedLead.value || 0).toLocaleString()}
                  </div>
                </div>
                <div className="saas-card" style={{ padding: '14px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Lifecycle Stage</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#818cf8', marginTop: '4px' }}>
                    {inspectedLead.status || 'Lead Intake'}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="saas-card" style={{ padding: '18px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>
                  Contact Touchpoints
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Mail style={{ width: '16px', height: '16px', color: '#60a5fa' }} />
                    <span style={{ color: 'var(--text-primary)' }}>{inspectedLead.email || 'No email registered'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Phone style={{ width: '16px', height: '16px', color: '#34d399' }} />
                    <span style={{ color: 'var(--text-primary)' }}>{inspectedLead.phone || 'No phone registered'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Building style={{ width: '16px', height: '16px', color: '#c084fc' }} />
                    <span style={{ color: 'var(--text-primary)' }}>{inspectedLead.company}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <UserCheck style={{ width: '16px', height: '16px', color: '#fbbf24' }} />
                    <span style={{ color: 'var(--text-primary)' }}>Assigned to: <strong>{inspectedLead.assignedTo || 'Unassigned'}</strong></span>
                  </div>
                </div>
              </div>

              {/* Requirements & Offering Tags */}
              <div className="saas-card" style={{ padding: '18px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.05em' }}>
                  Requirement & Services
                </div>
                {inspectedLead.productNeeded && (
                  <div style={{ fontSize: '0.85rem', color: '#ffffff', marginBottom: '8px' }}>
                    Interested In: <strong style={{ color: '#818cf8' }}>{inspectedLead.productNeeded}</strong>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {(Array.isArray(inspectedLead.tags) ? inspectedLead.tags : typeof inspectedLead.tags === 'string' ? inspectedLead.tags.split(',') : []).map((t, idx) => (
                    <span key={idx} className="status-pill status-pill-indigo">{String(t).trim()}</span>
                  ))}
                </div>
              </div>

              {/* Activity & Meeting Notes */}
              <div className="saas-card" style={{ padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Activity & Audit Notes
                  </span>
                  <button
                    onClick={() => handleOpenNotes(inspectedLead)}
                    className="btn btn-secondary"
                    style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                  >
                    Edit Notes
                  </button>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0, whiteSpace: 'pre-wrap' }}>
                  {inspectedLead.notes || 'No activity notes logged yet for this lead.'}
                </p>
              </div>

            </div>

            {/* Drawer Footer Actions */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(0,0,0,0.2)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <button
                onClick={() => handleDeleteLeadClick(inspectedLead)}
                className="btn btn-danger"
                style={{ padding: '8px 14px', fontSize: '0.8rem' }}
              >
                <Trash2 style={{ width: '14px', height: '14px' }} />
                <span>Delete Lead</span>
              </button>

              <button
                onClick={() => {
                  updateLeadStatus && updateLeadStatus(inspectedLead.id, 'Won');
                  setInspectedLead(null);
                }}
                className="btn gradient-btn-emerald"
                style={{ padding: '8px 16px', fontSize: '0.8rem' }}
              >
                <CheckCircle2 style={{ width: '14px', height: '14px' }} />
                <span>Mark Deal Won</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Lead Intake Modal */}
      {showAddModal && <LeadFormModal onClose={() => setShowAddModal(false)} />}

      {/* Notes View / Edit Modal */}
      {editingNotesLead && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '24px', maxWidth: '550px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText style={{ color: '#60a5fa', width: '20px', height: '20px' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800' }}>Lead Notes & Activity Log</h3>
              </div>
              <button onClick={() => setEditingNotesLead(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X style={{ width: '18px', height: '18px' }} />
              </button>
            </div>

            <div style={{ background: 'var(--bg-input)', padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', fontSize: '0.85rem' }}>
              <div style={{ fontWeight: '800', color: 'var(--text-primary)' }}>{editingNotesLead.name}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{editingNotesLead.company} • {editingNotesLead.email}</div>
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label">Edit Requirement & Activity Notes</label>
              <textarea
                rows="6"
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                placeholder="Add meeting notes, customer requirement details, follow-up timeline..."
                className="form-textarea"
                style={{ fontSize: '0.85rem', lineHeight: '1.5' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setEditingNotesLead(null)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleSaveNotes} className="btn gradient-btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Edit3 style={{ width: '14px', height: '14px' }} />
                <span>Save Notes</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default LeadList;
