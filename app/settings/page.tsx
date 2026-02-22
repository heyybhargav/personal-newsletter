'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SettingsPage() {
    const [email, setEmail] = useState('');
    const [deliveryTime, setDeliveryTime] = useState('08:00');
    const [timezone, setTimezone] = useState('');
    const [llmProvider, setLlmProvider] = useState<string>('groq');
    const [subscriptionStatus, setSubscriptionStatus] = useState<'active' | 'paused'>('active');
    const [pausedUntil, setPausedUntil] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/settings');
            const data = await res.json();
            setEmail(data.email || '');
            setDeliveryTime(data.deliveryTime || '08:00');
            setLlmProvider(data.llmProvider || 'groq');
            setSubscriptionStatus(data.subscriptionStatus || 'active');
            setPausedUntil(data.pausedUntil || null);

            // If API returns timezone, use it. Otherwise, auto-detect from browser.
            if (data.timezone) {
                setTimezone(data.timezone);
            } else {
                setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };



    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');

        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    deliveryTime,
                    timezone,
                    llmProvider,
                    subscriptionStatus,
                    pausedUntil
                })
            });

            if (res.ok) {
                setMessage('Settings saved successfully.');
                setTimeout(() => setMessage(''), 3000);
            } else {
                const data = await res.json();
                setMessage(`Error: ${data.error}`);
            }
        } catch (error: any) {
            setMessage(`Error: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const saveSubscriptionPreferences = async (newStatus: 'active' | 'paused', newPausedUntil: string | null) => {
        setSaving(true);
        setMessage('');

        // Optimistic update
        setSubscriptionStatus(newStatus);
        setPausedUntil(newPausedUntil);

        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    deliveryTime,
                    timezone,
                    llmProvider,
                    subscriptionStatus: newStatus,
                    pausedUntil: newPausedUntil
                })
            });

            if (res.ok) {
                // Success - no message needed for optimistic UI
            } else {
                const data = await res.json();
                setMessage(`Error: ${data.error}`);
                // Revert on error (optional, but good practice - simplified here for now)
            }
        } catch (error: any) {
            setMessage(`Error: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handlePause = (duration: '7_days' | '15_days' | 'indefinite') => {
        let newPausedUntil: string | null = null;
        if (duration !== 'indefinite') {
            const days = duration === '7_days' ? 7 : 15;
            const date = new Date();
            date.setDate(date.getDate() + days);
            newPausedUntil = date.toISOString();
        }
        saveSubscriptionPreferences('paused', newPausedUntil);
    };

    const handleResume = () => {
        saveSubscriptionPreferences('active', null);
    };

    return (
        <div className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A] font-sans selection:bg-[#FF5700] selection:text-white">
            {/* Header */}
            <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-8 sm:pb-12">
                <Link href="/" className="text-gray-400 hover:text-black mb-6 flex items-center gap-2 text-sm font-medium transition-colors">
                    <span>←</span> Return to Control Room
                </Link>
                <div>
                    <div className="px-3 py-1 rounded-full border border-gray-200 inline-block bg-white/50 backdrop-blur-sm mb-3 sm:mb-4">
                        <p className="text-xs font-bold tracking-widest text-[#FF5700] uppercase">System Config</p>
                    </div>
                    <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif font-medium tracking-tight text-[#1A1A1A]">Configuration</h1>
                    <p className="text-base sm:text-xl text-gray-500 font-light mt-4 font-serif">Manage global delivery preferences and AI logic.</p>
                </div>
                <div className="h-px w-full bg-gray-200/60 mt-8 sm:mt-12"></div>
            </div>

            {/* Main Content */}
            <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-24">
                {/* Message Display */}
                {message && (
                    <div className={`mb-8 p-4 rounded-lg text-sm border flex items-start gap-3 shadow-sm ${message.includes('Error') ? 'bg-red-50 border-red-100 text-red-800' : 'bg-green-50 border-green-100 text-green-800'}`}>
                        <div className={`mt-1.5 w-2 h-2 rounded-full ${message.includes('Error') ? 'bg-red-500' : 'bg-green-500'}`}></div>
                        <div className="flex-1 font-medium">
                            {message}
                        </div>
                    </div>
                )}

                <div className="">
                    {loading ? (
                        <div className="py-12 text-center text-gray-400 font-serif italic">Loading details...</div>
                    ) : (
                        <form onSubmit={handleSave} className="space-y-12">
                            {/* Section 2: Delivery Config */}
                            <section>
                                <h3 className="text-lg font-serif font-bold mb-6 border-b border-gray-200 pb-2">Delivery Settings</h3>
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="block text-[10px] font-bold tracking-widest text-[#1A1A1A] uppercase mb-4">
                                            Delivery Email
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            className="w-full bg-transparent border-0 border-b-2 border-gray-200 rounded-none focus:border-[#FF5700] focus:ring-0 px-0 py-3 text-xl font-serif placeholder:text-gray-300 transition-colors focus:outline-none"
                                            placeholder="your@email.com"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
                                            Dispatch Time (IST)
                                        </label>
                                        <input
                                            type="time"
                                            value={deliveryTime}
                                            onChange={e => setDeliveryTime(e.target.value)}
                                            className="w-full bg-transparent border-0 border-b-2 border-gray-200 rounded-none focus:border-[#FF5700] focus:ring-0 px-0 py-3 text-xl font-serif transition-colors focus:outline-none"
                                            required
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Section 3: Intelligence */}
                            <section>
                                <h3 className="text-lg font-serif font-bold mb-6 border-b border-gray-200 pb-2">Intelligence Engine</h3>
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
                                            LLM Provider
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={llmProvider}
                                                onChange={e => setLlmProvider(e.target.value)}
                                                className="w-full bg-transparent border-b-2 border-gray-200 py-3 pr-8 text-xl font-serif focus:border-[#FF5700] focus:outline-none appearance-none cursor-pointer"
                                            >
                                                <option value="groq">Llama 3.3 70B (Groq)</option>
                                                <option value="gemini">Gemini 1.5 Flash</option>
                                            </select>
                                            <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">
                                                ▼
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
                                            Timezone
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={timezone}
                                                onChange={e => setTimezone(e.target.value)}
                                                className="w-full bg-transparent border-b-2 border-gray-200 py-3 pr-8 text-xl font-serif focus:border-[#FF5700] focus:outline-none appearance-none cursor-pointer"
                                                required
                                            >
                                                {/* Common Timezones */}
                                                <optgroup label="Detected">
                                                    <option value={timezone}>{timezone}</option>
                                                </optgroup>
                                                <optgroup label="Global">
                                                    <option value="UTC">UTC (Universal Time)</option>
                                                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                                                    <option value="America/New_York">America/New_York (EST)</option>
                                                    <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                                                    <option value="Europe/London">Europe/London (GMT)</option>
                                                    <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                                                </optgroup>
                                            </select>
                                            <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">
                                                ▼
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>



                            {/* Section 3: Subscription Status (Subtle & at the bottom) */}
                            <section className="pt-8 border-t border-gray-200/60">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-1">Subscription Status</h3>
                                        <p className="text-gray-500 text-sm">
                                            {subscriptionStatus === 'active'
                                                ? 'Your daily briefing is active.'
                                                : pausedUntil
                                                    ? `Paused until ${new Date(pausedUntil).toLocaleDateString()}.`
                                                    : 'Paused indefinitely.'}
                                        </p>
                                    </div>

                                    {subscriptionStatus === 'paused' ? (
                                        <button
                                            type="button"
                                            onClick={handleResume}
                                            className="text-sm text-[#FF5700] font-medium hover:underline mt-2 md:mt-0"
                                        >
                                            Resume Delivery
                                        </button>
                                    ) : (
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-4 md:mt-0">
                                            <span className="text-xs text-gray-400 uppercase tracking-wider font-bold sm:mr-2">Pause for:</span>
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handlePause('7_days')}
                                                    className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold uppercase tracking-wider border border-gray-200 rounded-full hover:border-[#FF5700] hover:text-[#FF5700] hover:bg-[#FF5700]/5 transition-all duration-200 whitespace-nowrap"
                                                >
                                                    7 Days
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handlePause('15_days')}
                                                    className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold uppercase tracking-wider border border-gray-200 rounded-full hover:border-[#FF5700] hover:text-[#FF5700] hover:bg-[#FF5700]/5 transition-all duration-200 whitespace-nowrap"
                                                >
                                                    15 Days
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handlePause('indefinite')}
                                                    className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold uppercase tracking-wider border border-gray-200 rounded-full hover:border-[#FF5700] hover:text-[#FF5700] hover:bg-[#FF5700]/5 transition-all duration-200 whitespace-nowrap"
                                                >
                                                    Indefinitely
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>

                            <div className="pt-8 flex items-center justify-between">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-[#1A1A1A] text-white px-8 py-4 rounded-full font-medium hover:bg-[#FF5700] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform duration-200 text-lg"
                                >
                                    {saving ? 'Saving...' : 'Save Configuration'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Promo Section - Replaces Manual Override */}
                <div className="mt-20 p-8 md:p-10 bg-[#FF5700]/5 border border-[#FF5700]/10 rounded-2xl relative overflow-hidden flex flex-col items-center text-center">
                    <div className="relative z-10 max-w-2xl mx-auto">
                        <div className="flex items-center justify-center gap-2 mb-6">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF5700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                            </svg>
                            <span className="text-xs font-bold tracking-widest text-[#FF5700] uppercase">The Signal Advantage</span>
                        </div>
                        <h3 className="text-3xl font-serif mb-6 text-[#1A1A1A]">Reclaim your attention.</h3>
                        <p className="text-gray-600 leading-relaxed font-serif text-lg">
                            Signal is designed to be the quietest part of your internet experience. We monitor your selected sources 24/7, aggressively filter out PR fluff and noise, and synthesize the actionable insights into one concise executive briefing.
                        </p>
                        <hr className="my-8 border-t border-[#FF5700]/20 w-24 mx-auto" />
                        <p className="text-gray-600 leading-relaxed font-serif text-lg">
                            By reading Signal instead of doomscrolling feeds, you save <b>hours every week</b> while staying better informed. No algorithms. No engagement traps. Just what matters, delivered exactly when you want it.
                        </p>
                    </div>
                </div>
            </div>
        </div >
    );
}
