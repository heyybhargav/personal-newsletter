
import { NextRequest, NextResponse } from 'next/server';
import { getAllStarterPacks } from '@/lib/db';
import { getStarterPacks, CURATED_LIBRARY } from '@/lib/recommendations';

export const dynamic = 'force-dynamic';

// Build a lookup of url -> favicon from the curated library
const faviconLookup = new Map<string, string>();
CURATED_LIBRARY.forEach(s => {
    if (s.favicon) {
        faviconLookup.set(s.url, s.favicon);
        faviconLookup.set(s.originalUrl, s.favicon);
    }
});

function enrichPacksWithFavicons(packs: any[]): any[] {
    return packs.map(pack => ({
        ...pack,
        sources: (pack.sources || []).map((source: any) => ({
            ...source,
            favicon: source.favicon || faviconLookup.get(source.url) || faviconLookup.get(source.originalUrl) || '',
        }))
    }));
}

export async function GET(request: NextRequest) {
    try {
        const packs = await getAllStarterPacks();

        // If DB is empty, return defaults
        if (!packs || packs.length === 0) {
            return NextResponse.json({ packs: getStarterPacks() });
        }

        // Enrich DB packs with favicons from curated library
        return NextResponse.json({ packs: enrichPacksWithFavicons(packs) });
    } catch (error: any) {
        // Fallback to defaults on error
        return NextResponse.json({ packs: getStarterPacks() });
    }
}
