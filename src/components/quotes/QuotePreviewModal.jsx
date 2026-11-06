import React, { useState, useEffect } from 'react';
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

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const currencySymbol = quote.currency ? (quote.currency.includes('(') ? quote.currency.split('(')[1]?.replace(')', '') : quote.currency) : '₹';
  const grandTotal = parseFloat(quote.grandTotal || quote.total || 0);
  const subtotal = parseFloat(quote.subtotal || grandTotal || 0);
  const seller = DEFAULT_SELLER_INFO;
  const bank = DEFAULT_BANK_DETAILS;

  const handlePrint = () => {
    window.print();
  };

  // Safe items fallback
  const items = quote.items && quote.items.length > 0 ? quote.items : [
    {
      productName: quote.notes || quote.title || 'Digital Marketing Monthly charges for ' + (quote.customerName || 'Client'),
      unitPrice: subtotal > 0 ? subtotal : 20000,
      qty: 1,
      taxRate: 18
    }
  ];

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.84)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        zIndex: 9999,
        overflowY: 'auto',
        padding: '24px 16px'
      }}
    >
      {/* Print stylesheet injected to ensure crisp paper output */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          body * {
            visibility: hidden !important;
          }
          .print-area, .print-area * {
            visibility: visible !important;
          }
          .print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
        `
      }} />

      {/* Floating Close Button on Overlay (Always visible anywhere on screen) */}
      <button
        onClick={onClose}
        title="Close Preview (Esc)"
        className="no-print"
        style={{
          position: 'fixed',
          top: '20px',
          right: '24px',
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          background: '#dc2626',
          color: '#ffffff',
          border: '2px solid #ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
          zIndex: 10000,
          transition: 'transform 0.15s ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <X style={{ width: '22px', height: '22px' }} />
      </button>

      {/* Document Card Paper Container */}
      <div 
        className="modal-content print-area" 
        style={{ 
          padding: '28px 34px', 
          maxWidth: '850px', 
          width: '100%',
          background: '#ffffff', 
          color: '#111827',
          borderRadius: '6px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
          border: '1px solid #e2e8f0',
          position: 'relative',
          margin: '0 auto 40px auto'
        }}
        onClick={e => e.stopPropagation()}
      >
        
        {/* Sticky Controls Header (Hidden in print) */}
        <div 
          className="no-print" 
          style={{ 
            position: 'sticky',
            top: '-28px',
            margin: '-28px -34px 20px -34px',
            padding: '14px 24px',
            background: '#ffffff',
            borderBottom: '2px solid #e2e8f0',
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            flexWrap: 'wrap', 
            gap: '12px',
            zIndex: 20,
            borderTopLeftRadius: '6px',
            borderTopRightRadius: '6px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: '800', fontSize: '0.95rem', color: '#0f172a' }}>
              OFFICIAL QUOTATION PREVIEW
            </span>
            <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: '#fef2f2', color: '#b91c1c', fontWeight: '700', border: '1px solid #fecaca' }}>
              {quote.id || quote.quoteNumber || 'Draft'}
            </span>
            
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
                  background: template === 'sanna-red' ? '#b91c1c' : 'transparent',
                  color: template === 'sanna-red' ? '#ffffff' : '#475569'
                }}
              >
                Sanna Red MIS (Official)
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

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button onClick={handlePrint} className="btn gradient-btn-primary" style={{ padding: '7px 16px', fontSize: '0.82rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Printer style={{ width: '15px', height: '15px' }} />
              <span>Print / Download PDF</span>
            </button>
            <button 
              onClick={onClose} 
              className="btn btn-secondary" 
              style={{ 
                padding: '7px 16px', 
                background: '#fef2f2', 
                color: '#dc2626', 
                border: '1px solid #fca5a5',
                fontSize: '0.82rem',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <X style={{ width: '16px', height: '16px' }} />
              <span>Close Preview</span>
            </button>
          </div>
        </div>

        {template === 'sanna-red' ? (
          /* Sanna Official MIS Reference Quotation Template (Exact Match to User Reference SS 2) */
          <div id="printable-quotation" style={{ width: '100%', fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '11px', lineHeight: 1.3, color: '#111827' }}>
            
            {/* 1. Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              {/* Left: Authentic Sanna Innovations Logo Branding */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <img 
                  src="/sanna_logo.png" 
                  alt="Sanna Innovations" 
                  style={{ height: '82px', maxWidth: '240px', objectFit: 'contain' }} 
                />
              </div>

              {/* Right: QUOTATION Header Box & Metadata Table */}
              <div style={{ width: '310px', border: '1px solid #1f2937' }}>
                <div style={{
                  background: '#b91c1c',
                  color: '#ffffff',
                  fontWeight: '900',
                  textAlign: 'center',
                  padding: '7px',
                  fontSize: '15px',
                  letterSpacing: '1px',
                  textTransform: 'uppercase'
                }}>
                  QUOTATION
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                  <tbody>
                    <tr style={{ borderTop: '1px solid #1f2937' }}>
                      <td style={{ padding: '4px 8px', fontWeight: '700', borderRight: '1px solid #1f2937', width: '42%' }}>Date</td>
                      <td style={{ padding: '4px 8px', fontWeight: '600' }}>
                        {formatInvoiceDate(quote.createdDate || quote.date || new Date())}
                      </td>
                    </tr>
                    <tr style={{ borderTop: '1px solid #1f2937' }}>
                      <td style={{ padding: '4px 8px', fontWeight: '700', borderRight: '1px solid #1f2937' }}>Valid Until</td>
                      <td style={{ padding: '4px 8px', fontWeight: '600' }}>
                        {quote.validUntil ? formatInvoiceDate(quote.validUntil) : ''}
                      </td>
                    </tr>
                    <tr style={{ borderTop: '1px solid #1f2937' }}>
                      <td style={{ padding: '4px 8px', fontWeight: '700', borderRight: '1px solid #1f2937' }}>Quote #</td>
                      <td style={{ padding: '4px 8px', fontWeight: '700' }}>
                        [{quote.quoteNumber || quote.id || 'SI/Aug/2026/039'}
                      </td>
                    </tr>
                    <tr style={{ borderTop: '1px solid #1f2937' }}>
                      <td style={{ padding: '4px 8px', fontWeight: '700', borderRight: '1px solid #1f2937' }}>GSTIN</td>
                      <td style={{ padding: '4px 8px', fontWeight: '700', fontSize: '10px' }}>
                        {seller.gstin || '29BNJPS7776J1ZW'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. Customer & Quote/Product Description Parallel Boxes */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              {/* Left: Customer Box */}
              <div>
                <div style={{
                  background: '#b91c1c',
                  color: '#ffffff',
                  fontWeight: '800',
                  padding: '4px 8px',
                  fontSize: '11.5px',
                  border: '1px solid #1f2937',
                  borderBottom: 'none'
                }}>
                  Customer:
                </div>
                <div style={{
                  border: '1px solid #1f2937',
                  padding: '6px 8px',
                  minHeight: '75px',
                  fontSize: '11px',
                  lineHeight: 1.35
                }}>
                  <div style={{ fontWeight: '700' }}>To: {quote.customerName || 'Bharadwaj Enterprises'}</div>
                  <div>{quote.customerAddress || quote.billingAddress || quote.address || '33/10, Canal Bank Road, Government Primary School,'}</div>
                  <div>{quote.customerAddress2 || quote.address2 || 'RA Puram'}</div>
                  <div>{quote.customerState || quote.state || 'Chennai, Tamil Nadu, 600028'}</div>
                </div>
              </div>

              {/* Right: Quote/Product Description Box */}
              <div>
                <div style={{
                  background: '#b91c1c',
                  color: '#ffffff',
                  fontWeight: '800',
                  padding: '4px 8px',
                  fontSize: '11.5px',
                  border: '1px solid #1f2937',
                  borderBottom: 'none'
                }}>
                  Quote/Product Description
                </div>
                <div style={{
                  border: '1px solid #1f2937',
                  padding: '6px 8px',
                  minHeight: '75px',
                  fontSize: '11px',
                  lineHeight: 1.35,
                  fontWeight: '600'
                }}>
                  {quote.projectDescription || quote.description || quote.notes || (items[0] && items[0].productName) || 'Digital Marketing Charges'}
                </div>
              </div>
            </div>

            {/* 3. Items Grid Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #1f2937', fontSize: '10.5px', marginBottom: '0px' }}>
              <thead>
                <tr style={{ background: '#b91c1c', color: '#ffffff', fontWeight: '800' }}>
                  <th style={{ border: '1px solid #1f2937', padding: '5px 4px', width: '6%', textAlign: 'center' }}>SL No.</th>
                  <th style={{ border: '1px solid #1f2937', padding: '5px 6px', width: '32%', textAlign: 'center' }}>Description</th>
                  <th style={{ border: '1px solid #1f2937', padding: '5px 4px', width: '11%', textAlign: 'center' }}>Unite price</th>
                  <th style={{ border: '1px solid #1f2937', padding: '5px 4px', width: '5%', textAlign: 'center' }}>Qty</th>
                  <th style={{ border: '1px solid #1f2937', padding: '5px 4px', width: '11%', textAlign: 'center' }}>Net Amount</th>
                  <th style={{ border: '1px solid #1f2937', padding: '5px 4px', width: '7%', textAlign: 'center' }}>CGST</th>
                  <th style={{ border: '1px solid #1f2937', padding: '5px 4px', width: '7%', textAlign: 'center' }}>SGST</th>
                  <th style={{ border: '1px solid #1f2937', padding: '5px 4px', width: '10%', textAlign: 'center' }}>Vat Amount</th>
                  <th style={{ border: '1px solid #1f2937', padding: '5px 4px', width: '11%', textAlign: 'center' }}>Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const qty = parseInt(item.qty, 10) || 1;
                  const unitPrice = parseFloat(item.unitPrice) || 0;
                  const netAmount = unitPrice * qty;
                  const taxRate = parseFloat(item.taxRate !== undefined ? item.taxRate : 18);
                  const halfTax = taxRate / 2;
                  const vatAmount = (netAmount * taxRate) / 100;
                  const totalAmount = netAmount + vatAmount;

                  return (
                    <tr key={idx}>
                      <td style={{ border: '1px solid #1f2937', padding: '5px 4px', textAlign: 'center' }}>{idx + 1}</td>
                      <td style={{ border: '1px solid #1f2937', padding: '5px 6px', textAlign: 'left', fontWeight: '600' }}>
                        {item.productName || item.description}
                      </td>
                      <td style={{ border: '1px solid #1f2937', padding: '5px 4px', textAlign: 'center' }}>
                        {unitPrice.toFixed(2)}
                      </td>
                      <td style={{ border: '1px solid #1f2937', padding: '5px 4px', textAlign: 'center' }}>{qty}</td>
                      <td style={{ border: '1px solid #1f2937', padding: '5px 4px', textAlign: 'center' }}>
                        {netAmount.toFixed(2)}
                      </td>
                      <td style={{ border: '1px solid #1f2937', padding: '5px 4px', textAlign: 'center' }}>{halfTax}%</td>
                      <td style={{ border: '1px solid #1f2937', padding: '5px 4px', textAlign: 'center' }}>{halfTax}%</td>
                      <td style={{ border: '1px solid #1f2937', padding: '5px 4px', textAlign: 'center' }}>
                        {vatAmount.toFixed(2)}
                      </td>
                      <td style={{ border: '1px solid #1f2937', padding: '5px 4px', textAlign: 'right', fontWeight: '700' }}>
                        {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}

                {/* Blank filler rows to replicate the authentic paper format of Reference SS 2 */}
                {[...Array(Math.max(1, 4 - items.length))].map((_, i) => (
                  <tr key={`fill-${i}`} style={{ height: '22px' }}>
                    <td style={{ border: '1px solid #1f2937', padding: '4px' }}>&nbsp;</td>
                    <td style={{ border: '1px solid #1f2937', padding: '4px' }}>&nbsp;</td>
                    <td style={{ border: '1px solid #1f2937', padding: '4px' }}>&nbsp;</td>
                    <td style={{ border: '1px solid #1f2937', padding: '4px' }}>&nbsp;</td>
                    <td style={{ border: '1px solid #1f2937', padding: '4px' }}>&nbsp;</td>
                    <td style={{ border: '1px solid #1f2937', padding: '4px' }}>&nbsp;</td>
                    <td style={{ border: '1px solid #1f2937', padding: '4px' }}>&nbsp;</td>
                    <td style={{ border: '1px solid #1f2937', padding: '4px' }}>&nbsp;</td>
                    <td style={{ border: '1px solid #1f2937', padding: '4px' }}>&nbsp;</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 4. Totals & Words Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'stretch', marginBottom: '14px' }}>
              {/* Left: Amount In words Red Banner */}
              <div style={{
                flex: 1,
                background: '#b91c1c',
                color: '#ffffff',
                fontWeight: '700',
                padding: '6px 10px',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                boxSizing: 'border-box',
                border: '1px solid #1f2937',
                borderRight: 'none',
                borderTop: 'none'
              }}>
                Amount In words :{numberToWords(grandTotal)}
              </div>

              {/* Right: Subtotal, Shipping, Total Box */}
              <div style={{ width: '220px', border: '1px solid #1f2937', borderTop: 'none' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '4px 8px', fontWeight: '700', borderRight: '1px solid #1f2937', width: '50%' }}>Subtotal</td>
                      <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: '700' }}>
                        Rs. {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr style={{ borderTop: '1px solid #1f2937' }}>
                      <td style={{ padding: '4px 8px', fontWeight: '700', borderRight: '1px solid #1f2937' }}>Shipping</td>
                      <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: '700' }}>Rs. 0</td>
                    </tr>
                    <tr style={{ borderTop: '1px solid #1f2937' }}>
                      <td style={{ padding: '4px 8px', fontWeight: '900', borderRight: '1px solid #1f2937', fontSize: '12px' }}>Total</td>
                      <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: '900', fontSize: '12px' }}>
                        Rs. {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 5. Terms & Conditions and Official Stamp/Signature Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', paddingTop: '4px' }}>
              {/* Left: Blue Underlined Terms & Conditions */}
              <div style={{ lineHeight: 1.5, maxWidth: '440px' }}>
                <div style={{ textDecoration: 'underline', color: '#0284c7', fontWeight: 'bold', fontSize: '11px', marginBottom: '6px' }}>
                  Terms & Conditions:
                </div>
                <table style={{ width: '100%', fontSize: '10.5px', borderCollapse: 'collapse', color: '#111827' }}>
                  <tbody>
                    <tr>
                      <td style={{ verticalAlign: 'top', fontWeight: '600', width: '65px', padding: '2px 0' }}>Invoice</td>
                      <td style={{ verticalAlign: 'top', width: '14px', padding: '2px 0' }}>:</td>
                      <td style={{ verticalAlign: 'top', padding: '2px 0' }}>Invoice will be submitted as per actuals.</td>
                    </tr>
                    <tr>
                      <td style={{ verticalAlign: 'top', fontWeight: '600', padding: '2px 0' }}>Prices</td>
                      <td style={{ verticalAlign: 'top', padding: '2px 0' }}>:</td>
                      <td style={{ verticalAlign: 'top', padding: '2px 0' }}>FOR India Only</td>
                    </tr>
                    <tr>
                      <td style={{ verticalAlign: 'top', fontWeight: '600', padding: '2px 0' }}>Validity</td>
                      <td style={{ verticalAlign: 'top', padding: '2px 0' }}>:</td>
                      <td style={{ verticalAlign: 'top', padding: '2px 0' }}>Quotation valid for 15 days only.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Right: Official Sanna Innovations Stamp & Signature */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', minWidth: '220px' }}>
                <img 
                  src="/sanna_signature_stamp.png" 
                  alt="For Sanna Innovations Authorised Signatory" 
                  style={{ width: '210px', maxWidth: '100%', objectFit: 'contain' }} 
                />
              </div>
            </div>

            {/* 6. Solid Red Footer Address Banner */}
            <div style={{
              background: '#b91c1c',
              color: '#ffffff',
              padding: '8px 12px',
              textAlign: 'center',
              fontSize: '11px',
              fontWeight: '700',
              lineHeight: 1.4,
              marginTop: '12px'
            }}>
              <div>#1230, 1st Main, M.C. Layout, Vijayanagar, Bangalore - 560040</div>
              <div>www.sannainnovations.com</div>
            </div>

          </div>
        ) : (
          /* Apex Modern Corporate Template (Alternative Layout) */
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
                {items.map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '10px 12px', fontWeight: '600' }}>{item.productName || item.description}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>{item.qty}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>{currencySymbol}{parseFloat(item.unitPrice || 0).toLocaleString()}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '700' }}>{currencySymbol}{(parseFloat(item.unitPrice || 0) * (parseInt(item.qty, 10) || 1)).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
              <div style={{ width: '240px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Subtotal:</span><span>{currencySymbol}{subtotal.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '1.1rem', borderTop: '2px solid #0f172a', paddingTop: '6px', color: '#059669' }}>
                  <span>Grand Total:</span><span>{currencySymbol}{grandTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Actions Bar (Hidden in print) */}
        <div 
          className="no-print" 
          style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: '12px', 
            marginTop: '24px', 
            paddingTop: '16px', 
            borderTop: '1px solid #e2e8f0' 
          }}
        >
          <button onClick={handlePrint} className="btn gradient-btn-primary" style={{ padding: '8px 20px', fontSize: '0.82rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Printer style={{ width: '15px', height: '15px' }} />
            <span>Print / Download PDF</span>
          </button>
          <button 
            onClick={onClose} 
            className="btn btn-secondary" 
            style={{ 
              padding: '8px 20px', 
              background: '#f8fafc', 
              color: '#334155', 
              border: '1px solid #cbd5e1', 
              fontSize: '0.82rem', 
              fontWeight: '700', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px' 
            }}
          >
            <X style={{ width: '16px', height: '16px' }} />
            <span>Close</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default QuotePreviewModal;
