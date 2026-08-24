import React, { useState, useEffect } from 'react';
import { useCRM } from '../../context/CRMContext';
import { isSannaCRM, getAppConfig } from '../../utils/appMode';
import { ShoppingBag, Truck, Printer, Plus, Trash2, X, Eye, RefreshCw, Building2, Edit2, Edit } from 'lucide-react';
import { DEFAULT_SELLER_INFO, DEFAULT_BANK_DETAILS } from '../finance/GSTInvoiceManager';

// Indian Number System Converter (Lakhs/Crores)
const numberToWords = (num) => {
  if (num === 0) return 'Zero';
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
    if (crore > 0) {
      str += convert(crore) + ' Crore ';
    }

    let lakh = Math.floor(n / 100000);
    n %= 100000;
    if (lakh > 0) {
      str += firstWord(lakh) + ' Lakh ';
    }

    let thousand = Math.floor(n / 1000);
    n %= 1000;
    if (thousand > 0) {
      str += firstWord(thousand) + ' Thousand ';
    }

    let hundred = Math.floor(n / 100);
    n %= 100;
    if (hundred > 0) {
      str += a[hundred] + ' Hundred ';
    }

    if (n > 0) {
      if (str !== '') str += 'and ';
      str += firstWord(n);
    }

    return str.trim();
  };

  let intNum = Math.floor(num);
  return convert(intNum) + ' Only';
};

