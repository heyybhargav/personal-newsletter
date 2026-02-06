import { parseMultipleFeeds } from './rss-parser';
import { ContentItem, Source } from './types';
import { subDays, isAfter } from 'date-fns';

export async function aggregateContent(sources: Source[]): Promise<ContentItem[]> {
    // Parse all feeds
    const allItems = await parseMultipleFeeds(sources);

    // Filter to last 24 hours
    const oneDayAgo = subDays(new Date(), 1);
    const recentItems = allItems.filter(item => {
        try {
            const itemDate = new Date(item.pubDate);
            return isAfter(itemDate, oneDayAgo);
        } catch {
            return false;
        }
    });

    // Sort by date (newest first)
    const sorted = recentItems.sort((a, b) => {
        return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
    });

    // Deduplicate by title (simple approach)
    const seen = new Set<string>();
    const deduplicated = sorted.filter(item => {
        const normalized = item.title.toLowerCase().trim();
        if (seen.has(normalized)) {
            return false;
        }
        seen.add(normalized);
        return true;
    });

    return deduplicated;
}

// Group items by source type for better organization
export function groupBySourceType(items: ContentItem[]): Record<string, ContentItem[]> {
    const grouped: Record<string, ContentItem[]> = {};

    items.forEach(item => {
        const type = item.sourceType;
        if (!grouped[type]) {
            grouped[type] = [];
        }
        grouped[type].push(item);
    });

    return grouped;
}
