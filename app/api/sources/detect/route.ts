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
        let feedUrl = detected.feedUrl;

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

            // Extract feed image (itunes:image or image.url)
            if (!detected.favicon || detected.favicon.includes('google.com/s2/favicons')) {
                // @ts-ignore
                const itunesImage = feed.itunes?.image;
                if (itunesImage) {
                    detected.favicon = itunesImage;
                } else if (feed.image?.url) {
                    detected.favicon = feed.image.url;
                }
            }
        } catch (feedError: any) {
            console.log('[Detect] Could not fetch sample items:', feedError.message);
            // Feed parsing failed, but we can still return the detected source
            // User will see a warning that we couldn't preview content
        }

        // Step 2.5: If YouTube, try to fetch channel avatar
        if (detected.type === 'youtube' && feedUrl.includes('channel_id=')) {
            try {
                const channelId = new URL(feedUrl).searchParams.get('channel_id');
                if (channelId) {
                    // Try scraping the channel page for og:image first (more reliable than oEmbed for channels)
                    const channelUrl = `https://www.youtube.com/channel/${channelId}`;
                    const channelRes = await fetch(channelUrl, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                        },
                        signal: AbortSignal.timeout(5000)
                    });
                    
                    if (channelRes.ok) {
                        const html = await channelRes.text();
                        const ogImageMatch = html.match(/<meta property="og:image" content="([^"]+)">/);
                        if (ogImageMatch) {
                            detected.favicon = ogImageMatch[1];
                        } else {
                            // Fallback to oEmbed if scraping fails
                            const oembedRes = await fetch(
                                `https://www.youtube.com/oembed?url=${channelUrl}&format=json`,
                                { signal: AbortSignal.timeout(5000) }
                            );
                            if (oembedRes.ok) {
                                const data = await oembedRes.json();
                                if (data.thumbnail_url) {
                                    detected.favicon = data.thumbnail_url;
                                }
                            }
                        }
                    }
                }
            } catch (e) {
                console.log('[Detect] Failed to fetch channel avatar:', e);
            }
        }

        // Step 3: Ensure we have a good favicon (fallback)
        if (!detected.favicon || detected.favicon.includes('favicon.ico')) {
            if (detected.type !== 'youtube') { // Don't overwrite if we just failed to get yt avatar, keep the generic one
                detected.favicon = getFaviconUrl(url);
            }
        }

        return NextResponse.json({
            detected: {
                ...detected,
                feedUrl,
            },
            sampleItems,
            canPreview: sampleItems.length > 0,
        });

    } catch (error: any) {
        console.error('[Detect] Error:', error);
        return NextResponse.json({
            error: 'Failed to detect source',
            details: error.message
        }, { status: 500 });
    }
}
