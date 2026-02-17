import { parseMultipleFeeds } from './rss-parser';
import { ContentItem, Source } from './types';
import { subDays, isAfter } from 'date-fns';

export async function aggregateContent(sources: Source[], options: { lookbackDays?: number } = {}): Promise<ContentItem[]> {
    // Parse all feeds
    const allItems = await parseMultipleFeeds(sources);
    console.log(`[Aggregator] Fetched ${allItems.length} total items from ${sources.length} sources`);

    // Filter to last N days (default 1)
    const days = options.lookbackDays || 1;
    const cutoff = subDays(new Date(), days);

    const recentItems = allItems.filter(item => {
        try {
            const itemDate = new Date(item.pubDate);
            const keep = isAfter(itemDate, cutoff);
            if (!keep && allItems.length < 50) {
                // Log discarded items only if total volume is low, to avoid spam
                // console.log(`[Aggregator] Discarded old item: ${item.title} (${item.pubDate}) < ${cutoff.toISOString()}`);
            }
            return keep;
        } catch {
            return false;
        }
    });

    console.log(`[Aggregator] Kept ${recentItems.length} items after ${days}-day cutoff`);

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
