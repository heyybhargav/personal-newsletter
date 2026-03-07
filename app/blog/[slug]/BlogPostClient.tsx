'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { BlogPost } from '@/lib/blog';

interface BlogPostClientProps {
    post: BlogPost;
}

export default function BlogPostClient({ post }: BlogPostClientProps) {
    return (
        <main className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A] font-sans overflow-x-hidden">
            {/* Navbar */}
            <nav className="fixed top-0 w-full p-6 md:p-8 flex justify-between items-center z-50 bg-[#FDFBF7]/80 backdrop-blur-sm">
                <Link href="/login" className="font-bold text-xl tracking-tight text-[#1A1A1A]">
                    Signal.
                </Link>
                <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-black transition-colors">
                    Log in
                </Link>
            </nav>

            {/* Hero / Headline Block */}
            <section className="pt-36 pb-0 px-6">
                <div className="max-w-2xl mx-auto">
                    {/* Back link */}
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4 }}
                        className="mb-10"
                    >
                        <Link href="/blog" className="inline-flex items-center gap-2 text-xs font-mono text-gray-400 hover:text-[#FF5700] transition-colors uppercase tracking-widest group">
                            <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-0.5" />
                            All posts
                        </Link>
                    </motion.div>

                    {/* Metadata */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.05 }}
                        className="flex items-center gap-3 mb-6"
                    >
                        <span className="text-[10px] font-mono text-[#FF5700] uppercase tracking-widest">{post.date}</span>
                        <span className="text-gray-200">·</span>
                        <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">{post.readTime}</span>
                    </motion.div>

                    {/* Title */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                        className="text-4xl md:text-5xl lg:text-6xl font-serif font-medium tracking-tight leading-[1.05] text-[#1A1A1A] mb-5"
                    >
                        {post.title}
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-lg text-gray-400 font-serif italic leading-relaxed"
                    >
                        {post.subtitle}
                    </motion.p>
                </div>
            </section>

            {/* Divider */}
            <div className="px-6 mt-12 mb-0">
                <motion.div
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
                    className="max-w-2xl mx-auto h-px bg-gray-200 origin-left"
                />
            </div>

            {/* Body */}
            <article className="px-6 pt-14 pb-24">
                <div className="max-w-2xl mx-auto">
                    {post.content.map((section, sectionIdx) => (
                        <motion.div
                            key={sectionIdx}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 + sectionIdx * 0.07 }}
                            className="mb-12"
                        >
                            {section.heading && (
                                <h2 className="text-xs font-bold tracking-[0.2em] text-[#FF5700] uppercase mb-5">
                                    {section.heading}
                                </h2>
                            )}
                            <div className="space-y-5">
                                {section.paragraphs.map((para, paraIdx) => (
                                    <p
                                        key={paraIdx}
                                        className="text-[17px] md:text-lg font-serif text-[#2A2A2A] leading-[1.75]"
                                    >
                                        {para}
                                    </p>
                                ))}
                            </div>
                        </motion.div>
                    ))}

                    {/* CTA Block */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                        className="mt-16 border-t border-gray-100 pt-14"
                    >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                            <div>
                                <p className="text-xs font-bold tracking-[0.2em] text-[#FF5700] uppercase mb-2">Ready to try it?</p>
                                <p className="text-base font-serif text-gray-700 leading-relaxed">
                                    Set up your briefing in under a minute. First 7 days free.
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
            </article>

            {/* Footer */}
            <footer className="py-8 bg-[#1A1A1A] text-white text-center">
                <div className="flex flex-col items-center justify-center gap-4">
                    <p className="text-sm font-medium tracking-tight text-gray-400">
                        Built with <span className="text-[#FF5700] mx-1">❤️</span> by{' '}
                        <a href="https://twitter.com/heyybhargav" target="_blank" rel="noopener noreferrer" className="relative group text-gray-300 hover:text-white transition-colors">
                            <span className="relative z-10">Bhargav</span>
                            <span className="absolute bottom-[2px] left-0 w-full h-[1px] bg-gray-600 transition-colors group-hover:bg-[#FF5700]" />
                        </a>
                    </p>
                    <p className="text-xs text-gray-600 font-mono tracking-widest uppercase">
                        Signal &copy; {new Date().getFullYear()}
                    </p>
                </div>
            </footer>
        </main>
    );
}
