import { notFound } from 'next/navigation';
import { getBlogPost, BLOG_POSTS } from '@/lib/blog';
import BlogPostClient from './BlogPostClient';
import type { Metadata } from 'next';

export async function generateStaticParams() {
    return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const post = getBlogPost(slug);
    if (!post) return { title: 'Not Found' };
    return {
        title: `${post.title} — Signal`,
        description: post.subtitle,
        openGraph: {
            title: post.title,
            description: post.subtitle,
            type: 'article',
        },
    };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const post = getBlogPost(slug);
    if (!post) notFound();
    return <BlogPostClient post={post} />;
}
