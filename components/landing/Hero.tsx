'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { ArrowRight } from 'lucide-react';

export default function Hero() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollY } = useScroll();
    const y = useTransform(scrollY, [300, 800], [0, 150]);

    const triggerLogin = () => {
        const googleButton = document.querySelector('[role="button"]') as HTMLElement;
        if (googleButton) googleButton.click();
    };

    return (
        <section ref={containerRef} itemScope itemType="https://schema.org/WebApplication" className="relative min-h-[100vh] flex flex-col items-center justify-center px-6 pt-24 pb-20 md:pt-36 md:pb-28 overflow-hidden">
            <meta itemProp="name" content="Siftl" />
            <meta itemProp="applicationCategory" content="BusinessApplication" />
            <div className="max-w-6xl mx-auto text-center relative z-10 space-y-6 md:space-y-10">
                <div className="flex flex-col items-center justify-center">
                    <motion.h1
                        itemProp="headline"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="text-5xl md:text-7xl lg:text-8xl font-serif text-black leading-[1.1] mb-8 tracking-tight"
                    >
                        Know more. <br className="hidden md:block" /> Read less.
                    </motion.h1>
                    
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="text-lg md:text-xl text-gray-600 mb-10 leading-relaxed max-w-2xl font-sans" itemProp="description">
                        Stop the manual scroll. Siftl distills your favorite newsletters, podcasts, and YouTube channels into a single briefing, delivered exactly on your schedule.
                    </motion.p>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="flex flex-col md:flex-row items-center justify-center gap-6 mt-4 md:mt-2"
                >
                    <button
                        onClick={triggerLogin}
                        className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 text-base sm:text-lg font-medium text-white bg-[#1A1A1A] hover:bg-[#2A2A2A] rounded-full transition-all duration-300 shadow-xl shadow-black/10 hover:shadow-2xl hover:shadow-black/20 w-full sm:w-auto overflow-hidden cursor-pointer z-30 transform hover:-translate-y-0.5"
                    >
                        <span className="relative z-20 pointer-events-none">Start for Free</span>
                        <ArrowRight className="w-5 h-5 ml-1 transition-transform group-hover:translate-x-1 opacity-50 pointer-events-none" />
                    </button>
                    <button
                        onClick={() => document.getElementById('demo-section')?.scrollIntoView({ behavior: 'smooth' })}
                        className="text-sm sm:text-base text-[#4A4A4A] hover:text-[#1A1A1A] font-medium transform hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
                    >
                        See how it works ↓
                    </button>
                </motion.div>

                {/* 3D Digest Card Visual */}
                <motion.div
                    style={{ y }}
                    initial={{ opacity: 0, rotateX: 20, y: 50 }}
                    animate={{ opacity: 1, rotateX: 0, y: 0 }}
                    transition={{ duration: 1, delay: 0.6, type: "spring" }}
                    className="mt-12 md:mt-20 relative w-full max-w-[90vw] md:max-w-3xl mx-auto perspective-1000"
                >
                    <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transform transition-transform hover:scale-[1.02] duration-500">
                        {/* Mock Browser Header */}
                        <div className="h-8 bg-gray-50 border-b border-gray-100 flex items-center px-4 gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-400"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                            <div className="w-3 h-3 rounded-full bg-green-400"></div>
                        </div>
                        {/* Mock Email Body */}
                        <div className="p-6 md:p-12 text-left space-y-6">
                            <div className="flex justify-between items-baseline border-b border-black pb-4 md:pb-6">
                                <h3 className="font-serif text-2xl md:text-3xl tracking-tight text-[#1A1A1A]">Siftl.</h3>
                                <div className="hidden md:block font-mono text-xs text-gray-400 uppercase tracking-widest">Daily Briefing</div>
                            </div>
                            <div className="space-y-3 md:space-y-4">
                                <div className="h-3 md:h-4 bg-gray-100 rounded w-3/4"></div>
                                <div className="h-3 md:h-4 bg-gray-100 rounded w-full"></div>
                                <div className="h-3 md:h-4 bg-gray-100 rounded w-5/6"></div>
                            </div>
                            <div className="p-4 md:p-6 bg-[#FDFBF7] rounded-lg border border-gray-100 text-sm md:text-base text-gray-600 font-serif">
                                "5 minutes. That's all it takes to know everything I need to."
                            </div>
                        </div>
                    </div>
                    {/* Shadow behind card */}
                    <div className="absolute -inset-4 bg-black/5 blur-3xl -z-10 rounded-full"></div>
                </motion.div>
            </div>
        </section>
    );
}
