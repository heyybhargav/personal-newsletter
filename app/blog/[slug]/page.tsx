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

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post!.title,
        description: post!.subtitle,
        datePublished: new Date(post!.date).toISOString(),
        dateModified: new Date(post!.date).toISOString(),
        author: {
            '@type': 'Person',
            name: 'Bhargav',
            url: 'https://twitter.com/heyybhargav',
        },
        publisher: {
            '@type': 'Organization',
            name: 'Signal',
            url: 'https://signaldaily.me',
            logo: {
                '@type': 'ImageObject',
                url: 'https://signaldaily.me/icon.svg',
            },
        },
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `https://signaldaily.me/blog/${post!.slug}`,
        },
    };

    const breadcrumbJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Blog', item: 'https://signaldaily.me/blog' },
            { '@type': 'ListItem', position: 2, name: post!.title, item: `https://signaldaily.me/blog/${post!.slug}` },
        ],
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
            <BlogPostClient post={post!} />
        </>
    );
}
