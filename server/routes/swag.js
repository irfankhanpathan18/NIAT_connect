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

// Order lifecycle: an order may only move forward through these stages.
const ORDER_FLOW = ['Pending', 'Approved', 'Processing', 'Ready for Collection', 'Delivered'];
// Orders in these states can still be cancelled with a refund (not once delivered).
const REJECTABLE = ['Pending', 'Approved', 'Processing', 'Ready for Collection'];
const PRODUCT_STATUSES = ['ACTIVE', 'INACTIVE'];
const APPAREL_SIZES = ['S', 'M', 'L', 'XL'];

class ValidationError extends Error {}

function toInt(value, field, { min }) {
  const n = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isInteger(n) || n < min) {
    throw new ValidationError(`${field} must be a whole number of at least ${min}.`);
  }
  return n;
}

function optionalText(value, field, max) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') throw new ValidationError(`${field} must be text.`);
  const trimmed = value.trim();
  if (trimmed.length > max) throw new ValidationError(`${field} must be at most ${max} characters.`);
  return trimmed || null;
}

// Validates a product payload. With partial=true (edit), missing fields are left unchanged (null).
function parseProduct(body, { partial }) {
  const out = {};
  const has = key => body[key] !== undefined && body[key] !== null && body[key] !== '';

  if (has('name')) out.name = optionalText(body.name, 'Product name', 120);
  else if (!partial) throw new ValidationError('Product name and required points are mandatory');

  if (has('points_required')) out.points_required = toInt(body.points_required, 'Points required', { min: 1 });
  else if (!partial) throw new ValidationError('Product name and required points are mandatory');

  if (has('stock')) out.stock = toInt(body.stock, 'Stock', { min: 0 });
  if (has('status')) {
    const status = String(body.status).trim().toUpperCase();
    if (!PRODUCT_STATUSES.includes(status)) throw new ValidationError('Status must be ACTIVE or INACTIVE.');
    out.status = status;
  }
  if (has('image_url')) {
    const url = optionalText(body.image_url, 'Image URL', 500);
    if (!/^https?:\/\//i.test(url)) throw new ValidationError('Image URL must start with http:// or https://');
    out.image_url = url;
  }
  out.description = optionalText(body.description, 'Description', 1000);
  out.category = optionalText(body.category, 'Category', 60);
  return out;
}

function sendError(res, err, fallback) {
  if (err instanceof ValidationError) return res.status(400).json({ error: err.message });
  console.error(fallback, err);
  return res.status(500).json({ error: fallback });
}

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
    return sendError(res, err, 'Failed to load merchandise products.');
  }
});

