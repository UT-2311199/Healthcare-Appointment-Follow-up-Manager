export const SPECIALIZATIONS = [
  'General Physician',
  'Cardiologist',
  'Dermatologist',
  'Neurologist',
  'Orthopedic',
  'Pediatrician',
  'Psychiatrist',
  'Gynecologist',
  'Ophthalmologist',
  'ENT Specialist',
  'Endocrinologist',
  'Gastroenterologist',
  'Pulmonologist',
  'Urologist',
  'Oncologist',
  'Rheumatologist',
  'Nephrologist',
  'Hematologist',
  'Allergist',
  'Surgeon',
];

export const APPOINTMENT_STATUS = {
  PENDING:     { label: 'Pending',     color: 'bg-yellow-100 text-yellow-800' },
  CONFIRMED:   { label: 'Confirmed',   color: 'bg-blue-100   text-blue-800'   },
  COMPLETED:   { label: 'Completed',   color: 'bg-green-100  text-green-800'  },
  CANCELLED:   { label: 'Cancelled',   color: 'bg-red-100    text-red-800'    },
  RESCHEDULED: { label: 'Rescheduled', color: 'bg-purple-100 text-purple-800' },
};

export const URGENCY_CONFIG = {
  Low:    { color: 'bg-green-100  text-green-800',  icon: '🟢' },
  Medium: { color: 'bg-yellow-100 text-yellow-800', icon: '🟡' },
  High:   { color: 'bg-red-100    text-red-800',    icon: '🔴' },
};