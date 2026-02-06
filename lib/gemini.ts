import Groq from 'groq-sdk';
import { ContentItem, DigestSection, SummarizedContent } from './types';

// Initialize Groq
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

// Using Llama 3.3 70B for high-quality writing
const MODEL_NAME = 'llama-3.3-70b-versatile';

// ============================================================================
// Unified Narrative Generation (Groq-powered)
// ============================================================================

export interface UnifiedBriefing {
    narrative: string;       // The main written newsletter
    topStories: ContentItem[]; // Curated links for "Deep Dive"
    generatedAt: string;
}

export async function generateUnifiedBriefing(allContent: ContentItem[]): Promise<UnifiedBriefing> {
    // Take top 25 most recent items across all sources
    const topItems = allContent
        .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
        .slice(0, 25);

    const narrative = await synthesizeUnifiedNarrative(topItems);

    return {
        narrative,
        topStories: topItems.slice(0, 8), // Top 8 for deep dive links
        generatedAt: new Date().toISOString()
    };
}

async function synthesizeUnifiedNarrative(items: ContentItem[]): Promise<string> {
    try {
        // Validate API key
        if (!process.env.GROQ_API_KEY) {
            console.error('[Groq] CRITICAL: GROQ_API_KEY is not set!');
            throw new Error('API key missing');
        }

        // Build rich context from all items
        const itemsText = items.map((item, i) =>
            `[${i + 1}] "${item.title}" — ${item.source}\n${item.description ? item.description.slice(0, 350) : ''}`
        ).join('\n\n');

        const today = new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const prompt = `You are Sarah Chen, the senior editor of "The Daily Executive Briefing" — a premium newsletter read by 50,000 busy professionals over their morning coffee.

TODAY'S DATE: ${today}

YOUR MISSION:
Write today's edition of the newsletter based on the stories below. This is NOT a summary of links. This is a WRITTEN NEWSLETTER — like Morning Brew, Axios, or The Hustle.

WRITING STYLE GUIDE:

1. **OPENING HOOK (2-3 sentences)**
   Start with the single most important or interesting story of the day.
   Make it punchy. "Here are today's links" is BANNED.
   Good examples:
   - "The AI wars just got personal."
   - "If you thought cloud spending was slowing down, think again."
   - "Reddit is betting its future on AI search. Bold move."

2. **THE BIG PICTURE (2-3 paragraphs)**
   Weave the top 3-5 stories into a cohesive narrative.
   - Find connections between stories ("The timing isn't coincidental...")
   - Add your take ("This signals a broader shift in...")
   - Use **bold** for key companies, people, numbers, and terms
   - Keep paragraphs SHORT: 2-3 sentences max

3. **QUICK HITS (3-5 one-liners)**
   For stories that don't fit the main narrative, include them as punchy one-liners.
   Format: "**[Entity]** did [action]. [One sentence of context or snark]."

4. **KICKER (1 sentence)**
   End with something memorable — a prediction, a joke, or a thought-provoking question.
   Example: "The question isn't whether AI will change everything. It's whether we're ready."

FORMATTING RULES:
- Use **bold** liberally for key names and numbers
- NO bullet points in the main narrative (Quick Hits excepted)
- NO headers or section titles — this should read as flowing prose
- Length: AIM FOR 300-500 words. Take your time. Quality over brevity.
- If stories seem unrelated, use transitions like "Meanwhile...", "In other news...", "Elsewhere..."

TODAY'S STORIES:

${itemsText}

Now write today's edition. Remember: you're Sarah Chen, a sharp, witty editor who makes complex news feel accessible. Your readers love you for your clarity and personality.

BEGIN:`;

        console.log('[Groq] Sending unified briefing request...');

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'user',
                    content: prompt,
                }
            ],
            model: MODEL_NAME,
            temperature: 0.7,
            max_tokens: 1500,
        });

        const text = chatCompletion.choices[0]?.message?.content || '';
        console.log('[Groq] Successfully generated narrative:', text.slice(0, 100) + '...');
        return text.trim();

    } catch (error: any) {
        console.error('[Groq] Error generating unified narrative:', error.message || error);

        // Graceful fallback: Generate a simple "Quick Hits" style summary
        return generateFallbackBriefing(items);
    }
}

function generateFallbackBriefing(items: ContentItem[]): string {
    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    });

    const quickHits = items.slice(0, 5).map(item =>
        `• **${item.source}**: ${item.title}`
    ).join('\n');

    return `
Good morning! Here's your quick briefing for ${today}.

Our AI editor is warming up, so here's a streamlined version of today's top stories:

${quickHits}

Dive into the links below for the full details. See you tomorrow! ☕
`.trim();
}

// ============================================================================
// LEGACY: Per-Category Generation (kept for backward compatibility)
// ============================================================================

export async function generateBriefing(groupedContent: Record<string, ContentItem[]>): Promise<DigestSection[]> {
    const sections: DigestSection[] = [];

    for (const [category, items] of Object.entries(groupedContent)) {
        if (items.length === 0) continue;

        const topItems = items.slice(0, 15);
        const synthesis = await synthesizeCategoryLegacy(category, topItems);

        const listItems = topItems.slice(0, 5).map(item => ({
            ...item,
            summary: ''
        }));

        sections.push({
            title: category.toUpperCase(),
            summary: synthesis,
            items: listItems
        });
    }

    return sections;
}

async function synthesizeCategoryLegacy(category: string, items: ContentItem[]): Promise<string> {
    try {
        if (!process.env.GROQ_API_KEY) {
            throw new Error('API key missing');
        }

        const itemsText = items.map((item, i) =>
            `HEADLINE: ${item.title}\nSOURCE: ${item.source}\nCONTEXT: ${item.description ? item.description.slice(0, 400) : 'No description provided'}`
        ).join('\n---\n');

        const prompt = `You are the Editor-in-Chief of a premium daily newsletter (think "Morning Brew" or "Axios"). 

Write a cohesive, engaging paragraph for the "${category}" section. Connect the dots between stories. Use **bold** for key entities. Keep it under 150 words. No bullet points.

INPUT:
${itemsText}`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: MODEL_NAME,
            temperature: 0.7,
            max_tokens: 500,
        });

        return chatCompletion.choices[0]?.message?.content?.trim() || `Today's ${category} stories are ready for your review.`;
    } catch (error) {
        console.error(`[Groq] Error synthesizing ${category}:`, error);
        return `Today's ${category} stories are ready for your review. Check the links below for the full details.`;
    }
}

// Legacy function
export async function summarizeContent(item: ContentItem): Promise<string> {
    return item.description.slice(0, 200);
}
