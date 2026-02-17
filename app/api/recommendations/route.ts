import { NextRequest, NextResponse } from 'next/server';
import { getUser, getAllUsers } from '@/lib/db';
import { getStarterPacks, getContextualRecommendations } from '@/lib/recommendations';

export const dynamic = 'force-dynamic'; // Never cache this route

export async function GET(request: NextRequest) {
    try {
        const userEmails = await getAllUsers();

        if (!userEmails.length) {
            return NextResponse.json({
                mode: 'starter',
                data: getStarterPacks()
            });
        }

        const email = userEmails[0];
        const user = await getUser(email);

        if (!user) {
            return NextResponse.json({
                mode: 'starter',
                data: getStarterPacks()
            });
        }

        const hasSources = user.sources && user.sources.length > 0;

        if (!hasSources) {
            return NextResponse.json({
                mode: 'starter',
                data: getStarterPacks()
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
