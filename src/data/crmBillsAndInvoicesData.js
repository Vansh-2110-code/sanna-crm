/**
 * Initial Bills, Invoices, Orders & Cash Receipts Dataset
 * Seeded with all real client transactions across Sanna Innovations
 */

import { DEFAULT_SELLER_INFO, DEFAULT_BANK_DETAILS } from '../components/finance/GSTInvoiceManager';

export const INITIAL_SANNA_BILLS = [
  {
    id: 'inv-bharadwaj-006',
    invoiceNumber: 'SI/2026/August/006',
    invoiceDate: '2026-08-06',
    invoiceType: 'Tax Invoice',
    clientName: 'Bharadwaj Enterprises',
    billingAddress: 'No. 45, 2nd Main, Industrial Suburb, Yeshwanthpur, Bangalore - 560022',
    clientState: 'Karnataka',
    clientGSTIN: '29AAAFB1234F1Z5',
    reverseCharge: 'N',
    shippingCharge: 0,
    billingMonth: 8,
    billingYear: 2026,
    paymentStatus: 'Paid',
    paymentMode: 'Bank Transfer',
    remarks: 'Website Hosting, Domain Registration & Web Development Suite',
    template: 'red-classic',
    sellerInfo: DEFAULT_SELLER_INFO,
    bankDetails: DEFAULT_BANK_DETAILS,
    lineItems: [
      { description: 'Website Hosting charges for 1 year', hsnSac: '998315', unitPrice: 6000.00, qty: 1, gstPercent: 18, base: '6000.00', gstAmt: '1080.00', total: '7080.00' },
      { description: 'Domain Registration & SSL Certificate (1 Year)', hsnSac: '998314', unitPrice: 2000.00, qty: 1, gstPercent: 18, base: '2000.00', gstAmt: '360.00', total: '2360.00' },
      { description: 'Website Designing and Development Retainer', hsnSac: '998315', unitPrice: 4000.00, qty: 1, gstPercent: 18, base: '4000.00', gstAmt: '720.00', total: '4720.00' }
    ],
    subtotal: '12000.00',
    totalGST: '2160.00',
    grandTotal: '14160.00'
  },
  {
    id: 'inv-imagen-036',
    invoiceNumber: 'SI/AUG/2026/036',
    invoiceDate: '2026-08-10',
    invoiceType: 'Cash Bill',
    clientName: 'Imagen Engineering and Projects',
    billingAddress: 'Peenya 1st Stage, Near TVS Cross, Bangalore - 560058',
    clientState: 'Karnataka',
    clientGSTIN: '',
    reverseCharge: 'N',
    shippingCharge: 0,
    billingMonth: 8,
    billingYear: 2026,
    paymentStatus: 'Paid',
    paymentMode: 'Cash',
    remarks: 'Logo Redesigning, Vector Suite & Corporate Identity - Paid in Cash',
    template: 'red-classic',
    sellerInfo: DEFAULT_SELLER_INFO,
    bankDetails: DEFAULT_BANK_DETAILS,
    lineItems: [
      { description: 'Logo Redesigning and Vectorization Suite', hsnSac: '998314', unitPrice: 3000.00, qty: 1, gstPercent: 0, base: '3000.00', gstAmt: '0.00', total: '3000.00' },
      { description: 'Corporate Identity, Business Card & Stationery Layouts', hsnSac: '998314', unitPrice: 5000.00, qty: 1, gstPercent: 0, base: '5000.00', gstAmt: '0.00', total: '5000.00' }
    ],
    subtotal: '8000.00',
    totalGST: '0.00',
    grandTotal: '8000.00'
  },
  {
    id: 'inv-klwb-003',
    invoiceNumber: 'SI/2026/Aug/003',
    invoiceDate: '2026-08-03',
    invoiceType: 'Tax Invoice',
    clientName: 'The Welfare Commissioner, Karnataka Labour Welfare Board',
    billingAddress: 'Karmika Bhavana, Bannerghatta Road, Bangalore - 560029',
    clientState: 'Karnataka',
    clientGSTIN: '29BLWB0001G1Z1',
    reverseCharge: 'N',
    shippingCharge: 0,
    billingMonth: 8,
    billingYear: 2026,
    paymentStatus: 'Paid',
    paymentMode: 'Bank Transfer',
    remarks: 'Custom Government Portal Module Development & Server Maintenance',
    template: 'red-classic',
    sellerInfo: DEFAULT_SELLER_INFO,
    bankDetails: {
      bankName: 'Veerashaiva Sahakari Bank Ltd',
      accountName: 'Sanna Innovations',
      accountNumber: '00100010001234',
      ifscCode: 'VSBL0000001',
      branch: 'Vijayanagar, Bangalore'
    },
    lineItems: [
      { description: 'Module Development and Maintenance of Labour Welfare Portal', hsnSac: '998315', unitPrice: 64000.00, qty: 1, gstPercent: 18, base: '64000.00', gstAmt: '11520.00', total: '75520.00' }
    ],
    subtotal: '64000.00',
    totalGST: '11520.00',
    grandTotal: '75520.00'
  },
  {
    id: 'inv-sahara-005',
    invoiceNumber: 'SI/2026/August/005',
    invoiceDate: '2026-08-05',
    invoiceType: 'Tax Invoice',
    clientName: 'Sahara Transformers Pvt Ltd',
    billingAddress: '60/2 Seegehalli Gate Magadi Main Road, Bangalore - 560091',
    clientState: 'Karnataka',
    clientGSTIN: '29BNJPS7776J1ZW',
    reverseCharge: 'N',
    shippingCharge: 0,
    billingMonth: 8,
    billingYear: 2026,
    paymentStatus: 'Paid',
    paymentMode: 'Bank Transfer',
    remarks: 'Annual Dedicated Cloud Server VPS & Domain Vault Renewal',
    template: 'red-classic',
    sellerInfo: DEFAULT_SELLER_INFO,
    bankDetails: DEFAULT_BANK_DETAILS,
    lineItems: [
      { description: 'Website Hosting charges for 1 year', hsnSac: '998315', unitPrice: 6500.00, qty: 1, gstPercent: 18, base: '6500.00', gstAmt: '1170.00', total: '7670.00' },
      { description: 'Domain Renewal Charges', hsnSac: '998314', unitPrice: 1999.00, qty: 1, gstPercent: 18, base: '1999.00', gstAmt: '359.82', total: '2358.82' }
    ],
    subtotal: '8499.00',
    totalGST: '1529.82',
    grandTotal: '10028.82'
  },
  {
    id: 'inv-nirmal-001',
    invoiceNumber: 'SI/CB/2026/Aug/001',
    invoiceDate: '2026-08-01',
    invoiceType: 'Cash Bill',
    clientName: 'Nirmal',
    billingAddress: 'Bangalore, Karnataka',
    clientState: 'Karnataka',
    clientGSTIN: '',
    reverseCharge: 'N',
    shippingCharge: 0,
    billingMonth: 8,
    billingYear: 2026,
    paymentStatus: 'Paid',
    paymentMode: 'Cash',
    remarks: 'Project Service Charge - Settled in Full',
    template: 'red-classic',
    sellerInfo: DEFAULT_SELLER_INFO,
    bankDetails: DEFAULT_BANK_DETAILS,
    lineItems: [
      { description: 'Comprehensive Digital Marketing & Project Service Charge', hsnSac: '998313', unitPrice: 42480.00, qty: 1, gstPercent: 0, base: '42480.00', gstAmt: '0.00', total: '42480.00' }
    ],
    subtotal: '42480.00',
    totalGST: '0.00',
    grandTotal: '42480.00'
  },
  {
    id: 'inv-chaitanya-003',
    invoiceNumber: 'SI/2026/Aug/004',
    invoiceDate: '2026-08-05',
    invoiceType: 'Tax Invoice',
    clientName: 'Chaitanya Electric Company',
    billingAddress: 'Sy.No.60/2, Magadi Main Rd, Seegehalli, Bengaluru, Karnataka 560112',
    clientState: 'Karnataka',
    clientGSTIN: '29BKUPS2041A1Z2',
    reverseCharge: 'N',
    shippingCharge: 0,
    billingMonth: 8,
    billingYear: 2026,
    paymentStatus: 'Paid',
    paymentMode: 'Bank Transfer',
    remarks: 'Annual Cloud Hosting & Domain Maintenance Package',
    template: 'red-classic',
    sellerInfo: DEFAULT_SELLER_INFO,
    bankDetails: DEFAULT_BANK_DETAILS,
    lineItems: [
      { description: 'Dedicated Cloud Server VPS & Hosting Maintenance', hsnSac: '998315', unitPrice: 6500.00, qty: 1, gstPercent: 18, base: '6500.00', gstAmt: '1170.00', total: '7670.00' },
      { description: 'Domain Registration & SSL Vault Renewal', hsnSac: '998314', unitPrice: 1999.00, qty: 1, gstPercent: 18, base: '1999.00', gstAmt: '359.82', total: '2358.82' }
    ],
    subtotal: '8499.00',
    totalGST: '1529.82',
    grandTotal: '10028.82'
  },
  {
    id: 'inv-astra-004',
    invoiceNumber: 'SI/2026/Aug/007',
    invoiceDate: '2026-08-07',
    invoiceType: 'Tax Invoice',
    clientName: 'Astra Corporate Group',
    billingAddress: '42 MG Road, Prestige Towers, Level 8, Bangalore - 560001',
    clientState: 'Karnataka',
    clientGSTIN: '29AABCA1234F1Z8',
    reverseCharge: 'N',
    shippingCharge: 0,
    billingMonth: 8,
    billingYear: 2026,
    paymentStatus: 'Paid',
    paymentMode: 'Bank Transfer',
    remarks: 'Social Media Management & Performance Marketing Retainer',
    template: 'red-classic',
    sellerInfo: DEFAULT_SELLER_INFO,
    bankDetails: DEFAULT_BANK_DETAILS,
    lineItems: [
      { description: 'Monthly Social Media Marketing Retainer (12 Reels + 20 Creatives)', hsnSac: '998313', unitPrice: 25000.00, qty: 1, gstPercent: 18, base: '25000.00', gstAmt: '4500.00', total: '29500.00' },
      { description: 'Performance Ad Campaign Management (Meta & Google Ads)', hsnSac: '998311', unitPrice: 15000.00, qty: 1, gstPercent: 18, base: '15000.00', gstAmt: '2700.00', total: '17700.00' }
    ],
    subtotal: '40000.00',
    totalGST: '7200.00',
    grandTotal: '47200.00'
  },
  {
    id: 'inv-raghavendra-005',
    invoiceNumber: 'SI/2026/Aug/008',
    invoiceDate: '2026-08-08',
    invoiceType: 'Tax Invoice',
    clientName: 'Sri Raghavendra Granites & Tiles',
    billingAddress: 'Plot 18, Industrial Estate, Peenya 2nd Stage, Bengaluru, Karnataka 560058',
    clientState: 'Karnataka',
    clientGSTIN: '29AAECS5544B1ZV',
    reverseCharge: 'N',
    shippingCharge: 0,
    billingMonth: 8,
    billingYear: 2026,
    paymentStatus: 'Paid',
    paymentMode: 'Bank Transfer',
    remarks: 'Performance Ads Management & Lead Funnel Optimization',
    template: 'red-classic',
    sellerInfo: DEFAULT_SELLER_INFO,
    bankDetails: DEFAULT_BANK_DETAILS,
    lineItems: [
      { description: 'Performance Ads Management (Meta & Google PPC)', hsnSac: '998311', unitPrice: 15000.00, qty: 1, gstPercent: 18, base: '15000.00', gstAmt: '2700.00', total: '17700.00' }
    ],
    subtotal: '15000.00',
    totalGST: '2700.00',
    grandTotal: '17700.00'
  },
  {
    id: 'inv-nexus-006',
    invoiceNumber: 'SI/CB/2026/Aug/002',
    invoiceDate: '2026-08-09',
    invoiceType: 'Cash Bill',
    clientName: 'Nexus Retail Solutions',
    billingAddress: 'Shop 14, Brigade Road, Bangalore - 560025',
    clientState: 'Karnataka',
    clientGSTIN: '',
    reverseCharge: 'N',
    shippingCharge: 0,
    billingMonth: 8,
    billingYear: 2026,
    paymentStatus: 'Paid',
    paymentMode: 'Cash',
    remarks: 'Brand Identity & Vector Collateral Suite - Paid in Cash',
    template: 'red-classic',
    sellerInfo: DEFAULT_SELLER_INFO,
    bankDetails: DEFAULT_BANK_DETAILS,
    lineItems: [
      { description: 'Brand Identity, Logo Vector Suite & Print Collateral', hsnSac: '998314', unitPrice: 15000.00, qty: 1, gstPercent: 0, base: '15000.00', gstAmt: '0.00', total: '15000.00' }
    ],
    subtotal: '15000.00',
    totalGST: '0.00',
    grandTotal: '15000.00'
  },
  {
    id: 'inv-manjunath-007',
    invoiceNumber: 'SI/CB/2026/Aug/003',
    invoiceDate: '2026-08-10',
    invoiceType: 'Cash Bill',
    clientName: 'Manjunath Sir',
    billingAddress: 'Vijayanagar, Bangalore',
    clientState: 'Karnataka',
    clientGSTIN: '',
    reverseCharge: 'N',
    shippingCharge: 0,
    billingMonth: 8,
    billingYear: 2026,
    paymentStatus: 'Paid',
    paymentMode: 'Cash',
    remarks: 'Digital Marketing Monthly Retainer - Received in Cash',
    template: 'red-classic',
    sellerInfo: DEFAULT_SELLER_INFO,
    bankDetails: DEFAULT_BANK_DETAILS,
    lineItems: [
      { description: 'Digital Marketing & Content Execution (Monthly Retainer)', hsnSac: '998313', unitPrice: 10000.00, qty: 1, gstPercent: 0, base: '10000.00', gstAmt: '0.00', total: '10000.00' }
    ],
    subtotal: '10000.00',
    totalGST: '0.00',
    grandTotal: '10000.00'
  },
  {
    id: 'inv-jalmahal-008',
    invoiceNumber: 'SI/2026/Aug/009',
    invoiceDate: '2026-08-11',
    invoiceType: 'Tax Invoice',
    clientName: 'Jalmahal Resorts & Hotels',
    billingAddress: 'Mysore Road, Near Wonderla Gate, Bangalore - 562109',
    clientState: 'Karnataka',
    clientGSTIN: '29AAACJ1234K1Z5',
    reverseCharge: 'N',
    shippingCharge: 0,
    billingMonth: 8,
    billingYear: 2026,
    paymentStatus: 'Paid',
    paymentMode: 'Bank Transfer',
    remarks: 'Social Media Retainer & On-site Photography Reel Production',
    template: 'red-classic',
    sellerInfo: DEFAULT_SELLER_INFO,
    bankDetails: DEFAULT_BANK_DETAILS,
    lineItems: [
      { description: 'Monthly Social Media Marketing Retainer (12 Reels + 20 Posts)', hsnSac: '998313', unitPrice: 25000.00, qty: 1, gstPercent: 18, base: '25000.00', gstAmt: '4500.00', total: '29500.00' }
    ],
    subtotal: '25000.00',
    totalGST: '4500.00',
    grandTotal: '29500.00'
  },
  {
    id: 'inv-matha-009',
    invoiceNumber: 'SI/2026/Aug/010',
    invoiceDate: '2026-08-12',
    invoiceType: 'Tax Invoice',
    clientName: 'Matha Clinic & Diagnostics',
    billingAddress: '15th Cross, 3rd Block, Rajajinagar, Bangalore - 560010',
    clientState: 'Karnataka',
    clientGSTIN: '29AAACM5678L1Z9',
    reverseCharge: 'N',
    shippingCharge: 0,
    billingMonth: 8,
    billingYear: 2026,
    paymentStatus: 'Paid',
    paymentMode: 'Bank Transfer',
    remarks: 'Healthcare Local SEO, Google Maps Optimization & Creative Campaign',
    template: 'red-classic',
    sellerInfo: DEFAULT_SELLER_INFO,
    bankDetails: DEFAULT_BANK_DETAILS,
    lineItems: [
      { description: 'Healthcare Digital Outreach, Google My Business & SEO Retainer', hsnSac: '998314', unitPrice: 20000.00, qty: 1, gstPercent: 18, base: '20000.00', gstAmt: '3600.00', total: '23600.00' }
    ],
    subtotal: '20000.00',
    totalGST: '3600.00',
    grandTotal: '23600.00'
  },
  {
    id: 'inv-bombay-010',
    invoiceNumber: 'SI/CB/2026/Aug/004',
    invoiceDate: '2026-08-13',
    invoiceType: 'Cash Bill',
    clientName: 'Bombay Tiffanys',
    billingAddress: 'Commercial Street, Bangalore - 560001',
    clientState: 'Karnataka',
    clientGSTIN: '',
    reverseCharge: 'N',
    shippingCharge: 0,
    billingMonth: 8,
    billingYear: 2026,
    paymentStatus: 'Paid',
    paymentMode: 'Cash',
    remarks: 'Food Video Shoot & Kinetic Typography Reels - Paid in Cash',
    template: 'red-classic',
    sellerInfo: DEFAULT_SELLER_INFO,
    bankDetails: DEFAULT_BANK_DETAILS,
    lineItems: [
      { description: 'Food Video Production & Social Media Promotional Reels', hsnSac: '998316', unitPrice: 18000.00, qty: 1, gstPercent: 0, base: '18000.00', gstAmt: '0.00', total: '18000.00' }
    ],
    subtotal: '18000.00',
    totalGST: '0.00',
    grandTotal: '18000.00'
  },
  {
    id: 'inv-poojarys-011',
    invoiceNumber: 'SI/2026/Aug/011',
    invoiceDate: '2026-08-14',
    invoiceType: 'Tax Invoice',
    clientName: 'Poojarys Niranthara',
    billingAddress: '100ft Road, Indiranagar, Bangalore - 560038',
    clientState: 'Karnataka',
    clientGSTIN: '29AAACP9012N1Z3',
    reverseCharge: 'N',
    shippingCharge: 0,
    billingMonth: 8,
    billingYear: 2026,
    paymentStatus: 'Paid',
    paymentMode: 'Bank Transfer',
    remarks: 'Hospitality Brand Management & Instagram Growth Campaign',
    template: 'red-classic',
    sellerInfo: DEFAULT_SELLER_INFO,
    bankDetails: DEFAULT_BANK_DETAILS,
    lineItems: [
      { description: 'Hospitality Social Media Retainer & Ad Management', hsnSac: '998313', unitPrice: 18000.00, qty: 1, gstPercent: 18, base: '18000.00', gstAmt: '3240.00', total: '21240.00' }
    ],
    subtotal: '18000.00',
    totalGST: '3240.00',
    grandTotal: '21240.00'
  },
  {
    id: 'inv-docmic-012',
    invoiceNumber: 'SI/CB/2026/Aug/005',
    invoiceDate: '2026-08-14',
    invoiceType: 'Cash Bill',
    clientName: "Doctor's Mic",
    billingAddress: 'Jayanagar 4th Block, Bangalore',
    clientState: 'Karnataka',
    clientGSTIN: '',
    reverseCharge: 'N',
    shippingCharge: 0,
    billingMonth: 8,
    billingYear: 2026,
    paymentStatus: 'Paid',
    paymentMode: 'Cash',
    remarks: 'Podcast Audio Mastering & Short Video Snippets - Cash Settled',
    template: 'red-classic',
    sellerInfo: DEFAULT_SELLER_INFO,
    bankDetails: DEFAULT_BANK_DETAILS,
    lineItems: [
      { description: 'Podcast Audio Mastering, Video Snippets & YouTube Thumbnails', hsnSac: '998316', unitPrice: 10000.00, qty: 1, gstPercent: 0, base: '10000.00', gstAmt: '0.00', total: '10000.00' }
    ],
    subtotal: '10000.00',
    totalGST: '0.00',
    grandTotal: '10000.00'
  },
  {
    id: 'inv-eshwari-013',
    invoiceNumber: 'SI/CB/2026/Aug/006',
    invoiceDate: '2026-08-15',
    invoiceType: 'Cash Bill',
    clientName: 'Eshwari',
    billingAddress: 'Malleshwaram, Bangalore',
    clientState: 'Karnataka',
    clientGSTIN: '',
    reverseCharge: 'N',
    shippingCharge: 0,
    billingMonth: 8,
    billingYear: 2026,
    paymentStatus: 'Paid',
    paymentMode: 'Cash',
    remarks: 'Creative Shoot & Graphic Design Collateral - Paid in Cash',
    template: 'red-classic',
    sellerInfo: DEFAULT_SELLER_INFO,
    bankDetails: DEFAULT_BANK_DETAILS,
    lineItems: [
      { description: 'One-Time Creative Shoot & Brand Display Collateral', hsnSac: '998316', unitPrice: 16400.00, qty: 1, gstPercent: 0, base: '16400.00', gstAmt: '0.00', total: '16400.00' }
    ],
    subtotal: '16400.00',
    totalGST: '0.00',
    grandTotal: '16400.00'
  },
  {
    id: 'inv-vet-014',
    invoiceNumber: 'SI/2026/Aug/012',
    invoiceDate: '2026-08-16',
    invoiceType: 'Tax Invoice',
    clientName: 'VET Educational Trust',
    billingAddress: 'JP Nagar 2nd Phase, Bangalore - 560078',
    clientState: 'Karnataka',
    clientGSTIN: '29AAATV3456P1Z7',
    reverseCharge: 'N',
    shippingCharge: 0,
    billingMonth: 8,
    billingYear: 2026,
    paymentStatus: 'Paid',
    paymentMode: 'Bank Transfer',
    remarks: 'Institutional Admission Lead Generation & Social Media Campaign',
    template: 'red-classic',
    sellerInfo: DEFAULT_SELLER_INFO,
    bankDetails: DEFAULT_BANK_DETAILS,
    lineItems: [
      { description: 'Institutional Social Media & Admission Lead Campaign', hsnSac: '998313', unitPrice: 10000.00, qty: 1, gstPercent: 18, base: '10000.00', gstAmt: '1800.00', total: '11800.00' }
    ],
    subtotal: '10000.00',
    totalGST: '1800.00',
    grandTotal: '11800.00'
  },
  {
    id: 'inv-highway-016',
    invoiceNumber: 'SI/CB/2026/Aug/007',
    invoiceDate: '2026-08-18',
    invoiceType: 'Cash Bill',
    clientName: 'Highway Restaurant & Dhabha',
    billingAddress: 'Tumkur Road, Nelamangala, Bangalore Rural',
    clientState: 'Karnataka',
    clientGSTIN: '',
    reverseCharge: 'N',
    shippingCharge: 0,
    billingMonth: 8,
    billingYear: 2026,
    paymentStatus: 'Paid',
    paymentMode: 'Cash',
    remarks: 'Outdoor Banner Creatives & Video Shoot - Cash Received',
    template: 'red-classic',
    sellerInfo: DEFAULT_SELLER_INFO,
    bankDetails: DEFAULT_BANK_DETAILS,
    lineItems: [
      { description: 'Outdoor Banner Design, High-Res Print Files & Video Reel', hsnSac: '998314', unitPrice: 12000.00, qty: 1, gstPercent: 0, base: '12000.00', gstAmt: '0.00', total: '12000.00' }
    ],
    subtotal: '12000.00',
    totalGST: '0.00',
    grandTotal: '12000.00'
  }
];

