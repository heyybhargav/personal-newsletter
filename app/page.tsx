import { getSession } from '@/lib/auth';
import { getUser, getTrialDaysRemaining, getLatestBriefing } from '@/lib/db';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';

export default async function Home() {
    const session = await getSession();
    if (!session?.email) {
        redirect('/login');
    }

    const [user, briefingData] = await Promise.all([
        getUser(session.email),
        getLatestBriefing(session.email)
    ]);

    if (!user) redirect('/login');

    const initialSources = user.sources || [];
    const isTrial = user.tier === 'trial';
    const initialTrialDays = isTrial ? getTrialDaysRemaining(user) : 0;
    const initialTier = user.tier || 'active';

    let initialLatestData = null;
    if (briefingData) {
        initialLatestData = {
            briefing: {
                narrative: briefingData.narrative,
                topStories: briefingData.topStories,
                generatedAt: briefingData.generatedAt,
                subject: briefingData.subject
            },
            sections: [{
                title: briefingData.subject || `Briefing - ${new Date(briefingData.generatedAt).toLocaleDateString()}`,
                summary: briefingData.narrative,
                items: briefingData.topStories?.map((item: any) => ({ ...item, summary: '' })) || []
            }]
        };
    }

    return (
        <DashboardClient
            initialSources={initialSources}
            initialTier={initialTier}
            initialTrialDays={initialTrialDays}
            initialLatestData={initialLatestData}
        />
    );
}
