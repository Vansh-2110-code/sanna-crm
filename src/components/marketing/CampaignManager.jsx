import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext';
import exportToCSV from '../../utils/csvExporter';
import { Megaphone, Plus, TrendingUp, Users, Mail, MessageSquare, Percent, CheckCircle2, FileSpreadsheet } from 'lucide-react';

const CampaignManager = () => {
  const { campaigns = [], addCampaign, logAudit } = useCRM();
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    channel: 'Email Newsletter',
    targetAudience: 'All Leads',
    sentCount: 500
  });

  const handleExportCSV = () => {
    let csv = `Campaign ID,Name,Channel,Target Audience,Sent Count,Open Rate %,Click Rate %,Converted Leads,Estimated ROI,Status,Start Date\n`;
    campaigns.forEach(c => {
      csv += `"${c.id}","${(c.name || '').replace(/"/g, '""')}","${c.channel || ''}","${c.targetAudience || ''}",${c.sentCount || 0},"${c.openRatePercent || 0}%","${c.clickRatePercent || 0}%",${c.convertedLeads || 0},"${c.estimatedROI || '0%'}","${c.status || 'Active'}","${c.startDate || ''}"\n`;
    });

    exportToCSV(csv, `AstraCRM_Marketing_Campaigns_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.targetAudience) return;

    if (addCampaign) {
      addCampaign({
        name: formData.name,
        channel: formData.channel,
        targetAudience: formData.targetAudience,
        sentCount: parseInt(formData.sentCount, 10),
        openRatePercent: parseFloat(formData.openRatePercent),
        clickRatePercent: parseFloat(formData.clickRatePercent),
        convertedLeads: parseInt(formData.convertedLeads, 10),
        estimatedROI: formData.estimatedROI,
        status: 'Active',
        startDate: new Date().toISOString().split('T')[0]
      });
    }

    if (logAudit) {
      logAudit('CREATE_CAMPAIGN', formData.name, `Created marketing campaign: ${formData.name} via ${formData.channel}`, 'INFO');
    }

    setShowModal(false);
    setFormData({
      name: '',
      channel: 'Email Outreach',
      targetAudience: '',
      sentCount: 1000,
      openRatePercent: 45.0,
      clickRatePercent: 20.0,
      convertedLeads: 8,
      estimatedROI: '300%'
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: '#8b5cf6', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Omnichannel Marketing Hub & Growth Telemetry
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '4px 0' }}>
            Marketing Campaigns ({campaigns.length})
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Launch email, WhatsApp, and SMS outreach campaigns with real-time open rate telemetry, converted lead metrics, and ROI tracking.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleExportCSV}
            className="btn btn-secondary"
            style={{ padding: '10px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <FileSpreadsheet style={{ width: '16px', height: '16px' }} />
            <span>Export Campaigns CSV</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="btn gradient-btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}
          >
            <Plus style={{ width: '18px', height: '18px' }} />
            <span>Launch New Campaign</span>
          </button>
        </div>
      </div>

      {/* Campaigns Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        {campaigns.length === 0 ? (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
            <Megaphone style={{ width: '48px', height: '48px', margin: '0 auto 12px auto', opacity: 0.4 }} />
            <p>No active marketing campaigns. Click <strong>"Launch New Campaign"</strong> above to launch your first outreach blitz.</p>
          </div>
        ) : (
          campaigns.map(cmp => (
            <div key={cmp.id} className="glass-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="badge badge-purple">{cmp.channel}</span>
                <span className="badge badge-emerald">{cmp.status || 'Active'}</span>
              </div>

              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '6px' }}>{cmp.name}</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                Target Audience: <strong>{cmp.targetAudience}</strong>
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: 'var(--bg-primary)', padding: '12px', borderRadius: '10px', marginBottom: '14px' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>OPEN RATE</div>
                  <div style={{ fontWeight: '800', color: '#60a5fa', fontSize: '1.1rem' }}>{cmp.openRatePercent}%</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>CLICK RATE</div>
                  <div style={{ fontWeight: '800', color: '#c084fc', fontSize: '1.1rem' }}>{cmp.clickRatePercent}%</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>CONVERTED LEADS</div>
                  <div style={{ fontWeight: '800', color: '#34d399', fontSize: '1.1rem' }}>{cmp.convertedLeads} Leads</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ESTIMATED ROI</div>
                  <div style={{ fontWeight: '800', color: '#fbbf24', fontSize: '1.1rem' }}>{cmp.estimatedROI}</div>
                </div>
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                Launched: {cmp.startDate} • {cmp.sentCount?.toLocaleString() || 500} Recipient Messages
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE CAMPAIGN MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '28px', maxWidth: '520px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)', padding: '10px', borderRadius: '12px' }}>
                <Megaphone style={{ color: '#fff', width: '22px', height: '22px' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Launch Marketing Campaign</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Configure automated outreach details and ROI benchmarks.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Campaign Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q4 SaaS Enterprise Renewal Campaign"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Outreach Channel</label>
                  <select
                    value={formData.channel}
                    onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                    className="form-select"
                  >
                    <option value="Email Outreach">Email Outreach</option>
                    <option value="WhatsApp Broadcast">WhatsApp Broadcast</option>
                    <option value="SMS Campaign">SMS Campaign</option>
                    <option value="Social Media Ad">Social Media Ad</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Total Recipients</label>
                  <input
                    type="number"
                    required
                    placeholder="1000"
                    value={formData.sentCount}
                    onChange={(e) => setFormData({ ...formData, sentCount: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Target Audience Segment</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CTOs & VPs of Engineering"
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '24px' }}>
                <div className="form-group">
                  <label className="form-label">Target Open Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.openRatePercent}
                    onChange={(e) => setFormData({ ...formData, openRatePercent: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Estimated ROI</label>
                  <input
                    type="text"
                    value={formData.estimatedROI}
                    onChange={(e) => setFormData({ ...formData, estimatedROI: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn gradient-btn-primary">
                  Launch Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default CampaignManager;
