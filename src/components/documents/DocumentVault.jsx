import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext';
import { FolderLock, FileText, Download, Plus, Tag, Lock, CheckCircle2 } from 'lucide-react';

const DocumentVault = () => {
  const { documents, addDocument, logAudit, currentUser } = useCRM();
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    category: 'Contract',
    fileSize: '3.5 MB',
    accessLevel: 'Enterprise Admin',
    tags: 'Legal, Contract, SLA'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title) return;

    const tagArray = formData.tags
      ? formData.tags.split(',').map(t => t.trim()).filter(Boolean)
      : ['Document'];

    if (addDocument) {
      addDocument({
        title: formData.title,
        category: formData.category,
        fileSize: formData.fileSize,
        uploadedBy: currentUser?.name || 'Authorized Admin',
        accessLevel: formData.accessLevel,
        tags: tagArray
      });
    }

    if (logAudit) {
      logAudit('UPLOAD_DOCUMENT', formData.title, `Uploaded document: ${formData.title} (${formData.category})`, 'INFO');
    }

    setShowModal(false);
    setFormData({
      title: '',
      category: 'Contract',
      fileSize: '3.5 MB',
      accessLevel: 'Enterprise Admin',
      tags: 'Legal, Contract, SLA'
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: '#60a5fa', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Encrypted Document Management & Vault
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '4px 0' }}>
            Document Vault ({documents.length} Files)
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Store enterprise contracts, product brochures, spec manuals, POs, and compliance certificates with permission controls.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="btn gradient-btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}
        >
          <Plus style={{ width: '18px', height: '18px' }} />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Documents Table */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Document Name</th>
                <th>Category</th>
                <th>File Size</th>
                <th>Uploaded By</th>
                <th>Access Level</th>
                <th>Tags</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No documents uploaded yet. Click <strong>"Upload Document"</strong> above to store your first file.
                  </td>
                </tr>
              ) : (
                documents.map(doc => (
                  <tr key={doc.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FileText style={{ width: '20px', height: '20px', color: '#60a5fa' }} />
                        <span style={{ fontWeight: '700' }}>{doc.title}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-purple">{doc.category}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{doc.fileSize}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem' }}>{doc.uploadedBy}</span>
                    </td>
                    <td>
                      <span className="badge badge-amber">{doc.accessLevel}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {(doc.tags || []).map(t => (
                          <span key={t} className="badge badge-blue" style={{ fontSize: '0.65rem' }}>{t}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <button
                        onClick={() => {
                          const content = `================================================================================
                    SANNA CRM - ENTERPRISE DOCUMENT VAULT
================================================================================

DOCUMENT TITLE  : ${doc.title}
CATEGORY        : ${doc.category}
ACCESS LEVEL    : ${doc.accessLevel}
FILE SIZE       : ${doc.fileSize}
UPLOADED BY     : ${doc.uploadedBy}
TAGS            : ${(doc.tags || []).join(', ')}

--------------------------------------------------------------------------------
DOCUMENT DETAILS & VERIFICATION
--------------------------------------------------------------------------------
This is an authentic enterprise document registered inside the encrypted
Sanna Innovations Cloud Vault.

Security Hash   : SHA-256 Verified
System          : Sanna Innovations CRM Enterprise Suite
================================================================================
`;
                          const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = doc.title.endsWith('.pdf') ? doc.title.replace(/\.pdf$/, '.txt') : `${doc.title}.txt`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          setTimeout(() => URL.revokeObjectURL(url), 1500);
                        }}
                        className="btn btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Download style={{ width: '13px', height: '13px' }} />
                        <span>Download</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* UPLOAD DOCUMENT MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '28px', maxWidth: '500px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', padding: '10px', borderRadius: '12px' }}>
                <FolderLock style={{ color: '#fff', width: '22px', height: '22px' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Upload Document to Vault</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Securely store contracts, specs, or compliance files.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Document Title / File Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Service Level Agreement 2026.pdf"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Document Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="form-select"
                  >
                    <option value="Contract">Contract / SLA</option>
                    <option value="Spec Sheet">Technical Spec Sheet</option>
                    <option value="Compliance">Compliance Certificate</option>
                    <option value="Brochure">Product Brochure</option>
                    <option value="Invoice">Purchase Order / Invoice</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">File Size</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2.4 MB"
                    value={formData.fileSize}
                    onChange={(e) => setFormData({ ...formData, fileSize: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Access Protection Level</label>
                <select
                  value={formData.accessLevel}
                  onChange={(e) => setFormData({ ...formData, accessLevel: e.target.value })}
                  className="form-select"
                >
                  <option value="Enterprise Admin">Enterprise Admin Only</option>
                  <option value="Internal Sales">Internal Sales Team</option>
                  <option value="Public Sales">Public Sales & Customers</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Comma Separated Tags</label>
                <input
                  type="text"
                  placeholder="e.g. Legal, SLA, 2026, Hardware"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn gradient-btn-primary">
                  Upload Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default DocumentVault;
