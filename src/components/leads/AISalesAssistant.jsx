import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext';
import {
  Sparkles, Bot, Zap, ArrowRight, CheckCircle2,
  Mail, Send, Copy, RefreshCw, MessageSquare, Flame
} from 'lucide-react';

const AISalesAssistant = () => {
  const { leads, deals } = useCRM();
  const [selectedLeadId, setSelectedLeadId] = useState(leads[0]?.id || '');
  const [tone, setTone] = useState('Professional');
  const [copied, setCopied] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const selectedLead = (leads || []).find(l => l.id === selectedLeadId) || leads[0];

  // AI Probability & Insights Algorithm
  const score = selectedLead?.score || 75;
  const winProbability = Math.min(Math.round(score * 0.95), 98);
  const dealValue = selectedLead?.value || selectedLead?.budget || 45000;

  // Next Best Actions generated based on score and stage
  const getNextBestActions = (lScore) => {
    if (lScore >= 80) {
      return [
        { title: 'Schedule Executive Demo', desc: 'High conversion intent. Book a 30-min architecture review with decision makers.', priority: 'URGENT' },
        { title: 'Send Custom Enterprise Proposal', desc: 'Draft custom multi-seat quote with 15% volume discount.', priority: 'HIGH' }
      ];
    } else if (lScore >= 60) {
      return [
        { title: 'Send Case Study Whitepaper', desc: 'Share retail multi-tenant migration success story.', priority: 'MEDIUM' },
        { title: 'Nurture via Email Campaign', desc: 'Enroll lead into 14-day automated product feature drip.', priority: 'MEDIUM' }
      ];
    } else {
      return [
        { title: 'Qualify B2B Budget', desc: 'Reach out via phone to verify current year software budget.', priority: 'LOW' }
      ];
    }
  };

  const nextActions = getNextBestActions(score);

  // Generate Email Draft based on Lead & Tone
  const generateEmailDraft = () => {
    if (!selectedLead) return '';
    const leadName = selectedLead.name || 'Valued Customer';
    const company = selectedLead.company || 'your organization';

    if (tone === 'Persuasive') {
      return `Subject: Transform ${company}'s Workflow with Sanna CRM

Hi ${leadName},

I noticed ${company} is currently evaluating modern customer relationship platforms to accelerate sales pipeline velocity.

With Sanna CRM's enterprise multi-tenant architecture, clients in your industry have seen a 38% increase in deal conversion rates within 60 days.

I would love to arrange a quick 15-minute demo to show you how our omnichannel lead scoring and automated pipeline workflows can benefit ${company}.

Are you available this Thursday at 2:00 PM EST?

Best regards,
Sanna Enterprise Sales Team`;
    }

    if (tone === 'Urgent') {
      return `Subject: Limited Time Enterprise Tier Access for ${company}

Hi ${leadName},

Our Q3 Enterprise Onboarding cohort for ${company} closes at the end of this week.

We have reserved 25 complimentary seats and full Razorpay/Stripe billing gateway integration setup for your team if we confirm before Friday.

Let me know if we can finalize the proposal today to lock in your dedicated SLA tier.

Best regards,
Sanna Enterprise Sales Team`;
    }

    return `Subject: Introduction to Sanna CRM Platform - ${company}

Dear ${leadName},

Thank you for your interest in Sanna CRM. Based on your team's requirements, our enterprise platform offers end-to-end sales pipeline tracking, custom quotation engine, and zero-trust security audit logs.

Attached is our product matrix and technical overview for ${company}.

Please let me know if you have any questions or if you would like to schedule a product walk-through.

Kind regards,
Sanna Enterprise Sales Team`;
  };

  const emailDraft = generateEmailDraft();

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(emailDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAskAI = (e) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;

    setIsThinking(true);
    setTimeout(() => {
      setIsThinking(false);
      setAiResponse(`AI Recommendation for "${customPrompt}":
Based on lead profile ${selectedLead?.name} (${selectedLead?.company}), we recommend offering a 30-day extended trial with 24/7 dedicated support SLA to close this $${(selectedLead?.value || 50000).toLocaleString()} pipeline deal.`);
    }, 1000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: '#a855f7', fontWeight: '700', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles style={{ width: '16px', height: '16px', color: '#a855f7' }} /> AI Sales Copilot & Intelligence
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '4px 0' }}>
            AI Lead Intelligence & Email Synthesizer
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Predict deal conversion probabilities, receive automated next-best actions, and generate AI email drafts.
          </p>
        </div>

        {/* Lead Select Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)' }}>Target Lead:</label>
          <select
            value={selectedLeadId}
            onChange={(e) => setSelectedLeadId(e.target.value)}
            className="form-select"
            style={{ width: '220px', fontWeight: '700' }}
          >
            {(leads || []).map(l => (
              <option key={l.id} value={l.id}>{l.name} ({l.company})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid: 2 Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        {/* Left Column: Intelligence Score & Next Best Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Probability Card */}
          <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #a855f7' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <div style={{ fontWeight: '800', fontSize: '1.2rem' }}>{selectedLead?.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedLead?.company} • {selectedLead?.title || 'Decision Maker'}</div>
              </div>
              <span className="badge badge-purple" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                <Flame style={{ width: '14px', height: '14px', marginRight: '4px' }} /> Score: {score}/100
              </span>
            </div>

            <div style={{ background: 'var(--bg-primary)', padding: '16px', borderRadius: '12px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)' }}>AI Win Probability</span>
                <span style={{ fontSize: '0.9rem', fontWeight: '900', color: '#10b981' }}>{winProbability}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'var(--bg-input)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${winProbability}%`, height: '100%', background: 'linear-gradient(90deg, #a855f7 0%, #10b981 100%)', borderRadius: '4px' }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <span>Estimated Deal Value: <strong style={{ color: '#34d399' }}>${(dealValue).toLocaleString()}</strong></span>
              <span>Status: <strong>{selectedLead?.status || 'Qualified'}</strong></span>
            </div>
          </div>

          {/* Next Best Actions */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap style={{ color: '#f59e0b', width: '18px', height: '18px' }} /> Recommended Next Best Actions
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {nextActions.map((act, i) => (
                <div key={i} className="glass-card" style={{ padding: '14px', borderLeft: `3px solid ${act.priority === 'URGENT' ? '#ef4444' : '#3b82f6'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{act.title}</div>
                    <span className={`badge ${act.priority === 'URGENT' ? 'badge-amber' : 'badge-blue'}`} style={{ fontSize: '0.65rem' }}>
                      {act.priority}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>{act.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Ask AI Copilot */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bot style={{ color: '#60a5fa', width: '18px', height: '18px' }} /> Ask AI Sales Strategist
            </h3>

            <form onSubmit={handleAskAI} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Ask e.g. How to overcome price objection for this lead?"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="form-input"
                style={{ flex: 1, fontSize: '0.8rem' }}
              />
              <button type="submit" className="btn gradient-btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
                <Send style={{ width: '14px', height: '14px' }} /> Ask
              </button>
            </form>

            {isThinking && (
              <div style={{ marginTop: '12px', fontSize: '0.8rem', color: '#a855f7', fontWeight: '700' }}>
                ⚡ AI is analyzing lead parameters...
              </div>
            )}

            {aiResponse && (
              <div className="glass-card" style={{ marginTop: '12px', padding: '12px', fontSize: '0.8rem', whiteSpace: 'pre-wrap', color: 'var(--text-primary)', borderLeft: '3px solid #60a5fa' }}>
                {aiResponse}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: AI Email Synthesizer */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail style={{ color: '#10b981', width: '18px', height: '18px' }} /> AI Outreach Email Synthesizer
              </h3>

              {/* Tone Selector */}
              <div style={{ display: 'flex', gap: '6px' }}>
                {['Professional', 'Persuasive', 'Urgent'].map(t => (
                  <button
                    key={t}
                    onClick={() => setTone(t)}
                    className={`btn ${tone === t ? 'gradient-btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '4px 10px', fontSize: '0.725rem' }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Generated Email Textarea */}
            <div style={{ position: 'relative' }}>
              <textarea
                readOnly
                value={emailDraft}
                className="form-input"
                rows={16}
                style={{
                  width: '100%',
                  fontFamily: 'monospace',
                  fontSize: '0.825rem',
                  lineHeight: '1.5',
                  padding: '16px',
                  background: 'var(--bg-primary)',
                  borderRadius: '10px',
                  resize: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Tone: <strong>{tone}</strong> • Tailored for {selectedLead?.name || 'Lead'}
            </span>
            <button
              onClick={handleCopyEmail}
              className="btn gradient-btn-primary"
              style={{ padding: '10px 18px', fontSize: '0.8rem' }}
            >
              {copied ? <CheckCircle2 style={{ width: '16px', height: '16px' }} /> : <Copy style={{ width: '16px', height: '16px' }} />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy AI Email Draft'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AISalesAssistant;
