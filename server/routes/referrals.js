// ========================================================
// NIAT Connect 2.0 – Student Referral & Rewards API
// NextGen Institute of Advanced Technology
// ========================================================

const express = require('express');
const { db } = require('../db');
const { verifyToken, requireStudent, requireAdmin } = require('../middleware/auth');
const {
  getStudentReferralBalance,
  recordTransaction,
  getOrCreateReferralCode,
  TRANSACTION_TYPES
} = require('../services/rewardService');

const router = express.Router();

/**
 * Mask student name for privacy: e.g. "Rahul Sharma" -> "Rahul S*****"
 */
function maskName(name) {
  if (!name) return 'Student';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2) + '***';
  }
  return parts[0] + ' ' + parts[parts.length - 1][0] + '***';
}

// ==========================================
// STUDENT REFERRAL DASHBOARD ENDPOINTS
// ==========================================

router.get('/student/referrals', verifyToken, requireStudent, (req, res) => {
  const studentId = req.user.id;

  try {
    const user = db.prepare('SELECT id, name, email, phone FROM users WHERE id = ?').get(studentId);
    if (!user) {
      return res.status(404).json({ error: 'Student account not found' });
    }

    const code = getOrCreateReferralCode(user);
    const balance = getStudentReferralBalance(studentId);

    // Referral Counts
    const counts = db.prepare(`
      SELECT 
        COUNT(*) as total,
        COALESCE(SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END), 0) as approved,
        COALESCE(SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END), 0) as pending,
        COALESCE(SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END), 0) as rejected
      FROM student_referrals
      WHERE referrer_id = ?
    `).get(studentId);

    // Configured reward points per referral
    const settingRow = db.prepare("SELECT value FROM referral_settings WHERE key = 'points_per_referral'").get();
    const pointsPerReferral = settingRow ? parseInt(settingRow.value, 10) : 25;

    // Referral History with privacy masking
    const rawReferrals = db.prepare(`
      SELECT 
        id, referral_code, referred_name, status, points_awarded, notes, rejection_reason, created_at, verified_at
      FROM student_referrals
      WHERE referrer_id = ?
      ORDER BY created_at DESC
    `).all(studentId);

    const history = rawReferrals.map(r => ({
      id: r.id,
      referral_code: r.referral_code,
      referred_name: maskName(r.referred_name),
      status: r.status,
      points_awarded: r.points_awarded,
      notes: r.notes,
      rejection_reason: r.rejection_reason,
      created_at: r.created_at,
      verified_at: r.verified_at
    }));

    // Reward ledger history
    const transactions = db.prepare(`
      SELECT id, transaction_type, points, description, reference_id, status, created_at
      FROM reward_transactions
      WHERE student_id = ?
      ORDER BY created_at DESC
      LIMIT 25
    `).all(studentId);

    return res.json({
      referral_code: code,
      points_per_referral: pointsPerReferral,
      stats: {
        total_referrals: counts ? counts.total : 0,
        successful_referrals: counts ? counts.approved : 0,
        pending_referrals: counts ? counts.pending : 0,
        rejected_referrals: counts ? counts.rejected : 0,
        total_points_earned: balance.totalEarned,
        available_points: balance.available,
        redeemed_points: balance.totalRedeemed
      },
      history,
      transactions
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve referral data: ' + err.message });
  }
});

// ==========================================
// ADMIN REFERRAL MANAGEMENT ENDPOINTS
// ==========================================

router.get('/admin/referrals', verifyToken, requireAdmin, (req, res) => {
  try {
    const referrals = db.prepare(`
      SELECT 
        sr.*,
        u.name as referrer_name,
        u.email as referrer_email,
        u.phone as referrer_phone,
        admin.name as verified_by_name
      FROM student_referrals sr
      JOIN users u ON sr.referrer_id = u.id
      LEFT JOIN users admin ON sr.verified_by = admin.id
      ORDER BY sr.created_at DESC
    `).all();

    // Summary Analytics
    const counts = db.prepare(`
      SELECT 
        COUNT(*) as total,
        COALESCE(SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END), 0) as approved,
        COALESCE(SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END), 0) as pending,
        COALESCE(SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END), 0) as rejected,
        COALESCE(SUM(points_awarded), 0) as points_distributed
      FROM student_referrals
    `).get();

    // Check suspicious activity: same email/phone referred multiple times or duplicate submissions
    const suspiciousRows = db.prepare(`
      SELECT referred_phone, COUNT(*) as cnt
      FROM student_referrals
      GROUP BY referred_phone
      HAVING cnt > 1
    `).all();

    const settingRow = db.prepare("SELECT value FROM referral_settings WHERE key = 'points_per_referral'").get();
    const pointsPerReferral = settingRow ? parseInt(settingRow.value, 10) : 25;

    return res.json({
      referrals,
      analytics: {
        total: counts.total,
        approved: counts.approved,
        pending: counts.pending,
        rejected: counts.rejected,
        points_distributed: counts.points_distributed,
        suspicious_count: suspiciousRows.length
      },
      points_per_referral: pointsPerReferral
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load admin referrals: ' + err.message });
  }
});

router.post('/admin/referrals/:id/approve', verifyToken, requireAdmin, (req, res) => {
  const referralId = req.params.id;
  const adminId = req.user.id;

  try {
    const referral = db.prepare('SELECT * FROM student_referrals WHERE id = ?').get(referralId);
    if (!referral) {
      return res.status(404).json({ error: 'Referral record not found' });
    }

    if (referral.status === 'APPROVED') {
      return res.status(400).json({ error: 'This referral has already been approved and credited.' });
    }

    // Configured reward points
    const settingRow = db.prepare("SELECT value FROM referral_settings WHERE key = 'points_per_referral'").get();
    const pointsToAward = req.body.points ? parseInt(req.body.points, 10) : (settingRow ? parseInt(settingRow.value, 10) : 25);

    // 1. Update referral status
    db.prepare(`
      UPDATE student_referrals SET
        status = 'APPROVED',
        points_awarded = ?,
        verified_by = ?,
        verified_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(pointsToAward, adminId, referralId);

    // 2. Insert into Reward Transactions Ledger
    recordTransaction({
      studentId: referral.referrer_id,
      transactionType: TRANSACTION_TYPES.REFERRAL_REWARD,
      points: pointsToAward,
      description: `Referral Reward for student lead: ${referral.referred_name}`,
      referenceId: `REF-${referralId}`,
      status: 'COMPLETED'
    });

    // 3. Send Notification to referring student
    db.prepare(`
      INSERT INTO notifications (user_id, target_role, title, message, type, link)
      VALUES (?, 'STUDENT', 'Referral Approved! 🎉', ?, 'ADMISSION', '/student/referrals')
    `).run(
      referral.referrer_id,
      `Great news! Your referral for ${referral.referred_name} has been verified by the NIAT Admissions Team. +${pointsToAward} Reward Points have been added to your balance!`
    );

    return res.json({
      message: `Referral #${referralId} approved successfully. ${pointsToAward} points credited to student ID #${referral.referrer_id}.`,
      points_awarded: pointsToAward
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to approve referral: ' + err.message });
  }
});

router.post('/admin/referrals/:id/reject', verifyToken, requireAdmin, (req, res) => {
  const referralId = req.params.id;
  const adminId = req.user.id;
  const { reason } = req.body;

  try {
    const referral = db.prepare('SELECT * FROM student_referrals WHERE id = ?').get(referralId);
    if (!referral) {
      return res.status(404).json({ error: 'Referral record not found' });
    }

    if (referral.status === 'APPROVED') {
      return res.status(400).json({ error: 'Cannot reject an already approved referral with credited points.' });
    }

    db.prepare(`
      UPDATE student_referrals SET
        status = 'REJECTED',
        rejection_reason = ?,
        verified_by = ?,
        verified_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(reason || 'Does not satisfy admission referral eligibility criteria.', adminId, referralId);

    // Notify referring student
    db.prepare(`
      INSERT INTO notifications (user_id, target_role, title, message, type, link)
      VALUES (?, 'STUDENT', 'Referral Status Update', ?, 'INFO', '/student/referrals')
    `).run(
      referral.referrer_id,
      `Your referral submission for ${referral.referred_name} could not be approved. Reason: ${reason || 'Incomplete details or does not meet eligibility criteria.'}`
    );

    return res.json({ message: `Referral #${referralId} marked as rejected.` });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to reject referral: ' + err.message });
  }
});

router.put('/admin/referrals/settings', verifyToken, requireAdmin, (req, res) => {
  const { points_per_referral } = req.body;
  if (!points_per_referral || isNaN(points_per_referral)) {
    return res.status(400).json({ error: 'Valid points_per_referral number required' });
  }

  try {
    db.prepare(`
      INSERT INTO referral_settings (key, value)
      VALUES ('points_per_referral', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(String(parseInt(points_per_referral, 10)));

    return res.json({ message: 'Referral settings updated successfully', points_per_referral: parseInt(points_per_referral, 10) });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update referral settings: ' + err.message });
  }
});

module.exports = router;
