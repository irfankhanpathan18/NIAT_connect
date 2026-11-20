const express = require('express');
const cors = require('cors');
const { initDatabase, db, saveToDisk } = require('./db');
const { initSchema } = require('./schema');
const { seedDatabase, seedNiat2Expansion } = require('./seed');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const studentRoutes = require('./routes/student');
const notificationRoutes = require('./routes/notifications');
const publicRoutes = require('./routes/public');
const referralRoutes = require('./routes/referrals');
const swagRoutes = require('./routes/swag');
const aiFactRoutes = require('./routes/aiFacts');
const puzzleRoutes = require('./routes/puzzles');

const app = express();
const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

app.use(cors({
  origin: CORS_ORIGIN === '*' ? '*' : CORS_ORIGIN.split(',').map(o => o.trim()),
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    app: 'NIAT Connect',
    institution: 'NextGen Institute of Advanced Technology',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/public', publicRoutes);
app.use('/api', referralRoutes);
app.use('/api', swagRoutes);
app.use('/api', aiFactRoutes);
app.use('/api', puzzleRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal server error occurred: ' + err.message });
});

// Startup sequence
async function startServer() {
  try {
    console.log('🚀 Initializing NIAT Connect database engine...');
    await initDatabase();

    // Initialize Schema
    initSchema(db);

    // Auto-seed if database is fresh
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    if (userCount === 0) {
      seedDatabase(db);
    } else {
      console.log(`ℹ️ Database already initialized with ${userCount} registered accounts.`);
    }

    // Seed NIAT 2.0 Feature Expansion tables if not yet seeded
    seedNiat2Expansion(db);

    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🎓 NIAT Connect Server running on http://localhost:${PORT}`);
      console.log(`🏛️ NextGen Institute of Advanced Technology`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('Fatal initialization error:', err);
    process.exit(1);
  }
}

// Graceful exit handler
process.on('SIGINT', () => {
  console.log('\nSaving database and shutting down...');
  saveToDisk();
  process.exit(0);
});

process.on('SIGTERM', () => {
  saveToDisk();
  process.exit(0);
});

startServer();
