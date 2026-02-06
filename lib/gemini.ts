import { GoogleGenerativeAI } from '@google/generative-ai';
import { ContentItem, DigestSection, SummarizedContent } from './types';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const MODEL_NAME = 'gemini-1.5-flash';

export async function generateBriefing(groupedContent: Record<string, ContentItem[]>): Promise<DigestSection[]> {
    const sections: DigestSection[] = [];

    for (const [category, items] of Object.entries(groupedContent)) {
        if (items.length === 0) continue;

        // 1. Synthesize the section (Narrative)
        // We send top 15 items to avoid token limits
        const topItems = items.slice(0, 15);
        const synthesis = await synthesizeCategory(category, topItems);

        // 2. Select top items (we'll just pass the top 5 for the email list)
        const listItems = topItems.slice(0, 5).map(item => ({
            ...item,
            summary: '' // Narrative covers it
        }));

        sections.push({
            title: category.toUpperCase(),
            summary: synthesis,
            items: listItems
        });
    }

    return sections;
}

async function synthesizeCategory(category: string, items: ContentItem[]): Promise<string> {
    try {
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });

        // Construct the context
        const itemsText = items.map((item, i) =>
            `[${i + 1}] Title: ${item.title}\nSource: ${item.source}\nSnippet: ${item.description.slice(0, 300)}`
        ).join('\n\n');

        const prompt = `
      You are an elite executive briefer. Your job is to synthesize news items about "${category}" into a cohesive, high-level narrative.

      RULES:
      1. Write a 2-paragraph "Executive Summary" connecting the dots.
      2. Identify the single biggest trend or story.
      3. Use bolding (e.g., **Apple**) for key entities.
      4. Do NOT just list them ("Item 1 did this"). Weave them together.
      5. Tone: Professional, concise, insightful (like Axios).
      6. Return ONLY the narrative text.

      INPUT DATA:
      ${itemsText}
    `;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        return text.trim();
    } catch (error) {
        console.error(`Error synthesizing category ${category}:`, error);
        return `Updates on ${category} from ${items.length} sources.`;
    }
}

// Legacy function
export async function summarizeContent(item: ContentItem): Promise<string> {
    return item.description.slice(0, 200);
}
