'use client';

import { ArrowRight, Check, X, Shield, Zap, Brain } from 'lucide-react';
import PublicNav from '@/components/PublicNav';
import Footer from '@/components/Footer';

export default function PricingClient() {
    const triggerLogin = () => {
        // Find the hidden Google button injected by the global provider and click it
        const googleButton = document.querySelector('[role="button"]') as HTMLElement;
        if (googleButton) googleButton.click();
    };

    // Use environment variable if set, otherwise fallback to the generic generic placeholder for dev
    const checkoutUrl = process.env.NEXT_PUBLIC_POLAR_CHECKOUT_URL || 'https://polar.sh/checkout/...';

    return (
        <main className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A] font-sans selection:bg-[#FF5700] selection:text-white overflow-x-hidden flex flex-col">
            <PublicNav onLogin={triggerLogin} />

            <div className="flex-1 w-full pt-32 pb-24 px-6 md:px-12 lg:px-24 flex flex-col items-center">

                {/* SECTION 1: HERO & ROI PRICING CARD */}
                <div className="w-full max-w-4xl mx-auto relative z-10 mb-32">
                    {/* Ambient Background Glow (Subtle Fire) */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#FF5700] opacity-[0.03] blur-[120px] rounded-full pointer-events-none"></div>

                    <header className="text-center mb-16">
                        <h1 className="text-5xl md:text-7xl font-serif text-[#1A1A1A] tracking-tighter leading-tight mb-6 relative">
                            Reclaim your attention.<br />
                            <span className="italic font-light">Outsmart the noise.</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-500 font-serif max-w-2xl mx-auto leading-relaxed">
                            For less than a coffee, get the synthesized intelligence of the top 1%. Start your 7-day trial today.
                        </p>
                    </header>

                    {/* Highly-Converting Single Value Pricing Card */}
                    <div className="max-w-md mx-auto bg-[#1A1A1A] rounded-2xl p-8 md:p-10 shadow-[0_20px_40px_-15px_rgba(26,26,26,0.3)] relative overflow-hidden group border border-[#1A1A1A] hover:border-[#FF5700]/30 transition-colors duration-500">
                        {/* Subtle top highlight */}
                        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#FF5700] to-transparent opacity-80"></div>

                        <div className="flex items-end justify-between mb-8 pb-8 border-b border-white/10">
                            <div>
                                <h2 className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-2 font-mono">Premium Intelligence</h2>
                                <h3 className="text-3xl font-serif text-white">Signal Pro</h3>
                            </div>
                            <div className="text-right">
                                <div className="text-5xl font-mono text-white tracking-tighter -mb-1">$4</div>
                                <div className="text-[10px] font-bold tracking-widest text-[#FF5700] uppercase mt-3 font-mono">Per Month</div>
                            </div>
                        </div>

                        <ul className="space-y-5 mb-10">
                            <FeatureItem
                                icon={<Zap className="w-3 h-3 text-[#FF5700]" />}
                                text="Zero-Fluff Briefings: AI extracts the absolute signal, skipping the filler."
                            />
                            <FeatureItem
                                icon={<Brain className="w-3 h-3 text-[#FF5700]" />}
                                text="Deep Synthesis: Insights connected across unlimited data sources using Gemini Pro."
                            />
                            <FeatureItem
                                icon={<Check className="w-3 h-3 text-[#FF5700]" />}
                                text="Custom Delivery Schedule: Read on your time, completely ad-free."
                            />
                        </ul>

                        <div className="space-y-3">
                            <a
                                href={checkoutUrl}
                                className="block w-full py-4 px-6 bg-[#FDFBF7] hover:bg-white text-[#1A1A1A] text-center font-bold tracking-widest uppercase text-xs rounded-xl transition-all duration-300 shadow-[0_10px_20px_-10px_rgba(255,255,255,0.1)] hover:shadow-[0_12px_24px_-10px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2"
                            >
                                Start 7-Day Free Trial
                                <ArrowRight className="w-4 h-4" />
                            </a>
                            <p className="text-center text-[11px] text-gray-400 font-medium">No credit card required for trial.</p>
                        </div>

                        <div className="mt-6 pt-6 border-t border-white/5 text-center">
                            <button
                                onClick={triggerLogin}
                                className="text-xs text-gray-500 hover:text-white transition-colors underline underline-offset-4"
                            >
                                Already have an account? Sign In
                            </button>
                        </div>
                    </div>

                    <div className="mt-8 flex items-center justify-center gap-2 text-[10px] font-bold tracking-widest uppercase text-gray-400 font-mono">
                        <Shield className="w-3.5 h-3.5" />
                        Encrypted Transaction via Polar.sh
                    </div>
                </div>

                {/* SECTION 2: STATUS QUO VS SIGNAL */}
                <div className="w-full max-w-4xl mx-auto mb-32">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-serif text-[#1A1A1A]">Why pay for Signal?</h2>
                        <p className="text-gray-500 mt-3 font-medium">Because your time is worth more than $4 a month.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 lg:gap-8">
                        {/* Status Quo */}
                        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                                    <X className="w-4 h-4 text-red-500" />
                                </div>
                                <h3 className="font-serif text-xl text-gray-400 line-through decoration-red-500/30">Life without Signal</h3>
                            </div>
                            <ul className="space-y-4">
                                <ComparisonItem text="Inbox overflowing with 50+ unread newsletters." isPositive={false} />
                                <ComparisonItem text="Spending 5+ hours a week trying to stay updated." isPositive={false} />
                                <ComparisonItem text="Constant FOMO on industry trends and technical shifts." isPositive={false} />
                                <ComparisonItem text="Skimming articles without retaining the deep insights." isPositive={false} />
                            </ul>
                        </div>

                        {/* With Signal */}
                        <div className="bg-[#1A1A1A] rounded-2xl p-8 border border-[#1A1A1A] shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF5700] opacity-10 blur-[50px] rounded-full pointer-events-none"></div>
                            <div className="flex items-center gap-3 mb-6 relative z-10">
                                <div className="w-8 h-8 rounded-full bg-[#FF5700]/10 flex items-center justify-center">
                                    <Check className="w-4 h-4 text-[#FF5700]" />
                                </div>
                                <h3 className="font-serif text-xl text-white">Life with Signal</h3>
                            </div>
                            <ul className="space-y-4 relative z-10">
                                <ComparisonItem text="One clean, consolidated daily briefing." isPositive={true} />
                                <ComparisonItem text="3 minutes of reading a day to be fully informed." isPositive={true} />
                                <ComparisonItem text="Insights instantly connected across the whole industry." isPositive={true} />
                                <ComparisonItem text="Zero fluff. Just raw, actionable intelligence." isPositive={true} />
                            </ul>
                        </div>
                    </div>
                </div>

                {/* SECTION 3: OBJECTION-BUSTING FAQ */}
                <div className="w-full max-w-3xl mx-auto mb-16">
                    <h2 className="text-4xl font-serif text-[#1A1A1A] text-center mb-16">Frequently Asked Questions</h2>
                    <div className="max-w-2xl mx-auto">
                        <FaqItem
                            question="What happens after the 7-day trial?"
                            answer="We don't require a credit card upfront. After your 7-day trial, your email deliveries will pause. To reactivate them, you can securely upgrade to Signal Pro for $4/month via Polar.sh."
                        />
                        <FaqItem
                            question="Can I add my own obscure newsletters and blogs?"
                            answer="Absolutely. Signal can ingest any valid RSS feed or forwardable email address. Whether it's a massive tech blog or a niche Substack with 100 subscribers, Signal will read it and extract the insights."
                        />
                        <FaqItem
                            question="Is my data used to train the AI models?"
                            answer="No. We operate under a strict 'Zero Training Mandate'. We use enterprise APIs from Google and Groq where explicitly your data is dropped after processing and never used to train foundational models."
                        />
                        <FaqItem
                            question="How is this different from Feedly or an RSS reader?"
                            answer="RSS readers give you the firehose, but you still have to do the reading. Signal actually reads the firehose for you, connects the dots between different articles, and delivers a synthesized summary of what you actually need to know."
                        />
                    </div>
                </div>

            </div>

            <Footer hideBorder={true} transparentBg={false} showSocials={true} />
        </main>
    );
}

// Subcomponents

function FeatureItem({ text, icon }: { text: string, icon: React.ReactNode }) {
    return (
        <li className="flex items-start gap-4">
            <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-[#FF5700]/10 transition-colors duration-300">
                {icon}
            </div>
            <span className="text-gray-300 font-serif text-[17px] leading-snug">{text}</span>
        </li>
    );
}

function ComparisonItem({ text, isPositive }: { text: string, isPositive: boolean }) {
    return (
        <li className="flex items-start gap-3">
            <div className="mt-1 flex-shrink-0">
                {isPositive ? (
                    <Check className="w-4 h-4 text-[#FF5700]" />
                ) : (
                    <X className="w-4 h-4 text-gray-300" />
                )}
            </div>
            <span className={`text-[15px] leading-relaxed ${isPositive ? 'text-gray-300' : 'text-gray-500'}`}>
                {text}
            </span>
        </li>
    );
}

function FaqItem({ question, answer }: { question: string, answer: string }) {
    return (
        <div className="py-6 border-b border-gray-200/60 last:border-0 group">
            <h4 className="font-serif text-xl text-[#1A1A1A] mb-3 group-hover:text-[#FF5700] transition-colors duration-300">{question}</h4>
            <p className="text-gray-500 leading-relaxed text-[16px] max-w-2xl">{answer}</p>
        </div>
    );
}
