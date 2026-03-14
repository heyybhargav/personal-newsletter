import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Siftl',
        short_name: 'Siftl',
        description: 'Your AI-curated daily executive briefing. Less scrolling, more knowing.',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#ffffff',
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
