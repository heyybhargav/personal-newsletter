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
    <div className="min-h-screen bg-[#F9FAFB] text-gray-900 font-sans">
      {/* Spam Warning Banner */}
      <div className="bg-yellow-50 border-b border-yellow-100 px-6 py-3 text-center">
        <p className="text-sm text-yellow-800 font-medium">
          ⚠️ Emails landing in Spam? Please move them to <strong>Primary</strong> to help us build reputation.
        </p>
      </div>

      {/* Premium Hero Section */}
      <div className="bg-white border-b border-gray-200 pt-12 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-end mb-6">
            <div>
              <p className="text-sm font-bold tracking-widest text-gray-400 uppercase mb-2">Admin Dashboard</p>
              <h1 className="text-5xl font-serif font-bold text-gray-900 tracking-tight">Signal Control Room</h1>
            </div>
            <Link href="/subscribe" className="text-gray-400 hover:text-black transition text-sm font-medium border-b border-gray-200 hover:border-black pb-0.5">
              View Public Subscription Page ↗
            </Link>
          </div>
          <p className="text-xl text-gray-500 font-light max-w-2xl leading-relaxed">
            Manage the intelligence sources and generation pipeline for your executive briefings.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Link href="/sources" className="group bg-white rounded-xl shadow-sm border border-gray-200 p-8 hover:shadow-md hover:border-gray-300 transition-all">
            <div className="text-3xl mb-4 grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition">📚</div>
            <h3 className="text-lg font-bold mb-2">Manage Sources</h3>
            <p className="text-gray-500 text-sm">Curate the RSS feeds and intelligence channels.</p>
          </Link>

          <Link href="/settings" className="group bg-white rounded-xl shadow-sm border border-gray-200 p-8 hover:shadow-md hover:border-gray-300 transition-all">
            <div className="text-3xl mb-4 grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition">⚙️</div>
            <h3 className="text-lg font-bold mb-2">System Config</h3>
            <p className="text-gray-500 text-sm">Configure global specific delivery preferences.</p>
          </Link>

          <button
            onClick={handleSendTest}
            disabled={sending}
            className="group bg-black text-white rounded-xl shadow-lg p-8 hover:bg-gray-900 transition-all text-left disabled:opacity-50"
          >
            <div className="text-3xl mb-4">✨</div>
            <h3 className="text-lg font-bold mb-2">
              {sending ? 'Dispatching...' : 'Force Dispatch'}
            </h3>
            <p className="text-gray-400 text-sm">Trigger immediate digest generation for Test Admin.</p>
          </button>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mb-8 p-4 rounded-lg font-medium border ${message.includes('Error') ? 'bg-red-50 border-red-100 text-red-700' : 'bg-green-50 border-green-100 text-green-700'}`}>
            {message}
          </div>
        )}

        {/* Current Sources */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-6">
            <h2 className="text-2xl font-serif font-bold">Active Intelligence Sources</h2>
            <button
              onClick={handlePreview}
              disabled={generating}
              className="text-indigo-600 font-medium hover:text-indigo-800 transition disabled:opacity-50"
            >
              {generating ? 'Generating Preview...' : 'View Preview'}
            </button>
          </div>

          {/* PREVIEW AREA */}
          {previewSections.length > 0 && (
            <div className="mb-12 bg-gray-50 rounded-xl p-8 border border-gray-200 shadow-inner animate-in fade-in slide-in-from-top-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-serif font-bold text-xl">📝 Latest Digest Preview</h3>
                <button onClick={() => setPreviewSections([])} className="text-sm text-gray-500 hover:text-gray-700">Close</button>
              </div>

              <div className="space-y-8 prose prose-indigo max-w-none">
                {previewSections.map((section, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <h4 className="flex items-center gap-3 text-sm font-bold tracking-widest text-gray-400 uppercase mb-4 border-b border-gray-50 pb-2">
                      {section.title}
                    </h4>

                    {/* Render the AI Narrative - treating newlines as paragraphs */}
                    <div className="text-gray-800 leading-relaxed space-y-4">
                      {(section.summary || '').split('\n\n').map((para, i) => (
                        <p key={i} dangerouslySetInnerHTML={{
                          __html: para.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        }} />
                      ))}
                    </div>

                    {/* Deep Dive Links */}
                    <div className="mt-6 pt-6 border-t border-gray-100">
                      <p className="text-xs font-bold text-gray-400 uppercase mb-3">Deep Dive Sources</p>
                      <ul className="space-y-2">
                        {section.items.map((item, i) => (
                          <li key={i}>
                            <a href={item.link} target="_blank" className="text-sm text-indigo-600 hover:underline truncate block">
                              {item.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center text-gray-400">Loading sources...</div>
          ) : sources.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4 opacity-30">📭</div>
              <p className="text-gray-500 mb-6">No sources configured for the admin account.</p>
              <Link href="/sources" className="bg-black text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 transition">
                Add Source
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sources.map(source => (
                <div
                  key={source.id}
                  className="flex items-center gap-4 p-4 rounded-lg bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-sm transition overflow-hidden"
                >
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex-shrink-0 flex items-center justify-center text-lg shadow-sm">
                    {source.favicon ? <img src={source.favicon} className="w-6 h-6 object-contain" /> : getSourceTypeEmoji(source.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{source.name}</h3>
                    <p className="text-xs text-gray-500 truncate font-mono opacity-80">{source.url.replace(/^https?:\/\//, '').replace(/^www\./, '')}</p>
                  </div>

                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${source.enabled ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                </div>
              ))}
            </div>
          )}
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
