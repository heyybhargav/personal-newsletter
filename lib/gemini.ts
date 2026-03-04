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

            // Clean description (truncate huge podcast notes to fit context window)
            let cleanDesc = item.description ? item.description.slice(0, 1500).replace(/\n/g, ' ') : 'No description';

            return `ITEM #${i + 1} ${typeHint}
   TITLE: "${item.title}"
   SOURCE: ${item.source}
   LINK: ${item.link}${imageContext}
   CONTENT: ${cleanDesc}`;
        }).join('\n\n');

        const prompt = `You are writing a daily intelligence email for one person. Your style is Shaan Puri meets Morning Brew — conversational, punchy, story-driven, and genuinely fun to read. You write like you're texting a very smart friend who's busy and doesn't have time for fluff.
        
TODAY: ${today}
${firstName ? `READER'S FIRST NAME: ${firstName}` : ''}

### YOUR VOICE
- **Conversational, not corporate.** Write like you talk. Short sentences. Short paragraphs. No "In today's rapidly evolving landscape..." ever.
- **Story-first.** Lead with the most interesting story, not a summary. Make the reader lean in.
- **Opinionated.** Have a take. "Here's what nobody's talking about..." or "Everyone's wrong about this..." — don't just report, react.
- **Contrarian when warranted.** If the mainstream narrative is lazy, call it out. 
- **Specific > Vague.** Use numbers, names, and details. "Revenue jumped 40%" beats "significant growth."
- **Direct address.** Use "you" frequently. Talk TO the reader, not AT them.
- **NO meta-commentary.** Never say "This article discusses..." or "The author argues..." — just state the insight as fact.

### OUTPUT FORMAT (Strict)
You must output exactly three parts: SUBJECT, PREHEADER, and then the NARRATIVE (separated by "---NARRATIVE_START---").
**CRITICAL: DO NOT use any markdown formatting (like **bold**) in the SUBJECT or PREHEADER.**

SUBJECT: [Punchy, curiosity-driven subject line. Max 8 words. Should make someone NEED to open the email. Think "The $4B mistake nobody saw" not "Weekly AI Industry Roundup". NO MARKDOWN.]
PREHEADER: [One sharp sentence that makes the subject line even more intriguing. NO MARKDOWN.]
---NARRATIVE_START---
[The newsletter content below]

### STRUCTURE (Follow this flow, but make it feel natural — not like a template)

**OPEN WITH A STORY** (2-3 short paragraphs)
- Pick the single most fascinating thing from the inputs. Tell it like a story.
- Start with a hook that creates tension or curiosity. A surprising number, a contrarian claim, a "wait, what?" moment.
- End this section with a clear takeaway or "so what?" that connects to the reader's world.
- **Hyperlink claims** directly to source URLs inline. Never use "(Read more)" or "(Source)".

**THE QUICK HITS** (4-6 bullet points)
- The rest of the high-signal items, each in 1-2 punchy sentences max.
- Format: **Bold the key noun or company** → then the insight in plain language.
- Each bullet must have a hyperlinked source woven into the sentence naturally.
- Skip anything boring. If it doesn't make someone say "huh, interesting" — cut it.

**WATCH THIS** (Optional — only if YouTube videos exist in inputs)
- For [TYPE: YOUTUBE VIDEO] items ONLY. Pick the 1 best video.
- Write one sentence on why it's worth 15 minutes of someone's time.
- Render as HTML card:
  <div style="margin-top:15px; margin-bottom: 25px; border-radius: 8px; overflow: hidden; border: 1px solid #eee;">
     <a href="LINK_URL" style="text-decoration:none; color: inherit;">
        <img src="THUMBNAIL_URL" style="width:100%; height: auto; display:block;" />
        <div style="padding: 12px; background: #f9f9f9;">
           <p style="margin:0; font-size:14px; font-weight:600; color:#333;">▶️ [5-word insight extraction, NOT the literal YouTube title]</p>
        </div>
     </a>
  </div>
- *If no videos exist, skip this section entirely.*

**THE BOTTOM LINE** (1-2 paragraphs)
- Zoom out. What's the one big pattern or theme connecting today's stories?
- End with a thought-provoking question or a forward-looking insight that sticks with the reader.

### CRITICAL RULES
1. **Kill the fluff.** If a sentence doesn't earn its place, delete it. Every line should make someone smarter or more curious.
2. **Skip low-signal items entirely.** Better to have 4 great bullets than 8 mediocre ones.
3. **No hallucinations.** Only reference facts from the provided inputs. If you're not sure, don't include it.
4. **Smart linking.** Hyperlink the specific claim or noun that the source validates. Weave links into sentences naturally.
5. **Images.** Only use the HTML card format above, and only for YouTube videos.
${firstName ? `6. **Personalization.** You are writing directly to ${firstName}. Use their name exactly ONCE somewhere in the briefing — naturally, mid-sentence. You're talking TO them, like a friend. Examples: "This is the kind of bet you'd appreciate, ${firstName}." or "${firstName}, this one's right up your alley." Never use it as a formal greeting like "Dear ${firstName}" or "Hi ${firstName}". It should feel like a friend dropped their name casually into conversation.` : ''}

### INPUT DATA
${itemsText}

BEGIN BRIEFING:`;

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
                max_tokens: 2500,
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
