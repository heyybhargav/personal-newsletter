'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Source {
    id: string;
    name: string;
    type: string;
    url: string;
    enabled: boolean;
}

export default function SourcesPage() {
    const [sources, setSources] = useState<Source[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newSource, setNewSource] = useState({
        name: '',
        url: '',
        type: 'youtube'
    });
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchSources();
    }, []);

    const fetchSources = async () => {
        try {
            const res = await fetch('/api/sources');
            const data = await res.json();
            setSources(data.sources || []);
        } catch (error) {
            console.error('Error fetching sources:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');

        try {
            const res = await fetch('/api/sources', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSource)
            });

            if (res.ok) {
                await fetchSources();
                setNewSource({ name: '', url: '', type: 'youtube' });
                setShowAddModal(false);
                setMessage('✅ Source added successfully!');
                setTimeout(() => setMessage(''), 3000);
            } else {
                const data = await res.json();
                setMessage(`Error: ${data.error}`);
            }
        } catch (error: any) {
            setMessage(`Error: ${error.message}`);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/sources?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                await fetchSources();
                setMessage('✅ Source deleted');
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (error: any) {
            setMessage(`Error: ${error.message}`);
        }
    };

    const handleToggle = async (source: Source) => {
        try {
            const res = await fetch('/api/sources', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: source.id, enabled: !source.enabled })
            });
            if (res.ok) {
                await fetchSources();
            }
        } catch (error) {
            console.error('Error toggling source:', error);
        }
    };

    const getSourceTypeEmoji = (type: string) => {
        switch (type) {
            case 'youtube': return '📺';
            case 'podcast': return '🎙️';
            case 'news': return '📰';
            case 'reddit': return '💬';
            default: return '🔖';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-12 px-6">
                <div className="max-w-5xl mx-auto">
                    <Link href="/" className="text-indigo-200 hover:text-white mb-4 inline-block">
                        ← Back to Dashboard
                    </Link>
                    <h1 className="text-4xl font-bold mb-2">📚 Manage Sources</h1>
                    <p className="text-indigo-100">Add and organize your content sources</p>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-5xl mx-auto px-6 py-12">
                {message && (
                    <div className={`mb-6 p-4 rounded-lg ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {message}
                    </div>
                )}

                <div className="mb-6">
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition font-semibold"
                    >
                        + Add New Source
                    </button>
                </div>

                {/* Source Examples */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 mb-8 border border-indigo-200">
                    <h3 className="font-bold mb-3">📖 Quick Guide: Finding RSS URLs</h3>
                    <div className="space-y-2 text-sm">
                        <p><strong>YouTube:</strong> <code className="bg-white px-2 py-1 rounded">https://www.youtube.com/feeds/videos.xml?channel_id=CHANNEL_ID</code></p>
                        <p><strong>Podcast:</strong> Find the RSS feed URL in your podcast app or website</p>
                        <p><strong>News:</strong> Most sites have RSS (e.g., techcrunch.com/feed/)</p>
                        <p><strong>Reddit:</strong> <code className="bg-white px-2 py-1 rounded">https://www.reddit.com/r/SUBREDDIT/.rss</code></p>
                    </div>
                </div>

                {/* Sources List */}
                <div className="bg-white rounded-xl shadow-lg p-8">
                    <h2 className="text-2xl font-bold mb-6">Your Sources ({sources.length})</h2>

                    {loading ? (
                        <p className="text-gray-500">Loading...</p>
                    ) : sources.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">📭</div>
                            <p className="text-gray-600">No sources yet. Add your first one!</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {sources.map(source => (
                                <div
                                    key={source.id}
                                    className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="text-3xl">{getSourceTypeEmoji(source.type)}</div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-lg">{source.name}</h3>
                                            <p className="text-sm text-gray-500 capitalize mb-1">{source.type}</p>
                                            <p className="text-xs text-gray-400 break-all">{source.url}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleToggle(source)}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${source.enabled
                                                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {source.enabled ? '✓ Enabled' : 'Disabled'}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(source.id)}
                                                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm font-medium"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Add Source Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8">
                        <h2 className="text-2xl font-bold mb-6">Add New Source</h2>
                        <form onSubmit={handleAdd}>
                            <div className="mb-4">
                                <label className="block text-sm font-semibold mb-2">Source Name</label>
                                <input
                                    type="text"
                                    value={newSource.name}
                                    onChange={e => setNewSource({ ...newSource, name: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="e.g., TechCrunch, MrBeast, etc."
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-semibold mb-2">Source Type</label>
                                <select
                                    value={newSource.type}
                                    onChange={e => setNewSource({ ...newSource, type: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                >
                                    <option value="youtube">📺 YouTube</option>
                                    <option value="podcast">🎙️ Podcast</option>
                                    <option value="news">📰 News</option>
                                    <option value="reddit">💬 Reddit</option>
                                    <option value="custom">🔖 Custom RSS</option>
                                </select>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-semibold mb-2">RSS Feed URL</label>
                                <input
                                    type="url"
                                    value={newSource.url}
                                    onChange={e => setNewSource({ ...newSource, url: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="https://..."
                                    required
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition font-semibold"
                                >
                                    Add Source
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition font-semibold"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
