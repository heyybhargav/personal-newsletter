'use client';

import LegalLayout from '@/components/landing/LegalLayout';

export default function TermsClient() {
    return (
        <LegalLayout title="Terms of Service" lastUpdated="March 12, 2026">
            <p className="lead text-xl text-gray-500 font-medium mb-12">
                By subscribing to Signal, you agree to these terms. Our business model is straightforward: you entrust us with your technical reading, and we synthesize it. Your attention is your responsibility; optimizing it is ours.
            </p>

            <h2>1. Service Overview</h2>
            <p>
                Signal ("we", "us", "our") provides an AI-powered email aggregation and briefing service. By granting us access to your designated inbox or newsletter flow, we extract, process, and deliver a daily synthesis.
            </p>
            <ul>
                <li><strong>The Product:</strong> Signal is highly experimental and agentic software. Features, functionality, and delivery methods may change as we optimize the system for higher signal-to-noise ratios.</li>
                <li><strong>No Uptime Guarantee:</strong> While we rely on enterprise-grade infrastructure (Vercel, Upstash, Google), we do not guarantee 100% uptime or the flawless execution of every scheduled brief.</li>
            </ul>

            <h2>2. User Obligations & Fair Use</h2>
            <p>
                You represent that you are authorized to forward or connect the email content you provide to Signal.
            </p>
            <ul>
                <li><strong>Lawful Content:</strong> You agree not to route illegal, highly sensitive, or non-technical personal correspondence (e.g., banking statements, private medical data) through Signal purposefully. Signal is designed for public newsletters, blogs, and technical signals.</li>
                <li><strong>Rate Limits:</strong> To protect our AI compute pipelines, we may enforce reasonable limits on the volume of incoming emails processed per user per day. Abuse of the system will result in instant termination.</li>
            </ul>

            <h2>3. The "AI Hallucination" Disclaimer</h2>
            <p>
                Signal uses advanced Large Language Models to read, prioritize, and summarize dense information.
            </p>
            <ul>
                <li><strong>AI Fallibility:</strong> You explicitly acknowledge that LLMs can and do "hallucinate" (make mistakes or misrepresent facts). Signal is an aggregator and an assistant, not an oracle.</li>
                <li><strong>Verification:</strong> <strong>You are solely responsible for fact-checking the original source material.</strong> We provide direct links to the source for this exact reason. We accept no liability for decisions—financial, technical, or personal—made based solely on a Signal summary.</li>
            </ul>

            <h2>4. Limitation of Liability</h2>
            <p>
                To the maximum extent permitted by law, Signal Inc. shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues—whether incurred directly or indirectly—resulting from your use of the service.
            </p>
            <p>
                In no event shall our aggregate liability exceed the total amount paid by you (if any) to Signal in the past twelve months.
            </p>

            <h2>5. Modifications</h2>
            <p>
                We reserve the right to modify these Terms at any time. We will indicate the "Last Updated" date at the top of this page. Your continued use of Signal implies full acceptance of those changes.
            </p>

            <h2>6. Governing Law</h2>
            <p>
                These terms shall be governed by the laws of our primary operating jurisdiction, without regard to conflict of law principles.
            </p>
        </LegalLayout>
    );
}
