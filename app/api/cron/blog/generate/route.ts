import { NextResponse, after } from 'next/server';
import { revalidatePath } from 'next/cache';
import { Receiver, Client } from '@upstash/qstash';
import { getFullKnowledgeBaseContext, isSlugTaken, saveBlogPost } from '@/lib/blogDb';
import { runEditorPhase, runWriterPhase, runReviewerPhase } from '@/lib/blogEngine';
import { validateGeneratedPost } from '@/lib/blogValidation';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Max out the Vercel Hobby tier

const receiver = new Receiver({
    currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY || '',
    nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY || '',
});

const qstash = new Client({
    token: process.env.QSTASH_TOKEN || '',
    baseUrl: process.env.QSTASH_URL,
});

export async function POST(request: Request) {
    console.log("[Blog Worker] 🔴 INCOMING QSTASH POST REQUEST DETECTED 🔴");
    try {
        const bodyText = await request.text();
        const signature = request.headers.get('upstash-signature');
        console.log(`[Blog Worker] Signature Present: ${!!signature}`);

        if (!signature) {
            return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
        }

        const isValid = await receiver.verify({ signature, body: bodyText });
        if (!isValid) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        let body;
        try {
            body = JSON.parse(bodyText);
        } catch (e) {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
        }

        const step = body.step || 'editor';
        const context = body.context || {};

        console.log(`\n========= [Blog Worker] STEP EXECUTING: ${step.toUpperCase()} =========`);
        console.log(`[Blog Worker] Has Context: ${Object.keys(context).join(', ') || 'None'}`);

        // Recover the webhook URL to pass execution forward.
        // 🔴 SECURITY FIX: Hardcode production URL to avoid Vercel edge header parsing issues
        const workerUrl = process.env.NODE_ENV === 'development'
            ? `http://${request.headers.get('host')}/api/cron/blog/generate`
            : `https://www.signaldaily.me/api/cron/blog/generate`;

        console.log(`[Blog Worker] Step: ${step} starting...`);

        if (step === 'editor') {
            after(async () => {
                try {
                    const kb = await getFullKnowledgeBaseContext();
                    const editorPlan = await runEditorPhase(kb);

                    if (await isSlugTaken(editorPlan.slug)) {
                        console.error(`[Blog Worker] Duplicate slug: ${editorPlan.slug}`);
                        return;
                    }

                    await qstash.publishJSON({
                        url: workerUrl,
                        body: { step: 'writer', context: { editorPlan } },
                        retries: 3,
                    });
                    console.log(`[Blog Worker Background] Editor completed. Queued Writer for ${editorPlan.slug}`);
                } catch (err) {
                    console.error('[Blog Worker Background] Editor failed:', err);
                }
            });
            return NextResponse.json({ success: true, action: 'queued_editor_bg' });
        }

        if (step === 'writer') {
            after(async () => {
                try {
                    const kb = await getFullKnowledgeBaseContext();
                    const rawContent = await runWriterPhase(context.editorPlan, kb);

                    await qstash.publishJSON({
                        url: workerUrl,
                        body: { step: 'reviewer', context: { editorPlan: context.editorPlan, rawContent } },
                        retries: 3,
                    });
                    console.log(`[Blog Worker Background] Writer completed. Queued Reviewer for ${context.editorPlan.slug}`);
                } catch (err) {
                    console.error('[Blog Worker Background] Writer failed:', err);
                }
            });
            return NextResponse.json({ success: true, action: 'queued_writer_bg' });
        }

        if (step === 'reviewer') {
            after(async () => {
                try {
                    const kb = await getFullKnowledgeBaseContext();
                    const finalPostJSON = await runReviewerPhase(context.rawContent, context.editorPlan, kb);

                    const finalPost = {
                        ...finalPostJSON,
                        publishedAt: new Date().toISOString()
                    };

                    const validation = validateGeneratedPost(finalPost);
                    if (!validation.isValid) {
                        console.error(`[Blog Worker Background] Quality Gate Failed: ${validation.errors.join(', ')}`);
                        return;
                    }

                    console.log(`[Blog Worker Background] Reviewer completed! Post valid. Saving to Redis for slug: ${finalPost.slug}...`);
                    await saveBlogPost(finalPost);

                    if (finalPost.slug) {
                        console.log(`[Blog Worker Background] Triggering On-Demand ISR for /blog and /blog/${finalPost.slug}`);
                        revalidatePath('/blog');
                        revalidatePath(`/blog/${finalPost.slug}`);
                    }

                    console.log(`[Blog Worker Background] Reviewer completed! Published: ${finalPost.slug}`);
                } catch (err) {
                    console.error('[Blog Worker Background] Reviewer failed:', err);
                }
            });
            return NextResponse.json({ success: true, action: 'queued_reviewer_bg' });
        }

    } catch (error) {
        console.error('[Blog Worker] Fatal Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
