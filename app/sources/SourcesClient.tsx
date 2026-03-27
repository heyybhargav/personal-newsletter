'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
    Youtube, Mic, Newspaper, MessageSquare, Mail, FileText, Hash, Github, Twitter, Rss, Bookmark,
    Inbox, CheckCircle, AlertTriangle, ArrowRight, X, Loader2, Plus, Sparkles, TrendingUp,
    Zap, Globe, Atom, Palette, Bot, RefreshCw, Search, ChevronRight, ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useSWR, { mutate } from 'swr';
import { getSourceTypeColor, SourceType } from '@/lib/url-detector';
import { StarterPack, RecommendedSource, getStarterPacks } from '@/lib/recommendations';
import { PackIcon } from '@/components/PackIcon';
import { AlertBanner } from '@/components/AlertBanner';

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



const SearchAnimation = () => (
    <div className="flex flex-col gap-4 py-4 animate-in fade-in duration-500">
        {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl bg-white/50 relative overflow-hidden">
                <div className="w-12 h-12 bg-gray-100 rounded-lg animate-pulse" />
                <div className="flex-1 space-y-2.5">
                    <div className="h-3.5 bg-gray-100 rounded-full w-2/5 animate-pulse" />
                    <div className="h-2.5 bg-gray-50 rounded-full w-3/5 animate-pulse" />
                </div>
                {/* Refined scanning line effect */}
                <motion.div
                    className="absolute inset-x-0 top-0 h-full bg-gradient-to-r from-transparent via-orange-100/10 to-transparent"
                    animate={{ x: ['-200%', '200%'] }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                />
            </div>
        ))}
    </div>
);

interface SourcesClientProps {
    initialSources: Source[];
    initialTier: string;
    initialTrialDays: number;
    initialStarterPacks: StarterPack[];
}

