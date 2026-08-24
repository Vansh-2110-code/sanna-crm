/**
 * Bill, Invoice, Order & Quotation Sequence Number Generator
 * Automatically calculates the next sequential bill/invoice/order/quote number based on existing records.
 */

const MONTH_NAMES_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_NAMES_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/**
 * Extract sequence numbers from a list of identifier strings
 * @param {Array<string>} ids - Array of ID strings
 * @param {string} filterPattern - Optional regex or substring filter
 * @returns {number} The highest sequence number found
 */
export const extractHighestSequence = (ids = [], filterPattern = null) => {
  let highest = 0;
  
  ids.forEach(id => {
    if (!id || typeof id !== 'string') return;
    
    if (filterPattern) {
      const re = typeof filterPattern === 'string' ? new RegExp(filterPattern, 'i') : filterPattern;
      if (!re.test(id)) return;
    }

    // Match numbers at the end of the string or separated by slash/dash
    // E.g. SI/2026/Aug/010 -> 10, SI/CB/2026/Aug/007 -> 7, ORD-2026-005 -> 5, CB-004 -> 4
    const matches = id.match(/(\d+)(?!.*\d)/); // last sequence of digits
    if (matches && matches[1]) {
      const num = parseInt(matches[1], 10);
      if (!isNaN(num) && num > highest && num < 100000) {
        highest = num;
      }
    }
  });

  return highest;
};

/**
 * Generate Next Bill Number for GST Invoices / Cash Bills
 * @param {Array<object>} existingBills - List of existing bill/invoice objects
 * @param {'Tax Invoice'|'Cash Bill'} type - Document type
 * @param {Date|string} date - Invoice date
 * @param {object} options - Configuration options
 * @returns {string} The next sequential bill number
 */
export const getNextBillNumber = (existingBills = [], type = 'Tax Invoice', date = new Date(), options = {}) => {
  const d = date ? new Date(date) : new Date();
  const validDate = isNaN(d.getTime()) ? new Date() : d;
  
  const year = validDate.getFullYear();
  const monthShort = MONTH_NAMES_SHORT[validDate.getMonth()];
  const isCashBill = type === 'Cash Bill' || options.isCashBill;

  // Extract all existing invoice/bill numbers
  const allNumbers = existingBills
    .map(b => b.invoiceNumber || b.invoice_no || b.billNo || b.id)
    .filter(Boolean);

  let prefix = '';
  let pattern = null;

  if (isCashBill) {
    // Cash Bill Format: SI/CB/2026/Aug/001 or SI/2026/Aug/CB-001
    prefix = `SI/CB/${year}/${monthShort}`;
    pattern = new RegExp(`SI[/-]CB[/-]${year}[/-]${monthShort}[/-](\\d+)`, 'i');
    
    let highest = 0;
    allNumbers.forEach(numStr => {
      const m = numStr.match(pattern);
      if (m && m[1]) {
        const val = parseInt(m[1], 10);
        if (val > highest) highest = val;
      } else if (/CB/i.test(numStr)) {
        const lastDigits = numStr.match(/(\d+)$/);
        if (lastDigits && lastDigits[1]) {
          const val = parseInt(lastDigits[1], 10);
          if (val > highest && val < 1000) highest = val;
        }
      }
    });

    const nextSeq = highest + 1;
    return `${prefix}/${String(nextSeq).padStart(3, '0')}`;
  } else {
    // Tax Invoice Format: SI/2026/Aug/001
    prefix = `SI/${year}/${monthShort}`;
    pattern = new RegExp(`SI[/-]${year}[/-]${monthShort}[/-](\\d+)`, 'i');

    let highest = 0;
    allNumbers.forEach(numStr => {
      // Exclude Cash bills from Tax invoice sequence
      if (/CB/i.test(numStr)) return;
      
      const m = numStr.match(pattern);
      if (m && m[1]) {
        const val = parseInt(m[1], 10);
        if (val > highest) highest = val;
      } else if (/SI\//i.test(numStr)) {
        const lastDigits = numStr.match(/(\d+)$/);
        if (lastDigits && lastDigits[1]) {
          const val = parseInt(lastDigits[1], 10);
          if (val > highest && val < 1000) highest = val;
        }
      }
    });

    const nextSeq = highest + 1;
    return `${prefix}/${String(nextSeq).padStart(3, '0')}`;
  }
};

/**
 * Generate Next Order Number
 * @param {Array<object>} existingOrders - List of existing order objects
 * @param {Date|string} date - Order date
 * @returns {string} The next sequential order number (e.g. ORD-2026-001)
 */
export const getNextOrderNumber = (existingOrders = [], date = new Date()) => {
  const d = date ? new Date(date) : new Date();
  const validDate = isNaN(d.getTime()) ? new Date() : d;
  const year = validDate.getFullYear();

  const allNumbers = existingOrders
    .map(o => o.orderNumber || o.id)
    .filter(Boolean);

  let highest = 0;
  allNumbers.forEach(numStr => {
    const m = numStr.match(new RegExp(`ORD[/-]${year}[/-](\\d+)`, 'i')) || numStr.match(/(\d+)$/);
    if (m && m[1]) {
      const val = parseInt(m[1], 10);
      if (val > highest && val < 10000) highest = val;
    }
  });

  const nextSeq = highest + 1;
  return `ORD-${year}-${String(nextSeq).padStart(3, '0')}`;
};

/**
 * Generate Next Quotation Number
 * @param {Array<object>} existingQuotes - List of existing quote objects
 * @param {Date|string} date - Quote date
 * @returns {string} The next sequential quotation number (e.g. SI/QT/2026/001)
 */
export const getNextQuoteNumber = (existingQuotes = [], date = new Date()) => {
  const d = date ? new Date(date) : new Date();
  const validDate = isNaN(d.getTime()) ? new Date() : d;
  const year = validDate.getFullYear();

  const allNumbers = existingQuotes
    .map(q => q.quoteNumber || q.quote_no || q.id)
    .filter(Boolean);

  let highest = 0;
  allNumbers.forEach(numStr => {
    const m = numStr.match(new RegExp(`(?:SI/)?QT[/-]${year}[/-](\\d+)`, 'i')) || numStr.match(/(\d+)$/);
    if (m && m[1]) {
      const val = parseInt(m[1], 10);
      if (val > highest && val < 10000) highest = val;
    }
  });

  const nextSeq = highest + 1;
  return `SI/QT/${year}/${String(nextSeq).padStart(3, '0')}`;
};
