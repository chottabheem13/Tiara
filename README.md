# Discord Calendar Reminder Bot

Bot Discord yang terintegrasi dengan Google Calendar untuk mengirim reminder otomatis ke channel Discord tim Anda.

## Fitur

- 🔔 Mengirim reminder otomatis H-7, H-1, dan Hari H
- 📅 Integrasi dengan Google Calendar (shared calendar)
- ⏰ Scheduler otomatis dengan cron job
- 🎯 Customizable timezone
- 📝 Format pesan yang rapi dan informatif
- 🆕 **Notifikasi otomatis setiap ada jadwal baru ditambahkan**
- 📊 **Tracking event untuk mendeteksi perubahan**

## Persyaratan

- Node.js 18+ atau 20+
- Google Cloud Project dengan Calendar API enabled
- Discord Bot Token
- Google Service Account dengan akses ke shared calendar

## Instalasi

### 1. Clone atau Download Project

```bash
cd discord-calendar-bot
npm install
```

### 2. Setup Google Calendar API

#### A. Buat Google Cloud Project

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Buat project baru
3. Pilih project tersebut
4. Enable Google Calendar API:
   - Go to "APIs & Services" > "Library"
   - Cari "Google Calendar API"
   - Klik "Enable"

#### B. Buat Service Account

1. Go to "APIs & Services" > "Credentials"
2. Klik "Create Credentials" > "Service Account"
3. Isi form:
   - Service account name: `discord-calendar-bot`
   - Service account description: `Bot untuk reminder calendar`
4. Klik "Create and Continue"
5. Skip role assignment (klik "Done")
6. Klik pada service account yang baru dibuat
7. Go to tab "Keys"
8. Klik "Add Key" > "Create New Key"
9. Pilih "JSON" dan klik "Create"
10. File JSON akan terdownload

#### C. Setup File Credentials

1. Rename file JSON yang didownload menjadi `google-service-account.json`
2. Pindahkan file ke folder `credentials/`:
   ```
   discord-calendar-bot/
   └── credentials/
       └── google-service-account.json
   ```

#### D. Share Calendar ke Service Account

1. Buka file `google-service-account.json`
2. Copy nilai dari `client_email`
3. Buka Google Calendar yang ingin di-share
4. Klik "Settings" (gear icon) di calendar tersebut
5. Scroll ke "Share with specific people"
6. Klik "+ Add people"
7. Paste `client_email` dari service account
8. Set permission menjadi "See all event details"
9. Klik "Send"

#### E. Dapatkan Calendar ID

