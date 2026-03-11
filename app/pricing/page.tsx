import { Metadata } from 'next';
import PricingClient from './PricingClient';

export const metadata: Metadata = {
    title: 'Pricing | Signal',
    description: 'Invest in your attention. Unlimited synthesis for $4/month.',
};

export default function PricingPage() {
    return <PricingClient />;
}
