'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getSourceTypeEmoji, getSourceTypeColor, SourceType } from '@/lib/url-detector';

interface Source {
    id: string;
    name: string;
    type: SourceType;
    url: string;
    originalUrl?: string;
    enabled: boolean;
    favicon?: string;
    addedAt?: string;
}

interface DetectedSource {
    type: SourceType;
    name: string;
    feedUrl: string;
    originalUrl: string;
    favicon: string;
    confidence: 'high' | 'medium' | 'low';
}

interface SampleItem {
    title: string;
    link: string;
    pubDate?: string;
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
    const [message, setMessage] = useState('');

    // Smart Detection State
    const [inputUrl, setInputUrl] = useState('');
    const [detecting, setDetecting] = useState(false);
    const [detectedSource, setDetectedSource] = useState<DetectedSource | null>(null);
    const [sampleItems, setSampleItems] = useState<SampleItem[]>([]);
    const [detectionError, setDetectionError] = useState('');

    // Search State
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

    // Editable fields after detection
    const [editableName, setEditableName] = useState('');

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

    // Debounced URL detection
    const detectUrl = useCallback(async (url: string) => {
        setDetecting(true);
        setDetectionError('');
        setDetectedSource(null);
        setSampleItems([]);
        setSearchResults([]); // Clear search if detecting URL

        try {
            const res = await fetch(`/api/sources/detect?url=${encodeURIComponent(url)}`);
            const data = await res.json();

            if (data.error) {
                setDetectionError(data.error);
            } else if (data.detected) {
                setDetectedSource(data.detected);
                setSampleItems(data.sampleItems || []);
                setEditableName(data.detected.name);
            }
        } catch (error: any) {
            setDetectionError('Failed to detect source');
        } finally {
            setDetecting(false);
        }
    }, []);

