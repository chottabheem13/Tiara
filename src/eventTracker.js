const fs = require('fs');
const path = require('path');

/**
 * EventTracker - Melacak event yang sudah ada untuk mendeteksi event baru
 */
class EventTracker {
  constructor(dataDir = './data') {
    this.dataDir = dataDir;
    this.trackerFile = path.join(dataDir, 'tracked-events.json');
    this.trackedEvents = new Map(); // eventId -> event data
    this.isFreshStart = false; // true if no tracker file existed at startup
  }

  /**
   * Inisialisasi tracker
   */
  async initialize() {
    try {
      // Buat folder data jika belum ada
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      // Load data yang sudah ada
      await this.load();

      console.log(`✅ EventTracker initialized with ${this.trackedEvents.size} tracked events`);
    } catch (error) {
      console.error('❌ Failed to initialize EventTracker:', error.message);
      throw error;
    }
  }

  /**
   * Load tracked events dari file
   */
  async load() {
    const trackerExists = fs.existsSync(this.trackerFile);
    this.isFreshStart = !trackerExists;
    try {
      if (trackerExists) {
        const data = fs.readFileSync(this.trackerFile, 'utf8');
        const events = JSON.parse(data);
        this.trackedEvents = new Map(Object.entries(events));
        console.log(`📂 Loaded ${this.trackedEvents.size} tracked events from file`);
      } else {
        console.log('📂 No existing tracker file found, starting fresh');
        this.trackedEvents = new Map();
      }
    } catch (error) {
      this.isFreshStart = false;
      console.error('❌ Error loading tracker file:', error.message);
      this.trackedEvents = new Map();
    }
  }

  /**
   * Save tracked events ke file
   */
  async save() {
    try {
      const data = Object.fromEntries(this.trackedEvents);
      fs.writeFileSync(this.trackerFile, JSON.stringify(data, null, 2));
      console.log(`💾 Saved ${this.trackedEvents.size} tracked events to file`);
    } catch (error) {
      console.error('❌ Error saving tracker file:', error.message);
    }
  }

  /**
   * Cek event baru dan kembalikan event yang belum ter-track
   * @param {Array} events - List of events from calendar
   * @returns {Array} List of new events
   */
  async checkNewEvents(events) {
    const newEvents = [];

    for (const event of events) {
      const eventId = event.id;

      // Cek apakah event sudah di-track
      if (!this.trackedEvents.has(eventId)) {
        // Event baru ditemukan!
        newEvents.push(event);

        // Tambahkan ke tracker
        this.trackedEvents.set(eventId, {
          id: event.id,
          summary: event.summary,
          start: event.start.toISOString(),
          created: event.created,
          firstSeen: new Date().toISOString(),
        });
      }
    }

    // Simpan jika ada event baru
    if (newEvents.length > 0) {
      await this.save();
    }

    return newEvents;
  }

  /**
   * Dapatkan semua event yang sedang di-track
   * @returns {Array} List of tracked events
   */
  getTrackedEvents() {
    return Array.from(this.trackedEvents.values());
  }

  /**
   * Hapus event dari tracker (opsional, untuk cleanup)
   * @param {string} eventId - Event ID to remove
   */
  async removeEvent(eventId) {
    if (this.trackedEvents.has(eventId)) {
      this.trackedEvents.delete(eventId);
      await this.save();
      console.log(`🗑️  Removed event ${eventId} from tracker`);
    }
  }

  /**
   * Cleanup event-event lama (opsional)
   * @param {number} daysOld - Hapus event yang lebih lama dari x hari
   */
  async cleanupOldEvents(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    let removedCount = 0;

    for (const [eventId, eventData] of this.trackedEvents.entries()) {
      const eventDate = new Date(eventData.start);

      // Hapus event yang sudah lewat dan cukup lama
      if (eventDate < cutoffDate) {
        this.trackedEvents.delete(eventId);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      await this.save();
      console.log(`🧹 Cleaned up ${removedCount} old events from tracker`);
    }

    return removedCount;
  }
}

/**
 * Seed tracker with current calendar events WITHOUT sending notifications.
 * This prevents flooding Discord on first deploy/run.
 */
EventTracker.prototype.seed = async function seed(events) {
  if (!events || events.length === 0) {
    this.isFreshStart = false;
    return 0;
  }

  let added = 0;
  for (const event of events) {
    const eventId = event?.id;
    if (!eventId) continue;
    if (this.trackedEvents.has(eventId)) continue;

    this.trackedEvents.set(eventId, {
      id: event.id,
      summary: event.summary,
      start: event.start?.toISOString?.() || '',
      created: event.created,
      firstSeen: new Date().toISOString(),
      seeded: true,
    });
    added++;
  }

  if (added > 0) {
    await this.save();
  }

  this.isFreshStart = false;
  return added;
};

module.exports = EventTracker;
