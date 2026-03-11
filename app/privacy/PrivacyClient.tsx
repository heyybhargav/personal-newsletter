'use client';

import LegalLayout from '@/components/landing/LegalLayout';

export default function PrivacyClient() {
    return (
        <LegalLayout title="Privacy Policy" lastUpdated="March 12, 2026">
            <p className="lead text-xl text-gray-500 font-medium mb-12">
                At Signal Daily, we believe your attention is your most valuable asset. This policy outlines exactly how we protect it, the data we collect to generate your briefings, and our uncompromising stance on AI data training.
            </p>

            <h2>1. Information We Collect</h2>
            <p>
                Signal Daily requires specific access to function as your agentic knowledge engine. We collect the following information:
            </p>
            <ul>
                <li><strong>Account Information:</strong> We store your email address and basic profile information provided through Google OAuth.</li>
                <li><strong>Newsletter Content (The Signal Daily):</strong> We read the contents of the newsletters and industry updates you receive in your dedicated Signal Daily inbox folder or via connected integrations.</li>
            </ul>

            <h2>2. How We Use Your Data (The AI Clause)</h2>
            <p>
                Our core service relies on Large Language Models (LLMs) to synthesize your newsletters. Here is our strict mandate on how that processing works:
            </p>
            <ul>
                <li><strong>Synthesis Only:</strong> Your email content is sent to our AI partners (e.g., Google Gemini, Groq) strictly for the purpose of generating your daily briefing.</li>
                <li><strong>Zero Training Mandate:</strong> We have executed enterprise agreements or explicitly opted out of data training with our LLM providers. <strong>Your private newsletters and emails are NEVER used to train, fine-tune, or improve public AI models.</strong></li>
                <li><strong>Ephemeral Processing:</strong> Once your briefing is generated and delivered, the raw extracted text used during the AI prompt phase is no longer actively needed by the LLM.</li>
            </ul>

            <h2>3. Third-Party Data Processors</h2>
            <p>
                To run Signal Daily effectively, we rely on a carefully curated stack of infrastructure partners:
            </p>
            <ul>
                <li><strong>Authentication:</strong> Google Auth services.</li>
                <li><strong>AI Processing:</strong> Google Vertex AI (Gemini) and Groq.</li>
                <li><strong>Database & Queueing:</strong> Upstash (Redis and QStash) for managing background briefing generation workflows securely.</li>
                <li><strong>Hosting:</strong> Vercel for secure edge deployment.</li>
            </ul>

            <h2>4. Data Retention and Deletion</h2>
            <p>
                We only keep what we need to serve you. Your original emails remain in your Google account (assuming you use a Gmail integration) entirely under your control. We store the generated briefings for your historical web dashboard.
                If you choose to delete your Signal Daily account, all associated briefing data, preferences, and OAuth tokens we hold are permanently purged from our databases.
            </p>

            <h2>5. Contact Us</h2>
            <p>
                For any questions regarding this privacy policy or your data, please contact us directly at <a href="mailto:editor@signaldaily.me">editor@signaldaily.me</a>.
            </p>
        </LegalLayout>
    );
}
