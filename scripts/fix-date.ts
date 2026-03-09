import * as dotenv from 'dotenv';
import path from 'path';

// Force load env FIRST before importing any Upstash clients
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { getBlogPost, saveBlogPost } from '../lib/blogDb';

async function fixDate() {
    const slug = 'automate-competitive-intelligence-signal';
    console.log(`Fetching post: ${slug}...`);

    // 1. Get the existing post
    const post = await getBlogPost(slug);

    if (!post) {
        console.error("❌ Post not found in Redis.");
        process.exit(1);
    }

    console.log(`Current Date: ${post.date}`);

    // 2. Format today's date correctly
    const newDate = 'March 8, 2026';
    post.date = newDate;

    console.log(`Updating Date to: ${newDate}...`);

    // 3. Save it back to Redis
    // saveBlogPost uses the exact same `blog:post:${slug}` key and updates the meta index
    await saveBlogPost(post);

    console.log("✅ Post updated successfully!");
    process.exit(0);
}

fixDate().catch(console.error);
