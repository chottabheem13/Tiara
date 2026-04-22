const config = require('./config');
const CalendarService = require('./calendar');
const DiscordService = require('./discord');
const SchedulerService = require('./scheduler');

// Validate configuration
try {
  config.validate();
} catch (error) {
  console.error('❌ Configuration Error:', error.message);
  console.log('\n💡 Pastikan sudah membuat file .env dari .env.example');
  console.log('💡 Jalankan: cp .env.example .env');
  process.exit(1);
}

async function testBot() {
  let calendarService, discordService, schedulerService;

  try {
    console.log('🧪 Starting Discord Calendar Bot Test...\n');

    // 1. Test Calendar API Connection
    console.log('📅 Step 1: Testing Google Calendar API...');
    calendarService = new CalendarService(config.google);
    await calendarService.initialize();

    // Test: Get events from today
    const todayEvents = await calendarService.getEventsFromToday(0, 30);
    console.log(`✅ Found ${todayEvents.length} upcoming events in next 30 days\n`);

    // Display events
    if (todayEvents.length > 0) {
      console.log('📋 Upcoming Events:');
      todayEvents.forEach((event, index) => {
        console.log(`\n  ${index + 1}. ${event.summary}`);
        console.log(`     📅 ${event.start.toLocaleString('id-ID')}`);
        if (event.location) console.log(`     📍 ${event.location}`);
        if (event.description) console.log(`     📝 ${event.description.substring(0, 50)}...`);
      });
      console.log('');
    }

    // 2. Test Discord Bot Connection
    console.log('🤖 Step 2: Testing Discord Bot Connection...');
    discordService = new DiscordService(config.discord);
    await discordService.initialize();

    // Wait for bot to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test: Send simple message
    console.log('📨 Step 3: Sending test message to Discord...');
    await discordService.sendMessage(
      config.discord.channelId,
      '🧪 **Test Message**\n\nBot Discord Calendar berhasil terhubung!\n\n' +
      `✅ Google Calendar: Connected\n` +
      `✅ Discord Bot: Connected\n` +
      `✅ Channel ID: ${config.discord.channelId}\n\n` +
      `📅 Ditemukan ${todayEvents.length} event dalam 30 hari ke depan.`
    );
    console.log('✅ Test message sent!\n');

    // 3. Test Reminder Formatting
    if (todayEvents.length > 0) {
      console.log('📨 Step 4: Testing reminder format...');
      schedulerService = new SchedulerService(
        calendarService,
        discordService,
        config
      );

      // Test: H-1 reminder with first event
      const firstEvent = todayEvents[0];

      // Simulate H-1 reminder
      await discordService.sendReminder([firstEvent], 'H-1');
      console.log('✅ Reminder sent!\n');
    }

    // 4. Manual Test Options
    console.log('\n✨ Manual Test Options:');
    console.log('   Bot akan terus berjalan. Tekan Ctrl+C untuk stop.\n');
    console.log('   Untuk test reminders, ubah test di bawah ini:');

    // Uncomment to test specific reminders:
    // await schedulerService.testReminder('H-7');   // Test H-7
    // await schedulerService.testReminder('H-1');   // Test H-1
    // await schedulerService.testReminder('Hari H'); // Test Hari H

    // Uncomment to test all reminders (will send 3 messages):
    // await schedulerService.testAllReminders();

    // Keep bot running
    console.log('\n✅ Bot is running! Press Ctrl+C to stop.\n');

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n\n⏹️  Shutting down gracefully...');
      if (discordService.client) {
        discordService.client.destroy();
      }
      process.exit(0);
    });

  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
    console.error(error.stack);

    // Cleanup
    if (discordService && discordService.client) {
      discordService.client.destroy();
    }
    process.exit(1);
  }
}

// Run test
testBot();
