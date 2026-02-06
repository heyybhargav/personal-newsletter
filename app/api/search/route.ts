import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

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
            default:
                return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
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

    // Extract channel IDs using regex since YouTube loads data dynamically
    const channelPattern = /"channelId":"(UC[\w-]+)"/g;
    const titlePattern = /"params":"[^"]+","title":\{"runs":\[\{"text":"([^"]+)"\}\]/g;

    const matches = [...html.matchAll(channelPattern)];
    // Simple fallback: construct results for the first few Unique channel IDs found
    const uniqueChannels = new Set<string>();
    const results: SearchResult[] = [];

    for (const match of matches) {
        const channelId = match[1];
        if (uniqueChannels.has(channelId)) continue;
        uniqueChannels.add(channelId);

        results.push({
            title: `Channel matching "${query}" (${channelId})`, // Title is hard to extract reliably from regex, this is a MVP fallback
            description: 'YouTube Channel',
            url: `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
            type: 'youtube'
        });

        if (results.length >= 3) break;
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
    // Google News RSS Search
    const topic = encodeURIComponent(query);
    return [{
        title: `${query} News (Google News)`,
        description: `Top stories for ${query}`,
        url: `https://news.google.com/rss/search?q=${topic}&hl=en-US&gl=US&ceid=US:en`,
        type: 'news'
    }];
}

async function searchReddit(query: string): Promise<SearchResult[]> {
    // Search for subreddits via Reddit API (public)
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
