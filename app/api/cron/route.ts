import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers, getUser, saveLatestBriefing, updateLastDigestAt } from '@/lib/db';
import { aggregateContent } from '@/lib/content-aggregator';
import { generateUnifiedBriefing } from '@/lib/gemini';
import { sendUnifiedDigestEmail } from '@/lib/email';
import { checkSubscriptionStatus } from '@/lib/subscription';

export const maxDuration = 60; // Max allowed for Vercel Hobby plan
export const dynamic = 'force-dynamic';

/**
 * CRON HANDLER — Called every minute by cron-job.org
 * 
 * With minute-level precision (±2 min window), only 0-3 users match per run.
 * So it's safe to process them directly and sequentially within the 60s limit.
 * Each user takes ~10-15s (RSS + LLM + SendGrid).
 */
export async function GET(request: NextRequest) {
    try {
        // --- Auth ---
        const authHeader = request.headers.get('authorization');
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const force = searchParams.get('force') === 'true';
        // Allow testing a specific user: ?force=true&email=someone@example.com
        const targetEmail = searchParams.get('email');

        const userEmails = await getAllUsers();
        console.log(`[Cron] ⏰ Check for ${userEmails.length} users...`);

        const results: { email: string; status: string; detail?: string }[] = [];

        for (const email of userEmails) {
            // If a specific email is targeted, skip all others
            if (targetEmail && email !== targetEmail) continue;

            const user = await getUser(email);
            if (!user || !user.sources.length) {
                results.push({ email, status: 'skipped', detail: 'no_sources' });
                continue;
            }

            // --- Timezone-aware time check with MINUTE precision ---
            const timezone = user.preferences.timezone || 'Asia/Kolkata';
            const deliveryTime = user.preferences.deliveryTime || '08:00';

            const { hour: currentHour, minute: currentMinute } = getCurrentTimeInTimezone(timezone);
            const [targetHourStr, targetMinStr] = deliveryTime.split(':');
            const targetHour = parseInt(targetHourStr, 10);
            const targetMinute = parseInt(targetMinStr || '0', 10);

            // Exact minute match — cron-job.org fires every minute, so this matches once per day
            const currentTotal = currentHour * 60 + currentMinute;
            const targetTotal = targetHour * 60 + targetMinute;
            let minuteDiff = Math.abs(currentTotal - targetTotal);
            if (minuteDiff > 720) minuteDiff = 1440 - minuteDiff; // Handle midnight wrap

            if (!force && minuteDiff !== 0) {
                results.push({ email, status: 'skipped', detail: `wrong_time (now: ${currentHour}:${String(currentMinute).padStart(2, '0')}, target: ${deliveryTime})` });
                continue;
            }

            // --- Pause Logic ---
            const subStatus = checkSubscriptionStatus(user);
            if (subStatus.action === 'skip') {
                results.push({ email, status: 'skipped', detail: subStatus.reason });
                continue;
            }

            // --- Process this user ---
            try {
                console.log(`[Cron] 🚀 Processing ${email} (TZ: ${timezone}, ${currentHour}:${String(currentMinute).padStart(2, '0')})`);

                const content = await aggregateContent(user.sources, { lookbackDays: force ? 3 : 1 });
                if (content.length === 0) {
                    results.push({ email, status: 'skipped', detail: 'no_content' });
                    continue;
                }

                const briefing = await generateUnifiedBriefing(content, user.preferences.llmProvider);
                await sendUnifiedDigestEmail(user.email, briefing);
                await saveLatestBriefing(email, briefing);
                await updateLastDigestAt(email);

                console.log(`[Cron] ✅ Sent to ${email} (${content.length} items)`);
                results.push({ email, status: 'sent', detail: `${content.length} items` });
            } catch (err: any) {
                console.error(`[Cron] ❌ Failed for ${email}:`, err.message);
                results.push({ email, status: 'failed', detail: err.message });
                // Continue to next user — don't let one failure stop others
            }
        }

        const sent = results.filter(r => r.status === 'sent').length;
        const skipped = results.filter(r => r.status === 'skipped').length;
        const failed = results.filter(r => r.status === 'failed').length;
        console.log(`[Cron] Done: ${sent} sent, ${skipped} skipped, ${failed} failed`);

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            summary: { sent, skipped, failed },
            results,
        });
    } catch (error: any) {
        console.error('[Cron] Error:', error);
        return NextResponse.json({ error: 'Cron failed', details: error.message }, { status: 500 });
    }
}

/**
 * Reliably get the current hour AND minute in any timezone using Intl.DateTimeFormat.
 * Avoids the broken `toLocaleString` → `new Date()` roundtrip.
 */
function getCurrentTimeInTimezone(timezone: string): { hour: number; minute: number } {
    const now = new Date();
    const hourFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        hour12: false,
    });
    const minuteFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        minute: 'numeric',
    });
    return {
        hour: parseInt(hourFormatter.format(now), 10),
        minute: parseInt(minuteFormatter.format(now), 10),
    };
}
