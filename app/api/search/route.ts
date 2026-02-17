import { NextResponse } from 'next/server';
import { getSubstackFeedUrl, detectSource, SourceType } from '@/lib/url-detector';
import { parseRSSFeed } from '@/lib/rss-parser';
import { fetchTwitterSyndication } from '@/lib/twitter-syndication';

interface SearchResult {
    title: string;
    description: string;
    url: string;
    type: string;
    thumbnail?: string;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type');

    if (!query || !type) {
        return NextResponse.json({ error: 'Missing query or type' }, { status: 400 });
    }

    try {
        let results: SearchResult[] = [];

        if (type === 'all' || !type) {
            // Universal search: Run all providers in parallel
            const [youtube, podcasts, reddit, news, blogs, social] = await Promise.allSettled([
                searchYouTube(query),
                searchPodcasts(query),
                searchReddit(query),
                searchNews(query),
                searchBlogs(query),
                searchSocial(query)
            ]);

            // Helper to get value or empty array
            const getResults = (r: PromiseSettledResult<SearchResult[]>) =>
                r.status === 'fulfilled' ? r.value : [];

            // Interleave results so no single type dominates
            const allBuckets = [
                getResults(blogs),
                getResults(social), // Social bridge matches are high intent, prioritize them
                getResults(youtube),
                getResults(podcasts),
                getResults(reddit),
                getResults(news)
            ];

            // Round-robin: pick one from each bucket in turn
            const maxLen = Math.max(...allBuckets.map(b => b.length));
            for (let i = 0; i < maxLen; i++) {
                for (const bucket of allBuckets) {
                    if (i < bucket.length) {
                        results.push(bucket[i]);
                    }
                }
            }
        } else {
            switch (type) {
                case 'youtube':
                    results = await searchYouTube(query);
                    break;
                case 'podcast':
                    results = await searchPodcasts(query);
                    break;
                case 'news':
                    results = await searchNews(query);
                    break;
                case 'reddit':
                    results = await searchReddit(query);
                    break;
                case 'blog':
                case 'rss':
                    results = await searchBlogs(query);
                    break;
                case 'twitter':
                case 'instagram':
                    const socialResults = await searchSocial(query);
                    results = socialResults.filter(r => r.type === type);
                    break;
                default:
                    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
            }
        }

        return NextResponse.json({ results });
    } catch (error: any) {
        console.error('Search error:', error);
        return NextResponse.json({ error: 'Search failed', details: error.message }, { status: 500 });
    }
}

async function searchYouTube(query: string): Promise<SearchResult[]> {
    // Scrape YouTube search results for channels
    const response = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAg%253D%253D`, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    });
    const html = await response.text();

    const results: SearchResult[] = [];
    const uniqueChannels = new Set<string>();

    const channelRegex = /"channelRenderer":\{"channelId":"(UC[\w-]+)","title":\{"simpleText":"([^"]+)"\}.*?"thumbnails":\[\{"url":"([^"]+)"/g;

    let match;
    while ((match = channelRegex.exec(html)) !== null) {
        const [_, channelId, title, thumbUrl] = match;

        if (uniqueChannels.has(channelId)) continue;
        uniqueChannels.add(channelId);

        let fullThumbUrl = thumbUrl;
        if (fullThumbUrl.startsWith('//')) {
            fullThumbUrl = 'https:' + fullThumbUrl;
        }

        results.push({
            title: title,
            description: 'YouTube Channel',
            url: `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
            type: 'youtube',
            thumbnail: fullThumbUrl
        });

        if (results.length >= 5) break;
    }

    return results;
}

async function searchPodcasts(query: string): Promise<SearchResult[]> {
    const response = await fetch(`https://itunes.apple.com/search?media=podcast&term=${encodeURIComponent(query)}&limit=5`);
    const data = await response.json();

    return data.results.map((item: any) => ({
        title: item.collectionName,
        description: item.artistName,
        url: item.feedUrl,
        type: 'podcast',
        thumbnail: item.artworkUrl100
    }));
}

async function searchNews(query: string): Promise<SearchResult[]> {
    const topic = encodeURIComponent(query);
    return [{
        title: `${query} News (Google News)`,
        description: `Top stories for ${query}`,
        url: `https://news.google.com/rss/search?q=${topic}&hl=en-US&gl=US&ceid=US:en`,
        type: 'news'
    }];
}

async function searchReddit(query: string): Promise<SearchResult[]> {
    const response = await fetch(`https://www.reddit.com/subreddits/search.json?q=${encodeURIComponent(query)}&limit=5`);
    const data = await response.json();

    return data.data.children.map((item: any) => ({
        title: `r/${item.data.display_name_prefixed}`,
        description: item.data.public_description || `Subreddit for ${query}`,
        url: `https://www.reddit.com${item.data.url}.rss`,
        type: 'reddit',
        thumbnail: item.data.icon_img
    }));
}

