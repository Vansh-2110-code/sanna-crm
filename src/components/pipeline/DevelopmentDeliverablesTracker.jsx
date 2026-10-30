import React, { useState, useEffect } from 'react';
import { useCRM } from '../../context/CRMContext';
import {
  Code2,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  User,
  TrendingUp,
  Search,
  Filter,
  Check,
  X,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Layers
} from 'lucide-react';

const INITIAL_DEV_PROJECTS = [
  {
    id: 'dev-proj-powertech',
    projectName: 'Powertech CRM',
    clientName: 'Powertech',
    clientType: 'Custom Enterprise',
    assignedLead: 'Smitesh Pokharkar',
    targetDate: '2026-10-25',
    status: 'Completed',
    contractValue: '₹1,20,000',
    milestones: [
      { id: 'm-pt-1', title: 'Enterprise Core CRM Engine & Multi-Tenancy Architecture', assignee: 'Lead Dev', status: 'Completed', progress: 100, dueDate: '2026-10-15' },
      { id: 'm-pt-2', title: 'PostgreSQL Database & Dynamic RBAC Roles', assignee: 'Backend Dev', status: 'Completed', progress: 100, dueDate: '2026-10-18' },
      { id: 'm-pt-3', title: 'Real-Time Telemetry & Staff Work Diary', assignee: 'Full Stack Dev', status: 'Completed', progress: 100, dueDate: '2026-10-22' },
      { id: 'm-pt-4', title: 'Production Staging, Testing & Final Deployment', assignee: 'QA & DevOps', status: 'Completed', progress: 100, dueDate: '2026-10-25' }
    ]
  },
  {
    id: 'dev-proj-edulateral',
    projectName: 'Edulateral LMS Platform',
    clientName: 'Edulateral LMS',
    clientType: 'One-Time Dev',
    assignedLead: 'Development Team',
    targetDate: '2026-10-31',
    status: 'In Progress',
    contractValue: '₹60,000',
    milestones: [
      { id: 'm-1', title: 'LMS Course Architecture & Curriculum Engine', assignee: 'Full Stack Dev', status: 'Completed', progress: 100, dueDate: '2026-10-18' },
      { id: 'm-2', title: 'Student & Instructor Role Authentication', assignee: 'Backend Dev', status: 'Completed', progress: 100, dueDate: '2026-10-20' },
      { id: 'm-3', title: 'Video Streaming & Asset CDN Integration', assignee: 'Cloud Engineer', status: 'Completed', progress: 100, dueDate: '2026-10-22' },
      { id: 'm-4', title: 'Quiz & Certificate Generator System', assignee: 'Frontend Dev', status: 'Completed', progress: 100, dueDate: '2026-10-26' },
      { id: 'm-5', title: 'Payment Gateway Integration (Razorpay/Stripe)', assignee: 'Backend Dev', status: 'In Progress', progress: 85, dueDate: '2026-10-28' },
      { id: 'm-6', title: 'End-to-End QA, Load Testing & Launch', assignee: 'QA Team', status: 'To Do', progress: 0, dueDate: '2026-10-31' }
    ]
  },
  {
    id: 'dev-proj-sanna-crm',
    projectName: 'Sanna CRM v2 Enterprise Suite',
    clientName: 'Sanna Innovations Pvt Ltd',
    clientType: 'Internal Enterprise',
    assignedLead: 'Architecture Lead',
    targetDate: '2026-11-15',
    status: 'In Progress',
    contractValue: 'Enterprise Core',
    milestones: [
      { id: 'm-crm-1', title: 'Verion Matte Dark Design System & Micro-Interactions', assignee: 'UI/UX Specialist', status: 'Completed', progress: 100, dueDate: '2026-10-19' },
      { id: 'm-crm-2', title: 'Central Database & Session Synchronization API', assignee: 'Backend Engineer', status: 'Completed', progress: 100, dueDate: '2026-10-21' },
      { id: 'm-crm-3', title: 'Development Project Deliverables Engine & Trackers', assignee: 'Full Stack Dev', status: 'Completed', progress: 100, dueDate: '2026-10-23' },
      { id: 'm-crm-4', title: 'Multi-Role Boss Review & Approval Sandbox', assignee: 'Lead Dev', status: 'In Progress', progress: 75, dueDate: '2026-10-25' }
    ]
  },
  {
    id: 'dev-proj-aistech',
    projectName: 'Ais Tech AI Web Engine',
    clientName: 'Ais Tech Solutions',
    clientType: 'Client Retainer',
    assignedLead: 'Naveen Kumar',
    targetDate: '2026-11-05',
    status: 'In Progress',
    contractValue: '₹45,000',
    milestones: [
      { id: 'm-ais-1', title: 'Technical SEO Audit & Schema Mapping', assignee: 'SEO Lead', status: 'Completed', progress: 100, dueDate: '2026-10-14' },
      { id: 'm-ais-2', title: 'Core Web Vitals & Speed Optimization (SSR)', assignee: 'Frontend Dev', status: 'Completed', progress: 100, dueDate: '2026-10-22' },
      { id: 'm-ais-3', title: 'Automated AI Blog Pipeline & Indexing', assignee: 'DevOps / AI Team', status: 'In Progress', progress: 60, dueDate: '2026-10-28' }
    ]
  },
  {
    id: 'dev-proj-cloud',
    projectName: 'Cloud Infrastructure & Auto-Scaling Cluster',
    clientName: 'Sahara Transformers',
    clientType: 'Hosting & Cloud',
    assignedLead: 'DevOps Lead',
    targetDate: '2026-11-20',
    status: 'In Progress',
    contractValue: '₹95,000',
    milestones: [
      { id: 'm-cld-1', title: 'AWS Multi-AZ VPC & Security Group Hardening', assignee: 'Cloud DevOps', status: 'Completed', progress: 100, dueDate: '2026-10-12' },
      { id: 'm-cld-2', title: 'PostgreSQL Replication & Automated Backup Snapshots', assignee: 'DBA Engineer', status: 'Completed', progress: 100, dueDate: '2026-10-18' },
      { id: 'm-cld-3', title: 'Kubernetes Cluster Provisioning & Docker Deployments', assignee: 'DevOps Specialist', status: 'In Progress', progress: 50, dueDate: '2026-10-30' }
    ]
  }
];

