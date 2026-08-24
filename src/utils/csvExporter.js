/**
 * Universal CSV Exporter for Sanna CRM
 * Uses FileSaver.js (saveAs) which is the industry-standard cross-browser
 * solution for triggering named file downloads in Chrome/Edge/Firefox on Windows.
 *
 * UTF-8 BOM (\uFEFF) is prepended so Excel opens the file without encoding issues.
 */

import { saveAs } from 'file-saver';

/**
 * Build a well-escaped CSV string from an array of row objects.
 */
const buildCSVString = (rows, headers) => {
  if (!rows || rows.length === 0) return '';

  const cols = headers && headers.length > 0 ? headers : Object.keys(rows[0]);

  const escape = (val) => {
    const s = val !== undefined && val !== null ? String(val) : '';
    return '"' + s.replace(/"/g, '""') + '"';
  };

  return [
    cols.join(','),
    ...rows.map(row => cols.map(h => escape(row[h])).join(','))
  ].join('\r\n');
};

/**
 * Trigger a named .csv download in the browser.
 *
 * @param {Array<Object>|string} contentOrRows  Array of row objects, or a raw CSV string
 * @param {string}               filename        Desired filename (with or without .csv)
 * @param {Array<string>}        [headers]       Optional column order / header labels
 */
export const exportToCSV = (contentOrRows, filename = 'export.csv', headers = null) => {
  // 1. Build the CSV text
  let csvString = '';
  if (typeof contentOrRows === 'string') {
    csvString = contentOrRows;
  } else if (Array.isArray(contentOrRows)) {
    csvString = buildCSVString(contentOrRows, headers);
  }

  if (!csvString) {
    console.warn('[csvExporter] No data to export.');
    return;
  }

  // 2. Enforce .csv extension
  const safeFilename = /\.csv$/i.test(filename) ? filename : `${filename}.csv`;

  // 3. UTF-8 BOM + Blob
  const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });

  // 4. FileSaver handles all Chrome/Edge/Firefox filename quirks
  saveAs(blob, safeFilename);
};

export default exportToCSV;
