import { NextResponse } from 'next/server';
import { getUser, addSourceToUser, removeSourceFromUser, updateSourceForUser, getAllUsers } from '@/lib/db';

export async function GET(request: Request) {
    try {
        let email = request.headers.get('x-user-email');
        if (!email) {
            const users = await getAllUsers();
            if (users.length > 0) email = users[0];
        }

        if (!email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await getUser(email);
        return NextResponse.json({ sources: user?.sources || [] });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch sources' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        let email = request.headers.get('x-user-email');
        if (!email) {
            const users = await getAllUsers();
            if (users.length > 0) email = users[0];
        }
        if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { name, url, type, favicon, originalUrl } = body;

        if (!name || !url || !type) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const newSource = await addSourceToUser(email, {
            name,
            url,
            type,
            enabled: true,
            favicon: favicon || '',
            originalUrl: originalUrl || url,
        });

        if (!newSource) {
            return NextResponse.json({ error: 'Source already exists' }, { status: 409 });
        }

        return NextResponse.json({ source: newSource }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to add source' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        let email = request.headers.get('x-user-email');
        if (!email) {
            const users = await getAllUsers();
            if (users.length > 0) email = users[0];
        }
        if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Missing source ID' }, { status: 400 });
        }

        await removeSourceFromUser(email, id);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete source' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        let email = request.headers.get('x-user-email');
        if (!email) {
            const users = await getAllUsers();
            if (users.length > 0) email = users[0];
        }
        if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: 'Missing source ID' }, { status: 400 });
        }

        await updateSourceForUser(email, id, updates);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update source' }, { status: 500 });
    }
}
