'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Hero from '@/components/landing/Hero';
import AntiList from '@/components/landing/AntiList';
import Manifesto from '@/components/landing/Manifesto';
import Features from '@/components/landing/Features';
import HowItWorks from '@/components/landing/HowItWorks';
import Footer from '@/components/Footer';

export default function LoginPage() {
    const router = useRouter();
    const [error, setError] = useState('');

    const handleGoogleCallback = async (response: any) => {
        try {
            const res = await fetch('/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential: response.credential }),
            });

            if (res.ok) {
                router.push('/');
                router.refresh();
            } else {
                setError('Login failed. Please try again.');
            }
        } catch (err) {
            setError('Connection error. Please try again.');
        }
    };

    useEffect(() => {
        (window as any).handleGoogleCredentialResponse = handleGoogleCallback;
    }, []);

    const triggerLogin = () => {
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
                    className="text-sm font-medium text-gray-600 hover:text-black transition-colors cursor-pointer"
                >
                    Log in
                </button>
            </nav>

            <Hero />
            <AntiList />
            <HowItWorks />
            <Manifesto />
            <Features />

            {/* The Banger Final CTA (Editorial & Elegant) */}
            <section className="py-32 md:py-40 px-6 bg-[#FDFBF7] relative overflow-hidden">
                <div className="max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="relative bg-white rounded-3xl md:rounded-[3rem] p-8 sm:p-12 md:p-24 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 overflow-hidden group"
                    >
                        {/* Hover Gradient Aura */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#FF5700]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

                        <div className="relative z-10 max-w-3xl mx-auto space-y-8 md:space-y-10">
                            <div className="inline-flex items-center justify-center gap-3 px-4 py-2 rounded-full bg-gray-50 border border-gray-100 mx-auto">
                                <div className="w-2 h-2 rounded-full bg-[#FF5700] animate-pulse"></div>
                                <span className="text-[10px] sm:text-xs font-bold tracking-widest text-[#FF5700] uppercase">Signal is ready</span>
                            </div>

                            <h2 className="text-4xl sm:text-5xl md:text-7xl lg:text-[80px] font-serif font-medium text-[#1A1A1A] tracking-tighter leading-[1.05]">
                                Stop scrolling.<br className="hidden sm:block" />
                                <span className="italic text-gray-400 block sm:inline"> Start reading.</span>
                            </h2>

                            <p className="text-lg sm:text-xl md:text-2xl text-gray-500 font-serif leading-relaxed px-2">
                                Get your customized briefing delivered tomorrow morning. One clean email. Zero ads.
                            </p>

                            <div className="pt-6 md:pt-8 w-full">
                                <button
                                    onClick={triggerLogin}
                                    className="group relative inline-flex items-center justify-center gap-3 px-6 sm:px-8 py-4 text-base sm:text-lg font-medium text-white bg-[#1A1A1A] rounded-full transition-all duration-300 shadow-xl shadow-black/10 w-full sm:w-auto overflow-hidden cursor-pointer z-30"
                                >
                                    {/* Shimmer Effect */}
                                    <div className="absolute inset-0 -translate-x-[100%] group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent z-10 pointer-events-none" />

                                    <span className="relative z-20 pointer-events-none">Setup your Briefing</span>
                                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-1 transition-transform group-hover:translate-x-1 opacity-50 pointer-events-none" />
                                </button>
                                <p className="mt-4 md:mt-6 text-xs sm:text-sm font-medium tracking-wide text-gray-400 uppercase">Takes 10 seconds</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <Footer />
        </main>
    );
}
