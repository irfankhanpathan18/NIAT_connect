const express = require('express');
const { db } = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken);

// GET /api/notifications
router.get('/', (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    const notifications = db.prepare(`
      SELECT * FROM notifications
      WHERE (user_id = ? OR target_role = ? OR target_role = 'ALL')
      ORDER BY created_at DESC
      LIMIT 30
    `).all(userId, userRole);

    const unreadCount = db.prepare(`
      SELECT COUNT(*) as count FROM notifications
      WHERE (user_id = ? OR target_role = ? OR target_role = 'ALL') AND is_read = 0
    `).get(userId, userRole).count;

    return res.json({ notifications, unreadCount });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load notifications: ' + err.message });
  }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', (req, res) => {
  const notifId = parseInt(req.params.id, 10);
  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(notifId);
    return res.json({ message: 'Notification marked as read' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update notification: ' + err.message });
  }
});

// PUT /api/notifications/read-all
router.put('/read-all', (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    db.prepare(`
      UPDATE notifications SET is_read = 1
      WHERE (user_id = ? OR target_role = ? OR target_role = 'ALL')
    `).run(userId, userRole);

    return res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update notifications: ' + err.message });
  }
});

module.exports = router;
