# Daily Email Digest System

A personalized daily email digest that aggregates content from your favorite sources (YouTube, podcasts, news, Reddit) and delivers AI-summarized updates to your inbox every morning.

## Features

- 📚 Multi-source RSS aggregation (YouTube, podcasts, news, Reddit)
- 🤖 AI-powered summarization using Gemini
- 📧 Beautiful HTML email delivery via SendPulse
- ⏰ Automated daily scheduling with Vercel Cron
- 🎨 Modern, responsive web interface
- 💰 100% free - uses only free tier services

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Database**: JSON file storage
- **AI**: Google Gemini API (free tier)
- **Email**: SendPulse (free tier, 12000/month)
- **Hosting**: Vercel (free tier)
- **Scheduling**: Vercel Cron (Hourly global check)

## Prerequisites

1. Groq API key (for AI)
2. SendPulse API ID & Secret (for email)
3. Verified sender email in SendPulse

## Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local` file:
   ```env
   GEMINI_API_KEY=your_gemini_key
   SENDPULSE_API_ID=your_sendpulse_id
   SENDPULSE_API_SECRET=your_sendpulse_secret
   USER_EMAIL=your_email@example.com
   DELIVERY_TIME=08:00
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Deployment

### 1. SendPulse Setup

1. Go to [SendPulse Sender Authentication](https://login.sendpulse.com/emailservice/settings/)
2. Go to "Sender emails" and add your email.
3. Enter your email and verify it.
4. Go to API section and enable REST API. Copy the ID and Secret.
5. Use this verified email and credentials in your environment variables.

### 2. Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/email-digest)

Or manually:

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables:
   - `GEMINI_API_KEY`
   - `SENDPULSE_API_ID`
   - `SENDPULSE_API_SECRET`
   - `USER_EMAIL`
   - `DELIVERY_TIME`
5. Deploy!

The cron job will automatically run daily at your specified time.

## Usage

### Adding Sources

1. Go to `/sources`
2. Click "Add New Source"
3. Enter details:
   - **YouTube**: `https://www.youtube.com/feeds/videos.xml?channel_id=CHANNEL_ID`
   - **Podcast**: Copy RSS URL from podcast app
   - **News**: Usually `website.com/feed/` or `/rss`
   - **Reddit**: `https://www.reddit.com/r/SUBREDDIT/.rss`

### Testing

- **Preview Digest**: Click "Preview Digest" on dashboard
- **Send Test Email**: Click "Send Test Email" on dashboard
- **Manual Trigger**: Visit `/api/cron` to manually trigger digest

## API Routes

- `GET /api/sources` - List sources
- `POST /api/sources` - Add source
- `DELETE /api/sources?id=X` - Delete source
- `GET /api/digest` - Preview digest
- `POST /api/digest` - Generate and send digest
- `GET /api/cron` - Cron endpoint (auto-triggered daily)
- `GET/POST /api/settings` - Get/update settings

## License

MIT
 
