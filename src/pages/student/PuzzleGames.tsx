import React, { useState, useEffect } from 'react';
import {
  Brain,
  Code,
  Calculator,
  Compass,
  Sparkles,
  Cpu,
  Flame,
  Trophy,
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  Check,
  Clock,
  Shield,
  Zap
} from 'lucide-react';
import { API_BASE_URL } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import {
  PuzzleQuestionItem,
  PuzzleGameType,
  StudentStreakStats,
  AchievementBadge,
  LeaderboardEntry
} from '../../types';

// Tech Memory Game card tokens
const MEMORY_CARDS = [
  { id: 1, name: 'Python', symbol: '🐍' },
  { id: 2, name: 'AI Model', symbol: '🤖' },
  { id: 3, name: 'Cloud', symbol: '☁️' },
  { id: 4, name: 'Database', symbol: '🗄️' },
  { id: 5, name: 'React', symbol: '⚛️' },
  { id: 6, name: 'Rocket', symbol: '🚀' }
];

export const PuzzleGames: React.FC = () => {
  const { token } = useAuth();
  const [puzzles, setPuzzles] = useState<PuzzleQuestionItem[]>([]);
  const [activeGameType, setActiveGameType] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'puzzles' | 'memory' | 'leaderboard'>('puzzles');
  const [stats, setStats] = useState<StudentStreakStats | null>(null);
  const [achievements, setAchievements] = useState<AchievementBadge[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Active Puzzle Submission State
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [submitResults, setSubmitResults] = useState<Record<number, any>>({});

  // Interactive Memory Game State
  const [cards, setCards] = useState<Array<{ id: number; instanceId: number; name: string; symbol: string; flipped: boolean; matched: boolean }>>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState<number>(0);
  const [memoryCompleted, setMemoryCompleted] = useState<boolean>(false);
  const [memoryRewardAwarded, setMemoryRewardAwarded] = useState<number | null>(null);

  useEffect(() => {
    fetchPuzzles();
    fetchStats();
    fetchLeaderboard();
  }, [token]);

  const fetchPuzzles = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/student/puzzles`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPuzzles(data.puzzles || []);
      }
    } catch (err) {
      console.error('Failed to load puzzles:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/student/puzzles/my-stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setAchievements(data.achievements || []);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/student/puzzles/leaderboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
      }
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    }
  };

  // Submit Answer for Multiple Choice Puzzle
  const handleSubmitAnswer = async (puzzleId: number) => {
    const selectedIdx = selectedAnswers[puzzleId];
    if (selectedIdx === undefined) return;

    try {
      setSubmittingId(puzzleId);
      const res = await fetch(`${API_BASE_URL}/student/puzzles/${puzzleId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ selected_option_index: selectedIdx })
      });

      const data = await res.json();

      if (res.ok) {
        setSubmitResults(prev => ({
          ...prev,
          [puzzleId]: data
        }));

        // Refresh stats
        fetchStats();
        fetchLeaderboard();
      } else {
        alert(data.error || 'Failed to submit response.');
      }
    } catch (err: any) {
      alert('Error submitting answer: ' + err.message);
    } finally {
      setSubmittingId(null);
    }
  };

  // ==========================================
  // MEMORY MATCH GAME LOGIC
  // ==========================================
  const startMemoryGame = () => {
    const deck = [...MEMORY_CARDS, ...MEMORY_CARDS]
      .sort(() => Math.random() - 0.5)
      .map((card, idx) => ({
        ...card,
        instanceId: idx,
        flipped: false,
        matched: false
      }));
    setCards(deck);
    setFlippedIndices([]);
    setMoves(0);
    setMemoryCompleted(false);
    setMemoryRewardAwarded(null);
  };

  useEffect(() => {
    if (activeTab === 'memory' && cards.length === 0) {
      startMemoryGame();
    }
  }, [activeTab]);

  const handleCardClick = (index: number) => {
    if (flippedIndices.length === 2 || cards[index].flipped || cards[index].matched) return;

    const newCards = [...cards];
    newCards[index].flipped = true;
    const newFlipped = [...flippedIndices, index];

    setCards(newCards);
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [firstIdx, secondIdx] = newFlipped;
      if (cards[firstIdx].id === cards[secondIdx].id) {
        // Matched!
        setTimeout(() => {
          setCards(prev => {
            const updated = [...prev];
            updated[firstIdx].matched = true;
            updated[secondIdx].matched = true;

            const allMatched = updated.every(c => c.matched);
            if (allMatched) {
              setMemoryCompleted(true);
              completeMemoryGame(moves + 1);
            }
            return updated;
          });
          setFlippedIndices([]);
        }, 500);
      } else {
        // Not matched, flip back
        setTimeout(() => {
          setCards(prev => {
            const updated = [...prev];
            updated[firstIdx].flipped = false;
            updated[secondIdx].flipped = false;
            return updated;
          });
          setFlippedIndices([]);
        }, 900);
      }
    }
  };

  const completeMemoryGame = async (finalMoves: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/student/puzzles/memory-game/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ moves: finalMoves, timeInSeconds: 30 })
      });
      if (res.ok) {
        const data = await res.json();
        setMemoryRewardAwarded(data.points_awarded);
        fetchStats();
        fetchLeaderboard();
      }
    } catch (err) {
      console.error('Failed to register memory game:', err);
    }
  };

  const gameTypeFilters = [
    { id: 'all', label: 'All Challenges', icon: Brain },
    { id: 'brain_teaser', label: 'Brain Teasers', icon: Sparkles },
    { id: 'coding_puzzle', label: 'Coding Puzzles', icon: Code },
    { id: 'math_challenge', label: 'Math Challenges', icon: Calculator },
    { id: 'logical_reasoning', label: 'Logical Deductions', icon: Compass },
    { id: 'tech_quiz', label: 'Tech Quiz', icon: Cpu }
  ];

  const filteredPuzzles = activeGameType === 'all'
    ? puzzles
    : puzzles.filter(p => p.game_type === activeGameType);

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header with Streak Flame */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-semibold mb-2">
            <Zap className="w-3.5 h-3.5 text-amber-600" />
            <span>Problem-Solving, Logic & Algorithmic Arena</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Puzzle Games & Brain Challenges
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Sharpen your mathematical, logical, and code analysis reasoning while earning game points and climbing the leaderboard.
          </p>
        </div>

        {/* Streak & Score Widget */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-200 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-500/30">
              <Flame className="w-5 h-5 fill-white" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                Daily Streak
              </span>
              <span className="text-base font-extrabold text-slate-900">
                {stats?.current_streak || 0} Days
              </span>
            </div>
          </div>

          <div className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-200 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 block">
                Game Points
              </span>
              <span className="text-base font-extrabold text-blue-700">
                {stats?.game_points || 0} pts
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Mode Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('puzzles')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'puzzles'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Brain className="w-3.5 h-3.5" />
          <span>Daily Challenges & Quizzes ({puzzles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('memory')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'memory'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Memory Match Arena</span>
        </button>

        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'leaderboard'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>Student Leaderboard & Badges</span>
        </button>
      </div>

      {/* TAB 1: PUZZLE CHALLENGES */}
      {activeTab === 'puzzles' && (
        <div className="space-y-6">
          {/* Subcategory Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {gameTypeFilters.map(filter => {
              const Icon = filter.icon;
              return (
                <button
                  key={filter.id}
                  onClick={() => setActiveGameType(filter.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    activeGameType === filter.id
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{filter.label}</span>
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="py-12 flex justify-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredPuzzles.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-3xl border border-slate-200 p-8">
              <p className="text-xs text-slate-400">No puzzles currently available in this category.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredPuzzles.map((puzzle, pIdx) => {
                const result = submitResults[puzzle.id];
                const isAttempted = puzzle.is_attempted || result !== undefined;
                const isCorrect = result ? result.is_correct : puzzle.is_correct === 1;
                const correctIdx = result ? result.correct_option_index : puzzle.correct_option_index;
                const explanation = result ? result.explanation : puzzle.explanation;
                const userChoice = selectedAnswers[puzzle.id] !== undefined
                  ? selectedAnswers[puzzle.id]
                  : puzzle.selected_option_index;

                return (
                  <div
                    key={puzzle.id}
                    className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 md:p-8 space-y-5"
                  >
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-xl bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                          #{pIdx + 1}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold uppercase tracking-wider">
                          {puzzle.game_type.replace('_', ' ')}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            puzzle.difficulty === 'Easy'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : puzzle.difficulty === 'Medium'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {puzzle.difficulty}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-xl">
                          +{puzzle.points_reward} Game Points
                        </span>
                        {isAttempted && (
                          <span
                            className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 ${
                              isCorrect
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                            <span>{isCorrect ? 'Solved Correctly' : 'Incorrect'}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Question Title & Text */}
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-slate-900">{puzzle.title}</h3>
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                        {puzzle.question_text}
                      </p>
                    </div>

                    {/* Optional Code Snippet */}
                    {puzzle.code_snippet && (
                      <div className="rounded-2xl bg-slate-900 text-slate-200 p-4 font-mono text-xs overflow-x-auto shadow-inner border border-slate-800">
                        <pre><code>{puzzle.code_snippet}</code></pre>
                      </div>
                    )}

                    {/* Multiple Choice Options */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      {puzzle.options.map((opt, oIdx) => {
                        const isSelected = userChoice === oIdx;
                        let optionStyle = 'bg-slate-50 border-slate-200 hover:bg-blue-50/50 hover:border-blue-200 text-slate-800';

                        if (isAttempted) {
                          if (oIdx === correctIdx) {
                            optionStyle = 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold';
                          } else if (isSelected && !isCorrect) {
                            optionStyle = 'bg-rose-50 border-rose-300 text-rose-900';
                          } else {
                            optionStyle = 'bg-slate-50 border-slate-200 opacity-60 text-slate-600';
                          }
                        } else if (isSelected) {
                          optionStyle = 'bg-blue-50 border-blue-500 text-blue-900 font-semibold ring-2 ring-blue-500/20';
                        }

                        return (
                          <button
                            key={oIdx}
                            disabled={isAttempted}
                            onClick={() => setSelectedAnswers(prev => ({ ...prev, [puzzle.id]: oIdx }))}
                            className={`p-3.5 rounded-2xl border text-left text-xs transition-all flex items-center justify-between ${optionStyle}`}
                          >
                            <span className="flex items-center gap-2.5">
                              <span className="w-5 h-5 rounded-lg bg-white border border-slate-300 flex items-center justify-center font-bold text-[10px] text-slate-600">
                                {String.fromCharCode(65 + oIdx)}
                              </span>
                              <span>{opt}</span>
                            </span>
                            {isAttempted && oIdx === correctIdx && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            )}
                            {isAttempted && isSelected && !isCorrect && (
                              <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Submit Button (if unattempted) */}
                    {!isAttempted && (
                      <div className="pt-2 flex justify-end">
                        <button
                          disabled={userChoice === undefined || submittingId === puzzle.id}
                          onClick={() => handleSubmitAnswer(puzzle.id)}
                          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                            userChoice === undefined
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30'
                          }`}
                        >
                          {submittingId === puzzle.id ? (
                            <span>Evaluating Answer...</span>
                          ) : (
                            <>
                              <span>Submit Solution</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Solution Explanation (Shown after answering) */}
                    {isAttempted && explanation && (
                      <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-1.5 animate-fade-in">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                          <HelpCircle className="w-4 h-4 text-blue-600" />
                          <span>Official Solution & Explanation</span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                          {explanation}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INTERACTIVE MEMORY MATCH GAME */}
      {activeTab === 'memory' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 block mb-1">
                Mini Game • Brain & Concentration
              </span>
              <h2 className="text-xl font-bold text-slate-900">Tech Memory Match Arena</h2>
              <p className="text-xs text-slate-500 mt-1">
                Flip the cards to match pairs of futuristic tech icons. Complete all 6 pairs to earn +15 Game Points!
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-4 py-2 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold font-mono">
                Moves: {moves}
              </div>
              <button
                onClick={startMemoryGame}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restart</span>
              </button>
            </div>
          </div>

          {memoryCompleted && (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Trophy className="w-5 h-5 text-emerald-600" />
                <div>
                  <div className="font-bold text-sm">Congratulations! All pairs matched!</div>
                  <div className="text-emerald-700">
                    Solved in {moves} moves. +{memoryRewardAwarded || 15} Game Points credited to your balance!
                  </div>
                </div>
              </div>
              <button
                onClick={startMemoryGame}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500"
              >
                Play Again
              </button>
            </div>
          )}

          {/* Cards Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3.5 max-w-3xl mx-auto py-4">
            {cards.map((card, idx) => (
              <button
                key={card.instanceId}
                onClick={() => handleCardClick(idx)}
                disabled={card.flipped || card.matched}
                className={`h-28 rounded-2xl text-2xl flex flex-col items-center justify-center gap-1.5 border transition-all duration-300 shadow-sm ${
                  card.matched
                    ? 'bg-emerald-500 text-white border-emerald-600 cursor-default scale-95 opacity-90'
                    : card.flipped
                    ? 'bg-blue-600 text-white border-blue-700 rotate-y-180 shadow-md'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:border-slate-700'
                }`}
              >
                {card.flipped || card.matched ? (
                  <>
                    <span className="text-3xl">{card.symbol}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider">{card.name}</span>
                  </>
                ) : (
                  <Brain className="w-6 h-6 text-slate-500" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: LEADERBOARD & BADGES */}
      {activeTab === 'leaderboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Leaderboard Table */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <span>Student Logic & Code Leaderboard</span>
              </h3>
              <span className="text-xs text-slate-400">Ranked by Game Points</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Solved</th>
                    <th className="py-3 px-4">Active Streak</th>
                    <th className="py-3 px-4">Total Game Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leaderboard.map(item => (
                    <tr key={item.user_id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-bold">
                        {item.rank === 1 ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-900 font-extrabold text-[11px]">
                            🥇 #1
                          </span>
                        ) : item.rank === 2 ? (
                          <span className="px-2 py-0.5 rounded-full bg-slate-300 text-slate-900 font-extrabold text-[11px]">
                            🥈 #2
                          </span>
                        ) : item.rank === 3 ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-600 text-white font-extrabold text-[11px]">
                            🥉 #3
                          </span>
                        ) : (
                          <span className="text-slate-500">#{item.rank}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800 flex items-center gap-2">
                        <img
                          src={item.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                          alt={item.name}
                          className="w-7 h-7 rounded-full object-cover border border-slate-200"
                        />
                        <span>{item.name}</span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-700">{item.total_solved}</td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 font-bold text-orange-600">
                          <Flame className="w-3.5 h-3.5 fill-orange-500" />
                          <span>{item.current_streak} days</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-blue-600">
                        {item.game_points} pts
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Achievement Badges Sidebar */}
          <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
              <Award className="w-5 h-5 text-indigo-600" />
              <span>Achievement Badges</span>
            </h3>

            <div className="space-y-3">
              {achievements.map(badge => (
                <div
                  key={badge.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center gap-3.5 ${
                    badge.unlocked
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
                      : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm ${
                      badge.unlocked
                        ? 'bg-blue-600 text-white shadow-blue-500/20'
                        : 'bg-slate-200 text-slate-400'
                    }`}
                  >
                    {badge.unlocked ? '✓' : '🔒'}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{badge.title}</h4>
                    <p className="text-[11px] text-slate-500">{badge.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
