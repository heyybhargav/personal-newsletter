import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import SignInClient from './SignInClient';

export const metadata = {
    title: 'Sign in — Signal',
    description: 'Sign in to access your personalised daily intelligence briefing.',
};

export default async function SignInPage() {
    const session = await getSession();
    if (session?.email) {
        redirect('/');
    }
    return <SignInClient />;
}
