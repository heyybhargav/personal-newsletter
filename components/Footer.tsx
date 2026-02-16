import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="py-12 text-center pb-20 space-y-2">
            <p className="text-base text-[#666666] font-medium flex items-center justify-center gap-2">
                Signal. <span className="text-gray-400">Open Source Intelligence.</span>
            </p>
            <p className="text-sm text-gray-400">
                Made with love by <a href="https://twitter.com/heyybhargav" target="_blank" rel="noopener noreferrer" className="text-[#999] hover:text-[#FF5700] transition-colors">Bhargav</a>.
            </p>
        </footer>
    );
}
