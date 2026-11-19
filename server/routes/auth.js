const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db');
const { JWT_SECRET, verifyToken } = require('../middleware/auth');
const { evaluateLeadScore } = require('../services/aiService');

const router = express.Router();

// ==========================================
// 1. ADMIN AUTHENTICATION
// ==========================================

router.post('/admin/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide both email and password' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials. Please verify your administrative email and password.' });
  }

  if (user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Unauthorized: This login portal is strictly reserved for NIAT Admission Administrators. Prospective students must log in via the Student Portal.' });
  }

  if (user.status === 'INACTIVE') {
    return res.status(403).json({ error: 'This administrative account has been deactivated. Please contact the NIAT Super Admin.' });
  }

  const isPasswordValid = bcrypt.compareSync(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ error: 'Invalid credentials. Please verify your administrative email and password.' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return res.json({
    message: 'Admin authentication successful',
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      avatar_url: user.avatar_url
    }
  });
});

// ==========================================
// 2. STUDENT AUTHENTICATION & ONBOARDING
// ==========================================

router.post('/student/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide both email and password' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'Invalid student login credentials or student record not found.' });
  }

  if (user.role !== 'STUDENT') {
    return res.status(403).json({ error: 'This account belongs to an Administrator. Please use the Admin Portal to sign in.' });
  }

  if (user.status === 'INACTIVE') {
    return res.status(403).json({ error: 'Your student account is currently inactive. Please reach out to admissions@niat.edu.in' });
  }

  const isPasswordValid = bcrypt.compareSync(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ error: 'Invalid password. Please check your password or use Forgot Password.' });
  }

  const profile = db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(user.id);

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return res.json({
    message: 'Student login successful',
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      avatar_url: user.avatar_url,
      profile: profile || null
    }
  });
});

