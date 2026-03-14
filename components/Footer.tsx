import Link from 'next/link';
import { CONTACT_EMAIL } from '@/lib/config';

export default function Footer({
    hideBorder = false,
    transparentBg = false,
}: {
    hideBorder?: boolean;
    transparentBg?: boolean;
}) {
    return (
        <footer className={`${transparentBg ? 'bg-transparent' : 'bg-[#1A1A1A]'} text-white py-16 px-6 md:px-12 lg:px-24 ${hideBorder ? '' : 'border-t border-[#2A2A2A]'}`}>
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-12">
                {/* Left Section: Brand and Socials */}
                <div className="flex flex-col gap-6 max-w-sm">
                    <div className="flex items-center gap-2">
                        {/* Minimalist Logo Icon */}
                        <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="32" height="32" rx="16" fill="#1A1A1A"/>
                            <circle cx="16" cy="16" r="6" fill="#FF5700"/>
                            <circle cx="16" cy="16" r="10" stroke="#FF5700" strokeOpacity={0.3} strokeWidth="2"/>
                        </svg>
                        <span className="text-xl font-serif font-bold tracking-tight text-white">Siftl.</span>
                    </div>
                    <p className="text-sm text-gray-400 leading-relaxed font-medium">
                        Siftl is the agentic knowledge engine that helps you consume high-value signals 10x faster.
                    </p>

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
                            <a href={`mailto:${CONTACT_EMAIL}`} className="text-sm text-gray-400 hover:text-white transition-colors">Contact</a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar: Copyright and Status */}
            <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                <p className="text-xs text-gray-500 font-medium tracking-tight">
                    &copy; {new Date().getFullYear()} Siftl Inc. All rights reserved.
                </p>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest font-mono">All systems operational</span>
                </div>
            </div>
        </footer>
    );
}
