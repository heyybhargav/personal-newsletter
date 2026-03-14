import FaqClient from './FaqClient';

export const metadata = {
    title: 'FAQ & Glossary — Siftl',
    description: 'Answers to the most common questions about AI news summarizers, overcoming newsletter fatigue, and how Siftl personalized briefings work.',
};

export default function FaqPage() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
            {
                '@type': 'Question',
                name: 'What is an AI newsletter aggregator?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'An AI newsletter aggregator is a tool that collects your daily subscriptions and uses large language models to summarize them into a single, concise email.',
                },
            },
            {
                '@type': 'Question',
                name: 'How do I stop doomscrolling news?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'You can stop doomscrolling by shifting from an active, algorithmic feed to a scheduled, finite daily briefing that delivers only the specific sources you choose.',
                },
            },
            {
                '@type': 'Question',
                name: 'What is the best alternative to Morning Brew?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'The best alternative to Morning Brew for niche professionals is a personalized AI briefing service like Siftl, which synthesizes industry-specific sources instead of general mass-market news.',
                },
            },
            {
                '@type': 'Question',
                name: 'How can I automate an RSS feed summary using ChatGPT?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'While you can use tools like Zapier to feed RSS links into ChatGPT, purpose-built apps like Siftl do this automatically every day without requiring complex manual prompt engineering.',
                },
            },
            {
                '@type': 'Question',
                name: 'Is there a personalized daily news briefing app?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes, Siftl is a personalized daily briefing app that reads the specific blogs, Substacks, and YouTube channels you follow to generate a custom morning email.',
                },
            },
            {
                '@type': 'Question',
                name: 'What is newsletter fatigue?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Newsletter fatigue is the feeling of being overwhelmed by the volume of daily emails you receive, usually resulting in subscribing to many but actively reading very few.',
                },
            },
            {
                '@type': 'Question',
                name: 'How do busy founders stay up to date without wasting time?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Founders stay up to date by outsourcing the reading and synthesis of their industry news to automated intelligence tools that deliver high-signal summaries.',
                },
            },
        ],
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <FaqClient />
        </>
    );
}
