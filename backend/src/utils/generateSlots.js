const { format, addMinutes, parse, isBefore, isEqual } = require('date-fns');

/**
 * Generate time slots for a doctor on a given date
 * @param {string} startTime - "09:00"
 * @param {string} endTime   - "17:00"
 * @param {number} duration  - minutes per slot
 * @returns {string[]}       - ["09:00","09:30",...]
 */
const generateTimeSlots = (startTime, endTime, duration) => {
  const slots  = [];
  const base   = new Date(2000, 0, 1); // fixed base date
  const start  = parse(startTime, 'HH:mm', base);
  const end    = parse(endTime,   'HH:mm', base);
  let   cursor = start;

  while (isBefore(cursor, end) || isEqual(cursor, end)) {
    const next = addMinutes(cursor, duration);
    if (!isBefore(next, end) && !isEqual(next, end) && !isBefore(cursor, end)) break;
    if (isBefore(addMinutes(cursor, duration), end) ||
        isEqual(addMinutes(cursor, duration), end)  ||
        isBefore(cursor, end)) {
      slots.push(format(cursor, 'HH:mm'));
    }
    cursor = addMinutes(cursor, duration);
    if (!isBefore(cursor, end) && !isEqual(cursor, end)) break;
  }

  return slots;
};

module.exports = { generateTimeSlots };