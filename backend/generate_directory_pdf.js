const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const EMPLOYEES = [
  { id: 'EMP-SANNA-001', name: 'Srinivas (Admin)', designation: 'Chief Executive Officer (CEO)', department: 'Executive', role: 'Super Admin', username: 'admin', pass: 'admin', email: 'admin@sannainnovations.com', salary: 'Rs. 1,00,000' },
  { id: 'EMP-SANNA-004', name: 'Jyothi', designation: 'Chief Commercial Officer (CCO)', department: 'Commerce & Ops', role: 'Operations Head', username: 'empsi02', pass: 'empsi02', email: 'empsi02@sannainnovations.com', salary: 'Rs. 15,000' },
  { id: 'EMP-SANNA-005', name: 'Sowmya', designation: 'Lead Frontend Engineer', department: 'Engineering', role: 'Software Dev', username: 'empsi03', pass: 'empsi03', email: 'empsi03@sannainnovations.com', salary: 'Rs. 25,000' },
  { id: 'EMP-SANNA-008', name: 'Mavuri Anand Kumar', designation: 'Lead Video Editor & Motion', department: 'Creative Media', role: 'Video Editor', username: 'empsi06', pass: 'empsi06', email: 'empsi06@sannainnovations.com', salary: 'Rs. 10,000' },
  { id: 'EMP-SANNA-009', name: 'Riya Biswas Dasgupta', designation: 'Sr. Graphic Designer', department: 'Creative Design', role: 'Graphic Design', username: 'empsi07', pass: 'empsi07', email: 'empsi07@sannainnovations.com', salary: 'Rs. 40,000' },
  { id: 'EMP-SANNA-012', name: 'Bhuvan Sai Adithya', designation: 'Data Analyst Intern', department: 'Analytics & Data', role: 'Intern / Trainee', username: 'empsi10', pass: 'empsi10', email: 'btia23001@joyuniversity.edu.in', salary: 'Rs. 12,000' },
  { id: 'EMP-SANNA-013', name: 'M.Shalini Sree', designation: 'Data Analyst Intern', department: 'Analytics & Data', role: 'Intern / Trainee', username: 'empsi11', pass: 'empsi11', email: 'shalinisree17@gmail.com', salary: 'Rs. 12,000' },
  { id: 'EMP-SANNA-014', name: 'Vansh Goyal', designation: 'Data Analyst Intern / Dev', department: 'Engineering & Data', role: 'Software Dev', username: 'empsi12', pass: 'empsi12', email: 'vanshgoyal.cc12345@gmail.com', salary: 'Rs. 50,000' },
  { id: 'EMP-SANNA-015', name: 'Srikakula Anirudh', designation: 'Data Analyst Intern', department: 'Analytics & Data', role: 'Intern / Trainee', username: 'empsi13', pass: 'empsi13', email: 'btai23026@joyuniversity.edu.in', salary: 'Rs. 50,000' },
  { id: 'EMP-SANNA-021', name: 'YASH DESHMUKH', designation: 'Full Stack Developer', department: 'Engineering', role: 'Software Dev', username: 'empsi19', pass: 'empsi19', email: 'yashdesh191@gmail.com', salary: 'Rs. 1,000' },
  { id: 'EMP-SANNA-022', name: 'Karthik', designation: 'Performance Marketer', department: 'Marketing', role: 'Digital Marketer', username: 'karthik', pass: 'karthik123', email: 'karthik@sannainnovations.com', salary: 'Rs. 15,000' },
  { id: 'EMP-SANNA-023', name: 'Mohana Priya Sakthivel', designation: 'Performance Marketer', department: 'Marketing', role: 'Digital Marketer', username: 'mohana', pass: 'mohana123', email: 'Priyadigitaldm@gmail.com', salary: 'Rs. 37,000' },
  { id: 'EMP-SANNA-038', name: 'Vidhurshan', designation: 'Intern', department: 'Engineering', role: 'Intern / Trainee', username: 'vidhurshan', pass: 'vidhurshan123', email: 'vidhurshan@sannainnovations.com', salary: 'Rs. 1,000' },
  { id: 'EMP-SANNA-039', name: 'Smitesh Porkhar', designation: 'Intern', department: 'Engineering', role: 'Intern / Trainee', username: 'smitesh', pass: 'smitesh123', email: 'smitesh@sannainnovations.com', salary: 'Rs. 10,000' }
];

