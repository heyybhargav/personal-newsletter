import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers, getUser, saveLatestBriefing } from '@/lib/db';
import { aggregateContent } from '@/lib/content-aggregator';
import { generateUnifiedBriefing } from '@/lib/gemini';
import { sendUnifiedDigestEmail } from '@/lib/email';
import { checkSubscriptionStatus } from '@/lib/subscription';

export const maxDuration = 60; // Max allowed for Vercel Hobby plan
export const dynamic = 'force-dynamic'; // Ensure it's never cached

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

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
            // Check if it's the right hour (allow 5 min window or just check hour equality)
            // UNLESS ?force=true is passed
            const { searchParams } = new URL(request.url);
            const force = searchParams.get('force') === 'true';

            if (!force && currentHour !== targetHour) {
                // console.log(`[Cron] Skipping ${email}: ${currentHour}:00 (User) != ${targetHour}:00 (Target)`);
                return { email, status: 'skipped_wrong_time', userTime: `${currentHour}:00` };
            }

            // --- Pause Logic ---
            const subStatus = checkSubscriptionStatus(user);
            if (subStatus.action === 'skip') {
                console.log(`[Cron] Skipping ${email}: ${subStatus.reason} ${subStatus.reason === 'paused_temporary' ? `until ${subStatus.until}` : ''}`);
                return { email, status: `skipped_${subStatus.reason}`, ...(subStatus.reason === 'paused_temporary' ? { until: subStatus.until } : {}) };
            }

            if (subStatus.action === 'send' && 'reason' in subStatus && subStatus.reason === 'pause_expired') {
                console.log(`[Cron] Resuming ${email}: Pause expired.`);
                // Optional: Auto-update DB to active here if desired, but not strictly required for sending
            }

            // --- Content Generation ---
            console.log(`[Cron] 🚀 Dispatching to ${email} (Timezone: ${timezone})`);

            const content = await aggregateContent(user.sources, { lookbackDays: force ? 3 : 1 });
            if (content.length === 0) return { email, status: 'skipped_no_content' };

            const briefing = await generateUnifiedBriefing(content, user.preferences.llmProvider);
            await sendUnifiedDigestEmail(user.email, briefing);
            await saveLatestBriefing(email, briefing);

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