export default function SourcesClient({ initialSources, initialTier, initialTrialDays, initialStarterPacks }: SourcesClientProps) {
    const { data, error, isLoading } = useSWR('/api/sources', fetcher, { fallbackData: { sources: initialSources } });
    const sources: Source[] = data?.sources || [];
    const loading = false; // Always false initially because we have fallback data

    // Subscription State
    const [tier, setTier] = useState<string>(initialTier);
    const [trialDaysRemaining, setTrialDaysRemaining] = useState<number>(initialTrialDays);

    // Settings are now passed as props, no need to fetch them.

    const [showAddModal, setShowAddModal] = useState(false);

    // Toast State
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; description?: string } | null>(null);
    const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);
    const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());

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
    const [starterPacks, setStarterPacks] = useState<StarterPack[]>(initialStarterPacks);
    const [recommendations, setRecommendations] = useState<StarterPack[] | RecommendedSource[]>([]);
    const [recMode, setRecMode] = useState<'starter' | 'contextual'>('starter');
    const [loadingRecs, setLoadingRecs] = useState(true);
    const [addingRec, setAddingRec] = useState<string | null>(null); // ID being added
    const [resolvedFavicons, setResolvedFavicons] = useState<Record<string, string>>({});

    useEffect(() => {
        fetchRecommendations();
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
        let limitReached = false;

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
                
                if (res.status === 403) {
                    limitReached = true;
                    break;
                }

                const data = await res.json();
                if (res.ok && data.source) {
                    successCount++;
                }
            } catch (e) {
                console.error('Failed to add source from pack', source.name);
            }
        }

        setAddingRec(null);
        if (limitReached) {
            setToast({ 
                message: 'Plan limit reached', 
                description: 'You have reached the maximum number of sources allowed for your plan. Upgrade to Pro for unlimited sources.', 
                type: 'error' 
            });
            mutate('/api/sources');
        } else if (successCount > 0) {
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
            } else if (res.status === 403) {
                const data = await res.json();
                setToast({ 
                    message: 'Plan limit reached', 
                    description: data.message || 'Upgrade to Pro for unlimited sources.', 
                    type: 'error' 
                });
            } else {
                const data = await res.json();
                setToast({ message: 'Failed to add', description: data.error, type: 'error' });
            }
        } catch (error: any) {
            setToast({ message: 'Error adding source', description: error.message, type: 'error' });
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
        }, 300); // reduced from 600ms to 300ms for "cracked" feel

        return () => clearTimeout(timer);
    }, [inputUrl, detectUrl, searchUniversal, detectedSource]);

    const handleSelectResult = (result: SearchResult) => {
        // Optimistically set the detected source from the search result
        // This makes the UI feel instant instead of waiting for a backend roundtrip

        let type: SourceType = 'rss';
        if (result.type === 'youtube') type = 'youtube';
        else if (result.type === 'podcast') type = 'podcast';
        else if (result.type === 'reddit') type = 'reddit';
        else if (result.type === 'twitter') type = 'x';
        else if (result.type === 'substack') type = 'substack';
        else if (result.type === 'medium') type = 'medium';
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

        const optimisticSource: Source = {
            id: `temp-${Date.now()}`,
            name: editableName || detectedSource.name,
            url: detectedSource.feedUrl,
            type: detectedSource.type,
            favicon: detectedSource.favicon,
            enabled: true,
            originalUrl: detectedSource.originalUrl,
        };

        // Optimistically update the UI
        mutate(
            '/api/sources',
            (currentData: any) => ({
                sources: [...(currentData?.sources || sources), optimisticSource]
            }),
            false // don't revalidate immediately
        );

        resetModal();

        try {
            const res = await fetch('/api/sources', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: optimisticSource.name,
                    url: optimisticSource.url,
                    type: optimisticSource.type,
                    favicon: optimisticSource.favicon,
                    originalUrl: optimisticSource.originalUrl,
                })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.source?.id) {
                    setRecentlyAddedId(data.source.id);
                    setTimeout(() => setRecentlyAddedId(null), 3000);
                }
                setToast({ message: 'Source added', type: 'success' });
            } else {
                const data = await res.json();
                if (res.status === 403) {
                    setToast({ 
                        message: 'Plan limit reached', 
                        description: data.message || 'Upgrade to Pro for unlimited sources.', 
                        type: 'error' 
                    });
                } else {
                    setDetectionError(data.error || 'Failed to add source');
                }
            }
        } catch (error: any) {
            setToast({ message: 'Error adding source', description: error.message, type: 'error' });
            setDetectionError(error.message);
        } finally {
            // Revalidate to get the real ID and sync with backend
            mutate('/api/sources');
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

        // Optimistically update the UI
        const previousSources = sources;
        mutate(
            '/api/sources',
            (currentData: any) => ({
                sources: (currentData?.sources || sources).filter((s: Source) => s.id !== id)
            }),
            false
        );

        try {
            const res = await fetch(`/api/sources?id=${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
            setToast({ message: 'Source deleted', type: 'success' });
            fetchRecommendations();
        } catch (error: any) {
            setToast({ message: 'Error deleting source', description: error.message, type: 'error' });
            // Revert optimistic update
            mutate('/api/sources', { sources: previousSources }, false);
        } finally {
            mutate('/api/sources');
        }
    };

    const handleToggle = async (source: Source) => {
        // Optimistically update the UI
        const previousSources = sources;
        mutate(
            '/api/sources',
            (currentData: any) => ({
                sources: (currentData?.sources || sources).map((s: Source) =>
                    s.id === source.id ? { ...s, enabled: !s.enabled } : s
                )
            }),
            false
        );

        try {
            const res = await fetch('/api/sources', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: source.id, enabled: !source.enabled })
            });
            if (!res.ok) throw new Error('Failed to toggle');
        } catch (error) {
            console.error('Error toggling source:', error);
            // Revert optimistic update
            mutate('/api/sources', { sources: previousSources }, false);
        } finally {
            mutate('/api/sources');
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A] font-sans selection:bg-[#FF5700] selection:text-white">

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 sm:pt-16 pb-8 sm:pb-12"
            >
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6">
                    <motion.div>
                        <h1 className="text-3xl sm:text-4xl md:text-6xl font-serif font-medium tracking-tight leading-[0.9]">
                            Sources
                        </h1>
                        <p className="text-base sm:text-xl text-gray-500 font-light mt-4 sm:mt-6 max-w-lg leading-relaxed font-sans">
                            Curate high-signal streams. All configured streams are synthesized into your daily briefing.
                        </p>
                    </motion.div>
                    <motion.button
                        onClick={() => setShowAddModal(true)}
                        className="group flex items-center justify-center gap-3 w-full sm:w-auto px-6 py-3 bg-[#1A1A1A] text-white rounded-full hover:bg-[#2A2A2A] transition-all duration-300 shadow-lg hover:shadow-xl"
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
                            <p className="text-gray-400 font-sans">Loading intelligence streams...</p>
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
                                        className={`relative md:pl-12 py-4 sm:py-6 group border-b border-gray-100 last:border-0 hover:bg-white/50 transition-colors duration-1000 rounded-lg overflow-hidden ${recentlyAddedId === source.id ? 'bg-white shadow-sm ring-1 ring-gray-100' : ''}`}
                                    >
                                        {/* Timeline Dot */}
                                        <div className={`absolute left-[18px] top-[30px] w-3 h-3 rounded-full border-2 border-[#FDFBF7] hidden md:block transition-all duration-700 ${recentlyAddedId === source.id ? 'bg-[#FF5700] scale-125' : source.enabled ? 'bg-[#FF5700]' : 'bg-gray-300'}`}></div>

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
                                        className="flex items-start gap-4 p-4 bg-white border border-gray-100 rounded-xl hover:shadow-lg hover:border-[#FF5700] transition-all text-left group"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 flex-none flex items-center justify-center overflow-hidden">
                                            {rec.favicon ? <img src={rec.favicon} className="w-full h-full object-cover" /> : <SourceIcon type={rec.type} className="w-5 h-5" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-serif font-bold text-gray-900 group-hover:text-[#FF5700] transition-colors truncate">{rec.name}</h4>
                                            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{rec.description || 'Recommended for you'}</p>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-[#FF5700] group-hover:text-white transition-colors flex-none">
                                            {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
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
                                className="bg-white w-full sm:max-w-2xl h-[85vh] sm:h-[600px] flex flex-col shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] ring-1 ring-black/5 rounded-t-2xl sm:rounded-3xl overflow-hidden duration-200"
                            >
                                                          {/* Fixed Top Section: Header + Large Input - Editorial Breathing Room */}
                                <div className="flex-none bg-white p-6 sm:p-10 pb-6 z-20 rounded-t-2xl sm:rounded-t-3xl border-b border-gray-50">
                                    <div className="flex justify-between items-center mb-8 sm:mb-10">
                                        <div className="flex items-center gap-3">
                                            {detectedSource && (
                                                <button
                                                    onClick={() => {
                                                        setDetectedSource(null);
                                                        setSampleItems([]);
                                                    }}
                                                    className="flex items-center gap-2 text-[10px] font-bold text-[#FF5700] uppercase tracking-[0.2em] hover:opacity-80 transition-all group/back"
                                                >
                                                    <ChevronLeft className="w-4 h-4 transition-transform group-hover/back:-translate-x-1" />
                                                    <span>Back</span>
                                                </button>
                                            )}
                                            {!detectedSource && (
                                                <h2 className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.3em] font-sans">Add New Source</h2>
                                            )}
                                        </div>
                                        <button onClick={resetModal} className="text-gray-400 hover:text-black transition p-2 -mr-2 bg-gray-50/50 hover:bg-gray-100 rounded-full">
                                            <span className="sr-only">Close</span>
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
 
                                    <div className="flex items-center gap-4">
                                        <div className="text-gray-400 flex-none relative">
                                            <Search className={`w-6 h-6 transition-colors ${isSearching || detecting ? 'text-[#FF5700]' : ''}`} />
                                            {(isSearching || detecting) && (
                                                <motion.div
                                                    layoutId="search-pulse"
                                                    className="absolute -inset-2 rounded-full bg-orange-100/30 -z-10"
                                                    animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0.1, 0.5] }}
                                                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                                                />
                                            )}
                                        </div>
                                        <div className="relative flex-1">
                                            <input
                                                type="text"
                                                value={inputUrl}
                                                onChange={(e) => setInputUrl(e.target.value)}
                                                placeholder="Search or paste link..."
                                                className="w-full bg-transparent border-none text-2xl sm:text-3xl font-sans text-[#1A1A1A] placeholder:text-gray-300 focus:outline-none focus:ring-0 px-0"
                                                autoFocus
                                                spellCheck={false}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Scrollable Results Area */}
                                <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-2 sm:py-3 scrollbar-premium">
                                    {/* Intro Text / Helper (only when empty) */}
                                    {!inputUrl && !detectedSource && (
                                        <div className="h-full flex flex-col items-center justify-center opacity-80 pb-10">
                                            <p className="font-sans text-gray-500 text-lg text-center max-w-sm leading-relaxed">
                                                Search for YouTube channels, subreddits, podcasts, or paste any RSS link.
                                            </p>
                                        </div>
                                    )}

                                    {/* Detection Error */}
                                    {detectionError && (
                                        <div className="mb-6">
                                            <AlertBanner message={detectionError} type="error" />
                                        </div>
                                    )}

                                    {/* Searching Animation */}
                                    {(isSearching || detecting) && !detectedSource && (
                                        <SearchAnimation />
                                    )}

                                    {/* Search Results List - Editorial Style */}
                                    {searchResults.length > 0 && !detectedSource && !isSearching && !detecting && (
                                        <div className="animate-in slide-in-from-bottom-2 duration-500">
                                            <h3 className="text-[11px] font-bold text-[#FF5700] uppercase tracking-[0.25em] mb-4 ml-1">
                                                {searchResults.length} Results
                                            </h3>
                                            <div className="space-y-1.5 pb-4">
                                                {searchResults.map((result, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => handleSelectResult(result)}
                                                        className="w-full flex items-center gap-4 p-3.5 border border-transparent hover:border-gray-100 hover:bg-gray-50/50 hover:backdrop-blur-sm rounded-2xl transition-all duration-300 text-left group relative"
                                                    >
                                                        <div className="w-11 h-11 bg-white flex-none flex items-center justify-center text-lg transition-all rounded-xl overflow-hidden border border-gray-100 shadow-sm group-hover:shadow-md group-hover:scale-105 duration-300">
                                                            {result.thumbnail && !brokenImages.has(result.thumbnail) ? (
                                                                <img 
                                                                    src={result.thumbnail} 
                                                                    className="w-full h-full object-cover" 
                                                                    onError={() => {
                                                                        const newBroken = new Set(brokenImages);
                                                                        newBroken.add(result.thumbnail!);
                                                                        setBrokenImages(newBroken);
                                                                    }}
                                                                />
                                                            ) : (
                                                                <SourceIcon type={result.type} className="w-5 h-5 opacity-60" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0 pr-6">
                                                            <div className="font-serif text-lg font-medium text-gray-900 group-hover:text-[#FF5700] transition-colors truncate">
                                                                {result.title}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold tracking-wider mt-0.5">
                                                                <span className={`uppercase ${getSourceTypeColor(result.type as SourceType)} opacity-90`}>{result.type === 'twitter' ? 'X' : result.type}</span>
                                                                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                                                <span className="truncate max-w-[220px] font-medium italic opacity-90">{result.description}</span>
                                                            </div>
                                                        </div>
                                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-200 group-hover:text-[#FF5700] transition-all duration-300 transform group-hover:translate-x-1 opacity-0 group-hover:opacity-100">
                                                            <ChevronRight className="w-5 h-5 stroke-[1.5]" />
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Detected Source Preview - Editorial Style */}
                                    {detectedSource && (
                                        <div className="animate-in slide-in-from-bottom-4 duration-500">
                                            <div className="bg-gray-50/50 backdrop-blur-sm p-5 sm:p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
                                                <div className="flex items-center gap-5 sm:gap-6">
                                                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white border border-gray-100 flex-none flex items-center justify-center text-3xl shadow-md rounded-2xl overflow-hidden group-hover:scale-105 transition-transform duration-500">
                                                        {detectedSource.favicon && !brokenImages.has(detectedSource.favicon) ? (
                                                            <img 
                                                                src={detectedSource.favicon} 
                                                                alt="" 
                                                                className="w-full h-full object-cover" 
                                                                onError={() => {
                                                                    const newBroken = new Set(brokenImages);
                                                                    newBroken.add(detectedSource.favicon!);
                                                                    setBrokenImages(newBroken);
                                                                }}
                                                            />
                                                        ) : (
                                                            <SourceIcon type={detectedSource.type} className="w-10 h-10 opacity-40" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-widest ${getSourceTypeColor(detectedSource.type)} bg-white/80 backdrop-blur-sm border-gray-100`}>
                                                                {detectedSource.type === 'twitter' ? 'X' : detectedSource.type}
                                                            </span>
                                                            <span className="text-[10px] text-green-600 font-bold uppercase tracking-[0.15em] flex items-center gap-1.5 opacity-80">
                                                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                                                Ready to add
                                                            </span>
                                                        </div>
                                                        <input
                                                            type="text"
                                                            value={editableName}
                                                            onChange={(e) => setEditableName(e.target.value)}
                                                            className="w-full text-2xl font-serif font-medium bg-transparent border-b border-transparent hover:border-gray-200 focus:border-[#FF5700] focus:outline-none transition-all duration-300 p-0 truncate text-gray-900"
                                                        />
                                                        <p className="text-[10px] text-gray-500 mt-1.5 font-bold tracking-wider truncate opacity-80 uppercase">{new URL(detectedSource.feedUrl).hostname}</p>
                                                    </div>
                                                </div>

                                                {/* Sample Items - Refined */}
                                                {sampleItems.length > 0 && (
                                                    <div className="mt-8 pt-6 border-t border-gray-100/50">
                                                        <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-4 ml-1">Latest Content</h4>
                                                        <ul className="space-y-2.5">
                                                            {sampleItems.slice(0, 2).map((item, i) => (
                                                                <li key={i} className="flex items-center gap-3 text-sm text-gray-600 font-sans opacity-90 group/item">
                                                                    <div className="w-1 h-1 rounded-full bg-gray-200 flex-none" />
                                                                    <span className="line-clamp-1 italic">"{item.title}"</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Fixed Actions Bottom Bar - Editorial Style */}
                                <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/50 backdrop-blur-md flex-none flex items-center justify-end gap-6 z-20 rounded-b-2xl sm:rounded-b-3xl">
                                    <button
                                        onClick={resetModal}
                                        className="text-[11px] font-bold text-gray-500 hover:text-black transition-colors tracking-[0.2em] uppercase"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAdd}
                                        disabled={!detectedSource || detecting}
                                        className={`px-8 py-2.5 rounded-full font-bold text-[11px] tracking-[0.2em] uppercase transition-all duration-500 shadow-sm flex items-center gap-2 ${
                                            detectedSource && !detecting
                                            ? 'bg-black text-white hover:bg-[#FF5700] hover:scale-105 shadow-black/10'
                                            : 'bg-gray-200/50 text-gray-500 cursor-not-allowed opacity-60'
                                        }`}
                                    >
                                        {detecting ? 'Detecting...' : detectedSource ? 'Confirm Source' : 'Add Source'}
                                        {!detecting && detectedSource && <ChevronRight className="w-3 h-3 stroke-[3]" />}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
            </AnimatePresence>
        </div>
    );
}
