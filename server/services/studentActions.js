// ========================================================
// NIAT Connect – Student actions shared by the REST API and the AI agent.
// Every function acts only on the given studentId.
// ========================================================

const crypto = require('crypto');

function generateTicketNumber(eventId) {
  return `NIAT-${eventId}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

function listUpcomingEvents(db, studentId, { category, limit = 8 } = {}) {
  const params = [studentId];
  let sql = `
    SELECT
      e.id, e.title, e.category, e.event_date, e.start_time, e.end_time,
      e.location_type, e.venue_or_link, e.speaker_name, e.capacity,
      (SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = e.id) AS registrations_count,
      (SELECT ticket_number FROM event_registrations er WHERE er.event_id = e.id AND er.student_id = ?) AS my_ticket
    FROM events e
    WHERE e.status = 'PUBLISHED' AND e.event_date >= date('now')
  `;
  if (category) {
    sql += ' AND (LOWER(e.category) LIKE ? OR LOWER(e.title) LIKE ?)';
    const like = `%${String(category).toLowerCase()}%`;
    params.push(like, like);
  }
  sql += ' ORDER BY e.event_date ASC LIMIT ?';
  params.push(Math.max(1, Math.min(20, limit)));

  return db.prepare(sql).all(params).map(e => ({
    id: e.id,
    title: e.title,
    category: e.category,
    date: e.event_date,
    time: `${e.start_time} - ${e.end_time}`,
    mode: e.location_type,
    venueOrLink: e.venue_or_link,
    speaker: e.speaker_name,
    seatsLeft: Math.max(0, (e.capacity || 0) - (e.registrations_count || 0)),
    alreadyRegistered: Boolean(e.my_ticket),
    ticketNumber: e.my_ticket || null
  }));
}

/**
 * Registers a student for a published event.
 * @returns {{ status: 'registered'|'already_registered'|'full'|'not_found', event?, ticketNumber? }}
 */
function registerForEvent(db, studentId, rawEventId) {
  const eventId = parseInt(rawEventId, 10);
  const event = Number.isNaN(eventId)
    ? null
    : db.prepare("SELECT * FROM events WHERE id = ? AND status = 'PUBLISHED'").get(eventId);
  if (!event) return { status: 'not_found' };

  const existing = db.prepare('SELECT ticket_number FROM event_registrations WHERE event_id = ? AND student_id = ?').get(eventId, studentId);
  if (existing) return { status: 'already_registered', event, ticketNumber: existing.ticket_number };

  const regCount = db.prepare('SELECT COUNT(*) as count FROM event_registrations WHERE event_id = ?').get(eventId).count;
  if (regCount >= event.capacity) return { status: 'full', event };

  const ticketNumber = generateTicketNumber(eventId);
  db.prepare('INSERT INTO event_registrations (event_id, student_id, ticket_number) VALUES (?, ?, ?)').run(eventId, studentId, ticketNumber);

  db.prepare(`
    INSERT INTO notifications (user_id, target_role, title, message, type, link)
    VALUES (?, 'STUDENT', 'Event Registration Confirmed!', ?, 'EVENT', '/student/calendar')
  `).run(studentId, `You are confirmed for "${event.title}". Ticket: ${ticketNumber}.`);

  return { status: 'registered', event, ticketNumber };
}

function requestCounselling(db, studentId, { preferredDate, preferredTime, topic } = {}) {
  const user = db.prepare('SELECT name, email FROM users WHERE id = ?').get(studentId);
  if (!user) return { status: 'not_found' };

  db.prepare(`
    UPDATE student_profiles SET
      application_stage = 'COUNSELLING_COMPLETED',
      counselling_preferred_time = ?
    WHERE user_id = ?
  `).run(preferredTime || 'Preferred Evening', studentId);

  db.prepare(`
    INSERT INTO notifications (user_id, target_role, title, message, type, link)
    VALUES (NULL, 'ADMIN', 'New Student Counselling Requested', ?, 'COUNSELLING', '/admin/follow-ups')
  `).run(`Student ${user.name} (${user.email}) requested counselling on ${preferredDate || 'Upcoming Date'}. Topic: ${topic || 'General Admission Guidance'}.`);

  db.prepare(`
    INSERT INTO notifications (user_id, target_role, title, message, type, link)
    VALUES (?, 'STUDENT', 'Counselling Request Received', 'An authorized NIAT Admission Counsellor has been assigned to your profile and will connect with you.', 'INFO', '/student/dashboard')
  `).run(studentId);

  return { status: 'requested', preferredDate: preferredDate || null, preferredTime: preferredTime || null, topic: topic || 'General Admission Guidance' };
}

function getApplicationStatus(db, studentId) {
  const user = db.prepare('SELECT name, email FROM users WHERE id = ?').get(studentId);
  const profile = db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(studentId);
  const registrations = db.prepare(`
    SELECT e.id, e.title, e.event_date, er.ticket_number
    FROM event_registrations er JOIN events e ON er.event_id = e.id
    WHERE er.student_id = ? ORDER BY e.event_date ASC
  `).all(studentId);

  return {
    name: user ? user.name : null,
    applicationStage: profile ? profile.application_stage : null,
    interestedProgram: profile ? profile.interested_program : null,
    currentEducation: profile ? profile.current_education : null,
    class12Percentage: profile ? profile.class_12_percentage : null,
    class12PassingYear: profile ? profile.class_12_passing_year : null,
    city: profile ? profile.city : null,
    state: profile ? profile.state : null,
    counsellingPreferredTime: profile ? profile.counselling_preferred_time : null,
    eventRegistrations: registrations.map(r => ({ eventId: r.id, title: r.title, date: r.event_date, ticketNumber: r.ticket_number }))
  };
}

module.exports = {
  listUpcomingEvents,
  registerForEvent,
  requestCounselling,
  getApplicationStatus,
  generateTicketNumber
};
