import React, { useState, useRef } from 'react';
import { useCRM } from '../../context/CRMContext';
import {
  ShieldCheck, Upload, FileText, CheckCircle2, X, AlertTriangle,
  Loader, ChevronRight, CreditCard, Fingerprint, Building2, Check,
  AlertCircle, Sparkles, Lock, ArrowRight
} from 'lucide-react';

const EmployeeKYCModal = ({ isOpen, onClose, onSubmitted }) => {
  const { currentUser, addKYCDocument } = useCRM();

  // Active step in the 3-part compulsory data flow
  // 1: Aadhaar Details (Number is Compulsory, File is Optional)
  // 2: PAN Details (Number is Compulsory, File is Optional)
  // 3: Bank Details (Name, A/C No, IFSC are Compulsory, File is Optional)
  // 4: Final Success Screen
  const [activeStep, setActiveStep] = useState(1);

  // 1. Aadhaar State
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [aadhaarFileName, setAadhaarFileName] = useState('');
  const [aadhaarFileSize, setAadhaarFileSize] = useState('');

  // 2. PAN State
  const [panNumber, setPanNumber] = useState('');
  const [panFile, setPanFile] = useState(null);
  const [panFileName, setPanFileName] = useState('');
  const [panFileSize, setPanFileSize] = useState('');

  // 3. Bank Details State
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountHolder, setAccountHolder] = useState(currentUser?.name || '');
  const [bankFile, setBankFile] = useState(null);
  const [bankFileName, setBankFileName] = useState('');
  const [bankFileSize, setBankFileSize] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const aadhaarRef = useRef(null);
  const panRef = useRef(null);
  const bankRef = useRef(null);

  if (!isOpen) return null;

  // File Processor (Optional uploads)
  const handleFileRead = (file, setterData, setterName, setterSize) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setterData(e.target.result);
      setterName(file.name);
      setterSize((file.size / (1024 * 1024)).toFixed(2) + ' MB');
    };
    reader.readAsDataURL(file);
  };

  // Only data filling is compulsory, file upload is optional
  const isAadhaarDone = !!(aadhaarNumber.replace(/\s+/g, '').length >= 12);
  const isPanDone = !!(panNumber.trim().length >= 10);
  const isBankDone = !!(bankName.trim() && accountNumber.trim() && ifscCode.trim());

  const completedCount = (isAadhaarDone ? 1 : 0) + (isPanDone ? 1 : 0) + (isBankDone ? 1 : 0);

  // Final Submit Handler - Submits all 3 compulsory KYC datasets
  const handleFinalSubmit = async () => {
    setError('');

    if (!isAadhaarDone) {
      setError('Aadhaar Card number (12 digits) is compulsory.');
      setActiveStep(1);
      return;
    }
    if (!isPanDone) {
      setError('PAN Card number (10 characters) is compulsory.');
      setActiveStep(2);
      return;
    }
    if (!isBankDone) {
      setError('Bank Details (Bank Name, Account No, IFSC Code) are compulsory.');
      setActiveStep(3);
      return;
    }

    setLoading(true);
    try {
      const empId = currentUser?.id || `EMP-${Date.now()}`;
      const empName = currentUser?.name || 'Employee';
      const empRole = currentUser?.designation || currentUser?.role || 'Staff Member';

      // 1. Submit Aadhaar Record
      await addKYCDocument({
        category: 'Employee KYC',
        entityType: 'Employee',
        entityId: empId,
        entityName: empName,
        entityRole: empRole,
        docType: 'Aadhaar Card',
        docNumber: aadhaarNumber.trim(),
        title: `${empName}_Aadhaar_${aadhaarNumber.replace(/\s+/g, '').slice(-4)}.pdf`,
        fileName: aadhaarFileName || 'Aadhaar_Details_Provided.pdf',
        fileSize: aadhaarFileSize || (aadhaarFile ? '1.8 MB' : 'Data Verified'),
        fileType: 'application/pdf',
        fileDataUrl: aadhaarFile || null,
        notes: `Aadhaar Number: ${aadhaarNumber.trim()} (Submitted by employee during onboarding)`,
        tags: ['Compulsory KYC', 'Identity Proof', 'Aadhaar'],
        status: 'Pending Review',
        uploadedBy: empId
      });

      // 2. Submit PAN Record
      await addKYCDocument({
        category: 'Employee KYC',
        entityType: 'Employee',
        entityId: empId,
        entityName: empName,
        entityRole: empRole,
        docType: 'PAN Card',
        docNumber: panNumber.trim().toUpperCase(),
        title: `${empName}_PAN_${panNumber.trim().toUpperCase()}.pdf`,
        fileName: panFileName || 'PAN_Details_Provided.pdf',
        fileSize: panFileSize || (panFile ? '1.5 MB' : 'Data Verified'),
        fileType: 'application/pdf',
        fileDataUrl: panFile || null,
        notes: `PAN Number: ${panNumber.trim().toUpperCase()} (Submitted by employee during onboarding)`,
        tags: ['Compulsory KYC', 'Tax Identification', 'PAN'],
        status: 'Pending Review',
        uploadedBy: empId
      });

      // 3. Submit Bank Details Record
      await addKYCDocument({
        category: 'Employee KYC',
        entityType: 'Employee',
        entityId: empId,
        entityName: empName,
        entityRole: empRole,
        docType: 'Bank Passbook / Cheque',
        docNumber: `A/C: ${accountNumber.trim()} | IFSC: ${ifscCode.trim().toUpperCase()} (${bankName.trim()})`,
        title: `${empName}_Bank_Details_${bankName.trim().replace(/\s+/g, '_')}.pdf`,
        fileName: bankFileName || 'Bank_Details_Provided.pdf',
        fileSize: bankFileSize || (bankFile ? '2.0 MB' : 'Data Verified'),
        fileType: 'application/pdf',
        fileDataUrl: bankFile || null,
        notes: `Bank: ${bankName} | A/C: ${accountNumber} | IFSC: ${ifscCode} | Holder: ${accountHolder || empName}`,
        tags: ['Compulsory KYC', 'Payroll Details', 'Bank Passbook'],
        status: 'Pending Review',
        uploadedBy: empId
      });

      setActiveStep(4);
    } catch (err) {
      setError(err.message || 'Failed to submit KYC details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    if (onSubmitted) onSubmitted();
    if (onClose) onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 9, 18, 0.94)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        background: 'linear-gradient(155deg, #0f172a 0%, #131d36 50%, #0a0f1d 100%)',
        border: '1px solid rgba(99, 102, 241, 0.4)',
        boxShadow: '0 30px 90px -15px rgba(0,0,0,0.95), 0 0 70px rgba(99, 102, 241, 0.2)',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '640px',
        maxHeight: '90vh',
        overflowY: 'auto',
        animation: 'modalSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* Top gradient glowing line */}
        <div style={{ height: '4px', background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 50%, #38bdf8 100%)' }} />

        {/* Modal Header */}
        <div style={{ padding: '24px 28px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '46px', height: '46px', borderRadius: '13px',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(168,85,247,0.25))',
              border: '1px solid rgba(99,102,241,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <ShieldCheck size={24} color="#a78bfa" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#f8fafc', margin: 0 }}>
                  Mandatory Employee KYC Onboarding
                </h2>
                <span style={{ fontSize: '0.65rem', fontWeight: '800', background: 'rgba(239,68,68,0.2)', color: '#f87171', border: '1px solid rgba(239,68,68,0.4)', padding: '2px 8px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Data Compulsory
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '4px 0 0' }}>
                Aadhaar, PAN & Bank Details are mandatory. File uploads are optional.
              </p>
            </div>
          </div>
        </div>

        {/* 3-Step Progress Navigation Header */}
        {activeStep !== 4 && (
          <div style={{ padding: '16px 28px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#c4b5fd', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Compulsory Checklist ({completedCount}/3 Ready)
              </span>
              <span style={{ fontSize: '0.72rem', color: completedCount === 3 ? '#34d399' : '#f59e0b', fontWeight: '700' }}>
                {completedCount === 3 ? '✓ All 3 details provided' : `${3 - completedCount} required item(s) pending`}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              {/* Tab 1: Aadhaar */}
              <button
                onClick={() => { setActiveStep(1); setError(''); }}
                style={{
                  padding: '10px', borderRadius: '10px',
                  background: activeStep === 1 ? 'rgba(99,102,241,0.2)' : isAadhaarDone ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)',
                  border: activeStep === 1 ? '1.5px solid #6366f1' : isAadhaarDone ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,255,255,0.1)',
                  cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px'
                }}
              >
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: isAadhaarDone ? '#10b981' : activeStep === 1 ? '#6366f1' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: '800', color: '#fff', flexShrink: 0 }}>
                  {isAadhaarDone ? '✓' : '1'}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: activeStep === 1 ? '#f1f5f9' : '#cbd5e1', whiteSpace: 'nowrap' }}>1. Aadhaar Card</div>
                  <div style={{ fontSize: '0.65rem', color: isAadhaarDone ? '#34d399' : '#94a3b8' }}>{isAadhaarDone ? 'Done ✓' : 'Required *'}</div>
                </div>
              </button>

              {/* Tab 2: PAN */}
              <button
                onClick={() => { setActiveStep(2); setError(''); }}
                style={{
                  padding: '10px', borderRadius: '10px',
                  background: activeStep === 2 ? 'rgba(245,158,11,0.2)' : isPanDone ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)',
                  border: activeStep === 2 ? '1.5px solid #f59e0b' : isPanDone ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,255,255,0.1)',
                  cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px'
                }}
              >
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: isPanDone ? '#10b981' : activeStep === 2 ? '#f59e0b' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: '800', color: '#fff', flexShrink: 0 }}>
                  {isPanDone ? '✓' : '2'}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: activeStep === 2 ? '#f1f5f9' : '#cbd5e1', whiteSpace: 'nowrap' }}>2. PAN Card</div>
                  <div style={{ fontSize: '0.65rem', color: isPanDone ? '#34d399' : '#94a3b8' }}>{isPanDone ? 'Done ✓' : 'Required *'}</div>
                </div>
              </button>

              {/* Tab 3: Bank Details */}
              <button
                onClick={() => { setActiveStep(3); setError(''); }}
                style={{
                  padding: '10px', borderRadius: '10px',
                  background: activeStep === 3 ? 'rgba(56,189,248,0.2)' : isBankDone ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)',
                  border: activeStep === 3 ? '1.5px solid #38bdf8' : isBankDone ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,255,255,0.1)',
                  cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px'
                }}
              >
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: isBankDone ? '#10b981' : activeStep === 3 ? '#38bdf8' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: '800', color: '#fff', flexShrink: 0 }}>
                  {isBankDone ? '✓' : '3'}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: activeStep === 3 ? '#f1f5f9' : '#cbd5e1', whiteSpace: 'nowrap' }}>3. Bank Details</div>
                  <div style={{ fontSize: '0.65rem', color: isBankDone ? '#34d399' : '#94a3b8' }}>{isBankDone ? 'Done ✓' : 'Required *'}</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div style={{ padding: '24px 28px 28px' }}>

          {/* ════════ STEP 1: AADHAAR CARD ════════ */}
          {activeStep === 1 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <Fingerprint size={20} color="#6366f1" />
                <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#f1f5f9', margin: 0 }}>
                  Step 1: Aadhaar Details <span style={{ color: '#f87171' }}>*</span>
                </h3>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">
                  12-Digit Aadhaar Number <span style={{ color: '#f87171', fontWeight: '800' }}>(Compulsory *)</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 5432 8901 2345"
                  maxLength={14}
                  value={aadhaarNumber}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/[^0-9]/g, '');
                    const formatted = clean.match(/.{1,4}/g)?.join(' ') || clean;
                    setAadhaarNumber(formatted);
                  }}
                  className="form-input"
                  style={{ fontSize: '0.95rem', letterSpacing: '0.05em' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Aadhaar Document Attachment</span>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '600' }}>(Optional)</span>
                </label>
                <div
                  onClick={() => aadhaarRef.current?.click()}
                  style={{
                    border: aadhaarFile ? '2px solid #10b981' : '1.5px dashed rgba(99,102,241,0.3)',
                    borderRadius: '12px',
                    padding: '18px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: aadhaarFile ? 'rgba(16,185,129,0.06)' : 'rgba(99,102,241,0.03)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <input
                    ref={aadhaarRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileRead(e.target.files[0], setAadhaarFile, setAadhaarFileName, setAadhaarFileSize)}
                  />
                  {aadhaarFile ? (
                    <div>
                      <CheckCircle2 size={24} color="#10b981" style={{ marginBottom: '6px' }} />
                      <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#34d399' }}>✓ {aadhaarFileName}</div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>{aadhaarFileSize} · Click to replace file</div>
                    </div>
                  ) : (
                    <div>
                      <Upload size={22} color="#6366f1" style={{ marginBottom: '6px' }} />
                      <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#c4b5fd' }}>Upload Aadhaar Card Image / PDF (Optional)</div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>You can upload now or skip and submit data directly</div>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    if (!aadhaarNumber || aadhaarNumber.replace(/\s+/g, '').length < 12) {
                      setError('Please enter a valid 12-digit Aadhaar number.');
                      return;
                    }
                    setError('');
                    setActiveStep(2);
                  }}
                  className="btn gradient-btn-primary"
                  style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  Next: PAN Details <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ════════ STEP 2: PAN CARD ════════ */}
          {activeStep === 2 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <CreditCard size={20} color="#f59e0b" />
                <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#f1f5f9', margin: 0 }}>
                  Step 2: PAN Details <span style={{ color: '#f87171' }}>*</span>
                </h3>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">
                  10-Character PAN Number <span style={{ color: '#f87171', fontWeight: '800' }}>(Compulsory *)</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ABCDE1234F"
                  maxLength={10}
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                  className="form-input"
                  style={{ fontSize: '0.95rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>PAN Card Document Attachment</span>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '600' }}>(Optional)</span>
                </label>
                <div
                  onClick={() => panRef.current?.click()}
                  style={{
                    border: panFile ? '2px solid #10b981' : '1.5px dashed rgba(245,158,11,0.3)',
                    borderRadius: '12px',
                    padding: '18px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: panFile ? 'rgba(16,185,129,0.06)' : 'rgba(245,158,11,0.03)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <input
                    ref={panRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileRead(e.target.files[0], setPanFile, setPanFileName, setPanFileSize)}
                  />
                  {panFile ? (
                    <div>
                      <CheckCircle2 size={24} color="#10b981" style={{ marginBottom: '6px' }} />
                      <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#34d399' }}>✓ {panFileName}</div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>{panFileSize} · Click to replace file</div>
                    </div>
                  ) : (
                    <div>
                      <Upload size={22} color="#f59e0b" style={{ marginBottom: '6px' }} />
                      <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#fde68a' }}>Upload PAN Card Image / PDF (Optional)</div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>You can upload now or skip and submit data directly</div>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => { setActiveStep(1); setError(''); }}
                  className="btn btn-secondary"
                  style={{ padding: '12px 20px' }}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!panNumber || panNumber.trim().length < 10) {
                      setError('Please enter a valid 10-character PAN number (e.g. ABCDE1234F).');
                      return;
                    }
                    setError('');
                    setActiveStep(3);
                  }}
                  className="btn gradient-btn-primary"
                  style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  Next: Bank Details <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ════════ STEP 3: BANK DETAILS ════════ */}
          {activeStep === 3 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <Building2 size={20} color="#38bdf8" />
                <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#f1f5f9', margin: 0 }}>
                  Step 3: Bank Account Details <span style={{ color: '#f87171' }}>*</span>
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div className="form-group">
                  <label className="form-label">
                    Bank Name <span style={{ color: '#f87171', fontWeight: '800' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HDFC Bank, SBI, ICICI"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Account Holder Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Full Name on Bank A/C"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div className="form-group">
                  <label className="form-label">
                    Account Number <span style={{ color: '#f87171', fontWeight: '800' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 50100492819201"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/[^0-9]/g, ''))}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    IFSC Code <span style={{ color: '#f87171', fontWeight: '800' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HDFC0001234"
                    maxLength={11}
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    className="form-input"
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Passbook / Cheque Document Attachment</span>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '600' }}>(Optional)</span>
                </label>
                <div
                  onClick={() => bankRef.current?.click()}
                  style={{
                    border: bankFile ? '2px solid #10b981' : '1.5px dashed rgba(56,189,248,0.3)',
                    borderRadius: '12px',
                    padding: '16px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: bankFile ? 'rgba(16,185,129,0.06)' : 'rgba(56,189,248,0.03)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <input
                    ref={bankRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileRead(e.target.files[0], setBankFile, setBankFileName, setBankFileSize)}
                  />
                  {bankFile ? (
                    <div>
                      <CheckCircle2 size={24} color="#10b981" style={{ marginBottom: '6px' }} />
                      <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#34d399' }}>✓ {bankFileName}</div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>{bankFileSize} · Click to replace file</div>
                    </div>
                  ) : (
                    <div>
                      <Upload size={22} color="#38bdf8" style={{ marginBottom: '6px' }} />
                      <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#bae6fd' }}>Upload Bank Passbook / Cheque (Optional)</div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>You can upload now or skip and submit data directly</div>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => { setActiveStep(2); setError(''); }}
                  className="btn btn-secondary"
                  style={{ padding: '12px 20px' }}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={loading}
                  className="btn gradient-btn-primary"
                  style={{
                    padding: '12px 28px',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {loading ? (
                    <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Submitting KYC Details...</>
                  ) : (
                    <><ShieldCheck size={16} /> Submit KYC Details (3/3)</>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ════════ STEP 4: SUCCESS CONFIRMATION ════════ */}
          {activeStep === 4 && (
            <div style={{ textAlign: 'center', padding: '16px 0 8px' }}>
              <div style={{
                width: '74px', height: '74px', borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(16,185,129,0.25), rgba(52,211,153,0.15))',
                border: '2px solid rgba(16,185,129,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
                animation: 'pulse 2s ease-in-out infinite'
              }}>
                <CheckCircle2 size={38} color="#10b981" />
              </div>

              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#f8fafc', marginBottom: '8px' }}>
                KYC Package Submitted Successfully!
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', maxWidth: '440px', margin: '0 auto 20px', lineHeight: 1.5 }}>
                All 3 compulsory KYC datasets have been securely uploaded to the Admin KYC Vault and marked as <strong style={{ color: '#fbbf24' }}>Pending Review</strong>.
              </p>

              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '16px', marginBottom: '24px', textAlign: 'left' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#c4b5fd', textTransform: 'uppercase', marginBottom: '10px' }}>
                  Submitted KYC Details Summary:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <span style={{ color: '#cbd5e1' }}>1. Aadhaar Number: {aadhaarNumber}</span>
                    <span style={{ color: '#34d399', fontWeight: '700' }}>✓ Saved {aadhaarFile ? '(+ File)' : ''}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <span style={{ color: '#cbd5e1' }}>2. PAN Number: {panNumber}</span>
                    <span style={{ color: '#34d399', fontWeight: '700' }}>✓ Saved {panFile ? '(+ File)' : ''}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <span style={{ color: '#cbd5e1' }}>3. Bank: {bankName} (A/C: •••• {accountNumber.slice(-4)})</span>
                    <span style={{ color: '#34d399', fontWeight: '700' }}>✓ Saved {bankFile ? '(+ File)' : ''}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleFinish}
                className="btn gradient-btn-primary"
                style={{ width: '100%', padding: '14px', fontWeight: '800', fontSize: '0.95rem' }}
              >
                Access CRM Platform
              </button>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '12px 16px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '10px',
              marginTop: '16px',
              color: '#f87171',
              fontSize: '0.82rem'
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

        </div>
      </div>

      <style>{`
        @keyframes modalSlideIn {
          from { opacity: 0; transform: scale(0.92) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.4); }
          50% { box-shadow: 0 0 0 12px rgba(16,185,129,0); }
        }
      `}</style>
    </div>
  );
};

export default EmployeeKYCModal;
