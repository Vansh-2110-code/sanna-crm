import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useCRM } from '../../context/CRMContext';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  Download,
  Users,
  Building,
  Mail,
  Phone,
  DollarSign,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export const BulkImportLeadsModal = ({ isOpen, onClose, onImportSuccess }) => {
  const { batchAddLeads, addLead, currentUser } = useCRM();

  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [parsedLeads, setParsedLeads] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Flexible header normalization
  const findValue = (row, ...aliases) => {
    const keys = Object.keys(row);
    // 1. Exact match with case/punctuation stripped
    for (const alias of aliases) {
      const lowerAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
      const match = keys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === lowerAlias);
      if (match && row[match] !== undefined && row[match] !== null && String(row[match]).trim() !== '') {
        return String(row[match]).trim();
      }
    }
    // 2. Word/substring match protecting against cross-matches (e.g. 'company name' vs 'person name')
    for (const alias of aliases) {
      const lowerAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (lowerAlias.length < 3) continue;
      const match = keys.find(k => {
        const normK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (normK === lowerAlias) return true;
        // Prevent 'company name' from matching alias 'name'
        if ((lowerAlias === 'name' || lowerAlias === 'leadname' || lowerAlias === 'contact') && 
            (normK.includes('company') || normK.includes('organization') || normK.includes('business') || normK.includes('firm'))) {
          return false;
        }
        return normK.includes(lowerAlias);
      });
      if (match && row[match] !== undefined && row[match] !== null && String(row[match]).trim() !== '') {
        return String(row[match]).trim();
      }
    }
    return '';
  };

  const processFile = (uploadedFile) => {
    if (!uploadedFile) return;
    setErrorMsg('');
    setFileName(uploadedFile.name);
    setFile(uploadedFile);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          setErrorMsg('The uploaded sheet is empty or contains no data rows.');
          setParsedLeads([]);
          return;
        }

        const normalized = rawJson.map((row, idx) => {
          const name = findValue(row, 'contactpersonname', 'contactperson', 'fullname', 'personname', 'leadname', 'clientname', 'name', 'contact', 'person') || '';
          const company = findValue(row, 'companyname', 'company', 'organization', 'business', 'client', 'firm', 'brand', 'entity', 'account') || '';
          const email = findValue(row, 'businessemail', 'emailaddress', 'emailid', 'email', 'mail', 'corporateemail') || '';
          const phone = findValue(row, 'phonenumber', 'contactnumber', 'mobilenumber', 'mobile', 'phone', 'phoneno', 'tel', 'whatsappnumber') || '';
          const source = findValue(row, 'leadcapturesource', 'leadsource', 'source', 'channel', 'platform') || 'Excel Import';
          const status = findValue(row, 'stagestatus', 'leadstatus', 'lifecyclestage', 'stage', 'status') || 'Lead Intake';
          const projectCategory = findValue(row, 'projectcategory', 'service', 'servicesneeded', 'category', 'requirement', 'domain', 'industry') || 'Software Development';
          const projectType = findValue(row, 'projecttype', 'type') || 'One Time';
          const productNeeded = findValue(row, 'productneeded', 'requirement', 'interest', 'interestedin', 'product') || '';
          const rawVal = findValue(row, 'estimatedvalue', 'estimatedvalueinr', 'estimatedvaluedollar', 'dealvalue', 'potentialvalue', 'budget', 'value', 'amount', 'price', 'ticketsize');
          const potentialValue = parseFloat(String(rawVal).replace(/[^0-9.]/g, '')) || 0;
          const assignedTo = findValue(row, 'assignedsalesexecutive', 'assignedrep', 'assignedto', 'salesrep', 'executive', 'owner', 'assigned') || currentUser?.name || 'Srinivas (Admin)';
          const notes = findValue(row, 'notes', 'remarks', 'comment', 'comments', 'description', 'auditnotes', 'details') || '';

          const resolvedName = name || company || `Lead #${idx + 1}`;
          const resolvedCompany = company || name || 'Corporate Client';

          return {
            name: resolvedName,
            company: resolvedCompany,
            email: email, // Optional
            phone: phone,
            source: source,
            status: status,
            projectCategory: projectCategory,
            projectType: projectType,
            productNeeded: productNeeded,
            potentialValue: potentialValue,
            assignedTo: assignedTo,
            notes: notes
          };
        }).filter(l => l.name || l.company);

        if (normalized.length === 0) {
          setErrorMsg('Could not detect any valid leads with names or company details in this file.');
          setParsedLeads([]);
          return;
        }

        setParsedLeads(normalized);
      } catch (err) {
        console.error('File parsing error:', err);
        setErrorMsg(`Failed to parse file: ${err.message || 'Unknown format'}`);
      }
    };

    reader.readAsArrayBuffer(uploadedFile);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleImportSubmit = async () => {
    if (!parsedLeads.length) return;
    setIsProcessing(true);
    setImportProgress(0);

    try {
      if (batchAddLeads) {
        await batchAddLeads(parsedLeads);
      } else if (addLead) {
        for (let i = 0; i < parsedLeads.length; i++) {
          await addLead(parsedLeads[i]);
          setImportProgress(Math.round(((i + 1) / parsedLeads.length) * 100));
        }
      }

      setIsProcessing(false);
      if (onImportSuccess) {
        onImportSuccess(parsedLeads.length);
      }
      onClose();
    } catch (err) {
      console.error('Batch import failed:', err);
      setIsProcessing(false);
      setErrorMsg(`Import failed: ${err.message}`);
    }
  };

  const handleDownloadSample = () => {
    const sampleData = [
      {
        'Contact Person Name': 'Eleanor Vance',
        'Company Name': 'Apex Global Tech',
        'Business Email': 'eleanor@apex.io',
        'Phone Number': '+91 98765 43210',
        'Estimated Value ($)': 75000,
        'Project Category': 'Software Development',
        'Lead Capture Source': 'Website Forms',
        'Stage Status': 'Lead Intake',
        'Assigned Sales Executive': currentUser?.name || 'Srinivas (Admin)',
        'Notes': 'Needs custom CRM architecture and PostgreSQL backend.'
      },
      {
        'Contact Person Name': 'Rohan Sharma',
        'Company Name': 'Nexus Retail Logistics',
        'Business Email': '', // Demonstrating optional email!
        'Phone Number': '+91 99887 76655',
        'Estimated Value ($)': 45000,
        'Project Category': 'SaaS CRM Setup',
        'Lead Capture Source': 'Referral',
        'Stage Status': 'Qualified',
        'Assigned Sales Executive': currentUser?.name || 'Srinivas (Admin)',
        'Notes': 'Direct phone referral. Email will be gathered during proposal phase.'
      },
      {
        'Contact Person Name': 'Sarah Jenkins',
        'Company Name': 'Starlight Media House',
        'Business Email': 'sarah@starlightmedia.com',
        'Phone Number': '+1 (415) 890-2345',
        'Estimated Value ($)': 120000,
        'Project Category': 'Digital Marketing',
        'Lead Capture Source': 'Social Media',
        'Stage Status': 'Proposal Sent',
        'Assigned Sales Executive': currentUser?.name || 'Srinivas (Admin)',
        'Notes': 'High ticket annual enterprise retainer.'
      }
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sampleData);
    XLSX.utils.book_append_sheet(wb, ws, 'Sample Leads');
    XLSX.writeFile(wb, 'Sanna_CRM_Bulk_Leads_Template.xlsx');
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1200 }}>
      <div
        className="modal-content"
        style={{
          padding: '30px',
          maxWidth: '820px',
          width: '95%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#12131C',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4E3EFF', fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              <FileSpreadsheet style={{ width: '16px', height: '16px' }} />
              Fast Lead Ingestion Engine
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#FFFFFF', margin: '4px 0 6px' }}>
              Bulk Import Leads from Excel / CSV
            </h3>
            <p style={{ fontSize: '0.84rem', color: '#94A3B8', margin: 0 }}>
              Upload any spreadsheet (.xlsx, .xls) or CSV document. Emails are <strong>completely optional</strong>.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94A3B8',
              cursor: 'pointer'
            }}
          >
            <X style={{ width: '18px', height: '18px' }} />
          </button>
        </div>

        {/* Dropzone */}
        {!parsedLeads.length && (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            style={{
              border: dragActive ? '2px dashed #4E3EFF' : '2px dashed rgba(255, 255, 255, 0.15)',
              background: dragActive ? 'rgba(78, 62, 255, 0.1)' : 'rgba(255, 255, 255, 0.02)',
              borderRadius: '20px',
              padding: '48px 24px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              marginBottom: '20px'
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  processFile(e.target.files[0]);
                }
              }}
            />
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '18px',
              background: 'rgba(78, 62, 255, 0.15)',
              color: '#818CF8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <Upload style={{ width: '28px', height: '28px' }} />
            </div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#FFFFFF', margin: '0 0 6px' }}>
              Drag & Drop your Excel or CSV file here
            </h4>
            <p style={{ fontSize: '0.82rem', color: '#94A3B8', margin: '0 0 16px' }}>
              Supports Microsoft Excel (.xlsx, .xls) and Comma-Separated Values (.csv)
            </p>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '8px 18px', fontSize: '0.82rem', pointerEvents: 'none' }}
            >
              Browse Local Files
            </button>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div style={{
            padding: '12px 18px',
            borderRadius: '12px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#F87171',
            fontSize: '0.82rem',
            marginBottom: '18px'
          }}>
            <AlertCircle style={{ width: '18px', height: '18px', flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Parsed Preview Table */}
        {parsedLeads.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: '800', color: '#FFFFFF' }}>
                  Preview: {parsedLeads.length} Leads Detected
                </span>
                <span style={{
                  fontSize: '0.72rem',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: 'rgba(52, 211, 153, 0.15)',
                  color: '#34D399',
                  border: '1px solid rgba(52, 211, 153, 0.3)',
                  fontWeight: '700'
                }}>
                  {fileName}
                </span>
              </div>
              <button
                onClick={() => {
                  setParsedLeads([]);
                  setFile(null);
                  setFileName('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Choose Different File
              </button>
            </div>

            <div style={{
              flex: 1,
              overflowY: 'auto',
              maxHeight: '340px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              background: '#0D0E15'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#161822', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <th style={{ padding: '10px 14px', color: '#94A3B8', fontWeight: '700' }}>#</th>
                    <th style={{ padding: '10px 14px', color: '#94A3B8', fontWeight: '700' }}>Lead / Contact</th>
                    <th style={{ padding: '10px 14px', color: '#94A3B8', fontWeight: '700' }}>Company</th>
                    <th style={{ padding: '10px 14px', color: '#94A3B8', fontWeight: '700' }}>Email</th>
                    <th style={{ padding: '10px 14px', color: '#94A3B8', fontWeight: '700' }}>Phone</th>
                    <th style={{ padding: '10px 14px', color: '#94A3B8', fontWeight: '700' }}>Value ($)</th>
                    <th style={{ padding: '10px 14px', color: '#94A3B8', fontWeight: '700' }}>Category</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedLeads.slice(0, 15).map((l, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <td style={{ padding: '10px 14px', color: '#64748B' }}>{i + 1}</td>
                      <td style={{ padding: '10px 14px', color: '#FFFFFF', fontWeight: '600' }}>{l.name}</td>
                      <td style={{ padding: '10px 14px', color: '#CBD5E1' }}>{l.company}</td>
                      <td style={{ padding: '10px 14px' }}>
                        {l.email ? (
                          <span style={{ color: '#818CF8' }}>{l.email}</span>
                        ) : (
                          <span style={{
                            fontSize: '0.7rem',
                            padding: '2px 6px',
                            borderRadius: '6px',
                            background: 'rgba(255, 255, 255, 0.06)',
                            color: '#94A3B8'
                          }}>
                            (No Email)
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '10px 14px', color: '#94A3B8' }}>{l.phone || '—'}</td>
                      <td style={{ padding: '10px 14px', color: '#34D399', fontWeight: '700' }}>
                        ${l.potentialValue.toLocaleString()}
                      </td>
                      <td style={{ padding: '10px 14px', color: '#94A3B8' }}>{l.projectCategory}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedLeads.length > 15 && (
                <div style={{ padding: '8px 14px', fontSize: '0.75rem', color: '#64748B', textAlign: 'center', background: '#12131C' }}>
                  + {parsedLeads.length - 15} more records ready to be imported
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: '18px'
        }}>
          <button
            type="button"
            onClick={handleDownloadSample}
            style={{
              background: 'none',
              border: 'none',
              color: '#818CF8',
              fontSize: '0.82rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Download style={{ width: '15px', height: '15px' }} />
            <span>Download Sample Excel Template (.xlsx)</span>
          </button>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="btn btn-secondary"
              style={{ padding: '9px 18px', fontSize: '0.84rem' }}
            >
              Cancel
            </button>

            {parsedLeads.length > 0 && (
              <button
                type="button"
                onClick={handleImportSubmit}
                disabled={isProcessing}
                className="btn gradient-btn-primary"
                style={{
                  padding: '9px 24px',
                  fontSize: '0.84rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: isProcessing ? 0.7 : 1
                }}
              >
                {isProcessing ? (
                  <span>Importing ({importProgress}%)...</span>
                ) : (
                  <>
                    <CheckCircle2 style={{ width: '16px', height: '16px' }} />
                    <span>Import {parsedLeads.length} Leads</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkImportLeadsModal;
