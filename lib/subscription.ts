import { UserProfile } from './types';

type SendStatus =
    | { action: 'send' }
    | { action: 'skip', reason: 'paused_indefinite' }
    | { action: 'skip', reason: 'paused_temporary', until: string }
    | { action: 'send', reason: 'pause_expired' }; // Technically a 'send', but specific context

export function checkSubscriptionStatus(user: UserProfile): SendStatus {
    const { subscriptionStatus, pausedUntil } = user.preferences;

    // Default to active if undefined
    if (!subscriptionStatus || subscriptionStatus === 'active') {
        return { action: 'send' };
    }

    if (subscriptionStatus === 'paused') {
        // Indefinite pause
        if (!pausedUntil) {
            return { action: 'skip', reason: 'paused_indefinite' };
        }

        // Temporary pause logic
        const pauseEndDate = new Date(pausedUntil);
        const now = new Date();

        if (now < pauseEndDate) {
            return { action: 'skip', reason: 'paused_temporary', until: pausedUntil };
        }

        // Pause expired
        return { action: 'send', reason: 'pause_expired' };
    }

    return { action: 'send' };
}
