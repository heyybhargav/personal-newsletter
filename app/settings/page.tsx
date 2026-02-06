'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SettingsPage() {
    const [email, setEmail] = useState('');
    const [deliveryTime, setDeliveryTime] = useState('08:00');
    const [timezone, setTimezone] = useState('');
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
                body: JSON.stringify({ email, deliveryTime, timezone })
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

                            <div>
                                <label className="block text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">
                                    Global Delivery Time (IST)
                                </label>
                                <input
                                    type="time"
                                    value={deliveryTime}
                                    onChange={e => setDeliveryTime(e.target.value)}
                                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-black focus:border-transparent text-lg transition-all"
                                    required
                                />
                                <p className="text-sm text-gray-500 mt-2">
                                    When the system triggers the daily dispatch cycle.
                                </p>
                            </div>

                            <div className="pt-2 pb-6 border-b border-gray-100">
                                <label className="block text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">
                                    Manual Override
                                </label>
                                <button
                                    type="button"
                                    onClick={handleForceDispatch}
                                    disabled={runningCron}
                                    className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition font-bold shadow-md flex items-center justify-center gap-2"
                                >
                                    {runningCron ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Dispatching...
                                        </>
                                    ) : (
                                        '⚡ Force Send Digest Now'
                                    )}
                                </button>
                                <p className="text-sm text-gray-500 mt-2">
                                    Bypasses schedule and sends emails immediately to all users.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">
                                    Timezone
                                </label>
                                <div className="relative">
                                    <select
                                        value={timezone}
                                        onChange={e => setTimezone(e.target.value)}
                                        className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-black focus:border-transparent text-lg transition-all appearance-none bg-white"
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
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                        ▼
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500 mt-2">
                                    Auto-detected from your browser.
                                </p>
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
