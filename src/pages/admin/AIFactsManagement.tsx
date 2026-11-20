import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  BookOpen,
  Calendar,
  ExternalLink,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Wand2,
  Bookmark,
  Check,
  Search
} from 'lucide-react';
import { API_BASE_URL } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { AIFactItem } from '../../types';

export const AIFactsManagement: React.FC = () => {
  const { token } = useAuth();
  const [facts, setFacts] = useState<AIFactItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Fact Modal
  const [showModal, setShowModal] = useState(false);
  const [editingFact, setEditingFact] = useState<AIFactItem | null>(null);
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [factForm, setFactForm] = useState({
    title: '',
    explanation: '',
    interesting_example: '',
    category: 'Generative AI',
    fact_date: new Date().toISOString().split('T')[0],
    source_title: 'ArXiv Deep Learning Research',
    source_link: 'https://arxiv.org',
    image_url: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600',
    is_published: 1
  });

  useEffect(() => {
    fetchFacts();
  }, [token]);

  const fetchFacts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/admin/ai-facts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFacts(data.facts || []);
        if (data.categories) setCategories(['All', ...data.categories]);
      }
    } catch (err) {
      console.error('Failed to load facts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingFact(null);
    setFactForm({
      title: '',
      explanation: '',
      interesting_example: '',
      category: 'Generative AI',
      fact_date: new Date().toISOString().split('T')[0],
      source_title: 'ArXiv Technical Paper',
      source_link: 'https://arxiv.org',
      image_url: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600',
      is_published: 1
    });
    setShowModal(true);
  };

  const handleOpenEdit = (f: AIFactItem) => {
    setEditingFact(f);
    setFactForm({
      title: f.title,
      explanation: f.explanation,
      interesting_example: f.interesting_example,
      category: f.category,
      fact_date: f.fact_date,
      source_title: f.source_title || '',
      source_link: f.source_link || '',
      image_url: f.image_url || '',
      is_published: f.is_published
    });
    setShowModal(true);
  };

  const handleGenerateAIDraft = async () => {
    try {
      setIsGeneratingDraft(true);
      const res = await fetch(`${API_BASE_URL}/admin/ai-facts/generate-draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ category: factForm.category })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.draft) {
          setFactForm(prev => ({
            ...prev,
            title: data.draft.title,
            explanation: data.draft.explanation,
            interesting_example: data.draft.interesting_example,
            source_title: data.draft.source_title,
            source_link: data.draft.source_link,
            image_url: data.draft.image_url,
            is_published: 0 // Draft requires admin verification
          }));
        }
      }
    } catch (err) {
      console.error('Failed to generate draft:', err);
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  const handleSaveFact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingFact
        ? `${API_BASE_URL}/admin/ai-facts/${editingFact.id}`
        : `${API_BASE_URL}/admin/ai-facts`;
      const method = editingFact ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(factForm)
      });

      if (res.ok) {
        setShowModal(false);
        fetchFacts();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save fact');
      }
    } catch (err: any) {
      alert('Error saving fact: ' + err.message);
    }
  };

  const handleTogglePublish = async (f: AIFactItem) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/ai-facts/${f.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ is_published: f.is_published === 1 ? 0 : 1 })
      });
      if (res.ok) fetchFacts();
    } catch (err) {
      console.error('Failed to toggle publish:', err);
    }
  };

  const handleDeleteFact = async (id: number) => {
    if (!window.confirm('Delete this AI fact permanently?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/ai-facts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchFacts();
    } catch (err) {
      console.error('Failed to delete fact:', err);
    }
  };

  const filteredFacts = facts.filter(f => {
    const matchCat = categoryFilter === 'All' || f.category === categoryFilter;
    const matchSearch = !searchQuery ||
      f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.explanation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>AI Knowledge Curation</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Daily AI Facts Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Author, verify, schedule, and curate daily emerging technology insights for student engagement.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition flex items-center gap-2 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create AI Fact</span>
        </button>
      </div>

      {/* Toolbar & Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search fact title, explanation, source..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {categories.slice(0, 7).map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                categoryFilter === cat
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Facts Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden p-6">
        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredFacts.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No AI facts found matching current search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Fact Title</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Scheduled Date</th>
                  <th className="py-3.5 px-4">Saves</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFacts.map(fact => (
                  <tr key={fact.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="font-bold text-slate-900 truncate">{fact.title}</div>
                      <div className="text-[11px] text-slate-400 truncate">{fact.explanation}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">
                        {fact.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {fact.fact_date}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      <span className="flex items-center gap-1">
                        <Bookmark className="w-3.5 h-3.5 text-slate-400" />
                        <span>{fact.bookmarks_count || 0}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleTogglePublish(fact)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition ${
                          fact.is_published === 1
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {fact.is_published === 1 ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        <span>{fact.is_published === 1 ? 'Published' : 'Draft'}</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(fact)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteFact(fact.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Fact Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {editingFact ? 'Edit AI Fact' : 'Author New AI Fact'}
              </h3>

              {!editingFact && (
                <button
                  type="button"
                  disabled={isGeneratingDraft}
                  onClick={handleGenerateAIDraft}
                  className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition flex items-center gap-1.5 border border-indigo-200"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>{isGeneratingDraft ? 'Generating Draft...' : 'AI Draft Generator'}</span>
                </button>
              )}
            </div>

            <form onSubmit={handleSaveFact} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Fact Title</label>
                <input
                  type="text"
                  required
                  value={factForm.title}
                  onChange={e => setFactForm({ ...factForm, title: e.target.value })}
                  placeholder="e.g. Mixture of Experts in Frontier LLMs"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Category</label>
                  <select
                    value={factForm.category}
                    onChange={e => setFactForm({ ...factForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                  >
                    {[
                      'Artificial Intelligence',
                      'Machine Learning',
                      'Deep Learning',
                      'Generative AI',
                      'Robotics',
                      'Data Science',
                      'Cybersecurity',
                      'Space Technology',
                      'Future Technology',
                      'Computer Science'
                    ].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Scheduled Date</label>
                  <input
                    type="date"
                    required
                    value={factForm.fact_date}
                    onChange={e => setFactForm({ ...factForm, fact_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Short Explanation</label>
                <textarea
                  rows={2}
                  required
                  value={factForm.explanation}
                  onChange={e => setFactForm({ ...factForm, explanation: e.target.value })}
                  placeholder="Core technical summary..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Interesting Real-World Example</label>
                <textarea
                  rows={2}
                  required
                  value={factForm.interesting_example}
                  onChange={e => setFactForm({ ...factForm, interesting_example: e.target.value })}
                  placeholder="How it applies in real industry systems..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Source Title</label>
                  <input
                    type="text"
                    value={factForm.source_title}
                    onChange={e => setFactForm({ ...factForm, source_title: e.target.value })}
                    placeholder="e.g. ArXiv / IEEE / MIT"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Source Link (URL)</label>
                  <input
                    type="url"
                    value={factForm.source_link}
                    onChange={e => setFactForm({ ...factForm, source_link: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={factForm.is_published === 1}
                    onChange={e => setFactForm({ ...factForm, is_published: e.target.checked ? 1 : 0 })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Publish immediately to student portal</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20"
                  >
                    Save Fact
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
