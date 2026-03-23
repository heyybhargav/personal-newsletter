'use client';

import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Hero from '@/components/landing/Hero';
import WhatIsSiftl from '@/components/landing/WhatIsSiftl';
import Manifesto from '@/components/landing/Manifesto';
import Features from '@/components/landing/Features';
import HowItWorks from '@/components/landing/HowItWorks';
import InteractiveDemo from '@/components/landing/InteractiveDemo';
import Footer from '@/components/Footer';
import PublicNav from '@/components/PublicNav';

export default function LoginClient() {
    const triggerLogin = () => {
        const googleButton = document.querySelector('[role="button"]') as HTMLElement;
        if (googleButton) googleButton.click();
    };

    return (
        <main className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A] font-sans selection:bg-gray-200 overflow-x-hidden">

            <PublicNav onLogin={triggerLogin} />

            <Hero />
            <WhatIsSiftl />
            <InteractiveDemo />
            <HowItWorks />
            <Features />
            <Manifesto />

            {/* The Banger Final CTA & Footer Wrapper (Exactly 100vh minus Header) */}
            <div id="cta" className="flex flex-col min-h-[calc(100vh-76px)] md:min-h-[calc(100vh-92px)] bg-[#1A1A1A]">
                <section className="flex-1 flex flex-col items-center justify-center px-6 text-center relative overflow-hidden text-white">
                    <div className="max-w-3xl mx-auto relative z-10 w-full py-16 md:py-24">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="space-y-8 md:space-y-10"
                        >
                            <div className="inline-flex items-center justify-center gap-3 px-4 py-2 rounded-full border border-gray-800 bg-white/5 mx-auto">
                                <span className="text-[10px] sm:text-xs font-bold tracking-[0.2em] text-[#FF5700] uppercase">
                                    Get Started
                                </span>
                            </div>

                            <h2 className="text-4xl sm:text-5xl md:text-7xl lg:text-[80px] font-serif font-normal text-white tracking-tighter leading-[1.05]">
                                Know more.<br className="hidden sm:block" />
                                <span className="text-[#FF5700] block sm:inline"> Consume less.</span>
                            </h2>

                            <p className="text-lg sm:text-xl md:text-2xl text-gray-400 font-medium leading-relaxed px-2">
                                We go through the stuff for you. Sign up and set up your sources in 10 seconds to get your first briefing tomorrow.
                            </p>

                            <div className="pt-6 md:pt-8 w-full flex flex-col items-center">
                                <button
                                    onClick={triggerLogin}
                                    className="group/btn relative inline-flex items-center justify-center gap-3 px-8 sm:px-10 py-4 sm:py-5 text-base sm:text-lg font-medium text-[#1A1A1A] bg-white hover:bg-gray-100 rounded-full transition-all duration-300 shadow-xl shadow-white/10 w-full sm:w-auto overflow-hidden cursor-pointer z-30 transform hover:-translate-y-0.5"
                                >
                                    <span className="relative z-20 pointer-events-none">Start for Free</span>
                                    <ArrowRight className="w-5 h-5 ml-1 transition-transform group-hover/btn:translate-x-1 opacity-50 pointer-events-none" />
                                </button>
                                <p className="mt-4 md:mt-6 text-xs sm:text-sm font-medium tracking-wide text-gray-500 uppercase">No credit card required</p>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Footer */}
                <Footer hideBorder={true} transparentBg={true} />
            </div>
        </main>
    );
}
