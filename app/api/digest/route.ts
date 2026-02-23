import { NextResponse } from 'next/server';
import { getPreferences, getUser, saveLatestBriefing, updateLastDigestAt } from '@/lib/db';
import { aggregateContent } from '@/lib/content-aggregator';
import { generateUnifiedBriefing } from '@/lib/gemini';
import { sendUnifiedDigestEmail } from '@/lib/email';
import { Source } from '@/lib/types';
import { getSession } from '@/lib/auth';

// This endpoint is for MANUAL triggering (e.g. "Force Dispatch" or "Preview Digest")
// It now supports BOTH the logged-in user OR the legacy admin fallack

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => ({}));
        const isInternalDispatch = body.internal === true;

        // --- Auth: Internal cron dispatch OR session-based dashboard trigger ---
        let email: string | undefined;
        let sources: Source[] = [];
        let lookbackDays = 3; // Default for manual triggers

        if (isInternalDispatch) {
            // Internal dispatch from /api/cron — authenticate with shared secret
            const cronSecret = request.headers.get('x-cron-secret');
            if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }

            console.log(`[Digest API] 🤖 Internal dispatch for: ${body.email}`);
            const user = await getUser(body.email);
            if (!user || !user.sources.length) {
                return NextResponse.json({ error: 'User not found or no sources', sent: false }, { status: 404 });
            }
            email = user.email;
            sources = user.sources;
            lookbackDays = 1; // Cron: only look back 1 day
        } else {
            // Manual trigger from dashboard
            console.log('[Digest API] POST: Starting manual dispatch...');
            const session = await getSession();

            if (session?.email) {
                console.log(`[Digest API] Session found for: ${session.email}`);
                const user = await getUser(session.email);
                if (user) {
                    email = user.email;
                    sources = user.sources;
                }
            }

            // Fallback to Admin if no session
            if (!email) {
                console.log('[Digest API] No session, falling back to Admin preferences');
                const prefs = await getPreferences();
                email = prefs.email;
                sources = prefs.sources as Source[];
            }
        }

        if (!email) {
            return NextResponse.json({ error: 'Email not configured', sent: false }, { status: 400 });
        }

        if (sources.length === 0) {
            return NextResponse.json({ error: 'No sources configured. Add some sources first!', sent: false }, { status: 400 });
        }

        // Step 1: Aggregate content from all sources
        console.log('[Digest API] Aggregating content from', sources.length, 'sources for', email);
        const content = await aggregateContent(sources, { lookbackDays });

        if (content.length === 0) {
            return NextResponse.json({ message: 'No new content found', sent: false });
        }

        console.log('[Digest API] Found', content.length, 'items. Generating unified briefing...');

        // Step 2: Generate UNIFIED briefing
        const briefing = await generateUnifiedBriefing(content);

        console.log(`[Digest API] Briefing generated. Preheader: "${briefing.preheader?.substring(0, 50)}...". Sending to ${email}`);

        // Step 3: Send the unified email and save to DB
        await sendUnifiedDigestEmail(email, briefing);
        await saveLatestBriefing(email, briefing);
        await updateLastDigestAt(email);

        console.log(`[Digest API] ✅ Successfully sent digest to ${email}`);

        return NextResponse.json({
            success: true,
            sent: true,
            recipient: email,
            itemCount: content.length,
            narrativeLength: briefing.narrative.length,
            timestamp: briefing.generatedAt
        });
    } catch (error: any) {
        console.error('[Digest API] Error:', error);
        return NextResponse.json({
            error: 'Digest generation failed',
            details: error.message,
            sent: false
        }, { status: 500 });
    }
}

export async function GET() {
    try {
        console.log('[Digest API] GET: Generating preview...');

        // 1. Identify User
        const session = await getSession();
        let sources: Source[] = [];

        if (session?.email) {
            const user = await getUser(session.email);
            if (user) {
                sources = user.sources;
            }
        }

        if (sources.length === 0) {
            // Fallback to Admin
            const prefs = await getPreferences();
            sources = prefs.sources as Source[];
        }

        if (sources.length === 0) {
            return NextResponse.json({ error: 'No sources configured', itemCount: 0 });
        }

        // Preview: Look back 3 days
        const content = await aggregateContent(sources, { lookbackDays: 3 });

        console.log('[Digest API] Found', content.length, 'items. Generating unified briefing...');
        const briefing = await generateUnifiedBriefing(content);

        // Return in a format the frontend can render
        return NextResponse.json({
            itemCount: content.length,
            briefing: {
                narrative: briefing.narrative,
                topStories: briefing.topStories,
                generatedAt: briefing.generatedAt
            },
            // Legacy compatibility: also return as sections
            sections: [{
                title: 'TODAY\'S BRIEFING',
                summary: briefing.narrative,
                items: briefing.topStories.map(item => ({
                    ...item,
                    summary: ''
                }))
            }]
        });
    } catch (error: any) {
        console.error('[Digest API] Preview error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
