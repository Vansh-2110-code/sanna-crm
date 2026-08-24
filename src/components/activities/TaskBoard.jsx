import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext';
import DailyTaskDiary from './DailyTaskDiary';
import {
  CheckSquare,
  Plus,
  PhoneCall,
  Video,
  Mail,
  MessageSquare,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  BookOpen,
  Layers
} from 'lucide-react';

const TaskBoard = () => {
  const { tasks, addTask, toggleTaskStatus, employees = [], currentUser } = useCRM();

  const [activeView, setActiveView] = useState('daily_diary'); // 'daily_diary' | 'activities'

  // Get list of sales reps/employees for the active organization
  const availableReps = employees.length > 0 
    ? employees.map(e => e.name)
    : [currentUser?.name || 'Unassigned'];
    
  if (currentUser?.name && !availableReps.includes(currentUser.name)) {
    availableReps.unshift(currentUser.name);
  }

  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'Call',
    dueDate: '',
    priority: 'Medium',
    assignedTo: availableReps[0] || '',
    relatedEntity: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title) return;

    addTask({
      title: formData.title,
      type: formData.type,
      dueDate: formData.dueDate,
      priority: formData.priority,
      assignedTo: formData.assignedTo,
      relatedEntity: formData.relatedEntity
    });

    setShowAddModal(false);
  };

  const callsCount = (tasks || []).filter(t => t.type === 'Call').length;
  const meetingsCount = (tasks || []).filter(t => t.type === 'Meeting' || t.type === 'Demo').length;
  const messagingCount = (tasks || []).filter(t => t.type === 'WhatsApp' || t.type === 'Email' || t.type === 'Message').length;
  const completedTasks = (tasks || []).filter(t => t.status === 'Completed').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Level View Selector */}
      <div className="glass-card" style={{ padding: '8px 12px', display: 'flex', gap: '8px' }}>
        <button
          onClick={() => setActiveView('daily_diary')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '8px',
            background: activeView === 'daily_diary' ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(168, 85, 247, 0.15) 100%)' : 'transparent',
            border: activeView === 'daily_diary' ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
            color: activeView === 'daily_diary' ? '#818cf8' : 'var(--text-secondary)',
            fontWeight: activeView === 'daily_diary' ? '700' : '500',
            fontSize: '0.85rem',
            cursor: 'pointer'
          }}
        >
          <CheckSquare style={{ width: '16px', height: '16px' }} />
          <span>Daily Work Logs & Timesheet Entry</span>
        </button>

        <button
          onClick={() => setActiveView('activities')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '8px',
            background: activeView === 'activities' ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(168, 85, 247, 0.15) 100%)' : 'transparent',
            border: activeView === 'activities' ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
            color: activeView === 'activities' ? '#818cf8' : 'var(--text-secondary)',
            fontWeight: activeView === 'activities' ? '700' : '500',
            fontSize: '0.85rem',
            cursor: 'pointer'
          }}
        >
          <PhoneCall style={{ width: '16px', height: '16px' }} />
          <span>Omnichannel Activity Center</span>
        </button>
      </div>

      {activeView === 'daily_diary' ? (
        <DailyTaskDiary />
      ) : (
        <>
      
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: '#60a5fa', fontWeight: '700', textTransform: 'uppercase' }}>
            Omnichannel Operations & Task Center
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '4px 0' }}>
            Activity & Task Management ({tasks.length})
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Log calls, schedule video meetings, send email/WhatsApp touchpoints, and track sales team to-dos with reminders.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn gradient-btn-primary"
          style={{ padding: '10px 18px', borderRadius: '10px' }}
        >
          <Plus style={{ width: '18px', height: '18px' }} />
          <span>Add Task / Activity</span>
        </button>
      </div>

      {/* Activities Feed Summary Badges */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.15)', padding: '10px', borderRadius: '10px' }}>
            <PhoneCall style={{ width: '20px', height: '20px', color: '#60a5fa' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700' }}>CALLS LOGGED</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '800' }}>{callsCount} Calls</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'rgba(139, 92, 246, 0.15)', padding: '10px', borderRadius: '10px' }}>
            <Video style={{ width: '20px', height: '20px', color: '#c084fc' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700' }}>DEMO MEETINGS</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '800' }}>{meetingsCount} Held</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '10px', borderRadius: '10px' }}>
            <MessageSquare style={{ width: '20px', height: '20px', color: '#34d399' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700' }}>WHATSAPP MESSAGES</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '800' }}>{messagingCount} Sent</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '10px', borderRadius: '10px' }}>
            <CheckSquare style={{ width: '20px', height: '20px', color: '#fbbf24' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700' }}>TASKS COMPLETED</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '800' }}>
              {completedTasks} / {tasks.length}
            </div>
          </div>
        </div>
      </div>

      {/* Task List Container */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px' }}>Pending Tasks & Follow-up Items</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {tasks.map(task => {
            const isCompleted = task.status === 'Completed';

            return (
              <div
                key={task.id}
                className="glass-card"
                style={{
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  opacity: isCompleted ? 0.6 : 1,
                  background: isCompleted ? 'rgba(0,0,0,0.2)' : 'var(--bg-card)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <input
                    type="checkbox"
                    checked={isCompleted}
                    onChange={() => toggleTaskStatus(task.id)}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.95rem', textDecoration: isCompleted ? 'line-through' : 'none' }}>
                      {task.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '12px', marginTop: '4px' }}>
                      <span>Related: <strong>{task.relatedEntity}</strong></span>
                      <span>•</span>
                      <span>Assignee: {task.assignedTo}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className={`badge ${task.priority === 'High' ? 'badge-rose' : 'badge-blue'}`}>
                    {task.priority} Priority
                  </span>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar style={{ width: '14px', height: '14px' }} />
                    <span>Due: {task.dueDate}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '6px' }}>Schedule Task or Call Activity</h3>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Task Action Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Call Jonathan Sterling regarding installation schedule"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Activity Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="form-select"
                  >
                    <option value="Call">Phone Call</option>
                    <option value="Meeting">Video Meeting</option>
                    <option value="Email">Email Follow-up</option>
                    <option value="WhatsApp">WhatsApp Message</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Priority Level</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="form-select"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Due Date Target</label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Assigned Rep</label>
                  <select
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                    className="form-select"
                  >
                    {availableReps.map(repName => (
                      <option key={repName} value={repName}>{repName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn gradient-btn-primary">
                  Save Task Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </>
      )}

    </div>
  );
};

export default TaskBoard;
