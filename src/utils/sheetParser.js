/**
 * Sanna CRM - Spreadsheet Parsing & Template Export Utility
 * Uses SheetJS (xlsx) for in-browser, high-performance ingestion of
 * both Master Entry Sheets and Multi-Tab Role Evaluation Workbooks.
 */

import * as XLSX from 'xlsx';
import { ROLE_BENCHMARKS, resolveRoleBenchmark } from './kpiEngine';

/**
 * Clean up header string for fuzzy matching
 */
function normalizeHeaderKey(header) {
  if (!header) return '';
  return String(header)
    .toLowerCase()
    .replace(/\r?\n|\r/g, ' ')
    .replace(/[()%/$,.:]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parse an Excel or CSV file (File object or ArrayBuffer) into standardized employee performance records
 */
export async function parsePerformanceSpreadsheet(fileOrBuffer) {
  let arrayBuffer;
  if (fileOrBuffer instanceof Blob || fileOrBuffer instanceof File) {
    arrayBuffer = await fileOrBuffer.arrayBuffer();
  } else {
    arrayBuffer = fileOrBuffer;
  }

  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
  const sheetNames = workbook.SheetNames || [];

  if (sheetNames.length === 0) {
    throw new Error('The uploaded file contains no readable sheets.');
  }

  const extractedRecords = [];

  // 1. Check if "All Roles Performance Entry" exists
  const masterSheetName = sheetNames.find(s => 
    s.toLowerCase().includes('all role') || 
    s.toLowerCase().includes('master')
  );

  if (masterSheetName) {
    const sheet = workbook.Sheets[masterSheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });
    const parsedMaster = parseMasterSheetRows(rows);
    if (parsedMaster.length > 0) {
      return parsedMaster;
    }
  }

  // 2. Otherwise parse individual role tabs
  for (const sName of sheetNames) {
    // Skip reference guide sheets
    if (sName.toLowerCase().includes('guide') || sName.toLowerCase().includes('reference') || sName.toLowerCase().includes('readme')) {
      continue;
    }

    const sheet = workbook.Sheets[sName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });
    const parsedRoleRows = parseRoleSheetRows(sName, rows);
    if (parsedRoleRows.length > 0) {
      extractedRecords.push(...parsedRoleRows);
    }
  }

  // Fallback: If no role sheets matched, try the first sheet
  if (extractedRecords.length === 0 && sheetNames.length > 0) {
    const firstSheet = workbook.Sheets[sheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, raw: false, defval: '' });
    const fallbackRows = parseMasterSheetRows(rows);
    return fallbackRows;
  }

  return extractedRecords;
}

/**
 * Parse rows from a Master Sheet ("All Roles Performance Entry")
 */
function parseMasterSheetRows(rows) {
  if (!rows || rows.length < 2) return [];

  // Find header row (usually contains "Employee ID" or "Employee Name")
  let headerRowIdx = -1;
  for (let i = 0; i < Math.min(10, rows.length); i++) {
    const rowStr = rows[i].map(c => String(c).toLowerCase()).join(' ');
    if (rowStr.includes('employee name') || rowStr.includes('employee id')) {
      headerRowIdx = i;
      break;
    }
  }

  if (headerRowIdx === -1) return [];

  const rawHeaders = rows[headerRowIdx].map(h => String(h || '').trim());
  const headerMap = mapHeaders(rawHeaders);
  const dataRows = rows.slice(headerRowIdx + 1);

  const results = [];

  for (const r of dataRows) {
    if (!r || r.length === 0) continue;
    const empName = String(r[headerMap.employeeName] || '').trim();
    if (!empName) continue; // skip blank rows

    const roleName = String(r[headerMap.role] || '').trim();
    const benchmark = resolveRoleBenchmark(roleName);

    let monthVal = String(r[headerMap.month] || 'August 2026').trim();
    if (!monthVal || monthVal.toLowerCase().includes('aug') || monthVal.includes('46235') || monthVal.replace(/\s+/g, '').toLowerCase() === 'august2026') {
      monthVal = 'August 2026';
    }

    const record = {
      employeeId: String(r[headerMap.employeeId] || `EMP-${Date.now()}-${results.length}`).trim(),
      employeeName: empName,
      workEmail: String(r[headerMap.workEmail] || '').trim(),
      role: benchmark.role,
      department: String(r[headerMap.department] || benchmark.department).trim(),
      month: monthVal,
      kpi_1: r[headerMap.kpi1],
      kpi_2: r[headerMap.kpi2],
      kpi_3: r[headerMap.kpi3],
      kpi_4: r[headerMap.kpi4],
      taskCompletionRate: r[headerMap.taskVelocity],
      qualityScore: r[headerMap.qualityScore],
      peerReview: r[headerMap.peerReview],
      attendance: r[headerMap.attendance],
      notes: String(r[headerMap.notes] || '').trim()
    };

    results.push(record);
  }

  return results;
}

