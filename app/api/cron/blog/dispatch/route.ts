import { NextResponse } from 'next/server';
import { Client } from '@upstash/qstash';
import { SITE_URL } from '@/lib/config';

export const dynamic = 'force-dynamic';

const qstash = new Client({
    token: process.env.QSTASH_TOKEN || '',
    baseUrl: process.env.QSTASH_URL,
});

/**
 * PHASE 1 DISPATCHER
 * Called by cron-job.org on a schedule (e.g. 4x a day).
 * This endpoint executes in < 1s.
 */
export async function GET(request: Request) {
    try {
        // 1. Verify Cron Secret
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // The target worker URL that QStash will call
        const workerUrl = `${SITE_URL}/api/cron/blog/generate`;

        // 2. Publish message to Upstash QStash
        const res = await qstash.publishJSON({
            url: workerUrl,
            body: { initiatedAt: new Date().toISOString() },
            retries: 3, // QStash will retry up to 3 times on 500 errors
        });

        console.log(`[Blog Cron Dispatcher] Successfully queued generation job: ${res.messageId}`);
        return NextResponse.json({ success: true, messageId: res.messageId });

    } catch (error) {
        console.error('[Blog Cron Dispatcher] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
