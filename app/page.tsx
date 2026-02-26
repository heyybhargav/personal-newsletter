'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Settings2, Radio, AlertTriangle, MailCheck } from 'lucide-react';
import { marked } from 'marked';
import { motion, AnimatePresence } from 'framer-motion';
import useSWR from 'swr';
import { Source, DigestSection } from '@/lib/types';
import { SourceIcon } from '@/components/SourceIcon';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function Home() {
  const { data, error, isLoading, mutate } = useSWR('/api/sources', fetcher);
  const sources: Source[] = data?.sources || [];
  const loading = isLoading;

  const { data: latestData, mutate: mutateLatest } = useSWR('/api/latest-briefing', fetcher);


  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [tier, setTier] = useState<string>('active');
  const [trialDaysRemaining, setTrialDaysRemaining] = useState<number>(0);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.tier) {
          setTier(data.tier);
          setTrialDaysRemaining(data.trialDaysRemaining || 0);
        }
      })
      .catch(err => console.error('Error fetching settings:', err));
  }, []);

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
      <div className="pt-12 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-4"
            >
              <h1 className="text-5xl md:text-7xl font-serif font-medium text-[#1A1A1A] tracking-tight leading-[0.9]">
                Your <span className="italic text-gray-400">Briefing</span>
              </h1>
            </motion.div>

          </div>

          <motion.div
            initial={{ opacity: 0, scaleX: 0.95 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className="h-px w-full bg-gray-200/60 mb-12 origin-left"
          ></motion.div>

          {/* New Grid Layout */}
          <div className="grid lg:grid-cols-12 gap-12">

            {/* LEFT COLUMN: Actions (4 cols) */}
            <div className="lg:col-span-4 space-y-8 order-2 lg:order-1">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-xs font-bold tracking-widest text-[#FF5700] uppercase mb-6">Quick Access</h3>
                <div className="space-y-3">
                  <Link href="/sources">
                    <div
                      className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-md hover:border-gray-200 transition-all group cursor-pointer"
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
                      className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-md hover:border-gray-200 transition-all group cursor-pointer mt-3"
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
                className="p-6 bg-[#1A1A1A] rounded-xl text-white relative overflow-hidden group mt-8"
              >
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-[pulse_2s_ease-in-out_infinite]"></div>
                    <span className="text-xs font-mono text-gray-500">READY</span>
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
                <motion.div
                  animate={{
                    opacity: [0.5, 0.8, 0.5],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                  className="absolute top-[-50%] right-[-50%] w-full h-full bg-white/5 blur-[80px] rounded-full pointer-events-none"
                ></motion.div>
              </motion.div>


              {/* Message Display */}
              <AnimatePresence>
                {message && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    className="overflow-hidden mt-3"
                  >
                    <div className={`p-4 rounded-lg text-sm border flex items-start gap-3 shadow-sm ${message.includes('Error') ? 'bg-[#1A1A1A] border-red-900/50 text-red-200' : 'bg-[#1A1A1A] border-green-900/50 text-green-200'}`}>
                      {message.includes('Error') ? (
                        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      ) : (
                        <MailCheck className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 leading-relaxed font-serif text-[15px]">
                        {message}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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
                          <h3 className="font-serif font-bold text-2xl">Latest Briefing</h3>
                          {displayContext?.generatedAt && (
                            <p className="text-xs font-mono text-gray-500 mt-1 uppercase tracking-wider">
                              Generated: {new Date(displayContext.generatedAt).toLocaleString()}
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
                            <h4 className="text-lg font-serif font-bold mb-3">{section.title}</h4>

                            {/* Render the AI Narrative */}
                            <div className="text-gray-800 leading-relaxed font-serif text-[17px] markdown-content max-w-none px-4 sm:px-0">
                              <EmailStyleMarkdown content={section.summary || ''} />
                            </div>

                            {/* Deep Dive Links */}
                            <div className="mt-4 flex flex-wrap gap-2 text-xs font-mono">
                              {section.items.map((item, i) => (
                                <a key={i} href={item.link} target="_blank" className="px-2 py-1 bg-gray-100 text-gray-500 rounded hover:bg-[#FF5700] hover:text-white transition-colors truncate max-w-[200px]">
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

              {loading ? (
                <div className="py-12 text-center text-gray-400 font-mono text-sm animate-pulse">Loading sources...</div>
              ) : sources.length === 0 ? (
                <div className="py-12 border border-dashed border-gray-300 rounded-xl text-center">
                  <p className="text-gray-500 font-serif italic mb-4">No sources configured yet.</p>
                  <Link href="/sources" className="text-sm font-bold underline decoration-[#FF5700] decoration-2 underline-offset-4 hover:bg-[#FF5700] hover:text-white hover:no-underline transition-all px-2 py-1 rounded">
                    Add Sources
                  </Link>
                </div>
              ) : (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: { staggerChildren: 0.1 }
                    }
                  }}
                  className="divide-y divide-gray-100 border-t border-b border-gray-100"
                >
                  {sources.map(source => (
                    <motion.div
                      key={source.id}
                      variants={{
                        hidden: { opacity: 0, x: -20 },
                        visible: { opacity: 1, x: 0 }
                      }}
                      className="group py-4 flex items-center justify-between hover:bg-white transition-all duration-200 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-xl transition-all">
                          {source.favicon ? <img src={source.favicon} className="w-5 h-5 object-contain" /> : <SourceIcon type={source.type} className="w-5 h-5" />}
                        </span>
                        <div>
                          <h3 className="font-serif text-lg text-[#1A1A1A] group-hover:text-[#FF5700] transition-colors">{source.name}</h3>
                          <p className="text-xs text-gray-400 font-mono lowercase">{source.url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]}</p>
                        </div>
                      </div>
                      <div className={`w-1.5 h-1.5 rounded-full ${source.enabled ? 'bg-[#FF5700]' : 'bg-gray-200'} transition-colors`}></div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
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
};
