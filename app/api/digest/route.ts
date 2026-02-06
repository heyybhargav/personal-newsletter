import { NextResponse } from 'next/server';
import { getPreferences } from '@/lib/db';
import { aggregateContent } from '@/lib/content-aggregator';
import { generateUnifiedBriefing } from '@/lib/gemini';
import { sendUnifiedDigestEmail } from '@/lib/email';
import { Source } from '@/lib/types';

// This endpoint is for MANUAL triggering (e.g. "Force Dispatch" or "Preview Digest")
// It defaults to the current admin user (env.USER_EMAIL) via getPreferences()

export async function POST(request: Request) {
    try {
        console.log('[Digest API] POST: Starting manual dispatch...');

        const prefs = await getPreferences();

        if (!prefs.email) {
            return NextResponse.json({ error: 'Email not configured', sent: false }, { status: 400 });
        }

        if (prefs.sources.length === 0) {
            return NextResponse.json({ error: 'No sources configured', sent: false }, { status: 400 });
        }

        const sources = prefs.sources as Source[];

        // Step 1: Aggregate content from all sources
        console.log('[Digest API] Aggregating content from', sources.length, 'sources...');
        const content = await aggregateContent(sources);

        if (content.length === 0) {
            return NextResponse.json({ message: 'No new content found', sent: false });
        }

        console.log('[Digest API] Found', content.length, 'items. Generating unified briefing...');

        // Step 2: Generate UNIFIED briefing (new approach!)
        const briefing = await generateUnifiedBriefing(content);

        console.log('[Digest API] Briefing generated. Sending email to', prefs.email);

        // Step 3: Send the unified email
        await sendUnifiedDigestEmail(prefs.email, briefing);

        return NextResponse.json({
            success: true,
            sent: true,
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

        const prefs = await getPreferences();
        const sources = prefs.sources as Source[];

        if (sources.length === 0) {
            return NextResponse.json({ error: 'No sources configured', itemCount: 0 });
        }

        const content = await aggregateContent(sources);

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
