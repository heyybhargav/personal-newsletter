import Link from 'next/link';

export default function Footer({
    hideBorder = false,
    transparentBg = false,
    showSocials = true
}: {
    hideBorder?: boolean;
    transparentBg?: boolean;
    showSocials?: boolean;
}) {
    return (
        <footer className={`${transparentBg ? 'bg-transparent' : 'bg-[#1A1A1A]'} text-white py-16 px-6 md:px-12 lg:px-24 ${hideBorder ? '' : 'border-t border-[#2A2A2A]'}`}>
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-12">
                {/* Left Section: Brand and Socials */}
                <div className="flex flex-col gap-6 max-w-sm">
                    <div className="flex items-center gap-2">
                        {/* Minimalist Logo Icon */}
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#FF5700]">
                            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="text-lg font-bold tracking-tight text-white">Signal</span>
                    </div>
                    <p className="text-sm text-gray-400 leading-relaxed font-medium">
                        The agentic knowledge engine that helps you consume highly-technical signals 10x faster.
                    </p>

                    {showSocials && (
                        <div className="flex gap-4">
                            <a href="https://twitter.com/heyybhargav" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors border border-gray-800">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-gray-400">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                            </a>
                            <a href="https://linkedin.com/in/bhargav" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors border border-gray-800">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-gray-400">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                </svg>
                            </a>
                        </div>
                    )}
                </div>

                {/* Right Section: Links */}
                <div className="flex gap-16 md:gap-24 flex-wrap mt-2 md:mt-0">
                    <div className="flex flex-col gap-6">
                        <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono">Product</h4>
                        <div className="flex flex-col gap-4">
                            <Link href="/blog" className="text-sm text-gray-400 hover:text-white transition-colors">Blog</Link>
                            <Link href="/faq" className="text-sm text-gray-400 hover:text-white transition-colors">FAQ</Link>
                            <Link href="/pricing" className="text-sm text-gray-400 hover:text-white transition-colors">Pricing</Link>
                        </div>
                    </div>

                    <div className="flex flex-col gap-6">
                        <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono">Legal</h4>
                        <div className="flex flex-col gap-4">
                            <Link href="/privacy" className="text-sm text-gray-400 hover:text-white transition-colors">Privacy</Link>
                            <Link href="/terms" className="text-sm text-gray-400 hover:text-white transition-colors">Terms</Link>
                        </div>
                    </div>

                    <div className="flex flex-col gap-6">
                        <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono">Company</h4>
                        <div className="flex flex-col gap-4">
                            <a href="mailto:editor@signaldaily.me" className="text-sm text-gray-400 hover:text-white transition-colors">Contact</a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar: Copyright and Status */}
            <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                <p className="text-xs text-gray-500 font-medium tracking-tight">
                    &copy; {new Date().getFullYear()} Signal Inc. All rights reserved.
                </p>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest font-mono">All systems operational</span>
                </div>
            </div>
        </footer>
    );
}
