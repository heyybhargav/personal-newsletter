'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
    Youtube, Mic, Newspaper, MessageSquare, Mail, FileText, Hash, Github, Twitter, Rss, Bookmark,
    Inbox, CheckCircle, AlertTriangle, ArrowRight, X, Loader2, Plus, Sparkles, TrendingUp,
    Zap, Globe, Atom, Palette, Bot, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useSWR, { mutate } from 'swr';
import { getSourceTypeColor, SourceType } from '@/lib/url-detector';
import { StarterPack, RecommendedSource, getStarterPacks } from '@/lib/recommendations';
import { PackIcon } from '@/components/PackIcon';

const fetcher = (url: string) => fetch(url).then(res => res.json());

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

import { SourceIcon } from '@/components/SourceIcon';
import { Toast } from '@/components/Toast';



export default function SourcesPage() {
    const { data, error, isLoading } = useSWR('/api/sources', fetcher);
    const sources: Source[] = data?.sources || [];
    const loading = isLoading;

    // Subscription State
    const [tier, setTier] = useState<string>('active');
    const [trialDaysRemaining, setTrialDaysRemaining] = useState<number>(0);

    useEffect(() => {
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                if (data.tier) {
                    setTier(data.tier);
                    setTrialDaysRemaining(data.trialDaysRemaining || 0);
                }
            })
            .catch(err => console.error('Error fetching settings:', err));
    }, []);

    const [showAddModal, setShowAddModal] = useState(false);

    // Toast State
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; description?: string } | null>(null);
    const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);

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

    // Recommendations State
    const [starterPacks, setStarterPacks] = useState<StarterPack[]>(getStarterPacks());
    const [recommendations, setRecommendations] = useState<StarterPack[] | RecommendedSource[]>([]);
    const [recMode, setRecMode] = useState<'starter' | 'contextual'>('starter');
    const [loadingRecs, setLoadingRecs] = useState(true);
    const [addingRec, setAddingRec] = useState<string | null>(null); // ID being added
    const [resolvedFavicons, setResolvedFavicons] = useState<Record<string, string>>({});

    useEffect(() => {
        fetchRecommendations();

        // Fetch dynamic starter packs
        fetch('/api/starter-packs')
            .then(res => res.json())
            .then(data => {
                if (data.packs && data.packs.length > 0) {
                    setStarterPacks(data.packs);
                }
            })
            .catch(err => console.error('Failed to update starter packs:', err));
    }, []);

    // Resolve high-quality favicons for starter pack sources
    useEffect(() => {
        if (starterPacks.length === 0) return;
        const allUrls = starterPacks.flatMap(p => p.sources.map(s => s.url));
        const uniqueUrls = [...new Set(allUrls)];
        // Skip if already resolved
        const unresolvedUrls = uniqueUrls.filter(u => !resolvedFavicons[u]);
        if (unresolvedUrls.length === 0) return;

        fetch('/api/sources/resolve-favicon', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ urls: unresolvedUrls })
        })
            .then(res => res.json())
            .then(data => {
                if (data.favicons) {
                    setResolvedFavicons(prev => ({ ...prev, ...data.favicons }));
                }
            })
            .catch(err => console.error('Failed to resolve favicons:', err));
    }, [starterPacks]);

    // Progressively resolve favicons for existing sources with generic icons
    useEffect(() => {
        if (sources.length === 0) return;
        const genericPatterns = ['favicon.ico', 'favicons?domain=youtube.com', 'favicons?domain=reddit.com'];
        const needsResolution = sources.filter(s =>
            !s.favicon || genericPatterns.some(p => s.favicon?.includes(p))
        );
        if (needsResolution.length === 0) return;
        const urlsToResolve = needsResolution.map(s => s.url).filter(u => !resolvedFavicons[u]);
        if (urlsToResolve.length === 0) return;

        fetch('/api/sources/resolve-favicon', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ urls: urlsToResolve })
        })
            .then(res => res.json())
            .then(data => {
                if (data.favicons) {
                    setResolvedFavicons(prev => ({ ...prev, ...data.favicons }));
                    // Persist resolved favicons to DB so they're not re-fetched next time
                    let shouldMutate = false;
                    for (const source of needsResolution) {
                        const newFavicon = data.favicons[source.url];
                        if (newFavicon && newFavicon !== source.favicon && !genericPatterns.some(p => newFavicon.includes(p))) {
                            shouldMutate = true;
                            fetch('/api/sources', {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ id: source.id, favicon: newFavicon })
                            }).catch(() => { });
                        }
                    }
                    if (shouldMutate) mutate('/api/sources');
                }
            })
            .catch(err => console.error('Failed to resolve source favicons:', err));
    }, [sources]);

    // Handle Escape key to close modal
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && showAddModal) {
                setShowAddModal(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showAddModal]);

    const fetchRecommendations = async () => {
        setLoadingRecs(true);
        try {
            const res = await fetch('/api/recommendations');
            const data = await res.json();
            setRecMode(data.mode || 'starter');
            setRecommendations(data.data || []);
        } catch (error) {
            console.error('Error fetching recommendations:', error);
        } finally {
            setLoadingRecs(false);
        }
    };

    const handleAddPack = async (pack: StarterPack) => {
        setAddingRec(pack.id);

        let successCount = 0;

        for (const source of pack.sources) {
            try {
                const res = await fetch('/api/sources', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: source.name,
                        url: source.url,
                        type: source.type,
                        favicon: resolvedFavicons[source.url] || resolvedFavicons[source.originalUrl || source.url] || source.favicon || '',
                        originalUrl: source.originalUrl,
                    })
                });
                const data = await res.json();
                if (res.ok && data.source) {
                    successCount++;
                }
            } catch (e) {
                console.error('Failed to add source from pack', source.name);
            }
        }

        setAddingRec(null);
        if (successCount > 0) {
            setToast({ message: `Added ${successCount} sources`, description: `From ${pack.name}`, type: 'success' });
            mutate('/api/sources');
            fetchRecommendations();
        } else {
            setToast({ message: 'All sources already added', description: `From ${pack.name}`, type: 'success' });
        }
    };

    const handleAddRecommendation = async (rec: RecommendedSource) => {
        setAddingRec(rec.id);
        try {
            const res = await fetch('/api/sources', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: rec.name,
                    url: rec.url,
                    type: rec.type,
                    favicon: resolvedFavicons[rec.url] || resolvedFavicons[rec.originalUrl] || rec.favicon,
                    originalUrl: rec.originalUrl,
                })
            });

            if (res.ok) {
                setToast({ message: `Added ${rec.name}`, type: 'success' });
                // Remove from local list to avoid duplicates immediately
                setRecommendations(prev => (prev as RecommendedSource[]).filter(r => r.id !== rec.id));
                mutate('/api/sources');
            }
        } catch (error) {
            console.error('Error adding recommendation:', error);
        } finally {
            setAddingRec(null);
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
        else if (result.type === 'twitter') type = 'twitter';
        else if (result.type === 'instagram') type = 'instagram';
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
                const data = await res.json();

                // Trigger success highlight micro-interaction
                if (data.source?.id) {
                    setRecentlyAddedId(data.source.id);
                    setTimeout(() => setRecentlyAddedId(null), 3000);
                }

                mutate('/api/sources');
                resetModal();
                setToast({ message: 'Source added', type: 'success' });
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
                mutate('/api/sources');
                setToast({ message: 'Source deleted', type: 'success' });
                // Always re-fetch recommendations after delete
                // The API will return the correct mode based on remaining sources
                fetchRecommendations();
            }
        } catch (error: any) {
            setToast({ message: 'Error deleting source', description: error.message, type: 'error' });
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
                mutate('/api/sources');
            }
        } catch (error) {
            console.error('Error toggling source:', error);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A] font-sans selection:bg-[#FF5700] selection:text-white">

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-8 sm:pb-12"
            >
                <Link href="/" className="text-gray-400 hover:text-black mb-6 flex items-center gap-2 text-sm font-medium transition-colors">
                    <span>←</span> Return to Home
                </Link>
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6">
                    <motion.div>
                        <h1 className="text-3xl sm:text-4xl md:text-6xl font-serif font-medium tracking-tight leading-[0.9]">
                            Sources
                        </h1>
                        <p className="text-base sm:text-xl text-gray-500 font-light mt-4 sm:mt-6 max-w-lg leading-relaxed font-serif">
                            Curate the signal. All configured streams are synthesized into your daily briefing.
                        </p>
                    </motion.div>
                    <motion.button
                        onClick={() => setShowAddModal(true)}
                        className="group flex items-center justify-center gap-3 w-full sm:w-auto px-6 py-3 bg-[#1A1A1A] text-white rounded-full hover:bg-[#FF5700] transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                        <span className="font-medium">Add Source</span>
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </motion.button>
                </div>

                <div className="h-px w-full bg-gray-200/60 mt-8 sm:mt-12"></div>
            </motion.div>

            {/* Main Content */}
            <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-24">
                {/* Toast Notification */}
                {toast && (
                    <Toast
                        message={toast.message}
                        description={toast.description}
                        type={toast.type}
                        onClose={() => setToast(null)}
                    />
                )}

                {/* Sources List */}
                <div className="space-y-1">
                    {loading ? (
                        <div className="py-24 text-center">
                            <div className="inline-block w-8 h-8 border-2 border-gray-200 border-t-black rounded-full animate-spin mb-4"></div>
                            <p className="text-gray-400 font-serif italic">Loading intelligence streams...</p>
                        </div>
                    ) : sources.length === 0 ? (
                        <div className="py-12">
                            <div className="text-center mb-12">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-50 mb-4">
                                    <Sparkles className="w-6 h-6 text-[#FF5700]" />
                                </div>
                                <h3 className="text-2xl font-serif font-medium text-[#1A1A1A]">Choose Your Intelligence Diet</h3>
                                <p className="text-gray-500 mt-2 max-w-md mx-auto">
                                    Don&apos;t know where to start? Pick a curated path to instantly populate your briefing with high-signal streams.
                                </p>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                {starterPacks.map((pack) => {
                                    const isAdding = addingRec === pack.id;
                                    return (
                                        <button
                                            key={pack.id}
                                            onClick={() => handleAddPack(pack)}
                                            disabled={isAdding}
                                            className="group relative p-6 bg-white border border-gray-100 rounded-xl hover:border-[#FF5700] hover:shadow-lg transition-all text-left flex flex-col h-full"
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-[#FF5700] mb-2">
                                                    <PackIcon icon={pack.icon} className="w-6 h-6" />
                                                </div>
                                                {isAdding ? (
                                                    <div className="w-5 h-5 border-2 border-gray-200 border-t-[#FF5700] rounded-full animate-spin"></div>
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-[#FF5700] group-hover:text-white transition-colors">
                                                        <Plus className="w-4 h-4" />
                                                    </div>
                                                )}
                                            </div>
                                            <h4 className="font-serif text-lg font-bold text-gray-900 group-hover:text-[#FF5700] transition-colors">{pack.name}</h4>
                                            <p className="text-sm text-gray-500 mt-2 leading-relaxed mb-6 flex-1">
                                                {pack.description}
                                            </p>
                                            <div className="flex -space-x-2 overflow-hidden">
                                                {pack.sources?.slice(0, 4).map((s, i) => {
                                                    const faviconUrl = resolvedFavicons[s.url] || resolvedFavicons[s.originalUrl || s.url] || s.favicon;
                                                    return (
                                                        <div key={i} className="w-6 h-6 rounded-full border border-white bg-gray-100 flex items-center justify-center text-[10px] uppercase font-bold text-gray-500 overflow-hidden" title={s.name}>
                                                            {faviconUrl ? <img src={faviconUrl} className="w-full h-full object-cover rounded-full" alt={s.name} /> : s.name[0]}
                                                        </div>
                                                    );
                                                })}
                                                {(pack.sources?.length || 0) > 4 && (
                                                    <div className="w-6 h-6 rounded-full border border-white bg-gray-50 flex items-center justify-center text-[8px] font-bold text-gray-400">
                                                        +{(pack.sources?.length || 0) - 4}
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="mt-12 text-center">
                                <p className="text-sm text-gray-400 mb-4">or build your own from scratch</p>
                                <button onClick={() => setShowAddModal(true)} className="text-[#FF5700] font-bold hover:underline">Add a custom source</button>
                            </div>
                        </div>
                    ) : (
                        <div className="relative">
                            <div className="absolute left-[23.5px] top-0 bottom-0 w-px bg-gray-200 hidden md:block"></div>
                            <AnimatePresence initial={false}>
                                {sources.map(source => (
                                    <motion.div
                                        key={source.id}
                                        initial={{ opacity: 0, height: 0, y: -10 }}
                                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                                        exit={{ opacity: 0, height: 0, y: -10, transition: { duration: 0.2 } }}
                                        transition={{ duration: 0.3 }}
                                        className={`relative md:pl-12 py-4 sm:py-6 group border-b border-gray-100 last:border-0 hover:bg-white/50 transition-colors duration-1000 rounded-lg overflow-hidden ${recentlyAddedId === source.id ? 'bg-orange-50/80 ring-1 ring-[#FF5700]/30 shadow-inner' : ''}`}
                                    >
                                        {/* Timeline Dot */}
                                        <div className={`absolute left-[18px] top-[30px] w-3 h-3 rounded-full border-2 border-[#FDFBF7] hidden md:block transition-all duration-700 ${recentlyAddedId === source.id ? 'bg-[#FF5700] scale-125 shadow-[0_0_10px_rgba(255,87,0,0.5)]' : source.enabled ? 'bg-[#FF5700]' : 'bg-gray-300'}`}></div>

                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 sm:gap-3 mb-1.5">
                                                    {(resolvedFavicons[source.url] || source.favicon) && <img src={resolvedFavicons[source.url] || source.favicon} className="w-4 h-4 object-contain flex-none" alt={source.name} />}
                                                    <span className={`text-[10px] sm:text-xs font-bold tracking-wider uppercase px-1.5 sm:px-2 py-0.5 rounded border flex-none ${getSourceTypeColor(source.type as SourceType)} bg-white`}>
                                                        {source.type === 'twitter' ? 'X' : source.type}
                                                    </span>
                                                    {!source.enabled && (
                                                        <span className="text-[10px] sm:text-xs font-mono text-gray-400 uppercase tracking-widest">PAUSED</span>
                                                    )}
                                                </div>

                                                <h3 className="text-lg sm:text-xl font-serif font-medium text-[#1A1A1A] group-hover:text-[#FF5700] transition-colors leading-tight">
                                                    <a href={source.originalUrl || source.url} target="_blank" rel="noopener noreferrer" className="hover:underline decoration-1 underline-offset-4">
                                                        {source.name}
                                                    </a>
                                                </h3>

                                                <div className="flex items-center gap-2 mt-1 sm:mt-2 text-xs sm:text-sm text-gray-400 font-mono">
                                                    <span className="truncate opacity-60">
                                                        {source.url.replace(/^https?:\/\//, '').replace(/^www\./, '')}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Actions: always visible on mobile, hover on desktop */}
                                            <div className="flex items-center gap-3 sm:gap-4 flex-none sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 pt-1">
                                                <button
                                                    onClick={() => handleToggle(source)}
                                                    className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-black transition py-2"
                                                >
                                                    {source.enabled ? 'Pause' : 'Resume'}
                                                </button>
                                                <div className="w-px h-3 bg-gray-200"></div>
                                                <button
                                                    onClick={() => handleDelete(source.id)}
                                                    className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-red-300 hover:text-red-600 transition py-2"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                {/* Populated State: Discovery Section */}
                {!loading && sources.length > 0 && recMode === 'contextual' && recommendations.length > 0 && (
                    <div className="mt-16 pt-12 border-t border-gray-200/60">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-[#FF5700]" />
                                <h3 className="text-sm font-bold tracking-widest text-gray-900 uppercase">Trending in your network</h3>
                            </div>
                            <button
                                onClick={() => fetchRecommendations()}
                                disabled={loadingRecs}
                                className="flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase text-gray-400 hover:text-[#FF5700] transition-colors py-1 px-2 rounded-md hover:bg-orange-50"
                                title="Show different recommendations"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${loadingRecs ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                        </div>

                        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                            {recommendations.map((item) => {
                                const rec = item as RecommendedSource;
                                const isAdding = addingRec === rec.id;
                                return (
                                    <button
                                        key={rec.id}
                                        onClick={() => handleAddRecommendation(rec)}
                                        disabled={isAdding}
                                        className="flex items-start gap-4 p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md hover:border-gray-200 transition-all text-left group"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 flex-none flex items-center justify-center overflow-hidden">
                                            {rec.favicon ? <img src={rec.favicon} className="w-full h-full object-cover" /> : <SourceIcon type={rec.type} className="w-5 h-5" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-serif font-bold text-gray-900 group-hover:text-[#FF5700] transition-colors truncate">{rec.name}</h4>
                                            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{rec.description || 'Recommended for you'}</p>
                                        </div>
                                        <div className="text-gray-300 group-hover:text-[#FF5700] transition-colors">
                                            {isAdding ? <Loader2 className="w-4 h-4 animate-spin text-[#FF5700]" /> : <Plus className="w-4 h-4" />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Starter Packs - compact view when user already has sources */}
                {!loading && sources.length > 0 && (
                    <div className="mt-12 pt-8 border-t border-gray-200/60">
                        <div className="flex items-center gap-2 mb-6">
                            <Sparkles className="w-4 h-4 text-[#FF5700]" />
                            <h3 className="text-sm font-bold tracking-widest text-gray-900 uppercase">Starter Packs</h3>
                            <span className="text-xs text-gray-400 ml-1">Add a curated bundle</span>
                        </div>
                        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {starterPacks.map((pack) => {
                                const isAdding = addingRec === pack.id;
                                return (
                                    <button
                                        key={pack.id}
                                        onClick={() => handleAddPack(pack)}
                                        disabled={isAdding}
                                        className="group flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-lg hover:border-[#FF5700] hover:shadow-sm transition-all text-left"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-[#FF5700] flex-none">
                                            <PackIcon icon={pack.icon} className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-bold text-gray-900 group-hover:text-[#FF5700] transition-colors truncate">{pack.name}</h4>
                                            <p className="text-[11px] text-gray-400 truncate">{pack.sources?.length || 0} sources</p>
                                        </div>
                                        {isAdding ? (
                                            <div className="w-4 h-4 border-2 border-gray-200 border-t-[#FF5700] rounded-full animate-spin flex-none"></div>
                                        ) : (
                                            <Plus className="w-4 h-4 text-gray-300 group-hover:text-[#FF5700] transition-colors flex-none" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Add Source Modal - Final Refined Design */}
            <AnimatePresence>
                {
                    showAddModal && (
                        <div className="fixed inset-0 bg-[#FDFBF7]/95 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 z-50">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                transition={{ duration: 0.15 }}
                                className="bg-white w-full sm:max-w-2xl h-[85vh] sm:h-[650px] flex flex-col shadow-2xl shadow-black/10 ring-1 ring-black/5 rounded-t-2xl sm:rounded-2xl duration-200"
                            >
                                {/* Fixed Top Section: Header + Large Input */}
                                <div className="flex-none bg-white p-5 sm:p-8 pb-0 z-20 rounded-t-2xl">
                                    <div className="flex justify-between items-start mb-4 sm:mb-6">
                                        <div>
                                            <h2 className="text-2xl sm:text-3xl font-serif font-medium text-[#1A1A1A]">New Source</h2>
                                        </div>
                                        <button onClick={resetModal} className="text-gray-400 hover:text-black transition p-2 -mr-2 bg-gray-50 hover:bg-gray-100 rounded-full">
                                            <span className="sr-only">Close</span>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>

                                    {/* Large Editorial Input (Fixed) */}
                                    <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                                        <div className="text-gray-400 flex-none">
                                            <svg className="w-5 sm:w-6 h-5 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                        </div>
                                        <div className="relative flex-1">
                                            <input
                                                type="text"
                                                value={inputUrl}
                                                onChange={(e) => setInputUrl(e.target.value)}
                                                placeholder="Paste URL or search..."
                                                className="w-full bg-transparent border-none text-xl sm:text-2xl font-serif text-[#1A1A1A] placeholder:text-gray-300 focus:outline-none focus:ring-0 px-0 pr-8"
                                                autoFocus
                                                spellCheck={false}
                                            />
                                            {detecting && (
                                                <div className="absolute right-0 top-1/2 -translate-y-1/2">
                                                    <div className="w-5 h-5 border-2 border-gray-200 border-t-[#FF5700] rounded-full animate-spin"></div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Scrollable Results Area */}
                                <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-4 sm:py-6">
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
                                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
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
                                                            {result.thumbnail ? <img src={result.thumbnail} className="w-full h-full object-cover" /> : <SourceIcon type={result.type} className="w-6 h-6" />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-serif text-lg font-medium text-gray-900 group-hover:text-[#FF5700] transition-colors truncate">
                                                                {result.title}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-xs text-gray-500 font-mono mt-0.5">
                                                                <span className={`uppercase tracking-wider ${getSourceTypeColor(result.type as SourceType)}`}>{result.type === 'twitter' ? 'X' : result.type}</span>
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
                                            <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
                                                <div className="flex items-start gap-4 sm:gap-6">
                                                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white border border-gray-100 flex-none flex items-center justify-center text-2xl sm:text-3xl shadow-sm rounded-lg overflow-hidden">
                                                        {detectedSource.favicon ? (
                                                            <img src={detectedSource.favicon} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <SourceIcon type={detectedSource.type} className="w-8 h-8" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 sm:gap-3 mb-2">
                                                            <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${getSourceTypeColor(detectedSource.type)} bg-white`}>
                                                                {detectedSource.type === 'twitter' ? 'X' : detectedSource.type}
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
                                                            className="w-full text-xl sm:text-2xl font-serif font-bold bg-transparent border-b border-transparent hover:border-gray-200 focus:border-black focus:outline-none transition-colors p-0 truncate"
                                                        />
                                                        <p className="text-xs sm:text-sm text-gray-400 mt-1 font-mono truncate">{detectedSource.feedUrl}</p>

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
                                <div className="p-4 sm:p-6 border-t border-gray-100 bg-white flex-none flex justify-end gap-3 z-20 rounded-b-2xl">
                                    <button
                                        onClick={resetModal}
                                        className="px-5 sm:px-6 py-2.5 text-gray-500 font-medium hover:text-black hover:bg-gray-50 rounded-full transition-colors text-sm sm:text-base"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAdd}
                                        disabled={!detectedSource || detecting}
                                        className="bg-[#1A1A1A] text-white px-6 sm:px-8 py-2.5 rounded-full font-medium hover:bg-[#FF5700] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl duration-200 flex items-center gap-2 text-sm sm:text-base"
                                    >
                                        {detecting ? 'Detecting...' : detectedSource ? 'Confirm Source' : 'Add Source'}
                                        {!detecting && detectedSource && <span>↵</span>}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
            </AnimatePresence>
        </div>
    );
}
