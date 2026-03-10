import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { getKnowledgeBaseDoc, KB_KEYS, updateKnowledgeBaseDoc } from '../lib/blogDb';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

async function runReviewEngine() {
    console.log('[Test] Running Review Engine...');

    const currentInstructions = await getKnowledgeBaseDoc<any>(KB_KEYS.LLM_INSTRUCTIONS);
    const currentBrandVoice = await getKnowledgeBaseDoc<any>(KB_KEYS.BRAND_VOICE);
    let pastProposals = await getKnowledgeBaseDoc<any>(KB_KEYS.INSTRUCTION_PROPOSALS);

    if (!pastProposals || !pastProposals.proposals) {
        pastProposals = { proposals: [] };
    }

    // Creating a mock performance log since the system hasn't run natively enough to test the log
    const mockLog = {
        runs: [
            { slug: "signal-vs-feedly", wordCount: 450, coherenceScore: 0.8, cluster: "alternatives", weakness: "Introductions felt too generic." },
            { slug: "newsletter-fatigue", wordCount: 480, coherenceScore: 0.75, cluster: "philosophical", weakness: "Lacked concrete data points." },
            { slug: "automate-competitive-intelligence", wordCount: 512, coherenceScore: 0.9, cluster: "how-to", weakness: "Could use more bulleted lists." }
        ]
    };

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
${JSON.stringify(mockLog.runs)}
---

INSTRUCTIONS:
1. Review the data. Notice the weaknesses in the recent logs.
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
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });

    const proposal = JSON.parse(response.text || '{}');

    if (proposal.proposedRule) {
        pastProposals.proposals.unshift(proposal);
        await updateKnowledgeBaseDoc(KB_KEYS.INSTRUCTION_PROPOSALS, pastProposals);
        console.log('✅ Generated new rule proposal:', proposal.proposedRule);
    }

    process.exit(0);
}

runReviewEngine().catch(console.error);
