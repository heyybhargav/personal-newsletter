'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X, Menu, Loader2 } from 'lucide-react';
import { CONTACT_EMAIL } from '@/lib/config';

interface PublicNavProps {
    onLogin?: () => void;
    isLoggingIn?: boolean;
}

const NAV_LINKS = [
    { label: 'Blog', href: '/blog' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Contact', href: `mailto:${CONTACT_EMAIL}` },
];

export default function PublicNav({ onLogin, isLoggingIn }: PublicNavProps) {
    const [open, setOpen] = useState(false);

    const handleLogin = () => {
        if (onLogin) {
            onLogin();
        } else {
            // The global GoogleAuthProvider (in layout) has already rendered the GSI button.
            // Click it exactly the same way the landing page CTA does.
            const googleButton = document.querySelector('[role="button"]') as HTMLElement;
            if (googleButton) googleButton.click();
        }
    };

    return (
        <>
            <nav className="fixed top-0 w-full px-6 md:px-10 h-[64px] flex justify-between items-center z-50 bg-[#FDFBF7]/90 backdrop-blur-sm border-b border-gray-100/50">
                {/* Logo */}
                <Link href="/login" className="font-serif font-bold text-xl tracking-tight text-[#1A1A1A] shrink-0">
                    Signal.
                </Link>

                {/* Desktop links */}
                <div className="hidden md:flex items-center gap-7">
                    {NAV_LINKS.map(link => (
                        <a
                            key={link.href}
                            href={link.href}
                            className="text-sm font-medium text-gray-500 hover:text-[#1A1A1A] transition-colors"
                        >
                            {link.label}
                        </a>
                    ))}

                    <button
                        onClick={handleLogin}
                        disabled={isLoggingIn}
                        className="text-sm font-semibold text-[#1A1A1A] hover:text-[#FF5700] transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                        {isLoggingIn && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        {isLoggingIn ? 'Signing in…' : 'Log in'}
                    </button>
                </div>

                {/* Mobile hamburger */}
                <button
                    className="md:hidden p-1 text-[#1A1A1A]"
                    aria-label="Toggle menu"
                    onClick={() => setOpen(prev => !prev)}
                >
                    {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </nav>

            {/* Mobile dropdown */}
            {open && (
                <div
                    className="fixed inset-0 z-40 bg-[#FDFBF7] flex flex-col pt-[64px]"
                    onClick={() => setOpen(false)}
                >
                    <div className="flex flex-col divide-y divide-gray-100 px-6">
                        {NAV_LINKS.map(link => (
                            <a
                                key={link.href}
                                href={link.href}
                                className="py-5 text-lg font-medium text-[#1A1A1A] hover:text-[#FF5700] transition-colors"
                            >
                                {link.label}
                            </a>
                        ))}

                        <button
                            onClick={() => { setOpen(false); handleLogin(); }}
                            disabled={isLoggingIn}
                            className="py-5 text-left text-lg font-semibold text-[#1A1A1A] hover:text-[#FF5700] transition-colors disabled:opacity-50"
                        >
                            {isLoggingIn ? 'Signing in…' : 'Log in'}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
