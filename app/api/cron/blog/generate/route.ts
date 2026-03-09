import { NextResponse } from 'next/server';
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
    try {
        const bodyText = await request.text();
        const signature = request.headers.get('upstash-signature');

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

        // Recover the webhook URL to pass execution forward.
        const host = request.headers.get('host');
        const protocol = request.headers.get('x-forwarded-proto') || (process.env.NODE_ENV === 'development' ? 'http' : 'https');
        const workerUrl = `${protocol}://${host}/api/cron/blog/generate`;

        console.log(`[Blog Worker] Step: ${step} starting...`);

        if (step === 'editor') {
            const kb = await getFullKnowledgeBaseContext();
            const editorPlan = await runEditorPhase(kb);

            if (await isSlugTaken(editorPlan.slug)) {
                throw new Error(`Duplicate slug: ${editorPlan.slug}`);
            }

            await qstash.publishJSON({
                url: workerUrl,
                body: { step: 'writer', context: { editorPlan } },
                retries: 3,
            });
            console.log(`[Blog Worker] Editor completed. Queued Writer for ${editorPlan.slug}`);
            return NextResponse.json({ success: true, action: 'queued_writer' });
        }

        if (step === 'writer') {
            const kb = await getFullKnowledgeBaseContext();
            const rawContent = await runWriterPhase(context.editorPlan, kb);

            await qstash.publishJSON({
                url: workerUrl,
                body: { step: 'reviewer', context: { editorPlan: context.editorPlan, rawContent } },
                retries: 3,
            });
            console.log(`[Blog Worker] Writer completed. Queued Reviewer for ${context.editorPlan.slug}`);
            return NextResponse.json({ success: true, action: 'queued_reviewer' });
        }

        if (step === 'reviewer') {
            const kb = await getFullKnowledgeBaseContext();
            const finalPostJSON = await runReviewerPhase(context.rawContent, context.editorPlan, kb);

            const finalPost = {
                ...finalPostJSON,
                publishedAt: new Date().toISOString()
            };

            const validation = validateGeneratedPost(finalPost);
            if (!validation.isValid) {
                throw new Error(`Quality Gate Failed: ${validation.errors.join(', ')}`);
            }

            await saveBlogPost(finalPost);

            if (finalPost.slug) {
                revalidatePath('/blog');
                revalidatePath(`/blog/${finalPost.slug}`);
            }

            console.log(`[Blog Worker] Reviewer completed! Published: ${finalPost.slug}`);
            return NextResponse.json({ success: true, action: 'completed', post: finalPost });
        }

    } catch (error) {
        console.error('[Blog Worker] Fatal Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
