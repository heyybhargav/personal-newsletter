'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, X, Plus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

// --- Curated Starter Packs ---
const STARTER_PACKS = [
    {
        label: 'The AI Insider',
        description: 'Stratechery, Ben Evans, arXiv',
        accent: 'border-l-[#FF5700]',
        dotColor: 'bg-[#FF5700]',
        sources: 3,
        urls: [
            'https://stratechery.com',
            'https://www.ben-evans.com',
            'https://arxiv.org/list/cs.AI/recent',
        ],
    },
    {
        label: 'The Macro View',
        description: 'Matt Levine, FT Alphaville',
        accent: 'border-l-[#1A1A1A]',
        dotColor: 'bg-[#1A1A1A]',
        sources: 3,
        urls: [
            'https://www.bloomberg.com/opinion/authors/ARbTQlRLRjE/matthew-s-levine',
            'https://www.ft.com/alphaville',
            'https://www.wsj.com',
        ],
    },
    {
        label: 'The Builder',
        description: 'Hacker News, Paul Graham, GitHub Trending',
        accent: 'border-l-[#888888]',
        dotColor: 'bg-[#888888]',
        sources: 3,
        urls: [
            'https://news.ycombinator.com',
            'https://www.paulgraham.com/articles.html',
            'https://github.com/trending',
        ],
    },
];

const LOADING_PHRASES = [
    'Connecting to source...',
    'Fetching raw HTML...',
    'Stripping ads and tracking scripts...',
    'Extracting core arguments...',
    'Parsing article structure...',
    'Identifying key claims...',
    'Cross-referencing mental models...',
    'Detecting second-order effects...',
    'Isolating high-signal insights...',
    'Compressing information density...',
    'Synthesizing competing perspectives...',
    'Structuring narrative arc...',
    'Formatting your briefing...',
    'Running final quality checks...',
];

type DemoState = 'idle' | 'loading' | 'result' | 'error';

export default function InteractiveDemo() {
    const [urls, setUrls] = useState<string[]>(['']);
    const [state, setState] = useState<DemoState>('idle');
    const [narrative, setNarrative] = useState('');
    const [subject, setSubject] = useState('');
    const [error, setError] = useState('');
    const [loadingPhrase, setLoadingPhrase] = useState(LOADING_PHRASES[0]);
    const [remainingUses, setRemainingUses] = useState<number | null>(null);
    const resultRef = useRef<HTMLDivElement>(null);

    // Cycle loading phrases
    useEffect(() => {
        if (state !== 'loading') return;
        let i = 0;
        const interval = setInterval(() => {
            i = (i + 1) % LOADING_PHRASES.length;
            setLoadingPhrase(LOADING_PHRASES[i]);
        }, 2500);
        return () => clearInterval(interval);
    }, [state]);

    // Scroll to result when it appears
    useEffect(() => {
        if (state === 'result' && resultRef.current) {
            setTimeout(() => {
                resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 300);
        }
    }, [state]);

    const synthesize = useCallback(async (inputUrls: string[]) => {
        const validUrls = inputUrls.filter(u => u.trim().length > 0);
        if (validUrls.length === 0) return;

        // Normalize
        const normalized = validUrls.map(u => {
            let url = u.trim();
            if (!url.startsWith('http')) url = 'https://' + url;
            return url;
        });

        setState('loading');
        setError('');
        setLoadingPhrase(LOADING_PHRASES[0]);

        try {
            const res = await fetch('/api/demo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ urls: normalized }),
            });

            const data = await res.json();

            if (!res.ok) {
                setState('error');
                setError(data.error || 'Something went wrong.');
                if (data.rateLimited) {
                    setRemainingUses(0);
                }
                return;
            }

            setNarrative(data.narrative);
            setSubject(data.subject);
            setRemainingUses(data.remainingUses);
            setState('result');
        } catch {
            setState('error');
            setError('Network error. Please check your connection and try again.');
        }
    }, []);

    const handleStarterPack = (pack: typeof STARTER_PACKS[0]) => {
        setUrls(pack.urls);
        synthesize(pack.urls);
    };

    const addUrlField = () => {
        if (urls.length < 3) setUrls([...urls, '']);
    };

    const removeUrlField = (index: number) => {
        if (urls.length <= 1) return;
        setUrls(urls.filter((_, i) => i !== index));
    };

    const updateUrl = (index: number, value: string) => {
        const newUrls = [...urls];
        newUrls[index] = value;
        setUrls(newUrls);
    };

    const handleReset = () => {
        setState('idle');
        setNarrative('');
        setSubject('');
        setError('');
        setUrls(['']);
    };

    const hasInput = urls.some(u => u.trim().length > 0);

    const triggerLogin = () => {
        const googleButton = document.querySelector('[role="button"]') as HTMLElement;
        if (googleButton) googleButton.click();
    };

    return (
        <section className="py-24 md:py-32 px-6 relative overflow-hidden bg-gradient-to-b from-[#FDFBF7] via-white to-[#FDFBF7]">
            {/* Subtle texture behind section */}
            <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #1A1A1A 1px, transparent 0)', backgroundSize: '24px 24px' }} />
            {/* Section Header */}
            <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-white border border-gray-100 shadow-sm mb-6">
                        <Sparkles className="w-3.5 h-3.5 text-[#FF5700]" />
                        <span className="text-[10px] sm:text-xs font-bold tracking-widest text-[#FF5700] uppercase">Try it now</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-[#1A1A1A] tracking-tighter leading-[1.1] mb-4">
                        See the magic.{' '}
                        <span className="font-serif italic font-medium text-[#888888]">No sign-up.</span>
                    </h2>
                    <p className="text-base sm:text-lg text-[#4A4A4A] font-medium max-w-2xl mx-auto">
                        Pick a pack below, or paste source links. We'll synthesize a briefing in seconds.
                    </p>
                </motion.div>
            </div>

            <div className="max-w-3xl mx-auto">
                <AnimatePresence mode="wait">
                    {/* ========================= IDLE STATE ========================= */}
                    {(state === 'idle' || state === 'error') && (
                        <motion.div
                            key="input"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5 }}
                        >
                            {/* Starter Packs */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                                {STARTER_PACKS.map((pack, i) => (
                                    <motion.button
                                        key={pack.label}
                                        onClick={() => handleStarterPack(pack)}
                                        disabled={state === 'error' && remainingUses === 0}
                                        initial={{ opacity: 0, y: 15 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.4, delay: i * 0.1 }}
                                        className="group relative bg-white rounded-xl p-5 border border-gray-100 shadow-[0_2px_8px_rgb(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.1)] transition-all duration-300 text-left cursor-pointer hover:-translate-y-1 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 overflow-hidden"
                                    >
                                        {/* Clean left accent bar */}
                                        <div className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-full ${pack.dotColor}`} />
                                        <div className="pl-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-semibold text-sm text-[#1A1A1A]">{pack.label}</span>
                                                <ArrowRight className="w-3.5 h-3.5 text-gray-200 group-hover:text-[#FF5700] transition-all duration-300 group-hover:translate-x-0.5" />
                                            </div>
                                            <div className="text-[11px] text-gray-400 font-medium leading-relaxed">{pack.description}</div>
                                        </div>
                                    </motion.button>
                                ))}
                            </div>

                            {/* Divider */}
                            <div className="flex items-center gap-4 mb-10">
                                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                                <span className="text-[10px] font-bold tracking-[0.2em] text-gray-300 uppercase">or paste your own</span>
                                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                            </div>

                            {/* Manual URL Input */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 space-y-3">
                                {urls.map((url, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <input
                                            type="url"
                                            value={url}
                                            onChange={(e) => updateUrl(index, e.target.value)}
                                            placeholder={index === 0 ? 'Paste a Substack, YouTube channel, or blog link...' : 'Add another source URL...'}
                                            className="flex-1 px-4 py-3 rounded-xl bg-[#FDFBF7] border border-gray-100 text-sm font-[family-name:var(--font-newsreader)] text-[#1A1A1A] placeholder:text-gray-300 focus:outline-none focus:border-gray-300 transition-colors"
                                        />
                                        {urls.length > 1 && (
                                            <button
                                                onClick={() => removeUrlField(index)}
                                                className="p-2 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors cursor-pointer"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}

                                <div className="flex items-center justify-between pt-2">
                                    {urls.length < 3 && (
                                        <button
                                            onClick={addUrlField}
                                            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-[#1A1A1A] transition-colors cursor-pointer"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            Add URL ({urls.length}/3)
                                        </button>
                                    )}
                                    <button
                                        onClick={() => synthesize(urls)}
                                        disabled={!hasInput || (state === 'error' && remainingUses === 0)}
                                        className="group/btn relative inline-flex items-center gap-2 px-6 py-3.5 text-sm font-medium text-white bg-[#1A1A1A] hover:bg-[#2A2A2A] rounded-full transition-all duration-300 shadow-xl shadow-black/10 hover:shadow-2xl hover:shadow-black/20 ml-auto cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed overflow-hidden transform hover:-translate-y-0.5"
                                    >
                                        <span className="relative z-10">Synthesize Briefing</span>
                                        <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5 opacity-60 relative z-10" />
                                    </button>
                                </div>
                            </div>

                            {/* Error Message */}
                            {state === 'error' && error && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-4 p-4 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600 font-medium text-center"
                                >
                                    {error}
                                </motion.div>
                            )}

                            {remainingUses !== null && remainingUses > 0 && (
                                <p className="text-center text-xs text-gray-400 mt-4 font-medium">
                                    {remainingUses} free {remainingUses === 1 ? 'demo' : 'demos'} remaining today
                                </p>
                            )}
                        </motion.div>
                    )}

                    {/* ========================= LOADING STATE ========================= */}
                    {state === 'loading' && (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5 }}
                            className="bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-12 md:p-16 text-center relative overflow-hidden"
                        >
                            {/* Scanning bar */}
                            <div className="absolute top-0 left-0 right-0 h-0.5">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-transparent via-[#FF5700] to-transparent"
                                    animate={{ x: ['-100%', '100%'] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                />
                            </div>

                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#FFF5F0] mb-6">
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="w-3 h-3 rounded-full bg-[#FF5700]"
                                />
                            </div>

                            <AnimatePresence mode="wait">
                                <motion.p
                                    key={loadingPhrase}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.4 }}
                                    className="text-sm font-mono text-gray-400 tracking-wide"
                                >
                                    {loadingPhrase}
                                </motion.p>
                            </AnimatePresence>
                        </motion.div>
                    )}

                    {/* ========================= RESULT STATE ========================= */}
                    {state === 'result' && (
                        <motion.div
                            key="result"
                            ref={resultRef}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.6 }}
                        >
                            {/* The Briefing Card */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden relative">
                                {/* Header */}
                                <div className="p-6 md:p-8 border-b border-gray-100">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="font-serif text-lg font-bold text-[#1A1A1A]">Signal.</span>
                                        <span className="text-[10px] font-bold tracking-widest text-gray-300 uppercase">Demo Briefing</span>
                                    </div>
                                    <h3 className="text-xl md:text-2xl font-semibold text-[#1A1A1A] tracking-tight leading-snug">{subject}</h3>
                                </div>

                                {/* Narrative */}
                                <div className="p-6 md:p-8 prose prose-sm md:prose-base prose-neutral max-w-none font-[family-name:var(--font-newsreader)] prose-headings:font-sans prose-headings:tracking-tight prose-h2:text-lg prose-h2:font-bold prose-h3:text-base prose-a:text-[#FF5700] prose-a:no-underline prose-a:hover:underline prose-blockquote:border-l-[#FF5700] prose-blockquote:italic prose-strong:font-semibold">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                                        {narrative}
                                    </ReactMarkdown>
                                </div>

                                {/* Fade-to-CTA */}
                                <div className="relative">
                                    <div className="absolute bottom-full left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                                    <div className="p-8 md:p-10 bg-white text-center border-t border-gray-100">
                                        <p className="text-sm text-gray-500 font-medium mb-4">
                                            This is just a taste. Get your full, personalized briefing delivered every morning.
                                        </p>
                                        <button
                                            onClick={triggerLogin}
                                            className="group/cta inline-flex items-center gap-2 px-8 py-3.5 text-sm font-medium text-white bg-[#1A1A1A] hover:bg-[#2A2A2A] rounded-full transition-all duration-300 shadow-xl shadow-black/10 hover:shadow-2xl hover:shadow-black/20 cursor-pointer transform hover:-translate-y-0.5"
                                        >
                                            <span>Start 7-Day Free Trial</span>
                                            <ArrowRight className="w-4 h-4 transition-transform group-hover/cta:translate-x-0.5 opacity-60" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Try Again */}
                            <div className="flex items-center justify-center mt-6">
                                <button
                                    onClick={handleReset}
                                    className="text-xs font-medium text-gray-400 hover:text-[#1A1A1A] transition-colors cursor-pointer"
                                >
                                    ← Try another set of URLs
                                    {remainingUses !== null && remainingUses > 0 && (
                                        <span className="text-gray-300 ml-1">({remainingUses} left)</span>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </section>
    );
}
