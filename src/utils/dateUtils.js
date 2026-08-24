export const safeToISODate = (val, fallback = '') => {
  if (!val) return fallback;
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return fallback;
    return d.toISOString().split('T')[0];
  } catch (e) {
    return fallback;
  }
};

export const safeToISOString = (val, fallback = '') => {
  if (!val) return fallback;
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return fallback;
    return d.toISOString();
  } catch (e) {
    return fallback;
  }
};

export const formatDateDisplay = (val, fallback = '—') => {
  if (!val) return fallback;
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (e) {
    return String(val);
  }
};

export const getCurrentISTTimeString = (date = new Date()) => {
  try {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (e) {
    return '09:00 AM';
  }
};
