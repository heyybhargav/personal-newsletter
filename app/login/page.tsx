import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import LoginClient from './LoginClient';

/**
 * Authentication Entry Point.
 * 
 * This Server Component handles the sensitive "auto-bounce" logic.
 * If a user already has a valid session cookie, they are redirected 
 * server-side to the briefing before the landing page ever renders.
 */
export default async function LoginPage() {
    const session = await getSession();

    if (session?.email) {
        redirect('/');
    }

    return <LoginClient />;
}
