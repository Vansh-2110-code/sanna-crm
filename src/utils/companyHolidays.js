/**
 * Universal Company Holiday Calendar Utility for Sanna Innovations
 * Stored locally and synchronized across all dashboards & attendance records.
 */

const STORAGE_KEY = 'sanna_company_holidays_2026';

export const DEFAULT_COMPANY_HOLIDAYS_2026 = [
  { id: 'hol-01', name: 'New Year Day', date: '2026-01-01', type: 'Public Holiday', isPaid: true },
  { id: 'hol-02', name: 'Republic Day', date: '2026-01-26', type: 'National Holiday', isPaid: true },
  { id: 'hol-03', name: 'Maha Shivratri', date: '2026-02-15', type: 'Restricted Holiday', isPaid: true },
  { id: 'hol-04', name: 'Holi Festival', date: '2026-03-04', type: 'Gazetted Holiday', isPaid: true },
  { id: 'hol-05', name: 'Eid-ul-Fitr', date: '2026-03-20', type: 'Gazetted Holiday', isPaid: true },
  { id: 'hol-06', name: 'Good Friday', date: '2026-04-03', type: 'Public Holiday', isPaid: true },
  { id: 'hol-07', name: 'Labor / May Day', date: '2026-05-01', type: 'Public Holiday', isPaid: true },
  { id: 'hol-08', name: 'Bakrid / Eid al-Adha', date: '2026-05-27', type: 'Gazetted Holiday', isPaid: true },
  { id: 'hol-09', name: 'Independence Day', date: '2026-08-15', type: 'National Holiday', isPaid: true },
  { id: 'hol-10', name: 'Ganesh Chaturthi', date: '2026-09-14', type: 'Festival Holiday', isPaid: true },
  { id: 'hol-11', name: 'Gandhi Jayanti', date: '2026-10-02', type: 'National Holiday', isPaid: true },
  { id: 'hol-12', name: 'Dussehra / Vijayadashami', date: '2026-10-20', type: 'Gazetted Holiday', isPaid: true },
  { id: 'hol-13', name: 'Diwali / Deepavali', date: '2026-11-08', type: 'Gazetted Holiday', isPaid: true },
  { id: 'hol-14', name: 'Guru Nanak Jayanti', date: '2026-11-24', type: 'Public Holiday', isPaid: true },
  { id: 'hol-15', name: 'Christmas Day', date: '2026-12-25', type: 'Gazetted Holiday', isPaid: true }
];

export const getCompanyHolidays = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.sort((a, b) => new Date(a.date) - new Date(b.date));
      }
    }
  } catch (e) {
    console.warn('Error reading company holidays:', e);
  }
  return DEFAULT_COMPANY_HOLIDAYS_2026;
};

export const saveCompanyHolidays = (holidays) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(holidays));
    window.dispatchEvent(new Event('sanna_holidays_updated'));
  } catch (e) {
    console.error('Error saving company holidays:', e);
  }
};

export const addCompanyHoliday = (holiday) => {
  const list = getCompanyHolidays();
  const newHoliday = {
    id: `hol-${Date.now()}`,
    name: holiday.name || 'Company Holiday',
    date: holiday.date || new Date().toISOString().split('T')[0],
    type: holiday.type || 'Gazetted Holiday',
    isPaid: true
  };
  const updated = [...list, newHoliday].sort((a, b) => new Date(a.date) - new Date(b.date));
  saveCompanyHolidays(updated);
  return updated;
};

export const deleteCompanyHoliday = (id) => {
  const list = getCompanyHolidays();
  const updated = list.filter(h => h.id !== id);
  saveCompanyHolidays(updated);
  return updated;
};

export const isCompanyHoliday = (year, month, day) => {
  const list = getCompanyHolidays();
  const targetDateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return list.find(h => h.date === targetDateStr) || null;
};

export const getNextUpcomingHoliday = () => {
  const list = getCompanyHolidays();
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const upcoming = list.find(h => {
    const d = new Date(h.date);
    return d >= now;
  });

  if (!upcoming) return null;

  const targetDate = new Date(upcoming.date);
  const diffTime = targetDate - now;
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return {
    ...upcoming,
    daysLeft
  };
};
