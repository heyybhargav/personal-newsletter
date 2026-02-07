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
            <HowItWorks />

            {/* Final CTA */}
            <section className="py-24 px-6 text-center border-t border-gray-100">
                <button
                    onClick={triggerLogin}
                    className="group inline-flex items-center justify-center px-10 py-5 font-medium text-white bg-[#1A1A1A] rounded-full hover:bg-black transition-colors text-lg"
                >
                    Get Started
                    <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                </button>
                <p className="mt-4 text-sm text-gray-400">Free during beta. No credit card.</p>
            </section>

            {/* Footer */}
            <footer className="py-12 text-center border-t border-gray-100">
                <p className="text-sm text-gray-400">
                    Built with love by Bhargav
                </p>
            </footer>
        </main>
    );
}
