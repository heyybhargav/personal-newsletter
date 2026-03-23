import { DigestSection, ContentItem } from './types';
import { UnifiedBriefing } from './gemini';
import { format } from 'date-fns';
import { SITE_URL, CONTACT_EMAIL, SENDER_NAME } from './config';

let sendpulseToken: string | null = null;
let tokenExpiresAt: number = 0;

async function getSendPulseToken(): Promise<string> {
  if (sendpulseToken && Date.now() < tokenExpiresAt) {
    return sendpulseToken;
  }

  const res = await fetch('https://api.sendpulse.com/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: process.env.SENDPULSE_API_ID,
      client_secret: process.env.SENDPULSE_API_SECRET,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to get SendPulse token: ${text}`);
  }

  const data = await res.json();
  sendpulseToken = data.access_token;
  // SendPulse tokens usually expire in 3600 seconds. Buffer by 5 minutes.
  tokenExpiresAt = Date.now() + (data.expires_in - 300) * 1000;
  return sendpulseToken as string;
}

async function sendPulseEmail(msg: any) {
  const token = await getSendPulseToken();
  
  const spMsg = {
    email: {
      html: Buffer.from(msg.html || '', 'utf-8').toString('base64'),
      text: msg.text || 'Please view this email in an HTML compatible client.',
      subject: msg.subject,
      from: {
        name: msg.from.name,
        email: msg.from.email
      },
      to: [
        {
          email: msg.to
        }
      ]
    }
  };

  const res = await fetch('https://api.sendpulse.com/smtp/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(spMsg),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to send email via SendPulse: ${text}`);
  }
}

// ============================================================================
// NEW: Unified Narrative Email Template
// ============================================================================

export interface TrialContext {
  isTrial: boolean;
  trialDaysRemaining: number;
}

function generateHeaderHTML(title: string, subtitle: string, dateText?: string, isDark: boolean = true): string {
  const bgColor = isDark ? '#111111' : '#F9F9F9';
  const metaColor = isDark ? '#999999' : '#888888';
  const textColor = metaColor; // Standardize all to date line color
  const subTextColor = metaColor;
  const subtitleColor = metaColor;

  return `
    <tr>
      <td class="header-bg" style="padding: 50px 30px 40px 30px; background-color: ${bgColor}; background-image: linear-gradient(${bgColor}, ${bgColor}); text-align: center;" bgcolor="${bgColor}">
        <p class="header-text" style="font-family: 'Merriweather', Georgia, serif; font-size: 32px; font-weight: 900; margin: 0; color: ${textColor}; letter-spacing: -1px;">
          <span style="color: ${textColor} !important;">${title}</span>
        </p>
        <p class="header-subtitle" style="font-family: 'Inter', -apple-system, sans-serif; font-size: 11px; color: ${subTextColor}; margin: 12px 0 0 0; text-transform: uppercase; letter-spacing: 3px; font-weight: 600;">
          <span style="color: ${subTextColor} !important;">${subtitle}</span>
        </p>
        ${dateText ? `
        <p class="header-meta" style="font-family: 'Inter', -apple-system, sans-serif; font-size: 11px; color: ${metaColor}; margin: 8px 0 0 0; text-transform: uppercase; letter-spacing: 2px;">
          <span style="color: ${metaColor} !important;">${dateText}</span>
        </p>
        ` : ''}
      </td>
    </tr>
  `;
}

