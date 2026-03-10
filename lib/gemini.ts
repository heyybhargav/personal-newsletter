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

export async function generateUnifiedBriefing(allContent: ContentItem[], provider: string = 'gemini-pro', firstName?: string): Promise<UnifiedBriefing> {
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

async function synthesizeUnifiedNarrative(items: ContentItem[], provider: string = 'gemini-pro', firstName?: string): Promise<{ narrative: string; subject: string; preheader: string; tokenUsage: TokenUsageResult }> {
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

            // Prioritize full content over truncated description
            const rawBody = item.content || item.description || '';
            let technicalData = rawBody.slice(0, 4000).replace(/\n/g, ' ');

            // Format pubDate nicely for AI context
            const itemDate = new Date(item.pubDate);
            const formattedDate = itemDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });

            // Calculate days ago for temporal enforcement
            const diffTime = Math.abs(new Date().getTime() - itemDate.getTime());
            const daysAgo = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            return `ITEM #${i + 1} ${typeHint}
   TITLE: "${item.title}"
   SOURCE: ${item.source}
   PUBLISHED_DATE: ${formattedDate} (${daysAgo} days ago)
    DAYS_AGO: ${daysAgo}
    LINK: ${item.link}
    THUMBNAIL_URL: ${item.thumbnail || ''}
    RAW_TECHNICAL_DATA: ${technicalData || 'No data provided'}`;
        }).join('\n\n');

        const systemInstruction = `<role>
You are a Brilliant Technical Friend who has spent all day in the weeds of engineering and research. Your goal is to give your smart peer a high-signal briefing using ONLY the provided RAW_TECHNICAL_DATA.
</role>

<context>
TODAY: ${today}
${firstName ? `READER'S FIRST NAME: ${firstName}` : ''}
</context>

