'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SettingsPage() {
    const [email, setEmail] = useState('');
    const [deliveryTime, setDeliveryTime] = useState('08:00');
    const [timezone, setTimezone] = useState('');
    const [llmProvider, setLlmProvider] = useState<string>('groq');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [runningCron, setRunningCron] = useState(false);
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

    const handleForceDispatch = async () => {
        if (!confirm('This will trigger the digest dispatch for ALL users regardless of time settings. Continue?')) return;

        setRunningCron(true);
        setMessage('');

        try {
            const res = await fetch('/api/cron');
            const data = await res.json();

            if (res.ok) {
                setMessage('✅ Dispatch triggered successfully! Check your inbox momentarily.');
                console.log(data);
            } else {
                setMessage(`Error: ${data.message || 'Cron failed'}`);
            }
        } catch (error) {
            setMessage('Failed to trigger dispatch');
        } finally {
            setRunningCron(false);
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
                body: JSON.stringify({ email, deliveryTime, timezone, llmProvider })
            });

            if (res.ok) {
                setMessage('✅ Settings saved successfully!');
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

    return (
        <div className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A] font-sans selection:bg-[#FF5700] selection:text-white">
            {/* Header */}
            <div className="max-w-3xl mx-auto px-6 pt-16 pb-12">
                <Link href="/" className="text-gray-400 hover:text-black mb-6 inline-flex items-center gap-2 text-sm font-medium transition-colors">
                    <span>←</span> Return to Control Room
                </Link>
                <div>
                    <div className="px-3 py-1 rounded-full border border-gray-200 inline-block bg-white/50 backdrop-blur-sm mb-4">
                        <p className="text-xs font-bold tracking-widest text-[#FF5700] uppercase">System Config</p>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-serif font-medium tracking-tight text-[#1A1A1A]">Configuration</h1>
                    <p className="text-xl text-gray-500 font-light mt-4 font-serif">Manage global delivery preferences and AI logic.</p>
                </div>
                <div className="h-px w-full bg-gray-200/60 mt-12"></div>
            </div>

            {/* Main Content */}
            <div className="max-w-3xl mx-auto px-6 pb-24">
                {message && (
                    <div className={`mb-8 p-4 rounded-lg font-medium border ${message.includes('Error') ? 'bg-red-50 border-red-100 text-red-700' : 'bg-green-50 border-green-100 text-green-700'}`}>
                        {message}
                    </div>
                )}

                <div className="">
                    {loading ? (
                        <div className="py-12 text-center text-gray-400 font-serif italic">Loading details...</div>
                    ) : (
                        <form onSubmit={handleSave} className="space-y-12">
                            {/* Section 1: Delivery */}
                            <section>
                                <h3 className="text-lg font-serif font-bold mb-6 border-b border-gray-200 pb-2">Delivery Settings</h3>
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
                                            Admin Email
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

                            {/* Section 2: Intelligence */}
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

                {/* Danger Zone / Manual Override */}
                <div className="mt-20 border-t border-gray-200 pt-10">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Manual Override</h3>
                    <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                        <div className="max-w-md">
                            <h4 className="font-serif font-bold text-lg mb-1">Force Dispatch</h4>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                Immediately trigger the digest generation and delivery cycle. This bypasses the scheduled time.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleForceDispatch}
                            disabled={runningCron}
                            className="whitespace-nowrap px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition font-medium text-sm flex items-center gap-2"
                        >
                            {runningCron ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
                                    <span>Dispatching...</span>
                                </>
                            ) : (
                                '⚡ Run Now'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
