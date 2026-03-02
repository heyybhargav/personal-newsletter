import * as cheerio from 'cheerio';
import { ContentItem, SourceType } from './types';

const MAX_CHARS_PER_URL = 5000;
const FETCH_TIMEOUT_MS = 8000;

/**
 * Fetches a URL and extracts its readable text content using Cheerio.
 * Designed for the public demo: robust, safe, and context-window-aware.
 */
export async function fetchAndExtractText(url: string): Promise<{ title: string; text: string; url: string } | null> {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                // Pretend to be a browser to avoid bot-blocking on simple sites
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml',
            },
        });
        clearTimeout(timeout);

        if (!response.ok) {
            console.warn(`[DemoFetcher] HTTP ${response.status} for ${url}`);
            return null;
        }

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
            console.warn(`[DemoFetcher] Non-HTML content-type for ${url}: ${contentType}`);
            return null;
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Strip non-content elements aggressively
        $('script, style, nav, header, footer, noscript, iframe, svg, form, aside, [role="navigation"], [role="banner"], [role="contentinfo"], .sidebar, .comments, .ad, .advertisement').remove();

        // Extract title
        const title = $('meta[property="og:title"]').attr('content')
            || $('title').text().trim()
            || 'Untitled Page';

        // Extract main text content with priority: article > main > body
        let textContent = '';
        const selectors = ['article', '[role="main"]', 'main', '.post-content', '.entry-content', '.article-body', 'body'];

        for (const selector of selectors) {
            const el = $(selector);
            if (el.length > 0) {
                textContent = el.text();
                break;
            }
        }

        // Compress whitespace and truncate
        const cleaned = textContent
            .replace(/\s+/g, ' ')
            .replace(/\n{3,}/g, '\n\n')
            .trim()
            .slice(0, MAX_CHARS_PER_URL);

        if (cleaned.length < 50) {
            console.warn(`[DemoFetcher] Extracted text too short for ${url} (${cleaned.length} chars). Likely a SPA or gated content.`);
            return null;
        }

        return { title, text: cleaned, url };

    } catch (error: any) {
        if (error.name === 'AbortError') {
            console.warn(`[DemoFetcher] Timeout fetching ${url}`);
        } else {
            console.error(`[DemoFetcher] Error fetching ${url}:`, error.message);
        }
        return null;
    }
}

/**
 * Takes an array of raw URLs submitted by the demo user, fetches & extracts them,
 * and maps them into ContentItem objects compatible with `generateUnifiedBriefing`.
 */
export async function fetchDemoUrls(urls: string[]): Promise<ContentItem[]> {
    const results = await Promise.allSettled(
        urls.map(url => fetchAndExtractText(url))
    );

    const items: ContentItem[] = [];

    results.forEach((result, i) => {
        if (result.status === 'fulfilled' && result.value) {
            const { title, text, url } = result.value;

            // Detect a rough source type from the URL for the LLM's context
            let sourceType: SourceType = 'blog';
            let sourceName = 'Web';
            try {
                const hostname = new URL(url).hostname.replace('www.', '');
                sourceName = hostname.split('.')[0];
                sourceName = sourceName.charAt(0).toUpperCase() + sourceName.slice(1);

                if (url.includes('youtube.com') || url.includes('youtu.be')) sourceType = 'youtube';
                else if (url.includes('reddit.com')) sourceType = 'reddit';
                else if (url.includes('substack.com')) sourceType = 'substack';
                else if (url.includes('medium.com')) sourceType = 'medium';
                else if (url.includes('news.ycombinator.com')) sourceType = 'hackernews';
                else if (url.includes('github.com')) sourceType = 'github';
                else if (url.includes('twitter.com') || url.includes('x.com')) sourceType = 'twitter';
            } catch { /* keep defaults */ }

            items.push({
                title,
                description: text,
                content: text,
                contentSnippet: text.slice(0, 300),
                link: url,
                pubDate: new Date().toISOString(),
                source: sourceName,
                sourceType,
            });
        } else {
            console.warn(`[DemoFetcher] Failed to process URL: ${urls[i]}`);
        }
    });

    return items;
}
