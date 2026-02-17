import Parser from 'rss-parser';
import { ContentItem, SourceType } from './types';

const parser = new Parser({
    customFields: {
        item: [
            ['media:thumbnail', 'media:thumbnail'],
            ['media:content', 'media:content'],
            ['media:group', 'media:group'],
            ['content:encoded', 'content:encoded'],
            ['itunes:summary', 'itunes:summary'],
            ['itunes:image', 'itunes:image']
        ]
    }
});

export async function parseRSSFeed(url: string, sourceType: SourceType, sourceName: string): Promise<ContentItem[]> {
    try {
        const feed = await parser.parseURL(url);

        return feed.items.map(item => {
            // Type assertion for RSS item properties
            const rssItem = item as any;

            // Extract thumbnail with multiple fallbacks
            let thumbnail = '';

            // 1. YouTube: media:group -> media:thumbnail
            if (rssItem['media:group'] && rssItem['media:group']['media:thumbnail']) {
                // Usually an array, take the first (often distinct by size)
                const thumb = Array.isArray(rssItem['media:group']['media:thumbnail'])
                    ? rssItem['media:group']['media:thumbnail'][0]
                    : rssItem['media:group']['media:thumbnail'];
                thumbnail = thumb?.$?.url || thumb?.url || '';
            }
            // 2. Standard media:thumbnail
            else if (rssItem['media:thumbnail']) {
                thumbnail = rssItem['media:thumbnail'].$?.url || rssItem['media:thumbnail'].url || '';
            }
            // 3. Enclosure if image
            else if (item.enclosure && item.enclosure.url && item.enclosure.type?.startsWith('image')) {
                thumbnail = item.enclosure.url;
            }

            // Extract best content/description
            let description = '';

            // Priority 1: YouTube Description (media:group -> media:description)
            if (rssItem['media:group'] && rssItem['media:group']['media:description']) {
                const desc = rssItem['media:group']['media:description'];
                description = Array.isArray(desc) ? desc[0] : desc;
            }
            // Priority 2: Podcast/Rich Blog Content (content:encoded)
            else if (rssItem['content:encoded']) {
                description = rssItem['content:encoded'];
            }
            // Priority 3: iTunes Summary
            else if (rssItem['itunes:summary']) {
                description = rssItem['itunes:summary'];
            }
            // Priority 4: Standard Fallbacks
            else {
                description = item.content || item.contentSnippet || rssItem.description || '';
            }

            // 4. Fallback: Parse <img> from description/content
            if (!thumbnail) {
                const imgMatch = description.match(/<img[^>]+src=["']([^"']+)["']/i) ||
                    (item.content ? item.content.match(/<img[^>]+src=["']([^"']+)["']/i) : null);

                if (imgMatch) {
                    thumbnail = imgMatch[1];
                }
            }

            // Fix relative URLs (common in Nitter/RSSHub)
            if (thumbnail && thumbnail.startsWith('/')) {
                try {
                    // Try to resolve against link or feed origin
                    const baseUrl = new URL(item.link || url).origin;
                    thumbnail = new URL(thumbnail, baseUrl).toString();
                } catch { }
            }

            return {
                title: item.title || 'No title',
                description: description,
                link: item.link || '',
                pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
                source: sourceName,
                sourceType, // Use the passed sourceType
                thumbnail
            };
        });
    } catch (error) {
        console.error(`Error parsing RSS feed ${url}:`, error);
        return [];
    }
}

export async function parseMultipleFeeds(sources: Array<{ url: string; type: SourceType; name: string; enabled: boolean }>): Promise<ContentItem[]> {
    const enabledSources = sources.filter(s => s.enabled);

    const results = await Promise.allSettled(
        enabledSources.map(source => parseRSSFeed(source.url, source.type, source.name))
    );

    const allItems: ContentItem[] = [];
    results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
            allItems.push(...result.value);
        } else {
            console.error(`Failed to parse ${enabledSources[index].name}:`, result.reason);
        }
    });

    return allItems;
}

// Helper functions to generate RSS URLs
export function getYouTubeChannelRSS(channelId: string): string {
    return `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
}

export function getRedditSubredditRSS(subreddit: string): string {
    return `https://www.reddit.com/r/${subreddit}/.rss`;
}
