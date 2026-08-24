import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext';
import { Printer, Download, X, CheckCircle2, ShieldCheck, Landmark } from 'lucide-react';
import { DEFAULT_SELLER_INFO, DEFAULT_BANK_DETAILS } from '../finance/GSTInvoiceManager';

const formatInvoiceDate = (dStr) => {
  if (!dStr) return '';
  try {
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return dStr;
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  } catch (e) {
    return dStr;
  }
};

const numberToWords = (num) => {
  if (!num || num === 0) return 'Zero Only/-';
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const firstWord = (n) => {
    if (n < 20) return a[n];
    let ten = Math.floor(n / 10);
    let unit = n % 10;
    return b[ten] + (unit > 0 ? ' ' + a[unit] : '');
  };

  const convert = (n) => {
    let str = '';
    let crore = Math.floor(n / 10000000);
    n %= 10000000;
    if (crore > 0) str += convert(crore) + ' Crore ';
    let lakh = Math.floor(n / 100000);
    n %= 100000;
    if (lakh > 0) str += firstWord(lakh) + ' Lakh ';
    let thousand = Math.floor(n / 1000);
    n %= 1000;
    if (thousand > 0) str += firstWord(thousand) + ' Thousand ';
    let hundred = Math.floor(n / 100);
    n %= 100;
    if (hundred > 0) str += a[hundred] + ' Hundred ';
    if (n > 0) {
      if (str !== '') str += 'And ';
      str += firstWord(n) + ' ';
    }
    return str.trim();
  };

  let intNum = Math.floor(num);
  return convert(intNum) + ' Only/-';
};

