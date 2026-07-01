const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type:    {
      type: String,
      enum: [
        'APPOINTMENT_BOOKED',
        'APPOINTMENT_CONFIRMED',
        'APPOINTMENT_CANCELLED',
        'APPOINTMENT_REMINDER',
        'MEDICATION_REMINDER',
        'POST_VISIT_READY',
        'DOCTOR_ON_LEAVE',
        'GENERAL',
      ],
    },
    title:   { type: String },
    message: { type: String, required: true },
    read:    { type: Boolean, default: false },
    data:    { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);