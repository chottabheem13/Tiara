const cron = require('node-cron');

class SchedulerService {
  constructor(calendarService, discordService, config, eventTracker = null) {
    this.calendar = calendarService;
    this.discord = discordService;
    this.config = config;
    this.eventTracker = eventTracker;
    this.tasks = [];
  }

  /**
   * Start all scheduled tasks
   */
  start() {
    console.log('🕐 Starting scheduler...');

    // Reminder H-7: Setiap hari jam 08:00
    const h7Task = cron.schedule('0 8 * * *', async () => {
      await this.runReminderTask('H-7', 7);
    }, {
      timezone: this.config.app.timezone
    });

    // Reminder H-1: Setiap hari jam 08:00
    const h1Task = cron.schedule('0 8 * * *', async () => {
      await this.runReminderTask('H-1', 1);
    }, {
      timezone: this.config.app.timezone
    });

    // Reminder Hari H: Setiap hari jam 07:00
    const todayTask = cron.schedule('0 7 * * *', async () => {
      await this.runReminderTask('Hari H', 0);
    }, {
      timezone: this.config.app.timezone
    });

    this.tasks.push(h7Task, h1Task, todayTask);

    // New Event Detection: Setiap 2 menit
    if (this.eventTracker) {
      const newEventTask = cron.schedule('*/2 * * * *', async () => {
        await this.runNewEventDetectionTask();
      }, {
        timezone: this.config.app.timezone
      });

      this.tasks.push(newEventTask);

      console.log(`✅ Scheduler started with timezone: ${this.config.app.timezone}`);
      console.log('📋 Schedule:');
      console.log('  - H-7 Reminder: Setiap hari jam 08:00');
      console.log('  - H-1 Reminder: Setiap hari jam 08:00');
      console.log('  - Hari H Reminder: Setiap hari jam 07:00');
      console.log('  - New Event Detection: Setiap 2 menit');
    } else {
      console.log(`✅ Scheduler started with timezone: ${this.config.app.timezone}`);
      console.log('📋 Schedule:');
      console.log('  - H-7 Reminder: Setiap hari jam 08:00');
      console.log('  - H-1 Reminder: Setiap hari jam 08:00');
      console.log('  - Hari H Reminder: Setiap hari jam 07:00');
      console.log('⚠️  New Event Detection: Disabled (no eventTracker)');
    }
  }

  /**
   * Run reminder task
   * @param {string} reminderType - Type of reminder (H-7, H-1, Hari H)
   * @param {number} daysFromToday - Days from today (0 = today, 1 = tomorrow, etc.)
   */
  async runReminderTask(reminderType, daysFromToday) {
    try {
      console.log(`\n🔔 Running ${reminderType} reminder task...`);

      // Get events for the target date
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + daysFromToday);

      const events = await this.calendar.getEventsForDate(targetDate);

      if (events.length === 0) {
        console.log(`✓ No events found for ${reminderType}`);
        return;
      }

      console.log(`📅 Found ${events.length} event(s) for ${reminderType}`);

      // Send reminder to Discord
      await this.discord.sendReminder(events, reminderType);

      console.log(`✅ ${reminderType} reminder completed`);
    } catch (error) {
      console.error(`❌ Error in ${reminderType} reminder task:`, error.message);
    }
  }

  /**
   * Run new event detection task
   */
  async runNewEventDetectionTask() {
    try {
      console.log(`\n🔍 Running new event detection task...`);

      // Get upcoming events for the next 30 days
      const events = await this.calendar.getEventsFromToday(0, 30);

      if (events.length === 0) {
        console.log(`✓ No events found in calendar`);
        return;
      }

      // Check for new events
      const newEvents = await this.eventTracker.checkNewEvents(events);

      if (newEvents.length > 0) {
        console.log(`🎉 Found ${newEvents.length} new event(s)!`);

        // Send notification to Discord
        await this.discord.sendNewEventNotification(newEvents);

        console.log(`✅ New event notification completed`);
      } else {
        console.log(`✓ No new events detected`);
      }
    } catch (error) {
      console.error(`❌ Error in new event detection task:`, error.message);
    }
  }

  /**
   * Manually trigger all reminders (for testing)
   */
  async testAllReminders() {
    console.log('\n🧪 Testing all reminders...\n');

    // Test H-7
    await this.runReminderTask('H-7', 7);
    await this.delay(2000);

    // Test H-1
    await this.runReminderTask('H-1', 1);
    await this.delay(2000);

    // Test Hari H
    await this.runReminderTask('Hari H', 0);

    console.log('\n✅ Test completed');
  }

  /**
   * Test specific reminder
   * @param {string} reminderType - Type of reminder to test
   */
  async testReminder(reminderType) {
    const daysMap = {
      'H-7': 7,
      'H-1': 1,
      'Hari H': 0,
    };

    const days = daysMap[reminderType];
    if (days === undefined) {
      console.error(`❌ Invalid reminder type: ${reminderType}`);
      return;
    }

    await this.runReminderTask(reminderType, days);
  }

  /**
   * Stop all scheduled tasks
   */
  stop() {
    this.tasks.forEach(task => task.stop());
    this.tasks = [];
    console.log('⏹️  Scheduler stopped');
  }

  /**
   * Helper function to add delay
   * @param {number} ms - Milliseconds to delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = SchedulerService;
