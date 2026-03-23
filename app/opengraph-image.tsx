import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const alt = 'Siftl - High-Signal Intelligence Briefing';
export const size = {
    width: 1200,
    height: 630,
};

export const contentType = 'image/png';

// Image generation
export default async function Image() {
    return new ImageResponse(
        (
            // ImageResponse JSX element
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#1A1A1A',
                    color: 'white',
                }}
            >
                {/* Siftl Dot */}
                <div
                    style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 60,
                        width: 140,
                        height: 140,
                    }}
                >
                    {/* outer circle */}
                    <div
                        style={{
                            position: 'absolute',
                            width: 140,
                            height: 140,
                            borderRadius: '50%',
                            border: '4px solid rgba(255, 87, 0, 0.2)',
                        }}
                    />
                    {/* pulse circle */}
                    <div
                        style={{
                            position: 'absolute',
                            width: 100,
                            height: 100,
                            borderRadius: '50%',
                            border: '2px solid rgba(255, 87, 0, 0.4)',
                        }}
                    />
                    {/* inner circle */}
                    <div
                        style={{
                            width: 60,
                            height: 60,
                            borderRadius: '50%',
                            backgroundColor: '#FF5700',
                            boxShadow: '0 0 40px rgba(255, 87, 0, 0.8)',
                        }}
                    />
                </div>

                {/* Brand Name */}
                <div
                    style={{
                        fontSize: 120,
                        fontFamily: 'serif',
                        fontWeight: 600,
                        letterSpacing: '-0.05em',
                        lineHeight: 1,
                        marginBottom: 20,
                    }}
                >
                    Siftl.
                </div>

                {/* Tagline */}
                <div
                    style={{
                        fontSize: 32,
                        fontFamily: 'sans-serif',
                        fontWeight: 400,
                        color: '#9CA3AF',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                    }}
                >
                    High-Signal Intelligence
                </div>
            </div>
        ),
        // ImageResponse options
        {
            // For convenience, we can re-use the exported opengraph-image size config
            ...size,
        }
    );
}
