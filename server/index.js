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

// Database initialization promise for Serverless and Standalone environments
let initDbPromise = null;
async function ensureDbInitialized() {
  if (!initDbPromise) {
    initDbPromise = (async () => {
      console.log('🚀 Initializing NIAT Connect database engine...');
      await initDatabase();
      initSchema(db);
      const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
      if (userCount === 0) {
        seedDatabase(db);
      }
      seedNiat2Expansion(db);
      console.log('✅ NIAT Connect database engine ready.');
    })();
  }
  return initDbPromise;
}

// Middleware to ensure DB is initialized before handling any route
app.use(async (req, res, next) => {
  try {
    await ensureDbInitialized();
    next();
  } catch (err) {
    console.error('Fatal database initialization error:', err);
    res.status(500).json({ error: 'Database initialization failed: ' + err.message });
  }
});

// Health check
const handleHealth = (req, res) => {
  res.json({
    status: 'ONLINE',
    app: 'NIAT Connect',
    institution: 'NextGen Institute of Advanced Technology',
    timestamp: new Date().toISOString()
  });
};
app.get('/api/health', handleHealth);
app.get('/health', handleHealth);

// Route mounter supporting both /api/* and /* (supports direct Vercel routing as well as local proxy)
const mountRoute = (path, router) => {
  app.use(`/api${path}`, router);
  app.use(path, router);
};

mountRoute('/auth', authRoutes);
mountRoute('/admin', adminRoutes);
mountRoute('/student', studentRoutes);
mountRoute('/notifications', notificationRoutes);
mountRoute('/public', publicRoutes);
mountRoute('/', referralRoutes);
mountRoute('/', swagRoutes);
mountRoute('/', aiFactRoutes);
mountRoute('/', puzzleRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal server error occurred: ' + err.message });
});

// Startup sequence for standalone execution
async function startServer() {
  try {
    await ensureDbInitialized();

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

// Start listener only when run directly (e.g. node server/index.js), not when imported as Vercel serverless function
if (require.main === module) {
  startServer();
}

module.exports = app;
