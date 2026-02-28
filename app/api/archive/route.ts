import { NextRequest, NextResponse } from 'next/server';
import { getArchiveList, getAllUsers } from '@/lib/db';
import { cookies } from 'next/headers';
import * as jose from 'jose';

async function getEmailFromSession(request: NextRequest): Promise<string | null> {
    // 1. Try Next.js 15 Cookie Auth First (Production)
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (token) {
        try {
            const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-for-dev');
            const { payload } = await jose.jwtVerify(token, secret);
            if (payload.email) return payload.email as string;
        } catch (e) {
            // Fallthrough to next methods
        }
    }

    // 2. Try Headers Auth (Local Dev / Middleware Proxy)
    let email = request.headers.get('x-user-email');
    if (email) return email;

    // 3. Try Local DB Fallback (Dev Only Strategy seen in Sources API)
    const users = await getAllUsers();
    if (users.length > 0) return users[0];

    return null;
}

export async function GET(request: NextRequest) {
    try {
        const email = await getEmailFromSession(request);

        if (!email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const dates = await getArchiveList(email);

        return NextResponse.json({ dates });
    } catch (error: any) {
        console.error('[Archive Index] Failed to fetch layout:', error);
        return NextResponse.json({ error: 'Failed to fetch archive history' }, { status: 500 });
    }
}
