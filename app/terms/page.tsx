import { Metadata } from 'next';
import TermsClient from './TermsClient';

export const metadata: Metadata = {
    title: 'Terms of Service | Signal Daily',
    description: 'The terms governing the use of Signal Daily, the agentic knowledge engine.',
};

export default function TermsPage() {
    return <TermsClient />;
}
