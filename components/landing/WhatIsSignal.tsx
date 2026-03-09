'use client';

import { motion } from 'framer-motion';
import { BrainCircuit, Radio, Mail } from 'lucide-react';

export default function WhatIsSignal() {
    return (
        <section
            id="what-is-signal"
            aria-labelledby="what-is-signal-title"
            className="w-full py-20 md:py-32 px-6 relative overflow-hidden flex flex-col items-center border-b border-gray-100"
        >
            <div className="max-w-4xl mx-auto w-full relative z-10 text-center">

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                >
                    <h2
                        id="what-is-signal-title"
                        className="text-xs md:text-sm font-bold tracking-[0.2em] text-[#FF5700] uppercase mb-8 flex items-center justify-center opacity-90"
                    >
                        What is Signal Daily?
                    </h2>

                    <article>
                        <p className="text-3xl md:text-5xl lg:text-6xl font-medium text-[#1A1A1A] tracking-tight leading-snug md:leading-[1.12] mb-8">
                            Signal Daily is an <strong className="font-semibold text-black">AI personal briefing engine</strong> that extracts insights from <span className="italic font-serif text-gray-500 font-normal">essays, podcasts, and videos</span> and delivers a <strong className="font-semibold text-black relative inline-block">
                                daily intelligence email.
                                <svg className="absolute -bottom-1 md:-bottom-2 left-0 w-full h-3 md:h-4 text-[#FF5700]/40 -z-10" viewBox="0 0 100 15" preserveAspectRatio="none">
                                    <path d="M2,8 Q40,-2 98,6 Q50,12 5,8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="transparent" className="opacity-90" />
                                </svg>
                            </strong>
                        </p>
                    </article>
                </motion.div>

                {/* Semantic Icon Grid to unpack the definition for extra SEO parser context without cluttering the text */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12 mt-16 max-w-3xl mx-auto"
                >
                    <div className="flex flex-col items-center text-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#FF5700]/5 flex items-center justify-center border border-[#FF5700]/10 shadow-sm text-[#FF5700] ring-1 ring-inset ring-[#FF5700]/10">
                            <BrainCircuit className="w-6 h-6" />
                        </div>
                        <h3 className="font-semibold text-[#1A1A1A]">AI Engine</h3>
                        <p className="text-sm text-gray-500 max-w-[200px]">Autonomous analysis of complex multi-modal information.</p>
                    </div>

                    <div className="flex flex-col items-center text-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#FF5700]/5 flex items-center justify-center border border-[#FF5700]/10 shadow-sm text-[#FF5700] ring-1 ring-inset ring-[#FF5700]/10">
                            <Radio className="w-6 h-6" />
                        </div>
                        <h3 className="font-semibold text-[#1A1A1A]">Multi-Modal Extract</h3>
                        <p className="text-sm text-gray-500 max-w-[200px]">Synthesizes long-form essays, podcasts, and video transcripts.</p>
                    </div>

                    <div className="flex flex-col items-center text-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#FF5700]/5 flex items-center justify-center border border-[#FF5700]/10 shadow-sm text-[#FF5700] ring-1 ring-inset ring-[#FF5700]/10">
                            <Mail className="w-6 h-6" />
                        </div>
                        <h3 className="font-semibold text-[#1A1A1A]">Intelligence Delivery</h3>
                        <p className="text-sm text-gray-500 max-w-[200px]">A single, high-signal daily briefing delivered directly to your inbox.</p>
                    </div>
                </motion.div>

            </div>

            {/* Subtle background noise/texture overlay for the "Fire on Paper" aesthetic */}
            <div className="absolute inset-0 z-0 opacity-[0.015] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
        </section>
    );
}
