'use client';

import { motion } from 'framer-motion';

const features = [
    {
        statement: 'The firehose stops here.',
        description: "We read 100 links so you don't have to. One synthesis. Zero fluff.",
    },
    {
        statement: 'Your sources. Your rules.',
        description: 'Add Hacker News, Substacks, newsletters—whatever matters to you.',
    },
    {
        statement: 'Privacy by default.',
        description: 'No ads. No tracking. Just signal.',
    },
];

export default function Features() {
    return (
        <section className="py-24 px-6 border-t border-gray-100">
            <div className="max-w-3xl mx-auto space-y-20">
                {features.map((feature, i) => (
                    <motion.div
                        key={feature.statement}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: i * 0.1 }}
                        className="text-center"
                    >
                        <h3 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-4">
                            {feature.statement}
                        </h3>
                        <p className="text-lg text-gray-500 font-light max-w-md mx-auto">
                            {feature.description}
                        </p>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
