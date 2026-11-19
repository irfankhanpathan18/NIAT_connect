import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getApiUrl } from '../../config/api';
import { ChatMessage } from '../../types';
import { CHAT_LANGUAGES, CHAT_STRINGS, ChatLanguage, loadChatLanguage, saveChatLanguage } from '../../i18n/chat';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Trash2,
  PhoneCall,
  CheckCircle2,
  ExternalLink,
  HelpCircle,
  Bookmark,
  ShieldCheck,
  RefreshCw,
  X,
  Mic,
  MicOff,
  Languages,
  Wrench
} from 'lucide-react';

const PROVIDER_LABEL: Record<string, string> = {
  claude: 'Claude agent',
  gemini: 'Gemini agent',
  offline: 'Offline agent'
};

// Minimal typing for the browser Web Speech API (not in lib.dom for all targets)
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export const AIChatbot: React.FC = () => {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [showCounsellingModal, setShowCounsellingModal] = useState(false);
  const [counsellingSuccess, setCounsellingSuccess] = useState(false);
  const [language, setLanguage] = useState<ChatLanguage>(loadChatLanguage);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const ui = CHAT_STRINGS[language];

  const introMessage = (): ChatMessage => ({
    sender: 'assistant',
    message: ui.intro.replace('{name}', user?.name ? ` ${user.name}` : '')
  });

  const changeLanguage = (lang: ChatLanguage) => {
    setLanguage(lang);
    saveChatLanguage(lang);
    // Refresh the greeting if the conversation has not started yet
    setMessages(prev => (prev.length <= 1 && prev.every(m => m.sender === 'assistant'))
      ? [{ sender: 'assistant', message: CHAT_STRINGS[lang].intro.replace('{name}', user?.name ? ` ${user.name}` : '') }]
      : prev);
  };

  const toggleVoiceInput = () => {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const Recognition = getSpeechRecognition();
    if (!Recognition) {
      alert(ui.voiceUnsupported);
      return;
    }
    const recognition = new Recognition();
    recognition.lang = CHAT_LANGUAGES.find(l => l.code === language)?.speech || 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = e => {
      const transcript = e.results[0]?.[0]?.transcript || '';
      if (transcript) setInput(prev => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  };

  const fetchHistory = async () => {
    if (!token) return;
    try {
      const res = await fetch(getApiUrl('/api/student/chat/history'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.conversation) {
          setConversationId(data.conversation.id);
        }
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages);
        } else {
          setMessages([introMessage()]);
        }
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    setInput('');
    const userMsg: ChatMessage = { sender: 'user', message: text };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch(getApiUrl('/api/student/chat'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: text, conversationId, language })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.conversationId && !conversationId) {
          setConversationId(data.conversationId);
        }
        setMessages(prev => [
          ...prev,
          {
            sender: 'assistant',
            message: data.reply,
            sources: data.sources || [],
            suggestCounselling: data.suggestCounselling,
            toolCalls: data.toolCalls || [],
            provider: data.provider
          }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            sender: 'assistant',
            message: data.error || ui.errorQuery,
            sources: []
          }
        ]);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          message: ui.errorNetwork,
          sources: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (!window.confirm('Clear your conversation history?')) return;
    try {
      await fetch(getApiUrl('/api/student/chat/clear'), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversationId(null);
      setMessages([{ sender: 'assistant', message: ui.cleared }]);
    } catch (err) {
      alert('Error clearing chat: ' + err);
    }
  };

  const handleQuickCounsellingRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(getApiUrl('/api/student/counselling/request'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          preferredTime: 'Weekday Evening (5 PM - 7 PM)',
          topic: '1-on-1 Guidance requested via NIAT AI Chatbot'
        })
      });
      if (res.ok) {
        setCounsellingSuccess(true);
        setTimeout(() => {
          setShowCounsellingModal(false);
          setCounsellingSuccess(false);
        }, 2500);
      }
    } catch (err) {
      alert('Error booking counselling: ' + err);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 max-w-5xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white shadow-md shadow-blue-600/30">
            <Sparkles className="h-5 w-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900">{ui.title}</h1>
              <span className="rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 border border-emerald-200">
                {ui.badge}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {ui.subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700" title="Language">
            <Languages className="h-3.5 w-3.5 text-blue-600" />
            <select
              value={language}
              onChange={e => changeLanguage(e.target.value as ChatLanguage)}
              className="bg-transparent text-xs font-semibold focus:outline-none"
              aria-label="Chat language"
            >
              {CHAT_LANGUAGES.map(l => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </label>
          <button
            onClick={() => setShowCounsellingModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 px-3 py-1.5 text-xs font-semibold transition"
          >
            <PhoneCall className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{ui.connect}</span>
          </button>
          <button
            onClick={handleClearChat}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
            title="Clear Chat History"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Suggested Prompt Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 flex-shrink-0 no-scrollbar">
        {ui.suggestions.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(p)}
            className="whitespace-nowrap rounded-full bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 px-3 py-1 text-xs text-slate-700 font-medium transition shadow-sm"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto rounded-3xl border border-slate-200 bg-slate-50/60 p-4 sm:p-6 space-y-4">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.sender === 'assistant' && (
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white shadow-sm mt-0.5">
                <Bot className="h-4 w-4" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-3xl p-4 shadow-sm text-xs leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
              }`}
            >
              <div className="whitespace-pre-line space-y-2">
                {m.message}
              </div>

              {/* Agent actions (tool calls) */}
              {m.toolCalls && m.toolCalls.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-[10px]">
                  <span className="font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Wrench className="h-3 w-3 text-indigo-600" />
                    {ui.actionsTaken}:
                  </span>
                  {m.toolCalls.map((c, i) => (
                    <span
                      key={i}
                      className={`rounded-md border px-2 py-0.5 font-semibold ${
                        !c.ok
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : c.isAction
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                      }`}
                    >
                      {c.ok ? (c.isAction ? '✅ ' : '🔎 ') : '⚠️ '}{c.label}
                    </span>
                  ))}
                </div>
              )}

              {/* Verified Sources Citation Pill */}
              {m.sources && m.sources.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-2 text-[10px]">
                  <span className="font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Bookmark className="h-3 w-3 text-blue-600" />
                    {ui.verifiedRef}
                  </span>
                  {m.sources.map((s, i) => (
                    <span
                      key={i}
                      className="rounded-md bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 font-semibold"
                    >
                      {s.reference || s.title}
                    </span>
                  ))}
                </div>
              )}

              {/* Suggest Human Counselling Button */}
              {m.suggestCounselling && (
                <div className="mt-3 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setShowCounsellingModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 text-white font-bold px-3 py-1.5 text-xs shadow-sm hover:bg-blue-700 transition"
                  >
                    <PhoneCall className="h-3.5 w-3.5" />
                    {ui.connectHuman}
                  </button>
                </div>
              )}

              {m.sender === 'assistant' && m.provider && PROVIDER_LABEL[m.provider] && (
                <p className="mt-2 text-[9px] text-slate-400 font-medium">{PROVIDER_LABEL[m.provider]}</p>
              )}
            </div>

            {m.sender === 'user' && (
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm mt-0.5 font-bold text-xs">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white animate-pulse">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-3xl rounded-bl-none bg-white p-4 border border-slate-200 text-xs text-slate-500 italic shadow-sm flex items-center gap-2">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-600" />
              {ui.thinking}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Bar */}
      <form
        onSubmit={e => { e.preventDefault(); handleSendMessage(); }}
        className="flex items-center gap-2 bg-white rounded-2xl border border-slate-300 p-2 shadow-sm flex-shrink-0 focus-within:ring-2 focus-within:ring-blue-600/30 focus-within:border-blue-600"
      >
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={listening ? ui.listening : ui.placeholder}
          lang={language}
          className="flex-1 bg-transparent px-3 py-2 text-xs text-slate-900 focus:outline-none"
        />
        <button
          type="button"
          onClick={toggleVoiceInput}
          title={listening ? ui.listening : 'Voice input'}
          aria-label="Voice input"
          className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
            listening ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </button>
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-700 disabled:opacity-40 shadow-sm"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>

      {/* Human Counselling Modal */}
      {showCounsellingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <PhoneCall className="h-5 w-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Connect with an Admission Officer</h3>
              </div>
              <button onClick={() => setShowCounsellingModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            {counsellingSuccess ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
                <h4 className="text-sm font-bold text-slate-900">Request Confirmed!</h4>
                <p className="text-xs text-slate-500">
                  An authorized NIAT Admission Counsellor will reach out to you via your registered mobile or email within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleQuickCounsellingRequest} className="space-y-4 text-xs">
                <p className="text-slate-600">
                  Prefer human guidance? Our senior faculty advisors will review your Class 12 background and schedule a one-on-one session.
                </p>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
                  <p className="font-semibold text-blue-900">Candidate: {user?.name}</p>
                  <p className="text-[11px] text-blue-700">Email: {user?.email}</p>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCounsellingModal(false)}
                    className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white shadow-md hover:bg-blue-700"
                  >
                    Confirm Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
