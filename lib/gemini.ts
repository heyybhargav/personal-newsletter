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

        // Better context construction
        const itemsText = items.map((item, i) =>
            `HEADLINE: ${item.title}\nSOURCE: ${item.source}\nCONTEXT: ${item.description ? item.description.slice(0, 400) : 'No description provided'}`
        ).join('\n---\n');

        const prompt = `
      You are the Editor-in-Chief of a premium daily newsletter (think "Morning Brew" or "Axios"). 
      
      YOUR TASK:
      Write a cohesive, engaging, and witty "Executive Briefing" for the "${category}" section based on the items below.
      
      STRICT WRITING RULES:
      1. **NO LISTS**: Do not say "Here are the updates" or utilize bullet points. Write in full, flowing paragraphs.
      2. **NARRATIVE FIRST**: Connect the dots between stories. Identify a common theme. If stories are unrelated, pivot smoothly (e.g., "In other news...", "Meanwhile...").
      3. **LEAD WITH IMPACT**: Start with the most important story. Why does it matter?
      4. **VOICE**: Smart, concise, slightly conversational but professional.
      5. **FORMATTING**: Use **bold** for key companies, people, or numbers to make it skimmable.
      6. **LENGTH**: Keep it under 200 words.
      
      CRITICAL: If the input content seems like noise or spam, just write a very short sentence saying "A quiet day for ${category} today."

      INPUT ITEMS:
      ${itemsText}
    `;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        return text.trim();
    } catch (error) {
        console.error(`Error synthesizing category ${category}:`, error);
        // Fallback that looks slightly better than a hard error
        return `We successfully aggregated ${items.length} stories for ${category}, but our AI editor is taking a quick coffee break. Please check the deep dive links below for the details.`;
    }
}

// Legacy function
export async function summarizeContent(item: ContentItem): Promise<string> {
    return item.description.slice(0, 200);
}
