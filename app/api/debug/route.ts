import { NextResponse } from 'next/server';

// Debug endpoint to check if API keys are set (doesn't expose the actual values)
export async function GET() {
    const geminiKey = process.env.GEMINI_API_KEY;
    const sendpulseId = process.env.SENDPULSE_API_ID;
    const sendpulseSecret = process.env.SENDPULSE_API_SECRET;
    const userEmail = process.env.USER_EMAIL;
    const kvUrl = process.env.KV_REST_API_URL;

    return NextResponse.json({
        timestamp: new Date().toISOString(),
        env_status: {
            GEMINI_API_KEY: geminiKey ? `SET (${geminiKey.slice(0, 8)}...${geminiKey.slice(-4)})` : '❌ MISSING',
            SENDPULSE_API_ID: sendpulseId ? `SET (${sendpulseId.slice(0, 6)}...)` : '❌ MISSING',
            SENDPULSE_API_SECRET: sendpulseSecret ? 'SET' : '❌ MISSING',
            USER_EMAIL: userEmail || '❌ MISSING',
            KV_REST_API_URL: kvUrl ? 'SET' : '❌ MISSING',
        },
        message: 'If any keys show MISSING, add them to Vercel Environment Variables'
    });
}