/**
 * Parse rows from an individual role sheet (e.g. "Software Developer Intern")
 */
function parseRoleSheetRows(sheetName, rows) {
  if (!rows || rows.length < 2) return [];

  // Match sheet name to role benchmark
  const benchmark = resolveRoleBenchmark(sheetName);

  // Find header row
  let headerRowIdx = -1;
  for (let i = 0; i < Math.min(10, rows.length); i++) {
    const rowStr = rows[i].map(c => String(c).toLowerCase()).join(' ');
    if (rowStr.includes('employee name') || rowStr.includes('employee id')) {
      headerRowIdx = i;
      break;
    }
  }

  if (headerRowIdx === -1) return [];

  const rawHeaders = rows[headerRowIdx].map(h => String(h || '').trim());
  const headerMap = mapHeaders(rawHeaders);
  const dataRows = rows.slice(headerRowIdx + 1);

  const results = [];

  for (const r of dataRows) {
    if (!r || r.length === 0) continue;
    const empName = String(r[headerMap.employeeName] || '').trim();
    if (!empName) continue; // skip blank rows

    let monthVal = String(r[headerMap.month] || 'August 2026').trim();
    if (!monthVal || monthVal.toLowerCase().includes('aug') || monthVal.includes('46235') || monthVal.replace(/\s+/g, '').toLowerCase() === 'august2026') {
      monthVal = 'August 2026';
    }

    const record = {
      employeeId: String(r[headerMap.employeeId] || `EMP-${Date.now()}-${results.length}`).trim(),
      employeeName: empName,
      workEmail: String(r[headerMap.workEmail] || '').trim(),
      role: benchmark.role,
      department: benchmark.department,
      month: monthVal,
      kpi_1: r[headerMap.kpi1],
      kpi_2: r[headerMap.kpi2],
      kpi_3: r[headerMap.kpi3],
      kpi_4: r[headerMap.kpi4],
      taskCompletionRate: r[headerMap.taskVelocity],
      qualityScore: r[headerMap.qualityScore],
      peerReview: r[headerMap.peerReview],
      attendance: r[headerMap.attendance],
      notes: String(r[headerMap.notes] || '').trim()
    };

    results.push(record);
  }

  return results;
}

/**
 * Map raw sheet headers to standard field indices
 */
function mapHeaders(headers) {
  const map = {
    employeeId: -1,
    employeeName: -1,
    workEmail: -1,
    role: -1,
    department: -1,
    month: -1,
    kpi1: -1,
    kpi2: -1,
    kpi3: -1,
    kpi4: -1,
    taskVelocity: -1,
    qualityScore: -1,
    peerReview: -1,
    attendance: -1,
    notes: -1
  };

  const identifiedKpis = [];

  headers.forEach((h, idx) => {
    const norm = normalizeHeaderKey(h);

    if (norm.includes('employee id') || norm === 'id') map.employeeId = idx;
    else if (norm.includes('employee name') || norm === 'name') map.employeeName = idx;
    else if (norm.includes('work email') || norm.includes('email')) map.workEmail = idx;
    else if (norm.includes('role designation') || norm === 'role' || norm === 'designation') map.role = idx;
    else if (norm === 'department' || norm.includes('dept')) map.department = idx;
    else if (norm === 'month year' || norm === 'month' || norm === 'evaluation month' || norm === 'period') map.month = idx;
    else if (norm.includes('task velocity') || norm === 'velocity') map.taskVelocity = idx;
    else if (norm.includes('quality score') || norm === 'quality') map.qualityScore = idx;
    else if (norm.includes('peer review') || norm.includes('peer collab')) map.peerReview = idx;
    else if (norm.includes('attendance')) map.attendance = idx;
    else if (norm.includes('notes') || norm.includes('remarks') || norm.includes('accomplishments')) map.notes = idx;
    else if (norm.includes('kpi 1') || norm.includes('kpi1')) map.kpi1 = idx;
    else if (norm.includes('kpi 2') || norm.includes('kpi2')) map.kpi2 = idx;
    else if (norm.includes('kpi 3') || norm.includes('kpi3')) map.kpi3 = idx;
    else if (norm.includes('kpi 4') || norm.includes('kpi4')) map.kpi4 = idx;
    else {
      // Intermediate KPI column (between Month and Task Velocity/Competency)
      identifiedKpis.push(idx);
    }
  });

  // If explicit KPI 1-4 columns weren't matched, assign the identified intermediate columns
  if (map.kpi1 === -1 && identifiedKpis.length > 0) map.kpi1 = identifiedKpis[0];
  if (map.kpi2 === -1 && identifiedKpis.length > 1) map.kpi2 = identifiedKpis[1];
  if (map.kpi3 === -1 && identifiedKpis.length > 2) map.kpi3 = identifiedKpis[2];
  if (map.kpi4 === -1 && identifiedKpis.length > 3) map.kpi4 = identifiedKpis[3];

  return map;
}

