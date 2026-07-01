const { getCalendarClient } = require('../config/googleCalendar');

const isCalendarEnabled = () =>
  !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_REFRESH_TOKEN);

/**
 * Create a Google Calendar event
 */
const createCalendarEvent = async ({ summary, description, date, time, durationMinutes = 30 }) => {
  if (!isCalendarEnabled()) {
    console.warn('Google Calendar not configured — skipping event creation');
    return null;
  }

  try {
    const calendar = getCalendarClient();
    const [year, month, day] = date.split('-').map(Number);
    const [hour, minute]     = time.split(':').map(Number);

    const startDateTime = new Date(year, month - 1, day, hour, minute);
    const endDateTime   = new Date(startDateTime.getTime() + durationMinutes * 60000);

    const event = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary,
        description,
        start: { dateTime: startDateTime.toISOString(), timeZone: 'UTC' },
        end:   { dateTime: endDateTime.toISOString(),   timeZone: 'UTC' },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 1440 },   // 24h before
            { method: 'popup', minutes: 30  },    // 30min before
          ],
        },
      },
    });

    console.log(`📅 Calendar event created: ${event.data.id}`);
    return event.data.id;
  } catch (err) {
    console.error('Calendar event creation failed:', err.message);
    return null; // Graceful failure
  }
};

/**
 * Update a Google Calendar event
 */
const updateCalendarEvent = async (eventId, { summary, date, time, durationMinutes = 30 }) => {
  if (!isCalendarEnabled() || !eventId) return null;

  try {
    const calendar = getCalendarClient();
    const [year, month, day] = date.split('-').map(Number);
    const [hour, minute]     = time.split(':').map(Number);

    const startDateTime = new Date(year, month - 1, day, hour, minute);
    const endDateTime   = new Date(startDateTime.getTime() + durationMinutes * 60000);

    await calendar.events.patch({
      calendarId: 'primary',
      eventId,
      requestBody: {
        summary,
        start: { dateTime: startDateTime.toISOString(), timeZone: 'UTC' },
        end:   { dateTime: endDateTime.toISOString(),   timeZone: 'UTC' },
      },
    });

    return eventId;
  } catch (err) {
    console.error('Calendar event update failed:', err.message);
    return null;
  }
};

/**
 * Delete a Google Calendar event
 */
const deleteCalendarEvent = async (eventId) => {
  if (!isCalendarEnabled() || !eventId) return;

  try {
    const calendar = getCalendarClient();
    await calendar.events.delete({ calendarId: 'primary', eventId });
    console.log(`🗑️  Calendar event deleted: ${eventId}`);
  } catch (err) {
    console.error('Calendar event deletion failed:', err.message);
  }
};

module.exports = { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent };