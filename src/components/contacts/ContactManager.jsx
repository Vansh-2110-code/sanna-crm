import React, { useState, useMemo } from 'react';
import { useCRM } from '../../context/CRMContext';
import exportToCSV from '../../utils/csvExporter';
import {
  Building2,
  Mail,
  Phone,
  FileSpreadsheet,
  Edit2,
  Trash2,
  Plus,
  Search,
  X,
  Check,
  User,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

const ContactManager = () => {
  const { leads = [], updateLead, deleteLead, addLead } = useCRM();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [editingContact, setEditingContact] = useState(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form state
  const emptyForm = {
    name: '',
    company: '',
    email: '',
    phone: '',
    assignedTo: 'Naveen Kumar',
    source: 'Direct Client'
  };
  const [formData, setFormData] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter contacts by search query
  const filteredContacts = useMemo(() => {
    return (leads || []).filter(c => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchName = (c.name || '').toLowerCase().includes(q);
      const matchCompany = (c.company || '').toLowerCase().includes(q);
      const matchEmail = (c.email || '').toLowerCase().includes(q);
      const matchPhone = (c.phone || '').toLowerCase().includes(q);
      const matchAssigned = (c.assignedTo || '').toLowerCase().includes(q);
      return matchName || matchCompany || matchEmail || matchPhone || matchAssigned;
    });
  }, [leads, searchQuery]);

  // Open Edit Modal
  const handleOpenEdit = (contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name || '',
      company: contact.company || '',
      email: contact.email || '',
      phone: contact.phone === '+91 98765 43210' ? '' : (contact.phone || ''),
      assignedTo: contact.assignedTo || 'Naveen Kumar',
      source: contact.source || 'Direct Client'
    });
  };

  // Save Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingContact) return;
    setIsSubmitting(true);
    try {
      if (updateLead) {
        await updateLead(editingContact.id, formData);
      }
      setEditingContact(null);
    } catch (err) {
      alert('Failed to update contact: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create New Contact
  const handleCreateContact = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (addLead) {
        await addLead({
          ...formData,
          status: 'Active Account',
          createdAt: new Date().toISOString()
        });
      }
      setIsAddOpen(false);
      setFormData(emptyForm);
    } catch (err) {
      alert('Failed to add contact: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Contact
  const handleDeleteContact = async (id, name) => {
    if (window.confirm(`Are you sure you want to permanently delete contact "${name}"?`)) {
      try {
        if (deleteLead) {
          await deleteLead(id);
        }
      } catch (err) {
        alert('Failed to delete contact: ' + err.message);
      }
    }
  };

  const handleExportCSV = () => {
    let csv = `Contact ID,Name,Company,Email,Phone,Assigned Rep,Status\n`;
    filteredContacts.forEach(c => {
      csv += `"${c.id}","${c.name}","${c.company || ''}","${c.email}","${c.phone || ''}","${c.assignedTo || ''}","Active Account"\n`;
    });
    exportToCSV(csv, `AstraCRM_Contacts_Export_${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      
      {/* 1. Header Toolbar */}
      <div className="glass-panel" style={{ padding: '22px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ fontSize: '0.74rem', color: '#60a5fa', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Customer 360° Account Intelligence
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '900', margin: '4px 0', letterSpacing: '-0.02em' }}>
            Contacts Directory ({filteredContacts.length})
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', margin: 0 }}>
            Central profile vault for client points of contact, direct phone numbers, and designated account representatives.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: '240px' }}>
            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '15px', height: '15px', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search contacts, phone, rep..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '36px', fontSize: '0.82rem', padding: '8px 12px 8px 36px', borderRadius: '10px' }}
            />
          </div>

          <button
            onClick={() => {
              setFormData(emptyForm);
              setIsAddOpen(true);
            }}
            className="btn gradient-btn-primary"
            style={{ padding: '9px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}
          >
            <Plus style={{ width: '15px', height: '15px' }} />
            <span>Add Contact</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="btn btn-secondary"
            style={{ padding: '9px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}
          >
            <FileSpreadsheet style={{ width: '15px', height: '15px' }} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Contacts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '18px' }}>
        {filteredContacts.length === 0 ? (
          <div className="glass-card" style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <AlertCircle style={{ width: '32px', height: '32px', margin: '0 auto 10px', color: '#94a3b8' }} />
            <div style={{ fontWeight: '700', fontSize: '1rem' }}>No contacts found matching "{searchQuery}"</div>
            <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>Try searching another keyword or click Add Contact.</div>
          </div>
        ) : (
          filteredContacts.map(contact => {
            const isPlaceholderPhone = !contact.phone || contact.phone === '+91 98765 43210';
            return (
              <div
                key={contact.id}
                className="glass-card"
                style={{
                  padding: '20px',
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 18px rgba(0,0,0,0.02)',
                  transition: 'all 0.15s ease'
                }}
              >
                <div>
                  {/* Top Header: Avatar & Info & Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontWeight: '900',
                          fontSize: '1.2rem',
                          boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
                          flexShrink: 0
                        }}
                      >
                        {(contact.name || 'C').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: '800', margin: '0 0 2px 0', color: 'var(--text-primary)' }}>
                          {contact.name || 'Unnamed Contact'}
                        </h3>
                        <div style={{ fontSize: '0.8rem', color: '#818cf8', fontWeight: '700' }}>
                          {contact.company || 'Enterprise Account'}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons: Edit & Delete */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        onClick={() => handleOpenEdit(contact)}
                        title="Modify Contact Details"
                        style={{
                          background: 'rgba(99, 102, 241, 0.15)',
                          color: '#818cf8',
                          border: '1px solid rgba(99, 102, 241, 0.3)',
                          padding: '6px 8px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <Edit2 style={{ width: '13px', height: '13px' }} />
                      </button>
                      <button
                        onClick={() => handleDeleteContact(contact.id, contact.name)}
                        title="Delete Contact"
                        style={{
                          background: 'rgba(239, 68, 68, 0.15)',
                          color: '#ef4444',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          padding: '6px 8px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <Trash2 style={{ width: '13px', height: '13px' }} />
                      </button>
                    </div>
                  </div>

                  {/* Contact Info Rows */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                      <Mail style={{ width: '14px', height: '14px', color: '#94a3b8', flexShrink: 0 }} />
                      <span style={{ wordBreak: 'break-all' }}>{contact.email || '—'}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                      <Phone style={{ width: '14px', height: '14px', color: isPlaceholderPhone ? '#f59e0b' : '#34d399', flexShrink: 0 }} />
                      {isPlaceholderPhone ? (
                        <span
                          onClick={() => handleOpenEdit(contact)}
                          title="Click to add custom phone number"
                          style={{ color: '#f59e0b', cursor: 'pointer', textDecoration: 'underline dotted', fontSize: '0.78rem' }}
                        >
                          + Add custom phone number
                        </span>
                      ) : (
                        <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{contact.phone}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Rep & Account Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border-color)', fontSize: '0.75rem' }}>
                  <span className="badge badge-emerald" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 8px' }}>
                    <ShieldCheck style={{ width: '11px', height: '11px' }} />
                    <span>Active Account</span>
                  </span>
                  <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <User style={{ width: '11px', height: '11px' }} />
                    <span>Assigned: <strong>{contact.assignedTo || 'Nikki'}</strong></span>
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 3. Edit / Modify Contact Modal */}
      {editingContact && (
        <div className="modal-backdrop" style={{ zIndex: 9999 }}>
          <div className="glass-panel" style={{ maxWidth: '480px', width: '100%', padding: '24px', borderRadius: '20px', background: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0 }}>
                Edit Contact Details
              </h3>
              <button onClick={() => setEditingContact(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X style={{ width: '18px', height: '18px' }} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="form-input"
                  style={{ width: '100%', padding: '8px 12px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Company / Client Organization</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={e => setFormData({ ...formData, company: e.target.value })}
                  className="form-input"
                  style={{ width: '100%', padding: '8px 12px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="form-input"
                  style={{ width: '100%', padding: '8px 12px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Phone Number (Direct / WhatsApp)</label>
                <input
                  type="text"
                  placeholder="+91 98765 00000"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="form-input"
                  style={{ width: '100%', padding: '8px 12px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Assigned Representative</label>
                <input
                  type="text"
                  value={formData.assignedTo}
                  onChange={e => setFormData({ ...formData, assignedTo: e.target.value })}
                  className="form-input"
                  style={{ width: '100%', padding: '8px 12px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingContact(null)}
                  className="btn btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn gradient-btn-primary"
                  style={{ padding: '8px 18px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Check style={{ width: '14px', height: '14px' }} />
                  <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Add Contact Modal */}
      {isAddOpen && (
        <div className="modal-backdrop" style={{ zIndex: 9999 }}>
          <div className="glass-panel" style={{ maxWidth: '480px', width: '100%', padding: '24px', borderRadius: '20px', background: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0 }}>
                Add New Contact Profile
              </h3>
              <button onClick={() => setIsAddOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X style={{ width: '18px', height: '18px' }} />
              </button>
            </div>

            <form onSubmit={handleCreateContact} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Contact Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Sharma"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="form-input"
                  style={{ width: '100%', padding: '8px 12px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Company / Client Organization</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Innovations"
                  value={formData.company}
                  onChange={e => setFormData({ ...formData, company: e.target.value })}
                  className="form-input"
                  style={{ width: '100%', padding: '8px 12px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Email Address</label>
                <input
                  type="email"
                  placeholder="contact@company.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="form-input"
                  style={{ width: '100%', padding: '8px 12px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Phone Number (Direct / WhatsApp)</label>
                <input
                  type="text"
                  placeholder="+91 98765 00000"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="form-input"
                  style={{ width: '100%', padding: '8px 12px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Assigned Representative</label>
                <input
                  type="text"
                  value={formData.assignedTo}
                  onChange={e => setFormData({ ...formData, assignedTo: e.target.value })}
                  className="form-input"
                  style={{ width: '100%', padding: '8px 12px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="btn btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn gradient-btn-primary"
                  style={{ padding: '8px 18px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus style={{ width: '14px', height: '14px' }} />
                  <span>{isSubmitting ? 'Creating...' : 'Create Contact'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ContactManager;
