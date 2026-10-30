import React, { useState, useEffect } from 'react';
import { useCRM } from '../../context/CRMContext';
import {
  getCompanyHolidays,
  addCompanyHoliday,
  deleteCompanyHoliday,
  getNextUpcomingHoliday
} from '../../utils/companyHolidays';
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Sparkles,
  Plus,
  Trash2,
  Calendar,
  X,
  Building,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const CompanyHolidayWidget = () => {
  const { currentUser, theme } = useCRM();
  const [holidays, setHolidays] = useState(getCompanyHolidays());
  const [upcoming, setUpcoming] = useState(getNextUpcomingHoliday());
  const [showAddModal, setShowAddModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [newHoliday, setNewHoliday] = useState({
    name: '',
    date: '',
    type: 'Gazetted Holiday'
  });

  const isAdmin = currentUser?.roleId === 'role-admin' || 
                  (currentUser?.role || '').toLowerCase().includes('admin') ||
                  currentUser?.email === 'srinivas@sannainnovations.com';

  const refreshHolidays = () => {
    setHolidays(getCompanyHolidays());
    setUpcoming(getNextUpcomingHoliday());
  };

  useEffect(() => {
    const handleUpdate = () => refreshHolidays();
    window.addEventListener('sanna_holidays_updated', handleUpdate);
    return () => window.removeEventListener('sanna_holidays_updated', handleUpdate);
  }, []);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newHoliday.name || !newHoliday.date) return;
    addCompanyHoliday(newHoliday);
    setNewHoliday({ name: '', date: '', type: 'Gazetted Holiday' });
    setShowAddModal(false);
    refreshHolidays();
  };

  const handleDelete = (id) => {
    if (window.confirm('Remove this official company holiday?')) {
      deleteCompanyHoliday(id);
      refreshHolidays();
    }
  };

  const isDark = theme === 'dark';

  return (
    <div
      style={{
        background: isDark ? '#121216' : '#FFFFFF',
        border: isDark ? '1px solid #23232b' : '1px solid #EEF2F6',
        borderRadius: '20px',
        padding: isExpanded ? '22px 24px' : '14px 20px',
        boxShadow: isDark ? '0 8px 24px rgba(0, 0, 0, 0.2)' : '0 4px 20px rgba(0, 0, 0, 0.03)',
        marginTop: '20px',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* Header with Title, Next Holiday Countdown & Subtle View All Toggle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          paddingBottom: isExpanded ? '16px' : '0',
          borderBottom: isExpanded ? (isDark ? '1px solid #23232b' : '1px solid #F1F4F9') : 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: '#1c1c22',
              color: '#4E3EFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              flexShrink: 0
            }}
          >
            <CalendarDays style={{ width: '18px', height: '18px' }} />
          </div>
          <div>
            <h3
              style={{
                fontSize: '0.92rem',
                fontWeight: '800',
                color: isDark ? '#F9FAFB' : '#1E1F24',
                margin: 0,
                letterSpacing: '-0.01em'
              }}
            >
              Universal Holiday Calendar
            </h3>
            <p
              style={{
                fontSize: '0.7rem',
                color: '#64748B',
                margin: '2px 0 0 0'
              }}
            >
              Official synchronized statutory and festival leaves
            </p>
          </div>
        </div>

        {/* Right side: Countdown badge, Toggle & Admin Add button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {upcoming && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: isDark ? '#1c1c22' : '#ECFDF5',
                border: isDark ? '1px solid rgba(147, 254, 191, 0.3)' : '1px solid #A7F3D0',
                padding: '6px 14px',
                borderRadius: '9999px',
                color: isDark ? '#93FEBF' : '#059669',
                fontSize: '0.74rem',
                fontWeight: '700',
                whiteSpace: 'nowrap'
              }}
            >
              <Clock style={{ width: '13px', height: '13px' }} />
              <span>
                Next Holiday: <strong style={{ color: isDark ? '#FFFFFF' : '#065F46' }}>{upcoming.name}</strong> ({upcoming.daysLeft === 0 ? 'Today!' : upcoming.daysLeft === 1 ? 'Tomorrow' : `in ${upcoming.daysLeft} days`})
              </span>
            </div>
          )}

          {/* Sleek iOS View All Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: isExpanded
                ? (isDark ? 'rgba(78, 62, 255, 0.2)' : '#EEF2FF')
                : (isDark ? '#1c1c22' : '#F8FAFC'),
              border: isExpanded
                ? '1px solid #4E3EFF'
                : (isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0'),
              color: isExpanded ? '#4E3EFF' : (isDark ? '#94A3B8' : '#475467'),
              padding: '6px 13px',
              borderRadius: '9999px',
              fontSize: '0.73rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
              whiteSpace: 'nowrap'
            }}
          >
            <span>{isExpanded ? 'Collapse' : `View All (${holidays.length})`}</span>
            {isExpanded ? <ChevronUp style={{ width: '13px', height: '13px' }} /> : <ChevronDown style={{ width: '13px', height: '13px' }} />}
          </button>

          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#4E3EFF',
                color: '#FFFFFF',
                border: 'none',
                padding: '6px 13px',
                borderRadius: '9999px',
                fontSize: '0.73rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <Plus style={{ width: '13px', height: '13px' }} />
              <span>Add</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid of Holidays (Expandable iOS Drawer) */}
      {isExpanded && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '12px',
            marginTop: '18px'
          }}
        >
          {holidays.map((h) => {
            const holidayDate = new Date(h.date);
            const isPast = holidayDate < new Date().setHours(0, 0, 0, 0);
            const formattedDate = holidayDate.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });

            return (
              <div
                key={h.id}
                style={{
                  background: isDark ? '#1c1c22' : '#F8FAFC',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #EEF2F6',
                  borderRadius: '14px',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  opacity: isPast ? 0.6 : 1,
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        fontSize: '0.84rem',
                        fontWeight: '800',
                        color: isDark ? '#F9FAFB' : '#1E1F24',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {h.name}
                    </span>
                    <span
                      style={{
                        fontSize: '0.62rem',
                        fontWeight: '700',
                        padding: '2px 6px',
                        borderRadius: '6px',
                        background: 'rgba(78, 62, 255, 0.12)',
                        color: '#4E3EFF'
                      }}
                    >
                      {h.type}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{formattedDate}</span>
                    <span
                      style={{
                        fontSize: '0.64rem',
                        color: '#10B981',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}
                    >
                      <CheckCircle2 style={{ width: '10px', height: '10px' }} />
                      Paid Leave
                    </span>
                  </div>
                </div>

                {isAdmin && (
                  <button
                    onClick={() => handleDelete(h.id)}
                    title="Remove holiday"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#EF4444',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0.7,
                      transition: 'opacity 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = 0.7)}
                  >
                    <Trash2 style={{ width: '14px', height: '14px' }} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Admin Add Holiday Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div
            style={{
              background: isDark ? '#121216' : '#FFFFFF',
              border: isDark ? '1px solid #23232b' : '1px solid #EEF2F6',
              borderRadius: '20px',
              padding: '26px',
              width: '100%',
              maxWidth: '440px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarDays style={{ width: '18px', height: '18px', color: '#4E3EFF' }} />
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: isDark ? '#F9FAFB' : '#1E1F24' }}>
                  Add Official Company Holiday
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X style={{ width: '18px', height: '18px' }} />
              </button>
            </div>

            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: '700', color: '#94A3B8', marginBottom: '6px' }}>
                  Holiday Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diwali Festival"
                  value={newHoliday.name}
                  onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: isDark ? '#1c1c22' : '#F8FAFC',
                    border: isDark ? '1px solid #23232b' : '1px solid #E2E8F0',
                    color: isDark ? '#F9FAFB' : '#1E1F24',
                    fontSize: '0.84rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: '700', color: '#94A3B8', marginBottom: '6px' }}>
                  Holiday Date
                </label>
                <input
                  type="date"
                  required
                  value={newHoliday.date}
                  onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: isDark ? '#1c1c22' : '#F8FAFC',
                    border: isDark ? '1px solid #23232b' : '1px solid #E2E8F0',
                    color: isDark ? '#F9FAFB' : '#1E1F24',
                    fontSize: '0.84rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: '700', color: '#94A3B8', marginBottom: '6px' }}>
                  Holiday Type
                </label>
                <select
                  value={newHoliday.type}
                  onChange={(e) => setNewHoliday({ ...newHoliday, type: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: isDark ? '#1c1c22' : '#F8FAFC',
                    border: isDark ? '1px solid #23232b' : '1px solid #E2E8F0',
                    color: isDark ? '#F9FAFB' : '#1E1F24',
                    fontSize: '0.84rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="National Holiday">National Holiday</option>
                  <option value="Gazetted Holiday">Gazetted Holiday</option>
                  <option value="Public Holiday">Public Holiday</option>
                  <option value="Festival Holiday">Festival Holiday</option>
                  <option value="Restricted Holiday">Restricted Holiday</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '10px',
                    background: 'transparent',
                    border: isDark ? '1px solid #23232b' : '1px solid #E2E8F0',
                    color: isDark ? '#94A3B8' : '#64748B',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '9px 20px',
                    borderRadius: '10px',
                    background: '#4E3EFF',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Save Holiday
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyHolidayWidget;
