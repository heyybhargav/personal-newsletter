import { NextRequest, NextResponse } from 'next/server';
import { getUser, getAllUsers, getAllStarterPacks } from '@/lib/db';
import { getStarterPacks, getContextualRecommendations } from '@/lib/recommendations';

export const dynamic = 'force-dynamic'; // Never cache this route

export async function GET(request: NextRequest) {
    try {
        const userEmails = await getAllUsers();

        // Helper to get packs (DB first, then fallback)
        const getPacks = async () => {
            const dbPacks = await getAllStarterPacks();
            if (dbPacks && dbPacks.length > 0) return dbPacks;
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
