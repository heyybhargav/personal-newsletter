import { NextResponse } from 'next/server';
import { getAllUsers, getUser } from '@/lib/db';
import { aggregateContent } from '@/lib/content-aggregator';
import { generateUnifiedBriefing } from '@/lib/gemini';
import { sendUnifiedDigestEmail } from '@/lib/email';

export async function GET() {
    try {
        const userEmails = await getAllUsers();
        console.log(`[Cron] Starting digest dispatch for ${userEmails.length} users...`);

        // Process all users
        // In production, consider using Upstash QStash for queued processing
        const results = await Promise.allSettled(userEmails.map(async (email) => {
            const user = await getUser(email);
            if (!user || !user.sources.length) {
                console.log(`[Cron] Skipping ${email}: no sources`);
                return { email, status: 'skipped' };
            }

            // Step 1: Aggregate content for this user
            console.log(`[Cron] Processing ${email}: ${user.sources.length} sources`);
            const content = await aggregateContent(user.sources);
            if (content.length === 0) {
                console.log(`[Cron] Skipping ${email}: no content found`);
                return { email, status: 'no_content' };
            }

            // Step 2: Generate UNIFIED briefing
            console.log(`[Cron] Generating briefing for ${email}: ${content.length} items`);
            const briefing = await generateUnifiedBriefing(content);

            // Step 3: Send unified email
            await sendUnifiedDigestEmail(user.email, briefing);
            console.log(`[Cron] ✅ Sent to ${email}`);

            return { email, status: 'sent', items: content.length };
        }));

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            results
        });
    } catch (error: any) {
        console.error('[Cron] Error:', error);
        return NextResponse.json({
            error: 'Cron job failed',
            details: error.message
        }, { status: 500 });
    }
}
