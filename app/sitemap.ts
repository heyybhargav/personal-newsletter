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

    return [
        {
            url: SITE_URL,
            lastModified: new Date().toISOString(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: getAbsoluteUrl('/blog'),
            lastModified: new Date().toISOString(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        ...blogRoutes,
    ];
}
