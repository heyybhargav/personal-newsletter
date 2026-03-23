import { NextRequest, NextResponse } from 'next/server';
import { getUser, getAllUsers, getAllStarterPacks } from '@/lib/db';
import { getStarterPacks, getContextualRecommendations, CURATED_LIBRARY } from '@/lib/recommendations';

export const dynamic = 'force-dynamic'; // Never cache this route

// Build a lookup of url -> favicon from the curated library (shared pattern)
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
        const userEmails = await getAllUsers();

        // Helper to get packs (DB first with enrichment, then fallback)
        const getPacks = async () => {
            const dbPacks = await getAllStarterPacks();
            if (dbPacks && dbPacks.length > 0) return enrichPacksWithFavicons(dbPacks);
            return getStarterPacks();
        };

        if (!userEmails.length) {
            return NextResponse.json({
                mode: 'starter',
                data: await getPacks()
            });
        }

        const email = userEmails[0];
        const user = await getUser(email);

        if (!user) {
            return NextResponse.json({
                mode: 'starter',
                data: await getPacks()
            });
        }

        const hasSources = user.sources && user.sources.length > 0;

        if (!hasSources) {
            return NextResponse.json({
                mode: 'starter',
                data: await getPacks()
            });
        }

        const existingUrls = user.sources.map((s: any) => s.url);
        const recommendations = getContextualRecommendations(existingUrls);

        return NextResponse.json({
            mode: 'contextual',
            data: recommendations
        });

    } catch (error: any) {
        console.error('[API] Recommendation Error:', error);
        // On error, return starter packs as fallback so the UI never breaks
        return NextResponse.json({
            mode: 'starter',
            data: getStarterPacks()
        });
    }
}

