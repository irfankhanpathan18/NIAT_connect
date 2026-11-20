// ========================================================
// NIAT Connect 2.0 – Centralized Reward Points Ledger Service
// NextGen Institute of Advanced Technology
// ========================================================

const { db } = require('../db');

/**
 * Valid transaction types according to institutional ledger rules
 */
const TRANSACTION_TYPES = {
  REFERRAL_REWARD: 'Referral Reward',
  GAME_REWARD: 'Game Reward',
  STORE_REDEMPTION: 'Store Redemption',
  REFUND: 'Refund',
  ADMIN_ADJUSTMENT: 'Admin Adjustment'
};

/**
 * Retrieve referral points balance breakdown for a student
 * Only referral reward points (and associated store redemptions / refunds) apply to the Swag Store
 */
function getStudentReferralBalance(studentId) {
  // Total referral points earned
  const earnedRes = db.prepare(`
    SELECT COALESCE(SUM(points), 0) as total
    FROM reward_transactions
    WHERE student_id = ?
      AND status = 'COMPLETED'
      AND transaction_type = 'Referral Reward'
  `).get(studentId);
  const totalEarned = earnedRes ? Number(earnedRes.total) : 0;

  // Total points redeemed in Swag Store (stored as negative transactions).
  // Sum each row's absolute value, so a mis-signed entry still counts as spent and can never shrink the total.
  const redeemedRes = db.prepare(`
    SELECT COALESCE(SUM(ABS(points)), 0) as total
    FROM reward_transactions
    WHERE student_id = ?
      AND status = 'COMPLETED'
      AND transaction_type = 'Store Redemption'
  `).get(studentId);
  const totalRedeemed = redeemedRes ? Number(redeemedRes.total) : 0;

  // Refunds credited back
  const refundRes = db.prepare(`
    SELECT COALESCE(SUM(points), 0) as total
    FROM reward_transactions
    WHERE student_id = ?
      AND status = 'COMPLETED'
      AND transaction_type = 'Refund'
  `).get(studentId);
  const totalRefunded = refundRes ? Number(refundRes.total) : 0;

  // Admin adjustments
  const adjustmentRes = db.prepare(`
    SELECT COALESCE(SUM(points), 0) as total
    FROM reward_transactions
    WHERE student_id = ?
      AND status = 'COMPLETED'
      AND transaction_type = 'Admin Adjustment'
  `).get(studentId);
  const totalAdjustments = adjustmentRes ? Number(adjustmentRes.total) : 0;

  const available = totalEarned - totalRedeemed + totalRefunded + totalAdjustments;

  return {
    totalEarned,
    totalRedeemed,
    totalRefunded,
    totalAdjustments,
    available: Math.max(0, available)
  };
}

/**
 * Retrieve game points breakdown (earned from daily puzzles, brain teasers, memory games)
 */
function getStudentGameBalance(studentId) {
  const earnedRes = db.prepare(`
    SELECT COALESCE(SUM(points), 0) as total
    FROM reward_transactions
    WHERE student_id = ?
      AND status = 'COMPLETED'
      AND transaction_type = 'Game Reward'
  `).get(studentId);

  return {
    gamePoints: earnedRes ? Number(earnedRes.total) : 0
  };
}

/**
 * Record a secure immutable transaction in the reward ledger
 */
function recordTransaction({
  studentId,
  transactionType,
  points,
  description,
  referenceId = null,
  status = 'COMPLETED'
}) {
  if (!studentId || !transactionType || points === undefined || !description) {
    throw new Error('Invalid transaction payload: studentId, transactionType, points, and description are required');
  }

  const validTypes = Object.values(TRANSACTION_TYPES);
  if (!validTypes.includes(transactionType)) {
    throw new Error(`Invalid transaction type: ${transactionType}. Allowed: ${validTypes.join(', ')}`);
  }

  const stmt = db.prepare(`
    INSERT INTO reward_transactions (
      student_id, transaction_type, points, description, reference_id, status
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    studentId,
    transactionType,
    parseInt(points, 10),
    description,
    referenceId ? String(referenceId) : null,
    status
  );

  return {
    id: result.lastInsertRowid,
    studentId,
    transactionType,
    points,
    description,
    referenceId,
    status
  };
}

/**
 * Retrieve transaction history ledger for a student
 */
function getStudentLedger(studentId, limit = 50) {
  return db.prepare(`
    SELECT 
      id, student_id, transaction_type, points, description, reference_id, status, created_at
    FROM reward_transactions
    WHERE student_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `).all(studentId, limit);
}

/**
 * Ensure a student has a unique referral code. If not, generate one.
 */
function getOrCreateReferralCode(user) {
  let existing = db.prepare('SELECT code FROM referral_codes WHERE user_id = ?').get(user.id);
  if (existing) {
    return existing.code;
  }

  // Generate clean personalized referral code: NIAT-<FIRSTNAME>-<RANDOM>
  const cleanFirst = user.name
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 6) || 'STUDENT';
  const randSuffix = Math.floor(1000 + Math.random() * 9000);
  let code = `NIAT-${cleanFirst}-${randSuffix}`;

  // Check collision
  let collision = db.prepare('SELECT id FROM referral_codes WHERE code = ?').get(code);
  while (collision) {
    const extraRand = Math.floor(1000 + Math.random() * 9000);
    code = `NIAT-${cleanFirst}-${extraRand}`;
    collision = db.prepare('SELECT id FROM referral_codes WHERE code = ?').get(code);
  }

  db.prepare(`
    INSERT INTO referral_codes (user_id, code) VALUES (?, ?)
  `).run(user.id, code);

  return code;
}

module.exports = {
  TRANSACTION_TYPES,
  getStudentReferralBalance,
  getStudentGameBalance,
  recordTransaction,
  getStudentLedger,
  getOrCreateReferralCode
};
