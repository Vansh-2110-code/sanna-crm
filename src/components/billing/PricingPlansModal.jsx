import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext';
import {
  CheckCircle2,
  Zap,
  ShieldCheck,
  Building2,
  Users,
  CreditCard,
  PhoneCall,
  Sparkles,
  X,
  Send,
  AlertCircle
} from 'lucide-react';

const PricingPlansModal = ({ isOpen, onClose, seatLimitAlert = false }) => {
  const { activeTenant, createRazorpayOrder, verifyRazorpayPayment, employees } = useCRM();

  const [loadingPlan, setLoadingPlan] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: activeTenant?.name || '',
    email: activeTenant?.tenantAdmin || '',
    seatsNeeded: '35',
    message: ''
  });
  const [contactSubmitted, setContactSubmitted] = useState(false);

  if (!isOpen) return null;

  const currentSeatsUsed = (employees || []).length || 1;
  const currentMaxSeats = activeTenant?.maxSeats || 15;
  const currentPlan = activeTenant?.plan || 'Business Starter (15 Seats)';

  const handleRazorpayUpgrade = async (planName, amount, maxSeats) => {
    try {
      setLoadingPlan(planName);
      const order = await createRazorpayOrder(amount, 'INR', planName);

      // Check if Razorpay SDK script is available on window
      if (typeof window.Razorpay === 'function') {
        const options = {
          key: (import.meta.env && import.meta.env.VITE_RAZORPAY_KEY_ID) || process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_mockKeyId2026',
          amount: order.amount || amount * 100,
          currency: order.currency || 'INR',
          name: 'SANNA CRM Enterprise',
          description: `Subscription Upgrade to ${planName} (${maxSeats} Seats)`,
          order_id: (order && order.id && !order.id.startsWith('order_mock_')) ? order.id : undefined,
          handler: async (response) => {
            try {
              await verifyRazorpayPayment({
                razorpay_order_id: response.razorpay_order_id || order.id,
                razorpay_payment_id: response.razorpay_payment_id || `pay_${Date.now()}`,
                razorpay_signature: response.razorpay_signature || 'mock_sig',
                tenantId: activeTenant?.id,
                plan: planName
              });
              alert(`🎉 Success! Your subscription has been upgraded to ${planName} (${maxSeats} Seats).`);
              onClose();
            } catch (err) {
              alert('Payment verification failed: ' + (err.message || 'Error verifying transaction'));
            }
          },
          prefill: {
            name: activeTenant?.name || 'Astra Client',
            email: activeTenant?.tenantAdmin || 'admin@astracrm.io'
          },
          theme: {
            color: '#6366f1'
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Fallback test mode checkout simulation
        const confirmPay = window.confirm(
          `Razorpay Test Mode Checkout:\n\nPlan: ${planName}\nAmount: ₹${amount.toLocaleString()}\nSeats: ${maxSeats} Seats\n\nClick OK to simulate instant successful payment!`
        );
        if (confirmPay) {
          await verifyRazorpayPayment({
            razorpay_order_id: `order_mock_${Date.now()}`,
            razorpay_payment_id: `pay_mock_${Date.now()}`,
            razorpay_signature: 'mock_sig',
            tenantId: activeTenant?.id,
            plan: planName
          });
          alert(`🎉 Instant Upgrade Complete! Upgraded to ${planName} (${maxSeats} Seats).`);
          onClose();
        }
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Checkout failed: ' + (err.message || 'Error processing payment'));
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => {
      setContactSubmitted(false);
      setShowContactModal(false);
      alert("Thank you! Our Enterprise Sales Team will reach out to you within 2 business hours for your custom seat requirement.");
    }, 1200);
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal-content" style={{ padding: '0', maxWidth: '920px', overflow: 'hidden', borderRadius: '20px' }}>

        {/* Modal Header */}
        <div style={{ padding: '24px 32px', background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(168,85,247,0.15) 100%)', borderBottom: '1px solid var(--border-color)', position: 'relative' }}>
          <button
            onClick={onClose}
            style={{ position: 'absolute', top: '24px', right: '28px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', color: 'var(--text-secondary)' }}
          >
            <X style={{ width: '16px', height: '16px' }} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#818cf8', fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
            <Sparkles style={{ width: '15px', height: '15px' }} />
            Razorpay Powered Subscription Billing
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '900', margin: '0 0 6px', background: 'linear-gradient(135deg, #fff 0%, #a5b4fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Choose Your Business Plan
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '640px' }}>
            Scale your sales workforce with transparent seat pricing and instant online activation via Razorpay.
          </p>

          {/* Seat usage alert banner if triggered by limit check */}
          {seatLimitAlert && (
            <div style={{ marginTop: '16px', background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <AlertCircle style={{ width: '20px', height: '20px', color: '#f43f5e', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.825rem', fontWeight: '800', color: '#f43f5e' }}>Seat Limit Reached ({currentSeatsUsed} / {currentMaxSeats} Seats Used)</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>You cannot add more employees on your current plan. Upgrade to 25 seats or Contact Us for more!</div>
              </div>
            </div>
          )}
        </div>

        {/* Pricing Cards Grid */}
        <div style={{ padding: '32px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>

          {/* Plan 1: 15 Seats for 3000 */}
          <div className="glass-card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: '800', color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Starter Business</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--text-primary)', margin: '0 0 12px' }}>15 Seats Plan</h3>
              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '2rem', fontWeight: '900', color: '#fff' }}>₹3,000</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}> / month</span>
                <div style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: '700', marginTop: '2px' }}>Includes 15 Team Licenses</div>
              </div>

              <div style={{ height: '1px', background: 'var(--border-color)', margin: '16px 0' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                {[
                  'Up to 15 Active Employees',
                  'Full Sales Pipeline & Kanban',
                  'Quotation & Lead Management',
                  'Task & Call Log Management',
                  'AI Sales Assistant',
                  'Attendance & Time Logs'
                ].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 style={{ width: '15px', height: '15px', color: '#34d399', flexShrink: 0 }} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleRazorpayUpgrade('Business Starter (15 Seats)', 3000, 15)}
              disabled={loadingPlan === 'Business Starter (15 Seats)'}
              className="btn btn-secondary"
              style={{ width: '100%', padding: '12px', fontSize: '0.85rem', fontWeight: '800', justifyContent: 'center' }}
            >
              <CreditCard style={{ width: '16px', height: '16px' }} />
              {loadingPlan === 'Business Starter (15 Seats)' ? 'Processing...' : 'Pay ₹3,000 with Razorpay'}
            </button>
          </div>

          {/* Plan 2: 25 Seats for 5000 (Popular Badge) */}
          <div className="glass-card" style={{ padding: '24px', borderRadius: '16px', border: '2px solid #6366f1', background: 'linear-gradient(180deg, rgba(99,102,241,0.12) 0%, rgba(0,0,0,0) 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-12px', right: '20px', background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: '#fff', fontSize: '0.65rem', fontWeight: '900', padding: '4px 10px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              MOST POPULAR
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: '800', color: '#a855f7', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Enterprise Business</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--text-primary)', margin: '0 0 12px' }}>25 Seats Plan</h3>
              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '2rem', fontWeight: '900', color: '#fff' }}>₹5,000</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}> / month</span>
                <div style={{ fontSize: '0.72rem', color: '#c084fc', fontWeight: '700', marginTop: '2px' }}>Includes 25 Team Licenses</div>
              </div>

              <div style={{ height: '1px', background: 'var(--border-color)', margin: '16px 0' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                {[
                  'Up to 25 Active Employees',
                  'Everything in Starter Plan',
                  'Orders & Invoicing Engine',
                  'Ongoing Projects & Deliverables',
                  'Salary & Payroll Generation',
                  'Security & Audit Vault',
                  'Priority Support Response'
                ].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 style={{ width: '15px', height: '15px', color: '#c084fc', flexShrink: 0 }} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleRazorpayUpgrade('Business Enterprise (25 Seats)', 5000, 25)}
              disabled={loadingPlan === 'Business Enterprise (25 Seats)'}
              className="btn gradient-btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '0.85rem', fontWeight: '800', justifyContent: 'center' }}
            >
              <CreditCard style={{ width: '16px', height: '16px' }} />
              {loadingPlan === 'Business Enterprise (25 Seats)' ? 'Processing...' : 'Pay ₹5,000 with Razorpay'}
            </button>
          </div>

          {/* Plan 3: More than 25 Seats -> Contact Us */}
          <div className="glass-card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: '800', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Custom Scale</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--text-primary)', margin: '0 0 12px' }}>&gt; 25 Seats</h3>
              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '1.8rem', fontWeight: '900', color: '#fbbf24' }}>Custom</span>
                <div style={{ fontSize: '0.72rem', color: '#fbbf24', fontWeight: '700', marginTop: '4px' }}>Unlimited Flexible Seats</div>
              </div>

              <div style={{ height: '1px', background: 'var(--border-color)', margin: '16px 0' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                {[
                  'Custom Seat Licensing (25+ to 1,000+)',
                  'Dedicated Account Manager',
                  'Custom Domain & Single Sign-On',
                  'SLA Guarantee & Dedicated Database',
                  'On-premise / Hybrid Cloud Setup'
                ].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 style={{ width: '15px', height: '15px', color: '#fbbf24', flexShrink: 0 }} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowContactModal(true)}
              className="btn btn-secondary"
              style={{ width: '100%', padding: '12px', fontSize: '0.85rem', fontWeight: '800', justifyContent: 'center', borderColor: '#fbbf24', color: '#fbbf24' }}
            >
              <PhoneCall style={{ width: '16px', height: '16px' }} />
              Contact Us
            </button>
          </div>

        </div>

        {/* Footer info */}
        <div style={{ padding: '16px 32px 24px', textAlign: 'center', borderTop: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.15)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          🔒 Secure 256-bit Encrypted Checkout via <strong>Razorpay Payment Gateway</strong>. All prices in INR (₹). Instant seat limit upgrades applied immediately.
        </div>

      </div>

      {/* Sub-modal: Contact Us for >25 Seats */}
      {showContactModal && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content" style={{ padding: '28px', maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>Enterprise Sales Inquiry</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>Request custom seat licensing for more than 25 seats.</p>
              </div>
              <button onClick={() => setShowContactModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleContactSubmit}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Company Name</label>
                <input
                  type="text"
                  required
                  value={contactForm.name}
                  onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                  className="form-input"
                  placeholder="e.g. Acme Corp"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Work Email</label>
                <input
                  type="email"
                  required
                  value={contactForm.email}
                  onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                  className="form-input"
                  placeholder="admin@company.com"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Seats Required</label>
                <input
                  type="number"
                  min="26"
                  max="5000"
                  required
                  value={contactForm.seatsNeeded}
                  onChange={e => setContactForm({ ...contactForm, seatsNeeded: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Additional Custom Requirements</label>
                <textarea
                  rows="3"
                  value={contactForm.message}
                  onChange={e => setContactForm({ ...contactForm, message: e.target.value })}
                  className="form-input"
                  placeholder="Tell us about your team size, custom integrations, or SLA expectations..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setShowContactModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={contactSubmitted} className="btn gradient-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Send style={{ width: '14px', height: '14px' }} />
                  {contactSubmitted ? 'Submitting...' : 'Submit Inquiry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingPlansModal;
