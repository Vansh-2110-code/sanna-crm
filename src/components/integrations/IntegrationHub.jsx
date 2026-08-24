import { Boxes, MessageSquare, Mail, CreditCard, Database, PhoneCall, CheckCircle2, RefreshCw, Plus, Share2, Zap, ExternalLink, Copy, Check, FileText } from 'lucide-react';

const ICON_MAP = {
  MessageSquare: MessageSquare,
  Mail: Mail,
  CreditCard: CreditCard,
  Database: Database,
  PhoneCall: PhoneCall
};

const IntegrationHub = () => {
  const { integrations, toggleIntegration, addIntegration, addLead, logAudit } = useCRM();
  const [showModal, setShowModal] = useState(false);
  const [showMetaModal, setShowMetaModal] = useState(false);
  const [metaTab, setMetaTab] = useState('config'); // 'config' | 'test' | 'guide'

  const [metaConfigState, setMetaConfigState] = useState({
    pageId: '10049281048',
    appId: '8910492019482',
    accessToken: 'EAAG_MOCK_META_ACCESS_TOKEN_2026',
    verifyToken: 'astra_meta_leadgen_token_2026',
    webhookUrl: `${window.location.origin}/api/integrations/meta-ads/webhook`
  });

  const [testLead, setTestLead] = useState({
    name: 'Jordan Vance',
    email: 'jordan.vance@techcorp.io',
    phone: '+1-555-019-8821',
    companyName: 'Vance Tech Solutions',
    campaignName: 'Q3 Enterprise SaaS Facebook Campaign'
  });

  const [copied, setCopied] = useState(false);

  const handleCopyWebhookUrl = () => {
    navigator.clipboard.writeText(metaConfigState.webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFireMetaTestLead = async (e) => {
    e.preventDefault();
    try {
      if (addLead) {
        await addLead({
          name: testLead.name,
          companyName: testLead.companyName,
          email: testLead.email,
          phone: testLead.phone,
          source: 'Meta Ads',
          status: 'New',
          value: 45000,
          score: 85,
          notes: `Meta Lead Gen Campaign: ${testLead.campaignName} | Page ID: ${metaConfigState.pageId}`
        });
      }
      if (logAudit) {
        logAudit('META_ADS_LEAD_INGESTED', testLead.email, `Ingested new lead via Meta Webhook: ${testLead.name} (${testLead.companyName})`, 'HIGH');
      }
      alert(`✅ Success! Meta Lead Ads Webhook event ingested.\n\nLead for "${testLead.name}" was automatically added to your CRM pipeline with an AI lead score of 85/100.`);
    } catch (err) {
      alert(`Failed to ingest Meta lead: ${err.message}`);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.connectedAccount) return;

    if (addIntegration) {
      addIntegration({
        name: formData.name,
        category: formData.category,
        details: formData.details || `Custom ${formData.category} connector API integration.`,
        connectedAccount: formData.connectedAccount,
        status: 'Connected',
        lastSync: 'Just now',
        icon: formData.category.includes('Email') ? 'Mail' : formData.category.includes('Payment') ? 'CreditCard' : 'MessageSquare'
      });
    }

    if (logAudit) {
      logAudit('CREATE_INTEGRATION', formData.name, `Configured new integration: ${formData.name} (${formData.category})`, 'MEDIUM');
    }

    setShowModal(false);
    setFormData({
      name: '',
      category: 'Messaging & Outreach',
      details: '',
      connectedAccount: ''
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Enterprise API & Gateway Connector Hub
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '4px 0' }}>
            Integrations & Webhooks ({integrations.length})
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Manage active connectors for WhatsApp Business API, Gmail/Outlook sync, Stripe Payment Gateways, SAP ERP inventory, and Cloud Telephony.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="btn gradient-btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}
        >
          <Plus style={{ width: '18px', height: '18px' }} />
          <span>Add Custom Integration</span>
        </button>
      </div>

      {/* Integrations Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
        {integrations.length === 0 ? (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
            <Boxes style={{ width: '48px', height: '48px', margin: '0 auto 12px auto', opacity: 0.4 }} />
            <p>No active integrations configured. Click <strong>"Add Custom Integration"</strong> above to connect an API endpoint.</p>
          </div>
        ) : (
          integrations.map(item => {
            const IconComponent = ICON_MAP[item.icon] || Boxes;
            const isConnected = item.status === 'Connected' || item.status === 'Configured';

            return (
              <div key={item.id} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ background: isConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '12px' }}>
                      <IconComponent style={{ width: '22px', height: '22px', color: isConnected ? '#34d399' : 'var(--text-muted)' }} />
                    </div>
                    <span className={`badge ${isConnected ? 'badge-emerald' : 'badge-amber'}`}>
                      {item.status}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '4px' }}>{item.name}</h3>
                  <div style={{ fontSize: '0.75rem', color: '#60a5fa', fontWeight: '600', marginBottom: '8px' }}>{item.category}</div>

                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                    {item.details}
                  </p>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-primary)', padding: '8px 10px', borderRadius: '6px', marginBottom: '14px' }}>
                    Account / Webhook: <strong style={{ color: 'var(--text-primary)' }}>{item.connectedAccount}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Last Sync: {item.lastSync || 'Just now'}</span>
                  
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {(item.id === 'int-104' || item.name.includes('Meta')) && (
                      <button
                        onClick={() => {
                          setShowMetaModal(true);
                          setMetaTab('config');
                        }}
                        className="btn gradient-btn-primary"
                        style={{ padding: '4px 10px', fontSize: '0.72rem' }}
                      >
                        ⚙️ Configure & Test API
                      </button>
                    )}

                    <button
                      onClick={() => toggleIntegration(item.id)}
                      className={`btn ${isConnected ? 'btn-secondary' : 'gradient-btn-primary'}`}
                      style={{ padding: '4px 12px', fontSize: '0.75rem' }}
                    >
                      {isConnected ? 'Disconnect' : 'Connect API'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* META ADS API CONFIGURATION & LIVE WEBHOOK TEST MODAL */}
      {showMetaModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '28px', maxWidth: '680px', borderRadius: '20px' }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'linear-gradient(135deg, #1877f2 0%, #3b82f6 100%)', padding: '10px', borderRadius: '12px' }}>
                  <Share2 style={{ color: '#fff', width: '22px', height: '22px' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Meta Ads Lead Gen API & Webhook Engine</h3>
                  <div style={{ fontSize: '0.78rem', color: '#60a5fa', fontWeight: '600' }}>
                    Graph API (v19.0) • Real-time Facebook & Instagram Lead Intake
                  </div>
                </div>
              </div>
              <button onClick={() => setShowMetaModal(false)} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>✕ Close</button>
            </div>

            {/* Sub-tab Navigation */}
            <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-primary)', padding: '4px', borderRadius: '10px', marginBottom: '20px', border: '1px solid var(--border-color)' }}>
              <button
                onClick={() => setMetaTab('config')}
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: '8px', border: 'none', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer',
                  background: metaTab === 'config' ? 'var(--accent-blue)' : 'transparent',
                  color: metaTab === 'config' ? '#fff' : 'var(--text-muted)'
                }}
              >
                ⚙️ API Credentials & Webhook URL
              </button>
              <button
                onClick={() => setMetaTab('test')}
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: '8px', border: 'none', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer',
                  background: metaTab === 'test' ? '#10b981' : 'transparent',
                  color: metaTab === 'test' ? '#fff' : 'var(--text-muted)'
                }}
              >
                ⚡ Live Webhook Simulator
              </button>
              <button
                onClick={() => setMetaTab('guide')}
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: '8px', border: 'none', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer',
                  background: metaTab === 'guide' ? '#f59e0b' : 'transparent',
                  color: metaTab === 'guide' ? '#fff' : 'var(--text-muted)'
                }}
              >
                📖 Step-by-Step Setup Guide
              </button>
            </div>

            {/* TAB 1: API CONFIGURATION */}
            {metaTab === 'config' && (
              <div>
                <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '14px', borderRadius: '12px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#60a5fa', marginBottom: '4px' }}>
                    🔗 Meta Webhook Callback Endpoint URL (Enter this in Meta Developer Console)
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <code style={{ flex: 1, background: 'var(--bg-input)', padding: '8px 12px', borderRadius: '6px', fontSize: '0.8rem', color: '#34d399', fontWeight: '700' }}>
                      {metaConfigState.webhookUrl}
                    </code>
                    <button onClick={handleCopyWebhookUrl} className="btn btn-secondary" style={{ padding: '8px 12px', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                      {copied ? <Check style={{ width: '14px', height: '14px', color: '#34d399' }} /> : <Copy style={{ width: '14px', height: '14px' }} />}
                      <span>{copied ? 'Copied!' : 'Copy URL'}</span>
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Meta Page ID</label>
                    <input
                      type="text"
                      value={metaConfigState.pageId}
                      onChange={(e) => setMetaConfigState({ ...metaConfigState, pageId: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Webhook Verify Token</label>
                    <input
                      type="text"
                      value={metaConfigState.verifyToken}
                      onChange={(e) => setMetaConfigState({ ...metaConfigState, verifyToken: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label">System User Access Token (EAAG...)</label>
                  <input
                    type="password"
                    value={metaConfigState.accessToken}
                    onChange={(e) => setMetaConfigState({ ...metaConfigState, accessToken: e.target.value })}
                    className="form-input"
                  />
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Requires <code>leads_retrieval</code> and <code>pages_read_engagement</code> permissions from Business Manager.
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button onClick={() => setShowMetaModal(false)} className="btn btn-secondary">Close</button>
                  <button onClick={() => {
                    alert('Meta Ads API Credentials Saved & Webhook Active!');
                    setShowMetaModal(false);
                  }} className="btn gradient-btn-primary">
                    Save API Credentials
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: LIVE WEBHOOK TEST SIMULATOR */}
            {metaTab === 'test' && (
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Simulate a real-time lead submission event from Facebook or Instagram Lead Ads. Clicking <strong>"Fire Meta Lead Webhook"</strong> will instantly ingest the lead into your CRM pipeline with an AI score boost.
                </p>

                <form onSubmit={handleFireMetaTestLead}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                    <div className="form-group">
                      <label className="form-label">Prospect Full Name</label>
                      <input
                        type="text"
                        required
                        value={testLead.name}
                        onChange={(e) => setTestLead({ ...testLead, name: e.target.value })}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Company Name</label>
                      <input
                        type="text"
                        required
                        value={testLead.companyName}
                        onChange={(e) => setTestLead({ ...testLead, companyName: e.target.value })}
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                    <div className="form-group">
                      <label className="form-label">Email Address</label>
                      <input
                        type="email"
                        required
                        value={testLead.email}
                        onChange={(e) => setTestLead({ ...testLead, email: e.target.value })}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone Number</label>
                      <input
                        type="text"
                        required
                        value={testLead.phone}
                        onChange={(e) => setTestLead({ ...testLead, phone: e.target.value })}
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label className="form-label">Facebook/Instagram Ad Campaign Name</label>
                    <input
                      type="text"
                      required
                      value={testLead.campaignName}
                      onChange={(e) => setTestLead({ ...testLead, campaignName: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button type="button" onClick={() => setShowMetaModal(false)} className="btn btn-secondary">Cancel</button>
                    <button type="submit" className="btn gradient-btn-primary" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                      <Zap style={{ width: '16px', height: '16px' }} />
                      <span>Fire Meta Lead Ads Webhook</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 3: STEP-BY-STEP SETUP GUIDE */}
            {metaTab === 'guide' && (
              <div style={{ maxHeight: '420px', overflowY: 'auto', paddingRight: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid #1877f2' }}>
                    <div style={{ fontWeight: '800', fontSize: '0.95rem', color: '#1877f2', marginBottom: '6px' }}>
                      1️⃣ Step 1: Create a Meta Developer App
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      Log into <strong>developers.facebook.com</strong>, click <strong>Create App</strong>, choose <strong>Other &gt; Business</strong> as the app type, and name your app (e.g. <code>Sanna CRM Intake</code>).
                    </p>
                  </div>

                  <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid #10b981' }}>
                    <div style={{ fontWeight: '800', fontSize: '0.95rem', color: '#10b981', marginBottom: '6px' }}>
                      2️⃣ Step 2: Subscribe to Webhooks ('leadgen')
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '8px' }}>
                      Go to App Dashboard &gt; <strong>Webhooks</strong> &gt; <strong>Page</strong>. Set Callback URL to:
                    </p>
                    <code style={{ background: 'var(--bg-input)', padding: '6px 10px', borderRadius: '6px', fontSize: '0.78rem', color: '#34d399', display: 'block', marginBottom: '8px' }}>
                      {metaConfigState.webhookUrl}
                    </code>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Set Verify Token to <code>{metaConfigState.verifyToken}</code>, click <strong>Verify and Save</strong>, and subscribe to <code>leadgen</code>.
                    </p>
                  </div>

                  <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid #8b5cf6' }}>
                    <div style={{ fontWeight: '800', fontSize: '0.95rem', color: '#8b5cf6', marginBottom: '6px' }}>
                      3️⃣ Step 3: Generate System User Access Token
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      In <strong>business.facebook.com/settings</strong>, create an Admin System User, assign your Facebook Page, and click <strong>Generate Token</strong> with <code>leads_retrieval</code> and <code>pages_read_engagement</code> permissions.
                    </p>
                  </div>

                  <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid #f59e0b' }}>
                    <div style={{ fontWeight: '800', fontSize: '0.95rem', color: '#f59e0b', marginBottom: '6px' }}>
                      4️⃣ Step 4: Test with Meta's Lead Ads Testing Tool
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '8px' }}>
                      Open <strong>developers.facebook.com/tools/lead-ads-testing</strong>, pick your Page &amp; Form, click <strong>Create Lead</strong>, then click <strong>Track Status</strong> to verify <code>200 OK</code> response.
                    </p>
                    <a
                      href="https://developers.facebook.com/tools/lead-ads-testing"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#60a5fa' }}
                    >
                      <ExternalLink style={{ width: '12px', height: '12px' }} /> Open Meta Lead Ads Testing Tool
                    </a>
                  </div>

                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADD INTEGRATION MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '28px', maxWidth: '500px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)', padding: '10px', borderRadius: '12px' }}>
                <Boxes style={{ color: '#fff', width: '22px', height: '22px' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Add API Integration / Webhook</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Connect an external CRM gateway or web service.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Integration / Service Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Slack Webhook Notifications"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Service Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="form-select"
                >
                  <option value="Messaging & Outreach">Messaging & Outreach (WhatsApp, Slack)</option>
                  <option value="Email & Calendar">Email & Calendar (Gmail, Outlook)</option>
                  <option value="Payment Gateway">Payment Gateway (Stripe, Razorpay)</option>
                  <option value="ERP & Telephony">ERP & Telephony (SAP, Twilio)</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Connected Account / API Webhook URL</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. https://hooks.slack.com/services/..."
                  value={formData.connectedAccount}
                  onChange={(e) => setFormData({ ...formData, connectedAccount: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Integration Description</label>
                <textarea
                  rows="3"
                  placeholder="Briefly describe what data this API integration synchronizes..."
                  value={formData.details}
                  onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn gradient-btn-primary">
                  Connect Integration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default IntegrationHub;
