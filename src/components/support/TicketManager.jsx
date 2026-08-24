import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext';
import exportToCSV from '../../utils/csvExporter';
import {
  Headphones,
  Plus,
  ShieldCheck,
  Clock,
  BookOpen,
  Send,
  User,
  CheckCircle2,
  Mail,
  Building,
  FileSpreadsheet
} from 'lucide-react';

const TicketManager = () => {
  const { tickets = [], createTicket } = useCRM();
  const [activeTicketId, setActiveTicketId] = useState(tickets[0]?.id || null);
  const [replyText, setReplyText] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State for New Ticket
  const [subject, setSubject] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [productName, setProductName] = useState('Standard SaaS license');
  const [priority, setPriority] = useState('Medium');
  const [description, setDescription] = useState('');

  const activeTicket = tickets.find(t => t.id === activeTicketId) || tickets[0];

  const handleExportCSV = () => {
    let csv = `Ticket ID,Subject,Customer Name,Contact Email,Product,Priority,Status,Created Date\n`;
    tickets.forEach(t => {
      csv += `"${t.id}","${(t.subject || t.title || '').replace(/"/g, '""')}","${t.customerName || ''}","${t.contactEmail || ''}","${t.productName || ''}","${t.priority || 'Medium'}","${t.status || 'Open'}","${t.createdAt || ''}"\n`;
    });

    exportToCSV(csv, `AstraCRM_Support_Tickets_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleSendReply = (e) => {
    e.preventDefault();
    if (!replyText || !activeTicket) return;
    
    // Append to messages array locally (or mock update)
    if (!activeTicket.messages) activeTicket.messages = [];
    activeTicket.messages.push({
      sender: 'Support Agent',
      text: replyText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    setReplyText('');
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!subject || !customerName || !contactEmail) return;

    await createTicket({
      subject,
      title: subject,
      customerName,
      contactEmail,
      productName,
      priority,
      description,
      messages: [
        { sender: customerName, text: description, time: 'Just now' }
      ],
      warrantyStatus: 'Active Warranty'
    });

    setShowAddModal(false);
    // Reset Form
    setSubject('');
    setCustomerName('');
    setContactEmail('');
    setPriority('Medium');
    setDescription('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: '700', textTransform: 'uppercase' }}>
            Post-Sales Support & Warranty Management
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '4px 0' }}>
            Customer Support Desk ({tickets.length} Tickets)
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Manage complaints, SLA resolution timers, product warranty lookup, and integrated knowledge base docs.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleExportCSV}
            className="btn btn-secondary"
            style={{ padding: '10px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <FileSpreadsheet style={{ width: '16px', height: '16px' }} />
            <span>Export Tickets CSV</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn gradient-btn-primary"
            style={{ padding: '10px 18px', borderRadius: '10px' }}
          >
            <Plus style={{ width: '18px', height: '18px' }} />
            <span>New Support Ticket</span>
          </button>
        </div>
      </div>

      {/* Ticket Inbox Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '20px' }}>
        
        {/* Ticket List Column */}
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: '800', marginBottom: '6px' }}>Support Inbox</h4>
          
          {tickets.map(t => {
            const isSelected = t.id === activeTicketId || (!activeTicketId && tickets[0]?.id === t.id);
            return (
              <div
                key={t.id}
                onClick={() => setActiveTicketId(t.id)}
                className="glass-card"
                style={{
                  padding: '12px',
                  cursor: 'pointer',
                  background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-primary)',
                  borderColor: isSelected ? 'var(--accent-blue)' : 'var(--border-color)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#60a5fa' }}>{t.id}</span>
                  <span className={`badge ${t.priority === 'High' ? 'badge-rose' : 'badge-blue'}`} style={{ fontSize: '0.65rem' }}>
                    {t.priority}
                  </span>
                </div>
                <div style={{ fontWeight: '700', fontSize: '0.85rem', marginBottom: '4px' }}>{t.title || t.subject}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.customerName}</div>
              </div>
            );
          })}
        </div>

        {/* Active Ticket Message View */}
        {activeTicket ? (
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: '800', fontSize: '1.2rem' }}>{activeTicket.title || activeTicket.subject}</span>
                    <span className="badge badge-emerald">{activeTicket.status}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Customer: <strong>{activeTicket.customerName}</strong> ({activeTicket.contactEmail}) • Product: <strong>{activeTicket.productName || 'Standard SaaS License'}</strong>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>WARRANTY STATUS</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#34d399' }}>
                    <ShieldCheck style={{ width: '14px', height: '14px', display: 'inline', marginRight: '4px' }} />
                    {activeTicket.warrantyStatus || 'Active Warranty'}
                  </div>
                </div>
              </div>

              {/* Chat Messages Log */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '350px', overflowY: 'auto', marginBottom: '20px' }}>
                {(activeTicket.messages || []).map((msg, index) => (
                  <div key={index} style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: msg.sender?.includes('Support') ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-input)',
                    alignSelf: msg.sender?.includes('Support') ? 'flex-end' : 'flex-start',
                    maxWidth: '80%'
                  }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '800', color: msg.sender?.includes('Support') ? '#60a5fa' : '#34d399', marginBottom: '4px' }}>
                      {msg.sender} • {msg.time}
                    </div>
                    <div style={{ fontSize: '0.875rem' }}>{msg.text}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reply Input Form */}
            <form onSubmit={handleSendReply} style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                placeholder="Type response to customer..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="form-input"
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn gradient-btn-primary">
                <Send style={{ width: '16px', height: '16px' }} />
                <span>Send</span>
              </button>
            </form>

          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Select a ticket from inbox
          </div>
        )}

      </div>

      {/* New Support Ticket Modal Popup */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '28px', maxWidth: '520px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '6px' }}>Raise Support Incident Ticket</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Incidents automatically route through SLA timers and assign support representatives based on ticket priority.
            </p>

            <form onSubmit={handleCreateTicket}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Ticket Subject / Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Database connectivity timeouts"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Customer Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Aris Thorne"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Contact Email</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. thorne@biogenetics.org"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Product SKU / License</label>
                    <input
                      type="text"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Incident Severity</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="form-select"
                    >
                      <option value="Low">Low (General Query)</option>
                      <option value="Medium">Medium (Operational Bug)</option>
                      <option value="High">High (System Outage)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Detailed Description</label>
                  <textarea
                    rows="3"
                    required
                    placeholder="Describe the issue, console error logs, steps to reproduce..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="form-textarea"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn gradient-btn-primary">
                  File Ticket & Start SLA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default TicketManager;
