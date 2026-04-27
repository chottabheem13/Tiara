const config = require('./config');
const CalendarService = require('./calendar');
const DiscordService = require('./discord');
const SchedulerService = require('./scheduler');
const EventTracker = require('./eventTracker');

// Validate configuration
config.validate();

async function main() {
  try {
    console.log('🚀 Starting Discord Calendar Bot...\n');

    // Initialize services
    const calendarService = new CalendarService(config.google);
    await calendarService.initialize();

    const discordService = new DiscordService(config.discord);
    await discordService.initialize();

    // Initialize event tracker
    const eventTracker = new EventTracker('./data');
    await eventTracker.initialize();

    // Prevent flooding on first run: seed tracker with existing events
    if (eventTracker.isFreshStart) {
      console.log('\nSeeding event tracker with existing events (first run)...');
      const existing = await calendarService.getEventsFromToday(0, 30);
      const seededCount = await eventTracker.seed(existing);
      console.log(`Seeded ${seededCount} events. New-event notifications will only fire for events created after this.`);
    }

    const schedulerService = new SchedulerService(
      calendarService,
      discordService,
      config,
      eventTracker
    );

    // Start scheduler
    schedulerService.start();

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n\n⏹️  Shutting down gracefully...');
      schedulerService.stop();
      discordService.client.destroy();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n\n⏹️  Shutting down gracefully...');
      schedulerService.stop();
      discordService.client.destroy();
      process.exit(0);
    });

    console.log('\n✅ Bot is running! Press Ctrl+C to stop.\n');

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the bot
main();
