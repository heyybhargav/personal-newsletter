import { NextResponse } from 'next/server';
import { getAllUsers, getUser } from '@/lib/db';
import { aggregateContent, groupBySourceType } from '@/lib/content-aggregator';
import { generateBriefing } from '@/lib/gemini';
import { sendDigestEmail } from '@/lib/email';

export async function GET() {
    try {
        const userEmails = await getAllUsers();
        console.log(`Starting cron for ${userEmails.length} users...`);

        // Process all users
        // In a real production app, we would use a queue (Upstash QStash) for this
        // but for now, we'll iterate.
        const results = await Promise.allSettled(userEmails.map(async (email) => {
            const user = await getUser(email);
            if (!user || !user.sources.length) return { email, status: 'skipped' };

            // Aggregate content for this user
            const content = await aggregateContent(user.sources);
            if (content.length === 0) return { email, status: 'no_content' };

            // Generate the "Briefing"
            const grouped = groupBySourceType(content);
            const sections = await generateBriefing(grouped);

            // Send Email
            await sendDigestEmail(user.email, sections);

            return { email, status: 'sent', items: content.length };
        }));

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            results
        });
    } catch (error: any) {
        console.error('Cron job error:', error);
        return NextResponse.json({
            error: 'Cron job failed',
            details: error.message
        }, { status: 500 });
    }
}