export const INITIAL_ORDERS = [
  {
    id: 'ORD-2026-001',
    orderNumber: 'ORD-2026-001',
    customerName: 'Astra Corporate Group',
    status: 'Completed',
    total: 47200,
    createdDate: '2026-08-07',
    deliveryDate: '2026-08-31',
    items: [
      { productName: 'Monthly Social Media Marketing Retainer', qty: 1, unitPrice: 25000 },
      { productName: 'Performance Ad Campaign Management', qty: 1, unitPrice: 15000 }
    ]
  },
  {
    id: 'ORD-2026-002',
    orderNumber: 'ORD-2026-002',
    customerName: 'Chaitanya Electric Company',
    status: 'Completed',
    total: 10028.82,
    createdDate: '2026-08-05',
    deliveryDate: '2026-08-06',
    items: [
      { productName: 'Dedicated Cloud Server VPS & Hosting', qty: 1, unitPrice: 6500 },
      { productName: 'Domain Registration & SSL Vault', qty: 1, unitPrice: 1999 }
    ]
  },
  {
    id: 'ORD-2026-003',
    orderNumber: 'ORD-2026-003',
    customerName: 'Sri Raghavendra Granites & Tiles',
    status: 'In Progress',
    total: 17700,
    createdDate: '2026-08-08',
    deliveryDate: '2026-09-08',
    items: [
      { productName: 'Performance Ads Management (Meta & Google PPC)', qty: 1, unitPrice: 15000 }
    ]
  },
  {
    id: 'ORD-2026-004',
    orderNumber: 'ORD-2026-004',
    customerName: 'The Welfare Commissioner, Karnataka Labour Welfare Board',
    status: 'In Progress',
    total: 75520,
    createdDate: '2026-08-03',
    deliveryDate: '2026-09-30',
    items: [
      { productName: 'Module Development and Maintenance of Labour Welfare Portal', qty: 1, unitPrice: 64000 }
    ]
  },
  {
    id: 'ORD-2026-005',
    orderNumber: 'ORD-2026-005',
    customerName: 'Nexus Retail Solutions',
    status: 'Completed',
    total: 15000,
    createdDate: '2026-08-09',
    deliveryDate: '2026-08-15',
    items: [
      { productName: 'Brand Identity, Logo Vector Suite & Print Collateral', qty: 1, unitPrice: 15000 }
    ]
  },
  {
    id: 'ORD-2026-006',
    orderNumber: 'ORD-2026-006',
    customerName: 'Bharadwaj Enterprises',
    status: 'Completed',
    total: 14160,
    createdDate: '2026-08-06',
    deliveryDate: '2026-08-12',
    items: [
      { productName: 'Website Hosting & Domain Registration Suite', qty: 1, unitPrice: 8000 },
      { productName: 'Website Designing and Development Retainer', qty: 1, unitPrice: 4000 }
    ]
  },
  {
    id: 'ORD-2026-007',
    orderNumber: 'ORD-2026-007',
    customerName: 'Imagen Engineering and Projects',
    status: 'Completed',
    total: 8000,
    createdDate: '2026-08-10',
    deliveryDate: '2026-08-11',
    items: [
      { productName: 'Logo Redesigning, Vector Suite & Corporate Stationery', qty: 1, unitPrice: 8000 }
    ]
  }
];
