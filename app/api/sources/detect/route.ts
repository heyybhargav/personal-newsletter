import { NextResponse } from 'next/server';
import { detectSourceFromUrl, getFaviconUrl } from '@/lib/url-detector';
import Parser from 'rss-parser';

const parser = new Parser({
    customFields: {
        item: ['media:thumbnail', 'media:content']
    }
});

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'URL parameter required' }, { status: 400 });
    }

    try {
        // Step 1: Detect source type from URL
        const detected = detectSourceFromUrl(url);

        if (!detected) {
            return NextResponse.json({ error: 'Could not detect source type from URL' }, { status: 400 });
        }

        // Step 2: Try to fetch sample content from the feed
        let sampleItems: { title: string; link: string; pubDate?: string }[] = [];
        const feedUrl = detected.feedUrl;

        try {
            // Special handling for YouTube @handle URLs - need to resolve channel ID
            if (detected.type === 'youtube' && !feedUrl.includes('channel_id=')) {
                // For now, use the original URL; server-side resolution would require additional API
                // We'll try the URL as-is
            }

            // Try to parse the feed
            const feed = await parser.parseURL(feedUrl);
            sampleItems = feed.items.slice(0, 3).map(item => ({
                title: item.title || 'Untitled',
                link: item.link || '',
                pubDate: item.pubDate || item.isoDate
            }));

            // Update name from feed if better
            if (feed.title && feed.title.length > 0) {
                detected.name = feed.title;
            }
        } catch (feedError: unknown) {
            const err = feedError as Error;
            console.log('[Detect] Could not fetch sample items:', err.message);
            // Feed parsing failed, but we can still return the detected source
            // User will see a warning that we couldn't preview content
        }

        // ... (favicon logic) ...

        return NextResponse.json({
            detected: {
                ...detected,
                feedUrl,
            },
            sampleItems,
            canPreview: sampleItems.length > 0,
        });

    } catch (error: unknown) {
        const err = error as Error;
        console.error('[Detect] Error:', err);
        return NextResponse.json({
            error: 'Failed to detect source',
            details: err.message
        }, { status: 500 });
    }
}
