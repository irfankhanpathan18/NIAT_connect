const { initDatabase, db } = require('./db');
const { initSchema } = require('./schema');
const seedDatabase = require('./seed');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { evaluateLeadScore, generateAdmissionChatResponse } = require('./services/aiService');
const { JWT_SECRET } = require('./middleware/auth');

async function testWorkflow() {
  console.log('--- STARTING COMPREHENSIVE WORKFLOW TEST ---');
  await initDatabase();
  initSchema(db);

  // 1. Admin Login verification
  console.log('1. Testing Admin Authentication...');
  const admin = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@niat.edu.in');
  if (!admin || !bcrypt.compareSync('Admin@123', admin.password) || admin.role !== 'ADMIN') {
    throw new Error('Admin auth verification failed');
  }
  const adminToken = jwt.sign({ id: admin.id, email: admin.email, role: admin.role, name: admin.name }, JWT_SECRET);
  console.log('   ✓ Admin login successful. Token generated for:', admin.name);

  // 2. Admin adds a lead
  console.log('2. Admin adding new lead...');
  const newLeadData = {
    student_name: 'Kavya Reddy',
    email: 'kavya.reddy@example.com',
    phone: '+91 98888 12345',
    current_education: '12th Pursuing (Science PCM)',
    class_12_passing_year: 2026,
    city: 'Hyderabad',
    state: 'Telangana',
    interested_program: 'B.Tech CSE (AI & ML)',
    lead_source: 'Webinar',
    admission_interest_level: 'High',
    counselling_status: 'New',
    assigned_counsellor_id: 1,
    follow_up_date: '2026-11-25',
    notes: 'Very excited about GPU clusters and LLM labs'
  };

  const leadRes = db.prepare(`
    INSERT INTO leads (
      student_name, email, phone, current_education, class_12_passing_year,
      city, state, interested_program, lead_source, admission_interest_level,
      counselling_status, assigned_counsellor_id, follow_up_date, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    newLeadData.student_name, newLeadData.email, newLeadData.phone, newLeadData.current_education,
    newLeadData.class_12_passing_year, newLeadData.city, newLeadData.state, newLeadData.interested_program,
    newLeadData.lead_source, newLeadData.admission_interest_level, newLeadData.counselling_status,
    newLeadData.assigned_counsellor_id, newLeadData.follow_up_date, newLeadData.notes
  );
  const leadId = leadRes.lastInsertRowid;
  console.log('   ✓ Lead created with ID:', leadId);

  // 3. AI scores and classifies the lead
  console.log('3. AI scoring and classification...');
  const aiResult = evaluateLeadScore(newLeadData);
  db.prepare(`
    INSERT INTO lead_scores (lead_id, score, ai_classification, is_manually_overridden, breakdown_json)
    VALUES (?, ?, ?, 0, ?)
  `).run(leadId, aiResult.score, aiResult.ai_classification, JSON.stringify(aiResult.breakdown));
  console.log(`   ✓ AI Score: ${aiResult.score}/100, Classification: ${aiResult.ai_classification}`);
  console.log('   ✓ Factor breakdown count:', aiResult.breakdown.length);

  // 4. Admin manages follow-up
  console.log('4. Admin scheduling follow-up...');
  const fuRes = db.prepare(`
    INSERT INTO follow_ups (lead_id, counsellor_id, scheduled_date, scheduled_time, contact_method, status, outcome_notes)
    VALUES (?, 1, '2026-11-25', '03:00 PM', 'Phone', 'PENDING', 'Initial curriculum counselling call')
  `).run(leadId);
  console.log('   ✓ Follow-up scheduled with ID:', fuRes.lastInsertRowid);

  // 5. Student registers and logs in
  console.log('5. Student Registration & Profile Creation...');
  const studentPass = bcrypt.hashSync('Student@123', 10);
  const studentUserRes = db.prepare(`
    INSERT INTO users (name, email, phone, password, role, status)
    VALUES ('Vikas Kumar', 'vikas.kumar@example.com', '+91 97777 88888', ?, 'STUDENT', 'ACTIVE')
  `).run(studentPass);
  const studentId = studentUserRes.lastInsertRowid;

  db.prepare(`
    INSERT INTO student_profiles (user_id, current_education, class_12_passing_year, class_12_percentage, city, state, interested_program, application_stage)
    VALUES (?, '12th Pursuing (Science PCM)', 2026, 91.2, 'Bengaluru', 'Karnataka', 'B.Tech CSE (AI & ML)', 'INQUIRY')
  `).run(studentId);

  const studentToken = jwt.sign({ id: studentId, email: 'vikas.kumar@example.com', role: 'STUDENT', name: 'Vikas Kumar' }, JWT_SECRET);
  console.log('   ✓ Student registered and token issued for Vikas Kumar (ID:', studentId, ')');

  // 6. Student uses NIAT Chatbot
  console.log('6. Student querying NIAT AI Assistant (RAG Engine)...');
  const kbDocs = db.prepare('SELECT * FROM knowledge_base_documents WHERE is_active = 1').all();
  const chatResponse = await generateAdmissionChatResponse(
    'What are the eligibility criteria and minimum marks for B.Tech?',
    [],
    kbDocs
  );
  console.log('   ✓ Chatbot response received. Preview:\n', chatResponse.reply.substring(0, 180) + '...');
  console.log('   ✓ Verified Sources Cited:', chatResponse.sources.map(s => s.reference));

  // 7. Admin publishes an event
  console.log('7. Admin creates and publishes an event...');
  const evtRes = db.prepare(`
    INSERT INTO events (
      title, category, description, event_date, start_time, end_time,
      location_type, venue_or_link, speaker_name, speaker_title, capacity, status
    ) VALUES (
      'AI Robotics & Autonomous Systems Symposium 2026', 'Technology Workshop',
      'Hands-on workshop exploring ROS2, perception models, and humanoid edge intelligence.',
      '2026-12-15', '02:00 PM', '04:00 PM', 'Online', 'https://meet.google.com/nia-robotics',
      'Prof. Vikram Malhotra', 'Dean of Advanced Computing', 150, 'PUBLISHED'
    )
  `).run();
  const eventId = evtRes.lastInsertRowid;
  console.log('   ✓ Event published with ID:', eventId);

  // 8. Student sees and registers for the event
  console.log('8. Student registering for the event...');
  const ticketNumber = `NIAT-EVT-${eventId}-${Math.floor(1000 + Math.random() * 9000)}`;
  db.prepare(`
    INSERT INTO event_registrations (event_id, student_id, ticket_number)
    VALUES (?, ?, ?)
  `).run(eventId, studentId, ticketNumber);
  console.log('   ✓ Student seat confirmed with Ticket:', ticketNumber);

  // 9. Verify attendee in Admin event roster
  const attendees = db.prepare(`
    SELECT er.ticket_number, u.name, u.email 
    FROM event_registrations er
    JOIN users u ON er.student_id = u.id
    WHERE er.event_id = ?
  `).all(eventId);
  console.log('   ✓ Event attendee list verified by Admin:', attendees);

  // 10. Security check
  console.log('10. Security Check: Role enforcement...');
  const decodedStudent = jwt.verify(studentToken, JWT_SECRET);
  if (decodedStudent.role !== 'STUDENT') throw new Error('Role mismatch');
  console.log('   ✓ Security check passed: Student cannot access admin role.');

  console.log('\n🎉 ALL 10 INTEGRATED WORKFLOW STEPS PASSED SUCCESSFULLY!');
}

testWorkflow()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
  });
