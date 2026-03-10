import Groq from 'groq-sdk';
import { GoogleGenAI } from '@google/genai';
import { ContentItem, DigestSection, SummarizedContent } from './types';

// Lazy initialization for clients
let groqClient: Groq | null = null;
let genAIClient: GoogleGenAI | null = null;

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
        genAIClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
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
    preheader: string;       // Hidden preview text for inbox hook
    topStories: ContentItem[]; // Curated links for "Deep Dive"
    generatedAt: string;
    tokenUsage?: {
        input: number;
        output: number;
        model: string;
        provider: string;
    };
}

// ============================================================================
// Smart Content Balancing Logic
// ============================================================================

function balanceContent(items: ContentItem[]): ContentItem[] {
    const MAX_ITEMS_PER_SOURCE = 3;
    const MAX_TOTAL_ITEMS = 50; // Cap context window (increased for richer briefings)

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

export async function generateUnifiedBriefing(allContent: ContentItem[], provider: string = 'groq', firstName?: string): Promise<UnifiedBriefing> {
    // Apply Smart Balancing
    const balancedItems = balanceContent(allContent);

    const result = await synthesizeUnifiedNarrative(balancedItems, provider, firstName);

    return {
        narrative: result.narrative,
        subject: result.subject,
        preheader: result.preheader,
        topStories: balancedItems.slice(0, 8),
        generatedAt: new Date().toISOString(),
        tokenUsage: result.tokenUsage
    };
}

interface TokenUsageResult {
    input: number;
    output: number;
    model: string;
    provider: string;
}

async function synthesizeUnifiedNarrative(items: ContentItem[], provider: string = 'groq', firstName?: string): Promise<{ narrative: string; subject: string; preheader: string; tokenUsage: TokenUsageResult }> {
    try {
        // Validate the correct API key for the selected provider
        if (provider === 'gemini' || provider === 'gemini-pro') {
            if (!process.env.GEMINI_API_KEY) {
                console.error('[LLM] CRITICAL: GEMINI_API_KEY is not set!');
                throw new Error('Gemini API key missing');
            }
        } else {
            if (!process.env.GROQ_API_KEY) {
                console.error('[LLM] CRITICAL: GROQ_API_KEY is not set!');
                throw new Error('Groq API key missing');
            }
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

            // Clean description (truncate hugely for technical context)
            let cleanDesc = item.description ? item.description.slice(0, 3000).replace(/\n/g, ' ') : 'No description';

            // Format pubDate nicely for AI context
            const formattedDate = new Date(item.pubDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });

            return `ITEM #${i + 1} ${typeHint}
   TITLE: "${item.title}"
   SOURCE: ${item.source}
   PUBLISHED_DATE: ${formattedDate}
   LINK: ${item.link}${imageContext}
   CONTENT: ${cleanDesc}`;
        }).join('\n\n');

        const prompt = `You are a Deep Technical Researcher and Intelligence Lead. Your goal is to produce a comprehensive technical intelligence report that REPLACES the need to read any of the provided sources. 

TODAY: ${today}
${firstName ? `READER'S FIRST NAME: ${firstName}` : ''}

### STRATEGIC DIRECTIVES (The "No-Click Mandate")

1. **TECHNICAL DEPTH OVER RECOGNITION**
- Never summarize. Deconstruct. Explain the *mechanics*, *first principles*, and *long-term implications* behind every insight. 
- **The "Mastery" Test**: After reading an entry, the reader should feel as though they have spent 20 minutes studying the source material themselves. You must provide enough technical detail that they could explain the concept's architecture or logic to another expert.

2. **VOICE: AUTHORITATIVE & EXPLICATIVE**
- You are a researcher who has spent all day in the weeds. Lead with information density.
- **BANNED PHRASES**: "You need to be paying attention to...", "The bottom line is this...", "It's moving fast.", "Here's what you should know...", "This is a must-read.", "Worth a listen.", "Check it out.", or any motivational closing questions.
- **TARGET LENGTH**: Aim for a substantial, wide-ranging report (1500-2000 words if the signal density allows). Do not sacrifice depth for speed.

3. **SPECIFICITY & MECHANICS**
- Vague claims are failures. Every insight must contain the specific "HOW" and "WHY."
- Bad: "MKBHD says the Studio Display is expensive."
- Good: "MKBHD's hardware deconstruction reveals the Studio Display XDR's fatal flaw for professionals: at $5,000, it lacks the local dimming zones of contemporaries, meaning true blacks are impossible and HDR performance is artificially capped despite the 'XDR' branding. The value proposition vanishes for anyone not strictly anchored to Apple's reference-grade TrueTone and ecosystem integration for color-accurate Mac pipelines."

4. **ONE ITEM, ONE DEEP-DIVE IDEA**
- Extract the single most complex and rewarding idea from each source. Explain it in full technical detail.

5. **REAL SYNTHESIS**
- If sources contradict or reinforce each other, build a narrative about the conflict or trend. Do not force connections; let the technical weight of the ideas carry the report.

6. **TEMPORAL ACCURACY**
- Today is ${today}. Always check the \`PUBLISHED_DATE\`. Never frame old content as new.

### OUTPUT FORMAT (Strict)
You must output exactly three parts: SUBJECT, PREHEADER, and then the NARRATIVE (separated by "---NARRATIVE_START---").
SUBJECT: [Substantive and descriptive. NO MARKDOWN.]
PREHEADER: [A technical hook. NO MARKDOWN.]
---NARRATIVE_START---

### STRUCTURE
**THE LEAD ANALYSIS** (Extended Narrative)
- Pick the most profound technical discovery. Build a deep-dive analysis (3-5 paragraphs) around it.
- Explain the context, the secret, and the future fallout.
- Hyperlink technical claims directly to source URLs inline [claim](LINK).

**THE SIGNAL** (Standalone Technical Blocks)
- For every other high-signal item, provide a **dense paragraph (3-5 sentences)**.
- Format: **Bold the key technical entity** → then the multi-sentence explanation of the mechanism or insight.
- Every block must contain specific data points, names, or non-obvious mechanical secrets.

**WATCH THIS** (Optional — YouTube only)
- Render as HTML highlighted card ONLY for the best video. Caption must be a 5-word technical synthesis.

**NO FILLER**
- End with the final technical insight. No motivational conclusions, no questions, no fluff.

### CRITICAL CONSTRAINTS
- **NO EM DASHES.** Strictly prohibited.
- **NO HALLUCINATIONS.**
- **DEPTH IS THE CONSTRAINT.** Do not cut for time. Cut only for lack of signal.

### INPUT DATA
${itemsText}

BEGIN TECHNICAL INTELLIGENCE REPORT:`;

        console.log(`[LLM] Sending unified briefing request via ${provider}...`);

        let rawText = '';
        let tokenUsage: TokenUsageResult = { input: 0, output: 0, model: '', provider: '' };

        if (provider === 'gemini' || provider === 'gemini-pro') {
            const modelId = provider === 'gemini-pro' ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
            const geminiRes = await callGemini(prompt, modelId);
            rawText = geminiRes.text;
            tokenUsage = {
                input: geminiRes.inputTokens,
                output: geminiRes.outputTokens,
                model: modelId,
                provider: provider
            };
        } else {
            const chatCompletion = await getGroqClient().chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: MODEL_NAME,
                temperature: 0.5,
                max_tokens: 4000,
            });
            rawText = chatCompletion.choices[0]?.message?.content || '';
            tokenUsage = {
                input: chatCompletion.usage?.prompt_tokens || 0,
                output: chatCompletion.usage?.completion_tokens || 0,
                model: MODEL_NAME,
                provider: 'groq'
            };
        }

        // Parse Output
        let subject = `Signal: ${today}`;
        let preheader = `Your daily intelligence briefing for ${today}.`;
        let narrative = rawText;

        if (rawText.includes('---NARRATIVE_START---')) {
            const parts = rawText.split('---NARRATIVE_START---');
            const metaPart = parts[0].trim();

            // Extract Subject (match anything up until \nPREHEADER: or end of string)
            const subjectMatch = metaPart.match(/SUBJECT:([\s\S]+?)(?=\nPREHEADER:|$)/);
            if (subjectMatch) subject = subjectMatch[1].trim();

            // Extract Preheader
            const preheaderMatch = metaPart.match(/PREHEADER:([\s\S]+?)$/);
            if (preheaderMatch) preheader = preheaderMatch[1].trim();

            narrative = parts[1].trim();
        } else if (rawText.startsWith('SUBJECT:')) {
            // Fallback parsing
            const subjectMatch = rawText.match(/^SUBJECT:(.+?)(\n|$)/);
            if (subjectMatch) {
                subject = subjectMatch[1].trim();
                narrative = rawText.replace(subjectMatch[0], '').trim();
            }
        }

        // Failsafe: Strip any stray markdown asterisks from subject and preheader
        subject = subject.replace(/\*/g, '').trim();
        preheader = preheader.replace(/\*/g, '').trim();

        console.log(`[LLM] Parsed Preheader: "${preheader}"`);
        console.log(`[LLM] Token Usage: ${tokenUsage.input} input, ${tokenUsage.output} output (${tokenUsage.provider}/${tokenUsage.model})`);

        return { subject, narrative, preheader, tokenUsage };

    } catch (error: any) {
        console.error('[LLM] Error generating unified narrative:', error.message || error);
        return {
            subject: `Signal: Your Daily Briefing — ${new Date().toLocaleDateString()}`,
            preheader: `Quick intelligence updates for today.`,
            narrative: generateFallbackBriefing(items),
            tokenUsage: { input: 0, output: 0, model: (provider === 'gemini' || provider === 'gemini-pro') ? 'gemini-3-flash-preview' : MODEL_NAME, provider: provider || 'groq' }
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

async function callGemini(prompt: string, modelId: string = 'gemini-3-flash-preview'): Promise<{ text: string, inputTokens: number, outputTokens: number }> {
    try {
        if (!process.env.GEMINI_API_KEY) {
            console.error('[Gemini] CRITICAL: GEMINI_API_KEY is not set!');
            throw new Error('Gemini API key missing');
        }

        console.log(`[Gemini] Sending request via model: ${modelId}...`);
        const client = getGeminiClient();

        const response = await client.models.generateContent({
            model: modelId,
            contents: prompt,
        });

        return {
            text: (response.text || '').trim(),
            inputTokens: response.usageMetadata?.promptTokenCount || 0,
            outputTokens: response.usageMetadata?.candidatesTokenCount || 0
        };
    } catch (error: any) {
        console.error(`[Gemini] Error with model ${modelId}:`, error.message || error);
        throw error;
    }
}
