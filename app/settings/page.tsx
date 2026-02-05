'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SettingsPage() {
    const [email, setEmail] = useState('');
    const [deliveryTime, setDeliveryTime] = useState('08:00');
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
                body: JSON.stringify({ email, deliveryTime })
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
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-12 px-6">
                <div className="max-w-3xl mx-auto">
                    <Link href="/" className="text-indigo-200 hover:text-white mb-4 inline-block">
                        ← Back to Dashboard
                    </Link>
                    <h1 className="text-4xl font-bold mb-2">⚙️ Settings</h1>
                    <p className="text-indigo-100">Configure your email and delivery preferences</p>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-3xl mx-auto px-6 py-12">
                {message && (
                    <div className={`mb-6 p-4 rounded-lg ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {message}
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-lg p-8">
                    {loading ? (
                        <p className="text-gray-500">Loading...</p>
                    ) : (
                        <form onSubmit={handleSave}>
                            <div className="mb-8">
                                <label className="block text-sm font-semibold mb-3 text-gray-700">
                                    📧 Your Email Address
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
                                    placeholder="your@email.com"
                                    required
                                />
                                <p className="text-sm text-gray-500 mt-2">
                                    This is where your daily digest will be sent
                                </p>
                            </div>

                            <div className="mb-8">
                                <label className="block text-sm font-semibold mb-3 text-gray-700">
                                    ⏰ Daily Delivery Time (IST)
                                </label>
                                <input
                                    type="time"
                                    value={deliveryTime}
                                    onChange={e => setDeliveryTime(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
                                    required
                                />
                                <p className="text-sm text-gray-500 mt-2">
                                    Choose when you want to receive your digest (default: 8:00 AM)
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full bg-indigo-600 text-white py-4 rounded-lg hover:bg-indigo-700 transition font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? 'Saving...' : 'Save Settings'}
                            </button>
                        </form>
                    )}
                </div>

                {/* Info Box */}
                <div className="mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-indigo-200">
                    <h3 className="font-bold text-lg mb-3">📌 Important Notes</h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                        <li>• Make sure to use an email address you check regularly</li>
                        <li>• The digest is sent automatically via Vercel Cron (once deployed)</li>
                        <li>• You can always test the email functionality from the dashboard</li>
                        <li>• SendGrid free tier allows 100 emails/day (more than enough!)</li>
                    </ul>
                </div>

                {/* SendGrid Sender Verification Notice */}
                <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                    <h3 className="font-bold text-lg mb-3">⚠️ SendGrid Setup Required</h3>
                    <p className="text-sm text-gray-700 mb-3">
                        For SendGrid to work, you need to verify your sender email address:
                    </p>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                        <li>Go to <a href="https://app.sendgrid.com/settings/sender_auth" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">SendGrid Sender Authentication</a></li>
                        <li>Click "Verify a Single Sender"</li>
                        <li>Enter your email address (same as above)</li>
                        <li>Check your inbox and click the verification link</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}
