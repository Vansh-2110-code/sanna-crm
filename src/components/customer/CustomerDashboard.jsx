import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext';
import {
  LifeBuoy,
  Plus,
  FileText,
  ShieldAlert,
  Wrench,
  Clock,
  LogOut,
  CheckCircle,
  AlertTriangle,
  Building,
  User,
  ShieldCheck
} from 'lucide-react';
import QuotePreviewModal from '../quotes/QuotePreviewModal';

const CustomerDashboard = () => {
  const { currentUser, logout, tickets, createTicket, quotes, theme } = useCRM();
  const [showRaiseModal, setShowRaiseModal] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);

  // New Ticket Form State
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Hardware Fault');
  const [priority, setPriority] = useState('Medium');
  const [description, setDescription] = useState('');

  // Filter quotes and tickets belonging to the customer's company
  const customerEmailDomain = currentUser?.email ? currentUser.email.split('@')[1] : '';
  
  const customerTickets = tickets.filter(t => 
    (t.contactEmail && customerEmailDomain && t.contactEmail.toLowerCase().includes(customerEmailDomain.toLowerCase())) || 
    (currentUser?.company && t.customerName && t.customerName.toLowerCase().includes(currentUser.company.toLowerCase()))
  );

  const customerQuotes = quotes.filter(q => 
    (q.contactEmail && customerEmailDomain && q.contactEmail.toLowerCase().includes(customerEmailDomain.toLowerCase())) || 
    (currentUser?.company && q.customerName && q.customerName.toLowerCase().includes(currentUser.company.toLowerCase()))
  );

  const handleRaiseTicket = (e) => {
    e.preventDefault();
    if (!subject || !description) return;

    createTicket({
      subject,
      category,
      priority,
      description,
      customerName: currentUser?.company || currentUser?.name || 'Customer',
      contactPerson: currentUser?.name || '',
      contactEmail: currentUser?.email || '',
      phone: ''
    });

    setSubject('');
    setDescription('');
    setShowRaiseModal(false);
    alert('Support ticket raised successfully! An SLA engineer has been assigned.');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '28px 40px' }}>
      
      {/* Top Header */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: '#ffffff',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(255, 255, 255, 0.25)',
            flexShrink: 0
          }}>
            <img
              src="/logo.png"
              alt="Sanna CRM Logo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                borderRadius: '8px'
              }}
            />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#c084fc', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Sanna CRM Customer Portal
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: '800', margin: '2px 0' }}>
              Welcome back, {currentUser.name}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Authorized Client: <strong style={{ color: '#60a5fa' }}>BioGenetics Lab Solutions</strong> • SLA Level: <strong style={{ color: '#34d399' }}>Gold Tier (2hr SLA)</strong>
            </p>
          </div>
        </div>

        <button 
          onClick={logout} 
          className="btn btn-secondary" 
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.2)' }}
        >
          <LogOut style={{ width: '16px', height: '16px' }} />
          <span>Log Out</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '28px' }}>
        
        {/* Left Side: Support Desk & Tickets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          
          {/* Active Tickets List */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800' }}>Active Support Tickets</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Submit questions, report faults, and view resolutions.</p>
              </div>
              <button 
                onClick={() => setShowRaiseModal(true)} 
                className="btn gradient-btn-primary" 
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
              >
                <Plus style={{ width: '18px', height: '18px' }} />
                <span>Raise New Ticket</span>
              </button>
            </div>

            {customerTickets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                <LifeBuoy style={{ width: '48px', height: '48px', margin: '0 auto 12px auto', opacity: 0.5 }} />
                <p style={{ fontSize: '0.9rem' }}>No support tickets filed yet. Need assistance? Click "Raise New Ticket".</p>
              </div>
            ) : (
              <div className="custom-table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Ticket details</th>
                      <th>Priority</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Last Update</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerTickets.map(ticket => {
                      const priorityColor = ticket.priority === 'High' ? '#f43f5e' : ticket.priority === 'Medium' ? '#fbbf24' : '#60a5fa';
                      return (
                        <tr key={ticket.id}>
                          <td>
                            <div>
                              <div style={{ fontWeight: '800', color: 'var(--text-primary)' }}>{ticket.subject}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {ticket.id}</div>
                            </div>
                          </td>
                          <td>
                            <span className="badge" style={{ background: 'rgba(0,0,0,0.1)', color: priorityColor, border: `1px solid ${priorityColor}40` }}>
                              {ticket.priority}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.85rem' }}>{ticket.category}</span>
                          </td>
                          <td>
                            <span className={`badge ${ticket.status === 'Resolved' ? 'badge-emerald' : 'badge-amber'}`}>
                              {ticket.status}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {ticket.lastUpdated || 'Just now'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Registered Quotations & Estimates */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '4px' }}>Sent Quotations & Estimates</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>Review active price estimates from your account representative.</p>

            {customerQuotes.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No quotations are currently open for your account.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {customerQuotes.map(q => (
                  <div key={q.id} className="glass-card" style={{ padding: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <h4 style={{ fontWeight: '800', fontSize: '0.95rem' }}>{q.customerName}</h4>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Quote Reference: {q.id}</span>
                      </div>
                      <span className="badge badge-blue">{q.status}</span>
                    </div>

                    <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#34d399', marginBottom: '12px' }}>
                      {q.currency ? q.currency.split('(')[1]?.replace(')', '') : '$'}{q.grandTotal.toLocaleString()}
                    </div>

                    <button 
                      onClick={() => setSelectedQuote(q)}
                      className="btn btn-secondary" 
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.8rem' }}
                    >
                      <FileText style={{ width: '14px', height: '14px' }} />
                      <span>View Printable Quotation</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Side: Device Warranty & SLA Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          
          {/* Registered Hardware SLA Status */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck style={{ color: '#34d399', width: '20px', height: '20px' }} />
              <span>SLA & Hardware Warranty</span>
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '16px' }}>Active hardware leases and service level agreements.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: '800' }}>
                  <span>OmniHub server Array v4</span>
                  <span style={{ color: '#34d399' }}>Active Warranty</span>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>S/N: OMNI-SVR-90821-B</div>
                <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '8px', paddingTop: '6px', fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>SLA Code: GOLD-2H</span>
                  <span style={{ color: 'var(--text-secondary)' }}>Expires: Mar 2028</span>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: '800' }}>
                  <span>Sentinel Firewall Gateway</span>
                  <span style={{ color: '#34d399' }}>Active Warranty</span>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>S/N: SENT-GW-44021-A</div>
                <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '8px', paddingTop: '6px', fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>SLA Code: GOLD-2H</span>
                  <span style={{ color: 'var(--text-secondary)' }}>Expires: Nov 2027</span>
                </div>
              </div>

            </div>
          </div>

          {/* Quick FAQ / Contacts Panel */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '8px' }}>Your Representative</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <img 
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" 
                alt="Representative" 
                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} 
              />
              <div>
                <div style={{ fontWeight: '800', fontSize: '0.85rem' }}>Alex Rivera</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Senior Account Executive</div>
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div>Email: <strong>alex.rivera@sales.apex.io</strong></div>
              <div>Phone Support Hotline: <strong>+1 (800) 555-ASTRA</strong></div>
            </div>
          </div>

        </div>

      </div>

      {/* RAISE SUPPORT TICKET MODAL */}
      {showRaiseModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '28px', maxWidth: '520px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '4px' }}>File Support Request</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Describe your issue in detail. An SLA engineer will engage within your 2-hour window.
            </p>

            <form onSubmit={handleRaiseTicket}>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Subject / Issue Title</label>
                <input 
                  type="text" 
                  required 
                  value={subject} 
                  onChange={(e) => setSubject(e.target.value)} 
                  placeholder="e.g. Server Rack offline after power outage" 
                  className="form-input" 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Issue Category</label>
                  <select 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)} 
                    className="form-select"
                  >
                    <option value="Hardware Fault">Hardware Fault</option>
                    <option value="Software License">Software License</option>
                    <option value="Network / Cloud Sync">Network / Cloud Sync</option>
                    <option value="Billing Inquiries">Billing Inquiries</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select 
                    value={priority} 
                    onChange={(e) => setPriority(e.target.value)} 
                    className="form-select"
                  >
                    <option value="Low">Low - General Question</option>
                    <option value="Medium">Medium - System Degraded</option>
                    <option value="High">High - Critical Downtime</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Detailed Description</label>
                <textarea 
                  required 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="Please describe exactly what happened, error codes, and symptoms." 
                  className="form-input" 
                  style={{ minHeight: '100px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowRaiseModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn gradient-btn-primary">Submit Ticket</button>
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
