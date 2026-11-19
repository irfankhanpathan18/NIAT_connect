import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getApiUrl } from '../../config/api';
import { KnowledgeDoc } from '../../types';
import {
  HelpCircle,
  Search,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Bookmark,
  ExternalLink,
  GraduationCap
} from 'lucide-react';

export const FAQAndGuidelines: React.FC = () => {
  const { token } = useAuth();
  const [faqs, setFaqs] = useState<KnowledgeDoc[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFaqs() {
      if (!token) return;
      try {
        setLoading(true);
        const res = await fetch(getApiUrl('/api/student/faqs'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setFaqs(data.faqs || []);
          if (data.faqs && data.faqs.length > 0) {
            setExpandedId(data.faqs[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load FAQs:', err);
      } finally {
        setLoading(false);
      }
    }
    loadFaqs();
  }, [token]);

  const toggleExpand = (id: number) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const filtered = faqs.filter(f => {
    const matchesSearch =
      f.title.toLowerCase().includes(search.toLowerCase()) ||
      f.content.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCat === 'All' || f.category === selectedCat;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-blue-600" />
          Official Admissions Handbook & Guidelines
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Verified academic bulletins, fee schedules, scholarship criteria, and applicant FAQs for the 2026-27 session.
        </p>
      </div>

      {/* Search & Category Filter */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search guidelines by keyword (e.g. fees, scholarships, eligibility, NSAT)..."
            className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-9 pr-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-blue-600"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['All', 'General', 'Programs', 'Eligibility', 'Admissions', 'Fees_Scholarships', 'Placements', 'FAQs'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCat === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.replace('_', ' & ')}
            </button>
          ))}
        </div>
      </div>

      {/* Accordion FAQ List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading verified handbook...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 rounded-2xl border border-slate-200 bg-white">
            No guidelines found matching your search.
          </div>
        ) : (
          filtered.map(item => {
            const isExpanded = expandedId === item.id;
            return (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden transition"
              >
                <button
                  onClick={() => toggleExpand(item.id)}
                  className="w-full p-4 text-left flex items-center justify-between gap-3 hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                      {item.category}
                    </span>
                    <h3 className="text-xs font-bold text-slate-900">{item.title}</h3>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-100 text-xs text-slate-600 leading-relaxed bg-slate-50/50">
                    <p className="whitespace-pre-line">{item.content}</p>

                    <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 font-medium text-slate-500">
                        <Bookmark className="h-3 w-3 text-blue-600" />
                        Source: {item.source_reference}
                      </span>
                      <span className="text-emerald-700 font-semibold">Verified NIAT Document</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
