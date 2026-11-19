import React, { useState } from 'react';
import { Sparkles, X, Send, Bot, User, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../config/api';

export const FloatingChatbot: React.FC = () => {
  const { isStudent, token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string; sources?: any[] }>>([
    {
      sender: 'assistant',
      text: 'Hi! I am the **NIAT AI Assistant**. Ask me anything about our 2026 B.Tech admissions, eligibility, scholarships, or campus facilities!'
    }
  ]);
  const [loading, setLoading] = useState(false);

  if (!isStudent) return null;

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    const query = input.trim();
    setInput('');
    setMessages(prev => [...prev, { sender: 'user', text: query }]);
    setLoading(true);

    try {
      const res = await fetch(getApiUrl('/api/student/chat'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: query })
      });
      const data = await res.json();
      if (res.ok) {
        setMessages(prev => [
          ...prev,
          { sender: 'assistant', text: data.reply, sources: data.sources }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          { sender: 'assistant', text: 'Sorry, I encountered an issue. Please try again or open the full assistant page.' }
        ]);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { sender: 'assistant', text: 'Network connection error. Please try again.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 px-4 py-3 text-white shadow-2xl shadow-blue-500/40 hover:scale-105 active:scale-95 transition-all"
        >
          <Sparkles className="h-5 w-5 text-amber-300 animate-spin-slow" />
          <span className="text-xs font-bold tracking-wide">NIAT AI Assistant</span>
        </button>
      )}

      {isOpen && (
        <div className="w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white shadow-2xl ring-1 ring-black/10 flex flex-col overflow-hidden h-[480px]">
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-slate-900 to-indigo-950 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold leading-tight">NIAT AI Assistant</h4>
                <p className="text-[10px] text-blue-300">Verified Admissions Knowledge RAG</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Link
                to="/student/ai-assistant"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-slate-300 hover:text-white hover:bg-white/10"
                title="Open Full Screen"
              >
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-slate-300 hover:text-white hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-slate-50 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'assistant' && (
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-white mt-0.5">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl p-2.5 shadow-sm leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-line">{m.text}</p>
                  {m.sources && m.sources.length > 0 && (
                    <div className="mt-2 border-t border-slate-100 pt-1.5 text-[10px] text-blue-600">
                      <span className="font-semibold">Source:</span> {m.sources[0]?.reference}
                    </div>
                  )}
                </div>
                {m.sender === 'user' && (
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-slate-800 text-white mt-0.5">
                    <User className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="rounded-2xl rounded-bl-none bg-white p-2.5 border border-slate-200 text-slate-500 italic">
                  Searching verified NIAT knowledge base...
                </div>
              </div>
            )}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} className="p-2 border-t border-slate-200 bg-white flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about courses, fees, dates..."
              className="flex-1 rounded-xl bg-slate-100 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
