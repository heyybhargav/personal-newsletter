import { NextResponse } from 'next/server';
import { getPreferences, getUser } from '@/lib/db';
import { aggregateContent } from '@/lib/content-aggregator';
import { generateUnifiedBriefing } from '@/lib/gemini';
import { sendUnifiedDigestEmail } from '@/lib/email';
import { Source } from '@/lib/types';
import { getSession } from '@/lib/auth';

// This endpoint is for MANUAL triggering (e.g. "Force Dispatch" or "Preview Digest")
// It now supports BOTH the logged-in user OR the legacy admin fallack

export async function POST(request: Request) {
    try {
        console.log('[Digest API] POST: Starting manual dispatch...');

        // 1. Identify User
        const session = await getSession();
        let email: string | undefined;
        let sources: Source[] = [];

        if (session?.email) {
            console.log(`[Digest API] Session found for: ${session.email}`);
            const user = await getUser(session.email);
            if (user) {
                email = user.email;
                sources = user.sources;
            }
        }

        // Fallback to Admin if no session (e.g. external trigger, though usually that's /api/cron)
        if (!email) {
            console.log('[Digest API] No session, falling back to Admin preferences');
            const prefs = await getPreferences();
            email = prefs.email;
            sources = prefs.sources as Source[];
        }

        if (!email) {
            return NextResponse.json({ error: 'Email not configured', sent: false }, { status: 400 });
        }

        if (sources.length === 0) {
            return NextResponse.json({ error: 'No sources configured. Add some sources first!', sent: false }, { status: 400 });
        }

        // Step 1: Aggregate content from all sources
        console.log('[Digest API] Aggregating content from', sources.length, 'sources for', email);
        // Manual trigger: Look back 3 days to ensure we find content
        const content = await aggregateContent(sources, { lookbackDays: 3 });

        if (content.length === 0) {
            return NextResponse.json({ message: 'No new content found in the last 24h', sent: false });
        }

        console.log('[Digest API] Found', content.length, 'items. Generating unified briefing...');

        // Step 2: Generate UNIFIED briefing (new approach!)
        const briefing = await generateUnifiedBriefing(content);

        console.log('[Digest API] Briefing generated. Sending email to', email);

        // Step 3: Send the unified email
        await sendUnifiedDigestEmail(email, briefing);

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
