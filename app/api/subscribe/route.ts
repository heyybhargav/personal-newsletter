import { NextResponse } from 'next/server';
import { createUser, addSourceToUser } from '@/lib/db';
import { Source } from '@/lib/types';

export async function POST(request: Request) {
    try {
        const { email, topics, timezone } = await request.json();

        if (!email || !topics || !Array.isArray(topics)) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        // 1. Create User
        await createUser(email, { timezone });

        // 2. Add Sources based on Topics
        // For MVP, we'll map topics to 1-2 hardcoded high-quality sources
        const sourcesToAdd: Partial<Source>[] = [];

        // Simple mapping for now
        for (const topic of topics) {
            switch (topic) {
                case 'tech':
                    sourcesToAdd.push({ name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', type: 'news', enabled: true });
                    sourcesToAdd.push({ name: 'TechCrunch', url: 'https://techcrunch.com/feed/', type: 'news', enabled: true });
                    break;
                case 'ai':
                    sourcesToAdd.push({ name: 'OpenAI Blog', url: 'https://openai.com/blog/rss.xml', type: 'news', enabled: true });
                    break;
                case 'world':
                    sourcesToAdd.push({ name: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', type: 'news', enabled: true });
                    break;
                case 'finance':
                    sourcesToAdd.push({ name: 'CNBC', url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', type: 'news', enabled: true });
                    break;
                case 'design':
                    sourcesToAdd.push({ name: 'Smashing Magazine', url: 'https://www.smashingmagazine.com/feed/', type: 'news', enabled: true });
                    break;
                case 'science':
                    sourcesToAdd.push({ name: 'NASA Breaking News', url: 'https://www.nasa.gov/rss/dyn/breaking_news.rss', type: 'news', enabled: true });
                    break;
            }
        }

        // Add them to DB
        for (const source of sourcesToAdd) {
            if (source.name && source.url && source.type) {
                await addSourceToUser(email, source as Omit<Source, 'id' | 'addedAt'>);
            }
        }

        return NextResponse.json({ success: true, count: sourcesToAdd.length });

    } catch (error: unknown) {
        const err = error as Error;
        console.error('Subscribe error:', err);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
