'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Hero from '@/components/landing/Hero';
import Manifesto from '@/components/landing/Manifesto';
import Features from '@/components/landing/Features';
import HowItWorks from '@/components/landing/HowItWorks';
import InteractiveDemo from '@/components/landing/InteractiveDemo';
import Footer from '@/components/Footer';

export default function LoginClient() {
    const [error, setError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const handleGoogleCallback = async (response: any) => {
        setIsLoggingIn(true);
        setError('');
        try {
            const res = await fetch('/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential: response.credential }),
            });

            if (res.ok) {
                // Hard redirect is much more reliable for cookie persistence in Next.js Middleware/RSC
                window.location.href = '/';
            } else {
                const data = await res.json();
                setError(data.error || 'Login failed. Please try again.');
                setIsLoggingIn(false);
            }
        } catch (err) {
            setError('Connection error. Please try again.');
            setIsLoggingIn(false);
        }
    };

    useEffect(() => {
        (window as any).handleGoogleCredentialResponse = handleGoogleCallback;
    }, []);

    const triggerLogin = () => {
        if (isLoggingIn) return;
        const googleButton = document.querySelector('[role="button"]') as HTMLElement;
        if (googleButton) googleButton.click();
    };

    return (
        <main className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A] font-sans selection:bg-gray-200 overflow-x-hidden">
            <Script src="https://accounts.google.com/gsi/client" strategy="lazyOnload" />

            {/* Hidden Google Button for Functionality */}
            <div className="hidden">
                <div
                    id="g_id_onload"
                    data-client_id={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}
                    data-context="signin"
                    data-ux_mode="popup"
                    data-callback="handleGoogleCredentialResponse"
                    data-auto_prompt="false"
                ></div>
                <div className="g_id_signin" data-type="standard"></div>
            </div>

            {/* Navbar (Minimal) */}
            <nav className="fixed top-0 w-full p-6 md:p-8 flex justify-between items-center z-50 bg-[#FDFBF7]/80 backdrop-blur-sm">
                <span className="font-bold text-xl tracking-tight text-[#1A1A1A]">Signal.</span>
                <button
                    onClick={triggerLogin}
                    disabled={isLoggingIn}
                    className="text-sm font-medium text-gray-600 hover:text-black transition-colors cursor-pointer disabled:opacity-50"
                >
                    {isLoggingIn ? 'Authenticating...' : 'Log in'}
                </button>
            </nav>

            <Hero />
            <InteractiveDemo />
            <HowItWorks />
            <Features />
            <Manifesto />

            {/* The Banger Final CTA & Footer Wrapper (Exactly 100vh minus Header) */}
            <div className="flex flex-col h-[calc(100vh-76px)] md:h-[calc(100vh-92px)] bg-[#1A1A1A]">
                <section className="flex-1 flex flex-col items-center justify-center px-6 text-center relative overflow-hidden text-white border-b border-[#2A2A2A]">
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

                            <h2 className="text-4xl sm:text-5xl md:text-7xl lg:text-[80px] font-semibold text-white tracking-tighter leading-[1.05]">
                                Your briefing is ready<br className="hidden sm:block" />
                                <span className="font-serif italic font-medium text-[#FF5700] block sm:inline"> tomorrow.</span>
                            </h2>

                            <p className="text-lg sm:text-xl md:text-2xl text-gray-400 font-medium leading-relaxed px-2">
                                Sign up in 10 seconds. Your first briefing arrives tomorrow.
                            </p>

                            {error && (
                                <p className="text-red-500 font-medium text-sm">{error}</p>
                            )}

                            <div className="pt-6 md:pt-8 w-full flex flex-col items-center">
                                <button
                                    onClick={triggerLogin}
                                    disabled={isLoggingIn}
                                    className="group/btn relative inline-flex items-center justify-center gap-3 px-8 sm:px-10 py-4 sm:py-5 text-base sm:text-lg font-medium text-[#1A1A1A] bg-white hover:bg-gray-100 rounded-full transition-all duration-300 shadow-xl shadow-white/10 w-full sm:w-auto overflow-hidden cursor-pointer z-30 transform hover:-translate-y-0.5 disabled:opacity-80 disabled:cursor-not-allowed"
                                >
                                    {isLoggingIn ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin opacity-50" />
                                            <span>Authenticating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="relative z-20 pointer-events-none">Start for Free</span>
                                            <ArrowRight className="w-5 h-5 ml-1 transition-transform group-hover/btn:translate-x-1 opacity-50 pointer-events-none" />
                                        </>
                                    )}
                                </button>
                                <p className="mt-4 md:mt-6 text-xs sm:text-sm font-medium tracking-wide text-gray-500 uppercase">No credit card required</p>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Footer */}
                <Footer />
            </div>
        </main>
    );
}
