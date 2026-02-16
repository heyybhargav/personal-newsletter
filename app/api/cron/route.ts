import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers, getUser, saveUser } from '@/lib/db';
import { aggregateContent } from '@/lib/content-aggregator';
import { generateUnifiedBriefing } from '@/lib/gemini';
import { sendUnifiedDigestEmail } from '@/lib/email';

/**
 * Checks if a digest should be sent for this user right now.
 * Uses catch-up logic: if the delivery time has passed today and
 * the user hasn't received a digest today, send it.
 * This makes the system resilient to missed cron windows.
 */
function shouldSendDigest(
    lastDigestAt: string | undefined,
    deliveryTime: string,
    timezone: string
): { shouldSend: boolean; reason: string; currentTime: string } {
    // Get current date/time in user's timezone
    const now = new Date();
    const userNowStr = now.toLocaleString('en-US', { timeZone: timezone, hour12: false });
    const userNow = new Date(userNowStr);
    const currentHour = userNow.getHours();
    const currentMinute = userNow.getMinutes();

    // Parse target delivery time
    const [targetHourStr, targetMinStr] = deliveryTime.split(':');
    const targetHour = parseInt(targetHourStr, 10);
    const targetMin = parseInt(targetMinStr || '0', 10);

    const currentTime = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

    // Check if delivery time has passed today
    const deliveryTimePassed = currentHour > targetHour ||
        (currentHour === targetHour && currentMinute >= targetMin);

    if (!deliveryTimePassed) {
        return { shouldSend: false, reason: 'before_delivery_time', currentTime };
    }

    // Check if already sent today (in user's timezone)
    if (lastDigestAt) {
        const lastSentStr = new Date(lastDigestAt).toLocaleString('en-US', { timeZone: timezone, hour12: false });
        const lastSent = new Date(lastSentStr);

        // Compare dates (same day in user's timezone)
        const isSameDay = lastSent.getFullYear() === userNow.getFullYear() &&
            lastSent.getMonth() === userNow.getMonth() &&
            lastSent.getDate() === userNow.getDate();

        if (isSameDay) {
            return { shouldSend: false, reason: 'already_sent_today', currentTime };
        }
    }

    return { shouldSend: true, reason: 'delivery_due', currentTime };
}

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const force = searchParams.get('force') === 'true';

        const userEmails = await getAllUsers();
        console.log(`[Cron] ⏰ Checking ${userEmails.length} users... (force=${force})`);

        const results = await Promise.allSettled(userEmails.map(async (email) => {
            const user = await getUser(email);
            if (!user || !user.sources.length) return { email, status: 'skipped_no_sources' };

            const timezone = user.preferences.timezone || 'Asia/Kolkata';
            const deliveryTime = user.preferences.deliveryTime || '08:00';

            // Use catch-up logic unless force=true
            if (!force) {
                const check = shouldSendDigest(user.lastDigestAt, deliveryTime, timezone);
                if (!check.shouldSend) {
                    return { email, status: `skipped_${check.reason}`, currentTime: check.currentTime, deliveryTime };
                }
            }

            // --- Content Generation ---
            console.log(`[Cron] 🚀 Dispatching to ${email} (TZ: ${timezone}, delivery: ${deliveryTime})`);

            const enabledSources = user.sources.filter(s => s.enabled);
            if (enabledSources.length === 0) return { email, status: 'skipped_no_enabled_sources' };

            const content = await aggregateContent(enabledSources);
            if (content.length === 0) return { email, status: 'skipped_no_content' };

            const briefing = await generateUnifiedBriefing(content, user.preferences.llmProvider);
            await sendUnifiedDigestEmail(user.email, briefing);

            // Update lastDigestAt so we don't send again today
            user.lastDigestAt = new Date().toISOString();
            await saveUser(user);

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
