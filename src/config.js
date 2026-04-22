require('dotenv').config();

module.exports = {
  // Discord Configuration
  discord: {
    token: process.env.DISCORD_BOT_TOKEN,
    channelId: process.env.DISCORD_CHANNEL_ID,
    reminderChannelId: process.env.REMINDER_CHANNEL_ID,
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
  }
};