function generateFooterHTML(): string {
  const bgColor = '#111111';
  const metaColor = '#999999';
  const textColor = metaColor;
  const subTextColor = metaColor;
  const mutedColor = metaColor;

  return `
    <tr>
      <td class="footer-bg" style="padding: 30px 30px 10px 30px; background-color: ${bgColor}; background-image: linear-gradient(${bgColor}, ${bgColor}); text-align: center;" bgcolor="${bgColor}">
        <p class="footer-text" style="font-family: 'Inter', -apple-system, sans-serif; font-size: 13px; font-weight: bold; color: ${textColor}; margin: 0; letter-spacing: 1px; text-transform: uppercase;">
          <span style="color: ${textColor} !important;">Siftl</span>
        </p>
        <p class="footer-subtext" style="font-family: 'Inter', -apple-system, sans-serif; font-size: 12px; color: ${subTextColor}; margin: 15px 0 0 0; line-height: 1.5;">
          <span style="color: ${subTextColor} !important;">Everything you need to know.<br>Reply to this email with feedback. Everything is read.</span>
        </p>
        <p class="footer-muted" style="font-family: 'Inter', -apple-system, sans-serif; font-size: 11px; color: ${mutedColor}; margin: 20px 0 0 0;">
          <a href="${SITE_URL}/settings" style="color: ${mutedColor} !important; text-decoration: underline;">Pause briefings.</a>
        </p>
      </td>
    </tr>
    <!-- Ultimate bottom seal: prevents white strip in all clients -->
    <tr>
      <td class="footer-bg" style="height: 40px; background-color: #111111;" bgcolor="#111111">&nbsp;</td>
    </tr>
  `;
}

