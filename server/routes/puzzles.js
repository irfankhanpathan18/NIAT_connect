// ========================================================
// NIAT Connect 2.0 – Puzzle Games & Gamification API
// NextGen Institute of Advanced Technology
// ========================================================

const express = require('express');
const { db } = require('../db');
const { verifyToken, requireStudent, requireAdmin } = require('../middleware/auth');
const {
  recordTransaction,
  getStudentGameBalance,
  TRANSACTION_TYPES
} = require('../services/rewardService');

const router = express.Router();

const GAME_TYPES = [
  { id: 'brain_teaser', label: 'Daily Brain Teaser', icon: 'Brain' },
  { id: 'coding_puzzle', label: 'Coding Puzzles', icon: 'Code' },
  { id: 'math_challenge', label: 'Mathematical Challenges', icon: 'Calculator' },
  { id: 'logical_reasoning', label: 'Logical Reasoning', icon: 'Compass' },
  { id: 'memory_game', label: 'Memory Match Arena', icon: 'Sparkles' },
  { id: 'tech_quiz', label: 'General Technology Quiz', icon: 'Cpu' }
];

/**
 * Check and evaluate streak for student based on today's date
 */
function updateStudentStreak(userId) {
  const today = new Date().toISOString().split('T')[0];
  let streak = db.prepare('SELECT * FROM student_streaks WHERE user_id = ?').get(userId);

  if (!streak) {
    db.prepare(`
      INSERT INTO student_streaks (user_id, current_streak, longest_streak, last_attempt_date, total_games_played, total_correct, total_game_points)
      VALUES (?, 1, 1, ?, 1, 1, 0)
    `).run(userId, today);
    return { current_streak: 1, longest_streak: 1 };
  }

  const lastDate = streak.last_attempt_date;
  let newCurrent = streak.current_streak;

  if (!lastDate) {
    newCurrent = 1;
  } else if (lastDate === today) {
    // Already played today, maintain streak
  } else {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (lastDate === yesterday) {
      newCurrent += 1;
    } else {
      // Streak broken
      newCurrent = 1;
    }
  }

  const newLongest = Math.max(streak.longest_streak, newCurrent);

  db.prepare(`
    UPDATE student_streaks SET
      current_streak = ?,
      longest_streak = ?,
      last_attempt_date = ?,
      total_games_played = total_games_played + 1,
      total_correct = total_correct + 1
    WHERE user_id = ?
  `).run(newCurrent, newLongest, today, userId);

  return { current_streak: newCurrent, longest_streak: newLongest };
}

// ==========================================
// STUDENT PUZZLE GAMES ENDPOINTS
// ==========================================

