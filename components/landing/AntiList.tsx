'use client';

import { motion } from 'framer-motion';

const antiFeatures = [
    "Infinite Scrolling",
    "Clickbait Headlines",
    "Tracking Pixels",
    "Algorithms",
    "Popups",
    "Ads"
];

export default function AntiList() {
    return (
        <section className="py-24 md:py-32 px-6 bg-[#FDFBF7]">
            <div className="max-w-2xl mx-auto text-center">
                <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-white border border-gray-100 shadow-sm mb-12">
                    <span className="text-[10px] sm:text-xs font-bold tracking-widest text-[#888888] uppercase">What we don't do</span>
                </div>
                <div className="flex flex-col md:flex-row flex-wrap justify-center items-center gap-4 md:gap-x-6 md:gap-y-6">
                    {antiFeatures.map((item, i) => (
                        <motion.span
                            key={item}
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className="text-xl md:text-3xl text-[#CCCCCC] font-serif italic line-through decoration-2 decoration-[#FF5700]/50"
                        >
                            {item}
                        </motion.span>
                    ))}
                </div>
            </div>
        </section>
    );
}
