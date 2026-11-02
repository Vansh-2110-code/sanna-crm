const OLD_LEADS_TO_PURGE = new Set([
  'apn hording', 'mysira', 'madrx healthcare portal', 'spices e-commerce dm',
  'naeem / alis digital', 'pvd coating portal', 'mr. veeresh enterprise',
  'sri lalitha tours & travels', 'madrx', 'naeem / alis', 'apn'
]);

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
  ChevronDown,
  FileText,
  Upload
} from 'lucide-react';

const ClientDirectory = () => {
  const { theme } = useCRM();
  const isDark = theme === 'dark';

    // Persistent tracking of deleted client names/IDs
  const getDeletedClientSet = () => {
    try {
      const saved = localStorage.getItem('astra_deleted_client_keys_v2');
      if (saved) return new Set(JSON.parse(saved));
    } catch (e) {}
    return new Set();
  };

  // Local state for Clients with localStorage persistence
  const [clients, setClients] = useState(() => {
    const deletedSet = getDeletedClientSet();
    const saved = localStorage.getItem('astra_client_directory_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter(c => {
            const idKey = String(c.id);
            const nameKey = (c.name || c.client_name || '').toLowerCase().trim();
            return !deletedSet.has(idKey) && !deletedSet.has(nameKey) && !OLD_LEADS_TO_PURGE.has(nameKey);
          });
        }
      } catch (e) {}
    }
    return [];
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

    // Live sync with server API (Server is single source of truth, never re-inserts deleted)
  React.useEffect(() => {
    let isMounted = true;
    const syncClientsFromServer = async () => {
      try {
        const res = await fetch('/api/mis/clients');
        if (res.ok) {
          const serverData = await res.json();
          if (Array.isArray(serverData) && serverData.length > 0 && isMounted) {
            const deletedSet = getDeletedClientSet();
            const cleanServerData = serverData.filter(c => {
              const idKey = String(c.id);
              const nameKey = (c.name || c.client_name || '').toLowerCase().trim();
              return !deletedSet.has(idKey) && !deletedSet.has(nameKey) && !OLD_LEADS_TO_PURGE.has(nameKey);
            });

            // De-duplicate in memory by normalized name/domain to prevent any duplicate display
            const seen = new Set();
            const uniqueClients = [];
            cleanServerData.forEach(c => {
              const rawName = (c.name || c.client_name || '').toLowerCase().trim();
              const baseName = rawName.replace(/\.(in|com|co\.in|org|net|bio)$/i, '');
              const key = c.client_type === 'hosting' ? baseName : rawName;
              if (!seen.has(key)) {
                seen.add(key);
                uniqueClients.push(c);
              }
            });

            setClients(uniqueClients);
            try {
              localStorage.setItem('astra_client_directory_v1', JSON.stringify(cleanServerData));
            } catch (e) {}
          }
        }
      } catch (e) {}
    };
    syncClientsFromServer();
    const timer = setInterval(syncClientsFromServer, 5000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  // Filtering and Search States
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all' | 'active_dm' | 'hold' | 'one_time' | 'hosting' | 'left'
  const [paymentFilter, setPaymentFilter] = useState('ALL'); // 'ALL' | 'PAID' | 'UNPAID'
  const [searchQuery, setSearchQuery] = useState('');

  // Modal States
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [selectedClientForLogins, setSelectedClientForLogins] = useState(null);
  const [showLoginsModal, setShowLoginsModal] = useState(false);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [selectedClientForAdvance, setSelectedClientForAdvance] = useState(null);
  const [advanceInput, setAdvanceInput] = useState('');

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
    deadline: '',
    brochure_pdf: '',
    requirement_doc_name: ''
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

  // Base category clients before payment/search filter for accurate tab counts
  const categoryBaseClients = useMemo(() => {
    return enrichedClients.filter(c => {
      if (categoryFilter === 'active_dm' && (c.client_type !== 'active_dm' || c.status === 'upcoming')) return false;
      if (categoryFilter === 'hold' && c.status !== 'hold') return false;
      if (categoryFilter === 'one_time' && (c.client_type !== 'one_time' || c.status === 'upcoming')) return false;
      if (categoryFilter === 'hosting' && (c.client_type !== 'hosting' || c.status === 'upcoming')) return false;
      if (categoryFilter === 'upcoming' && c.status !== 'upcoming' && c.client_type !== 'upcoming' && c.project_status !== 'upcoming') return false;
      if (categoryFilter === 'left' && c.client_type !== 'left') return false;
      return true;
    });
  }, [enrichedClients, categoryFilter]);

  // Filtered Clients based on Category, Payment Status, and Search
  const filteredClients = useMemo(() => {
    return categoryBaseClients.filter(c => {
      // Payment Status filter
      if (paymentFilter === 'PAID') {
        const isPaid = (c.payment_status || '').toLowerCase() === 'paid';
        if (!isPaid) return false;
      } else if (paymentFilter === 'UNPAID') {
        const isPaid = (c.payment_status || '').toLowerCase() === 'paid';
        if (isPaid) return false;
      }

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
  }, [categoryBaseClients, paymentFilter, searchQuery]);

  // Actions
  const handleToggleHold = (id) => {
    let nextStatus = 'hold';
    setClients(prev => prev.map(c => {
      if (c.id === id) {
        nextStatus = c.status === 'hold' ? 'active' : 'hold';
        return { ...c, status: nextStatus };
      }
      return c;
    }));
    try {
      fetch(`/api/mis/clients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      }).catch(() => {});
    } catch (e) {}
  };

  const handleClearMonth = (id) => {
    setClients(prev => prev.map(c => {
      if (c.id === id) {
        const currentDue = c.months_due !== undefined ? c.months_due : 1;
        const nextDue = Math.max(0, currentDue - 1);
        const updated = {
          ...c,
          months_due: nextDue,
          amount_due: nextDue * parseFloat(c.ticket_size || 0),
          payment_status: nextDue === 0 ? 'Paid' : 'Pending'
        };
        try {
          fetch(`/api/mis/clients/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ payment_status: updated.payment_status })
          }).catch(() => {});
        } catch (e) {}
        return updated;
      }
      return c;
    }));
  };

    const handleStatusChange = async (id, newStatus) => {
    setClients(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, status: newStatus } : c);
      try { localStorage.setItem('astra_client_directory_v1', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });

    try {
      await fetch(`/api/mis/clients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (e) {
      console.warn('Status change sync error:', e);
    }
  };

  const handleDeleteClient = async (id, name) => {
    const targetName = name || '';
    if (window.confirm(`Are you sure you want to permanently delete client project "${targetName}"?`)) {
      const idKey = String(id);
      const nameKey = targetName.toLowerCase().trim();
      const baseKey = nameKey.replace(/\.(in|com|co\.in|org|net|bio)$/i, '');
      const deletedSet = getDeletedClientSet();
      deletedSet.add(idKey);
      if (nameKey) deletedSet.add(nameKey);
      if (baseKey) deletedSet.add(baseKey);
      try {
        localStorage.setItem('astra_deleted_client_keys_v2', JSON.stringify(Array.from(deletedSet)));
      } catch (e) {}

      // Remove immediately from clients state & localStorage
      setClients(prev => {
        const next = prev.filter(c => {
          const cId = String(c.id);
          const cName = (c.name || c.client_name || '').toLowerCase().trim();
          const cBase = cName.replace(/\.(in|com|co\.in|org|net|bio)$/i, '');
          return cId !== idKey && cName !== nameKey && cBase !== baseKey;
        });
        try { localStorage.setItem('astra_client_directory_v1', JSON.stringify(next)); } catch (e) {}
        return next;
      });

      // Remove associated credentials
      setCredentials(prev => prev.filter(cr => {
        const crId = String(cr.project_id);
        const crName = (cr.client_name || '').toLowerCase().trim();
        return crId !== idKey && crName !== nameKey;
      }));

      // Send DELETE directly to server SQLite database
      try {
        await fetch(`/api/mis/clients/${id}`, { method: 'DELETE' });
        await fetch('/api/mis/clients/delete-by-name', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: targetName, id })
        });
      } catch (e) {
        console.warn('Delete client network error:', e);
      }
    }
  };

  const handleOpenAdvanceModal = (client) => {
    setSelectedClientForAdvance(client);
    setAdvanceInput(client.advance_payment !== undefined ? client.advance_payment : 0);
    setShowAdvanceModal(true);
  };

  const handleSaveAdvancePayment = async (e) => {
    e.preventDefault();
    if (!selectedClientForAdvance) return;

    const advVal = Math.max(0, parseFloat(advanceInput) || 0);
    const ticket = parseFloat(selectedClientForAdvance.ticket_size || 0);
    const newPaymentStatus = (advVal >= ticket && ticket > 0) ? 'Paid' : (advVal > 0 ? 'Pending' : (selectedClientForAdvance.payment_status || 'Unpaid'));

    setClients(prev => prev.map(c => {
      if (c.id === selectedClientForAdvance.id) {
        return {
          ...c,
          advance_payment: advVal,
          payment_status: newPaymentStatus
        };
      }
      return c;
    }));

    try {
      await fetch(`/api/mis/clients/${selectedClientForAdvance.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          advance_payment: advVal,
          payment_status: newPaymentStatus
        })
      });
    } catch (err) {
      console.warn('Failed to sync advance payment:', err);
    }

    setShowAdvanceModal(false);
    setSelectedClientForAdvance(null);
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
      deadline: client.deadline || '',
      brochure_pdf: client.brochure_pdf || '',
      requirement_doc_name: client.requirement_doc_name || ''
    });
    setShowProjectModal(true);
  };

  const handleSaveProject = (e) => {
    e.preventDefault();
    if (!projectForm.name.trim()) return;

    if (editingProject) {
      setClients(prev => prev.map(c => c.id === editingProject.id ? { ...c, ...projectForm } : c));
      try {
        fetch(`/api/mis/clients/${editingProject.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(projectForm)
        }).catch(() => {});
      } catch (e) {}
    } else {
      const tempId = Date.now();
      const newProj = {
        id: tempId,
        ...projectForm,
        created_at: new Date().toISOString()
      };
      setClients(prev => [newProj, ...prev]);
      try {
        fetch('/api/mis/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(projectForm)
        })
        .then(r => r.json())
        .then(saved => {
          if (saved && saved.id) {
            setClients(prev => prev.map(c => c.id === tempId ? { ...c, ...saved, id: saved.id } : c));
          }
        })
        .catch(() => {});
      } catch (e) {}
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

    const filterTabs = [
    { id: 'all', label: 'All Organizations', count: clients.length },
    { id: 'active_dm', label: 'Active Retainers', count: clients.filter(c => c.client_type === 'active_dm' && c.status !== 'upcoming').length },
    { id: 'hold', label: 'On Hold', count: clients.filter(c => c.status === 'hold').length },
    { id: 'one_time', label: 'One-Time Dev', count: clients.filter(c => c.client_type === 'one_time' && c.status !== 'upcoming').length },
    { id: 'hosting', label: 'Hosting & Cloud', count: clients.filter(c => c.client_type === 'hosting' && c.status !== 'upcoming').length },
    { id: 'upcoming', label: 'Upcoming Projects', count: clients.filter(c => c.status === 'upcoming' || c.client_type === 'upcoming' || c.project_status === 'upcoming').length },
    { id: 'left', label: 'Left Us', count: clients.filter(c => c.client_type === 'left').length }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      
      {/* 1. VERION Top Header & Add Action */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          padding: '2px 0'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.68rem', color: '#4E3EFF', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Operations & Organization Vault
            </span>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#93FEBF' }} />
          </div>
          <h2
            style={{
              fontSize: '1.75rem',
              fontWeight: '900',
              margin: 0,
              color: isDark ? '#F9FAFB' : '#1E1F24',
              letterSpacing: '-0.03em'
            }}
          >
            Client Directory
          </h2>
          <p style={{ color: '#64748B', fontSize: '0.84rem', margin: '4px 0 0 0' }}>
            Central synchronized database of client organizations, billing schedules, and credential vaults.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingProject(null);
            setProjectForm(defaultProjectForm);
            setShowProjectModal(true);
          }}
          style={{
            background: '#4E3EFF',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '9999px',
            padding: '10px 20px',
            fontSize: '0.8rem',
            fontWeight: '800',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'all 0.18s ease',
            boxShadow: '0 4px 14px rgba(78, 62, 255, 0.3)'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          <Plus style={{ width: '16px', height: '16px' }} />
          <span>Add Client Organization</span>
        </button>
      </div>

      {/* 2. VERION 4 Pastel Summary Cards (Lavender, Mint, Peach, Yellow) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px'
        }}
      >
        {/* Lavender Card: Total Clients (Never statically 58) */}
        <div
          style={{
            background: isDark ? '#121216' : '#EEF2FF',
            border: isDark ? '1px solid #23232b' : '1px solid #C7D2FE',
            borderRadius: '20px',
            padding: '20px 22px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: '#4E3EFF', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              TOTAL ORGANIZATIONS
            </span>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: '#FFFFFF',
                color: '#4E3EFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(78, 62, 255, 0.15)'
              }}
            >
              <Building style={{ width: '16px', height: '16px' }} />
            </div>
          </div>
          <div style={{ margin: '12px 0 4px 0' }}>
            <div style={{ fontSize: '2rem', fontWeight: '900', color: isDark ? '#F9FAFB' : '#1E1F24', lineHeight: 1.1 }}>
              {clients.length}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '3px' }}>
              Synchronized active records
            </div>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#4E3EFF', fontWeight: '700', paddingTop: '8px', borderTop: '1px solid rgba(78, 62, 255, 0.15)' }}>
            ● Central Baseline Synced
          </div>
        </div>

        {/* Mint Card: Active Retainers & DM */}
        <div
          style={{
            background: isDark ? '#121216' : '#ECFDF5',
            border: isDark ? '1px solid #23232b' : '1px solid #A7F3D0',
            borderRadius: '20px',
            padding: '20px 22px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              ACTIVE RETAINERS (DM)
            </span>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: '#FFFFFF',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(16, 185, 129, 0.15)'
              }}
            >
              <TrendingUp style={{ width: '16px', height: '16px' }} />
            </div>
          </div>
          <div style={{ margin: '12px 0 4px 0' }}>
            <div style={{ fontSize: '2rem', fontWeight: '900', color: '#059669', lineHeight: 1.1 }}>
              {clients.filter(c => c.client_type === 'active_dm').length}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '3px' }}>
              Monthly digital marketing clients
            </div>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: '700', paddingTop: '8px', borderTop: '1px solid rgba(16, 185, 129, 0.15)' }}>
            Active deliverables tracking
          </div>
        </div>

        {/* Peach Card: On-Hold Projects */}
        <div
          style={{
            background: isDark ? '#121216' : '#FFF7ED',
            border: isDark ? '1px solid #23232b' : '1px solid #FED7AA',
            borderRadius: '20px',
            padding: '20px 22px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: '#EA580C', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              ON HOLD
            </span>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: '#FFFFFF',
                color: '#EA580C',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(234, 88, 12, 0.15)'
              }}
            >
              <Pause style={{ width: '16px', height: '16px' }} />
            </div>
          </div>
          <div style={{ margin: '12px 0 4px 0' }}>
            <div style={{ fontSize: '2rem', fontWeight: '900', color: '#EA580C', lineHeight: 1.1 }}>
              {clients.filter(c => c.status === 'hold').length}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '3px' }}>
              Paused billing or pending review
            </div>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#EA580C', fontWeight: '700', paddingTop: '8px', borderTop: '1px solid rgba(234, 88, 12, 0.15)' }}>
            Requires account manager action
          </div>
        </div>

        {/* Yellow Card: Hosting & One-Time Dev Projects */}
        <div
          style={{
            background: isDark ? '#121216' : '#FEFCE8',
            border: isDark ? '1px solid #23232b' : '1px solid #FEF08A',
            borderRadius: '20px',
            padding: '20px 22px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: '#CA8A04', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              ONE-TIME & HOSTING
            </span>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: '#FFFFFF',
                color: '#CA8A04',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(202, 138, 4, 0.15)'
              }}
            >
              <Server style={{ width: '16px', height: '16px' }} />
            </div>
          </div>
          <div style={{ margin: '12px 0 4px 0' }}>
            <div style={{ fontSize: '2rem', fontWeight: '900', color: '#CA8A04', lineHeight: 1.1 }}>
              {clients.filter(c => c.client_type === 'hosting' || c.client_type === 'one_time').length}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '3px' }}>
              Web development, LMS, server hosting
            </div>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#CA8A04', fontWeight: '700', paddingTop: '8px', borderTop: '1px solid rgba(202, 138, 4, 0.15)' }}>
            {credentials.length} Access Logins Stored
          </div>
        </div>
      </div>

      {/* 3. Main Card: Table Toolbar with VERION Category Pills & Search */}
      <div
        style={{
          background: isDark ? '#121216' : '#FFFFFF',
          borderRadius: '24px',
          border: isDark ? '1px solid #23232b' : '1px solid #EEF2F6',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
          overflow: 'hidden'
        }}
      >
        {/* Toolbar Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: isDark ? '1px solid #23232b' : '1px solid #F1F4F9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px'
          }}
        >
          {/* Category Filter Pills and Payment Status Segments */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              {filterTabs.map((tab) => {
                const isActive = categoryFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setCategoryFilter(tab.id)}
                    style={{
                      border: 'none',
                      borderRadius: '9999px',
                      padding: '7px 14px',
                      fontSize: '0.76rem',
                      fontWeight: isActive ? '800' : '600',
                      background: isActive ? '#4E3EFF' : (isDark ? '#1c1c22' : '#F1F4F9'),
                      color: isActive ? '#FFFFFF' : '#94A3B8',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>{tab.label}</span>
                    <span
                      style={{
                        background: isActive ? 'rgba(255,255,255,0.2)' : (isDark ? '#23232b' : '#E2E8F0'),
                        color: isActive ? '#FFFFFF' : '#64748B',
                        padding: '1px 6px',
                        borderRadius: '9999px',
                        fontSize: '0.64rem',
                        fontWeight: '800'
                      }}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Payment Status Segmented Filter */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                background: isDark ? '#1a1a24' : '#F1F5F9',
                padding: '4px',
                borderRadius: '9999px',
                border: isDark ? '1px solid #282838' : '1px solid #E2E8F0'
              }}
            >
              <span style={{ fontSize: '0.66rem', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', padding: '0 8px' }}>
                Payment:
              </span>
              {[
                { id: 'ALL', label: 'All', count: categoryBaseClients.length, color: '#4E3EFF' },
                { id: 'PAID', label: 'Paid', count: categoryBaseClients.filter(c => (c.payment_status || '').toLowerCase() === 'paid').length, color: '#10b981' },
                { id: 'UNPAID', label: 'Unpaid', count: categoryBaseClients.filter(c => (c.payment_status || '').toLowerCase() !== 'paid').length, color: '#ef4444' }
              ].map(pTab => {
                const isActive = paymentFilter === pTab.id;
                return (
                  <button
                    key={pTab.id}
                    onClick={() => setPaymentFilter(pTab.id)}
                    style={{
                      border: 'none',
                      borderRadius: '9999px',
                      padding: '5px 12px',
                      fontSize: '0.72rem',
                      fontWeight: isActive ? '800' : '600',
                      background: isActive ? pTab.color : 'transparent',
                      color: isActive ? '#FFFFFF' : (isDark ? '#94A3B8' : '#64748B'),
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>{pTab.label}</span>
                    <span
                      style={{
                        background: isActive ? 'rgba(255,255,255,0.25)' : (isDark ? '#23232b' : '#E2E8F0'),
                        color: isActive ? '#FFFFFF' : '#64748B',
                        padding: '1px 6px',
                        borderRadius: '9999px',
                        fontSize: '0.62rem',
                        fontWeight: '800'
                      }}
                    >
                      {pTab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* VERION Search Pill */}
          <div style={{ position: 'relative', minWidth: '220px' }}>
            <Search
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '14px',
                height: '14px',
                color: '#94A3B8'
              }}
            />
            <input
              type="text"
              placeholder="Search organizations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '34px',
                paddingRight: '14px',
                paddingTop: '8px',
                paddingBottom: '8px',
                borderRadius: '9999px',
                background: isDark ? '#1c1c22' : '#F1F4F9',
                border: isDark ? '1px solid #23232b' : '1px solid transparent',
                fontSize: '0.78rem',
                color: isDark ? '#F9FAFB' : '#1E1F24',
                outline: 'none',
                transition: 'all 0.15s ease'
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#4E3EFF')}
              onBlur={(e) => (e.currentTarget.style.borderColor = isDark ? '#23232b' : 'transparent')}
            />
          </div>
        </div>

        {/* Client Directory Data Table (Compact Full-Width No-Scroll View) */}
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', tableLayout: 'auto' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                <th style={{ padding: '8px 8px', textAlign: 'left', fontWeight: '800', color: 'var(--text-muted)', fontSize: '0.68rem', textTransform: 'uppercase' }}>Client Name</th>
                <th style={{ padding: '8px 6px', textAlign: 'left', fontWeight: '800', color: 'var(--text-muted)', fontSize: '0.68rem', textTransform: 'uppercase' }}>Onboarded</th>
                <th style={{ padding: '8px 6px', textAlign: 'left', fontWeight: '800', color: 'var(--text-muted)', fontSize: '0.68rem', textTransform: 'uppercase' }}>Billing Cycle</th>
                <th style={{ padding: '8px 6px', textAlign: 'left', fontWeight: '800', color: 'var(--text-muted)', fontSize: '0.68rem', textTransform: 'uppercase' }}>Billing Date</th>
                <th style={{ padding: '8px 6px', textAlign: 'center', fontWeight: '800', color: 'var(--text-muted)', fontSize: '0.68rem', textTransform: 'uppercase' }}>Payment</th>
                <th style={{ padding: '8px 4px', textAlign: 'center', fontWeight: '800', color: 'var(--text-muted)', fontSize: '0.68rem', textTransform: 'uppercase' }}>Months</th>
                <th style={{ padding: '8px 6px', textAlign: 'right', fontWeight: '800', color: 'var(--text-muted)', fontSize: '0.68rem', textTransform: 'uppercase' }}>Amount Due</th>
                <th style={{ padding: '8px 6px', textAlign: 'center', fontWeight: '800', color: 'var(--text-muted)', fontSize: '0.68rem', textTransform: 'uppercase' }}>Days Due</th>
                <th style={{ padding: '8px 6px', textAlign: 'center', fontWeight: '800', color: 'var(--text-muted)', fontSize: '0.68rem', textTransform: 'uppercase' }}>Type</th>
                <th style={{ padding: '8px 6px', textAlign: 'center', fontWeight: '800', color: 'var(--text-muted)', fontSize: '0.68rem', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '8px 8px', textAlign: 'right', fontWeight: '800', color: 'var(--text-muted)', fontSize: '0.68rem', textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan="11" style={{ padding: '40px 10px', textAlign: 'center', color: 'var(--text-muted)' }}>
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
                      <td style={{ padding: '7px 8px', fontWeight: '800', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <span>{c.name || c.client_name}</span>
                          {c.brochure_pdf && (
                            <a
                              href={c.brochure_pdf}
                              target="_blank"
                              rel="noreferrer"
                              download={c.requirement_doc_name || 'Client_Document.pdf'}
                              title={`View PDF: ${c.requirement_doc_name || 'Document'}`}
                              onClick={e => e.stopPropagation()}
                              style={{
                                background: 'rgba(239, 68, 68, 0.15)',
                                color: '#ef4444',
                                border: '1px solid rgba(239, 68, 68, 0.35)',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                fontSize: '0.62rem',
                                fontWeight: '800',
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                            >
                              <FileText style={{ width: '10px', height: '10px' }} />
                              PDF
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Onboarded Date */}
                      <td style={{ padding: '7px 6px', color: 'var(--text-secondary)', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                        {c.onboarded_date || '—'}
                      </td>

                      {/* Billing Cycle */}
                      <td style={{ padding: '7px 6px', color: 'var(--text-secondary)', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                        {c.client_type === 'one_time' ? 'One-Time' : (c.billing_cycle || '—')}
                      </td>

                      {/* Billing Date */}
                      <td style={{ padding: '7px 6px', color: 'var(--text-secondary)', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                        {c.computedBillingDate}
                      </td>

                      {/* Payment Status Badge */}
                      <td style={{ padding: '7px 6px', textAlign: 'center' }}>
                        {isPaid ? (
                          <span style={{ padding: '2px 6px', borderRadius: '8px', background: 'rgba(16,185,129,0.15)', color: '#34d399', fontSize: '0.66rem', fontWeight: '800' }}>
                            Paid
                          </span>
                        ) : isUnpaid ? (
                          <span style={{ padding: '2px 6px', borderRadius: '8px', background: 'rgba(244,63,94,0.18)', color: '#f87171', fontSize: '0.66rem', fontWeight: '800' }}>
                            Unpaid
                          </span>
                        ) : (
                          <span style={{ padding: '2px 6px', borderRadius: '8px', background: 'rgba(245,158,11,0.15)', color: '#fbbf24', fontSize: '0.66rem', fontWeight: '800' }}>
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Months Due */}
                      <td style={{ padding: '7px 4px', textAlign: 'center', fontWeight: '800', color: c.computedMonthsDue > 0 ? '#f87171' : 'var(--text-muted)' }}>
                        {c.computedMonthsDue}
                      </td>

                      {/* Amount Due */}
                      <td style={{ padding: '7px 6px', textAlign: 'right', fontWeight: '800', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                          <span style={{ color: c.computedAmountDue > 0 ? '#f87171' : (parseFloat(c.advance_payment || 0) > 0 ? '#34d399' : 'var(--text-muted)') }}>
                            {c.computedAmountDue > 0 ? formatINR(c.computedAmountDue) : (parseFloat(c.advance_payment || 0) > 0 ? '₹0 (Settled)' : '—')}
                          </span>
                          {parseFloat(c.advance_payment || 0) > 0 && (
                            <span style={{ fontSize: '0.62rem', color: '#10b981', fontWeight: '700', background: 'rgba(16,185,129,0.1)', padding: '1px 5px', borderRadius: '4px' }}>
                              ₹{parseFloat(c.advance_payment).toLocaleString('en-IN')} Adv
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Days Due */}
                      <td style={{ padding: '7px 6px', textAlign: 'center', fontWeight: '700', color: isPaid ? '#34d399' : (c.computedDaysDue > 0 ? '#f87171' : 'var(--text-muted)'), whiteSpace: 'nowrap', fontSize: '0.72rem' }}>
                        {isPaid ? 'Paid' : (c.computedDaysDue > 0 ? `${c.computedDaysDue}d` : '—')}
                      </td>

                      {/* Client Type Badge */}
                      <td style={{ padding: '7px 6px', textAlign: 'center' }}>
                        {c.client_type === 'active_dm' ? (
                          <span style={{ padding: '2px 6px', borderRadius: '8px', background: 'rgba(16,185,129,0.12)', color: '#10b981', fontSize: '0.65rem', fontWeight: '800', border: '1px solid rgba(16,185,129,0.25)', whiteSpace: 'nowrap' }}>
                            DM Client
                          </span>
                        ) : c.client_type === 'one_time' ? (
                          <span style={{ padding: '2px 6px', borderRadius: '8px', background: 'rgba(245,158,11,0.12)', color: '#f59e0b', fontSize: '0.65rem', fontWeight: '800', border: '1px solid rgba(245,158,11,0.25)', whiteSpace: 'nowrap' }}>
                            One-Time
                          </span>
                        ) : c.client_type === 'hosting' ? (
                          <span style={{ padding: '2px 6px', borderRadius: '8px', background: 'rgba(139,92,246,0.12)', color: '#8b5cf6', fontSize: '0.65rem', fontWeight: '800', border: '1px solid rgba(139,92,246,0.25)', whiteSpace: 'nowrap' }}>
                            Hosting
                          </span>
                        ) : (
                          <span style={{ padding: '2px 6px', borderRadius: '8px', background: 'rgba(244,63,94,0.12)', color: '#f43f5e', fontSize: '0.65rem', fontWeight: '800', whiteSpace: 'nowrap' }}>
                            Left Us
                          </span>
                        )}
                      </td>

                      {/* Interactive Status Selector */}
                      <td style={{ padding: '7px 6px', textAlign: 'center' }}>
                        <select
                          value={c.status || 'active'}
                          onChange={(e) => handleStatusChange(c.id, e.target.value)}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '8px',
                            background: c.status === 'upcoming' 
                              ? 'rgba(168,85,247,0.18)' 
                              : (c.status === 'hold' 
                                  ? 'rgba(244,63,94,0.18)' 
                                  : (c.status === 'left' ? 'rgba(100,116,139,0.18)' : 'rgba(16,185,129,0.15)')),
                            color: c.status === 'upcoming' 
                              ? '#c084fc' 
                              : (c.status === 'hold' 
                                  ? '#f87171' 
                                  : (c.status === 'left' ? '#94a3b8' : '#34d399')),
                            border: c.status === 'upcoming' 
                              ? '1px solid rgba(168,85,247,0.4)' 
                              : (c.status === 'hold' 
                                  ? '1px solid rgba(244,63,94,0.4)' 
                                  : (c.status === 'left' ? '1px solid rgba(100,116,139,0.3)' : '1px solid rgba(16,185,129,0.3)')),
                            fontSize: '0.68rem',
                            fontWeight: '800',
                            outline: 'none',
                            cursor: 'pointer'
                          }}
                          title="Click to change project status (active, upcoming, hold, left)"
                        >
                          <option value="active" style={{ background: '#1c1c24', color: '#34d399' }}>active</option>
                          <option value="upcoming" style={{ background: '#1c1c24', color: '#c084fc' }}>upcoming</option>
                          <option value="hold" style={{ background: '#1c1c24', color: '#f87171' }}>hold</option>
                          <option value="left" style={{ background: '#1c1c24', color: '#94a3b8' }}>left</option>
                        </select>
                      </td>

                      {/* Action Buttons matching screenshot */}
                      <td style={{ padding: '7px 8px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {/* Resume / Hold Toggle */}
                          {isHold ? (
                            <button
                              onClick={() => handleToggleHold(c.id)}
                              style={{ padding: '3px 6px', borderRadius: '6px', border: 'none', background: '#10b981', color: '#fff', fontSize: '0.68rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}
                              title="Resume Project"
                            >
                              <Play style={{ width: '9px', height: '9px', fill: '#fff' }} /> Resume
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleHold(c.id)}
                              style={{ padding: '3px 6px', borderRadius: '6px', border: '1px solid rgba(244,63,94,0.4)', background: 'rgba(244,63,94,0.15)', color: '#f87171', fontSize: '0.68rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}
                              title="Put Project on Hold"
                            >
                              <Pause style={{ width: '9px', height: '9px' }} /> Hold
                            </button>
                          )}

                          {/* Clear 1 Month */}
                          {c.computedMonthsDue > 0 && (
                            <button
                              onClick={() => handleClearMonth(c.id)}
                              style={{ padding: '3px 6px', borderRadius: '6px', border: 'none', background: '#3b82f6', color: '#fff', fontSize: '0.68rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}
                              title="Record 1 Month Payment Cleared"
                            >
                              <Check style={{ width: '9px', height: '9px' }} /> Clear 1m
                            </button>
                          )}

                          {/* Record Advance Payment */}
                          <button
                            onClick={() => handleOpenAdvanceModal(c)}
                            style={{ padding: '3px 6px', borderRadius: '6px', border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.12)', color: '#34d399', fontSize: '0.68rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}
                            title="Record Advance Payment"
                          >
                            <DollarSign style={{ width: '9px', height: '9px' }} /> Advance
                          </button>

                          {/* Logins */}
                          <button
                            onClick={() => handleOpenLogins(c)}
                            style={{ padding: '3px 6px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)', fontSize: '0.68rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}
                            title="View access logins and credentials"
                          >
                            <Key style={{ width: '10px', height: '10px', color: '#818cf8' }} /> Logins
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEdit(c)}
                            style={{ padding: '3px 6px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)', fontSize: '0.68rem', cursor: 'pointer' }}
                            title="Edit Project"
                          >
                            <Edit2 style={{ width: '10px', height: '10px' }} />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteClient(c.id, c.name || c.client_name)}
                            style={{ padding: '3px 6px', borderRadius: '6px', border: '1px solid rgba(244,63,94,0.2)', background: 'rgba(244,63,94,0.08)', color: '#f87171', fontSize: '0.68rem', cursor: 'pointer' }}
                            title="Delete Client Project"
                          >
                            <Trash2 style={{ width: '10px', height: '10px' }} />
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
        <div className="modal-overlay" style={{ zIndex: 1200, backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.75)' }}>
          <div
            style={{
              background: isDark ? '#121216' : '#FFFFFF',
              border: isDark ? '1px solid #23232b' : '1px solid #EEF2F6',
              borderRadius: '20px',
              maxWidth: '660px',
              width: '92%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '26px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)'
            }}
          >
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: isDark ? '1px solid #23232b' : '1px solid #F1F4F9', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#1c1c22', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4E3EFF', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Shield style={{ width: '18px', height: '18px' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '900', margin: 0, color: isDark ? '#F9FAFB' : '#1E1F24' }}>
                    Access Logins & Socials Vault
                  </h3>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
                    {selectedClientForLogins.name || selectedClientForLogins.client_name}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowLoginsModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            {/* Existing Credentials Table */}
            <div style={{ overflowX: 'auto', marginBottom: '20px', borderRadius: '12px', border: isDark ? '1px solid #23232b' : '1px solid #EEF2F6' }}>
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
                    <option value="upcoming">Upcoming</option>
                    <option value="hold">On Hold</option>
                    <option value="left">Left Us</option>
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
                  <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: '700' }}>Advance Received (INR)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 50000"
                    value={projectForm.advance_payment}
                    onChange={e => setProjectForm({ ...projectForm, advance_payment: parseFloat(e.target.value) || 0 })}
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

                {/* 📄 Client Brochure / Requirement Document (PDF) */}
                <div style={{ gridColumn: 'span 2', marginTop: '4px' }}>
                  <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileText style={{ width: '14px', height: '14px', color: '#ef4444' }} />
                    Client Brochure / Requirement Document (PDF)
                  </label>

                  {projectForm.brochure_pdf ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '10px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                        <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.65rem', fontWeight: '800', padding: '2px 6px', borderRadius: '4px' }}>
                          PDF
                        </span>
                        <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '280px' }}>
                          {projectForm.requirement_doc_name || 'Client_Document.pdf'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <a
                          href={projectForm.brochure_pdf}
                          target="_blank"
                          rel="noreferrer"
                          download={projectForm.requirement_doc_name || 'Client_Doc.pdf'}
                          className="btn"
                          style={{
                            padding: '4px 10px',
                            fontSize: '0.72rem',
                            fontWeight: '700',
                            background: 'rgba(255,255,255,0.1)',
                            color: 'var(--text-primary)',
                            borderRadius: '6px',
                            textDecoration: 'none'
                          }}
                        >
                          View PDF
                        </a>
                        <button
                          type="button"
                          onClick={() => setProjectForm({ ...projectForm, brochure_pdf: '', requirement_doc_name: '' })}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                          title="Remove PDF"
                        >
                          <X style={{ width: '16px', height: '16px' }} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '14px 12px',
                        border: '1px dashed rgba(255,255,255,0.2)',
                        borderRadius: '10px',
                        background: 'rgba(255,255,255,0.02)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}>
                        <Upload style={{ width: '20px', height: '20px', color: '#818cf8' }} />
                        <span style={{ fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                          Click to upload Brochure / Requirement PDF
                        </span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                          Accepts .pdf files (Brochures, Specs, Requirement Briefs)
                        </span>
                        <input
                          type="file"
                          accept=".pdf,application/pdf"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files && e.target.files[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (loadEvt) => {
                                setProjectForm({
                                  ...projectForm,
                                  brochure_pdf: loadEvt.target.result,
                                  requirement_doc_name: file.name
                                });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  )}
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

      {/* 💰 RECORD ADVANCE PAYMENT MODAL */}
      {showAdvanceModal && selectedClientForAdvance && (
        <div className="modal-overlay" style={{ zIndex: 1200, backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.75)' }}>
          <div
            style={{
              background: isDark ? '#121216' : '#FFFFFF',
              border: isDark ? '1px solid #23232b' : '1px solid #EEF2F6',
              borderRadius: '20px',
              maxWidth: '460px',
              width: '92%',
              padding: '24px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: isDark ? '1px solid #23232b' : '1px solid #F1F4F9', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(16,185,129,0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <DollarSign style={{ width: '18px', height: '18px' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '900', margin: 0, color: isDark ? '#F9FAFB' : '#1E1F24' }}>
                    Record Advance Payment
                  </h3>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
                    {selectedClientForAdvance.name || selectedClientForAdvance.client_name}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowAdvanceModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            {/* Financial Overview Card */}
            <div style={{ background: isDark ? '#18181F' : '#F8FAFC', borderRadius: '14px', padding: '14px 16px', marginBottom: '16px', border: isDark ? '1px solid #262630' : '1px solid #E2E8F0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '0.68rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: '700' }}>Total Ticket Size</span>
                <div style={{ fontSize: '1rem', fontWeight: '900', color: isDark ? '#FFFFFF' : '#1E293B', marginTop: '2px' }}>
                  ₹{(parseFloat(selectedClientForAdvance.ticket_size || 0)).toLocaleString('en-IN')}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.68rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: '700' }}>Current Advance</span>
                <div style={{ fontSize: '1rem', fontWeight: '900', color: '#10b981', marginTop: '2px' }}>
                  ₹{(parseFloat(selectedClientForAdvance.advance_payment || 0)).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveAdvancePayment} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: '700' }}>
                  New Total Advance Received (INR) *
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: '700', color: '#94A3B8' }}>₹</span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    required
                    style={{ paddingLeft: '28px', height: '40px', fontSize: '0.9rem', fontWeight: '700' }}
                    className="form-input"
                    value={advanceInput}
                    onChange={e => setAdvanceInput(e.target.value)}
                    placeholder="Enter advance amount"
                    autoFocus
                  />
                </div>
              </div>

              {/* Dynamic Calculation Preview */}
              {(() => {
                const entered = parseFloat(advanceInput) || 0;
                const ticket = parseFloat(selectedClientForAdvance.ticket_size || 0);
                const remaining = Math.max(0, ticket - entered);
                const isFullySettled = entered >= ticket && ticket > 0;

                return (
                  <div style={{ padding: '10px 12px', borderRadius: '10px', background: isFullySettled ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', border: `1px solid ${isFullySettled ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`, fontSize: '0.74rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', color: isFullySettled ? '#34d399' : '#fbbf24' }}>
                      <span>Remaining Balance Due:</span>
                      <span>₹{remaining.toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#94A3B8', marginTop: '4px' }}>
                      {isFullySettled
                        ? '🎉 Advance covers full ticket size. Status will update to Paid.'
                        : 'Status will be updated and balance tracked directly in database.'}
                    </div>
                  </div>
                );
              })()}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowAdvanceModal(false)}
                  className="btn btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn gradient-btn-primary"
                  style={{ padding: '8px 20px', fontSize: '0.8rem', fontWeight: '800' }}
                >
                  Save & Sync Database
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
