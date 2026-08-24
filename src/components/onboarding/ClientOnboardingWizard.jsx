import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext';
import {
  Building,
  Plus,
  Shield,
  Zap,
  CheckCircle2,
  Users,
  CreditCard,
  Sparkles,
  Lock
} from 'lucide-react';

const ClientOnboardingWizard = () => {
  const { allClients, activeTenant, setActiveTenantId, onboardNewClient, upgradeTenantPlan, createRazorpayOrder, verifyRazorpayPayment } = useCRM();

  const [showModal, setShowModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState('Professional');
  
  // Credit Card Form State
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('123');

  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    industry: 'Enterprise Software',
    plan: 'Enterprise',
    maxSeats: 25,
    currency: 'USD ($)',
    primaryColor: '#3b82f6',
    tenantAdmin: '',
    complianceFlags: ['GDPR', 'SOC2 Type II']
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.subdomain || !formData.tenantAdmin) return;

    onboardNewClient({
      name: formData.name,
      subdomain: formData.subdomain.toLowerCase().replace(/[^a-z0-9]/g, ''),
      logo: `https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=150&auto=format&fit=crop&q=80`,
      industry: formData.industry,
      plan: formData.plan,
      maxSeats: parseInt(formData.maxSeats, 10),
      currency: formData.currency,
      primaryColor: formData.primaryColor,
      tenantAdmin: formData.tenantAdmin,
      complianceFlags: formData.complianceFlags
    });

    setShowModal(false);
    setFormData({
      name: '',
      subdomain: '',
      industry: 'Enterprise Software',
      plan: 'Enterprise',
      maxSeats: 25,
      currency: 'USD ($)',
      primaryColor: '#3b82f6',
      tenantAdmin: '',
      complianceFlags: ['GDPR', 'SOC2 Type II']
    });
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClient) return;

    try {
      await upgradeTenantPlan({
        id: selectedClient.id,
        plan: selectedPlan
      });
      alert(`Payment Processed Successfully! upgraded ${selectedClient.name} to ${selectedPlan} Plan.`);
      setShowCheckoutModal(false);
      setSelectedClient(null);
    } catch (err) {
      alert(`Subscription upgrade failed: ${err.message}`);
    }
  };

  const handleRazorpayCheckout = async () => {
    if (!selectedClient) return;
    const price = selectedPlan === 'Starter' ? 99 : selectedPlan === 'Professional' ? 299 : 799;

    try {
      const order = await createRazorpayOrder(price, 'INR');

      if (typeof window.Razorpay === 'undefined') {
        alert('Razorpay SDK is not loaded. Please check your internet connection.');
        return;
      }

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID || '',
        amount: order.amount,
        currency: order.currency,
        name: 'Sanna CRM Enterprise',
        description: `Upgrade Plan to ${selectedPlan}`,
        order_id: order.id,
        handler: async (response) => {
          try {
            await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              tenantId: selectedClient.id,
              plan: selectedPlan
            });
            alert(`Razorpay Payment Successful! Upgraded ${selectedClient.name} to ${selectedPlan}.`);
            setShowCheckoutModal(false);
            setSelectedClient(null);
          } catch (verifyErr) {
            alert(`Payment verification failed: ${verifyErr.message}`);
          }
        },
        prefill: {
          name: selectedClient.name,
          email: selectedClient.tenantAdmin
        },
        theme: {
          color: '#3b82f6'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      alert(`Razorpay checkout initialization error: ${err.message}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: '#60a5fa', fontWeight: '700', textTransform: 'uppercase' }}>
            Multi-Tenant Client Onboarding Center
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '4px 0' }}>
            Client Organizations & Workspaces
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Provision and manage tenant accounts with isolated data scopes, custom branding, and subscription seat limits.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn gradient-btn-primary"
          style={{ padding: '10px 18px', borderRadius: '10px' }}
        >
          <Plus style={{ width: '18px', height: '18px' }} />
          <span>Onboard New Client</span>
        </button>
      </div>

      {/* Subscription Tier Info Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        
        <div className="glass-card" style={{ padding: '20px', borderTop: '4px solid #8b5cf6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: '800' }}>Business Starter</h4>
            <span className="badge badge-purple">₹3,000/mo · 15 Seats</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Includes up to 15 active seats with core CRM pipeline & lead capture tools.
          </p>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Includes: Leads, Pipeline Kanban, Quotes, Tasks, AI Sales Assistant.
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px', borderTop: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: '800' }}>Business Enterprise</h4>
            <span className="badge badge-emerald">₹5,000/mo · 25 Seats</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Up to 25 seats with full invoicing, projects, payroll, and audit vault.
          </p>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Includes: Orders & Invoicing, Ongoing Projects, Payroll, Security Audit Vault.
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px', borderTop: '4px solid #fbbf24' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: '800' }}>Enterprise Scale</h4>
            <span className="badge badge-amber">&gt; 25 Seats · Contact Us</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Custom seat allocation above 25 seats with dedicated SLA & manager.
          </p>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Includes: Unlimited Flexible Seats, Custom SLA, On-premise/Isolated Cloud.
          </div>
        </div>

      </div>

      {/* Onboarded Clients Table */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px' }}>Active Client Organizations ({allClients.length})</h3>
        
        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Organization Name</th>
                <th>Subdomain</th>
                <th>Plan & Seats</th>
                <th>Tenant Admin</th>
                <th>Compliance & Flags</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {allClients.map(client => {
                const isActive = client.id === activeTenant?.id;
                return (
                  <tr key={client.id} style={{ background: isActive ? 'rgba(59, 130, 246, 0.08)' : 'transparent' }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img src={client.logo} alt={client.name} style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover' }} />
                        <div>
                          <div style={{ fontWeight: '700' }}>{client.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{client.industry}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <code style={{ background: 'var(--bg-input)', padding: '2px 8px', borderRadius: '4px', color: '#60a5fa', fontSize: '0.8rem' }}>
                        {client.subdomain}.apexcrm.io
                      </code>
                    </td>
                    <td>
                      <div style={{ fontWeight: '700', color: client.plan === 'Enterprise' ? '#60a5fa' : client.plan === 'Professional' ? '#34d399' : '#c084fc' }}>
                        {client.plan}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {client.seats || 1} / {client.maxSeats} seats used
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.825rem' }}>{client.tenantAdmin}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {(client.complianceFlags || ['HIPAA']).map(f => (
                          <span key={f} className="badge badge-purple" style={{ fontSize: '0.65rem' }}>{f}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-emerald">{client.status}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          disabled={!isActive}
                          onClick={() => {
                            if (!isActive) {
                              alert("Tenant switching is disabled to enforce strict organization data security.");
                            }
                          }}
                          className={`btn ${isActive ? 'btn-secondary' : ''}`}
                          style={{
                            padding: '6px 12px',
                            fontSize: '0.75rem',
                            opacity: isActive ? 1 : 0.45,
                            cursor: isActive ? 'default' : 'not-allowed',
                            background: isActive ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                            border: isActive ? '1px solid #3b82f6' : '1px solid var(--border-color)',
                            color: isActive ? '#60a5fa' : 'var(--text-muted)'
                          }}
                          title={isActive ? 'Current Organization' : 'Locked to logged-in company context'}
                        >
                          {isActive ? 'Active' : 'Locked'}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedClient(client);
                            setSelectedPlan(client.plan);
                            setCardName(client.tenantAdmin);
                            setShowCheckoutModal(true);
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.75rem', borderColor: '#34d399', color: '#34d399' }}
                        >
                          Upgrade
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Onboard Client Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '6px' }}>Onboard New Client Organization</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Provision an isolated workspace for your customer with custom branding, seat allocation, and security defaults.
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                
                <div className="form-group">
                  <label className="form-label">Client Company Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Titan Global Logistics"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Subdomain Handle</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. titanglobal"
                    value={formData.subdomain}
                    onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Industry Sector</label>
                  <select
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="form-select"
                  >
                    <option value="Enterprise Software">Enterprise Software</option>
                    <option value="Consumer Electronics">Consumer Electronics</option>
                    <option value="Industrial Machinery">Industrial Machinery</option>
                    <option value="Healthcare & Pharma">Healthcare & Pharma</option>
                    <option value="Retail & E-commerce">Retail & E-commerce</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Subscription Tier</label>
                  <select
                    value={formData.plan}
                    onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                    className="form-select"
                  >
                    <option value="Starter">Starter (10 Seats Max)</option>
                    <option value="Professional">Professional (25 Seats Max)</option>
                    <option value="Enterprise">Enterprise (50+ Seats)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Max Seat License Limit</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={formData.maxSeats}
                    onChange={(e) => setFormData({ ...formData, maxSeats: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Primary Admin Email</label>
                  <input
                    type="email"
                    required
                    placeholder="admin@client.com"
                    value={formData.tenantAdmin}
                    onChange={(e) => setFormData({ ...formData, tenantAdmin: e.target.value })}
                    className="form-input"
                  />
                </div>

              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn gradient-btn-primary"
                >
                  Provision & Launch Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stripe Payment Checkout Upgrade Modal */}
      {showCheckoutModal && selectedClient && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '28px', maxWidth: '480px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <CreditCard style={{ color: '#3b82f6', width: '24px', height: '24px' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Stripe Secure Checkout</h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Upgrade subscription tier for <strong>{selectedClient.name}</strong>.
            </p>

            <form onSubmit={handleCheckoutSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Select Plan Upgrade Tier</label>
                  <select
                    value={selectedPlan}
                    onChange={(e) => setSelectedPlan(e.target.value)}
                    className="form-select"
                  >
                    <option value="Starter">Starter Plan - $99/mo (10 seats)</option>
                    <option value="Professional">Professional Plan - $299/mo (25 seats)</option>
                    <option value="Enterprise">Enterprise Plan - $799/mo (50 seats)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Cardholder Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Sarah Jenkins"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Card Number</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      required
                      placeholder="4242 4242 4242 4242"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="form-input"
                      style={{ paddingLeft: '36px' }}
                    />
                    <Lock style={{ position: 'absolute', left: '12px', top: '12px', width: '16px', height: '16px', color: 'var(--text-muted)' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Expiration Date</label>
                    <input
                      type="text"
                      required
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Security Code (CVC)</label>
                    <input
                      type="text"
                      required
                      maxLength="4"
                      placeholder="123"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowCheckoutModal(false);
                    setSelectedClient(null);
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRazorpayCheckout}
                  className="btn gradient-btn-primary"
                  style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}
                >
                  Pay with Razorpay
                </button>
                <button type="submit" className="btn gradient-btn-primary" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                  Pay with Stripe (Simulated)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ClientOnboardingWizard;
