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
  `);

  // Migrations for databases created before a column existed
  const leadColumns = db.prepare('PRAGMA table_info(leads)').all().map(c => c.name);
  if (!leadColumns.includes('class_12_percentage')) {
    db.exec('ALTER TABLE leads ADD COLUMN class_12_percentage REAL');
  }
}

module.exports = { initSchema };