export const DevelopmentDeliverablesTracker = () => {
  const {
    currentUser,
    devProjects = [],
    updateDevProjectMilestone,
    addDevProjectMilestone,
    deleteDevProjectMilestone,
    createDevProject,
    deleteDevProject,
    saveDevProjects
  } = useCRM();

  // Unified live projects synced across Admin and all employee accounts
  const projects = (Array.isArray(devProjects) && devProjects.length > 0) ? devProjects : INITIAL_DEV_PROJECTS;

  const [selectedProjectId, setSelectedProjectId] = useState(() => {
    return projects[0]?.id || 'dev-proj-powertech';
  });

  // Sync selection if project id doesn't exist
  useEffect(() => {
    if (projects.length > 0 && !projects.some(p => p.id === selectedProjectId)) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  // If this client browser has projects in local storage that aren't yet on server, merge them
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sanna_dev_deliverables_projects_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (Array.isArray(devProjects) && devProjects.length > 0) {
            const serverIds = new Set(devProjects.map(p => p.id));
            const missing = parsed.filter(p => !serverIds.has(p.id));
            if (missing.length > 0 && saveDevProjects) {
              saveDevProjects([...devProjects, ...missing]);
            }
          } else if (saveDevProjects) {
            saveDevProjects(parsed);
          }
        }
      }
    } catch (e) {}
  }, [devProjects]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [showAddMilestoneModal, setShowAddMilestoneModal] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);

  // New Milestone Form
  const [newMilestone, setNewMilestone] = useState({
    title: '',
    assignee: 'Development Team',
    status: 'To Do',
    progress: 0,
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  });

  // New Project Form
  const [newProject, setNewProject] = useState({
    projectName: '',
    clientName: '',
    clientType: 'One-Time Dev',
    assignedLead: 'Lead Developer',
    targetDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    contractValue: '₹50,000'
  });

  const activeProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  const calculateProjectProgress = (milestones = []) => {
    if (!milestones.length) return 0;
    const total = milestones.reduce((sum, m) => sum + (m.progress || 0), 0);
    return Math.round(total / milestones.length);
  };

  const handleUpdateMilestone = (projectId, milestoneId, updates) => {
    if (updateDevProjectMilestone) {
      updateDevProjectMilestone(projectId, milestoneId, updates);
    }
  };

  const handleDeleteMilestone = (projectId, milestoneId) => {
    if (!window.confirm('Are you sure you want to delete this milestone?')) return;
    if (deleteDevProjectMilestone) {
      deleteDevProjectMilestone(projectId, milestoneId);
    }
  };

  const handleAddMilestoneSubmit = (e) => {
    e.preventDefault();
    if (!newMilestone.title.trim()) return;

    const created = {
      id: `m-${Date.now()}`,
      ...newMilestone,
      status: Number(newMilestone.progress) === 100 ? 'Completed' : (Number(newMilestone.progress) > 0 ? 'In Progress' : 'To Do')
    };

    if (addDevProjectMilestone && activeProject) {
      addDevProjectMilestone(activeProject.id, created);
    }

    setNewMilestone({
      title: '',
      assignee: 'Development Team',
      status: 'To Do',
      progress: 0,
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
    });
    setShowAddMilestoneModal(false);
  };

  const handleCreateProjectSubmit = (e) => {
    e.preventDefault();
    if (!newProject.projectName.trim()) return;

    const created = {
      id: `dev-proj-${Date.now()}`,
      ...newProject,
      status: 'In Progress',
      milestones: [
        {
          id: `m-init-${Date.now()}`,
          title: 'System Architecture & Requirements Document',
          assignee: newProject.assignedLead || 'Lead Developer',
          status: 'In Progress',
          progress: 50,
          dueDate: newProject.targetDate
        }
      ]
    };

    if (createDevProject) {
      createDevProject(created);
    }
    setSelectedProjectId(created.id);
    setShowNewProjectModal(false);
    setNewProject({
      projectName: '',
      clientName: '',
      clientType: 'One-Time Dev',
      assignedLead: 'Lead Developer',
      targetDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      contractValue: '₹50,000'
    });
  };

  const projectProgress = activeProject ? calculateProjectProgress(activeProject.milestones) : 0;
  const completedCount = activeProject?.milestones.filter(m => m.status === 'Completed').length || 0;
  const inProgressCount = activeProject?.milestones.filter(m => m.status === 'In Progress').length || 0;
  const todoCount = activeProject?.milestones.filter(m => m.status === 'To Do').length || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner & Project Selector (Dark Matte) */}
      <div style={{
        background: '#111218',
        borderRadius: '24px',
        padding: '24px 28px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.45)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(78, 62, 255, 0.25) 0%, rgba(147, 254, 191, 0.15) 100%)',
            border: '1px solid rgba(78, 62, 255, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#A5B4FC'
          }}>
            <Code2 style={{ width: '28px', height: '28px' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                {activeProject?.projectName || 'Development Deliverables'}
              </h2>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: '700',
                padding: '3px 10px',
                borderRadius: '20px',
                background: 'rgba(78, 62, 255, 0.2)',
                color: '#A5B4FC',
                border: '1px solid rgba(78, 62, 255, 0.35)'
              }}>
                {activeProject?.clientType || 'One-Time Dev'}
              </span>
              <select
                value={activeProject?.status || 'In Progress'}
                onChange={(e) => {
                  const newStatus = e.target.value;
                  const updated = projects.map(p => p.id === activeProject.id ? { ...p, status: newStatus } : p);
                  if (saveDevProjects) saveDevProjects(updated);
                }}
                style={{
                  fontSize: '0.74rem',
                  fontWeight: '700',
                  padding: '3px 10px',
                  borderRadius: '20px',
                  background: activeProject?.status === 'Completed' ? 'rgba(52, 211, 153, 0.2)' : (activeProject?.status === 'On Hold' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(78, 62, 255, 0.2)'),
                  color: activeProject?.status === 'Completed' ? '#34D399' : (activeProject?.status === 'On Hold' ? '#FBBF24' : '#A5B4FC'),
                  border: activeProject?.status === 'Completed' ? '1px solid rgba(52, 211, 153, 0.4)' : (activeProject?.status === 'On Hold' ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(78, 62, 255, 0.35)'),
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="In Progress" style={{ background: '#161822', color: '#60A5FA' }}>In Progress</option>
                <option value="On Hold" style={{ background: '#161822', color: '#FBBF24' }}>On Hold</option>
                <option value="Completed" style={{ background: '#161822', color: '#34D399' }}>Completed</option>
              </select>
            </div>
            <p style={{ fontSize: '0.84rem', color: '#94A3B8', margin: '4px 0 0 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span>Client: <strong style={{ color: '#F8FAFC' }}>{activeProject?.clientName}</strong></span>
              <span>•</span>
              <span>Lead: <strong style={{ color: '#F8FAFC' }}>{activeProject?.assignedLead}</strong></span>
              <span>•</span>
              <span>Target Delivery: <strong style={{ color: '#F8FAFC' }}>{activeProject?.targetDate}</strong></span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            style={{
              padding: '10px 16px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              background: '#161822',
              fontSize: '0.85rem',
              fontWeight: '700',
              color: '#F8FAFC',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {projects.map(p => (
              <option key={p.id} value={p.id} style={{ background: '#161822', color: '#F8FAFC' }}>
                {p.projectName} ({calculateProjectProgress(p.milestones)}%)
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowAddMilestoneModal(true)}
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              background: '#4E3EFF',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '0.85rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(78, 62, 255, 0.4)',
              transition: 'all 0.2s ease'
            }}
          >
            <Plus style={{ width: '16px', height: '16px' }} />
            <span>Add Milestone</span>
          </button>

          <button
            onClick={() => setShowNewProjectModal(true)}
            style={{
              padding: '10px 16px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.06)',
              color: '#E2E8F0',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              fontSize: '0.85rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Layers style={{ width: '15px', height: '15px' }} />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Progress Metric Highlight Bar (Dark Matte) */}
      <div style={{
        background: '#111218',
        borderRadius: '24px',
        padding: '24px 28px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.45)',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <span style={{ fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94A3B8' }}>
              Overall Project Completion
            </span>
            <div style={{ fontSize: '1.9rem', fontWeight: '900', color: '#FFFFFF', marginTop: '2px' }}>
              {projectProgress}%
              <span style={{ fontSize: '0.88rem', fontWeight: '600', color: '#94A3B8', marginLeft: '12px' }}>
                ({completedCount} of {activeProject?.milestones.length || 0} Milestones Completed)
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.74rem', color: '#34D399', fontWeight: '800' }}>COMPLETED</span>
              <p style={{ fontSize: '1.3rem', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>{completedCount}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.74rem', color: '#60A5FA', fontWeight: '800' }}>IN PROGRESS</span>
              <p style={{ fontSize: '1.3rem', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>{inProgressCount}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.74rem', color: '#94A3B8', fontWeight: '800' }}>TO DO</span>
              <p style={{ fontSize: '1.3rem', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>{todoCount}</p>
            </div>
          </div>
        </div>

        {/* Progress Bar Track */}
        <div style={{ width: '100%', height: '14px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{
            width: `${projectProgress}%`,
            height: '100%',
            background: projectProgress === 100
              ? 'linear-gradient(90deg, #10B981, #059669)'
              : 'linear-gradient(90deg, #4E3EFF 0%, #7B52F8 60%, #34D399 100%)',
            borderRadius: '10px',
            transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
          }} />
        </div>
      </div>

      {/* Milestones Cards Grid (Dark Matte) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
        {activeProject?.milestones.map((m) => {
          const isDone = m.status === 'Completed';
          const isInProg = m.status === 'In Progress';

          return (
            <div
              key={m.id}
              style={{
                background: '#14151F',
                borderRadius: '20px',
                padding: '22px 24px',
                boxShadow: '0 6px 25px rgba(0, 0, 0, 0.35)',
                border: isDone ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: '800',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: isDone ? 'rgba(52, 211, 153, 0.15)' : (isInProg ? 'rgba(96, 165, 250, 0.15)' : 'rgba(255, 255, 255, 0.06)'),
                    color: isDone ? '#34D399' : (isInProg ? '#60A5FA' : '#94A3B8'),
                    border: isDone ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)'
                  }}>
                    {m.status}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      onClick={() => {
                        const newPct = isDone ? 0 : 100;
                        handleUpdateMilestone(activeProject.id, m.id, {
                          progress: newPct,
                          status: newPct === 100 ? 'Completed' : 'To Do'
                        });
                      }}
                      title={isDone ? 'Mark Incomplete' : 'Mark 100% Completed'}
                      style={{
                        background: isDone ? '#10B981' : 'rgba(52, 211, 153, 0.15)',
                        color: isDone ? '#FFFFFF' : '#34D399',
                        border: '1px solid rgba(52, 211, 153, 0.4)',
                        borderRadius: '8px',
                        padding: '4px 8px',
                        fontSize: '0.74rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Check style={{ width: '13px', height: '13px' }} />
                      <span>{isDone ? 'Done' : 'Mark Done'}</span>
                    </button>
                    <button
                      onClick={() => handleDeleteMilestone(activeProject.id, m.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#64748B',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '6px'
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
                      onMouseLeave={e => e.currentTarget.style.color = '#64748B'}
                    >
                      <Trash2 style={{ width: '14px', height: '14px' }} />
                    </button>
                  </div>
                </div>

                <h4 style={{ fontSize: '1.02rem', fontWeight: '800', color: '#F8FAFC', margin: '0 0 10px 0', lineHeight: 1.35 }}>
                  {m.title}
                </h4>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.78rem', color: '#94A3B8', marginBottom: '16px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <User style={{ width: '13px', height: '13px', color: '#818CF8' }} />
                    <span>{m.assignee}</span>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Calendar style={{ width: '13px', height: '13px', color: '#38BDF8' }} />
                    <span>{m.dueDate}</span>
                  </span>
                </div>
              </div>

              {/* Progress Slider & Number */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '0.78rem', fontWeight: '700' }}>
                  <span style={{ color: '#94A3B8' }}>Progress Completion</span>
                  <span style={{ color: isDone ? '#34D399' : '#818CF8' }}>{m.progress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={m.progress}
                  onChange={(e) => handleUpdateMilestone(activeProject.id, m.id, { progress: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    accentColor: '#4E3EFF',
                    cursor: 'pointer'
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Milestone Modal */}
      {showAddMilestoneModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: '#111218',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '480px',
            padding: '30px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.12)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(78, 62, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818CF8' }}>
                  <Plus style={{ width: '20px', height: '20px' }} />
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>Add Deliverable Milestone</h3>
              </div>
              <button onClick={() => setShowAddMilestoneModal(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <form onSubmit={handleAddMilestoneSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#CBD5E1', marginBottom: '6px' }}>
                  Milestone Task Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Stripe Payment Gateway Integration"
                  value={newMilestone.title}
                  onChange={e => setNewMilestone(prev => ({ ...prev, title: e.target.value }))}
                  required
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    background: '#161822',
                    color: '#F8FAFC',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#CBD5E1', marginBottom: '6px' }}>
                    Assignee Developer
                  </label>
                  <input
                    type="text"
                    value={newMilestone.assignee}
                    onChange={e => setNewMilestone(prev => ({ ...prev, assignee: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      background: '#161822',
                      color: '#F8FAFC',
                      fontSize: '0.85rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#CBD5E1', marginBottom: '6px' }}>
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newMilestone.dueDate}
                    onChange={e => setNewMilestone(prev => ({ ...prev, dueDate: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      background: '#161822',
                      color: '#F8FAFC',
                      fontSize: '0.85rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#CBD5E1', marginBottom: '6px' }}>
                  Initial Progress: {newMilestone.progress}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={newMilestone.progress}
                  onChange={e => setNewMilestone(prev => ({ ...prev, progress: Number(e.target.value) }))}
                  style={{ width: '100%', accentColor: '#4E3EFF' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddMilestoneModal(false)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    color: '#94A3B8',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    borderRadius: '12px',
                    background: '#4E3EFF',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(78, 62, 255, 0.4)'
                  }}
                >
                  Save Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Project Modal */}
      {showNewProjectModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: '#111218',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '480px',
            padding: '30px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.12)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(78, 62, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818CF8' }}>
                  <Layers style={{ width: '20px', height: '20px' }} />
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>Create Development Project</h3>
              </div>
              <button onClick={() => setShowNewProjectModal(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <form onSubmit={handleCreateProjectSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#CBD5E1', marginBottom: '6px' }}>
                  Project Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Edulateral LMS Platform"
                  value={newProject.projectName}
                  onChange={e => setNewProject(prev => ({ ...prev, projectName: e.target.value }))}
                  required
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    background: '#161822',
                    color: '#F8FAFC',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#CBD5E1', marginBottom: '6px' }}>
                  Client Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Edulateral"
                  value={newProject.clientName}
                  onChange={e => setNewProject(prev => ({ ...prev, clientName: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    background: '#161822',
                    color: '#F8FAFC',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#CBD5E1', marginBottom: '6px' }}>
                    Lead Developer
                  </label>
                  <input
                    type="text"
                    value={newProject.assignedLead}
                    onChange={e => setNewProject(prev => ({ ...prev, assignedLead: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      background: '#161822',
                      color: '#F8FAFC',
                      fontSize: '0.85rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#CBD5E1', marginBottom: '6px' }}>
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={newProject.targetDate}
                    onChange={e => setNewProject(prev => ({ ...prev, targetDate: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      background: '#161822',
                      color: '#F8FAFC',
                      fontSize: '0.85rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(false)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    color: '#94A3B8',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    borderRadius: '12px',
                    background: '#4E3EFF',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(78, 62, 255, 0.4)'
                  }}
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DevelopmentDeliverablesTracker;
