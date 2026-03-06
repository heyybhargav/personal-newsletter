"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertBanner } from "@/components/AlertBanner";

import { ArchiveMetadata } from "@/lib/db";

interface ArchiveClientProps {
    initialArchives: ArchiveMetadata[];
}

export default function ArchiveClient({ initialArchives }: ArchiveClientProps) {
    const [archives, setArchives] = useState<ArchiveMetadata[]>(initialArchives);

    // Format YYYY-MM-DD into a pretty string (e.g. Wednesday, Feb 28, 2026)
    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        // Correct for local time offset drift so the string renders the actual intended calendar date.
        const userTimezoneOffset = d.getTimezoneOffset() * 60000;
        const correctedDate = new Date(d.getTime() + userTimezoneOffset);

        return new Intl.DateTimeFormat("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
            year: "numeric",
        }).format(correctedDate);
    };

    return (
        <div className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A] font-sans selection:bg-[#FF5700] selection:text-white">
            {/* Header matching Sources page */}
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
                            Briefing Archive
                        </h1>
                        <p className="text-base sm:text-xl text-gray-500 font-light mt-4 sm:mt-6 max-w-lg leading-relaxed font-serif">
                            Your complete history of intelligence coverage. Note: Subscriptions only retain data for 30 days after cancellation.
                        </p>
                    </motion.div>
                </div>

                <div className="h-px w-full bg-gray-200/60 mt-8 sm:mt-12"></div>
            </motion.div>

            {/* Main Content */}
            <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-8">
                {archives.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="flex flex-col items-center justify-center pb-10 pt-4 px-4 text-center mt-2 relative"
                    >
                        {/* Radar / Sensing Animation */}
                        <div className="relative mb-8 flex justify-center items-center">
                            <motion.div
                                animate={{ scale: [1, 2.5], opacity: [0.5, 0] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeOut" }}
                                className="absolute w-16 h-16 bg-[#FF5700]/30 rounded-full"
                            />
                            <motion.div
                                animate={{ scale: [1, 1.8], opacity: [0.8, 0] }}
                                transition={{ duration: 3, delay: 1, repeat: Infinity, ease: "easeOut" }}
                                className="absolute w-16 h-16 bg-[#FF5700]/20 rounded-full"
                            />

                            <div className="w-20 h-20 min-w-[5rem] shrink-0 bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl rotate-3 flex items-center justify-center relative z-10 transition-transform hover:rotate-0 duration-500">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FF5700" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 2v10l4.5 4.5" />
                                    <path d="m19 19-3.5-3.5" />
                                    <circle cx="12" cy="12" r="10" />
                                </svg>
                            </div>
                        </div>

                        <h3 className="font-serif text-3xl sm:text-4xl mb-4 text-[#1A1A1A] tracking-tight">Awaiting Intel</h3>
                        <p className="text-gray-500 max-w-md mx-auto mb-8 font-serif text-lg leading-relaxed">
                            Signal is actively monitoring your curated sources. Your first executive briefing will be synthesized and archived here after your next scheduled delivery.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center gap-4 justify-center w-full sm:w-auto">
                            <Link href="/sources" className="w-full sm:w-auto px-8 py-3.5 bg-[#1A1A1A] text-white text-[11px] font-bold uppercase tracking-[0.2em] rounded-full hover:bg-[#2A2A2A] shadow-lg hover:shadow-xl transition-all duration-300">
                                Refine Sources
                            </Link>
                            <Link href="/settings" className="w-full sm:w-auto px-8 py-3.5 bg-white text-[#1A1A1A] border border-gray-200 text-[11px] font-bold uppercase tracking-[0.2em] rounded-full hover:border-[#1A1A1A] hover:bg-gray-50 transition-colors duration-300">
                                Check Schedule
                            </Link>
                        </div>
                    </motion.div>
                )}

                {archives.length > 0 && (
                    <div className="flex flex-col">
                        {archives.map((archive) => (
                            <Link
                                key={archive.dateStr}
                                href={`/archive/${archive.dateStr}`}
                                className="group block py-4 sm:py-6 border-b border-gray-100 last:border-0 hover:bg-white/50 transition-colors duration-500 rounded-lg -mx-4 px-4 sm:mx-0 sm:px-4 md:px-6"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 sm:gap-6">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 sm:gap-3 mb-1.5">
                                            <span className="text-[10px] sm:text-xs text-gray-400 font-mono">
                                                {formatDate(archive.dateStr)}
                                            </span>
                                        </div>

                                        <h3 className="text-lg sm:text-xl font-serif font-medium text-[#1A1A1A] group-hover:text-[#FF5700] transition-colors leading-tight mb-1">
                                            {archive.subject}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1 sm:mt-2 text-xs sm:text-sm text-gray-400 font-sans">
                                            <span className="truncate opacity-80">
                                                {archive.preheader}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 sm:gap-4 flex-none sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 mt-2 sm:mt-0 pt-1">
                                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray-400 group-hover:text-[#FF5700] transition-colors py-2 flex items-center gap-1">
                                            Read <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
