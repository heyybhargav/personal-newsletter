import { Metadata } from 'next';
import PrivacyClient from './PrivacyClient';

export const metadata: Metadata = {
    title: 'Privacy Policy | Siftl',
    description: 'How Siftl protects your data and attention.',
};

export default function PrivacyPage() {
    return <PrivacyClient />;
}
