import { Redis } from '@upstash/redis';

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '',
    token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '',
});

async function run() {
    console.log('Fetching all users...');
    const emails = await redis.smembers('users:index');
    console.log(`Found ${emails.length} users.`);

    let updatedCount = 0;

    for (const email of emails) {
        const key = `user:${email}:config`;
        const profile = await redis.get<any>(key);

        if (profile && profile.preferences) {
            // Update to Google 3 Pro ('gemini-pro')
            profile.preferences.llmProvider = 'gemini-pro';

            await redis.set(key, profile);
            console.log(`Updated model for ${email} -> gemini-pro`);
            updatedCount++;
        }
    }

    console.log(`\nMigration complete. Updated ${updatedCount} users to Gemini 3 Pro.`);
}

run().catch(console.error);
