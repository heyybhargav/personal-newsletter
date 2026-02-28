import { getSession } from '@/lib/auth';
import { getUser, getTrialDaysRemaining, getAllStarterPacks } from '@/lib/db';
import { getStarterPacks as getDefaultStarterPacks } from '@/lib/recommendations';
import { redirect } from 'next/navigation';
import SourcesClient from './SourcesClient';

export default async function SourcesPage() {
    const session = await getSession();
    if (!session?.email) {
        redirect('/login');
    }

    const [user, dbPacks] = await Promise.all([
        getUser(session.email),
        getAllStarterPacks()
    ]);

    if (!user) redirect('/login');

    const initialSources = user.sources || [];
    const isTrial = user.tier === 'trial';
    const initialTrialDays = isTrial ? getTrialDaysRemaining(user) : 0;
    const initialTier = user.tier || 'active';

    // Fallback to static defaults if nothing in the DB
    const initialStarterPacks = (dbPacks && dbPacks.length > 0) ? dbPacks : getDefaultStarterPacks();

    return (
        <SourcesClient
            initialSources={initialSources}
            initialTier={initialTier}
            initialTrialDays={initialTrialDays}
            initialStarterPacks={initialStarterPacks}
        />
    );
}
