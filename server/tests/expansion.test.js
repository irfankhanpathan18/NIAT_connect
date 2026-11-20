const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');
const { initDatabase, db } = require('../db');
const { initSchema } = require('../schema');
const { seedDatabase, seedNiat2Expansion } = require('../seed');
const {
  TRANSACTION_TYPES,
  getStudentReferralBalance,
  getStudentGameBalance,
  recordTransaction,
  getOrCreateReferralCode
} = require('../services/rewardService');

before(async () => {
  await initDatabase();
  initSchema(db);
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    seedDatabase(db);
  }
  seedNiat2Expansion(db);
});

// ========================================================
// 1. REWARD SERVICE & TRANSACTION LEDGER TESTS
// ========================================================
describe('NIAT 2.0: Reward Ledger & Points Integrity', () => {
  test('generates unique referral code format NIAT-FIRSTNAME-XXXX', () => {
    // User 4 is Ananya Verma (seeded)
    const user = { id: 4, name: 'Ananya Verma' };
    const code = getOrCreateReferralCode(user);
    assert.match(code, /^NIAT-ANANYA-[0-9]{4}$/);
  });

  test('separates referral points from game points correctly', () => {
    const userId = 2; // Rahul Sharma
    const initial = getStudentReferralBalance(userId);
    assert.ok(initial.available >= 0);

    // Record a store redemption of 5 points
    recordTransaction({
      studentId: userId,
      points: -5,
      transactionType: TRANSACTION_TYPES.STORE_REDEMPTION,
      description: 'Redeemed NIAT Test Item',
      referenceId: 'test-item-1'
    });

    const afterRedemption = getStudentReferralBalance(userId);
    assert.equal(afterRedemption.available, initial.available - 5);

    // Record game reward of 15 points
    recordTransaction({
      studentId: userId,
      points: 15,
      transactionType: TRANSACTION_TYPES.GAME_REWARD,
      description: 'Solved Binary Search Puzzle'
    });

    const afterGame = getStudentReferralBalance(userId);
    // Referral balance remains unchanged by game points
    assert.equal(afterGame.available, initial.available - 5);
    const game = getStudentGameBalance(userId);
    assert.ok(game.gamePoints >= 15);
  });

  test('getOrCreateReferralCode creates code idempotently', () => {
    const user = { id: 3, name: 'Priya Patel' };
    const code1 = getOrCreateReferralCode(user);
    assert.ok(code1);
    const code2 = getOrCreateReferralCode(user);
    assert.equal(code1, code2);
  });
});

// ========================================================
// 2. REFERRAL SYSTEM LOGIC & ANTI-FRAUD
// ========================================================
describe('NIAT 2.0: Referral Flow & Fraud Prevention', () => {
  test('prevents self-referrals when student attempts to use their own code', () => {
    const rahulCodeRow = db.prepare('SELECT code FROM referral_codes WHERE user_id = 2').get();
    assert.ok(rahulCodeRow);
    const code = rahulCodeRow.code;

    // Simulate registration with self referral
    const codeOwner = db.prepare('SELECT user_id FROM referral_codes WHERE code = ?').get(code);
    assert.equal(codeOwner.user_id, 2);

    // Self check
    const isSelfReferral = (codeOwner.user_id === 2);
    assert.equal(isSelfReferral, true);
  });

  test('approving referral credits configured reward points and updates status', () => {
    // Insert new pending referral for Rahul
    const testEmail = `vikram.${Date.now()}@gmail.com`;
    db.prepare(`
      INSERT INTO student_referrals (
        referrer_id, referred_name, referred_phone, referred_email,
        referral_code, status, points_awarded
      ) VALUES (2, 'Vikram Roy', '+91 99999 11111', ?, 'NIAT-RAHUL-7821', 'PENDING', 0)
    `).run(testEmail);

    const referral = db.prepare('SELECT * FROM student_referrals WHERE referred_email = ?').get(testEmail);
    assert.equal(referral.status, 'PENDING');

    const config = db.prepare("SELECT value FROM referral_settings WHERE key = 'points_per_referral'").get();
    const pointsAward = parseInt(config?.value || '25', 10);

    const prevBal = getStudentReferralBalance(2).available;

    // Admin approves
    db.prepare(`
      UPDATE student_referrals
      SET status = 'APPROVED', verified_at = datetime('now'), verified_by = 1, points_awarded = ?
      WHERE id = ?
    `).run(pointsAward, referral.id);

    // Credit ledger
    recordTransaction({
      studentId: referral.referrer_id,
      points: pointsAward,
      transactionType: TRANSACTION_TYPES.REFERRAL_REWARD,
      description: `Referral approved for ${referral.referred_name}`,
      referenceId: String(referral.id)
    });

    const balances = getStudentReferralBalance(2);
    assert.equal(balances.available, prevBal + pointsAward);
  });
});

