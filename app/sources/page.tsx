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
        if (!url.trim() || url.length < 10) {
            setDetectedSource(null);
            setSampleItems([]);
            return;
        }

        setDetecting(true);
        setDetectionError('');
        setDetectedSource(null);
        setSampleItems([]);

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
        } catch (error: unknown) {
            setDetectionError('Failed to detect source');
        } finally {
            setDetecting(false);
        }
    }, []);

    // Trigger detection on URL input
    useEffect(() => {
        const timer = setTimeout(() => {
            if (inputUrl.trim()) {
                detectUrl(inputUrl);
            }
        }, 500); // Debounce 500ms

        return () => clearTimeout(timer);
    }, [inputUrl, detectUrl]);

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
        } catch (error: unknown) {
            const err = error as Error;
            setDetectionError(err.message);
        }
    };

    const resetModal = () => {
        setShowAddModal(false);
        setInputUrl('');
        setDetectedSource(null);
        setSampleItems([]);
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
        } catch (error: unknown) {
            const err = error as Error;
            setMessage(`Error: ${err.message}`);
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
                        <h1 className="text-3xl font-serif font-bold text-gray-900">Intelligence Sources</h1>
                        <p className="text-gray-500 mt-1">Curate your daily briefing. Paste any URL — we&apos;ll handle the rest.</p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition font-medium flex items-center gap-2 shadow-sm"
                    >
                        <span className="text-lg">+</span> Add Source
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
                            <p className="text-gray-500 mt-2 mb-6">Add news sites, YouTube channels, newsletters, or any RSS feed.</p>
                            <button onClick={() => setShowAddModal(true)} className="text-indigo-600 font-medium hover:underline">Add your first source</button>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {sources.map(source => (
                                <div key={source.id} className="p-5 hover:bg-gray-50 transition flex items-center gap-5">
                                    {/* Icon/Favicon */}
                                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden border border-gray-200 shadow-sm">
                                        {source.favicon ? (
                                            <img src={source.favicon} alt="" className="w-7 h-7 object-contain" onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }} />
                                        ) : (
                                            <span className="text-xl">{getSourceTypeEmoji(source.type as SourceType)}</span>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <a
                                                href={source.originalUrl || source.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-semibold text-gray-900 text-lg truncate hover:text-indigo-600 transition"
                                            >
                                                {source.name}
                                            </a>
                                            <a
                                                href={source.originalUrl || source.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-gray-400 hover:text-indigo-600 transition"
                                                title="Visit original source"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                            </a>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize border ${getSourceTypeColor(source.type as SourceType)}`}>
                                                {getSourceTypeEmoji(source.type as SourceType)} {source.type}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${source.enabled ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                                {source.enabled ? '● Active' : '○ Paused'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions - Always Visible */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleToggle(source)}
                                            className={`px-4 py-2 text-sm font-medium rounded-lg border transition ${source.enabled
                                                ? 'text-gray-600 border-gray-200 hover:bg-gray-100'
                                                : 'text-green-600 border-green-200 hover:bg-green-50'
                                                }`}
                                        >
                                            {source.enabled ? 'Pause' : 'Resume'}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(source.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                            title="Delete source"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Add Source Modal - Smart Detection */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <div>
                                <h2 className="text-xl font-bold font-serif">Add Intelligence Source</h2>
                                <p className="text-sm text-gray-500 mt-1">Paste any URL — YouTube, Reddit, Substack, RSS, or website</p>
                            </div>
                            <button onClick={resetModal} className="text-gray-400 hover:text-gray-600 p-1">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-6">
                            {/* Smart URL Input */}
                            <div className="mb-6">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                    Source URL
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={inputUrl}
                                        onChange={(e) => setInputUrl(e.target.value)}
                                        placeholder="https://youtube.com/@mkbhd, reddit.com/r/tech, any RSS..."
                                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 pr-12 focus:border-black focus:outline-none transition-colors font-mono text-sm"
                                        autoFocus
                                    />
                                    {detecting && (
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                            <div className="w-5 h-5 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-gray-400 mt-2">
                                    Supported: YouTube, Reddit, Substack, Medium, Hacker News, GitHub, Twitter/X, Podcasts, RSS
                                </p>
                            </div>

                            {/* Detection Error */}
                            {detectionError && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
                                    {detectionError}
                                </div>
                            )}

                            {/* Detected Source Preview */}
                            {detectedSource && (
                                <div className="mb-6 border-2 border-green-200 bg-green-50/50 rounded-xl p-5 animate-in slide-in-from-bottom-2">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-14 h-14 rounded-lg bg-white flex items-center justify-center border border-gray-200 shadow-sm flex-shrink-0">
                                            {detectedSource.favicon ? (
                                                <img src={detectedSource.favicon} alt="" className="w-8 h-8 object-contain" />
                                            ) : (
                                                <span className="text-2xl">{getSourceTypeEmoji(detectedSource.type)}</span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase border ${getSourceTypeColor(detectedSource.type)}`}>
                                                    {detectedSource.type}
                                                </span>
                                                {detectedSource.confidence === 'high' && (
                                                    <span className="text-green-600 text-xs">✓ Verified</span>
                                                )}
                                            </div>
                                            <input
                                                type="text"
                                                value={editableName}
                                                onChange={(e) => setEditableName(e.target.value)}
                                                className="w-full text-lg font-bold bg-transparent border-b border-transparent hover:border-gray-300 focus:border-black focus:outline-none transition py-1"
                                            />
                                        </div>
                                    </div>

                                    {/* Sample Content Preview */}
                                    {sampleItems.length > 0 && (
                                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                            <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                                                <span className="text-xs font-bold text-gray-500 uppercase">Latest Content</span>
                                            </div>
                                            <ul className="divide-y divide-gray-100">
                                                {sampleItems.map((item, i) => (
                                                    <li key={i} className="px-3 py-2">
                                                        <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-800 hover:text-indigo-600 line-clamp-1">
                                                            {item.title}
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {sampleItems.length === 0 && !detecting && (
                                        <p className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                                            ⚠️ Couldn&apos;t preview content. The source may still work when added.
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={handleAdd}
                                    disabled={!detectedSource || detecting}
                                    className="flex-1 bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    {detectedSource ? `Add ${detectedSource.type} Source` : 'Detecting...'}
                                </button>
                                <button
                                    onClick={resetModal}
                                    className="px-6 py-3 bg-gray-100 rounded-xl font-medium hover:bg-gray-200 transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
