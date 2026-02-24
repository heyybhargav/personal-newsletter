import { NextRequest, NextResponse } from 'next/server';
import { getUser, saveLatestBriefing, updateLastDigestAt } from '@/lib/db';
import { aggregateContent } from '@/lib/content-aggregator';
import { generateUnifiedBriefing } from '@/lib/gemini';
import { sendUnifiedDigestEmail } from '@/lib/email';
import { checkSubscriptionStatus } from '@/lib/subscription';

export const maxDuration = 60; // Max allowed for Vercel Hobby plan
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        // --- Auth ---
        const authHeader = request.headers.get('authorization');
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { email, force } = body;

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const user = await getUser(email);
        if (!user || !user.sources.length) {
            return NextResponse.json({ status: 'skipped', detail: 'no_sources' });
        }

        // --- Pause Logic ---
        const subStatus = checkSubscriptionStatus(user);
        if (subStatus.action === 'skip') {
            return NextResponse.json({ status: 'skipped', detail: subStatus.reason });
        }

        console.log(`[Worker] 🚀 Processing ${email}`);

        const content = await aggregateContent(user.sources, { lookbackDays: force ? 3 : 1 });
        if (content.length === 0) {
            return NextResponse.json({ status: 'skipped', detail: 'no_content' });
        }

        const briefing = await generateUnifiedBriefing(content, user.preferences.llmProvider);
        await sendUnifiedDigestEmail(user.email, briefing);
        await saveLatestBriefing(email, briefing);
        await updateLastDigestAt(email);

        console.log(`[Worker] ✅ Sent to ${email} (${content.length} items)`);

        return NextResponse.json({
            success: true,
            status: 'sent',
            email,
            detail: `${content.length} items`
        });
    } catch (error: any) {
        console.error(`[Worker] ❌ Failed for user:`, error);
        return NextResponse.json({ error: 'Worker failed', details: error.message }, { status: 500 });
    }
}
