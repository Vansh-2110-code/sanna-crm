import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext';
import {
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  Printer,
  Download,
  ShoppingBag,
  Clock,
  ShieldCheck,
  AlertCircle,
  Percent,
  Upload,
  Image as ImageIcon,
  Building,
  DollarSign,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ArrowRight,
  X,
  Layers,
  Calculator
} from 'lucide-react';
import QuotePreviewModal from './QuotePreviewModal';

const QuoteBuilder = () => {
  const { quotes = [], products = [], leads = [], createQuote, approveQuote, convertQuoteToOrder, activeRole } = useCRM();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [previewQuote, setPreviewQuote] = useState(null);

  // Wizard Step State: 1 | 2 | 3
  const [wizardStep, setWizardStep] = useState(1);

  // New Quote Form State
  const [customerName, setCustomerName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [notes, setNotes] = useState('');
  const [customLogoUrl, setCustomLogoUrl] = useState('');
  const [currency, setCurrency] = useState('USD ($)');

  const [lineItems, setLineItems] = useState([]);

  const handleOpenWizard = () => {
    setWizardStep(1);
    setCustomerName('');
    setContactPerson('');
    setContactEmail('');
    setDiscountPercent(0);
    setNotes('Payment terms: Net 30 days. All prices valid for 30 days from proposal issue date.');
    setCustomLogoUrl('');
    setCurrency('USD ($)');
    
    const defaultProd = products[0] || { id: 'svc-01', name: 'Enterprise Cloud Retainer', unitPrice: 2500, taxRatePercent: 18 };
    setLineItems([
      { productId: defaultProd.id, productName: defaultProd.name, qty: 1, unitPrice: defaultProd.unitPrice, taxRate: defaultProd.taxRatePercent }
    ]);
    
    setShowCreateModal(true);
  };

  const handleLogoFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit. Please upload a smaller logo image.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvt) => {
        setCustomLogoUrl(uploadEvt.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const addLineItem = () => {
    const defaultProd = products[0] || { id: '', name: 'Custom Agency Deliverable', unitPrice: 1000, taxRatePercent: 18 };
    setLineItems(prev => [
      ...prev,
      { productId: defaultProd.id, productName: defaultProd.name, qty: 1, unitPrice: defaultProd.unitPrice, taxRate: defaultProd.taxRatePercent }
    ]);
  };

  const removeLineItem = (index) => {
    setLineItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateLineItem = (index, field, value) => {
    setLineItems(prev => prev.map((item, i) => {
      if (i === index) {
        if (field === 'productId') {
          const selectedProd = products.find(p => p.id === value);
          return {
            ...item,
            productId: value,
            productName: selectedProd ? selectedProd.name : item.productName,
            unitPrice: selectedProd ? selectedProd.unitPrice : item.unitPrice,
            taxRate: selectedProd ? selectedProd.taxRatePercent : item.taxRate
          };
        }
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  // Dynamic Math calculations
  const subtotal = lineItems.reduce((sum, item) => sum + (parseFloat(item.unitPrice || 0) * (parseFloat(item.qty) || 1)), 0);
  const discountAmount = (subtotal * ((parseFloat(discountPercent) || 0) / 100));
  const subtotalAfterDiscount = subtotal - discountAmount;
  const taxTotal = lineItems.reduce((sum, item) => {
    const itemSub = (parseFloat(item.unitPrice || 0) * (parseFloat(item.qty) || 1));
    const itemAfterDisc = itemSub - (itemSub * ((parseFloat(discountPercent) || 0) / 100));
    return sum + (itemAfterDisc * ((parseFloat(item.taxRate) || 0) / 100));
  }, 0);
  const grandTotal = subtotalAfterDiscount + taxTotal;

  const handleCreateQuoteSubmit = (e) => {
    e.preventDefault();
    if (lineItems.length === 0) {
      alert('Please add at least one line item before submitting.');
      return;
    }

    createQuote({
      customerName: customerName || 'Enterprise Client',
      contactPerson: contactPerson || 'Corporate Representative',
      contactEmail: contactEmail || 'contact@client.com',
      items: lineItems,
      subtotal,
      discountPercent: parseFloat(discountPercent) || 0,
      discountAmount,
      taxTotal,
      grandTotal,
      notes,
      customLogoUrl,
      currency
    });

    setShowCreateModal(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '24px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calculator style={{ width: '14px', height: '14px' }} />
            Automated Pricing, Taxes & Proposal Engine
          </div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: '900', margin: '4px 0 6px', color: 'var(--text-primary)' }}>
            Quotation & Proposal Management ({quotes.length})
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
            Build multi-item quotations with volume discounts, tax calculation, manager approval flow, and instant quote-to-order conversion.
          </p>
        </div>

        <button
          onClick={handleOpenWizard}
          className="btn gradient-btn-primary"
          style={{ padding: '10px 18px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem' }}
        >
          <Plus style={{ width: '16px', height: '16px' }} />
          <span>New 3-Step Quotation</span>
        </button>
      </div>

      {/* Quotations List Table */}
      <div className="saas-card" style={{ padding: '0px', overflow: 'hidden' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
            Generated Proposals & Invoices
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {quotes.length} total active proposals
          </span>
        </div>
        
        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Quote Reference</th>
                <th>Client & Contact</th>
                <th>Created & Valid Until</th>
                <th>Subtotal</th>
                <th>Discount & Taxes</th>
                <th>Grand Total</th>
                <th>Status</th>
                <th style={{ textAlign: 'right', paddingRight: '20px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {quotes.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No quotations generated yet. Click "New 3-Step Quotation" to create your first client proposal.
                  </td>
                </tr>
              ) : (
                quotes.map(quote => (
                  <tr key={quote.id}>
                    <td>
                      <code style={{ fontSize: '0.82rem', fontWeight: '800', color: '#818cf8', background: 'rgba(99,102,241,0.1)', padding: '3px 6px', borderRadius: '6px' }}>
                        {quote.id}
                      </code>
                    </td>
                    <td>
                      <div style={{ fontWeight: '800', color: 'var(--text-primary)' }}>{quote.customerName}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{quote.contactPerson} ({quote.contactEmail})</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{quote.createdDate}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Valid until: {quote.validUntil}</div>
                    </td>
                    <td>
                      <span className="tabular-nums" style={{ fontWeight: '700', color: 'var(--text-secondary)' }}>
                        ${quote.subtotal.toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <div className="tabular-nums" style={{ fontSize: '0.78rem', color: '#fbbf24', fontWeight: '700' }}>
                        -{quote.discountPercent}% (${(quote.discountAmount || 0).toLocaleString()})
                      </div>
                      <div className="tabular-nums" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        +${(quote.taxTotal || 0).toLocaleString()} Tax
                      </div>
                    </td>
                    <td>
                      <span className="tabular-nums" style={{ fontWeight: '900', color: '#34d399', fontSize: '1rem' }}>
                        ${quote.grandTotal.toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill ${quote.status === 'Accepted' ? 'status-pill-emerald' : quote.status === 'Converted to Order' ? 'status-pill-indigo' : 'status-pill-amber'}`}>
                        {quote.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          onClick={() => setPreviewQuote(quote)}
                          className="btn btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                        >
                          <Printer style={{ width: '13px', height: '13px' }} />
                          <span>PDF</span>
                        </button>

                        {quote.status === 'Pending Approval' && (
                          <button
                            onClick={() => approveQuote(quote.id)}
                            className="btn gradient-btn-emerald"
                            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                          >
                            Approve
                          </button>
                        )}

                        {quote.status === 'Accepted' && (
                          <button
                            onClick={() => convertQuoteToOrder(quote.id)}
                            className="btn gradient-btn-primary"
                            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                          >
                            <ShoppingBag style={{ width: '13px', height: '13px' }} />
                            <span>Order</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3-Step Guided Quotation Builder Wizard Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '32px', maxWidth: '820px', width: '100%', background: '#0e121d' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '900', margin: 0, color: '#ffffff' }}>
                  Guided Quotation & Pricing Wizard
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Step {wizardStep} of 3 — {wizardStep === 1 ? 'Client Information & Currency' : wizardStep === 2 ? 'Line Items & Offerings' : 'Discounts, Taxes & Review'}
                </span>
              </div>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            {/* Wizard Step Progress Pills Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '24px' }}>
              {[
                { step: 1, label: '1. Client & Brand' },
                { step: 2, label: '2. Items & Pricing' },
                { step: 3, label: '3. Terms & Review' }
              ].map(s => (
                <div
                  key={s.step}
                  onClick={() => setWizardStep(s.step)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    textAlign: 'center',
                    fontSize: '0.78rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                    background: wizardStep === s.step ? 'rgba(99, 102, 241, 0.22)' : 'rgba(255, 255, 255, 0.03)',
                    border: wizardStep === s.step ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.06)',
                    color: wizardStep === s.step ? '#a5b4fc' : 'var(--text-muted)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {s.label}
                </div>
              ))}
            </div>

            {/* STEP 1: Client & Currency */}
            {wizardStep === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Client / Organization Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Acme Global Logistics Ltd"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Currency Standard</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="form-select"
                    >
                      <option value="USD ($)">USD ($)</option>
                      <option value="INR (₹)">INR (₹)</option>
                      <option value="EUR (€)">EUR (€)</option>
                      <option value="GBP (£)">GBP (£)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Primary Contact Representative *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Jane Doe (Director of Procurement)"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contact Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. jane.doe@acme.com"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Client Custom Logo URL / File (Optional)</label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="https://example.com/logo.png"
                      value={customLogoUrl}
                      onChange={(e) => setCustomLogoUrl(e.target.value)}
                      className="form-input"
                      style={{ flex: 1 }}
                    />
                    <label className="btn btn-secondary" style={{ cursor: 'pointer', padding: '9px 14px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      <Upload style={{ width: '14px', height: '14px' }} />
                      <span>Upload</span>
                      <input type="file" accept="image/*" onChange={handleLogoFileUpload} style={{ display: 'none' }} />
                    </label>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px' }}>
                  <button
                    onClick={() => {
                      if (!customerName || !contactPerson) {
                        alert('Please fill in Client Name and Contact Person.');
                        return;
                      }
                      setWizardStep(2);
                    }}
                    className="btn gradient-btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span>Proceed to Line Items</span>
                    <ChevronRight style={{ width: '16px', height: '16px' }} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Line Items & Catalog */}
            {wizardStep === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                    Quotation Line Items ({lineItems.length})
                  </span>
                  <button
                    type="button"
                    onClick={addLineItem}
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                  >
                    <Plus style={{ width: '13px', height: '13px' }} />
                    <span>Add Line Item</span>
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto' }}>
                  {lineItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="saas-card"
                      style={{ padding: '14px', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '10px', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}
                    >
                      <div>
                        <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Service / Product</label>
                        <input
                          type="text"
                          value={item.productName}
                          onChange={(e) => updateLineItem(idx, 'productName', e.target.value)}
                          placeholder="Item description"
                          className="form-input"
                          style={{ padding: '6px 10px', fontSize: '0.8rem', marginTop: '2px' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Qty</label>
                        <input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) => updateLineItem(idx, 'qty', parseInt(e.target.value, 10) || 1)}
                          className="form-input tabular-nums"
                          style={{ padding: '6px 10px', fontSize: '0.8rem', marginTop: '2px' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Unit Rate ($)</label>
                        <input
                          type="number"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => updateLineItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="form-input tabular-nums"
                          style={{ padding: '6px 10px', fontSize: '0.8rem', marginTop: '2px' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Tax (%)</label>
                        <input
                          type="number"
                          min="0"
                          value={item.taxRate}
                          onChange={(e) => updateLineItem(idx, 'taxRate', parseFloat(e.target.value) || 0)}
                          className="form-input tabular-nums"
                          style={{ padding: '6px 10px', fontSize: '0.8rem', marginTop: '2px' }}
                        />
                      </div>

                      <div style={{ paddingTop: '16px' }}>
                        <button
                          type="button"
                          onClick={() => removeLineItem(idx)}
                          disabled={lineItems.length === 1}
                          style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: lineItems.length === 1 ? 'not-allowed' : 'pointer', opacity: lineItems.length === 1 ? 0.3 : 1 }}
                        >
                          <Trash2 style={{ width: '15px', height: '15px' }} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Subtotal Preview Strip */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '10px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#a5b4fc' }}>Items Total:</span>
                  <span className="tabular-nums" style={{ fontSize: '1.15rem', fontWeight: '900', color: '#ffffff' }}>
                    ${subtotal.toLocaleString()}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '14px' }}>
                  <button onClick={() => setWizardStep(1)} className="btn btn-secondary">
                    <ChevronLeft style={{ width: '16px', height: '16px' }} />
                    <span>Back</span>
                  </button>
                  <button onClick={() => setWizardStep(3)} className="btn gradient-btn-primary">
                    <span>Proceed to Discounts & Review</span>
                    <ChevronRight style={{ width: '16px', height: '16px' }} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Discounts, Terms & Final Calculation Breakdown */}
            {wizardStep === 3 && (
              <form onSubmit={handleCreateQuoteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Volume Discount Percentage (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                      className="form-input tabular-nums"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Quotation Validity Period</label>
                    <input
                      type="text"
                      defaultValue="30 Days from Issue"
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Terms, Deliverable Scope & Special Notes</label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="form-input"
                    placeholder="Enter customized scope, payment schedule, or delivery milestones..."
                  />
                </div>

                {/* Live Dynamic Financial Summary Card */}
                <div className="saas-card" style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(18, 21, 31, 0.95) 100%)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#34d399', textTransform: 'uppercase', marginBottom: '12px' }}>
                    Live Price & Tax Breakdown
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Line Items Subtotal:</span>
                      <strong className="tabular-nums" style={{ color: '#ffffff' }}>${subtotal.toLocaleString()}</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fbbf24' }}>
                      <span>Discount ({discountPercent}%):</span>
                      <strong className="tabular-nums">-${discountAmount.toLocaleString()}</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                      <span>Calculated Tax Total:</span>
                      <strong className="tabular-nums" style={{ color: '#ffffff' }}>+${taxTotal.toLocaleString()}</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: '900', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px', marginTop: '4px' }}>
                      <span style={{ color: '#ffffff' }}>Grand Total ({currency.split(' ')[0]}):</span>
                      <span className="tabular-nums" style={{ color: '#34d399' }}>${grandTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '14px' }}>
                  <button type="button" onClick={() => setWizardStep(2)} className="btn btn-secondary">
                    <ChevronLeft style={{ width: '16px', height: '16px' }} />
                    <span>Back</span>
                  </button>
                  <button type="submit" className="btn gradient-btn-primary" style={{ padding: '10px 24px' }}>
                    <CheckCircle2 style={{ width: '16px', height: '16px' }} />
                    <span>Create & Issue Quotation</span>
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* PDF View / Print Preview Modal */}
      {previewQuote && (
        <QuotePreviewModal quote={previewQuote} onClose={() => setPreviewQuote(null)} />
      )}

    </div>
  );
};

export default QuoteBuilder;
