'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Source {
  id: string;
  name: string;
  type: string;
  url: string;
  enabled: boolean;
}

export default function Home() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
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
    try {
      const res = await fetch('/api/digest');
      const data = await res.json();
      if (data.error) {
        setMessage(`Error: ${data.error}`);
      } else {
        setMessage(`✅ Generated digest with ${data.itemCount} items across ${data.sections?.length || 0} sections`);
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
        setMessage(`✅ Email sent successfully! (${data.itemCount} items)`);
      } else {
        setMessage(data.message || 'No email sent');
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  const getSourceTypeEmoji = (type: string) => {
    switch (type) {
      case 'youtube': return '📺';
      case 'podcast': return '🎙️';
      case 'news': return '📰';
      case 'reddit': return '💬';
      default: return '🔖';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-5xl font-bold mb-4">✨ Daily Digest</h1>
          <p className="text-xl text-indigo-100">Your personalized AI-powered news feed, delivered every morning</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Link href="/sources" className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="text-4xl mb-3">📚</div>
            <h3 className="text-xl font-bold mb-2">Manage Sources</h3>
            <p className="text-gray-600">Add YouTube, podcasts, news, and more</p>
          </Link>

          <Link href="/settings" className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="text-4xl mb-3">⚙️</div>
            <h3 className="text-xl font-bold mb-2">Settings</h3>
            <p className="text-gray-600">Configure email and delivery time</p>
          </Link>

          <button
            onClick={handleSendTest}
            disabled={sending}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed text-left"
          >
            <div className="text-4xl mb-3">📧</div>
            <h3 className="text-xl font-bold mb-2">
              {sending ? 'Sending...' : 'Send Test Email'}
            </h3>
            <p className="text-indigo-100">Get your digest right now</p>
          </button>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mb-8 p-4 rounded-lg ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
          </div>
        )}

        {/* Current Sources */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Your Sources ({sources.length})</h2>
            <button
              onClick={handlePreview}
              disabled={generating}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {generating ? 'Generating...' : 'Preview Digest'}
            </button>
          </div>

          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : sources.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-gray-600 mb-4">No sources added yet</p>
              <Link href="/sources" className="text-indigo-600 hover:underline">
                Add your first source →
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {sources.map(source => (
                <div
                  key={source.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{getSourceTypeEmoji(source.type)}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{source.name}</h3>
                      <p className="text-sm text-gray-500 capitalize">{source.type}</p>
                      <p className="text-xs text-gray-400 truncate mt-1">{source.url}</p>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs ${source.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {source.enabled ? 'Active' : 'Disabled'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-4">How it works</h2>
          <div className="space-y-3 text-gray-700">
            <p><span className="font-semibold">1.</span> Add your favorite sources (YouTube, podcasts, news, Reddit, etc.)</p>
            <p><span className="font-semibold">2.</span> Set your email and preferred delivery time</p>
            <p><span className="font-semibold">3.</span> Get a beautifully formatted digest every morning at 8 AM</p>
            <p><span className="font-semibold">4.</span> Each item is AI-summarized to save you hours of reading</p>
          </div>
        </div>
      </div>
    </div>
  );
}
