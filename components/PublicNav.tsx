'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X, Menu } from 'lucide-react';

interface PublicNavProps {
    /** When true, "Log in" runs the Google OAuth flow on the page itself (landing page). 
     *  When false (default), it links to /login */
    onLogin?: () => void;
    isLoggingIn?: boolean;
}

const NAV_LINKS = [
    { label: 'Blog', href: '/blog' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Contact', href: 'mailto:editor@signaldaily.me' },
];

export default function PublicNav({ onLogin, isLoggingIn }: PublicNavProps) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <nav className="fixed top-0 w-full px-6 md:px-10 h-[64px] flex justify-between items-center z-50 bg-[#FDFBF7]/90 backdrop-blur-sm border-b border-gray-100/50">
                {/* Logo */}
                <Link href="/" className="font-bold text-xl tracking-tight text-[#1A1A1A] shrink-0">
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

                    {/* Login — either triggers Google flow or navigates */}
                    {onLogin ? (
                        <button
                            onClick={onLogin}
                            disabled={isLoggingIn}
                            className="text-sm font-semibold text-[#1A1A1A] hover:text-[#FF5700] transition-colors cursor-pointer disabled:opacity-50"
                        >
                            {isLoggingIn ? 'Authenticating…' : 'Log in'}
                        </button>
                    ) : (
                        <Link
                            href="/login"
                            className="text-sm font-semibold text-[#1A1A1A] hover:text-[#FF5700] transition-colors"
                        >
                            Log in
                        </Link>
                    )}
                </div>

                {/* Mobile hamburger button */}
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

                        {onLogin ? (
                            <button
                                onClick={onLogin}
                                disabled={isLoggingIn}
                                className="py-5 text-left text-lg font-semibold text-[#1A1A1A] hover:text-[#FF5700] transition-colors disabled:opacity-50"
                            >
                                {isLoggingIn ? 'Authenticating…' : 'Log in'}
                            </button>
                        ) : (
                            <Link
                                href="/login"
                                className="py-5 text-lg font-semibold text-[#1A1A1A] hover:text-[#FF5700] transition-colors"
                            >
                                Log in
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
