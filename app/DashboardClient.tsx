'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Settings2, Radio, AlertTriangle, MailCheck } from 'lucide-react';
import { marked } from 'marked';
import { motion, AnimatePresence } from 'framer-motion';
import useSWR from 'swr';
import { Source, DigestSection } from '@/lib/types';
import { SourceIcon } from '@/components/SourceIcon';
import { AlertBanner } from '@/components/AlertBanner';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface DashboardClientProps {
  initialSources: Source[];
  initialTier: string;
  initialTrialDays: number;
  initialLatestData: any;
}

export default function DashboardClient({
  initialSources,
  initialTier,
  initialTrialDays,
  initialLatestData
}: DashboardClientProps) {
  const { data, error, isLoading, mutate } = useSWR('/api/sources', fetcher, { fallbackData: { sources: initialSources } });
  const sources: Source[] = data?.sources || [];
  const loading = false; // Initial data always present

  const { data: latestData, mutate: mutateLatest } = useSWR('/api/latest-briefing', fetcher, { fallbackData: initialLatestData });

  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [tier, setTier] = useState<string>(initialTier);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState<number>(initialTrialDays);

  // Initial states established via props.

  const handleSendTest = async () => {
    setSending(true);
    setMessage('');
    try {
      const res = await fetch('/api/digest', { method: 'POST' });
      const data = await res.json();
      if (data.error) {
        setMessage(`Error: ${data.error}`);
      } else if (data.sent) {
        setMessage(`Email dispatched. Please check your spam folder if you cannot find it in your inbox!`);
        mutateLatest(); // Refresh the latest briefing display
      } else {
        setMessage(data.message || 'No email sent');
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  const displaySections = latestData?.sections || [];
  const displayContext = latestData?.briefing;

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-gray-900 font-sans selection:bg-[#FF5700] selection:text-white">

      {/* Premium Hero Section */}
      <div className="pt-6 sm:pt-12 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 mb-12">
            <div className="lg:col-start-5 lg:col-span-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-4"
              >
                <h1 className="text-5xl md:text-7xl font-serif font-medium text-[#1A1A1A] tracking-tight leading-[0.9]">
                  Your Briefing
                </h1>
              </motion.div>
            </div>
          </div>


          {/* New Grid Layout */}
          <div className="grid lg:grid-cols-12 gap-12">

            {/* LEFT COLUMN: Actions (4 cols) */}
            <div className="lg:col-span-4 space-y-8 order-2 lg:order-1 sticky top-32 self-start">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-xs font-bold tracking-widest text-[#FF5700] uppercase mb-6">Quick Access</h3>
                <div className="space-y-3">
                  <Link href="/sources">
                    <div
                      className="flex items-center justify-between p-5 bg-white border border-gray-100/80 rounded-2xl shadow-sm hover:shadow-md hover:border-gray-200 transition-all group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-sm group-hover:bg-[#FF5700] group-hover:text-white transition-colors">
                          <Radio className="w-4 h-4 text-[#FF5700] group-hover:text-white transition-colors" />
                        </div>
                        <span className="font-medium text-gray-900">Sources</span>
                      </div>
                      <span className="text-gray-300 group-hover:text-black transition-colors transform group-hover:translate-x-1">→</span>
                    </div>
                  </Link>

                  <Link href="/settings">
                    <div
                      className="flex items-center justify-between p-5 bg-white border border-gray-100/80 rounded-2xl shadow-sm hover:shadow-md hover:border-gray-200 transition-all group cursor-pointer mt-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-sm group-hover:bg-gray-800 group-hover:text-white transition-colors">
                          <Settings2 className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                        </div>
                        <span className="font-medium text-gray-900">Settings</span>
                      </div>
                      <span className="text-gray-300 group-hover:text-black transition-colors transform group-hover:translate-x-1">→</span>
                    </div>
                  </Link>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="p-8 bg-[#1A1A1A] rounded-2xl text-white relative overflow-hidden group mt-8"
              >
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-10">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-[pulse_2s_ease-in-out_infinite]"></div>
                    <span className="text-[10px] font-mono text-gray-500 tracking-widest">READY</span>
                  </div>
                  <h3 className="text-xl font-serif mb-2">Force Dispatch</h3>
                  <p className="text-gray-400 text-sm mb-6 leading-relaxed">Skip the schedule. Get your briefing instantly.</p>

                  <motion.button
                    whileHover={{ opacity: 0.9 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSendTest}
                    disabled={sending || (tier === 'trial' && trialDaysRemaining === 0) || tier === 'expired'}
                    title={(tier === 'trial' && trialDaysRemaining === 0) || tier === 'expired' ? "Subscribe to use Force Dispatch" : "Generate briefing now"}
                    className="w-full py-3 bg-white text-black font-medium text-sm rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {sending ? (
                      <>
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                          className="w-4 h-4 border-2 border-transparent border-t-black border-l-black rounded-full"
                        ></motion.span>
                        <span>Generating...</span>
                      </>
                    ) : (
                      ((tier === 'trial' && trialDaysRemaining === 0) || tier === 'expired') ? 'Subscribe to Send' : 'Send Now'
                    )}
                  </motion.button>
                </div>

                {/* Decorative noise/gradient */}
              </motion.div>


              {/* Message Display */}
              <AlertBanner message={message} className="mt-3" />
            </div>

            {/* RIGHT COLUMN: Sources & Preview (8 cols) */}
            <div className="lg:col-span-8 order-1 lg:order-2">
              <div className="flex flex-col sm:flex-row justify-between items-baseline mb-6 gap-2">
                <h2 className="text-xs font-bold tracking-widest text-[#FF5700] uppercase">Intelligence Feed</h2>
              </div>

              {/* PREVIEW AREA */}
              <AnimatePresence>
                {displaySections.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mb-12 py-2 px-4 sm:px-0">
                      <div className="flex justify-between items-start mb-6 pr-4">
                        <div>
                          {displayContext?.subject && (
                            <h3 className="font-serif font-bold text-2xl mb-2">{displayContext?.subject}</h3>
                          )}
                          {displayContext?.preheader && (
                            <p className="text-gray-500 font-sans text-[15px] mb-4 leading-relaxed line-clamp-2">
                              {displayContext?.preheader}
                            </p>
                          )}
                          {displayContext?.generatedAt && (
                            <p className="text-xs font-mono text-gray-400 uppercase tracking-wider mt-4">
                              {new Date(displayContext.generatedAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-8">
                        {displaySections.map((section: DigestSection, idx: number) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="max-w-none"
                          >
                            <h4 className="text-lg font-serif font-bold mb-3">
                              {/* Deduplicate: Only render if it doesn't match the main subject exactly */}
                              {section.title !== displayContext?.subject ? section.title : null}
                            </h4>

                            {/* Render the AI Narrative */}
                            <div className="text-gray-800 leading-relaxed font-sans text-[17px] markdown-content max-w-none px-4 sm:px-0 break-words w-full">
                              <EmailStyleMarkdown content={section.summary || ''} />
                            </div>

                            {/* Deep Dive Links */}
                            <div className="mt-4 flex flex-col sm:flex-row flex-wrap gap-2 text-xs font-mono px-4 sm:px-0">
                              {section.items.map((item, i) => (
                                <a key={i} href={item.link} target="_blank" className="px-2 py-1 bg-gray-100 text-gray-500 rounded hover:bg-[#FF5700] hover:text-white transition-colors break-words w-max max-w-full">
                                  {new URL(item.link).hostname.replace('www.', '')}
                                </a>
                              ))}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                      <div className="h-px w-full bg-gray-200 mt-12"></div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const getSourceTypeEmoji = (type: string) => {
  switch (type) {
    case 'youtube': return '📺';
    case 'podcast': return '🎙️';
    case 'news': return '📰';
    case 'reddit': return '💬';
    default: return '🔖';
  }
}

// This mirrors the email template rendering to ensure Dashboard looks identical to the actual emails
function EmailStyleMarkdown({ content }: { content: string }) {
  const [html, setHtml] = useState('');

  useEffect(() => {
    async function parse() {
      if (!content) return;
      const rawHtml = await marked.parse(content);

      const formatted = rawHtml
        .replace(/<h1/g, '<h1 style="font-family: \'Inter\', sans-serif; font-weight: bold; font-size: 24px; margin: 24px 0 16px 0; color: #000;"')
        .replace(/<h2/g, '<h2 style="font-family: \'Inter\', sans-serif; font-weight: bold; font-size: 20px; margin: 20px 0 12px 0; color: #000;"')
        .replace(/<h3/g, '<h3 style="font-family: \'Inter\', sans-serif; font-weight: bold; font-size: 18px; margin: 18px 0 10px 0; color: #000;"')
        .replace(/<h4/g, '<h4 style="font-family: \'Inter\', sans-serif; font-weight: bold; font-size: 17px; margin: 16px 0 8px 0; color: #000;"')
        .replace(/<p>/g, '<p style="margin: 0 0 18px 0; font-family: \'Inter\', sans-serif; font-size: 17px; line-height: 1.75; color: #333;">')
        .replace(/<a /g, '<a style="color: #FF5700; text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 3px; display: inline; word-break: normal; overflow-wrap: break-word;" target="_blank" rel="noopener noreferrer" ')
        .replace(/<ul>/g, '<ul style="padding-left: 20px; margin-bottom: 18px; list-style-type: disc;">')
        .replace(/<ol>/g, '<ol style="padding-left: 20px; margin-bottom: 18px; list-style-type: decimal;">')
        .replace(/<li>/g, '<li style="margin-bottom: 8px; font-family: \'Inter\', sans-serif; font-size: 17px; line-height: 1.75; color: #333; padding-left: 4px;">')
        .replace(/<blockquote>/g, '<blockquote style="border-left: 4px solid #3b82f6; background: #f9f9f9; padding: 12px 16px; margin: 24px 0; color: #444; border-radius: 0 4px 4px 0; overflow-wrap: break-word;">');

      setHtml(formatted);
    }
    parse();
  }, [content]);

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
};
