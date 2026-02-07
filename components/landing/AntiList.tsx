'use client';

import { motion } from 'framer-motion';

const antiItems = [
    'Ads',
    'Tracking',
    'Social Features',
    'Vanity Metrics',
    'Data Selling',
];

export default function AntiList() {
    return (
        <section className="py-24 px-6 border-t border-gray-100">
            <div className="max-w-xl mx-auto text-center">
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-sm uppercase tracking-widest text-gray-400 mb-12"
                >
                    What we don't do
                </motion.p>

                <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
                    {antiItems.map((item, i) => (
                        <motion.span
                            key={item}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className="text-2xl md:text-3xl font-light text-gray-300 line-through decoration-gray-300"
                        >
                            {item}
                        </motion.span>
                    ))}
                </div>
            </div>
        </section>
    );
}
