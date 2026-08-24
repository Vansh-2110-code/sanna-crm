import React, { useState, useMemo } from 'react';
import { useCRM } from '../../context/CRMContext';
import exportToCSV from '../../utils/csvExporter';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  User,
  ExternalLink,
  GitPullRequest,
  CheckSquare,
  FileSpreadsheet,
  Trash2,
  Edit2,
  Sparkles,
  Layers,
  Building,
  Check,
  X,
  MessageSquare
} from 'lucide-react';

const CATEGORIES = [
  'Development',
  'Bug Fix & QA',
  'Feature Design',
  'Client Deliverables',
  'Marketing & Growth',
  'Backend / Database',
  'Customer Support',
  'Architecture & Docs'
];

const STATUS_OPTS = ['All', 'Completed', 'In Progress', 'Under Review', 'Blocked'];
const PRIORITIES = ['Urgent', 'High', 'Medium', 'Low'];

const DailyTaskDiary = () => {
  const {
    dailyTasks = [],
    addDailyTask,
    updateDailyTask,
    deleteDailyTask,
    approveDailyTask,
    employees = [],
    interns = [],
    currentUser,
    activeRole
  } = useCRM();

  const isManagerOrAdmin = (activeRole?.permissions || []).includes('super_admin') || activeRole?.id === 'role-admin' || activeRole?.id === 'role-mgr' || activeRole?.id === 'role-hr';

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedStaff, setSelectedStaff] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [feedbackModalTask, setFeedbackModalTask] = useState(null);
  const [managerNote, setManagerNote] = useState('');

  // Staff options
  const allStaffMembers = useMemo(() => {
    const list = [];
    (employees || []).forEach(e => {
      list.push({ id: e.id, name: e.name, type: 'Employee', designation: e.designation });
    });
    (interns || []).forEach(i => {
      list.push({ id: i.id, name: `${i.name} (Intern)`, type: 'Intern', designation: i.department });
    });
    return list;
  }, [employees, interns]);

  // Form State
  const [taskForm, setNewTaskForm] = useState({
    taskTitle: '',
    date: todayStr,
    staffId: currentUser?.id || allStaffMembers[0]?.id || 'EMP-001',
    project: 'Astra Core CRM & Workforce Module',
    category: 'Development',
    hoursSpent: 4.0,
    status: 'Completed',
    priority: 'High',
    deliverableNotes: '',
    proofUrl: ''
  });

  const handleCreateTask = (e) => {
    e.preventDefault();
    const assignedStaff = allStaffMembers.find(s => s.id === taskForm.staffId) || { name: currentUser?.name || 'Staff' };
    addDailyTask({
      ...taskForm,
      staffName: assignedStaff.name,
      staffType: assignedStaff.type || 'Employee',
      hoursSpent: parseFloat(taskForm.hoursSpent) || 0
    });
    setShowAddModal(false);
    setNewTaskForm({
      taskTitle: '',
      date: todayStr,
      staffId: currentUser?.id || allStaffMembers[0]?.id || 'EMP-001',
      project: 'Astra Core CRM & Workforce Module',
      category: 'Development',
      hoursSpent: 4.0,
      status: 'Completed',
      priority: 'High',
      deliverableNotes: '',
      proofUrl: ''
    });
  };

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return dailyTasks.filter(task => {
      const matchDate = !selectedDate || task.date === selectedDate;
      const matchStaff = selectedStaff === 'All' || task.staffId === selectedStaff || task.staffName?.includes(selectedStaff);
      const matchStatus = selectedStatus === 'All' || task.status === selectedStatus;
      const q = searchQuery.toLowerCase();
      const matchSearch = !q ||
        task.taskTitle?.toLowerCase().includes(q) ||
        task.staffName?.toLowerCase().includes(q) ||
        task.project?.toLowerCase().includes(q) ||
        task.deliverableNotes?.toLowerCase().includes(q);

      return matchDate && matchStaff && matchStatus && matchSearch;
    });
  }, [dailyTasks, selectedDate, selectedStaff, selectedStatus, searchQuery]);

  // Metrics
  const totalTasksCount = filteredTasks.length;
  const totalHoursLogged = filteredTasks.reduce((sum, t) => sum + (parseFloat(t.hoursSpent) || 0), 0);
  const completedCount = filteredTasks.filter(t => t.status === 'Completed').length;
  const approvedCount = filteredTasks.filter(t => t.approvalStatus === 'Approved').length;

  // Export to CSV
  const handleExportCSV = () => {
    let csv = `Task ID,Date,Staff Name,Type,Project / Client,Category,Hours,Status,Priority,Deliverables Notes,Proof / PR Link,Approval Status,Manager Feedback\n`;
    filteredTasks.forEach(t => {
      csv += `"${t.id}","${t.date}","${t.staffName}","${t.staffType}","${t.project}","${t.category}",${t.hoursSpent},"${t.status}","${t.priority}","${(t.deliverableNotes || '').replace(/"/g, '""')}","${t.proofUrl || ''}","${t.approvalStatus || 'Pending'}","${(t.managerFeedback || '').replace(/"/g, '""')}"\n`;
    });

    exportToCSV(csv, `Daily_Task_Log_${selectedDate}.csv`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Banner & Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckSquare style={{ width: '20px', height: '20px', color: '#818cf8' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Tasks Logged</div>
            <div style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-primary)' }}>{totalTasksCount} Entries</div>
            <div style={{ fontSize: '0.7rem', color: '#34d399' }}>{completedCount} Completed</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock style={{ width: '20px', height: '20px', color: '#34d399' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Total Hours Tracked</div>
            <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#34d399' }}>{totalHoursLogged.toFixed(1)} Hours</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Daily timesheet accumulation</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(234, 179, 8, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 style={{ width: '20px', height: '20px', color: '#facc15' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Manager Approvals</div>
            <div style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-primary)' }}>{approvedCount} Verified</div>
            <div style={{ fontSize: '0.7rem', color: '#818cf8' }}>
              {totalTasksCount > 0 ? Math.round((approvedCount / totalTasksCount) * 100) : 100}% Approved
            </div>
          </div>
        </div>
      </div>

      {/* Date, Filter & Search Toolbar */}
      <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        
        {/* Left: Date & Staff filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar style={{ width: '16px', height: '16px', color: '#818cf8' }} />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="form-input"
              style={{ width: '140px', padding: '6px 10px', fontSize: '0.8rem', fontWeight: '700' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>Staff:</span>
            <select
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
              className="form-input"
              style={{ width: '160px', padding: '6px 10px', fontSize: '0.78rem' }}
            >
              <option value="All">All Staff Members</option>
              {allStaffMembers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="form-input"
              style={{ width: '120px', padding: '6px 10px', fontSize: '0.78rem' }}
            >
              {STATUS_OPTS.map(st => <option key={st} value={st}>{st}</option>)}
            </select>
          </div>
        </div>

        {/* Right: Search, Export & New Task button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '180px' }}>
            <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '13px', height: '13px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '30px', fontSize: '0.78rem', width: '100%' }}
            />
          </div>

          <button
            onClick={handleExportCSV}
            className="btn btn-secondary"
            style={{ padding: '7px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <FileSpreadsheet style={{ width: '14px', height: '14px' }} />
            <span>Export (.CSV)</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="btn gradient-btn-primary"
            style={{ padding: '7px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus style={{ width: '15px', height: '15px' }} />
            <span>Log Daily Task</span>
          </button>
        </div>
      </div>

      {/* Daily Tasks Cards Stream */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {filteredTasks.length === 0 ? (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <CheckSquare style={{ width: '40px', height: '40px', margin: '0 auto 12px auto', opacity: 0.4 }} />
            <p style={{ fontSize: '0.9rem', margin: 0 }}>No work entries recorded for the selected date/filter.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn gradient-btn-primary"
              style={{ marginTop: '14px', padding: '8px 16px', fontSize: '0.8rem' }}
            >
              + Log Today's Work Entry
            </button>
          </div>
        ) : (
          filteredTasks.map(task => {
            const isApproved = task.approvalStatus === 'Approved';
            const isBlocked = task.status === 'Blocked';

            return (
              <div
                key={task.id}
                className="glass-card"
                style={{
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  borderLeft: isBlocked ? '4px solid #ef4444' : isApproved ? '4px solid #10b981' : '4px solid #6366f1'
                }}
              >
                {/* Top Row: Title, Staff & Statuses */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: 'rgba(99, 102, 241, 0.15)',
                        color: '#818cf8',
                        fontSize: '0.7rem',
                        fontWeight: '700'
                      }}>
                        {task.category || 'Development'}
                      </span>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: task.priority === 'Urgent' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: task.priority === 'Urgent' ? '#f87171' : '#fbbf24',
                        fontSize: '0.7rem',
                        fontWeight: '700'
                      }}>
                        {task.priority || 'Medium'} Priority
                      </span>
                    </div>

                    <h4 style={{ fontSize: '1.05rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                      {task.taskTitle}
                    </h4>

                    <div style={{ fontSize: '0.78rem', color: '#a5b4fc', marginTop: '2px' }}>
                      <strong>{task.staffName}</strong> ({task.staffType}) · Project: <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{task.project}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '700' }}>
                      <Clock style={{ width: '13px', height: '13px', color: '#34d399' }} />
                      <span>{task.hoursSpent || 0} hrs</span>
                    </div>

                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      background: task.status === 'Completed' ? 'rgba(16, 185, 129, 0.15)' : task.status === 'Blocked' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                      color: task.status === 'Completed' ? '#34d399' : task.status === 'Blocked' ? '#f87171' : '#60a5fa',
                      fontSize: '0.75rem',
                      fontWeight: '700'
                    }}>
                      {task.status}
                    </span>

                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      background: isApproved ? 'rgba(16, 185, 129, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                      color: isApproved ? '#34d399' : '#facc15',
                      fontSize: '0.75rem',
                      fontWeight: '700'
                    }}>
                      {isApproved ? '✓ Approved' : '⏳ Review Pending'}
                    </span>
                  </div>
                </div>

                {/* Deliverables Output Notes */}
                {task.deliverableNotes && (
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    <strong style={{ color: 'var(--text-primary)' }}>Work Accomplished: </strong>
                    {task.deliverableNotes}
                  </div>
                )}

                {/* Footer: PR Links, Feedback & Manager Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-color)', fontSize: '0.78rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {task.proofUrl && (
                      <a
                        href={task.proofUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontWeight: '600' }}
                      >
                        <GitPullRequest style={{ width: '13px', height: '13px' }} />
                        <span>View Pull Request / Commit</span>
                        <ExternalLink style={{ width: '11px', height: '11px' }} />
                      </a>
                    )}

                    {task.managerFeedback && (
                      <div style={{ color: '#a5b4fc', fontStyle: 'italic' }}>
                        <strong>Manager Review: </strong>"{task.managerFeedback}"
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Status quick toggle */}
                    <button
                      onClick={() => updateDailyTask(task.id, { status: task.status === 'Completed' ? 'In Progress' : 'Completed' })}
                      className="btn btn-secondary"
                      style={{ padding: '5px 10px', fontSize: '0.72rem' }}
                    >
                      {task.status === 'Completed' ? 'Set In Progress' : 'Mark Completed'}
                    </button>

                    {/* Manager Approval */}
                    {isManagerOrAdmin && (
                      <button
                        onClick={() => {
                          setFeedbackModalTask(task);
                          setManagerNote(task.managerFeedback || 'Reviewed and approved.');
                        }}
                        className="btn gradient-btn-primary"
                        style={{ padding: '5px 12px', fontSize: '0.72rem' }}
                      >
                        <Check style={{ width: '12px', height: '12px' }} />
                        <span>{isApproved ? 'Update Review' : 'Approve Task'}</span>
                      </button>
                    )}

                    <button
                      onClick={() => deleteDailyTask(task.id)}
                      className="btn btn-secondary"
                      style={{ padding: '5px 8px', color: '#f87171' }}
                    >
                      <Trash2 style={{ width: '12px', height: '12px' }} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: LOG DAILY WORK ENTRY                                               */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckSquare style={{ width: '20px', height: '20px', color: '#818cf8' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0 }}>Log Daily Work Entry</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="btn btn-secondary" style={{ padding: '6px 8px' }}>
                <X style={{ width: '16px', height: '16px' }} />
              </button>
            </div>

            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="form-label">Task Title / Milestone *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implemented 31-day attendance calendar grid with LOP math"
                  value={taskForm.taskTitle}
                  onChange={(e) => setNewTaskForm({ ...taskForm, taskTitle: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="form-label">Staff Member *</label>
                  <select
                    value={taskForm.staffId}
                    onChange={(e) => setNewTaskForm({ ...taskForm, staffId: e.target.value })}
                    className="form-input"
                  >
                    {allStaffMembers.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.designation})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Date *</label>
                  <input
                    type="date"
                    required
                    value={taskForm.date}
                    onChange={(e) => setNewTaskForm({ ...taskForm, date: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="form-label">Project / Client *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Astra Core CRM / Acme Retainer"
                    value={taskForm.project}
                    onChange={(e) => setNewTaskForm({ ...taskForm, project: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">Category</label>
                  <select
                    value={taskForm.category}
                    onChange={(e) => setNewTaskForm({ ...taskForm, category: e.target.value })}
                    className="form-input"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="form-label">Hours Spent</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="24"
                    required
                    value={taskForm.hoursSpent}
                    onChange={(e) => setNewTaskForm({ ...taskForm, hoursSpent: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">Status</label>
                  <select
                    value={taskForm.status}
                    onChange={(e) => setNewTaskForm({ ...taskForm, status: e.target.value })}
                    className="form-input"
                  >
                    <option value="Completed">Completed</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Blocked">Blocked</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setNewTaskForm({ ...taskForm, priority: e.target.value })}
                    className="form-input"
                  >
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Deliverable Output & Work Notes *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detailed description of features built, commits pushed, or client items completed..."
                  value={taskForm.deliverableNotes}
                  onChange={(e) => setNewTaskForm({ ...taskForm, deliverableNotes: e.target.value })}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Proof / Pull Request / Commit URL (optional)</label>
                <input
                  type="url"
                  placeholder="https://github.com/astracrm/core/pull/135"
                  value={taskForm.proofUrl}
                  onChange={(e) => setNewTaskForm({ ...taskForm, proofUrl: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn gradient-btn-primary">Save Daily Work Log</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: MANAGER APPROVAL & FEEDBACK                                        */}
      {/* ========================================================================= */}
      {feedbackModalTask && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', marginBottom: '8px' }}>
              Approve & Review Daily Task
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Candidate: <strong>{feedbackModalTask.staffName}</strong> · Task: {feedbackModalTask.taskTitle}
            </p>

            <form onSubmit={(e) => {
              e.preventDefault();
              approveDailyTask(feedbackModalTask.id, managerNote);
              setFeedbackModalTask(null);
            }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="form-label">Supervisor / Manager Feedback Notes</label>
                <textarea
                  required
                  rows={3}
                  value={managerNote}
                  onChange={(e) => setManagerNote(e.target.value)}
                  className="form-input"
                  placeholder="e.g. Excellent execution and adherence to coding guidelines."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setFeedbackModalTask(null)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn gradient-btn-primary">Approve Task & Post Review</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyTaskDiary;
