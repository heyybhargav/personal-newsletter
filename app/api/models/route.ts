import { NextResponse } from 'next/server';
import { getEnabledModels } from '@/lib/db';

export async function GET() {
    try {
        const models = await getEnabledModels();
        return NextResponse.json({ models });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
