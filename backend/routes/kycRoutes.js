/**
 * KYC Routes - Handles employee & client KYC document management.
 * Admin can see ALL records; employees can only see their own.
 */
const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'unified_sanna_crm.db');

const SEED_KYC_DOCUMENTS = [
  {
    id: 'kyc-emp-001',
    category: 'Employee KYC',
    entity_type: 'Employee',
    entity_id: 'EMP-SANNA-001',
    entity_name: 'Srinivas (Admin)',
    entity_role: 'Chief Executive Officer (CEO)',
    doc_type: 'PAN Card',
    doc_number: 'AAAPS2841F',
    title: 'Srinivas_Personal_PAN.pdf',
    file_name: 'Srinivas_Personal_PAN.pdf',
    file_size: '1.8 MB',
    file_type: 'application/pdf',
    upload_date: '2026-08-01',
    verified_date: '2026-08-02',
    verified_by: 'HR Compliance Dept',
    status: 'Verified',
    notes: 'Government authorized PAN identity verified with NSDL database.',
    tags: JSON.stringify(['Identity', 'Tax ID', 'Executive'])
  },
  {
    id: 'kyc-emp-002',
    category: 'Employee KYC',
    entity_type: 'Employee',
    entity_id: 'EMP-SANNA-001',
    entity_name: 'Srinivas (Admin)',
    entity_role: 'Chief Executive Officer (CEO)',
    doc_type: 'Aadhaar Card',
    doc_number: 'XXXX-XXXX-8921',
    title: 'Srinivas_Aadhaar_Card.pdf',
    file_name: 'Srinivas_Aadhaar_Card.pdf',
    file_size: '2.4 MB',
    file_type: 'application/pdf',
    upload_date: '2026-08-01',
    verified_date: '2026-08-02',
    verified_by: 'HR Compliance Dept',
    status: 'Verified',
    notes: 'UIDAI biometric identity verification completed.',
    tags: JSON.stringify(['Identity', 'Address Proof'])
  },
  {
    id: 'kyc-emp-003',
    category: 'Employee KYC',
    entity_type: 'Employee',
    entity_id: 'EMP-SANNA-004',
    entity_name: 'Jyothi',
    entity_role: 'Chief Commercial Officer (CCO)',
    doc_type: 'PAN Card',
    doc_number: 'BLAPJ9104K',
    title: 'Jyothi_PAN_Card.pdf',
    file_name: 'Jyothi_PAN_Card.pdf',
    file_size: '1.2 MB',
    file_type: 'application/pdf',
    upload_date: '2026-08-05',
    verified_date: '2026-08-06',
    verified_by: 'Srinivas (Admin)',
    status: 'Verified',
    notes: 'PAN card verified for payroll and compliance record.',
    tags: JSON.stringify(['Identity', 'Tax ID'])
  },
  {
    id: 'kyc-emp-004',
    category: 'Employee KYC',
    entity_type: 'Employee',
    entity_id: 'EMP-SANNA-004',
    entity_name: 'Jyothi',
    entity_role: 'Chief Commercial Officer (CCO)',
    doc_type: 'Aadhaar Card',
    doc_number: 'XXXX-XXXX-4512',
    title: 'Jyothi_Aadhaar_Copy.jpg',
    file_name: 'Jyothi_Aadhaar_Copy.jpg',
    file_size: '3.1 MB',
    file_type: 'image/jpeg',
    upload_date: '2026-08-05',
    verified_date: '2026-08-06',
    verified_by: 'Srinivas (Admin)',
    status: 'Verified',
    notes: 'Aadhaar address verification valid.',
    tags: JSON.stringify(['Identity', 'Address Proof'])
  },
  {
    id: 'kyc-emp-005',
    category: 'Employee KYC',
    entity_type: 'Employee',
    entity_id: 'EMP-SANNA-005',
    entity_name: 'Sowmya',
    entity_role: 'Software Developer',
    doc_type: 'Aadhaar Card',
    doc_number: 'XXXX-XXXX-7721',
    title: 'Sowmya_Aadhaar_Document.pdf',
    file_name: 'Sowmya_Aadhaar_Document.pdf',
    file_size: '2.1 MB',
    file_type: 'application/pdf',
    upload_date: '2026-08-07',
    verified_date: '2026-08-08',
    verified_by: 'Jyothi',
    status: 'Verified',
    notes: 'UIDAI verified. Full address on file.',
    tags: JSON.stringify(['Identity', 'Address Proof'])
  },
  {
    id: 'kyc-emp-006',
    category: 'Employee KYC',
    entity_type: 'Employee',
    entity_id: 'EMP-SANNA-005',
    entity_name: 'Sowmya',
    entity_role: 'Software Developer',
    doc_type: 'Degree / Educational Certificate',
    doc_number: 'BTECH-CSE-2024-889',
    title: 'Sowmya_Degree_Certificate.pdf',
    file_name: 'Sowmya_Degree_Certificate.pdf',
    file_size: '4.5 MB',
    file_type: 'application/pdf',
    upload_date: '2026-08-07',
    verified_date: '2026-08-08',
    verified_by: 'Jyothi',
    status: 'Verified',
    notes: 'B.Tech in Computer Science & Engineering degree certificate verified.',
    tags: JSON.stringify(['Education', 'Degree'])
  },
  {
    id: 'kyc-emp-007',
    category: 'Employee KYC',
    entity_type: 'Employee',
    entity_id: 'EMP-SANNA-022',
    entity_name: 'Karthik',
    entity_role: 'Performance Marketer',
    doc_type: 'PAN Card',
    doc_number: 'AKMPK5519L',
    title: 'Karthik_PAN_Card.pdf',
    file_name: 'Karthik_PAN_Card.pdf',
    file_size: '1.5 MB',
    file_type: 'application/pdf',
    upload_date: '2026-08-10',
    verified_date: '2026-08-11',
    verified_by: 'Jyothi',
    status: 'Verified',
    notes: 'PAN verified for marketing account management.',
    tags: JSON.stringify(['Identity', 'Tax ID'])
  },
  {
    id: 'kyc-emp-008',
    category: 'Employee KYC',
    entity_type: 'Employee',
    entity_id: 'EMP-SANNA-022',
    entity_name: 'Karthik',
    entity_role: 'Performance Marketer',
    doc_type: 'Aadhaar Card',
    doc_number: 'XXXX-XXXX-3341',
    title: 'Karthik_Aadhaar_Card.pdf',
    file_name: 'Karthik_Aadhaar_Card.pdf',
    file_size: '2.8 MB',
    file_type: 'application/pdf',
    upload_date: '2026-08-10',
    verified_date: '2026-08-11',
    verified_by: 'Jyothi',
    status: 'Verified',
    notes: 'UIDAI verified address proof.',
    tags: JSON.stringify(['Identity', 'Address Proof'])
  },
  {
    id: 'kyc-emp-009',
    category: 'Employee KYC',
    entity_type: 'Employee',
    entity_id: 'EMP-SANNA-023',
    entity_name: 'Mohana Priya Sakthivel',
    entity_role: 'Performance Marketer',
    doc_type: 'Aadhaar Card',
    doc_number: 'XXXX-XXXX-9912',
    title: 'Mohana_Priya_Aadhaar.pdf',
    file_name: 'Mohana_Priya_Aadhaar.pdf',
    file_size: '2.0 MB',
    file_type: 'application/pdf',
    upload_date: '2026-08-12',
    verified_date: '2026-08-13',
    verified_by: 'Jyothi',
    status: 'Verified',
    notes: 'Aadhaar verification valid.',
    tags: JSON.stringify(['Identity', 'Address Proof'])
  },
  {
    id: 'kyc-emp-010',
    category: 'Employee KYC',
    entity_type: 'Employee',
    entity_id: 'EMP-SANNA-014',
    entity_name: 'Vansh Goyal',
    entity_role: 'Software Developer',
    doc_type: 'PAN Card',
    doc_number: 'FGHVG1245R',
    title: 'Vansh_Goyal_PAN.pdf',
    file_name: 'Vansh_Goyal_PAN.pdf',
    file_size: '1.4 MB',
    file_type: 'application/pdf',
    upload_date: '2026-08-12',
    verified_date: '2026-08-13',
    verified_by: 'Srinivas (Admin)',
    status: 'Verified',
    notes: 'Permanent Account Number verified for tech developer role.',
    tags: JSON.stringify(['Identity', 'Tax ID'])
  },
  {
    id: 'kyc-emp-011',
    category: 'Employee KYC',
    entity_type: 'Employee',
    entity_id: 'EMP-SANNA-009',
    entity_name: 'Riya Biswas Dasgupta',
    entity_role: 'Sr. Graphic Designer',
    doc_type: 'Aadhaar Card',
    doc_number: 'XXXX-XXXX-1145',
    title: 'Riya_Biswas_Aadhaar.pdf',
    file_name: 'Riya_Biswas_Aadhaar.pdf',
    file_size: '2.6 MB',
    file_type: 'application/pdf',
    upload_date: '2026-08-13',
    verified_date: '2026-08-14',
    verified_by: 'Jyothi',
    status: 'Verified',
    notes: 'Identity & residential address proof verified.',
    tags: JSON.stringify(['Identity', 'Address Proof'])
  },
  {
    id: 'kyc-emp-012',
    category: 'Employee KYC',
    entity_type: 'Employee',
    entity_id: 'EMP-SANNA-008',
    entity_name: 'Mavuri Anand Kumar',
    entity_role: 'Video Editor',
    doc_type: 'PAN Card',
    doc_number: 'MAKPK3310T',
    title: 'Anand_Kumar_PAN.pdf',
    file_name: 'Anand_Kumar_PAN.pdf',
    file_size: '1.1 MB',
    file_type: 'application/pdf',
    upload_date: '2026-08-14',
    verified_date: null,
    verified_by: null,
    status: 'Pending Review',
    notes: 'Uploaded by staff. Awaiting HR compliance review.',
    tags: JSON.stringify(['Identity', 'Pending'])
  },
  {
    id: 'kyc-emp-013',
    category: 'Employee KYC',
    entity_type: 'Employee',
    entity_id: 'EMP-SANNA-039',
    entity_name: 'Smitesh Pokharkar',
    entity_role: 'Intern / Engineering Trainee',
    doc_type: 'PAN Card',
    doc_number: 'SMPPK9823Z',
    title: 'Smitesh_Pokharkar_PAN.pdf',
    file_name: 'Smitesh_Pokharkar_PAN.pdf',
    file_size: '1.3 MB',
    file_type: 'application/pdf',
    upload_date: '2026-08-14',
    verified_date: '2026-08-15',
    verified_by: 'HR Compliance Dept',
    status: 'Verified',
    notes: 'PAN identity record verified for engineering intern onboarding.',
    tags: JSON.stringify(['Identity', 'Tax ID', 'Intern'])
  },
  {
    id: 'kyc-client-001',
    category: 'Client KYC',
    entity_type: 'Client',
    entity_id: 'cli-001',
    entity_name: 'Apn Hording',
    entity_role: 'Client Account',
    doc_type: 'GSTIN Certificate',
    doc_number: '36AAACA1234F1Z5',
    title: 'Apn_Hording_GST_Certificate.pdf',
    file_name: 'Apn_Hording_GST_Certificate.pdf',
    file_size: '3.8 MB',
    file_type: 'application/pdf',
    upload_date: '2026-08-02',
    verified_date: '2026-08-03',
    verified_by: 'Finance Dept',
    status: 'Verified',
    notes: 'Active GST registration in Telangana state. Verified on GST Portal.',
    tags: JSON.stringify(['Business KYC', 'GSTIN', 'Tax Compliant'])
  },
  {
    id: 'kyc-client-002',
    category: 'Client KYC',
    entity_type: 'Client',
    entity_id: 'cli-002',
    entity_name: 'Mysira',
    entity_role: 'Client Account',
    doc_type: 'GSTIN Certificate',
    doc_number: '36AABCM9876Q1Z2',
    title: 'Mysira_GST_Registration.pdf',
    file_name: 'Mysira_GST_Registration.pdf',
    file_size: '2.9 MB',
    file_type: 'application/pdf',
    upload_date: '2026-08-04',
    verified_date: '2026-08-05',
    verified_by: 'Finance Dept',
    status: 'Verified',
    notes: 'Regular tax payer under GST. E-Commerce & Retail business.',
    tags: JSON.stringify(['Business KYC', 'GSTIN'])
  },
  {
    id: 'kyc-client-003',
    category: 'Client KYC',
    entity_type: 'Client',
    entity_id: 'cli-003',
    entity_name: 'Sri Krishna Silk Palace',
    entity_role: 'Client Account',
    doc_type: 'GSTIN Certificate',
    doc_number: '29AAGCS5512M1Z8',
    title: 'SriKrishnaSilk_GST_Trade_License.pdf',
    file_name: 'SriKrishnaSilk_GST_Trade_License.pdf',
    file_size: '4.2 MB',
    file_type: 'application/pdf',
    upload_date: '2026-08-08',
    verified_date: '2026-08-09',
    verified_by: 'Finance Dept',
    status: 'Verified',
    notes: 'Trade license and Karnataka GSTIN verified.',
    tags: JSON.stringify(['Business KYC', 'GSTIN', 'Trade License'])
  },
  {
    id: 'kyc-client-004',
    category: 'Client KYC',
    entity_type: 'Client',
    entity_id: 'cli-004',
    entity_name: 'Apex Healthcare Systems',
    entity_role: 'Client Account',
    doc_type: 'Certificate of Incorporation',
    doc_number: 'U85110TG2022PTC160492',
    title: 'Apex_Healthcare_COI_MCA.pdf',
    file_name: 'Apex_Healthcare_COI_MCA.pdf',
    file_size: '5.1 MB',
    file_type: 'application/pdf',
    upload_date: '2026-08-11',
    verified_date: '2026-08-12',
    verified_by: 'Legal Dept',
    status: 'Verified',
    notes: 'Ministry of Corporate Affairs Certificate of Incorporation verified.',
    tags: JSON.stringify(['Business KYC', 'CIN', 'Incorporation'])
  },
  {
    id: 'kyc-client-005',
    category: 'Client KYC',
    entity_type: 'Client',
    entity_id: 'cli-005',
    entity_name: 'Vanguard Logistics Hub',
    entity_role: 'Client Account',
    doc_type: 'GSTIN Certificate',
    doc_number: '36AABCV7744K1Z4',
    title: 'Vanguard_Logistics_GST_Form.pdf',
    file_name: 'Vanguard_Logistics_GST_Form.pdf',
    file_size: '3.3 MB',
    file_type: 'application/pdf',
    upload_date: '2026-08-15',
    verified_date: null,
    verified_by: null,
    status: 'Pending Review',
    notes: 'Newly onboarded enterprise logistics client. Awaiting bank verification.',
    tags: JSON.stringify(['Business KYC', 'Pending'])
  }
];

