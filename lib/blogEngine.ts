import { GoogleGenAI } from '@google/genai';
import { getFullKnowledgeBaseContext, saveBlogPost, isSlugTaken } from './blogDb';
import { validateGeneratedPost } from './blogValidation';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
const MODEL = 'gemini-3-pro-preview'; // Using Pro for complex reasoning and large context

/**
 * Main entry point for the Blog Generator Worker.
 */
export async function generateAndPublishBlog() {
    console.log('[Blog Engine] Starting generation cycle...');
    const startTime = Date.now();

    try {
        // 1. Fetch entire Knowledge Base Context
        console.log('[Blog Engine] Fetching Knowledge Base...');
        const kb = await getFullKnowledgeBaseContext();

        // 2. PHASE 1: The Editor (Topic Selection & Outlining)
        console.log('[Blog Engine] Phase 1: Editor is planning...');
        const editorPlan = await runEditorPhase(kb);
        console.log(`[Blog Engine] Editor selected topic: "${editorPlan.title}"`);

        // Check deduplication early
        if (await isSlugTaken(editorPlan.slug)) {
            throw new Error(`Duplicate slug identified by Editor: ${editorPlan.slug}`);
        }

        // 3. PHASE 2: The Writer (Content Generation)
        console.log('[Blog Engine] Phase 2: Writer is drafting...');
        const rawContent = await runWriterPhase(editorPlan, kb);
        console.log(`[Blog Engine] Writer finished draft (${rawContent.length} chars)`);

        // 4. PHASE 3: The Reviewer (JSON Formatting & SEO)
        console.log('[Blog Engine] Phase 3: Reviewer is formatting...');
        const finalPostJSON = await runReviewerPhase(rawContent, editorPlan, kb);

        // 5. Build Final Object
        const finalPost = {
            ...finalPostJSON,
            publishedAt: new Date().toISOString()
        };

        // 6. Quality Gate Validation
        console.log('[Blog Engine] Running Quality Gate...');
        const validation = validateGeneratedPost(finalPost);
        if (!validation.isValid) {
            throw new Error(`Quality Gate Failed: ${validation.errors.join(', ')}`);
        }

        // 7. Save to Redis
        console.log('[Blog Engine] Saving to Database...');
        await saveBlogPost(finalPost);

        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`[Blog Engine] ✅ Successfully published ${finalPost.slug} in ${duration}s`);

        return { success: true, post: finalPost };

    } catch (error) {
        console.error('[Blog Engine] ❌ Generation Failed:', error);
        // TODO: In Phase 3, implement dead-letter queue saving here
        return { success: false, error: String(error) };
    }
}

// ============================================================================
// Prompt Chain Implementations
// ============================================================================

export async function runEditorPhase(kb: any) {
    const prompt = `
You are the Managing Editor for Signal Daily. Your job is to decide what blog post we publish next.

KNOWLEDGE BASE:
---
Ideas Backlog: ${JSON.stringify(kb.blogIdeas)}
Content Clusters: ${JSON.stringify(kb.contentClusters)}
Recently Published Topics (DO NOT REPEAT THESE): ${JSON.stringify(kb.topicsPublished.slice(0, 50))}
---

INSTRUCTIONS:
1. Review the Content Clusters. Identify a cluster that is underserved (has fewer published posts than target_posts).
2. Pick an idea from the Ideas Backlog that fits this cluster, OR invent a highly relevant new idea.
3. Write a sharp, compelling Title and Subtitle.
4. Generate a URL-safe slug.
5. Provide a 5-bullet structural outline for the writer.

OUTPUT FORMAT (Respond ONLY with valid JSON):
{
    "clusterId": "string",
    "category": "string (e.g., philosophical, alternatives, how-to)",
    "title": "string",
    "subtitle": "string",
    "slug": "string",
    "targetKeywords": ["string", "string"],
    "outline": ["string", "string"]
}
`;

    console.time('[Blog Engine] Editor Phase LLM Time');
    const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    console.timeEnd('[Blog Engine] Editor Phase LLM Time');

    if (response.usageMetadata) {
        console.log(`[Blog Engine] Editor Tokens: In=${response.usageMetadata.promptTokenCount}, Out=${response.usageMetadata.candidatesTokenCount}`);
    }

    try {
        const json = JSON.parse(response.text || '{}');
        console.log(`[Blog Engine] Editor Plan Parsed Successfully:`, Object.keys(json));
        return json;
    } catch (e) {
        console.error('[Blog Engine] CRITICAL: Editor failed to output valid JSON!', response.text);
        throw e;
    }
}

