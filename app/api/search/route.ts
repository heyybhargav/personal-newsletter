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

// Simple in-memory cache for search results to make repeat searches "cracked" fast
const searchCache = new Map<string, { data: SearchResult[], timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'all';

    if (!query) {
        return NextResponse.json({ error: 'Missing query' }, { status: 400 });
    }

    // Check cache
    const cacheKey = `${query}:${type}`;
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log(`[Search] Cache hit for: "${cacheKey}"`);
        return NextResponse.json({ results: cached.data });
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
                    results = await searchSocial(query);
                    results = results.filter(r => r.type === 'twitter');
                    break;
                default:
                    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
            }
        }

        // Store in cache
        searchCache.set(cacheKey, { data: results, timestamp: Date.now() });

        // Clean up old cache entries if map is getting huge
        if (searchCache.size > 500) {
            const firstKey = searchCache.keys().next().value;
            if (firstKey) searchCache.delete(firstKey);
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
        let [_, channelId, title, thumbUrl] = match;

        if (uniqueChannels.has(channelId)) continue;
        uniqueChannels.add(channelId);

        // Standard unescaping for URLs and titles from raw HTML
        const unescape = (str: string) => {
            return str
                .replace(/\\u0026/g, '&')
                .replace(/\\/g, '')
                .replace(/&amp;/g, '&');
        };

        const cleanThumbUrl = unescape(thumbUrl).startsWith('//') 
            ? 'https:' + unescape(thumbUrl) 
            : unescape(thumbUrl);

        results.push({
            title: title.replace(/\\u0026/g, '&').replace(/&amp;/g, '&'),
            description: 'YouTube Channel',
            url: `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
            type: 'youtube',
            thumbnail: cleanThumbUrl
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
        title: item.data.display_name_prefixed,
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

                    // Use our robust detectSource utility to identify the platform, 
                    // which handles custom domains for Substack, Medium, etc.
                    const detected = detectSource(feedUrl);
                    let type = detected?.type || 'rss';

                    // Extra detection: Feedly metadata often contains platform clues
                    if (type === 'rss' || type === 'blog') {
                        const metadata = (feed.title + ' ' + feed.description + ' ' + feedUrl).toLowerCase();
                        if (metadata.includes('substack')) type = 'substack';
                        else if (metadata.includes('medium')) type = 'medium';
                    }

                    results.push({
                        title: feed.title || 'Unknown Feed',
                        description: feed.description || feed.website || '',
                        url: feedUrl,
                        type,
                        thumbnail: feed.iconUrl || feed.visualUrl || (feed.website ? `https://www.google.com/s2/favicons?domain=${new URL(feed.website).hostname}&sz=64` : '')
                    });
                }
            }
        }
    } catch (e) {
        console.log('[Search] Feedly search failed, trying fallback:', e);
    }

    // Prioritize Substack and Medium within the blog bucket (Substack first)
    results.sort((a, b) => {
        const priorityTypes = ['substack', 'medium'];
        const aPriority = priorityTypes.indexOf(a.type);
        const bPriority = priorityTypes.indexOf(b.type);
        
        if (aPriority !== -1 && bPriority === -1) return -1;
        if (aPriority === -1 && bPriority !== -1) return 1;
        if (aPriority !== -1 && bPriority !== -1) return aPriority - bPriority;
        return 0;
    });

    // Deduplicate: If multiple results have the same base domain or handles, pick the highest quality one
    const seen = new Set<string>();
    const deduplicated = results.filter(r => {
        try {
            const domain = new URL(r.url).hostname.replace('www.', '');
            // Simple deduplication for same-author results
            const key = `${r.type}:${domain}:${r.title.slice(0, 10).toLowerCase()}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        } catch {
            return true;
        }
    });

    return deduplicated;
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

    const twitterResult = await twitterPromise;

    const results: SearchResult[] = [];
    if (twitterResult) results.push(twitterResult);

    return results;
}
