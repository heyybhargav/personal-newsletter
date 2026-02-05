import { NextResponse } from 'next/server';
import { getPreferences } from '@/lib/db';
import { aggregateContent, groupBySourceType } from '@/lib/content-aggregator';
import { generateDigest } from '@/lib/gemini';
import { sendDigestEmail } from '@/lib/email';

export async function GET() {
    try {
        const prefs = await getPreferences();

        if (!prefs.email) {
            return NextResponse.json({
                error: 'Email not configured',
                sent: false
            }, { status: 400 });
        }

        if (prefs.sources.length === 0) {
            return NextResponse.json({
                error: 'No sources configured',
                sent: false
            }, { status: 400 });
        }

        // Aggregate content
        const content = await aggregateContent(prefs.sources);

        if (content.length === 0) {
            console.log('No new content found, skipping email');
            return NextResponse.json({
                message: 'No new content found',
                sent: false
            });
        }

        // Group by type and generate digest
        const grouped = groupBySourceType(content);
        const sections = await generateDigest(grouped);

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
        console.error('Cron job error:', error);
        return NextResponse.json({
            error: 'Cron job failed',
            details: error.message,
            sent: false
        }, { status: 500 });
    }
}