// POST /api/student/swag/redeem – Redeem a product using reward points
router.post('/student/swag/redeem', verifyToken, requireStudent, (req, res) => {
  const studentId = req.user.id;
  const { productId } = req.body;

  if (!productId) {
    return res.status(400).json({ error: 'Product ID is required for redemption' });
  }

  try {
    const shippingAddress = optionalText(req.body.shippingAddress, 'Shipping address', 300);
    const contactPhone = optionalText(req.body.contactPhone, 'Contact phone', 20);
    if (contactPhone && !/^[+\d][\d\s-]{6,19}$/.test(contactPhone)) {
      throw new ValidationError('Please enter a valid contact phone number.');
    }

    const product = db.prepare('SELECT * FROM swag_products WHERE id = ?').get(productId);
    if (!product || product.status !== 'ACTIVE') {
      return res.status(404).json({ error: 'Selected merchandise is currently unavailable or inactive.' });
    }

    let sizePreference = null;
    if (product.category === 'Apparel') {
      sizePreference = String(req.body.sizePreference || 'L').trim().toUpperCase();
      if (!APPAREL_SIZES.includes(sizePreference)) {
        throw new ValidationError(`Size must be one of ${APPAREL_SIZES.join(', ')}.`);
      }
    }

    if (product.stock <= 0) {
      return res.status(400).json({ error: `Sorry, "${product.name}" is currently out of stock. Please check back later!` });
    }

    // Guards against bad rows created before validation existed (e.g. 0 or negative prices).
    if (!Number.isInteger(product.points_required) || product.points_required < 1) {
      return res.status(400).json({ error: 'This item is misconfigured and cannot be redeemed right now.' });
    }

    const balance = getStudentReferralBalance(studentId);
    if (balance.available < product.points_required) {
      return res.status(400).json({
        error: `Insufficient reward points. You need ${product.points_required} points for this item, but your available balance is ${balance.available} points. Refer friends to earn more points!`
      });
    }

    // Stock, order and ledger entry are written together or not at all.
    const redemptionId = db.transaction(() => {
      const stockUpdate = db.prepare(`
        UPDATE swag_products SET stock = stock - 1
        WHERE id = ? AND stock > 0
      `).run(product.id);
      if (!stockUpdate.changes) throw new ValidationError(`Sorry, "${product.name}" just went out of stock.`);

      const id = db.prepare(`
        INSERT INTO swag_redemptions (
          student_id, product_id, points_spent, status, shipping_address, contact_phone, size_preference
        ) VALUES (?, ?, ?, 'Pending', ?, ?, ?)
      `).run(
        studentId,
        product.id,
        product.points_required,
        shippingAddress || 'NIAT Campus Collection Desk, Academic Block A',
        contactPhone,
        sizePreference
      ).lastInsertRowid;

      recordTransaction({
        studentId,
        transactionType: TRANSACTION_TYPES.STORE_REDEMPTION,
        points: -product.points_required,
        description: `Redemption for ${product.name} (Order #${id})`,
        referenceId: `SWAG-${id}`,
        status: 'COMPLETED'
      });

      db.prepare(`
        INSERT INTO notifications (user_id, target_role, title, message, type, link)
        VALUES (?, 'STUDENT', 'Merchandise Order Placed! 🛍️', ?, 'INFO', '/student/swag-store')
      `).run(
        studentId,
        `Your order for "${product.name}" (#${id}) has been placed. Current status: Pending Admin Review.`
      );

      db.prepare(`
        INSERT INTO notifications (user_id, target_role, title, message, type, link)
        VALUES (NULL, 'ADMIN', 'New Swag Redemption Request', ?, 'ALERT', '/admin/swag-store')
      `).run(
        `Student ID #${studentId} submitted a redemption request for "${product.name}" (${product.points_required} pts).`
      );

      return id;
    });

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
    return sendError(res, err, 'Failed to process swag redemption.');
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
      LEFT JOIN swag_products sp ON sr.product_id = sp.id
      WHERE sr.student_id = ?
      ORDER BY sr.created_at DESC, sr.id DESC
    `).all(studentId);

    return res.json({ redemptions });
  } catch (err) {
    return sendError(res, err, 'Failed to load redemption history.');
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
    return sendError(res, err, 'Failed to load products.');
  }
});

// POST /api/admin/swag/products – Add new product
router.post('/admin/swag/products', verifyToken, requireAdmin, (req, res) => {
  try {
    const p = parseProduct(req.body, { partial: false });
    const result = db.prepare(`
      INSERT INTO swag_products (name, description, category, points_required, stock, image_url, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      p.name,
      p.description || 'Official NIAT Institutional Merchandise',
      p.category || 'Apparel',
      p.points_required,
      p.stock ?? 20,
      p.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400',
      p.status || 'ACTIVE'
    );

    return res.status(201).json({
      message: 'Product added successfully',
      id: result.lastInsertRowid
    });
  } catch (err) {
    return sendError(res, err, 'Failed to create product.');
  }
});

// PUT /api/admin/swag/products/:id – Edit product info
router.put('/admin/swag/products/:id', verifyToken, requireAdmin, (req, res) => {
  const productId = req.params.id;

  try {
    const existing = db.prepare('SELECT id FROM swag_products WHERE id = ?').get(productId);
    if (!existing) return res.status(404).json({ error: 'Product not found' });

    const p = parseProduct(req.body, { partial: true });
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
      p.name ?? null,
      p.description,
      p.category,
      p.points_required ?? null,
      p.stock ?? null,
      p.image_url ?? null,
      p.status ?? null,
      productId
    );

    return res.json({ message: 'Product updated successfully' });
  } catch (err) {
    return sendError(res, err, 'Failed to update product.');
  }
});

