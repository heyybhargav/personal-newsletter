'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [user, setUser] = useState<{ email: string } | null>(null);

    // Check auth on mount
    useEffect(() => {
        fetch('/api/auth/me')
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data?.user) setUser(data.user);
            })
            .catch(() => setUser(null));
    }, []);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        setUser(null);
        router.push('/login');
        router.refresh();
    };

    const isActive = (path: string) => pathname === path;

    const navLinks = [
        { name: 'Dashboard', path: '/' },
        { name: 'Sources', path: '/sources' },
        { name: 'Settings', path: '/settings' },
    ];

    return (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center">
                            <Link href="/">
                                <span className="font-serif font-bold text-xl tracking-tight">Daily Digest</span>
                            </Link>
                        </div>
                        <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
                            {user && navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    href={link.path}
                                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium h-full transition-colors ${isActive(link.path)
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
                                    className="text-sm font-medium text-gray-500 hover:text-black transition-colors"
                                >
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <Link
                                href="/login"
                                className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                            >
                                Sign In
                            </Link>
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
                            {/* Icon when menu is closed */}
                            {!isMenuOpen ? (
                                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            ) : (
                                /* Icon when menu is open */
                                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu, show/hide based on menu state */}
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
                                            : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
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
                            <Link
                                href="/login"
                                onClick={() => setIsMenuOpen(false)}
                                className="block pl-3 pr-4 py-3 border-l-4 border-transparent text-base font-medium text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
                            >
                                Sign In
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
