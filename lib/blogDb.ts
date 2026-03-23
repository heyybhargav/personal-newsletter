import { Redis } from '@upstash/redis';
import { BlogPost } from './blog';

// In Next.js, process.env is populated automatically.
// For raw Node scripts (seed-blog-kb.ts), we inject dotenv there instead.

let redisInstance: Redis | null = null;

function getRedis() {
    if (redisInstance) return redisInstance;
    
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '';
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '';
    
    if (!redisUrl) {
        console.warn('[blogDb] Redis URL is missing in process.env');
    }

    redisInstance = new Redis({
        url: redisUrl,
        token: redisToken,
    });
    return redisInstance;
}

// --- Keys ---
const BLOG_KEY_PREFIX = 'blog:post:';
const BLOG_INDEX_KEY = 'blog:index'; // Sorted set of slugs by publishedAt timestamp
const TOPICS_SET_KEY = 'blog:topics:slugs'; // Set of all unique slugs for O(1) deduplication

// Knowledge Base Keys
export const KB_KEYS = {
    TOPICS_PUBLISHED: 'blog:kb:topics_published',
    SEO_DIRECTIVES: 'blog:kb:seo_directives',
    BLOG_IDEAS: 'blog:kb:blog_ideas',
    LLM_INSTRUCTIONS: 'blog:kb:llm_instructions',
    PERFORMANCE_LOG: 'blog:kb:performance_log',
    CONTENT_CLUSTERS: 'blog:kb:content_clusters',
    BRAND_VOICE: 'blog:kb:brand_voice_guidelines',
    INSTRUCTION_PROPOSALS: 'blog:kb:instruction_proposals',
    PRODUCT_FACT_SHEET: 'blog:kb:product_fact_sheet'
};

// --- Blog Post Operations ---

/**
 * Save a new blog post to Redis.
 * - Stores the full JSON in `blog:post:{slug}`
 * - Adds to sorted index `blog:index` by timestamp
 * - Adds to `blog:topics:slugs` for exact deduplication
 * - Updates `blog:kb:topics_published` with metadata
 */
export async function saveBlogPost(post: BlogPost): Promise<boolean> {
    try {
        const redis = getRedis();
        const slug = post.slug;
        const timestamp = post.publishedAt ? new Date(post.publishedAt).getTime() : Date.now();

        const pipeline = redis.pipeline();

        // 1. Save full JSON
        pipeline.set(`${BLOG_KEY_PREFIX}${slug}`, post);

        // 2. Add to sorted index (for pagination on /blog)
        pipeline.zadd(BLOG_INDEX_KEY, { score: timestamp, member: slug });

        // 3. Add to unique topics set
        pipeline.sadd(TOPICS_SET_KEY, slug);

        // 4. Update KB topcis published list (keep rolling window of last 100)
        const kbTopicEntry = {
            slug: post.slug,
            title: post.title,
            category: post.category,
            keywords: post.targetKeywords || [],
            publishedAt: post.publishedAt
        };
        pipeline.lpush(KB_KEYS.TOPICS_PUBLISHED, kbTopicEntry);
        pipeline.ltrim(KB_KEYS.TOPICS_PUBLISHED, 0, 99); // Keep only last 100 for LLM context limits

        await pipeline.exec();
        return true;
    } catch (error) {
        console.error(`Error saving blog post ${post.slug}:`, error);
        return false;
    }
}

/**
 * Fetch a single blog post by slug.
 */
export async function getBlogPost(slug: string): Promise<BlogPost | null> {
    try {
        return await getRedis().get<BlogPost>(`${BLOG_KEY_PREFIX}${slug}`);
    } catch (error) {
        console.error(`Error fetching blog post ${slug}:`, error);
        return null;
    }
}

/**
 * Fetch paginated blog posts.
 */
export async function getBlogPosts(offset: number = 0, limit: number = 10): Promise<BlogPost[]> {
    try {
        // Get slugs from sorted set, newest first
        const slugs = await getRedis().zrange<string[]>(BLOG_INDEX_KEY, offset, offset + limit - 1, { rev: true });
        if (!slugs || slugs.length === 0) return [];

        // Fetch full post metadata using mget for performance
        const keys = slugs.map(slug => `${BLOG_KEY_PREFIX}${slug}`);
        const posts = await getRedis().mget<BlogPost[]>(...keys);

        // Filter out nulls
        return posts.filter((post): post is BlogPost => post !== null);
    } catch (error) {
        console.error('Error fetching blog posts:', error);
        return [];
    }
}

/**
 * Check if a slug already exists to prevent exact duplicates.
 */
export async function isSlugTaken(slug: string): Promise<boolean> {
    try {
        const isMember = await getRedis().sismember(TOPICS_SET_KEY, slug);
        return isMember === 1; // Upstash sismember returns 1 or 0
    } catch (error) {
        return false;
    }
}

// --- Knowledge Base Operations ---

export async function getKnowledgeBaseDoc<T>(key: string): Promise<T | null> {
    try {
        if (key === KB_KEYS.TOPICS_PUBLISHED) {
            // Lrange for Lists
            return await getRedis().lrange(key, 0, -1) as any;
        }
        return await getRedis().get<T>(key);
    } catch (error) {
        console.error(`Error fetching KB doc ${key}:`, error);
        return null;
    }
}

export async function updateKnowledgeBaseDoc<T>(key: string, data: T): Promise<boolean> {
    try {
        await getRedis().set(key, data);
        return true;
    } catch (error) {
        console.error(`Error updating KB doc ${key}:`, error);
        return false;
    }
}

export async function getFullKnowledgeBaseContext() {
    // Parallel fetching for performance
    const [
        topicsPublished,
        seoDirectives,
        blogIdeas,
        llmInstructions,
        contentClusters,
        brandVoice,
        factSheet
    ] = await Promise.all([
        getKnowledgeBaseDoc(KB_KEYS.TOPICS_PUBLISHED),
        getKnowledgeBaseDoc(KB_KEYS.SEO_DIRECTIVES),
        getKnowledgeBaseDoc(KB_KEYS.BLOG_IDEAS),
        getKnowledgeBaseDoc(KB_KEYS.LLM_INSTRUCTIONS),
        getKnowledgeBaseDoc(KB_KEYS.CONTENT_CLUSTERS),
        getKnowledgeBaseDoc(KB_KEYS.BRAND_VOICE),
        getKnowledgeBaseDoc(KB_KEYS.PRODUCT_FACT_SHEET)
    ]);

    return {
        topicsPublished: topicsPublished || [],
        seoDirectives: seoDirectives || {},
        blogIdeas: blogIdeas || {},
        llmInstructions: llmInstructions || {},
        contentClusters: contentClusters || {},
        brandVoice: brandVoice || {},
        factSheet: factSheet || {}
    };
}
