import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ContentItem, DigestSection, SummarizedContent } from './types';

// Lazy initialization for clients
let groqClient: Groq | null = null;
let genAIClient: GoogleGenerativeAI | null = null;

function getGroqClient() {
    if (!groqClient) {
        groqClient = new Groq({
            apiKey: process.env.GROQ_API_KEY,
        });
    }
    return groqClient;
}

function getGeminiClient() {
    if (!genAIClient) {
        genAIClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    }
    return genAIClient;
}

// Using Llama 3.3 70B for high-quality writing
const MODEL_NAME = 'llama-3.3-70b-versatile';

// ============================================================================
// Unified Narrative Generation (Groq-powered)
// ============================================================================

export interface UnifiedBriefing {
    narrative: string;       // The main written newsletter
    subject: string;         // Catchy subject line
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

    const { narrative, subject } = await synthesizeUnifiedNarrative(balancedItems, provider);

    return {
        narrative,
        subject,
        topStories: balancedItems.slice(0, 8), // Top 8 for deep dive links
        generatedAt: new Date().toISOString()
    };
}

async function synthesizeUnifiedNarrative(items: ContentItem[], provider: 'groq' | 'gemini' = 'groq'): Promise<{ narrative: string; subject: string }> {
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
Your goal is to synthesize the provided inputs into a high-value, executive-level internal briefing. 
**Do not write like a standard news recap.** Write like a Chief of Staff briefing a CEO who has 2 minutes to understand the most critical shifts in the world today.

**TONE GUIDELINES:**
- **Insight > Information**: Don't just say what happened. Say why it matters, who wins/loses, and what happens next.
- **Density**: Every sentence must carry weight. Cut all fluff.
- **No generic openers**: BAN phrases like "In today's fast-paced world...", "The landscape is shifting...", "It remains to be seen...". Start directly with the insight.
- **Skeptical & Smart**: It is okay to be critical of PR announcements.
- **NO META-COMMENTARY**: Never say "This article discusses...", "The video covers...", "The author argues...". Just state the argument or fact directly.

### OUTPUT FORMAT (Strict)
You must output exactly two parts separated by "---NARRATIVE_START---".

SUBJECT: [Write a catchy, curiosity-inducing subject line (max 8 words). The first 3-4 words must be a strong hook related to the Lead Story.]
---NARRATIVE_START---
[The rest of the newsletter content]

### SECTIONS (Strict Structure for Narrative)

1. **THE LEAD** (2-3 paragraphs)
   - Synthesis of the Single Most Important Story. 
   - **Paragraph 1**: The Event (What actually happened, stripped of PR spin).
   - **Paragraph 2**: The Context (Why this matters *now*).
   - **Paragraph 3**: The Forward Look (Second-order effects, what to watch for next).

2. **THE BRIEFING** (News & Updates - EXPANDED)
   - Group remaining *High Quality* stories by theme (e.g., "AI & Compute", "Markets", "Big Tech").
   - **Each Theme Must Have 2-3 Items**.
   - For each item, write a 2-sentence summary:
     - Sentence 1: **The Insight/Fact**. (e.g., "NVIDIA's new chip creates a moat that AMD cannot cross for 18 months.")
     - Sentence 2: **The Implication**. (e.g., "This forces data centers to lock in contracts now, removing liquidity from the market.")
   - **DO NOT** use phrases like "This story is about..." or "X announced Y". Be direct.
   - Use **Bold** for organizations/people.
   - Use [Link Text](URL) for citations.

3. **THE PLAYBOOK** (Mental Models & Lessons)
   - *Crucial*: Look at [TYPE: PODCAST] or [TYPE: YOUTUBE VIDEO] items.
   - Extract **3 Specific Mental Models** or **Lessons** from the content.
   - You MUST format them as distinct items separated by a blank line:
   
   **1. The Lesson Title**
   > "The direct impactful quote goes here..."
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
5. **DIRECTNESS**: If a source says "AI is dangerous", write "AI is dangerous because X", NOT "The source says AI is dangerous".

### INPUT DATA
${itemsText}

BEGIN BRIEFING:`;

        console.log('[Groq] Sending unified briefing request...');

        const chatCompletion = await getGroqClient().chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: MODEL_NAME,
            temperature: 0.5, // Lower temperature for more factual/concise output
            max_tokens: 2500,
        });

        let rawText = '';
        if (provider === 'gemini') {
            rawText = await callGemini(prompt);
        } else {
            rawText = chatCompletion.choices[0]?.message?.content || '';
        }

        // Parse Output
        let subject = `Signal: ${today}`;
        let narrative = rawText;

        if (rawText.includes('---NARRATIVE_START---')) {
            const parts = rawText.split('---NARRATIVE_START---');
            const subjectPart = parts[0].replace('SUBJECT:', '').trim();
            subject = subjectPart || `Signal: ${today}`;
            narrative = parts[1].trim();
        } else if (rawText.startsWith('SUBJECT:')) {
            // Fallback parsing if separator is missing but SUBJECT: exists
            const subjectMatch = rawText.match(/^SUBJECT:(.+?)(\n|$)/);
            if (subjectMatch) {
                subject = subjectMatch[1].trim();
                narrative = rawText.replace(subjectMatch[0], '').trim();
            }
        }

        return { subject, narrative };

    } catch (error: any) {
        console.error('[Groq] Error generating unified narrative:', error.message || error);
        return {
            subject: `Signal: Your Daily Briefing — ${new Date().toLocaleDateString()}`,
            narrative: generateFallbackBriefing(items)
        };
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
Hey! Here's your quick briefing for ${today}.

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

        const chatCompletion = await getGroqClient().chat.completions.create({
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
        const model = getGeminiClient().getGenerativeModel({ model: "gemini-1.5-flash" }); // Using Flash for speed/cost, Pro for quality if needed

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
    } catch (error: any) {
        console.error('[Gemini] Error:', error.message || error);
        throw error; // Let the caller handle fallback
    }
}
