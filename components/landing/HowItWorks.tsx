'use client';

import { motion } from 'framer-motion';

const steps = [
    {
        num: '01',
        title: 'Connect',
        desc: 'Sync your favorite feeds. RSS, newsletters, YouTube channels, or Twitter lists.',
    },
    {
        num: '02',
        title: 'Curate',
        desc: 'Our AI reads every single item, filtering for high-signal content based on your taste.',
    },
    {
        num: '03',
        title: 'Digest',
        desc: 'Receive one perfectly synthesized briefing at 8 AM. Read it in 5 minutes.',
    },
];

export default function HowItWorks() {
    return (
        <section className="py-32 px-6 border-t border-gray-100 bg-[#FDFBF7]">
            <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
                    {steps.map((step, i) => (
                        <motion.div
                            key={step.num}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: i * 0.2 }}
                            className="space-y-4"
                        >
                            <span className="text-xs font-mono text-gray-400 tracking-widest">
                                {step.num}
                            </span>
                            <h4 className="text-2xl font-bold text-[#1A1A1A]">
                                {step.title}
                            </h4>
                            <p className="text-base text-gray-500 font-light leading-relaxed">
                                {step.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