1. Buka [Google Calendar Settings](https://calendar.google.com/calendar/r/settings)
2. Pilih calendar yang ingin diintegrasikan
3. Scroll ke "Integrate calendar"
4. Copy "Calendar ID" (format: `email@example.com` atau `xxxxxx@group.calendar.google.com`)

### 3. Setup Discord Bot

#### A. Buat Discord Application

1. Buka [Discord Developer Portal](https://discord.com/developers/applications)
2. Klik "New Application"
3. Beri nama (contoh: "Calendar Reminder Bot")
4. Klik "Create"

#### B. Setup Bot User

1. Go to tab "Bot" di sidebar
2. Klik "Add Bot"
3. Konfirmasi dengan "Yes, do it!"
4. Di bagian "Privileged Gateway Intents", enable:
   - Message Content Intent
   - Server Members Intent (opsional)
5. Klik "Reset Token" dan copy **Bot Token**

#### C. Invite Bot ke Server

1. Go to tab "OAuth2" > "URL Generator"
2. Di scopes, pilih:
   - `bot`
   - `applications.commands`
3. Di bot permissions, pilih:
   - Send Messages
   - Read Messages/View Channels
   - Read Message History
4. Copy URL di bagian bawah
5. Paste di browser dan invite bot ke server
6. Pilih server dan klik "Authorize"

#### D. Dapatkan Channel ID

1. Buka Discord
2. Go to channel tempat reminder akan dikirim
3. Right-click pada channel
4. Pilih "Copy Link" untuk copy URL
5. Channel ID adalah bagian terakhir dari URL:
   - URL: `https://discord.com/channels/123456789/987654321`
   - Channel ID: `987654321`

### 4. Setup Environment Variables

1. Copy file `.env.example`:
```bash
cp .env.example .env
```

2. Edit file `.env` dan isi dengan credentials Anda:

**Opsi 1: Paste JSON langsung di .env (Lebih Mudah)**
```env
# Discord Bot Configuration
DISCORD_BOT_TOKEN=your_discord_bot_token_here
DISCORD_CHANNEL_ID=your_discord_channel_id_here

# Google Calendar Configuration
GOOGLE_CALENDAR_ID=your_calendar_id@example.com
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project","private_key_id":"xxx","private_key":"-----BEGIN PRIVATE KEY-----\nYourPrivateKeyHere\n-----END PRIVATE KEY-----\n","client_email":"your-service-account@your-project.iam.gserviceaccount.com","client_id":"xxx","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/your-service-account%40your-project.iam.gserviceaccount.com"}

# Reminder Configuration
REMINDER_CHANNEL_ID=your_discord_channel_id_here

# Optional: channel khusus untuk notifikasi event baru / booking baru
NEW_EVENT_CHANNEL_ID=your_discord_channel_id_here

# Timezone (default: Asia/Jakarta)
TIMEZONE=Asia/Jakarta
```

**Opsi 2: Via File JSON**
```env
# Discord Bot Configuration
DISCORD_BOT_TOKEN=your_discord_bot_token_here
DISCORD_CHANNEL_ID=your_discord_channel_id_here

# Google Calendar Configuration
GOOGLE_CALENDAR_ID=your_calendar_id@example.com
GOOGLE_SERVICE_ACCOUNT_KEY=./credentials/google-service-account.json

# Reminder Configuration
REMINDER_CHANNEL_ID=your_discord_channel_id_here

# Optional: channel khusus untuk notifikasi event baru / booking baru
NEW_EVENT_CHANNEL_ID=your_discord_channel_id_here

# Timezone (default: Asia/Jakarta)
TIMEZONE=Asia/Jakarta
```

**Tips:**
- Gunakan **Opsi 1** untuk deployment di Railway, VPS, atau container
- Gunakan **Opsi 2** untuk development lokal
- JSON harus dalam satu baris (hapus semua newline)

### 5. Jalankan Bot

```bash
# Development (auto-restart on changes)
npm run dev

# Production
npm start
```

## Schedule Reminder

Bot akan mengirim reminder otomatis pada waktu berikut (timezone sesuai config):

- **H-7**: Setiap hari jam 08:00
- **H-1**: Setiap hari jam 08:00
- **Hari H**: Setiap hari jam 07:00
- **🆕 New Event Detection**: Setiap 2 menit (hampir realtime)

### Notifikasi Event Baru

Bot akan otomatis mendeteksi dan mengirim notifikasi ke Discord setiap kali:
- Ada event baru ditambahkan di Google Calendar
- Notifikasi berisi detail event baru tersebut
- Tracking disimpan di `data/tracked-events.json`
- **First run**: tracker akan di-seed dengan event yang sudah ada (supaya tidak spam), lalu notifikasi hanya untuk event yang dibuat setelah bot jalan
- **Deteksi setiap 2 menit**, jadi notifikasi akan masuk maksimal 2 menit setelah event dibuat

## Testing

### Cara 1: Test Script (Recommended)

Jalankan test script yang akan:
1. Test koneksi Google Calendar API
2. Test koneksi Discord Bot
3. Kirim test message ke Discord
4. Tampilkan upcoming events

```bash
npm test
```

### Cara 2: Test Manual dengan Edit Kode

Edit `src/test.js` dan uncomment baris yang diinginkan:

```javascript
// Test semua reminder (H-7, H-1, Hari H)
await schedulerService.testAllReminders();

// Atau test spesifik:
await schedulerService.testReminder('H-7');   // Test H-7
await schedulerService.testReminder('H-1');   // Test H-1
await schedulerService.testReminder('Hari H'); // Test Hari H
```

Lalu jalankan:
```bash
npm test
```

### Cara 3: Test dengan Jadwal Palsu

Untuk test reminder tanpa menunggu schedule asli, edit `src/scheduler.js`:

```javascript
// Ubah schedule ke setiap menit untuk testing
const h7Task = cron.schedule('* * * * *', async () => {  // Setiap menit
  await this.runReminderTask('H-7', 7);
}, { timezone: this.config.app.timezone });
```

### Cara 4: Test Event Baru

Buat event baru di Google Calendar untuk:
- Besok (untuk test H-1)
- 7 hari lagi (untuk test H-7)
- Hari ini (untuk test Hari H)

Lalu jalankan test script:
```bash
npm test
```

## Deployment

### Railway

1. Push kode ke GitHub
2. Buka [railway.app](https://railway.app/)
3. Klik "New Project" > "Deploy from GitHub repo"
4. Pilih repository
5. Di tab "Variables", tambahkan semua environment variables dari `.env`
6. Upload file `google-service-account.json` sebagai secret (sebaiknyagunakan Railway secret storage)

### VPS (Linux)

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repo
git clone your-repo-url
cd discord-calendar-bot

# Install dependencies
npm install

# Install PM2 untuk process management
npm install -g pm2

# Start dengan PM2
pm2 start src/index.js --name calendar-bot
pm2 save
pm2 startup
```

### Docker (Optional)

Buat file `Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

CMD ["node", "src/index.js"]
```

Build dan run:

```bash
docker build -t discord-calendar-bot .
docker run -d --name calendar-bot --restart unless-stopped discord-calendar-bot
```

## Troubleshooting

### Bot tidak merespon di Discord

1. Pastikan bot sudah di-invite ke server
2. Pastikan bot memiliki permission "Send Messages"
3. Check token di `.env` sudah benar

### Error "Calendar is not found"

1. Pastikan calendar sudah di-share ke service account email
2. Check `GOOGLE_CALENDAR_ID` sudah benar
3. Pastikan permission service account adalah "See all event details"

### Error "Invalid Credentials"

1. Pastikan file `google-service-account.json` ada di folder `credentials/`
2. Check file tidak corrupt (bisa dibuka dengan text editor)

### Cron job tidak jalan

1. Check timezone sudah sesuai
2. Pastikan bot terus running (gunakan PM2 atau systemd)
3. Check log untuk error

## Struktur Project

```
src/
├── config.js       # Konfigurasi dan environment variables
├── calendar.js     # Google Calendar API integration
├── discord.js      # Discord bot client dan message formatter
├── scheduler.js    # Cron job untuk reminders
└── index.js        # Entry point
```

## License

MIT
