import { NextResponse } from 'next/server';
import { getAllUsers, getUser } from '@/lib/db';
import { aggregateContent } from '@/lib/content-aggregator';
import { generateUnifiedBriefing } from '@/lib/gemini';
import { sendUnifiedDigestEmail } from '@/lib/email';
import { formatInTimeZone } from 'date-fns-tz';

export async function GET() {
    try {
        const userEmails = await getAllUsers();
        console.log(`[Cron] Starting dispatch check for ${userEmails.length} users...`);

        const now = new Date();
        const results = [];

        // Process all users
        for (const email of userEmails) {
            const user = await getUser(email);
            if (!user) continue;

            // Step 0: Check if it's the right time in the user's timezone
            const userTimezone = user.preferences.timezone || 'Asia/Kolkata';
            const userHour = user.preferences.deliveryTime?.split(':')[0] || '08';

            // Format current time in user's timezone to get their local hour
            const currentLocalHour = formatInTimeZone(now, userTimezone, 'HH');

            if (currentLocalHour !== userHour) {
                console.log(`[Cron] Skipping ${email}: Local hour is ${currentLocalHour}, expected ${userHour}`);
                continue;
            }

            if (!user.sources || user.sources.length === 0) {
                console.log(`[Cron] Skipping ${email}: No sources configured`);
                results.push({ email, status: 'skipped_no_sources' });
                continue;
            }

            // Step 1: Aggregate content for this user
            console.log(`[Cron] 🕒 Triggering dispatch for ${email} (Local time matches)`);
            const content = await aggregateContent(user.sources);

            if (content.length === 0) {
                console.log(`[Cron] Skipping ${email}: no content found`);
                results.push({ email, status: 'no_content' });
                continue;
            }

            // Step 2: Generate UNIFIED briefing
            console.log(`[Cron] Generating briefing for ${email}: ${content.length} items`);
            const briefing = await generateUnifiedBriefing(content);

            // Step 3: Send unified email
            await sendUnifiedDigestEmail(user.email, briefing);
            console.log(`[Cron] ✅ Sent to ${email}`);

            results.push({ email, status: 'sent', items: content.length });
        }

        return NextResponse.json({
            success: true,
            timestamp: now.toISOString(),
            processed: results.length,
            results
        });
    } catch (error: unknown) {
        const err = error as Error;
        console.error('[Cron] Error:', err);
        return NextResponse.json({
            error: 'Cron job failed',
            details: err.message
        }, { status: 500 });
    }
}
