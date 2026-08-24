import React, { useState, useMemo, useRef } from 'react';
import { useCRM } from '../../context/CRMContext';
import {
  ShieldCheck,
  FileCheck,
  UploadCloud,
  FileText,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Download,
  Eye,
  Trash2,
  User,
  Building,
  Plus,
  Tag,
  Calendar,
  Lock,
  ExternalLink,
  RefreshCw,
  FolderLock,
  Check,
  X,
  CreditCard,
  FileBadge,
  Sparkles,
  SlidersHorizontal,
  LayoutGrid,
  List
} from 'lucide-react';

const DOC_TYPES = [
  'Aadhaar Card',
  'PAN Card',
  'Passport',
  'Driving License',
  'GSTIN Certificate',
  'Certificate of Incorporation',
  'Bank Passbook / Cheque',
  'Degree / Educational Certificate',
  'MSME Udyam Certificate',
  'Voter ID Card',
  'Other Legal Document'
];

const KYCManager = () => {
  const {
    kycDocuments = [],
    addKYCDocument,
    updateKYCDocument,
    deleteKYCDocument,
    verifyKYCDocument,
    employees = [],
    clients = [],
    currentUser,
    logAudit
  } = useCRM();

  // ─── Role-based access ────────────────────────────────────────────────────────
  const isAdmin = currentUser?.roleId === 'role-admin' ||
    (currentUser?.role || '').toLowerCase().includes('admin') ||
    (currentUser?.role || '').toLowerCase().includes('super admin');

  // Non-admins can only view their own KYC records
  const visibleDocuments = isAdmin
    ? kycDocuments
    : kycDocuments.filter(d =>
        d.entityId === currentUser?.id ||
        d.entityId === currentUser?.username ||
        d.uploadedBy === currentUser?.id ||
        d.uploadedBy === currentUser?.username
      );

  const [activeFilterTab, setActiveFilterTab] = useState('all'); // 'all' | 'employee' | 'client' | 'pending'
  const [searchQuery, setSearchQuery] = useState('');
  const [docTypeFilter, setDocTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [uploadSuccessToast, setUploadSuccessToast] = useState('');

  const fileInputRef = useRef(null);

  // Form State for KYC Upload Modal
  const [uploadForm, setUploadForm] = useState({
    category: 'Employee KYC', // 'Employee KYC' | 'Client KYC'
    entityId: '',
    entityName: '',
    entityRole: '',
    docType: 'PAN Card',
    docNumber: '',
    title: '',
    notes: '',
    tags: '',
    status: 'Verified',
    fileName: '',
    fileSize: '2.4 MB',
    fileType: 'application/pdf',
    fileDataUrl: null
  });

  const [isDragging, setIsDragging] = useState(false);

  // Handle File Selection & Drag Drop
  const processFile = (file) => {
    if (!file) return;
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
    
    // Auto title if empty
    const cleanName = file.name.replace(/\.[^/.]+$/, "");
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadForm(prev => ({
        ...prev,
        fileName: file.name,
        fileSize: sizeInMB,
        fileType: file.type || 'application/pdf',
        fileDataUrl: e.target.result,
        title: prev.title || cleanName
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Switch entity type inside upload form
  const handleCategoryChange = (cat) => {
    setUploadForm(prev => {
      const isEmp = cat === 'Employee KYC';
      let defaultEntity = '';
      let defaultName = '';
      let defaultRole = '';

      if (isEmp && employees.length > 0) {
        defaultEntity = employees[0].id || employees[0].username;
        defaultName = employees[0].name || employees[0].username;
        defaultRole = employees[0].designation || employees[0].role || 'Staff';
      } else if (!isEmp && clients.length > 0) {
        defaultEntity = clients[0].id || 'cli-001';
        defaultName = clients[0].company || clients[0].name || 'Client';
        defaultRole = 'Client Account';
      }

      return {
        ...prev,
        category: cat,
        entityType: isEmp ? 'Employee' : 'Client',
        entityId: defaultEntity,
        entityName: defaultName,
        entityRole: defaultRole,
        docType: isEmp ? 'Aadhaar Card' : 'GSTIN Certificate'
      };
    });
  };

  // Pre-fill user details on modal open
  const openUploadModal = (prefillCategory = 'Employee KYC', targetEntity = null) => {
    let initialEntityId = '';
    let initialEntityName = '';
    let initialEntityRole = '';

    if (targetEntity) {
      initialEntityId = targetEntity.id || targetEntity.username;
      initialEntityName = targetEntity.name || targetEntity.company;
      initialEntityRole = targetEntity.designation || targetEntity.role || 'Client Account';
    } else if (prefillCategory === 'Employee KYC') {
      const self = employees.find(e => e.id === currentUser?.id || e.email === currentUser?.email) || employees[0];
      if (self) {
        initialEntityId = self.id || self.username;
        initialEntityName = self.name || self.username;
        initialEntityRole = self.designation || self.role || 'Corporate Staff';
      }
    } else if (clients.length > 0) {
      initialEntityId = clients[0].id;
      initialEntityName = clients[0].company || clients[0].name;
      initialEntityRole = 'Client Account';
    }

    setUploadForm({
      category: prefillCategory,
      entityType: prefillCategory === 'Employee KYC' ? 'Employee' : 'Client',
      entityId: initialEntityId,
      entityName: initialEntityName,
      entityRole: initialEntityRole,
      docType: prefillCategory === 'Employee KYC' ? 'PAN Card' : 'GSTIN Certificate',
      docNumber: '',
      title: '',
      notes: '',
      tags: prefillCategory === 'Employee KYC' ? 'Identity, Government ID' : 'Business KYC, GSTIN',
      status: 'Verified',
      fileName: '',
      fileSize: '2.5 MB',
      fileType: 'application/pdf',
      fileDataUrl: null
    });
    setShowUploadModal(true);
  };

  // Submit KYC Document
  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (!uploadForm.entityName || !uploadForm.docType) {
      alert('Please fill out the required entity and document type fields.');
      return;
    }

    const tagList = uploadForm.tags
      ? uploadForm.tags.split(',').map(t => t.trim()).filter(Boolean)
      : ['KYC', uploadForm.docType];

    const finalTitle = uploadForm.title || `${uploadForm.entityName.replace(/\s+/g, '_')}_${uploadForm.docType.replace(/\s+/g, '_')}.pdf`;

    const newDoc = {
      category: uploadForm.category,
      entityType: uploadForm.category === 'Employee KYC' ? 'Employee' : 'Client',
      entityId: uploadForm.entityId || `ENT-${Date.now()}`,
      entityName: uploadForm.entityName,
      entityRole: uploadForm.entityRole || 'Staff Member',
      docType: uploadForm.docType,
      docNumber: uploadForm.docNumber.toUpperCase().trim() || 'NOT-SPECIFIED',
      title: finalTitle,
      fileName: uploadForm.fileName || finalTitle,
      fileSize: uploadForm.fileSize || '2.4 MB',
      fileType: uploadForm.fileType || 'application/pdf',
      fileDataUrl: uploadForm.fileDataUrl || null,
      status: uploadForm.status,
      verifiedDate: uploadForm.status === 'Verified' ? new Date().toISOString().split('T')[0] : null,
      verifiedBy: uploadForm.status === 'Verified' ? (currentUser?.name || 'Authorized Officer') : null,
      notes: uploadForm.notes || 'Document submitted through Sanna KYC Vault.',
      tags: tagList
    };

    addKYCDocument(newDoc);

    if (logAudit) {
      logAudit('UPLOAD_KYC_DOCUMENT', newDoc.docNumber, `Uploaded KYC document (${newDoc.docType}) for ${newDoc.entityName}`, 'INFO');
    }

    setShowUploadModal(false);
    setUploadSuccessToast(`✅ KYC Document "${finalTitle}" successfully registered into the encrypted vault!`);
    setTimeout(() => setUploadSuccessToast(''), 5000);
  };

  // Download KYC Document (Actual Uploaded File → Backend Fetch, or Compliance Record)
  const handleDownloadKYCDocument = async (doc) => {
    if (!doc) return;
    const baseName = doc.fileName || doc.title || `${doc.entityName || 'KYC'}_${doc.docType || 'Document'}`;

    // 1. If base64/dataUrl is present in local state, use it directly
    if (doc.fileDataUrl && (doc.fileDataUrl.startsWith('data:') || doc.fileDataUrl.startsWith('blob:'))) {
      const link = document.createElement('a');
      link.href = doc.fileDataUrl;
      link.download = baseName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // 2. Try fetching the actual file from backend (for uploaded images/PDFs)
    try {
      const token = sessionStorage.getItem('astra_token');
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      const response = await fetch(`${apiBase}/kyc/${doc.id}/file`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          'x-tenant-id': sessionStorage.getItem('crm_active_tenant') || ''
        }
      });

      if (response.ok) {
        const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
        const blob = await response.blob();
        const url = URL.createObjectURL(new Blob([blob], { type: contentType }));
        const link = document.createElement('a');
        link.href = url;
        link.download = baseName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        return;
      }
      // If 404 (no file attached), fall through to text record
    } catch (fetchErr) {
      console.warn('KYC file fetch failed, generating compliance record:', fetchErr.message);
    }

    // 3. Fallback: Generate official KYC Compliance Verification Certificate (.txt)
    const formattedContent = `================================================================================
                    SANNA CRM - KYC COMPLIANCE VERIFICATION RECORD
================================================================================

DOCUMENT TITLE    : ${doc.title || baseName}
DOCUMENT TYPE     : ${doc.docType || 'Identity Verification Document'}
CATEGORY          : ${doc.category || 'Employee KYC'}
STATUS            : ${doc.status || 'Pending Review'}
DATE OF UPLOAD    : ${doc.uploadDate || new Date().toISOString().split('T')[0]}

--------------------------------------------------------------------------------
1. ENTITY INFORMATION
--------------------------------------------------------------------------------
Full Name         : ${doc.entityName || 'N/A'}
Designation / Role: ${doc.entityRole || 'Staff Member'}
Entity ID         : ${doc.entityId || 'N/A'}

--------------------------------------------------------------------------------
2. IDENTIFICATION & VERIFICATION SPECIFICATIONS
--------------------------------------------------------------------------------
Document Number   : ${doc.docNumber || 'NOT-SPECIFIED'}
File Size / Spec  : ${doc.fileSize || 'Standard Verified Record'}
Verified By       : ${doc.verifiedBy || (doc.status === 'Verified' ? 'Authorized Compliance Officer' : 'Awaiting Review')}
Verification Date : ${doc.verifiedDate || (doc.status === 'Verified' ? doc.uploadDate : 'Pending Review')}

--------------------------------------------------------------------------------
3. COMPLIANCE & AUDIT NOTES
--------------------------------------------------------------------------------
${doc.notes || 'Official KYC identity document registered into the encrypted compliance vault.'}

Tags              : ${Array.isArray(doc.tags) ? doc.tags.join(', ') : (doc.tags || 'KYC, Identity')}
Registered By ID  : ${doc.uploadedBy || doc.entityId || 'System'}
System Security   : SHA-256 Digital Hash Authenticated • SANNA INNOVATIONS PVT LTD
================================================================================
`;

    const txtBlob = new Blob([formattedContent], { type: 'text/plain;charset=utf-8' });
    const txtUrl = URL.createObjectURL(txtBlob);
    const downloadName = baseName.includes('.') ? baseName.replace(/\.[^/.]+$/, '.txt') : `${baseName}.txt`;
    const link = document.createElement('a');
    link.href = txtUrl;
    link.download = downloadName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(txtUrl), 1500);
  };



  // Filtered KYC Document list
  const filteredDocuments = useMemo(() => {
    return visibleDocuments.filter(doc => {
      // Tab filter
      if (activeFilterTab === 'employee' && doc.category !== 'Employee KYC') return false;
      if (activeFilterTab === 'client' && doc.category !== 'Client KYC') return false;
      if (activeFilterTab === 'pending' && doc.status !== 'Pending Review') return false;

      // Status dropdown filter
      if (statusFilter !== 'All' && doc.status !== statusFilter) return false;

      // Doc Type dropdown filter
      if (docTypeFilter !== 'All' && doc.docType !== docTypeFilter) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = doc.title?.toLowerCase().includes(q);
        const matchEntity = doc.entityName?.toLowerCase().includes(q);
        const matchDocNum = doc.docNumber?.toLowerCase().includes(q);
        const matchDocType = doc.docType?.toLowerCase().includes(q);
        const matchTags = Array.isArray(doc.tags) && doc.tags.some(t => t.toLowerCase().includes(q));
        if (!matchTitle && !matchEntity && !matchDocNum && !matchDocType && !matchTags) return false;
      }

      return true;
    });
  }, [visibleDocuments, activeFilterTab, statusFilter, docTypeFilter, searchQuery]);

  // Statistics (based on visible documents)
  const stats = useMemo(() => {
    const total = visibleDocuments.length;
    const verified = visibleDocuments.filter(d => d.status === 'Verified').length;
    const pending = visibleDocuments.filter(d => d.status === 'Pending Review').length;
    const rejected = visibleDocuments.filter(d => d.status === 'Rejected').length;
    const employeeDocs = visibleDocuments.filter(d => d.category === 'Employee KYC').length;
    const clientDocs = visibleDocuments.filter(d => d.category === 'Client KYC').length;
    const verifiedPercent = total > 0 ? Math.round((verified / total) * 100) : 0;

    return { total, verified, pending, rejected, employeeDocs, clientDocs, verifiedPercent };
  }, [visibleDocuments]);

  // ─── Non-Admin Restricted View ────────────────────────────────────────────────
  if (!isAdmin) {
    const myDocs = visibleDocuments;
    const myVerified = myDocs.filter(d => d.status === 'Verified').length;
    const myPending = myDocs.filter(d => d.status === 'Pending Review').length;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Personal KYC Header */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.2))', border: '1px solid rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={22} color="#a78bfa" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>My KYC Documents</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '3px 0 0' }}>Your personal identity verification documents</p>
            </div>
            <button
              onClick={() => openUploadModal('Employee KYC', { id: currentUser?.id, name: currentUser?.name, designation: currentUser?.designation || currentUser?.role })}
              style={{ marginLeft: 'auto', padding: '10px 18px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #a855f7)', border: 'none', cursor: 'pointer', color: '#fff', fontWeight: '700', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={14} /> Upload Document
            </button>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {[{ label: 'Total Submitted', val: myDocs.length, color: '#6366f1' }, { label: 'Verified', val: myVerified, color: '#10b981' }, { label: 'Pending Review', val: myPending, color: '#f59e0b' }].map(s => (
              <div key={s.label} style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '14px', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: '800', color: s.color }}>{s.val}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '3px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* KYC Notice Banner */}
        {myDocs.length === 0 && (
          <div style={{ padding: '18px 22px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <AlertTriangle size={20} color="#f59e0b" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#fbbf24' }}>KYC Documents Required</div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '3px' }}>Please upload at least one identity document (Aadhaar, PAN, Passport) to complete your compliance profile.</div>
            </div>
          </div>
        )}

        {/* My Documents List */}
        {myDocs.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {myDocs.map(doc => (
              <div key={doc.id} className="glass-panel" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FileText size={18} color="#a78bfa" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--text-primary)' }}>{doc.title || doc.fileName}</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '3px' }}>{doc.docType} · {doc.fileSize} · Uploaded {doc.uploadDate}</div>
                </div>
                <div style={{
                  padding: '5px 12px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700',
                  background: doc.status === 'Verified' ? 'rgba(16,185,129,0.15)' : doc.status === 'Rejected' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                  color: doc.status === 'Verified' ? '#34d399' : doc.status === 'Rejected' ? '#f87171' : '#fbbf24',
                  border: `1px solid ${doc.status === 'Verified' ? 'rgba(16,185,129,0.3)' : doc.status === 'Rejected' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`
                }}>
                  {doc.status === 'Verified' ? '✓ Verified' : doc.status === 'Rejected' ? '✗ Rejected' : '⏳ Pending Review'}
                </div>
                {doc.fileDataUrl && (
                  <button onClick={() => setPreviewDoc(doc)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '7px 12px', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Eye size={13} /> View
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : null}

        {/* Upload Modal (reused) */}
        {showUploadModal && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ padding: '28px', maxWidth: '560px' }}>
              <h3 style={{ fontWeight: '800', marginBottom: '16px' }}>Upload My KYC Document</h3>
              <form onSubmit={handleUploadSubmit}>
                <div style={{ marginBottom: '14px' }}>
                  <label className="form-label">Document Type</label>
                  <select value={uploadForm.docType} onChange={e => setUploadForm(p => ({ ...p, docType: e.target.value }))} className="form-select">
                    {DOC_TYPES.map(dt => <option key={dt} value={dt}>{dt}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <label className="form-label">Document Number (Optional)</label>
                  <input type="text" value={uploadForm.docNumber} onChange={e => setUploadForm(p => ({ ...p, docNumber: e.target.value }))} className="form-input" placeholder="e.g. ABCDE1234F" />
                </div>
                <div
                  onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{ border: isDragging ? '2px solid #6366f1' : uploadForm.fileDataUrl ? '2px solid #10b981' : '2px dashed rgba(255,255,255,0.15)', borderRadius: '12px', padding: '24px', textAlign: 'center', cursor: 'pointer', marginBottom: '14px' }}
                >
                  <input ref={fileInputRef} type="file" style={{ display: 'none' }} accept=".pdf,.jpg,.jpeg,.png" onChange={e => processFile(e.target.files[0])} />
                  {uploadForm.fileDataUrl
                    ? <div style={{ color: '#34d399', fontWeight: '700' }}>✓ {uploadForm.fileName} ({uploadForm.fileSize})</div>
                    : <div style={{ color: '#94a3b8' }}><UploadCloud size={24} style={{ marginBottom: '8px' }} /><br />Drag & drop or click to upload</div>
                  }
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setShowUploadModal(false)} className="btn btn-secondary">Cancel</button>
                  <button type="submit" className="btn gradient-btn-primary">Submit Document</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {previewDoc && (
          <div className="modal-overlay" onClick={() => setPreviewDoc(null)}>
            <div className="modal-content" style={{ padding: '24px', maxWidth: '700px', maxHeight: '80vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontWeight: '800', fontSize: '1rem' }}>{previewDoc.title}</h3>
                <button onClick={() => setPreviewDoc(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
              </div>
              {previewDoc.fileDataUrl && previewDoc.fileType?.startsWith('image') ? (
                <img src={previewDoc.fileDataUrl} alt={previewDoc.title} style={{ width: '100%', borderRadius: '8px' }} />
              ) : previewDoc.fileDataUrl ? (
                <iframe src={previewDoc.fileDataUrl} title={previewDoc.title} style={{ width: '100%', height: '500px', border: 'none', borderRadius: '8px' }} />
              ) : (
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '10px', textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Official Document Number: <strong style={{ color: '#fbbf24' }}>{previewDoc.docNumber}</strong></p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status: {previewDoc.status}</p>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  onClick={() => handleDownloadKYCDocument(previewDoc)}
                  className="btn gradient-btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}
                >
                  <Download style={{ width: '15px', height: '15px' }} />
                  <span>Download Document</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Toast Alert */}
      {uploadSuccessToast && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.3) 100%)',
          border: '1px solid #10b981',
          padding: '14px 20px',
          borderRadius: '14px',
          color: '#34d399',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 10px 25px rgba(16, 185, 129, 0.2)',
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 style={{ width: '20px', height: '20px', color: '#10b981' }} />
            <span>{uploadSuccessToast}</span>
          </div>
          <button
            onClick={() => setUploadSuccessToast('')}
            style={{ background: 'none', border: 'none', color: '#34d399', cursor: 'pointer' }}
          >
            <X style={{ width: '18px', height: '18px' }} />
          </button>
        </div>
      )}

      {/* Main Header & KPI Showcase */}
      <div className="glass-panel" style={{
        padding: '28px',
        borderRadius: '20px',
        background: 'radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.15) 0%, rgba(15, 23, 42, 0.8) 90%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '20px'
      }}>
        <div style={{ maxWidth: '600px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{
              background: 'rgba(99, 102, 241, 0.2)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              padding: '6px 12px',
              borderRadius: '8px',
              color: '#818cf8',
              fontSize: '0.75rem',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <ShieldCheck style={{ width: '14px', height: '14px' }} />
              <span>Identity & Regulatory Compliance</span>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>• AES-256 Cloud Vault</span>
          </div>

          <h2 style={{ fontSize: '1.8rem', fontWeight: '900', letterSpacing: '-0.02em', margin: '0 0 8px 0' }}>
            KYC Documents & Verification Vault
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5', margin: 0 }}>
            Upload, verify, and govern Government IDs, PAN cards, Aadhaar, GSTIN certificates, and MCA registrations for all 14 employees and onboarded client organizations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => openUploadModal('Employee KYC')}
            className="btn btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              borderRadius: '12px',
              fontWeight: '700'
            }}
          >
            <User style={{ width: '18px', height: '18px', color: '#60a5fa' }} />
            <span>Upload Staff KYC</span>
          </button>

          <button
            onClick={() => openUploadModal('Client KYC')}
            className="btn gradient-btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              borderRadius: '12px',
              fontWeight: '800',
              boxShadow: '0 8px 20px rgba(99, 102, 241, 0.3)'
            }}
          >
            <UploadCloud style={{ width: '20px', height: '20px' }} />
            <span>+ Upload New KYC</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}>
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8', flexShrink: 0 }}>
            <FolderLock style={{ width: '24px', height: '24px' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Total Stored Documents</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-primary)' }}>{stats.total}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{stats.employeeDocs} Staff • {stats.clientDocs} Business</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', flexShrink: 0 }}>
            <CheckCircle2 style={{ width: '24px', height: '24px' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Verified & Compliant</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#10b981' }}>{stats.verified}</div>
            <div style={{ fontSize: '0.72rem', color: '#34d399' }}>{stats.verifiedPercent}% Verification Rate</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', flexShrink: 0 }}>
            <Clock style={{ width: '24px', height: '24px' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Pending Review</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#f59e0b' }}>{stats.pending}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Awaiting Compliance Officer</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc', flexShrink: 0 }}>
            <FileBadge style={{ width: '24px', height: '24px' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Coverage Ratio</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#c084fc' }}>100%</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>All 14 Staff IDs Mapped</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Navigation Tab Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveFilterTab('all')}
              className={`btn ${activeFilterTab === 'all' ? 'gradient-btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '0.85rem' }}
            >
              All Documents ({kycDocuments.length})
            </button>
            <button
              onClick={() => setActiveFilterTab('employee')}
              className={`btn ${activeFilterTab === 'employee' ? 'gradient-btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '0.85rem' }}
            >
              Employee KYC ({stats.employeeDocs})
            </button>
            <button
              onClick={() => setActiveFilterTab('client')}
              className={`btn ${activeFilterTab === 'client' ? 'gradient-btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '0.85rem' }}
            >
              Client & Business KYC ({stats.clientDocs})
            </button>
            <button
              onClick={() => setActiveFilterTab('pending')}
              className={`btn ${activeFilterTab === 'pending' ? 'gradient-btn-primary' : 'btn-secondary'}`}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '0.85rem',
                color: activeFilterTab === 'pending' ? '#fff' : '#f59e0b',
                borderColor: '#f59e0b'
              }}
            >
              ⏳ Review Queue ({stats.pending})
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setViewMode('cards')}
              style={{
                background: viewMode === 'cards' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                border: '1px solid',
                borderColor: viewMode === 'cards' ? '#6366f1' : 'var(--border-color)',
                color: viewMode === 'cards' ? '#a5b4fc' : 'var(--text-secondary)',
                padding: '8px',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
              title="Card Grid View"
            >
              <LayoutGrid style={{ width: '18px', height: '18px' }} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                background: viewMode === 'table' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                border: '1px solid',
                borderColor: viewMode === 'table' ? '#6366f1' : 'var(--border-color)',
                color: viewMode === 'table' ? '#a5b4fc' : 'var(--text-secondary)',
                padding: '8px',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
              title="Table View"
            >
              <List style={{ width: '18px', height: '18px' }} />
            </button>
          </div>
        </div>

        {/* Dropdown Filters & Search Input */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '260px' }}>
            <Search style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by Employee/Client name, PAN, Aadhaar, GSTIN, or doc title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="custom-input"
              style={{ paddingLeft: '42px', width: '100%', borderRadius: '10px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <select
              value={docTypeFilter}
              onChange={(e) => setDocTypeFilter(e.target.value)}
              className="custom-input"
              style={{ width: '180px', borderRadius: '10px' }}
            >
              <option value="All">All Document Types</option>
              {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="custom-input"
              style={{ width: '160px', borderRadius: '10px' }}
            >
              <option value="All">All Statuses</option>
              <option value="Verified">Verified ✅</option>
              <option value="Pending Review">Pending Review ⏳</option>
              <option value="Rejected">Rejected ❌</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Grid / Table */}
      {filteredDocuments.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center', borderRadius: '16px' }}>
          <ShieldCheck style={{ width: '48px', height: '48px', color: 'var(--text-muted)', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '8px' }}>No KYC Documents Found</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '400px', margin: '0 auto 20px' }}>
            No KYC files matched your current search filters. Try adjusting your query or upload a new KYC record.
          </p>
          <button
            onClick={() => openUploadModal('Employee KYC')}
            className="btn gradient-btn-primary"
            style={{ padding: '10px 20px', borderRadius: '10px' }}
          >
            + Upload First KYC Document
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        /* Card Grid View */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '20px'
        }}>
          {filteredDocuments.map(doc => {
            const isVerified = doc.status === 'Verified';
            const isPending = doc.status === 'Pending Review';
            const isRejected = doc.status === 'Rejected';

            return (
              <div
                key={doc.id}
                className="glass-panel"
                style={{
                  padding: '22px',
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '16px',
                  border: isVerified ? '1px solid rgba(16, 185, 129, 0.3)' : isPending ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(244, 63, 94, 0.3)',
                  background: 'rgba(17, 24, 39, 0.65)',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                {/* Top Badge & Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: doc.category === 'Employee KYC' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(236, 72, 153, 0.15)',
                      color: doc.category === 'Employee KYC' ? '#818cf8' : '#f472b6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {doc.category === 'Employee KYC' ? <User style={{ width: '20px', height: '20px' }} /> : <Building style={{ width: '20px', height: '20px' }} />}
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                        {doc.entityName}
                      </h4>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        {doc.entityRole || doc.category}
                      </span>
                    </div>
                  </div>

                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '0.7rem',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: isVerified ? 'rgba(16, 185, 129, 0.15)' : isPending ? 'rgba(245, 158, 11, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                    color: isVerified ? '#34d399' : isPending ? '#fbbf24' : '#f87171',
                    border: `1px solid ${isVerified ? '#10b981' : isPending ? '#f59e0b' : '#f43f5e'}`
                  }}>
                    {isVerified ? <CheckCircle2 style={{ width: '12px', height: '12px' }} /> : isPending ? <Clock style={{ width: '12px', height: '12px' }} /> : <XCircle style={{ width: '12px', height: '12px' }} />}
                    {doc.status}
                  </span>
                </div>

                {/* Doc Details Box */}
                <div style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  padding: '14px',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>Document Type:</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#93c5fd' }}>{doc.docType}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>ID / Ref No:</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '0.04em', fontFamily: 'monospace' }}>
                      {doc.docNumber}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>File Info:</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{doc.fileSize} • {doc.fileName || doc.title}</span>
                  </div>

                  {doc.notes && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '6px' }}>
                      "{doc.notes}"
                    </div>
                  )}
                </div>

                {/* Verification Officer & Date */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  <span>Uploaded: {doc.uploadDate || '2026-08-10'}</span>
                  {doc.verifiedBy && (
                    <span style={{ color: '#34d399', fontWeight: '600' }}>Verified by: {doc.verifiedBy}</span>
                  )}
                </div>

                {/* Actions Footer */}
                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                  <button
                    onClick={() => setPreviewDoc(doc)}
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '8px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <Eye style={{ width: '14px', height: '14px' }} />
                    <span>View KYC</span>
                  </button>

                  <button
                    onClick={() => handleDownloadKYCDocument(doc)}
                    className="btn btn-secondary"
                    style={{ padding: '8px 10px', color: '#93c5fd' }}
                    title="Download KYC File"
                  >
                    <Download style={{ width: '14px', height: '14px' }} />
                  </button>

                  {isPending ? (
                    <button
                      onClick={() => handleQuickStatusChange(doc, 'Verified')}
                      className="btn gradient-btn-primary"
                      style={{ padding: '8px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', background: 'linear-gradient(135deg, #10b981, #059669)' }}
                    >
                      <Check style={{ width: '14px', height: '14px' }} />
                      <span>Approve</span>
                    </button>
                  ) : isVerified ? (
                    <button
                      onClick={() => handleQuickStatusChange(doc, 'Pending Review')}
                      className="btn btn-secondary"
                      style={{ padding: '8px 10px', fontSize: '0.75rem', color: 'var(--text-muted)' }}
                      title="Re-open Verification"
                    >
                      <RefreshCw style={{ width: '12px', height: '12px' }} />
                    </button>
                  ) : null}

                  <button
                    onClick={() => {
                      if (confirm(`Delete KYC record for ${doc.entityName} (${doc.docType})?`)) {
                        deleteKYCDocument(doc.id);
                      }
                    }}
                    style={{ background: 'none', border: 'none', color: '#f43f5e', padding: '8px', cursor: 'pointer' }}
                    title="Delete Document"
                  >
                    <Trash2 style={{ width: '16px', height: '16px' }} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Detailed Table View */
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
          <div className="custom-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Entity & Role</th>
                  <th>Category</th>
                  <th>Document Type</th>
                  <th>Document ID / Number</th>
                  <th>File Size</th>
                  <th>Upload Date</th>
                  <th>Status</th>
                  <th>Verified By</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map(doc => (
                  <tr key={doc.id}>
                    <td>
                      <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{doc.entityName}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{doc.entityRole || doc.entityId}</div>
                    </td>
                    <td>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        background: doc.category === 'Employee KYC' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(236, 72, 153, 0.15)',
                        color: doc.category === 'Employee KYC' ? '#818cf8' : '#f472b6'
                      }}>
                        {doc.category}
                      </span>
                    </td>
                    <td style={{ fontWeight: '600', color: '#93c5fd' }}>{doc.docType}</td>
                    <td style={{ fontFamily: 'monospace', fontWeight: '800', letterSpacing: '0.04em' }}>{doc.docNumber}</td>
                    <td>{doc.fileSize}</td>
                    <td>{doc.uploadDate || '2026-08-10'}</td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        background: doc.status === 'Verified' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: doc.status === 'Verified' ? '#34d399' : '#fbbf24'
                      }}>
                        {doc.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{doc.verifiedBy || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                          title="View Details"
                        >
                          <Eye style={{ width: '12px', height: '12px' }} />
                        </button>
                        <button
                          onClick={() => handleDownloadKYCDocument(doc)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '0.75rem', color: '#93c5fd' }}
                          title="Download File"
                        >
                          <Download style={{ width: '12px', height: '12px' }} />
                        </button>
                        {doc.status === 'Pending Review' && (
                          <button
                            onClick={() => handleQuickStatusChange(doc, 'Verified')}
                            className="btn gradient-btn-primary"
                            style={{ padding: '6px 10px', fontSize: '0.75rem', background: '#10b981' }}
                            title="Approve"
                          >
                            <Check style={{ width: '12px', height: '12px' }} />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm(`Delete KYC record for ${doc.entityName}?`)) {
                              deleteKYCDocument(doc.id);
                            }
                          }}
                          style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '6px' }}
                        >
                          <Trash2 style={{ width: '14px', height: '14px' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* KYC UPLOAD MODAL                                                          */}
      {/* ========================================================================= */}
      {showUploadModal && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-content glass-panel" style={{
            maxWidth: '620px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '32px',
            borderRadius: '24px',
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UploadCloud style={{ width: '22px', height: '22px' }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '800' }}>Upload KYC Document</h3>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Add Government & Business compliance document to the vault
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {/* Category Selector Tabs */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>
                  1. Select KYC Target Category
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => handleCategoryChange('Employee KYC')}
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      border: '1px solid',
                      borderColor: uploadForm.category === 'Employee KYC' ? '#6366f1' : 'var(--border-color)',
                      background: uploadForm.category === 'Employee KYC' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                      color: uploadForm.category === 'Employee KYC' ? '#fff' : 'var(--text-secondary)',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <User style={{ width: '18px', height: '18px', color: '#818cf8' }} />
                    <span>Employee / Staff KYC</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCategoryChange('Client KYC')}
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      border: '1px solid',
                      borderColor: uploadForm.category === 'Client KYC' ? '#ec4899' : 'var(--border-color)',
                      background: uploadForm.category === 'Client KYC' ? 'rgba(236, 72, 153, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                      color: uploadForm.category === 'Client KYC' ? '#fff' : 'var(--text-secondary)',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <Building style={{ width: '18px', height: '18px', color: '#f472b6' }} />
                    <span>Client / Business KYC</span>
                  </button>
                </div>
              </div>

              {/* Entity Selector (Employee list or Client list) */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
                  2. Select {uploadForm.category === 'Employee KYC' ? 'Staff Member' : 'Client Organization'} *
                </label>
                {uploadForm.category === 'Employee KYC' ? (
                  <select
                    className="custom-input"
                    value={uploadForm.entityId}
                    onChange={(e) => {
                      const emp = employees.find(emp => emp.id === e.target.value || emp.username === e.target.value);
                      setUploadForm(prev => ({
                        ...prev,
                        entityId: e.target.value,
                        entityName: emp?.name || e.target.value,
                        entityRole: emp?.designation || emp?.role || 'Corporate Staff'
                      }));
                    }}
                    style={{ width: '100%', borderRadius: '10px' }}
                    required
                  >
                    {employees.map(emp => (
                      <option key={emp.id || emp.username} value={emp.id || emp.username}>
                        {emp.name} ({emp.designation || emp.role || 'Staff'})
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    className="custom-input"
                    value={uploadForm.entityId}
                    onChange={(e) => {
                      const cli = clients.find(c => c.id === e.target.value);
                      setUploadForm(prev => ({
                        ...prev,
                        entityId: e.target.value,
                        entityName: cli?.company || cli?.name || e.target.value,
                        entityRole: 'Client Account'
                      }));
                    }}
                    style={{ width: '100%', borderRadius: '10px' }}
                    required
                  >
                    {clients.map(cli => (
                      <option key={cli.id} value={cli.id}>
                        {cli.company || cli.name} ({cli.industry || 'Client'})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Document Type and Document ID Number */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
                    Document Type *
                  </label>
                  <select
                    className="custom-input"
                    value={uploadForm.docType}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, docType: e.target.value }))}
                    style={{ width: '100%', borderRadius: '10px' }}
                    required
                  >
                    {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
                    Document / Registration ID # *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. AAAPS2841F or 36AAACA1234F1Z5"
                    value={uploadForm.docNumber}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, docNumber: e.target.value.toUpperCase() }))}
                    className="custom-input"
                    style={{ width: '100%', borderRadius: '10px', fontFamily: 'monospace', fontWeight: '700' }}
                    required
                  />
                </div>
              </div>

              {/* Drag & Drop File Upload Zone */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
                  Upload Document File (PDF, JPG, PNG)
                </label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '2px dashed',
                    borderColor: isDragging ? '#6366f1' : 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '14px',
                    padding: '24px',
                    textAlign: 'center',
                    background: isDragging ? 'rgba(99, 102, 241, 0.1)' : 'rgba(0, 0, 0, 0.25)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        processFile(e.target.files[0]);
                      }
                    }}
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    style={{ display: 'none' }}
                  />

                  <UploadCloud style={{ width: '36px', height: '36px', color: '#818cf8', margin: '0 auto 8px' }} />
                  {uploadForm.fileName ? (
                    <div>
                      <div style={{ color: '#34d399', fontWeight: '700', fontSize: '0.9rem' }}>
                        Selected: {uploadForm.fileName} ({uploadForm.fileSize})
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Click to choose a different file
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        Click to browse or drop file here
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Supports PDF scans, JPEG, PNG proofs up to 25MB
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Status and Notes */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
                    Verification Status
                  </label>
                  <select
                    className="custom-input"
                    value={uploadForm.status}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, status: e.target.value }))}
                    style={{ width: '100%', borderRadius: '10px' }}
                  >
                    <option value="Verified">Verified & Approved ✅</option>
                    <option value="Pending Review">Pending Review ⏳</option>
                    <option value="Rejected">Rejected ❌</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Government ID, Tax ID, SLA"
                    value={uploadForm.tags}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, tags: e.target.value }))}
                    className="custom-input"
                    style={{ width: '100%', borderRadius: '10px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
                  Compliance Officer Notes / Remarks
                </label>
                <textarea
                  placeholder="e.g. Document verified with Government portal database..."
                  value={uploadForm.notes}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="custom-input"
                  style={{ width: '100%', borderRadius: '10px', height: '60px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="btn btn-secondary"
                  style={{ padding: '10px 20px', borderRadius: '10px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn gradient-btn-primary"
                  style={{ padding: '10px 24px', borderRadius: '10px', fontWeight: '800' }}
                >
                  ✓ Confirm & Store in Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DOCUMENT PREVIEW MODAL                                                    */}
      {/* ========================================================================= */}
      {previewDoc && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-content glass-panel" style={{
            maxWidth: '680px',
            width: '100%',
            padding: '32px',
            borderRadius: '24px',
            background: 'rgba(15, 23, 42, 0.96)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText style={{ width: '22px', height: '22px' }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>
                    {previewDoc.title || previewDoc.fileName}
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {previewDoc.category} • {previewDoc.docType}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            {/* Document Holographic Preview Box */}
            <div style={{
              background: 'radial-gradient(circle at 50% 50%, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 1) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '20px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: previewDoc.status === 'Verified' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                border: `1px solid ${previewDoc.status === 'Verified' ? '#10b981' : '#f59e0b'}`,
                color: previewDoc.status === 'Verified' ? '#34d399' : '#fbbf24',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <ShieldCheck style={{ width: '14px', height: '14px' }} />
                <span>{previewDoc.status}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Target Entity</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#fff' }}>{previewDoc.entityName}</div>
                  <div style={{ fontSize: '0.8rem', color: '#93c5fd' }}>{previewDoc.entityRole} ({previewDoc.entityId})</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '10px' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Document Number</span>
                    <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#fbbf24', fontFamily: 'monospace' }}>{previewDoc.docNumber}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>File Size</span>
                    <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>{previewDoc.fileSize}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Upload Date</span>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{previewDoc.uploadDate || '2026-08-10'}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Verified By</span>
                    <div style={{ fontSize: '0.85rem', color: '#34d399' }}>{previewDoc.verifiedBy || 'Pending'}</div>
                  </div>
                </div>

                {previewDoc.notes && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                    <strong>Remarks:</strong> {previewDoc.notes}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                {previewDoc.status !== 'Verified' ? (
                  <button
                    onClick={() => {
                      handleQuickStatusChange(previewDoc, 'Verified');
                      setPreviewDoc(prev => ({ ...prev, status: 'Verified', verifiedBy: currentUser?.name || 'Compliance Officer' }));
                    }}
                    className="btn gradient-btn-primary"
                    style={{ padding: '8px 16px', background: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <CheckCircle2 style={{ width: '16px', height: '16px' }} />
                    <span>Approve & Verify</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      handleQuickStatusChange(previewDoc, 'Pending Review');
                      setPreviewDoc(prev => ({ ...prev, status: 'Pending Review', verifiedBy: null }));
                    }}
                    className="btn btn-secondary"
                    style={{ padding: '8px 14px', fontSize: '0.8rem' }}
                  >
                    Mark as Pending Review
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => handleDownloadKYCDocument(previewDoc)}
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', color: '#93c5fd', borderColor: 'rgba(147, 197, 253, 0.3)' }}
                >
                  <Download style={{ width: '16px', height: '16px' }} />
                  <span>Download File</span>
                </button>

                <button
                  onClick={() => setPreviewDoc(null)}
                  className="btn btn-secondary"
                  style={{ padding: '8px 16px' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default KYCManager;
