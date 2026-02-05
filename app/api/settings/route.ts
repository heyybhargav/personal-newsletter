import { NextResponse } from 'next/server';
import { getPreferences, savePreferences } from '@/lib/db';

export async function GET() {
    try {
        const prefs = getPreferences();
        return NextResponse.json(prefs);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const prefs = getPreferences();

        // Update email and delivery time
        if (body.email !== undefined) {
            prefs.email = body.email;
        }
        if (body.deliveryTime !== undefined) {
            prefs.deliveryTime = body.deliveryTime;
        }

        savePreferences(prefs);
        return NextResponse.json(prefs);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
