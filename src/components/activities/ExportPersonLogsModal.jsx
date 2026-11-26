import React, { useState, useMemo } from 'react';
import exportToCSV from '../../utils/csvExporter';
import {
  Download,
  User,
  Calendar,
  FileSpreadsheet,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  Briefcase
} from 'lucide-react';

const ExportPersonLogsModal = ({
  isOpen,
  onClose,
  allStaff = [],
  dailyTasks = [],
  currentUser
}) => {
  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedStaffId, setSelectedStaffId] = useState(() => {
    return allStaff[0]?.id || currentUser?.id || '';
  });
  const [exportRangeMode, setExportRangeMode] = useState('all'); // 'all' | 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState(todayStr);

  const selectedStaffObj = useMemo(() => {
    return allStaff.find(s => s.id === selectedStaffId) || allStaff[0] || {
      id: selectedStaffId,
      name: 'Staff Member',
      type: 'Employee',
      designation: 'Staff'
    };
  }, [allStaff, selectedStaffId]);

  // Find all matching logs for this specific staff member
  const personLogs = useMemo(() => {
    if (!selectedStaffObj) return [];
    const targetId = (selectedStaffObj.id || '').toLowerCase().trim();
    const targetName = (selectedStaffObj.name || '').toLowerCase().trim();
    const targetEmail = (selectedStaffObj.email || '').toLowerCase().trim();

    return (dailyTasks || []).filter(task => {
      const taskId = (task.staffId || '').toLowerCase().trim();
      const taskName = (task.staffName || '').toLowerCase().trim();
      const taskEmail = (task.staffEmail || '').toLowerCase().trim();

      const isMatch = (targetId && (taskId === targetId || taskId.includes(targetId) || targetId.includes(taskId))) ||
                      (targetName && (taskName === targetName || taskName.includes(targetName) || targetName.includes(taskName))) ||
                      (targetEmail && taskEmail && taskEmail === targetEmail);

      if (!isMatch) return false;

      if (exportRangeMode === 'custom') {
        if (startDate && task.date < startDate) return false;
        if (endDate && task.date > endDate) return false;
      }

      return true;
    }).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [dailyTasks, selectedStaffObj, exportRangeMode, startDate, endDate]);

  // Summary Metrics
  const totalHours = Math.round(personLogs.reduce((sum, l) => sum + (parseFloat(l.hoursSpent) || 8.0), 0) * 10) / 10;
  const approvedCount = personLogs.filter(l => l.approvalStatus === 'Approved').length;
  const pendingCount = personLogs.length - approvedCount;

  const handleDownload = () => {
    if (!personLogs.length) return;

    let csv = `Log ID,Date,Staff Name,Staff Type,Work Mode,Project,Task Title,Hours Spent,Deliverable Notes,Learnings,Blockers,Tomorrow Plan,PR Proof URL,Approval Status,Supervisor Review\n`;

    personLogs.forEach(l => {
      const cleanTitle = (l.taskTitle || '').replace(/"/g, '""');
      const cleanDeliverables = (l.deliverableNotes || '').replace(/"/g, '""');
      const cleanLearnings = (l.learnings || '').replace(/"/g, '""');
      const cleanBlockers = (l.blockers || '').replace(/"/g, '""');
      const cleanTomorrow = (l.tomorrowPlan || '').replace(/"/g, '""');
      const cleanFeedback = (l.managerFeedback || '').replace(/"/g, '""');
      const hours = parseFloat(l.hoursSpent) || 8.0;

      csv += `"${l.id}","${l.date || ''}","${l.staffName || selectedStaffObj.name}","${l.staffType || selectedStaffObj.type || 'Employee'}","${l.workMode || 'Office Campus'}","${l.project || ''}","${cleanTitle}",${hours},"${cleanDeliverables}","${cleanLearnings}","${cleanBlockers}","${cleanTomorrow}","${l.proofUrl || ''}","${l.approvalStatus || 'Pending'}","${cleanFeedback}"\n`;
    });

    const safeName = (selectedStaffObj.name || 'Staff').replace(/[^a-zA-Z0-9_-]/g, '_');
    const rangeLabel = exportRangeMode === 'all' ? 'Overall' : `${startDate || 'Start'}_to_${endDate || 'Today'}`;
    const filename = `${safeName}_Work_Logs_${rangeLabel}.csv`;

    exportToCSV(csv, filename);
    onClose();
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1050 }}>
      <div className="modal-content" style={{ padding: '28px', maxWidth: '620px', width: '100%' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#6366f1', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User style={{ width: '14px', height: '14px' }} />
              Personalized Work History Export
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '800', margin: '4px 0 6px', color: 'var(--text-primary)' }}>
              Export Staff Work Logs
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
              Export overall work logs or date-filtered deliverables for any individual team member or intern.
            </p>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* Staff Selection */}
        <div className="form-group" style={{ marginBottom: '18px' }}>
          <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: '700' }}>
            Select Staff Member
          </label>
          <select
            value={selectedStaffId}
            onChange={(e) => setSelectedStaffId(e.target.value)}
            className="form-select"
            style={{ fontSize: '0.86rem', padding: '10px 14px' }}
          >
            {allStaff.map(s => {
              // Count logs for preview in dropdown
              const sTargetId = (s.id || '').toLowerCase().trim();
              const sTargetName = (s.name || '').toLowerCase().trim();
              const matchCount = (dailyTasks || []).filter(t => {
                const tId = (t.staffId || '').toLowerCase().trim();
                const tName = (t.staffName || '').toLowerCase().trim();
                return (sTargetId && (tId === sTargetId || tId.includes(sTargetId))) ||
                       (sTargetName && (tName === sTargetName || tName.includes(sTargetName)));
              }).length;

              return (
                <option key={s.id} value={s.id}>
                  [{s.type}] {s.name} - {s.designation || 'Staff'} ({matchCount} logs)
                </option>
              );
            })}
          </select>
        </div>

        {/* Date Range Selection */}
        <div className="saas-card" style={{ padding: '16px', marginBottom: '18px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>
            Export Time Scope
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
              <input
                type="radio"
                name="exportRangeMode"
                value="all"
                checked={exportRangeMode === 'all'}
                onChange={() => setExportRangeMode('all')}
                style={{ accentColor: '#6366f1' }}
              />
              <span><strong>Overall / Complete History</strong> (All logs ever submitted by this person)</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
              <input
                type="radio"
                name="exportRangeMode"
                value="custom"
                checked={exportRangeMode === 'custom'}
                onChange={() => setExportRangeMode('custom')}
                style={{ accentColor: '#6366f1' }}
              />
              <span><strong>Specific Date Range</strong></span>
            </label>

            {exportRangeMode === 'custom' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '6px' }}>
                <div>
                  <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>From Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="form-input"
                    style={{ fontSize: '0.82rem', padding: '6px 10px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>To Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="form-input"
                    style={{ fontSize: '0.82rem', padding: '6px 10px' }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Live Summary Card */}
        <div style={{
          background: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: '10px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ fontWeight: '800', fontSize: '0.92rem', color: '#fff' }}>
              {selectedStaffObj.name}
            </div>
            <span className={`status-pill ${selectedStaffObj.type === 'Intern' ? 'status-pill-amber' : 'status-pill-indigo'}`} style={{ fontSize: '0.7rem' }}>
              {selectedStaffObj.type}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center' }}>
            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Matching Logs</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#818cf8', marginTop: '2px' }}>
                {personLogs.length}
              </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Hours</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#34d399', marginTop: '2px' }}>
                {totalHours}h
              </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Approved</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#fbbf24', marginTop: '2px' }}>
                {approvedCount}
              </div>
            </div>
          </div>

          {personLogs.length === 0 && (
            <div style={{ fontSize: '0.78rem', color: '#f87171', marginTop: '10px', textAlign: 'center' }}>
              No work logs found for this staff member in the selected date range.
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.84rem' }}>
            Cancel
          </button>

          <button
            onClick={handleDownload}
            disabled={personLogs.length === 0}
            className="btn gradient-btn-primary"
            style={{
              padding: '8px 20px',
              fontSize: '0.84rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              opacity: personLogs.length === 0 ? 0.5 : 1
            }}
          >
            <Download style={{ width: '15px', height: '15px' }} />
            <span>Download {selectedStaffObj.name}'s Logs ({personLogs.length})</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default ExportPersonLogsModal;
