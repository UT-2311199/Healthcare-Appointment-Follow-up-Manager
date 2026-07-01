const EmailLog      = require('../models/EmailLog');
const { getTransporter } = require('../config/email');

/**
 * Retry failed emails up to maxRetries times
 */
const retryFailedEmails = async () => {
  const failedEmails = await EmailLog.find({
    status:   'failed',
    $expr: { $lt: ['$attempts', '$maxRetries'] },
  }).limit(20);

  if (failedEmails.length === 0) return;
  console.log(`🔄 Retrying ${failedEmails.length} failed emails...`);

  const transporter = getTransporter();

  for (const log of failedEmails) {
    try {
      await transporter.sendMail({
        from:    process.env.EMAIL_FROM,
        to:      log.to,
        subject: log.subject,
        html:    `<p>Retry of: ${log.subject}</p>`,
      });

      await EmailLog.findByIdAndUpdate(log._id, {
        status: 'sent',
        sentAt: new Date(),
        $inc:   { attempts: 1 },
      });

      console.log(`✅ Email retry succeeded: ${log.to}`);
    } catch (err) {
      await EmailLog.findByIdAndUpdate(log._id, {
        lastError: err.message,
        $inc:      { attempts: 1 },
        status:    log.attempts + 1 >= log.maxRetries ? 'failed' : 'failed',
      });
    }
  }
};

module.exports = { retryFailedEmails };