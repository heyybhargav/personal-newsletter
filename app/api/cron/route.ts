import { NextResponse } from 'next/server';
import { getAllUsers, getUser } from '@/lib/db';
import { aggregateContent } from '@/lib/content-aggregator';
import { generateUnifiedBriefing } from '@/lib/gemini';
import { sendUnifiedDigestEmail } from '@/lib/email';

export async function GET() {
    try {
        const userEmails = await getAllUsers();
        console.log(`[Cron] ⏰ Hourly check for ${userEmails.length} users...`);

        const results = await Promise.allSettled(userEmails.map(async (email) => {
            const user = await getUser(email);
            if (!user || !user.sources.length) return { email, status: 'skipped_no_sources' };

            // --- Timezone Logic ---
            const timezone = user.preferences.timezone || 'Asia/Kolkata';
            const deliveryTime = user.preferences.deliveryTime || '08:00'; // "HH:MM" format

            // Get current time in USER'S timezone
            const userNow = new Date().toLocaleString('en-US', { timeZone: timezone, hour12: false });
            const currentHour = new Date(userNow).getHours();

            // Parse target delivery hour
            const [targetHourStr] = deliveryTime.split(':');
            const targetHour = parseInt(targetHourStr, 10);

            // Check if it's the right hour (allow 5 min window or just check hour equality)
            // Since cron runs at top of hour, equality is sufficient
            if (currentHour !== targetHour) {
                // console.log(`[Cron] Skipping ${email}: ${currentHour}:00 (User) != ${targetHour}:00 (Target)`);
                return { email, status: 'skipped_wrong_time', userTime: `${currentHour}:00` };
            }

            // --- Content Generation ---
            console.log(`[Cron] 🚀 Dispatching to ${email} (Timezone: ${timezone})`);

            const content = await aggregateContent(user.sources);
            if (content.length === 0) return { email, status: 'skipped_no_content' };

            const briefing = await generateUnifiedBriefing(content, user.preferences.llmProvider);
            await sendUnifiedDigestEmail(user.email, briefing);

            console.log(`[Cron] ✅ Sent to ${email}`);
            return { email, status: 'sent', items: content.length };
        }));

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            results: results.map(r => r.status === 'fulfilled' ? r.value : r.reason)
        });
    } catch (error: any) {
        console.error('[Cron] Error:', error);
        return NextResponse.json({ error: 'Cron job failed', details: error.message }, { status: 500 });
    }
}
