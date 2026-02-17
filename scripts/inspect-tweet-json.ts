
import { fetchTwitterSyndication } from '../lib/twitter-syndication';

async function inspect() {
    try {
        console.log('Fetching MKBHD tweets...');
        // We need to modify fetchTwitterSyndication to return RAW objects for inspection
        // For now, I'll just use the existing function and print what I get, 
        // BUT I really need to see the raw "entries" from the cheerio parse.

        // Since I can't easily modify the lib to return raw data without breaking types,
        // I will copy the logic here for inspection.

        const handle = 'mkbhd';
        const url = `https://syndication.twitter.com/srv/timeline-profile/screen-name/${handle}`;
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const html = await response.text();
        const cheerio = await import('cheerio');
        const $ = cheerio.load(html);
        const nextData = $('#__NEXT_DATA__').html();

        if (!nextData) {
            console.log('No data found');
            return;
        }

        const json = JSON.parse(nextData);
        const entries = json.props?.pageProps?.timeline?.entries || [];

        console.log(`Found ${entries.length} entries.`);

        const types: Record<string, number> = {};
        entries.forEach((e: any) => {
            types[e.type] = (types[e.type] || 0) + 1;
        });

        // Find a tweet with media
        const mediaTweet = entries.find((e: any) =>
            (e.content?.tweet?.entities?.media?.length > 0) ||
            (e.content?.tweet?.extended_entities?.media?.length > 0)
        );

        if (mediaTweet) {
            console.log('--- Raw Tweet with Media ---');
            console.log(JSON.stringify(mediaTweet.content.tweet.entities, null, 2));
            if (mediaTweet.content.tweet.extended_entities) {
                console.log('--- Extended Entities ---');
                console.log(JSON.stringify(mediaTweet.content.tweet.extended_entities, null, 2));
            }
        } else {
            console.log('No tweets with media found.');
        }

        console.log('Entry Types:', types);

    } catch (e) {
        console.error(e);
    }
}

inspect();
