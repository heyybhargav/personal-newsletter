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
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-semibold tracking-tighter text-[#1A1A1A] leading-[0.95] mb-2"
                    >
                        The internet is exhausting.
                    </motion.h1>

                    <motion.h2
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                        className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-medium tracking-tighter text-[#888888] leading-[1] italic font-serif"
                    >
                        This isn't.
                    </motion.h2>
                </div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="text-lg md:text-2xl text-[#4A4A4A] leading-relaxed max-w-lg mx-auto font-medium px-4"
                >
                    We read the internet so you don't have to.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="flex flex-col md:flex-row items-center justify-center gap-6"
                >
                    <button
                        onClick={triggerLogin}
                        className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 text-lg font-medium text-white bg-[#1A1A1A] rounded-full hover:scale-105 transition-all duration-300 shadow-xl shadow-black/10 w-full md:w-auto overflow-hidden"
                    >
                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 -translate-x-[100%] group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent z-10" />

                        {/* Google Logo */}
                        <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>

                        <span className="relative z-20">Continue with Google</span>
                        <ArrowRight className="w-5 h-5 ml-1 transition-transform group-hover:translate-x-1 opacity-50" />
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
                                <h3 className="font-serif text-2xl md:text-3xl font-bold">Signal.</h3>
                                <div className="hidden md:block font-mono text-xs text-gray-400 uppercase tracking-widest">Daily Briefing</div>
                            </div>
                            <div className="space-y-3 md:space-y-4">
                                <div className="h-3 md:h-4 bg-gray-100 rounded w-3/4"></div>
                                <div className="h-3 md:h-4 bg-gray-100 rounded w-full"></div>
                                <div className="h-3 md:h-4 bg-gray-100 rounded w-5/6"></div>
                            </div>
                            <div className="p-4 md:p-6 bg-[#FDFBF7] rounded-lg border border-gray-100 italic text-sm md:text-base text-gray-600 font-serif">
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
