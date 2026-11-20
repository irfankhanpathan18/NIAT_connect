function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('ADMIN', 'STUDENT')),
      status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'INACTIVE')),
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      role_name TEXT NOT NULL,
      permissions TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS student_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      current_education TEXT,
      class_12_passing_year INTEGER,
      class_12_percentage REAL,
      city TEXT,
      state TEXT,
      interested_program TEXT,
      dream_career TEXT,
      application_stage TEXT DEFAULT 'INQUIRY',
      counselling_preferred_time TEXT,
      parent_name TEXT,
      parent_phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS counsellors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL,
      specialization TEXT,
      active_leads_count INTEGER DEFAULT 0,
      rating REAL DEFAULT 4.8,
      status TEXT DEFAULT 'AVAILABLE',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      current_education TEXT NOT NULL,
      class_12_passing_year INTEGER NOT NULL,
      class_12_percentage REAL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      interested_program TEXT NOT NULL,
      lead_source TEXT NOT NULL,
      admission_interest_level TEXT NOT NULL DEFAULT 'Medium',
      counselling_status TEXT NOT NULL DEFAULT 'New',
      assigned_counsellor_id INTEGER,
      follow_up_date TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (assigned_counsellor_id) REFERENCES counsellors(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS lead_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL UNIQUE,
      score INTEGER NOT NULL DEFAULT 50,
      ai_classification TEXT NOT NULL CHECK(ai_classification IN ('Hot', 'Warm', 'Cold', 'Unqualified')),
      is_manually_overridden INTEGER DEFAULT 0,
      override_reason TEXT,
      breakdown_json TEXT,
      evaluated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS lead_activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL,
      activity_type TEXT NOT NULL,
      description TEXT NOT NULL,
      performed_by TEXT DEFAULT 'Admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS follow_ups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL,
      counsellor_id INTEGER,
      scheduled_date TEXT NOT NULL,
      scheduled_time TEXT,
      contact_method TEXT DEFAULT 'Phone',
      status TEXT DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'COMPLETED', 'CANCELLED', 'RESCHEDULED')),
      outcome_notes TEXT,
      reminder_sent INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
      FOREIGN KEY (counsellor_id) REFERENCES counsellors(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      event_date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      location_type TEXT NOT NULL DEFAULT 'Online',
      venue_or_link TEXT NOT NULL,
      speaker_name TEXT,
      speaker_title TEXT,
      capacity INTEGER DEFAULT 100,
      status TEXT DEFAULT 'PUBLISHED' CHECK(status IN ('DRAFT', 'PUBLISHED', 'COMPLETED', 'CANCELLED')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS event_registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      ticket_number TEXT UNIQUE,
      registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      attended INTEGER DEFAULT 0,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      target_role TEXT DEFAULT 'ALL' CHECK(target_role IN ('ALL', 'ADMIN', 'STUDENT')),
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'INFO',
      link TEXT,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS chatbot_conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT DEFAULT 'Admission Query',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS chatbot_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL,
      sender TEXT NOT NULL CHECK(sender IN ('user', 'assistant')),
      message TEXT NOT NULL,
      sources_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversation_id) REFERENCES chatbot_conversations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS knowledge_base_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      content TEXT NOT NULL,
      tags TEXT,
      source_reference TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ==========================================
    -- NIAT CONNECT 2.0 EXPANSION TABLES
    -- ==========================================

    -- 1. Student Referral Engine & Codes
    CREATE TABLE IF NOT EXISTS referral_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      code TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS student_referrals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      referrer_id INTEGER NOT NULL,
      referred_user_id INTEGER,
      referral_code TEXT NOT NULL,
      referred_name TEXT NOT NULL,
      referred_email TEXT NOT NULL,
      referred_phone TEXT NOT NULL,
      status TEXT DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'APPROVED', 'REJECTED')),
      points_awarded INTEGER DEFAULT 0,
      notes TEXT,
      rejection_reason TEXT,
      verified_by INTEGER,
      verified_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (referred_user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS referral_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    -- 2. Centralized Reward Points Transaction Ledger
    CREATE TABLE IF NOT EXISTS reward_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      transaction_type TEXT NOT NULL CHECK(transaction_type IN ('Referral Reward', 'Game Reward', 'Store Redemption', 'Refund', 'Admin Adjustment')),
      points INTEGER NOT NULL,
      description TEXT NOT NULL,
      reference_id TEXT,
      status TEXT DEFAULT 'COMPLETED' CHECK(status IN ('COMPLETED', 'PENDING', 'CANCELLED')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 3. NIAT Swag Store & Redemptions
    CREATE TABLE IF NOT EXISTS swag_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Apparel',
      points_required INTEGER NOT NULL,
      stock INTEGER NOT NULL DEFAULT 10,
      image_url TEXT NOT NULL,
      status TEXT DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'INACTIVE')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS swag_redemptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      points_spent INTEGER NOT NULL,
      status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending', 'Approved', 'Processing', 'Ready for Collection', 'Delivered', 'Rejected')),
      shipping_address TEXT,
      contact_phone TEXT,
      size_preference TEXT,
      admin_notes TEXT,
      rejection_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES swag_products(id) ON DELETE CASCADE
    );

    -- 4. Daily AI Facts
    CREATE TABLE IF NOT EXISTS ai_facts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      explanation TEXT NOT NULL,
      interesting_example TEXT NOT NULL,
      category TEXT NOT NULL,
      fact_date TEXT NOT NULL,
      source_link TEXT,
      source_title TEXT,
      image_url TEXT,
      is_published INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ai_fact_bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      fact_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, fact_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (fact_id) REFERENCES ai_facts(id) ON DELETE CASCADE
    );

    -- 5. Puzzle Games & Gamification
    CREATE TABLE IF NOT EXISTS puzzle_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_type TEXT NOT NULL CHECK(game_type IN ('brain_teaser', 'coding_puzzle', 'math_challenge', 'logical_reasoning', 'memory_game', 'tech_quiz')),
      title TEXT NOT NULL,
      question_text TEXT NOT NULL,
      code_snippet TEXT,
      options_json TEXT NOT NULL,
      correct_option_index INTEGER NOT NULL,
      explanation TEXT NOT NULL,
      difficulty TEXT NOT NULL CHECK(difficulty IN ('Easy', 'Medium', 'Hard')),
      points_reward INTEGER NOT NULL DEFAULT 10,
      is_daily_challenge INTEGER DEFAULT 0,
      challenge_date TEXT,
      is_published INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS puzzle_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      puzzle_id INTEGER NOT NULL,
      selected_option_index INTEGER NOT NULL,
      is_correct INTEGER NOT NULL,
      points_awarded INTEGER NOT NULL DEFAULT 0,
      attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (puzzle_id) REFERENCES puzzle_questions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS student_streaks (
      user_id INTEGER PRIMARY KEY,
      current_streak INTEGER DEFAULT 0,
      longest_streak INTEGER DEFAULT 0,
      last_attempt_date TEXT,
      total_games_played INTEGER DEFAULT 0,
      total_correct INTEGER DEFAULT 0,
      total_game_points INTEGER DEFAULT 0,
      achievements_json TEXT DEFAULT '[]',
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 6. Upgraded Event Bookmarks
    CREATE TABLE IF NOT EXISTS event_bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      event_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, event_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    );

    -- Performance Indexes
    CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
    CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
    CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(counselling_status);
    CREATE INDEX IF NOT EXISTS idx_leads_counsellor ON leads(assigned_counsellor_id);
    CREATE INDEX IF NOT EXISTS idx_lead_scores_classification ON lead_scores(ai_classification);
    CREATE INDEX IF NOT EXISTS idx_follow_ups_lead ON follow_ups(lead_id);
    CREATE INDEX IF NOT EXISTS idx_follow_ups_date ON follow_ups(scheduled_date);
    CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
    CREATE INDEX IF NOT EXISTS idx_registrations_event ON event_registrations(event_id);
    CREATE INDEX IF NOT EXISTS idx_registrations_student ON event_registrations(student_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_knowledge_category ON knowledge_base_documents(category);

    -- New Indexes for NIAT 2.0
    CREATE INDEX IF NOT EXISTS idx_referral_code ON referral_codes(code);
    CREATE INDEX IF NOT EXISTS idx_student_referrals_referrer ON student_referrals(referrer_id);
    CREATE INDEX IF NOT EXISTS idx_student_referrals_status ON student_referrals(status);
    CREATE INDEX IF NOT EXISTS idx_reward_transactions_student ON reward_transactions(student_id);
    CREATE INDEX IF NOT EXISTS idx_reward_transactions_type ON reward_transactions(transaction_type);
    CREATE INDEX IF NOT EXISTS idx_swag_redemptions_student ON swag_redemptions(student_id);
    CREATE INDEX IF NOT EXISTS idx_swag_redemptions_status ON swag_redemptions(status);
    CREATE INDEX IF NOT EXISTS idx_ai_facts_date ON ai_facts(fact_date);
    CREATE INDEX IF NOT EXISTS idx_ai_facts_category ON ai_facts(category);
    CREATE INDEX IF NOT EXISTS idx_puzzle_type ON puzzle_questions(game_type);
    CREATE INDEX IF NOT EXISTS idx_puzzle_attempts_user ON puzzle_attempts(user_id);
    CREATE INDEX IF NOT EXISTS idx_event_bookmarks_user ON event_bookmarks(user_id);
  `);

  // Migrations for databases created before columns existed
  const leadColumns = db.prepare('PRAGMA table_info(leads)').all().map(c => c.name);
  if (!leadColumns.includes('class_12_percentage')) {
    db.exec('ALTER TABLE leads ADD COLUMN class_12_percentage REAL');
  }

  const eventColumns = db.prepare('PRAGMA table_info(events)').all().map(c => c.name);
  if (!eventColumns.includes('organizer')) {
    db.exec("ALTER TABLE events ADD COLUMN organizer TEXT DEFAULT 'NIAT'");
  }
  if (!eventColumns.includes('registration_url')) {
    db.exec('ALTER TABLE events ADD COLUMN registration_url TEXT');
  }
  if (!eventColumns.includes('registration_deadline')) {
    db.exec('ALTER TABLE events ADD COLUMN registration_deadline TEXT');
  }
  if (!eventColumns.includes('eligibility_criteria')) {
    db.exec('ALTER TABLE events ADD COLUMN eligibility_criteria TEXT');
  }
  if (!eventColumns.includes('banner_url')) {
    db.exec('ALTER TABLE events ADD COLUMN banner_url TEXT');
  }
  if (!eventColumns.includes('is_featured')) {
    db.exec('ALTER TABLE events ADD COLUMN is_featured INTEGER DEFAULT 0');
  }
  if (!eventColumns.includes('source_verified')) {
    db.exec('ALTER TABLE events ADD COLUMN source_verified TEXT');
  }
  if (!eventColumns.includes('last_verified_at')) {
    db.exec('ALTER TABLE events ADD COLUMN last_verified_at TEXT');
  }
}

module.exports = { initSchema };
