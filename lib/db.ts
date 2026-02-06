import { Redis } from '@upstash/redis';
import { UserProfile, Source, UserPreferences } from './types';

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

export async function createUser(email: string, initialPrefs?: Partial<UserPreferences>): Promise<UserProfile> {
    const existing = await getUser(email);
    if (existing) return existing;

    const newUser: UserProfile = {
        email,
        preferences: {
            deliveryTime: '08:00',
            timezone: initialPrefs?.timezone || 'Asia/Kolkata', // Default to IST if not provided
            digestFormat: 'comprehensive'
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

// --- Source Operations (Scoped to User) ---

export async function addSourceToUser(email: string, source: Omit<Source, 'id' | 'addedAt'>): Promise<Source> {
    const user = await getUser(email) || await createUser(email);

    const newSource: Source = {
        ...source,
        id: Date.now().toString(),
        addedAt: new Date().toISOString(),
    };

    // Avoid duplicates
    if (!user.sources.some(s => s.url === source.url)) {
        user.sources.push(newSource);
        await saveUser(user);
    }

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
        sources: user.sources
    };
}

export async function savePreferences(legacyPrefs: { email?: string; deliveryTime?: string; timezone?: string; sources?: Source[] }) {
    const user = await getUser(ADMIN_EMAIL) || await createUser(ADMIN_EMAIL);
    user.preferences.deliveryTime = legacyPrefs.deliveryTime || '08:00';
    user.preferences.timezone = legacyPrefs.timezone || 'Asia/Kolkata';
    user.sources = legacyPrefs.sources || [];
    await saveUser(user);
}

// Legacy wrappers for sources
export async function addSource(source: Omit<Source, 'id' | 'addedAt'>) { return addSourceToUser(ADMIN_EMAIL, source); }
export async function removeSource(id: string) { return removeSourceFromUser(ADMIN_EMAIL, id); }
export async function updateSource(id: string, updates: Partial<Source>) { return updateSourceForUser(ADMIN_EMAIL, id, updates); }
