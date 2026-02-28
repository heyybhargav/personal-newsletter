"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertBanner } from "@/components/AlertBanner";

interface ArchiveClientProps {
    initialDates: string[];
}

export default function ArchiveClient({ initialDates }: ArchiveClientProps) {
    const [dates, setDates] = useState<string[]>(initialDates);

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
                {dates.length === 0 && (
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

                {dates.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {dates.map((dateStr) => (
                            <Link
                                key={dateStr}
                                href={`/archive/${dateStr}`}
                                className="group relative p-6 bg-white border border-gray-100 rounded-xl hover:border-[#FF5700] hover:shadow-lg transition-all text-left flex flex-col h-full overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#FF5700]/5 to-transparent rounded-bl-full translate-x-12 -translate-y-12 group-hover:translate-x-0 group-hover:-translate-y-0 transition-transform duration-500"></div>

                                <span className="text-xs font-bold tracking-widest text-[#FF5700] uppercase mb-3 block relative z-10">
                                    Edition
                                </span>
                                <h2 className="font-serif text-2xl font-bold text-gray-900 group-hover:text-[#FF5700] transition-colors leading-tight mb-8 relative z-10">
                                    {formatDate(dateStr)}
                                </h2>

                                <div className="mt-auto flex items-center gap-2 text-gray-400 group-hover:text-[#1A1A1A] text-sm font-medium transition-colors relative z-10">
                                    <span>Read Briefing</span>
                                    <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
