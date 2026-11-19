const express = require('express');
const { db } = require('../db');
const { verifyToken, requireStudent } = require('../middleware/auth');
const { runAgent } = require('../services/agent');
const { registerForEvent, requestCounselling } = require('../services/studentActions');

const router = express.Router();

// Enforce student privileges
router.use(verifyToken, requireStudent);

// ==========================================
// 1. STUDENT DASHBOARD & PROFILE
// ==========================================

router.get('/dashboard', (req, res) => {
  const studentId = req.user.id;

  try {
    const user = db.prepare('SELECT id, name, email, phone, avatar_url, created_at FROM users WHERE id = ?').get(studentId);
    const profile = db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(studentId);

    // Registered events
    const myEvents = db.prepare(`
      SELECT 
        e.*, er.ticket_number, er.registered_at
      FROM event_registrations er
      JOIN events e ON er.event_id = e.id
      WHERE er.student_id = ?
      ORDER BY e.event_date ASC
    `).all(studentId);

    // Upcoming public events
    const upcomingEvents = db.prepare(`
      SELECT * FROM events 
      WHERE status = 'PUBLISHED' 
      ORDER BY event_date ASC 
      LIMIT 4
    `).all();

    // Assigned Counsellor
    const counsellor = db.prepare(`
      SELECT c.name, c.email, c.phone, c.specialization, c.rating 
      FROM counsellors c 
      LIMIT 1
    `).get();

    // Announcements
    const announcements = [
      {
        id: 1,
        title: 'Phase 1 B.Tech Applications Closing Soon',
        date: '2026-11-25',
        type: 'URGENT',
        description: 'Priority scholarship applications for the 2026 intake close on April 30. Complete your profile verification early.'
      },
      {
        id: 2,
        title: 'NSAT Mock Examination Schedule Announced',
        date: '2026-12-01',
        type: 'EXAM',
        description: 'Prepare with official sample questions covering logic and algorithms. Accessible via your student resources.'
      },
      {
        id: 3,
        title: 'Young Innovator Scholarship Open',
        date: '2026-12-10',
        type: 'SCHOLARSHIP',
        description: 'Submit your open-source projects or GitHub profiles for up to 100% tuition fee waiver awards.'
      }
    ];

    return res.json({
      user,
      profile,
      myEvents,
      upcomingEvents,
      counsellor,
      announcements
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load student dashboard: ' + err.message });
  }
});

router.get('/profile', (req, res) => {
  const studentId = req.user.id;
  try {
    const user = db.prepare('SELECT id, name, email, phone, avatar_url, created_at FROM users WHERE id = ?').get(studentId);
    const profile = db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(studentId);
    return res.json({ user, profile });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load profile: ' + err.message });
  }
});

router.put('/profile', (req, res) => {
  const studentId = req.user.id;
  const {
    name, phone, current_education, class_12_passing_year,
    class_12_percentage, city, state, interested_program,
    dream_career, parent_name, parent_phone, counselling_preferred_time
  } = req.body;

  try {
    if (name || phone) {
      db.prepare(`
        UPDATE users SET 
          name = COALESCE(?, name),
          phone = COALESCE(?, phone),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(name || null, phone || null, studentId);
    }

    db.prepare(`
      UPDATE student_profiles SET
        current_education = COALESCE(?, current_education),
        class_12_passing_year = COALESCE(?, class_12_passing_year),
        class_12_percentage = COALESCE(?, class_12_percentage),
        city = COALESCE(?, city),
        state = COALESCE(?, state),
        interested_program = COALESCE(?, interested_program),
        dream_career = COALESCE(?, dream_career),
        parent_name = COALESCE(?, parent_name),
        parent_phone = COALESCE(?, parent_phone),
        counselling_preferred_time = COALESCE(?, counselling_preferred_time),
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).run(
      current_education || null,
      class_12_passing_year ? parseInt(class_12_passing_year, 10) : null,
      class_12_percentage ? parseFloat(class_12_percentage) : null,
      city || null,
      state || null,
      interested_program || null,
      dream_career || null,
      parent_name || null,
      parent_phone || null,
      counselling_preferred_time || null,
      studentId
    );

    return res.json({ message: 'Student profile updated successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update profile: ' + err.message });
  }
});

// ==========================================
// 2. EVENTS & CALENDAR (STUDENT PORTAL)
// ==========================================

router.get('/events', (req, res) => {
  const studentId = req.user.id;

  try {
    const events = db.prepare(`
      SELECT 
        e.*,
        (SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = e.id) as registrations_count,
        CASE WHEN (SELECT 1 FROM event_registrations er WHERE er.event_id = e.id AND er.student_id = ?) IS NOT NULL THEN 1 ELSE 0 END as is_registered,
        (SELECT ticket_number FROM event_registrations er WHERE er.event_id = e.id AND er.student_id = ?) as ticket_number
      FROM events e
      WHERE e.status = 'PUBLISHED'
      ORDER BY e.event_date ASC
    `).all(studentId, studentId);

    return res.json({ events });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load events: ' + err.message });
  }
});

router.post('/events/:id/register', (req, res) => {
  try {
    const result = registerForEvent(db, req.user.id, req.params.id);
    if (result.status === 'not_found') {
      return res.status(404).json({ error: 'Event not found or not published' });
    }
    if (result.status === 'already_registered') {
      return res.status(409).json({ error: 'You are already registered for this event.', ticketNumber: result.ticketNumber });
    }
    if (result.status === 'full') {
      return res.status(400).json({ error: 'This event has reached full capacity. Please choose another session or contact admissions.' });
    }

    return res.status(201).json({
      message: 'Registration successful! Your pass has been generated.',
      ticketNumber: result.ticketNumber,
      eventTitle: result.event.title,
      eventDate: result.event.event_date,
      venueOrLink: result.event.venue_or_link
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to register for event: ' + err.message });
  }
});

router.delete('/events/:id/unregister', (req, res) => {
  const studentId = req.user.id;
  const eventId = parseInt(req.params.id, 10);

  try {
    db.prepare('DELETE FROM event_registrations WHERE event_id = ? AND student_id = ?').run(eventId, studentId);
    return res.json({ message: 'Event registration cancelled.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to unregister: ' + err.message });
  }
});

router.get('/my-registrations', (req, res) => {
  const studentId = req.user.id;
  try {
    const registrations = db.prepare(`
      SELECT 
        er.id as registration_id,
        er.ticket_number,
        er.registered_at,
        e.*
      FROM event_registrations er
      JOIN events e ON er.event_id = e.id
      WHERE er.student_id = ?
      ORDER BY e.event_date ASC
    `).all(studentId);

    return res.json({ registrations });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load your event registrations: ' + err.message });
  }
});

// ==========================================
// 3. 1-ON-1 COUNSELLING REQUEST
// ==========================================

router.post('/counselling/request', (req, res) => {
  const { preferredDate, preferredTime, topic } = req.body;

  try {
    const result = requestCounselling(db, req.user.id, { preferredDate, preferredTime, topic });
    if (result.status === 'not_found') {
      return res.status(404).json({ error: 'Student account not found' });
    }
    return res.json({
      message: 'Your counselling request has been registered. An admission officer will contact you within 24 hours.'
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to submit counselling request: ' + err.message });
  }
});

// ==========================================
// 4. NIAT AI ADMISSION CHATBOT (RAG)
// ==========================================

router.post('/chat', async (req, res) => {
  const studentId = req.user.id;
  const { message, conversationId, language } = req.body;

  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Message cannot be empty.' });
  }
  const text = message.trim().slice(0, 2000);

  try {
    // 1. Use the given conversation only if it belongs to this student; otherwise start a new one
    let convId = null;
    if (conversationId) {
      const owned = db.prepare('SELECT id FROM chatbot_conversations WHERE id = ? AND user_id = ?').get(conversationId, studentId);
      if (owned) convId = owned.id;
    }
    if (!convId) {
      const convRes = db.prepare(`
        INSERT INTO chatbot_conversations (user_id, title)
        VALUES (?, ?)
      `).run(studentId, text.substring(0, 40) + '...');
      convId = convRes.lastInsertRowid;
    }

    // 2. Previous messages (most recent 10, oldest first) as context
    const history = db.prepare(`
      SELECT sender, message FROM chatbot_messages
      WHERE conversation_id = ? ORDER BY id DESC LIMIT 10
    `).all(convId).reverse();

    // 3. Save user message
    db.prepare(`
      INSERT INTO chatbot_messages (conversation_id, sender, message)
      VALUES (?, 'user', ?)
    `).run(convId, text);

    // 4. Run the admission agent (tool calling + verified knowledge base)
    const knowledgeDocs = db.prepare('SELECT * FROM knowledge_base_documents WHERE is_active = 1').all();
    const result = await runAgent({ db, user: req.user, message: text, history, language, knowledgeDocs });

    // 5. Save assistant message
    db.prepare(`
      INSERT INTO chatbot_messages (conversation_id, sender, message, sources_json)
      VALUES (?, 'assistant', ?, ?)
    `).run(convId, result.reply, JSON.stringify(result.sources));
    db.prepare('UPDATE chatbot_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(convId);

    return res.json({
      conversationId: convId,
      reply: result.reply,
      sources: result.sources,
      toolCalls: result.toolCalls.map(c => ({ name: c.name, label: c.label, ok: c.ok, isAction: Boolean(c.isAction) })),
      provider: result.provider,
      model: result.model,
      language: result.language,
      isGeminiPowered: result.provider === 'gemini',
      suggestCounselling: result.suggestCounselling || false
    });
  } catch (err) {
    console.error('Chat agent error:', err);
    return res.status(500).json({ error: 'Chatbot service error. Please try again.' });
  }
});

router.get('/chat/history', (req, res) => {
  const studentId = req.user.id;

  try {
    const conversation = db.prepare(`
      SELECT * FROM chatbot_conversations WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1
    `).get(studentId);

    if (!conversation) {
      return res.json({ conversation: null, messages: [] });
    }

    const messages = db.prepare(`
      SELECT id, sender, message, sources_json, created_at
      FROM chatbot_messages
      WHERE conversation_id = ?
      ORDER BY created_at ASC
    `).all(conversation.id);

    const formattedMessages = messages.map(m => ({
      id: m.id,
      sender: m.sender,
      message: m.message,
      sources: m.sources_json ? JSON.parse(m.sources_json) : [],
      created_at: m.created_at
    }));

    return res.json({
      conversation,
      messages: formattedMessages
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load chat history: ' + err.message });
  }
});

router.delete('/chat/clear', (req, res) => {
  const studentId = req.user.id;
  try {
    db.prepare('DELETE FROM chatbot_conversations WHERE user_id = ?').run(studentId);
    return res.json({ message: 'Conversation history cleared successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to clear chat: ' + err.message });
  }
});

// ==========================================
// 5. FREQUENTLY ASKED QUESTIONS
// ==========================================

router.get('/faqs', (req, res) => {
  try {
    const faqs = db.prepare(`
      SELECT id, title, category, content, source_reference
      FROM knowledge_base_documents
      WHERE is_active = 1
      ORDER BY category, id
    `).all();

    return res.json({ faqs });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load FAQs: ' + err.message });
  }
});

module.exports = router;
