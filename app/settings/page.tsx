'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SettingsPage() {
    const [email, setEmail] = useState('');
    const [deliveryTime, setDeliveryTime] = useState('08:00');
    const [timezone, setTimezone] = useState('Asia/Kolkata');
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

            // Auto-detect browser timezone if none is set
            const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            setTimezone(data.timezone || browserTimezone);
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
                body: JSON.stringify({ email, deliveryTime, timezone })
            });

            if (res.ok) {
                setMessage('✅ Settings saved successfully!');
                setTimeout(() => setMessage(''), 3000);
            } else {
                const data = await res.json();
                setMessage(`Error: ${data.error}`);
            }
        } catch (error: unknown) {
            const err = error as Error;
            setMessage(`Error: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F9FAFB] text-gray-900 font-sans">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 py-8 px-6">
                <div className="max-w-3xl mx-auto flex justify-between items-center">
                    <div>
                        <Link href="/" className="text-gray-500 hover:text-gray-900 mb-2 inline-block text-sm font-medium">
                            ← Back to Dashboard
                        </Link>
                        <h1 className="text-3xl font-serif font-bold text-gray-900">System Configuration</h1>
                        <p className="text-gray-500 mt-1">Manage global delivery preferences for the admin profile.</p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-3xl mx-auto px-6 py-12">
                {message && (
                    <div className={`mb-6 p-4 rounded-lg font-medium border ${message.includes('Error') ? 'bg-red-50 border-red-100 text-red-700' : 'bg-green-50 border-green-100 text-green-700'}`}>
                        {message}
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                    {loading ? (
                        <div className="py-12 text-center text-gray-400">Loading configuration...</div>
                    ) : (
                        <form onSubmit={handleSave} className="space-y-8">
                            <div>
                                <label className="block text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">
                                    Admin Email Address
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-black focus:border-transparent text-lg transition-all"
                                    placeholder="your@email.com"
                                    required
                                />
                                <p className="text-sm text-gray-500 mt-2">
                                    This is the separate admin digest receiver. (Regular users manage their own emails).
                                </p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">
                                        Delivery Time
                                    </label>
                                    <input
                                        type="time"
                                        value={deliveryTime}
                                        onChange={e => setDeliveryTime(e.target.value)}
                                        className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-black focus:border-transparent text-lg transition-all"
                                        required
                                    />
                                    <p className="text-sm text-gray-500 mt-2">
                                        When the system triggers your daily dispatch.
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">
                                        Timezone
                                    </label>
                                    <input
                                        type="text"
                                        value={timezone}
                                        onChange={e => setTimezone(e.target.value)}
                                        className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-black focus:border-transparent text-lg transition-all bg-gray-50"
                                        placeholder="e.g., Asia/Kolkata"
                                        required
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-tighter">
                                        Detected: {Intl.DateTimeFormat().resolvedOptions().timeZone}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full bg-black text-white py-4 rounded-lg hover:bg-gray-900 transition font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform duration-200"
                                >
                                    {saving ? 'Saving changes...' : 'Save Configuration'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Important Notes */}
                <div className="mt-8 grid md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <h3 className="font-serif font-bold text-lg mb-3">📌 Admin Notes</h3>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li>• Use an email you check regularly.</li>
                            <li>• The cron job runs automatically on Vercel.</li>
                            <li>• You can manually trigger dispatches from the Control Room.</li>
                        </ul>
                    </div>

                    {/* SendGrid Notice */}
                    <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-6">
                        <h3 className="font-serif font-bold text-lg mb-3 text-yellow-800">⚠️ SMTP Config</h3>
                        <p className="text-sm text-yellow-700 mb-3 leading-relaxed">
                            Ensure your sender identity is verified in SendGrid to prevent delivery failures.
                        </p>
                        <a
                            href="https://app.sendgrid.com/settings/sender_auth"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-bold text-yellow-900 hover:underline inline-flex items-center gap-1"
                        >
                            Check SendGrid Status →
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
