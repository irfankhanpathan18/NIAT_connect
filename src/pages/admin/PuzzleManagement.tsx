import React, { useState, useEffect } from 'react';
import {
  Brain,
  Plus,
  Code,
  Calculator,
  Compass,
  Cpu,
  Edit2,
  Trash2,
  CheckCircle2,
  Users,
  Trophy,
  Zap,
  Search,
  Sparkles
} from 'lucide-react';
import { API_BASE_URL } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { PuzzleQuestionItem, PuzzleGameType } from '../../types';

export const PuzzleManagement: React.FC = () => {
  const { token } = useAuth();
  const [puzzles, setPuzzles] = useState<PuzzleQuestionItem[]>([]);
  const [analytics, setAnalytics] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Question Modal
  const [showModal, setShowModal] = useState(false);
  const [editingPuzzle, setEditingPuzzle] = useState<PuzzleQuestionItem | null>(null);
  const [form, setForm] = useState({
    game_type: 'brain_teaser' as PuzzleGameType,
    title: '',
    question_text: '',
    code_snippet: '',
    options: ['', '', '', ''],
    correct_option_index: 0,
    explanation: '',
    difficulty: 'Medium' as 'Easy' | 'Medium' | 'Hard',
    points_reward: 10,
    is_daily_challenge: 0,
    challenge_date: new Date().toISOString().split('T')[0],
    is_published: 1
  });

  useEffect(() => {
    fetchPuzzles();
  }, [token]);

  const fetchPuzzles = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/admin/puzzles`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPuzzles(data.puzzles || []);
        if (data.analytics) setAnalytics(data.analytics);
      }
    } catch (err) {
      console.error('Failed to load puzzles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingPuzzle(null);
    setForm({
      game_type: 'brain_teaser',
      title: '',
      question_text: '',
      code_snippet: '',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correct_option_index: 0,
      explanation: 'Official NIAT logic deduction and verification.',
      difficulty: 'Medium',
      points_reward: 10,
      is_daily_challenge: 0,
      challenge_date: new Date().toISOString().split('T')[0],
      is_published: 1
    });
    setShowModal(true);
  };

  const handleOpenEdit = (p: PuzzleQuestionItem) => {
    setEditingPuzzle(p);
    setForm({
      game_type: p.game_type,
      title: p.title,
      question_text: p.question_text,
      code_snippet: p.code_snippet || '',
      options: p.options && p.options.length ? p.options : ['A', 'B'],
      correct_option_index: p.correct_option_index || 0,
      explanation: p.explanation || '',
      difficulty: p.difficulty,
      points_reward: p.points_reward,
      is_daily_challenge: p.is_daily_challenge,
      challenge_date: p.challenge_date || new Date().toISOString().split('T')[0],
      is_published: p.is_published !== undefined ? p.is_published : 1
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingPuzzle
        ? `${API_BASE_URL}/admin/puzzles/${editingPuzzle.id}`
        : `${API_BASE_URL}/admin/puzzles`;
      const method = editingPuzzle ? 'PUT' : 'POST';

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
        fetchPuzzles();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save question');
      }
    } catch (err: any) {
      alert('Error saving puzzle: ' + err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this puzzle question?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/puzzles/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchPuzzles();
    } catch (err) {
      console.error('Delete puzzle failed:', err);
    }
  };

  const filteredPuzzles = puzzles.filter(p => {
    const matchType = typeFilter === 'all' || p.game_type === typeFilter;
    const matchSearch = !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.question_text.toLowerCase().includes(searchQuery.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-semibold mb-2">
            <Zap className="w-3.5 h-3.5 text-amber-600" />
            <span>Student Gamification & Algorithmic Arena</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Puzzle Games Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Author and publish daily brain teasers, programming prediction questions, and mathematical challenges.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition flex items-center gap-2 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Challenge Question</span>
        </button>
      </div>

      {/* Analytics KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 block">Total Challenges</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{puzzles.length}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-blue-600 block">Active Student Players</span>
          <div className="text-2xl font-bold text-blue-600 mt-1">{analytics.active_players || 0}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-indigo-600 block">Total Solutions Submitted</span>
          <div className="text-2xl font-bold text-indigo-600 mt-1">{analytics.total_attempts || 0}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-emerald-600 block">Game Points Awarded</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{analytics.total_points_given || 0} pts</div>
        </div>
      </div>

      {/* Search & Subcategory Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search puzzle questions, titles..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {[
            { id: 'all', label: 'All Puzzles' },
            { id: 'brain_teaser', label: 'Brain Teasers' },
            { id: 'coding_puzzle', label: 'Coding Puzzles' },
            { id: 'math_challenge', label: 'Math Challenges' },
            { id: 'logical_reasoning', label: 'Logical' },
            { id: 'tech_quiz', label: 'Tech Quiz' }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setTypeFilter(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                typeFilter === cat.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Puzzles List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden p-6">
        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredPuzzles.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No puzzle questions found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Challenge Title</th>
                  <th className="py-3.5 px-4">Game Type</th>
                  <th className="py-3.5 px-4">Difficulty</th>
                  <th className="py-3.5 px-4">Reward</th>
                  <th className="py-3.5 px-4">Student Attempts</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPuzzles.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="font-bold text-slate-900 truncate">{p.title}</div>
                      <div className="text-[11px] text-slate-400 truncate">{p.question_text}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider">
                        {p.game_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.difficulty === 'Easy'
                            ? 'bg-emerald-50 text-emerald-700'
                            : p.difficulty === 'Medium'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {p.difficulty}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-blue-600">
                      +{p.points_reward} pts
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {p.successful_attempts || 0} solved / {p.total_attempts || 0} total
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
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

      {/* Add / Edit Puzzle Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8">
            <h3 className="text-lg font-bold text-slate-900">
              {editingPuzzle ? 'Edit Challenge Question' : 'Create Challenge Question'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Game Type</label>
                  <select
                    value={form.game_type}
                    onChange={e => setForm({ ...form, game_type: e.target.value as PuzzleGameType })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                  >
                    <option value="brain_teaser">Daily Brain Teaser</option>
                    <option value="coding_puzzle">Coding Puzzle</option>
                    <option value="math_challenge">Mathematical Challenge</option>
                    <option value="logical_reasoning">Logical Reasoning</option>
                    <option value="tech_quiz">General Technology Quiz</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Difficulty</label>
                  <select
                    value={form.difficulty}
                    onChange={e => setForm({ ...form, difficulty: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                  >
                    <option value="Easy">Easy (10 pts)</option>
                    <option value="Medium">Medium (15 pts)</option>
                    <option value="Hard">Hard (20 pts)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Question Title</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. JavaScript Event Loop Priority"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Question Body / Prompt</label>
                <textarea
                  rows={2}
                  required
                  value={form.question_text}
                  onChange={e => setForm({ ...form, question_text: e.target.value })}
                  placeholder="Problem statement..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Optional Code Snippet</label>
                <textarea
                  rows={3}
                  value={form.code_snippet}
                  onChange={e => setForm({ ...form, code_snippet: e.target.value })}
                  placeholder="const x = 10; ..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs border border-slate-800 focus:outline-none"
                />
              </div>

              {/* Options & Correct Answer */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 block">
                  Multiple Choice Options & Select Correct (A-D)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {form.options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correct_answer"
                        checked={form.correct_option_index === idx}
                        onChange={() => setForm({ ...form, correct_option_index: idx })}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        required
                        value={opt}
                        onChange={e => {
                          const newOpts = [...form.options];
                          newOpts[idx] = e.target.value;
                          setForm({ ...form, options: newOpts });
                        }}
                        placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Solution Explanation</label>
                <textarea
                  rows={2}
                  required
                  value={form.explanation}
                  onChange={e => setForm({ ...form, explanation: e.target.value })}
                  placeholder="Detailed breakdown shown after submitting answer..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
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
                  Save Challenge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
