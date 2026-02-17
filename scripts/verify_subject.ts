
import fs from 'fs';
import path from 'path';

// Load env vars manually BEFORE importing lib/gemini
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/^["']|["']$/g, '');
            process.env[key] = value;
        }
    });
}

import { generateUnifiedBriefing } from '../lib/gemini';
import { ContentItem } from '../lib/types';

// Mock Content
const mockContent: ContentItem[] = [
    {
        title: "SpaceX Starship Launches Successfully",
        source: "TechCrunch",
        link: "https://techcrunch.com/2026/02/16/spacex-starship",
        pubDate: new Date().toISOString(),
        description: "SpaceX has successfully launched its Starship rocket, marking a major milestone in space exploration. The rocket achieved orbit and landed safely.",
        content: "<p>SpaceX has successfully launched its Starship rocket...</p>",
        sourceType: "rss"
    },
    {
        title: "OpenAI Releases GPT-6",
        source: "The Verge",
        link: "https://theverge.com/2026/02/16/openai-gpt-6",
        pubDate: new Date().toISOString(),
        description: "OpenAI has announced GPT-6, which claims to solve reasoning problems with 99% accuracy. It's available starting today.",
        content: "<p>OpenAI has announced GPT-6...</p>",
        sourceType: "rss"
    },
    {
        title: "Apple Vision Pro 2 Announced",
        source: "9to5Mac",
        link: "https://9to5mac.com/2026/02/16/apple-vision-pro-2",
        pubDate: new Date().toISOString(),
        description: "Apple has unveiled the Vision Pro 2, featuring a lighter design and a lower price point of $1999.",
        content: "<p>Apple has unveiled the Vision Pro 2...</p>",
        sourceType: "rss"
    }
];

async function testSubjectLine() {
    console.log("Testing Subject Line Generation...");
    try {
        const briefing = await generateUnifiedBriefing(mockContent, 'groq');
        console.log("\n--- RESULT ---");
        console.log("Subject:", briefing.subject);
        console.log("Narrative Length:", briefing.narrative.length);
        console.log("----------------");

        if (!briefing.subject || briefing.subject.startsWith("Signal: Your Daily Briefing")) {
            console.error("FAIL: Subject line fallback was used or parsing failed.");
        } else {
            console.log("SUCCESS: Dynamic subject line generated.");
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

testSubjectLine();
