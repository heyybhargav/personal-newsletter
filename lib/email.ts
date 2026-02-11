import sgMail from '@sendgrid/mail';
import { DigestSection, ContentItem } from './types';
import { UnifiedBriefing } from './gemini';
import { format } from 'date-fns';

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// ============================================================================
// NEW: Unified Narrative Email Template
// ============================================================================

async function generateUnifiedEmailHTML(briefing: UnifiedBriefing, date: string): Promise<string> {
  const narrativeHTML = await formatNarrative(briefing.narrative);

  const linksHTML = briefing.topStories.map(item => `
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
        <a href="${item.link}" style="color: #000; text-decoration: none; font-weight: 600; font-family: 'Helvetica Neue', sans-serif; font-size: 15px;">
          ${item.title}
        </a>
        <br>
        <span style="color: #888; font-size: 13px; font-family: 'Helvetica Neue', sans-serif;">
          ${item.source}
        </span>
      </td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700;900&display=swap" rel="stylesheet">
      <style>
        body { margin: 0; padding: 0; background-color: #f4f4f4; -webkit-font-smoothing: antialiased; }
        .container { max-width: 600px; margin: 0 auto; background: #fff; }
        .narrative p { margin: 0 0 18px 0; }
        .narrative strong { color: #000; }
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f4;">

      <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td align="center" style="padding: 20px 0;">
            <table class="container" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; background: #ffffff; border: 1px solid #e0e0e0;">

              <!-- Header -->
              <tr>
                <td style="padding: 40px 30px 30px 30px; border-bottom: 4px solid #000; text-align: center;">
                  <h1 style="font-family: 'Merriweather', Georgia, serif; font-size: 28px; font-weight: 900; margin: 0; color: #000; letter-spacing: -1px;">
                    Signal
                  </h1>
                  <p style="font-family: 'Helvetica Neue', sans-serif; font-size: 13px; color: #888; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">
                    Daily Executive Briefing
                  </p>
                  <p style="font-family: 'Helvetica Neue', sans-serif; font-size: 13px; color: #888; margin: 10px 0 0 0; text-transform: uppercase; letter-spacing: 2px;">
                    ${date}
                  </p>
                </td>
              </tr>

              <!-- Main Narrative -->
              <tr>
                <td style="padding: 35px 30px;">
                  <div class="narrative" style="font-family: 'Georgia', 'Times New Roman', serif; font-size: 17px; line-height: 1.7; color: #222;">
                    ${narrativeHTML}
                  </div>
                </td>
              </tr>

              <!-- Divider -->
              <tr>
                <td style="padding: 0 30px;">
                  <hr style="border: none; border-top: 2px solid #000; margin: 0;">
                </td>
              </tr>

              <!-- Deep Dive Links -->
              <tr>
                <td style="padding: 30px;">
                  <h2 style="font-family: 'Helvetica Neue', sans-serif; font-size: 12px; font-weight: bold; color: #888; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 20px 0;">
                    📚 Deep Dive Links
                  </h2>
                  <table width="100%" border="0" cellpadding="0" cellspacing="0">
                    ${linksHTML}
                  </table>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 30px; background: #1a1a1a; text-align: center;">
                  <p style="font-family: 'Helvetica Neue', sans-serif; font-size: 14px; color: #fff; margin: 0;">
                    ☕ Crafted by your AI Chief of Staff
                  </p>
                  <p style="font-family: 'Helvetica Neue', sans-serif; font-size: 12px; color: #666; margin: 15px 0 0 0;">
                    Reply to this email with feedback. We read everything.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>

    </body>
    </html>
  `;
}

import { marked } from 'marked';

// Convert markdown-style formatting to HTML using marked
async function formatNarrative(text: string): Promise<string> {
  // Configure marked to not sanitize - assuming internal AI content is safe
  // and we need HTML features (like <img> tags in the prompt)
  const html = await marked.parse(text);

  // Add custom styling to paragraphs
  return html.replace(/<p>/g, '<p style="margin: 0 0 18px 0; font-family: \'Georgia\', serif; font-size: 17px; line-height: 1.6; color: #333;">')
    .replace(/<a /g, '<a style="color: #2563eb; text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 3px; display: inline-block; word-break: break-word;" ') // Mobile link fix v2
    .replace(/<li>/g, '<li style="margin-bottom: 8px;">')
    .replace(/<blockquote>/g, '<blockquote style="border-left: 4px solid #3b82f6; background: #f9f9f9; padding: 12px 16px; margin: 24px 0; font-style: italic; color: #444; border-radius: 0 4px 4px 0;">');
}

// ============================================================================
// NEW: Send Unified Digest Email
// ============================================================================

export async function sendUnifiedDigestEmail(to: string, briefing: UnifiedBriefing): Promise<void> {
  const today = format(new Date(), 'EEEE, MMMM d, yyyy');

  const fromEmail = process.env.SENDER_EMAIL || process.env.USER_EMAIL || to;

  const msg = {
    to,
    from: fromEmail,
    subject: `☕ Signal: Your Daily Briefing — ${today}`,
    html: await generateUnifiedEmailHTML(briefing, today),
  };

  try {
    await sgMail.send(msg);
    console.log(`[Email] Unified digest sent to ${to}`);
  } catch (error: any) {
    console.error('[Email] Error sending unified digest:', error);
    if (error.response) {
      console.error('[Email] SendGrid response:', error.response.body);
    }
    throw error;
  }
}

// ============================================================================
// LEGACY: Per-Section Email (kept for backward compatibility)
// ============================================================================

function generateEmailHTML(sections: DigestSection[], date: string): string {
  const sectionsHTML = sections.map(section => `
      <div style="margin-bottom: 40px; border-top: 2px solid #000; padding-top: 20px;">
        <h2 style="font-family: 'Merriweather', serif; font-size: 20px; font-weight: 900; color: #000; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px;">
          ${section.title}
        </h2>
        
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 20px;">
          ${formatNarrative(section.summary || '')}
        </div>

        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
            <p style="font-family: 'Helvetica Neue', sans-serif; font-size: 12px; font-weight: bold; color: #888; text-transform: uppercase; margin: 0 0 10px 0;">
                DEEP DIVE SOURCES
            </p>
            <ul style="list-style: none; padding: 0; margin: 0;">
                ${section.items.map(item => `
                    <li style="margin-bottom: 10px; padding-left: 0;">
                        <a href="${item.link}" style="color: #2563eb; text-decoration: none; font-weight: 600; font-family: 'Helvetica Neue', sans-serif; font-size: 15px;">
                            ${item.title}
                        </a>
                        <span style="color: #666; font-size: 13px; font-family: 'Helvetica Neue', sans-serif;">
                            — ${item.source}
                        </span>
                    </li>
                `).join('')}
            </ul>
        </div>
      </div>
    `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700;900&display=swap" rel="stylesheet">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f4; -webkit-font-smoothing: antialiased;">
      
      <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td align="center" style="padding: 20px 0;">
            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; background: #ffffff; border: 1px solid #e0e0e0;">
              
              <tr>
                <td style="padding: 40px 30px; border-bottom: 4px solid #000; text-align: center;">
                    <h1 style="font-family: 'Merriweather', serif; font-size: 32px; font-weight: 900; margin: 0; color: #000; letter-spacing: -1px;">
                        The Daily Brief
                    </h1>
                    <p style="font-family: 'Helvetica Neue', sans-serif; font-size: 14px; color: #666; margin: 10px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">
                        ${date} • Prepared for You
                    </p>
                </td>
              </tr>

              <tr>
                <td style="padding: 30px;">
                    ${sectionsHTML}
                </td>
              </tr>

              <tr>
                <td style="padding: 30px; background: #000; color: #fff; text-align: center;">
                    <p style="font-family: 'Helvetica Neue', sans-serif; font-size: 14px; margin: 0;">
                        Generated by Your Personal AI Chief of Staff
                    </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>

    </body>
    </html>
  `;
}

export async function sendDigestEmail(to: string, sections: DigestSection[]): Promise<void> {
  const today = format(new Date(), 'EEEE, MMMM d, yyyy');

  const fromEmail = process.env.SENDER_EMAIL || process.env.USER_EMAIL || to;

  const msg = {
    to,
    from: fromEmail,
    subject: `☕️ Your Daily Briefing - ${today}`,
    html: generateEmailHTML(sections, today),
  };

  try {
    await sgMail.send(msg);
    console.log(`Digest email sent to ${to}`);
  } catch (error: any) {
    console.error('Error sending email:', error);
    if (error.response) {
      console.error(error.response.body);
    }
    throw error;
  }
}

// ============================================================================
// NEW: Welcome Email
// ============================================================================

export async function sendWelcomeEmail(to: string): Promise<void> {
  const fromEmail = process.env.SENDER_EMAIL || process.env.USER_EMAIL || to; // Fallback

  const subject = "Welcome to Signal";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700;900&display=swap" rel="stylesheet">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f4; -webkit-font-smoothing: antialiased;">
      
      <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 500px; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
              
              <!-- Header -->
              <tr>
                <td style="padding: 40px 40px 20px 40px; text-align: center;">
                  <h1 style="font-family: 'Merriweather', serif; font-size: 28px; font-weight: 900; margin: 0; color: #111; letter-spacing: -0.5px;">
                    Signal.
                  </h1>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding: 0 40px 40px 40px;">
                  <p style="font-family: 'Helvetica Neue', sans-serif; font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 20px;">
                    Welcome to the quiet side of the internet.
                  </p>
                  <p style="font-family: 'Helvetica Neue', sans-serif; font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 20px;">
                    You are now subscribed to <strong>Signal</strong>. Every morning at 8 AM, our AI editor reads hundreds of sources to bring you the one story that matters.
                  </p>
                  <p style="font-family: 'Helvetica Neue', sans-serif; font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 20px;">
                    No noise. No clickbait. Just signal.
                  </p>
                  <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 30px 0; text-align: center;">
                      <p style="font-family: 'Helvetica Neue', sans-serif; font-size: 14px; color: #666; margin: 0;">
                        Next briefing: <strong>Tomorrow, 8:00 AM</strong>
                      </p>
                  </div>
                  <p style="font-family: 'Helvetica Neue', sans-serif; font-size: 16px; line-height: 1.6; color: #333;">
                    Glad to have you.<br>
                    — Bhargav
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 20px; background: #111; text-align: center;">
                  <p style="font-family: 'Helvetica Neue', sans-serif; font-size: 12px; color: #888; margin: 0;">
                    © ${new Date().getFullYear()} Signal. Open Source.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>

    </body>
    </html>
  `;

  const msg = {
    to,
    from: fromEmail,
    subject,
    html,
  };

  try {
    await sgMail.send(msg);
    console.log(`[Email] Welcome email sent to ${to}`);
  } catch (error: any) {
    console.error('[Email] Error sending welcome email:', error);
    if (error.response) {
      console.error('[Email] SendGrid response:', error.response.body);
    }
    // Don't throw, just log. We don't want to block login if email fails.
  }
}
