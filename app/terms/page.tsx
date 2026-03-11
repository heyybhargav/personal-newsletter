import { Metadata } from 'next';
import TermsClient from './TermsClient';

export const metadata: Metadata = {
    title: 'Terms of Service | Signal',
    description: 'The terms governing the use of the Signal, the agentic knowledge engine.',
};

export default function TermsPage() {
    return <TermsClient />;
}
