import { notFound } from 'next/navigation';
import { getBlogPost, getBlogPosts } from '@/lib/blogDb';
import BlogPostClient from './BlogPostClient';
import type { Metadata } from 'next';
import { SITE_URL, getAbsoluteUrl } from '@/lib/config';

export async function generateStaticParams() {
    // Generate static params for the last 50 posts to ensure they are fast
    const posts = await getBlogPosts(0, 50);
    return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const post = await getBlogPost(slug);
    if (!post) return { title: 'Not Found' };
    
    const baseUrl = SITE_URL;
    
    return {
        title: `${post.title} — Siftl`,
        description: post.metaDescription || post.subtitle,
        keywords: post.targetKeywords,
        openGraph: {
            title: post.title,
            description: post.metaDescription || post.subtitle,
            type: 'article',
            publishedTime: post.publishedAt || new Date(post.date).toISOString(),
            url: `${baseUrl}/blog/${post.slug}`,
            siteName: 'Siftl',
            images: [
                {
                    url: `${baseUrl}/icon.svg`, // Fallback until dynamic OG images are implemented
                    width: 800,
                    height: 800,
                    alt: 'Siftl Logo',
                },
            ],
        },
        twitter: {
            card: 'summary',
            title: post.title,
            description: post.metaDescription || post.subtitle,
            images: [`${baseUrl}/icon.svg`],
        },
    };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const post = await getBlogPost(slug);
    if (!post) notFound();

    // Use AI-generated schema if available, otherwise fallback to Article
    const jsonLd = post.schemaData || {
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
            name: 'Siftl',
            url: SITE_URL,
            logo: {
                '@type': 'ImageObject',
                url: `${SITE_URL}/icon.svg`,
            },
        },
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `${SITE_URL}/blog/${post!.slug}`,
        },
    };

    const breadcrumbJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Blog', item: '${SITE_URL}/blog' },
            { '@type': 'ListItem', position: 2, name: post!.title, item: `${SITE_URL}/blog/${post!.slug}` },
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
