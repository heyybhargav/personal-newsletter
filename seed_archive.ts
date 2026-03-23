import { saveBriefingToArchive } from './lib/db';

async function seedTestData() {
    const email = 'cbhargav2002@gmail.com';
    const fakeBriefing = {
        "briefing": {
            "title": "Welcome to Your Briefing Archive",
            "generatedAt": new Date().toISOString()
        },
        "sections": [
            {
                "title": "Historical Context",
                "summary": "<p>This is a <b>test briefing</b> injected directly into your database to verify the Archive UI works correctly. The real briefings will look exactly like this but with real AI-generated content.</p><ul><li>Test bullet 1</li><li>Test bullet 2</li></ul>",
                "items": [
                    { "title": "Test Link", "link": "https://example.com" }
                ]
            }
        ]
    };

    // Create a fake date for yesterday
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yesterdayStr = d.toISOString().split('T')[0];

    console.log(`Injecting fake archive for ${yesterdayStr}...`);
    await saveBriefingToArchive(email, yesterdayStr, fakeBriefing);
    console.log("Success! Go check localhost:3000/archive");
}

seedTestData().catch(console.error);
