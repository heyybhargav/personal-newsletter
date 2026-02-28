import { getSession } from '@/lib/auth';
import { getUser, getModelRegistry, getTrialDaysRemaining } from '@/lib/db';
import { redirect } from 'next/navigation';
import SettingsClient from './SettingsClient';

export default async function SettingsPage() {
    const session = await getSession();
    if (!session?.email) {
        // Fallback for local development if auth is skipped by middleware but no session exists
        redirect('/login');
    }

    const [user, models] = await Promise.all([
        getUser(session.email),
        getModelRegistry()
    ]);

    if (!user) redirect('/login');

    const isTrial = user.tier === 'trial';
    const trialDaysRemaining = isTrial ? getTrialDaysRemaining(user) : 0;

    const initialSettings = {
        email: user.email,
        deliveryTime: user.preferences.deliveryTime,
        timezone: user.preferences.timezone,
        llmProvider: user.preferences.llmProvider || 'groq',
        subscriptionStatus: user.preferences.subscriptionStatus || 'active',
        pausedUntil: user.preferences.pausedUntil || null,
        sources: user.sources,
        tier: user.tier || 'active',
        trialDaysRemaining
    };

    const availableModels = models.map(m => ({ id: m.id, name: m.name }));

    return <SettingsClient initialSettings={initialSettings} models={availableModels} />;
}