async function searchBlogs(query: string): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    // Use Feedly's public feed search API for global RSS discovery
    try {
        const response = await fetch(
            `https://cloud.feedly.com/v3/search/feeds?query=${encodeURIComponent(query)}&count=8&locale=en`,
            {
                headers: { 'User-Agent': 'Mozilla/5.0' },
                signal: AbortSignal.timeout(5000)
            }
        );

        if (response.ok) {
            const data = await response.json();
            if (data.results && Array.isArray(data.results)) {
                for (const feed of data.results) {
                    // Skip YouTube/Reddit/podcast feeds — those are handled by dedicated providers
                    const feedUrl = feed.feedId?.replace('feed/', '') || '';
                    if (feedUrl.includes('youtube.com') || feedUrl.includes('reddit.com') || feedUrl.includes('itunes.apple.com')) continue;

                    // Determine type based on URL patterns
                    // Determine type based on URL patterns
                    let type = 'rss';
                    if (feedUrl.includes('substack.com')) type = 'substack';
                    else if (feedUrl.includes('medium.com')) type = 'medium';
                    else if (feedUrl.includes('nitter') || feed.website?.includes('twitter.com') || feed.website?.includes('x.com')) type = 'twitter';
                    else if (feedUrl.includes('rsshub') && (feedUrl.includes('instagram') || feed.website?.includes('instagram.com'))) type = 'instagram';
                    else if (feed.description?.toLowerCase().includes('newsletter')) type = 'newsletter';

                    results.push({
                        title: feed.title || 'Unknown Feed',
                        description: feed.description || feed.website || '',
                        url: feedUrl,
                        type,
                        thumbnail: feed.iconUrl || feed.visualUrl || (feed.website ? `https://www.google.com/s2/favicons?domain=${new URL(feed.website).hostname}&sz=64` : '')
                    });

                    if (results.length >= 5) break;
                }
            }
        }
    } catch (e) {
        console.log('[Search] Feedly search failed, trying fallback:', e);
    }

    // Fallback: If Feedly returned nothing, try Substack-specific search
    if (results.length === 0) {
        try {
            // Try querying for the term as a Substack publication
            const substackUrl = `https://${query.toLowerCase().replace(/\s+/g, '')}.substack.com`;
            const checkRes = await fetch(substackUrl, {
                method: 'HEAD',
                signal: AbortSignal.timeout(3000),
                redirect: 'follow'
            });
            if (checkRes.ok) {
                results.push({
                    title: query,
                    description: 'Substack Newsletter',
                    url: `${substackUrl}/feed`,
                    type: 'substack',
                    thumbnail: `https://www.google.com/s2/favicons?domain=${query.toLowerCase().replace(/\s+/g, '')}.substack.com&sz=64`
                });
            }
        } catch {
            // Substack check failed silently
        }
    }

    return results;
}

async function searchSocial(query: string): Promise<SearchResult[]> {
    const handle = query.trim().replace(/^@/, '');
    if (handle.includes(' ') || handle.length < 2) return [];

    // 1. Twitter Search (via Syndication)
    const twitterPromise = (async (): Promise<SearchResult | null> => {
        try {
            const tweets = await fetchTwitterSyndication(handle);
            if (tweets.length > 0) {
                const user = tweets[0].user;
                return {
                    title: `${user.name} (@${user.screen_name})`,
                    description: user.description || `Twitter feed for @${handle}`,
                    url: `https://syndication.twitter.com/srv/timeline-profile/screen-name/${handle}`,
                    type: 'twitter',
                    thumbnail: user.profile_image_url_https.replace('_normal', '')
                };
            }
        } catch (e) {
            console.error('Twitter search failed:', e);
        }
        return null;
    })();

    // 2. Instagram Search (via Bridges)
    // We race multiple instances to find one that works
    const instagramBridges = [
        `https://rsshub.app/instagram/user/${handle}`,
        `https://rsshub.feeddd.org/instagram/user/${handle}`,
        `https://pixelfed.social/users/${handle}.atom`,
        `https://rsshub.rss.style/instagram/user/${handle}`
    ];

    const instagramPromise = (async (): Promise<SearchResult | null> => {
        try {
            // Race to find the first working bridge
            const validBridge = await Promise.any(instagramBridges.map(async (url) => {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 4000);

                try {
                    const res = await fetch(url, {
                        method: 'GET',
                        signal: controller.signal,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                            'Accept': 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8'
                        }
                    });
                    clearTimeout(timeout);

                    if (!res.ok) throw new Error(`Status ${res.status}`);

                    const contentType = res.headers.get('content-type');
                    const text = await res.text();

                    // Simple validation
                    if (text.length > 50 && (text.includes('<rss') || text.includes('<feed') || contentType?.includes('xml'))) {
                        return url;
                    }
                    throw new Error('Invalid content');
                } catch (e) {
                    clearTimeout(timeout);
                    throw e;
                }
            }));

            return {
                title: `@${handle} (Instagram)`,
                description: `Instagram Feed via Bridge`,
                url: validBridge,
                type: 'instagram',
                thumbnail: 'https://www.google.com/s2/favicons?domain=instagram.com&sz=128'
            };
        } catch {
            return null;
        }
    })();

    const [twitterResult, instagramResult] = await Promise.all([
        twitterPromise,
        instagramPromise
    ]);

    const results: SearchResult[] = [];
    if (twitterResult) results.push(twitterResult);
    if (instagramResult) results.push(instagramResult);

    return results;
}
