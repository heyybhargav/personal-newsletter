import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const alt = 'Signal - High-Signal Intelligence Briefing';
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
                {/* Signal Dot */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 40,
                    }}
                >
                    <div
                        style={{
                            width: 80,
                            height: 80,
                            borderRadius: '50%',
                            backgroundColor: '#FF5700',
                            boxShadow: '0 0 60px rgba(255, 87, 0, 0.6)',
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
                    Signal.
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
