import React, { useState, useMemo } from 'react';
import { useCRM } from '../../context/CRMContext';
import { getMonthBirthdays, isBirthdayOnDay } from '../../utils/birthdayUtils';
import { CalendarDays, Plus, Edit2, Trash2, X, Download, Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { exportToCSV } from '../../utils/csvExporter';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const PLATFORMS = ['Instagram', 'Facebook', 'YouTube', 'LinkedIn', 'Twitter/X', 'WhatsApp', 'Pinterest', 'Snapchat'];
const EVENT_TYPES = ['Reel', 'Carousel Post', 'Static Post', 'Story', 'Blog / Article', 'YouTube Video', 'Email Campaign', 'Paid Ad Creative', 'LinkedIn Post'];
const CONTENT_STATUSES = ['Planned', 'Brief Sent', 'In Production', 'Review Pending', 'Scheduled', 'Published', 'Rejected / Rework'];

const statusColor = (s) => ({
  'Planned': '#818cf8', 'Brief Sent': '#60a5fa', 'In Production': '#f59e0b',
  'Review Pending': '#fb923c', 'Scheduled': '#a78bfa', 'Published': '#34d399', 'Rejected / Rework': '#f43f5e'
}[s] || '#818cf8');

const ContentCalendar = () => {
  const { contentCalendar = [], addContentEvent, updateContentEvent, deleteContentEvent, employees = [], deliverables = [] } = useCRM();

  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth()); // 0-indexed
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterClient, setFilterClient] = useState('ALL');
  const [searchQ, setSearchQ] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const monthBirthdays = useMemo(() => {
    return getMonthBirthdays(employees, currentMonth + 1, currentYear);
  }, [employees, currentMonth, currentYear]);

  const clients = useMemo(() => {
    const clientNames = [...new Set(deliverables.map(d => d.clientName).filter(Boolean))];
    return clientNames;
  }, [deliverables]);

  const emptyForm = {
    eventDate: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`,
    clientName: clients[0] || '',
    eventTitle: '',
    contentSpecialist: '',
    eventType: EVENT_TYPES[0],
    platform: PLATFORMS[0],
    status: 'Planned',
    brief: ''
  };
  const [form, setForm] = useState(emptyForm);

  const openAdd = (date = null) => {
    setEditingEvent(null);
    setForm({ ...emptyForm, eventDate: date || emptyForm.eventDate });
    setShowModal(true);
  };
  const openEdit = (ev) => { setEditingEvent(ev); setForm({ ...ev }); setShowModal(true); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingEvent) updateContentEvent(editingEvent.id, form);
    else addContentEvent(form);
    setShowModal(false);
  };

  const goMonth = (dir) => {
    let m = currentMonth + dir, y = currentYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setCurrentMonth(m); setCurrentYear(y);
  };

  const monthEvents = useMemo(() => {
    return contentCalendar.filter(ev => {
      if (!ev.eventDate) return false;
      const d = new Date(ev.eventDate);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
  }, [contentCalendar, currentMonth, currentYear]);

  const filtered = useMemo(() => {
    return monthEvents.filter(ev => {
      const matchStatus = filterStatus === 'ALL' || ev.status === filterStatus;
      const matchClient = filterClient === 'ALL' || ev.clientName === filterClient;
      const q = searchQ.toLowerCase();
      const matchSearch = !q || (ev.eventTitle || '').toLowerCase().includes(q) || (ev.clientName || '').toLowerCase().includes(q);
      return matchStatus && matchClient && matchSearch;
    });
  }, [monthEvents, filterStatus, filterClient, searchQ]);

  // Calendar grid
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const eventsOnDay = (day) => monthEvents.filter(ev => {
    if (!ev.eventDate || !day) return false;
    return new Date(ev.eventDate).getDate() === day;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: '#a78bfa', fontWeight: '700', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CalendarDays style={{ width: '15px', height: '15px' }} /> Content Planning
          </div>
          <h2 style={{ fontSize: '1.55rem', fontWeight: '900', margin: '4px 0 6px', background: 'linear-gradient(135deg, #fff 0%, #a78bfa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Content Calendar
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
            Monthly content scheduling per client, platform, and specialist. Track from brief to published.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')} className="btn btn-secondary" style={{ padding: '9px 14px', fontSize: '0.82rem' }}>
            {viewMode === 'list' ? '📅 Calendar View' : '📋 List View'}
          </button>
          <button onClick={() => exportToCSV(contentCalendar, 'Content_Calendar.csv')} className="btn btn-secondary" style={{ padding: '9px 14px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Download style={{ width: '14px', height: '14px' }} /> Export
          </button>
          <button onClick={() => openAdd()} className="btn gradient-btn-primary" style={{ padding: '9px 16px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus style={{ width: '14px', height: '14px' }} /> Add Event
          </button>
        </div>
      </div>

      {/* Month Navigator + Filters */}
      <div className="glass-card" style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => goMonth(-1)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}><ChevronLeft style={{ width: '16px', height: '16px' }} /></button>
          <span style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-primary)', minWidth: '160px', textAlign: 'center' }}>{MONTHS[currentMonth]} {currentYear}</span>
          <button onClick={() => goMonth(1)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}><ChevronRight style={{ width: '16px', height: '16px' }} /></button>
          <span style={{ fontSize: '0.78rem', color: '#a78bfa', fontWeight: '700' }}>{monthEvents.length} events this month</span>
          {monthBirthdays.length > 0 && (
            <span style={{
              fontSize: '0.75rem',
              fontWeight: '800',
              padding: '2px 8px',
              borderRadius: '10px',
              background: 'rgba(245, 158, 11, 0.18)',
              color: '#fbbf24',
              border: '1px solid rgba(245, 158, 11, 0.35)'
            }}>
              🎂 {monthBirthdays.length} Birthdays
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select className="form-input" value={filterClient} onChange={e => setFilterClient(e.target.value)} style={{ width: '160px', fontSize: '0.8rem' }}>
            <option value="ALL">All Clients</option>
            {clients.map(c => <option key={c}>{c}</option>)}
          </select>
          <select className="form-input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: '160px', fontSize: '0.8rem' }}>
            <option value="ALL">All Statuses</option>
            {CONTENT_STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: 'var(--text-muted)' }} />
            <input type="text" placeholder="Search..." value={searchQ} onChange={e => setSearchQ(e.target.value)} className="form-input" style={{ paddingLeft: '32px', width: '170px', fontSize: '0.8rem' }} />
          </div>
        </div>
      </div>

      {/* Calendar Grid View */}
      {viewMode === 'calendar' && (
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '8px' }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} style={{ padding: '8px', textAlign: 'center', fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{d}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
            {calendarDays.map((day, idx) => {
              const dayEvents = eventsOnDay(day);
              const isToday = day === now.getDate() && currentMonth === now.getMonth() && currentYear === now.getFullYear();
              const dayBirthdays = monthBirthdays.filter(b => b.birthdayData?.day === day);

              return (
                <div key={idx} onClick={() => day && openAdd(`${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`)}
                  style={{
                    minHeight: '86px',
                    padding: '6px',
                    borderRadius: '8px',
                    background: day ? (dayBirthdays.length > 0 ? 'rgba(245, 158, 11, 0.08)' : isToday ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)') : 'transparent',
                    border: dayBirthdays.length > 0 ? '1px solid rgba(245, 158, 11, 0.35)' : isToday ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.05)',
                    cursor: day ? 'pointer' : 'default',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={e => { if (day) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                  onMouseLeave={e => { if (day) e.currentTarget.style.background = dayBirthdays.length > 0 ? 'rgba(245, 158, 11, 0.08)' : isToday ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)'; }}
                >
                  {day && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: isToday ? '900' : '600', color: isToday ? '#818cf8' : 'var(--text-secondary)' }}>{day}</span>
                        {dayBirthdays.length > 0 && <span style={{ fontSize: '0.72rem' }}>🎂</span>}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {/* Employee Birthday Badges */}
                        {dayBirthdays.map(b => (
                          <div
                            key={b.id}
                            style={{
                              padding: '2px 5px',
                              borderRadius: '4px',
                              fontSize: '0.64rem',
                              fontWeight: '800',
                              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.3) 0%, rgba(236, 72, 153, 0.3) 100%)',
                              color: '#fbbf24',
                              border: '1px solid rgba(245, 158, 11, 0.5)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                            title={`🎂 Employee Birthday: ${b.name} (${b.designation || b.role})`}
                          >
                            🎂 {b.name.split(' ')[0]}'s Birthday
                          </div>
                        ))}

                        {/* Content events */}
                        {dayEvents.slice(0, 3).map(ev => (
                          <div key={ev.id} onClick={e => { e.stopPropagation(); openEdit(ev); }} style={{ padding: '2px 5px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: '700', background: `${statusColor(ev.status)}20`, color: statusColor(ev.status), whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }}>
                            {ev.eventTitle}
                          </div>
                        ))}
                        {dayEvents.length > 3 && <div style={{ fontSize: '0.63rem', color: 'var(--text-muted)', fontWeight: '700' }}>+{dayEvents.length - 3} more</div>}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.03)' }}>
                {['Date', 'Client', 'Title', 'Type', 'Platform', 'Specialist', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No content events for {MONTHS[currentMonth]} {currentYear}.</td></tr>
              ) : filtered.sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate)).map(ev => (
                <tr key={ev.id} style={{ borderBottom: '1px solid var(--border-color)' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '12px 14px', color: '#a78bfa', fontWeight: '700' }}>{ev.eventDate}</td>
                  <td style={{ padding: '12px 14px', fontWeight: '600', color: 'var(--text-primary)' }}>{ev.clientName}</td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-primary)' }}>{ev.eventTitle}</td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{ev.eventType}</td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{ev.platform}</td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{ev.contentSpecialist || '—'}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '6px', background: `${statusColor(ev.status)}18`, color: statusColor(ev.status), fontSize: '0.72rem', fontWeight: '700' }}>{ev.status}</span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => openEdit(ev)} style={{ background: 'rgba(129,140,248,0.15)', border: 'none', color: '#818cf8', padding: '5px', borderRadius: '6px', cursor: 'pointer' }}><Edit2 style={{ width: '13px', height: '13px' }} /></button>
                      <button onClick={() => deleteContentEvent(ev.id)} style={{ background: 'rgba(244,63,94,0.15)', border: 'none', color: '#f43f5e', padding: '5px', borderRadius: '6px', cursor: 'pointer' }}><Trash2 style={{ width: '13px', height: '13px' }} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '560px', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0 }}>{editingEvent ? 'Edit Content Event' : 'Add Content Event'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X style={{ width: '20px', height: '20px' }} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Event Date *</label>
                  <input type="date" className="form-input" value={form.eventDate} onChange={e => setForm(f => ({ ...f, eventDate: e.target.value }))} required />
                </div>
                <div>
                  <label className="form-label">Client *</label>
                  <input className="form-input" value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} required placeholder="Client name" list="clients-list" />
                  <datalist id="clients-list">{clients.map(c => <option key={c} value={c} />)}</datalist>
                </div>
              </div>
              <div>
                <label className="form-label">Event / Post Title *</label>
                <input className="form-input" value={form.eventTitle} onChange={e => setForm(f => ({ ...f, eventTitle: e.target.value }))} required placeholder="e.g., Independence Day Reel — National Pride" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Content Type</label>
                  <select className="form-input" value={form.eventType} onChange={e => setForm(f => ({ ...f, eventType: e.target.value }))}>
                    {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Platform</label>
                  <select className="form-input" value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}>
                    {PLATFORMS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Content Specialist</label>
                  <input className="form-input" value={form.contentSpecialist} onChange={e => setForm(f => ({ ...f, contentSpecialist: e.target.value }))} placeholder="Assigned team member" />
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <select className="form-input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    {CONTENT_STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="form-label">Brief / Notes</label>
                <textarea className="form-input" rows={3} value={form.brief} onChange={e => setForm(f => ({ ...f, brief: e.target.value }))} placeholder="Content brief, references, key messages..." />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ padding: '9px 18px' }}>Cancel</button>
                <button type="submit" className="btn gradient-btn-primary" style={{ padding: '9px 22px' }}>{editingEvent ? 'Save Changes' : 'Add Event'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentCalendar;
