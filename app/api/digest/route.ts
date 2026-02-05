import { NextResponse } from 'next/server';
import { getPreferences } from '@/lib/db';
import { aggregateContent, groupBySourceType } from '@/lib/content-aggregator';
import { generateDigest } from '@/lib/gemini';
import { sendDigestEmail } from '@/lib/email';

export async function GET() {
    try {
        const prefs = await getPreferences();

        if (prefs.sources.length === 0) {
            return NextResponse.json({
                error: 'No sources configured. Please add some sources first.'
            }, { status: 400 });
        }

        // Aggregate content
        const content = await aggregateContent(prefs.sources);

        if (content.length === 0) {
            return NextResponse.json({
                message: 'No new content found in the last 24 hours',
                sections: []
            });
        }

        // Group by type and generate digest
        const grouped = groupBySourceType(content);
        const sections = await generateDigest(grouped);

        return NextResponse.json({ sections, itemCount: content.length });
    } catch (error: any) {
        console.error('Error generating digest:', error);
        return NextResponse.json({
            error: 'Failed to generate digest',
            details: error.message
        }, { status: 500 });
    }
}

export async function POST() {
    try {
        const prefs = await getPreferences();

        if (!prefs.email) {
            return NextResponse.json({
                error: 'Email not configured. Please set your email in settings.'
            }, { status: 400 });
        }

        if (prefs.sources.length === 0) {
            return NextResponse.json({
                error: 'No sources configured. Please add some sources first.'
            }, { status: 400 });
        }

        // Aggregate content
        const content = await aggregateContent(prefs.sources);

        if (content.length === 0) {
            return NextResponse.json({
                message: 'No new content found in the last 24 hours. No email sent.',
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
            sectionCount: sections.length
        });
    } catch (error: any) {
        console.error('Error sending digest:', error);
        return NextResponse.json({
            error: 'Failed to send digest',
            details: error.message
        }, { status: 500 });
    }
}
