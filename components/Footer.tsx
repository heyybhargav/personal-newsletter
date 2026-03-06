import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="py-8 bg-[#1A1A1A] text-white text-center">
            <div className="flex flex-col items-center justify-center gap-4">
                <p className="text-sm font-medium tracking-tight text-gray-400">
                    Built with <span className="text-[#FF5700] mx-1">❤️</span> by <a href="https://twitter.com/heyybhargav" target="_blank" rel="noopener noreferrer" className="relative group text-gray-300 hover:text-white transition-colors">
                        <span className="relative z-10">Bhargav</span>
                        <span className="absolute bottom-[2px] left-0 w-full h-[1px] bg-gray-600 transition-colors group-hover:bg-[#FF5700]"></span>
                    </a>
                </p>

                <p className="text-xs text-gray-600 font-mono tracking-widest uppercase">
                    Signal &copy; {new Date().getFullYear()}
                </p>
            </div>
        </footer>
    );
}
