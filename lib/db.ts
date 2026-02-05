import { Redis } from '@upstash/redis';
import { UserPreferences, Source } from './types';

// Default preferences
const defaultPreferences: UserPreferences = {
    email: process.env.USER_EMAIL || '',
    deliveryTime: process.env.DELIVERY_TIME || '08:00',
    sources: []
};

const PREFS_KEY = 'user_preferences';

// Initialize Redis client
// It automatically looks for UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
// Also falls back to KV_REST_API_URL if that's set
const redis = Redis.fromEnv();

export async function getPreferences(): Promise<UserPreferences> {
    try {
        const prefs = await redis.get<UserPreferences>(PREFS_KEY);
        return prefs || defaultPreferences;
    } catch (error) {
        console.error('Error reading preferences from Redis:', error);
        return defaultPreferences;
    }
}

export async function savePreferences(prefs: UserPreferences): Promise<void> {
    try {
        await redis.set(PREFS_KEY, prefs);
    } catch (error) {
        console.error('Error saving preferences to Redis:', error);
        throw error;
    }
}

export async function addSource(source: Omit<Source, 'id' | 'addedAt'>): Promise<Source> {
    const prefs = await getPreferences();
    const newSource: Source = {
        ...source,
        id: Date.now().toString(),
        addedAt: new Date().toISOString(),
    };
    prefs.sources.push(newSource);
    await savePreferences(prefs);
    return newSource;
}

export async function removeSource(id: string): Promise<void> {
    const prefs = await getPreferences();
    prefs.sources = prefs.sources.filter(s => s.id !== id);
    await savePreferences(prefs);
}

export async function updateSource(id: string, updates: Partial<Source>): Promise<void> {
    const prefs = await getPreferences();
    const index = prefs.sources.findIndex(s => s.id === id);
    if (index !== -1) {
        prefs.sources[index] = { ...prefs.sources[index], ...updates };
        await savePreferences(prefs);
    }
}
