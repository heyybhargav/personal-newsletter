import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers, getUser, hasAccess, getTrialDaysRemaining, logErrorEvent } from '@/lib/db';
import { sendTrialNudgeEmail } from '@/lib/email';

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

        const dispatchPromises: Promise<any>[] = [];
        const results: { email: string; status: string; detail?: string }[] = [];

        // Ensure base URL works in Vercel and local dev
        const host = request.headers.get('host');
        const protocol = host?.includes('localhost') ? 'http' : 'https';
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (host ? `${protocol}://${host}` : 'http://localhost:3000');

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

            // --- Nudge Logic (Runs at the exact time they USUALLY get a digest) ---
            const trialDays = getTrialDaysRemaining(user);
            const stats = {
                daysRemaining: trialDays,
                totalSources: user.sources.length,
                briefingsSent: user.stats?.totalBriefingsSent || 0
            };

            // If trial is actively expiring (Day 5)
            if (user.tier === 'trial' && trialDays === 2) {
                console.log(`[Cron Dispatcher] 📬 Sending 'expiring_soon' nudge to ${email}`);
                // Don't await, send side-by-side with regular digest dispatch
                sendTrialNudgeEmail(email, 'expiring_soon', stats).catch(err => console.error(err));
            }

            // Expiry nudges (only check if they don't have access anymore)
            if (!hasAccess(user) && user.tier === 'trial' && user.trialEndsAt) {
                const endedMsAgo = Date.now() - new Date(user.trialEndsAt).getTime();
                const endedDaysAgo = Math.floor(endedMsAgo / (1000 * 60 * 60 * 24));

                if (endedDaysAgo === 0) {
                    // Day 7: Just expired today
                    console.log(`[Cron Dispatcher] 📬 Sending 'expired' nudge to ${email}`);
                    sendTrialNudgeEmail(email, 'expired', stats).catch(err => console.error(err));
                } else if (endedDaysAgo === 7) {
                    // Day 14: Expired 1 week ago
                    console.log(`[Cron Dispatcher] 📬 Sending 'miss_you' nudge to ${email}`);
                    sendTrialNudgeEmail(email, 'miss_you', stats).catch(err => console.error(err));
                }

                // They don't have access, so skip the actual digest generation
                results.push({ email, status: 'skipped', detail: 'trial_expired (sent nudge if due)' });
                continue;
            }

            // --- Dispatch the Worker ---
            console.log(`[Cron Dispatcher] 🚀 Dispatching worker for ${email} (TZ: ${timezone}, Time: ${currentHour}:${String(currentMinute).padStart(2, '0')})`);
            results.push({ email, status: 'dispatched' });

            const workerUrl = `${baseUrl}/api/digest/generate`;

            // Completely construct the fetch promise before pushing it.
            // Awaiting response.text() ensures the connection is held open long enough 
            // for the Next.js router to securely route to the edge/serverless handler.
            const dispatchTask = fetch(workerUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(process.env.CRON_SECRET ? { 'Authorization': `Bearer ${process.env.CRON_SECRET}` } : {})
                },
                body: JSON.stringify({ email, force })
            })
                .then(async res => {
                    const text = await res.text();
                    if (!res.ok) {
                        console.error(`[Cron Dispatcher] ❌ Failed to dispatch ${email}, Status: ${res.status}, Body: ${text.substring(0, 100)}`);
                        throw new Error(`Worker returned ${res.status}`);
                    }
                    return text;
                })
                .catch(async err => {
                    console.error(`[Cron Dispatcher] ❌ Failed HTTP dispatch for ${email}:`, err);
                    await logErrorEvent({
                        email,
                        stage: 'cron_dispatcher',
                        message: err.message || String(err),
                        timestamp: new Date().toISOString()
                    });
                });

            dispatchPromises.push(dispatchTask);
        }

        // Wait for all fetch POST requests to be securely INITIATED and routing acknowledged.
        console.log(`[Cron] Awaiting ${dispatchPromises.length} worker dispatches...`);
        await Promise.allSettled(dispatchPromises);

        console.log(`[Cron Dispatcher] Done: Dispatched ${dispatchPromises.length} workers.`);

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            summary: { dispatched: dispatchPromises.length },
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
