import { NextResponse } from 'next/server';
import { getLatestBriefing, getPreferences } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getSession();
        let email = session?.email;

        if (!email) {
            // fallback to admin logic
            const prefs = await getPreferences();
            email = prefs.email;
        }

        if (!email) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const briefing = await getLatestBriefing(email);

        if (!briefing) {
            return NextResponse.json({ briefing: null, sections: [] });
        }

        return NextResponse.json({
            briefing: {
                narrative: briefing.narrative,
                topStories: briefing.topStories,
                generatedAt: briefing.generatedAt,
                subject: briefing.subject
            },
            sections: [{
                title: briefing.subject || `Briefing - ${new Date(briefing.generatedAt).toLocaleDateString()}`,
                summary: briefing.narrative,
                items: briefing.topStories?.map((item: any) => ({ ...item, summary: '' })) || []
            }]
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
