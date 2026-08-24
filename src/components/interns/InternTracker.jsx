import React, { useState, useMemo } from 'react';
import { useCRM } from '../../context/CRMContext';
import {
  GraduationCap,
  Users,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Plus,
  Star,
  ExternalLink,
  GitPullRequest,
  BookOpen,
  AlertTriangle,
  FileCheck,
  Printer,
  ChevronRight,
  Download,
  Building,
  UserCheck,
  Sparkles,
  ArrowRight,
  X,
  Code,
  Briefcase
} from 'lucide-react';

const COHORTS = ['All', '2026', '2025', '2024'];
const STATUSES = ['All', 'Active', 'Completed'];

const InternTracker = () => {
  const {
    interns = [],
    addIntern,
    updateIntern,
    deleteIntern,
    addWeeklyProgressLog,
    addInternEvaluation,
    issueInternCertificate,
    currentUser,
    activeTenant
  } = useCRM();

  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'weekly_logs' | 'evaluations' | 'certificates'
  const [selectedCohort, setSelectedCohort] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInternId, setSelectedInternId] = useState(() => (interns[0]?.id || ''));

  // Modals
  const [showAddInternModal, setShowAddInternModal] = useState(false);
  const [showAddLogModal, setShowAddLogModal] = useState(false);
  const [showAddEvalModal, setShowAddEvalModal] = useState(false);
  const [certificatePreviewIntern, setCertificatePreviewIntern] = useState(null);

  // Forms
  const [newInternForm, setNewInternForm] = useState({
    name: '',
    email: '',
    phone: '',
    college: '',
    degree: 'B.Tech Computer Science',
    cohort: '2026',
    department: 'Full-Stack Web & AI Engineering',
    mentor: currentUser?.name || 'Sarah Jenkins',
    supervisorEmail: currentUser?.email || 'sarah.jenkins@apexglobal.io',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
    stipend: 25000,
    githubUsername: '',
    skills: 'React, Node.js, JavaScript, Python',
    projectAssigned: 'Sanna CRM Enterprise Integration'
  });

  const [newLogForm, setNewLogForm] = useState({
    weekNumber: 1,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    plannedTasks: '',
    completedTasks: '',
    learnings: '',
    blockers: '',
    prLinks: '',
    mentorFeedback: '',
    rating: 5
  });

  const [newEvalForm, setNewEvalForm] = useState({
    codeQuality: 5,
    velocity: 5,
    communication: 5,
    initiative: 5,
    remarks: '',
    recommendation: 'Recommend for Full-Time Pre-Placement Offer (PPO)'
  });

  // Filtered Interns
  const filteredInterns = useMemo(() => {
    return interns.filter(intern => {
      const matchCohort = selectedCohort === 'All' || intern.cohort === selectedCohort;
      const matchStatus = selectedStatus === 'All' || intern.status === selectedStatus;
      const q = searchQuery.toLowerCase();
      const matchSearch = !q ||
        intern.name?.toLowerCase().includes(q) ||
        intern.college?.toLowerCase().includes(q) ||
        intern.mentor?.toLowerCase().includes(q) ||
        intern.department?.toLowerCase().includes(q) ||
        intern.skills?.some(s => s.toLowerCase().includes(q));
      return matchCohort && matchStatus && matchSearch;
    });
  }, [interns, selectedCohort, selectedStatus, searchQuery]);

  const activeIntern = useMemo(() => {
    return interns.find(i => i.id === selectedInternId) || filteredInterns[0] || interns[0];
  }, [interns, selectedInternId, filteredInterns]);

  // Summary Metrics
  const totalCount = interns.length;
  const activeCount = interns.filter(i => i.status === 'Active').length;
  const completedCount = interns.filter(i => i.status === 'Completed').length;
  const totalLogsCount = interns.reduce((sum, i) => sum + (i.weeklyLogs?.length || 0), 0);
  const avgScore = totalCount > 0
    ? (interns.reduce((sum, i) => sum + (i.overallScore || 5), 0) / totalCount).toFixed(1)
    : '5.0';

  const handleCreateIntern = (e) => {
    e.preventDefault();
    const skillsArray = newInternForm.skills.split(',').map(s => s.trim()).filter(Boolean);
    addIntern({
      ...newInternForm,
      stipend: parseFloat(newInternForm.stipend) || 0,
      skills: skillsArray
    });
    setShowAddInternModal(false);
    setNewInternForm({
      name: '', email: '', phone: '', college: '', degree: 'B.Tech Computer Science',
      cohort: '2026', department: 'Full-Stack Web & AI Engineering',
      mentor: currentUser?.name || 'Sarah Jenkins', supervisorEmail: currentUser?.email || 'sarah.jenkins@apexglobal.io',
      startDate: new Date().toISOString().split('T')[0], endDate: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
      stipend: 25000, githubUsername: '', skills: 'React, Node.js, JavaScript, Python',
      projectAssigned: 'Sanna CRM Enterprise Integration'
    });
  };

  const handleCreateWeeklyLog = (e) => {
    e.preventDefault();
    if (!activeIntern) return;
    addWeeklyProgressLog(activeIntern.id, {
      ...newLogForm,
      weekNumber: parseInt(newLogForm.weekNumber, 10) || 1,
      rating: parseFloat(newLogForm.rating) || 5
    });
    setShowAddLogModal(false);
    setNewLogForm({
      weekNumber: (activeIntern.weeklyLogs?.length || 0) + 2,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      plannedTasks: '',
      completedTasks: '',
      learnings: '',
      blockers: '',
      prLinks: '',
      mentorFeedback: '',
      rating: 5
    });
  };

  const handleCreateEvaluation = (e) => {
    e.preventDefault();
    if (!activeIntern) return;
    const { codeQuality, velocity, communication, initiative, remarks, recommendation } = newEvalForm;
    const compositeScore = ((parseFloat(codeQuality) + parseFloat(velocity) + parseFloat(communication) + parseFloat(initiative)) / 4).toFixed(1);
    addInternEvaluation(activeIntern.id, {
      codeQuality: parseFloat(codeQuality),
      velocity: parseFloat(velocity),
      communication: parseFloat(communication),
      initiative: parseFloat(initiative),
      compositeScore: parseFloat(compositeScore),
      remarks,
      recommendation
    });
    setShowAddEvalModal(false);
  };

  const handleIssueCertificate = (intern) => {
    issueInternCertificate(intern.id, {
      grade: intern.overallScore >= 4.5 ? 'Distinction (Grade A+)' : 'Honors (Grade A)',
      authorizedSignatory: `${currentUser?.name || 'Sarah Jenkins'}, ${currentUser?.designation || 'Director of Engineering'}`
    });
    setCertificatePreviewIntern({
      ...intern,
      status: 'Completed',
      certificateIssued: {
        issued: true,
        certId: `ASTRA-CERT-2026-${Math.floor(100 + Math.random() * 900)}`,
        issueDate: new Date().toISOString().split('T')[0],
        grade: intern.overallScore >= 4.5 ? 'Distinction (Grade A+)' : 'Honors (Grade A)',
        authorizedSignatory: `${currentUser?.name || 'Sarah Jenkins'}, ${currentUser?.designation || 'Director of Engineering'}`
      }
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      
      {/* Top Header & Action Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <GraduationCap style={{ width: '24px', height: '24px', color: '#818cf8' }} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Internship Progress & Mentorship Tracker
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Afkanerd-style Cohort Directory, Weekly Progress Logs, Mentor 5-Star Reviews & Certificate Engine
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setShowAddInternModal(true)}
            className="btn gradient-btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '0.85rem' }}
          >
            <Plus style={{ width: '16px', height: '16px' }} />
            <span>Enroll New Intern</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px'
      }}>
        <div className="glass-card" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users style={{ width: '20px', height: '20px', color: '#818cf8' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Total Enrolled</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)' }}>{totalCount} Interns</div>
            <div style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: '600' }}>{activeCount} Active · {completedCount} Graduated</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(234, 179, 8, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Star style={{ width: '20px', height: '20px', color: '#facc15' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Average Rating</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)' }}>{avgScore} / 5.0</div>
            <div style={{ fontSize: '0.7rem', color: '#818cf8', fontWeight: '600' }}>Multi-Metric 5-Star Reviews</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen style={{ width: '20px', height: '20px', color: '#34d399' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Weekly Logs Filed</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)' }}>{totalLogsCount} Logs</div>
            <div style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: '600' }}>100% On-Track Deliverables</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(236, 72, 153, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Award style={{ width: '20px', height: '20px', color: '#f472b6' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Certificates Issued</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)' }}>
              {interns.filter(i => i.certificateIssued?.issued).length} Verified
            </div>
            <div style={{ fontSize: '0.7rem', color: '#f472b6', fontWeight: '600' }}>Official Verification Seal</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs & Search/Filter Controls */}
      <div className="glass-card" style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'directory', label: 'Intern Directory & Profiles', icon: Users },
            { id: 'weekly_logs', label: 'Week-by-Week Progress Logs', icon: BookOpen },
            { id: 'evaluations', label: 'Mentor 5-Star Reviews', icon: Star },
            { id: 'certificates', label: 'Completion Certificates', icon: Award }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  background: active ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(168, 85, 247, 0.15) 100%)' : 'transparent',
                  border: active ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
                  color: active ? '#818cf8' : 'var(--text-secondary)',
                  fontWeight: active ? '700' : '500',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon style={{ width: '15px', height: '15px' }} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Cohort Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>Cohort:</span>
            <select
              value={selectedCohort}
              onChange={(e) => setSelectedCohort(e.target.value)}
              className="form-input"
              style={{ width: '100px', padding: '6px 10px', fontSize: '0.78rem' }}
            >
              {COHORTS.map(c => <option key={c} value={c}>{c === 'All' ? 'All Batches' : `${c} Batch`}</option>)}
            </select>
          </div>

          {/* Status Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="form-input"
              style={{ width: '100px', padding: '6px 10px', fontSize: '0.78rem' }}
            >
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Search Input */}
          <div style={{ position: 'relative', width: '220px' }}>
            <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by name, college, skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '32px', fontSize: '0.78rem', width: '100%' }}
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: INTERN DIRECTORY & PROFILES                                       */}
      {/* ========================================================================= */}
      {activeTab === 'directory' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '20px'
        }}>
          {filteredInterns.map(intern => {
            const isCertIssued = intern.certificateIssued?.issued;
            const completedLogsCount = intern.weeklyLogs?.length || 0;
            return (
              <div
                key={intern.id}
                className="glass-card"
                style={{
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  border: selectedInternId === intern.id ? '1px solid #6366f1' : '1px solid var(--border-color)',
                  position: 'relative'
                }}
              >
                {/* Cohort & Status Badges */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: 'rgba(99, 102, 241, 0.15)',
                      color: '#818cf8',
                      fontSize: '0.7rem',
                      fontWeight: '700',
                      border: '1px solid rgba(99, 102, 241, 0.3)'
                    }}>
                      Batch {intern.cohort}
                    </span>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: intern.status === 'Active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                      color: intern.status === 'Active' ? '#34d399' : '#facc15',
                      fontSize: '0.7rem',
                      fontWeight: '700',
                      border: `1px solid ${intern.status === 'Active' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(234, 179, 8, 0.3)'}`
                    }}>
                      {intern.status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#facc15', fontSize: '0.82rem', fontWeight: '700' }}>
                    <Star style={{ width: '14px', height: '14px', fill: '#facc15' }} />
                    <span>{intern.overallScore || 5.0}</span>
                  </div>
                </div>

                {/* Candidate Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <img
                    src={intern.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"}
                    alt={intern.name}
                    style={{ width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #6366f1' }}
                  />
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                      {intern.name}
                    </h3>
                    <div style={{ fontSize: '0.75rem', color: '#a5b4fc', fontWeight: '600', marginTop: '2px' }}>
                      {intern.department}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {intern.college}
                    </div>
                  </div>
                </div>

                {/* Key Details Grid */}
                <div style={{
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  fontSize: '0.75rem'
                }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Mentor: </span>
                    <strong style={{ color: 'var(--text-primary)' }}>{intern.mentor}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Stipend: </span>
                    <strong style={{ color: '#34d399' }}>₹{(intern.stipend || 25000).toLocaleString('en-IN')}/mo</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Timeline: </span>
                    <strong style={{ color: 'var(--text-primary)' }}>{intern.startDate} to {intern.endDate}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Logs Filed: </span>
                    <strong style={{ color: '#818cf8' }}>{completedLogsCount} Weeks</strong>
                  </div>
                </div>

                {/* Assigned Project */}
                {intern.projectAssigned && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Project: </span>
                    <span style={{ fontWeight: '600', color: '#e0e7ff' }}>{intern.projectAssigned}</span>
                  </div>
                )}

                {/* Skills Tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {(intern.skills || []).map((skill, sIdx) => (
                    <span
                      key={sIdx}
                      style={{
                        fontSize: '0.68rem',
                        padding: '2px 7px',
                        borderRadius: '4px',
                        background: 'rgba(255,255,255,0.05)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
                  <button
                    onClick={() => {
                      setSelectedInternId(intern.id);
                      setActiveTab('weekly_logs');
                    }}
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '7px', fontSize: '0.75rem', justifyContent: 'center' }}
                  >
                    <BookOpen style={{ width: '13px', height: '13px' }} />
                    <span>Weekly Logs ({completedLogsCount})</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedInternId(intern.id);
                      setActiveTab('evaluations');
                    }}
                    className="btn btn-secondary"
                    style={{ padding: '7px 12px', fontSize: '0.75rem', justifyContent: 'center' }}
                    title="Mentor Evaluation"
                  >
                    <Star style={{ width: '13px', height: '13px', color: '#facc15' }} />
                  </button>

                  <button
                    onClick={() => {
                      if (isCertIssued) {
                        setCertificatePreviewIntern(intern);
                      } else {
                        handleIssueCertificate(intern);
                      }
                    }}
                    className="btn gradient-btn-primary"
                    style={{ padding: '7px 12px', fontSize: '0.75rem', justifyContent: 'center' }}
                    title={isCertIssued ? 'View Certificate' : 'Issue & View Certificate'}
                  >
                    <Award style={{ width: '13px', height: '13px' }} />
                    <span>{isCertIssued ? 'Certificate' : 'Issue Cert'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: WEEK-BY-WEEK PROGRESS LOGS (Afkanerd Structure)                   */}
      {/* ========================================================================= */}
      {activeTab === 'weekly_logs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Intern Selector Toolbar */}
          <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)' }}>Select Intern:</span>
              <select
                value={activeIntern?.id || ''}
                onChange={(e) => setSelectedInternId(e.target.value)}
                className="form-input"
                style={{ width: '260px', padding: '8px 12px', fontSize: '0.85rem', fontWeight: '700' }}
              >
                {interns.map(i => (
                  <option key={i.id} value={i.id}>
                    {i.name} ({i.cohort} Batch - {i.department})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => {
                  setNewLogForm(prev => ({
                    ...prev,
                    weekNumber: (activeIntern?.weeklyLogs?.length || 0) + 1
                  }));
                  setShowAddLogModal(true);
                }}
                className="btn gradient-btn-primary"
                style={{ padding: '8px 16px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus style={{ width: '14px', height: '14px' }} />
                <span>Submit Week {(activeIntern?.weeklyLogs?.length || 0) + 1} Progress Report</span>
              </button>
            </div>
          </div>

          {/* Active Intern Banner */}
          {activeIntern && (
            <div className="glass-card" style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', borderLeft: '4px solid #6366f1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <img
                  src={activeIntern.avatar}
                  alt={activeIntern.name}
                  style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid #6366f1', objectFit: 'cover' }}
                />
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                    {activeIntern.name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {activeIntern.college} · Assigned to: <strong style={{ color: '#818cf8' }}>{activeIntern.projectAssigned}</strong>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Mentor / Supervisor</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)' }}>{activeIntern.mentor}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>GitHub Handle</div>
                  <a
                    href={`https://github.com/${activeIntern.githubUsername || 'astracrm'}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '0.85rem', fontWeight: '700', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                  >
                    <span>@{activeIntern.githubUsername || 'aarav-dev'}</span>
                    <ExternalLink style={{ width: '12px', height: '12px' }} />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Timeline of Weekly Logs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {(!activeIntern?.weeklyLogs || activeIntern.weeklyLogs.length === 0) ? (
              <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <BookOpen style={{ width: '40px', height: '40px', margin: '0 auto 12px auto', opacity: 0.5 }} />
                <p style={{ fontSize: '0.9rem', margin: 0 }}>No weekly progress reports logged yet for this intern.</p>
                <button
                  onClick={() => setShowAddLogModal(true)}
                  className="btn gradient-btn-primary"
                  style={{ marginTop: '14px', padding: '8px 16px', fontSize: '0.8rem' }}
                >
                  Create First Week Report
                </button>
              </div>
            ) : (
              activeIntern.weeklyLogs.map((log, idx) => (
                <div
                  key={idx}
                  className="glass-card"
                  style={{
                    padding: '22px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    position: 'relative'
                  }}
                >
                  {/* Week Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                        color: '#fff',
                        fontWeight: '800',
                        fontSize: '0.85rem'
                      }}>
                        Week {log.weekNumber}
                      </div>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        ({log.startDate} to {log.endDate})
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: '#34d399',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        border: '1px solid rgba(16, 185, 129, 0.3)'
                      }}>
                        {log.status || 'Reviewed & Approved'}
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#facc15', fontSize: '0.82rem', fontWeight: '700' }}>
                        <Star style={{ width: '14px', height: '14px', fill: '#facc15' }} />
                        <span>{log.rating || 5}/5</span>
                      </div>
                    </div>
                  </div>

                  {/* Two-Column Grid: Planned vs Completed */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#93c5fd', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock style={{ width: '14px', height: '14px' }} />
                        <span>Planned Tasks / Goals</span>
                      </div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                        {log.plannedTasks}
                      </p>
                    </div>

                    <div style={{ background: 'rgba(16, 185, 129, 0.04)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#34d399', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle2 style={{ width: '14px', height: '14px' }} />
                        <span>Completed Deliverables</span>
                      </div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>
                        {log.completedTasks}
                      </p>
                    </div>
                  </div>

                  {/* Learnings & Blockers */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#c084fc', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Sparkles style={{ width: '13px', height: '13px' }} />
                        <span>Key Learnings & Skills Mastered</span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                        {log.learnings || 'Mastered component composition and reactive state architecture.'}
                      </p>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#fbbf24', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <AlertTriangle style={{ width: '13px', height: '13px' }} />
                        <span>Blockers / Challenges Faced</span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                        {log.blockers || 'None. All milestones delivered on schedule.'}
                      </p>
                    </div>
                  </div>

                  {/* PR / Commit Links & Mentor Feedback */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                    background: 'rgba(99, 102, 241, 0.05)',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(99, 102, 241, 0.2)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <GitPullRequest style={{ width: '14px', height: '14px', color: '#818cf8' }} />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pull Request / Code Link:</span>
                      {log.prLinks ? (
                        <a
                          href={log.prLinks}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: '0.78rem', color: '#60a5fa', fontWeight: '600', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <span>{log.prLinks}</span>
                          <ExternalLink style={{ width: '12px', height: '12px' }} />
                        </a>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Internal Commits Attached</span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      <strong style={{ color: '#a5b4fc' }}>Mentor Feedback: </strong>
                      <span>{log.mentorFeedback || 'Solid progress and clean commits.'}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: MENTOR 5-STAR EVALUATION MATRIX                                    */}
      {/* ========================================================================= */}
      {activeTab === 'evaluations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)' }}>Select Intern:</span>
              <select
                value={activeIntern?.id || ''}
                onChange={(e) => setSelectedInternId(e.target.value)}
                className="form-input"
                style={{ width: '260px', padding: '8px 12px', fontSize: '0.85rem', fontWeight: '700' }}
              >
                {interns.map(i => (
                  <option key={i.id} value={i.id}>
                    {i.name} ({i.cohort} Batch)
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowAddEvalModal(true)}
              className="btn gradient-btn-primary"
              style={{ padding: '8px 16px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus style={{ width: '14px', height: '14px' }} />
              <span>Record Performance Evaluation</span>
            </button>
          </div>

          {/* Evaluations List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {(!activeIntern?.evaluations || activeIntern.evaluations.length === 0) ? (
              <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Star style={{ width: '40px', height: '40px', margin: '0 auto 12px auto', opacity: 0.5 }} />
                <p style={{ fontSize: '0.9rem', margin: 0 }}>No mentor evaluations submitted yet for this intern.</p>
                <button
                  onClick={() => setShowAddEvalModal(true)}
                  className="btn gradient-btn-primary"
                  style={{ marginTop: '14px', padding: '8px 16px', fontSize: '0.8rem' }}
                >
                  Submit First Evaluation
                </button>
              </div>
            ) : (
              activeIntern.evaluations.map((ev, idx) => (
                <div key={idx} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                        Evaluation Review by {ev.evaluator || 'Sarah Jenkins'}
                      </h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Date of Review: {ev.reviewDate}
                      </span>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 14px',
                      background: 'rgba(234, 179, 8, 0.15)',
                      borderRadius: '8px',
                      border: '1px solid rgba(234, 179, 8, 0.3)'
                    }}>
                      <Star style={{ width: '16px', height: '16px', color: '#facc15', fill: '#facc15' }} />
                      <span style={{ fontSize: '1.1rem', fontWeight: '800', color: '#facc15' }}>
                        {ev.compositeScore || 5.0} / 5.0
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Overall</span>
                    </div>
                  </div>

                  {/* 4 Pillars Scoring Matrix */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '12px'
                  }}>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Code & Architecture</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} style={{ width: '14px', height: '14px', color: i < (ev.codeQuality || 5) ? '#facc15' : 'rgba(255,255,255,0.2)', fill: i < (ev.codeQuality || 5) ? '#facc15' : 'none' }} />
                        ))}
                        <span style={{ fontSize: '0.8rem', fontWeight: '700', marginLeft: '6px', color: 'var(--text-primary)' }}>{ev.codeQuality || 5}/5</span>
                      </div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Execution & Velocity</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} style={{ width: '14px', height: '14px', color: i < (ev.velocity || 5) ? '#facc15' : 'rgba(255,255,255,0.2)', fill: i < (ev.velocity || 5) ? '#facc15' : 'none' }} />
                        ))}
                        <span style={{ fontSize: '0.8rem', fontWeight: '700', marginLeft: '6px', color: 'var(--text-primary)' }}>{ev.velocity || 5}/5</span>
                      </div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Communication</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} style={{ width: '14px', height: '14px', color: i < (ev.communication || 5) ? '#facc15' : 'rgba(255,255,255,0.2)', fill: i < (ev.communication || 5) ? '#facc15' : 'none' }} />
                        ))}
                        <span style={{ fontSize: '0.8rem', fontWeight: '700', marginLeft: '6px', color: 'var(--text-primary)' }}>{ev.communication || 5}/5</span>
                      </div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Problem Solving & Initiative</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} style={{ width: '14px', height: '14px', color: i < (ev.initiative || 5) ? '#facc15' : 'rgba(255,255,255,0.2)', fill: i < (ev.initiative || 5) ? '#facc15' : 'none' }} />
                        ))}
                        <span style={{ fontSize: '0.8rem', fontWeight: '700', marginLeft: '6px', color: 'var(--text-primary)' }}>{ev.initiative || 5}/5</span>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Comments */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Mentor Feedback & Summary
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>
                      "{ev.remarks}"
                    </p>
                  </div>

                  {/* Recommendation Banner */}
                  {ev.recommendation && (
                    <div style={{
                      padding: '10px 14px',
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <CheckCircle2 style={{ width: '16px', height: '16px', color: '#34d399' }} />
                      <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#34d399' }}>
                        Recommendation: {ev.recommendation}
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: COMPLETION CERTIFICATES                                            */}
      {/* ========================================================================= */}
      {activeTab === 'certificates' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
          {interns.map(intern => {
            const isIssued = intern.certificateIssued?.issued;
            return (
              <div key={intern.id} className="glass-card" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
                    Batch {intern.cohort}
                  </div>
                  <span style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: isIssued ? 'rgba(16, 185, 129, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                    color: isIssued ? '#34d399' : '#facc15',
                    fontSize: '0.7rem',
                    fontWeight: '700',
                    border: `1px solid ${isIssued ? 'rgba(16, 185, 129, 0.3)' : 'rgba(234, 179, 8, 0.3)'}`
                  }}>
                    {isIssued ? 'Verified & Issued' : 'Eligible for Issuance'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img
                    src={intern.avatar}
                    alt={intern.name}
                    style={{ width: '46px', height: '46px', borderRadius: '50%', border: '2px solid #6366f1', objectFit: 'cover' }}
                  />
                  <div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                      {intern.name}
                    </h4>
                    <div style={{ fontSize: '0.75rem', color: '#a5b4fc' }}>{intern.department}</div>
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: '8px', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div><span style={{ color: 'var(--text-muted)' }}>Certificate ID: </span><strong style={{ color: '#818cf8' }}>{intern.certificateIssued?.certId || `ASTRA-CERT-${intern.cohort}-PENDING`}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Grade / Honors: </span><strong style={{ color: '#34d399' }}>{intern.certificateIssued?.grade || 'Distinction (Grade A+)'}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Duration: </span><strong style={{ color: 'var(--text-primary)' }}>{intern.startDate} to {intern.endDate}</strong></div>
                </div>

                <button
                  onClick={() => {
                    if (isIssued) {
                      setCertificatePreviewIntern(intern);
                    } else {
                      handleIssueCertificate(intern);
                    }
                  }}
                  className="btn gradient-btn-primary"
                  style={{ width: '100%', padding: '10px', fontSize: '0.82rem', justifyContent: 'center', marginTop: 'auto' }}
                >
                  <Award style={{ width: '14px', height: '14px' }} />
                  <span>{isIssued ? 'View & Print Certificate' : 'Issue & View Certificate'}</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ENROLL NEW INTERN                                                 */}
      {/* ========================================================================= */}
      {showAddInternModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <GraduationCap style={{ width: '22px', height: '22px', color: '#818cf8' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                  Enroll New Intern
                </h3>
              </div>
              <button onClick={() => setShowAddInternModal(false)} className="btn btn-secondary" style={{ padding: '6px 8px' }}>
                <X style={{ width: '16px', height: '16px' }} />
              </button>
            </div>

            <form onSubmit={handleCreateIntern} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newInternForm.name}
                    onChange={(e) => setNewInternForm({ ...newInternForm, name: e.target.value })}
                    placeholder="e.g. Siddharth Rao"
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={newInternForm.email}
                    onChange={(e) => setNewInternForm({ ...newInternForm, email: e.target.value })}
                    placeholder="siddharth@intern.apex.io"
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">College / University *</label>
                  <input
                    type="text"
                    required
                    value={newInternForm.college}
                    onChange={(e) => setNewInternForm({ ...newInternForm, college: e.target.value })}
                    placeholder="e.g. IIT Bombay / BITS Pilani"
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">Cohort Batch *</label>
                  <select
                    value={newInternForm.cohort}
                    onChange={(e) => setNewInternForm({ ...newInternForm, cohort: e.target.value })}
                    className="form-input"
                  >
                    <option value="2026">2026 Batch</option>
                    <option value="2025">2025 Batch</option>
                    <option value="2024">2024 Batch</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Department / Domain *</label>
                  <input
                    type="text"
                    required
                    value={newInternForm.department}
                    onChange={(e) => setNewInternForm({ ...newInternForm, department: e.target.value })}
                    placeholder="Full-Stack / AI / Backend"
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">Assigned Mentor *</label>
                  <input
                    type="text"
                    required
                    value={newInternForm.mentor}
                    onChange={(e) => setNewInternForm({ ...newInternForm, mentor: e.target.value })}
                    placeholder="Sarah Jenkins / Marcus Vance"
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Monthly Stipend (₹)</label>
                  <input
                    type="number"
                    value={newInternForm.stipend}
                    onChange={(e) => setNewInternForm({ ...newInternForm, stipend: e.target.value })}
                    placeholder="25000"
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">GitHub Username</label>
                  <input
                    type="text"
                    value={newInternForm.githubUsername}
                    onChange={(e) => setNewInternForm({ ...newInternForm, githubUsername: e.target.value })}
                    placeholder="siddharth-dev"
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    value={newInternForm.startDate}
                    onChange={(e) => setNewInternForm({ ...newInternForm, startDate: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">End Date</label>
                  <input
                    type="date"
                    value={newInternForm.endDate}
                    onChange={(e) => setNewInternForm({ ...newInternForm, endDate: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Assigned Project / Module</label>
                <input
                  type="text"
                  value={newInternForm.projectAssigned}
                  onChange={(e) => setNewInternForm({ ...newInternForm, projectAssigned: e.target.value })}
                  placeholder="e.g. Sanna CRM MIS Deliverables & Analytics Module"
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Core Skills (comma separated)</label>
                <input
                  type="text"
                  value={newInternForm.skills}
                  onChange={(e) => setNewInternForm({ ...newInternForm, skills: e.target.value })}
                  placeholder="React, Node.js, SQLite, Tailwind"
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddInternModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn gradient-btn-primary">
                  Enroll Intern & Create Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SUBMIT WEEKLY PROGRESS LOG                                         */}
      {/* ========================================================================= */}
      {showAddLogModal && activeIntern && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                  Submit Weekly Progress Log
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#818cf8' }}>
                  Candidate: {activeIntern.name} · Batch {activeIntern.cohort}
                </span>
              </div>
              <button onClick={() => setShowAddLogModal(false)} className="btn btn-secondary" style={{ padding: '6px 8px' }}>
                <X style={{ width: '16px', height: '16px' }} />
              </button>
            </div>

            <form onSubmit={handleCreateWeeklyLog} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="form-label">Week Number *</label>
                  <input
                    type="number"
                    min="1"
                    max="52"
                    required
                    value={newLogForm.weekNumber}
                    onChange={(e) => setNewLogForm({ ...newLogForm, weekNumber: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={newLogForm.startDate}
                    onChange={(e) => setNewLogForm({ ...newLogForm, startDate: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">End Date *</label>
                  <input
                    type="date"
                    required
                    value={newLogForm.endDate}
                    onChange={(e) => setNewLogForm({ ...newLogForm, endDate: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Planned Goals / Tasks for the Week *</label>
                <textarea
                  required
                  rows={2}
                  value={newLogForm.plannedTasks}
                  onChange={(e) => setNewLogForm({ ...newLogForm, plannedTasks: e.target.value })}
                  placeholder="Outline sprint tasks, architecture tickets, and feature targets..."
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Completed Deliverables & Output *</label>
                <textarea
                  required
                  rows={3}
                  value={newLogForm.completedTasks}
                  onChange={(e) => setNewLogForm({ ...newLogForm, completedTasks: e.target.value })}
                  placeholder="Describe code changes, features merged, UI components created, and tests passed..."
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Key Learnings & Skills Mastered</label>
                  <textarea
                    rows={2}
                    value={newLogForm.learnings}
                    onChange={(e) => setNewLogForm({ ...newLogForm, learnings: e.target.value })}
                    placeholder="New libraries, architectural concepts, or tools understood..."
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">Blockers / Technical Obstacles</label>
                  <textarea
                    rows={2}
                    value={newLogForm.blockers}
                    onChange={(e) => setNewLogForm({ ...newLogForm, blockers: e.target.value })}
                    placeholder="Any dependencies or blocking issues..."
                    className="form-input"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Pull Request (PR) or Commit Link</label>
                <input
                  type="url"
                  value={newLogForm.prLinks}
                  onChange={(e) => setNewLogForm({ ...newLogForm, prLinks: e.target.value })}
                  placeholder="https://github.com/astracrm/core/pull/124"
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Mentor Supervisor Remarks</label>
                  <input
                    type="text"
                    value={newLogForm.mentorFeedback}
                    onChange={(e) => setNewLogForm({ ...newLogForm, mentorFeedback: e.target.value })}
                    placeholder="Excellent velocity and clean code..."
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">Week Score (1-5)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={newLogForm.rating}
                    onChange={(e) => setNewLogForm({ ...newLogForm, rating: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddLogModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn gradient-btn-primary">
                  Save Weekly Progress Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SUBMIT MENTOR EVALUATION                                           */}
      {/* ========================================================================= */}
      {showAddEvalModal && activeIntern && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '560px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                  Record Mentor Performance Evaluation
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#818cf8' }}>
                  Candidate: {activeIntern.name}
                </span>
              </div>
              <button onClick={() => setShowAddEvalModal(false)} className="btn btn-secondary" style={{ padding: '6px 8px' }}>
                <X style={{ width: '16px', height: '16px' }} />
              </button>
            </div>

            <form onSubmit={handleCreateEvaluation} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Code Quality & Architecture (1-5)</label>
                  <select
                    value={newEvalForm.codeQuality}
                    onChange={(e) => setNewEvalForm({ ...newEvalForm, codeQuality: e.target.value })}
                    className="form-input"
                  >
                    <option value="5">5 - Outstanding (Clean, zero lint errors)</option>
                    <option value="4">4 - Strong (Solid code practices)</option>
                    <option value="3">3 - Competent (Minor revisions needed)</option>
                    <option value="2">2 - Developing</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Delivery Velocity & Output (1-5)</label>
                  <select
                    value={newEvalForm.velocity}
                    onChange={(e) => setNewEvalForm({ ...newEvalForm, velocity: e.target.value })}
                    className="form-input"
                  >
                    <option value="5">5 - Exceeds milestone expectations</option>
                    <option value="4">4 - On schedule consistently</option>
                    <option value="3">3 - Meets base targets</option>
                    <option value="2">2 - Occasional delays</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Communication & Collaboration (1-5)</label>
                  <select
                    value={newEvalForm.communication}
                    onChange={(e) => setNewEvalForm({ ...newEvalForm, communication: e.target.value })}
                    className="form-input"
                  >
                    <option value="5">5 - Proactive, articulates blockers</option>
                    <option value="4">4 - Clear and responsive</option>
                    <option value="3">3 - Standard communication</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Problem Solving & Initiative (1-5)</label>
                  <select
                    value={newEvalForm.initiative}
                    onChange={(e) => setNewEvalForm({ ...newEvalForm, initiative: e.target.value })}
                    className="form-input"
                  >
                    <option value="5">5 - Independent & innovative solutions</option>
                    <option value="4">4 - High curiosity and quick learner</option>
                    <option value="3">3 - Follows guidelines well</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Comprehensive Evaluation Summary *</label>
                <textarea
                  required
                  rows={3}
                  value={newEvalForm.remarks}
                  onChange={(e) => setNewEvalForm({ ...newEvalForm, remarks: e.target.value })}
                  placeholder="Summarize candidate's technical contributions, key achievements, and areas of growth..."
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">PPO / Career Recommendation</label>
                <input
                  type="text"
                  value={newEvalForm.recommendation}
                  onChange={(e) => setNewEvalForm({ ...newEvalForm, recommendation: e.target.value })}
                  placeholder="Recommend for Full-Time Pre-Placement Offer (PPO)"
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddEvalModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn gradient-btn-primary">
                  Save Evaluation & Update Composite Score
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: OFFICIAL CERTIFICATE OF COMPLETION PREVIEW (Print/Download Ready)   */}
      {/* ========================================================================= */}
      {certificatePreviewIntern && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '820px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Award style={{ width: '22px', height: '22px', color: '#facc15' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                  Certificate of Internship Completion
                </h3>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => window.print()} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Printer style={{ width: '14px', height: '14px' }} />
                  <span>Print Certificate</span>
                </button>
                <button onClick={() => setCertificatePreviewIntern(null)} className="btn btn-secondary" style={{ padding: '6px 8px' }}>
                  <X style={{ width: '16px', height: '16px' }} />
                </button>
              </div>
            </div>

            {/* Official Certificate Visual Document */}
            <div id="intern-certificate-print" style={{
              background: '#0d1117',
              border: '8px double rgba(99, 102, 241, 0.4)',
              borderRadius: '16px',
              padding: '40px 48px',
              color: '#ffffff',
              fontFamily: 'Inter, sans-serif',
              position: 'relative',
              textAlign: 'center',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
            }}>
              {/* Corner Watermarks */}
              <div style={{ position: 'absolute', top: '16px', left: '20px', fontSize: '0.75rem', color: '#6366f1', fontWeight: '800', letterSpacing: '0.1em' }}>
                SANNA CRM ENTERPRISE
              </div>
              <div style={{ position: 'absolute', top: '16px', right: '20px', fontSize: '0.75rem', color: '#34d399', fontWeight: '700' }}>
                ID: {certificatePreviewIntern.certificateIssued?.certId || 'SANNA-CERT-2026-089'}
              </div>

              {/* Certificate Header */}
              <div style={{ margin: '20px 0 10px 0' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                  margin: '0 auto 16px auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)'
                }}>
                  <GraduationCap style={{ width: '32px', height: '32px', color: '#ffffff' }} />
                </div>

                <h1 style={{ fontSize: '1.8rem', fontWeight: '900', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#e0e7ff', margin: 0 }}>
                  Certificate of Internship Completion
                </h1>
                <p style={{ fontSize: '0.88rem', color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: '6px' }}>
                  Afkanerd Technologies & Sanna CRM Workforce Program
                </p>
              </div>

              <div style={{ margin: '24px 0', fontSize: '0.95rem', color: '#94a3b8' }}>
                This is proudly presented to
              </div>

              {/* Intern Name */}
              <div style={{
                fontSize: '2rem',
                fontWeight: '900',
                letterSpacing: '-0.02em',
                background: 'linear-gradient(135deg, #ffffff 0%, #818cf8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '8px'
              }}>
                {certificatePreviewIntern.name}
              </div>

              <div style={{ fontSize: '0.9rem', color: '#cbd5e1', fontWeight: '600' }}>
                from {certificatePreviewIntern.college}
              </div>

              {/* Certificate Body Paragraph */}
              <p style={{
                fontSize: '0.88rem',
                lineHeight: 1.7,
                color: '#94a3b8',
                maxWidth: '620px',
                margin: '20px auto 30px auto'
              }}>
                for outstanding and exemplary contribution during the engineering internship term from <strong style={{ color: '#ffffff' }}>{certificatePreviewIntern.startDate}</strong> to <strong style={{ color: '#ffffff' }}>{certificatePreviewIntern.endDate}</strong> in the domain of <strong style={{ color: '#818cf8' }}>{certificatePreviewIntern.department}</strong>. The candidate demonstrated exceptional code craft, architectural discipline, and problem-solving excellence.
              </p>

              {/* Performance Distinction Badge */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 20px',
                background: 'rgba(234, 179, 8, 0.12)',
                border: '1px solid rgba(234, 179, 8, 0.3)',
                borderRadius: '30px',
                color: '#facc15',
                fontWeight: '800',
                fontSize: '0.85rem',
                marginBottom: '36px'
              }}>
                <Star style={{ width: '16px', height: '16px', fill: '#facc15' }} />
                <span>Performance Rating: {certificatePreviewIntern.certificateIssued?.grade || 'Distinction (Grade A+)'}</span>
              </div>

              {/* Signatures Section */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                paddingTop: '20px',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                marginTop: '10px'
              }}>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#ffffff' }}>
                    {certificatePreviewIntern.certificateIssued?.issueDate || new Date().toISOString().split('T')[0]}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', marginTop: '2px' }}>
                    Date of Certification
                  </div>
                </div>

                {/* Digital Verification Stamp */}
                <div style={{
                  width: '74px',
                  height: '74px',
                  borderRadius: '50%',
                  border: '2px dashed #818cf8',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px'
                }}>
                  <Award style={{ width: '20px', height: '20px', color: '#818cf8' }} />
                  <span style={{ fontSize: '0.55rem', fontWeight: '900', color: '#818cf8', textTransform: 'uppercase', marginTop: '2px' }}>
                    VERIFIED
                  </span>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontFamily: 'serif',
                    fontSize: '1.2rem',
                    fontStyle: 'italic',
                    color: '#818cf8',
                    marginBottom: '4px'
                  }}>
                    {certificatePreviewIntern.mentor || 'Sarah Jenkins'}
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#ffffff' }}>
                    {certificatePreviewIntern.certificateIssued?.authorizedSignatory || 'Sarah Jenkins, VP Operations'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', marginTop: '2px' }}>
                    Authorized Signatory
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InternTracker;
