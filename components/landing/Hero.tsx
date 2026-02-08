'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Mail } from 'lucide-react';
import { useRef } from 'react';

export default function Hero() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollY } = useScroll();
    const y = useTransform(scrollY, [0, 500], [0, 200]);

    const triggerLogin = () => {
        const googleButton = document.querySelector('[role="button"]') as HTMLElement;
        if (googleButton) googleButton.click();
    };

    return (
        <section ref={containerRef} className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 pt-32 pb-24 overflow-hidden">

            {/* Mesh Gradient Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-gradient-to-r from-[#FF4F00]/20 to-[#FFE100]/20 rounded-full blur-[100px] animate-blob mix-blend-multiply opacity-70"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-gradient-to-r from-[#FF4F00]/20 to-[#FFE100]/20 rounded-full blur-[100px] animate-blob animation-delay-2000 mix-blend-multiply opacity-70"></div>
            </div>

            <div className="max-w-5xl mx-auto text-center space-y-12 relative z-10">
                <div className="space-y-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A1A1A]/5 border border-[#1A1A1A]/10 text-sm font-medium text-[#1A1A1A]/60 mb-4"
                    >
                        <span className="w-2 h-2 rounded-full bg-[#FF4F00]"></span>
                        v5.1 Now Live
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="text-6xl md:text-8xl lg:text-9xl font-semibold tracking-tighter text-[#1A1A1A] leading-[0.9]"
                    >
                        The internet is exhausting.
                    </motion.h1>

                    <motion.h2
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                        className="text-5xl md:text-7xl lg:text-8xl font-medium tracking-tighter text-[#888888] leading-[1] italic font-serif"
                    >
                        This isn't.
                    </motion.h2>
                </div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="text-xl md:text-2xl text-[#666666] leading-relaxed max-w-lg mx-auto font-medium"
                >
                    Your personal AI editor synthesizes the internet into one calm, digestible briefing.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="flex flex-col md:flex-row items-center justify-center gap-6"
                >
                    <button
                        onClick={triggerLogin}
                        className="group inline-flex items-center justify-center px-10 py-5 text-lg font-medium text-white bg-[#1A1A1A] rounded-full hover:scale-105 transition-all duration-300 shadow-xl shadow-black/10"
                    >
                        Get Started
                        <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                    </button>
                </motion.div>

                {/* 3D Digest Card Visual */}
                <motion.div
                    style={{ y }}
                    initial={{ opacity: 0, rotateX: 20, y: 100 }}
                    animate={{ opacity: 1, rotateX: 0, y: 0 }}
                    transition={{ duration: 1, delay: 0.6, type: "spring" }}
                    className="mt-20 relative max-w-3xl mx-auto perspective-1000"
                >
                    <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transform transition-transform hover:scale-[1.02] duration-500">
                        {/* Mock Browser Header */}
                        <div className="h-8 bg-gray-50 border-b border-gray-100 flex items-center px-4 gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-400"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                            <div className="w-3 h-3 rounded-full bg-green-400"></div>
                        </div>
                        {/* Mock Email Body */}
                        <div className="p-12 text-left space-y-6">
                            <div className="flex justify-between items-baseline border-b border-black pb-6">
                                <h3 className="font-serif text-3xl font-bold">Signal.</h3>
                                <span className="font-mono text-xs text-gray-400 uppercase tracking-widest">Daily Briefing</span>
                            </div>
                            <div className="space-y-4">
                                <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                                <div className="h-4 bg-gray-100 rounded w-full"></div>
                                <div className="h-4 bg-gray-100 rounded w-5/6"></div>
                            </div>
                            <div className="p-6 bg-[#FDFBF7] rounded-lg border border-gray-100 italic text-gray-600 font-serif">
                                "This is the only email I actually read."
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
