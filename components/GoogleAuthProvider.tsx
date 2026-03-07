'use client';

import { useEffect } from 'react';
import Script from 'next/script';
import { usePathname, useRouter } from 'next/navigation';

/**
 * Loaded once at the root layout level.
 * Provides the Google Identity Services (GSI) button + callback
 * globally on every public page, so any "Log in" button anywhere on
 * the site can call:
 *   document.querySelector('[role="button"]').click()
 * to open the Google sign-in popup — exactly what the CTA section does.
 *
 * On authenticated pages this component still renders but is invisible
 * and harmless (it's off-screen).
 */
export default function GoogleAuthProvider() {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        (window as any).handleGoogleCredentialResponse = async (response: any) => {
            try {
                const res = await fetch('/api/auth/google', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ credential: response.credential }),
                });

                if (res.ok) {
                    // Hard redirect — reliably sets cookies across middleware
                    window.location.href = '/';
                } else {
                    const data = await res.json();
                    alert(data.error || 'Login failed. Please try again.');
                }
            } catch {
                alert('Connection error. Please try again.');
            }
        };
    }, []);

    return (
        <>
            <Script src="https://accounts.google.com/gsi/client" strategy="lazyOnload" />

            {/* Hidden-but-rendered Google button.
                GSI reads data-client_id and renders a real clickable [role="button"]
                inside the g_id_signin div even when the parent is display:none. */}
            <div className="hidden" aria-hidden="true">
                <div
                    id="g_id_onload"
                    data-client_id={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}
                    data-context="signin"
                    data-ux_mode="popup"
                    data-callback="handleGoogleCredentialResponse"
                    data-auto_prompt="false"
                />
                <div className="g_id_signin" data-type="standard" />
            </div>
        </>
    );
}
