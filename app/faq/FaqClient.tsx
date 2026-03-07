'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

const faqs = [
    {
        question: 'What is an AI newsletter aggregator?',
        answer: 'An AI newsletter aggregator is a tool that collects your daily subscriptions and uses large language models to summarize them into a single, concise email.',
        details: 'Instead of receiving 15 different emails throughout the day, an aggregator pulls them together, reads them for you, and extracts only the most important insights so you can read everything in 5 minutes.',
    },
    {
        question: 'How do I stop doomscrolling news?',
        answer: 'You can stop doomscrolling by shifting from an active, algorithmic feed to a scheduled, finite daily briefing that delivers only the specific sources you choose.',
        details: 'The problem with social media feeds is that they are infinite and designed for engagement. By moving your information consumption to a single daily email, you create a bounded habit. Once you finish the email, there is nothing left to scroll.',
    },
    {
        question: 'What is the best alternative to Morning Brew?',
        answer: 'The best alternative to Morning Brew for niche professionals is a personalized AI briefing service like Signal, which synthesizes industry-specific sources instead of general mass-market news.',
        details: 'Morning Brew is excellent for general business overviews. However, if you are a specialized founder or investor who only cares about deeply technical developments in your exact sector, an AI alternative that lets you define the sources is infinitely more valuable.',
    },
    {
        question: 'How can I automate an RSS feed summary using ChatGPT?',
        answer: 'While you can use tools like Zapier to feed RSS links into ChatGPT, purpose-built apps like Signal do this automatically every day without requiring complex manual prompt engineering.',
        details: 'Building your own automation requires maintaining Zapier workflows, handling API limits, and writing prompts that format the output well. A dedicated tool abstracts all of that away so you just input a URL and receive a clean email.',
    },
    {
        question: 'Is there a personalized daily news briefing app?',
        answer: 'Yes, Signal is a personalized daily briefing app that reads the specific blogs, Substacks, and YouTube channels you follow to generate a custom morning email.',
        details: 'Unlike traditional news apps that rely on editors or algorithms to guess what you might like, Signal only reads the exact sources you explicitly tell it to track. This guarantees zero filler.',
    },
    {
        question: 'What is newsletter fatigue?',
        answer: 'Newsletter fatigue is the feeling of being overwhelmed by the volume of daily emails you receive, usually resulting in subscribing to many but actively reading very few.',
        details: 'It happens because you want the one valuable insight buried in an email, but you have to read 80% filler to find it. AI synthesis solves this by extracting the 20% value across all your newsletters and discarding the rest.',
    },
    {
        question: 'How do busy founders stay up to date without wasting time?',
        answer: 'Founders stay up to date by outsourcing the reading and synthesis of their industry news to automated intelligence tools that deliver high-signal summaries.',
        details: 'Time is the most expensive asset for a founder. Spending 45 minutes sweeping Twitter and RSS feeds is a poor allocation of it. High-leverage consumption means spending 5 minutes reading the synthesized output of those feeds.',
    },
];

export default function FaqClient() {
    return (
        <main className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A] font-sans overflow-x-hidden">
            {/* Navbar */}
            <nav className="fixed top-0 w-full p-6 md:p-8 flex justify-between items-center z-50 bg-[#FDFBF7]/80 backdrop-blur-sm">
                <Link href="/" className="font-bold text-xl tracking-tight text-[#1A1A1A]">
                    Signal.
                </Link>
                <div className="flex items-center gap-6">
                    <Link href="/blog" className="text-sm font-medium text-gray-500 hover:text-black transition-colors">
                        Blog
                    </Link>
                    <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-black transition-colors">
                        Log in
                    </Link>
                </div>
            </nav>

            <section className="pt-36 pb-24 px-6">
                <div className="max-w-2xl mx-auto">
                    {/* Header */}
                    <div className="mb-16">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                            className="text-4xl md:text-5xl lg:text-6xl font-serif font-medium tracking-tight leading-[1.05] text-[#1A1A1A] mb-5"
                        >
                            Answers.
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="text-lg text-gray-400 font-serif italic leading-relaxed"
                        >
                            Understanding AI summarization, newsletter fatigue, and staying informed.
                        </motion.p>
                    </div>

                    <motion.div
                        initial={{ scaleX: 0, opacity: 0 }}
                        animate={{ scaleX: 1, opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
                        className="h-px bg-gray-200 origin-left w-full mb-16"
                    />

                    {/* FAQ Items */}
                    <div className="space-y-16">
                        {faqs.map((faq, idx) => (
                            <motion.article
                                key={idx}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.1 + idx * 0.07 }}
                            >
                                <h2 className="text-[20px] md:text-[22px] font-bold text-[#1A1A1A] leading-snug mb-4">
                                    {faq.question}
                                </h2>
                                {/* INVERTED PYRAMID: Direct 1-sentence answer first */}
                                <p className="text-[17px] md:text-lg font-serif font-medium text-[#FF5700] leading-[1.6] mb-4">
                                    {faq.answer}
                                </p>
                                {/* Elaboration */}
                                <p className="text-[17px] md:text-lg font-serif text-[#2A2A2A] leading-[1.75]">
                                    {faq.details}
                                </p>
                            </motion.article>
                        ))}
                    </div>

                    {/* CTA */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                        className="mt-20 border-t border-gray-100 pt-16"
                    >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                            <div>
                                <p className="text-xs font-bold tracking-[0.2em] text-[#FF5700] uppercase mb-2">Ready to try it?</p>
                                <p className="text-base font-serif text-gray-700 leading-relaxed">
                                    Stop doomscrolling. Set up your briefing in under a minute.
                                </p>
                            </div>
                            <Link
                                href="/login"
                                className="shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-[#1A1A1A] text-white text-sm font-medium rounded-full hover:bg-[#2A2A2A] transition-all duration-300 hover:-translate-y-0.5 shadow-lg shadow-black/10"
                            >
                                Start for free →
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>
        </main>
    );
}
