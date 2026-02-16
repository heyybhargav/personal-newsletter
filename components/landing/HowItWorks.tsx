'use client';

import { motion } from 'framer-motion';
import { MousePointerClick, Sparkles, Coffee } from 'lucide-react';

const steps = [
    {
        id: 1,
        title: "Connect everything.",
        description: "Add your YouTube channels, RSS feeds, and newsletters. We support them all.",
        icon: MousePointerClick,
        quantifier: "Unlimited Sources"
    },
    {
        id: 2,
        title: "We filter the noise.",
        description: "Our AI reads every single link, filtering out clickbait and fluff to find the signal.",
        icon: Sparkles,
        quantifier: "100+ Links Analyzed"
    },
    {
        id: 3,
        title: "Read in 5 minutes.",
        description: "Receive a tailored executive briefing every morning. The stories that matter, zero filler.",
        icon: Coffee,
        quantifier: "5 Min Read Time"
    }
];

export default function HowItWorks() {
    return (
        <section className="py-24 px-6 bg-[#FAF9F6] border-t border-gray-100">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-serif font-medium text-[#1A1A1A] mb-4">
                        From chaos to clarity in 3 steps.
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {steps.map((step, i) => (
                        <motion.div
                            key={step.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm relative group hover:border-[#FF5700]/20 transition-colors"
                        >
                            {/* Step Number Background */}
                            <div className="absolute top-4 right-6 text-9xl font-serif text-gray-50 opacity-10 select-none pointer-events-none group-hover:text-[#FF5700]/10 transition-colors">
                                {step.id}
                            </div>

                            <div className="w-12 h-12 bg-[#FFF4F0] rounded-xl flex items-center justify-center mb-6 text-[#FF5700]">
                                <step.icon className="w-6 h-6" />
                            </div>

                            <h3 className="text-xl font-medium text-[#1A1A1A] mb-3 relative z-10">
                                {step.title}
                            </h3>

                            <p className="text-[#666666] leading-relaxed mb-6 h-20 text-sm relative z-10">
                                {step.description}
                            </p>

                            <div className="inline-flex items-center px-3 py-1 bg-[#F5F5F5] rounded-full text-xs font-semibold text-[#666666] uppercase tracking-wide group-hover:bg-[#FF5700]/10 group-hover:text-[#FF5700] transition-colors relative z-10">
                                {step.quantifier}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
