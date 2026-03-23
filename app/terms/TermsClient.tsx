'use client';

import LegalLayout from '@/components/landing/LegalLayout';

export default function TermsClient() {
    return (
        <LegalLayout title="Terms of Service" lastUpdated="March 12, 2026">
            <p className="lead text-xl text-gray-500 font-medium mb-12">
                By subscribing to Siftl, you agree to these terms. Our business model is straightforward: you entrust us with your daily reading, and we synthesize it. Your attention is your responsibility; optimizing it is ours.
            </p>

            <section className="space-y-4">
                <h2 className="text-xl font-serif font-semibold text-[#1A1A1A]">1. The Service</h2>
                <p>
                    Siftl ("we", "us", "our") provides an AI-powered email aggregation and briefing service. By granting us access to your designated inbox or newsletter flow, we extract, process, and deliver a daily synthesis.
                </p>
                <ul className="list-disc pl-6 space-y-2">
                    <li><strong>The Product:</strong> Siftl is highly experimental and agentic software. Features, functionality, and delivery methods may change as we optimize the system for higher signal-to-noise ratios.</li>
                </ul>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-serif font-semibold text-[#1A1A1A]">2. User Responsibilities</h2>
                <p>
                    You represent that you are authorized to forward or connect the email content you provide to Siftl.
                </p>
                <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Lawful Content:</strong> You agree not to route illegal, highly sensitive, or everyday personal correspondence (e.g., banking statements, private medical data) through Siftl purposefully. Siftl is designed for public newsletters, blogs, and industry signals.</li>
                </ul>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-serif font-semibold text-[#1A1A1A]">3. AI Disclosure & Liability</h2>
                <p>
                    Siftl uses advanced Large Language Models to read, prioritize, and summarize dense information.
                </p>
                <ul className="list-disc pl-6 space-y-2">
                    <li><strong>AI Fallibility:</strong> You explicitly acknowledge that LLMs can and do "hallucinate" (make mistakes or misrepresent facts). Siftl is an aggregator and an assistant, not an oracle.</li>
                    <li><strong>Verification:</strong> <strong>You are solely responsible for fact-checking the original source material.</strong> We provide direct links to the source for this exact reason. We accept no liability for decisions, financial, technical, or personal, made based solely on a Siftl summary.</li>
                </ul>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-serif font-semibold text-[#1A1A1A]">4. Limitation of Liability</h2>
                <p>
                    To the maximum extent permitted by law, Siftl Inc. shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, resulting from your use of the service.
                </p>
                <p>
                    In no event shall our aggregate liability exceed the total amount paid by you (if any) to Siftl in the past twelve months.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-serif font-semibold text-[#1A1A1A]">5. Modifications</h2>
                <p>
                    We reserve the right to modify these Terms at any time. We will indicate the "Last Updated" date at the top of this page. Your continued use of Siftl implies full acceptance of those changes.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-serif font-semibold text-[#1A1A1A]">6. Governing Law</h2>
                <p>
                    These terms shall be governed by the laws of our primary operating jurisdiction, without regard to conflict of law principles.
                </p>
            </section>
        </LegalLayout>
    );
}
