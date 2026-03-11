import { Metadata } from 'next';
import PrivacyClient from './PrivacyClient';

export const metadata: Metadata = {
    title: 'Privacy Policy | Signal Daily',
    description: 'How Signal Daily protects your data and attention.',
};

export default function PrivacyPage() {
    return <PrivacyClient />;
}
