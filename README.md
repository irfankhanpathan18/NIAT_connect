# NIAT Connect – AI-Powered Student & Admission Management Portal
**NextGen Institute of Advanced Technology (NIAT)**

![NIAT Connect Architecture](https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&auto=format&fit=crop&q=80)

---

## 🏛️ Executive Summary

**NIAT Connect** is a modern, responsive, enterprise-grade Higher Education Management Platform engineered for **NextGen Institute of Advanced Technology (NIAT)**. 

The platform features two strictly segregated, role-isolated operational environments:
1. **Admin Portal (`/admin/login`)**: Full-lifecycle Lead Management CRM, AI-powered lead qualification & intent scoring engine (0–100), visual analytics funnels, follow-up scheduler, institutional event publisher, and verified knowledge base manager.
2. **Student Portal (`/login` / `/register`)**: Frictionless onboarding, 5-stage admission progress milestone tracker, interactive event calendar with 1-click registration passes, profile manager, verified admission handbook, and the **NIAT AI Assistant** powered by Retrieval-Augmented Generation (RAG).

---

## ⚡ Tech Stack Architecture

| Layer | Technology | Key Capabilities |
| :--- | :--- | :--- |
| **Frontend UI** | React 19 + TypeScript | Modular component design, typed interfaces, interactive drawers & modals |
| **Styling** | Tailwind CSS v4 | Deep institutional navy blue palette (`#0f172a`, `#1e3a8a`, `#2563eb`), glassmorphism, responsive |
| **Data Visualization** | Recharts | 7-day intake velocity, multi-step conversion funnel, source breakdown, counsellor ratings |
| **Backend API** | Node.js + Express.js | Structured RESTful architecture with role middleware, validation, error handling |
| **Database Engine** | SQL.js / SQLite / PostgreSQL / Supabase | 14 relational tables, foreign key constraints, indexes, automatic disk persistence (`niat.db`) + `supabase_schema.sql` |
| **AI Lead Scoring** | Custom Weighted Heuristic Engine | Transparent 6-factor scoring model (0–100) incl. PCM eligibility & Class 12 marks, Hot/Warm/Cold/Unqualified segmentation, human override |
| **AI Chatbot** | Verified RAG + Google Gemini API | Keyword + synonym retrieval over the verified handbook, conversation memory, official citations, counsellor escalation fallback |

---

## 🔑 Pre-Seeded Demo Credentials

Both portals include **1-Click Auto-Fill Demo Credentials** on their respective login screens for instant evaluator testing:

### 1. Admission Administrator
- **Portal URL**: `/admin/login`
- **Email**: `admin@niat.edu.in`
- **Password**: `Admin@123`
- **Role**: `ADMIN` (Full access to CRM, AI Lead Filtration, Analytics, Events, Knowledge Base)

### 2. Prospective Students
- **Portal URL**: `/login` (or `/student/login`)
- **Demo Account 1**: `rahul.sharma@gmail.com` / `Student@123` (Class 12 PCM, B.Tech CSE (AI & ML))
- **Demo Account 2**: `priya.patel@gmail.com` / `Student@123` (B.Tech Data Science & Analytics)
- **Demo Account 3**: `ananya.verma@gmail.com` / `Student@123` (B.Tech Software Engineering)
- **Role**: `STUDENT` (Application tracker, Calendar tickets, AI Chatbot, 1-on-1 Counselling)

---

## 📊 Database Schema (14 Relational Tables)

1. `users`: Credentials, roles (`ADMIN` / `STUDENT`), status, profile avatar.
2. `user_roles`: Role-based access control records and permissions.
3. `student_profiles`: 12th marks, passing year, city/state, dream career, application stage (`INQUIRY` -> `ADMITTED`).
4. `counsellors`: Faculty advisors, specialization, caseload, ratings.
5. `leads`: Prospective students, interest levels, counselling status, source, notes.
6. `lead_scores`: AI score (0-100), segment (`Hot`, `Warm`, `Cold`, `Unqualified`), breakdown JSON, human override records.
7. `lead_activities`: Immutable audit log for status changes, notes, follow-up scheduling.
8. `follow_ups`: Scheduled student phone calls, video counselling sessions, reminders.
9. `events`: Institutional webinars, AI masterclasses, parent orientations, capacity, status.
10. `event_registrations`: Confirmed student tickets (`NIAT-EVT-XXXX`) and attendance.
11. `notifications`: Real-time role-targeted alerts for admins and students.
12. `chatbot_conversations`: Persistent student chat sessions.
13. `chatbot_messages`: Chat interactions with citations and metadata.
14. `knowledge_base_documents`: Verified official handbook articles powering RAG semantic search.

*Full Supabase/PostgreSQL native DDL available in `supabase_schema.sql`.*

---

## 🤖 Core AI Modules