// DELETE /api/admin/swag/products/:id – Delete a product that has never been ordered.
// Products with order history must be deactivated instead, so students keep their order records.
router.delete('/admin/swag/products/:id', verifyToken, requireAdmin, (req, res) => {
  try {
    const product = db.prepare('SELECT id FROM swag_products WHERE id = ?').get(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const orders = db.prepare('SELECT COUNT(*) as count FROM swag_redemptions WHERE product_id = ?').get(product.id).count;
    if (orders > 0) {
      return res.status(409).json({
        error: `This product has ${orders} order(s) and cannot be deleted. Set its status to INACTIVE to hide it from the store instead.`
      });
    }

    db.prepare('DELETE FROM swag_products WHERE id = ?').run(product.id);
    return res.json({ message: 'Product removed from catalog' });
  } catch (err) {
    return sendError(res, err, 'Failed to delete product.');
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
      LEFT JOIN users u ON sr.student_id = u.id
      LEFT JOIN swag_products sp ON sr.product_id = sp.id
      ORDER BY sr.created_at DESC, sr.id DESC
    `).all();

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
    return sendError(res, err, 'Failed to load redemptions.');
  }
});

// PUT /api/admin/swag/redemptions/:id/status – Move an order forward in its lifecycle
router.put('/admin/swag/redemptions/:id/status', verifyToken, requireAdmin, (req, res) => {
  const redemptionId = req.params.id;
  const { status } = req.body;

  if (!ORDER_FLOW.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Allowed: ${ORDER_FLOW.join(', ')}` });
  }

  try {
    const adminNotes = optionalText(req.body.adminNotes, 'Admin notes', 500);
    const redemption = db.prepare('SELECT * FROM swag_redemptions WHERE id = ?').get(redemptionId);
    if (!redemption) {
      return res.status(404).json({ error: 'Redemption request not found' });
    }

    if (redemption.status === 'Rejected') {
      return res.status(400).json({ error: 'Cannot change status of an already rejected and refunded order.' });
    }

    const from = ORDER_FLOW.indexOf(redemption.status);
    const to = ORDER_FLOW.indexOf(status);
    if (to <= from) {
      return res.status(400).json({
        error: `Order #${redemption.id} is already "${redemption.status}" and can only move forward (${ORDER_FLOW.slice(from + 1).join(' → ') || 'no further steps'}).`
      });
    }

    db.transaction(() => {
      db.prepare(`
        UPDATE swag_redemptions SET
          status = ?,
          admin_notes = COALESCE(?, admin_notes),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(status, adminNotes, redemption.id);

      db.prepare(`
        INSERT INTO notifications (user_id, target_role, title, message, type, link)
        VALUES (?, 'STUDENT', 'Order Status Update 📦', ?, 'INFO', '/student/swag-store')
      `).run(
        redemption.student_id,
        `Your merchandise order #${redemption.id} status is now: "${status}".`
      );
    });

    return res.json({ message: `Order #${redemption.id} status updated to "${status}".` });
  } catch (err) {
    return sendError(res, err, 'Failed to update order status.');
  }
});

// POST /api/admin/swag/redemptions/:id/reject – Reject an undelivered order and refund its points
router.post('/admin/swag/redemptions/:id/reject', verifyToken, requireAdmin, (req, res) => {
  const redemptionId = req.params.id;

  try {
    const reason = optionalText(req.body.reason, 'Reason', 300);
    const redemption = db.prepare('SELECT * FROM swag_redemptions WHERE id = ?').get(redemptionId);
    if (!redemption) {
      return res.status(404).json({ error: 'Redemption order not found' });
    }

    if (redemption.status === 'Rejected') {
      return res.status(400).json({ error: 'Order is already marked as rejected and refunded.' });
    }
    if (!REJECTABLE.includes(redemption.status)) {
      return res.status(400).json({ error: `Order #${redemption.id} has already been delivered and can no longer be rejected or refunded.` });
    }

    db.transaction(() => {
      db.prepare(`
        UPDATE swag_redemptions SET
          status = 'Rejected',
          rejection_reason = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(reason || 'Cancelled by administration or shipping address unserviceable.', redemption.id);

      db.prepare('UPDATE swag_products SET stock = stock + 1 WHERE id = ?').run(redemption.product_id);

      recordTransaction({
        studentId: redemption.student_id,
        transactionType: TRANSACTION_TYPES.REFUND,
        points: redemption.points_spent,
        description: `Refund for rejected Swag Order #${redemption.id} (${reason || 'Order cancelled'})`,
        referenceId: `REFUND-${redemption.id}`,
        status: 'COMPLETED'
      });

      db.prepare(`
        INSERT INTO notifications (user_id, target_role, title, message, type, link)
        VALUES (?, 'STUDENT', 'Order Refunded & Points Returned 🪙', ?, 'ALERT', '/student/swag-store')
      `).run(
        redemption.student_id,
        `Your merchandise order #${redemption.id} was cancelled. ${redemption.points_spent} reward points have been automatically refunded to your balance. Reason: ${reason || 'Out of stock or cancelled.'}`
      );
    });

    return res.json({
      message: `Order #${redemption.id} rejected. ${redemption.points_spent} points refunded to student ID #${redemption.student_id}.`
    });
  } catch (err) {
    return sendError(res, err, 'Failed to reject redemption.');
  }
});

module.exports = router;
