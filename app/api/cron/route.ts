import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers, getUser } from '@/lib/db';
import { checkSubscriptionStatus } from '@/lib/subscription';

export const maxDuration = 30; // Dispatcher is lightweight — 30s is plenty
export const dynamic = 'force-dynamic';

/**
 * CRON DISPATCHER — Lightweight fan-out architecture
 * 
 * This endpoint is called hourly by cron-job.org.
 * It does NOT generate any emails itself.
 * It identifies which users are due for delivery, then dispatches
 * independent POST requests to /api/digest for each one.
 * Each /api/digest call gets its own 60s Vercel function execution.
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

        const userEmails = await getAllUsers();
        console.log(`[Cron] ⏰ Hourly check for ${userEmails.length} users...`);

        const dispatched: string[] = [];
        const skipped: { email: string; reason: string }[] = [];

        for (const email of userEmails) {
            const user = await getUser(email);
            if (!user || !user.sources.length) {
                skipped.push({ email, reason: 'no_sources' });
                continue;
            }

            // --- Timezone-aware time check with MINUTE precision ---
            const timezone = user.preferences.timezone || 'Asia/Kolkata';
            const deliveryTime = user.preferences.deliveryTime || '08:00';

            const { hour: currentHour, minute: currentMinute } = getCurrentTimeInTimezone(timezone);
            const [targetHourStr, targetMinStr] = deliveryTime.split(':');
            const targetHour = parseInt(targetHourStr, 10);
            const targetMinute = parseInt(targetMinStr || '0', 10);

            // Compare total minutes since midnight, with ±2 min tolerance
            const currentTotal = currentHour * 60 + currentMinute;
            const targetTotal = targetHour * 60 + targetMinute;
            let minuteDiff = Math.abs(currentTotal - targetTotal);
            if (minuteDiff > 720) minuteDiff = 1440 - minuteDiff; // Handle midnight wrap

            if (!force && minuteDiff > 2) {
                skipped.push({ email, reason: `wrong_time (now: ${currentHour}:${String(currentMinute).padStart(2, '0')}, target: ${deliveryTime})` });
                continue;
            }

            // --- Pause Logic ---
            const subStatus = checkSubscriptionStatus(user);
            if (subStatus.action === 'skip') {
                skipped.push({ email, reason: subStatus.reason });
                continue;
            }

            // --- Already sent today? ---
            if (!force && user.lastDigestAt) {
                const lastSent = new Date(user.lastDigestAt);
                const hoursSinceLastSent = (Date.now() - lastSent.getTime()) / (1000 * 60 * 60);
                if (hoursSinceLastSent < 20) {
                    skipped.push({ email, reason: `already_sent (${Math.round(hoursSinceLastSent)}h ago)` });
                    continue;
                }
            }

            // --- DISPATCH: Fire-and-forget to /api/digest ---
            console.log(`[Cron] 🚀 Dispatching digest for ${email} (TZ: ${timezone}, hour: ${currentHour})`);

            const baseUrl = getBaseUrl(request);
            // Fire the request but don't await the full response — just confirm it was accepted
            fetch(`${baseUrl}/api/digest`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-cron-secret': process.env.CRON_SECRET || '',
                },
                body: JSON.stringify({ email, internal: true }),
            }).catch(err => {
                console.error(`[Cron] Failed to dispatch to ${email}:`, err.message);
            });

            dispatched.push(email);
        }

        console.log(`[Cron] ✅ Dispatched: ${dispatched.length}, Skipped: ${skipped.length}`);

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            dispatched,
            skipped,
        });
    } catch (error: any) {
        console.error('[Cron] Error:', error);
        return NextResponse.json({ error: 'Cron dispatcher failed', details: error.message }, { status: 500 });
    }
}

/**
 * Reliably get the current hour AND minute in any timezone using Intl.DateTimeFormat.
 * This avoids the broken `toLocaleString` → `new Date()` roundtrip.
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

/**
 * Get the base URL for internal API calls.
 * Works in both local dev and production.
 */
function getBaseUrl(request: NextRequest): string {
    // In production, use the canonical URL
    if (process.env.NEXT_PUBLIC_CRON_URL) {
        return process.env.NEXT_PUBLIC_CRON_URL;
    }
    // Fallback: derive from the incoming request
    const url = new URL(request.url);
    return `${url.protocol}//${url.host}`;
}
