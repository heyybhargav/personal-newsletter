"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { marked } from "marked";
import { DigestSection } from "@/lib/types";
import { ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertBanner } from "@/components/AlertBanner";

function EmailStyleMarkdown({ content }: { content: string }) {
    const [html, setHtml] = useState('');

    useEffect(() => {
        async function parse() {
            if (!content) return;
            const rawHtml = await marked.parse(content);

            const formatted = rawHtml
                .replace(/<h1/g, '<h1 style="font-family: \'Georgia\', serif; font-weight: bold; font-size: 24px; margin: 24px 0 16px 0; color: #000;"')
                .replace(/<h2/g, '<h2 style="font-family: \'Georgia\', serif; font-weight: bold; font-size: 20px; margin: 20px 0 12px 0; color: #000;"')
                .replace(/<h3/g, '<h3 style="font-family: \'Georgia\', serif; font-weight: bold; font-size: 18px; margin: 18px 0 10px 0; color: #000;"')
                .replace(/<h4/g, '<h4 style="font-family: \'Georgia\', serif; font-weight: bold; font-size: 17px; margin: 16px 0 8px 0; color: #000;"')
                .replace(/<p>/g, '<p style="margin: 0 0 18px 0; font-family: \'Georgia\', serif; font-size: 17px; line-height: 1.6; color: #333; overflow-wrap: break-word; hyphens: auto;">')
                .replace(/<a /g, '<a style="color: #2563eb; text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 3px; display: inline; word-break: normal; overflow-wrap: break-word;" target="_blank" rel="noopener noreferrer" ')
                .replace(/<ul>/g, '<ul style="padding-left: 20px; margin-bottom: 18px; list-style-type: disc;">')
                .replace(/<ol>/g, '<ol style="padding-left: 20px; margin-bottom: 18px; list-style-type: decimal;">')
                .replace(/<li>/g, '<li style="margin-bottom: 8px; font-family: \'Georgia\', serif; font-size: 17px; line-height: 1.6; color: #333; overflow-wrap: break-word; padding-left: 4px;">')
                .replace(/<blockquote>/g, '<blockquote style="border-left: 4px solid #3b82f6; background: #f9f9f9; padding: 12px 16px; margin: 24px 0; font-style: italic; color: #444; border-radius: 0 4px 4px 0; overflow-wrap: break-word;">');

            setHtml(formatted);
        }
        parse();
    }, [content]);

    return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function ArchivedBriefingView() {
    const params = useParams();
    const router = useRouter();
    const dateParam = params.date as string;

    const [briefing, setBriefing] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!dateParam) return;

        // Fix local offset decoding bug
        fetch(`/api/archive/${dateParam}`)
            .then(res => {
                if (res.status === 404) throw new Error("This briefing has either expired or does not exist.");
                if (!res.ok) throw new Error("Failed to load historical briefing.");
                return res.json();
            })
            .then(data => {
                setBriefing(data);
                setIsLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setIsLoading(false);
            });
    }, [dateParam]);

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        const userTimezoneOffset = d.getTimezoneOffset() * 60000;
        const correctedDate = new Date(d.getTime() + userTimezoneOffset);

        return new Intl.DateTimeFormat("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
        }).format(correctedDate);
    };

    return (
        <main className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A] font-sans selection:bg-[#FF5700]/20 pb-24">
            <div className="max-w-4xl mx-auto px-6 lg:px-8 mt-12 sm:mt-16">

                <Link href="/archive" className="inline-flex items-center gap-2 text-gray-500 hover:text-[#FF5700] mb-12 transition-colors text-sm font-medium group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to History
                </Link>

                {error && (
                    <div className="mb-8">
                        <AlertBanner message={error} type="error" />
                        <button onClick={() => router.push('/archive')} className="block mt-4 underline text-sm text-red-600 hover:text-red-900">Return to Archives</button>
                    </div>
                )}

                {isLoading && !error && (
                    <div className="space-y-8 animate-pulse">
                        <div className="h-12 w-3/4 bg-gray-200/50 rounded-lg"></div>
                        <div className="h-64 bg-gray-200/50 rounded-lg"></div>
                        <div className="h-32 bg-gray-200/50 rounded-lg"></div>
                    </div>
                )}

                {!isLoading && briefing && (
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <header className="mb-12 border-b border-gray-200 pb-8">
                            <span className="text-xs font-bold tracking-widest text-[#FF5700] uppercase mb-4 block">
                                Edition
                            </span>
                            <h1 className="font-serif font-bold text-4xl sm:text-5xl tracking-tight text-[#1A1A1A] mb-4">
                                {formatDate(dateParam)}
                            </h1>
                            {briefing?.briefing?.generatedAt && (
                                <p className="text-sm font-mono text-gray-400">
                                    Generated: {new Date(briefing.briefing.generatedAt).toLocaleString()}
                                </p>
                            )}
                        </header>

                        <div className="space-y-12">
                            {briefing.sections?.map((section: DigestSection, idx: number) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="max-w-none"
                                >
                                    <h4 className="text-xl sm:text-2xl font-serif font-bold text-[#1A1A1A] mb-6">{section.title}</h4>

                                    <div className="text-gray-800 leading-relaxed font-serif text-[17px] markdown-content bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm">
                                        <EmailStyleMarkdown content={section.summary || ''} />
                                    </div>

                                    {section.items && section.items.length > 0 && (
                                        <div className="mt-4 flex flex-wrap gap-2 text-xs font-mono ml-4">
                                            <span className="py-1 text-gray-400 uppercase tracking-widest font-bold mr-2">Sources:</span>
                                            {section.items.map((item, i) => (
                                                <a key={i} href={item.link} target="_blank" className="px-2 py-1 bg-gray-100 text-gray-500 rounded hover:bg-[#FF5700] hover:text-white transition-colors truncate max-w-[200px]">
                                                    {new URL(item.link).hostname.replace('www.', '')}
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>
        </main>
    );
}
