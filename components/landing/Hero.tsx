'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function Hero() {
    const triggerLogin = () => {
        const googleButton = document.querySelector('[role="button"]') as HTMLElement;
        if (googleButton) googleButton.click();
    };

    return (
        <section className="min-h-[85vh] flex flex-col items-center justify-center px-6 pt-20 pb-16">
            <div className="max-w-4xl mx-auto text-center space-y-8">
                <div className="space-y-2">
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="text-6xl md:text-8xl lg:text-9xl font-semibold tracking-tighter text-[#111111] leading-[0.95]"
                    >
                        The internet is exhausting.
                    </motion.h1>

                    <motion.h2
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                        className="text-5xl md:text-7xl lg:text-8xl font-medium tracking-tighter text-[#888888] leading-[1]"
                    >
                        This isn't.
                    </motion.h2>
                </div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="text-lg md:text-xl text-[#666666] leading-relaxed max-w-lg mx-auto font-medium"
                >
                    Your personal AI editor synthesizes the internet into one calm, digestible briefing. Delivered to your inbox every morning.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="pt-8 space-y-4"
                >
                    <button
                        onClick={triggerLogin}
                        className="group inline-flex items-center justify-center px-10 py-5 text-lg font-medium text-white bg-[#111111] rounded-full hover:scale-105 transition-all duration-300 shadow-xl shadow-black/5"
                    >
                        Get Started
                        <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                    </button>
                    <p className="text-sm text-gray-400 font-medium tracking-wide">NO CREDIT CARD REQUIRED</p>
                </motion.div>
            </div>
        </section>
    );
}
