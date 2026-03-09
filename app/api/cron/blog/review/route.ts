import { NextResponse } from 'next/server';
import { getKnowledgeBaseDoc, KB_KEYS, updateKnowledgeBaseDoc } from '@/lib/blogDb';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function POST(req: Request) {
    try {
        // Authenticate the cron request
        const authHeader = req.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('[Blog Reviewer] Starting weekly performance review...');

        // 1. Fetch current instructions and performance logs
        const currentInstructions = await getKnowledgeBaseDoc<any>(KB_KEYS.LLM_INSTRUCTIONS);
        const currentBrandVoice = await getKnowledgeBaseDoc<any>(KB_KEYS.BRAND_VOICE);
        const performanceLog = await getKnowledgeBaseDoc<any>(KB_KEYS.PERFORMANCE_LOG) || { runs: [] };
        const pastProposals = await getKnowledgeBaseDoc<any>(KB_KEYS.INSTRUCTION_PROPOSALS) || { proposals: [] };

        // If there's no data to review, skip
        if (!performanceLog.runs || performanceLog.runs.length === 0) {
            return NextResponse.json({ status: 'Skipped - no performance data' });
        }

        // 2. The Reviewer Chain
        // In the future, this is where we feed Google Search Console data. 
        // For MVP, we feed semantic structural data logged during generation.
        const prompt = `
You are the AI Optimization Director for Signal Daily.
Your goal is to propose exactly ONE high-impact improvement to our "LLM Instructions" or "Brand Voice" to make the automated blogs better.

CURRENT LLM INSTRUCTIONS:
---
${JSON.stringify(currentInstructions)}
---

CURRENT BRAND VOICE:
---
${JSON.stringify(currentBrandVoice)}
---

RECENT PERFORMANCE LOGS (What we generated recently):
---
${JSON.stringify(performanceLog.runs.slice(-10))}
---

INSTRUCTIONS:
1. Review the data. Look for repetitive patterns or weaknesses (e.g., all posts are exactly 650 words, maybe we should push for longer ones).
2. Propose a specific rule addition or change. Do NOT rewrite the entire configuration.
3. Your output must be a single JSON object.

OUTPUT FORMAT:
{
    "date": "${new Date().toISOString()}",
    "observation": "What pattern did you notice in the recent generations?",
    "proposedRule": "The exact sentence to add to the Rules or Brand Voice array.",
    "targetDoc": "LLM_INSTRUCTIONS or BRAND_VOICE"
}
`;

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });

        const proposal = JSON.parse(response.text || '{}');

        if (proposal.proposedRule) {
            // Append the new proposal to the list
            pastProposals.proposals.unshift(proposal); // Add to top

            // Keep only the last 10 proposals to prevent bloat
            if (pastProposals.proposals.length > 10) {
                pastProposals.proposals = pastProposals.proposals.slice(0, 10);
            }

            await updateKnowledgeBaseDoc(KB_KEYS.INSTRUCTION_PROPOSALS, pastProposals);
            console.log('[Blog Reviewer] Generated new rule proposal:', proposal.proposedRule);
        }

        return NextResponse.json({ success: true, proposal });

    } catch (e) {
        console.error('[Blog Reviewer] Error:', e);
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
