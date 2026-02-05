import { GoogleGenerativeAI } from '@google/generative-ai';
import { ContentItem, DigestSection } from './types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function summarizeContent(item: ContentItem): Promise<string> {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `Summarize this content in 2-3 concise sentences that capture the key points. Make it engaging and easy to understand:

Title: ${item.title}
Content: ${item.description.slice(0, 1000)}

Summary:`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        return response.text().trim();
    } catch (error) {
        console.error('Error summarizing content:', error);
        return item.description.slice(0, 200) + '...';
    }
}

export async function generateDigest(groupedContent: Map<string, ContentItem[]>): Promise<DigestSection[]> {
    const sections: DigestSection[] = [];

    // Define section order and titles
    const sectionConfig = [
        { type: 'youtube', title: '📺 YouTube Updates' },
        { type: 'podcast', title: '🎙️ Podcast Episodes' },
        { type: 'news', title: '📰 Top News' },
        { type: 'reddit', title: '💬 Reddit Discussions' },
        { type: 'custom', title: '🔖 Other Sources' }
    ];

    for (const config of sectionConfig) {
        const items = groupedContent.get(config.type);
        if (!items || items.length === 0) continue;

        // Limit to top 5 items per section
        const topItems = items.slice(0, 5);

        // Summarize each item
        const summarizedItems = await Promise.all(
            topItems.map(async (item) => ({
                title: item.title,
                summary: await summarizeContent(item),
                link: item.link,
                source: item.source
            }))
        );

        sections.push({
            title: config.title,
            items: summarizedItems
        });
    }

    return sections;
}

export async function rankContentByImportance(items: ContentItem[]): Promise<ContentItem[]> {
    // Use simple heuristics for now:
    // 1. Newer content is more important
    // 2. Longer descriptions suggest more substantial content
    return items.sort((a, b) => {
        const dateScore = new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
        const lengthScore = b.description.length - a.description.length;
        return dateScore * 0.7 + lengthScore * 0.3;
    });
}
