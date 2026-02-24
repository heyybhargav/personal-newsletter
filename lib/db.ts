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

// --- Usage Event Logging ---

export interface UsageEvent {
    email: string;
    provider: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    cost: number;
    timestamp: string;
}

// ============================================================================
// Model Registry
// ============================================================================

export interface ModelConfig {
    id: string;
    name: string;
    provider: string;     // 'groq' | 'gemini'
    modelId: string;      // actual API model string
    enabled: boolean;
    costInput: number;    // $ per 1M input tokens
    costOutput: number;   // $ per 1M output tokens
}

const MODEL_REGISTRY_KEY = 'config:models';

const DEFAULT_MODELS: ModelConfig[] = [
    { id: 'groq', name: 'Llama 3.3 70B (Groq)', provider: 'groq', modelId: 'llama-3.3-70b-versatile', enabled: true, costInput: 0.59, costOutput: 0.79 },
    { id: 'gemini', name: 'Gemini 3 Flash Preview', provider: 'gemini', modelId: 'gemini-3-flash-preview', enabled: true, costInput: 0.50, costOutput: 3.00 },
    { id: 'gemini-pro', name: 'Gemini 3 Pro Preview', provider: 'gemini', modelId: 'gemini-3-pro-preview', enabled: true, costInput: 2.00, costOutput: 12.00 },
];

export async function getModelRegistry(): Promise<ModelConfig[]> {
    const raw = await redis.get(MODEL_REGISTRY_KEY);
    if (!raw) {
        // Seed defaults on first access
        await saveModelRegistry(DEFAULT_MODELS);
        return DEFAULT_MODELS;
    }
    return typeof raw === 'string' ? JSON.parse(raw) : raw as ModelConfig[];
}

export async function saveModelRegistry(models: ModelConfig[]): Promise<void> {
    await redis.set(MODEL_REGISTRY_KEY, JSON.stringify(models));
}

export async function getEnabledModels(): Promise<ModelConfig[]> {
    const all = await getModelRegistry();
    return all.filter(m => m.enabled);
}

export async function getModelById(id: string): Promise<ModelConfig | undefined> {
    const all = await getModelRegistry();
    return all.find(m => m.id === id);
}

// Cost calculation using registry rates
export function calculateCost(provider: string, inputTokens: number, outputTokens: number): number {
    // Fallback rates matching the default registry
    const fallbackRates: Record<string, { input: number; output: number }> = {
        groq: { input: 0.59, output: 0.79 },
        gemini: { input: 0.50, output: 3.00 },
        'gemini-pro': { input: 2.00, output: 12.00 },
    };
    const rates = fallbackRates[provider] || fallbackRates.groq;
    return (inputTokens * rates.input / 1_000_000) + (outputTokens * rates.output / 1_000_000);
}

const USAGE_KEY_PREFIX = 'usage:events:';
const USAGE_TTL_SECONDS = 90 * 24 * 60 * 60; // 90 days

export async function logUsageEvent(event: UsageEvent): Promise<void> {
    const dateKey = event.timestamp.split('T')[0]; // YYYY-MM-DD
    const redisKey = `${USAGE_KEY_PREFIX}${dateKey}`;

    const pipeline = redis.pipeline();
    pipeline.lpush(redisKey, JSON.stringify(event));
    pipeline.expire(redisKey, USAGE_TTL_SECONDS);
    await pipeline.exec();

    console.log(`[Usage] Logged event for ${event.email}: ${event.inputTokens}in/${event.outputTokens}out ($${event.cost.toFixed(6)}) via ${event.provider}`);
}

export async function getUsageEvents(date: string): Promise<UsageEvent[]> {
    const redisKey = `${USAGE_KEY_PREFIX}${date}`;
    const raw = await redis.lrange(redisKey, 0, -1);
    return raw.map((item: any) => typeof item === 'string' ? JSON.parse(item) : item);
}

export async function getUsageEventRange(startDate: string, endDate: string): Promise<{ date: string; events: UsageEvent[] }[]> {
    const results: { date: string; events: UsageEvent[] }[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const events = await getUsageEvents(dateStr);
        if (events.length > 0) {
            results.push({ date: dateStr, events });
        }
    }

    return results;
}
