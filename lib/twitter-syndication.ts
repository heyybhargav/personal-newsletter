
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
            video_info?: {
                variants: Array<{
                    bitrate?: number;
                    content_type: string;
                    url: string;
                }>;
            };
        }>;
    };
    extended_entities?: {
        media?: Array<{
            media_url_https: string;
            type: string;
            video_info?: {
                variants: Array<{
                    bitrate?: number;
                    content_type: string;
                    url: string;
                }>;
            };
        }>;
    };
    retweeted_status?: Tweet;
    permalink?: string;
}

import { sendAdminAlertEmail } from './email';
import { logErrorEvent } from './db';

const NITTER_INSTANCES = [
    'https://nitter.perennialte.ch',
    'https://nitter.poast.org',
    'https://nitter.privacydev.net',
    'https://nitter.projectsegfau.lt'
];

export async function fetchTwitterSyndication(handle: string): Promise<Tweet[]> {
    // 1. Try Nitter RSS instances first (Default)
    for (const instance of NITTER_INSTANCES) {
        try {
            const nitterUrl = `${instance}/${handle}/rss`;
            const response = await fetch(nitterUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                },
                next: { revalidate: 3600 }
            });

            if (response.ok) {
                const xml = await response.text();
                const $ = cheerio.load(xml, { xmlMode: true });
                const items = $('item').toArray();

                const tweets: Tweet[] = items.map(item => {
                    const $item = $(item);
                    const title = $item.find('title').text();
                    const description = $item.find('description').text();
                    const link = $item.find('link').text();
                    const pubDate = $item.find('pubDate').text();
                    const creator = $item.find('dc\\:creator').text() || handle;
                    const guid = $item.find('guid').text();
                    const tweetId = guid.split('/').pop() || '';

                    // Nitter RSS often puts images in the description as <img> tags
                    const media: any[] = [];
                    const imgMatch = description.match(/<img[^>]+src="([^">]+)"/g);
                    if (imgMatch) {
                        imgMatch.forEach(imgTag => {
                            const src = imgTag.match(/src="([^">]+)"/)?.[1];
                            if (src) media.push({ media_url_https: src, type: 'photo' });
                        });
                    }

                    return {
                        id_str: tweetId,
                        created_at: pubDate,
                        full_text: description.replace(/<[^>]*>?/gm, '').trim() || title,
                        user: {
                            name: creator,
                            screen_name: handle,
                            profile_image_url_https: `https://unavatar.io/twitter/${handle}`,
                            description: '',
                            followers_count: 0
                        },
                        entities: { media }
                    } as Tweet;
                });

                if (tweets.length > 0) {
                    console.log(`[Twitter] Successfully fetched ${tweets.length} tweets from Nitter (${instance}) for @${handle}`);
                    return tweets;
                }
            }
        } catch (nitterError) {
            console.error(`[Twitter] Nitter instance failed (${instance}):`, nitterError);
        }
    }

    // 2. Fallback to primary syndication (Last resort)
    const primaryUrl = `https://syndication.twitter.com/srv/timeline-profile/screen-name/${handle}`;
    try {
        console.warn(`[Twitter] Nitter instances failed. Attempting primary syndication as last resort for @${handle}.`);
        const response = await fetch(primaryUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            next: { revalidate: 3600 }
        });

        if (response.ok) {
            const html = await response.text();
            const $ = cheerio.load(html);
            const nextData = $('#__NEXT_DATA__').html();

            if (nextData) {
                const json = JSON.parse(nextData);
                const entries = json.props?.pageProps?.timeline?.entries || [];
                const tweets: Tweet[] = [];

                for (const entry of entries) {
                    if (entry.type === 'tweet' && entry.content?.tweet) {
                        tweets.push(entry.content.tweet);
                    }
                }
                if (tweets.length > 0) return tweets;
            }
        }
    } catch (error) {
        console.error('[Twitter] Primary syndication fallback also failed:', error);
    }

    // Final log if everything fails
    await logErrorEvent({
        email: 'SYSTEM',
        stage: 'twitter_scraper',
        message: `All ingestion methods (Nitter + Syndication) failed for @${handle}`,
        timestamp: new Date().toISOString()
    });

    return [];
}

