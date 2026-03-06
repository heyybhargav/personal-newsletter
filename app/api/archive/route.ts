import { NextRequest, NextResponse } from 'next/server';
import { getArchiveList, getAllUsers } from '@/lib/db';
import { getSession } from '@/lib/auth';

async function getEmailFromSession(request: NextRequest): Promise<string | null> {
    const session = await getSession();
    if (session?.email) return session.email;

    // 2. Try Headers Auth (Local Dev / Middleware Proxy)
    let email = request.headers.get('x-user-email');
    if (email) return email;

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
