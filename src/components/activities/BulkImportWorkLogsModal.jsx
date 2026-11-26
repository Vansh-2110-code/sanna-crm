import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import exportToCSV from '../../utils/csvExporter';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  X,
  User,
  Calendar,
  Layers,
  Clock,
  Briefcase
} from 'lucide-react';

const BulkImportWorkLogsModal = ({
  isOpen,
  onClose,
  allStaff = [],
  batchAddDailyTasks,
  currentUser,
  onSuccess
}) => {
  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const fileInputRef = useRef(null);

  // Assignment Options
  const [personMode, setPersonMode] = useState('file'); // 'file' | 'specific'
  const [selectedStaffId, setSelectedStaffId] = useState(allStaff[0]?.id || '');
  const [dateMode, setDateMode] = useState('file'); // 'file' | 'specific'
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [workModeOption, setWorkModeOption] = useState('file'); // 'file' | specific mode

  // File & Parsing State
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [parsedLogs, setParsedLogs] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  const selectedStaffObj = allStaff.find(s => s.id === selectedStaffId) || allStaff[0];

  const handleDownloadSample = () => {
    const sampleCsv = `Date,Staff Name,Staff Type,Work Mode,Project,Task Title,Hours Spent,Deliverable Notes,Learnings,Blockers,Tomorrow Plan,PR Proof URL
${todayStr},Nikki,Employee,Office Campus,Astra Core CRM,Client Lead Status and Pipeline Sync,8.0,Completed lead status persistence and SQLite integration,Learned query caching strategies,None,Implement bulk logs importer,https://github.com/sanna-crm/pull/104
${todayStr},Rohit Sharma,Intern,Remote / Hybrid,Digital Marketing Client,Social Media Campaign and Meta Ads,7.5,Created 4 reels and scheduled posts for client,Meta Ads bidding optimization,None,Analyze reach metrics,https://drive.google.com/proof/1
${todayStr},Riya Biswas,Employee,Office Campus,Creative Deliverables Hub,Brand Identity & Brochure Assets,8.0,Designed new vector brochures and client onboarding decks,Vector optimization techniques,Waiting for client logo assets,Finalize brochure export,https://drive.google.com/proof/2`;

    exportToCSV(sampleCsv, 'Sanna_Daily_Work_Logs_Template.csv');
  };

  const findValue = (row, ...aliases) => {
    const keys = Object.keys(row);
    for (const alias of aliases) {
      const lowerAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
      const match = keys.find(k => {
        const normK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
        return normK === lowerAlias || normK.includes(lowerAlias);
      });
      if (match && row[match] !== undefined && row[match] !== null && String(row[match]).trim() !== '') {
        return String(row[match]).trim();
      }
    }
    return '';
  };

  const formatExcelDate = (rawDate) => {
    if (!rawDate) return todayStr;
    if (typeof rawDate === 'number') {
      // Excel serial date format
      const date = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
      return date.toISOString().split('T')[0];
    }
    const str = String(rawDate).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    // Format DD-MM-YYYY or DD/MM/YYYY
    const dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (dmyMatch) {
      const day = dmyMatch[1].padStart(2, '0');
      const month = dmyMatch[2].padStart(2, '0');
      const year = dmyMatch[3];
      return `${year}-${month}-${day}`;
    }
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
    return todayStr;
  };

  const processFile = (uploadedFile) => {
    if (!uploadedFile) return;
    setErrorMsg('');
    setFileName(uploadedFile.name);
    setFile(uploadedFile);
    setIsProcessing(true);

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
          setParsedLogs([]);
          setIsProcessing(false);
          return;
        }

        const normalized = rawJson.map((row, idx) => {
          // Date
          let logDate = formatExcelDate(findValue(row, 'date', 'logdate', 'workdate', 'entrydate', 'day'));
          if (dateMode === 'specific' && selectedDate) {
            logDate = selectedDate;
          }

          // Staff
          let staffName = findValue(row, 'staffname', 'staff', 'name', 'employee', 'intern', 'person', 'member') || 'Staff Member';
          let staffType = findValue(row, 'stafftype', 'type', 'role') || 'Employee';
          let staffId = findValue(row, 'staffid', 'empid', 'id') || `EMP-${100 + idx}`;
          let staffEmail = findValue(row, 'staffemail', 'email', 'mail') || '';

          if (personMode === 'specific' && selectedStaffObj) {
            staffName = selectedStaffObj.name;
            staffType = selectedStaffObj.type || 'Employee';
            staffId = selectedStaffObj.id;
            staffEmail = selectedStaffObj.email || '';
          } else {
            // Check if matches an existing staff member in allStaff
            const matchedStaff = allStaff.find(s =>
              s.name.toLowerCase().trim() === staffName.toLowerCase().trim() ||
              (s.email && staffEmail && s.email.toLowerCase() === staffEmail.toLowerCase())
            );
            if (matchedStaff) {
              staffName = matchedStaff.name;
              staffType = matchedStaff.type;
              staffId = matchedStaff.id;
              staffEmail = matchedStaff.email || staffEmail;
            } else if (staffName.toLowerCase().includes('intern')) {
              staffType = 'Intern';
            }
          }

          // Work Mode
          let workMode = findValue(row, 'workmode', 'mode', 'location', 'shift') || 'Office Campus';
          if (workModeOption !== 'file') {
            workMode = workModeOption;
          }

          // Task details
          const project = findValue(row, 'project', 'client', 'projectname', 'clientname') || 'Sanna Core CRM';
          const taskTitle = findValue(row, 'tasktitle', 'task', 'title', 'deliverable', 'milestone', 'summary', 'activity') || 'Daily Activity & Task Deliverables';
          const rawHours = findValue(row, 'hoursspent', 'hours', 'duration', 'time', 'spent');
          const hoursSpent = parseFloat(String(rawHours).replace(/[^0-9.]/g, '')) || 8.0;
          const deliverableNotes = findValue(row, 'deliverablenotes', 'deliverables', 'notes', 'description', 'details') || '';
          const learnings = findValue(row, 'learnings', 'learning', 'skillslearned', 'skill', 'takeaway') || '';
          const blockers = findValue(row, 'blockers', 'blocker', 'issues', 'challenges', 'impediments') || 'None';
          const tomorrowPlan = findValue(row, 'tomorrowplan', 'tomorrow', 'nextplan', 'nextday', 'plan') || '';
          const proofUrl = findValue(row, 'prproofurl', 'proofurl', 'proof', 'url', 'link', 'githuburl', 'prlink', 'driveurl') || '';

          return {
            id: `DT-${new Date().getFullYear()}-${Date.now()}-${idx}`,
            date: logDate,
            staffId,
            staffName,
            staffEmail,
            staffType,
            workMode,
            project,
            taskTitle,
            hoursSpent,
            deliverableNotes,
            learnings,
            blockers,
            tomorrowPlan,
            proofUrl,
            priority: 'Medium',
            status: 'Completed',
            approvalStatus: 'Pending',
            managerFeedback: '',
            managerRating: 5
          };
        }).filter(l => l.taskTitle || l.deliverableNotes || l.project);

        if (normalized.length === 0) {
          setErrorMsg('Could not detect any valid work log entries with task details in this file.');
          setParsedLogs([]);
        } else {
          setParsedLogs(normalized);
        }
      } catch (err) {
        console.error('File parsing error:', err);
        setErrorMsg(`Failed to parse spreadsheet: ${err.message || 'Unknown format'}`);
        setParsedLogs([]);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read the selected file.');
      setIsProcessing(false);
    };
    reader.readAsArrayBuffer(uploadedFile);
  };

  const handleFileChange = (e) => {
    const selected = e.target.files && e.target.files[0];
    if (selected) processFile(selected);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Re-apply overrides when options change
  const handleApplyOverrides = (newPersonMode, newStaffId, newDateMode, newDate, newWorkMode) => {
    if (!parsedLogs.length) return;
    const staffTarget = allStaff.find(s => s.id === (newStaffId || selectedStaffId)) || selectedStaffObj;

    const updated = parsedLogs.map(l => {
      let staffName = l.staffName;
      let staffType = l.staffType;
      let staffId = l.staffId;
      let staffEmail = l.staffEmail;
      let logDate = l.date;
      let workMode = l.workMode;

      if (newPersonMode === 'specific' && staffTarget) {
        staffName = staffTarget.name;
        staffType = staffTarget.type || 'Employee';
        staffId = staffTarget.id;
        staffEmail = staffTarget.email || '';
      }
      if (newDateMode === 'specific' && newDate) {
        logDate = newDate;
      }
      if (newWorkMode && newWorkMode !== 'file') {
        workMode = newWorkMode;
      }

      return {
        ...l,
        staffName,
        staffType,
        staffId,
        staffEmail,
        date: logDate,
        workMode
      };
    });
    setParsedLogs(updated);
  };

  const handleConfirmImport = async () => {
    if (!parsedLogs.length) return;
    setIsSaving(true);
    setErrorMsg('');

    try {
      if (typeof batchAddDailyTasks === 'function') {
        await batchAddDailyTasks(parsedLogs);
      }
      if (typeof onSuccess === 'function') {
        onSuccess(parsedLogs.length);
      }
      onClose();
    } catch (err) {
      console.error('Import work logs error:', err);
      setErrorMsg(`Failed to save work logs: ${err.message || 'Unknown database error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1050 }}>
      <div className="modal-content" style={{ padding: '28px', maxWidth: '850px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#6366f1', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <UploadCloud style={{ width: '14px', height: '14px' }} />
              Bulk Workforce Activity Ingestion
            </div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: '800', margin: '4px 0 6px', color: 'var(--text-primary)' }}>
              Import Work Logs (Excel / CSV)
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
              Bulk upload timesheet entries and daily logs from spreadsheets with options to auto-assign all rows to a specific team member or date.
            </p>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* Template Download Banner */}
        <div style={{
          background: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: '10px',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div>
            <div style={{ fontSize: '0.84rem', fontWeight: '700', color: '#a5b4fc' }}>
              Need the spreadsheet template?
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Download our pre-structured template containing standard columns for hours, deliverables, learnings, and blockers.
            </div>
          </div>

          <button
            onClick={handleDownloadSample}
            className="btn btn-secondary"
            style={{ fontSize: '0.78rem', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Download style={{ width: '14px', height: '14px', color: '#818cf8' }} />
            <span>Download Sample Template (.CSV)</span>
          </button>
        </div>

        {/* Configuration Controls Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          
          {/* Target Person Option */}
          <div className="saas-card" style={{ padding: '16px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User style={{ width: '14px', height: '14px', color: '#60a5fa' }} />
              Staff Assignment Mode
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="personMode"
                  value="file"
                  checked={personMode === 'file'}
                  onChange={() => {
                    setPersonMode('file');
                    handleApplyOverrides('file', selectedStaffId, dateMode, selectedDate, workModeOption);
                  }}
                  style={{ accentColor: '#6366f1' }}
                />
                <span>Use staff name from spreadsheet</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="personMode"
                  value="specific"
                  checked={personMode === 'specific'}
                  onChange={() => {
                    setPersonMode('specific');
                    handleApplyOverrides('specific', selectedStaffId, dateMode, selectedDate, workModeOption);
                  }}
                  style={{ accentColor: '#6366f1' }}
                />
                <span>Assign all rows to a specific person</span>
              </label>

              {personMode === 'specific' && (
                <div style={{ marginTop: '6px' }}>
                  <select
                    value={selectedStaffId}
                    onChange={(e) => {
                      setSelectedStaffId(e.target.value);
                      handleApplyOverrides('specific', e.target.value, dateMode, selectedDate, workModeOption);
                    }}
                    className="form-select"
                    style={{ fontSize: '0.82rem', padding: '8px 12px' }}
                  >
                    {allStaff.map(s => (
                      <option key={s.id} value={s.id}>
                        [{s.type}] {s.name} - {s.designation || 'Staff'}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Target Date Option */}
          <div className="saas-card" style={{ padding: '16px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar style={{ width: '14px', height: '14px', color: '#34d399' }} />
              Date Assignment Mode
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="dateMode"
                  value="file"
                  checked={dateMode === 'file'}
                  onChange={() => {
                    setDateMode('file');
                    handleApplyOverrides(personMode, selectedStaffId, 'file', selectedDate, workModeOption);
                  }}
                  style={{ accentColor: '#6366f1' }}
                />
                <span>Use date from spreadsheet</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="dateMode"
                  value="specific"
                  checked={dateMode === 'specific'}
                  onChange={() => {
                    setDateMode('specific');
                    handleApplyOverrides(personMode, selectedStaffId, 'specific', selectedDate, workModeOption);
                  }}
                  style={{ accentColor: '#6366f1' }}
                />
                <span>Assign all rows to a specific date</span>
              </label>

              {dateMode === 'specific' && (
                <div style={{ marginTop: '6px' }}>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      handleApplyOverrides(personMode, selectedStaffId, 'specific', e.target.value, workModeOption);
                    }}
                    className="form-input"
                    style={{ fontSize: '0.82rem', padding: '7px 12px' }}
                  />
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Drag & Drop Upload Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
          style={{
            border: '2px dashed rgba(99, 102, 241, 0.4)',
            borderRadius: '12px',
            padding: '30px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            background: 'rgba(99, 102, 241, 0.04)',
            marginBottom: '20px',
            transition: 'border-color 0.2s ease'
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          <FileSpreadsheet style={{ width: '40px', height: '40px', color: '#818cf8', margin: '0 auto 10px' }} />
          <div style={{ fontWeight: '700', fontSize: '0.92rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
            {fileName ? fileName : 'Click to select or drop a spreadsheet (.xlsx, .xls, .csv)'}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Supports Microsoft Excel spreadsheets and CSV exports with auto-column detection
          </div>
        </div>

        {/* Error Feedback */}
        {errorMsg && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '12px 16px',
            color: '#f87171',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px'
          }}>
            <AlertTriangle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Live Preview Table */}
        {parsedLogs.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.84rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                Parsed Logs Preview ({parsedLogs.length} Records Detected)
              </span>
              <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: '700' }}>
                Ready to commit to database
              </span>
            </div>

            <div style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px' }}>
              <table className="custom-table" style={{ fontSize: '0.78rem', margin: 0 }}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Staff Name</th>
                    <th>Type</th>
                    <th>Project</th>
                    <th>Task Summary</th>
                    <th>Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedLogs.slice(0, 50).map((log, idx) => (
                    <tr key={idx}>
                      <td style={{ whiteSpace: 'nowrap' }}>{log.date}</td>
                      <td style={{ fontWeight: '700' }}>{log.staffName}</td>
                      <td>
                        <span className={`status-pill ${log.staffType === 'Intern' ? 'status-pill-amber' : 'status-pill-indigo'}`} style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                          {log.staffType}
                        </span>
                      </td>
                      <td style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.project}</td>
                      <td style={{ maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.taskTitle}</td>
                      <td style={{ fontWeight: '700', color: '#34d399' }}>{log.hoursSpent}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {parsedLogs.length > 50 && (
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>
                Showing first 50 of {parsedLogs.length} records in preview
              </div>
            )}
          </div>
        )}

        {/* Modal Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px' }}>
          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '8px 16px', fontSize: '0.84rem' }}
            disabled={isSaving}
          >
            Cancel
          </button>

          <button
            onClick={handleConfirmImport}
            disabled={!parsedLogs.length || isSaving || isProcessing}
            className="btn gradient-btn-primary"
            style={{
              padding: '8px 20px',
              fontSize: '0.84rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              opacity: (!parsedLogs.length || isSaving) ? 0.6 : 1
            }}
          >
            <CheckCircle2 style={{ width: '16px', height: '16px' }} />
            <span>
              {isSaving ? 'Saving to Database...' : `Import ${parsedLogs.length} Work Logs`}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default BulkImportWorkLogsModal;
