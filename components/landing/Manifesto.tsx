'use client';

import { motion } from 'framer-motion';

export default function Manifesto() {
    return (
        <section className="py-32 px-6 bg-[#FDFBF7]">
            <div className="max-w-2xl mx-auto text-center">
                <motion.blockquote
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="space-y-8"
                >
                    <p className="text-2xl md:text-3xl lg:text-4xl font-serif italic leading-relaxed text-[#1A1A1A]">
                        "You become what you consume. In an age of endless distraction, I built Signal to protect your attention. One inbox. One story. Every morning."
                    </p>
                </motion.blockquote>
            </div>
        </section>
    );
}
