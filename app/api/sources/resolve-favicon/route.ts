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

    // YouTube: use multiple strategies to get channel avatar
    if (detected.type === 'youtube') {
        // Strategy 1: Parse the YouTube Atom feed — extract channel ID, then use oembed
        if (feedUrl.includes('channel_id=')) {
            try {
                const channelId = new URL(feedUrl).searchParams.get('channel_id');
                if (channelId) {
                    // Use YouTube's public oembed endpoint — no API key needed
                    const oembedRes = await fetch(
                        `https://www.youtube.com/oembed?url=https://www.youtube.com/channel/${channelId}&format=json`,
                        { signal: AbortSignal.timeout(5000) }
                    );
                    if (oembedRes.ok) {
                        const data = await oembedRes.json();
                        if (data.thumbnail_url) return data.thumbnail_url;
                    }
                }
            } catch {
                // Continue to next strategy
            }
        }

        // Strategy 2: Try @handle page scraping (for handle-based URLs)
        const originalUrl = url.includes('youtube.com/@') ? url : null;
        if (originalUrl) {
            try {
                const res = await fetch(originalUrl, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
                    signal: AbortSignal.timeout(5000)
                });
                const html = await res.text();
                const match = html.match(/<meta property="og:image" content="([^"]+)"/);
                if (match) return match[1];
            } catch {
                // Fallback below
            }
        }

        // YouTube fallback: generic YouTube favicon
        return 'https://www.youtube.com/favicon.ico';
    }

    // Non-YouTube: Try RSS feed image (best for podcasts, newsletters)
    try {
        const feed = await parser.parseURL(feedUrl);

        // @ts-ignore — itunes namespace
        const itunesImage = feed.itunes?.image;
        if (itunesImage) return itunesImage;

        if (feed.image?.url) return feed.image.url;
    } catch {
        // Feed parsing failed, continue to website scraping
    }

    // Try scraping the website for high-quality icons
    try {
        const siteUrl = detected.originalUrl || url;
        const hostname = new URL(siteUrl).origin;
        const res = await fetch(hostname, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
            signal: AbortSignal.timeout(5000),
            redirect: 'follow'
        });
        const html = await res.text();

        // Priority 1: apple-touch-icon (typically 180x180, highest quality)
        const appleIcon = html.match(/<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i);
        if (appleIcon) return resolveUrl(appleIcon[1], hostname);

        // Priority 2: Large favicon from <link> tags (size >= 64)
        const iconLinks = [...html.matchAll(/<link[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*>/gi)];
        let bestIcon = '';
        let bestSize = 0;
        for (const iconMatch of iconLinks) {
            const tag = iconMatch[0];
            const href = tag.match(/href=["']([^"']+)["']/)?.[1];
            const sizes = tag.match(/sizes=["'](\d+)x\d+["']/)?.[1];
            const size = sizes ? parseInt(sizes) : 0;
            if (href && size > bestSize) {
                bestSize = size;
                bestIcon = href;
            }
        }
        if (bestIcon && bestSize >= 64) return resolveUrl(bestIcon, hostname);

        // Priority 3: og:image (usually large, good quality)
        const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
        if (ogImage) return resolveUrl(ogImage[1], hostname);

        // Priority 4: Any favicon link tag
        if (bestIcon) return resolveUrl(bestIcon, hostname);
    } catch {
        // Website scraping failed, use Google fallback
    }

    // Final fallback: Google favicon service
    return getFaviconUrl(url);
}

/** Resolve relative URLs to absolute */
function resolveUrl(href: string, base: string): string {
    if (href.startsWith('http')) return href;
    if (href.startsWith('//')) return 'https:' + href;
    if (href.startsWith('/')) return base + href;
    return base + '/' + href;
}
