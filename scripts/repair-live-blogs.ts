import * as dotenv from 'dotenv';
import path from 'path';

// Load env FIRST
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { getBlogPosts, saveBlogPost, getKnowledgeBaseDoc, KB_KEYS } from '../lib/blogDb';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

async function fixLiveBlogs() {
    console.log("Fetching live blogs to remove hallucinations...");

    // Get the latest 3 posts 
    const posts = await getBlogPosts(0, 3);
    const factSheet = await getKnowledgeBaseDoc(KB_KEYS.PRODUCT_FACT_SHEET);
    const brandVoice = await getKnowledgeBaseDoc(KB_KEYS.BRAND_VOICE);

    for (const post of posts) {
        // Skip the very old hardcoded ones if you only want to hit the newly generated ones
        // But for safety, let's just rewrite the recent ones that might have hallucinations.
        console.log(`\nAnalyzing: ${post.slug}`);

        const prompt = `
You are the Lead Writer for Signal Daily. We need to revise an existing blog post because it contains hallucinations about our product.

PRODUCT FACT SHEET:
---
${JSON.stringify(factSheet)}
---

BRAND VOICE:
---
${JSON.stringify(brandVoice)}
---

CURRENT POST CONTENT:
---
${JSON.stringify(post.content)}
---

INSTRUCTIONS:
1. Review the CURRENT POST CONTENT.
2. Identify any mentions of features that Signal does NOT have (e.g., interactive dashboards, mobile apps, social tools).
3. Rewrite the content to remove these hallucinations while keeping the exact same JSON structure so it can be saved back to the database.
4. Maintain the aggressive, high-signal Brand Voice.

Respond ONLY with the repaired JSON array for the "content" field.
Format:
[
  {
    "heading": "Optional string",
    "paragraphs": ["string", "string"],
    "listItems": ["Optional string"]
  }
]
`;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-3.1-pro-preview',
                contents: prompt,
                config: { responseMimeType: 'application/json' }
            });

            const updatedContent = JSON.parse(response.text || '[]');

            if (updatedContent && updatedContent.length > 0) {
                post.content = updatedContent;
                await saveBlogPost(post);
                console.log(`✅ Repaired and saved: ${post.slug}`);
            } else {
                console.error(`❌ Empty response for ${post.slug}`);
            }
        } catch (e) {
            console.error(`❌ Failed to parse/repair ${post.slug}:`, e);
        }
    }

    console.log("\nFinished repairing blogs!");
    process.exit(0);
}

fixLiveBlogs().catch(console.error);