async function generateUnifiedEmailHTML(briefing: UnifiedBriefing, date: string, trialContext?: TrialContext): Promise<string> {
  const narrativeHTML = await formatNarrative(briefing.narrative);

  const linksHTML = briefing.topStories.map(item => `
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
        <a href="${item.link}" style="color: #000; text-decoration: none; font-weight: 600; font-family: 'Inter', -apple-system, sans-serif; font-size: 15px;">
          ${item.title}
        </a>
        <br>
        <span style="color: #888; font-size: 13px; font-family: 'Inter', -apple-system, sans-serif;">
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
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;family=Merriweather:wght@300;400;700;900&amp;display=swap" rel="stylesheet">
      <style>
        body { margin: 0; padding: 0; background-color: #111111; -webkit-font-smoothing: antialiased; }
        .container { max-width: 600px; margin: 0 auto; }
        .narrative p { margin: 0 0 18px 0; }
        .narrative strong { color: #000; }

        /* General Dark Mode CSS (Android/iOS) */
        @media (prefers-color-scheme: dark) {
          .header-bg, .footer-bg { background-color: #111111 !important; background-image: linear-gradient(#111111, #111111) !important; }
          .header-text, .footer-text, .header-subtitle, .footer-subtext, .header-meta, .footer-muted { color: #999999 !important; }
          /* Removed global container bg */
          .narrative, .narrative p { color: #dddddd !important; }
        }

        /* Gmail-Specific Inversion Overrides */
        u + .body .header-bg, u + .body .footer-bg { background-color: #111111 !important; background-image: linear-gradient(#111111, #111111) !important; }
        u + .body .header-text, u + .body .footer-text, u + .body .header-subtitle, u + .body .footer-subtext, u + .body .header-meta, u + .body .footer-muted { color: #999999 !important; }
      </style>
    </head>
    <body class="body" style="margin: 0; padding: 0; background-color: #111111;">

      <!-- PREHEADER HACK (Hidden preview text) -->
      <div style="display: none; max-height: 0px; overflow: hidden; opacity: 0; mso-hide: all; font-size: 0px; line-height: 0px;">
        ${briefing.preheader || 'Your Daily Executive Intelligence Briefing.'}
        &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
      </div>

      <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse: collapse; background-color: #111111;" bgcolor="#111111">
        <tr>
          <td align="center" style="vertical-align: top; background-color: #111111;" bgcolor="#111111">
            <table class="container" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; border-collapse: collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;">

              <!-- Header -->
              ${generateHeaderHTML('Siftl', 'Everything you need to know today', date)}

              <!-- Main Narrative -->
              <tr>
                <td style="padding: 35px 30px; background-color: #ffffff;" bgcolor="#ffffff">
                  <div class="narrative" style="font-family: 'Inter', -apple-system, sans-serif; font-size: 16px; line-height: 1.7; color: #222;">
                    ${narrativeHTML}
                  </div>
                </td>
              </tr>

              <!-- Divider -->
              <tr>
                <td style="padding: 0 30px; background-color: #ffffff;">
                  <hr style="border: none; border-top: 2px solid #000; margin: 0;">
                </td>
              </tr>

              <!-- Deep Dive Links -->
              <tr>
                <td style="padding: 30px; background-color: #ffffff;" bgcolor="#ffffff">
                  <h2 style="font-family: 'Inter', -apple-system, sans-serif; font-size: 12px; font-weight: bold; color: #888; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 20px 0;">
                    📚 Deep Dive Links
                  </h2>
                  <table width="100%" border="0" cellpadding="0" cellspacing="0">
                    ${linksHTML}
                  </table>
                </td>
              </tr>

              ${trialContext?.isTrial ? `
              <!-- Trial Banner -->
              <tr>
                <td style="padding: 15px 30px; background: #FFF8F0; text-align: center; border-top: 1px solid #FFE0C0;">
                  <p style="font-family: 'Inter', -apple-system, sans-serif; font-size: 13px; color: #B45309; margin: 0; font-weight: 500;">
                    📡 Free trial: ${trialContext.trialDaysRemaining} day${trialContext.trialDaysRemaining === 1 ? '' : 's'} remaining &middot; 
                    <a href="${SITE_URL}/pricing" style="color: #FF5700; font-weight: bold; text-decoration: none;">Subscribe now</a>
                  </p>
                </td>
              </tr>
              ` : ''}

              <!-- Footer -->
              ${generateFooterHTML()}</table></td></tr></table></body>
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
  return html.replace(/<p>/g, '<p style="margin: 0 0 18px 0; font-family: \'Inter\', -apple-system, sans-serif; font-size: 16px; line-height: 1.6; color: #333; overflow-wrap: break-word;">')
    .replace(/<a (?!style=)/g, '<a style="color: #2563eb; text-decoration: underline; text-underline-offset: 3px; display: inline; word-break: break-word; overflow-wrap: anywhere;" ')
    .replace(/<li>/g, '<li style="margin-bottom: 8px; overflow-wrap: break-word;">')
    .replace(/blockquote/g, '<blockquote style="border-left: 4px solid #3b82f6; background: #f9f9f9; padding: 12px 16px; margin: 24px 0; font-style: italic; color: #444; border-radius: 0 4px 4px 0; overflow-wrap: break-word;">');
}

// ============================================================================
// NEW: Send Unified Digest Email
// ============================================================================

export async function sendUnifiedDigestEmail(to: string, briefing: UnifiedBriefing, trialContext?: TrialContext): Promise<void> {
  const today = format(new Date(), 'EEEE, MMMM d, yyyy');

  const fromEmail = process.env.SENDER_EMAIL || process.env.USER_EMAIL || to;

  const msg = {
    to,
    from: { email: fromEmail, name: process.env.SENDER_NAME || 'Siftl' },
    subject: briefing.subject || `☕ Siftl: Your Daily Briefing | ${today}`,
    html: await generateUnifiedEmailHTML(briefing, today, trialContext),
  };

  try {
    await sendPulseEmail(msg);
    console.log(`[Email] Unified digest sent to ${to}`);
  } catch (error: any) {
    console.error('[Email] Error sending unified digest:', error);
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
        
        <div style="font-family: 'Inter', -apple-system, sans-serif; font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 20px;">
          ${formatNarrative(section.summary || '')}
        </div>

        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
            <p style="font-family: 'Inter', -apple-system, sans-serif; font-size: 12px; font-weight: bold; color: #888; text-transform: uppercase; margin: 0 0 10px 0;">
                DEEP DIVE SOURCES
            </p>
            <ul style="list-style: none; padding: 0; margin: 0;">
                ${section.items.map(item => `
                    <li style="margin-bottom: 10px; padding-left: 0;">
                        <a href="${item.link}" style="color: #2563eb; text-decoration: none; font-weight: 600; font-family: 'Inter', -apple-system, sans-serif; font-size: 15px;">
                            ${item.title}
                        </a>
                        <span style="color: #666; font-size: 13px; font-family: 'Inter', -apple-system, sans-serif;">
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
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;family=Merriweather:wght@300;400;700;900&amp;display=swap" rel="stylesheet">
    </head>
    <body style="margin: 0; padding: 0; background-color: #111111; -webkit-font-smoothing: antialiased;">
      
      <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse: collapse; background-color: #111111;" bgcolor="#111111">
        <tr>
          <td align="center" style="vertical-align: top; background-color: #111111;" bgcolor="#111111">
            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; border-collapse: collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;">
              
              <!-- Header -->
              ${generateHeaderHTML('The Daily Brief', 'Everything you need to know today', `${date} • Prepared for You`)}

              <tr>
                <td style="padding: 30px; background-color: #ffffff;" bgcolor="#ffffff" bgcolor="#ffffff">
                    ${sectionsHTML}
                </td>
              </tr>

              ${generateFooterHTML()}</table></td></tr></table></body>
    </html>
  `;
}

export async function sendDigestEmail(to: string, sections: DigestSection[]): Promise<void> {
  const today = format(new Date(), 'EEEE, MMMM d, yyyy');

  const fromEmail = process.env.SENDER_EMAIL || process.env.USER_EMAIL || to;

  const msg = {
    to,
    from: { email: fromEmail, name: process.env.SENDER_NAME || 'Siftl' },
    subject: `☕️ Your Daily Briefing - ${today}`,
    html: generateEmailHTML(sections, today),
  };

  try {
    await sendPulseEmail(msg);
    console.log(`Digest email sent to ${to}`);
  } catch (error: any) {
    console.error('Error sending email:', error);
    throw error;
  }
}

// ============================================================================
// NEW: Trial Nudges & Welcome Emails
// ============================================================================

export async function sendTrialNudgeEmail(to: string, type: 'expiring_soon' | 'expired' | 'miss_you', stats: { daysRemaining?: number, totalSources: number, briefingsSent?: number }): Promise<void> {
  const fromEmail = process.env.SENDER_EMAIL || process.env.USER_EMAIL || to;
  let subject = '';
  let title = '';
  let message = '';

  if (type === 'expiring_soon') {
    subject = `Your Siftl trial ends in ${stats.daysRemaining} days`;
    title = 'Your trial is ending soon';
    message = `You've received ${stats.briefingsSent || 0} briefings so far. Subscribe to keep your daily intelligence flowing from your ${stats.totalSources} sources without interruption.`;
  } else if (type === 'expired') {
    subject = 'Your Siftl trial has ended';
    title = 'Your trial has ended';
    message = `Your trial is over, but your ${stats.totalSources} sources are saved perfectly. Subscribe for $5/mo to resume your daily briefings immediately.`;
  } else if (type === 'miss_you') {
    subject = 'We miss you — Siftl';
    title = 'Still want your briefings?';
    message = `It's been a week since your trial ended. Your ${stats.totalSources} sources are still waiting for you. Come back and resume your signal for $5/mo.`;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Merriweather:wght@300;400;700;900&display=swap" rel="stylesheet">
      <style>
        .cta-button { display: inline-block; background-color: #FF5700; color: #ffffff !important; padding: 16px 32px; border-radius: 50px; text-decoration: none; font-family: 'Inter', -apple-system, sans-serif; font-size: 16px; font-weight: bold; letter-spacing: 0.5px; }

        /* General Dark Mode CSS (Android/iOS) */
        @media (prefers-color-scheme: dark) {
          .header-bg, .footer-bg { background-color: #111111 !important; background-image: linear-gradient(#111111, #111111) !important; }
          .header-text, .footer-text, .header-subtitle, .footer-subtext, .header-meta, .footer-muted { color: #999999 !important; }
        }

        /* Gmail-Specific Inversion Overrides */
        u + .body .header-bg, u + .body .footer-bg { background-color: #111111 !important; background-image: linear-gradient(#111111, #111111) !important; }
        u + .body .header-text, u + .body .footer-text, u + .body .header-subtitle, u + .body .footer-subtext, u + .body .header-meta, u + .body .footer-muted { color: #999999 !important; }
      </style>
    </head>
    <body class="body" style="margin: 0; padding: 0; background-color: #111111; -webkit-font-smoothing: antialiased;">
      <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse: collapse; background-color: #111111;" bgcolor="#111111">
        <tr>
          <td align="center" style="vertical-align: top; background-color: #111111;" bgcolor="#111111">
            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 500px; border-collapse: collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; overflow: hidden; background-color: #111111;" bgcolor="#111111">
              <!-- Header -->
              ${generateHeaderHTML('Siftl', 'Your Intelligence Progress', undefined, true)}
              <tr>
                <td style="padding: 40px; text-align: center; background-color: #ffffff;">
                  <h2 style="font-family: 'Merriweather', serif; font-size: 24px; font-weight: 700; color: #111; margin: 0 0 20px 0;">${title}</h2>
                  <p style="font-family: 'Inter', -apple-system, sans-serif; font-size: 17px; line-height: 1.6; color: #444; margin-bottom: 40px;">${message}</p>
                  <a href="${SITE_URL}/pricing" class="cta-button">Subscribe to Siftl →</a>
                </td>
              </tr>
              <!-- Footer -->
              ${generateFooterHTML()}</table></td></tr></table></body>
    </html>
  `;

  const msg = {
    to,
    from: { email: fromEmail, name: process.env.SENDER_NAME || 'Siftl' },
    subject,
    html,
  };

  try {
    await sendPulseEmail(msg);
    console.log(`[Email] Trial nudge (${type}) sent to ${to}`);
  } catch (error: any) {
    console.error(`[Email] Error sending trial nudge to ${to}:`, error);
  }
}

export async function sendWelcomeEmail(to: string, baseUrl: string = SITE_URL, context?: { isTrial?: boolean, trialDays?: number, name?: string }): Promise<void> {
  const fromEmail = process.env.SENDER_EMAIL || process.env.USER_EMAIL || to;
  const subject = "Bhargav from Siftl: Welcome! Let's set up your briefing.";
  const link = `${baseUrl}/sources`;
  const name = context?.name;
  const firstName = name ? name.split(' ')[0] : 'there';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;family=Merriweather:wght@300;400;700;900&amp;display=swap" rel="stylesheet">
      <style>
        .step-container { margin-bottom: 30px; }
        .step-number { font-family: 'Inter', -apple-system, sans-serif; font-size: 12px; font-weight: bold; color: #ff5700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; }
        .step-title { font-family: 'Inter', -apple-system, sans-serif; font-size: 18px; font-weight: 700; color: #111; margin: 0 0 5px 0; }
        .step-desc { font-family: 'Inter', -apple-system, sans-serif; font-size: 15px; line-height: 1.6; color: #444; margin: 0; }
        .cta-button { display: inline-block; background-color: #111; color: #ffffff !important; padding: 16px 32px; border-radius: 50px; text-decoration: none; font-family: 'Inter', -apple-system, sans-serif; font-size: 16px; font-weight: bold; letter-spacing: 0.5px; }

        /* General Dark Mode CSS (Android/iOS) */
        @media (prefers-color-scheme: dark) {
          .header-bg, .footer-bg { background-color: #111111 !important; background-image: linear-gradient(#111111, #111111) !important; }
          .header-text, .footer-text, .header-subtitle, .footer-subtext, .header-meta, .footer-muted { color: #999999 !important; }
        }

        /* Standard body background fix */
        body, .body { background-color: #111111 !important; margin: 0; padding: 0; }

        /* Gmail-Specific Inversion Overrides */
        u + .body .header-bg, u + .body .footer-bg { background-color: #111111 !important; background-image: linear-gradient(#111111, #111111) !important; }
        u + .body .header-text, u + .body .footer-text, u + .body .header-subtitle, u + .body .footer-subtext, u + .body .header-meta, u + .body .footer-muted { color: #999999 !important; }
      </style>
    </head>
    <body class="body" style="margin: 0; padding: 0; background-color: #111111; -webkit-font-smoothing: antialiased;">
      
      <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse: collapse; background-color: #111111;" bgcolor="#111111">
        <tr>
          <td align="center" style="vertical-align: top; background-color: #111111;" bgcolor="#111111">
            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 500px; border-collapse: collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; overflow: hidden; background-color: #111111;" bgcolor="#111111">
              
              <!-- Header -->
              ${generateHeaderHTML('Siftl', 'The quiet side of the internet', undefined, true)}

              <!-- Body -->
              <tr>
                <td style="padding: 40px; background-color: #ffffff;">
                  <p style="font-family: 'Inter', -apple-system, sans-serif; font-size: 15px; line-height: 1.6; color: #444; margin-bottom: 30px;">
                    Hey ${firstName},
                  </p>
                  <p style="font-family: 'Inter', -apple-system, sans-serif; font-size: 15px; line-height: 1.6; color: #444; margin-bottom: 30px;">
                    ${context?.isTrial ? `Welcome to your ${context.trialDays}-day free trial of Siftl.` : 'Welcome to the quiet side of the internet.'}
                  </p>
                  <p style="font-family: 'Inter', -apple-system, sans-serif; font-size: 15px; line-height: 1.6; color: #444; margin-bottom: 40px;">
                    ${context?.isTrial ? `Full access is available for the next ${context.trialDays} days. Here is how to get the most out of it:` : 'You’ve joined a small group of readers who prefer insight over noise. Here is how to get the most out of Siftl:'}
                  </p>

                  <!-- Steps -->
                  <div class="step-container">
                    <p class="step-number">01 Curate</p>
                    <h3 class="step-title">Connect your world.</h3>
                    <p class="step-desc">Pick from the curated <strong>Starter Packs</strong> (Tech, AI, Finance) or add favorite links. Siftl monitors them for you.</p>
                  </div>

                  <div class="step-container">
                    <p class="step-number">02 Schedule</p>
                    <h3 class="step-title">Set your time.</h3>
                    <p class="step-desc">Your inbox, your schedule. Briefings are sent exactly when you want them. No sooner, no later.</p>
                  </div>

                  <div class="step-container" style="margin-bottom: 0;">
                    <p class="step-number">03 Siftl</p>
                    <h3 class="step-title">Receive the Siftl.</h3>
                    <p class="step-desc">Key updates are extracted from all followed sources. You get the information without the clicking.</p>
                  </div>

                  <div style="margin: 40px 0 10px 0; text-align: center;">
                      <a href="${link}" class="cta-button">
                        Connect Your Sources &rarr;
                      </a>
                      <p style="font-family: 'Inter', -apple-system, sans-serif; font-size: 13px; color: #888; text-align: center; margin-top: 20px; margin-bottom: 0;">
                        Connect your sources now to start receiving your briefing from tomorrow.
                      </p>
                  </div>

                  <p style="font-family: 'Inter', -apple-system, sans-serif; font-size: 15px; line-height: 1.6; color: #444; margin-top: 40px; margin-bottom: 0;">
                    Best,<br>
                    Bhargav
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              ${generateFooterHTML()}</table></td></tr></table></body>
    </html>
  `;

  const msg = {
    to,
    from: { email: fromEmail, name: process.env.SENDER_NAME || 'Siftl' },
    subject,
    html,
  };

  try {
    await sendPulseEmail(msg);
    console.log(`[Email] Welcome email sent to ${to}`);
  } catch (error: any) {
    console.error('[Email] Error sending welcome email:', error);
    // Don't throw, just log. We don't want to block login if email fails.
  }
}
// ============================================================================
// NEW: Admin Alert Emails
// ============================================================================

export async function sendAdminAlertEmail(stage: string, error: string, details?: any): Promise<void> {
  const adminEmail = CONTACT_EMAIL;
  const fromEmail = process.env.SENDER_EMAIL || process.env.USER_EMAIL || adminEmail;

  const msg = {
    to: adminEmail,
    from: { email: fromEmail, name: `${SENDER_NAME === 'Siftl' ? 'Siftl' : SENDER_NAME} Alerts` },
    subject: `🚨 SYSTEM ALERT: ${stage} Failure`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #cc0000; border-radius: 8px; background-color: #fff5f5;">
        <h2 style="color: #cc0000; margin-top: 0;">System Error Detected</h2>
        <p><strong>Stage:</strong> ${stage}</p>
        <p><strong>Error:</strong> <span style="color: #d32f2f;">${error}</span></p>
        ${details ? `<p><strong>Details:</strong></p><pre style="background: #ffffff; padding: 10px; border: 1px solid #ddd; overflow-x: auto;">${JSON.stringify(details, null, 2)}</pre>` : ''}
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="font-size: 12px; color: #666; margin-bottom: 0;">This is an automated alert from your Siftl engine.</p>
      </div>
    `,
  };

  try {
    await sendPulseEmail(msg);
    console.log(`[Alert] Admin alert sent for ${stage}`);
  } catch (err: any) {
    console.error('[Alert] Failed to send admin alert:', err);
  }
}
export async function sendOnboardingReminderEmail(to: string, name?: string, baseUrl: string = SITE_URL): Promise<void> {
  const fromEmail = process.env.SENDER_EMAIL || process.env.USER_EMAIL || to;
  const subject = "Bhargav from Siftl: Quick question about your briefing";
  const link = `${baseUrl}/sources`;
  const firstName = name ? name.split(' ')[0] : 'there';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;family=Merriweather:wght@300;400;700;900&amp;display=swap" rel="stylesheet">
      <style>
        .cta-button { display: inline-block; background-color: #111; color: #ffffff !important; padding: 16px 32px; border-radius: 50px; text-decoration: none; font-family: 'Inter', -apple-system, sans-serif; font-size: 16px; font-weight: bold; letter-spacing: 0.5px; }

        /* General Dark Mode CSS (Android/iOS) */
        @media (prefers-color-scheme: dark) {
          .header-bg, .footer-bg { background-color: #111111 !important; background-image: linear-gradient(#111111, #111111) !important; }
          .header-text, .footer-text, .header-subtitle, .footer-subtext, .header-meta, .footer-muted { color: #999999 !important; }
        }

        /* Gmail-Specific Inversion Overrides */
        u + .body .header-bg, u + .body .footer-bg { background-color: #111111 !important; background-image: linear-gradient(#111111, #111111) !important; }
        u + .body .header-text, u + .body .footer-text, u + .body .header-subtitle, u + .body .footer-subtext, u + .body .header-meta, u + .body .footer-muted { color: #999999 !important; }
      </style>
    </head>
    <body class="body" style="margin: 0; padding: 0; background-color: #111111; -webkit-font-smoothing: antialiased;">
      <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse: collapse; background-color: #111111;" bgcolor="#111111">
        <tr>
          <td align="center" style="vertical-align: top; background-color: #111111;" bgcolor="#111111">
            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 500px; border-collapse: collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; overflow: hidden; background-color: #111111;" bgcolor="#111111">
              <!-- Header -->
              ${generateHeaderHTML('Siftl', 'Setting up your stream', undefined, true)}
              <tr>
                <td style="padding: 40px; background-color: #ffffff;">
                  <p style="font-family: 'Inter', -apple-system, sans-serif; font-size: 15px; line-height: 1.6; color: #444; margin-bottom: 25px;">
                    Hey ${firstName},
                  </p>
                  <p style="font-family: 'Inter', -apple-system, sans-serif; font-size: 15px; line-height: 1.6; color: #444; margin-bottom: 25px;">
                    I noticed you signed up for Siftl yesterday but haven't added any sources yet. 
                  </p>
                  <p style="font-family: 'Inter', -apple-system, sans-serif; font-size: 15px; line-height: 1.6; color: #444; margin-bottom: 35px;">
                    The power of Siftl is in the quiet. Adding your sources is a <strong>one-time effort</strong> that takes less than 30 seconds. You can just paste any link, like YouTube, or X handle, or even just search for a name, and Siftl will find the source for you.
                  </p>
                  
                  <div style="text-align: center; margin-bottom: 10px;">
                    <a href="${link}" class="cta-button">Add your sources</a>
                  </div>
                  <p style="font-family: 'Inter', -apple-system, sans-serif; font-size: 13px; color: #888; text-align: center; margin-bottom: 30px;">
                    Takes about 30 seconds.
                  </p>

                  <p style="font-family: 'Inter', -apple-system, sans-serif; font-size: 14px; line-height: 1.6; color: #666; font-style: italic;">
                    If you're stuck or want a recommendation, just reply to this email. I read everything.
                  </p>
                  
                  <p style="font-family: 'Inter', -apple-system, sans-serif; font-size: 15px; line-height: 1.6; color: #444; margin-top: 35px; margin-bottom: 0;">
                    Best,<br>
                    Bhargav
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              ${generateFooterHTML()}
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const msg = {
    to,
    from: { email: fromEmail, name: process.env.SENDER_NAME || 'Siftl' },
    subject,
    html,
  };

  try {
    await sendPulseEmail(msg);
    console.log(`[Email] Onboarding reminder sent to ${to}`);
  } catch (error: any) {
    console.error('[Email] Error sending onboarding reminder:', error);
  }
}
