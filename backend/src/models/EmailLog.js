const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema(
  {
    to:       { type: String, required: true },
    subject:  { type: String, required: true },
    template: { type: String },
    status:   { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
    attempts: { type: Number, default: 0 },
    maxRetries: { type: Number, default: 3 },
    lastError:  { type: String },
    sentAt:     { type: Date },
    payload:    { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

emailLogSchema.index({ status: 1, attempts: 1 });

module.exports = mongoose.model('EmailLog', emailLogSchema);