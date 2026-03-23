import { Metadata } from 'next';
import PricingClient from './PricingClient';

export const metadata: Metadata = {
    title: 'Pricing | Siftl',
    description: 'Invest in your attention. Tiers starting from $5/month for high-fidelity synthesis.',
};

export default function PricingPage() {
    return <PricingClient />;
}
