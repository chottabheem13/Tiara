const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

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
      console.log(`Discord bot logged in as ${this.client.user.tag}`);
    });

    this.client.on('error', (error) => {
      console.error('Discord client error:', error);
    });

    await this.client.login(this.config.token);
    return this.client;
  }

  /**
   * Send message to a channel (supports embeds).
   * @param {string} channelId
   * @param {string} message
   * @param {Array|Object|null} embeds
   */
  async sendMessage(channelId, message = '', embeds = null) {
    const channel = await this.client.channels.fetch(channelId);

    const embedArr = !embeds ? [] : (Array.isArray(embeds) ? embeds : [embeds]);
    if (embedArr.length > 0) {
      // Discord allows up to 10 embeds per message.
      const maxEmbedsPerMessage = 10;
      for (let i = 0; i < embedArr.length; i += maxEmbedsPerMessage) {
        const chunk = embedArr.slice(i, i + maxEmbedsPerMessage);
        await channel.send({ content: (i === 0 ? (message || undefined) : undefined), embeds: chunk });
      }
      return;
    }

    if (message) {
      await channel.send(message);
    }
  }

  async sendReminder(events, reminderType) {
    if (!events || events.length === 0) return;

    const channel = this.config.reminderChannelId || this.config.channelId;

    const titles = {
      'H-7': '⏰ Reminder 7 Hari Sebelum Event',
      'H-1': '⏰ Reminder Besok - Event Mendatang',
      'Hari H': '🎉 Event Hari Ini',
    };

    const title = titles[reminderType] || 'Reminder';
    const color = reminderType === 'Hari H' ? 0x2ECC71 : 0x3498DB;

    const embeds = this.buildEventEmbeds(events, { color });
    await this.sendMessage(channel, '', embeds);
  }

  async sendNewEventNotification(events) {
    if (!events || events.length === 0) return;

    const channel = this.config.newEventChannelId || this.config.reminderChannelId || this.config.channelId;

    const color = 0xE67E22;

    const embeds = this.buildEventEmbeds(events, { color });
    await this.sendMessage(channel, '', embeds);
  }

  buildEventEmbeds(events, { color } = {}) {
    const embeds = [];
    for (let i = 0; i < events.length; i++) {
      embeds.push(this.buildSingleEventEmbed(events[i], { color }));
    }
    return embeds;
  }

  buildSingleEventEmbed(event, { color } = {}) {
    const tz = this.config.timezone || 'Asia/Jakarta';

    const formatDate = (date) => date.toLocaleDateString('id-ID', {
      timeZone: tz,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const formatTime = (date) => date.toLocaleTimeString('id-ID', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
    });

    const extracted = this.extractBookingFields(event.description || '');
    const attendee = Array.isArray(event.attendees) && event.attendees.length > 0
      ? event.attendees.find(a => a && !a.organizer && !a.self) || event.attendees[0]
      : null;

    const name = extracted.name || (attendee && attendee.displayName) || '';
    const email = extracted.email || (attendee && attendee.email) || '';
    const cleanedTitle = this.cleanEventTitle(event.summary || 'No Title', name);

    const embed = new EmbedBuilder()
      .setColor(color ?? 0x3498DB)
      .setTitle(`📌 ${this.truncate(cleanedTitle, 240)}`)
      .setTimestamp(event.start ? new Date(event.start) : new Date());

    if (event.htmlLink) {
      embed.setURL(event.htmlLink);
    }

    // Time fields
    const dateStr = event.start ? formatDate(event.start) : '-';
    embed.addFields({ name: '📅 Tanggal', value: dateStr, inline: true });

    if (event.isAllDay) {
      embed.addFields({ name: '🕒 Waktu', value: 'Seharian', inline: true });
      embed.addFields({ name: '⏱️ Durasi', value: '-', inline: true });
    } else {
      const startStr = event.start ? formatTime(event.start) : '-';
      const endStr = event.end ? formatTime(event.end) : '';
      embed.addFields({ name: '🕒 Waktu', value: endStr ? `${startStr} - ${endStr}` : startStr, inline: true });

      let dur = '-';
      if (event.start && event.end) {
        const durationMinutes = Math.round((event.end.getTime() - event.start.getTime()) / 60000);
        if (Number.isFinite(durationMinutes) && durationMinutes > 0) dur = `${durationMinutes} menit`;
      }
      embed.addFields({ name: '⏱️ Durasi', value: dur, inline: true });
    }

    // Booking fields
    if (name) embed.addFields({ name: '🙍 Nama', value: this.truncate(name, 256), inline: true });
    if (email) embed.addFields({ name: '📧 Email', value: this.truncate(email, 256), inline: true });
    if (extracted.topic) embed.addFields({ name: '🧠 Topik', value: this.truncate(extracted.topic, 512), inline: false });

    // Extra
    if (event.location) embed.addFields({ name: '📍 Lokasi', value: this.truncate(event.location, 512), inline: false });
    if (extracted.notes) embed.addFields({ name: '🗒️ Catatan', value: this.truncate(extracted.notes, 900), inline: false });

    return embed;
  }

  extractBookingFields(description) {
    if (!description) return { name: '', email: '', topic: '', notes: '' };

    const clean = this.stripHtmlToText(String(description));

    const lines = clean
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);

    let name = '';
    let email = '';
    let topic = '';

    const used = new Set();
    const pick = (idx, key, value) => {
      if (!value) return;
      used.add(idx);
      if (key === 'name' && !name) name = value;
      if (key === 'email' && !email) email = value;
      if (key === 'topic' && !topic) topic = value;
    };

    const rxName = /^(nama|name)\s*[:\-]\s*(.+)$/i;
    const rxEmail = /^email\s*[:\-]\s*(.+)$/i;
    const rxTopic = /^(topik|topic|bahasan)\s*[:\-]\s*(.+)$/i;

    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      let m = l.match(rxName);
      if (m) { pick(i, 'name', m[2].trim()); continue; }
      m = l.match(rxEmail);
      if (m) { pick(i, 'email', m[1].trim()); continue; }
      m = l.match(rxTopic);
      if (m) { pick(i, 'topic', m[2].trim()); continue; }
    }

    // Fallback: try to find an email anywhere in the description
    if (!email) {
      for (let i = 0; i < lines.length; i++) {
        const l = lines[i];
        const m = l.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
        if (m) { pick(i, 'email', m[0]); break; }
      }
    }

    // Common appointment schedule format:
    // "Booked by" then next line is name
    if (!name) {
      for (let i = 0; i < lines.length - 1; i++) {
        if (/^booked by$/i.test(lines[i])) {
          pick(i, 'name', lines[i + 1]);
          used.add(i + 1);
          break;
        }
      }
    }

    // Indonesian label: "Yang mau dibahas" then next line is topic
    if (!topic) {
      for (let i = 0; i < lines.length - 1; i++) {
        if (/^(yang mau dibahas|yang ingin dibahas)$/i.test(lines[i])) {
          pick(i, 'topic', lines[i + 1]);
          used.add(i + 1);
          break;
        }
      }
    }

    // Notes = description without lines we already extracted.
    const remaining = lines
      .filter((_, idx) => !used.has(idx))
      .join('\n');

    return {
      name,
      email,
      topic,
      notes: remaining,
    };
  }

  stripHtmlToText(html) {
    if (!html) return '';
    let s = String(html);
    // Normalize common line breaks
    s = s.replace(/<br\s*\/?>/gi, '\n');
    s = s.replace(/<\/p\s*>/gi, '\n');
    s = s.replace(/<\/div\s*>/gi, '\n');
    s = s.replace(/<\/li\s*>/gi, '\n');

    // Drop tags
    s = s.replace(/<[^>]+>/g, '');

    // Minimal entity decoding
    s = s.replace(/&nbsp;/gi, ' ');
    s = s.replace(/&amp;/gi, '&');
    s = s.replace(/&lt;/gi, '<');
    s = s.replace(/&gt;/gi, '>');
    s = s.replace(/&quot;/gi, '"');
    s = s.replace(/&#39;/g, "'");

    return s;
  }

  cleanEventTitle(summary, name) {
    let s = String(summary || '').trim();
    if (!s) return 'No Title';
    if (!name) return s;

    const n = String(name).trim();
    if (!n) return s;

    const ne = this.escapeRegExp(n);

    // Remove common patterns that append the booker's name to the title.
    // Examples:
    // "Soudan with abi (Klee Anak Abi)" -> "Soudan with abi"
    // "Soudan - Klee Anak Abi" -> "Soudan"
    // "Soudan with Klee Anak Abi" -> "Soudan"
    const patterns = [
      new RegExp(`\\(\\s*${ne}\\s*\\)`, 'gi'),
      new RegExp(`\\[\\s*${ne}\\s*\\]`, 'gi'),
      new RegExp(`\\{\\s*${ne}\\s*\\}`, 'gi'),
      new RegExp(`\\s*[-–—|:]+\\s*${ne}\\s*$`, 'gi'),
      new RegExp(`\\s+with\\s+${ne}\\s*$`, 'gi'),
      new RegExp(`\\s+\\(${ne}\\)\\s*$`, 'gi'),
    ];

    for (const rx of patterns) {
      s = s.replace(rx, '');
    }

    // If the name is still present, remove it (best-effort) and clean separators.
    s = s.replace(new RegExp(ne, 'gi'), '').trim();
    s = s.replace(/\s{2,}/g, ' ').trim();
    s = s.replace(/[-–—|:]+$/g, '').trim();

    return s || 'No Title';
  }

  escapeRegExp(str) {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  truncate(str, max) {
    if (!str) return '';
    if (str.length <= max) return str;
    return str.slice(0, Math.max(0, max - 3)) + '...';
  }
}

module.exports = DiscordService;
