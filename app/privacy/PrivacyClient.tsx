'use client';

import LegalLayout from '@/components/landing/LegalLayout';
import { CONTACT_EMAIL } from '@/lib/config';

export default function PrivacyClient() {
    return (
        <LegalLayout title="Privacy Policy" lastUpdated="March 12, 2026">
            <p className="lead text-xl text-gray-500 font-medium mb-12">
                At Siftl, we believe your attention is your most valuable asset. This policy outlines exactly how we protect it, the data we collect to generate your briefings, and our uncompromising stance on AI data training.
            </p>

            <section className="space-y-4">
                <h2 className="text-xl font-serif font-semibold text-[#1A1A1A]">1. Data Collection</h2>
                <p>
                    Siftl requires specific access to function as your agentic knowledge engine. We collect the following information:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Account Information:</strong> Your name and email address provided via Google OAuth.</li>
                    <li><strong>Newsletter Content (The Siftl):</strong> We read the contents of the newsletters and industry updates you receive in your dedicated Siftl inbox folder or via connected integrations.</li>
                    <li><strong>Preferences:</strong> Your selected interest areas and frequency settings.</li>
                </ul>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-serif font-semibold text-[#1A1A1A]">2. Infrastructure & Partners</h2>
                <p>
                    To run Siftl effectively, we rely on a carefully curated stack of infrastructure partners:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Compute & Database:</strong> Vercel (Hosting), Upstash (Redis & QStash).</li>
                    <li><strong>Intelligence:</strong> Google Gemini (for complex reasoning), Groq/Meta Llama (for high-speed synthesis).</li>
                    <li><strong>Communication:</strong> SendGrid (for brief delivery).</li>
                </ul>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-serif font-semibold text-[#1A1A1A]">3. Account Deletion</h2>
                <p>
                    If you choose to delete your Siftl account, all associated briefing data, preferences, and OAuth tokens we hold are permanently purged from our databases.
                </p>
            </section>

            <h2>4. Data Retention and Deletion</h2>
            <p>
                We only keep what we need to serve you. Your original emails remain in your Google account (assuming you use a Gmail integration) entirely under your control. We store the generated briefings for your historical web dashboard.
                If you choose to delete your Siftl account, all associated briefing data, preferences, and OAuth tokens we hold are permanently purged from our databases.
            </p>

            <h2>5. Contact Us</h2>
            <p>
                For any questions regarding this privacy policy or your data, please contact us directly at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
            </p>
        </LegalLayout>
    );
}
