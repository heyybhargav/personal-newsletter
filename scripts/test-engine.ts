import { generateAndPublishBlog } from '../lib/blogEngine';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function dryRunEngine() {
    console.log("🚀 Running Blog Engine Dry Run...");

    // TEMPORARY: Mock saveBlogPost in blogDb.ts to prevent actually saving during tests
    // For this test, let's just run it as-is, the DB is already seeded.

    const result = await generateAndPublishBlog();

    if (result.success && result.post) {
        console.log("\n✅ Generated Post JSON:");
        console.log(`Title: ${result.post.title}`);
        console.log(`Slug: ${result.post.slug}`);
        console.log(`Meta: ${result.post.metaDescription}`);
        console.log(`Category: ${result.post.category}`);
        console.log(`Word count approx: ${JSON.stringify(result.post.content).length / 5}`);
    } else {
        console.error("\n❌ Generation Failed:", result.error);
    }

    process.exit(0);
}

dryRunEngine().catch(console.error);
