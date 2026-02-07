import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ContentItem, DigestSection, SummarizedContent } from './types';

// Initialize Groq
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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

// ============================================================================
// Smart Content Balancing Logic
// ============================================================================

function balanceContent(items: ContentItem[]): ContentItem[] {
    const MAX_ITEMS_PER_SOURCE = 3;
    const MAX_TOTAL_ITEMS = 35; // Cap context window

    // 1. Group by Source Name
    const bySource: Record<string, ContentItem[]> = {};
    items.forEach(item => {
        if (!bySource[item.source]) bySource[item.source] = [];
        bySource[item.source].push(item);
    });

    // 2. Pick top N from each source (Round Robin-ish)
    let balanced: ContentItem[] = [];
    Object.values(bySource).forEach(sourceItems => {
        // Sort by date desc
        sourceItems.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
        // Take max 3
        balanced.push(...sourceItems.slice(0, MAX_ITEMS_PER_SOURCE));
    });

    // 3. Ensure Diversity: Prioritize specific types if they exist (Video/Podcast)
    // (They are already included above, but we want to make sure they survive the final cut)

    // 4. Final Sort and Cut
    balanced.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
    return balanced.slice(0, MAX_TOTAL_ITEMS);
}

export async function generateUnifiedBriefing(allContent: ContentItem[], provider: 'groq' | 'gemini' = 'groq'): Promise<UnifiedBriefing> {
    // Apply Smart Balancing
    const balancedItems = balanceContent(allContent);

    const narrative = await synthesizeUnifiedNarrative(balancedItems, provider);

    return {
        narrative,
        topStories: balancedItems.slice(0, 8), // Top 8 for deep dive links
        generatedAt: new Date().toISOString()
    };
}

async function synthesizeUnifiedNarrative(items: ContentItem[], provider: 'groq' | 'gemini' = 'groq'): Promise<string> {
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

        // Pre-process items
        const itemsText = items.map((item, i) => {
            let typeHint = '[TYPE: ARTICLE]';
            // Simple heuristic for type
            if (item.source.toLowerCase().includes('youtube') || item.link.includes('youtube') || item.link.includes('youtu.be')) {
                typeHint = '[TYPE: YOUTUBE VIDEO]';
            } else if (item.source.toLowerCase().includes('podcast') || item.title.toLowerCase().includes('episode')) {
                typeHint = '[TYPE: PODCAST]';
            } else if (item.source.toLowerCase().includes('reddit')) {
                typeHint = '[TYPE: REDDIT THREAD]';
            }

            // Include thumbnail context
            let imageContext = item.thumbnail ? `\n   THUMBNAIL_URL: ${item.thumbnail}` : '';

            // Clean description (truncate huge podcast notes to fit context window)
            let cleanDesc = item.description ? item.description.slice(0, 1500).replace(/\n/g, ' ') : 'No description';

            return `ITEM #${i + 1} ${typeHint}
   TITLE: "${item.title}"
   SOURCE: ${item.source}
   LINK: ${item.link}${imageContext}
   CONTENT: ${cleanDesc}`;
        }).join('\n\n');

        const prompt = `You are the Executive Editor of a premium daily intelligence briefing involved in high-stakes decision making.
        
TODAY: ${today}

### MISSION
Your goal is to synthesize the provided inputs into a "Smart Brevity" style newsletter (think Axios/Morning Brew but higher IQ). 
You must filter out "fluff" and "PR speak". If a story has no substance, **IGNORE IT**.

### SECTIONS (Strict Structure)

1. **THE LEAD** (1-2 paragraphs)
   - Synthesis of the Single Most Important Story. 
   - WHY it matters.
   - Second-order effects.
   - *Style*: Insightful, bold, forward-looking.

2. **THE BRIEFING** (News & Updates)
   - **CRITICAL**: Do NOT repeat the story you selected for THE LEAD.
   - Group remaining *High Quality* stories by theme (e.g., "AI", "Markets", "Big Tech").
   - Use **Bold** for organizations/people.
   - Use [Link Text](URL) for citations.
   - *Style*: "Smart Brevity". Short sentences. Punchy.

3. **THE PLAYBOOK** (Mental Models & Lessons)
   - *Crucial*: Look at [TYPE: PODCAST] or [TYPE: YOUTUBE VIDEO] items.
   - Extract **3 Specific Mental Models** or **Lessons** from the content.
   - You MUST format them as distinct items separated by a blank line:
   
   **1. The Lesson Title**
   > "The direct impactful quote goes here..."
   — **Speaker Name**, on *[Source Name](url)*

   **2. Another Lesson Title**
   > "The second quote goes here..."
   — **Speaker Name**, on *[Source Name](url)*

   - *If no good lessons exist, OMIT THIS SECTION.*

4. **THE WATCHLIST** (Visuals)
   - For [TYPE: YOUTUBE VIDEO] items.
   - **Render HTML Cards**:
     <div style="margin-top:15px; margin-bottom: 25px; border-radius: 8px; overflow: hidden; border: 1px solid #eee;">
        <a href="LINK_URL" style="text-decoration:none; color: inherit;">
           <img src="THUMBNAIL_URL" style="width:100%; height: auto; display:block;" />
           <div style="padding: 12px; background: #f9f9f9;">
              <p style="margin:0; font-size:14px; font-weight:600; color:#333;">▶️ Watch: TITLE_HERE</p>
           </div>
        </a>
     </div>

### CRITICAL RULES
1. **NO FLUFF**: Never write "In today's landscape...". Start with the news.
2. **FILTERING**: If an Item has "No description" or looks like a boring ad, **DO NOT INCLUDE IT**.
3. **ACCURACY**: Strict hallucination check. Do not invent details.
4. **IMAGES**: Use the HTML provided above for YouTube only.

### INPUT DATA
${itemsText}

BEGIN BRIEFING:`;

        console.log('[Groq] Sending unified briefing request...');

        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: MODEL_NAME,
            temperature: 0.5, // Lower temperature for more factual/concise output
            max_tokens: 2500,
        });

        if (provider === 'gemini') {
            return await callGemini(prompt);
        }

        const text = chatCompletion.choices[0]?.message?.content || '';
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

// ============================================================================
// GEMINI IMPLEMENTATION
// ============================================================================

async function callGemini(prompt: string): Promise<string> {
    try {
        if (!process.env.GEMINI_API_KEY) {
            console.error('[Gemini] CRITICAL: GEMINI_API_KEY is not set!');
            throw new Error('Gemini API key missing');
        }

        console.log('[Gemini] Sending unified briefing request...');
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Using Flash for speed/cost, Pro for quality if needed

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
    } catch (error: any) {
        console.error('[Gemini] Error:', error.message || error);
        throw error; // Let the caller handle fallback
    }
}
