import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { Receiver } from '@upstash/qstash';
import { generateAndPublishBlog } from '@/lib/blogEngine';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Max out the Vercel Hobby tier

const receiver = new Receiver({
    currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY || '',
    nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY || '',
});

export async function POST(request: Request) {
    try {
        // 1. Verify QStash Signature (ensures only QStash can trigger this)
        const body = await request.text();
        const signature = request.headers.get('upstash-signature');

        if (!signature) {
            return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
        }

        const isValid = await receiver.verify({ signature, body });
        if (!isValid) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        console.log('[Blog Worker] Received verified QStash webhook. Starting engine...');

        // 2. Execute the Blog Engine
        // Inside `generateAndPublishBlog`, it reads the KB, runs the 3-step prompt chain,
        // passes the Quality Gate, and saves it to Redis.
        const result = await generateAndPublishBlog();

        if (!result.success) {
            // Return 500 so QStash knows to retry
            console.error('[Blog Worker] Engine Failed:', result.error);
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        console.log(`[Blog Worker] Engine Success! Created post: ${result.post?.slug}`);

        // Purge the Next.js cache so the new post appears immediately (On-demand ISR)
        if (result.post?.slug) {
            revalidatePath('/blog');
            revalidatePath(`/blog/${result.post.slug}`);
        }

        return NextResponse.json({ success: true, post: result.post });

    } catch (error) {
        console.error('[Blog Worker] Fatal Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
