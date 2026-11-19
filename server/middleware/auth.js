const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'niat_connect_jwt_secure_secret_key_2026';

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication token missing or invalid' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session expired or token invalid. Please log in again.' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access restricted: Only authorized NIAT admission administrators can access this resource.' });
  }
  next();
}

function requireStudent(req, res, next) {
  if (!req.user || req.user.role !== 'STUDENT') {
    return res.status(403).json({ error: 'Access restricted: Only registered students can access this student portal resource.' });
  }
  next();
}

module.exports = {
  JWT_SECRET,
  verifyToken,
  requireAdmin,
  requireStudent
};
