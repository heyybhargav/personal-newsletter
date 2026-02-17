// Smart URL Detection Utility
// Automatically detects source type from any URL

export type SourceType =
    | 'youtube'
    | 'reddit'
    | 'substack'
    | 'medium'
    | 'hackernews'
    | 'github'
    | 'twitter'
    | 'podcast'
    | 'newsletter'
    | 'blog'
    | 'news'
    | 'custom'
    | 'rss';

export interface DetectedSource {
    type: SourceType;
    name: string;
    feedUrl: string;
    originalUrl: string;
    favicon: string;
    confidence: 'high' | 'medium' | 'low';
}

interface DetectionRule {
    type: SourceType;
    patterns: RegExp[];
    extractFeedUrl: (url: string, match: RegExpMatchArray | null) => string;
    extractName: (url: string, match: RegExpMatchArray | null) => string;
    getFavicon: (url: string) => string;
}

// Detection rules for each source type
const detectionRules: DetectionRule[] = [
    // YouTube - handles @handles, channel IDs, /c/ URLs, AND RSS feeds
    {
        type: 'youtube',
        patterns: [
            /youtube\.com\/@([\w-]+)/i,
            /youtube\.com\/channel\/([\w-]+)/i,
            /youtube\.com\/c\/([\w-]+)/i,
            /youtube\.com\/user\/([\w-]+)/i,
            /youtube\.com\/feeds\/videos\.xml/i, // Explicitly handle RSS feeds
        ],
        extractFeedUrl: (url, match) => {
            // If it's already an RSS feed, return it
            if (url.includes('feeds/videos.xml')) return url;

            // For @handle URLs, we need to fetch the channel ID (handled server-side)
            if (match) {
                if (url.includes('/channel/')) {
                    return `https://www.youtube.com/feeds/videos.xml?channel_id=${match[1]}`;
                }
                return url;
            }
            return url;
        },
        extractName: (url, match) => {
            if (url.includes('feeds/videos.xml')) return 'YouTube Channel';
            return match ? match[1].replace(/-/g, ' ') : 'YouTube Channel';
        },
        getFavicon: () => 'https://www.youtube.com/favicon.ico',
    },

    // Podcasts (Common Hosts)
    {
        type: 'podcast',
        patterns: [
            /feeds\.megaphone\.fm/i,
            /anchor\.fm\/s\//i,
            /feeds\.buzzsprout\.com/i,
            /rss\.art19\.com/i,
            /feeds\.simplecast\.com/i,
            /feed\.podbean\.com/i,
        ],
        extractFeedUrl: (url) => url,
        extractName: () => 'Podcast',
        getFavicon: (url) => '', // Return empty so the Detect API logic triggers to fetch from feed
    },
    // ... (rest of rules)

    // Reddit - handles subreddit URLs
    {
        type: 'reddit',
        patterns: [
            /reddit\.com\/r\/([\w]+)/i,
            /old\.reddit\.com\/r\/([\w]+)/i,
        ],
        extractFeedUrl: (url, match) => match ? `https://www.reddit.com/r/${match[1]}/.rss` : url,
        extractName: (url, match) => match ? `r/${match[1]}` : 'Reddit',
        getFavicon: () => 'https://www.reddit.com/favicon.ico',
    },

    // Substack - newsletters
    {
        type: 'substack',
        patterns: [
            /([\w-]+)\.substack\.com/i,
            /substack\.com\/@([\w-]+)/i,
        ],
        extractFeedUrl: (url, match) => {
            if (match) {
                const name = match[1];
                return `https://${name}.substack.com/feed`;
            }
            return url;
        },
        extractName: (url, match) => match ? match[1].replace(/-/g, ' ') : 'Substack Newsletter',
        getFavicon: (url) => {
            const match = url.match(/([\w-]+)\.substack\.com/i);
            return match ? `https://${match[1]}.substack.com/favicon.ico` : 'https://substack.com/favicon.ico';
        },
    },

    // Medium - publications and users
    {
        type: 'medium',
        patterns: [
            /medium\.com\/@([\w-]+)/i,
            /medium\.com\/([\w-]+)/i,
            /([\w-]+)\.medium\.com/i,
        ],
        extractFeedUrl: (url, match) => {
            if (match) {
                if (url.includes('@')) {
                    return `https://medium.com/feed/@${match[1]}`;
                }
                return `https://medium.com/feed/${match[1]}`;
            }
            return url;
        },
        extractName: (url, match) => match ? match[1].replace(/-/g, ' ') : 'Medium',
        getFavicon: () => 'https://medium.com/favicon.ico',
    },

    // Hacker News
    {
        type: 'hackernews',
        patterns: [
            /news\.ycombinator\.com/i,
            /ycombinator\.com/i,
        ],
        extractFeedUrl: () => 'https://hnrss.org/frontpage',
        extractName: () => 'Hacker News',
        getFavicon: () => 'https://news.ycombinator.com/favicon.ico',
    },

    // GitHub - repos, users, orgs
    {
        type: 'github',
        patterns: [
            /github\.com\/([\w-]+)\/([\w-]+)\/releases/i,
            /github\.com\/([\w-]+)\/([\w-]+)/i,
            /github\.com\/([\w-]+)/i,
        ],
        extractFeedUrl: (url, match) => {
            if (match) {
                if (match[2]) {
                    // Repo releases feed
                    return `https://github.com/${match[1]}/${match[2]}/releases.atom`;
                }
                // User/org activity feed
                return `https://github.com/${match[1]}.atom`;
            }
            return url;
        },
        extractName: (url, match) => {
            if (match) {
                if (match[2]) return `${match[1]}/${match[2]}`;
                return match[1];
            }
            return 'GitHub';
        },
        getFavicon: () => 'https://github.com/favicon.ico',
    },

    // Twitter/X (via Nitter or similar RSS bridges)
    {
        type: 'twitter',
        patterns: [
            /twitter\.com\/([\w]+)/i,
            /x\.com\/([\w]+)/i,
        ],
        extractFeedUrl: (url, match) => {
            // Twitter doesn't have native RSS, but we can use RSS bridges
            // User will need to use nitter.net or similar
            if (match) {
                return `https://nitter.net/${match[1]}/rss`;
            }
            return url;
        },
        extractName: (url, match) => match ? `@${match[1]}` : 'Twitter',
        getFavicon: () => 'https://abs.twimg.com/favicons/twitter.ico',
    },

    // Generic RSS/Atom feed detection
    {
        type: 'rss',
        patterns: [
            /\.rss$/i,
            /\.atom$/i,
            /\/feed\/?$/i,
            /\/rss\/?$/i,
            /\/atom\/?$/i,
            /feeds\.feedburner\.com/i,
        ],
        extractFeedUrl: (url) => url,
        extractName: (url) => {
            try {
                const hostname = new URL(url).hostname.replace('www.', '');
                return hostname.split('.')[0];
            } catch {
                return 'RSS Feed';
            }
        },
        getFavicon: (url) => {
            try {
                const domain = new URL(url).hostname;
                return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
            } catch {
                return '';
            }
        },
    },
];

