'use client';

import { motion } from 'framer-motion';

export default function Manifesto() {
    return (
        <section className="py-32 px-6 bg-white border-y border-gray-100">
            <div className="max-w-3xl mx-auto text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                >
                    <p className="text-2xl md:text-3xl lg:text-4xl font-serif italic leading-relaxed text-[#1A1A1A]">
                        "You become what you consume. In an age of endless distraction, I built Signal to protect your attention. One inbox. One story. Every morning."
                    </p>
                    <div className="mt-8 flex items-center justify-center gap-4">
                        <div className="h-px w-12 bg-gray-300"></div>
                        <p className="text-sm font-bold tracking-widest text-[#888888] uppercase">
                            BHARGAV, CREATOR
                        </p>
                        <div className="h-px w-12 bg-gray-300"></div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
