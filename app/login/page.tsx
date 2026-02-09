'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { ArrowRight } from 'lucide-react';
import Hero from '@/components/landing/Hero';
import AntiList from '@/components/landing/AntiList';
import Manifesto from '@/components/landing/Manifesto';
import Features from '@/components/landing/Features';

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
                    className="text-sm font-medium text-gray-600 hover:text-black transition-colors"
                >
                    Log in
                </button>
            </nav>

            <Hero />
            <AntiList />
            <Manifesto />
            <Features />

            {/* Final CTA */}
            <section className="py-24 px-6 text-center border-t border-gray-100">
                <div className="max-w-xl mx-auto space-y-8">
                    <h2 className="text-4xl md:text-5xl font-bold text-[#1A1A1A]">
                        Ready to own your morning?
                    </h2>
                    <p className="text-lg text-gray-500 font-light leading-relaxed">
                        Signal synthesizes the internet into one calm, digestible briefing. Delivered to your inbox every morning.
                    </p>
                    <div className="pt-8 space-y-4">
                        <button
                            onClick={triggerLogin}
                            className="group inline-flex items-center justify-center px-10 py-5 text-lg font-medium text-white bg-[#111111] rounded-full hover:scale-105 transition-all duration-300 shadow-xl shadow-black/5"
                        >
                            Get Started
                            <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                        </button>
                        <p className="text-sm text-gray-400 font-medium tracking-wide">NO CREDIT CARD REQUIRED</p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 text-center pb-20">
                <p className="text-base text-[#666666] font-medium flex items-center justify-center gap-2">
                    Built with <span className="text-red-500 animate-pulse">❤️</span> by <a href="https://twitter.com/heyybhargav" target="_blank" className="text-[#1A1A1A] font-bold underline decoration-2 underline-offset-4 decoration-gray-200 hover:decoration-[#1A1A1A] transition-all">Bhargav</a>
                </p>
            </footer>
        </main>
    );
}