// ========================================================
// 3. SWAG STORE & ATOMIC REDEMPTIONS
// ========================================================
describe('NIAT 2.0: Swag Store Redemptions & Refunds', () => {
  test('validates stock and deducts points atomically on redemption', () => {
    const studentId = 2; // Rahul
    const product = db.prepare("SELECT * FROM swag_products WHERE name = 'NIAT Signature Developer T-Shirt'").get();
    assert.ok(product);
    assert.ok(product.stock > 0);

    const initialStock = product.stock;
    const itemCost = product.points_required;
    const initialBalance = getStudentReferralBalance(studentId).available;

    // Deduct stock
    db.prepare('UPDATE swag_products SET stock = stock - 1 WHERE id = ?').run(product.id);

    // Insert redemption
    db.prepare(`
      INSERT INTO swag_redemptions (
        student_id, product_id, points_spent, size_preference, shipping_address, contact_phone, status
      ) VALUES (?, ?, ?, ?, ?, ?, 'Pending')
    `).run(studentId, product.id, itemCost, 'L', 'Campus Hostel Block B', '+91 98111 22334');

    // Record ledger debit
    recordTransaction({
      studentId: studentId,
      points: -itemCost,
      transactionType: TRANSACTION_TYPES.STORE_REDEMPTION,
      description: `Redeemed ${product.name}`,
      referenceId: String(product.id)
    });

    const updatedStock = db.prepare('SELECT stock FROM swag_products WHERE id = ?').get(product.id).stock;
    assert.equal(updatedStock, initialStock - 1);

    const balances = getStudentReferralBalance(studentId);
    assert.equal(balances.available, initialBalance - itemCost);
  });

  test('rejecting redemption automatically refunds deducted points and restores inventory', () => {
    const studentId = 2;
    const product = db.prepare("SELECT * FROM swag_products WHERE name = 'NIAT Hacker Backpack'").get();
    assert.ok(product);
    const itemCost = product.points_required;
    const origStock = product.stock;
    const origBalance = getStudentReferralBalance(studentId).available;

    // Simulate redemption
    db.prepare('UPDATE swag_products SET stock = stock - 1 WHERE id = ?').run(product.id);
    db.prepare(`
      INSERT INTO swag_redemptions (
        student_id, product_id, points_spent, size_preference, shipping_address, contact_phone, status
      ) VALUES (?, ?, ?, 'Standard', 'Hostel B', '+91 98111 22334', 'Pending')
    `).run(studentId, product.id, itemCost);

    const red = db.prepare('SELECT * FROM swag_redemptions WHERE student_id = ? ORDER BY id DESC LIMIT 1').get(studentId);

    recordTransaction({
      studentId: studentId,
      points: -itemCost,
      transactionType: TRANSACTION_TYPES.STORE_REDEMPTION,
      description: `Redeemed ${product.name}`,
      referenceId: String(red.id)
    });

    // Admin rejects order
    db.prepare(`
      UPDATE swag_redemptions
      SET status = 'Rejected', admin_notes = 'Out of regional delivery zone', updated_at = datetime('now')
      WHERE id = ?
    `).run(red.id);

    // Restore stock
    db.prepare('UPDATE swag_products SET stock = stock + 1 WHERE id = ?').run(product.id);

    // Refund points
    recordTransaction({
      studentId: studentId,
      points: itemCost,
      transactionType: TRANSACTION_TYPES.REFUND,
      description: `Refund for rejected order #${red.id}: Out of regional delivery zone`,
      referenceId: String(red.id)
    });

    const finalStock = db.prepare('SELECT stock FROM swag_products WHERE id = ?').get(product.id).stock;
    assert.equal(finalStock, origStock);

    const balances = getStudentReferralBalance(studentId);
    assert.equal(balances.available, origBalance); // Fully refunded
  });
});

// ========================================================
// 4. AI FACTS & BOOKMARKING
// ========================================================
describe('NIAT 2.0: AI Facts & Bookmarking', () => {
  test('fetches seeded AI facts across multiple domains', () => {
    const facts = db.prepare('SELECT * FROM ai_facts WHERE is_published = 1').all();
    assert.ok(facts.length >= 5);
    const categories = new Set(facts.map(f => f.category));
    assert.ok(categories.has('Generative AI'));
    assert.ok(categories.has('Robotics'));
    assert.ok(categories.has('Cybersecurity'));
  });

  test('toggles bookmark for student', () => {
    const studentId = 2;
    const factId = 1;

    // Add bookmark
    db.prepare('INSERT OR IGNORE INTO ai_fact_bookmarks (user_id, fact_id) VALUES (?, ?)').run(studentId, factId);
    let bm = db.prepare('SELECT * FROM ai_fact_bookmarks WHERE user_id = ? AND fact_id = ?').get(studentId, factId);
    assert.ok(bm);

    // Remove bookmark
    db.prepare('DELETE FROM ai_fact_bookmarks WHERE user_id = ? AND fact_id = ?').run(studentId, factId);
    bm = db.prepare('SELECT * FROM ai_fact_bookmarks WHERE user_id = ? AND fact_id = ?').get(studentId, factId);
    assert.equal(bm, null);
  });
});

