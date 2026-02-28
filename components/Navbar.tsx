'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Navbar({
    initialUser,
    tier = 'active',
    trialDaysRemaining = 0
}: {
    initialUser: { email: string } | null,
    tier?: string,
    trialDaysRemaining?: number
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [user, setUser] = useState<{ email: string } | null>(initialUser);

    // Check auth on mount and path change
    useEffect(() => {
        fetch('/api/auth/me')
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data?.user) setUser(data.user);
            })
            .catch(() => setUser(null));
    }, [pathname]);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        setUser(null);
        router.push('/login');
        router.refresh();
    };

    const isActive = (path: string) => pathname === path;

    const navLinks = [
        { name: 'Home', path: '/' },
        { name: 'Archive', path: '/archive' },
        { name: 'Sources', path: '/sources' },
        { name: 'Settings', path: '/settings' },
    ];

    // Hide Navbar on login page
    if (pathname === '/login') return null;

    return (
        <div className="sticky top-0 z-40 shadow-sm">
            <nav className="bg-[#FDFBF7] border-b border-gray-200/50 backdrop-blur-md relative z-20">
                <div className="max-w-5xl mx-auto px-6 lg:px-8">
                    <div className="flex justify-between h-20">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 flex items-center">
                                <Link href="/">
                                    <span className="font-serif font-bold text-2xl tracking-tight text-[#1A1A1A]">Signal.</span>
                                </Link>
                            </div>
                            <div className="hidden sm:ml-12 sm:flex sm:space-x-8">
                                {user && navLinks.map((link) => (
                                    <Link
                                        key={link.path}
                                        href={link.path}
                                        className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium h-full transition-colors cursor-pointer ${isActive(link.path)
                                            ? 'border-black text-gray-900'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                            }`}
                                    >
                                        {link.name}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <div className="hidden sm:ml-6 sm:flex sm:items-center">
                            {user ? (
                                <div className="flex items-center gap-4">
                                    <span className="text-sm text-gray-500 hidden lg:block">{user.email}</span>
                                    <button
                                        onClick={handleLogout}
                                        className="text-sm font-medium text-gray-500 hover:text-black transition-colors cursor-pointer"
                                    >
                                        Logout
                                    </button>
                                </div>
                            ) : (
                                <div className="w-24 h-6 animate-pulse bg-gray-200/50 rounded-md"></div>
                            )}
                        </div>

                        {/* Mobile menu button */}
                        <div className="-mr-2 flex items-center sm:hidden">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                type="button"
                                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-black"
                                aria-controls="mobile-menu"
                                aria-expanded="false"
                            >
                                <span className="sr-only">Open main menu</span>
                                {!isMenuOpen ? (
                                    <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                ) : (
                                    <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile menu */}
                {isMenuOpen && (
                    <div className="sm:hidden" id="mobile-menu">
                        <div className="pt-2 pb-3 space-y-1 border-t border-gray-200">
                            {user ? (
                                <>
                                    {navLinks.map((link) => (
                                        <Link
                                            key={link.path}
                                            href={link.path}
                                            onClick={() => setIsMenuOpen(false)}
                                            className={`block pl-3 pr-4 py-3 border-l-4 text-base font-medium ${isActive(link.path)
                                                ? 'bg-gray-50 border-black text-black'
                                                : 'border-transparent text-gray-500 hover:bg-gray-50 border-transparent hover:text-gray-700'
                                                }`}
                                        >
                                            {link.name}
                                        </Link>
                                    ))}
                                    <button
                                        onClick={() => {
                                            handleLogout();
                                            setIsMenuOpen(false);
                                        }}
                                        className="block w-full text-left pl-3 pr-4 py-3 border-l-4 border-transparent text-base font-medium text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
                                    >
                                        Logout ({user.email})
                                    </button>
                                </>
                            ) : (
                                <div className="px-4 py-3 text-sm text-gray-400 animate-pulse">Loading profile...</div>
                            )}
                        </div>
                    </div>
                )}
            </nav>

            {/* Server-rendered Banner (No Layout Shift) */}
            {pathname !== '/subscribe' && (
                <div className="relative z-10">
                    {tier === 'trial' && (
                        <div className="bg-[#FFF8F0] border-b border-[#FFE0C0] text-center px-4 py-3 sm:py-2 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 shadow-sm">
                            <span className="text-[13px] font-medium text-[#B45309]">
                                📡 Free trial: <strong>{trialDaysRemaining} day{trialDaysRemaining === 1 ? '' : 's'} remaining</strong>
                            </span>
                            <Link href="/subscribe" className="text-[13px] font-bold text-[#FF5700] hover:text-[#E64600] inline-flex items-center gap-1 bg-white/50 px-3 py-1 rounded-full transition-colors border border-[#FFE0C0]/50 hover:border-[#FF5700]/30 shadow-sm hover:shadow">
                                Subscribe now <span aria-hidden="true">&rarr;</span>
                            </Link>
                        </div>
                    )}

                    {tier === 'expired' && (
                        <div className="bg-[#1A1A1A] border-b border-[#FF5700]/20 text-center px-4 py-3 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 shadow-[0_4px_20px_-10px_rgba(255,87,0,0.3)] overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#FF5700]/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out"></div>

                            <span className="text-[13px] font-medium text-gray-300 relative z-10">
                                <strong className="text-white">Trial Expired:</strong> Your daily intelligence briefings are paused.
                            </span>
                            <Link href="/subscribe" className="text-[12px] font-bold tracking-widest uppercase text-white hover:text-white inline-flex items-center gap-2 bg-[#FF5700] hover:bg-[#E64600] px-4 py-1.5 rounded-full transition-all relative z-10">
                                Activate Pro <span aria-hidden="true">&rarr;</span>
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
