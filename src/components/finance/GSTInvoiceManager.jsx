import React, { useState, useMemo, useEffect } from 'react';
import { useCRM } from '../../context/CRMContext';
import {
  FileText, Plus, Edit2, Trash2, X, Download, Check,
  Building2, Calendar, DollarSign, CheckCircle2, Clock,
  AlertCircle, Search, Filter, Printer, Hash, Landmark,
  Layers, ChevronDown, ChevronUp, Sparkles, Copy, Eye,
  Banknote, RefreshCw, Receipt, Zap
} from 'lucide-react';
import { exportToCSV } from '../../utils/csvExporter';
import { getNextBillNumber } from '../../utils/billSequenceUtils';

import { isSannaCRM, SANNA_SELLER_INFO, SANNA_BANK_DETAILS, ASTRA_CLEAN_SELLER_INFO, ASTRA_CLEAN_BANK_DETAILS } from '../../utils/appMode';

const GST_RATES = [0, 5, 12, 18, 28];
const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh','Chandigarh',
  'Dadra & Nagar Haveli','Daman & Diu','Lakshadweep','Puducherry'
];

export const DEFAULT_SELLER_INFO = isSannaCRM() ? SANNA_SELLER_INFO : ASTRA_CLEAN_SELLER_INFO;
export const DEFAULT_BANK_DETAILS = isSannaCRM() ? SANNA_BANK_DETAILS : ASTRA_CLEAN_BANK_DETAILS;

export const CLIENT_PRESETS = [
  {
    clientName: 'Sahara Transformers Pvt Ltd',
    billingAddress: '60/2 Seegehalli Gate Magadi Main Road, Bangalore - 560091',
    clientState: 'Karnataka',
    clientGSTIN: '29BNJPS7776J1ZW',
    reverseCharge: 'N'
  },
  {
    clientName: 'Chaitanya Electric Company',
    billingAddress: 'Sy.No.60/2, Magadi Main Rd, Seegehalli, Bengaluru, Karnataka 560112',
    clientState: 'Karnataka',
    clientGSTIN: '29BKUPS2041A1Z2',
    reverseCharge: 'N'
  },
  {
    clientName: 'Astra Corporate Group',
    billingAddress: '42 MG Road, Prestige Towers, Level 8, Bangalore - 560001',
    clientState: 'Karnataka',
    clientGSTIN: '29AABCA1234F1Z8',
    reverseCharge: 'N'
  },
  {
    clientName: 'Sri Raghavendra Granites & Tiles',
    billingAddress: 'Plot 18, Industrial Estate, Peenya 2nd Stage, Bengaluru, Karnataka 560058',
    clientState: 'Karnataka',
    clientGSTIN: '29AAECS5544B1ZV',
    reverseCharge: 'N'
  },
  {
    clientName: 'Nexus Retail Solutions',
    billingAddress: 'Shop 14, Brigade Road, Bangalore - 560025',
    clientState: 'Karnataka',
    clientGSTIN: '',
    reverseCharge: 'N'
  },
  {
    clientName: 'Jalmahal Resorts & Hotels',
    billingAddress: 'Mysore Road, Near Wonderla Gate, Bangalore - 562109',
    clientState: 'Karnataka',
    clientGSTIN: '29AAACJ1234K1Z5',
    reverseCharge: 'N'
  },
  {
    clientName: 'Matha Clinic & Diagnostics',
    billingAddress: '15th Cross, 3rd Block, Rajajinagar, Bangalore - 560010',
    clientState: 'Karnataka',
    clientGSTIN: '29AAACM5678L1Z9',
    reverseCharge: 'N'
  },
  {
    clientName: 'Karnataka Labour Welfare Board (KLWB)',
    billingAddress: 'Karmika Bhavana, Bannerghatta Road, Bangalore - 560029',
    clientState: 'Karnataka',
    clientGSTIN: '29BLWB0001G1Z1',
    reverseCharge: 'N'
  }
];

export const SERVICE_QUICK_PRESETS = [
  { description: 'Website Hosting charges for 1 year', hsnSac: '998315', unitPrice: 6500, gstPercent: 18 },
  { description: 'Domain Renewal Charges', hsnSac: '998314', unitPrice: 1999, gstPercent: 18 },
  { description: 'Monthly Social Media Marketing Retainer (12 Reels + 20 Posts)', hsnSac: '998313', unitPrice: 25000, gstPercent: 18 },
  { description: 'Performance Ads Management (Meta & Google PPC)', hsnSac: '998311', unitPrice: 15000, gstPercent: 18 },
  { description: 'Search Engine Optimization (SEO & Technical Audit)', hsnSac: '998314', unitPrice: 18000, gstPercent: 18 },
  { description: 'Custom Web Application Development (Milestone Phase)', hsnSac: '998315', unitPrice: 60000, gstPercent: 18 },
  { description: 'Corporate Video Production & Motion Graphics Reels', hsnSac: '998316', unitPrice: 2500, gstPercent: 18 },
  { description: 'Brand Identity, Logo Vector Suite & Print Collateral', hsnSac: '998314', unitPrice: 15000, gstPercent: 0 }
];

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

const EMPTY_LINE_ITEM = { description: '', hsnSac: '998315', unitPrice: 0, qty: 1, gstPercent: 18 };

const calcItem = (item) => {
  const base = parseFloat(item.unitPrice || 0) * parseFloat(item.qty || 1);
  const gstAmt = base * (parseFloat(item.gstPercent !== undefined ? item.gstPercent : 18) / 100);
  return { ...item, base: base.toFixed(2), gstAmt: gstAmt.toFixed(2), total: (base + gstAmt).toFixed(2) };
};

