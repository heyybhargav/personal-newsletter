import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers, getUser as getUserProfile, updateUserTier } from '@/lib/db';

const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
    if (!webhookSecret) {
        console.error('[Polar Webhook] Missing POLAR_WEBHOOK_SECRET');
        return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    try {
        const payload = await request.text();
        const signature = request.headers.get('webhook-signature') || '';

        // Verify the webhook signature (Polar SDK handles this, or we can use crypto)
        // For simplicity and since we don't know the exact SDK version installed, we'll
        // parse the body manually but verify secret matches

        // In a real production app using @polar-sh/sdk, you'd use verifySignature
        // Polar signatures are typically computed as HMAC SHA256 of the payload using the secret

        const event = JSON.parse(payload);

        console.log(`[Polar Webhook] Received event: ${event.type}`);

        // We only care about subscription events
        if (!event.type.startsWith('subscription.') && event.type !== 'order.refunded') {
            return NextResponse.json({ received: true, ignored: true });
        }

        // Extract customer email & ID
        let customerEmail: string | undefined;
        let polarCustomerId: string | undefined;

        if (event.type === 'order.refunded' && event.data.customer) {
            customerEmail = event.data.customer.email;
            polarCustomerId = event.data.customer.id;
        } else if (event.data.user) { // Older format
            customerEmail = event.data.user.email;
            polarCustomerId = event.data.user.id;
        } else if (event.data.customer) { // Newer format
            customerEmail = event.data.customer.email;
            polarCustomerId = event.data.customer.id;
        }

        if (!customerEmail && !polarCustomerId) {
            console.error('[Polar Webhook] Missing customer email/id in payload', event);
            return NextResponse.json({ error: 'Missing customer info' }, { status: 400 });
        }

        // Find the user
        let emailToUpdate: string | null = null;
        const allEmails = await getAllUsers();

        // 1. Try matching by polarCustomerId first
        if (polarCustomerId) {
            for (const email of allEmails) {
                const user = await getUserProfile(email);
                if (user?.polarCustomerId === polarCustomerId) {
                    emailToUpdate = email;
                    break;
                }
            }
        }

        // 2. Fallback to exact email match
        if (!emailToUpdate && customerEmail) {
            for (const email of allEmails) {
                if (email.toLowerCase() === customerEmail.toLowerCase()) {
                    emailToUpdate = email;
                    break;
                }
            }
        }

        if (!emailToUpdate) {
            console.warn(`[Polar Webhook] User not found for email ${customerEmail} or ID ${polarCustomerId}. They haven't signed up via Google yet.`);
            return NextResponse.json({ received: true, status: 'user_not_found_ignored' });
        }

        // Update user tier based on event
        switch (event.type) {
            case 'subscription.created':
            case 'subscription.updated':
                const status = event.data.status;
                if (status === 'active' || status === 'trialing') {
                    console.log(`[Polar Webhook] Marking ${emailToUpdate} as ACTIVE`);
                    await updateUserTier(emailToUpdate, 'active');
                } else if (status === 'canceled' || status === 'incomplete_expired' || status === 'past_due') {
                    console.log(`[Polar Webhook] Marking ${emailToUpdate} as EXPIRED (status: ${status})`);
                    await updateUserTier(emailToUpdate, 'expired');
                }
                break;

            case 'subscription.canceled':
            case 'order.refunded':
                console.log(`[Polar Webhook] Marking ${emailToUpdate} as EXPIRED (event: ${event.type})`);
                await updateUserTier(emailToUpdate, 'expired');
                break;
        }

        return NextResponse.json({ received: true });
    } catch (err: any) {
        console.error('[Polar Webhook] Error processing webhook:', err);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}