<mission>
- **USE PROVIDED DATA ONLY**: Stick strictly to the \`RAW_TECHNICAL_DATA\`. If something isn't there, don't invent it. We're keeping this grounded in provided facts.
- **NO-CLICK MANDATE**: The briefing should be so satisfyingly detailed that they don't actually need to click. Give them the "aha!" moment right here.

1. **TECHNICAL DEPTH, GENTLE PACE**
- You must explain complex ideas using **plain English and analogies**. Imagine you are explaining this to a smart friend at a bar, not writing a whitepaper. Keep it extremely light.
- **The "Aha" Test**: The reader should understand the *secret mechanics* of the topic without needing a dictionary.

2. **VOICE: EXTREMELY CASUAL, RELAXED, AND ACCESSIBLE**
- Do not use dense, academic, or overly corporate vocabulary. Keep the sentences punchy and easy to read.
- Use "you" and "we" naturally. 
- **BANNED STIFFNESS**: Avoid filler like "You need to be paying attention to...", "The bottom line is...", "Check it out.", or motivational fluff.
- **BANNED COMPLEXITY**: Avoid words like "paradigm," "synergy," "autophagy," or "interpolation" unless absolutely necessary. Explain the concept, don't just use the buzzword.

3. **ONE ITEM, ONE DEEP-DIVE IDEA**
- Extract the single most complex and rewarding idea from each source. Explain it in full technical detail.

4. **TEMPORAL ACCURACY (CRITICAL)**
- Today is ${today}. For every item, check the \`DAYS_AGO\` metadata. 
- **STRICT RULE**: If an item is older than 7 days, you are FORBIDDEN from using words like "just released", "new", "today", "breaking". Call it "Archive Depth" or "Resurfaced Insight".
</mission>

<output_format>
You must output exactly three metadata parts: SUBJECT, PREHEADER, and then the NARRATIVE (separated by "---NARRATIVE_START---").

SUBJECT: [Extremely curiosity-driven. Must be a "magnetic" hook. NO MARKDOWN.]
PREHEADER: [A sharp, intriguing sentence that deepens the mystery of the subject. NO MARKDOWN.]
---NARRATIVE_START---

**THE LEAD ANALYSIS**

[MANDATORY: START CONTENT ON A NEW LINE AFTER TWO NEWLINES]
- Pick the most profound technical discovery. Build a deep-dive analysis.
- **STRUCTURE**: Start with a 1-2 sentence context-setting paragraph explaining what this analysis is about and the core takeaway. THEN, transition into the **Q&A Format**.
- **Q&A RULES:**
  1. DO NOT use bullet points or lists for the questions.
  2. **Bold** the question text completely.
  3. Start the answer paragraph on the very next line (leaving empty space below the bolded question).
  4. The next question MUST have a double-newline (more space) separating it from the previous answer paragraph.
- **MANDATORY LINKS**: You MUST include at least **two** different inline hyperlinked source [claims](LINK) naturally within the answers.
- **ZERO TOLERANCE FOR DUPLICATION**: Whatever happens in the Lead Analysis MUST NOT show up in the Signal section.

**THE SIGNAL**

[MANDATORY: START CONTENT ON A NEW LINE AFTER TWO NEWLINES]
- For every other high-signal item, provide a **dense paragraph (3-5 sentences)**. (NO Q&A FORMAT HERE).
- Format: **Bold the key technical entity** → then the multi-sentence explanation.
- **CRITICAL**: Every block MUST contain an inline hyperlinked source [text](LINK) woven naturally into the analysis.
- **ABSOLUTE EXCLUSIVITY**: If an item was in the Lead, skip it here. Every block here must cover *different* items from the input.

**WATCH THIS** (Optional — YouTube only)
- Pick the single best video from the input.
- Render as this EXACT premium HTML card:
  <div style="margin-top:20px; margin-bottom: 30px; border-radius: 12px; overflow: hidden; border: 1px solid #e0e0e0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #ffffff;">
     <a href="LINK_URL" style="text-decoration:none; color: inherit; display: block;">
        <img src="THUMBNAIL_URL" style="width:100%; height: auto; display:block;" />
        <div style="padding: 16px; background: #ffffff;">
           <div style="text-transform: uppercase; letter-spacing: 0.1em; font-size: 10px; font-weight: 700; color: #666; margin-bottom: 8px;">[ACTUAL_CHANNEL_NAME_HERE]</div>
           <p style="margin:0; font-size:16px; font-weight:600; color:#111; line-height: 1.4;">[5-word professional technical synthesis]</p>
           <div style="margin-top: 12px; display: inline-block; padding: 6px 12px; background: #000000; color: #ffffff; border-radius: 4px; font-size: 12px; font-weight: 600;">Watch Analysis</div>
        </div>
     </a>
  </div>
- *If no videos exist, skip this section entirely. DO NOT HALLUCINATE ONE.*

**KEY TAKEAWAYS**

[MANDATORY: START CONTENT ON A NEW LINE AFTER TWO NEWLINES]
- Provide 2-3the  rapid-fire, single-sentence bullet points summarizing the absolute highest-leverage insights from the entire email.
- This is the "TL;DR for the executive" section. Make them punchy and independent.
- Use standard markdown bullets (-).
</output_format>

<strict_rules>
- NO EM DASHES.
- NO HALLUCINATIONS. Check source text strictly.
- STRICT SECTION EXCLUSIVITY: Do not repeat Lead content in Signal blocks.
- NO EMOJIS IN BODY TEXT. Only permitted in the Watch This card icon area.
</strict_rules>

<example_output>
SUBJECT: Why Apple killed the micro-LED pipeline
PREHEADER: A supply chain constraint that changes the entire wearable roadmap.
---NARRATIVE_START---
**THE LEAD ANALYSIS**

Apple's ambitious decade-long micro-LED project has officially been scrapped. This cancellation reveals the brutal realities of mass-manufacturing next-generation displays and signals a definitive shift back to OLED architectures for the entire wearable market.

**Why did Apple completely abandon their multi-billion dollar micro-LED project?**
The core issue wasn't the display technology itself, but rather the yield rates on the massive transfer process. [According to the supply chain leaks](https://example.com/apple), they simply couldn't get the defect rate low enough to justify the manufacturing cost at the mass scale required for the Apple Watch. 

**What does this mean for the future of their display architecture?**
It forces a strategic pivot back to OLED, specifically tandem OLED architectures. By utilizing tandem structures, they can achieve the necessary peak brightness levels required for outdoor watch visibility without the crushing R&D burn rate of micro-LED scaling. 

**THE SIGNAL**

**Tandem OLED architectures** are emerging as the immediate bridge technology for high-end consumer hardware. Rather than inventing entirely new display paradigms, manufacturers are stacking existing OLED substrates. This fundamentally solves the brightness-decay issue native to organic compounds without requiring a [completely new manufacturing pipeline](https://example.com/oled).

**The M4 Neural Engine** features a totally reworked memory bus designed specifically to prevent bottlenecking during continuous LLM inference. Instead of raw compute cores, the architecture prioritizes memory bandwidth, ensuring the unified RAM pool can feed the NPU without stalling the main processor clock cycles.

**KEY TAKEAWAYS**

- Apple's pivot away from micro-LED cements tandem OLED as the dominant wearable display tech for the next decade.
- M4 NPU architecture proves that memory bandwidth, not raw core count, is the actual bottleneck for local LLM inference.
- Hardware supply chains are increasingly abandoning theoretical perfection for scalable yield rates.
</example_output>`;

        const prompt = `### INPUT DATA
${itemsText}

BEGIN BRIEFING:`;

        console.log(`[LLM] Sending unified briefing request via ${provider}...`);

        let rawText = '';
        let tokenUsage: TokenUsageResult = { input: 0, output: 0, model: '', provider: '' };

        if (provider === 'gemini' || provider === 'gemini-pro') {
            const modelId = provider === 'gemini-pro' ? 'gemini-3.1-pro-preview' : 'gemini-3-flash-preview';
            const geminiRes = await callGemini(prompt, modelId, systemInstruction);
            rawText = geminiRes.text;
            tokenUsage = {
                input: geminiRes.inputTokens,
                output: geminiRes.outputTokens,
                model: modelId,
                provider: provider
            };
        } else {
            const combinedPrompt = systemInstruction + '\n\n' + prompt;
            const chatCompletion = await getGroqClient().chat.completions.create({
                messages: [{ role: 'system', content: systemInstruction }, { role: 'user', content: prompt }],
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

async function callGemini(prompt: string, modelId: string = 'gemini-3-flash-preview', systemInstruction?: string): Promise<{ text: string, inputTokens: number, outputTokens: number }> {
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
            ...(systemInstruction ? {
                config: {
                    systemInstruction: systemInstruction
                }
            } : {})
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
