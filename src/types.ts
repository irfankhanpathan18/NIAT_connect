// ========================================================
// NIAT Connect – TypeScript Interfaces & Domain Models
// NextGen Institute of Advanced Technology
// ========================================================

export type UserRole = 'ADMIN' | 'STUDENT';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: 'ACTIVE' | 'INACTIVE';
  avatar_url?: string;
  created_at?: string;
  profile?: StudentProfile | null;
}

export type ApplicationStage =
  | 'INQUIRY'
  | 'APPLICATION_STARTED'
  | 'APTITUDE_SCHEDULED'
  | 'COUNSELLING_COMPLETED'
  | 'DOCUMENT_VERIFIED'
  | 'SEAT_OFFERED'
  | 'ADMITTED';

export interface StudentProfile {
  id: number;
  user_id: number;
  current_education: string;
  class_12_passing_year: number;
  class_12_percentage?: number | null;
  city: string;
  state: string;
  interested_program: string;
  dream_career?: string;
  application_stage: ApplicationStage;
  counselling_preferred_time?: string;
  parent_name?: string;
  parent_phone?: string;
  created_at?: string;
  updated_at?: string;
}

export type AIClassification = 'Hot' | 'Warm' | 'Cold' | 'Unqualified';
export type AdmissionInterest = 'High' | 'Medium' | 'Low';
export type CounsellingStatus =
  | 'New'
  | 'Contacted'
  | 'Counselling Scheduled'
  | 'Counselling Completed'
  | 'Documents Pending'
  | 'Admitted'
  | 'Dropped';

export interface LeadScoreBreakdown {
  factor: string;
  score: number;
  maxScore: number;
  rationale: string;
}

export interface Lead {
  id: number;
  student_name: string;
  email: string;
  phone: string;
  current_education: string;
  class_12_passing_year: number;
  city: string;
  state: string;
  interested_program: string;
  lead_source: string;
  admission_interest_level: AdmissionInterest;
  counselling_status: CounsellingStatus;
  assigned_counsellor_id?: number | null;
  counsellor_name?: string;
  follow_up_date?: string | null;
  notes?: string | null;
  lead_score?: number;
  ai_classification?: AIClassification;
  is_manually_overridden?: number;
  override_reason?: string | null;
  created_at: string;
  updated_at?: string;
  breakdown?: LeadScoreBreakdown[];
}

export interface LeadActivity {
  id: number;
  lead_id: number;
  activity_type: string;
  description: string;
  performed_by: string;
  created_at: string;
}

export interface Counsellor {
  id: number;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  active_leads_count?: number;
  active_leads?: number;
  rating: number;
  status: string;
}

export type FollowUpStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';

export interface FollowUp {
  id: number;
  lead_id: number;
  student_name?: string;
  student_email?: string;
  student_phone?: string;
  interested_program?: string;
  lead_score?: number;
  ai_classification?: AIClassification;
  counsellor_id?: number | null;
  counsellor_name?: string;
  scheduled_date: string;
  scheduled_time?: string;
  contact_method: string;
  status: FollowUpStatus;
  outcome_notes?: string;
  reminder_sent?: number;
  created_at?: string;
}

export type EventCategory =
  | 'NIAT Admission Webinar'
  | 'Campus Orientation'
  | 'Parent Counselling Session'
  | 'Admission Guidance Session'
  | 'Technology Workshop'
  | 'Student Interaction Session';

export interface EventItem {
  id: number;
  title: string;
  category: EventCategory | string;
  description: string;
  event_date: string;
  start_time: string;
  end_time: string;
  location_type: 'Online' | 'Campus';
  venue_or_link: string;
  speaker_name?: string;
  speaker_title?: string;
  capacity: number;
  status: 'DRAFT' | 'PUBLISHED' | 'COMPLETED' | 'CANCELLED';
  registrations_count?: number;
  is_registered?: number;
  ticket_number?: string;
  created_at?: string;
}

export interface EventRegistration {
  id: number;
  event_id: number;
  student_id: number;
  ticket_number: string;
  registered_at: string;
  attended: number;
  student_name?: string;
  student_email?: string;
  student_phone?: string;
  city?: string;
  interested_program?: string;
}

export interface NotificationItem {
  id: number;
  user_id?: number | null;
  target_role: 'ALL' | 'ADMIN' | 'STUDENT';
  title: string;
  message: string;
  type: 'EVENT' | 'ADMISSION' | 'REMINDER' | 'COUNSELLING' | 'ALERT' | 'INFO';
  link?: string;
  is_read: number;
  created_at: string;
}

export interface ChatSource {
  title: string;
  reference: string;
  category?: string;
}

export interface AgentToolCall {
  name: string;
  label: string;
  ok: boolean;
  isAction?: boolean;
}

export interface ChatMessage {
  id?: number;
  sender: 'user' | 'assistant';
  message: string;
  sources?: ChatSource[];
  created_at?: string;
  suggestCounselling?: boolean;
  toolCalls?: AgentToolCall[];
  provider?: 'claude' | 'gemini' | 'offline' | 'none';
}

export interface KnowledgeDoc {
  id: number;
  title: string;
  category: string;
  content: string;
  tags?: string;
  source_reference: string;
  is_active: number;
  updated_at?: string;
}

export interface AISummary {
  totalLeads: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  unqualifiedLeads: number;
  conversionRate: string | number;
  sourceStats: Array<{
    lead_source: string;
    total: number;
    hot_count: number;
    avg_score: number;
  }>;
  statusStats: Array<{
    status: string;
    count: number;
  }>;
}

export interface AnalyticsData {
  funnel: Array<{ name: string; count: number }>;
  sources: Array<{ source: string; count: number }>;
  classifications: Array<{ name: string; value: number }>;
  programs: Array<{ program: string; count: number }>;
  counsellors: Array<{
    id: number;
    name: string;
    specialization: string;
    rating: number;
    assigned_leads: number;
    converted_leads: number;
    hot_leads: number;
  }>;
  trends: Array<{
    date: string;
    leads: number;
    hot: number;
    conversions: number;
  }>;
}
