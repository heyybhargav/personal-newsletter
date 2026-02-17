
import { NextRequest, NextResponse } from 'next/server';
import { getAllStarterPacks } from '@/lib/db';
import { getStarterPacks } from '@/lib/recommendations';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const packs = await getAllStarterPacks();

        // If DB is empty, return defaults
        if (!packs || packs.length === 0) {
            return NextResponse.json({ packs: getStarterPacks() });
        }

        return NextResponse.json({ packs });
    } catch (error: any) {
        // Fallback to defaults on error
        return NextResponse.json({ packs: getStarterPacks() });
    }
}
