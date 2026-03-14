import { Redis } from '@upstash/redis';
import { BlogPost, BLOG_POSTS } from '../lib/blog';
import { KB_KEYS } from '../lib/blogDb';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '',
    token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '',
});

const BLOG_INDEX_KEY = 'blog:index';
const TOPICS_SET_KEY = 'blog:topics:slugs';
const BLOG_KEY_PREFIX = 'blog:post:';

async function seedKnowledgeBase() {
    console.log('🌱 Starting Knowledge Base Seed...');

    // --- Reset existing keys for a clean seed ---
    console.log('↳ Clearing old keys...');
    const keysToClear = [
        BLOG_INDEX_KEY,
        TOPICS_SET_KEY,
        ...Object.values(KB_KEYS)
    ];
    for (const post of BLOG_POSTS) {
        keysToClear.push(`${BLOG_KEY_PREFIX}${post.slug}`);
    }
    await redis.del(...keysToClear);


    // 1. Seed Existing Posts
    console.log('↳ Migrating existing hardcoded posts to Redis...');
    for (const post of BLOG_POSTS) {
        const timestamp = new Date(post.date).getTime();

        const migratedPost: BlogPost = {
            ...post,
            category: post.slug.includes('vs') ? 'alternatives' : 'philosophical',
            metaDescription: post.subtitle,
            publishedAt: new Date(post.date).toISOString()
        };

        const pipeline = redis.pipeline();
        pipeline.set(`${BLOG_KEY_PREFIX}${post.slug}`, migratedPost);
        pipeline.zadd(BLOG_INDEX_KEY, { score: timestamp, member: post.slug });
        pipeline.sadd(TOPICS_SET_KEY, post.slug);

        // Add to KB topics pubished
        pipeline.lpush(KB_KEYS.TOPICS_PUBLISHED, {
            slug: post.slug,
            title: post.title,
            category: migratedPost.category,
            publishedAt: migratedPost.publishedAt
        });
        await pipeline.exec();

        console.log(`  ✓ Migrated: ${post.slug}`);
    }

    // 2. SEO Directives
    console.log('↳ Assmbling SEO Directives...');
    const seoDirectives = {
        core_principles: [
            "E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) is paramount.",
            "Demonstrate real-world experience. Speak directly to the pain points of knowledge workers.",
            "Target conversational long-tail queries, not just short head terms."
        ],
        geo_aeo_guidelines: [
            "For Problem/Solution posts: Use 'Answer-First' formatting. Put the direct, bolded answer in the first paragraph.",
            "For Alternatives/Comparison posts: Structure the post logically to allow for easy AI extraction of Pros/Cons.",
            "Use distinct headings (H2/H3) for every sub-topic to create an easily parsable outline."
        ],
        schema_markup: "Mandatory Article JSON-LD on all posts. Conditional FAQPage schema for How-To and Problem-Solution categories."
    };
    await redis.set(KB_KEYS.SEO_DIRECTIVES, seoDirectives);

    // 3. Blog Ideas Backlog
    console.log('↳ Assmbling Blog Ideas...');
    const blogIdeas = {
        backlog: [
            { topic: "The psychological cost of unread newsletters", category: "philosophical", cluster: "newsletter-fatigue" },
            { topic: "Siftl vs Feedly: The difference between reading and curating", category: "comparison", cluster: "alternatives" },
            { topic: "How to use Siftl to track competitor product releases", category: "how-to", cluster: "use-cases" },
            { topic: "Why the creator economy broke the internet for readers", category: "industry", cluster: "curation-economy" },
            { topic: "Best alternatives to Substack for readers in 2026", category: "alternatives", cluster: "alternatives" }
        ]
    };
    await redis.set(KB_KEYS.BLOG_IDEAS, blogIdeas);

    // 4. Content Clusters
    console.log('↳ Defining Content Clusters...');
    const contentClusters = {
        clusters: [
            {
                id: "newsletter-fatigue",
                theme: "The overwhelm of the modern inbox and why curation failed.",
                target_posts: 8
            },
            {
                id: "alternatives",
                theme: "Comparing Siftl to manual curation tools (Feedly, Morning Brew, Substack, TLDR).",
                target_posts: 10
            },
            {
                id: "use-cases",
                theme: "Specific high-value workflows enabled by Siftl (VC tracking, competitor intel).",
                target_posts: 6
            }
        ]
    };
    await redis.set(KB_KEYS.CONTENT_CLUSTERS, contentClusters);

    // 5. Brand Voice Guidelines - THE QUALITATIVE ENGINE
    console.log('↳ Establishing Brand Voice...');
    const brandVoice = {
        identity: "We are building the antidote to noise. Siftl is a premium, automated synthesis layer. We are cynical about mass media, but optimistic about high-quality, targeted intelligence.",
        banned_words: ["delve", "landscape", "testament", "tapestry", "in conclusion", "furthermore", "realm", "unlock"],
        formatting: [
            "Paragraphs must be short. Maximum 3-4 sentences.",
            "Sentences should be punchy and direct.",
            "Use bolding (<strong>) sparingly, only for the core insight of a section.",
            "Never sound salesy. Be authoritative and educational."
        ],
        core_message: "The inbox is a terrible place for a reading list. It's an excellent place for an executive summary."
    };
    await redis.set(KB_KEYS.BRAND_VOICE, brandVoice);

    // 6. Performance Log & Instructions
    console.log('↳ Initializing Remaining Core KB docs...');
    await redis.set(KB_KEYS.PERFORMANCE_LOG, { runs: [] });
    await redis.set(KB_KEYS.INSTRUCTION_PROPOSALS, { proposals: [] });
    await redis.set(KB_KEYS.LLM_INSTRUCTIONS, {
        system: "You are the autonomous content engine behind Siftl. Your goal is to write SEO dominating content with the distinctive Siftl voice.",
        rules: ["Never write fluff.", "Assume the reader is a highly-paid professional with zero time.", "Always return structurally perfect JSON when asked."]
    });

    console.log('✅ Knowledge Base Seeded Successfully!');
    process.exit(0);
}

seedKnowledgeBase().catch(e => {
    console.error(e);
    process.exit(1);
});
