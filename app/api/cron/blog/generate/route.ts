import { NextResponse, after } from 'next/server';
import { revalidatePath } from 'next/cache';
import { Receiver, Client } from '@upstash/qstash';
import { getFullKnowledgeBaseContext, isSlugTaken, saveBlogPost } from '@/lib/blogDb';
import { runEditorPhase, runWriterPhase, runReviewerPhase } from '@/lib/blogEngine';
import { SITE_URL } from '@/lib/config';
import { validateGeneratedPost } from '@/lib/blogValidation';
import { logUsageEvent, logErrorEvent, calculateCost } from '@/lib/db';

export const dynamic = 'force-dynamic';
// Gemini 3.1 Pro is slow to load KB context.
export const maxDuration = 300;

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
        const attempt = body.attempt || 1;
        const lastErrors = body.lastErrors || [];

        console.log(`\n========= [Blog Worker] STEP EXECUTING: ${step.toUpperCase()} (Attempt: ${attempt}) =========`);

        const workerUrl = `${SITE_URL}/api/cron/blog/generate`;

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
                        body: { step: 'writer', context: { editorPlan }, attempt: 1 },
                        retries: 3,
                    });
                    console.log(`[Blog Worker Background] Editor completed. Queued Writer for ${editorPlan.slug}`);
                } catch (err: any) {
                    console.error('[Blog Worker Background] Editor failed:', err);
                    await logErrorEvent({
                        email: 'SYSTEM',
                        stage: 'blog_editor',
                        message: err.message || String(err),
                        timestamp: new Date().toISOString()
                    });
                }
            });
            return NextResponse.json({ success: true, action: 'queued_editor_bg' });
        }

        if (step === 'writer') {
            after(async () => {
                try {
                    const kb = await getFullKnowledgeBaseContext();
                    const rawContent = await runWriterPhase(context.editorPlan, kb, lastErrors);

                    await qstash.publishJSON({
                        url: workerUrl,
                        body: { step: 'reviewer', context: { editorPlan: context.editorPlan, rawContent }, attempt },
                        retries: 3,
                    });
                    console.log(`[Blog Worker Background] Writer completed. Queued Reviewer for ${context.editorPlan.slug}`);
                } catch (err: any) {
                    console.error('[Blog Worker Background] Writer failed:', err);
                    await logErrorEvent({
                        email: 'SYSTEM',
                        stage: 'blog_writer',
                        message: err.message || String(err),
                        timestamp: new Date().toISOString()
                    });
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
                        console.error(`[Blog Worker Background] Quality Gate Failed (Attempt ${attempt}): ${validation.errors.join(', ')}`);

                        // Log the failure
                        await logErrorEvent({
                            email: 'SYSTEM',
                            stage: `blog_validation_v${attempt}`,
                            message: `Quality Gate Fail: ${validation.errors.join(' | ')}`,
                            timestamp: new Date().toISOString()
                        });

                        if (attempt < 3) {
                            console.log(`[Blog Worker Background] Retrying Writer phase with error feedback...`);
                            await qstash.publishJSON({
                                url: workerUrl,
                                body: {
                                    step: 'writer',
                                    context: { editorPlan: context.editorPlan },
                                    attempt: attempt + 1,
                                    lastErrors: validation.errors
                                },
                                retries: 3,
                            });
                        } else {
                            console.error(`[Blog Worker Background] Max retries reached for ${context.editorPlan.slug}. Aborting.`);
                        }
                        return;
                    }

                    console.log(`[Blog Worker Background] Reviewer completed! Post valid. Saving...`);
                    await saveBlogPost(finalPost);

                    // --- Final Telemetry & On-Demand ISR ---
                    const tu = finalPostJSON.tokenUsage;
                    if (tu) {
                        await logUsageEvent({
                            email: 'SYSTEM',
                            provider: tu.provider,
                            model: tu.model,
                            inputTokens: tu.input,
                            outputTokens: tu.output,
                            cost: calculateCost(tu.provider, tu.input, tu.output),
                            timestamp: new Date().toISOString()
                        });
                    }

                    revalidatePath('/blog');
                    if (finalPost.slug) revalidatePath(`/blog/${finalPost.slug}`);

                    console.log(`[Blog Worker Background] Reviewer completed! Published: ${finalPost.slug}`);
                } catch (err: any) {
                    console.error('[Blog Worker Background] Reviewer failed:', err);
                    await logErrorEvent({
                        email: 'SYSTEM',
                        stage: 'blog_reviewer',
                        message: err.message || String(err),
                        timestamp: new Date().toISOString()
                    });
                }
            });
            return NextResponse.json({ success: true, action: 'queued_reviewer_bg' });
        }

    } catch (error: any) {
        console.error('[Blog Worker] Fatal Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
