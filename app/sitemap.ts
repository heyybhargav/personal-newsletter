import { getBlogPosts } from '@/lib/blogDb';
import { MetadataRoute } from 'next';
import { SITE_URL, getAbsoluteUrl } from '@/lib/config';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const posts = await getBlogPosts(0, 100);

    const blogRoutes = posts.map((post) => ({
        url: getAbsoluteUrl(`/blog/${post.slug}`),
        lastModified: post.updatedAt || post.publishedAt || new Date(post.date).toISOString(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }));

    const staticRoutes = [
        {
            url: SITE_URL,
            lastModified: new Date().toISOString(),
            changeFrequency: 'daily' as const,
            priority: 1,
        },
        {
            // Blog Index Page
            url: getAbsoluteUrl('/blog'),
            lastModified: new Date().toISOString(),
            changeFrequency: 'daily' as const,
            priority: 0.9,
        },
        {
            url: getAbsoluteUrl('/pricing'),
            lastModified: new Date().toISOString(),
            changeFrequency: 'weekly' as const,
            priority: 0.8,
        },
        {
            url: getAbsoluteUrl('/faq'),
            lastModified: new Date().toISOString(),
            changeFrequency: 'monthly' as const,
            priority: 0.7,
        },
        {
            url: getAbsoluteUrl('/login'),
            lastModified: new Date().toISOString(),
            changeFrequency: 'monthly' as const,
            priority: 0.6,
        },
    ];

    return [
        ...staticRoutes,
        ...blogRoutes,
    ];
}
