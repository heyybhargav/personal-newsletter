

import Link from 'next/link';
import { getBlogPosts } from '@/lib/blogDb';
import Footer from '@/components/Footer';
import PublicNav from '@/components/PublicNav';

export const revalidate = 3600; // ISR revalidate every hour as a fallback

export default async function BlogPage() {
    const posts = await getBlogPosts(0, 20); // Fetch latest 20 posts

    return (
        <main className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A] font-sans overflow-x-hidden">
            <PublicNav />

            <section className="pt-24 pb-16 px-6">
                <div className="max-w-2xl mx-auto">
                    <span className="text-[10px] font-bold tracking-[0.25em] text-[#FF5700] uppercase">
                        Signal Blog
                    </span>
                    <h1 className="mt-4 text-5xl md:text-6xl font-serif font-medium tracking-tight leading-[1.05] text-[#1A1A1A]">
                        Reading. <span className="italic text-gray-400">Thinking.</span>
                    </h1>
                    <p className="mt-6 text-base text-gray-500 font-medium leading-relaxed max-w-md">
                        On staying informed, building good habits, and why the way you consume information matters.
                    </p>
                </div>
            </section>

            <div className="px-6 pb-4">
                <div className="max-w-2xl mx-auto h-px bg-gray-200" />
            </div>

            {/* Posts list */}
            <section className="px-6 pt-6 pb-32">
                <div className="max-w-2xl mx-auto space-y-0">
                    {posts.length === 0 ? (
                        <p className="text-gray-500 py-10">No posts published yet.</p>
                    ) : (
                        posts.map((post) => (
                            <Link key={post.slug} href={`/blog/${post.slug}`} className="group block py-10 border-b border-gray-100 hover:border-gray-200 transition-colors">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">{post.date}</span>
                                    {post.category && (
                                        <>
                                            <span className="text-gray-200">·</span>
                                            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">{post.category}</span>
                                        </>
                                    )}
                                    <span className="text-gray-200">·</span>
                                    <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">{post.readTime || '4 min read'}</span>
                                </div>
                                <h2 className="text-xl md:text-2xl font-serif font-medium text-[#1A1A1A] group-hover:text-[#FF5700] transition-colors leading-snug mb-2">
                                    {post.title}
                                </h2>
                                <p className="text-sm text-gray-500 leading-relaxed">{post.subtitle}</p>
                                <div className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-gray-400 group-hover:text-[#FF5700] transition-colors">
                                    Read →
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </section>

            <div className="bg-[#1A1A1A]">
                <Footer />
            </div>
        </main>
    );
}
