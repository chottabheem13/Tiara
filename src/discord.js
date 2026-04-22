const { Client, GatewayIntentBits } = require('discord.js');

class DiscordService {
  constructor(config) {
    this.config = config;
    this.client = null;
  }

  async initialize() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });

    this.client.once('ready', () => {
      console.log(`✅ Discord bot logged in as ${this.client.user.tag}`);
    });

    this.client.on('error', (error) => {
      console.error('❌ Discord client error:', error);
    });

    await this.client.login(this.config.token);
    return this.client;
  }

  /**
   * Send message to a channel
   * @param {string} channelId - Channel ID
   * @param {string} message - Message content
   * @param {Object} embed - Discord embed (optional)
   */
  async sendMessage(channelId, message, embed = null) {
    try {
      const channel = await this.client.channels.fetch(channelId);

      if (embed) {
        await channel.send({ content: message, embeds: [embed] });
      } else {
        await channel.send(message);
      }

      console.log(`📨 Message sent to channel ${channelId}`);
    } catch (error) {
      console.error('❌ Error sending message:', error.message);
      throw error;
    }
  }

  /**
   * Send reminder message
   * @param {Array} events - List of events
   * @param {string} reminderType - Type of reminder (H-7, H-1, Hari H)
   */
  async sendReminder(events, reminderType) {
    if (!events || events.length === 0) {
      console.log(`No events to send for ${reminderType} reminder`);
      return;
    }

    const channel = this.config.reminderChannelId || this.config.channelId;

    // Create header message based on reminder type
    const headers = {
      'H-7': '🔔 **Reminder 7 Hari Sebelum Event**',
      'H-1': '🔔 **Reminder Besok - Event Mendatang**',
      'Hari H': '🎉 **Event Hari Ini - Selamat Menjalankan!**',
    };

    const header = headers[reminderType] || '🔔 **Reminder**';
    let message = `${header}\n\n`;
    message += `Ada ${events.length} event ${reminderType === 'Hari H' ? 'hari ini' : 'yang akan datang'}:\n\n`;

    // Add each event
    events.forEach((event, index) => {
      message += `**${index + 1}.** ${this.formatEventSummary(event)}\n\n`;
    });

    message += `\n───────────────────────\n📅 *Update terakhir: ${new Date().toLocaleString('id-ID')}*`;

    await this.sendMessage(channel, message);
  }

  /**
   * Format event summary for reminder
   * @param {Object} event - Formatted event
   * @returns {string} Formatted summary
   */
  formatEventSummary(event) {
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

    let summary = `**${event.summary}**`;
    summary += `\n📅 ${formatDate(event.start)}`;

    if (!event.isAllDay) {
      summary += ` pukul ${formatTime(event.start)}`;
    }

    if (event.location) {
      summary += `\n📍 ${event.location}`;
    }

    if (event.description) {
      const shortDesc = event.description.length > 100
        ? event.description.substring(0, 100) + '...'
        : event.description;
      summary += `\n📝 ${shortDesc}`;
    }

    return summary;
  }

  /**
   * Send notification for new events
   * @param {Array} events - List of new events
   */
  async sendNewEventNotification(events) {
    if (!events || events.length === 0) {
      console.log('No new events to notify');
      return;
    }

    const channel = this.config.reminderChannelId || this.config.channelId;

    let message = '🎉 **JADWAL BARU DITAMBAHKAN!**\n\n';
    message += `Ada ${events.length} jadwal baru yang ditambahkan:\n\n`;

    // Add each event
    events.forEach((event, index) => {
      message += `**${index + 1}.** ${this.formatEventSummary(event)}\n\n`;
    });

    message += `\n───────────────────────\n📅 *Detected on: ${new Date().toLocaleString('id-ID')}*`;

    await this.sendMessage(channel, message);
  }

  /**
   * Create Discord embed
   * @param {Object} event - Event data
   * @param {string} color - Color hex code
   * @returns {Object} Discord embed
   */
  createEmbed(event, color = '#0099ff') {
    const { EmbedBuilder } = require('discord.js');

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(event.summary)
      .setDescription(event.description || 'Tidak ada deskripsi')
      .addFields(
        { name: 'Tanggal', value: event.start.toLocaleDateString('id-ID'), inline: true },
      );

    if (event.location) {
      embed.addFields({ name: 'Lokasi', value: event.location, inline: true });
    }

    return embed;
  }
}

module.exports = DiscordService;
