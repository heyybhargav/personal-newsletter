import { NextResponse } from 'next/server';
import { detectSourceFromUrl, getFaviconUrl } from '@/lib/url-detector';
import Parser from 'rss-parser';

const parser = new Parser({
    customFields: {
        item: ['media:thumbnail', 'media:content']
    }
});

/**
 * Lightweight favicon resolver — uses the same logic as /api/sources/detect
 * but skips sample items for speed. Accepts a single URL or batch of URLs.
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const urls: string[] = Array.isArray(body.urls) ? body.urls : [body.url];

        const favicons: Record<string, string> = {};
        const BATCH_SIZE = 8;

        // Process in batches to avoid timeout and rate-limiting
        for (let i = 0; i < urls.length; i += BATCH_SIZE) {
            const batch = urls.slice(i, i + BATCH_SIZE);
            const results = await Promise.allSettled(
                batch.map(url => resolveOneFavicon(url))
            );

            results.forEach((result, j) => {
                const url = batch[j];
                if (result.status === 'fulfilled') {
                    favicons[url] = result.value;
                } else {
                    favicons[url] = getFaviconUrl(url);
                }
            });
        }

        return NextResponse.json({ favicons });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to resolve favicons' }, { status: 500 });
    }
}

async function resolveOneFavicon(url: string): Promise<string> {
    const detected = detectSourceFromUrl(url);
    if (!detected) return getFaviconUrl(url);

    const feedUrl = detected.feedUrl;

    // Try RSS feed image (best for podcasts, newsletters)
    try {
        const feed = await parser.parseURL(feedUrl);

        // @ts-ignore — itunes namespace
        const itunesImage = feed.itunes?.image;
        if (itunesImage) return itunesImage;

        if (feed.image?.url) return feed.image.url;
    } catch {
        // Feed parsing failed, continue to fallbacks
    }

    // YouTube: scrape og:image for channel avatar
    if (detected.type === 'youtube' && feedUrl.includes('channel_id=')) {
        try {
            const channelId = new URL(feedUrl).searchParams.get('channel_id');
            if (channelId) {
                const res = await fetch(`https://www.youtube.com/channel/${channelId}`, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' }
                });
                const html = await res.text();
                const match = html.match(/<meta property="og:image" content="([^"]+)"/);
                if (match) return match[1];
            }
        } catch {
            // Fallback below
        }
    }

    // YouTube @handle: try scraping the handle page directly
    if (detected.type === 'youtube' && url.includes('youtube.com/@')) {
        try {
            const res = await fetch(url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' }
            });
            const html = await res.text();
            const match = html.match(/<meta property="og:image" content="([^"]+)"/);
            if (match) return match[1];
        } catch {
            // Fallback below
        }
    }

    // Final fallback: Google favicon service
    return getFaviconUrl(url);
}
