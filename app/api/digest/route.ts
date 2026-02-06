import { NextResponse } from 'next/server';
import { getPreferences } from '@/lib/db';
import { aggregateContent, groupBySourceType } from '@/lib/content-aggregator';
import { generateBriefing } from '@/lib/gemini';
import { sendDigestEmail } from '@/lib/email';
import { Source } from '@/lib/types';

// This endpoint is for MANUAL triggering (e.g. "Send Test Email" or "Preview Digest")
// It defaults to the current admin user (env.USER_EMAIL) via getPreferences()

export async function POST(request: Request) {
    try {
        const prefs = await getPreferences();

        if (!prefs.email) {
            return NextResponse.json({ error: 'Email not configured', sent: false }, { status: 400 });
        }

        if (prefs.sources.length === 0) {
            return NextResponse.json({ error: 'No sources configured', sent: false }, { status: 400 });
        }

        // Cast legacy source to Source type if needed
        const sources = prefs.sources as Source[];

        // Aggregate content
        const content = await aggregateContent(sources);

        if (content.length === 0) {
            return NextResponse.json({ message: 'No new content found', sent: false });
        }

        // Generate Briefing
        const grouped = groupBySourceType(content);
        const sections = await generateBriefing(grouped);

        // Send email
        await sendDigestEmail(prefs.email, sections);

        return NextResponse.json({
            success: true,
            sent: true,
            itemCount: content.length,
            sectionCount: sections.length,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('Digest trigger error:', error);
        return NextResponse.json({
            error: 'Digest generation failed',
            details: error.message,
            sent: false
        }, { status: 500 });
    }
}

export async function GET() {
    try {
        const prefs = await getPreferences();
        const sources = prefs.sources as Source[];

        if (sources.length === 0) {
            return NextResponse.json({ error: 'No sources configured', itemCount: 0 });
        }

        const content = await aggregateContent(sources);
        const grouped = groupBySourceType(content);
        const sections = await generateBriefing(grouped);

        return NextResponse.json({
            itemCount: content.length,
            sections
        });
    } catch (error: any) {
        console.error('Preview error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
