const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctor:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    date: { type: String, required: true },   // "YYYY-MM-DD"
    time: { type: String, required: true },   // "HH:mm"

    status: {
      type:    String,
      enum:    ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED'],
      default: 'CONFIRMED',
    },

    // Patient inputs
    symptoms:        [{ type: String }],
    notes:           { type: String },
    symptomDuration: { type: String },
    severity:        { type: String },

    // AI references
    preVisitSummary:  { type: mongoose.Schema.Types.ObjectId, ref: 'PreVisitSummary'  },
    postVisitSummary: { type: mongoose.Schema.Types.ObjectId, ref: 'PostVisitSummary' },

    // Google Calendar
    calendarEventId: { type: String },

    // Cancellation
    cancelledBy:     { type: String },
    cancellationReason: { type: String },
    cancelledAt:     { type: Date },

    // Rescheduling
    previousDate:    { type: String },
    previousTime:    { type: String },
  },
  { timestamps: true }
);

// Compound unique index — prevents double booking
appointmentSchema.add({
  activeSlot: {
    type: Boolean,
    default: true
  }
});

appointmentSchema.index(
  { doctor: 1, date: 1, time: 1, activeSlot: 1 },
  {
    unique: true,
    partialFilterExpression: { activeSlot: true }
  }
);

appointmentSchema.index({ patient: 1, status: 1 });
appointmentSchema.index({ doctor: 1, status: 1 });
appointmentSchema.index({ date: 1, status: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);