'use client';

import { motion } from 'framer-motion';
import { Filter, Globe, Lock, Rss, Youtube } from 'lucide-react';

export default function Features() {
    return (
        <section className="py-32 px-6 bg-[#FDFBF7]">
            <div className="max-w-5xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Card 1: The Filter (Large) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="md:col-span-2 bg-[#F2F0EA] rounded-3xl p-10 flex flex-col justify-between min-h-[400px] hover:-translate-y-1 transition-transform duration-300"
                    >
                        <div className="space-y-4">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                                <Filter className="w-6 h-6 text-[#1A1A1A]" />
                            </div>
                            <h3 className="text-3xl font-serif font-medium text-[#1A1A1A]">
                                Stay informed.
                            </h3>
                            <p className="text-lg text-[#666666] leading-relaxed max-w-md">
                                Add the sources you trust. We monitor them daily and surface only what's worth your time.
                            </p>
                        </div>
                        <div className="mt-8 flex gap-2">
                            <div className="px-4 py-2 bg-white rounded-lg text-sm font-medium text-gray-500 shadow-sm opacity-50">Crypto</div>
                            <div className="px-4 py-2 bg-[#1A1A1A] rounded-lg text-sm font-medium text-white shadow-lg z-10">AI Trends</div>
                            <div className="px-4 py-2 bg-white rounded-lg text-sm font-medium text-gray-500 shadow-sm opacity-50">Politics</div>
                        </div>
                    </motion.div>

                    {/* Card 2: Sources (Small) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="bg-white border border-gray-100 rounded-3xl p-10 flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300"
                    >
                        <div>
                            <div className="w-12 h-12 bg-[#F2F0EA] rounded-full flex items-center justify-center mb-6">
                                <Globe className="w-6 h-6 text-[#1A1A1A]" />
                            </div>
                            <h3 className="text-2xl font-serif font-medium text-[#1A1A1A] mb-2">
                                Any source.
                            </h3>
                            <p className="text-base text-[#666666]">
                                RSS feeds, YouTube channels, newsletters. All in one place.
                            </p>
                        </div>
                        <div className="flex -space-x-2 mt-8">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center border-2 border-white"><Youtube className="w-4 h-4 text-red-600" /></div>
                            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center border-2 border-white"><Rss className="w-4 h-4 text-orange-600" /></div>
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center border-2 border-white"><Globe className="w-4 h-4 text-blue-600" /></div>
                        </div>
                    </motion.div>

                    {/* Card 3: Privacy (Full Width Mobile, Regular Desktop) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="bg-white border border-gray-100 rounded-3xl p-10 flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300"
                    >
                        <div>
                            <div className="w-12 h-12 bg-[#F2F0EA] rounded-full flex items-center justify-center mb-6">
                                <Lock className="w-6 h-6 text-[#1A1A1A]" />
                            </div>
                            <h3 className="text-2xl font-serif font-medium text-[#1A1A1A] mb-2">
                                No tracking.
                            </h3>
                            <p className="text-base text-[#666666]">
                                No pixels. No analytics. No data sold. Just your briefing.
                            </p>
                        </div>
                    </motion.div>

                    {/* Card 4: Your Schedule */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="md:col-span-2 bg-[#1A1A1A] rounded-3xl p-10 flex items-center justify-between text-white hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden"
                    >
                        <div className="relative z-10">
                            <h3 className="text-3xl font-serif font-medium mb-2">
                                Delivered on your time.
                            </h3>
                            <p className="text-gray-400">
                                Pick your time. Pick your timezone. It just shows up.
                            </p>
                        </div>
                        <div className="text-[12rem] md:text-[24rem] font-serif opacity-[0.04] absolute right-[-2rem] md:right-[-4rem] bottom-[-4rem] md:bottom-[-8rem] leading-none select-none pointer-events-none transform rotate-[-15deg]">
                            ⏱
                        </div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
}
