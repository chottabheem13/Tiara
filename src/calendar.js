const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

class CalendarService {
  constructor(config) {
    this.config = config;
    this.calendar = null;
  }

  async initialize() {
    try {
      // Read service account key
      const keyPath = path.resolve(this.config.serviceAccountKey);
      const key = JSON.parse(fs.readFileSync(keyPath, 'utf8'));

      // Create JWT client
      const jwtClient = new google.auth.JWT(
        key.client_email,
        null,
        key.private_key,
        ['https://www.googleapis.com/auth/calendar.readonly']
      );

      // Authorize
      await jwtClient.authorize();

      // Create calendar client
      this.calendar = google.calendar({ version: 'v3', auth: jwtClient });

      console.log('✅ Google Calendar API initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Google Calendar API:', error.message);
      throw error;
    }
  }

  /**
   * Get upcoming events within a date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Array} List of events
   */
  async getEvents(startDate, endDate) {
    try {
      const response = await this.calendar.events.list({
        calendarId: this.config.calendarId,
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = response.data.items || [];
      console.log(`📅 Found ${events.length} events between ${startDate.toISOString()} and ${endDate.toISOString()}`);

      return events.map(this.formatEvent);
    } catch (error) {
      console.error('❌ Error fetching events:', error.message);
      return [];
    }
  }

  /**
   * Get events for a specific date
   * @param {Date} date - Target date
   * @returns {Array} List of events
   */
  async getEventsForDate(date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await this.getEvents(startOfDay, endOfDay);
  }

  /**
   * Get events for a date range from today
   * @param {number} daysFromToday - Start days from today (can be negative)
   * @param {number} daysAhead - End days from today
   * @returns {Array} List of events
   */
  async getEventsFromToday(daysFromToday = 0, daysAhead = 30) {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() + daysFromToday);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + daysAhead);
    endDate.setHours(23, 59, 59, 999);

    return await this.getEvents(startDate, endDate);
  }

  /**
   * Format event object
   * @param {Object} event - Raw event from Google Calendar
   * @returns {Object} Formatted event
   */
  formatEvent(event) {
    const start = event.start.dateTime || event.start.date;
    const end = event.end.dateTime || event.end.date;

    return {
      id: event.id,
      summary: event.summary || 'No Title',
      description: event.description || '',
      location: event.location || '',
      start: new Date(start),
      end: new Date(end),
      isAllDay: !event.start.dateTime,
      created: event.created,
      updated: event.updated,
    };
  }

  /**
   * Format event for Discord message
   * @param {Object} event - Formatted event
   * @param {string} reminderType - Type of reminder (H-7, H-1, Hari H)
   * @returns {string} Discord formatted message
   */
  formatEventForDiscord(event, reminderType = 'reminder') {
    const formatDate = (date) => {
      return date.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    const formatTime = (date) => {
      return date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    let message = `📌 **${event.summary}**\n`;
    message += `📅 ${formatDate(event.start)}`;

    if (!event.isAllDay) {
      message += ` pukul ${formatTime(event.start)}`;
      if (event.end) {
        message += ` - ${formatTime(event.end)}`;
      }
    }
    message += '\n';

    if (event.location) {
      message += `📍 ${event.location}\n`;
    }

    if (event.description) {
      message += `\n📝 ${event.description}\n`;
    }

    return message;
  }
}

module.exports = CalendarService;
