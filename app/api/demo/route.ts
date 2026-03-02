import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { fetchDemoUrls } from '@/lib/demo-fetcher';
import { generateUnifiedBriefing } from '@/lib/gemini';

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '',
    token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '',
});

const MAX_REQUESTS_PER_DAY = 3;
const MAX_URLS_PER_REQUEST = 3;
const RATE_LIMIT_TTL = 86400; // 24 hours in seconds

function getClientIp(req: NextRequest): string {
    return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || req.headers.get('x-real-ip')
        || 'unknown';
}

const URL_REGEX = /^https?:\/\/.+/i;

export async function POST(req: NextRequest) {
    try {
        // 1. Parse and validate request body
        const body = await req.json();
        const { urls } = body;

        if (!Array.isArray(urls) || urls.length === 0) {
            return NextResponse.json({ error: 'Please provide at least one URL.' }, { status: 400 });
        }

        if (urls.length > MAX_URLS_PER_REQUEST) {
            return NextResponse.json({ error: `Maximum ${MAX_URLS_PER_REQUEST} URLs allowed per request.` }, { status: 400 });
        }

        // Validate each URL
        for (const url of urls) {
            if (typeof url !== 'string' || !URL_REGEX.test(url)) {
                return NextResponse.json({ error: `Invalid URL: "${url}". Please provide valid HTTP(S) URLs.` }, { status: 400 });
            }
        }

        // 2. Rate Limit Check
        const ip = getClientIp(req);
        const rateLimitKey = `demo:ratelimit:${ip}`;

        const currentCount = await redis.incr(rateLimitKey);

        // Set TTL on first request
        if (currentCount === 1) {
            await redis.expire(rateLimitKey, RATE_LIMIT_TTL);
        }

        if (currentCount > MAX_REQUESTS_PER_DAY) {
            return NextResponse.json({
                error: 'You\'ve used all 3 free demos for today. Sign up to get unlimited daily briefings delivered to your inbox.',
                rateLimited: true,
            }, { status: 429 });
        }

        // 3. Fetch and extract content from URLs
        console.log(`[Demo API] Processing ${urls.length} URLs for IP: ${ip} (usage: ${currentCount}/${MAX_REQUESTS_PER_DAY})`);

        const contentItems = await fetchDemoUrls(urls);

        if (contentItems.length === 0) {
            return NextResponse.json({
                error: 'We couldn\'t extract readable content from those URLs. Try pasting a blog post, news article, or Substack link.',
            }, { status: 422 });
        }

        // 4. Synthesize with Gemini
        const briefing = await generateUnifiedBriefing(contentItems, 'gemini');

        return NextResponse.json({
            narrative: briefing.narrative,
            subject: briefing.subject,
            sourcesProcessed: contentItems.length,
            remainingUses: MAX_REQUESTS_PER_DAY - currentCount,
        });

    } catch (error: any) {
        console.error('[Demo API] Error:', error.message || error);
        return NextResponse.json({
            error: 'Something went wrong while generating your briefing. Please try again.',
        }, { status: 500 });
    }
}
