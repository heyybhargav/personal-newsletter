export interface BlogPost {
    slug: string;
    title: string;
    subtitle: string;
    date: string;
    readTime: string;
    content: BlogSection[];
}

export interface BlogSection {
    heading?: string;
    paragraphs: string[];
}

export const BLOG_POSTS: BlogPost[] = [
    {
        slug: 'why-signal',
        title: 'The Smartest Thing You Can Do With 5 Minutes Every Day',
        subtitle: 'And why you\'re probably spending 45 instead.',
        date: 'March 7, 2025',
        readTime: '4 min read',
        content: [
            {
                paragraphs: [
                    'The people who always seem to know things before everyone else have one thing in common.',
                    'They have a reading habit. Not a reading intention. A habit.',
                    'There\'s a difference. Intention is "I should catch up on what\'s happening." Habit is something that already happened by the time you\'re thinking about it.',
                ],
            },
            {
                heading: 'The problem',
                paragraphs: [
                    'Most people don\'t lack access to good information. They lack a system for getting it without spending an hour on it.',
                    'The options all have the same problem. Scrolling through feeds takes longer than it should and leaves you with a vague impression of the world rather than actual understanding. Subscribing to newsletters means something new to ignore every day. RSS readers show you everything, which means you still have to do the work of deciding what matters.',
                    'And the people building those products made a choice: they gave you more. More sources. More filters. More discovery. All of which requires your time and attention to operate.',
                ],
            },
            {
                heading: 'The ChatGPT shortcut',
                paragraphs: [
                    'A lot of people have figured out a partial solution. They paste a few links into ChatGPT and ask for a summary. It works, actually. The output is usually good.',
                    'But it requires you to show up with the links. To already know what you want to read. To do it every single day with enough consistency to make it a habit. In practice, it happens a few times and then stops.',
                    'The insight is right. The process doesn\'t hold.',
                ],
            },
            {
                heading: 'Why habits need to be automatic',
                paragraphs: [
                    'Habits work because they become automatic. The moment you have to decide to do something, you\'ve introduced friction. Friction is where habits die.',
                    'A briefing that arrives at whatever time you set, every day, without you thinking about it, removes that friction entirely. You don\'t open it because you remembered to. You open it because it\'s there.',
                    'That reliability does more for a reading habit than any feature.',
                ],
            },
            {
                heading: 'Why your briefing should be about you',
                paragraphs: [
                    'Morning Brew and TLDR are well-written and genuinely useful. They\'re also written for everyone. The same piece of news lands in your inbox and in the inbox of someone in a completely different field with completely different concerns. The signal-to-relevance ratio suffers.',
                    'Feedly and Google Discover give you control, but they hand the work back to you.',
                    'What changes when the briefing pulls from your specific sources is that every item in it is already worth your time. You chose those sources for a reason. The synthesis ties them together. You get a complete picture of what happened in the world you actually care about.',
                ],
            },
            {
                heading: 'Why Signal',
                paragraphs: [
                    'Signal reads what you follow and turns it into a single, well-written briefing, delivered whenever you want it.',
                    'No feeds. No apps. No remembering to check anything.',
                    'Just the things that matter to you, already read and synthesized, waiting in your inbox.',
                ],
            },
        ],
    },
];

export function getBlogPost(slug: string): BlogPost | undefined {
    return BLOG_POSTS.find(p => p.slug === slug);
}
