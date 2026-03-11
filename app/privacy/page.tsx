import { Metadata } from 'next';
import PrivacyClient from './PrivacyClient';

export const metadata: Metadata = {
    title: 'Privacy Policy | Signal',
    description: 'How Signal protects your data and attention.',
};

export default function PrivacyPage() {
    return <PrivacyClient />;
}
