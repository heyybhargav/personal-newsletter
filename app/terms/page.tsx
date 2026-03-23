import { Metadata } from 'next';
import TermsClient from './TermsClient';

export const metadata: Metadata = {
    title: 'Terms of Service | Siftl',
    description: 'The terms governing the use of Siftl, the agentic knowledge engine.',
};

export default function TermsPage() {
    return <TermsClient />;
}
