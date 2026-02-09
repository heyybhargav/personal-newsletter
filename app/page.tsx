'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Source, DigestSection } from '@/lib/types';

export default function Home() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [previewSections, setPreviewSections] = useState<DigestSection[]>([]);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    try {
      const res = await fetch('/api/sources');
      const data = await res.json();
      setSources(data.sources || []);
    } catch (error) {
      console.error('Error fetching sources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    setGenerating(true);
    setMessage('');
    setPreviewSections([]);
    try {
      const res = await fetch('/api/digest');
      const data = await res.json();
      if (data.error) {
        setMessage(`Error: ${data.error}`);
      } else {
        setMessage(`✅ Generated digest with ${data.itemCount} items across ${data.sections?.length || 0} sections`);
        setPreviewSections(data.sections || []);
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleSendTest = async () => {
    setSending(true);
    setMessage('');
    try {
      const res = await fetch('/api/digest', { method: 'POST' });
      const data = await res.json();
      if (data.error) {
        setMessage(`Error: ${data.error}`);
      } else if (data.sent) {
        setMessage(`✅ Email sent successfully! (${data.itemCount} items) — Check your Spam folder if you don't see it.`);
      } else {
        setMessage(data.message || 'No email sent');
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-gray-900 font-sans selection:bg-[#FF5700] selection:text-white">
      {/* Spam Warning Banner */}
      <div className="bg-[#FFE100]/10 border-b border-[#FFE100]/20 px-6 py-2 text-center">
        <p className="text-xs font-medium text-yellow-800 tracking-wide uppercase">
          ⚠️ Check your spam folder
        </p>
      </div>

      {/* Premium Hero Section */}
      <div className="pt-12 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="space-y-4">
              <div className="px-3 py-1 rounded-full border border-gray-200 inline-block bg-white/50 backdrop-blur-sm">
                <p className="text-xs font-bold tracking-widest text-gray-400 uppercase">Control Room</p>
              </div>
              <h1 className="text-5xl md:text-7xl font-serif font-medium text-[#1A1A1A] tracking-tight leading-[0.9]">
                Morning <span className="italic text-gray-400">Briefing</span>
              </h1>
            </div>

          </div>

          <div className="h-px w-full bg-gray-200/60 mb-12"></div>

          {/* New Grid Layout */}
          <div className="grid lg:grid-cols-12 gap-12">

            {/* LEFT COLUMN: Actions (4 cols) */}
            <div className="lg:col-span-4 space-y-8">
              <div>
                <h3 className="text-xs font-bold tracking-widest text-[#FF5700] uppercase mb-6">Operations</h3>
                <div className="space-y-3">
                  <Link href="/sources" className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-md hover:border-gray-200 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-sm group-hover:bg-black group-hover:text-white transition-colors">📚</div>
                      <span className="font-medium text-gray-900">Manage Sources</span>
                    </div>
                    <span className="text-gray-300 group-hover:text-black transition-colors">→</span>
                  </Link>

                  <Link href="/settings" className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-md hover:border-gray-200 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-sm group-hover:bg-black group-hover:text-white transition-colors">⚙️</div>
                      <span className="font-medium text-gray-900">System Config</span>
                    </div>
                    <span className="text-gray-300 group-hover:text-black transition-colors">→</span>
                  </Link>
                </div>
              </div>

              <div className="p-6 bg-[#1A1A1A] rounded-xl text-white relative overflow-hidden group">
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-xs font-mono text-gray-500">SYSTEM READY</span>
                  </div>
                  <h3 className="text-xl font-serif mb-2">Manual Dispatch</h3>
                  <p className="text-gray-400 text-sm mb-6 leading-relaxed">Trigger an immediate digest generation for the current active sources.</p>

                  <button
                    onClick={handleSendTest}
                    disabled={sending}
                    className="w-full py-3 bg-white text-black font-medium text-sm rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {sending ? (
                      <>
                        <span className="animate-spin">↻</span> Processing...
                      </>
                    ) : (
                      'Run Sequence'
                    )}
                  </button>
                </div>

                {/* Decorative noise/gradient */}
                <div className="absolute top-[-50%] right-[-50%] w-full h-full bg-white/5 blur-[80px] rounded-full pointer-events-none"></div>
              </div>

              {/* Message Display - Moved here for better UX */}
              {message && (
                <div className={`p-4 rounded-lg text-sm font-medium border ${message.includes('Error') ? 'bg-red-50 border-red-100 text-red-700' : 'bg-green-50 border-green-100 text-green-700'}`}>
                  {message}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Sources & Preview (8 cols) */}
            <div className="lg:col-span-8">
              <div className="flex justify-between items-baseline mb-6">
                <h2 className="text-xs font-bold tracking-widest text-[#FF5700] uppercase">Intelligence Feed</h2>
                <button
                  onClick={handlePreview}
                  disabled={generating}
                  className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-black transition disabled:opacity-50"
                >
                  {generating ? 'Compiling...' : 'Preview Output'}
                </button>
              </div>

              {/* PREVIEW AREA */}
              {previewSections.length > 0 && (
                <div className="mb-12 border-l-2 border-[#FF5700] pl-6 py-2 animate-in fade-in slide-in-from-top-2">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-serif font-bold text-2xl">Latest Briefing</h3>
                    <button onClick={() => setPreviewSections([])} className="text-gray-400 hover:text-black">×</button>
                  </div>

                  <div className="space-y-8">
                    {previewSections.map((section, idx) => (
                      <div key={idx} className="prose prose-sm max-w-none">
                        <h4 className="text-lg font-serif font-bold mb-3">{section.title}</h4>

                        {/* Render the AI Narrative */}
                        <div className="text-gray-600 leading-relaxed space-y-3 font-serif text-lg">
                          {(section.summary || '').split('\n\n').map((para, i) => (
                            <p key={i} dangerouslySetInnerHTML={{
                              __html: para.replace(/\*\*(.*?)\*\*/g, '<strong class="text-black font-semibold">$1</strong>')
                            }} />
                          ))}
                        </div>

                        {/* Deep Dive Links */}
                        <div className="mt-4 flex flex-wrap gap-2 text-xs font-mono">
                          {section.items.map((item, i) => (
                            <a key={i} href={item.link} target="_blank" className="px-2 py-1 bg-gray-100 text-gray-500 rounded hover:bg-[#FF5700] hover:text-white transition-colors truncate max-w-[200px]">
                              {new URL(item.link).hostname.replace('www.', '')}
                            </a>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="h-px w-full bg-gray-200 mt-12"></div>
                </div>
              )}

              {loading ? (
                <div className="py-12 text-center text-gray-400 font-mono text-sm animate-pulse">Initializing feed protocols...</div>
              ) : sources.length === 0 ? (
                <div className="py-12 border border-dashed border-gray-300 rounded-xl text-center">
                  <p className="text-gray-500 font-serif italic mb-4">"Silence is golden, but news is essential."</p>
                  <Link href="/sources" className="text-sm font-bold underline decoration-[#FF5700] decoration-2 underline-offset-4 hover:bg-[#FF5700] hover:text-white hover:no-underline transition-all px-2 py-1 rounded">
                    Initialize Sources
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 border-t border-b border-gray-100">
                  {sources.map(source => (
                    <div key={source.id} className="group py-4 flex items-center justify-between hover:bg-white hover:px-4 -mx-4 transition-all duration-300 rounded-lg">
                      <div className="flex items-center gap-4">
                        <span className="text-xl opacity-50 grayscale group-hover:grayscale-0 transition-all">
                          {source.favicon ? <img src={source.favicon} className="w-5 h-5 object-contain" /> : getSourceTypeEmoji(source.type)}
                        </span>
                        <div>
                          <h3 className="font-serif text-lg text-[#1A1A1A] group-hover:text-[#FF5700] transition-colors">{source.name}</h3>
                          <p className="text-xs text-gray-400 font-mono lowercase">{source.url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]}</p>
                        </div>
                      </div>
                      <div className={`w-1.5 h-1.5 rounded-full ${source.enabled ? 'bg-[#FF5700]' : 'bg-gray-200'} group-hover:scale-150 transition-transform`}></div>
                    </div>
                  ))}
                </div>
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
};
