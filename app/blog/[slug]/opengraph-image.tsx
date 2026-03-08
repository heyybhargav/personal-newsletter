import { ImageResponse } from 'next/og';
import { getBlogPost } from '@/lib/blogDb';

export const runtime = 'edge';

// Image metadata
export const alt = 'Signal Daily Blog Post';
export const size = {
    width: 1200,
    height: 630,
};

export const contentType = 'image/png';

export default async function Image({ params }: { params: { slug: string } }) {
    const post = await getBlogPost(params.slug);

    if (!post) {
        return new Response('Not Found', { status: 404 });
    }

    return new ImageResponse(
        (
            <div
                style={{
                    background: '#1A1A1A',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '80px',
                    fontFamily: 'system-ui, sans-serif',
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {/* Category Pill */}
                    <div
                        style={{
                            background: 'rgba(255, 87, 0, 0.1)',
                            color: '#FF5700',
                            padding: '8px 16px',
                            borderRadius: '99px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.2em',
                            fontSize: '14px',
                            fontWeight: 700,
                            width: 'max-content',
                            marginBottom: '32px',
                        }}
                    >
                        {post.category || 'Blog'}
                    </div>

                    {/* Title */}
                    <h1
                        style={{
                            fontSize: '64px',
                            fontWeight: 500,
                            color: 'white',
                            lineHeight: 1.1,
                            letterSpacing: '-0.02em',
                            marginBottom: '24px',
                            maxWidth: '900px',
                        }}
                    >
                        {post.title}
                    </h1>

                    {/* Subtitle */}
                    <p
                        style={{
                            fontSize: '32px',
                            color: '#888888',
                            lineHeight: 1.4,
                            maxWidth: '900px',
                        }}
                    >
                        {post.subtitle}
                    </p>
                </div>

                {/* Footer */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        borderTop: '1px solid #333333',
                        paddingTop: '32px',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {/* Minimal Logo approximation */}
                        <div
                            style={{
                                width: '32px',
                                height: '32px',
                                background: '#FF5700',
                                borderRadius: '6px',
                            }}
                        />
                        <span style={{ fontSize: '24px', color: 'white', fontWeight: 600 }}>
                            Signal Daily
                        </span>
                    </div>
                    <span style={{ fontSize: '24px', color: '#666666', fontFamily: 'monospace' }}>
                        {post.readTime || '4 min read'}
                    </span>
                </div>
            </div>
        ),
        {
            ...size,
        }
    );
}
