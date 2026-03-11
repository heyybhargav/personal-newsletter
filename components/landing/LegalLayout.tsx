'use client';

import PublicNav from '@/components/PublicNav';
import Footer from '@/components/Footer';

interface LegalLayoutProps {
    children: React.ReactNode;
    title: string;
    lastUpdated: string;
}

export default function LegalLayout({ children, title, lastUpdated }: LegalLayoutProps) {
    const triggerLogin = () => {
        // Find the hidden Google button injected by the global provider and click it
        const googleButton = document.querySelector('[role="button"]') as HTMLElement;
        if (googleButton) googleButton.click();
    };

    return (
        <main className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A] font-sans selection:bg-gray-200 overflow-x-hidden flex flex-col">
            <PublicNav onLogin={triggerLogin} />

            <div className="flex-1 w-full pt-32 pb-32 px-6 md:px-12 lg:px-24">
                <div className="max-w-3xl mx-auto relative relative z-10 w-full">
                    <header className="mb-20">
                        <h1 className="text-5xl md:text-7xl font-serif text-[#1A1A1A] tracking-tighter leading-tight">{title}</h1>
                        <div className="mt-8 flex items-center gap-4">
                            <div className="h-px w-8 bg-[#FF5700]/30"></div>
                            <p className="text-xs font-bold text-[#FF5700] uppercase tracking-widest font-mono">
                                Last Updated: {lastUpdated}
                            </p>
                        </div>
                    </header>

                    <article className="prose prose-lg md:prose-xl prose-gray max-w-none 
                        prose-headings:font-serif prose-headings:text-[#1A1A1A] prose-headings:font-normal prose-headings:tracking-tight
                        prose-h2:text-3xl md:prose-h2:text-4xl prose-h2:mt-16 prose-h2:mb-6 prose-h2:border-b prose-h2:border-gray-200 prose-h2:pb-4
                        prose-h3:text-2xl prose-h3:mt-10 prose-h3:mb-4
                        prose-p:text-gray-600 prose-p:leading-relaxed
                        prose-a:text-[#FF5700] prose-a:font-medium prose-a:no-underline hover:prose-a:underline
                        prose-strong:text-[#1A1A1A] prose-strong:font-semibold
                        prose-ul:mt-4 prose-ul:mb-8 prose-li:text-gray-600 prose-li:my-2 marker:text-[#FF5700]">
                        {children}
                    </article>
                </div>
            </div>

            <Footer hideBorder={true} transparentBg={false} showSocials={true} />
        </main>
    );
}
