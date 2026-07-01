const mongoose = require('mongoose');

/**
 * Temporary slot hold to prevent race conditions during booking.
 * TTL index auto-deletes after 5 minutes.
 */
const slotHoldSchema = new mongoose.Schema({
  doctor:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  patient:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date:      { type: String, required: true },
  time:      { type: String, required: true },
  expiresAt: { type: Date,   required: true, index: { expires: 0 } },
});

slotHoldSchema.index({ doctor: 1, date: 1, time: 1 }, { unique: true });

module.exports = mongoose.model('SlotHold', slotHoldSchema);