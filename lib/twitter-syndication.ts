
import * as cheerio from 'cheerio';

export interface TwitterProfile {
    name: string;
    screen_name: string;
    profile_image_url_https: string;
    description: string;
    followers_count: number;
}

export interface Tweet {
    id_str: string;
    created_at: string;
    full_text: string;
    user: TwitterProfile;
    entities?: {
        media?: Array<{
            media_url_https: string;
            type: string;
        }>;
    };
    permalink?: string;
}

export async function fetchTwitterSyndication(handle: string): Promise<Tweet[]> {
    const url = `https://syndication.twitter.com/srv/timeline-profile/screen-name/${handle}`;

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            next: { revalidate: 3600 } // Cache for 1 hour
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch Twitter syndication: ${response.status}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);
        const nextData = $('#__NEXT_DATA__').html();

        if (!nextData) {
            console.warn('No __NEXT_DATA__ found in Twitter response');
            return [];
        }

        const json = JSON.parse(nextData);
        const entries = json.props?.pageProps?.timeline?.entries || [];

        const tweets: Tweet[] = [];

        for (const entry of entries) {
            if (entry.type === 'tweet' && entry.content?.tweet) {
                tweets.push(entry.content.tweet);
            }
        }

        return tweets;
    } catch (error) {
        console.error('Error fetching Twitter syndication:', error);
        return [];
    }
}
