const path = require('path');

// Always load the .env that lives in the project root (discord-calendar-bot),
// regardless of where the process is started from.
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

module.exports = {
  // Discord Configuration
  discord: {
    token: process.env.DISCORD_BOT_TOKEN,
    channelId: process.env.DISCORD_CHANNEL_ID,
    reminderChannelId: process.env.REMINDER_CHANNEL_ID,
    // Optional: separate channel for "new booking / new event" notifications
    newEventChannelId: process.env.NEW_EVENT_CHANNEL_ID,
    timezone: process.env.TIMEZONE || 'Asia/Jakarta',
  },

  // Google Calendar Configuration
  google: {
    calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
    serviceAccountKey: process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
  },

  // Application Configuration
  app: {
    timezone: process.env.TIMEZONE || 'Asia/Jakarta',
  },

  // Validation
  validate() {
    const required = [
      'DISCORD_BOT_TOKEN',
      'DISCORD_CHANNEL_ID',
      'GOOGLE_CALENDAR_ID',
      'GOOGLE_SERVICE_ACCOUNT_KEY',
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    // Basic sanity checks so we fail fast with a clear message.
    const isSnowflake = (v) => typeof v === 'string' && /^\d{17,20}$/.test(v.trim());
    const channelVars = ['DISCORD_CHANNEL_ID', 'REMINDER_CHANNEL_ID', 'NEW_EVENT_CHANNEL_ID'];
    for (const k of channelVars) {
      const v = process.env[k];
      if (!v) continue; // optional vars may be empty
      if (!isSnowflake(v)) {
        throw new Error(`${k} must be a Discord channel ID (snowflake digits). Got: "${v}"`);
      }
    }
  }
};
