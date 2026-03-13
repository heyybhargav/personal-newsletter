import { NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { signSession } from '@/lib/auth';
import { createUser, getUser, saveUser } from '@/lib/db';
import { cookies } from 'next/headers';
import { sendWelcomeEmail } from '@/lib/email';
import { SITE_URL } from '@/lib/config';

const client = new OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

export async function POST(request: Request) {
    try {
        const { credential } = await request.json();

        if (!credential) {
            return NextResponse.json({ error: 'Missing credential' }, { status: 400 });
        }

        // 1. Verify Google Token
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            return NextResponse.json({ error: 'Invalid token payload' }, { status: 401 });
        }

        const email = payload.email;
        const name = payload.name || undefined;

        // 2. Find or Create User in DB
        let user = await getUser(email);
        if (!user) {
            console.log(`[Auth] New user detected: ${email} (${name || 'no name'})`);
            // Auto-detect timezone from request if possible, or default
            // Ideally frontend sends it, but for now default to UTC/IST or handle later
            user = await createUser(email, 'Asia/Kolkata', name);

            // Send Welcome Email
            try {
                const origin = request.headers.get('origin') || SITE_URL;
                await sendWelcomeEmail(email, origin, { isTrial: true, trialDays: 7 });
            } catch (emailError) {
                console.error('[Auth] Failed to send welcome email:', emailError);
                // Continue with login even if email fails
            }
        } else if (!user.name && name) {
            // Backfill name for existing users who signed up before this change
            user.name = name;
            await saveUser(user);
            console.log(`[Auth] Backfilled name for ${email}: ${name}`);
        }

        // 3. Create Session
        const token = await signSession({ email });

        // 4. Set Cookie
        const cookieStore = await cookies();
        cookieStore.set('user_session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 30, // 30 days
        });

        return NextResponse.json({ success: true, email });

    } catch (error: any) {
        console.error('[Auth] Error:', error);
        return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
    }
}
