import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getApiUrl } from '../../config/api';
import { KnowledgeDoc } from '../../types';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  Search,
  CheckCircle2,
  X,
  FileText,
  Tag,
  Bookmark
} from 'lucide-react';

export const KnowledgeBaseManager: React.FC = () => {
  const { token } = useAuth();
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<KnowledgeDoc | null>(null);
  const [form, setForm] = useState({
    title: '',
    category: 'General',
    content: '',
    tags: '',
    source_reference: 'NIAT Admissions Handbook 2026, Section 1.1',
    is_active: 1
  });

  const fetchDocs = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch(getApiUrl('/api/admin/knowledge-base'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDocs(data.documents || []);
      }
    } catch (err) {
      console.error('Failed to load KB documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [token]);

  const handleOpenAdd = () => {
    setEditingDoc(null);
    setForm({
      title: '',
      category: 'General',
      content: '',
      tags: '',
      source_reference: 'NIAT Admissions Handbook 2026, Section 1.1',
      is_active: 1
    });
    setShowModal(true);
  };

  const handleOpenEdit = (d: KnowledgeDoc) => {
    setEditingDoc(d);
    setForm({
      title: d.title,
      category: d.category,
      content: d.content,
      tags: d.tags || '',
      source_reference: d.source_reference,
      is_active: d.is_active
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this knowledge document from the AI RAG index?')) return;
    try {
      const res = await fetch(getApiUrl(`/api/admin/knowledge-base/${id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setDocs(prev => prev.filter(d => d.id !== id));
      }
    } catch (err) {
      alert('Delete error: ' + err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEdit = !!editingDoc;
      const url = isEdit ? getApiUrl(`/api/admin/knowledge-base/${editingDoc.id}`) : getApiUrl('/api/admin/knowledge-base');
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      if (res.ok) {
        setShowModal(false);
        setEditingDoc(null);
        fetchDocs();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save document');
      }
    } catch (err) {
      alert('Error: ' + err);
    }
  };

  const filteredDocs = docs.filter(d => {
    const matchesSearch =
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.content.toLowerCase().includes(search.toLowerCase()) ||
      (d.tags || '').toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === 'All' || d.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-blue-600" />
            Verified Knowledge Base (RAG Source)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Institutional documentation repository used by the NIAT AI Assistant to deliver grounded, hallucination-free answers with citations.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
        >
          <Plus className="h-4 w-4" /> Add Verified Document
        </button>
      </div>

      {/* Search & Category Filter */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search verified articles by keyword, syllabus topic, fee tag..."
            className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-9 pr-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-blue-600"
          />
        </div>

        <div className="w-full sm:w-60">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:bg-white"
          >
            <option value="All">All Categories</option>
            <option value="General">General & Institute Overview</option>
            <option value="Programs">Programs & Curriculum</option>
            <option value="Eligibility">Eligibility Criteria</option>
            <option value="Admissions">Admissions & NSAT Exam</option>
            <option value="Fees_Scholarships">Fees & Scholarships</option>
            <option value="Campus_Facilities">Campus & Facilities</option>
            <option value="Placements">Placements & Careers</option>
            <option value="FAQs">Parent & Student FAQs</option>
          </select>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 py-12 text-center text-xs text-slate-400">
            Indexing knowledge documents...
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="col-span-2 py-12 text-center text-xs text-slate-400 rounded-2xl border border-dashed border-slate-300 p-8">
            No knowledge base documents match your filter.
          </div>
        ) : (
          filteredDocs.map(doc => (
            <div
              key={doc.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                    {doc.category}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                    <Bookmark className="h-3 w-3 text-slate-400" />
                    {doc.source_reference}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mt-2.5">
                  {doc.title}
                </h3>
                <p className="text-xs text-slate-600 mt-2 whitespace-pre-line line-clamp-4 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {doc.content}
                </p>

                {doc.tags && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {doc.tags.split(',').map((t, i) => (
                      <span key={i} className="rounded-md bg-slate-100 text-slate-600 px-1.5 py-0.5 text-[9px] font-medium">
                        #{t.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Indexed in RAG Engine
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(doc)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-slate-100 transition"
                    title="Edit Document"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                    title="Delete Document"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Knowledge Document Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                {editingDoc ? 'Edit Verified Knowledge Document' : 'Add Verified Knowledge Document'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. 2026 B.Tech Fee Structure & EMI Options"
                  className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-slate-900 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Category *</label>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-slate-900 focus:bg-white"
                  >
                    <option value="General">General</option>
                    <option value="Programs">Programs</option>
                    <option value="Eligibility">Eligibility</option>
                    <option value="Admissions">Admissions</option>
                    <option value="Fees_Scholarships">Fees & Scholarships</option>
                    <option value="Campus_Facilities">Campus Facilities</option>
                    <option value="Placements">Placements</option>
                    <option value="FAQs">FAQs</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Source Reference *</label>
                  <input
                    type="text"
                    required
                    value={form.source_reference}
                    onChange={e => setForm({ ...form, source_reference: e.target.value })}
                    placeholder="e.g. NIAT Admissions Handbook 2026, Section 3.2"
                    className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Full Verified Content (Used for RAG Semantic Matching) *
                </label>
                <textarea
                  required
                  rows={6}
                  value={form.content}
                  onChange={e => setForm({ ...form, content: e.target.value })}
                  placeholder="Official factual text containing numbers, dates, curriculum topics, eligibility cut-offs..."
                  className="w-full rounded-xl bg-slate-50 border border-slate-300 p-2.5 text-slate-900 focus:bg-white leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Search Keywords / Tags (comma separated)</label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={e => setForm({ ...form, tags: e.target.value })}
                  placeholder="fees, hostel, payment, loan, scholarship"
                  className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-slate-900 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white shadow-md hover:bg-blue-700"
                >
                  {editingDoc ? 'Save Changes' : 'Index Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