    const searchUniversal = useCallback(async (query: string) => {
        setIsSearching(true);
        setDetectionError('');
        setSearchResults([]);
        setDetectedSource(null);

        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=all`);
            const data = await res.json();

            if (data.results && data.results.length > 0) {
                setSearchResults(data.results);
            } else {
                setDetectionError('No results found. Try a specific URL.');
            }
        } catch (error) {
            console.error(error);
            setDetectionError('Search failed');
        } finally {
            setIsSearching(false);
        }
    }, []);

    // Trigger detection or search based on input
    useEffect(() => {
        const timer = setTimeout(() => {
            const trimmed = inputUrl.trim();
            if (!trimmed) {
                setDetectedSource(null);
                setSearchResults([]);
                return;
            }

            // Prevent re-detection of the same URL if already detected/detecting
            // This allows us to set the detectedSource optimistically when clicking a search result
            if (detectedSource && (detectedSource.feedUrl === trimmed || detectedSource.originalUrl === trimmed)) {
                return;
            }

            // Simple heuristic: Does it look like a URL?
            const isUrl = trimmed.includes('.') && !trimmed.includes(' ') && (trimmed.startsWith('http') || trimmed.includes('www') || trimmed.split('.').length > 1);

            if (isUrl) {
                detectUrl(trimmed);
            } else if (trimmed.length > 2) {
                // If it's text, search
                searchUniversal(trimmed);
            }
        }, 600); // 600ms debounce

        return () => clearTimeout(timer);
    }, [inputUrl, detectUrl, searchUniversal, detectedSource]);

    const handleSelectResult = (result: SearchResult) => {
        // Optimistically set the detected source from the search result
        // This makes the UI feel instant instead of waiting for a backend roundtrip

        let type: SourceType = 'rss';
        if (result.type === 'youtube') type = 'youtube';
        else if (result.type === 'podcast') type = 'podcast';
        else if (result.type === 'reddit') type = 'reddit';
        else if (result.type === 'news') type = 'rss'; // Map news to RSS

        const optimisticSource: DetectedSource = {
            type: type,
            name: result.title,
            feedUrl: result.url,
            originalUrl: result.url,
            favicon: result.thumbnail || '',
            confidence: 'high'
        };

        setDetectedSource(optimisticSource);
        setEditableName(result.title);
        setInputUrl(result.url); // This will trigger useEffect, but our check above will prevent re-detection
        setSearchResults([]); // Clear results
        setDetectionError('');
    };

    const handleAdd = async () => {
        if (!detectedSource) return;

        try {
            const res = await fetch('/api/sources', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editableName || detectedSource.name,
                    url: detectedSource.feedUrl,
                    type: detectedSource.type,
                    favicon: detectedSource.favicon,
                    originalUrl: detectedSource.originalUrl,
                })
            });

            if (res.ok) {
                await fetchSources();
                resetModal();
                setMessage('✅ Source added successfully!');
                setTimeout(() => setMessage(''), 3000);
            } else {
                const data = await res.json();
                setDetectionError(data.error || 'Failed to add source');
            }
        } catch (error: any) {
            setDetectionError(error.message);
        }
    };

    const resetModal = () => {
        setShowAddModal(false);
        setInputUrl('');
        setDetectedSource(null);
        setSampleItems([]);
        setSearchResults([]);
        setDetectionError('');
        setEditableName('');
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this source?')) return;

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
        <div className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A] font-sans selection:bg-[#FF5700] selection:text-white">

            {/* Header */}
            <div className="max-w-3xl mx-auto px-6 pt-16 pb-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="px-3 py-1 rounded-full border border-gray-200 inline-block bg-white/50 backdrop-blur-sm mb-4">
                            <p className="text-xs font-bold tracking-widest text-[#FF5700] uppercase">Input Streams</p>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-serif font-medium tracking-tight leading-[0.9]">
                            Intelligence <span className="italic text-gray-400">Sources</span>
                        </h1>
                        <p className="text-xl text-gray-500 font-light mt-6 max-w-lg leading-relaxed font-serif">
                            Curate the signal. All configured streams are synthesized into your daily briefing.
                        </p>
                        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-[#FF5700] mt-4 transition-colors group">
                            <span className="group-hover:-translate-x-1 transition-transform">←</span>
                            Return to Control Room
                        </Link>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="group flex items-center gap-3 px-6 py-3 bg-[#1A1A1A] text-white rounded-full hover:bg-[#FF5700] transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                    >
                        <span className="font-medium">Add Source</span>
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </button>
                </div>

                <div className="h-px w-full bg-gray-200/60 mt-12"></div>
            </div>

            {/* Main Content */}
            <div className="max-w-3xl mx-auto px-6 pb-24">
                {message && (
                    <div className={`mb-8 p-4 rounded-lg text-sm border flex items-start gap-3 shadow-sm ${message.includes('Error') ? 'bg-red-50 border-red-100 text-red-800' : 'bg-green-50 border-green-100 text-green-800'}`}>
                        <div className={`mt-1.5 w-2 h-2 rounded-full ${message.includes('Error') ? 'bg-red-500' : 'bg-green-500'}`}></div>
                        <div className="flex-1 font-medium">
                            {message}
                        </div>
                    </div>
                )}

                {/* Sources List */}
                <div className="space-y-1">
                    {loading ? (
                        <div className="py-24 text-center">
                            <div className="inline-block w-8 h-8 border-2 border-gray-200 border-t-black rounded-full animate-spin mb-4"></div>
                            <p className="text-gray-400 font-serif italic">Loading intelligence streams...</p>
                        </div>
                    ) : sources.length === 0 ? (
                        <div className="text-center py-24 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                            <div className="text-4xl mb-4 opacity-30">📭</div>
                            <h3 className="text-lg font-serif font-medium text-gray-900">No sources configured</h3>
                            <p className="text-gray-500 mt-2 mb-8 font-light">Add news sites, YouTube channels, newsletters, or any RSS feed.</p>
                            <button onClick={() => setShowAddModal(true)} className="text-[#FF5700] font-bold hover:underline">Add your first source</button>
                        </div>
                    ) : (
                        <div className="relative">
                            <div className="absolute left-6 top-0 bottom-0 w-px bg-gray-200 hidden md:block"></div>
                            {sources.map(source => (
                                <div key={source.id} className="relative md:pl-12 py-6 group border-b border-gray-100 last:border-0 hover:bg-white/50 transition-colors rounded-lg">
                                    {/* Timeline Dot */}
                                    <div className={`absolute left-[21px] top-9 w-3 h-3 rounded-full border-2 border-[#FDFBF7] hidden md:block transition-colors duration-300 ${source.enabled ? 'bg-[#FF5700]' : 'bg-gray-300'}`}></div>

                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2">
                                                {source.favicon && <img src={source.favicon} className="w-4 h-4 object-contain" />}
                                                <span className={`text-xs font-bold tracking-wider uppercase px-2 py-0.5 rounded border ${getSourceTypeColor(source.type as SourceType)} bg-white`}>
                                                    {source.type}
                                                </span>
                                                {!source.enabled && (
                                                    <span className="text-xs font-mono text-gray-400 uppercase tracking-widest">PAUSED</span>
                                                )}
                                            </div>

                                            <div className="flex items-baseline gap-3">
                                                <h3 className="text-xl font-serif font-medium text-[#1A1A1A] group-hover:text-[#FF5700] transition-colors leading-tight">
                                                    <a href={source.originalUrl || source.url} target="_blank" rel="noopener noreferrer" className="hover:underline decoration-1 underline-offset-4">
                                                        {source.name}
                                                    </a>
                                                </h3>
                                            </div>

                                            <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 font-mono">
                                                <span className="truncate max-w-[300px] opacity-60 hover:opacity-100 transition-opacity">
                                                    {source.url.replace(/^https?:\/\//, '').replace(/^www\./, '')}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 mobile-actions-visible">
                                            <button
                                                onClick={() => handleToggle(source)}
                                                className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-black transition py-2"
                                            >
                                                {source.enabled ? 'Pause' : 'Resume'}
                                            </button>
                                            <div className="w-px h-3 bg-gray-300"></div>
                                            <button
                                                onClick={() => handleDelete(source.id)}
                                                className="text-xs font-bold uppercase tracking-widest text-red-300 hover:text-red-600 transition py-2"
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

            {/* Add Source Modal - Final Refined Design */}
            {showAddModal && (
                <div className="fixed inset-0 bg-[#FDFBF7]/95 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white w-full max-w-2xl h-[650px] flex flex-col shadow-2xl shadow-black/10 ring-1 ring-black/5 rounded-2xl animate-in fade-in zoom-in-95 duration-200">
                        {/* Fixed Top Section: Header + Large Input */}
                        <div className="flex-none bg-white p-8 pb-0 z-20 rounded-t-2xl">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-3xl font-serif font-medium text-[#1A1A1A]">New Source</h2>
                                </div>
                                <button onClick={resetModal} className="text-gray-400 hover:text-black transition p-2 -mr-2 bg-gray-50 hover:bg-gray-100 rounded-full">
                                    <span className="sr-only">Close</span>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            {/* Large Editorial Input (Fixed) */}
                            <div className="relative group pb-4 border-b border-gray-100">
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </div>
                                <input
                                    type="text"
                                    value={inputUrl}
                                    onChange={(e) => setInputUrl(e.target.value)}
                                    placeholder="Paste URL or search..."
                                    className="w-full pl-10 text-2xl font-serif bg-transparent border-none placeholder:text-gray-300 focus:ring-0 focus:outline-none transition-colors p-0"
                                    autoFocus
                                />
                                {detecting && (
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2">
                                        <div className="w-5 h-5 border-2 border-gray-200 border-t-[#FF5700] rounded-full animate-spin"></div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Scrollable Results Area */}
                        <div className="flex-1 overflow-y-auto px-8 py-6">
                            {/* Intro Text / Helper (only when empty) */}
                            {!inputUrl && !detectedSource && (
                                <div className="h-full flex flex-col items-center justify-center opacity-60 pb-10">
                                    <p className="font-serif italic text-gray-400 text-lg text-center max-w-sm leading-relaxed">
                                        Search for YouTube channels, subreddits, podcasts, or paste any RSS link.
                                    </p>
                                </div>
                            )}

                            {/* Detection Error */}
                            {detectionError && (
                                <div className="mb-6 p-4 bg-red-50 border-l-2 border-red-500 text-red-700 text-sm font-medium rounded-r-lg">
                                    {detectionError}
                                </div>
                            )}

                            {/* Search Results List - Editorial Style */}
                            {searchResults.length > 0 && !detectedSource && (
                                <div className="animate-in slide-in-from-bottom-2">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 sticky top-0 bg-white/95 py-2 backdrop-blur-sm z-10 w-full">
                                        Found {searchResults.length} sources
                                    </h3>
                                    <div className="space-y-3 pb-4">
                                        {searchResults.map((result, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleSelectResult(result)}
                                                className="w-full flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all text-left group bg-white"
                                            >
                                                <div className="w-12 h-12 bg-gray-50 flex-none flex items-center justify-center text-xl grayscale group-hover:grayscale-0 transition-all rounded-lg overflow-hidden border border-gray-100">
                                                    {result.thumbnail ? <img src={result.thumbnail} className="w-full h-full object-cover" /> : getSourceTypeEmoji(result.type as SourceType)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-serif text-lg font-medium text-gray-900 group-hover:text-[#FF5700] transition-colors truncate">
                                                        {result.title}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-gray-500 font-mono mt-0.5">
                                                        <span className={`uppercase tracking-wider ${getSourceTypeColor(result.type as SourceType)}`}>{result.type}</span>
                                                        <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                                        <span className="truncate max-w-[200px]">{result.description}</span>
                                                    </div>
                                                </div>
                                                <div className="text-gray-300 group-hover:text-[#FF5700] transition-colors transform group-hover:translate-x-1 flex-none">
                                                    →
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Detected Source Preview */}
                            {detectedSource && (
                                <div className="animate-in slide-in-from-bottom-4">
                                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                        <div className="flex items-start gap-6">
                                            <div className="w-16 h-16 bg-white border border-gray-100 flex-none flex items-center justify-center text-3xl shadow-sm rounded-lg overflow-hidden">
                                                {detectedSource.favicon ? (
                                                    <img src={detectedSource.favicon} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    getSourceTypeEmoji(detectedSource.type)
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${getSourceTypeColor(detectedSource.type)} bg-white`}>
                                                        {detectedSource.type}
                                                    </span>
                                                    <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                                        Ready to add
                                                    </span>
                                                </div>
                                                <input
                                                    type="text"
                                                    value={editableName}
                                                    onChange={(e) => setEditableName(e.target.value)}
                                                    className="w-full text-2xl font-serif font-bold bg-transparent border-b border-transparent hover:border-gray-200 focus:border-black focus:outline-none transition-colors p-0 truncate"
                                                />
                                                <p className="text-sm text-gray-400 mt-1 font-mono truncate">{detectedSource.feedUrl}</p>

                                                {/* Preview Items */}
                                                {sampleItems.length > 0 && (
                                                    <ul className="mt-4 space-y-2 border-l-2 border-gray-100 pl-4">
                                                        {sampleItems.slice(0, 3).map((item, i) => (
                                                            <li key={i} className="text-sm text-gray-500 font-serif italic line-clamp-1">
                                                                "{item.title}"
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Fixed Actions Bottom Bar */}
                        <div className="p-6 border-t border-gray-100 bg-white flex-none flex justify-end gap-3 z-20 rounded-b-2xl">
                            <button
                                onClick={resetModal}
                                className="px-6 py-2.5 text-gray-500 font-medium hover:text-black hover:bg-gray-50 rounded-full transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAdd}
                                disabled={!detectedSource || detecting}
                                className="bg-[#1A1A1A] text-white px-8 py-2.5 rounded-full font-medium hover:bg-[#FF5700] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform duration-200 flex items-center gap-2"
                            >
                                {detecting ? 'Detecting...' : detectedSource ? 'Confirm Source' : 'Add Source'}
                                {!detecting && detectedSource && <span>↵</span>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .mobile-actions-visible {
                   opacity: 1; 
                }
                @media (min-width: 640px) {
                   .mobile-actions-visible {
                       opacity: 0;
                   }
                   .group:hover .mobile-actions-visible {
                       opacity: 1;
                   }
                }
            `}</style>
        </div>
    );
}
