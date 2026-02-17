import { NextResponse } from 'next/server';
import { getPreferences, savePreferences, getUser, saveUser } from '@/lib/db';

export async function GET(request: Request) {
    try {
        const email = request.headers.get('x-user-email');
        if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await getUser(email);
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        return NextResponse.json({
            email: user.email,
            deliveryTime: user.preferences.deliveryTime,
            timezone: user.preferences.timezone,
            llmProvider: user.preferences.llmProvider || 'groq',
            subscriptionStatus: user.preferences.subscriptionStatus || 'active',
            pausedUntil: user.preferences.pausedUntil,
            sources: user.sources
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const email = request.headers.get('x-user-email');
        if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const user = await getUser(email);
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // Update preferences
        if (body.deliveryTime !== undefined) user.preferences.deliveryTime = body.deliveryTime;
        if (body.timezone !== undefined) user.preferences.timezone = body.timezone;
        if (body.timezone !== undefined) user.preferences.timezone = body.timezone;
        if (body.llmProvider !== undefined) user.preferences.llmProvider = body.llmProvider;
        if (body.subscriptionStatus !== undefined) user.preferences.subscriptionStatus = body.subscriptionStatus;
        if (body.pausedUntil !== undefined) user.preferences.pausedUntil = body.pausedUntil;

        await saveUser(user);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
