'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import Link from 'next/link';
import { ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SignInClient() {
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
                window.location.href = '/';
            } else {
                const data = await res.json();
                setError(data.error || 'Login failed. Please try again.');
                setIsLoggingIn(false);
            }
        } catch {
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
        <main className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A] font-sans flex flex-col">
            <Script src="https://accounts.google.com/gsi/client" strategy="lazyOnload" />

            {/* Hidden Google auth widget */}
            <div className="hidden">
                <div
                    id="g_id_onload"
                    data-client_id={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}
                    data-context="signin"
                    data-ux_mode="popup"
                    data-callback="handleGoogleCredentialResponse"
                    data-auto_prompt="true"
                />
                <div className="g_id_signin" data-type="standard" />
            </div>

            {/* Minimal nav */}
            <nav className="w-full px-8 h-[64px] flex items-center justify-between border-b border-gray-100">
                <Link href="/login" className="font-bold text-xl tracking-tight text-[#1A1A1A]">
                    Signal.
                </Link>
                <Link href="/login" className="text-sm text-gray-400 hover:text-black transition-colors">
                    ← Back to home
                </Link>
            </nav>

            {/* Centred sign-in card */}
            <div className="flex-1 flex items-center justify-center px-6 py-16">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full max-w-sm text-center"
                >
                    <p className="text-[10px] font-bold tracking-[0.3em] text-[#FF5700] uppercase mb-6">
                        Signal
                    </p>
                    <h1 className="text-3xl md:text-4xl font-serif font-medium tracking-tight text-[#1A1A1A] leading-snug mb-3">
                        Your briefing<br />starts here.
                    </h1>
                    <p className="text-gray-400 text-sm mb-12 leading-relaxed">
                        Sign in with Google to set up your personalised daily briefing.
                        No credit card required.
                    </p>

                    {error && (
                        <p className="text-red-500 text-sm font-medium mb-6">{error}</p>
                    )}

                    <button
                        onClick={triggerLogin}
                        disabled={isLoggingIn}
                        className="w-full inline-flex items-center justify-center gap-3 px-8 py-4 text-base font-medium text-[#1A1A1A] bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isLoggingIn ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin opacity-50" />
                                <span>Authenticating…</span>
                            </>
                        ) : (
                            <>
                                {/* Google G icon */}
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
                                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.185l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
                                    <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05" />
                                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
                                </svg>
                                <span>Continue with Google</span>
                                <ArrowRight className="w-4 h-4 opacity-40 ml-auto" />
                            </>
                        )}
                    </button>

                    <p className="mt-8 text-xs text-gray-300">
                        By signing in, you agree to our{' '}
                        <a href="mailto:editor@signaldaily.me" className="underline hover:text-gray-500 transition-colors">terms</a>.
                    </p>
                </motion.div>
            </div>
        </main>
    );
}