/**
 * Detect the source type from a URL
 */
export function detectSourceFromUrl(url: string): DetectedSource | null {
    // Normalize URL
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http')) {
        normalizedUrl = 'https://' + normalizedUrl;
    }

    for (const rule of detectionRules) {
        for (const pattern of rule.patterns) {
            const match = normalizedUrl.match(pattern);
            if (match) {
                return {
                    type: rule.type,
                    name: capitalizeWords(rule.extractName(normalizedUrl, match)),
                    feedUrl: rule.extractFeedUrl(normalizedUrl, match),
                    originalUrl: normalizedUrl,
                    favicon: rule.getFavicon(normalizedUrl),
                    confidence: 'high',
                };
            }
        }
    }

    // Fallback: treat as generic blog/website
    try {
        const urlObj = new URL(normalizedUrl);
        return {
            type: 'blog',
            name: capitalizeWords(urlObj.hostname.replace('www.', '').split('.')[0]),
            feedUrl: normalizedUrl, // Will attempt to discover RSS
            originalUrl: normalizedUrl,
            favicon: `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`,
            confidence: 'low',
        };
    } catch {
        return null;
    }
}

/**
 * Get a better favicon URL with fallbacks
 */
export function getFaviconUrl(url: string): string {
    try {
        const domain = new URL(url).hostname;
        // Google's favicon service is the most reliable
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    } catch {
        return '';
    }
}



/**
 * Get color class for source type badge
 */
export function getSourceTypeColor(type: SourceType): string {
    const colors: Record<SourceType, string> = {
        youtube: 'bg-red-100 text-red-700 border-red-200',
        reddit: 'bg-orange-100 text-orange-700 border-orange-200',
        substack: 'bg-amber-100 text-amber-700 border-amber-200',
        medium: 'bg-gray-100 text-gray-700 border-gray-200',
        hackernews: 'bg-orange-100 text-orange-700 border-orange-200',
        github: 'bg-purple-100 text-purple-700 border-purple-200',
        twitter: 'bg-blue-100 text-blue-700 border-blue-200',
        podcast: 'bg-violet-100 text-violet-700 border-violet-200',
        newsletter: 'bg-green-100 text-green-700 border-green-200',
        blog: 'bg-indigo-100 text-indigo-700 border-indigo-200',
        news: 'bg-sky-100 text-sky-700 border-sky-200',
        custom: 'bg-teal-100 text-teal-700 border-teal-200',
        rss: 'bg-slate-100 text-slate-700 border-slate-200',
    };
    return colors[type] || 'bg-gray-100 text-gray-700 border-gray-200';
}

// Helper function
function capitalizeWords(str: string): string {
    return str
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}
