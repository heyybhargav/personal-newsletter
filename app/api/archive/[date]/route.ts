import { NextRequest, NextResponse } from 'next/server';
import { getArchivedBriefing, getAllUsers } from '@/lib/db';
import { cookies } from 'next/headers';
import * as jose from 'jose';

async function getEmailFromSession(request: NextRequest): Promise<string | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (token) {
        try {
            const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-for-dev');
            const { payload } = await jose.jwtVerify(token, secret);
            if (payload.email) return payload.email as string;
        } catch (e) {
            // Fallthrough
        }
    }

    let email = request.headers.get('x-user-email');
    if (email) return email;

    const users = await getAllUsers();
    if (users.length > 0) return users[0];

    return null;
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ date: string }> }
) {
    try {
        const { date } = await params;
        const email = await getEmailFromSession(request);

        if (!email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const briefing = await getArchivedBriefing(email, date);

        if (!briefing) {
            return NextResponse.json({ error: 'Briefing not found for this date, or it has expired.' }, { status: 404 });
        }

        return NextResponse.json(briefing);
    } catch (error: any) {
        console.error('[Archive Detail] Failed to fetch briefing:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
