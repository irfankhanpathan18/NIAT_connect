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
