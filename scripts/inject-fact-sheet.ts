import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { KB_KEYS, updateKnowledgeBaseDoc } from '../lib/blogDb';

async function injectFactSheet() {
    console.log("Injecting Product Fact Sheet into Knowledge Base...");

    // The definitively true facts about Siftl. 
    // The LLM must consult this to avoid hallucinating features like "mobile app", "social sharing", "dashboards" etc.
    const factSheet = {
        core_product: "Siftl is an automated, high-fidelity briefing tool. It is NOT a generic RSS reader and NOT a newsletter.",
        target_audience: "B2B professionals, executives, VCs, and researchers who need raw intelligence without the noise.",
        key_value_props: [
            "Users curate specific sources (e.g. competitor blogs, specific X profiles, SEC filings).",
            "Siftl monitors these sources continuously.",
            "Siftl synthesizes the data into a concise, plain-text email digest delivered on a schedule (e.g., 8 AM daily)."
        ],
        what_it_is_not: [
            "It does NOT have a full-blown interactive dashboard with charts.",
            "It is NOT a team collaboration tool (no commenting or sharing features yet).",
            "It does NOT have a native iOS/Android mobile app (it is web and email only)."
        ],
        pricing: "Starts free for 7 days, then requires a paid subscription via Polar (using an aggressive, high-value B2B pricing model)."
    };

    const success = await updateKnowledgeBaseDoc(KB_KEYS.PRODUCT_FACT_SHEET, factSheet);

    if (success) {
        console.log("✅ Successfully injected Product Fact Sheet!");
    } else {
        console.error("❌ Failed to update Redis.");
    }
    process.exit(0);
}

injectFactSheet().catch(console.error);
