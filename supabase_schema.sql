-- ========================================================
-- NIAT Connect – PostgreSQL & Supabase Database Schema
-- NextGen Institute of Advanced Technology
-- ========================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50),
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'STUDENT')),
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. User Roles Table
CREATE TABLE IF NOT EXISTS user_roles (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_name VARCHAR(50) NOT NULL,
  permissions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Student Profiles Table
CREATE TABLE IF NOT EXISTS student_profiles (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  current_education VARCHAR(100),
  class_12_passing_year INT,
  class_12_percentage NUMERIC(5,2),
  city VARCHAR(100),
  state VARCHAR(100),
  interested_program VARCHAR(255),
  dream_career VARCHAR(255),
  application_stage VARCHAR(50) DEFAULT 'INQUIRY',
  counselling_preferred_time VARCHAR(100),
  parent_name VARCHAR(255),
  parent_phone VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Counsellors Table
CREATE TABLE IF NOT EXISTS counsellors (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50) NOT NULL,
  specialization VARCHAR(255),
  active_leads_count INT DEFAULT 0,
  rating NUMERIC(3,2) DEFAULT 4.80,
  status VARCHAR(50) DEFAULT 'AVAILABLE',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Leads Table
CREATE TABLE IF NOT EXISTS leads (
  id BIGSERIAL PRIMARY KEY,
  student_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  current_education VARCHAR(100) NOT NULL,
  class_12_passing_year INT NOT NULL,
  class_12_percentage NUMERIC(5,2),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  interested_program VARCHAR(255) NOT NULL,
  lead_source VARCHAR(100) NOT NULL,
  admission_interest_level VARCHAR(20) NOT NULL DEFAULT 'Medium',
  counselling_status VARCHAR(50) NOT NULL DEFAULT 'New',
  assigned_counsellor_id BIGINT REFERENCES counsellors(id) ON DELETE SET NULL,
  follow_up_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Lead Scores Table (AI Qualification Engine)
CREATE TABLE IF NOT EXISTS lead_scores (
  id BIGSERIAL PRIMARY KEY,
  lead_id BIGINT NOT NULL UNIQUE REFERENCES leads(id) ON DELETE CASCADE,
  score INT NOT NULL DEFAULT 50 CHECK (score BETWEEN 0 AND 100),
  ai_classification VARCHAR(20) NOT NULL CHECK (ai_classification IN ('Hot', 'Warm', 'Cold', 'Unqualified')),
  is_manually_overridden INT DEFAULT 0,
  override_reason TEXT,
  breakdown_json JSONB,
  evaluated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Lead Activities Table
CREATE TABLE IF NOT EXISTS lead_activities (
  id BIGSERIAL PRIMARY KEY,
  lead_id BIGINT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  performed_by VARCHAR(100) DEFAULT 'Admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Follow-ups Table
CREATE TABLE IF NOT EXISTS follow_ups (
  id BIGSERIAL PRIMARY KEY,
  lead_id BIGINT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  counsellor_id BIGINT REFERENCES counsellors(id) ON DELETE SET NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time VARCHAR(20),
  contact_method VARCHAR(50) DEFAULT 'Phone',
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'CANCELLED', 'RESCHEDULED')),
  outcome_notes TEXT,
  reminder_sent INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Events Table
CREATE TABLE IF NOT EXISTS events (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  event_date DATE NOT NULL,
  start_time VARCHAR(20) NOT NULL,
  end_time VARCHAR(20) NOT NULL,
  location_type VARCHAR(20) NOT NULL DEFAULT 'Online',
  venue_or_link TEXT NOT NULL,
  speaker_name VARCHAR(255),
  speaker_title VARCHAR(255),
  capacity INT DEFAULT 100,
  status VARCHAR(20) DEFAULT 'PUBLISHED' CHECK (status IN ('DRAFT', 'PUBLISHED', 'COMPLETED', 'CANCELLED')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Event Registrations Table
CREATE TABLE IF NOT EXISTS event_registrations (
  id BIGSERIAL PRIMARY KEY,
  event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  student_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticket_number VARCHAR(100) UNIQUE,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  attended INT DEFAULT 0
);

-- 11. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  target_role VARCHAR(20) DEFAULT 'ALL' CHECK (target_role IN ('ALL', 'ADMIN', 'STUDENT')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'INFO',
  link TEXT,
  is_read INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Chatbot Conversations Table
CREATE TABLE IF NOT EXISTS chatbot_conversations (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) DEFAULT 'Admission Query',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Chatbot Messages Table
CREATE TABLE IF NOT EXISTS chatbot_messages (
  id BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT NOT NULL REFERENCES chatbot_conversations(id) ON DELETE CASCADE,
  sender VARCHAR(20) NOT NULL CHECK (sender IN ('user', 'assistant')),
  message TEXT NOT NULL,
  sources_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Knowledge Base Documents Table (RAG Source)
CREATE TABLE IF NOT EXISTS knowledge_base_documents (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  tags TEXT,
  source_reference VARCHAR(255) NOT NULL,
  is_active INT DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- NIAT CONNECT 2.0 EXPANSION TABLES
-- ==========================================

-- 15. Referral Codes
CREATE TABLE IF NOT EXISTS referral_codes (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Student Referrals
CREATE TABLE IF NOT EXISTS student_referrals (
  id BIGSERIAL PRIMARY KEY,
  referrer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  referral_code VARCHAR(50) NOT NULL,
  referred_name VARCHAR(150) NOT NULL,
  referred_email VARCHAR(150) NOT NULL,
  referred_phone VARCHAR(30) NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  points_awarded INT DEFAULT 0,
  notes TEXT,
  rejection_reason TEXT,
  verified_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Referral Settings
CREATE TABLE IF NOT EXISTS referral_settings (
  key VARCHAR(50) PRIMARY KEY,
  value TEXT NOT NULL
);

-- 18. Reward Transactions Ledger
CREATE TABLE IF NOT EXISTS reward_transactions (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('Referral Reward', 'Game Reward', 'Store Redemption', 'Refund', 'Admin Adjustment')),
  points INT NOT NULL,
  description TEXT NOT NULL,
  reference_id VARCHAR(100),
  status VARCHAR(20) DEFAULT 'COMPLETED' CHECK (status IN ('COMPLETED', 'PENDING', 'CANCELLED')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. Swag Products
CREATE TABLE IF NOT EXISTS swag_products (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'Apparel',
  points_required INT NOT NULL,
  stock INT NOT NULL DEFAULT 10,
  image_url TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. Swag Redemptions
CREATE TABLE IF NOT EXISTS swag_redemptions (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES swag_products(id) ON DELETE CASCADE,
  points_spent INT NOT NULL,
  status VARCHAR(30) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Processing', 'Ready for Collection', 'Delivered', 'Rejected')),
  shipping_address TEXT,
  contact_phone VARCHAR(30),
  size_preference VARCHAR(20),
  admin_notes TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 21. Daily AI Facts
CREATE TABLE IF NOT EXISTS ai_facts (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  explanation TEXT NOT NULL,
  interesting_example TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  fact_date DATE NOT NULL,
  source_link TEXT,
  source_title VARCHAR(255),
  image_url TEXT,
  is_published INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 22. AI Fact Bookmarks
CREATE TABLE IF NOT EXISTS ai_fact_bookmarks (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fact_id BIGINT NOT NULL REFERENCES ai_facts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, fact_id)
);

-- 23. Puzzle Questions
CREATE TABLE IF NOT EXISTS puzzle_questions (
  id BIGSERIAL PRIMARY KEY,
  game_type VARCHAR(50) NOT NULL CHECK (game_type IN ('brain_teaser', 'coding_puzzle', 'math_challenge', 'logical_reasoning', 'memory_game', 'tech_quiz')),
  title VARCHAR(255) NOT NULL,
  question_text TEXT NOT NULL,
  code_snippet TEXT,
  options_json JSONB NOT NULL,
  correct_option_index INT NOT NULL,
  explanation TEXT NOT NULL,
  difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  points_reward INT NOT NULL DEFAULT 10,
  is_daily_challenge INT DEFAULT 0,
  challenge_date DATE,
  is_published INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 24. Puzzle Attempts
CREATE TABLE IF NOT EXISTS puzzle_attempts (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  puzzle_id BIGINT NOT NULL REFERENCES puzzle_questions(id) ON DELETE CASCADE,
  selected_option_index INT NOT NULL,
  is_correct INT NOT NULL,
  points_awarded INT NOT NULL DEFAULT 0,
  attempted_at TIMESTAMPTZ DEFAULT NOW()
);

-- 25. Student Streaks
CREATE TABLE IF NOT EXISTS student_streaks (
  user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_attempt_date DATE,
  total_games_played INT DEFAULT 0,
  total_correct INT DEFAULT 0,
  total_game_points INT DEFAULT 0,
  achievements_json JSONB DEFAULT '[]'::jsonb
);

-- 26. Event Bookmarks
CREATE TABLE IF NOT EXISTS event_bookmarks (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, event_id)
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

CREATE INDEX IF NOT EXISTS idx_referral_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_student_referrals_referrer ON student_referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_reward_transactions_student ON reward_transactions(student_id);
CREATE INDEX IF NOT EXISTS idx_swag_redemptions_student ON swag_redemptions(student_id);
CREATE INDEX IF NOT EXISTS idx_ai_facts_date ON ai_facts(fact_date);
CREATE INDEX IF NOT EXISTS idx_puzzle_type ON puzzle_questions(game_type);

-- Row Level Security (RLS) policies for Supabase
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE swag_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE swag_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_fact_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE puzzle_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE puzzle_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_bookmarks ENABLE ROW LEVEL SECURITY;
