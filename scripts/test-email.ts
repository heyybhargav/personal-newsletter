
import dotenv from 'dotenv';
import path from 'path';
import { sendWelcomeEmail } from '../lib/email';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  const testEmail = process.env.USER_EMAIL || 'cbhargav2002@gmail.com';
  console.log(`[TEST] Attempting to send test welcome email to: ${testEmail}`);
  console.log(`[TEST] Using SENDER_EMAIL: ${process.env.SENDER_EMAIL}`);
  console.log(`[TEST] Using SENDER_NAME: ${process.env.SENDER_NAME || 'Siftl'}`);
  
  try {
    await sendWelcomeEmail(testEmail, 'https://siftl.com', { isTrial: true, trialDays: 7 });
    console.log('[SUCCESS] Test email sent successfully!');
  } catch (error) {
    console.error('[FAILURE] Failed to send test email:', error);
    process.exit(1);
  }
}

main();