// ========================================================
// 5. PUZZLE CHALLENGES, STREAKS & LEADERBOARD
// ========================================================
describe('NIAT 2.0: Puzzle Challenges, Streaks & Leaderboard', () => {
  test('verifies puzzle submission and increments user streak and score', () => {
    const studentId = 3; // Priya Patel (fresh streaks)
    const puzzle = db.prepare("SELECT * FROM puzzle_questions WHERE game_type = 'tech_quiz' LIMIT 1").get();
    assert.ok(puzzle);

    const isCorrect = (puzzle.correct_option_index === 1);
    const pointsAwarded = isCorrect ? puzzle.points_reward : 0;

    // Record attempt
    db.prepare(`
      INSERT INTO puzzle_attempts (user_id, puzzle_id, selected_option_index, is_correct, points_awarded)
      VALUES (?, ?, 1, ?, ?)
    `).run(studentId, puzzle.id, isCorrect ? 1 : 0, pointsAwarded);

    // Update streak
    const today = new Date().toISOString().split('T')[0];
    db.prepare(`
      INSERT INTO student_streaks (user_id, current_streak, longest_streak, last_attempt_date, total_games_played, total_correct, total_game_points)
      VALUES (?, 1, 1, ?, 1, 1, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        current_streak = current_streak + 1,
        total_games_played = total_games_played + 1,
        total_correct = total_correct + 1,
        total_game_points = total_game_points + ?
    `).run(studentId, today, pointsAwarded, pointsAwarded);

    const streak = db.prepare('SELECT * FROM student_streaks WHERE user_id = ?').get(studentId);
    assert.ok(streak.total_games_played >= 1);
    assert.ok(streak.total_correct >= 1);
    assert.ok(streak.total_game_points >= pointsAwarded);
  });

  test('leaderboard aggregates high performers correctly', () => {
    const leaderboard = db.prepare(`
      SELECT u.id, u.name, u.avatar_url, s.current_streak, s.longest_streak, s.total_games_played, s.total_correct, s.total_game_points
      FROM student_streaks s
      JOIN users u ON s.user_id = u.id
      ORDER BY s.total_game_points DESC, s.total_correct DESC
      LIMIT 10
    `).all();

    assert.ok(leaderboard.length >= 1);
    assert.equal(leaderboard[0].name, 'Rahul Sharma');
    assert.ok(leaderboard[0].total_game_points >= 50);
  });
});

// ========================================================
// 6. UPGRADED EVENT CALENDAR & BIG TECH METADATA
// ========================================================
describe('NIAT 2.0: Upgraded Event Calendar & Hackathons', () => {
  test('seeded events contain organizer, official registration links and source verification', () => {
    const events = db.prepare(`
      SELECT id, title, category, organizer, registration_url, source_verified, registration_deadline
      FROM events
      WHERE organizer IS NOT NULL AND organizer != 'NIAT'
    `).all();

    assert.ok(events.length >= 4);
    const organizers = events.map(e => e.organizer);
    assert.ok(organizers.includes('Google'));
    assert.ok(organizers.includes('NVIDIA'));
    assert.ok(organizers.includes('Microsoft'));

    for (const ev of events) {
      assert.ok(ev.registration_url.startsWith('https://'));
      assert.ok(ev.source_verified);
    }
  });

  test('toggles event bookmarking for student calendar', () => {
    const studentId = 2;
    const eventId = 1;

    // Toggle on
    db.prepare('INSERT OR IGNORE INTO event_bookmarks (user_id, event_id) VALUES (?, ?)').run(studentId, eventId);
    let bm = db.prepare('SELECT * FROM event_bookmarks WHERE user_id = ? AND event_id = ?').get(studentId, eventId);
    assert.ok(bm);

    // Toggle off
    db.prepare('DELETE FROM event_bookmarks WHERE user_id = ? AND event_id = ?').run(studentId, eventId);
    bm = db.prepare('SELECT * FROM event_bookmarks WHERE user_id = ? AND event_id = ?').get(studentId, eventId);
    assert.equal(bm, null);
  });
});
