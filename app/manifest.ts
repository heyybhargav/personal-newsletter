import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Signal Daily',
        short_name: 'Signal',
        description: 'Your AI-curated daily executive briefing. Less scrolling, more knowing.',
        start_url: '/',
        display: 'standalone',
        background_color: '#FDFBF7',
        theme_color: '#FF5700',
        icons: [
            {
                src: '/icon.svg',
                sizes: 'any',
                type: 'image/svg+xml',
            },
            {
                src: '/apple-icon',
                sizes: '180x180',
                type: 'image/png',
            },
        ],
    }
}
