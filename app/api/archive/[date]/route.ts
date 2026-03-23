import { NextRequest, NextResponse } from 'next/server';
import { getArchivedBriefing, getAllUsers } from '@/lib/db';
import { getSession } from '@/lib/auth';

async function getEmailFromSession(request: NextRequest): Promise<string | null> {
    const session = await getSession();
    console.log('[DEBUG] getSession result:', session);
    if (session?.email) return session.email;

    let email = request.headers.get('x-user-email');
    console.log('[DEBUG] x-user-email header:', email);
    if (email) return email;

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