// ─── DB Helpers ────────────────────────────────────────────────────────────────
function getDb() {
  return new sqlite3.Database(dbPath);
}

function runQuery(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function allQuery(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// ─── Ensure kyc_documents table exists and seed initial documents ──────────────
function ensureKycTable() {
  return new Promise((resolve, reject) => {
    const db = getDb();
    db.run(`
      CREATE TABLE IF NOT EXISTS kyc_documents (
        id          TEXT PRIMARY KEY,
        category    TEXT NOT NULL DEFAULT 'Employee KYC',
        entity_type TEXT NOT NULL DEFAULT 'Employee',
        entity_id   TEXT NOT NULL,
        entity_name TEXT,
        entity_role TEXT,
        doc_type    TEXT,
        doc_number  TEXT,
        title       TEXT,
        file_name   TEXT,
        file_size   TEXT,
        file_type   TEXT,
        file_data   TEXT,
        upload_date TEXT,
        verified_date TEXT,
        verified_by TEXT,
        status      TEXT NOT NULL DEFAULT 'Pending Review',
        notes       TEXT,
        tags        TEXT DEFAULT '[]',
        uploaded_by TEXT,
        created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, async (err) => {
      if (err) {
        db.close();
        return reject(err);
      }

      // Check and seed initial documents if not present
      try {
        for (const doc of SEED_KYC_DOCUMENTS) {
          const sql = `INSERT OR IGNORE INTO kyc_documents (
            id, category, entity_type, entity_id, entity_name, entity_role,
            doc_type, doc_number, title, file_name, file_size, file_type,
            upload_date, verified_date, verified_by, status, notes, tags
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
          await runQuery(db, sql, [
            doc.id, doc.category, doc.entity_type, doc.entity_id, doc.entity_name, doc.entity_role,
            doc.doc_type, doc.doc_number, doc.title, doc.file_name, doc.file_size, doc.file_type,
            doc.upload_date, doc.verified_date, doc.verified_by, doc.status, doc.notes, doc.tags
          ]);
        }
      } catch (e) {
        console.warn('KYC seed warning:', e.message);
      }

      db.close();
      resolve();
    });
  });
}

