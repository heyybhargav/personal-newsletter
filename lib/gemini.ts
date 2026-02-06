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
        if (!process.env.GROQ_API_KEY) {
            console.error('[Groq] CRITICAL: GROQ_API_KEY is not set!');
            throw new Error('API key missing');
        }

        const today = new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Pre-process items to help the AI identify types
        const itemsText = items.map((item, i) => {
            let typeHint = '[TYPE: ARTICLE]';
            if (item.source.toLowerCase().includes('youtube') || item.link.includes('youtube') || item.link.includes('youtu.be')) {
                typeHint = '[TYPE: YOUTUBE VIDEO]';
            } else if (item.source.toLowerCase().includes('podcast') || item.title.toLowerCase().includes('episode')) {
                typeHint = '[TYPE: PODCAST]';
            } else if (item.source.toLowerCase().includes('reddit')) {
                typeHint = '[TYPE: REDDIT THREAD]';
            }

            // Include thumbnail if available, for the AI to use in HTML
            let imageContext = item.thumbnail ? `\n   THUMBNAIL_URL: ${item.thumbnail}` : '';

            return `ITEM #${i + 1} ${typeHint}
   TITLE: "${item.title}"
   SOURCE: ${item.source}
   LINK: ${item.link}${imageContext}
   CONTENT: ${item.description ? item.description.slice(0, 500).replace(/\n/g, ' ') : 'No description'}`;
        }).join('\n\n');

        const prompt = `You are Sarah Chen, "The Insider" — a sharp, high-bandwidth analyst writing a private daily briefing for 50,000 busy tech and business leaders.

TODAY'S DATE: ${today}

Your goal is MAXIMAL INFORMATION DENSITY. Do not waste the reader's time with fluff.
BANNED PHRASES: "In today's digital landscape", "Game changer", "Revolutionary", "It remains to be seen", "In conclusion".

### CONTENT FRAMEWORK (Follow Strict Order):

1. **THE LEAD (Deep Dive)** - [Analysis Mode]
   - Pick the SINGLE most critically important story.
   - Write 2-3 paragraphs explaining WHY it matters and its second-order effects.
   - Tone: Analytical, insider, bold.
   - MUST hyperlink the title: "Google's [Project Astra](http...) suggests..."

2. **THE BRIEFING (Hybrid Narrative)** - [Synthesis Mode]
   - Cover the next 6-10 stories. 
   - DO NOT write a dry bulleted list. 
   - DO NOT write a generic essay.
   - **DO THIS**: Group related stories into "Narrative Blocks".
     - Example: "In AI infrastructure, Nvidia [revealed](url)... meanwhile AMD is [countering](url)..."
   - Every claim must look like: "...[claim](url)..."
   - Use **bold** for key entities.

3. **THE AUDIO FEED (Podcasts)** - [Quote Mode]
   - IF (and only if) there are [TYPE: PODCAST] items, pick the best insight.
   - Format:
     > "Direct quote from the episode..."
     — **Host Name**, in *[Episode Title](url)*

4. **THE WATCHLIST (Visuals)** - [Gallery Mode]
   - IF (and only if) there are [TYPE: YOUTUBE VIDEO] items, place them HERE at the end.
   - You MUST generate valid HTML for the thumbnail:
     <div style="margin-top:10px; margin-bottom: 20px;">
       <a href="url" style="text-decoration:none;">
          <img src="thumbnail_url" style="width:100%; border-radius:8px; display:block;" />
          <p style="margin-top:5px; font-size:14px; color:#555;">▶️ <strong>Watch:</strong> One sentence hook here.</p>
       </a>
     </div>

### CRITICAL RULES:
- **HYPERLINKS**: EVERY story you mention must be hyperlinked. No exceptions.
- **IMAGES**: Only use images for YouTube videos in the Watchlist section.
- **TONE**: Smart, concise, no corp-speak.
- **MARKDOWN**: Use standard markdown, but use HTML <img> tags for thumbnails.

### INPUT DATA:
${itemsText}

BEGIN BRIEFING:`;

        console.log('[Groq] Sending unified briefing request...');

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'user',
                    content: prompt,
                }
            ],
            model: MODEL_NAME,
            temperature: 0.6,
            max_tokens: 2000,
        });

        const text = chatCompletion.choices[0]?.message?.content || '';
        console.log('[Groq] Successfully generated narrative:', text.slice(0, 100) + '...');
        return text.trim();

    } catch (error: any) {
        console.error('[Groq] Error generating unified narrative:', error.message || error);
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
