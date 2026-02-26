import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession } from '@/lib/auth';
import { getUser, hasAccess } from '@/lib/db';

// Paths that require authentication
const PROTECTED_PATHS = ['/', '/settings', '/sources', '/api/sources', '/api/settings', '/api/latest-briefing', '/api/digest'];

// Public paths that should not be protected
const PUBLIC_PATHS = ['/login', '/api/auth', '/api/cron', '/api/webhook', '/api/debug'];

// Paths that expired users can still access (they need these to subscribe)
const EXPIRED_ALLOWED_PATHS = ['/subscribe', '/api/webhook', '/api/auth'];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Check if path is public
    if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
        return NextResponse.next();
    }

    // 2. Check if path is protected
    // We match if the path STARTS with any of the protected paths
    const isProtected = PROTECTED_PATHS.some(path => pathname === path || pathname.startsWith(path + '/'));

    if (!isProtected) {
        // Allow other static assets / unknown routes
        return NextResponse.next();
    }

    // 3. Verify Session
    const token = request.cookies.get('user_session')?.value;
    const session = await verifySession(token || '');

    if (!session) {
        // Redirect to login for page requests
        if (!pathname.startsWith('/api')) {
            const loginUrl = new URL('/login', request.url);
            return NextResponse.redirect(loginUrl);
        } else {
            // Return 401 for API requests
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    // 4. Check trial/subscription access
    const user = await getUser(session.email);
    if (user && !hasAccess(user)) {
        // Allow expired users to access subscribe page and webhooks
        const isExpiredAllowed = EXPIRED_ALLOWED_PATHS.some(path => pathname.startsWith(path));
        if (!isExpiredAllowed) {
            if (!pathname.startsWith('/api')) {
                return NextResponse.redirect(new URL('/subscribe', request.url));
            } else {
                return NextResponse.json({ error: 'Trial expired. Please subscribe to continue.' }, { status: 403 });
            }
        }
    }

    // 5. Inject User Identity for Backend
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-email', session.email);

    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|public).*)',
    ],
};