const GSTInvoiceManager = () => {
  const { gstInvoices = [], addGSTInvoice, updateGSTInvoice, deleteGSTInvoice, employees = [] } = useCRM();

  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'TAX_INVOICE' | 'CASH_BILL' | 'PAID' | 'PENDING'
  const [searchQ, setSearchQ] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState('red-classic'); // 'red-classic' | 'modern-indigo' | 'clean-mono'
  const [showBankCustomizer, setShowBankCustomizer] = useState(false);

  // Handle Escape key to close preview modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && previewInvoice) {
        setPreviewInvoice(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewInvoice]);

  const today = new Date().toISOString().split('T')[0];
  const nowYear = new Date().getFullYear();
  const nowMonth = new Date().getMonth() + 1;

  const createInitialFormState = (type = 'Tax Invoice') => {
    const autoNumber = getNextBillNumber(gstInvoices, type, today);
    return {
      clientName: '',
      invoiceNumber: autoNumber,
      invoiceDate: today,
      invoiceType: type,
      billingAddress: '',
      clientState: 'Karnataka',
      clientGSTIN: '',
      reverseCharge: 'N',
      shippingCharge: 0,
      billingMonth: nowMonth,
      billingYear: nowYear,
      paymentStatus: type === 'Cash Bill' ? 'Paid' : 'Pending',
      paymentMode: type === 'Cash Bill' ? 'Cash' : 'Bank Transfer',
      template: 'red-classic',
      remarks: type === 'Cash Bill' ? 'Payment received in full via Cash with thanks.' : '',
      sellerInfo: { ...DEFAULT_SELLER_INFO },
      bankDetails: { ...DEFAULT_BANK_DETAILS },
      lineItems: [{ ...EMPTY_LINE_ITEM, gstPercent: type === 'Cash Bill' ? 0 : 18 }]
    };
  };

  const [form, setForm] = useState(() => createInitialFormState('Tax Invoice'));

  // Open Add Tax Invoice Modal with Auto-Generated Sequence
  const openAddTaxInvoice = () => {
    setEditingInvoice(null);
    setForm(createInitialFormState('Tax Invoice'));
    setShowBankCustomizer(false);
    setShowModal(true);
  };

  // Open Add Cash Bill Modal with Auto-Generated Sequence
  const openAddCashBill = () => {
    setEditingInvoice(null);
    setForm(createInitialFormState('Cash Bill'));
    setShowBankCustomizer(false);
    setShowModal(true);
  };

  const openEdit = (inv) => {
    setEditingInvoice(inv);
    setForm({
      ...inv,
      sellerInfo: inv.sellerInfo || { ...DEFAULT_SELLER_INFO },
      bankDetails: inv.bankDetails || { ...DEFAULT_BANK_DETAILS },
      template: inv.template || 'red-classic',
      lineItems: inv.lineItems ? [...inv.lineItems] : [{ ...EMPTY_LINE_ITEM }]
    });
    setShowBankCustomizer(false);
    setShowModal(true);
  };

  // Handle Switching between Tax Invoice and Cash Bill within Form
  const handleTypeChange = (newType) => {
    const autoNumber = getNextBillNumber(gstInvoices, newType, form.invoiceDate);
    setForm(f => ({
      ...f,
      invoiceType: newType,
      invoiceNumber: autoNumber,
      paymentStatus: newType === 'Cash Bill' ? 'Paid' : f.paymentStatus,
      paymentMode: newType === 'Cash Bill' ? 'Cash' : (f.paymentMode === 'Cash' ? 'Bank Transfer' : f.paymentMode),
      lineItems: f.lineItems.map(item => ({
        ...item,
        gstPercent: newType === 'Cash Bill' ? 0 : (item.gstPercent === 0 ? 18 : item.gstPercent)
      }))
    }));
  };

  // Refresh / Recalculate Next Sequential Bill Number
  const handleRegenerateNumber = () => {
    const autoNumber = getNextBillNumber(gstInvoices, form.invoiceType, form.invoiceDate);
    setForm(f => ({ ...f, invoiceNumber: autoNumber }));
  };

  const handleApplyClientPreset = (preset) => {
    setForm(f => ({
      ...f,
      clientName: preset.clientName,
      billingAddress: preset.billingAddress,
      clientState: preset.clientState,
      clientGSTIN: preset.clientGSTIN || '',
      reverseCharge: preset.reverseCharge || 'N'
    }));
  };

  const handleAddServicePreset = (preset) => {
    setForm(f => ({
      ...f,
      lineItems: [...f.lineItems, { ...preset, qty: 1, gstPercent: f.invoiceType === 'Cash Bill' ? 0 : preset.gstPercent }]
    }));
  };

  const addLineItem = () => setForm(f => ({ ...f, lineItems: [...f.lineItems, { ...EMPTY_LINE_ITEM, gstPercent: f.invoiceType === 'Cash Bill' ? 0 : 18 }] }));
  const removeLineItem = (i) => setForm(f => ({ ...f, lineItems: f.lineItems.filter((_, idx) => idx !== i) }));
  const updateLineItem = (i, field, val) => setForm(f => {
    const items = f.lineItems.map((item, idx) => idx === i ? { ...item, [field]: val } : item);
    return { ...f, lineItems: items };
  });

  const calcTotals = (items) => {
    const calculated = items.map(calcItem);
    const subtotal = calculated.reduce((s, i) => s + parseFloat(i.base), 0);
    const totalGST = calculated.reduce((s, i) => s + parseFloat(i.gstAmt), 0);
    const shipping = parseFloat(form.shippingCharge || 0);
    const grandTotal = subtotal + totalGST + shipping;
    return { calculated, subtotal, totalGST, grandTotal };
  };

  const { calculated, subtotal, totalGST, grandTotal } = calcTotals(form.lineItems || []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      subtotal: subtotal.toFixed(2),
      totalGST: totalGST.toFixed(2),
      grandTotal: grandTotal.toFixed(2),
      lineItems: calculated
    };
    if (editingInvoice) {
      updateGSTInvoice(editingInvoice.id, payload);
    } else {
      addGSTInvoice(payload);
    }
    setShowModal(false);
  };

  const filtered = useMemo(() => {
    return gstInvoices.filter(inv => {
      let matchFilter = true;
      if (activeFilter === 'TAX_INVOICE') matchFilter = inv.invoiceType === 'Tax Invoice';
      else if (activeFilter === 'CASH_BILL') matchFilter = inv.invoiceType === 'Cash Bill';
      else if (activeFilter === 'PAID') matchFilter = inv.paymentStatus === 'Paid';
      else if (activeFilter === 'PENDING') matchFilter = inv.paymentStatus === 'Pending';

      const q = searchQ.toLowerCase();
      const matchSearch = !q || 
        (inv.clientName || '').toLowerCase().includes(q) || 
        (inv.invoiceNumber || '').toLowerCase().includes(q) ||
        (inv.paymentMode || '').toLowerCase().includes(q);

      return matchFilter && matchSearch;
    });
  }, [gstInvoices, activeFilter, searchQ]);

  const totalPaid = gstInvoices.filter(i => i.paymentStatus === 'Paid').reduce((s, i) => s + parseFloat(i.grandTotal || 0), 0);
  const totalPending = gstInvoices.filter(i => i.paymentStatus === 'Pending').reduce((s, i) => s + parseFloat(i.grandTotal || 0), 0);
  const totalTaxInvoices = gstInvoices.filter(i => i.invoiceType === 'Tax Invoice').length;
  const totalCashBills = gstInvoices.filter(i => i.invoiceType === 'Cash Bill').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: '#818cf8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles style={{ width: '14px', height: '14px' }} /> Enterprise Billing & Cash Receipt Engine
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '900', margin: '4px 0', letterSpacing: '-0.5px' }}>
            GST Invoices & Cash Bills ({gstInvoices.length})
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Auto-sequential bill numbering, instant Cash Bill receipts, multi-tax GST breakdowns, Kotak Mahindra banking details & official stamp printouts.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={openAddCashBill}
            className="btn"
            style={{
              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              color: '#ffffff',
              padding: '10px 18px',
              borderRadius: '10px',
              fontWeight: '700',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Banknote style={{ width: '18px', height: '18px' }} />
            <span>+ Generate Cash Bill</span>
          </button>

          <button
            onClick={openAddTaxInvoice}
            className="btn gradient-btn-primary"
            style={{ padding: '10px 18px', borderRadius: '10px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus style={{ width: '18px', height: '18px' }} />
            <span>+ New Tax Invoice</span>
          </button>
        </div>
      </div>

      {/* Financial Metrics Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {[
          { label: 'Total Tax Invoices', value: totalTaxInvoices, color: '#818cf8', sub: 'GST compliant invoices', icon: Landmark },
          { label: 'Total Cash Bills', value: totalCashBills, color: '#10b981', sub: 'Cash receipts settled', icon: Banknote },
          { label: 'Total Paid Inward', value: `₹${totalPaid.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, color: '#34d399', sub: 'Cleared in bank & cash', icon: CheckCircle2 },
          { label: 'Pending Receivables', value: `₹${totalPending.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, color: '#f59e0b', sub: 'Outstanding invoices', icon: Clock }
        ].map((m, idx) => (
          <div key={idx} className="glass-panel" style={{ padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>{m.label}</div>
              <div style={{ fontSize: '1.45rem', fontWeight: '800', color: m.color, marginTop: '2px' }}>{m.value}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{m.sub}</div>
            </div>
            <div style={{ padding: '10px', borderRadius: '12px', background: `${m.color}15`, color: m.color }}>
              <m.icon style={{ width: '22px', height: '22px' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { key: 'ALL', label: `All Bills (${gstInvoices.length})` },
            { key: 'TAX_INVOICE', label: `Tax Invoices (${totalTaxInvoices})` },
            { key: 'CASH_BILL', label: `Cash Bills (${totalCashBills})` },
            { key: 'PAID', label: 'Paid' },
            { key: 'PENDING', label: 'Pending' }
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.8rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: activeFilter === f.key ? '#6366f1' : 'rgba(255, 255, 255, 0.05)',
                color: activeFilter === f.key ? '#ffffff' : 'var(--text-secondary)'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '260px' }}>
            <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '15px', height: '15px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search bill no, client, mode..."
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              className="custom-input"
              style={{ paddingLeft: '32px', paddingRight: '12px', fontSize: '0.82rem', height: '36px' }}
            />
          </div>

          <button
            onClick={() => exportToCSV(gstInvoices.map(i => ({
              'Invoice No': i.invoiceNumber,
              'Type': i.invoiceType,
              'Date': i.invoiceDate,
              'Client Name': i.clientName,
              'Client GSTIN': i.clientGSTIN,
              'Subtotal': i.subtotal,
              'Tax Amount': i.totalGST,
              'Grand Total': i.grandTotal,
              'Payment Mode': i.paymentMode || 'Bank Transfer',
              'Payment Status': i.paymentStatus
            })), 'Sanna_All_Bills_Export')}
            className="btn btn-secondary"
            style={{ padding: '8px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Download style={{ width: '14px', height: '14px' }} /> Export CSV
          </button>
        </div>
      </div>

      {/* Invoices & Bills Table */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '170px' }}>Bill / Invoice No</th>
                <th style={{ width: '120px' }}>Type</th>
                <th>Client Details</th>
                <th style={{ width: '110px' }}>Date</th>
                <th style={{ width: '130px', textAlign: 'right' }}>Subtotal</th>
                <th style={{ width: '110px', textAlign: 'right' }}>GST</th>
                <th style={{ width: '130px', textAlign: 'right' }}>Grand Total</th>
                <th style={{ width: '110px' }}>Mode</th>
                <th style={{ width: '100px' }}>Status</th>
                <th style={{ width: '140px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No bills or invoices match the current search / filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map(inv => {
                  const isCash = inv.invoiceType === 'Cash Bill';
                  return (
                    <tr key={inv.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <code style={{ fontSize: '0.85rem', fontWeight: '800', color: isCash ? '#10b981' : '#60a5fa' }}>
                            {inv.invoiceNumber}
                          </code>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Seq ID: {inv.id}</div>
                      </td>
                      <td>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: '800',
                          background: isCash ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                          color: isCash ? '#34d399' : '#818cf8',
                          border: `1px solid ${isCash ? 'rgba(16, 185, 129, 0.3)' : 'rgba(99, 102, 241, 0.3)'}`
                        }}>
                          {isCash ? '💵 Cash Bill' : '🏛️ Tax Invoice'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{inv.clientName}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {inv.clientGSTIN ? `GSTIN: ${inv.clientGSTIN}` : (inv.billingAddress || 'No GSTIN (Cash)')}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.82rem', fontWeight: '600' }}>{inv.invoiceDate}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>M-{inv.billingMonth}/{inv.billingYear}</div>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: '600' }}>
                        ₹{parseFloat(inv.subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: '600', color: isCash ? 'var(--text-muted)' : '#a78bfa' }}>
                        {isCash ? '₹0.00' : `₹${parseFloat(inv.totalGST || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: '800', fontSize: '0.92rem', color: isCash ? '#34d399' : '#ffffff' }}>
                        ₹{parseFloat(inv.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
                          {inv.paymentMode || (isCash ? 'Cash' : 'Bank Transfer')}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: '800',
                          background: inv.paymentStatus === 'Paid' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: inv.paymentStatus === 'Paid' ? '#34d399' : '#fbbf24',
                          border: `1px solid ${inv.paymentStatus === 'Paid' ? 'rgba(52, 211, 153, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                        }}>
                          {inv.paymentStatus}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            onClick={() => { setPreviewInvoice(inv); setPreviewTemplate(inv.template || 'red-classic'); }}
                            className="btn btn-secondary"
                            title="Preview / Print"
                            style={{ padding: '6px', borderRadius: '6px', color: '#60a5fa' }}
                          >
                            <Eye style={{ width: '14px', height: '14px' }} />
                          </button>
                          <button
                            onClick={() => openEdit(inv)}
                            className="btn btn-secondary"
                            title="Edit"
                            style={{ padding: '6px', borderRadius: '6px', color: '#fbbf24' }}
                          >
                            <Edit2 style={{ width: '14px', height: '14px' }} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete ${inv.invoiceType} ${inv.invoiceNumber}?`)) {
                                deleteGSTInvoice(inv.id);
                              }
                            }}
                            className="btn btn-secondary"
                            title="Delete"
                            style={{ padding: '6px', borderRadius: '6px', color: '#f43f5e' }}
                          >
                            <Trash2 style={{ width: '14px', height: '14px' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Bill Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            width: '950px',
            maxWidth: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            borderRadius: '16px',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowModal(false)}
              style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X style={{ width: '22px', height: '22px' }} />
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '800', margin: 0 }}>
                  {editingInvoice ? 'Edit Document' : (form.invoiceType === 'Cash Bill' ? 'Generate New Cash Bill' : 'Create GST Tax Invoice')}
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Auto-increments bill number based on Sanna sequence rules.
                </div>
              </div>

              {/* Mode Toggle inside Form */}
              <div style={{ display: 'flex', gap: '6px', background: 'rgba(255, 255, 255, 0.06)', padding: '4px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <button
                  type="button"
                  onClick={() => handleTypeChange('Tax Invoice')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '0.78rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                    background: form.invoiceType === 'Tax Invoice' ? '#6366f1' : 'transparent',
                    color: form.invoiceType === 'Tax Invoice' ? '#ffffff' : 'var(--text-secondary)'
                  }}
                >
                  🏛️ Tax Invoice
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('Cash Bill')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '0.78rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                    background: form.invoiceType === 'Cash Bill' ? '#059669' : 'transparent',
                    color: form.invoiceType === 'Cash Bill' ? '#ffffff' : 'var(--text-secondary)'
                  }}
                >
                  💵 Cash Bill
                </button>
              </div>
            </div>

            {/* Client Presets Shortcut */}
            <div style={{ marginBottom: '20px', background: 'rgba(255, 255, 255, 0.03)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Zap style={{ width: '13px', height: '13px', color: '#818cf8' }} />
                <span>Quick Load Client Details:</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {CLIENT_PRESETS.map((cp, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyClientPreset(cp)}
                    className="btn btn-secondary"
                    style={{ padding: '4px 10px', fontSize: '0.74rem', borderRadius: '6px' }}
                  >
                    + {cp.clientName}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Row 1: Bill Number, Type, Date, Payment Mode, Status */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: '700' }}>Bill / Invoice No *</label>
                    <button
                      type="button"
                      onClick={handleRegenerateNumber}
                      title="Recalculate next sequence"
                      style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}
                    >
                      <RefreshCw style={{ width: '11px', height: '11px' }} /> Auto Seq
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={form.invoiceNumber}
                    onChange={e => setForm({ ...form, invoiceNumber: e.target.value })}
                    className="custom-input"
                    style={{ fontWeight: '800', color: form.invoiceType === 'Cash Bill' ? '#34d399' : '#818cf8' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: '700', marginBottom: '4px', display: 'block' }}>Date *</label>
                  <input
                    type="date"
                    required
                    value={form.invoiceDate}
                    onChange={e => setForm({ ...form, invoiceDate: e.target.value })}
                    className="custom-input"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: '700', marginBottom: '4px', display: 'block' }}>Payment Mode</label>
                  <select
                    value={form.paymentMode || (form.invoiceType === 'Cash Bill' ? 'Cash' : 'Bank Transfer')}
                    onChange={e => setForm({ ...form, paymentMode: e.target.value })}
                    className="custom-input"
                  >
                    <option value="Cash">Cash (Immediate Settlement)</option>
                    <option value="Bank Transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
                    <option value="UPI / QR Code">UPI / Instant QR Payment</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: '700', marginBottom: '4px', display: 'block' }}>Payment Status</label>
                  <select
                    value={form.paymentStatus}
                    onChange={e => setForm({ ...form, paymentStatus: e.target.value })}
                    className="custom-input"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Partially Paid">Partially Paid</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Customer Name, Address, State, GSTIN */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: '700', marginBottom: '4px', display: 'block' }}>Customer / Client Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sahara Transformers Pvt Ltd"
                    value={form.clientName}
                    onChange={e => setForm({ ...form, clientName: e.target.value })}
                    className="custom-input"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: '700', marginBottom: '4px', display: 'block' }}>State</label>
                  <select
                    value={form.clientState}
                    onChange={e => setForm({ ...form, clientState: e.target.value })}
                    className="custom-input"
                  >
                    {INDIAN_STATES.map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: '700', marginBottom: '4px', display: 'block' }}>
                    {form.invoiceType === 'Cash Bill' ? 'GSTIN (Optional for Cash)' : 'Client GSTIN'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 29BNJPS7776J1ZW"
                    value={form.clientGSTIN}
                    onChange={e => setForm({ ...form, clientGSTIN: e.target.value })}
                    className="custom-input"
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', marginBottom: '4px', display: 'block' }}>Customer Billing Address</label>
                <textarea
                  rows="2"
                  placeholder="Enter full street, area, and pincode..."
                  value={form.billingAddress}
                  onChange={e => setForm({ ...form, billingAddress: e.target.value })}
                  className="custom-input"
                />
              </div>

              {/* Service Quick Presets */}
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ fontSize: '0.74rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Zap style={{ width: '13px', height: '13px', color: '#818cf8' }} />
                  <span>Quick Add Service Item:</span>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {SERVICE_QUICK_PRESETS.map((sp, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAddServicePreset(sp)}
                      className="btn btn-secondary"
                      style={{ padding: '4px 8px', fontSize: '0.72rem', borderRadius: '6px' }}
                    >
                      + {sp.description.split('(')[0].trim()} (₹{sp.unitPrice.toLocaleString('en-IN')})
                    </button>
                  ))}
                </div>
              </div>

              {/* Line Items Table */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '800' }}>Line Items & Deliverables</label>
                  <button
                    type="button"
                    onClick={addLineItem}
                    className="btn btn-secondary"
                    style={{ padding: '5px 12px', fontSize: '0.75rem', color: '#60a5fa' }}
                  >
                    + Add Another Item
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {form.lineItems.map((item, idx) => (
                    <div key={idx} style={{
                      display: 'grid',
                      gridTemplateColumns: '2.5fr 1fr 1.2fr 0.8fr 1fr 40px',
                      gap: '8px',
                      alignItems: 'center',
                      background: 'rgba(255, 255, 255, 0.03)',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.06)'
                    }}>
                      <input
                        type="text"
                        placeholder="Item Description"
                        required
                        value={item.description}
                        onChange={e => updateLineItem(idx, 'description', e.target.value)}
                        className="custom-input"
                        style={{ fontSize: '0.82rem' }}
                      />
                      <input
                        type="text"
                        placeholder="HSN/SAC"
                        value={item.hsnSac}
                        onChange={e => updateLineItem(idx, 'hsnSac', e.target.value)}
                        className="custom-input"
                        style={{ fontSize: '0.82rem' }}
                      />
                      <input
                        type="number"
                        placeholder="Unit Price (₹)"
                        required
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={e => updateLineItem(idx, 'unitPrice', e.target.value)}
                        className="custom-input"
                        style={{ fontSize: '0.82rem', textAlign: 'right' }}
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        required
                        min="1"
                        value={item.qty}
                        onChange={e => updateLineItem(idx, 'qty', e.target.value)}
                        className="custom-input"
                        style={{ fontSize: '0.82rem', textAlign: 'center' }}
                      />
                      <select
                        value={item.gstPercent !== undefined ? item.gstPercent : (form.invoiceType === 'Cash Bill' ? 0 : 18)}
                        onChange={e => updateLineItem(idx, 'gstPercent', parseFloat(e.target.value))}
                        className="custom-input"
                        style={{ fontSize: '0.82rem' }}
                      >
                        {GST_RATES.map(r => <option key={r} value={r}>{r}% GST</option>)}
                      </select>
                      <button
                        type="button"
                        onClick={() => removeLineItem(idx)}
                        disabled={form.lineItems.length === 1}
                        style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', opacity: form.lineItems.length === 1 ? 0.3 : 1 }}
                      >
                        <Trash2 style={{ width: '16px', height: '16px' }} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Summary Footer Box */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.04)',
                padding: '16px 20px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px'
              }}>
                <div style={{ flex: 1, minWidth: '240px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Amount in Words:</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#818cf8', marginTop: '2px' }}>
                    {numberToWords(grandTotal)}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '20px', textAlign: 'right' }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Subtotal</div>
                    <div style={{ fontSize: '1rem', fontWeight: '700' }}>₹{subtotal.toFixed(2)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Total GST</div>
                    <div style={{ fontSize: '1rem', fontWeight: '700', color: form.invoiceType === 'Cash Bill' ? 'var(--text-muted)' : '#a78bfa' }}>
                      ₹{totalGST.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Grand Total</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '900', color: form.invoiceType === 'Cash Bill' ? '#34d399' : '#ffffff' }}>
                      ₹{grandTotal.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                  style={{ padding: '10px 20px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn gradient-btn-primary"
                  style={{
                    padding: '10px 24px',
                    fontWeight: '800',
                    background: form.invoiceType === 'Cash Bill' ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' : undefined
                  }}
                >
                  {editingInvoice ? 'Save Changes' : (form.invoiceType === 'Cash Bill' ? 'Issue Cash Bill' : 'Issue Tax Invoice')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Exact Reference Tax Invoice & Cash Bill Output Document Preview */}
      {previewInvoice && (() => {
        const isCashBill = previewInvoice.invoiceType === 'Cash Bill';
        const isRedClassic = previewTemplate === 'red-classic';
        const isModernIndigo = previewTemplate === 'modern-indigo';
        const isCleanMono = previewTemplate === 'clean-mono';

        let themePrimary = '#b91c1c'; // Default Red Classic (#b91c1c)
        let themeStateColor = '#2563eb';
        if (isModernIndigo) {
          themePrimary = '#1e3a8a';
          themeStateColor = '#2563eb';
        } else if (isCleanMono) {
          themePrimary = '#18181b';
          themeStateColor = '#000000';
        }

        const seller = previewInvoice.sellerInfo || DEFAULT_SELLER_INFO;
        const bank = previewInvoice.bankDetails || DEFAULT_BANK_DETAILS;
        const subtotal = parseFloat(previewInvoice.subtotal || 0);
        const totalGST = parseFloat(previewInvoice.totalGST || 0);
        const shipping = parseFloat(previewInvoice.shippingCharge || 0);
        const grandTotal = parseFloat(previewInvoice.grandTotal || 0);
        const cgstAmt = totalGST / 2;
        const sgstAmt = totalGST / 2;
        const isTax = totalGST > 0;

        return (
          <div 
            className="modal-overlay"
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
            onClick={() => setPreviewInvoice(null)}
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
              onClick={() => setPreviewInvoice(null)}
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
                    {isCashBill ? 'OFFICIAL CASH BILL PREVIEW' : 'OFFICIAL TAX INVOICE PREVIEW'}
                  </span>
                  <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: '#fef2f2', color: '#b91c1c', fontWeight: '700', border: '1px solid #fecaca' }}>
                    {previewInvoice.invoiceNumber}
                  </span>
                  
                  {/* Template Switcher Buttons */}
                  <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '3px', borderRadius: '6px' }}>
                    <button
                      onClick={() => setPreviewTemplate('red-classic')}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '5px',
                        border: 'none',
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        background: isRedClassic ? '#b91c1c' : 'transparent',
                        color: isRedClassic ? '#ffffff' : '#475569'
                      }}
                    >
                      Red Classic (Official MIS)
                    </button>
                    <button
                      onClick={() => setPreviewTemplate('modern-indigo')}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '5px',
                        border: 'none',
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        background: isModernIndigo ? '#1e3a8a' : 'transparent',
                        color: isModernIndigo ? '#ffffff' : '#475569'
                      }}
                    >
                      Modern Indigo
                    </button>
                    <button
                      onClick={() => setPreviewTemplate('clean-mono')}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '5px',
                        border: 'none',
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        background: isCleanMono ? '#18181b' : 'transparent',
                        color: isCleanMono ? '#ffffff' : '#475569'
                      }}
                    >
                      Minimalist
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button onClick={() => window.print()} className="btn gradient-btn-primary" style={{ padding: '7px 16px', fontSize: '0.82rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Printer style={{ width: '15px', height: '15px' }} />
                    <span>Print / Download PDF</span>
                  </button>
                  <button 
                    onClick={() => setPreviewInvoice(null)} 
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

              {/* Exact Reference Tax Invoice / Cash Bill Output Document (Matches User Reference SS 3) */}
              <div id="printable-tax-invoice" style={{
                width: '100%',
                background: '#ffffff',
                color: '#111827',
                fontFamily: 'Arial, Helvetica, sans-serif',
                fontSize: '11px',
                lineHeight: 1.3,
                boxSizing: 'border-box'
              }}>
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

                  {/* Right: Invoice / Cash Bill Type Header Box & Key-Value Metadata */}
                  <div style={{ width: '310px', border: '1px solid #1f2937' }}>
                    <div style={{
                      background: themePrimary,
                      color: '#ffffff',
                      fontWeight: '900',
                      textAlign: 'center',
                      padding: '7px',
                      fontSize: '15px',
                      letterSpacing: '0.5px'
                    }}>
                      {isCashBill ? 'CASH BILL / RECEIPT' : (previewInvoice.invoiceType || 'Tax Invoice')}
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                      <tbody>
                        <tr style={{ borderTop: '1px solid #1f2937' }}>
                          <td style={{ padding: '4px 8px', fontWeight: '700', borderRight: '1px solid #1f2937', width: '42%' }}>
                            {isCashBill ? 'Bill Date' : 'Invoice Date'}
                          </td>
                          <td style={{ padding: '4px 8px', fontWeight: '600' }}>{formatInvoiceDate(previewInvoice.invoiceDate)}</td>
                        </tr>
                        <tr style={{ borderTop: '1px solid #1f2937' }}>
                          <td style={{ padding: '4px 8px', fontWeight: '700', borderRight: '1px solid #1f2937' }}>
                            {isCashBill ? 'Bill / Receipt No' : 'Invoice No'}
                          </td>
                          <td style={{ padding: '4px 8px', fontWeight: '700' }}>
                            {previewInvoice.invoiceNumber}
                          </td>
                        </tr>
                        <tr style={{ borderTop: '1px solid #1f2937' }}>
                          <td style={{ padding: '4px 8px', fontWeight: '700', borderRight: '1px solid #1f2937' }}>GSTIN/PAN</td>
                          <td style={{ padding: '4px 8px', fontWeight: '600', fontSize: '10px' }}>
                            {seller.gstin} / {seller.pan}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 2. Customer Section */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{
                    background: themePrimary,
                    color: '#ffffff',
                    fontWeight: '800',
                    padding: '4px 8px',
                    fontSize: '11.5px',
                    border: '1px solid #1f2937',
                    borderBottom: 'none'
                  }}>
                    {isCashBill ? 'Received With Thanks From:' : 'Customer:'}
                  </div>
                  <div style={{ border: '1px solid #1f2937' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                      <tbody>
                        <tr>
                          <td style={{ padding: '4px 8px', fontWeight: '700', borderRight: '1px solid #1f2937', width: '140px' }}>Name:</td>
                          <td style={{ padding: '4px 8px', fontWeight: '700' }}>{previewInvoice.clientName || 'Customer'}</td>
                        </tr>
                        <tr style={{ borderTop: '1px solid #1f2937' }}>
                          <td style={{ padding: '4px 8px', fontWeight: '700', borderRight: '1px solid #1f2937' }}>Address:</td>
                          <td style={{ padding: '4px 8px', whiteSpace: 'pre-wrap' }}>{previewInvoice.billingAddress || 'N/A'}</td>
                        </tr>
                        <tr style={{ borderTop: '1px solid #1f2937' }}>
                          <td style={{ padding: '4px 8px', fontWeight: '700', borderRight: '1px solid #1f2937' }}>State :</td>
                          <td style={{ padding: '4px 8px', color: themeStateColor, fontWeight: '700' }}>{previewInvoice.clientState || 'Karnataka'}</td>
                        </tr>
                        <tr style={{ borderTop: '1px solid #1f2937' }}>
                          <td style={{ padding: '4px 8px', fontWeight: '700', borderRight: '1px solid #1f2937' }}>Payment Mode:</td>
                          <td style={{ padding: '4px 8px', fontWeight: '800', color: '#1e3a8a' }}>
                            {previewInvoice.paymentMode || (isCashBill ? 'CASH SETTLEMENT (FULL PAYMENT RECEIVED)' : 'Bank Transfer')}
                          </td>
                        </tr>
                        {!isCashBill && (
                          <>
                            <tr style={{ borderTop: '1px solid #1f2937' }}>
                              <td style={{ padding: '4px 8px', fontWeight: '700', borderRight: '1px solid #1f2937' }}>GSTIN:</td>
                              <td style={{ padding: '4px 8px', fontWeight: '700' }}>{previewInvoice.clientGSTIN || 'N/A'}</td>
                            </tr>
                            <tr style={{ borderTop: '1px solid #1f2937' }}>
                              <td style={{ padding: '4px 8px', fontWeight: '700', borderRight: '1px solid #1f2937' }}>Reverse Charge (Y/N):</td>
                              <td style={{ padding: '4px 8px', fontWeight: '700', textAlign: 'right', paddingRight: '20px' }}>
                                {previewInvoice.reverseCharge === 'Yes' || previewInvoice.reverseCharge === 'Y' ? 'Y' : 'N'}
                              </td>
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 3. Line Items Table (12 Columns with Crisp Borders) */}
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #1f2937', fontSize: '10.5px', marginBottom: '0px' }}>
                  <thead>
                    <tr style={{ background: themePrimary, color: '#ffffff', fontWeight: '800' }}>
                      <th rowSpan={isTax ? "2" : "1"} style={{ border: '1px solid #1f2937', padding: '5px 4px', width: '5%', textAlign: 'center' }}>SL No.</th>
                      <th rowSpan={isTax ? "2" : "1"} style={{ border: '1px solid #1f2937', padding: '5px 6px', width: isTax ? '27%' : '45%', textAlign: 'center' }}>Description</th>
                      <th rowSpan={isTax ? "2" : "1"} style={{ border: '1px solid #1f2937', padding: '5px 4px', width: '10%', textAlign: 'center' }}>HSN/SAC Code</th>
                      <th rowSpan={isTax ? "2" : "1"} style={{ border: '1px solid #1f2937', padding: '5px 4px', width: '9%', textAlign: 'center' }}>Unite price</th>
                      <th rowSpan={isTax ? "2" : "1"} style={{ border: '1px solid #1f2937', padding: '5px 4px', width: '5%', textAlign: 'center' }}>Qty</th>
                      <th rowSpan={isTax ? "2" : "1"} style={{ border: '1px solid #1f2937', padding: '5px 4px', width: '9%', textAlign: 'center' }}>Net Amount</th>
                      {isTax && (
                        <>
                          <th colSpan="2" style={{ border: '1px solid #1f2937', padding: '4px', width: '13%', textAlign: 'center' }}>CGST</th>
                          <th colSpan="2" style={{ border: '1px solid #1f2937', padding: '4px', width: '13%', textAlign: 'center' }}>SGST</th>
                          <th rowSpan="2" style={{ border: '1px solid #1f2937', padding: '5px 4px', width: '9%', textAlign: 'center' }}>Total Tax Amount</th>
                        </>
                      )}
                      <th rowSpan={isTax ? "2" : "1"} style={{ border: '1px solid #1f2937', padding: '5px 4px', width: isTax ? '12%' : '18%', textAlign: 'center' }}>Total Amount</th>
                    </tr>
                    {isTax && (
                      <tr style={{ background: themePrimary, color: '#ffffff', fontWeight: '800' }}>
                        <th style={{ border: '1px solid #1f2937', padding: '3px 2px', width: '4%', textAlign: 'center' }}>%</th>
                        <th style={{ border: '1px solid #1f2937', padding: '3px 4px', width: '9%', textAlign: 'center' }}>Amount</th>
                        <th style={{ border: '1px solid #1f2937', padding: '3px 2px', width: '4%', textAlign: 'center' }}>%</th>
                        <th style={{ border: '1px solid #1f2937', padding: '3px 4px', width: '9%', textAlign: 'center' }}>Amount</th>
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {(previewInvoice.lineItems || []).map((item, idx) => {
                      const qty = parseInt(item.qty) || 1;
                      const unitPrice = parseFloat(item.unitPrice) || 0;
                      const netAmount = unitPrice * qty;
                      const gstRate = parseFloat(item.gstPercent !== undefined ? item.gstPercent : (isCashBill ? 0 : 18));
                      const halfRate = isTax ? (gstRate / 2) : 0;
                      const lineCgstAmt = isTax ? (netAmount * halfRate / 100) : 0;
                      const lineSgstAmt = isTax ? (netAmount * halfRate / 100) : 0;
                      const lineTaxTotal = lineCgstAmt + lineSgstAmt;
                      const lineTotalAmount = netAmount + lineTaxTotal;

                      return (
                        <tr key={idx} style={{ textAlign: 'center' }}>
                          <td style={{ border: '1px solid #1f2937', padding: '5px 4px' }}>{idx + 1}</td>
                          <td style={{ border: '1px solid #1f2937', padding: '5px 6px', textAlign: 'left', fontWeight: '600' }}>{item.description}</td>
                          <td style={{ border: '1px solid #1f2937', padding: '5px 4px' }}>{item.hsnSac || '998314'}</td>
                          <td style={{ border: '1px solid #1f2937', padding: '5px 4px', textAlign: 'right' }}>{unitPrice.toFixed(2)}</td>
                          <td style={{ border: '1px solid #1f2937', padding: '5px 4px' }}>{qty}</td>
                          <td style={{ border: '1px solid #1f2937', padding: '5px 4px', textAlign: 'right' }}>{netAmount.toFixed(2)}</td>
                          {isTax && (
                            <>
                              <td style={{ border: '1px solid #1f2937', padding: '5px 2px' }}>{halfRate}%</td>
                              <td style={{ border: '1px solid #1f2937', padding: '5px 4px', textAlign: 'right' }}>{lineCgstAmt.toFixed(2)}</td>
                              <td style={{ border: '1px solid #1f2937', padding: '5px 2px' }}>{halfRate}%</td>
                              <td style={{ border: '1px solid #1f2937', padding: '5px 4px', textAlign: 'right' }}>{lineSgstAmt.toFixed(2)}</td>
                              <td style={{ border: '1px solid #1f2937', padding: '5px 4px', textAlign: 'right' }}>{lineTaxTotal.toFixed(2)}</td>
                            </>
                          )}
                          <td style={{ border: '1px solid #1f2937', padding: '5px 4px', textAlign: 'right', fontWeight: '700' }}>
                            {lineTotalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })}

                    {/* Subtotals Row (Matches User Reference SS 3 format) */}
                    <tr style={{ fontWeight: '700' }}>
                      <td style={{ border: '1px solid #1f2937', padding: '5px' }}>&nbsp;</td>
                      <td style={{ border: '1px solid #1f2937', padding: '5px' }}>&nbsp;</td>
                      <td style={{ border: '1px solid #1f2937', padding: '5px' }}>&nbsp;</td>
                      <td style={{ border: '1px solid #1f2937', padding: '5px' }}>&nbsp;</td>
                      <td style={{ border: '1px solid #1f2937', padding: '5px' }}>&nbsp;</td>
                      <td style={{ border: '1px solid #1f2937', padding: '5px 4px', textAlign: 'right' }}>{subtotal.toFixed(2)}</td>
                      {isTax && (
                        <>
                          <td style={{ border: '1px solid #1f2937', padding: '5px 2px' }}>&nbsp;</td>
                          <td style={{ border: '1px solid #1f2937', padding: '5px 4px', textAlign: 'right' }}>{cgstAmt.toFixed(2)}</td>
                          <td style={{ border: '1px solid #1f2937', padding: '5px 2px' }}>&nbsp;</td>
                          <td style={{ border: '1px solid #1f2937', padding: '5px 4px', textAlign: 'right' }}>{sgstAmt.toFixed(2)}</td>
                          <td style={{ border: '1px solid #1f2937', padding: '5px 4px', textAlign: 'right' }}>{totalGST.toFixed(2)}</td>
                        </>
                      )}
                      <td style={{ border: '1px solid #1f2937', padding: '5px 4px' }}>&nbsp;</td>
                    </tr>
                  </tbody>
                </table>

                {/* 4. Amount In words & Totals Summary Table */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'stretch', marginBottom: '14px' }}>
                  {/* Left: Solid Theme Banner */}
                  <div style={{
                    flex: 1,
                    background: themePrimary,
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

                  {/* Right: Summary Subtotal / Shipping / Total Box */}
                  <div style={{ width: '240px', border: '1px solid #1f2937', borderTop: 'none' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                      <tbody>
                        <tr>
                          <td style={{ padding: '4px 8px', fontWeight: '700', borderRight: '1px solid #1f2937', width: '50%' }}>Subtotal</td>
                          <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: '700' }}>
                            {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                        <tr style={{ borderTop: '1px solid #1f2937' }}>
                          <td style={{ padding: '4px 8px', fontWeight: '700', borderRight: '1px solid #1f2937' }}>Shipping</td>
                          <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: '700' }}>
                            {shipping > 0 ? shipping.toFixed(2) : ''}
                          </td>
                        </tr>
                        <tr style={{ borderTop: '1px solid #1f2937' }}>
                          <td style={{ padding: '4px 8px', fontWeight: '900', borderRight: '1px solid #1f2937', fontSize: '12px' }}>Total</td>
                          <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: '900', fontSize: '12px' }}>
                            {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 5. Terms & Conditions and Bank Details & Sign Off */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', paddingTop: '4px' }}>
                  {/* Left: Terms & Conditions and Axis Bank Account Details */}
                  <div style={{ lineHeight: 1.45, maxWidth: '440px' }}>
                    {isCashBill ? (
                      <div style={{
                        background: isModernIndigo ? '#eff6ff' : isCleanMono ? '#f4f4f5' : '#fef2f2',
                        padding: '10px 14px',
                        borderRadius: '6px',
                        border: `1px solid ${isModernIndigo ? '#bfdbfe' : isCleanMono ? '#d4d4d8' : '#fecaca'}`
                      }}>
                        <div style={{ fontWeight: '800', color: themePrimary, fontSize: '11.5px', marginBottom: '3px' }}>
                          ✓ CASH PAYMENT ACKNOWLEDGEMENT
                        </div>
                        <div style={{ color: isModernIndigo ? '#1e3a8a' : isCleanMono ? '#27272a' : '#7f1d1d', fontSize: '10.5px' }}>
                          Received full cash payment of <strong>₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong> from <strong>{previewInvoice.clientName}</strong>. Official Cash Voucher entry cleared.
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ textDecoration: 'underline', color: '#0284c7', fontWeight: 'bold', fontSize: '11px', marginBottom: '6px' }}>
                          Terms & Conditions:
                        </div>
                        <table style={{ width: '100%', fontSize: '10px', borderCollapse: 'collapse', color: '#111827', lineHeight: 1.45 }}>
                          <tbody>
                            <tr>
                              <td style={{ verticalAlign: 'top', fontWeight: '600', width: '55px', padding: '2px 0' }}>Taxes</td>
                              <td style={{ verticalAlign: 'top', width: '12px', padding: '2px 0' }}>:</td>
                              <td style={{ verticalAlign: 'top', padding: '2px 0' }}>Taxes extra as mentioned above: Any change in the tax structure at the time of delivery, will be passed on to the customers</td>
                            </tr>
                            <tr>
                              <td style={{ verticalAlign: 'top', fontWeight: '600', padding: '2px 0' }}>Invoice</td>
                              <td style={{ verticalAlign: 'top', padding: '2px 0' }}>:</td>
                              <td style={{ verticalAlign: 'top', padding: '2px 0' }}>Invoice will be submitted as per actuals.</td>
                            </tr>
                            <tr>
                              <td style={{ verticalAlign: 'top', fontWeight: '600', padding: '2px 0' }}>Prices</td>
                              <td style={{ verticalAlign: 'top', padding: '2px 0' }}>:</td>
                              <td style={{ verticalAlign: 'top', padding: '2px 0' }}>FOR India Only</td>
                            </tr>
                          </tbody>
                        </table>

                        <div style={{ fontWeight: 'bold', fontSize: '11px', marginTop: '10px', marginBottom: '3px', color: '#111827' }}>
                          Account Details:
                        </div>
                        <div style={{ fontSize: '10.5px', lineHeight: 1.45, color: '#111827' }}>
                          <div style={{ fontWeight: '700' }}>{bank.bankName || 'Axis Bank'}</div>
                          <div>Account Name- {bank.accountName || 'Sanna Innovations'}</div>
                          <div>Account Type- Current Account</div>
                          <div>Account Number - {bank.accountNumber || '922020048881338'}</div>
                          <div>IFSC code - {bank.ifscCode || 'UTIB0003568'}</div>
                          <div>Branch- {bank.branch || 'Rajajinagar 3rd Block Bangalore'}</div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Right: Authentic Sanna Innovations Stamp & Signature */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', minWidth: '220px' }}>
                    <img 
                      src="/sanna_signature_stamp.png" 
                      alt="For Sanna Innovations Authorised Signatory" 
                      style={{ width: '210px', maxWidth: '100%', objectFit: 'contain' }} 
                    />
                  </div>
                </div>

                {/* 6. Solid Red Bottom Address Banner */}
                <div style={{
                  background: themePrimary,
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
                <button onClick={() => window.print()} className="btn gradient-btn-primary" style={{ padding: '8px 20px', fontSize: '0.82rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Printer style={{ width: '15px', height: '15px' }} />
                  <span>Print / Download PDF</span>
                </button>
                <button 
                  onClick={() => setPreviewInvoice(null)} 
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
      })()}
    </div>
  );
};

export default GSTInvoiceManager;
