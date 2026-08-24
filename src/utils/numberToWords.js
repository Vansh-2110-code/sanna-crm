// Utility to convert numeric amounts to English words for Salary Slips & Invoices (supports INR & USD formats)

const ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
];

const tens = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

export function numberToWordsINR(num) {
  if (num === null || num === undefined || isNaN(num)) return 'Zero Rupees Only';
  const n = Math.floor(Math.abs(Number(num)));
  if (n === 0) return 'Zero Rupees Only';

  function convertChunk(val) {
    let str = '';
    if (val >= 100) {
      str += ones[Math.floor(val / 100)] + ' Hundred ';
      val %= 100;
    }
    if (val >= 20) {
      str += tens[Math.floor(val / 10)] + ' ';
      val %= 10;
    }
    if (val > 0) {
      str += ones[val] + ' ';
    }
    return str.trim();
  }

  let crore = Math.floor(n / 10000000);
  let remainder = n % 10000000;
  let lakh = Math.floor(remainder / 100000);
  remainder = remainder % 100000;
  let thousand = Math.floor(remainder / 1000);
  remainder = remainder % 1000;
  let hundred = remainder;

  let words = '';

  if (crore > 0) {
    words += convertChunk(crore) + ' Crore ';
  }
  if (lakh > 0) {
    words += convertChunk(lakh) + ' Lakh ';
  }
  if (thousand > 0) {
    words += convertChunk(thousand) + ' Thousand ';
  }
  if (hundred > 0) {
    words += convertChunk(hundred) + ' ';
  }

  return words.trim() + ' Rupees Only';
}

export function numberToWordsUSD(num) {
  if (num === null || num === undefined || isNaN(num)) return 'Zero Dollars Only';
  const n = Math.floor(Math.abs(Number(num)));
  if (n === 0) return 'Zero Dollars Only';

  function convertHundreds(val) {
    let str = '';
    if (val >= 100) {
      str += ones[Math.floor(val / 100)] + ' Hundred ';
      val %= 100;
    }
    if (val >= 20) {
      str += tens[Math.floor(val / 10)] + ' ';
      val %= 10;
    }
    if (val > 0) {
      str += ones[val] + ' ';
    }
    return str.trim();
  }

  const scales = ['', 'Thousand', 'Million', 'Billion'];
  let chunks = [];
  let temp = n;

  while (temp > 0) {
    chunks.push(temp % 1000);
    temp = Math.floor(temp / 1000);
  }

  let words = '';
  for (let i = chunks.length - 1; i >= 0; i--) {
    if (chunks[i] > 0) {
      words += convertHundreds(chunks[i]) + ' ' + scales[i] + ' ';
    }
  }

  return words.trim() + ' Dollars Only';
}

export default numberToWordsINR;
