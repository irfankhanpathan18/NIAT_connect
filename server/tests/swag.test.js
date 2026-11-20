// End-to-end tests for the Swag Store workflow, driven over HTTP against the real routes.
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');
const { initDatabase, db } = require('../db');
const { initSchema } = require('../schema');
const { seedDatabase, seedNiat2Expansion } = require('../seed');
const { JWT_SECRET } = require('../middleware/auth');
const { recordTransaction, TRANSACTION_TYPES, getStudentReferralBalance } = require('../services/rewardService');
const swagRoutes = require('../routes/swag');

let server;
let base;
let studentId;
const tokens = {};

async function call(method, path, role, body) {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokens[role]}` },
    body: body ? JSON.stringify(body) : undefined
  });
  return { status: res.status, body: await res.json() };
}

async function createProduct(overrides = {}) {
  const res = await call('POST', '/api/admin/swag/products', 'admin', {
    name: `Test Item ${Date.now()}-${Math.random()}`,
    category: 'Accessories',
    points_required: 10,
    stock: 3,
    ...overrides
  });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  return res.body.id;
}

before(async () => {
  await initDatabase();
  initSchema(db);
  if (db.prepare('SELECT COUNT(*) as count FROM users').get().count === 0) seedDatabase(db);
  seedNiat2Expansion(db);

  const admin = db.prepare("SELECT * FROM users WHERE role = 'ADMIN' LIMIT 1").get();
  const student = db.prepare("SELECT * FROM users WHERE role = 'STUDENT' LIMIT 1").get();
  studentId = student.id;
  tokens.admin = jwt.sign({ id: admin.id, role: 'ADMIN' }, JWT_SECRET);
  tokens.student = jwt.sign({ id: student.id, role: 'STUDENT' }, JWT_SECRET);

  // Make sure the student can afford test purchases.
  recordTransaction({
    studentId,
    transactionType: TRANSACTION_TYPES.ADMIN_ADJUSTMENT,
    points: 500,
    description: 'Swag test top-up'
  });

  const app = express();
  app.use(express.json());
  app.use('/api', swagRoutes);
  await new Promise(resolve => { server = app.listen(0, resolve); });
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => server && server.close());

describe('Swag Store workflow', () => {
  test('redeeming deducts points and stock, and the order appears for student and admin', async () => {
    const productId = await createProduct({ points_required: 10, stock: 2 });
    const before = getStudentReferralBalance(studentId).available;

    const redeem = await call('POST', '/api/student/swag/redeem', 'student', { productId, contactPhone: '+91 98765 43210' });
    assert.equal(redeem.status, 201);
    assert.equal(redeem.body.available_points, before - 10);

    const stock = db.prepare('SELECT stock FROM swag_products WHERE id = ?').get(productId).stock;
    assert.equal(stock, 1);

    const mine = await call('GET', '/api/student/swag/my-redemptions', 'student');
    assert.ok(mine.body.redemptions.some(r => r.id === redeem.body.redemption.id));
    const all = await call('GET', '/api/admin/swag/redemptions', 'admin');
    assert.ok(all.body.redemptions.some(r => r.id === redeem.body.redemption.id));
  });

  test('orders move forward only, and delivered orders cannot be rejected or refunded', async () => {
    const productId = await createProduct();
    const { body } = await call('POST', '/api/student/swag/redeem', 'student', { productId });
    const id = body.redemption.id;

    assert.equal((await call('PUT', `/api/admin/swag/redemptions/${id}/status`, 'admin', { status: 'Processing' })).status, 200);
    assert.equal((await call('PUT', `/api/admin/swag/redemptions/${id}/status`, 'admin', { status: 'Pending' })).status, 400);
    assert.equal((await call('PUT', `/api/admin/swag/redemptions/${id}/status`, 'admin', { status: 'Delivered' })).status, 200);

    const balanceBefore = getStudentReferralBalance(studentId).available;
    const reject = await call('POST', `/api/admin/swag/redemptions/${id}/reject`, 'admin', { reason: 'test' });
    assert.equal(reject.status, 400);
    assert.equal(getStudentReferralBalance(studentId).available, balanceBefore);
  });

  test('rejecting an undelivered order refunds points and restocks once', async () => {
    const productId = await createProduct({ points_required: 7, stock: 1 });
    const balanceBefore = getStudentReferralBalance(studentId).available;
    const { body } = await call('POST', '/api/student/swag/redeem', 'student', { productId });

    const reject = await call('POST', `/api/admin/swag/redemptions/${body.redemption.id}/reject`, 'admin', { reason: 'Out of stock' });
    assert.equal(reject.status, 200);
    assert.equal(getStudentReferralBalance(studentId).available, balanceBefore);
    assert.equal(db.prepare('SELECT stock FROM swag_products WHERE id = ?').get(productId).stock, 1);

    const again = await call('POST', `/api/admin/swag/redemptions/${body.redemption.id}/reject`, 'admin', {});
    assert.equal(again.status, 400);
  });

  test('out-of-stock and unaffordable items are refused without side effects', async () => {
    const empty = await createProduct({ stock: 0 });
    assert.equal((await call('POST', '/api/student/swag/redeem', 'student', { productId: empty })).status, 400);

    const pricey = await createProduct({ points_required: 1_000_000 });
    const balance = getStudentReferralBalance(studentId).available;
    assert.equal((await call('POST', '/api/student/swag/redeem', 'student', { productId: pricey })).status, 400);
    assert.equal(getStudentReferralBalance(studentId).available, balance);
  });

  test('invalid product input is rejected with 400, not stored', async () => {
    for (const bad of [
      { name: 'Neg', points_required: -50 },
      { name: 'Zero', points_required: 0 },
      { name: 'NaN', points_required: 'abc' },
      { name: 'Stock', points_required: 5, stock: -1 },
      { name: 'Status', points_required: 5, status: 'archived' },
      { name: 'Url', points_required: 5, image_url: 'javascript:alert(1)' }
    ]) {
      const res = await call('POST', '/api/admin/swag/products', 'admin', bad);
      assert.equal(res.status, 400, `expected 400 for ${JSON.stringify(bad)}`);
    }
    const lower = await call('POST', '/api/admin/swag/products', 'admin', { name: 'Lower', points_required: 5, status: 'inactive' });
    assert.equal(lower.status, 201);
  });

  test('apparel size must be valid', async () => {
    const productId = await createProduct({ category: 'Apparel' });
    const res = await call('POST', '/api/student/swag/redeem', 'student', { productId, sizePreference: 'XXXL' });
    assert.equal(res.status, 400);
  });

  test('a product with orders cannot be deleted, so order history is kept', async () => {
    const productId = await createProduct();
    const { body } = await call('POST', '/api/student/swag/redeem', 'student', { productId });

    const del = await call('DELETE', `/api/admin/swag/products/${productId}`, 'admin');
    assert.equal(del.status, 409);
    assert.ok(db.prepare('SELECT id FROM swag_redemptions WHERE id = ?').get(body.redemption.id));

    const unused = await createProduct();
    assert.equal((await call('DELETE', `/api/admin/swag/products/${unused}`, 'admin')).status, 200);
  });

  test('a failed step rolls back the whole redemption', async () => {
    const productId = await createProduct({ stock: 2 });
    const balance = getStudentReferralBalance(studentId).available;
    // Force the ledger insert to fail inside the transaction.
    db.exec(`CREATE TRIGGER fail_ledger BEFORE INSERT ON reward_transactions
             BEGIN SELECT RAISE(ABORT, 'forced failure'); END;`);
    try {
      const res = await call('POST', '/api/student/swag/redeem', 'student', { productId });
      assert.equal(res.status, 500);
      assert.doesNotMatch(res.body.error, /forced failure/);
    } finally {
      db.exec('DROP TRIGGER fail_ledger');
    }
    assert.equal(db.prepare('SELECT stock FROM swag_products WHERE id = ?').get(productId).stock, 2);
    assert.equal(db.prepare('SELECT COUNT(*) as c FROM swag_redemptions WHERE product_id = ?').get(productId).c, 0);
    assert.equal(getStudentReferralBalance(studentId).available, balance);
  });

  test('a mis-signed redemption entry can no longer inflate the balance', () => {
    const before = getStudentReferralBalance(studentId).available;
    recordTransaction({
      studentId,
      transactionType: TRANSACTION_TYPES.STORE_REDEMPTION,
      points: 50,
      description: 'Legacy positive redemption row'
    });
    assert.equal(getStudentReferralBalance(studentId).available, before - 50);
  });
});