/**
 * Generate and download the official Sanna Innovations Performance Tracker Template (.xlsx)
 */
export function downloadOfficialPerformanceTemplate() {
  const wb = XLSX.utils.book_new();

  // 1. Master Sheet: "All Roles Performance Entry"
  const masterHeaders = [
    ['SANNA INNOVATIONS - MASTER EMPLOYEE PERFORMANCE TRACKER'],
    [
      'Employee ID',
      'Employee Name',
      'Work Email',
      'Role Designation',
      'Department',
      'Evaluation Month',
      'KPI 1 Value',
      'KPI 2 Value',
      'KPI 3 Value',
      'KPI 4 Value',
      'Task Completion Rate (%)',
      'Quality Score (1-10)',
      'Peer Review (1-10)',
      'Attendance (1-10)',
      'Notes & Accomplishments'
    ],
    // Sample rows based on real team
    [
      'EMP-SANNA-015',
      'Smitesh Pokharkar',
      'smitesh.pokharkar28@gmail.com',
      'Software Developer Intern',
      'Engineering & Development',
      'August 2026',
      '28',       // 28 PRs (Target: 20)
      '2.5',      // 2.5 hrs bug fix (Target: 12 hrs)
      '96',       // 96% PR approval (Target: 80%)
      '98',       // 98% task speed (Target: 90%)
      '118',      // Task velocity
      '9.5',      // Quality score
      '10',       // Peer review
      '10',       // Attendance
      'Spearheaded production optimizations and delivered feature PRs ahead of schedule.'
    ],
    [
      'empsi07',
      'Riya Biswas Dasgupta',
      'riya@sannainnovations.com',
      'Graphic Designer',
      'Creative Design & Branding',
      'August 2026',
      '40',       // 40 assets
      '2',        // 2 revision rounds
      '98',       // 98% approval
      '9.5',      // 9.5 design quality
      '100',
      '10',
      '9',
      '10',
      'Designed corporate marketing kits and all active brand assets with zero missed deadlines.'
    ],
    [
      'empsi03',
      'Sowmya S',
      'sowmya.s@sannainnovations.com',
      'Web Developer',
      'Engineering & Web Solutions',
      'August 2026',
      '98',       // 98% on-time
      '9',        // 9 code quality
      '95',       // 95% bug free
      '9',        // 9 CSAT
      '100',
      '9',
      '9',
      '10',
      'Maintained 100% uptime on client modules with exceptional code review ratings.'
    ],
    [
      'EMP-SANNA-001',
      'Sanna Boss',
      'boss@sannainnovations.com',
      'Boss & Main Sales Head',
      'Sales & Executive Leadership',
      'August 2026',
      '58500',    // $58,500 revenue
      '28.5',     // 28.5% close rate
      '95',       // 95% retention
      '8200',     // $8,200 avg deal
      '95',
      '9.4',
      '9.2',
      '9.8',
      'Surpassed monthly quota by 17% and secured key enterprise renewals.'
    ]
  ];

  const wsMaster = XLSX.utils.aoa_to_sheet(masterHeaders);
  XLSX.utils.book_append_sheet(wb, wsMaster, 'All Roles Performance Entry');

  // 2. Roles & KPI Reference Guide
  const refHeaders = [
    ['SANNA INNOVATIONS - COMPLETE ROLE KPI & WEIGHTAGE REFERENCE GUIDE'],
    ['Role Title', 'Department', 'KPI Metric Name', 'Target Benchmark', 'Weightage (%)']
  ];

  Object.values(ROLE_BENCHMARKS).forEach(bm => {
    bm.kpis.forEach(k => {
      refHeaders.push([
        bm.role,
        bm.department,
        k.name,
        `${k.target}${k.unit}`,
        `${Math.round(k.weight * 100)}%`
      ]);
    });
  });

  const wsRef = XLSX.utils.aoa_to_sheet(refHeaders);
  XLSX.utils.book_append_sheet(wb, wsRef, 'Roles & KPI Reference Guide');

  // 3. Trigger file download
  XLSX.writeFile(wb, 'Sanna_Innovations_Performance_Tracker_Template.xlsx');
}
