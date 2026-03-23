import { NextResponse } from 'next/server';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const userAgent = request.headers.get('user-agent') || '';

    // Simple detection for mobile devices (iOS/Android)
    const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);

    if (isMobile) {
        // Force the YouTube app protocol
        // We use a meta redirect or a JS redirect to attempt the app launch
        // If the app is not installed, it might fail, so we provide a fallback
        const appUrl = `youtube://video/${id}`;
        const webUrl = `https://www.youtube.com/watch?v=${id}`;

        // Return a small HTML page that tries to open the app, then falls back to web
        return new NextResponse(
            `<html>
                <head>
                    <title>Opening YouTube...</title>
                    <script>
                        // Try to open the app
                        window.location.href = "${appUrl}";
                        
                        // If we're still here after a short delay, redirect to the web
                        setTimeout(function() {
                            window.location.href = "${webUrl}";
                        }, 2000);
                    </script>
                </head>
                <body>
                    <p>Redirecting to YouTube app... If nothing happens, <a href="${webUrl}">click here</a>.</p>
                </body>
            </html>`,
            {
                headers: { 'Content-Type': 'text/html' }
            }
        );
    } else {
        // Desktop user: standard redirect
        return NextResponse.redirect(`https://www.youtube.com/watch?v=${id}`);
    }
}
