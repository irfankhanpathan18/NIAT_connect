import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Bookmark,
  Share2,
  ExternalLink,
  BookOpen,
  Search,
  Check,
  Calendar,
  Layers,
  ArrowRight,
  Cpu
} from 'lucide-react';
import { API_BASE_URL } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { AIFactItem } from '../../types';

export const AIFactsPage: React.FC = () => {
  const { token } = useAuth();
  const [featuredFact, setFeaturedFact] = useState<AIFactItem | null>(null);
  const [facts, setFacts] = useState<AIFactItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [bookmarkedOnly, setBookmarkedOnly] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    fetchTodayFact();
    fetchArchive();
  }, [token]);

  const fetchTodayFact = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/student/ai-facts/today`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFeaturedFact(data.fact || null);
        if (data.categories) setCategories(['All', ...data.categories]);
      }
    } catch (err) {
      console.error('Failed to load today fact:', err);
    }
  };

  const fetchArchive = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== 'All') params.append('category', selectedCategory);
      if (searchQuery) params.append('search', searchQuery);
      if (bookmarkedOnly) params.append('bookmarkedOnly', 'true');

      const res = await fetch(`${API_BASE_URL}/student/ai-facts?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFacts(data.facts || []);
      }
    } catch (err) {
      console.error('Failed to load facts archive:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchive();
  }, [selectedCategory, bookmarkedOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchArchive();
  };

  const handleToggleBookmark = async (factId: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/student/ai-facts/${factId}/bookmark`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Update local state
        setFacts(prev =>
          prev.map(f => (f.id === factId ? { ...f, is_bookmarked: data.bookmarked ? 1 : 0 } : f))
        );
        if (featuredFact && featuredFact.id === factId) {
          setFeaturedFact(prev => prev ? { ...prev, is_bookmarked: data.bookmarked ? 1 : 0 } : null);
        }
      }
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
    }
  };

  const handleShare = (fact: AIFactItem) => {
    const text = `Did you know? "${fact.title}" - ${fact.explanation} Learn AI daily on NIAT Connect: ${window.location.href}`;
    if (navigator.share) {
      navigator.share({
        title: fact.title,
        text,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      setCopiedId(fact.id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Curated Daily Technical Intel</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            AI Facts – Daily Dose of AI
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Expand your understanding of neural networks, robotics, deep learning, and exponential tech every day.
          </p>
        </div>

        <button
          onClick={() => setBookmarkedOnly(!bookmarkedOnly)}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 self-start md:self-auto border ${
            bookmarkedOnly
              ? 'bg-blue-600 text-white border-blue-600 shadow-md'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Bookmark className={`w-4 h-4 ${bookmarkedOnly ? 'fill-white' : ''}`} />
          <span>{bookmarkedOnly ? 'Showing Bookmarked' : 'View Saved Bookmarks'}</span>
        </button>
      </div>

      {/* Hero Featured Fact of the Day */}
      {featuredFact && !bookmarkedOnly && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-6 md:p-9 shadow-xl border border-slate-800">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-bold tracking-wide flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  Featured Fact of the Day
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[11px] font-mono">
                  {featuredFact.fact_date}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-semibold">
                  {featuredFact.category}
                </span>
              </div>

              <h2 className="text-xl md:text-3xl font-bold leading-tight tracking-tight">
                {featuredFact.title}
              </h2>

              <p className="text-sm md:text-base text-slate-300 leading-relaxed">
                {featuredFact.explanation}
              </p>

              {/* Real World Example Box */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5" />
                  Real-World Implementation
                </span>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {featuredFact.interesting_example}
                </p>
              </div>

              {/* Source & Actions */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-white/10">
                {featuredFact.source_link && (
                  <a
                    href={featuredFact.source_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-blue-300 hover:text-white transition-colors"
                  >
                    <span>Source: {featuredFact.source_title || 'ArXiv Research Paper'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleBookmark(featuredFact.id)}
                    className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all flex items-center gap-1.5 text-xs font-semibold"
                    title="Bookmark Fact"
                  >
                    <Bookmark
                      className={`w-4 h-4 ${featuredFact.is_bookmarked ? 'fill-amber-400 text-amber-400' : ''}`}
                    />
                    <span>{featuredFact.is_bookmarked ? 'Saved' : 'Save'}</span>
                  </button>

                  <button
                    onClick={() => handleShare(featuredFact)}
                    className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all flex items-center gap-1.5 text-xs font-semibold shadow-md"
                    title="Share Fact"
                  >
                    {copiedId === featuredFact.id ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                    <span>{copiedId === featuredFact.id ? 'Copied' : 'Share'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 h-64 md:h-80 rounded-2xl overflow-hidden border border-white/15 shadow-2xl relative">
              <img
                src={featuredFact.image_url || 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600'}
                alt={featuredFact.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
            </div>
          </div>
        </div>
      )}

      {/* Search and Category Filter Toolbar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search AI concepts or keywords..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </form>

          <span className="text-xs text-slate-500 self-start sm:self-auto">
            Showing {facts.length} verified technical facts
          </span>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Facts Card Grid */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : facts.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200/80 p-8 space-y-3">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">No Facts Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {bookmarkedOnly
              ? 'You have not bookmarked any facts yet. Click the bookmark icon on any card to save it.'
              : 'No articles matched your chosen filter or search query.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {facts.map(fact => (
            <div
              key={fact.id}
              className="bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between p-6 space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider">
                    {fact.category}
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>{fact.fact_date}</span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                  {fact.title}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {fact.explanation}
                </p>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-700 space-y-1">
                  <span className="font-bold text-slate-900 block text-[10px] uppercase text-blue-700">
                    Example
                  </span>
                  <p className="line-clamp-3">{fact.interesting_example}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                {fact.source_link ? (
                  <a
                    href={fact.source_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                  >
                    <span>Read Paper</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-slate-400">NIAT Curriculum</span>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleBookmark(fact.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 transition-colors"
                    title="Bookmark"
                  >
                    <Bookmark
                      className={`w-4 h-4 ${fact.is_bookmarked ? 'fill-amber-500 text-amber-500' : ''}`}
                    />
                  </button>

                  <button
                    onClick={() => handleShare(fact)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Share"
                  >
                    {copiedId === fact.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
