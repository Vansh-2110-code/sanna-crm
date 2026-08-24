/**
 * Utility functions for Employee Birthday tracking and monthly highlighting
 */

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const MONTH_SHORT_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * Parses birthday string (e.g. '1998-08-15', '08-15', or Date)
 * @param {string|Date} birthdayStr 
 * @returns {{ month: number, day: number, year: number | null } | null} (month is 1-indexed: 1-12)
 */
export function parseBirthday(birthdayStr) {
  if (!birthdayStr) return null;
  
  if (typeof birthdayStr === 'string') {
    const parts = birthdayStr.trim().split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);
      if (!isNaN(month) && !isNaN(day)) {
        return { month, day, year: isNaN(year) ? null : year };
      }
    } else if (parts.length === 2) {
      const month = parseInt(parts[0], 10);
      const day = parseInt(parts[1], 10);
      if (!isNaN(month) && !isNaN(day)) {
        return { month, day, year: null };
      }
    }
  }

  const d = new Date(birthdayStr);
  if (!isNaN(d.getTime())) {
    return {
      month: d.getMonth() + 1,
      day: d.getDate(),
      year: d.getFullYear()
    };
  }

  return null;
}

/**
 * Check if employee has a birthday in a given month
 * @param {string|Date} birthdayStr 
 * @param {number} monthNum (1-indexed: 1-12)
 */
export function isBirthdayInMonth(birthdayStr, monthNum) {
  const parsed = parseBirthday(birthdayStr);
  if (!parsed) return false;
  return parsed.month === Number(monthNum);
}

/**
 * Check if a date matches today's birthday
 * @param {string|Date} birthdayStr 
 * @param {Date} [referenceDate] 
 */
export function isBirthdayToday(birthdayStr, referenceDate = new Date()) {
  const parsed = parseBirthday(birthdayStr);
  if (!parsed) return false;
  const currentMonth = referenceDate.getMonth() + 1;
  const currentDay = referenceDate.getDate();
  return parsed.month === currentMonth && parsed.day === currentDay;
}

/**
 * Check if an employee's birthday is on a specific day in a given month
 * @param {string|Date} birthdayStr 
 * @param {number} monthNum (1-indexed: 1-12)
 * @param {number} dayNum (1-31)
 */
export function isBirthdayOnDay(birthdayStr, monthNum, dayNum) {
  const parsed = parseBirthday(birthdayStr);
  if (!parsed) return false;
  return parsed.month === Number(monthNum) && parsed.day === Number(dayNum);
}

/**
 * Format a birthday string nicely (e.g. "15 Aug 1998" or "15 Aug")
 * @param {string|Date} birthdayStr 
 * @param {boolean} includeYear 
 */
export function formatBirthday(birthdayStr, includeYear = true) {
  const parsed = parseBirthday(birthdayStr);
  if (!parsed) return 'Not Set';
  const monthName = MONTH_SHORT_NAMES[parsed.month - 1] || '';
  if (includeYear && parsed.year) {
    return `${parsed.day} ${monthName} ${parsed.year}`;
  }
  return `${parsed.day} ${monthName}`;
}

/**
 * Calculate age turning this year
 * @param {string|Date} birthdayStr 
 * @param {number} [targetYear] 
 */
export function getTurningAge(birthdayStr, targetYear = new Date().getFullYear()) {
  const parsed = parseBirthday(birthdayStr);
  if (!parsed || !parsed.year) return null;
  return targetYear - parsed.year;
}

/**
 * Get all employees who have birthdays in a specified month (1-12)
 * Sorted by day of month
 * @param {Array} employees 
 * @param {number} monthNum (1-12)
 * @param {number} [targetYear] 
 */
export function getMonthBirthdays(employees = [], monthNum, targetYear = new Date().getFullYear()) {
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  return (employees || [])
    .filter(emp => emp && isBirthdayInMonth(emp.birthday || emp.dob, monthNum))
    .map(emp => {
      const bday = emp.birthday || emp.dob;
      const parsed = parseBirthday(bday);
      const isToday = (monthNum === currentMonth && parsed.day === currentDay);
      const isPassed = (monthNum < currentMonth) || (monthNum === currentMonth && parsed.day < currentDay);
      const isUpcoming = (monthNum > currentMonth) || (monthNum === currentMonth && parsed.day > currentDay);
      const daysUntil = (monthNum === currentMonth && parsed.day >= currentDay) ? (parsed.day - currentDay) : null;
      const ageTurning = getTurningAge(bday, targetYear);

      return {
        ...emp,
        birthdayData: {
          day: parsed.day,
          month: parsed.month,
          year: parsed.year,
          formatted: formatBirthday(bday, true),
          formattedShort: formatBirthday(bday, false),
          isToday,
          isPassed,
          isUpcoming,
          daysUntil,
          ageTurning
        }
      };
    })
    .sort((a, b) => a.birthdayData.day - b.birthdayData.day);
}

/**
 * Get all today's birthdays from employee list
 * @param {Array} employees 
 * @param {Date} [referenceDate] 
 */
export function getTodayBirthdays(employees = [], referenceDate = new Date()) {
  return (employees || [])
    .filter(emp => emp && isBirthdayToday(emp.birthday || emp.dob, referenceDate))
    .map(emp => {
      const bday = emp.birthday || emp.dob;
      const parsed = parseBirthday(bday);
      return {
        ...emp,
        birthdayData: {
          day: parsed.day,
          month: parsed.month,
          year: parsed.year,
          formatted: formatBirthday(bday, true),
          formattedShort: formatBirthday(bday, false),
          isToday: true,
          ageTurning: getTurningAge(bday, referenceDate.getFullYear())
        }
      };
    });
}
