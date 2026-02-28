import { NextRequest, NextResponse, after } from 'next/server';
import { getUser, saveUser, saveLatestBriefing, updateLastDigestAt, logUsageEvent, calculateCost, getTrialDaysRemaining, logErrorEvent, saveBriefingToArchive } from '@/lib/db';
import { aggregateContent } from '@/lib/content-aggregator';
import { generateUnifiedBriefing } from '@/lib/gemini';
import { sendUnifiedDigestEmail } from '@/lib/email';
import { checkSubscriptionStatus } from '@/lib/subscription';

export const maxDuration = 60; // Max allowed for Vercel Hobby plan
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        // --- Auth ---
        const authHeader = request.headers.get('authorization');

        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { email, force, dryRun } = body;

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const user = await getUser(email);
        if (!user || !user.sources.length) {
            return NextResponse.json({ status: 'skipped', detail: 'no_sources' });
        }

        // --- Pause Logic ---
        const subStatus = checkSubscriptionStatus(user);
        if (subStatus.action === 'skip') {
            return NextResponse.json({ status: 'skipped', detail: subStatus.reason });
        }

        console.log(`[Worker] Accepted ${email} for background processing`);

        // Perform the heavy processing strictly after the response has been sent
        after(async () => {
            try {
                console.log(`[Worker Background] Processing ${email}`);
                console.log(`[Worker Background] LLM Provider: "${user.preferences.llmProvider || 'groq (default)'}"`);

                const content = await aggregateContent(user.sources, { lookbackDays: force ? 3 : 1 });
                if (content.length === 0) {
                    console.log(`[Worker Background] Skipped ${email} (no content)`);
                    return;
                }

                const briefing = await generateUnifiedBriefing(content, user.preferences.llmProvider);

                if (dryRun) {
                    console.log(`[Worker Background] DRY RUN completed for ${email}. Skipping email and DB updates. Output generated successfully.`);
                    return;
                }

                // Pass trial context to email for the countdown footer
                const isTrial = user.tier === 'trial';
                const trialDaysRemaining = isTrial ? getTrialDaysRemaining(user) : 0;
                await sendUnifiedDigestEmail(user.email, briefing, isTrial ? { isTrial, trialDaysRemaining } : undefined);

                // Track granular stats
                const tu = briefing.tokenUsage;
                const currentStats = user.stats || { inputTokens: 0, outputTokens: 0, totalBriefingsSent: 0 };
                user.stats = {
                    inputTokens: currentStats.inputTokens + (tu?.input || 0),
                    outputTokens: currentStats.outputTokens + (tu?.output || 0),
                    totalBriefingsSent: currentStats.totalBriefingsSent + 1
                };
                await saveUser(user);

                // Log usage event for day-wise analytics
                if (tu && (tu.input > 0 || tu.output > 0)) {
                    await logUsageEvent({
                        email: user.email,
                        provider: tu.provider,
                        model: tu.model,
                        inputTokens: tu.input,
                        outputTokens: tu.output,
                        cost: calculateCost(tu.provider, tu.input, tu.output),
                        timestamp: new Date().toISOString()
                    });
                }

                // Add to persistent History Architecture
                const todayLocal = new Date().toISOString().split('T')[0];
                await saveBriefingToArchive(email, todayLocal, briefing);

                await saveLatestBriefing(email, briefing);
                await updateLastDigestAt(email);

                console.log(`[Worker Background] Sent to ${email} (${content.length} items, ${tu?.input || 0}in/${tu?.output || 0}out tokens)`);
            } catch (err: any) {
                console.error(`[Worker Background] Failed heavily for user ${email}:`, err);
                await logErrorEvent({
                    email,
                    stage: 'worker_generate',
                    message: err.message || String(err),
                    timestamp: new Date().toISOString()
                });
            }
        });

        // Instantaneously return to free up the caller (cron)
        return NextResponse.json({
            success: true,
            status: 'processing',
            email,
            detail: 'Handed off to background queue'
        });
    } catch (error: any) {
        console.error('[Worker] Fatal setup API error:', error);
        return NextResponse.json({ error: 'Worker setup failed', details: error.message }, { status: 500 });
    }
}
