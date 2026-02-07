'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';

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
        // Initialize Google Button
        // We use a global callback because the script expects a string name function
        (window as any).handleGoogleCredentialResponse = handleGoogleCallback;
    }, []);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFBF7] text-[#1A1A1A] font-sans px-6">
            <Script src="https://accounts.google.com/gsi/client" strategy="lazyOnload" />

            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-10 text-center">
                <div className="mb-8">
                    <h1 className="text-4xl font-serif font-bold mb-2">Welcome Back.</h1>
                    <p className="text-gray-500">Sign in to manage your daily briefing.</p>
                </div>

                {error && (
                    <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                        {error}
                    </div>
                )}

                <div className="flex justify-center">
                    <div
                        id="g_id_onload"
                        data-client_id={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}
                        data-context="signin"
                        data-ux_mode="popup"
                        data-callback="handleGoogleCredentialResponse"
                        data-auto_prompt="false"
                    ></div>

                    <div
                        className="g_id_signin"
                        data-type="standard"
                        data-shape="pill"
                        data-theme="outline"
                        data-text="continue_with"
                        data-size="large"
                        data-logo_alignment="left"
                    ></div>
                </div>

                <div className="mt-8 pt-8 border-t border-gray-100">
                    <p className="text-xs text-gray-400">
                        By continuing, you agree to our Terms of Service and Privacy Policy.
                    </p>
                </div>
            </div>
        </div>
    );
}
