'use client';

import { useState } from 'react';

export default function SubscribePage() {
    const [email, setEmail] = useState('');
    const [step, setStep] = useState<'email' | 'topics' | 'success'>('email');
    const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    // Pre-curated premium topics
    const topics = [
        { id: 'tech', label: 'Tech & Startups', emoji: '🚀' },
        { id: 'ai', label: 'Artificial Intelligence', emoji: '🤖' },
        { id: 'finance', label: 'Business & Finance', emoji: '💰' },
        { id: 'design', label: 'Design & Creativity', emoji: '🎨' },
        { id: 'science', label: 'Science & Space', emoji: '🔭' },
        { id: 'world', label: 'World News', emoji: '🌍' },
    ];

    const handleEmailSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email) setStep('topics');
    };

    const toggleTopic = (id: string) => {
        setSelectedTopics(prev =>
            prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
        );
    };

    const handleComplete = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, topics: selectedTopics }),
            });

            if (res.ok) {
                setStep('success');
            } else {
                console.error('Subscription failed');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A] font-sans selection:bg-orange-200">
            {/* Hero Section */}
            <div className="max-w-2xl mx-auto px-6 py-20 text-center">
                <h1 className="text-5xl font-serif font-bold mb-6 tracking-tight text-[#2A2A2A]">
                    Your Daily Executive Briefing.
                </h1>
                <p className="text-xl text-gray-600 mb-10 leading-relaxed font-light">
                    Stop doom-scrolling. Get a synthesized narrative of the topics you care about,
                    delivered to your inbox every morning at 8 AM.
                </p>

                {/* Step 1: Email Input */}
                {step === 'email' && (
                    <form onSubmit={handleEmailSubmit} className="max-w-md mx-auto relative">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email address"
                            className="w-full px-6 py-4 text-lg bg-white border-2 border-gray-200 rounded-full focus:border-black focus:outline-none transition-all shadow-sm"
                            required
                        />
                        <button
                            type="submit"
                            className="absolute right-2 top-2 bottom-2 bg-black text-white px-8 rounded-full font-medium hover:bg-gray-800 transition-colors"
                        >
                            Start
                        </button>
                        <p className="text-xs text-gray-400 mt-4">
                            No password required. Free forever.
                        </p>
                    </form>
                )}

                {/* Step 2: Topic Selection */}
                {step === 'topics' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h2 className="text-2xl font-serif font-bold mb-6">Select your interests</h2>
                        <div className="grid grid-cols-2 gap-4 mb-8 text-left">
                            {topics.map((topic) => (
                                <button
                                    key={topic.id}
                                    onClick={() => toggleTopic(topic.id)}
                                    className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${selectedTopics.includes(topic.id)
                                            ? 'border-black bg-orange-50'
                                            : 'border-gray-100 bg-white hover:border-gray-300'
                                        }`}
                                >
                                    <span className="text-2xl">{topic.emoji}</span>
                                    <span className="font-medium">{topic.label}</span>
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={handleComplete}
                            disabled={loading || selectedTopics.length === 0}
                            className="w-full bg-black text-white py-4 rounded-full font-bold text-lg hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating your briefing...' : 'Finish Setup'}
                        </button>
                    </div>
                )}

                {/* Step 3: Success */}
                {step === 'success' && (
                    <div className="animate-in zoom-in duration-500 bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
                        <div className="text-6xl mb-6">🎉</div>
                        <h2 className="text-3xl font-serif font-bold mb-4">You're all set!</h2>
                        <p className="text-gray-600 mb-6 text-lg">
                            We've created your profile for <strong>{email}</strong>.
                            Your first briefing will arrive tomorrow morning.
                        </p>
                        <div className="flex justify-center gap-4">
                            {/* Note: In a real app we'd likely generate a magic link token here */}
                            <button
                                className="px-6 py-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition font-medium"
                                onClick={() => window.location.reload()} // Placeholder
                            >
                                Go to Dashboard (Dev Only)
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