const QuotePreviewModal = ({ quote, onClose }) => {
  const { activeTenant } = useCRM();
  const [template, setTemplate] = useState('sanna-red'); // 'sanna-red' | 'apex-modern'

  const currencySymbol = quote.currency ? (quote.currency.includes('(') ? quote.currency.split('(')[1]?.replace(')', '') : quote.currency) : '₹';
  const grandTotal = quote.grandTotal || quote.total || 0;
  const subtotal = quote.subtotal || 0;
  const seller = DEFAULT_SELLER_INFO;
  const bank = DEFAULT_BANK_DETAILS;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content print-area" 
        style={{ 
          padding: '28px 32px', 
          maxWidth: '860px', 
          width: '100%',
          background: '#ffffff', 
          color: '#0f172a',
          borderRadius: '8px',
          maxHeight: '94vh',
          overflowY: 'auto'
        }}
        onClick={e => e.stopPropagation()}
      >
        
        {/* Actions & Template Switcher Bar (Hidden in print) */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: '800', fontSize: '1rem', color: '#1e293b' }}>DOCUMENT PREVIEW</span>
            <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '3px', borderRadius: '6px' }}>
              <button
                onClick={() => setTemplate('sanna-red')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '5px',
                  border: 'none',
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  background: template === 'sanna-red' ? '#990000' : 'transparent',
                  color: template === 'sanna-red' ? '#ffffff' : '#475569'
                }}
              >
                Sanna Official MIS
              </button>
              <button
                onClick={() => setTemplate('apex-modern')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '5px',
                  border: 'none',
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  background: template === 'apex-modern' ? '#1e3a8a' : 'transparent',
                  color: template === 'apex-modern' ? '#ffffff' : '#475569'
                }}
              >
                Apex Modern
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handlePrint} className="btn gradient-btn-primary" style={{ padding: '7px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Printer style={{ width: '15px', height: '15px' }} />
              <span>Print / Download PDF</span>
            </button>
            <button onClick={onClose} className="btn btn-secondary" style={{ padding: '7px 12px', background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1' }}>
              <X style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        </div>

        {template === 'sanna-red' ? (
          /* Sanna Official MIS Reference Template */
          <div style={{ width: '100%', fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '11px', lineHeight: 1.3 }}>
            
            {/* 1. Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(185, 28, 28, 0.3)',
                  flexShrink: 0
                }}>
                  <span style={{ color: '#ffffff', fontSize: '1.45rem', fontWeight: '900', lineHeight: 1 }}>@</span>
                </div>
                <div>
                  <div style={{ color: '#990000', fontWeight: '900', fontSize: '1.3rem', letterSpacing: '0.8px', lineHeight: 1 }}>SANNA</div>
                  <div style={{ color: '#475569', fontWeight: '800', fontSize: '0.68rem', letterSpacing: '2.5px', lineHeight: 1, marginTop: '3px' }}>INNOVATIONS</div>
                  <div style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.58rem', marginTop: '2px' }}>Delivering Reality...</div>
                </div>
              </div>

              {/* Right Box */}
              <div style={{ width: '300px', border: '1px solid #1f2937' }}>
                <div style={{ background: '#990000', color: '#ffffff', fontWeight: '800', textAlign: 'center', padding: '5px', fontSize: '13px' }}>
                  Quotation / Proposal
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                  <tbody>
                    <tr style={{ borderTop: '1px solid #1f2937' }}>
                      <td style={{ padding: '4px 8px', fontWeight: '700', borderRight: '1px solid #1f2937', width: '42%' }}>Date</td>
                      <td style={{ padding: '4px 8px', fontWeight: '600' }}>{formatInvoiceDate(quote.createdDate || quote.date)}</td>
                    </tr>
                    <tr style={{ borderTop: '1px solid #1f2937' }}>
                      <td style={{ padding: '4px 8px', fontWeight: '700', borderRight: '1px solid #1f2937' }}>Quote No</td>
                      <td style={{ padding: '4px 8px', fontWeight: '700' }}>{quote.id}</td>
                    </tr>
                    <tr style={{ borderTop: '1px solid #1f2937' }}>
                      <td style={{ padding: '4px 8px', fontWeight: '700', borderRight: '1px solid #1f2937' }}>GSTIN/PAN</td>
                      <td style={{ padding: '4px 8px', fontWeight: '600', fontSize: '10px' }}>{seller.gstin} / {seller.pan}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. Customer Section */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '12px', fontWeight: '800', marginBottom: '3px', color: '#111827' }}>Customer:</div>
              <div style={{ border: '1px solid #1f2937' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '4px 8px', fontWeight: '700', borderRight: '1px solid #1f2937', width: '130px' }}>Name:</td>
                      <td style={{ padding: '4px 8px', fontWeight: '700' }}>{quote.customerName || 'Customer'}</td>
                    </tr>
                    <tr style={{ borderTop: '1px solid #1f2937' }}>
                      <td style={{ padding: '4px 8px', fontWeight: '700', borderRight: '1px solid #1f2937' }}>Contact:</td>
                      <td style={{ padding: '4px 8px' }}>{quote.contactPerson} {quote.contactEmail ? `(${quote.contactEmail})` : ''}</td>
                    </tr>
                    <tr style={{ borderTop: '1px solid #1f2937' }}>
                      <td style={{ padding: '4px 8px', fontWeight: '700', borderRight: '1px solid #1f2937' }}>State:</td>
                      <td style={{ padding: '4px 8px', color: '#1d4ed8', fontWeight: '700' }}>{quote.state || 'Karnataka'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. Items Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #1f2937', fontSize: '10.5px', marginBottom: '12px' }}>
              <thead>
                <tr style={{ background: '#990000', color: '#ffffff', fontWeight: '700' }}>
                  <th style={{ border: '1px solid #1f2937', padding: '5px 4px', width: '6%', textAlign: 'center' }}>SL No.</th>
                  <th style={{ border: '1px solid #1f2937', padding: '5px 6px', textAlign: 'left' }}>Description</th>
                  <th style={{ border: '1px solid #1f2937', padding: '5px 4px', width: '12%', textAlign: 'right' }}>Unite Price (₹)</th>
                  <th style={{ border: '1px solid #1f2937', padding: '5px 4px', width: '8%', textAlign: 'center' }}>Qty</th>
                  <th style={{ border: '1px solid #1f2937', padding: '5px 4px', width: '10%', textAlign: 'center' }}>GST %</th>
                  <th style={{ border: '1px solid #1f2937', padding: '5px 6px', width: '15%', textAlign: 'right' }}>Total Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {(quote.items || []).map((item, idx) => {
                  const qty = parseInt(item.qty) || 1;
                  const price = parseFloat(item.unitPrice) || 0;
                  const taxRate = parseFloat(item.taxRate || 18);
                  const base = price * qty;
                  const tax = base * (taxRate / 100);
                  const total = base + tax;

                  return (
                    <tr key={idx}>
                      <td style={{ border: '1px solid #1f2937', padding: '5px 4px', textAlign: 'center' }}>{idx + 1}</td>
                      <td style={{ border: '1px solid #1f2937', padding: '5px 6px', fontWeight: '600' }}>{item.productName || item.description}</td>
                      <td style={{ border: '1px solid #1f2937', padding: '5px 4px', textAlign: 'right' }}>{price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td style={{ border: '1px solid #1f2937', padding: '5px 4px', textAlign: 'center' }}>{qty}</td>
                      <td style={{ border: '1px solid #1f2937', padding: '5px 4px', textAlign: 'center' }}>{taxRate}%</td>
                      <td style={{ border: '1px solid #1f2937', padding: '5px 6px', textAlign: 'right', fontWeight: '700' }}>{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* 4. Amount In Words & Summary */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '14px', marginBottom: '16px' }}>
              <div style={{ flex: 1, background: '#990000', color: '#ffffff', fontWeight: '700', padding: '7px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', minHeight: '32px' }}>
                Amount In words :{numberToWords(grandTotal)}
              </div>
              <div style={{ width: '230px', border: '1px solid #1f2937' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '4px 8px', fontWeight: '700', borderRight: '1px solid #1f2937' }}>Subtotal</td>
                      <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: '700' }}>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr style={{ borderTop: '1px solid #1f2937' }}>
                      <td style={{ padding: '4px 8px', fontWeight: '800', borderRight: '1px solid #1f2937' }}>Grand Total</td>
                      <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: '800' }}>₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 5. Bank Details & Signature */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ lineHeight: 1.45 }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ fontWeight: '700', width: '105px' }}>Account Details:</span>
                  <span style={{ fontWeight: '700' }}>{bank.bankName}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ fontWeight: '700', width: '105px' }}>Account Name</span>
                  <span>{bank.accountName}</span>
                </div>
                <div style={{ paddingLeft: '113px' }}>
                  <div>Account Number - {bank.accountNumber}</div>
                  <div>IFSC code - {bank.ifscCode}</div>
                  <div>Branch {bank.branch}</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '180px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#111827', marginBottom: '2px' }}>
                  For <span style={{ color: '#990000' }}>SANNA INNOVATIONS</span>
                </div>
                <svg width="130" height="42" viewBox="0 0 136 46" fill="none">
                  <rect x="2" y="2" width="132" height="42" rx="4" stroke="#1e40af" strokeWidth="1.2" strokeDasharray="3 2" opacity="0.4" />
                  <text x="68" y="13" textAnchor="middle" fill="#1e40af" fontSize="7" fontWeight="bold">SANNA INNOVATIONS</text>
                  <path d="M 26,35 C 36,15 44,13 52,24 C 56,34 66,26 80,18 C 90,12 96,24 108,20" stroke="#1d4ed8" strokeWidth="2.2" strokeLinecap="round" fill="none" />
                  <text x="68" y="39" textAnchor="middle" fill="#1e40af" fontSize="6.5" fontWeight="bold">Authorised Signatory</text>
                </svg>
                <div style={{ fontSize: '10px', fontWeight: '700', color: '#4b5563' }}>Authorised Signatory</div>
              </div>
            </div>

            {/* 6. Footer Banner */}
            <div style={{ background: '#990000', color: '#ffffff', padding: '8px 12px', textAlign: 'center', fontSize: '11px', fontWeight: '700' }}>
              <div>{seller.address}</div>
              <div>{seller.website}</div>
            </div>
          </div>
        ) : (
          /* Apex Modern Corporate Template */
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
              <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1e3a8a' }}>{activeTenant?.name || 'Sanna Innovations'}</h1>
                <p style={{ fontSize: '0.85rem', color: '#475569' }}>Enterprise Quotation Division</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#0f172a' }}>OFFICIAL QUOTATION</h2>
                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#3b82f6' }}>Quote #: {quote.id}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Date: {quote.createdDate}</div>
              </div>
            </div>

            {/* Bill To */}
            <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '8px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b' }}>PREPARED FOR:</div>
              <div style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>{quote.customerName}</div>
              <div style={{ fontSize: '0.85rem', color: '#334155' }}>Attn: {quote.contactPerson} ({quote.contactEmail})</div>
            </div>

            {/* Items */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#1e293b', color: '#ffffff' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left' }}>Description</th>
                  <th style={{ padding: '8px 12px', textAlign: 'center', width: '70px' }}>Qty</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right', width: '110px' }}>Unit Price</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right', width: '120px' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {(quote.items || []).map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '10px 12px', fontWeight: '600' }}>{item.productName}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>{item.qty}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>{currencySymbol}{item.unitPrice.toLocaleString()}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '700' }}>{currencySymbol}{(item.unitPrice * item.qty).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
              <div style={{ width: '240px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Subtotal:</span><span>{currencySymbol}{quote.subtotal?.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '1.1rem', borderTop: '2px solid #0f172a', paddingTop: '6px', color: '#059669' }}>
                  <span>Grand Total:</span><span>{currencySymbol}{quote.grandTotal?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default QuotePreviewModal;
