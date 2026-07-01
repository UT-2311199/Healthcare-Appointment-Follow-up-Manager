import { format, parseISO, isToday, isTomorrow, addMinutes } from 'date-fns';

export const formatDate = (date) =>
  format(typeof date === 'string' ? parseISO(date) : date, 'MMM dd, yyyy');

export const formatTime = (date) =>
  format(typeof date === 'string' ? parseISO(date) : date, 'hh:mm a');

export const formatDateTime = (date) =>
  format(typeof date === 'string' ? parseISO(date) : date, 'MMM dd, yyyy • hh:mm a');

export const getRelativeDay = (date) => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  return format(d, 'EEEE, MMM dd');
};

export const generateTimeSlots = (startTime, endTime, durationMinutes) => {
  const slots = [];
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const start = new Date();
  start.setHours(sh, sm, 0);
  const end = new Date();
  end.setHours(eh, em, 0);
  let current = start;
  while (current < end) {
    slots.push(format(current, 'HH:mm'));
    current = addMinutes(current, durationMinutes);
  }
  return slots;
};