// Ensure table at module load
ensureKycTable().catch(console.error);

// ─── MIDDLEWARE: resolve user context from JWT ─────────────────────────────────
function resolveUser(req) {
  const user = req.user || {};
  const role = (user.role || '').toLowerCase();
  const roleId = user.roleId || '';
  const isAdmin = roleId === 'role-admin' || role.includes('admin') || role.includes('super admin') || role.includes('org admin');
  return { userId: user.userId || user.id, role, roleId, isAdmin };
}

// ─── GET /api/kyc ──────────────────────────────────────────────────────────────
// Admin: all records | Employee: only their own
router.get('/', async (req, res) => {
  try {
    const { userId, isAdmin } = resolveUser(req);
    const db = getDb();

    let rows;
    if (isAdmin) {
      rows = await allQuery(db, 'SELECT * FROM kyc_documents ORDER BY created_at DESC, upload_date DESC');
    } else {
      rows = await allQuery(db, 'SELECT * FROM kyc_documents WHERE entity_id = ? OR uploaded_by = ? ORDER BY created_at DESC', [userId, userId]);
    }
    db.close();

    const mapped = rows.map(r => ({
      id: r.id,
      category: r.category,
      entityType: r.entity_type,
      entityId: r.entity_id,
      entityName: r.entity_name,
      entityRole: r.entity_role,
      docType: r.doc_type,
      docNumber: r.doc_number,
      title: r.title,
      fileName: r.file_name,
      fileSize: r.file_size,
      fileType: r.file_type,
      fileDataUrl: r.file_data,
      uploadDate: r.upload_date,
      verifiedDate: r.verified_date,
      verifiedBy: r.verified_by,
      status: r.status,
      notes: r.notes,
      tags: (() => { try { return JSON.parse(r.tags || '[]'); } catch { return []; } })(),
      uploadedBy: r.uploaded_by
    }));

    res.json(mapped);
  } catch (err) {
    console.error('KYC GET error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/kyc ─────────────────────────────────────────────────────────────
// Any authenticated user can upload a KYC document
router.post('/', async (req, res) => {
  try {
    const { userId, isAdmin } = resolveUser(req);
    const {
      category = 'Employee KYC',
      entityId,
      entityName,
      entityRole,
      docType,
      docNumber,
      title,
      fileName,
      fileSize,
      fileType,
      fileDataUrl,
      notes,
      tags = [],
      status = 'Pending Review'
    } = req.body;

    const effectiveEntityId = entityId || userId;
    if (!effectiveEntityId) {
      return res.status(400).json({ error: 'entityId is required.' });
    }

    const id = `kyc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const uploadDate = new Date().toISOString().split('T')[0];
    const effectiveStatus = isAdmin ? (status || 'Verified') : 'Pending Review';

    const db = getDb();
    await runQuery(db, `
      INSERT INTO kyc_documents (id, category, entity_type, entity_id, entity_name, entity_role, doc_type, doc_number, title, file_name, file_size, file_type, file_data, upload_date, status, notes, tags, uploaded_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      category,
      category === 'Employee KYC' ? 'Employee' : 'Client',
      effectiveEntityId,
      entityName || '',
      entityRole || '',
      docType || '',
      docNumber || '',
      title || fileName || '',
      fileName || '',
      fileSize || '',
      fileType || '',
      fileDataUrl || null,
      uploadDate,
      effectiveStatus,
      notes || '',
      JSON.stringify(Array.isArray(tags) ? tags : [tags]),
      userId
    ]);
    db.close();

    res.status(201).json({
      id,
      category,
      entityId: effectiveEntityId,
      entityName,
      docType,
      title,
      fileName,
      status: effectiveStatus,
      uploadDate,
      message: 'KYC document submitted successfully.'
    });
  } catch (err) {
    console.error('KYC POST error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/kyc/:id/verify ───────────────────────────────────────────────────
// Admin only: approve or reject a KYC document
router.put('/:id/verify', async (req, res) => {
  try {
    const { isAdmin, userId } = resolveUser(req);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Access denied. Only Admins can verify KYC documents.' });
    }

    const { id } = req.params;
    const { status = 'Verified', notes = '', verifiedBy } = req.body;

    if (!['Verified', 'Rejected', 'Pending Review'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be Verified, Rejected, or Pending Review.' });
    }

    const verifiedDate = new Date().toISOString().split('T')[0];
    const db = getDb();
    const result = await runQuery(db, `
      UPDATE kyc_documents SET status = ?, verified_date = ?, verified_by = ?, notes = CASE WHEN ? != '' THEN ? ELSE notes END WHERE id = ?
    `, [status, verifiedDate, verifiedBy || 'Admin', notes, notes, id]);
    db.close();

    if (result.changes === 0) {
      return res.status(404).json({ error: 'KYC document not found.' });
    }

    res.json({ success: true, id, status, verifiedDate, message: `Document ${status.toLowerCase()} successfully.` });
  } catch (err) {
    console.error('KYC verify error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/kyc/:id ──────────────────────────────────────────────────────────
// Admin only: general update
router.put('/:id', async (req, res) => {
  try {
    const { isAdmin } = resolveUser(req);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const { id } = req.params;
    const { status, notes, verifiedBy, verifiedDate } = req.body;
    const db = getDb();
    await runQuery(db, `
      UPDATE kyc_documents SET
        status = COALESCE(?, status),
        notes = COALESCE(?, notes),
        verified_by = COALESCE(?, verified_by),
        verified_date = COALESCE(?, verified_date)
      WHERE id = ?
    `, [status, notes, verifiedBy, verifiedDate, id]);
    db.close();
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/kyc/:id/file ─────────────────────────────────────────────────────
// Returns the actual file as binary response (image, PDF, etc.)
router.get('/:id/file', async (req, res) => {
  try {
    const { isAdmin, userId } = resolveUser(req);
    const { id } = req.params;

    const db = getDb();
    const rows = await allQuery(db, 'SELECT id, entity_id, uploaded_by, file_name, file_type, file_data FROM kyc_documents WHERE id = ?', [id]);
    db.close();

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'KYC document not found.' });
    }

    const doc = rows[0];

    // Security: admins can see all, employees can only see their own
    if (!isAdmin && doc.entity_id !== userId && doc.uploaded_by !== userId) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    if (!doc.file_data) {
      return res.status(404).json({ error: 'No file attached to this document.' });
    }

    // file_data stored as data URL: "data:image/jpeg;base64,..."
    const dataUrl = doc.file_data;
    if (dataUrl.startsWith('data:')) {
      const [header, base64Data] = dataUrl.split(',');
      const mimeType = header.match(/:(.*?);/)?.[1] || 'application/octet-stream';
      const buffer = Buffer.from(base64Data, 'base64');
      const fileName = doc.file_name || `${doc.id}.bin`;

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', buffer.length);
      return res.end(buffer);
    }

    // If stored as raw base64 without header prefix, assume binary
    try {
      const buffer = Buffer.from(dataUrl, 'base64');
      const fileName = doc.file_name || `${doc.id}.bin`;
      const mimeType = doc.file_type || 'application/octet-stream';
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', buffer.length);
      return res.end(buffer);
    } catch {
      return res.status(500).json({ error: 'Could not decode file data.' });
    }
  } catch (err) {
    console.error('KYC file download error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/kyc/:id ───────────────────────────────────────────────────────
// Admin only: delete a KYC record
router.delete('/:id', async (req, res) => {
  try {
    const { isAdmin } = resolveUser(req);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Access denied. Only Admins can delete KYC documents.' });
    }

    const { id } = req.params;
    const db = getDb();
    const result = await runQuery(db, 'DELETE FROM kyc_documents WHERE id = ?', [id]);
    db.close();

    if (result.changes === 0) {
      return res.status(404).json({ error: 'KYC document not found.' });
    }

    res.json({ success: true, id, message: 'KYC document deleted.' });
  } catch (err) {
    console.error('KYC DELETE error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/kyc/employee/:employeeId ────────────────────────────────────────
// Admin: see any employee's KYC | Employee: only their own
router.get('/employee/:employeeId', async (req, res) => {
  try {
    const { userId, isAdmin } = resolveUser(req);
    const { employeeId } = req.params;

    if (!isAdmin && employeeId !== userId) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const db = getDb();
    const rows = await allQuery(db, 'SELECT * FROM kyc_documents WHERE entity_id = ? ORDER BY created_at DESC', [employeeId]);
    db.close();

    res.json(rows.map(r => ({
      id: r.id,
      category: r.category,
      entityId: r.entity_id,
      entityName: r.entity_name,
      docType: r.doc_type,
      docNumber: r.doc_number,
      title: r.title,
      fileName: r.file_name,
      fileSize: r.file_size,
      fileType: r.file_type,
      fileDataUrl: r.file_data,
      uploadDate: r.upload_date,
      verifiedDate: r.verified_date,
      verifiedBy: r.verified_by,
      status: r.status,
      notes: r.notes,
      tags: (() => { try { return JSON.parse(r.tags || '[]'); } catch { return []; } })()
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/kyc/status/:employeeId ──────────────────────────────────────────
// Returns KYC status summary for an employee (for modal trigger check)
router.get('/status/:employeeId', async (req, res) => {
  try {
    const { userId, isAdmin } = resolveUser(req);
    const { employeeId } = req.params;

    if (!isAdmin && employeeId !== userId) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const db = getDb();
    const rows = await allQuery(db, 'SELECT status, doc_type FROM kyc_documents WHERE entity_id = ?', [employeeId]);
    db.close();

    const total = rows.length;
    const verified = rows.filter(r => r.status === 'Verified').length;
    const pending = rows.filter(r => r.status === 'Pending Review').length;
    const kycComplete = total >= 3; // All 3 compulsory docs uploaded

    res.json({ employeeId, total, verified, pending, kycComplete, status: total === 0 ? 'Not Submitted' : (verified === total ? 'Verified' : 'Pending Review') });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
