import { getBlogPosts, getFullKnowledgeBaseContext } from '../lib/blogDb';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testFetch() {
    console.log("Fetching all blog posts...");
    const posts = await getBlogPosts(0, 10);
    console.log(`Found ${posts.length} posts. First post title: ${posts[0]?.title}`);

    console.log("\nFetching Full KB Context...");
    const kb = await getFullKnowledgeBaseContext();
    console.log(`Topics Published Count: ${(kb.topicsPublished as any[]).length}`);
    console.log(`Brand Voice Identity: ${(kb.brandVoice as any).identity.substring(0, 50)}...`);

    process.exit(0);
}

testFetch().catch(console.error);
