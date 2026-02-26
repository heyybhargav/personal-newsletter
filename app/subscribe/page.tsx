'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SubscribePage() {
    const [stats, setStats] = useState<{ totalSources: number; daysSinceDigest: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Fetch user basic stats to show on the subscribe page
        fetch('/api/settings')
            .then(res => {
                if (res.status === 401) {
                    router.push('/login');
                    return null;
                }
                return res.json();
            })
            .then(data => {
                if (data && data.sources) {
                    const lastDigest = data.lastDigestAt ? new Date(data.lastDigestAt) : null;
                    const daysSince = lastDigest
                        ? Math.floor((Date.now() - lastDigest.getTime()) / (1000 * 60 * 60 * 24))
                        : 0;

                    setStats({
                        totalSources: data.sources.length,
                        daysSinceDigest: Math.max(0, daysSince)
                    });

                    // If they somehow landed here but have access, push them to dashboard
                    if (data.tier === 'active' || (data.tier === 'trial' && data.trialDaysRemaining > 0)) {
                        router.push('/');
                    }
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching stats:', err);
                setLoading(false);
            });
    }, [router]);

    // Use environment variable if set, otherwise fallback to a generic placeholder for dev
    const checkoutUrl = process.env.NEXT_PUBLIC_POLAR_CHECKOUT_URL || 'https://polar.sh/checkout/...';

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-transparent border-t-[#FF5700] animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-80px)] py-12 bg-[#FDFBF7] text-[#1A1A1A] font-sans relative overflow-hidden flex flex-col items-center justify-center selection:bg-[#FF5700] selection:text-white">

            {/* Ambient Background Glow (Subtle Fire) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FF5700] opacity-[0.04] blur-[100px] rounded-full pointer-events-none"></div>

            <div className="max-w-xl w-full px-6 relative z-20 flex flex-col items-center">
                <div className="text-center mb-6">
                    <h1 className="text-4xl md:text-5xl font-serif font-normal text-[#1A1A1A] mb-3 tracking-tight leading-tight">
                        The trial concludes.<br />
                        <span className="italic text-gray-400">The intelligence continues.</span>
                    </h1>
                    <p className="text-lg text-gray-500 font-serif max-w-md mx-auto">
                        Secure your unfair advantage with unlimited access to premium synthetic intelligence.
                    </p>
                </div>

                {/* Premium Pricing Card */}
                <div className="w-full max-w-sm sm:max-w-md bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] relative overflow-hidden group">
                    {/* Subtle top highlight */}
                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#FF5700]/70 to-transparent"></div>

                    <div className="flex items-end justify-between mb-4 pb-4 border-b border-gray-100">
                        <div>
                            <h2 className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-1">Membership Plan</h2>
                            <h3 className="text-2xl font-serif font-bold text-[#1A1A1A]">Signal Pro</h3>
                        </div>
                        <div className="text-right">
                            <div className="text-4xl font-mono text-[#1A1A1A] -mb-1">$4</div>
                            <div className="text-[10px] font-bold tracking-widest text-[#FF5700] uppercase mt-2">Per Month</div>
                        </div>
                    </div>

                    <ul className="space-y-3 mb-6">
                        <FeatureItem text="Unlimited High-Value Data Sources" />
                        <FeatureItem text="Gemini Pro Deep Synthesis" />
                        <FeatureItem text="Custom Interruption-Free Delivery" />
                        <FeatureItem text="Permanent Archive Data Retention" />
                    </ul>

                    {stats && stats.totalSources > 0 && (
                        <div className="bg-[#FDFBF7] border border-gray-200/60 rounded-xl p-3 mb-4 text-center">
                            <p className="leading-relaxed font-serif text-[15px] text-gray-600">
                                Your <strong className="text-[#1A1A1A]">{stats.totalSources} curated sources</strong> are preserved in cold storage. Subscribe to reignite your feed instantly.
                            </p>
                        </div>
                    )}

                    <a
                        href={checkoutUrl}
                        className="block w-full py-3.5 px-6 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white text-center font-bold tracking-widest uppercase text-xs rounded-xl transition-all duration-300 shadow-[0_10px_20px_-10px_rgba(26,26,26,0.3)] hover:shadow-[0_12px_24px_-10px_rgba(26,26,26,0.5)]"
                    >
                        Activate Signal Pro
                    </a>
                </div>

                <div className="mt-6 flex items-center justify-center gap-2 text-[10px] font-bold tracking-widest uppercase text-gray-400">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Encrypted Transaction via Polar.sh
                </div>
            </div>
        </div>
    );
}

function FeatureItem({ text }: { text: string }) {
    return (
        <li className="flex items-center gap-4">
            <div className="w-1.5 h-1.5 rounded-full bg-gray-200 flex-shrink-0 group-hover:bg-[#FF5700] transition-colors duration-300"></div>
            <span className="text-gray-600 font-serif text-[15px]">{text}</span>
        </li>
    );
}
