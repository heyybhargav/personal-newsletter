import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="py-20 bg-[#FDFBF7] text-[#1A1A1A] text-center border-t border-gray-100">
            <div className="flex flex-col items-center justify-center gap-6">
                <p className="text-xl font-medium tracking-tight">
                    Built with <span className="text-red-500 mx-1">❤️</span> by <a href="https://twitter.com/heyybhargav" target="_blank" rel="noopener noreferrer" className="relative group text-[#1A1A1A]">
                        <span className="relative z-10">Bhargav</span>
                        <span className="absolute bottom-[2px] left-0 w-full h-[1px] bg-gray-300 transition-colors group-hover:bg-[#FF5700]"></span>
                    </a>
                </p>

                <p className="text-sm text-gray-500 font-mono tracking-widest uppercase opacity-50">
                    Signal &copy; {new Date().getFullYear()}
                </p>
            </div>
        </footer>
    );
}
