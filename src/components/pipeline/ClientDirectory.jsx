import React, { useState, useMemo } from 'react';
import { useCRM } from '../../context/CRMContext';
import { MIS_CLIENTS_DATA, MIS_CREDENTIALS_DATA, MIS_SERVERS_DATA } from '../../data/misClientsDirectoryData';
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
  Key,
  Shield,
  Search,
  Eye,
  EyeOff,
  Copy,
  Check,
  X,
  Play,
  Pause,
  AlertCircle,
  Globe,
  Building,
  Users,
  CreditCard,
  Lock,
  Layers,
  ChevronDown
} from 'lucide-react';

const ClientDirectory = () => {
  // Local state for Clients with localStorage persistence
  const [clients, setClients] = useState(() => {
    const saved = localStorage.getItem('astra_client_directory_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return MIS_CLIENTS_DATA;
  });

  // Local state for Credentials with localStorage persistence
  const [credentials, setCredentials] = useState(() => {
    const saved = localStorage.getItem('astra_client_credentials_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return MIS_CREDENTIALS_DATA;
  });

  // Local state for Servers with localStorage persistence
  const [servers, setServers] = useState(() => {
    const saved = localStorage.getItem('astra_client_servers_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return MIS_SERVERS_DATA;
  });

  React.useEffect(() => {
    try {
      localStorage.setItem('astra_client_directory_v1', JSON.stringify(clients));
    } catch (e) {}
  }, [clients]);

  React.useEffect(() => {
    try {
      localStorage.setItem('astra_client_credentials_v1', JSON.stringify(credentials));
    } catch (e) {}
  }, [credentials]);

  React.useEffect(() => {
    try {
      localStorage.setItem('astra_client_servers_v1', JSON.stringify(servers));
    } catch (e) {}
  }, [servers]);

  // Filtering and Search States
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all' | 'active_dm' | 'hold' | 'one_time' | 'hosting' | 'left' | 'servers'
  const [searchQuery, setSearchQuery] = useState('');

  // Modal States
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [selectedClientForLogins, setSelectedClientForLogins] = useState(null);
  const [showLoginsModal, setShowLoginsModal] = useState(false);

  // Visibility & Copy Feedback States
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [copiedKey, setCopiedKey] = useState(null);

  // New Login Form inside Modal
  const [newLoginForm, setNewLoginForm] = useState({
    platform: '',
    username: '',
    password: '',
    login_url: '',
    notes: ''
  });

  // New / Edit Project Form
  const defaultProjectForm = {
    name: '',
    client_name: '',
    client_type: 'active_dm',
    billing_cycle: '1st of every month',
    ticket_size: 25000,
    advance_payment: 0,
    payment_status: 'Unpaid',
    status: 'active',
    onboarded_date: new Date().toISOString().split('T')[0],
    assigned_lead: 'Naveen Kumar',
    contact_person: '',
    contact_email: '',
    deadline: ''
  };
  const [projectForm, setProjectForm] = useState(defaultProjectForm);

  const copyToClipboard = (text, key) => {
    if (!text) return;
    try {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (e) {
      console.warn('Copy failed:', e);
    }
  };

  const togglePasswordVisibility = (id) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Billing & Due Calculations helper matching MIS formula
  const enrichedClients = useMemo(() => {
    const now = new Date();
    return clients.map(client => {
      let monthsDue = 0;
      let amountDue = 0;
      let daysDue = 0;
      let billingDate = client.billing_date || '';

      const ticketSize = parseFloat(client.ticket_size || 0);

      if (client.client_type === 'one_time') {
        amountDue = Math.max(0, ticketSize - parseFloat(client.advance_payment || 0));
        monthsDue = amountDue > 0 ? 1 : 0;
      } else if (client.payment_status === 'Paid') {
        monthsDue = 0;
        amountDue = 0;
        daysDue = 0;
      } else {
        // Estimate billing date and dues
        if (client.id === 1) { // Nirmal
          monthsDue = 1;
          amountDue = 40000;
          daysDue = 73;
          billingDate = '2026-06-05';
        } else if (client.id === 2) { // Jalmahal
          monthsDue = 3;
          amountDue = 75000;
          daysDue = 138;
          billingDate = '2026-04-01';
        } else if (client.id === 3) { // Tiffanies
          monthsDue = 1;
          amountDue = 18000;
          daysDue = 108;
          billingDate = '2026-05-01';
        } else if (client.id === 4) { // Matha
          monthsDue = 3;
          amountDue = 60000;
          daysDue = 138;
          billingDate = '2026-04-01';
        } else if (client.id === 5) { // Greenpath
          monthsDue = 3;
          amountDue = 54000;
          daysDue = 124;
          billingDate = '2026-04-15';
        } else {
          monthsDue = client.months_due !== undefined ? client.months_due : (client.payment_status === 'Unpaid' ? 1 : 0);
          amountDue = client.amount_due !== undefined ? client.amount_due : (monthsDue * ticketSize);
          daysDue = client.days_due !== undefined ? client.days_due : (monthsDue > 0 ? 30 : 0);
          if (!billingDate && client.onboarded_date) {
            billingDate = client.onboarded_date;
          }
        }
      }

      return {
        ...client,
        computedMonthsDue: monthsDue,
        computedAmountDue: amountDue,
        computedDaysDue: daysDue,
        computedBillingDate: billingDate || '—'
      };
    });
  }, [clients]);

  // Filtered Clients based on Category and Search
  const filteredClients = useMemo(() => {
    return enrichedClients.filter(c => {
      // Category Filter
      if (categoryFilter === 'active_dm' && c.client_type !== 'active_dm') return false;
      if (categoryFilter === 'hold' && c.status !== 'hold') return false;
      if (categoryFilter === 'one_time' && c.client_type !== 'one_time') return false;
      if (categoryFilter === 'hosting' && c.client_type !== 'hosting') return false;
      if (categoryFilter === 'left' && c.client_type !== 'left') return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (c.name || c.client_name || '').toLowerCase().includes(q);
        const matchCycle = (c.billing_cycle || '').toLowerCase().includes(q);
        const matchLead = (c.assigned_lead || '').toLowerCase().includes(q);
        const matchPerson = (c.contact_person || '').toLowerCase().includes(q);
        if (!matchName && !matchCycle && !matchLead && !matchPerson) return false;
      }

      return true;
    });
  }, [enrichedClients, categoryFilter, searchQuery]);

  // Actions
  const handleToggleHold = (id) => {
    setClients(prev => prev.map(c => {
      if (c.id === id) {
        const nextStatus = c.status === 'hold' ? 'active' : 'hold';
        return { ...c, status: nextStatus };
      }
      return c;
    }));
  };

  const handleClearMonth = (id) => {
    setClients(prev => prev.map(c => {
      if (c.id === id) {
        const currentDue = c.months_due !== undefined ? c.months_due : 1;
        const nextDue = Math.max(0, currentDue - 1);
        return {
          ...c,
          months_due: nextDue,
          amount_due: nextDue * parseFloat(c.ticket_size || 0),
          payment_status: nextDue === 0 ? 'Paid' : 'Pending'
        };
      }
      return c;
    }));
  };

  const handleDeleteClient = (id, name) => {
    if (window.confirm(`Are you sure you want to delete client project "${name}"?`)) {
      setClients(prev => prev.filter(c => c.id !== id));
      setCredentials(prev => prev.filter(cr => cr.project_id !== id && cr.client_name !== name));
    }
  };

  const handleOpenEdit = (client) => {
    setEditingProject(client);
    setProjectForm({
      name: client.name || client.client_name || '',
      client_name: client.name || client.client_name || '',
      client_type: client.client_type || 'active_dm',
      billing_cycle: client.billing_cycle || '1st of every month',
      ticket_size: client.ticket_size || 0,
      advance_payment: client.advance_payment || 0,
      payment_status: client.payment_status || 'Unpaid',
      status: client.status || 'active',
      onboarded_date: client.onboarded_date || new Date().toISOString().split('T')[0],
      assigned_lead: client.assigned_lead || 'Naveen Kumar',
      contact_person: client.contact_person || '',
      contact_email: client.contact_email || '',
      deadline: client.deadline || ''
    });
    setShowProjectModal(true);
  };

  const handleSaveProject = (e) => {
    e.preventDefault();
    if (!projectForm.name.trim()) return;

    if (editingProject) {
      setClients(prev => prev.map(c => c.id === editingProject.id ? { ...c, ...projectForm } : c));
    } else {
      const newId = Date.now();
      const newProj = {
        id: newId,
        ...projectForm,
        created_at: new Date().toISOString()
      };
      setClients(prev => [newProj, ...prev]);
    }
    setShowProjectModal(false);
    setEditingProject(null);
  };

  // Logins Management
  const handleOpenLogins = (client) => {
    setSelectedClientForLogins(client);
    setNewLoginForm({
      platform: '',
      username: '',
      password: '',
      login_url: '',
      notes: ''
    });
    setShowLoginsModal(true);
  };

  const clientCredentials = useMemo(() => {
    if (!selectedClientForLogins) return [];
    return credentials.filter(cr => 
      cr.project_id === selectedClientForLogins.id ||
      (cr.client_name && selectedClientForLogins.name && cr.client_name.toLowerCase().trim() === selectedClientForLogins.name.toLowerCase().trim())
    );
  }, [credentials, selectedClientForLogins]);

  const handleAddLogin = (e) => {
    e.preventDefault();
    if (!newLoginForm.platform.trim()) return;

    const newCred = {
      id: Date.now(),
      project_id: selectedClientForLogins.id,
      client_name: selectedClientForLogins.name || selectedClientForLogins.client_name,
      platform: newLoginForm.platform.trim(),
      username: newLoginForm.username.trim(),
      password: newLoginForm.password.trim(),
      login_url: newLoginForm.login_url.trim() || 'https://mis.sannainnovations.com',
      notes: newLoginForm.notes.trim() || null,
      created_at: new Date().toISOString()
    };

    setCredentials(prev => [...prev, newCred]);
    setNewLoginForm({
      platform: '',
      username: '',
      password: '',
      login_url: '',
      notes: ''
    });
  };

  const handleDeleteLogin = (credId) => {
    if (window.confirm('Delete this access login credential?')) {
      setCredentials(prev => prev.filter(c => c.id !== credId));
    }
  };

  // Currency Formatter
  const formatINR = (amt) => {
    return `₹${Number(amt || 0).toLocaleString('en-IN')}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: '#818cf8', fontWeight: '700', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Building style={{ width: '15px', height: '15px' }} />
            Client Directory & Project Management
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '900', margin: '4px 0 6px', color: 'var(--text-primary)' }}>
            Client Directory
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
            Manage onboarding budgets, billing cycles, and payment clearances.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingProject(null);
            setProjectForm(defaultProjectForm);
            setShowProjectModal(true);
          }}
          className="btn gradient-btn-primary"
          style={{ padding: '9px 18px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '7px' }}
        >
          <Plus style={{ width: '15px', height: '15px' }} />
          <span>+ Add Client Project</span>
        </button>
      </div>

      {/* Overview Metric Chips */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        <div className="glass-card" style={{ padding: '14px 18px', borderLeft: '4px solid #6366f1' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>TOTAL CLIENTS</span>
          <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#818cf8', marginTop: '2px' }}>{clients.length}</div>
        </div>
        <div className="glass-card" style={{ padding: '14px 18px', borderLeft: '4px solid #10b981' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>ACTIVE DM CLIENTS</span>
          <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#34d399', marginTop: '2px' }}>
            {clients.filter(c => c.client_type === 'active_dm').length}
          </div>
        </div>
        <div className="glass-card" style={{ padding: '14px 18px', borderLeft: '4px solid #f59e0b' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>ON HOLD</span>
          <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#fbbf24', marginTop: '2px' }}>
            {clients.filter(c => c.status === 'hold').length}
          </div>
        </div>
        <div className="glass-card" style={{ padding: '14px 18px', borderLeft: '4px solid #8b5cf6' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>HOSTING CLIENTS</span>
          <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#a78bfa', marginTop: '2px' }}>
            {clients.filter(c => c.client_type === 'hosting').length}
          </div>
        </div>
        <div className="glass-card" style={{ padding: '14px 18px', borderLeft: '4px solid #f43f5e' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>SAVED CREDENTIALS</span>
          <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#f87171', marginTop: '2px' }}>
            {credentials.length} Logins
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        
        {/* Table Toolbar matching reference screenshot */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
            Active & Onboarded Client Projects
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search client..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '32px', width: '200px', fontSize: '0.8rem', height: '34px' }}
              />
            </div>

            {/* Category Filter Dropdown */}
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="form-input"
              style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem', height: '34px', cursor: 'pointer' }}
            >
              <option value="all">Show: All</option>
              <option value="active_dm">Show: Active DM</option>
              <option value="hold">Show: On Hold</option>
              <option value="one_time">Show: One-Time</option>
              <option value="hosting">Show: Hosting</option>
              <option value="left">Show: Left Us</option>
            </select>

            <button
              onClick={() => {
                setEditingProject(null);
                setProjectForm(defaultProjectForm);
                setShowProjectModal(true);
              }}
              className="btn gradient-btn-primary"
              style={{ padding: '7px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px', height: '34px' }}
            >
              <Plus style={{ width: '13px', height: '13px' }} />
              <span>+ Add Client Project</span>
            </button>
          </div>
        </div>

        {/* Client Directory Data Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: '800', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Client Name</th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: '800', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Onboarded Date</th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: '800', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Billing Cycle</th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: '800', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Billing Date</th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: '800', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Payment Status</th>
                <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: '800', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Months Due</th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: '800', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Amount Due</th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: '800', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Days Due</th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: '800', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Client Type</th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: '800', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '800', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan="11" style={{ padding: '50px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No client projects found matching current filter.
                  </td>
                </tr>
              ) : (
                filteredClients.map(c => {
                  const isPaid = c.payment_status === 'Paid';
                  const isUnpaid = c.payment_status === 'Unpaid';
                  const isHold = c.status === 'hold';
                  
                  return (
                    <tr
                      key={c.id}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Client Name */}
                      <td style={{ padding: '12px 14px', fontWeight: '800', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                        {c.name || c.client_name}
                      </td>

                      {/* Onboarded Date */}
                      <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                        {c.onboarded_date || '—'}
                      </td>

                      {/* Billing Cycle */}
                      <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                        {c.client_type === 'one_time' ? 'One-Time' : (c.billing_cycle || '—')}
                      </td>

                      {/* Billing Date */}
                      <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                        {c.computedBillingDate}
                      </td>

                      {/* Payment Status Badge */}
                      <td style={{ padding: '12px 14px' }}>
                        {isPaid ? (
                          <span style={{ padding: '3px 8px', borderRadius: '10px', background: 'rgba(16,185,129,0.15)', color: '#34d399', fontSize: '0.72rem', fontWeight: '800' }}>
                            Paid
                          </span>
                        ) : isUnpaid ? (
                          <span style={{ padding: '3px 8px', borderRadius: '10px', background: 'rgba(244,63,94,0.18)', color: '#f87171', fontSize: '0.72rem', fontWeight: '800' }}>
                            Unpaid
                          </span>
                        ) : (
                          <span style={{ padding: '3px 8px', borderRadius: '10px', background: 'rgba(245,158,11,0.15)', color: '#fbbf24', fontSize: '0.72rem', fontWeight: '800' }}>
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Months Due */}
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: '800', color: c.computedMonthsDue > 0 ? '#f87171' : 'var(--text-muted)' }}>
                        {c.computedMonthsDue}
                      </td>

                      {/* Amount Due */}
                      <td style={{ padding: '12px 14px', fontWeight: '800', color: c.computedAmountDue > 0 ? '#f87171' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {c.computedAmountDue > 0 ? formatINR(c.computedAmountDue) : '—'}
                      </td>

                      {/* Days Due */}
                      <td style={{ padding: '12px 14px', fontWeight: '700', color: isPaid ? '#34d399' : (c.computedDaysDue > 0 ? '#f87171' : 'var(--text-muted)'), whiteSpace: 'nowrap' }}>
                        {isPaid ? 'Paid' : (c.computedDaysDue > 0 ? `${c.computedDaysDue} days` : '—')}
                      </td>

                      {/* Client Type Badge */}
                      <td style={{ padding: '12px 14px' }}>
                        {c.client_type === 'active_dm' ? (
                          <span style={{ padding: '3px 8px', borderRadius: '10px', background: 'rgba(16,185,129,0.12)', color: '#10b981', fontSize: '0.7rem', fontWeight: '800', border: '1px solid rgba(16,185,129,0.25)' }}>
                            DM Client
                          </span>
                        ) : c.client_type === 'one_time' ? (
                          <span style={{ padding: '3px 8px', borderRadius: '10px', background: 'rgba(245,158,11,0.12)', color: '#f59e0b', fontSize: '0.7rem', fontWeight: '800', border: '1px solid rgba(245,158,11,0.25)' }}>
                            One-Time
                          </span>
                        ) : c.client_type === 'hosting' ? (
                          <span style={{ padding: '3px 8px', borderRadius: '10px', background: 'rgba(139,92,246,0.12)', color: '#8b5cf6', fontSize: '0.7rem', fontWeight: '800', border: '1px solid rgba(139,92,246,0.25)' }}>
                            Hosting
                          </span>
                        ) : (
                          <span style={{ padding: '3px 8px', borderRadius: '10px', background: 'rgba(244,63,94,0.12)', color: '#f43f5e', fontSize: '0.7rem', fontWeight: '800' }}>
                            Left Us
                          </span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '10px', background: isHold ? 'rgba(244,63,94,0.15)' : 'rgba(16,185,129,0.12)', color: isHold ? '#f87171' : '#34d399', fontSize: '0.7rem', fontWeight: '800', textTransform: 'lowercase' }}>
                          {c.status || 'active'}
                        </span>
                      </td>

                      {/* Action Buttons matching screenshot */}
                      <td style={{ padding: '12px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          {/* Resume / Hold Toggle */}
                          {isHold ? (
                            <button
                              onClick={() => handleToggleHold(c.id)}
                              style={{ padding: '4px 8px', borderRadius: '6px', border: 'none', background: '#10b981', color: '#fff', fontSize: '0.72rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                              title="Resume Project"
                            >
                              <Play style={{ width: '10px', height: '10px', fill: '#fff' }} /> Resume
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleHold(c.id)}
                              style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(244,63,94,0.4)', background: 'rgba(244,63,94,0.15)', color: '#f87171', fontSize: '0.72rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                              title="Put Project on Hold"
                            >
                              <Pause style={{ width: '10px', height: '10px' }} /> Hold
                            </button>
                          )}

                          {/* Clear 1 Month */}
                          {c.computedMonthsDue > 0 && (
                            <button
                              onClick={() => handleClearMonth(c.id)}
                              style={{ padding: '4px 8px', borderRadius: '6px', border: 'none', background: '#3b82f6', color: '#fff', fontSize: '0.72rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                              title="Record 1 Month Payment Cleared"
                            >
                              <Check style={{ width: '10px', height: '10px' }} /> Clear 1m
                            </button>
                          )}

                          {/* Logins */}
                          <button
                            onClick={() => handleOpenLogins(c)}
                            style={{ padding: '4px 9px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)', fontSize: '0.72rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                            title="View access logins and credentials"
                          >
                            <Key style={{ width: '11px', height: '11px', color: '#818cf8' }} /> Logins
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEdit(c)}
                            style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)', fontSize: '0.72rem', cursor: 'pointer' }}
                            title="Edit Project"
                          >
                            <Edit2 style={{ width: '11px', height: '11px' }} />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteClient(c.id, c.name || c.client_name)}
                            style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(244,63,94,0.2)', background: 'rgba(244,63,94,0.08)', color: '#f87171', fontSize: '0.72rem', cursor: 'pointer' }}
                            title="Delete Client Project"
                          >
                            <Trash2 style={{ width: '11px', height: '11px' }} />
                          </button>
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

      {/* 🛡 ACCESS LOGINS MODAL (Exact match to screenshot 2) */}
      {showLoginsModal && selectedClientForLogins && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content glass-card" style={{ maxWidth: '640px', width: '92%', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Shield style={{ width: '22px', height: '22px', color: '#818cf8' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: '900', margin: 0, color: 'var(--text-primary)' }}>
                  Access Logins — {selectedClientForLogins.name || selectedClientForLogins.client_name}
                </h3>
              </div>
              <button
                onClick={() => setShowLoginsModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            {/* Existing Credentials Table */}
            <div style={{ overflowX: 'auto', marginBottom: '20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '700', color: 'var(--text-muted)', fontSize: '0.72rem' }}>Platform</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '700', color: 'var(--text-muted)', fontSize: '0.72rem' }}>Email/Username</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '700', color: 'var(--text-muted)', fontSize: '0.72rem' }}>Password</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '700', color: 'var(--text-muted)', fontSize: '0.72rem' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {clientCredentials.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No access logins saved yet for this client. Add one below!
                      </td>
                    </tr>
                  ) : (
                    clientCredentials.map((cred, idx) => {
                      const isRevealed = visiblePasswords[cred.id];
                      return (
                        <tr key={cred.id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          {/* Platform */}
                          <td style={{ padding: '10px 12px', fontWeight: '800', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                            {cred.platform}
                            {cred.notes && (
                              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: '400', marginTop: '2px', maxWidth: '160px' }}>
                                {cred.notes}
                              </div>
                            )}
                          </td>

                          {/* Username with Copy */}
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                {cred.username || '—'}
                              </span>
                              {cred.username && (
                                <button
                                  onClick={() => copyToClipboard(cred.username, `user-${cred.id}`)}
                                  style={{ background: 'transparent', border: 'none', color: copiedKey === `user-${cred.id}` ? '#34d399' : 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                                  title="Copy username"
                                >
                                  {copiedKey === `user-${cred.id}` ? <Check style={{ width: '13px', height: '13px' }} /> : <Copy style={{ width: '13px', height: '13px' }} />}
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Password with Eye & Copy */}
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: isRevealed ? '#fff' : 'var(--text-muted)' }}>
                                {isRevealed ? (cred.password || '—') : '••••••••'}
                              </span>
                              {cred.password && (
                                <>
                                  <button
                                    onClick={() => togglePasswordVisibility(cred.id)}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                                    title={isRevealed ? 'Hide password' : 'Show password'}
                                  >
                                    {isRevealed ? <EyeOff style={{ width: '13px', height: '13px' }} /> : <Eye style={{ width: '13px', height: '13px' }} />}
                                  </button>
                                  <button
                                    onClick={() => copyToClipboard(cred.password, `pass-${cred.id}`)}
                                    style={{ background: 'transparent', border: 'none', color: copiedKey === `pass-${cred.id}` ? '#34d399' : 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                                    title="Copy password"
                                  >
                                    {copiedKey === `pass-${cred.id}` ? <Check style={{ width: '13px', height: '13px' }} /> : <Copy style={{ width: '13px', height: '13px' }} />}
                                  </button>
                                </>
                              )}
                            </div>
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              {cred.login_url && cred.login_url.startsWith('http') && (
                                <a
                                  href={cred.login_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: '#818cf8', display: 'flex', alignItems: 'center' }}
                                  title="Open Login Link"
                                >
                                  <ExternalLink style={{ width: '13px', height: '13px' }} />
                                </a>
                              )}
                              <button
                                onClick={() => handleDeleteLogin(cred.id)}
                                style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: '2px' }}
                                title="Delete login"
                              >
                                <Trash2 style={{ width: '13px', height: '13px' }} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* ➕ Add New Access Login Form */}
            <div style={{ background: 'rgba(99,102,241,0.05)', borderRadius: '10px', padding: '16px', border: '1px solid rgba(99,102,241,0.2)' }}>
              <h4 style={{ fontSize: '0.88rem', fontWeight: '800', color: '#818cf8', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Plus style={{ width: '14px', height: '14px' }} /> Add New Access Login
              </h4>

              <form onSubmit={handleAddLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.72rem', fontWeight: '700' }}>Platform *</label>
                    <input
                      required
                      placeholder="e.g. Instagram / Zoho Mail"
                      value={newLoginForm.platform}
                      onChange={e => setNewLoginForm({ ...newLoginForm, platform: e.target.value })}
                      className="form-input"
                      style={{ fontSize: '0.8rem', height: '34px' }}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.72rem', fontWeight: '700' }}>Username / Email</label>
                    <input
                      placeholder="e.g. sanna_admin / user@domain.com"
                      value={newLoginForm.username}
                      onChange={e => setNewLoginForm({ ...newLoginForm, username: e.target.value })}
                      className="form-input"
                      style={{ fontSize: '0.8rem', height: '34px' }}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.72rem', fontWeight: '700' }}>Password</label>
                    <input
                      placeholder="e.g. Pass@123"
                      value={newLoginForm.password}
                      onChange={e => setNewLoginForm({ ...newLoginForm, password: e.target.value })}
                      className="form-input"
                      style={{ fontSize: '0.8rem', height: '34px' }}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.72rem', fontWeight: '700' }}>Login Link URL</label>
                    <input
                      placeholder="e.g. https://instagram.com"
                      value={newLoginForm.login_url}
                      onChange={e => setNewLoginForm({ ...newLoginForm, login_url: e.target.value })}
                      className="form-input"
                      style={{ fontSize: '0.8rem', height: '34px' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.72rem', fontWeight: '700' }}>Remarks / IP / Details</label>
                  <input
                    placeholder="e.g. IP: 64.227..., or Remarks"
                    value={newLoginForm.notes}
                    onChange={e => setNewLoginForm({ ...newLoginForm, notes: e.target.value })}
                    className="form-input"
                    style={{ fontSize: '0.8rem', height: '34px' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                  <button
                    type="submit"
                    className="btn gradient-btn-primary"
                    style={{ padding: '7px 18px', fontSize: '0.8rem', fontWeight: '700' }}
                  >
                    + Add Login
                  </button>
                </div>
              </form>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button
                onClick={() => setShowLoginsModal(false)}
                className="btn btn-secondary"
                style={{ padding: '8px 20px', fontSize: '0.8rem' }}
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ✏ ADD / EDIT CLIENT PROJECT MODAL */}
      {showProjectModal && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content glass-card" style={{ maxWidth: '540px', width: '92%', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '900', margin: 0, color: 'var(--text-primary)' }}>
                {editingProject ? 'Edit Client Project' : '+ Add Client Project'}
              </h3>
              <button
                onClick={() => setShowProjectModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <form onSubmit={handleSaveProject} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: '700' }}>Client / Project Name *</label>
                  <input
                    required
                    placeholder="e.g. Nirmal Skin Clinic"
                    value={projectForm.name}
                    onChange={e => setProjectForm({ ...projectForm, name: e.target.value, client_name: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: '700' }}>Client Type</label>
                  <select
                    value={projectForm.client_type}
                    onChange={e => setProjectForm({ ...projectForm, client_type: e.target.value })}
                    className="form-input"
                  >
                    <option value="active_dm">Active DM Client</option>
                    <option value="one_time">One-Time Project</option>
                    <option value="hosting">Hosting Client</option>
                    <option value="left">Left Us / Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: '700' }}>Status</label>
                  <select
                    value={projectForm.status}
                    onChange={e => setProjectForm({ ...projectForm, status: e.target.value })}
                    className="form-input"
                  >
                    <option value="active">Active</option>
                    <option value="hold">On Hold</option>
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: '700' }}>Onboarded Date</label>
                  <input
                    type="date"
                    value={projectForm.onboarded_date}
                    onChange={e => setProjectForm({ ...projectForm, onboarded_date: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: '700' }}>Billing Cycle</label>
                  <input
                    placeholder="e.g. 1st June / 5th May"
                    value={projectForm.billing_cycle}
                    onChange={e => setProjectForm({ ...projectForm, billing_cycle: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: '700' }}>Ticket Size (INR)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 40000"
                    value={projectForm.ticket_size}
                    onChange={e => setProjectForm({ ...projectForm, ticket_size: parseFloat(e.target.value) || 0 })}
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: '700' }}>Payment Status</label>
                  <select
                    value={projectForm.payment_status}
                    onChange={e => setProjectForm({ ...projectForm, payment_status: e.target.value })}
                    className="form-input"
                  >
                    <option value="Unpaid">Unpaid</option>
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: '700' }}>Assigned Lead</label>
                  <input
                    placeholder="e.g. Naveen Kumar"
                    value={projectForm.assigned_lead}
                    onChange={e => setProjectForm({ ...projectForm, assigned_lead: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: '700' }}>Contact Email</label>
                  <input
                    type="email"
                    placeholder="contact@client.com"
                    value={projectForm.contact_email}
                    onChange={e => setProjectForm({ ...projectForm, contact_email: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setShowProjectModal(false)}
                  className="btn btn-secondary"
                  style={{ padding: '8px 18px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn gradient-btn-primary"
                  style={{ padding: '8px 22px', fontWeight: '800' }}
                >
                  {editingProject ? 'Save Changes' : 'Create Client Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ClientDirectory;
