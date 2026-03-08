import { getKnowledgeBaseDoc, updateKnowledgeBaseDoc, KB_KEYS } from '../lib/blogDb';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function addFeedback() {
    const args = process.argv.slice(2);
    const feedbackText = args.join(' ');

    if (!feedbackText) {
        console.error("❌ Please provide feedback text.");
        console.error("Usage: npx tsx scripts/add-blog-feedback.ts \"Never use semicolons in titles.\"");
        process.exit(1);
    }

    console.log("Fetching current Brand Voice Guidelines...");
    const voiceDoc: any = await getKnowledgeBaseDoc(KB_KEYS.BRAND_VOICE);

    if (!voiceDoc) {
        console.error("❌ Could not fetch Brand Voice document from Redis.");
        process.exit(1);
    }

    // Append the feedback to the formatting rules
    if (!voiceDoc.formatting) voiceDoc.formatting = [];
    voiceDoc.formatting.push(`USER FEEDBACK (Enforce strictly): ${feedbackText}`);

    console.log("\nUpdating Redis...");
    const success = await updateKnowledgeBaseDoc(KB_KEYS.BRAND_VOICE, voiceDoc);

    if (success) {
        console.log("✅ Successfully injected feedback into the AI's permanent memory.");
        console.log(`Added rule: "${feedbackText}"`);
    } else {
        console.error("❌ Failed to update Redis.");
    }

    process.exit(0);
}

addFeedback().catch(console.error);
