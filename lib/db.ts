import fs from 'fs';
import path from 'path';
import { UserPreferences, Source } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const PREFS_FILE = path.join(DATA_DIR, 'preferences.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Default preferences
const defaultPreferences: UserPreferences = {
    email: process.env.USER_EMAIL || '',
    deliveryTime: process.env.DELIVERY_TIME || '08:00',
    sources: []
};

export function getPreferences(): UserPreferences {
    try {
        if (fs.existsSync(PREFS_FILE)) {
            const data = fs.readFileSync(PREFS_FILE, 'utf-8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error reading preferences:', error);
    }
    return defaultPreferences;
}

export function savePreferences(prefs: UserPreferences): void {
    try {
        fs.writeFileSync(PREFS_FILE, JSON.stringify(prefs, null, 2));
    } catch (error) {
        console.error('Error saving preferences:', error);
        throw error;
    }
}

export function addSource(source: Omit<Source, 'id' | 'addedAt'>): Source {
    const prefs = getPreferences();
    const newSource: Source = {
        ...source,
        id: Date.now().toString(),
        addedAt: new Date().toISOString(),
    };
    prefs.sources.push(newSource);
    savePreferences(prefs);
    return newSource;
}

export function removeSource(id: string): void {
    const prefs = getPreferences();
    prefs.sources = prefs.sources.filter(s => s.id !== id);
    savePreferences(prefs);
}

export function updateSource(id: string, updates: Partial<Source>): void {
    const prefs = getPreferences();
    const index = prefs.sources.findIndex(s => s.id === id);
    if (index !== -1) {
        prefs.sources[index] = { ...prefs.sources[index], ...updates };
        savePreferences(prefs);
    }
}
