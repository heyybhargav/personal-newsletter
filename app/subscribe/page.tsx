'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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
                <div className="w-8 h-8 rounded-full border-2 border-transparent border-t-[#FF4F00] animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFBF7] relative overflow-hidden flex flex-col items-center justify-center">

            {/* Background elements to match the "Fire on Paper" aesthetic */}
            <div className="absolute top-0 right-0 p-8 z-10 w-[500px] h-[500px] md:w-[800px] md:h-[800px] pointer-events-none opacity-[0.15]">
                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full transform translate-x-1/3 -translate-y-1/3">
                    <path fill="#FF4F00" d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,81.3,-46.3C90.8,-33.5,96.8,-18,97.6,-2.3C98.4,13.4,94,29.3,85.2,42.5C76.4,55.7,63.2,66.2,49,74C34.8,81.8,19.6,86.9,4.2,84.5C-11.2,82.1,-26.4,72.2,-40.5,63.6C-54.6,55,-67.6,47.7,-76.3,36.5C-85,25.3,-89.4,10.2,-88.7,-4.5C-88,-19.2,-82.2,-33.5,-73.4,-45.4C-64.6,-57.3,-52.8,-66.8,-39.7,-74.6C-26.6,-82.4,-12.3,-88.5,1.5,-90.6C15.3,-92.7,30.6,-90.8,44.7,-76.4Z" transform="translate(100 100)" />
                </svg>
            </div>

            <div className="max-w-md w-full px-6 py-12 relative z-20 text-center">
                {/* Logo */}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-sm border border-gray-100 mb-8">
                    <span className="text-2xl font-bold font-serif tabular-nums text-[#FF4F00]">S.</span>
                </div>

                <h1 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900 mb-4 tracking-tight">
                    Your free trial has ended.
                </h1>

                <p className="text-lg text-gray-600 mb-10 leading-relaxed font-serif">
                    The noise hasn't stopped, but your briefings have.
                </p>

                <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm mb-10 text-left relative overflow-hidden group hover:border-[#FF4F00]/30 transition-colors">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#FF4F00]"></div>
                    <div className="flex items-center justify-between mb-6">
                        <span className="text-sm font-bold tracking-widest text-[#FF4F00] uppercase">Signal Pro</span>
                        <span className="text-2xl font-bold font-mono">$4<span className="text-sm text-gray-400 font-sans font-normal">/mo</span></span>
                    </div>

                    <ul className="space-y-4 mb-8">
                        <li className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            <span className="text-gray-700">Unlimited data sources</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            <span className="text-gray-700">Gemini 3 Pro for synthesis</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            <span className="text-gray-700">Custom delivery schedule</span>
                        </li>
                    </ul>

                    {/* Stats context if available */}
                    {stats && stats.totalSources > 0 && (
                        <div className="bg-orange-50 rounded-xl p-4 mb-8 text-sm text-[#B45309]">
                            Your <strong>{stats.totalSources} sources</strong> are perfectly preserved. Subscribe to resume your intelligence flow today.
                        </div>
                    )}

                    <a
                        href={checkoutUrl}
                        className="block w-full py-4 px-6 bg-[#FF4F00] hover:bg-[#E64600] text-white text-center font-bold rounded-2xl transition-all shadow-sm group-hover:shadow-md"
                    >
                        Subscribe via Polar.sh →
                    </a>
                </div>

                <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Secure payment processing
                </div>
            </div>
        </div>
    );
}
