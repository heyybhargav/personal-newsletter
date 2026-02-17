
import { fetchTwitterSyndication } from '../lib/twitter-syndication';
import { parseRSSFeed } from '../lib/rss-parser';
import { SourceType } from '../lib/types';

async function test() {
    console.log('Testing fetchTwitterSyndication...');
    try {
        const tweets = await fetchTwitterSyndication('mkbhd');
        console.log(`Fetched ${tweets.length} tweets.`);
    } catch (e) {
        console.error('Fetch failed:', e);
    }

    console.log('\nTesting parseRSSFeed with syndication URL...');
    try {
        const url = 'https://syndication.twitter.com/srv/timeline-profile/screen-name/mkbhd';
        const items = await parseRSSFeed(url, 'twitter' as SourceType, 'Twitter');
        console.log(`Parsed ${items.length} items.`);

        if (items.length > 0) {
            console.log('\n--- Scanning all items ---');
            let totalImages = 0;
            let totalVideos = 0;
            let totalRetweets = 0;
            let mediaItemFound = false;

            items.forEach((item, index) => {
                const imgCount = (item.content.match(/<img/g) || []).length;
                const videoCount = (item.content.match(/video-container/g) || []).length;
                const isRetweet = item.title.startsWith('Retweet');

                totalImages += imgCount;
                totalVideos += videoCount;
                if (isRetweet) totalRetweets++;

                if ((imgCount > 0 || videoCount > 0) && !mediaItemFound) {
                    console.log(`\nFound item with media at index ${index}:`);
                    console.log('Title:', item.title);
                    console.log('Thumbnail:', item.thumbnail);
                    console.log('Content Preview:', item.content.substring(0, 300));
                    mediaItemFound = true;
                }
            });

            console.log('\n--- Stats ---');
            console.log(`Total Items: ${items.length}`);
            console.log(`Total Images found: ${totalImages}`);
            console.log(`Total Videos found: ${totalVideos}`);
            console.log(`Total Retweets found: ${totalRetweets}`);
        }
    } catch (e) {
        console.error('Parse failed:', e);
    }
}

test();
