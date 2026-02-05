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

interface SearchResult {
    title: string;
    description: string;
    url: string;
    type: string;
    thumbnail?: string;
}

export default function SourcesPage() {
    const [sources, setSources] = useState<Source[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchType, setSearchType] = useState('youtube');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [searching, setSearching] = useState(false);

    const [newSource, setNewSource] = useState({
        name: '',
        url: '',
        type: 'youtube'
    });
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchSources();
    }, []);

    // Update newSource type when searchType changes
    useEffect(() => {
        setNewSource(prev => ({ ...prev, type: searchType }));
        setSearchResults([]); // Clear results on type change
    }, [searchType]);

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

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setSearching(true);
        setSearchResults([]);
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&type=${searchType}`);
            const data = await res.json();
            if (data.results) {
                setSearchResults(data.results);
            }
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setSearching(false);
        }
    };

    const selectResult = (result: SearchResult) => {
        setNewSource({
            name: result.title,
            url: result.url,
            type: searchType
        });
        setSearchResults([]); // Hide results after selection
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
                setSearchQuery('');
                setSearchResults([]);
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
                        className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition font-semibold flex items-center gap-2"
                    >
                        <span>+</span> Add New Source
                    </button>
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

            {/* Add Source Modal with Search */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50 overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-8 my-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">Add New Source</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                        </div>

                        {/* Type Selection Tabs */}
                        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                            {['youtube', 'podcast', 'news', 'reddit', 'custom'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setSearchType(type)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${searchType === type
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {type === 'youtube' && '📺 YouTube'}
                                    {type === 'podcast' && '🎙️ Podcast'}
                                    {type === 'news' && '📰 News'}
                                    {type === 'reddit' && '💬 Reddit'}
                                    {type === 'custom' && '🔖 Custom URL'}
                                </button>
                            ))}
                        </div>

                        {/* Search Bar (Only for supported types) */}
                        {searchType !== 'custom' && (
                            <div className="mb-6">
                                <form onSubmit={handleSearch} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder={`Search ${searchType}s...`}
                                        className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                    <button
                                        type="submit"
                                        disabled={searching || !searchQuery.trim()}
                                        className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                                    >
                                        {searching ? 'Searching...' : 'Search'}
                                    </button>
                                </form>

                                {/* Search Results */}
                                {searchResults.length > 0 && (
                                    <div className="mt-4 border border-gray-200 rounded-lg max-h-60 overflow-y-auto divide-y divide-gray-100">
                                        {searchResults.map((result, index) => (
                                            <button
                                                key={index}
                                                onClick={() => selectResult(result)}
                                                className="w-full text-left p-3 hover:bg-indigo-50 transition flex items-center gap-3"
                                            >
                                                {result.thumbnail && (
                                                    <img src={result.thumbnail} alt="" className="w-10 h-10 rounded object-cover" />
                                                )}
                                                <div>
                                                    <p className="font-semibold text-sm">{result.title}</p>
                                                    <p className="text-xs text-gray-500">{result.description}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Manual Entry Form */}
                        <form onSubmit={handleAdd} className="border-t border-gray-100 pt-6">
                            <div className="mb-4">
                                <label className="block text-sm font-semibold mb-2">Source Name</label>
                                <input
                                    type="text"
                                    value={newSource.name}
                                    onChange={e => setNewSource({ ...newSource, name: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="name"
                                    required
                                />
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
                                <p className="text-xs text-gray-400 mt-1">
                                    {searchType !== 'custom' ? 'Auto-filled from search, or enter manually.' : 'Enter the RSS feed URL directly.'}
                                </p>
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