router.post('/student/register', (req, res) => {
  const {
    name,
    email,
    phone,
    password,
    current_education,
    class_12_passing_year,
    city,
    state,
    interested_program
  } = req.body;

  if (!name || !email || !phone || !password) {
    return res.status(400).json({ error: 'Name, email, phone number, and password are required' });
  }

  const trimmedEmail = email.trim().toLowerCase();
  const trimmedPhone = phone.trim();

  // Check duplicate
  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(trimmedEmail);
  if (existingUser) {
    return res.status(409).json({ error: 'An account with this email address already exists. Please log in instead.' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  // 1. Create User
  const userResult = db.prepare(`
    INSERT INTO users (name, email, phone, password, role, status, avatar_url)
    VALUES (?, ?, ?, ?, 'STUDENT', 'ACTIVE', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150')
  `).run(name.trim(), trimmedEmail, trimmedPhone, hashedPassword);

  const userId = userResult.lastInsertRowid;

  // 2. Create Student Profile
  db.prepare(`
    INSERT INTO student_profiles (
      user_id, current_education, class_12_passing_year, class_12_percentage,
      city, state, interested_program, dream_career, application_stage
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'INQUIRY')
  `).run(
    userId,
    current_education || '12th Pursuing (Science PCM)',
    class_12_passing_year ? parseInt(class_12_passing_year, 10) : 2026,
    req.body.class_12_percentage ? parseFloat(req.body.class_12_percentage) : null,
    city || 'Not Specified',
    state || 'Not Specified',
    interested_program || 'B.Tech CSE (AI & ML)',
    req.body.dream_career || 'Software / AI Engineer'
  );

  // 3. Automatically mirror into CRM Leads so admission officers see this lead in real-time
  const leadObj = {
    student_name: name.trim(),
    email: trimmedEmail,
    phone: trimmedPhone,
    current_education: current_education || '12th Pursuing (Science PCM)',
    class_12_passing_year: class_12_passing_year ? parseInt(class_12_passing_year, 10) : 2026,
    city: city || 'Not Specified',
    state: state || 'Not Specified',
    interested_program: interested_program || 'B.Tech CSE (AI & ML)',
    lead_source: 'Website',
    admission_interest_level: 'High',
    counselling_status: 'New',
    assigned_counsellor_id: 1, // assign to default counsellor
    follow_up_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    notes: 'Direct online registration on NIAT Connect student portal.'
  };

  const leadRes = db.prepare(`
    INSERT INTO leads (
      student_name, email, phone, current_education, class_12_passing_year,
      city, state, interested_program, lead_source, admission_interest_level,
      counselling_status, assigned_counsellor_id, follow_up_date, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    leadObj.student_name, leadObj.email, leadObj.phone, leadObj.current_education,
    leadObj.class_12_passing_year, leadObj.city, leadObj.state, leadObj.interested_program,
    leadObj.lead_source, leadObj.admission_interest_level, leadObj.counselling_status,
    leadObj.assigned_counsellor_id, leadObj.follow_up_date, leadObj.notes
  );

  const newLeadId = leadRes.lastInsertRowid;

  // Run AI Scoring on the new lead
  const aiScore = evaluateLeadScore(leadObj);
  db.prepare(`
    INSERT INTO lead_scores (lead_id, score, ai_classification, is_manually_overridden, breakdown_json)
    VALUES (?, ?, ?, 0, ?)
  `).run(newLeadId, aiScore.score, aiScore.ai_classification, JSON.stringify(aiScore.breakdown));

  // Log activity
  db.prepare(`
    INSERT INTO lead_activities (lead_id, activity_type, description, performed_by)
    VALUES (?, 'STATUS_CHANGE', ?, 'System')
  `).run(newLeadId, `Student registered via portal. AI Score: ${aiScore.score} (${aiScore.ai_classification}).`);

  // Welcome Notification for Student
  db.prepare(`
    INSERT INTO notifications (user_id, target_role, title, message, type, link)
    VALUES (?, 'STUDENT', 'Welcome to NIAT Connect!', 'Your admission portal account is ready. Explore programs, schedule counselling, or talk to our AI Assistant.', 'INFO', '/student/dashboard')
  `).run(userId);

  // Admin Notification for new lead
  db.prepare(`
    INSERT INTO notifications (user_id, target_role, title, message, type, link)
    VALUES (NULL, 'ADMIN', 'New Student Registration', ?, 'ALERT', '/admin/leads')
  `).run(`New student "${name}" signed up for ${interested_program || 'B.Tech'}. AI Classified as ${aiScore.ai_classification}.`);

  const token = jwt.sign(
    { id: userId, email: trimmedEmail, name: name.trim(), role: 'STUDENT' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const profile = db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(userId);

  return res.status(201).json({
    message: 'Student account successfully created',
    token,
    user: {
      id: userId,
      name: name.trim(),
      email: trimmedEmail,
      phone: trimmedPhone,
      role: 'STUDENT',
      status: 'ACTIVE',
      profile
    }
  });
});

// ==========================================
// 3. PASSWORD RESET FLOWS
// ==========================================

router.post('/forgot-password', (req, res) => {
  const { email, role } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Please provide your registered email address' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase());
  if (!user) {
    return res.status(404).json({ error: 'No account registered with that email address.' });
  }

  if (role && user.role !== role.toUpperCase()) {
    return res.status(400).json({ error: `This email is registered under ${user.role} role, not ${role}.` });
  }

  // Simulated secure reset token (for institutional demo and testing)
  const resetToken = `reset_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`;

  return res.json({
    message: 'Password reset link and verification code generated successfully.',
    resetToken,
    instructions: 'In development mode, you can immediately reset your password with this reset token.'
  });
});

router.post('/reset-password', (req, res) => {
  const { email, newPassword, resetToken } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Email and new password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase());
  if (!user) {
    return res.status(404).json({ error: 'User account not found.' });
  }

  const hashed = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(hashed, user.id);

  return res.json({
    message: 'Password has been successfully updated. You may now log in with your new credentials.'
  });
});

// ==========================================
// 4. GET CURRENT AUTHENTICATED USER
// ==========================================

router.get('/me', verifyToken, (req, res) => {
  const user = db.prepare('SELECT id, name, email, phone, role, status, avatar_url, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User profile not found' });
  }

  let profile = null;
  if (user.role === 'STUDENT') {
    profile = db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(user.id);
  }

  return res.json({
    user: {
      ...user,
      profile
    }
  });
});

module.exports = router;
