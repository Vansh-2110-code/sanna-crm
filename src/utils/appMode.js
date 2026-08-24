/**
 * Centralized App Mode & Tenancy Resolver
 * Distinguishes between Sanna CRM (with full Sanna Innovations company data)
 * and Astra CRM (clean multi-tenant SaaS platform with zero pre-fed data).
 */

export const isSannaCRM = () => {
  if (typeof window === 'undefined') return false;
  
  const host = window.location.hostname.toLowerCase();
  const port = window.location.port;
  const envMode = import.meta.env?.VITE_APP_MODE?.toLowerCase();
  const storedMode = localStorage.getItem('astra_app_mode');

  if (storedMode === 'sanna') return true;
  if (storedMode === 'astra') return false;
  if (envMode === 'sanna') return true;
  if (envMode === 'astra') return false;

  // Domain & port detection
  if (
    host.includes('sanna') || 
    host.includes('crm.sannainnovations.com') || 
    host.includes('sannacrm.sannainnovations.com') ||
    port === '8088' || 
    port === '3050' || 
    port === '5055'
  ) {
    return true;
  }

  // Default to Astra CRM on other domains/ports (e.g. astracrm.theastraai.com, localhost)
  return false;
};

export const SANNA_SELLER_INFO = {
  companyName: 'Sanna Innovations',
  gstin: '29BNJPS7776J1ZW',
  pan: 'BNJPS7776J',
  address: '#1203, 1st Main, M.C. Layout, Vijayanagar, Bangalore - 560040',
  website: 'www.sannainnovations.com',
  email: 'billing@sannainnovations.com',
  phone: '+91 80 4123 4567'
};

export const SANNA_BANK_DETAILS = {
  bankName: 'Kotak Mahindra Bank',
  accountName: 'Sanna Innovations',
  accountNumber: '6450725722',
  ifscCode: 'KKBK0008035',
  branch: 'Basaveshwaranagar'
};

export const ASTRA_CLEAN_SELLER_INFO = {
  companyName: '',
  gstin: '',
  pan: '',
  address: '',
  website: '',
  email: '',
  phone: ''
};

export const ASTRA_CLEAN_BANK_DETAILS = {
  bankName: '',
  accountName: '',
  accountNumber: '',
  ifscCode: '',
  branch: ''
};

export const getAppConfig = () => {
  const isSanna = isSannaCRM();

  if (isSanna) {
    return {
      isSanna: true,
      appName: 'Sanna CRM',
      companyName: 'Sanna Innovations Pvt Ltd',
      defaultTenantId: 'client-sanna',
      defaultSellerInfo: SANNA_SELLER_INFO,
      defaultBankDetails: SANNA_BANK_DETAILS,
      hasPreFedData: true,
      tagline: 'Enterprise Operations, Deliverables & MIS Governance'
    };
  }

  return {
    isSanna: false,
    appName: 'Astra CRM',
    companyName: 'Astra Corporate AI',
    defaultTenantId: 'client-astra',
    defaultSellerInfo: ASTRA_CLEAN_SELLER_INFO,
    defaultBankDetails: ASTRA_CLEAN_BANK_DETAILS,
    hasPreFedData: false,
    tagline: 'AI-Native Enterprise Customer Relationship & Revenue Engine'
  };
};
