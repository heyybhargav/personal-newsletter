import fs from 'fs';
import path from 'path';
import { generateUnifiedBriefing } from '../lib/gemini';
import { ContentItem } from '../lib/types';

// Manual .env loading
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach((line: string) => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            const value = valueParts.join('=').replace(/^["']|["']$/g, '').trim();
            process.env[key.trim()] = value;
        }
    });
}

// Mock Data matching ContentItem interface
const MOCK_CONTENT: ContentItem[] = [
    {
        title: 'OpenAI Releases GPT-5 with 100 Trillion Parameters',
        link: 'https://openai.com/blog/gpt-5',
        description: 'OpenAI has released GPT-5, claiming it achieves AGI. The model runs on a new architecture that reduces inference costs by 90% while increasing reasoning capabilities.',
        source: 'TechCrunch',
        sourceType: 'news',
        pubDate: new Date().toISOString()
    },
    {
        title: 'NVIDIA Stock Plummets 50% Amidst Antitrust Lawsuit',
        link: 'https://bloomberg.com/news/nvidia-antitrust',
        description: 'The DOJ has filed a massive antitrust lawsuit against NVIDIA, causing shares to drop. Analysts predict a long legal battle that could reshape the chip industry.',
        source: 'Bloomberg',
        sourceType: 'news',
        pubDate: new Date().toISOString()
    },
    {
        title: 'The Future of Compute is Biological',
        link: 'https://youtube.com/watch?v=12345',
        description: 'Dr. Smith discusses organoid intelligence and biocomputing. Key quote: "Silicon has reached its physical limit; biology is the only way forward for massive scale parallelism."',
        source: 'Lex Fridman',
        sourceType: 'youtube',
        pubDate: new Date().toISOString(),
        thumbnail: 'https://example.com/thumb.jpg'
    }
];

async function main() {
    console.log("Testing Content Generation...");
    try {
        const briefing = await generateUnifiedBriefing(MOCK_CONTENT, 'groq');
        console.log("\n--- SUBJECT LINE ---");
        console.log(briefing.subject);

        console.log("\n--- NARRATIVE ---");
        console.log(briefing.narrative);

        console.log("\n--- SCRIPT COMPLETE ---");
    } catch (error) {
        console.error("Error:", error);
    }
}

main();
