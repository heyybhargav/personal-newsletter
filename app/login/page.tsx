'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { ArrowRight } from 'lucide-react';
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

            {/* Final CTA */}
            <section className="py-24 px-6 text-center border-t border-gray-100">
                <div className="max-w-xl mx-auto space-y-8">
                    <h2 className="text-4xl md:text-5xl font-bold text-[#1A1A1A]">
                        Ready to own your signal?
                    </h2>
                    <p className="text-lg text-gray-500 font-light leading-relaxed">
                        Signal synthesizes the internet into one calm, digestible briefing. Delivered to your inbox, on your schedule.
                    </p>
                    <div className="pt-8 space-y-4">
                        <button
                            onClick={triggerLogin}
                            className="group relative inline-flex items-center justify-center gap-3 px-10 py-5 text-lg font-medium text-white bg-[#111111] rounded-full transition-all duration-300 shadow-xl shadow-black/5 overflow-hidden cursor-pointer z-30"
                        >
                            {/* Shimmer Effect */}
                            <div className="absolute inset-0 -translate-x-[100%] group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent z-10 pointer-events-none" />

                            {/* Google Logo */}
                            <svg className="w-5 h-5 pointer-events-none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>

                            <span className="relative z-20 pointer-events-none">Continue with Google</span>
                            <ArrowRight className="w-5 h-5 ml-1 transition-transform group-hover:translate-x-1 opacity-50 pointer-events-none" />
                        </button>
                        <p className="text-sm text-gray-400 font-medium tracking-wide">NO CREDIT CARD REQUIRED</p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <Footer />
        </main>
    );
}
