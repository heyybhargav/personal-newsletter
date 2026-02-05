import sgMail from '@sendgrid/mail';
import { DigestSection } from './types';
import { format } from 'date-fns';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

function generateEmailHTML(sections: DigestSection[], date: string): string {
    const sectionsHTML = sections.map(section => `
    <div style="margin-bottom: 40px;">
      <h2 style="color: #1a1a1a; font-size: 24px; margin-bottom: 20px; border-bottom: 3px solid #6366f1; padding-bottom: 10px;">
        ${section.title}
      </h2>
      ${section.items.map(item => `
        <div style="margin-bottom: 25px; padding: 20px; background: linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%); border-left: 4px solid #6366f1; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
          <h3 style="margin: 0 0 10px 0; font-size: 18px; color: #1a1a1a;">
            <a href="${item.link}" style="color: #1a1a1a; text-decoration: none; transition: color 0.2s;">
              ${item.title}
            </a>
          </h3>
          <p style="color: #4b5563; line-height: 1.6; margin: 0 0 10px 0; font-size: 15px;">
            ${item.summary}
          </p>
          <div style="font-size: 13px; color: #9ca3af;">
            <span style="background: #e0e7ff; padding: 4px 12px; border-radius: 12px; color: #4f46e5;">
              ${item.source}
            </span>
          </div>
        </div>
      `).join('')}
    </div>
  `).join('');

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Daily Digest</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 32px; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
          ✨ Your Daily Digest
        </h1>
        <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">
          ${date}
        </p>
      </div>
      
      <div style="background: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        ${sectionsHTML}
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 14px;">
          <p>Made with ❤️ by your Daily Digest System</p>
          <p style="margin-top: 10px;">
            <a href="#" style="color: #6366f1; text-decoration: none;">Manage Preferences</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function sendDigestEmail(to: string, sections: DigestSection[]): Promise<void> {
    const today = format(new Date(), 'EEEE, MMMM d, yyyy');

    const msg = {
        to,
        from: to, // SendGrid requires verified sender
        subject: `✨ Your Daily Digest - ${today}`,
        html: generateEmailHTML(sections, today),
    };

    try {
        await sgMail.send(msg);
        console.log('Digest email sent successfully!');
    } catch (error: any) {
        console.error('Error sending email:', error);
        if (error.response) {
            console.error(error.response.body);
        }
        throw error;
    }
}
