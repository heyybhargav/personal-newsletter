import { NextResponse } from 'next/server';
import { getPreferences, addSource, removeSource, updateSource } from '@/lib/db';

export async function GET() {
    try {
        const prefs = await getPreferences();
        return NextResponse.json({ sources: prefs.sources });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch sources' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, url, type } = body;

        if (!name || !url || !type) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const newSource = await addSource({
            name,
            url,
            type,
            enabled: true
        });

        return NextResponse.json({ source: newSource }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to add source' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Missing source ID' }, { status: 400 });
        }

        await removeSource(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete source' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: 'Missing source ID' }, { status: 400 });
        }

        await updateSource(id, updates);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update source' }, { status: 500 });
    }
}
