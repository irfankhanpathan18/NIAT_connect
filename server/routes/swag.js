// ========================================================
// NIAT Connect 2.0 – NIAT Swag Store & Redemption API
// NextGen Institute of Advanced Technology
// ========================================================

const express = require('express');
const { db } = require('../db');
const { verifyToken, requireStudent, requireAdmin } = require('../middleware/auth');
const {
  getStudentReferralBalance,
  recordTransaction,
  TRANSACTION_TYPES
} = require('../services/rewardService');

const router = express.Router();

// ==========================================
// STUDENT SWAG STORE ENDPOINTS
// ==========================================

// GET /api/student/swag/products – List active products with available stock
router.get('/student/swag/products', verifyToken, requireStudent, (req, res) => {
  const studentId = req.user.id;

  try {
    const products = db.prepare(`
      SELECT * FROM swag_products
      WHERE status = 'ACTIVE'
      ORDER BY points_required ASC
    `).all();

    const balance = getStudentReferralBalance(studentId);

    return res.json({
      products,
      balance: {
        available_points: balance.available,
        total_earned: balance.totalEarned,
        total_redeemed: balance.totalRedeemed
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load merchandise products: ' + err.message });
  }
});

// POST /api/student/swag/redeem – Redeem a product using reward points
router.post('/student/swag/redeem', verifyToken, requireStudent, (req, res) => {
  const studentId = req.user.id;
  const { productId, shippingAddress, contactPhone, sizePreference } = req.body;

  if (!productId) {
    return res.status(400).json({ error: 'Product ID is required for redemption' });
  }

  try {
    // 1. Fetch product
    const product = db.prepare('SELECT * FROM swag_products WHERE id = ?').get(productId);
    if (!product || product.status !== 'ACTIVE') {
      return res.status(404).json({ error: 'Selected merchandise is currently unavailable or inactive.' });
    }

    // 2. Validate stock
    if (product.stock <= 0) {
      return res.status(400).json({ error: `Sorry, "${product.name}" is currently out of stock. Please check back later!` });
    }

    // 3. Validate student's referral points balance
    const balance = getStudentReferralBalance(studentId);
    if (balance.available < product.points_required) {
      return res.status(400).json({
        error: `Insufficient reward points. You need ${product.points_required} points for this item, but your available balance is ${balance.available} points. Refer friends to earn more points!`
      });
    }

    // 4. Server-Side Atomic Execution
    // Decrement stock
    db.prepare(`
      UPDATE swag_products 
      SET stock = stock - 1 
      WHERE id = ? AND stock > 0
    `).run(productId);

    // Create redemption request
    const redemptionRes = db.prepare(`
      INSERT INTO swag_redemptions (
        student_id, product_id, points_spent, status, shipping_address, contact_phone, size_preference
      ) VALUES (?, ?, ?, 'Pending', ?, ?, ?)
    `).run(
      studentId,
      productId,
      product.points_required,
      shippingAddress || 'NIAT Campus Collection Desk, Academic Block A',
      contactPhone || null,
      sizePreference || null
    );

    const redemptionId = redemptionRes.lastInsertRowid;

    // Deduct points via immutable ledger entry
    recordTransaction({
      studentId,
      transactionType: TRANSACTION_TYPES.STORE_REDEMPTION,
      points: -product.points_required,
      description: `Redemption for ${product.name} (Order #${redemptionId})`,
      referenceId: `SWAG-${redemptionId}`,
      status: 'COMPLETED'
    });

    // Notify Student
    db.prepare(`
      INSERT INTO notifications (user_id, target_role, title, message, type, link)
      VALUES (?, 'STUDENT', 'Merchandise Order Placed! 🛍️', ?, 'INFO', '/student/swag-store')
    `).run(
      studentId,
      `Your order for "${product.name}" (#${redemptionId}) has been placed. Current status: Pending Admin Review.`
    );

    // Notify Admin
    db.prepare(`
      INSERT INTO notifications (user_id, target_role, title, message, type, link)
      VALUES (NULL, 'ADMIN', 'New Swag Redemption Request', ?, 'ALERT', '/admin/swag-store')
    `).run(
      `Student ID #${studentId} submitted a redemption request for "${product.name}" (${product.points_required} pts).`
    );

    const updatedBalance = getStudentReferralBalance(studentId);

    return res.status(201).json({
      message: `Congratulations! Your redemption request for ${product.name} has been submitted successfully.`,
      redemption: {
        id: redemptionId,
        product_name: product.name,
        points_spent: product.points_required,
        status: 'Pending'
      },
      available_points: updatedBalance.available
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to process swag redemption: ' + err.message });
  }
});

// GET /api/student/swag/my-redemptions – View personal redemption history
router.get('/student/swag/my-redemptions', verifyToken, requireStudent, (req, res) => {
  const studentId = req.user.id;

  try {
    const redemptions = db.prepare(`
      SELECT 
        sr.*,
        sp.name as product_name,
        sp.category as product_category,
        sp.image_url as product_image
      FROM swag_redemptions sr
      JOIN swag_products sp ON sr.product_id = sp.id
      WHERE sr.student_id = ?
      ORDER BY sr.created_at DESC
    `).all(studentId);

    return res.json({ redemptions });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load redemption history: ' + err.message });
  }
});

// ==========================================
// ADMIN SWAG STORE MANAGEMENT ENDPOINTS
// ==========================================

// GET /api/admin/swag/products – List all products for management
router.get('/admin/swag/products', verifyToken, requireAdmin, (req, res) => {
  try {
    const products = db.prepare('SELECT * FROM swag_products ORDER BY id ASC').all();
    return res.json({ products });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load products: ' + err.message });
  }
});

// POST /api/admin/swag/products – Add new product
router.post('/admin/swag/products', verifyToken, requireAdmin, (req, res) => {
  const { name, description, category, points_required, stock, image_url, status } = req.body;

  if (!name || !points_required) {
    return res.status(400).json({ error: 'Product name and required points are mandatory' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO swag_products (name, description, category, points_required, stock, image_url, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      name.trim(),
      description || 'Official NIAT Institutional Merchandise',
      category || 'Apparel',
      parseInt(points_required, 10),
      stock !== undefined ? parseInt(stock, 10) : 20,
      image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400',
      status || 'ACTIVE'
    );

    return res.status(201).json({
      message: 'Product added successfully',
      id: result.lastInsertRowid
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create product: ' + err.message });
  }
});

// PUT /api/admin/swag/products/:id – Edit product info
router.put('/admin/swag/products/:id', verifyToken, requireAdmin, (req, res) => {
  const productId = req.params.id;
  const { name, description, category, points_required, stock, image_url, status } = req.body;

  try {
    db.prepare(`
      UPDATE swag_products SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        category = COALESCE(?, category),
        points_required = COALESCE(?, points_required),
        stock = COALESCE(?, stock),
        image_url = COALESCE(?, image_url),
        status = COALESCE(?, status)
      WHERE id = ?
    `).run(
      name ? name.trim() : null,
      description || null,
      category || null,
      points_required ? parseInt(points_required, 10) : null,
      stock !== undefined ? parseInt(stock, 10) : null,
      image_url || null,
      status || null,
      productId
    );

    return res.json({ message: 'Product updated successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update product: ' + err.message });
  }
});

// DELETE /api/admin/swag/products/:id – Delete product
router.delete('/admin/swag/products/:id', verifyToken, requireAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM swag_products WHERE id = ?').run(req.params.id);
    return res.json({ message: 'Product removed from catalog' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete product: ' + err.message });
  }
});

// GET /api/admin/swag/redemptions – View all redemption requests
router.get('/admin/swag/redemptions', verifyToken, requireAdmin, (req, res) => {
  try {
    const redemptions = db.prepare(`
      SELECT 
        sr.*,
        u.name as student_name,
        u.email as student_email,
        u.phone as student_phone,
        sp.name as product_name,
        sp.category as product_category,
        sp.image_url as product_image,
        sp.stock as current_stock
      FROM swag_redemptions sr
      JOIN users u ON sr.student_id = u.id
      JOIN swag_products sp ON sr.product_id = sp.id
      ORDER BY sr.created_at DESC
    `).all();

    // Summary analytics
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_redemptions,
        COALESCE(SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END), 0) as pending_count,
        COALESCE(SUM(CASE WHEN status = 'Delivered' THEN 1 ELSE 0 END), 0) as delivered_count,
        COALESCE(SUM(points_spent), 0) as total_points_redeemed
      FROM swag_redemptions
      WHERE status != 'Rejected'
    `).get();

    return res.json({
      redemptions,
      analytics: stats
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load redemptions: ' + err.message });
  }
});

// PUT /api/admin/swag/redemptions/:id/status – Update redemption order status
router.put('/admin/swag/redemptions/:id/status', verifyToken, requireAdmin, (req, res) => {
  const redemptionId = req.params.id;
  const { status, adminNotes } = req.body;

  const validStatuses = ['Pending', 'Approved', 'Processing', 'Ready for Collection', 'Delivered'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Allowed: ${validStatuses.join(', ')}` });
  }

  try {
    const redemption = db.prepare('SELECT * FROM swag_redemptions WHERE id = ?').get(redemptionId);
    if (!redemption) {
      return res.status(404).json({ error: 'Redemption request not found' });
    }

    if (redemption.status === 'Rejected') {
      return res.status(400).json({ error: 'Cannot change status of an already rejected and refunded order.' });
    }

    db.prepare(`
      UPDATE swag_redemptions SET
        status = ?,
        admin_notes = COALESCE(?, admin_notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, adminNotes || null, redemptionId);

    // Notify student
    db.prepare(`
      INSERT INTO notifications (user_id, target_role, title, message, type, link)
      VALUES (?, 'STUDENT', 'Order Status Update 📦', ?, 'INFO', '/student/swag-store')
    `).run(
      redemption.student_id,
      `Your merchandise order #${redemptionId} status is now: "${status}".`
    );

    return res.json({ message: `Order #${redemptionId} status updated to "${status}".` });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update order status: ' + err.message });
  }
});

// POST /api/admin/swag/redemptions/:id/reject – Reject order and automatically refund points
router.post('/admin/swag/redemptions/:id/reject', verifyToken, requireAdmin, (req, res) => {
  const redemptionId = req.params.id;
  const { reason } = req.body;

  try {
    const redemption = db.prepare('SELECT * FROM swag_redemptions WHERE id = ?').get(redemptionId);
    if (!redemption) {
      return res.status(404).json({ error: 'Redemption order not found' });
    }

    if (redemption.status === 'Rejected') {
      return res.status(400).json({ error: 'Order is already marked as rejected and refunded.' });
    }

    // 1. Mark status as Rejected
    db.prepare(`
      UPDATE swag_redemptions SET
        status = 'Rejected',
        rejection_reason = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(reason || 'Cancelled by administration or shipping address unserviceable.', redemptionId);

    // 2. Restock the item
    db.prepare(`
      UPDATE swag_products 
      SET stock = stock + 1 
      WHERE id = ?
    `).run(redemption.product_id);

    // 3. Automatic refund into the centralized ledger!
    recordTransaction({
      studentId: redemption.student_id,
      transactionType: TRANSACTION_TYPES.REFUND,
      points: redemption.points_spent,
      description: `Refund for rejected Swag Order #${redemptionId} (${reason || 'Order cancelled'})`,
      referenceId: `REFUND-${redemptionId}`,
      status: 'COMPLETED'
    });

    // 4. Notify student
    db.prepare(`
      INSERT INTO notifications (user_id, target_role, title, message, type, link)
      VALUES (?, 'STUDENT', 'Order Refunded & Points Returned 🪙', ?, 'ALERT', '/student/swag-store')
    `).run(
      redemption.student_id,
      `Your merchandise order #${redemptionId} was cancelled. ${redemption.points_spent} reward points have been automatically refunded to your balance. Reason: ${reason || 'Out of stock or cancelled.'}`
    );

    return res.json({
      message: `Order #${redemptionId} rejected. ${redemption.points_spent} points refunded to student ID #${redemption.student_id}.`
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to reject redemption: ' + err.message });
  }
});

module.exports = router;