// GET /api/student/puzzles – List puzzles for student (HIDES correct answers for security!)
router.get('/student/puzzles', verifyToken, requireStudent, (req, res) => {
  const studentId = req.user.id;
  const { game_type } = req.query;

  try {
    let sql = `
      SELECT 
        pq.id,
        pq.game_type,
        pq.title,
        pq.question_text,
        pq.code_snippet,
        pq.options_json,
        pq.difficulty,
        pq.points_reward,
        pq.is_daily_challenge,
        pq.challenge_date,
        pa.id as attempt_id,
        pa.selected_option_index,
        pa.is_correct,
        pa.attempted_at,
        CASE WHEN pa.id IS NOT NULL THEN pq.correct_option_index ELSE NULL END as correct_option_index,
        CASE WHEN pa.id IS NOT NULL THEN pq.explanation ELSE NULL END as explanation
      FROM puzzle_questions pq
      LEFT JOIN puzzle_attempts pa ON pq.id = pa.puzzle_id AND pa.user_id = ?
      WHERE pq.is_published = 1
    `;
    const params = [studentId];

    if (game_type && game_type !== 'all') {
      sql += ' AND pq.game_type = ?';
      params.push(game_type);
    }

    sql += ' ORDER BY pq.is_daily_challenge DESC, pq.id ASC';

    const rawPuzzles = db.prepare(sql).all(...params);

    const puzzles = rawPuzzles.map(p => {
      let options = [];
      try {
        options = JSON.parse(p.options_json);
      } catch (e) {
        options = [];
      }
      return {
        ...p,
        options,
        is_attempted: p.attempt_id !== null
      };
    });

    // Daily Challenge
    const today = new Date().toISOString().split('T')[0];
    const dailyChallenge = puzzles.find(p => p.is_daily_challenge === 1 || p.challenge_date === today) || puzzles[0] || null;

    return res.json({
      puzzles,
      daily_challenge: dailyChallenge,
      game_types: GAME_TYPES
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load puzzles: ' + err.message });
  }
});

// POST /api/student/puzzles/:id/submit – Submit answer, verify, update streak & award points
router.post('/student/puzzles/:id/submit', verifyToken, requireStudent, (req, res) => {
  const studentId = req.user.id;
  const puzzleId = req.params.id;
  const { selected_option_index } = req.body;

  if (selected_option_index === undefined || isNaN(selected_option_index)) {
    return res.status(400).json({ error: 'Please choose an option to submit.' });
  }

  try {
    const puzzle = db.prepare('SELECT * FROM puzzle_questions WHERE id = ?').get(puzzleId);
    if (!puzzle || puzzle.is_published !== 1) {
      return res.status(404).json({ error: 'Puzzle question not found or not active.' });
    }

    // Check if previously attempted
    const prevAttempt = db.prepare('SELECT * FROM puzzle_attempts WHERE user_id = ? AND puzzle_id = ?').get(studentId, puzzleId);
    if (prevAttempt && prevAttempt.is_correct === 1) {
      return res.status(400).json({
        error: 'You have already solved this puzzle correctly! Try a different challenge or explore the memory arena.'
      });
    }

    const isCorrect = parseInt(selected_option_index, 10) === puzzle.correct_option_index ? 1 : 0;
    const pointsAwarded = isCorrect ? puzzle.points_reward : 0;

    // Record attempt
    db.prepare(`
      INSERT INTO puzzle_attempts (user_id, puzzle_id, selected_option_index, is_correct, points_awarded)
      VALUES (?, ?, ?, ?, ?)
    `).run(studentId, puzzleId, selected_option_index, isCorrect, pointsAwarded);

    let streakInfo = null;
    if (isCorrect) {
      streakInfo = updateStudentStreak(studentId);

      // Record in reward ledger under Game Reward category
      recordTransaction({
        studentId,
        transactionType: TRANSACTION_TYPES.GAME_REWARD,
        points: pointsAwarded,
        description: `Solved ${puzzle.difficulty} Puzzle: "${puzzle.title}"`,
        referenceId: `PUZZLE-${puzzleId}`,
        status: 'COMPLETED'
      });

      // Update student total game points in streak table
      db.prepare(`
        UPDATE student_streaks 
        SET total_game_points = total_game_points + ? 
        WHERE user_id = ?
      `).run(pointsAwarded, studentId);
    }

    const balance = getStudentGameBalance(studentId);

    return res.json({
      is_correct: isCorrect === 1,
      correct_option_index: puzzle.correct_option_index,
      explanation: puzzle.explanation,
      points_awarded: pointsAwarded,
      total_game_points: balance.gamePoints,
      streak: streakInfo
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to process answer: ' + err.message });
  }
});

// POST /api/student/puzzles/memory-game/complete – Complete memory match game
router.post('/student/puzzles/memory-game/complete', verifyToken, requireStudent, (req, res) => {
  const studentId = req.user.id;
  const { moves, timeInSeconds } = req.body;

  try {
    // Award 15 points for completing memory card match
    const points = 15;
    const streakInfo = updateStudentStreak(studentId);

    recordTransaction({
      studentId,
      transactionType: TRANSACTION_TYPES.GAME_REWARD,
      points,
      description: `Completed Memory Match Arena in ${moves || 12} moves (${timeInSeconds || 30}s)`,
      referenceId: `MEM-${Date.now()}`,
      status: 'COMPLETED'
    });

    db.prepare(`
      UPDATE student_streaks 
      SET total_game_points = total_game_points + ? 
      WHERE user_id = ?
    `).run(points, studentId);

    const balance = getStudentGameBalance(studentId);

    return res.json({
      message: 'Great job! Memory challenge completed.',
      points_awarded: points,
      total_game_points: balance.gamePoints,
      streak: streakInfo
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to save memory game score: ' + err.message });
  }
});

// GET /api/student/puzzles/my-stats – Personal puzzle performance & streaks
router.get('/student/puzzles/my-stats', verifyToken, requireStudent, (req, res) => {
  const studentId = req.user.id;

  try {
    let streak = db.prepare('SELECT * FROM student_streaks WHERE user_id = ?').get(studentId);
    if (!streak) {
      db.prepare(`
        INSERT INTO student_streaks (user_id, current_streak, longest_streak, total_games_played, total_correct, total_game_points)
        VALUES (?, 0, 0, 0, 0, 0)
      `).run(studentId);
      streak = { current_streak: 0, longest_streak: 0, total_games_played: 0, total_correct: 0, total_game_points: 0 };
    }

    const balance = getStudentGameBalance(studentId);

    // Dynamic Achievements
    const achievements = [
      {
        id: 'first_solve',
        title: 'First Step to Tech',
        description: 'Solve your first logic challenge',
        icon: 'Sparkles',
        unlocked: streak.total_correct >= 1
      },
      {
        id: 'streak_3',
        title: 'Streak Starter',
        description: 'Maintain a 3-day active challenge streak',
        icon: 'Flame',
        unlocked: streak.current_streak >= 3 || streak.longest_streak >= 3
      },
      {
        id: 'code_cracker',
        title: 'Code Cracker',
        description: 'Earn 30+ game reward points',
        icon: 'Code',
        unlocked: balance.gamePoints >= 30
      },
      {
        id: 'algorithm_ace',
        title: 'Algorithm Ace',
        description: 'Earn 100+ game reward points',
        icon: 'Trophy',
        unlocked: balance.gamePoints >= 100
      }
    ];

    return res.json({
      stats: {
        ...streak,
        game_points: balance.gamePoints
      },
      achievements
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load stats: ' + err.message });
  }
});

// GET /api/student/puzzles/leaderboard – Leaderboard rankings
router.get('/student/puzzles/leaderboard', verifyToken, requireStudent, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT 
        u.id as user_id,
        u.name,
        u.avatar_url,
        COALESCE(ss.current_streak, 0) as current_streak,
        COALESCE(ss.total_correct, 0) as total_solved,
        COALESCE(ss.total_game_points, 0) as game_points
      FROM users u
      LEFT JOIN student_streaks ss ON u.id = ss.user_id
      WHERE u.role = 'STUDENT'
      ORDER BY game_points DESC, total_solved DESC, current_streak DESC
      LIMIT 10
    `).all();

    const leaderboard = rows.map((r, index) => ({
      rank: index + 1,
      user_id: r.user_id,
      name: r.name,
      avatar_url: r.avatar_url,
      current_streak: r.current_streak,
      total_solved: r.total_solved,
      game_points: r.game_points,
      badge: index === 0 ? 'Grandmaster' : index < 3 ? 'Master' : 'Explorer'
    }));

    return res.json({ leaderboard });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load leaderboard: ' + err.message });
  }
});

// ==========================================
// ADMIN PUZZLE MANAGEMENT ENDPOINTS
// ==========================================

// GET /api/admin/puzzles – List all puzzles with full details for admin
router.get('/admin/puzzles', verifyToken, requireAdmin, (req, res) => {
  try {
    const puzzles = db.prepare(`
      SELECT 
        pq.*,
        (SELECT COUNT(*) FROM puzzle_attempts pa WHERE pa.puzzle_id = pq.id) as total_attempts,
        (SELECT COUNT(*) FROM puzzle_attempts pa WHERE pa.puzzle_id = pq.id AND pa.is_correct = 1) as successful_attempts
      FROM puzzle_questions pq
      ORDER BY pq.id ASC
    `).all();

    const formatted = puzzles.map(p => {
      let options = [];
      try {
        options = JSON.parse(p.options_json);
      } catch (e) {
        options = [];
      }
      return { ...p, options };
    });

    const stats = db.prepare(`
      SELECT 
        COUNT(DISTINCT user_id) as active_players,
        COUNT(*) as total_attempts,
        COALESCE(SUM(points_awarded), 0) as total_points_given
      FROM puzzle_attempts
    `).get();

    return res.json({
      puzzles: formatted,
      game_types: GAME_TYPES,
      analytics: stats
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load admin puzzles: ' + err.message });
  }
});

// POST /api/admin/puzzles – Create puzzle
router.post('/admin/puzzles', verifyToken, requireAdmin, (req, res) => {
  const {
    game_type, title, question_text, code_snippet,
    options, correct_option_index, explanation,
    difficulty, points_reward, is_daily_challenge, challenge_date, is_published
  } = req.body;

  if (!game_type || !title || !question_text || !Array.isArray(options) || options.length < 2 || correct_option_index === undefined) {
    return res.status(400).json({ error: 'All fields: game_type, title, question_text, options array (min 2), and correct_option_index are required.' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO puzzle_questions (
        game_type, title, question_text, code_snippet, options_json,
        correct_option_index, explanation, difficulty, points_reward,
        is_daily_challenge, challenge_date, is_published
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      game_type,
      title.trim(),
      question_text.trim(),
      code_snippet ? code_snippet.trim() : null,
      JSON.stringify(options),
      parseInt(correct_option_index, 10),
      explanation || 'Official NIAT solution explanation.',
      difficulty || 'Medium',
      points_reward ? parseInt(points_reward, 10) : 10,
      is_daily_challenge ? 1 : 0,
      challenge_date || null,
      is_published !== undefined ? (is_published ? 1 : 0) : 1
    );

    return res.status(201).json({
      message: 'Puzzle question added successfully',
      id: result.lastInsertRowid
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create puzzle: ' + err.message });
  }
});

// PUT /api/admin/puzzles/:id – Update puzzle
router.put('/admin/puzzles/:id', verifyToken, requireAdmin, (req, res) => {
  const puzzleId = req.params.id;
  const {
    game_type, title, question_text, code_snippet,
    options, correct_option_index, explanation,
    difficulty, points_reward, is_daily_challenge, challenge_date, is_published
  } = req.body;

  try {
    db.prepare(`
      UPDATE puzzle_questions SET
        game_type = COALESCE(?, game_type),
        title = COALESCE(?, title),
        question_text = COALESCE(?, question_text),
        code_snippet = COALESCE(?, code_snippet),
        options_json = COALESCE(?, options_json),
        correct_option_index = COALESCE(?, correct_option_index),
        explanation = COALESCE(?, explanation),
        difficulty = COALESCE(?, difficulty),
        points_reward = COALESCE(?, points_reward),
        is_daily_challenge = COALESCE(?, is_daily_challenge),
        challenge_date = COALESCE(?, challenge_date),
        is_published = COALESCE(?, is_published)
      WHERE id = ?
    `).run(
      game_type || null,
      title ? title.trim() : null,
      question_text ? question_text.trim() : null,
      code_snippet !== undefined ? code_snippet : null,
      options ? JSON.stringify(options) : null,
      correct_option_index !== undefined ? parseInt(correct_option_index, 10) : null,
      explanation || null,
      difficulty || null,
      points_reward ? parseInt(points_reward, 10) : null,
      is_daily_challenge !== undefined ? (is_daily_challenge ? 1 : 0) : null,
      challenge_date || null,
      is_published !== undefined ? (is_published ? 1 : 0) : null,
      puzzleId
    );

    return res.json({ message: 'Puzzle updated successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update puzzle: ' + err.message });
  }
});

// DELETE /api/admin/puzzles/:id – Delete puzzle
router.delete('/admin/puzzles/:id', verifyToken, requireAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM puzzle_questions WHERE id = ?').run(req.params.id);
    return res.json({ message: 'Puzzle deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete puzzle: ' + err.message });
  }
});

module.exports = router;
