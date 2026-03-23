// Run with: node --env-file=.env.local -e '' && npx tsx scripts/migrate-names.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
    url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '',
    token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

const nameMap: Record<string, string> = {
    'abhigyan.jha21@gmail.com': 'Abhigyan Jha',
    'balbhadradaxini830376@gmail.com': 'Balbhadra Daxini',
    'bhavitgupta743@gmail.com': 'Bhavit Gupta',
    'bhuvan.gowda@pointo.in': 'Bhuvan Gowda',
    'cbhargav2002@gmail.com': 'Bhargav Chaudhari',
    'demytsified@gmail.com': 'Bhargav Chaudhari',
    'dipuchinmaya@gmail.com': 'Chinmaya Kumar',
    'heyybhargav@gmail.com': 'Bhargav Chaudhari',
    'imtoufiq1@gmail.com': 'Toufiq Choudhary',
    'loborylen98334@gmail.com': 'Rylen Lobo',
    'raghav14.iitb@gmail.com': 'Raghav Maheshwari',
    'sakshispawar02@gmail.com': 'Sakshi Pawar',
    'soumyadeep.das423@gmail.com': 'Soumyadeep Das',
    'supreet2883@gmail.com': 'Supreet Gupta',
};

async function migrate() {
    console.log('Starting name migration...');
    console.log('Redis URL:', process.env.KV_REST_API_URL ? 'Found' : 'MISSING');

    let updated = 0;
    for (const [email, name] of Object.entries(nameMap)) {
        const key = `user:${email}:config`;
        const user = await redis.get<any>(key);
        if (!user) {
            console.log(`  ✗ NOT FOUND: ${email}`);
            continue;
        }
        user.name = name;
        await redis.set(key, user);
        console.log(`  ✓ ${email} → ${name}`);
        updated++;
    }
    console.log(`\nMigration complete. Updated ${updated} users.`);
}

migrate().catch(console.error);
