import React, { useState, useMemo } from 'react';
import { useCRM } from '../../context/CRMContext';
import {
  Filter,
  Plus,
  Trash2,
  Calendar,
  Search,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  X,
  Edit2,
  TrendingUp,
  TrendingDown,
  Download,
  Layers
} from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DeliverablesMatrix = () => {
  const {
    deliverables = [],
    clients = [],
    allClients = [],
    updateProjectDeliverables,
    addDeliverableRecord,
    deleteDeliverableRecord
  } = useCRM();

  const [selectedMonth, setSelectedMonth] = useState(8); // Default August
  const [selectedYear, setSelectedYear] = useState(2026);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [remarksModalRow, setRemarksModalRow] = useState(null);
  const [remarksText, setRemarksText] = useState('');

  const clientList = (Array.isArray(clients) && clients.length > 0) ? clients : (Array.isArray(allClients) ? allClients : []);

  // Form State for new log entry
  const [newEntryForm, setNewEntryForm] = useState({
    clientName: '',
    type: 'Non-DM', // 'DM' | 'Non-DM'
    deliveryDate: '',
    reelsPlanned: 6,
    postsPlanned: 8,
    reelsDelivered: 0,
    postsDelivered: 0,
    service: 'SMM & SEO',
    followers: '',
    followerGain: '',
    views: '',
    viewGain: '',
    backlinks: 0,
    keywords: 0,
    gmbPos: '',
    adsSpend: '',
    leads: '',
    leadTicketSize: '',
    achievement: '',
    remarks: ''
  });

  const parseMonthNum = (m) => {
    if (m === undefined || m === null) return 8;
    if (typeof m === 'number') return m;
    const p = parseInt(m, 10);
    if (!isNaN(p) && p >= 1 && p <= 12) return p;
    const str = String(m).toLowerCase().trim();
    const idx = MONTH_NAMES.findIndex(mn => mn.toLowerCase().startsWith(str.slice(0, 3)));
    return idx !== -1 ? (idx + 1) : 8;
  };

  // Filter deliverables strictly for the selected Month & Year
  const currentMonthDeliverables = useMemo(() => {
    if (!Array.isArray(deliverables) || deliverables.length === 0) return [];
    if (selectedMonth === 'all') return deliverables;
    return deliverables.filter(d => {
      const dMonth = parseMonthNum(d.month);
      const dYear = parseInt(d.year, 10) || 2026;
      return dMonth === parseInt(selectedMonth, 10) && (!selectedYear || dYear === parseInt(selectedYear, 10));
    });
  }, [deliverables, selectedMonth, selectedYear]);

  // Filter by search query
  const filteredDeliverables = useMemo(() => {
    if (!searchQuery.trim()) return currentMonthDeliverables;
    const q = searchQuery.toLowerCase().trim();
    return currentMonthDeliverables.filter(d =>
      (d.clientName || d.projectName || '').toLowerCase().includes(q) ||
      (d.service || '').toLowerCase().includes(q) ||
      (d.type || '').toLowerCase().includes(q) ||
      (d.remarks || d.otherRemarks || d.approvalPendingRemarks || '').toLowerCase().includes(q)
    );
  }, [currentMonthDeliverables, searchQuery]);

  // Totals calculations across the selected month
  const totals = useMemo(() => {
    let plannedReels = 0;
    let plannedPosts = 0;
    let deliveredReels = 0;
    let deliveredPosts = 0;

    filteredDeliverables.forEach(d => {
      plannedReels += parseInt(d.reelsPlanned || 0, 10);
      plannedPosts += parseInt(d.postsPlanned || 0, 10);
      deliveredReels += parseInt(d.reelsDelivered || 0, 10);
      deliveredPosts += parseInt(d.postsDelivered || 0, 10);
    });

    const pendingReels = Math.max(0, plannedReels - deliveredReels);
    const pendingPosts = Math.max(0, plannedPosts - deliveredPosts);
    const totalDelivered = deliveredReels + deliveredPosts;
    const totalPlanned = plannedReels + plannedPosts;
    const avgEfficiency = totalPlanned > 0 ? Math.round((totalDelivered / totalPlanned) * 100) : 0;

    return {
      plannedReels,
      plannedPosts,
      deliveredReels,
      deliveredPosts,
      pendingReels,
      pendingPosts,
      totalDelivered,
      avgEfficiency
    };
  }, [filteredDeliverables]);

  // Auto-save cell updates on blur
  const handleCellBlur = (id, field, value) => {
    if (updateProjectDeliverables) {
      updateProjectDeliverables(id, { [field]: value });
    }
  };

  // Toggle Type between DM and Non-DM (preserving all client details)
  const toggleType = (row) => {
    const nextType = (row.type === 'DM') ? 'Non-DM' : 'DM';
    if (updateProjectDeliverables) {
      updateProjectDeliverables(row.id, {
        type: nextType,
        clientName: row.clientName || row.projectName,
        projectName: row.clientName || row.projectName,
        service: row.service,
        deliveryDate: row.deliveryDate
      });
    }
  };

  // Open Edit Modal for a row
  const handleOpenEdit = (row) => {
    setEditingRow(row);
    setEditForm({
      clientName: row.clientName || row.projectName || '',
      type: row.type || 'Non-DM',
      deliveryDate: row.deliveryDate || '',
      reelsPlanned: row.reelsPlanned ?? 0,
      postsPlanned: row.postsPlanned ?? 0,
      reelsDelivered: row.reelsDelivered ?? 0,
      postsDelivered: row.postsDelivered ?? 0,
      service: row.service || 'Social Media Management',
      totalFollowers: row.totalFollowers || '',
      followerGain: row.followerGain || '',
      viewsReached: row.viewsReached || '',
      viewGain: row.viewGain || '',
      backlinksCreated: row.backlinksCreated ?? 0,
      keywordsInjected: row.keywordsInjected ?? 0,
      gmbPosition: row.gmbPosition || '',
      adsSpend: row.adsSpend || '',
      leads: row.leads || '',
      leadTicketSize: row.leadTicketSize || '',
      achievement: row.achievement || '',
      remarks: row.remarks || row.otherRemarks || row.approvalPendingRemarks || ''
    });
  };

  // Submit Edit Deliverable
  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editingRow || !editForm) return;

    if (updateProjectDeliverables) {
      updateProjectDeliverables(editingRow.id, {
        clientName: editForm.clientName,
        projectName: editForm.clientName,
        type: editForm.type,
        deliveryDate: editForm.deliveryDate,
        reelsPlanned: parseInt(editForm.reelsPlanned || 0, 10),
        postsPlanned: parseInt(editForm.postsPlanned || 0, 10),
        reelsDelivered: parseInt(editForm.reelsDelivered || 0, 10),
        postsDelivered: parseInt(editForm.postsDelivered || 0, 10),
        service: editForm.service,
        totalFollowers: editForm.totalFollowers,
        followerGain: editForm.followerGain,
        viewsReached: editForm.viewsReached,
        viewGain: editForm.viewGain,
        backlinksCreated: parseInt(editForm.backlinksCreated || 0, 10),
        keywordsInjected: parseInt(editForm.keywordsInjected || 0, 10),
        gmbPosition: editForm.gmbPosition,
        adsSpend: editForm.adsSpend,
        leads: editForm.leads,
        leadTicketSize: editForm.leadTicketSize,
        achievement: editForm.achievement,
        approvalPendingRemarks: editForm.remarks,
        otherRemarks: editForm.remarks,
        remarks: editForm.remarks
      });
    }

    setEditingRow(null);
    setEditForm(null);
  };

  // Handle Add New Log Entry Submit
  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newEntryForm.clientName) {
      alert('Please select or enter a client name.');
      return;
    }

    const payload = {
      id: `deliv-${Date.now()}`,
      clientName: newEntryForm.clientName,
      projectName: newEntryForm.clientName,
      type: newEntryForm.type || 'Non-DM',
      month: parseInt(selectedMonth, 10),
      year: parseInt(selectedYear, 10),
      deliveryDate: newEntryForm.deliveryDate || '15-08-2026',
      reelsPlanned: parseInt(newEntryForm.reelsPlanned || 0, 10),
      postsPlanned: parseInt(newEntryForm.postsPlanned || 0, 10),
      reelsDelivered: parseInt(newEntryForm.reelsDelivered || 0, 10),
      postsDelivered: parseInt(newEntryForm.postsDelivered || 0, 10),
      service: newEntryForm.service || 'SMM & SEO',
      totalFollowers: newEntryForm.followers || '',
      followerGain: newEntryForm.followerGain || '',
      viewsReached: newEntryForm.views || '',
      viewGain: newEntryForm.viewGain || '',
      backlinksCreated: parseInt(newEntryForm.backlinks || 0, 10),
      keywordsInjected: parseInt(newEntryForm.keywords || 0, 10),
      gmbPosition: newEntryForm.gmbPos || '',
      adsSpend: newEntryForm.adsSpend || '',
      leads: newEntryForm.leads || '',
      leadTicketSize: newEntryForm.leadTicketSize || '',
      achievement: newEntryForm.achievement || '',
      otherRemarks: newEntryForm.remarks || '',
      remarks: newEntryForm.remarks || ''
    };

    if (addDeliverableRecord) {
      addDeliverableRecord(payload);
    }

    setShowAddModal(false);
    setNewEntryForm({
      clientName: '',
      type: 'Non-DM',
      deliveryDate: '',
      reelsPlanned: 6,
      postsPlanned: 8,
      reelsDelivered: 0,
      postsDelivered: 0,
      service: 'SMM & SEO',
      followers: '',
      followerGain: '',
      views: '',
      viewGain: '',
      backlinks: 0,
      keywords: 0,
      gmbPos: '',
      adsSpend: '',
      leads: '',
      leadTicketSize: '',
      achievement: '',
      remarks: ''
    });
  };

  // Open Remarks Modal
  const openRemarksModal = (row) => {
    setRemarksModalRow(row);
    setRemarksText(row.remarks || row.otherRemarks || row.approvalPendingRemarks || '');
  };

  // Save Remarks
  const saveRemarks = () => {
    if (remarksModalRow && updateProjectDeliverables) {
      updateProjectDeliverables(remarksModalRow.id, {
        remarks: remarksText,
        otherRemarks: remarksText
      });
    }
    setRemarksModalRow(null);
  };

  // Delete deliverable row
  const handleDelete = (id, name) => {
    if (window.confirm(`Delete deliverable row for "${name}" in ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}?`)) {
      if (deleteDeliverableRecord) {
        deleteDeliverableRecord(id);
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      
      {/* Top Header & Month/Year Selector */}
      <div className="glass-panel" style={{ padding: '22px 26px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '900', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Deliverables Matrix
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '4px 0 0' }}>
            Track SMM and SEO deliverables planned vs. delivered with dynamic audience metrics
          </p>
        </div>

        {/* Month and Year Selectors */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(15, 23, 42, 0.6)', padding: '6px 12px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <Filter style={{ width: '16px', height: '16px', color: '#60a5fa' }} />
          
          {/* Month Dropdown */}
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(parseInt(e.target.value, 10))}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              fontWeight: '700',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {MONTH_NAMES.map((m, idx) => (
              <option key={m} value={idx + 1} style={{ background: '#1e293b', color: '#fff' }}>
                {m}
              </option>
            ))}
          </select>

          {/* Year Dropdown */}
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(parseInt(e.target.value, 10))}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#34d399',
              fontSize: '0.9rem',
              fontWeight: '700',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {[2024, 2025, 2026, 2027].map(y => (
              <option key={y} value={y} style={{ background: '#1e293b', color: '#fff' }}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid Panel */}
      <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
        
        {/* Panel Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
              Monthly Client Deliverables Grid — <span style={{ color: '#60a5fa' }}>{MONTH_NAMES[selectedMonth - 1]} {selectedYear}</span>
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <span>ⓘ Values save automatically on blur.</span>
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', width: '220px' }}>
              <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search clients..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="form-input"
                style={{ height: '36px', paddingLeft: '32px', fontSize: '0.8rem', width: '100%' }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X style={{ width: '14px', height: '14px' }} />
                </button>
              )}
            </div>

            {/* Add Log Entry Button */}
            <button
              onClick={() => setShowAddModal(true)}
              className="btn gradient-btn-primary"
              style={{ padding: '8px 16px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus style={{ width: '14px', height: '14px' }} />
              <span>+ Add Log Entry</span>
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div style={{ overflowX: 'auto', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', background: '#0b0f19' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left', minWidth: '1600px' }}>
            <thead>
              {/* Grouped Header Row 1 */}
              <tr style={{ background: '#111827', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8' }}>
                <th rowSpan="2" style={{ padding: '10px 14px', fontWeight: '700', minWidth: '150px' }}>Client Name</th>
                <th rowSpan="2" style={{ padding: '10px 10px', fontWeight: '700', minWidth: '85px', textAlign: 'center' }}>Type</th>
                <th rowSpan="2" style={{ padding: '10px 10px', fontWeight: '700', minWidth: '110px', textAlign: 'center' }}>Delivery Date</th>
                
                <th colSpan="2" style={{ padding: '8px 10px', fontWeight: '700', textAlign: 'center', background: 'rgba(59, 130, 246, 0.08)', borderLeft: '1px solid rgba(255, 255, 255, 0.08)', borderRight: '1px solid rgba(255, 255, 255, 0.08)' }}>Planned</th>
                <th colSpan="2" style={{ padding: '8px 10px', fontWeight: '700', textAlign: 'center', background: 'rgba(16, 185, 129, 0.08)', borderRight: '1px solid rgba(255, 255, 255, 0.08)' }}>Delivered</th>
                <th colSpan="2" style={{ padding: '8px 10px', fontWeight: '700', textAlign: 'center', background: 'rgba(245, 158, 11, 0.08)', borderRight: '1px solid rgba(255, 255, 255, 0.08)' }}>Pending</th>

                <th rowSpan="2" style={{ padding: '10px 10px', fontWeight: '700', textAlign: 'center', minWidth: '80px' }}>Total Deliv.</th>
                <th rowSpan="2" style={{ padding: '10px 10px', fontWeight: '700', textAlign: 'center', minWidth: '85px' }}>Efficiency</th>
                <th rowSpan="2" style={{ padding: '10px 12px', fontWeight: '700', minWidth: '140px', textAlign: 'center' }}>Remarks</th>
                <th rowSpan="2" style={{ padding: '10px 10px', fontWeight: '700', minWidth: '110px' }}>Service</th>
                <th rowSpan="2" style={{ padding: '10px 10px', fontWeight: '700', minWidth: '90px', textAlign: 'center' }}>Followers</th>
                <th rowSpan="2" style={{ padding: '10px 10px', fontWeight: '700', minWidth: '90px', textAlign: 'center' }}>Gained (F)</th>
                <th rowSpan="2" style={{ padding: '10px 10px', fontWeight: '700', minWidth: '85px', textAlign: 'center' }}>Views</th>
                <th rowSpan="2" style={{ padding: '10px 10px', fontWeight: '700', minWidth: '90px', textAlign: 'center' }}>Gained (V)</th>
                <th rowSpan="2" style={{ padding: '10px 10px', fontWeight: '700', minWidth: '80px', textAlign: 'center' }}>Backlinks</th>
                <th rowSpan="2" style={{ padding: '10px 10px', fontWeight: '700', minWidth: '80px', textAlign: 'center' }}>Keywords</th>
                <th rowSpan="2" style={{ padding: '10px 10px', fontWeight: '700', minWidth: '90px', textAlign: 'center' }}>GMB Pos.</th>
                <th rowSpan="2" style={{ padding: '10px 10px', fontWeight: '700', minWidth: '90px', textAlign: 'center' }}>Ads Spend</th>
                <th rowSpan="2" style={{ padding: '10px 10px', fontWeight: '700', minWidth: '75px', textAlign: 'center' }}>Leads</th>
                <th rowSpan="2" style={{ padding: '10px 10px', fontWeight: '700', minWidth: '110px', textAlign: 'center' }}>Lead Ticket Size</th>
                <th rowSpan="2" style={{ padding: '10px 10px', fontWeight: '700', minWidth: '110px', textAlign: 'center' }}>Achievement</th>
                <th rowSpan="2" style={{ padding: '10px 10px', fontWeight: '700', textAlign: 'center', minWidth: '65px' }}>Actions</th>
              </tr>

              {/* Grouped Header Row 2 */}
              <tr style={{ background: '#111827', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', fontSize: '0.72rem' }}>
                {/* Planned */}
                <th style={{ padding: '6px 8px', textAlign: 'center', background: 'rgba(59, 130, 246, 0.08)', borderLeft: '1px solid rgba(255, 255, 255, 0.08)' }}>Reels</th>
                <th style={{ padding: '6px 8px', textAlign: 'center', background: 'rgba(59, 130, 246, 0.08)', borderRight: '1px solid rgba(255, 255, 255, 0.08)' }}>Posts</th>

                {/* Delivered */}
                <th style={{ padding: '6px 8px', textAlign: 'center', background: 'rgba(16, 185, 129, 0.08)' }}>Reels</th>
                <th style={{ padding: '6px 8px', textAlign: 'center', background: 'rgba(16, 185, 129, 0.08)', borderRight: '1px solid rgba(255, 255, 255, 0.08)' }}>Posts</th>

                {/* Pending */}
                <th style={{ padding: '6px 8px', textAlign: 'center', background: 'rgba(245, 158, 11, 0.08)' }}>Reels</th>
                <th style={{ padding: '6px 8px', textAlign: 'center', background: 'rgba(245, 158, 11, 0.08)', borderRight: '1px solid rgba(255, 255, 255, 0.08)' }}>Posts</th>
              </tr>
            </thead>

            <tbody>
              {filteredDeliverables.length === 0 ? (
                <tr>
                  <td colSpan="23" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <Calendar style={{ width: '32px', height: '32px', color: '#475569' }} />
                      <span style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
                        No deliverables logged for {MONTH_NAMES[selectedMonth - 1]} {selectedYear}.
                      </span>
                      <button
                        onClick={() => setShowAddModal(true)}
                        className="btn btn-secondary"
                        style={{ padding: '6px 14px', fontSize: '0.8rem', marginTop: '6px' }}
                      >
                        + Add First Log Entry for {MONTH_NAMES[selectedMonth - 1]}
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDeliverables.map((row, idx) => {
                  const pReels = parseInt(row.reelsPlanned || 0, 10);
                  const pPosts = parseInt(row.postsPlanned || 0, 10);
                  const dReels = parseInt(row.reelsDelivered || 0, 10);
                  const dPosts = parseInt(row.postsDelivered || 0, 10);

                  const pendReels = Math.max(0, pReels - dReels);
                  const pendPosts = Math.max(0, pPosts - dPosts);
                  const totalDeliv = dReels + dPosts;
                  const totalPlanned = pReels + pPosts;
                  const effPercent = totalPlanned > 0 ? Math.round((totalDeliv / totalPlanned) * 100) : null;

                  const isDM = (row.type === 'DM');
                  const rem = row.remarks || row.otherRemarks || row.approvalPendingRemarks || '';

                  const fGain = row.followerGain || '';
                  const isFGainNeg = String(fGain).startsWith('-');
                  const vGain = row.viewGain || '';
                  const isVGainNeg = String(vGain).startsWith('-');

                  return (
                    <tr
                      key={`${row.id || idx}_${row.type}_${row.deliveryDate}_${row.reelsPlanned}_${row.postsPlanned}_${row.reelsDelivered}_${row.postsDelivered}_${row.followerGain}_${row.viewGain}_${row.remarks || ''}`}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      {/* 1. Client Name */}
                      <td style={{ padding: '8px 14px', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                        {row.clientName || row.projectName || 'Unnamed Client'}
                      </td>

                      {/* 2. Type Badge (DM / Non-DM) */}
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                        <span
                          onClick={() => toggleType(row)}
                          title="Click to toggle DM / Non-DM"
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.7rem',
                            fontWeight: '800',
                            cursor: 'pointer',
                            background: isDM ? 'rgba(16, 185, 129, 0.2)' : 'rgba(100, 116, 139, 0.2)',
                            color: isDM ? '#34d399' : '#94a3b8',
                            border: `1px solid ${isDM ? 'rgba(16, 185, 129, 0.4)' : 'rgba(100, 116, 139, 0.3)'}`
                          }}
                        >
                          {row.type || 'Non-DM'}
                        </span>
                      </td>

                      {/* 3. Delivery Date */}
                      <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                        <input
                          type="text"
                          defaultValue={row.deliveryDate || 'dd-mm-yyyy'}
                          onBlur={e => handleCellBlur(row.id, 'deliveryDate', e.target.value)}
                          style={{
                            width: '95px',
                            background: 'transparent',
                            border: '1px solid transparent',
                            color: 'var(--text-secondary)',
                            fontSize: '0.75rem',
                            textAlign: 'center',
                            borderRadius: '4px',
                            padding: '3px 4px'
                          }}
                          onFocus={e => e.target.style.border = '1px solid #6366f1'}
                          onBlurCapture={e => e.target.style.border = '1px solid transparent'}
                        />
                      </td>

                      {/* 4. Planned Reels */}
                      <td style={{ padding: '6px 6px', textAlign: 'center', background: 'rgba(59, 130, 246, 0.03)' }}>
                        <input
                          type="number"
                          defaultValue={row.reelsPlanned ?? 0}
                          onBlur={e => handleCellBlur(row.id, 'reelsPlanned', parseInt(e.target.value, 10) || 0)}
                          style={{
                            width: '45px',
                            background: 'transparent',
                            border: '1px solid transparent',
                            color: 'var(--text-primary)',
                            fontSize: '0.8rem',
                            fontWeight: '700',
                            textAlign: 'center',
                            borderRadius: '4px',
                            padding: '3px 2px'
                          }}
                          onFocus={e => e.target.style.border = '1px solid #3b82f6'}
                          onBlurCapture={e => e.target.style.border = '1px solid transparent'}
                        />
                      </td>

                      {/* 5. Planned Posts */}
                      <td style={{ padding: '6px 6px', textAlign: 'center', background: 'rgba(59, 130, 246, 0.03)' }}>
                        <input
                          type="number"
                          defaultValue={row.postsPlanned ?? 0}
                          onBlur={e => handleCellBlur(row.id, 'postsPlanned', parseInt(e.target.value, 10) || 0)}
                          style={{
                            width: '45px',
                            background: 'transparent',
                            border: '1px solid transparent',
                            color: 'var(--text-primary)',
                            fontSize: '0.8rem',
                            fontWeight: '700',
                            textAlign: 'center',
                            borderRadius: '4px',
                            padding: '3px 2px'
                          }}
                          onFocus={e => e.target.style.border = '1px solid #3b82f6'}
                          onBlurCapture={e => e.target.style.border = '1px solid transparent'}
                        />
                      </td>

                      {/* 6. Delivered Reels */}
                      <td style={{ padding: '6px 6px', textAlign: 'center', background: 'rgba(16, 185, 129, 0.03)' }}>
                        <input
                          type="number"
                          defaultValue={row.reelsDelivered ?? 0}
                          onBlur={e => handleCellBlur(row.id, 'reelsDelivered', parseInt(e.target.value, 10) || 0)}
                          style={{
                            width: '45px',
                            background: 'transparent',
                            border: '1px solid transparent',
                            color: '#34d399',
                            fontSize: '0.8rem',
                            fontWeight: '700',
                            textAlign: 'center',
                            borderRadius: '4px',
                            padding: '3px 2px'
                          }}
                          onFocus={e => e.target.style.border = '1px solid #10b981'}
                          onBlurCapture={e => e.target.style.border = '1px solid transparent'}
                        />
                      </td>

                      {/* 7. Delivered Posts */}
                      <td style={{ padding: '6px 6px', textAlign: 'center', background: 'rgba(16, 185, 129, 0.03)' }}>
                        <input
                          type="number"
                          defaultValue={row.postsDelivered ?? 0}
                          onBlur={e => handleCellBlur(row.id, 'postsDelivered', parseInt(e.target.value, 10) || 0)}
                          style={{
                            width: '45px',
                            background: 'transparent',
                            border: '1px solid transparent',
                            color: '#34d399',
                            fontSize: '0.8rem',
                            fontWeight: '700',
                            textAlign: 'center',
                            borderRadius: '4px',
                            padding: '3px 2px'
                          }}
                          onFocus={e => e.target.style.border = '1px solid #10b981'}
                          onBlurCapture={e => e.target.style.border = '1px solid transparent'}
                        />
                      </td>

                      {/* 8. Pending Reels (Auto-calculated) */}
                      <td style={{ padding: '6px 6px', textAlign: 'center', fontWeight: '800', color: pendReels === 0 ? '#34d399' : '#f59e0b', background: 'rgba(245, 158, 11, 0.03)' }}>
                        {pendReels}
                      </td>

                      {/* 9. Pending Posts (Auto-calculated) */}
                      <td style={{ padding: '6px 6px', textAlign: 'center', fontWeight: '800', color: pendPosts === 0 ? '#34d399' : '#f59e0b', background: 'rgba(245, 158, 11, 0.03)' }}>
                        {pendPosts}
                      </td>

                      {/* 10. Total Deliv. (Auto-calculated) */}
                      <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: '900', color: '#60a5fa' }}>
                        {totalDeliv}
                      </td>

                      {/* 11. Efficiency % (Auto-calculated) */}
                      <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: '800', color: effPercent !== null ? (effPercent >= 50 ? '#34d399' : '#f59e0b') : 'var(--text-muted)' }}>
                        {effPercent !== null ? `${effPercent}%` : '—'}
                      </td>

                      {/* 12. Remarks */}
                      <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                        <button
                          onClick={() => openRemarksModal(row)}
                          style={{
                            background: rem ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                            border: `1px solid ${rem ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
                            color: rem ? '#818cf8' : 'var(--text-muted)',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            cursor: 'pointer',
                            maxWidth: '140px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          💬 {rem ? rem.slice(0, 16) + '...' : 'View / Add Remarks'}
                        </button>
                      </td>

                      {/* 13. Service */}
                      <td style={{ padding: '6px 8px' }}>
                        <input
                          type="text"
                          defaultValue={row.service || 'e.g. SMM & SEO'}
                          onBlur={e => handleCellBlur(row.id, 'service', e.target.value)}
                          style={{
                            width: '100px',
                            background: 'transparent',
                            border: '1px solid transparent',
                            color: 'var(--text-secondary)',
                            fontSize: '0.75rem',
                            borderRadius: '4px',
                            padding: '3px 4px'
                          }}
                          onFocus={e => e.target.style.border = '1px solid #6366f1'}
                          onBlurCapture={e => e.target.style.border = '1px solid transparent'}
                        />
                      </td>

                      {/* 14. Followers */}
                      <td style={{ padding: '6px 6px', textAlign: 'center' }}>
                        <input
                          type="text"
                          defaultValue={row.totalFollowers || ''}
                          placeholder="—"
                          onBlur={e => handleCellBlur(row.id, 'totalFollowers', e.target.value)}
                          style={{
                            width: '65px',
                            background: 'transparent',
                            border: '1px solid transparent',
                            color: 'var(--text-primary)',
                            fontSize: '0.75rem',
                            textAlign: 'center',
                            borderRadius: '4px',
                            padding: '3px 2px'
                          }}
                          onFocus={e => e.target.style.border = '1px solid #6366f1'}
                          onBlurCapture={e => e.target.style.border = '1px solid transparent'}
                        />
                      </td>

                      {/* 15. Gained (F) */}
                      <td style={{ padding: '6px 6px', textAlign: 'center' }}>
                        <input
                          type="text"
                          defaultValue={row.followerGain || ''}
                          placeholder="—"
                          onBlur={e => handleCellBlur(row.id, 'followerGain', e.target.value)}
                          style={{
                            width: '65px',
                            background: 'transparent',
                            border: '1px solid transparent',
                            color: isFGainNeg ? '#f43f5e' : (fGain ? '#34d399' : 'var(--text-muted)'),
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            textAlign: 'center',
                            borderRadius: '4px',
                            padding: '3px 2px'
                          }}
                          onFocus={e => e.target.style.border = '1px solid #6366f1'}
                          onBlurCapture={e => e.target.style.border = '1px solid transparent'}
                        />
                      </td>

                      {/* 16. Views */}
                      <td style={{ padding: '6px 6px', textAlign: 'center' }}>
                        <input
                          type="text"
                          defaultValue={row.viewsReached || ''}
                          placeholder="—"
                          onBlur={e => handleCellBlur(row.id, 'viewsReached', e.target.value)}
                          style={{
                            width: '65px',
                            background: 'transparent',
                            border: '1px solid transparent',
                            color: 'var(--text-primary)',
                            fontSize: '0.75rem',
                            textAlign: 'center',
                            borderRadius: '4px',
                            padding: '3px 2px'
                          }}
                          onFocus={e => e.target.style.border = '1px solid #6366f1'}
                          onBlurCapture={e => e.target.style.border = '1px solid transparent'}
                        />
                      </td>

                      {/* 17. Gained (V) */}
                      <td style={{ padding: '6px 6px', textAlign: 'center' }}>
                        <input
                          type="text"
                          defaultValue={row.viewGain || ''}
                          placeholder="—"
                          onBlur={e => handleCellBlur(row.id, 'viewGain', e.target.value)}
                          style={{
                            width: '65px',
                            background: 'transparent',
                            border: '1px solid transparent',
                            color: isVGainNeg ? '#f43f5e' : (vGain ? '#34d399' : 'var(--text-muted)'),
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            textAlign: 'center',
                            borderRadius: '4px',
                            padding: '3px 2px'
                          }}
                          onFocus={e => e.target.style.border = '1px solid #6366f1'}
                          onBlurCapture={e => e.target.style.border = '1px solid transparent'}
                        />
                      </td>

                      {/* 18. Backlinks */}
                      <td style={{ padding: '6px 6px', textAlign: 'center' }}>
                        <input
                          type="number"
                          defaultValue={row.backlinksCreated ?? 0}
                          onBlur={e => handleCellBlur(row.id, 'backlinksCreated', parseInt(e.target.value, 10) || 0)}
                          style={{
                            width: '50px',
                            background: 'transparent',
                            border: '1px solid transparent',
                            color: 'var(--text-secondary)',
                            fontSize: '0.75rem',
                            textAlign: 'center',
                            borderRadius: '4px',
                            padding: '3px 2px'
                          }}
                          onFocus={e => e.target.style.border = '1px solid #6366f1'}
                          onBlurCapture={e => e.target.style.border = '1px solid transparent'}
                        />
                      </td>

                      {/* 19. Keywords */}
                      <td style={{ padding: '6px 6px', textAlign: 'center' }}>
                        <input
                          type="number"
                          defaultValue={row.keywordsInjected ?? 0}
                          onBlur={e => handleCellBlur(row.id, 'keywordsInjected', parseInt(e.target.value, 10) || 0)}
                          style={{
                            width: '50px',
                            background: 'transparent',
                            border: '1px solid transparent',
                            color: 'var(--text-secondary)',
                            fontSize: '0.75rem',
                            textAlign: 'center',
                            borderRadius: '4px',
                            padding: '3px 2px'
                          }}
                          onFocus={e => e.target.style.border = '1px solid #6366f1'}
                          onBlurCapture={e => e.target.style.border = '1px solid transparent'}
                        />
                      </td>

                      {/* 20. GMB Pos. */}
                      <td style={{ padding: '6px 6px', textAlign: 'center' }}>
                        <input
                          type="text"
                          defaultValue={row.gmbPosition || ''}
                          placeholder="e.g. 3rd"
                          onBlur={e => handleCellBlur(row.id, 'gmbPosition', e.target.value)}
                          style={{
                            width: '70px',
                            background: 'transparent',
                            border: '1px solid transparent',
                            color: 'var(--text-secondary)',
                            fontSize: '0.75rem',
                            textAlign: 'center',
                            borderRadius: '4px',
                            padding: '3px 2px'
                          }}
                          onFocus={e => e.target.style.border = '1px solid #6366f1'}
                          onBlurCapture={e => e.target.style.border = '1px solid transparent'}
                        />
                      </td>

                      {/* 21. Ads Spend */}
                      <td style={{ padding: '6px 6px', textAlign: 'center' }}>
                        <input
                          type="text"
                          defaultValue={row.adsSpend || ''}
                          placeholder="—"
                          onBlur={e => handleCellBlur(row.id, 'adsSpend', e.target.value)}
                          style={{
                            width: '70px',
                            background: 'transparent',
                            border: '1px solid transparent',
                            color: 'var(--text-secondary)',
                            fontSize: '0.75rem',
                            textAlign: 'center',
                            borderRadius: '4px',
                            padding: '3px 2px'
                          }}
                          onFocus={e => e.target.style.border = '1px solid #6366f1'}
                          onBlurCapture={e => e.target.style.border = '1px solid transparent'}
                        />
                      </td>

                      {/* 22. Leads */}
                      <td style={{ padding: '6px 6px', textAlign: 'center' }}>
                        <input
                          type="text"
                          defaultValue={row.leads || ''}
                          placeholder="—"
                          onBlur={e => handleCellBlur(row.id, 'leads', e.target.value)}
                          style={{
                            width: '55px',
                            background: 'transparent',
                            border: '1px solid transparent',
                            color: '#34d399',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            textAlign: 'center',
                            borderRadius: '4px',
                            padding: '3px 2px'
                          }}
                          onFocus={e => e.target.style.border = '1px solid #6366f1'}
                          onBlurCapture={e => e.target.style.border = '1px solid transparent'}
                        />
                      </td>

                      {/* 23. Lead Ticket Size */}
                      <td style={{ padding: '6px 6px', textAlign: 'center' }}>
                        <input
                          type="text"
                          defaultValue={row.leadTicketSize || ''}
                          placeholder="—"
                          onBlur={e => handleCellBlur(row.id, 'leadTicketSize', e.target.value)}
                          style={{
                            width: '80px',
                            background: 'transparent',
                            border: '1px solid transparent',
                            color: 'var(--text-secondary)',
                            fontSize: '0.75rem',
                            textAlign: 'center',
                            borderRadius: '4px',
                            padding: '3px 2px'
                          }}
                          onFocus={e => e.target.style.border = '1px solid #6366f1'}
                          onBlurCapture={e => e.target.style.border = '1px solid transparent'}
                        />
                      </td>

                      {/* 24. Achievement */}
                      <td style={{ padding: '6px 6px', textAlign: 'center' }}>
                        <input
                          type="text"
                          defaultValue={row.achievement || ''}
                          placeholder="e.g. High ROI"
                          onBlur={e => handleCellBlur(row.id, 'achievement', e.target.value)}
                          style={{
                            width: '90px',
                            background: 'transparent',
                            border: '1px solid transparent',
                            color: 'var(--text-secondary)',
                            fontSize: '0.75rem',
                            textAlign: 'center',
                            borderRadius: '4px',
                            padding: '3px 2px'
                          }}
                          onFocus={e => e.target.style.border = '1px solid #6366f1'}
                          onBlurCapture={e => e.target.style.border = '1px solid transparent'}
                        />
                      </td>

                      {/* 25. Actions */}
                      <td style={{ padding: '6px 8px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <button
                            onClick={() => handleOpenEdit(row)}
                            style={{
                              background: 'rgba(99, 102, 241, 0.15)',
                              border: '1px solid rgba(99, 102, 241, 0.3)',
                              color: '#818cf8',
                              cursor: 'pointer',
                              padding: '4px 6px',
                              borderRadius: '6px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              fontSize: '0.72rem',
                              fontWeight: '700'
                            }}
                            title="Edit deliverable entry"
                          >
                            <Edit2 style={{ width: '12px', height: '12px' }} /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(row.id, row.clientName || row.projectName)}
                            style={{
                              background: 'rgba(244, 63, 94, 0.12)',
                              border: '1px solid rgba(244, 63, 94, 0.25)',
                              color: '#f87171',
                              cursor: 'pointer',
                              padding: '4px 6px',
                              borderRadius: '6px',
                              display: 'inline-flex',
                              alignItems: 'center'
                            }}
                            title="Delete row"
                          >
                            <Trash2 style={{ width: '12px', height: '12px' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}

              {/* === BOTTOM TOTAL SUMMARY ROW === */}
              {filteredDeliverables.length > 0 && (
                <tr style={{ background: '#111827', borderTop: '2px solid rgba(99, 102, 241, 0.4)', fontWeight: '800' }}>
                  <td style={{ padding: '12px 14px', color: '#fff', fontSize: '0.85rem' }}>Total</td>
                  <td style={{ padding: '12px 10px', textAlign: 'center', color: 'var(--text-muted)' }}>—</td>
                  <td style={{ padding: '12px 10px', textAlign: 'center', color: 'var(--text-muted)' }}>—</td>
                  
                  {/* Planned Totals */}
                  <td style={{ padding: '12px 6px', textAlign: 'center', color: '#60a5fa', background: 'rgba(59, 130, 246, 0.06)' }}>{totals.plannedReels}</td>
                  <td style={{ padding: '12px 6px', textAlign: 'center', color: '#60a5fa', background: 'rgba(59, 130, 246, 0.06)' }}>{totals.plannedPosts}</td>

                  {/* Delivered Totals */}
                  <td style={{ padding: '12px 6px', textAlign: 'center', color: '#34d399', background: 'rgba(16, 185, 129, 0.06)' }}>{totals.deliveredReels}</td>
                  <td style={{ padding: '12px 6px', textAlign: 'center', color: '#34d399', background: 'rgba(16, 185, 129, 0.06)' }}>{totals.deliveredPosts}</td>

                  {/* Pending Totals */}
                  <td style={{ padding: '12px 6px', textAlign: 'center', color: totals.pendingReels === 0 ? '#34d399' : '#f59e0b', background: 'rgba(245, 158, 11, 0.06)' }}>{totals.pendingReels}</td>
                  <td style={{ padding: '12px 6px', textAlign: 'center', color: totals.pendingPosts === 0 ? '#34d399' : '#f59e0b', background: 'rgba(245, 158, 11, 0.06)' }}>{totals.pendingPosts}</td>

                  {/* Total Deliv. */}
                  <td style={{ padding: '12px 8px', textAlign: 'center', color: '#60a5fa', fontSize: '0.9rem' }}>{totals.totalDelivered}</td>

                  {/* Efficiency Avg */}
                  <td style={{ padding: '12px 8px', textAlign: 'center', color: totals.avgEfficiency >= 50 ? '#34d399' : '#f59e0b', fontSize: '0.85rem' }}>{totals.avgEfficiency}%</td>

                  {/* Blank totals for trailing columns */}
                  <td style={{ padding: '12px 8px', textAlign: 'center', color: 'var(--text-muted)' }}>—</td>
                  <td style={{ padding: '12px 8px', textAlign: 'center', color: 'var(--text-muted)' }}>—</td>
                  <td style={{ padding: '12px 8px', textAlign: 'center', color: 'var(--text-muted)' }}>—</td>
                  <td style={{ padding: '12px 8px', textAlign: 'center', color: 'var(--text-muted)' }}>—</td>
                  <td style={{ padding: '12px 8px', textAlign: 'center', color: 'var(--text-muted)' }}>—</td>
                  <td style={{ padding: '12px 8px', textAlign: 'center', color: 'var(--text-muted)' }}>—</td>
                  <td style={{ padding: '12px 8px', textAlign: 'center', color: 'var(--text-muted)' }}>—</td>
                  <td style={{ padding: '12px 8px', textAlign: 'center', color: 'var(--text-muted)' }}>—</td>
                  <td style={{ padding: '12px 8px', textAlign: 'center', color: 'var(--text-muted)' }}>—</td>
                  <td style={{ padding: '12px 8px', textAlign: 'center', color: 'var(--text-muted)' }}>—</td>
                  <td style={{ padding: '12px 8px', textAlign: 'center', color: 'var(--text-muted)' }}>—</td>
                  <td style={{ padding: '12px 8px', textAlign: 'center', color: 'var(--text-muted)' }}>—</td>
                  <td style={{ padding: '12px 8px', textAlign: 'center', color: 'var(--text-muted)' }}>—</td>
                  <td style={{ padding: '12px 8px', textAlign: 'center', color: 'var(--text-muted)' }}>—</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* === MODAL: ADD LOG ENTRY === */}
      {showAddModal && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content glass-card" style={{ maxWidth: '640px', width: '90%', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                  + Add Deliverables Log Entry
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#60a5fa', fontWeight: '700' }}>
                  For Month: {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                </span>
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Client Selection */}
              <div>
                <label className="form-label" style={{ fontWeight: '700', fontSize: '0.8rem' }}>Client Name *</label>
                <input
                  type="text"
                  list="client-suggestions"
                  placeholder="Select or type client name (e.g. galaxy PVD, Alis, Jalmahal...)"
                  value={newEntryForm.clientName}
                  onChange={e => setNewEntryForm({ ...newEntryForm, clientName: e.target.value })}
                  className="form-input"
                  required
                />
                <datalist id="client-suggestions">
                  {clientList.map(c => <option key={c.id || c.name} value={c.name} />)}
                </datalist>
              </div>

              {/* Type and Delivery Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Type</label>
                  <select
                    className="form-input"
                    value={newEntryForm.type}
                    onChange={e => setNewEntryForm({ ...newEntryForm, type: e.target.value })}
                  >
                    <option value="Non-DM">Non-DM (General SMM)</option>
                    <option value="DM">DM (Digital Marketing)</option>
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Delivery Date</label>
                  <input
                    type="text"
                    placeholder="15-08-2026"
                    value={newEntryForm.deliveryDate}
                    onChange={e => setNewEntryForm({ ...newEntryForm, deliveryDate: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Planned Deliverables */}
              <div style={{ background: 'rgba(59, 130, 246, 0.08)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#60a5fa', textTransform: 'uppercase' }}>Planned Content</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Planned Reels</label>
                    <input
                      type="number"
                      value={newEntryForm.reelsPlanned}
                      onChange={e => setNewEntryForm({ ...newEntryForm, reelsPlanned: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Planned Posts / Graphics</label>
                    <input
                      type="number"
                      value={newEntryForm.postsPlanned}
                      onChange={e => setNewEntryForm({ ...newEntryForm, postsPlanned: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              {/* Delivered Content */}
              <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#34d399', textTransform: 'uppercase' }}>Delivered to Date</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Delivered Reels</label>
                    <input
                      type="number"
                      value={newEntryForm.reelsDelivered}
                      onChange={e => setNewEntryForm({ ...newEntryForm, reelsDelivered: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Delivered Posts</label>
                    <input
                      type="number"
                      value={newEntryForm.postsDelivered}
                      onChange={e => setNewEntryForm({ ...newEntryForm, postsDelivered: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              {/* Service & Social Performance */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Service</label>
                  <input
                    type="text"
                    placeholder="SMM & SEO"
                    value={newEntryForm.service}
                    onChange={e => setNewEntryForm({ ...newEntryForm, service: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Follower Gain</label>
                  <input
                    type="text"
                    placeholder="-150 or +500"
                    value={newEntryForm.followerGain}
                    onChange={e => setNewEntryForm({ ...newEntryForm, followerGain: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>View Gain</label>
                  <input
                    type="text"
                    placeholder="-20k or +100k"
                    value={newEntryForm.viewGain}
                    onChange={e => setNewEntryForm({ ...newEntryForm, viewGain: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Remarks / Deliverable Notes</label>
                <textarea
                  rows="2"
                  placeholder="Enter any client milestone or deliverable notes..."
                  value={newEntryForm.remarks}
                  onChange={e => setNewEntryForm({ ...newEntryForm, remarks: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn gradient-btn-primary">
                  Save Log Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* === MODAL: REMARKS VIEW / EDIT === */}
      {remarksModalRow && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content glass-card" style={{ maxWidth: '480px', width: '90%', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                Remarks: {remarksModalRow.clientName || remarksModalRow.projectName}
              </h3>
              <button onClick={() => setRemarksModalRow(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X style={{ width: '18px', height: '18px' }} />
              </button>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Update client deliverable remarks for <strong>{MONTH_NAMES[selectedMonth - 1]} {selectedYear}</strong>:
            </p>

            <textarea
              rows="4"
              value={remarksText}
              onChange={e => setRemarksText(e.target.value)}
              placeholder="Type deliverable remarks, approval notes, or client feedback..."
              className="form-input"
              style={{ width: '100%', marginBottom: '16px' }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setRemarksModalRow(null)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={saveRemarks} className="btn gradient-btn-primary">
                Save Remarks
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === MODAL: EDIT DELIVERABLE ENTRY === */}
      {editingRow && editForm && (
        <div className="modal-overlay" style={{ zIndex: 1150 }}>
          <div className="modal-content glass-card" style={{ maxWidth: '680px', width: '92%', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Edit2 style={{ width: '18px', height: '18px', color: '#818cf8' }} />
                  Edit Deliverables Entry — {editingRow.clientName || editingRow.projectName}
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#60a5fa', fontWeight: '700' }}>
                  Period: {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                </span>
              </div>
              <button
                onClick={() => { setEditingRow(null); setEditForm(null); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Client Name & Type */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: '700', fontSize: '0.8rem' }}>Client Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.clientName}
                    onChange={e => setEditForm({ ...editForm, clientName: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: '700' }}>Type</label>
                  <select
                    className="form-input"
                    value={editForm.type}
                    onChange={e => setEditForm({ ...editForm, type: e.target.value })}
                  >
                    <option value="DM">DM (Digital Marketing)</option>
                    <option value="Non-DM">Non-DM (General SMM)</option>
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: '700' }}>Delivery Date</label>
                  <input
                    type="text"
                    placeholder="15-08-2026"
                    value={editForm.deliveryDate}
                    onChange={e => setEditForm({ ...editForm, deliveryDate: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Planned vs Delivered Content */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {/* Planned */}
                <div style={{ background: 'rgba(59, 130, 246, 0.08)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#60a5fa', textTransform: 'uppercase' }}>Planned Deliverables</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.72rem' }}>Planned Reels</label>
                      <input
                        type="number"
                        min="0"
                        value={editForm.reelsPlanned}
                        onChange={e => setEditForm({ ...editForm, reelsPlanned: e.target.value })}
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.72rem' }}>Planned Posts</label>
                      <input
                        type="number"
                        min="0"
                        value={editForm.postsPlanned}
                        onChange={e => setEditForm({ ...editForm, postsPlanned: e.target.value })}
                        className="form-input"
                      />
                    </div>
                  </div>
                </div>

                {/* Delivered */}
                <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#34d399', textTransform: 'uppercase' }}>Delivered Output</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.72rem' }}>Delivered Reels</label>
                      <input
                        type="number"
                        min="0"
                        value={editForm.reelsDelivered}
                        onChange={e => setEditForm({ ...editForm, reelsDelivered: e.target.value })}
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.72rem' }}>Delivered Posts</label>
                      <input
                        type="number"
                        min="0"
                        value={editForm.postsDelivered}
                        onChange={e => setEditForm({ ...editForm, postsDelivered: e.target.value })}
                        className="form-input"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Service & Social Performance */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr', gap: '8px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.72rem' }}>Service</label>
                  <input
                    type="text"
                    value={editForm.service}
                    onChange={e => setEditForm({ ...editForm, service: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.72rem' }}>Followers</label>
                  <input
                    type="text"
                    value={editForm.totalFollowers}
                    onChange={e => setEditForm({ ...editForm, totalFollowers: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.72rem' }}>Gained (F)</label>
                  <input
                    type="text"
                    value={editForm.followerGain}
                    onChange={e => setEditForm({ ...editForm, followerGain: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.72rem' }}>Views</label>
                  <input
                    type="text"
                    value={editForm.viewsReached}
                    onChange={e => setEditForm({ ...editForm, viewsReached: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.72rem' }}>Gained (V)</label>
                  <input
                    type="text"
                    value={editForm.viewGain}
                    onChange={e => setEditForm({ ...editForm, viewGain: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              {/* SEO & Campaign Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr', gap: '8px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.72rem' }}>Backlinks</label>
                  <input
                    type="number"
                    value={editForm.backlinksCreated}
                    onChange={e => setEditForm({ ...editForm, backlinksCreated: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.72rem' }}>Keywords</label>
                  <input
                    type="number"
                    value={editForm.keywordsInjected}
                    onChange={e => setEditForm({ ...editForm, keywordsInjected: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.72rem' }}>GMB Pos.</label>
                  <input
                    type="text"
                    value={editForm.gmbPosition}
                    onChange={e => setEditForm({ ...editForm, gmbPosition: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.72rem' }}>Ads Spend</label>
                  <input
                    type="text"
                    value={editForm.adsSpend}
                    onChange={e => setEditForm({ ...editForm, adsSpend: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.72rem' }}>Leads</label>
                  <input
                    type="text"
                    value={editForm.leads}
                    onChange={e => setEditForm({ ...editForm, leads: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.72rem' }}>Ticket Size</label>
                  <input
                    type="text"
                    value={editForm.leadTicketSize}
                    onChange={e => setEditForm({ ...editForm, leadTicketSize: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Remarks / Deliverable Notes</label>
                <textarea
                  rows="2"
                  value={editForm.remarks}
                  onChange={e => setEditForm({ ...editForm, remarks: e.target.value })}
                  placeholder="Enter deliverable milestone notes or approval comments..."
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => { setEditingRow(null); setEditForm(null); }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn gradient-btn-primary" style={{ fontWeight: '800' }}>
                  Save Deliverable Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default DeliverablesMatrix;