const OrderInvoiceManager = () => {
  const { orders, createOrder, updateOrder, deleteOrder } = useCRM();
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);

  // Template & Theme Customization State
  const [selectedTemplate, setSelectedTemplate] = useState('modern'); // 'modern' | 'creative' | 'classic' | 'compact'
  const [primaryColor, setPrimaryColor] = useState('#2563eb'); // Default primary accent color
  const [creatorTab, setCreatorTab] = useState('edit'); // 'edit' | 'preview'
  const [sampleModalTemplate, setSampleModalTemplate] = useState(null); // null | 'modern' | 'creative' | 'classic' | 'compact'

  // Form State
  const [invoiceType, setInvoiceType] = useState('Tax Invoice');
  const [invoiceNumber, setInvoiceNumber] = useState(() => {
    const isSanna = isSannaCRM();
    const prefix = isSanna ? 'SI' : 'INV';
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentMonth = monthNames[new Date().getMonth()];
    const currentYear = new Date().getFullYear();
    const randomNum = Math.floor(100 + Math.random() * 900);
    return `${prefix}/${currentYear}/${currentMonth}/${randomNum}`;
  });
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerState, setCustomerState] = useState('Karnataka');
  const [customerGstin, setCustomerGstin] = useState('');
  const [reverseCharge, setReverseCharge] = useState('N');
  const [shipping, setShipping] = useState(0);
  const [items, setItems] = useState([
    { description: '', hsnCode: '', unitPrice: 0, qty: 1 }
  ]);

  // Seller & Bank Account Custom Details (Pre-fed with Company Defaults)
  const [sellerName, setSellerName] = useState(DEFAULT_SELLER_INFO.companyName);
  const [sellerLogo, setSellerLogo] = useState('');
  const [sellerAddress, setSellerAddress] = useState(DEFAULT_SELLER_INFO.address);
  const [sellerWebsite, setSellerWebsite] = useState(DEFAULT_SELLER_INFO.website);
  const [sellerGstin, setSellerGstin] = useState(DEFAULT_SELLER_INFO.gstin);
  const [bankName, setBankName] = useState(DEFAULT_BANK_DETAILS.bankName);
  const [bankAccountName, setBankAccountName] = useState(DEFAULT_BANK_DETAILS.accountName);
  const [bankAccountType, setBankAccountType] = useState('Current Account');
  const [bankAccountNumber, setBankAccountNumber] = useState(DEFAULT_BANK_DETAILS.accountNumber);
  const [bankIfscCode, setBankIfscCode] = useState(DEFAULT_BANK_DETAILS.ifscCode);
  const [bankBranch, setBankBranch] = useState(DEFAULT_BANK_DETAILS.branch);

  const populateDefaults = () => {
    setSellerName(DEFAULT_SELLER_INFO.companyName);
    setSellerAddress(DEFAULT_SELLER_INFO.address);
    setSellerWebsite(DEFAULT_SELLER_INFO.website);
    setSellerGstin(DEFAULT_SELLER_INFO.gstin);
    setBankName(DEFAULT_BANK_DETAILS.bankName);
    setBankAccountName(DEFAULT_BANK_DETAILS.accountName);
    setBankAccountType('Current Account');
    setBankAccountNumber(DEFAULT_BANK_DETAILS.accountNumber);
    setBankIfscCode(DEFAULT_BANK_DETAILS.ifscCode);
    setBankBranch(DEFAULT_BANK_DETAILS.branch);
  };

  // Auto pre-load defaults whenever the create modal is shown
  useEffect(() => {
    if (showCreateModal) {
      if (!sellerName) setSellerName(DEFAULT_SELLER_INFO.companyName);
      if (!sellerAddress) setSellerAddress(DEFAULT_SELLER_INFO.address);
      if (!sellerWebsite) setSellerWebsite(DEFAULT_SELLER_INFO.website);
      if (!sellerGstin) setSellerGstin(DEFAULT_SELLER_INFO.gstin);
      if (!bankName) setBankName(DEFAULT_BANK_DETAILS.bankName);
      if (!bankAccountName) setBankAccountName(DEFAULT_BANK_DETAILS.accountName);
      if (!bankAccountType) setBankAccountType('Current Account');
      if (!bankAccountNumber) setBankAccountNumber(DEFAULT_BANK_DETAILS.accountNumber);
      if (!bankIfscCode) setBankIfscCode(DEFAULT_BANK_DETAILS.ifscCode);
      if (!bankBranch) setBankBranch(DEFAULT_BANK_DETAILS.branch);
    }
  }, [showCreateModal]);

  const handleOpenCreateModal = () => {
    setEditingInvoice(null);
    populateDefaults();
    const isSanna = isSannaCRM();
    const prefix = isSanna ? 'SI' : 'INV';
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentMonth = monthNames[new Date().getMonth()];
    const currentYear = new Date().getFullYear();
    const randomNum = Math.floor(100 + Math.random() * 900);
    setInvoiceNumber(`${prefix}/${currentYear}/${currentMonth}/${randomNum}`);
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setCustomerName('');
    setCustomerAddress('');
    setCustomerGstin('');
    setReverseCharge('N');
    setShipping(0);
    setItems([{ description: '', hsnCode: '99831', unitPrice: 0, qty: 1 }]);
    setCreatorTab('edit');
    setShowCreateModal(true);
  };

  const handleEditInvoice = (order) => {
    setEditingInvoice(order);
    setInvoiceType(order.invoiceType || 'Tax Invoice');
    setInvoiceNumber(order.invoiceNumber || '');
    setInvoiceDate(order.invoiceDate || order.createdDate || new Date().toISOString().split('T')[0]);
    setCustomerName(order.customerName || '');
    setCustomerAddress(order.customerAddress || '');
    setCustomerState(order.customerState || 'Karnataka');
    setCustomerGstin(order.customerGstin || '');
    setReverseCharge(order.reverseCharge || 'N');
    setShipping(order.shipping || 0);
    setItems(order.items && order.items.length > 0 ? order.items.map(it => ({
      description: it.description || it.productName || '',
      hsnCode: it.hsnCode || '99831',
      unitPrice: it.unitPrice || 0,
      qty: it.qty || 1
    })) : [{ description: '', hsnCode: '99831', unitPrice: 0, qty: 1 }]);
    setSellerName(order.sellerName || DEFAULT_SELLER_INFO.companyName);
    setSellerLogo(order.sellerLogo || '');
    setSellerAddress(order.sellerAddress || DEFAULT_SELLER_INFO.address);
    setSellerWebsite(order.sellerWebsite || DEFAULT_SELLER_INFO.website);
    setSellerGstin(order.sellerGstin || DEFAULT_SELLER_INFO.gstin);
    setBankName(order.bankName || DEFAULT_BANK_DETAILS.bankName);
    setBankAccountName(order.bankAccountName || DEFAULT_BANK_DETAILS.accountName);
    setBankAccountType(order.bankAccountType || 'Current Account');
    setBankAccountNumber(order.bankAccountNumber || DEFAULT_BANK_DETAILS.accountNumber);
    setBankIfscCode(order.bankIfscCode || DEFAULT_BANK_DETAILS.ifscCode);
    setBankBranch(order.bankBranch || DEFAULT_BANK_DETAILS.branch);
    if (order.template) setSelectedTemplate(order.template);
    if (order.primaryColor) setPrimaryColor(order.primaryColor);
    setCreatorTab('edit');
    setShowCreateModal(true);
  };

  const handleDeleteInvoice = async (order) => {
    const invNo = order.invoiceNumber || order.id;
    if (!window.confirm(`Are you sure you want to permanently delete invoice "${invNo}"?`)) {
      return;
    }
    try {
      if (deleteOrder) {
        await deleteOrder(order.id);
      }
      if (selectedInvoice && selectedInvoice.id === order.id) {
        setSelectedInvoice(null);
      }
    } catch (err) {
      console.error("Error deleting invoice:", err);
      alert("Error deleting invoice: " + (err.message || 'Failed to delete'));
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSellerLogo(reader.result); // Base64 encoding
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddItem = () => {
    setItems([...items, { description: '', hsnCode: '99831', unitPrice: 0, qty: 1 }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index, field, value) => {
    const updated = items.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setItems(updated);
  };

  const handleClearAllFields = () => {
    setSellerName('');
    setSellerLogo('');
    setSellerAddress('');
    setSellerWebsite('');
    setSellerGstin('');
    setBankName('');
    setBankAccountName('');
    setBankAccountType('');
    setBankAccountNumber('');
    setBankIfscCode('');
    setBankBranch('');
    setCustomerName('');
    setCustomerAddress('');
    setCustomerState('');
    setCustomerGstin('');
    setReverseCharge('N');
    setShipping(0);
    setItems([{ description: '', hsnCode: '', unitPrice: 0, qty: 1 }]);
  };

  const handleLoadSampleData = () => {
    setSellerName(DEFAULT_SELLER_INFO.companyName);
    setSellerAddress(DEFAULT_SELLER_INFO.address);
    setSellerWebsite(DEFAULT_SELLER_INFO.website);
    setSellerGstin(DEFAULT_SELLER_INFO.gstin);
    setBankName(DEFAULT_BANK_DETAILS.bankName);
    setBankAccountName(DEFAULT_BANK_DETAILS.accountName);
    setBankAccountType('Current Account');
    setBankAccountNumber(DEFAULT_BANK_DETAILS.accountNumber);
    setBankIfscCode(DEFAULT_BANK_DETAILS.ifscCode);
    setBankBranch(DEFAULT_BANK_DETAILS.branch);
    setCustomerName('Sahara Transformers Pvt Ltd');
    setCustomerAddress('60/2 Seegehalli Gate Magadi Main Road, Bangalore - 560091');
    setCustomerState('Karnataka');
    setCustomerGstin('29BNJPS7776J1ZW');
    setItems([{ description: 'Cloud Infrastructure & Enterprise SaaS License', hsnCode: '99831', unitPrice: 75000, qty: 1 }]);
  };

  // Live total calculations
  const calculateTotals = () => {
    let subtotal = 0;
    let totalCgst = 0;
    let totalSgst = 0;

    const calculatedItems = items.map(item => {
      const netAmount = (parseFloat(item.unitPrice) || 0) * (parseInt(item.qty) || 0);
      const cgstRate = invoiceType === 'Tax Invoice' ? 9 : 0;
      const sgstRate = invoiceType === 'Tax Invoice' ? 9 : 0;
      const cgstAmount = netAmount * cgstRate / 100;
      const sgstAmount = netAmount * sgstRate / 100;
      const taxTotal = cgstAmount + sgstAmount;
      const totalAmount = netAmount + taxTotal;

      subtotal += netAmount;
      totalCgst += cgstAmount;
      totalSgst += sgstAmount;

      return {
        ...item,
        netAmount,
        cgstRate,
        sgstRate,
        cgstAmount,
        sgstAmount,
        taxTotal,
        totalAmount
      };
    });

    const taxTotal = totalCgst + totalSgst;
    const grandTotal = subtotal + taxTotal + (parseFloat(shipping) || 0);

    return {
      items: calculatedItems,
      subtotal,
      cgstAmount: totalCgst,
      sgstAmount: totalSgst,
      taxTotal,
      grandTotal
    };
  };

  const totals = calculateTotals();

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert("Please enter Customer Name.");
      return;
    }
    if (items.some(item => !item.description.trim())) {
      alert("Please fill in descriptions for all line items.");
      return;
    }

    const payload = {
      customerName,
      totalValue: totals.grandTotal,
      status: 'Paid',
      invoiceNumber,
      invoiceType,
      invoiceDate,
      customerAddress,
      customerState,
      customerGstin: invoiceType === 'Tax Invoice' ? customerGstin : '',
      reverseCharge,
      items: totals.items,
      subtotal: totals.subtotal,
      cgstAmount: totals.cgstAmount,
      sgstAmount: totals.sgstAmount,
      taxTotal: totals.taxTotal,
      shipping: parseFloat(shipping) || 0,
      grandTotal: totals.grandTotal,
      sellerName,
      sellerLogo,
      sellerAddress,
      sellerWebsite,
      sellerGstin,
      bankName,
      bankAccountName,
      bankAccountType,
      bankAccountNumber,
      bankIfscCode,
      bankBranch
    };

    try {
      if (editingInvoice) {
        await updateOrder(editingInvoice.id, payload);
      } else {
        await createOrder(payload);
      }
      setShowCreateModal(false);
      setEditingInvoice(null);
      // Reset customer specific form fields only
      setCustomerName('');
      setCustomerAddress('');
      setCustomerGstin('');
      setReverseCharge('N');
      setShipping(0);
      setItems([{ description: '', hsnCode: '', unitPrice: 0, qty: 1 }]);
      // Generate new invoice number
      const isSanna = isSannaCRM();
      const prefix = isSanna ? 'SI' : 'INV';
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const currentMonth = monthNames[new Date().getMonth()];
      const currentYear = new Date().getFullYear();
      const randomNum = Math.floor(100 + Math.random() * 900);
      setInvoiceNumber(`${prefix}/${currentYear}/${currentMonth}/${randomNum}`);
    } catch (err) {
      console.error("Error saving invoice:", err);
      alert("Error saving invoice: " + err.message);
    }
  };

  const normalizeOrderToInvoice = (order) => {
    const isTax = order.invoiceType ? order.invoiceType === 'Tax Invoice' : true;
    const totalVal = order.totalValue || order.totalAmount || order.grandTotal || 0;
    const subtotal = order.subtotal !== undefined ? order.subtotal : (isTax ? totalVal / 1.18 : totalVal);
    const taxTotal = order.taxTotal !== undefined ? order.taxTotal : (isTax ? totalVal - subtotal : 0);
    const cgstAmount = order.cgstAmount !== undefined ? order.cgstAmount : (isTax ? taxTotal / 2 : 0);
    const sgstAmount = order.sgstAmount !== undefined ? order.sgstAmount : (isTax ? taxTotal / 2 : 0);

    return {
      id: order.id || 'N/A',
      invoiceNumber: order.invoiceNumber || `SI/2026/June/00${order.id?.split('-')[2] || '3'}`,
      invoiceType: order.invoiceType || 'Tax Invoice',
      invoiceDate: order.invoiceDate || order.createdDate || '2026-06-26',
      customerName: order.customerName,
      customerAddress: order.customerAddress || 'Basavanapura Main Rd, opposite Krishna Theatre, Nisarga Layout, Krishnarajapuram, Bengaluru, Karnataka 560036',
      customerState: order.customerState || 'Karnataka',
      customerGstin: order.customerGstin || (isTax ? '29XYZAB5678C1Z2' : ''),
      reverseCharge: order.reverseCharge || 'N',
      template: order.template || selectedTemplate || 'modern',
      primaryColor: order.primaryColor || primaryColor || '#2563eb',
      items: (order.items && order.items.length > 0) ? order.items : [
        {
          description: 'Sanna CRM Enterprise SaaS Software License Suite',
          hsnCode: '99831',
          unitPrice: subtotal,
          qty: 1,
          netAmount: subtotal,
          cgstRate: isTax ? 9 : 0,
          cgstAmount: cgstAmount,
          sgstRate: isTax ? 9 : 0,
          sgstAmount: sgstAmount,
          taxTotal: taxTotal,
          totalAmount: totalVal
        }
      ],
      subtotal: subtotal,
      cgstAmount: cgstAmount,
      sgstAmount: sgstAmount,
      taxTotal: taxTotal,
      shipping: order.shipping || 0,
      grandTotal: totalVal,
      sellerName: order.sellerName || sellerName || DEFAULT_SELLER_INFO.companyName,
      sellerLogo: order.sellerLogo !== undefined ? order.sellerLogo : sellerLogo,
      sellerAddress: order.sellerAddress || sellerAddress || DEFAULT_SELLER_INFO.address,
      sellerWebsite: order.sellerWebsite || sellerWebsite || DEFAULT_SELLER_INFO.website,
      sellerGstin: order.sellerGstin || sellerGstin || DEFAULT_SELLER_INFO.gstin,
      bankName: order.bankName || bankName || DEFAULT_BANK_DETAILS.bankName,
      bankAccountName: order.bankAccountName || bankAccountName || DEFAULT_BANK_DETAILS.accountName,
      bankAccountType: order.bankAccountType || bankAccountType || 'Current Account',
      bankAccountNumber: order.bankAccountNumber || bankAccountNumber || DEFAULT_BANK_DETAILS.accountNumber,
      bankIfscCode: order.bankIfscCode || bankIfscCode || DEFAULT_BANK_DETAILS.ifscCode,
      bankBranch: order.bankBranch || bankBranch || DEFAULT_BANK_DETAILS.branch
    };
  };

  const formatCurrency = (val) => `₹${(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const activeInvoice = selectedInvoice ? normalizeOrderToInvoice(selectedInvoice) : null;

  // Preset Colors List
  const PRESET_COLORS = [
    { name: 'Tech Blue', hex: '#2563eb' },
    { name: 'Crimson Red', hex: '#b91c1c' },
    { name: 'Emerald Green', hex: '#059669' },
    { name: 'Royal Purple', hex: '#7c3aed' },
    { name: 'Amber Gold', hex: '#d97706' },
    { name: 'Slate Charcoal', hex: '#1e293b' },
  ];

  // Templates Metadata
  const TEMPLATES = [
    { id: 'modern', label: '1. Modern Corporate', icon: '💻' },
    { id: 'creative', label: '2. Creative Agency', icon: '🎨' },
    { id: 'classic', label: '3. Classic GST Grid', icon: '🏢' },
    { id: 'compact', label: '4. Executive Compact', icon: '💼' }
  ];

  // Helper Theme Bar
  const renderThemeBar = () => (
    <div className="no-print" style={{
      background: 'rgba(15, 23, 42, 0.7)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      borderRadius: '12px',
      padding: '14px 18px',
      marginBottom: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>

        {/* Template Selector Tabs */}
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
            Choose Built-in Invoice Template:
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {TEMPLATES.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedTemplate(t.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    border: selectedTemplate === t.id ? `2px solid ${primaryColor}` : '1px solid var(--border-color)',
                    background: selectedTemplate === t.id ? `${primaryColor}25` : 'var(--card-bg-light)',
                    color: selectedTemplate === t.id ? '#ffffff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTemplate(t.id);
                    setSampleModalTemplate(t.id);
                  }}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '0.7rem',
                    fontWeight: '700',
                    background: 'rgba(96, 165, 250, 0.15)',
                    color: '#60a5fa',
                    border: '1px solid rgba(96, 165, 250, 0.3)',
                    cursor: 'pointer'
                  }}
                  title={`Preview sample invoice for ${t.label}`}
                >
                  👁️ Sample
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Color Theme Selector */}
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
            Template Color Theme:
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {PRESET_COLORS.map(c => (
              <button
                key={c.hex}
                type="button"
                onClick={() => setPrimaryColor(c.hex)}
                title={c.name}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: c.hex,
                  border: primaryColor === c.hex ? '3px solid #ffffff' : '2px solid transparent',
                  cursor: 'pointer',
                  transform: primaryColor === c.hex ? 'scale(1.2)' : 'scale(1)'
                }}
              />
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '4px' }}>
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                style={{
                  width: '28px',
                  height: '28px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  background: 'none'
                }}
                title="Custom Color Picker"
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Custom</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );

  // Template Renderers
  const renderTemplateContent = (inv) => {
    const themeColor = primaryColor || inv.primaryColor || '#2563eb';
    const tmpl = selectedTemplate || inv.template || 'modern';

    if (tmpl === 'modern') {
      return (
        <div style={{ border: `1px solid ${themeColor}40`, borderRadius: '10px', overflow: 'hidden', background: '#fff', color: '#1e293b' }}>
          <div style={{ height: '6px', background: themeColor }} />
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                {inv.sellerLogo ? (
                  <img src={inv.sellerLogo} style={{ maxHeight: '60px', maxWidth: '160px', objectFit: 'contain', marginBottom: '8px' }} alt="Logo" />
                ) : (
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: themeColor, margin: 0 }}>
                    {inv.sellerName || 'COMPANY NAME'}
                  </h2>
                )}
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px', maxWidth: '280px', lineHeight: 1.4 }}>
                  <div>{inv.sellerAddress}</div>
                  {inv.sellerGstin && <div>GSTIN: {inv.sellerGstin}</div>}
                  {inv.sellerWebsite && <div style={{ color: themeColor }}>{inv.sellerWebsite}</div>}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{
                  display: 'inline-block',
                  padding: '6px 16px',
                  borderRadius: '20px',
                  background: themeColor,
                  color: '#ffffff',
                  fontWeight: '800',
                  fontSize: '0.85rem',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  marginBottom: '8px'
                }}>
                  {inv.invoiceType || 'TAX INVOICE'}
                </span>
                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#334155' }}>
                  No: <span style={{ color: themeColor }}>{inv.invoiceNumber}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                  Date: {inv.invoiceDate}
                </div>
              </div>
            </div>

            <div style={{ background: '#f8fafc', border: `1px solid ${themeColor}20`, borderRadius: '8px', padding: '16px', marginBottom: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: '800', color: themeColor, textTransform: 'uppercase', marginBottom: '4px' }}>
                  Billed To (Customer):
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a' }}>
                  {inv.customerName || 'Customer Name'}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '4px', whiteSpace: 'pre-wrap' }}>
                  {inv.customerAddress}
                </div>
                {inv.customerState && <div style={{ fontSize: '0.8rem', color: '#475569' }}>State: {inv.customerState}</div>}
                {inv.customerGstin && <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginTop: '2px' }}>GSTIN: {inv.customerGstin}</div>}
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: '800', color: themeColor, textTransform: 'uppercase', marginBottom: '4px' }}>
                  Payment Details:
                </div>
                <div style={{ fontSize: '0.8rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div>Status: <strong>{inv.paymentStatus || 'Paid'}</strong></div>
                  <div>Reverse Charge: <strong>{inv.reverseCharge || 'N'}</strong></div>
                </div>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', marginBottom: '24px' }}>
              <thead>
                <tr style={{ background: themeColor, color: '#ffffff', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px', borderTopLeftRadius: '6px' }}>#</th>
                  <th style={{ padding: '10px 12px' }}>Item Description</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>HSN/SAC</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Price (₹)</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>Qty</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', borderTopRightRadius: '6px' }}>Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                {(inv.items || []).map((item, idx) => {
                  const lineNet = item.netAmount || ((item.unitPrice || 0) * (item.qty || 1));
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                      <td style={{ padding: '10px 12px', color: '#64748b' }}>{idx + 1}</td>
                      <td style={{ padding: '10px 12px', fontWeight: '700', color: '#1e293b' }}>{item.description || item.productName}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: '#64748b' }}>{item.hsnCode || '-'}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>{(item.unitPrice || 0).toLocaleString('en-IN')}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>{item.qty || 1}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '700' }}>{lineNet.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '240px', fontSize: '0.8rem' }}>
                <div style={{ fontWeight: '800', color: themeColor, marginBottom: '4px' }}>Bank Account & Remittance:</div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px', color: '#475569', lineHeight: 1.5 }}>
                  <div>Bank: <strong>{inv.bankName}</strong></div>
                  <div>Account Holder: <strong>{inv.bankAccountName}</strong></div>
                  <div>Account No: <strong>{inv.bankAccountNumber}</strong></div>
                  <div>IFSC Code: <strong>{inv.bankIfscCode}</strong></div>
                  {inv.bankBranch && <div>Branch: {inv.bankBranch}</div>}
                </div>
              </div>

              <div style={{ width: '280px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed #cbd5e1' }}>
                  <span>Subtotal:</span>
                  <strong style={{ color: '#1e293b' }}>{formatCurrency(inv.subtotal)}</strong>
                </div>
                {inv.invoiceType === 'Tax Invoice' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed #cbd5e1', color: '#475569' }}>
                    <span>CGST (9%) + SGST (9%):</span>
                    <strong>{formatCurrency(inv.taxTotal)}</strong>
                  </div>
                )}
                {inv.shipping > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed #cbd5e1' }}>
                    <span>Shipping:</span>
                    <strong>{formatCurrency(inv.shipping)}</strong>
                  </div>
                )}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: themeColor,
                  color: '#ffffff',
                  borderRadius: '8px',
                  marginTop: '8px',
                  fontWeight: '900',
                  fontSize: '1.05rem'
                }}>
                  <span>Grand Total:</span>
                  <span>{formatCurrency(inv.grandTotal)}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '30px', borderTop: '1px solid #e2e8f0', paddingTop: '16px', fontSize: '0.75rem', color: '#64748b' }}>
              <div>
                <div>Amount In Words: <strong>{numberToWords(inv.grandTotal)}</strong></div>
                <div style={{ fontStyle: 'italic', marginTop: '4px' }}>Thank you for your business!</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: '800', color: themeColor, marginBottom: '20px' }}>
                  For {inv.sellerName || 'Seller Company'}
                </div>
                <div style={{ borderTop: '1px solid #cbd5e1', width: '140px', margin: '0 auto', paddingTop: '4px', fontWeight: '700', color: '#334155' }}>
                  Authorised Signatory
                </div>
              </div>
            </div>

          </div>
        </div>
      );
    }

    if (tmpl === 'creative') {
      return (
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', background: '#fff', color: '#1e293b' }}>
          <div style={{ background: themeColor, color: '#ffffff', padding: '28px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              {inv.sellerLogo ? (
                <img src={inv.sellerLogo} style={{ maxHeight: '60px', maxWidth: '180px', objectFit: 'contain', background: '#fff', padding: '6px', borderRadius: '8px' }} alt="Logo" />
              ) : (
                <h1 style={{ fontSize: '1.8rem', fontWeight: '900', margin: 0, letterSpacing: '0.5px' }}>
                  {inv.sellerName || 'YOUR COMPANY'}
                </h1>
              )}
              <div style={{ fontSize: '0.8rem', opacity: 0.9, marginTop: '6px' }}>{inv.sellerAddress}</div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: '900', margin: 0, textTransform: 'uppercase', letterSpacing: '2px' }}>
                INVOICE
              </h2>
              <div style={{ fontSize: '0.95rem', fontWeight: '700', marginTop: '4px' }}>
                #{inv.invoiceNumber}
              </div>
              <div style={{ fontSize: '0.8rem', marginTop: '2px', opacity: 0.85 }}>
                Date: {inv.invoiceDate}
              </div>
            </div>
          </div>

          <div style={{ padding: '28px 32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
              <div style={{ background: `${themeColor}08`, border: `1px solid ${themeColor}30`, borderRadius: '10px', padding: '18px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '800', color: themeColor, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                  CLIENT INFORMATION
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a' }}>
                  {inv.customerName || 'Customer Name'}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '4px', whiteSpace: 'pre-wrap' }}>
                  {inv.customerAddress}
                </div>
                {inv.customerGstin && <div style={{ fontSize: '0.8rem', fontWeight: '700', color: themeColor, marginTop: '6px' }}>GSTIN: {inv.customerGstin}</div>}
              </div>

              <div style={{ background: `${themeColor}08`, border: `1px solid ${themeColor}30`, borderRadius: '10px', padding: '18px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '800', color: themeColor, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                  PAYMENT DETAILS
                </div>
                <div style={{ fontSize: '1rem', fontWeight: '800', color: inv.paymentStatus?.includes('Paid') ? '#10b981' : '#f59e0b' }}>
                  Status: {inv.paymentStatus || 'Pending'}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '6px', lineHeight: 1.5 }}>
                  <div>Bank: <strong>{inv.bankName}</strong></div>
                  <div>Account: <strong>{inv.bankAccountNumber}</strong></div>
                  <div>IFSC: <strong>{inv.bankIfscCode}</strong></div>
                </div>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '28px' }}>
              <thead>
                <tr style={{ background: themeColor, color: '#ffffff' }}>
                  <th style={{ padding: '12px 14px', textAlign: 'center', width: '5%', borderTopLeftRadius: '8px' }}>#</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', width: '45%' }}>Description</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center', width: '15%' }}>HSN</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right', width: '15%' }}>Price</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center', width: '8%' }}>Qty</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right', width: '17%', borderTopRightRadius: '8px' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {(inv.items || []).map((item, idx) => {
                  const lineNet = item.netAmount || ((item.unitPrice || 0) * (item.qty || 1));
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                      <td style={{ padding: '12px 14px', textAlign: 'center', color: '#94a3b8' }}>{idx + 1}</td>
                      <td style={{ padding: '12px 14px', fontWeight: '700', color: '#1e293b' }}>{item.description || item.productName}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', color: '#64748b' }}>{item.hsnCode || '-'}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>{(item.unitPrice || 0).toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>{item.qty || 1}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '800', color: themeColor }}>{lineNet.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: themeColor, color: '#ffffff', padding: '20px 24px', borderRadius: '12px', marginBottom: '24px' }}>
              <div>
                <div style={{ fontSize: '0.8rem', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '1px' }}>Total Payable Amount</div>
                <div style={{ fontSize: '0.85rem', opacity: 0.9, fontStyle: 'italic', marginTop: '2px' }}>{numberToWords(inv.grandTotal)}</div>
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: '900' }}>
                {formatCurrency(inv.grandTotal)}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (tmpl === 'compact') {
      return (
        <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '28px', background: '#fff', color: '#1e293b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: `2px solid ${themeColor}`, paddingBottom: '16px', marginBottom: '20px' }}>
            <div>
              {inv.sellerLogo ? (
                <img src={inv.sellerLogo} style={{ maxHeight: '50px', maxWidth: '140px', objectFit: 'contain', marginBottom: '6px' }} alt="Logo" />
              ) : (
                <div style={{ fontSize: '1.4rem', fontWeight: '900', color: themeColor }}>{inv.sellerName || 'COMPANY NAME'}</div>
              )}
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{inv.sellerAddress}</div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: themeColor, textTransform: 'uppercase' }}>INVOICE</div>
              <div style={{ fontSize: '0.85rem', fontWeight: '700' }}>#{inv.invoiceNumber}</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Date: {inv.invoiceDate}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', background: '#f8fafc', padding: '12px', borderRadius: '6px', marginBottom: '20px', fontSize: '0.78rem' }}>
            <div>
              <span style={{ color: '#64748b' }}>Billed To:</span>
              <div style={{ fontWeight: '800', color: '#0f172a' }}>{inv.customerName}</div>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>GSTIN:</span>
              <div style={{ fontWeight: '700' }}>{inv.customerGstin || 'N/A'}</div>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Payment Status:</span>
              <div style={{ fontWeight: '800', color: inv.paymentStatus?.includes('Paid') ? '#10b981' : '#f59e0b' }}>{inv.paymentStatus}</div>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', marginBottom: '20px' }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${themeColor}`, color: themeColor, textAlign: 'left', fontWeight: '800' }}>
                <th style={{ padding: '8px' }}>Description</th>
                <th style={{ padding: '8px', textAlign: 'center' }}>HSN</th>
                <th style={{ padding: '8px', textAlign: 'right' }}>Price</th>
                <th style={{ padding: '8px', textAlign: 'center' }}>Qty</th>
                <th style={{ padding: '8px', textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {(inv.items || []).map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px', fontWeight: '600' }}>{item.description || item.productName}</td>
                  <td style={{ padding: '8px', textAlign: 'center', color: '#64748b' }}>{item.hsnCode || '-'}</td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>{(item.unitPrice || 0).toLocaleString('en-IN')}</td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>{item.qty || 1}</td>
                  <td style={{ padding: '8px', textAlign: 'right', fontWeight: '700' }}>{((item.unitPrice || 0) * (item.qty || 1)).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Bank: <strong>{inv.bankName}</strong> | A/C: <strong>{inv.bankAccountNumber}</strong> | IFSC: <strong>{inv.bankIfscCode}</strong>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: '900', color: themeColor }}>
                Total: {formatCurrency(inv.grandTotal)}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Default 'classic' template (Official GST Grid)
    return (
      <div style={{ border: '1px solid #9ca3af', padding: '16px', background: '#ffffff', color: '#1f2937' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '140px', border: '1px solid #e5e7eb', padding: '8px', borderRadius: '4px', background: '#fafafa' }}>
              {inv.sellerLogo ? (
                <img src={inv.sellerLogo} style={{ maxHeight: '55px', maxWidth: '120px', objectFit: 'contain', marginBottom: '4px' }} alt="Logo" />
              ) : (
                <>
                  <div style={{ background: themeColor, width: '44px', height: '44px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', border: '2px solid #eab308', alignSelf: 'center' }}>
                    <span style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: '800', lineHeight: '44px', textAlign: 'center' }}>
                      {inv.sellerName?.charAt(0) || 'S'}
                    </span>
                  </div>
                  <div style={{ color: themeColor, fontWeight: '900', fontSize: '1.1rem', letterSpacing: '1px', marginTop: '4px', lineHeight: 1, textTransform: 'uppercase', textAlign: 'center' }}>
                    {inv.sellerName?.split(' ')[0] || 'COMPANY'}
                  </div>
                </>
              )}
            </div>
          </div>

          <div style={{ width: '320px', border: '1px solid #9ca3af', borderCollapse: 'collapse' }}>
            <div style={{ background: themeColor, color: 'white', fontWeight: '800', textAlign: 'center', padding: '6px', fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {inv.invoiceType}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
              <tbody>
                <tr style={{ borderTop: '1px solid #9ca3af' }}>
                  <td style={{ padding: '6px', fontWeight: '700', borderRight: '1px solid #9ca3af', width: '40%' }}>Invoice Date</td>
                  <td style={{ padding: '6px' }}>{inv.invoiceDate}</td>
                </tr>
                <tr style={{ borderTop: '1px solid #9ca3af' }}>
                  <td style={{ padding: '6px', fontWeight: '700', borderRight: '1px solid #9ca3af' }}>Invoice No</td>
                  <td style={{ padding: '6px', fontWeight: '700' }}>{inv.invoiceNumber}</td>
                </tr>
                <tr style={{ borderTop: '1px solid #9ca3af' }}>
                  <td style={{ padding: '6px', fontWeight: '700', borderRight: '1px solid #9ca3af' }}>GSTIN/PAN</td>
                  <td style={{ padding: '6px', fontSize: '0.7rem' }}>{inv.sellerGstin}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ border: '1px solid #9ca3af', marginBottom: '20px' }}>
          <div style={{ background: themeColor, color: 'white', fontWeight: '700', padding: '6px', fontSize: '0.8rem' }}>
            Customer:
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
            <tbody>
              <tr>
                <td style={{ padding: '6px', fontWeight: '700', borderRight: '1px solid #9ca3af', width: '150px' }}>Name:</td>
                <td style={{ padding: '6px', fontWeight: '700' }}>{inv.customerName}</td>
              </tr>
              <tr style={{ borderTop: '1px solid #9ca3af' }}>
                <td style={{ padding: '6px', fontWeight: '700', borderRight: '1px solid #9ca3af' }}>Address:</td>
                <td style={{ padding: '6px', fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>{inv.customerAddress}</td>
              </tr>
              <tr style={{ borderTop: '1px solid #9ca3af' }}>
                <td style={{ padding: '6px', fontWeight: '700', borderRight: '1px solid #9ca3af' }}>State:</td>
                <td style={{ padding: '6px' }}>{inv.customerState}</td>
              </tr>
              {inv.customerGstin && (
                <tr style={{ borderTop: '1px solid #9ca3af' }}>
                  <td style={{ padding: '6px', fontWeight: '700', borderRight: '1px solid #9ca3af' }}>GSTIN:</td>
                  <td style={{ padding: '6px', fontWeight: '700' }}>{inv.customerGstin}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #9ca3af', fontSize: '0.75rem', marginBottom: '20px' }}>
          <thead>
            <tr style={{ background: themeColor, color: 'white' }}>
              <th style={{ border: '1px solid #9ca3af', padding: '6px', width: '5%' }}>Sl No</th>
              <th style={{ border: '1px solid #9ca3af', padding: '6px', width: '35%' }}>Description of Goods / Services</th>
              <th style={{ border: '1px solid #9ca3af', padding: '6px', width: '10%' }}>HSN / SAC</th>
              <th style={{ border: '1px solid #9ca3af', padding: '6px', width: '12%' }}>Rate (₹)</th>
              <th style={{ border: '1px solid #9ca3af', padding: '6px', width: '8%' }}>Qty</th>
              <th style={{ border: '1px solid #9ca3af', padding: '6px', width: '15%' }}>Taxable Amt (₹)</th>
              <th style={{ border: '1px solid #9ca3af', padding: '6px', width: '15%' }}>Total (₹)</th>
            </tr>
          </thead>
          <tbody>
            {(inv.items || []).map((item, idx) => {
              const lineNet = item.netAmount || ((item.unitPrice || 0) * (item.qty || 1));
              return (
                <tr key={idx} style={{ textAlign: 'center' }}>
                  <td style={{ border: '1px solid #9ca3af', padding: '6px' }}>{idx + 1}</td>
                  <td style={{ border: '1px solid #9ca3af', padding: '6px', textAlign: 'left', fontWeight: '700' }}>{item.description || item.productName}</td>
                  <td style={{ border: '1px solid #9ca3af', padding: '6px' }}>{item.hsnCode || '-'}</td>
                  <td style={{ border: '1px solid #9ca3af', padding: '6px', textAlign: 'right' }}>{(item.unitPrice || 0).toLocaleString('en-IN')}</td>
                  <td style={{ border: '1px solid #9ca3af', padding: '6px' }}>{item.qty || 1}</td>
                  <td style={{ border: '1px solid #9ca3af', padding: '6px', textAlign: 'right' }}>{lineNet.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td style={{ border: '1px solid #9ca3af', padding: '6px', textAlign: 'right', fontWeight: '700' }}>{lineNet.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ flex: 1, border: '1px solid #9ca3af', padding: '8px', fontSize: '0.72rem' }}>
            <div style={{ fontWeight: '800', color: themeColor, marginBottom: '4px' }}>Bank Details:</div>
            <div>Bank: <strong>{inv.bankName}</strong></div>
            <div>A/C Name: <strong>{inv.bankAccountName}</strong></div>
            <div>A/C No: <strong>{inv.bankAccountNumber}</strong></div>
            <div>IFSC Code: <strong>{inv.bankIfscCode}</strong></div>
          </div>

          <div style={{ width: '280px', border: '1px solid #9ca3af', fontSize: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px', borderBottom: '1px solid #9ca3af' }}>
              <span>Subtotal:</span>
              <strong>{formatCurrency(inv.subtotal)}</strong>
            </div>
            {inv.invoiceType === 'Tax Invoice' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px', borderBottom: '1px solid #9ca3af' }}>
                <span>CGST (9%) + SGST (9%):</span>
                <strong>{formatCurrency(inv.taxTotal)}</strong>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 6px', background: themeColor, color: 'white', fontWeight: '900', fontSize: '0.9rem' }}>
              <span>Grand Total:</span>
              <span>{formatCurrency(inv.grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* CSS style injected to support print layouts cleanly */}
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
            transform: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}} />

      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: '#c084fc', fontWeight: '700', textTransform: 'uppercase' }}>
            Quote-to-Order Fulfillment & Billing
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '4px 0' }}>
            Orders & Invoice Management ({(orders || []).length})
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Track order status, generate customizable Cash or Tax invoices with custom logos & accounts, and print compliant bills.
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="btn gradient-btn-primary"
          style={{ gap: '8px' }}
        >
          <Plus style={{ width: '16px', height: '16px' }} />
          <span>Generate New Invoice</span>
        </button>
      </div>

      {/* Orders Table */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        {(!orders || orders.length === 0) ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <ShoppingBag style={{ width: '48px', height: '48px', marginBottom: '12px', opacity: 0.4 }} />
            <p>No orders registered yet. Generate a quotation and convert it to an order, or create a new invoice directly.</p>
          </div>
        ) : (
          <div className="custom-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Order Reference</th>
                  <th>Customer Name</th>
                  <th>Order Date</th>
                  <th>Invoice No</th>
                  <th>Type</th>
                  <th>Total Value</th>
                  <th>Status</th>
                  <th>Fulfillment</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {(orders || []).map(order => {
                  const orderId = order.id || 'N/A';
                  const customer = order.customerName || 'N/A';
                  const date = order.createdDate || order.orderDate || '';
                  const total = order.totalValue || order.totalAmount || order.grandTotal || 0;
                  const status = order.status || 'Pending';
                  const invoiceNum = order.invoiceNumber || `SI/2026/June/00${order.id?.split('-')[2] || '3'}`;
                  const type = order.invoiceType || 'Tax Invoice';

                  return (
                    <tr key={orderId}>
                      <td>
                        <code style={{ fontSize: '0.85rem', fontWeight: '800', color: '#34d399' }}>{orderId}</code>
                      </td>
                      <td>
                        <span style={{ fontWeight: '700' }}>{customer}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem' }}>{date}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.85rem', color: '#60a5fa', fontWeight: '600' }}>{invoiceNum}</span>
                      </td>
                      <td>
                        <span className={`badge ${type === 'Tax Invoice' ? 'badge-blue' : 'badge-purple'}`} style={{ fontSize: '0.7rem' }}>
                          {type}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: '800', color: '#34d399', fontSize: '0.95rem' }}>
                          {formatCurrency(total)}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${status === 'Shipped' || status === 'Completed' || status === 'Paid' ? 'badge-emerald' : 'badge-amber'}`}>
                          {status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: '600' }}>
                          <Truck style={{ width: '14px', height: '14px', color: '#60a5fa' }} />
                          <span>{status === 'Shipped' ? 'In Transit' : 'Warehouse Processing'}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <button
                            onClick={() => setSelectedInvoice(order)}
                            className="btn btn-secondary"
                            title="View Bill"
                            style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', color: '#60a5fa' }}
                          >
                            <Eye style={{ width: '12px', height: '12px' }} />
                            <span>View</span>
                          </button>
                          <button
                            onClick={() => handleEditInvoice(order)}
                            className="btn btn-secondary"
                            title="Edit Invoice"
                            style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', color: '#fbbf24', borderColor: 'rgba(251, 191, 36, 0.4)' }}
                          >
                            <Edit2 style={{ width: '12px', height: '12px' }} />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteInvoice(order)}
                            className="btn btn-secondary"
                            title="Delete Invoice"
                            style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                          >
                            <Trash2 style={{ width: '12px', height: '12px' }} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Creator Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '24px', maxWidth: '780px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>
                {editingInvoice ? `✏️ Edit Invoice (${editingInvoice.invoiceNumber || editingInvoice.id})` : 'Generate New Invoice & Order'}
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="btn-close" style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            {/* Template & Color Selector Theme Bar */}
            {renderThemeBar()}

            {/* Form vs Live Preview Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <button
                type="button"
                onClick={() => setCreatorTab('edit')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  border: creatorTab === 'edit' ? '1px solid #60a5fa' : '1px solid transparent',
                  background: creatorTab === 'edit' ? 'rgba(96, 165, 250, 0.2)' : 'transparent',
                  color: creatorTab === 'edit' ? '#60a5fa' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>📝 Edit Form Details</span>
              </button>
              <button
                type="button"
                onClick={() => setCreatorTab('preview')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  border: creatorTab === 'preview' ? '1px solid #34d399' : '1px solid transparent',
                  background: creatorTab === 'preview' ? 'rgba(52, 211, 153, 0.2)' : 'transparent',
                  color: creatorTab === 'preview' ? '#34d399' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>👁️ Live Template Preview</span>
              </button>
            </div>

            {/* Quick Actions Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.03)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
                Form Fill Controls:
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={populateDefaults}
                  className="btn btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '0.75rem', color: '#c084fc', borderColor: 'rgba(192, 132, 252, 0.4)', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Building2 style={{ width: '12px', height: '12px' }} /> Pre-fill Seller & Bank
                </button>
                <button
                  type="button"
                  onClick={handleClearAllFields}
                  className="btn btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '0.75rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Trash2 style={{ width: '12px', height: '12px' }} /> Clear All Fields (Empty)
                </button>
                <button
                  type="button"
                  onClick={handleLoadSampleData}
                  className="btn btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '0.75rem', color: '#60a5fa', borderColor: 'rgba(96, 165, 250, 0.4)' }}
                >
                  Load Demo Sample Data
                </button>
              </div>
            </div>

            {creatorTab === 'preview' ? (
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0f172a', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Live Template Preview (Real-time update from form)</span>
                  <span className="badge badge-purple" style={{ textTransform: 'uppercase' }}>
                    {selectedTemplate} Template • {primaryColor} Accent
                  </span>
                </div>
                {renderTemplateContent({
                  sellerName: sellerName.trim() || DEFAULT_SELLER_INFO.companyName,
                  sellerLogo: sellerLogo || null,
                  sellerAddress: sellerAddress.trim() || DEFAULT_SELLER_INFO.address,
                  sellerWebsite: sellerWebsite.trim() || DEFAULT_SELLER_INFO.website,
                  sellerGstin: sellerGstin.trim() || DEFAULT_SELLER_INFO.gstin,
                  bankName: bankName.trim() || DEFAULT_BANK_DETAILS.bankName,
                  bankAccountName: bankAccountName.trim() || DEFAULT_BANK_DETAILS.accountName,
                  bankAccountType: bankAccountType.trim() || 'Current Account',
                  bankAccountNumber: bankAccountNumber.trim() || DEFAULT_BANK_DETAILS.accountNumber,
                  bankIfscCode: bankIfscCode.trim() || DEFAULT_BANK_DETAILS.ifscCode,
                  bankBranch: bankBranch.trim() || DEFAULT_BANK_DETAILS.branch,
                  customerName: customerName.trim() || 'Acumen Global Solutions Ltd',
                  customerAddress: customerAddress.trim() || '78 Cyber Heights, Outer Ring Road, Bangalore',
                  customerState: customerState.trim() || 'Karnataka',
                  customerGstin: customerGstin.trim() || '29XYZAB5678C1Z2',
                  invoiceNumber: invoiceNumber || 'SI/2026/July/444',
                  invoiceType: invoiceType || 'Tax Invoice',
                  invoiceDate: invoiceDate || new Date().toISOString().split('T')[0],
                  paymentStatus: 'Paid',
                  reverseCharge: reverseCharge || 'N',
                  template: selectedTemplate,
                  primaryColor,
                  items: items.length > 0 && items[0].description.trim() ? items.map(item => ({
                    ...item,
                    netAmount: (parseFloat(item.unitPrice) || 0) * (parseInt(item.qty) || 1)
                  })) : [
                    { description: 'Cloud Infrastructure & Enterprise SaaS License', hsnCode: '99831', unitPrice: 75000, qty: 1, netAmount: 75000 }
                  ],
                  subtotal: totals.subtotal > 0 ? totals.subtotal : 75000,
                  cgstAmount: totals.cgstAmount > 0 ? totals.cgstAmount : 6750,
                  sgstAmount: totals.sgstAmount > 0 ? totals.sgstAmount : 6750,
                  taxTotal: totals.taxTotal > 0 ? totals.taxTotal : 13500,
                  shipping: shipping || 0,
                  grandTotal: totals.grandTotal > 0 ? totals.grandTotal : 88500
                })}
              </div>
            ) : (
              <form onSubmit={handleCreateInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* Seller & Bank Details (Fully visible by default) */}
                <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(255, 255, 255, 0.02)' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#c084fc', margin: '0 0 4px 0' }}>🏢 Seller Company Details</h4>

                  {/* Company info row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Company Name (Seller)</label>
                      <input
                        type="text"
                        placeholder="e.g. Sanna Innovations"
                        value={sellerName}
                        onChange={(e) => setSellerName(e.target.value)}
                        className="form-input"
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Company GSTIN/PAN</label>
                      <input
                        type="text"
                        placeholder="e.g. 29BNJPS7776J1ZW"
                        value={sellerGstin}
                        onChange={(e) => setSellerGstin(e.target.value)}
                        className="form-input"
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Website URL</label>
                      <input
                        type="text"
                        placeholder="e.g. www.sannainnovations.com"
                        value={sellerWebsite}
                        onChange={(e) => setSellerWebsite(e.target.value)}
                        className="form-input"
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Company Logo</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          style={{ fontSize: '0.7rem', color: 'var(--text-primary)', width: '150px' }}
                        />
                        {sellerLogo && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <img src={sellerLogo} style={{ height: '24px', maxWidth: '40px', objectFit: 'contain', border: '1px solid var(--border-color)', borderRadius: '3px' }} alt="Preview" />
                            <button type="button" onClick={() => setSellerLogo('')} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.65rem', cursor: 'pointer' }}>Clear</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Company Full Address</label>
                    <input
                      type="text"
                      placeholder="e.g. #1203, 1st Main, M.C. Layout, Vijayanagar, Bangalore - 560040"
                      value={sellerAddress}
                      onChange={(e) => setSellerAddress(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  {/* Bank Details block */}
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '4px' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: '800', marginBottom: '8px', color: '#c084fc' }}>🏦 Bank Account Details</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Bank Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Kotak Mahindra Bank"
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          className="form-input"
                          style={{ padding: '6px', fontSize: '0.8rem' }}
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Account Holder Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Sanna Innovations"
                          value={bankAccountName}
                          onChange={(e) => setBankAccountName(e.target.value)}
                          className="form-input"
                          style={{ padding: '6px', fontSize: '0.8rem' }}
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Account Type</label>
                        <input
                          type="text"
                          placeholder="e.g. Current Account"
                          value={bankAccountType}
                          onChange={(e) => setBankAccountType(e.target.value)}
                          className="form-input"
                          style={{ padding: '6px', fontSize: '0.8rem' }}
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Account Number</label>
                        <input
                          type="text"
                          placeholder="e.g. 6450725722"
                          value={bankAccountNumber}
                          onChange={(e) => setBankAccountNumber(e.target.value)}
                          className="form-input"
                          style={{ padding: '6px', fontSize: '0.8rem' }}
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: '600', color: 'var(--text-secondary)' }}>IFSC Code</label>
                        <input
                          type="text"
                          placeholder="e.g. KKBK0008035"
                          value={bankIfscCode}
                          onChange={(e) => setBankIfscCode(e.target.value)}
                          className="form-input"
                          style={{ padding: '6px', fontSize: '0.8rem' }}
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Branch Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Basaveshwaranagar"
                          value={bankBranch}
                          onChange={(e) => setBankBranch(e.target.value)}
                          className="form-input"
                          style={{ padding: '6px', fontSize: '0.8rem' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Invoice Type</label>
                    <select
                      value={invoiceType}
                      onChange={(e) => setInvoiceType(e.target.value)}
                      className="form-input"
                      style={{ background: 'var(--card-bg-light)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', padding: '8px' }}
                    >
                      <option value="Tax Invoice">Tax Invoice</option>
                      <option value="Cash Bill">Cash Bill</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Invoice Number</label>
                    <input
                      type="text"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Invoice Date</label>
                    <input
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Customer Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Acumen Global Solutions"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Customer State</label>
                    <input
                      type="text"
                      value={customerState}
                      onChange={(e) => setCustomerState(e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>

                  {invoiceType === 'Tax Invoice' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Customer GSTIN</label>
                      <input
                        type="text"
                        placeholder="e.g. 29XYZAB5678C1Z2"
                        value={customerGstin}
                        onChange={(e) => setCustomerGstin(e.target.value)}
                        className="form-input"
                      />
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Reverse Charge (Y/N)</label>
                    <select
                      value={reverseCharge}
                      onChange={(e) => setReverseCharge(e.target.value)}
                      className="form-input"
                      style={{ background: 'var(--card-bg-light)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', padding: '8px' }}
                    >
                      <option value="N">N</option>
                      <option value="Y">Y</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Shipping Charge (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={shipping}
                      onChange={(e) => setShipping(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="form-input"
                    />
                  </div>

                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Customer Full Address</label>
                  <textarea
                    placeholder="Street address, block, building details..."
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="form-input"
                    style={{ height: '50px', resize: 'none', padding: '8px' }}
                  />
                </div>

                {/* Line Items Builder */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: '700' }}>Line Items</h4>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="btn btn-secondary"
                      style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Plus style={{ width: '12px', height: '12px' }} /> Add Item
                    </button>
                  </div>

                  <div style={{ overflowX: 'auto', maxHeight: '180px' }}>
                    <table className="custom-table" style={{ fontSize: '0.8rem' }}>
                      <thead>
                        <tr>
                          <th style={{ width: '40%' }}>Description</th>
                          <th style={{ width: '15%' }}>HSN/SAC</th>
                          <th style={{ width: '20%' }}>Unit Price (₹)</th>
                          <th style={{ width: '15%' }}>Qty</th>
                          <th style={{ width: '10%' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, idx) => (
                          <tr key={idx}>
                            <td>
                              <input
                                type="text"
                                required
                                placeholder="e.g. Brochure Design Balance"
                                value={item.description}
                                onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                                className="form-input"
                                style={{ padding: '6px', fontSize: '0.8rem' }}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                required
                                value={item.hsnCode}
                                onChange={(e) => handleItemChange(idx, 'hsnCode', e.target.value)}
                                className="form-input"
                                style={{ padding: '6px', fontSize: '0.8rem' }}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                min="0"
                                required
                                value={item.unitPrice}
                                onChange={(e) => handleItemChange(idx, 'unitPrice', Math.max(0, parseFloat(e.target.value) || 0))}
                                className="form-input"
                                style={{ padding: '6px', fontSize: '0.8rem' }}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                min="1"
                                required
                                value={item.qty}
                                onChange={(e) => handleItemChange(idx, 'qty', Math.max(1, parseInt(e.target.value) || 1))}
                                className="form-input"
                                style={{ padding: '6px', fontSize: '0.8rem' }}
                              />
                            </td>
                            <td>
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                disabled={items.length <= 1}
                                className="btn btn-secondary"
                                style={{ padding: '6px', color: '#ef4444', opacity: items.length <= 1 ? 0.4 : 1 }}
                              >
                                <Trash2 style={{ width: '14px', height: '14px' }} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Summary calculations */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--card-bg-light)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    CGST: 9% | SGST: 9% (Only applicable to Tax Invoices)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'right' }}>
                    <div style={{ fontSize: '0.85rem' }}>Subtotal: <strong>{formatCurrency(totals.subtotal)}</strong></div>
                    {invoiceType === 'Tax Invoice' && (
                      <div style={{ fontSize: '0.85rem', color: '#60a5fa' }}>CGST (9%) + SGST (9%): <strong>{formatCurrency(totals.taxTotal)}</strong></div>
                    )}
                    {shipping > 0 && <div style={{ fontSize: '0.85rem' }}>Shipping: <strong>{formatCurrency(shipping)}</strong></div>}
                    <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#34d399', borderTop: '1px solid var(--border-color)', paddingTop: '4px', marginTop: '4px' }}>
                      Grand Total: {formatCurrency(totals.grandTotal)}
                    </div>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                  <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">Cancel</button>
                  <button type="submit" className="btn gradient-btn-primary">
                    {editingInvoice ? '💾 Update & Save Invoice' : 'Save Order & Generate Bill'}
                  </button>
                </div>

              </form>
            )}
          </div>
        </div>
      )}

      {/* Invoice Viewer Modal */}
      {selectedInvoice && activeInvoice && (
        <div className="modal-overlay">
          <div className="modal-content print-area" style={{
            padding: '40px',
            maxWidth: '920px',
            width: '100%',
            background: '#ffffff',
            color: '#1f2937',
            fontFamily: 'sans-serif',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
            borderRadius: '8px'
          }}>

            {/* Close & Print Buttons for UI only */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>
              <span style={{ fontWeight: '700', fontSize: '1rem', color: '#374151' }}>Invoice Preview Panel</span>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    const inv = selectedInvoice;
                    setSelectedInvoice(null);
                    handleEditInvoice(inv);
                  }}
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24', borderColor: 'rgba(251, 191, 36, 0.4)' }}
                >
                  <Edit2 style={{ width: '15px', height: '15px' }} /> Edit Invoice
                </button>
                <button
                  onClick={() => {
                    const inv = selectedInvoice;
                    handleDeleteInvoice(inv);
                  }}
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                >
                  <Trash2 style={{ width: '15px', height: '15px' }} /> Delete
                </button>
                <button onClick={() => window.print()} className="btn gradient-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Printer style={{ width: '16px', height: '16px' }} /> Print Invoice
                </button>
                <button onClick={() => setSelectedInvoice(null)} className="btn btn-secondary" style={{ color: '#ef4444' }}>
                  Close
                </button>
              </div>
            </div>

            {/* Print Area Contents */}
            <div style={{ border: '1px solid #9ca3af', padding: '16px' }}>

              {/* Header Top Section (Logo and Title table) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                {/* Logo & Company details */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>

                  {/* Dynamic Logo Rendering */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '140px', border: '1px solid #e5e7eb', padding: '8px', borderRadius: '4px', background: '#fafafa' }}>
                    {activeInvoice.sellerLogo ? (
                      <img src={activeInvoice.sellerLogo} style={{ maxHeight: '55px', maxWidth: '120px', objectFit: 'contain', marginBottom: '4px' }} alt="Logo" />
                    ) : (
                      <>
                        <div style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)', width: '44px', height: '44px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', border: '2px solid #eab308', alignSelf: 'center' }}>
                          <span style={{ color: '#eab308', fontSize: '1.5rem', fontWeight: '800', fontFamily: 'sans-serif', lineHeight: '44px', textAlign: 'center' }}>
                            {activeInvoice.sellerName?.charAt(0) || 'S'}
                          </span>
                        </div>
                        <div style={{ color: '#b91c1c', fontWeight: '900', fontSize: '1.1rem', letterSpacing: '1px', marginTop: '4px', fontFamily: 'sans-serif', lineHeight: 1, textTransform: 'uppercase', textAlign: 'center' }}>
                          {activeInvoice.sellerName?.split(' ')[0] || 'SANNA'}
                        </div>
                        <div style={{ color: '#22c55e', fontWeight: '700', fontSize: '0.5rem', letterSpacing: '2px', fontFamily: 'sans-serif', lineHeight: 1, marginTop: '2px', textTransform: 'uppercase', textAlign: 'center' }}>
                          {activeInvoice.sellerName?.split(' ').slice(1).join(' ') || 'INNOVATIONS'}
                        </div>
                      </>
                    )}
                    <div style={{ color: '#6b7280', fontStyle: 'italic', fontSize: '0.45rem', marginTop: '2px' }}>Delivering Reality...</div>
                  </div>

                </div>

                {/* Billing Metadata Grid */}
                <div style={{ width: '320px', border: '1px solid #9ca3af', borderCollapse: 'collapse' }}>
                  <div style={{ background: '#b91c1c', color: 'white', fontWeight: '800', textAlign: 'center', padding: '6px', fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {activeInvoice.invoiceType}
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                    <tbody>
                      <tr style={{ borderTop: '1px solid #9ca3af' }}>
                        <td style={{ padding: '6px', fontWeight: '700', borderRight: '1px solid #9ca3af', width: '40%' }}>Invoice Date</td>
                        <td style={{ padding: '6px' }}>{activeInvoice.invoiceDate}</td>
                      </tr>
                      <tr style={{ borderTop: '1px solid #9ca3af' }}>
                        <td style={{ padding: '6px', fontWeight: '700', borderRight: '1px solid #9ca3af' }}>Invoice No</td>
                        <td style={{ padding: '6px', fontWeight: '700' }}>{activeInvoice.invoiceNumber}</td>
                      </tr>
                      <tr style={{ borderTop: '1px solid #9ca3af' }}>
                        <td style={{ padding: '6px', fontWeight: '700', borderRight: '1px solid #9ca3af' }}>GSTIN/PAN</td>
                        <td style={{ padding: '6px', fontSize: '0.7rem' }}>{activeInvoice.sellerGstin}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Customer Details Block */}
              <div style={{ border: '1px solid #9ca3af', marginBottom: '20px' }}>
                <div style={{ background: '#b91c1c', color: 'white', fontWeight: '700', padding: '6px', fontSize: '0.8rem' }}>
                  Customer:
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '6px', fontWeight: '700', borderRight: '1px solid #9ca3af', width: '150px' }}>Name:</td>
                      <td style={{ padding: '6px', fontWeight: '700' }}>{activeInvoice.customerName}</td>
                    </tr>
                    <tr style={{ borderTop: '1px solid #9ca3af' }}>
                      <td style={{ padding: '6px', fontWeight: '700', borderRight: '1px solid #9ca3af' }}>Address:</td>
                      <td style={{ padding: '6px', fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>{activeInvoice.customerAddress}</td>
                    </tr>
                    <tr style={{ borderTop: '1px solid #9ca3af' }}>
                      <td style={{ padding: '6px', fontWeight: '700', borderRight: '1px solid #9ca3af' }}>State :</td>
                      <td style={{ padding: '6px', color: '#1d4ed8', fontWeight: '700' }}>{activeInvoice.customerState}</td>
                    </tr>
                    <tr style={{ borderTop: '1px solid #9ca3af' }}>
                      <td style={{ padding: '6px', fontWeight: '700', borderRight: '1px solid #9ca3af' }}>GSTIN:</td>
                      <td style={{ padding: '6px', fontWeight: '700' }}>{activeInvoice.customerGstin || 'N/A'}</td>
                    </tr>
                    <tr style={{ borderTop: '1px solid #9ca3af' }}>
                      <td style={{ padding: '6px', fontWeight: '700', borderRight: '1px solid #9ca3af' }}>Reverse Charge (Y/N):</td>
                      <td style={{ padding: '6px', fontWeight: '700' }}>{activeInvoice.reverseCharge}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Line Items Main Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #9ca3af', fontSize: '0.75rem', marginBottom: '20px' }}>
                <thead>
                  <tr style={{ background: '#b91c1c', color: 'white', fontWeight: '700' }}>
                    <th style={{ padding: '8px', border: '1px solid #9ca3af', width: '5%', textAlign: 'center' }}>SL No.</th>
                    <th style={{ padding: '8px', border: '1px solid #9ca3af', width: '30%', textAlign: 'left' }}>Description</th>
                    <th style={{ padding: '8px', border: '1px solid #9ca3af', width: '10%', textAlign: 'center' }}>HSN/SAC Code</th>
                    <th style={{ padding: '8px', border: '1px solid #9ca3af', width: '10%', textAlign: 'right' }}>Unite price</th>
                    <th style={{ padding: '8px', border: '1px solid #9ca3af', width: '5%', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '8px', border: '1px solid #9ca3af', width: '10%', textAlign: 'right' }}>Net Amount</th>
                    <th style={{ padding: '8px', border: '1px solid #9ca3af', width: '10%', textAlign: 'center' }} colSpan="2">CGST</th>
                    <th style={{ padding: '8px', border: '1px solid #9ca3af', width: '10%', textAlign: 'center' }} colSpan="2">SGST</th>
                    <th style={{ padding: '8px', border: '1px solid #9ca3af', width: '10%', textAlign: 'right' }}>Total Tax Amount</th>
                    <th style={{ padding: '8px', border: '1px solid #9ca3af', width: '10%', textAlign: 'right' }}>Total Amount</th>
                  </tr>
                  <tr style={{ background: '#f3f4f6', color: '#374151' }}>
                    <th colSpan="6" style={{ border: '1px solid #9ca3af' }}></th>
                    <th style={{ padding: '4px', border: '1px solid #9ca3af', textAlign: 'center', width: '4%' }}>%</th>
                    <th style={{ padding: '4px', border: '1px solid #9ca3af', textAlign: 'right', width: '6%' }}>Amount</th>
                    <th style={{ padding: '4px', border: '1px solid #9ca3af', textAlign: 'center', width: '4%' }}>%</th>
                    <th style={{ padding: '4px', border: '1px solid #9ca3af', textAlign: 'right', width: '6%' }}>Amount</th>
                    <th colSpan="2" style={{ border: '1px solid #9ca3af' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {activeInvoice.items.map((item, index) => {
                    const netAmount = item.netAmount || (item.unitPrice * item.qty);
                    const isTax = activeInvoice.invoiceType === 'Tax Invoice';
                    const cgstPercent = isTax ? (item.cgstRate !== undefined ? item.cgstRate : 9) : 0;
                    const sgstPercent = isTax ? (item.sgstRate !== undefined ? item.sgstRate : 9) : 0;
                    const cgstAmt = item.cgstAmount || (isTax ? netAmount * 0.09 : 0);
                    const sgstAmt = item.sgstAmount || (isTax ? netAmount * 0.09 : 0);
                    const totalTax = item.taxTotal || (cgstAmt + sgstAmt);
                    const totalAmount = item.totalAmount || (netAmount + totalTax);

                    return (
                      <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '8px', border: '1px solid #9ca3af', textAlign: 'center' }}>{index + 1}</td>
                        <td style={{ padding: '8px', border: '1px solid #9ca3af', textAlign: 'left', fontWeight: '600' }}>{item.description || item.productName}</td>
                        <td style={{ padding: '8px', border: '1px solid #9ca3af', textAlign: 'center' }}>{item.hsnCode || '99831'}</td>
                        <td style={{ padding: '8px', border: '1px solid #9ca3af', textAlign: 'right' }}>{item.unitPrice?.toFixed(2)}</td>
                        <td style={{ padding: '8px', border: '1px solid #9ca3af', textAlign: 'center' }}>{item.qty}</td>
                        <td style={{ padding: '8px', border: '1px solid #9ca3af', textAlign: 'right' }}>{netAmount.toFixed(2)}</td>
                        <td style={{ padding: '8px', border: '1px solid #9ca3af', textAlign: 'center' }}>{cgstPercent}%</td>
                        <td style={{ padding: '8px', border: '1px solid #9ca3af', textAlign: 'right' }}>{cgstAmt.toFixed(2)}</td>
                        <td style={{ padding: '8px', border: '1px solid #9ca3af', textAlign: 'center' }}>{sgstPercent}%</td>
                        <td style={{ padding: '8px', border: '1px solid #9ca3af', textAlign: 'right' }}>{sgstAmt.toFixed(2)}</td>
                        <td style={{ padding: '8px', border: '1px solid #9ca3af', textAlign: 'right' }}>{totalTax.toFixed(2)}</td>
                        <td style={{ padding: '8px', border: '1px solid #9ca3af', textAlign: 'right', fontWeight: '700' }}>{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    );
                  })}
                  {/* Totals Row */}
                  <tr style={{ background: '#f3f4f6', fontWeight: '700' }}>
                    <td colSpan="5" style={{ padding: '8px', border: '1px solid #9ca3af', textAlign: 'right' }}>Total:</td>
                    <td style={{ padding: '8px', border: '1px solid #9ca3af', textAlign: 'right' }}>{activeInvoice.subtotal?.toFixed(2)}</td>
                    <td style={{ border: '1px solid #9ca3af' }}></td>
                    <td style={{ padding: '8px', border: '1px solid #9ca3af', textAlign: 'right' }}>{activeInvoice.cgstAmount?.toFixed(2)}</td>
                    <td style={{ border: '1px solid #9ca3af' }}></td>
                    <td style={{ padding: '8px', border: '1px solid #9ca3af', textAlign: 'right' }}>{activeInvoice.sgstAmount?.toFixed(2)}</td>
                    <td style={{ padding: '8px', border: '1px solid #9ca3af', textAlign: 'right' }}>{activeInvoice.taxTotal?.toFixed(2)}</td>
                    <td style={{ padding: '8px', border: '1px solid #9ca3af', textAlign: 'right', background: '#e5e7eb', color: '#1f2937' }}>
                      {formatCurrency(activeInvoice.grandTotal - activeInvoice.shipping)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Amount In Words & Final Calculations */}
              <div style={{ display: 'flex', border: '1px solid #9ca3af', marginBottom: '20px' }}>
                <div style={{ flex: 1, padding: '8px', borderRight: '1px solid #9ca3af' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#b91c1c' }}>Amount In words :</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '800', marginTop: '4px' }}>
                    {numberToWords(activeInvoice.grandTotal)}
                  </div>
                </div>
                <div style={{ width: '320px', fontSize: '0.8rem' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: '6px', fontWeight: '700', borderRight: '1px solid #9ca3af', width: '50%' }}>Subtotal</td>
                        <td style={{ padding: '6px', textAlign: 'right', fontWeight: '700' }}>{formatCurrency(activeInvoice.subtotal)}</td>
                      </tr>
                      <tr style={{ borderTop: '1px solid #9ca3af' }}>
                        <td style={{ padding: '6px', fontWeight: '700', borderRight: '1px solid #9ca3af' }}>Shipping</td>
                        <td style={{ padding: '6px', textAlign: 'right' }}>{formatCurrency(activeInvoice.shipping)}</td>
                      </tr>
                      <tr style={{ borderTop: '1px solid #9ca3af', background: '#f3f4f6' }}>
                        <td style={{ padding: '6px', fontWeight: '800', borderRight: '1px solid #9ca3af' }}>Total</td>
                        <td style={{ padding: '6px', textAlign: 'right', fontWeight: '900', color: '#b91c1c', fontSize: '0.95rem' }}>{formatCurrency(activeInvoice.grandTotal)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Terms and Conditions & Account Sign off */}
              <div style={{ borderTop: '1px solid #9ca3af', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#4b5563' }}>
                <div style={{ width: '60%' }}>
                  <div style={{ fontWeight: '700', textDecoration: 'underline', marginBottom: '4px', color: '#1f2937' }}>Terms & Conditions:</div>
                  <div style={{ display: 'flex', gap: '24px' }}>
                    <div>
                      <div><strong>Invoice</strong>: Invoice will be submitted as per actuals.</div>
                      <div><strong>Prices</strong>: FOR India Only</div>
                    </div>
                  </div>
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ fontWeight: '700', color: '#1f2937' }}>Account Details</div>
                    <div>{activeInvoice.bankName}</div>
                    <div>Account Name- {activeInvoice.bankAccountName}</div>
                    <div>Account Type- {activeInvoice.bankAccountType}</div>
                    <div>Account Number : {activeInvoice.bankAccountNumber}</div>
                    <div>IFSC Code: {activeInvoice.bankIfscCode}</div>
                    <div>Branch : {activeInvoice.bankBranch}</div>
                  </div>
                </div>

                <div style={{ width: '35%', display: 'flex', flexDirection: 'column', alignSelf: 'stretch', justifyContent: 'space-between', alignItems: 'flex-end', textAlign: 'right' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#1f2937' }}>
                      For <span style={{ color: '#b91c1c', textTransform: 'uppercase' }}>{activeInvoice.sellerName}</span>
                    </div>
                    {/* Simulated Signature Line */}
                    <div style={{ height: '36px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', width: '120px', borderBottom: '1px dashed #9ca3af', marginBottom: '2px', position: 'relative' }}>
                      <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#1d4ed8', fontSize: '1rem', fontWeight: 'bold', transform: 'rotate(-4deg)', display: 'block', position: 'absolute', bottom: '2px' }}>
                        {activeInvoice.sellerName?.charAt(0) || 'S'}
                        {activeInvoice.sellerName?.split(' ')[1]?.charAt(0) || 'A'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.6rem', fontWeight: '700' }}>Authorised Signatory</div>
                  </div>
                </div>
              </div>

              {/* Bottom red address footer banner */}
              <div style={{ background: '#b91c1c', color: 'white', padding: '8px', textAlign: 'center', fontSize: '0.7rem', fontWeight: '700', marginTop: '20px', borderRadius: '2px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                <span>{activeInvoice.sellerAddress}</span>
                <span>|</span>
                <a href={`https://${activeInvoice.sellerWebsite}`} target="_blank" rel="noreferrer" style={{ color: 'white', textDecoration: 'none' }}>{activeInvoice.sellerWebsite}</a>
              </div>

            </div>
          </div>
        </div>
      )}
      {/* Template Sample Modal */}
      {sampleModalTemplate && (
        <div className="modal-overlay">
          <div className="modal-content print-area" style={{
            padding: '24px',
            maxWidth: '900px',
            width: '95%',
            background: '#ffffff',
            color: '#1f2937',
            borderRadius: '10px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e293b', margin: 0 }}>
                  👁️ Sample Invoice Preview: <span style={{ color: primaryColor, textTransform: 'capitalize' }}>{sampleModalTemplate} Template</span>
                </h3>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  This is a realistic sample demonstration of how your invoice will look using the {sampleModalTemplate} layout.
                </div>
              </div>
              <button
                onClick={() => setSampleModalTemplate(null)}
                className="btn btn-secondary"
                style={{ color: '#ef4444' }}
              >
                Close Sample
              </button>
            </div>

            {renderTemplateContent({
              sellerName: DEFAULT_SELLER_INFO.companyName,
              sellerLogo: null,
              sellerAddress: DEFAULT_SELLER_INFO.address,
              sellerWebsite: DEFAULT_SELLER_INFO.website,
              sellerGstin: DEFAULT_SELLER_INFO.gstin,
              bankName: DEFAULT_BANK_DETAILS.bankName,
              bankAccountName: DEFAULT_BANK_DETAILS.accountName,
              bankAccountType: 'Current Account',
              bankAccountNumber: DEFAULT_BANK_DETAILS.accountNumber,
              bankIfscCode: DEFAULT_BANK_DETAILS.ifscCode,
              bankBranch: DEFAULT_BANK_DETAILS.branch,
              customerName: 'Acumen Global Solutions Ltd',
              customerAddress: '78 Cyber Heights, Outer Ring Road, Bangalore - 560103',
              customerState: 'Karnataka',
              customerGstin: '29XYZAB5678C1Z2',
              invoiceNumber: 'SI/2026/July/444',
              invoiceType: 'Tax Invoice',
              invoiceDate: new Date().toISOString().split('T')[0],
              paymentStatus: 'Paid',
              reverseCharge: 'N',
              template: sampleModalTemplate,
              primaryColor: primaryColor || '#2563eb',
              items: [
                { description: 'Cloud Infrastructure & Enterprise SaaS License', hsnCode: '99831', unitPrice: 75000, qty: 1, netAmount: 75000 },
                { description: 'Custom Integration & Maintenance Support', hsnCode: '99832', unitPrice: 25000, qty: 1, netAmount: 25000 }
              ],
              subtotal: 100000,
              cgstAmount: 9000,
              sgstAmount: 9000,
              taxTotal: 18000,
              shipping: 0,
              grandTotal: 118000
            })}
          </div>
        </div>
      )}

    </div>
  );
};

export default OrderInvoiceManager;