export async function runWriterPhase(plan: any, kb: any) {
    const prompt = `
You are the Lead Writer for Signal Daily. 
You are writing a blog post based strictly on the Editor's plan. 

EDITOR'S PLAN:
---
Title: ${plan.title}
Subtitle: ${plan.subtitle}
Keywords: ${plan.targetKeywords.join(', ')}
Outline:
${plan.outline.map((o: string, i: number) => `${i + 1}. ${o}`).join('\n')}
---

PRODUCT FACT SHEET (CRITICAL):
---
${JSON.stringify(kb.factSheet)}
---
You must NEVER invent or hallucinate features that Signal does not have. You must strictly adhere to the boundaries of the Product Fact Sheet.

BRAND VOICE & RULES:
---
${JSON.stringify(kb.brandVoice)}
---

INSTRUCTIONS:
Write the full blog post text. 
- Follow the outline exactly.
- Use explicit headings for each section (e.g., "## The problem with X").
- Be punchy, cynical about noise, and highly professional. DO NOT exceed 4 sentences per paragraph.
- NEVER use the words: delve, tapestry, landscape, testament, realm.
- Do not output JSON. Output pure Markdown text.
`;

    console.time('[Blog Engine] Writer Phase LLM Time');
    const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt
    });
    console.timeEnd('[Blog Engine] Writer Phase LLM Time');

    if (response.usageMetadata) {
        console.log(`[Blog Engine] Writer Tokens: In=${response.usageMetadata.promptTokenCount}, Out=${response.usageMetadata.candidatesTokenCount}`);
    }

    const text = response.text || '';
    console.log(`[Blog Engine] Writer generated ${text.length} raw characters.`);

    return text;
}

export async function runReviewerPhase(rawText: string, plan: any, kb: any) {
    const prompt = `
You are the Technical SEO Editor for Signal Daily.
Take the following raw blog post text and format it into our strict JSON schema.

RAW DRAFT:
---
${rawText}
---

SEO DIRECTIVES:
---
${JSON.stringify(kb.seoDirectives)}
---

INSTRUCTIONS:
1. Map the raw text into the "content" array. Each major section (separated by headings in the raw text) becomes an object with "heading" and "paragraphs" array.
2. If there are bullet points, put them in the "listItems" array of that section.
3. Generate a compelling "metaDescription" (< 160 chars).
4. Generate a realistic "readTime" (e.g., "4 min read").
5. Construct the final JSON object EXACTLY matching this interface.

OUTPUT FORMAT:
{
    "slug": "${plan.slug}",
    "title": "${plan.title}",
    "subtitle": "${plan.subtitle}",
    "date": "${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}",
    "readTime": "string",
    "metaDescription": "string",
    "category": "${plan.category}",
    "targetKeywords": ${JSON.stringify(plan.targetKeywords)},
    "clusterId": "${plan.clusterId}",
    "content": [
        {
            "heading": "Optional string",
            "paragraphs": ["string", "string"],
            "listItems": ["Optional string"]
        }
    ]
}
`;

    console.time('[Blog Engine] Reviewer Phase LLM Time');
    const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    console.timeEnd('[Blog Engine] Reviewer Phase LLM Time');

    if (response.usageMetadata) {
        console.log(`[Blog Engine] Reviewer Tokens: In=${response.usageMetadata.promptTokenCount}, Out=${response.usageMetadata.candidatesTokenCount}`);
    }

    try {
        const json = JSON.parse(response.text || '{}');
        console.log(`[Blog Engine] Reviewer JSON Parsed Successfully. Subheadings:`, json.content?.length || 0);
        return json;
    } catch (e) {
        console.error('[Blog Engine] CRITICAL: Reviewer failed to output valid JSON!', response.text);
        throw e;
    }
}