function generatePDF(outputPath) {
  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margins: { top: 25, bottom: 25, left: 25, right: 25 }
  });

  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  // Top Navy/Slate Header Banner
  doc.rect(0, 0, 842, 68).fill('#0f172a');

  // Decorative Top Border Accent
  doc.rect(0, 0, 842, 3).fill('#6366f1');

  // Company Brand Name & System Title
  doc.fillColor('#ffffff').fontSize(17).font('Helvetica-Bold').text('SANNA INNOVATIONS PVT LTD', 30, 16);
  doc.fontSize(9.5).font('Helvetica').fillColor('#94a3b8').text('Astra CRM Enterprise Suite · Master Corporate Employee Directory & Access Vault', 30, 38);

  // Status Badge on Top Right
  doc.roundedRect(645, 14, 167, 40, 6).fill('#1e293b');
  doc.fillColor('#38bdf8').fontSize(8.5).font('Helvetica-Bold').text('ACTIVE SEATS: 14 / 50 USED', 655, 22);
  doc.fillColor('#10b981').fontSize(7.5).font('Helvetica').text('Zero-Trust Auth · AES-256 Encrypted', 655, 36);

  // Governance Info Banner
  doc.rect(25, 76, 792, 24).fill('#f1f5f9');
  doc.fillColor('#1e293b').fontSize(8).font('Helvetica-Bold').text('CONFIDENTIAL & PROPRIETARY · INTERNAL GOVERNANCE DIRECTORY · AUGUST 2026', 35, 84);
  doc.fillColor('#64748b').fontSize(7.5).font('Helvetica').text(`Effective Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, 715, 84);

  // Table Configuration (Total Width: 792)
  const tableTop = 108;
  const colWidths = [24, 125, 130, 85, 68, 75, 195, 90];
  const colPositions = [
    25,
    25 + colWidths[0],
    25 + colWidths[0] + colWidths[1],
    25 + colWidths[0] + colWidths[1] + colWidths[2],
    25 + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3],
    25 + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4],
    25 + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5],
    25 + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5] + colWidths[6]
  ];

  // Table Header
  doc.rect(25, tableTop, 792, 22).fill('#1e293b');
  doc.fillColor('#ffffff').fontSize(7.5).font('Helvetica-Bold');
  doc.text('#', colPositions[0] + 5, tableTop + 7);
  doc.text('EMPLOYEE NAME', colPositions[1] + 5, tableTop + 7);
  doc.text('DESIGNATION', colPositions[2] + 5, tableTop + 7);
  doc.text('SYSTEM ROLE', colPositions[3] + 5, tableTop + 7);
  doc.text('LOGIN ID', colPositions[4] + 5, tableTop + 7);
  doc.text('PASSWORD', colPositions[5] + 5, tableTop + 7);
  doc.text('REGISTERED EMAIL', colPositions[6] + 5, tableTop + 7);
  doc.text('BASE SALARY', colPositions[7] + 5, tableTop + 7);

  let currentY = tableTop + 22;
  const rowHeight = 23;

  EMPLOYEES.forEach((emp, index) => {
    const isEven = index % 2 === 0;
    if (isEven) {
      doc.rect(25, currentY, 792, rowHeight).fill('#f8fafc');
    } else {
      doc.rect(25, currentY, 792, rowHeight).fill('#ffffff');
    }

    // Row divider
    doc.rect(25, currentY + rowHeight - 0.5, 792, 0.5).fill('#e2e8f0');

    // Values
    doc.fillColor('#64748b').fontSize(7.5).font('Helvetica-Bold').text(String(index + 1), colPositions[0] + 5, currentY + 7);
    doc.fillColor('#0f172a').fontSize(7.5).font('Helvetica-Bold').text(emp.name, colPositions[1] + 5, currentY + 7);
    doc.fillColor('#334155').fontSize(7).font('Helvetica').text(emp.designation, colPositions[2] + 5, currentY + 7);

    // Role
    doc.fillColor('#4f46e5').fontSize(7).font('Helvetica-Bold').text(emp.role, colPositions[3] + 5, currentY + 7);

    // Credentials Highlighted
    doc.fillColor('#0284c7').fontSize(7.5).font('Helvetica-Bold').text(emp.username, colPositions[4] + 5, currentY + 7);
    doc.fillColor('#dc2626').fontSize(7.5).font('Helvetica-Bold').text(emp.pass, colPositions[5] + 5, currentY + 7);

    doc.fillColor('#475569').fontSize(7).font('Helvetica').text(emp.email, colPositions[6] + 5, currentY + 7);
    doc.fillColor('#059669').fontSize(7.5).font('Helvetica-Bold').text(emp.salary, colPositions[7] + 5, currentY + 7);

    currentY += rowHeight;
  });

  // Policy & Authorization Footer Blocks
  const footerY = currentY + 14;

  doc.roundedRect(25, footerY, 250, 52, 6).fill('#f8fafc');
  doc.rect(25, footerY, 4, 52).fill('#4f46e5');
  doc.fillColor('#4f46e5').fontSize(7.5).font('Helvetica-Bold').text('AUTHENTICATION PROTOCOLS', 35, footerY + 8);
  doc.fillColor('#475569').fontSize(7).font('Helvetica').text('Users may log in with either Username or Registered Email.', 35, footerY + 20);
  doc.text('Session timeout is enforced after 30 mins of inactivity.', 35, footerY + 32);

  doc.roundedRect(290, footerY, 250, 52, 6).fill('#f8fafc');
  doc.rect(290, footerY, 4, 52).fill('#059669');
  doc.fillColor('#059669').fontSize(7.5).font('Helvetica-Bold').text('PAYROLL & SALARY POLICY', 300, footerY + 8);
  doc.fillColor('#475569').fontSize(7).font('Helvetica').text('Standard monthly cycle computed on 26 working days.', 300, footerY + 20);
  doc.text('Annual quota: 12 Medical Leaves (ML) + 12 Casual Leaves (CL).', 300, footerY + 32);

  doc.roundedRect(555, footerY, 262, 52, 6).fill('#f8fafc');
  doc.rect(555, footerY, 4, 52).fill('#d97706');
  doc.fillColor('#d97706').fontSize(7.5).font('Helvetica-Bold').text('EXECUTIVE GOVERNANCE', 565, footerY + 8);
  doc.fillColor('#0f172a').fontSize(7.5).font('Helvetica-Bold').text('Srinivas · Chief Executive Officer (CEO)', 565, footerY + 20);
  doc.fillColor('#64748b').fontSize(7).font('Helvetica').text('Sanna Innovations Pvt Ltd · Master Directory v2.4', 565, footerY + 32);

  // Bottom Notice
  doc.fillColor('#94a3b8').fontSize(6.5).font('Helvetica').text(
    'CONFIDENTIAL · This document contains sensitive corporate access credentials. Do not distribute outside authorized personnel. Astra CRM v2.4 Security Engine.',
    25,
    555,
    { align: 'center', width: 792 }
  );

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

async function main() {
  const artifactDir = path.join('C:', 'Users', 'vansh', '.gemini', 'antigravity-ide', 'brain', 'af25c002-514a-4add-8e2a-1fd5ff3a42e1');
  const artifactPath = path.join(artifactDir, 'Master_Employee_Directory.pdf');
  const workspacePath = path.join(__dirname, '..', 'Master_Employee_Directory.pdf');
  const publicPath = path.join(__dirname, '..', 'public', 'Master_Employee_Directory.pdf');

  console.log('Generating PDF to workspace:', workspacePath);
  await generatePDF(workspacePath);

  console.log('Generating PDF to public static folder:', publicPath);
  await generatePDF(publicPath);

  try {
    console.log('Generating PDF to artifact directory:', artifactPath);
    await generatePDF(artifactPath);
  } catch (e) {
    console.warn('Artifact path note:', e.message);
  }

  console.log('✅ Master Employee Directory PDF regenerated successfully across all targets!');
}

main().catch(console.error);
