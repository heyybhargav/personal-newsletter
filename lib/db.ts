import { Redis } from '@upstash/redis';
import { UserProfile, Source } from './types';
import { randomUUID } from 'crypto';

// Initialize Redis
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '',
    token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '',
});

// --- Keys ---
const USER_KEY_PREFIX = 'user:';
const ALL_USERS_SET = 'users:index'; // Set of all registered emails

// --- Helpers ---
const getUserKey = (email: string) => `${USER_KEY_PREFIX}${email}:config`;

// --- Core User Operations ---

export async function getUser(email: string): Promise<UserProfile | null> {
    try {
        const user = await redis.get<UserProfile>(getUserKey(email));
        return user;
    } catch (error) {
        console.error(`Error fetching user ${email}:`, error);
        return null;
    }
}

export async function createUser(email: string, timezone: string = 'Asia/Kolkata'): Promise<UserProfile> {
    const existing = await getUser(email);
    if (existing) return existing;

    const newUser: UserProfile = {
        email,
        preferences: {
            deliveryTime: '08:00',
            timezone,

            digestFormat: 'comprehensive',
            subscriptionStatus: 'active'
        },
        sources: [], // Start empty
        createdAt: new Date().toISOString()
    };

    await saveUser(newUser);
    await redis.sadd(ALL_USERS_SET, email); // Add to index
    return newUser;
}

export async function saveUser(user: UserProfile): Promise<void> {
    await redis.set(getUserKey(user.email), user);
}

export async function getAllUsers(): Promise<string[]> {
    return await redis.smembers(ALL_USERS_SET);
}

export async function updateLastDigestAt(email: string): Promise<void> {
    const user = await getUser(email);
    if (!user) return;
    user.lastDigestAt = new Date().toISOString();
    await saveUser(user);
}

// --- Briefing Operations ---
export async function saveLatestBriefing(email: string, briefing: any): Promise<void> {
    await redis.set(`${USER_KEY_PREFIX}${email}:latest_briefing`, briefing);
}

export async function getLatestBriefing(email: string): Promise<any | null> {
    try {
        return await redis.get<any>(`${USER_KEY_PREFIX}${email}:latest_briefing`);
    } catch (e) {
        return null; // Handle parse errors from ancient formats gracefully
    }
}

// --- Source Operations (Scoped to User) ---

export async function addSourceToUser(email: string, source: Omit<Source, 'id' | 'addedAt'>): Promise<Source | null> {
    const user = await getUser(email) || await createUser(email);

    // Avoid duplicates — normalize URLs for comparison
    const normalizeUrl = (u: string) => u.trim().toLowerCase().replace(/\/$/, '');
    const isDuplicate = user.sources.some(s => normalizeUrl(s.url) === normalizeUrl(source.url));
    if (isDuplicate) {
        return null; // Signal to caller that source was not added
    }

    const newSource: Source = {
        ...source,
        id: randomUUID(),
        addedAt: new Date().toISOString(),
    };

    user.sources.push(newSource);
    await saveUser(user);

    return newSource;
}

export async function removeSourceFromUser(email: string, sourceId: string): Promise<void> {
    const user = await getUser(email);
    if (!user) return;

    user.sources = user.sources.filter(s => s.id !== sourceId);
    await saveUser(user);
}

export async function updateSourceForUser(email: string, sourceId: string, updates: Partial<Source>): Promise<void> {
    const user = await getUser(email);
    if (!user) return;

    const index = user.sources.findIndex(s => s.id === sourceId);
    if (index !== -1) {
        user.sources[index] = { ...user.sources[index], ...updates };
        await saveUser(user);
    }
}

// --- Legacy Support (Backwards Compatibility) ---
// We'll treat the .env USER_EMAIL as the "Admin" (Legacy User)
// This keeps the current localhost dashboard working 

const ADMIN_EMAIL = process.env.USER_EMAIL || 'admin@example.com';

export async function getPreferences() {
    const user = await getUser(ADMIN_EMAIL) || await createUser(ADMIN_EMAIL);
    // Transform new structure back to old structure for temporary compatibility
    return {
        email: user.email,
        deliveryTime: user.preferences.deliveryTime,
        timezone: user.preferences.timezone,
        llmProvider: user.preferences.llmProvider || 'groq',
        sources: user.sources
    };
}

export async function savePreferences(legacyPrefs: any) {
    const user = await getUser(ADMIN_EMAIL) || await createUser(ADMIN_EMAIL);
    if (legacyPrefs.email) user.email = legacyPrefs.email; // Allow updating delivery email
    user.preferences.deliveryTime = legacyPrefs.deliveryTime || '08:00';
    user.preferences.timezone = legacyPrefs.timezone || 'Asia/Kolkata';
    if (legacyPrefs.llmProvider) user.preferences.llmProvider = legacyPrefs.llmProvider;
    user.sources = legacyPrefs.sources || [];
    await saveUser(user);
}

// Legacy wrappers for sources
export async function addSource(source: any) { return addSourceToUser(ADMIN_EMAIL, source); }
export async function removeSource(id: string) { return removeSourceFromUser(ADMIN_EMAIL, id); }
// --- Starter Pack Operations ---
const STARTER_PACKS_KEY = 'admin:starter_packs';

export async function saveStarterPacks(packs: any[]): Promise<void> {
    await redis.set(STARTER_PACKS_KEY, packs);
}

export async function getAllStarterPacks(): Promise<any[] | null> {
    try {
        const packs = await redis.get<any[]>(STARTER_PACKS_KEY);
        return packs;
    } catch (error) {
        console.error('Error fetching starter packs:', error);
        return null;
    }
}