### A. Intelligent Lead Qualification Engine
Automatically segments all prospective students:
- **Hot Leads (Score 75–100)**: Immediate intake year, high admission interest, webinar/fair attendance, PCM eligibility match.
- **Warm Leads (Score 45–74)**: Moderate intent requiring follow-up or curriculum guidance.
- **Cold Leads (Score 20–44)**: Early research phase or casual social media inquiry.
- **Unqualified Leads (Score 0–19)**: Does not meet the B.Tech academic requirements (Physics + Mathematics in Class 12, or below the 55% minimum aggregate). These are flagged for human review, never rejected automatically.

| Factor | Max points |
| :--- | :--- |
| Admission interest level | 25 |
| Timeline urgency (passing year vs. current intake cycle) | 20 |
| Counselling & engagement status | 20 |
| Lead source intent | 10 |
| Eligibility & program fit (PCM / diploma / stream) | 15 |
| Academic performance (Class 12 aggregate) | 10 |

The intake year is derived from the current date (the cycle rolls over in August) and can be pinned with `ADMISSION_INTAKE_YEAR`.

> **Institutional Ethical AI Policy**: Embedded in system logic and admin dashboards — AI scores optimize outreach priority and **never automatically disqualify or reject applicants** without human review.

### B. NIAT AI Admission Assistant (RAG Engine)
- Available full-screen (`/student/ai-assistant`) or via floating assistant pill.
- Grounds answers strictly in verified NIAT documents.
- Automatically cites official sources (e.g., `[Source: NIAT Admissions Handbook 2026, Section 2.1]`).
- Retrieval ignores filler words, matches whole words, and maps everyday phrasing to handbook terms (e.g. "cost" → fees, "stay" → hostel). Off-topic questions get an honest "no verified record" answer instead of a random article.
- Integrates optional `GEMINI_API_KEY` for generative answers (model set by `GEMINI_MODEL`, default `gemini-2.5-flash`) using the last 10 messages as context, with deterministic verified RAG fallback.
- Offers 1-click **Connect with Human Counsellor** escalation when an inquiry exceeds verified records.

### C. NIAT AI Admission Agent (tool calling)
The assistant is an **agent**, not just a chatbot: the model decides which tools to call, runs them for the signed-in student, and explains the result. Every action shows up in the chat as an "Agent actions" chip.

| Tool | What it does | Type |
| :--- | :--- | :--- |
| `search_knowledge_base` | Searches the verified handbook | Read |
| `check_eligibility` | Checks PCM stream, marks and passing year against the B.Tech rules (uses the profile when details are missing) | Read |
| `list_upcoming_events` | Lists upcoming events with seats left | Read |
| `register_for_event` | Registers the student and issues a ticket | **Action** |
| `get_my_application_status` | Application stage, academics and tickets | Read |
| `request_counselling` | Books a counsellor and notifies admins | **Action** |
| `lookup_pincode` | India Post pincode directory (public data) | Public API |
| `analyze_github_profile` | GitHub public profile review for the Young Innovator Scholarship (public data) | Public API |

**LLM providers** (picked automatically, or forced with `AGENT_PROVIDER=claude|gemini|offline`):
1. **Claude** – when `ANTHROPIC_API_KEY` is set. Uses the official `@anthropic-ai/sdk` tool runner (`CLAUDE_MODEL`, default `claude-opus-5-5`; `CLAUDE_EFFORT`, default `low`) with server-side refusal fallback enabled.
2. **Gemini** – when `GEMINI_API_KEY` is set. Function-calling loop over the Gemini REST API.
3. **Offline** – no key needed. A rule-based planner calls the same tools, so registration, eligibility checks and lookups still work in a demo. If an LLM call fails, the agent falls back to this.

### D. Multilingual (English, हिन्दी, தமிழ், తెలుగు, ಕನ್ನಡ, മലയാളം)
- Language picker in the assistant, remembered per browser; the floating assistant uses the same choice.
- The language is also detected from the script of the message, so a student can just type in Tamil or Telugu.
- With an LLM, replies are written in the student's language. Offline, fixed replies are translated and handbook content is shown in English with a note.
- Native-language keywords (e.g. கட்டணம், ఫీజు, छात्रवृत्ति) are mapped to handbook terms so search works in every language.
- **Voice input** through the browser's Web Speech API in all six languages (Chrome/Edge).

### E. Public data integrations
- **India Post** (`api.postalpincode.in`): the registration form auto-fills city and state from a pincode (`GET /api/public/pincode/:pincode`), and the agent can look up pincodes.
- **GitHub** (`api.github.com`): the agent reviews a student's public repositories, languages, stars and recent activity and gives an indicative readiness score for the Young Innovator Scholarship. Set `GITHUB_TOKEN` to raise the rate limit (60 requests/hour without it).
- Responses are cached for an hour, requests time out after 8 seconds, and failures are reported politely instead of breaking the chat.

---

## 🚀 Running the Project Locally

```bash
# 1. Navigate to project directory
cd ambassador-crm-portal

# 2. Install dependencies
npm install

# 3. Start both Node Express Backend (port 5000) and Vite Frontend (port 5173)
npm run dev

# Run the AI service tests
npm test

# 4. Access in browser:
# Student Portal: http://localhost:5173/login
# Admin Portal:   http://localhost:5173/admin/login
```
