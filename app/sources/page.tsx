'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Source {
    id: string;
    name: string;
    type: string;
    url: string;
    enabled: boolean;
    favicon?: string;
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
        type: 'youtube',
        favicon: ''
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
        // Auto-generate favicon for the new source
        let domain = '';
        try {
            // Extract domain for favicon
            const urlObj = new URL(result.url);
            domain = urlObj.hostname;
        } catch (e) {
            // Fallback for when URL is just a feed URL or invalid
            domain = 'google.com';
        }

        const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

        setNewSource({
            name: result.title,
            url: result.url,
            type: searchType,
            favicon
        });
        setSearchResults([]); // Hide results after selection
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');

        // Ensure we have a favicon if not set
        let finalSource = { ...newSource };
        if (!finalSource.favicon && finalSource.url) {
            try {
                const domain = new URL(finalSource.url).hostname;
                finalSource.favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
            } catch (e) { }
        }

        try {
            const res = await fetch('/api/sources', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(finalSource)
            });

            if (res.ok) {
                await fetchSources();
                setNewSource({ name: '', url: '', type: 'youtube', favicon: '' });
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

    return (
        <div className="min-h-screen bg-[#F9FAFB]">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 py-8 px-6">
                <div className="max-w-5xl mx-auto flex justify-between items-center">
                    <div>
                        <Link href="/" className="text-gray-500 hover:text-gray-900 mb-2 inline-block text-sm font-medium">
                            ← Back to Dashboard
                        </Link>
                        <h1 className="text-3xl font-serif font-bold text-gray-900">Manage Sources</h1>
                        <p className="text-gray-500 mt-1">Curate your daily briefing intelligence.</p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition font-medium flex items-center gap-2 shadow-sm"
                    >
                        <span>+</span> Add Source
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-5xl mx-auto px-6 py-12">
                {message && (
                    <div className={`mb-6 p-4 rounded-lg font-medium ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                        {message}
                    </div>
                )}

                {/* Sources List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center text-gray-400">Loading intelligence sources...</div>
                    ) : sources.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="text-5xl mb-4 grayscale opacity-50">📰</div>
                            <h3 className="text-xl font-medium text-gray-900">No sources configured</h3>
                            <p className="text-gray-500 mt-2 mb-6">Add news sites, YouTube channels, or podcasts to start.</p>
                            <button onClick={() => setShowAddModal(true)} className="text-indigo-600 font-medium hover:underline">Add your first source</button>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {sources.map(source => (
                                <div key={source.id} className="p-6 hover:bg-gray-50 transition flex items-center gap-6 group">
                                    {/* Icon/Favicon */}
                                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden border border-gray-200">
                                        {source.favicon ? (
                                            <img src={source.favicon} alt="" className="w-8 h-8 object-contain" />
                                        ) : (
                                            <span className="text-2xl opacity-50">
                                                {source.type === 'youtube' ? '📺' : source.type === 'podcast' ? '🎙️' : '📰'}
                                            </span>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="font-semibold text-gray-900 text-lg truncate">{source.name}</h3>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide border ${source.enabled ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'
                                                }`}>
                                                {source.enabled ? 'Active' : 'Paused'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            <span className="capitalize flex items-center gap-1">
                                                {source.type === 'youtube' && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
                                                {source.type === 'news' && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
                                                {source.type}
                                            </span>
                                            <span className="text-gray-300">•</span>
                                            <a href={source.url} target="_blank" className="hover:text-indigo-600 truncate max-w-md">
                                                {source.url}
                                            </a>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleToggle(source)}
                                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-200 hover:border-gray-300 rounded-lg shadow-sm"
                                        >
                                            {source.enabled ? 'Pause' : 'Resume'}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(source.id)}
                                            className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 bg-white border border-gray-200 hover:border-red-200 rounded-lg shadow-sm"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Add Source Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-0 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold font-serif">Add Intelligence Source</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-6">
                            {/* Type Tabs */}
                            <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-lg inline-flex">
                                {['youtube', 'podcast', 'news', 'reddit', 'custom'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setSearchType(type)}
                                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${searchType === type
                                            ? 'bg-white text-black shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        <span className="capitalize">{type}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Search */}
                            {searchType !== 'custom' && (
                                <div className="mb-8">
                                    <form onSubmit={handleSearch} className="relative">
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder={`Find a ${searchType}... (e.g. "Verge", "Huberman Lab")`}
                                            className="w-full border-2 border-gray-200 rounded-xl px-5 py-3 pr-24 focus:border-black focus:outline-none transition-colors"
                                        />
                                        <button
                                            type="submit"
                                            disabled={searching || !searchQuery.trim()}
                                            className="absolute right-2 top-2 bottom-2 bg-black text-white px-5 rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50"
                                        >
                                            {searching ? '...' : 'Search'}
                                        </button>
                                    </form>

                                    {/* Results */}
                                    {searchResults.length > 0 && (
                                        <div className="mt-4 border border-gray-100 rounded-xl max-h-64 overflow-y-auto shadow-inner bg-gray-50">
                                            {searchResults.map((result, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => selectResult(result)}
                                                    className="w-full text-left p-4 hover:bg-white border-b border-gray-100 transition flex items-center gap-4 group"
                                                >
                                                    {result.thumbnail ? (
                                                        <img src={result.thumbnail} alt="" className="w-12 h-12 rounded-md object-cover shadow-sm" />
                                                    ) : (
                                                        <div className="w-12 h-12 bg-gray-200 rounded-md"></div>
                                                    )}
                                                    <div>
                                                        <p className="font-bold text-gray-900 group-hover:text-indigo-600 transition">{result.title}</p>
                                                        <p className="text-xs text-gray-500 line-clamp-1">{result.description}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Manual Form */}
                            <form onSubmit={handleAdd} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">NAME</label>
                                    <input
                                        type="text"
                                        value={newSource.name}
                                        onChange={e => setNewSource({ ...newSource, name: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-black focus:border-transparent"
                                        placeholder="Source Name"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">FEED URL</label>
                                    <input
                                        type="url"
                                        value={newSource.url}
                                        onChange={e => setNewSource({ ...newSource, url: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-black focus:border-transparent font-mono text-sm"
                                        placeholder="https://..."
                                        required
                                    />
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <button type="submit" className="flex-1 bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 hover:scale-[1.02] transition-all transform">
                                        Add Source
                                    </button>
                                    <button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-3 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition">
                                        Cancel
                                    </button>
                                </div>
                            </form>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
