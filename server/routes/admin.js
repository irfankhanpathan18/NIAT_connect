const express = require('express');
const { db } = require('../db');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { evaluateLeadScore } = require('../services/aiService');

const router = express.Router();

// Enforce admin privileges on all admin endpoints
router.use(verifyToken, requireAdmin);

// ==========================================
// A. LEAD MANAGEMENT CRM
// ==========================================

// GET /api/admin/leads (with filtering, search, and sorting)
router.get('/leads', (req, res) => {
  const { search, classification, status, interest, counsellor_id, source } = req.query;

  let query = `
    SELECT 
      l.*,
      ls.score as lead_score,
      ls.ai_classification,
      ls.is_manually_overridden,
      ls.override_reason,
      c.name as counsellor_name
    FROM leads l
    LEFT JOIN lead_scores ls ON l.id = ls.lead_id
    LEFT JOIN counsellors c ON l.assigned_counsellor_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    query += ` AND (
      l.student_name LIKE ? OR 
      l.email LIKE ? OR 
      l.phone LIKE ? OR 
      l.city LIKE ? OR 
      l.interested_program LIKE ?
    )`;
    const wildcard = `%${search.trim()}%`;
    params.push(wildcard, wildcard, wildcard, wildcard, wildcard);
  }

  if (classification && classification !== 'All') {
    query += ` AND ls.ai_classification = ?`;
    params.push(classification);
  }

  if (status && status !== 'All') {
    query += ` AND l.counselling_status = ?`;
    params.push(status);
  }

  if (interest && interest !== 'All') {
    query += ` AND l.admission_interest_level = ?`;
    params.push(interest);
  }

  if (counsellor_id && counsellor_id !== 'All') {
    query += ` AND l.assigned_counsellor_id = ?`;
    params.push(parseInt(counsellor_id, 10));
  }

  if (source && source !== 'All') {
    query += ` AND l.lead_source = ?`;
    params.push(source);
  }

  query += ` ORDER BY ls.score DESC, l.created_at DESC`;

  try {
    const leads = db.prepare(query).all(params);
    return res.json({ leads });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve leads: ' + err.message });
  }
});

// GET /api/admin/leads/:id (lead profile + history + breakdown)
router.get('/leads/:id', (req, res) => {
  const leadId = parseInt(req.params.id, 10);
  const lead = db.prepare(`
    SELECT 
      l.*,
      ls.score as lead_score,
      ls.ai_classification,
      ls.is_manually_overridden,
      ls.override_reason,
      ls.breakdown_json,
      c.name as counsellor_name,
      c.email as counsellor_email,
      c.phone as counsellor_phone
    FROM leads l
    LEFT JOIN lead_scores ls ON l.id = ls.lead_id
    LEFT JOIN counsellors c ON l.assigned_counsellor_id = c.id
    WHERE l.id = ?
  `).get(leadId);

  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  const activities = db.prepare(`
    SELECT * FROM lead_activities WHERE lead_id = ? ORDER BY created_at DESC
  `).all(leadId);

  const followUps = db.prepare(`
    SELECT f.*, c.name as counsellor_name 
    FROM follow_ups f
    LEFT JOIN counsellors c ON f.counsellor_id = c.id
    WHERE f.lead_id = ?
    ORDER BY f.scheduled_date DESC
  `).all(leadId);

  return res.json({
    lead: {
      ...lead,
      breakdown: lead.breakdown_json ? JSON.parse(lead.breakdown_json) : []
    },
    activities,
    followUps
  });
});

// POST /api/admin/leads (create lead manually)
router.post('/leads', (req, res) => {
  const {
    student_name,
    email,
    phone,
    current_education,
    class_12_passing_year,
    class_12_percentage,
    city,
    state,
    interested_program,
    lead_source,
    admission_interest_level,
    counselling_status,
    assigned_counsellor_id,
    follow_up_date,
    notes
  } = req.body;

  if (!student_name || !email || !phone) {
    return res.status(400).json({ error: 'Student name, email, and phone are mandatory fields' });
  }

  try {
    const newLead = {
      student_name: student_name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      current_education: current_education || '12th Pursuing (Science PCM)',
      class_12_passing_year: class_12_passing_year ? parseInt(class_12_passing_year, 10) : 2026,
      class_12_percentage: class_12_percentage ? parseFloat(class_12_percentage) : null,
      city: city || 'Not Specified',
      state: state || 'Not Specified',
      interested_program: interested_program || 'B.Tech CSE (AI & ML)',
      lead_source: lead_source || 'Direct Outreach',
      admission_interest_level: admission_interest_level || 'Medium',
      counselling_status: counselling_status || 'New',
      assigned_counsellor_id: assigned_counsellor_id ? parseInt(assigned_counsellor_id, 10) : null,
      follow_up_date: follow_up_date || null,
      notes: notes || null
    };

    const leadRes = db.prepare(`
      INSERT INTO leads (
        student_name, email, phone, current_education, class_12_passing_year, class_12_percentage,
        city, state, interested_program, lead_source, admission_interest_level,
        counselling_status, assigned_counsellor_id, follow_up_date, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      newLead.student_name, newLead.email, newLead.phone, newLead.current_education,
      newLead.class_12_passing_year, newLead.class_12_percentage, newLead.city, newLead.state,
      newLead.interested_program, newLead.lead_source, newLead.admission_interest_level,
      newLead.counselling_status, newLead.assigned_counsellor_id, newLead.follow_up_date, newLead.notes
    );

    const leadId = leadRes.lastInsertRowid;

    // AI Lead Evaluation (on the stored values, so defaults are scored too)
    const aiResult = evaluateLeadScore(newLead);
    db.prepare(`
      INSERT INTO lead_scores (lead_id, score, ai_classification, is_manually_overridden, breakdown_json)
      VALUES (?, ?, ?, 0, ?)
    `).run(leadId, aiResult.score, aiResult.ai_classification, JSON.stringify(aiResult.breakdown));

    // Activity log
    db.prepare(`
      INSERT INTO lead_activities (lead_id, activity_type, description, performed_by)
      VALUES (?, 'STATUS_CHANGE', ?, ?)
    `).run(
      leadId,
      `Lead created manually by ${req.user.name}. AI evaluated as ${aiResult.ai_classification} (Score: ${aiResult.score}).`,
      req.user.name
    );

    // If follow-up date added, schedule follow-up
    if (follow_up_date) {
      db.prepare(`
        INSERT INTO follow_ups (lead_id, counsellor_id, scheduled_date, scheduled_time, contact_method, status, outcome_notes)
        VALUES (?, ?, ?, '11:00 AM', 'Phone', 'PENDING', ?)
      `).run(leadId, assigned_counsellor_id || 1, follow_up_date, notes || 'Initial admission outreach');
    }

    return res.status(201).json({
      message: 'Lead successfully created and AI scored',
      leadId,
      score: aiResult.score,
      classification: aiResult.ai_classification
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create lead: ' + err.message });
  }
});

// PUT /api/admin/leads/:id (update lead)
router.put('/leads/:id', (req, res) => {
  const leadId = parseInt(req.params.id, 10);
  const existingLead = db.prepare('SELECT * FROM leads WHERE id = ?').get(leadId);
  if (!existingLead) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  const {
    student_name,
    email,
    phone,
    current_education,
    class_12_passing_year,
    class_12_percentage,
    city,
    state,
    interested_program,
    lead_source,
    admission_interest_level,
    counselling_status,
    assigned_counsellor_id,
    follow_up_date,
    notes
  } = req.body;

  try {
    db.prepare(`
      UPDATE leads SET
        student_name = ?, email = ?, phone = ?, current_education = ?,
        class_12_passing_year = ?, class_12_percentage = ?, city = ?, state = ?, interested_program = ?,
        lead_source = ?, admission_interest_level = ?, counselling_status = ?,
        assigned_counsellor_id = ?, follow_up_date = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      student_name || existingLead.student_name,
      email || existingLead.email,
      phone || existingLead.phone,
      current_education || existingLead.current_education,
      class_12_passing_year ? parseInt(class_12_passing_year, 10) : existingLead.class_12_passing_year,
      class_12_percentage !== undefined && class_12_percentage !== '' ? parseFloat(class_12_percentage) : existingLead.class_12_percentage,
      city || existingLead.city,
      state || existingLead.state,
      interested_program || existingLead.interested_program,
      lead_source || existingLead.lead_source,
      admission_interest_level || existingLead.admission_interest_level,
      counselling_status || existingLead.counselling_status,
      assigned_counsellor_id !== undefined ? assigned_counsellor_id : existingLead.assigned_counsellor_id,
      follow_up_date !== undefined ? follow_up_date : existingLead.follow_up_date,
      notes !== undefined ? notes : existingLead.notes,
      leadId
    );

    // Check if score is overridden
    const scoreRow = db.prepare('SELECT is_manually_overridden FROM lead_scores WHERE lead_id = ?').get(leadId);
    if (!scoreRow || scoreRow.is_manually_overridden === 0) {
      const updatedLead = db.prepare('SELECT * FROM leads WHERE id = ?').get(leadId);
      const aiResult = evaluateLeadScore(updatedLead);
      db.prepare(`
        UPDATE lead_scores SET
          score = ?, ai_classification = ?, breakdown_json = ?, evaluated_at = CURRENT_TIMESTAMP
        WHERE lead_id = ?
      `).run(aiResult.score, aiResult.ai_classification, JSON.stringify(aiResult.breakdown), leadId);
    }

    // Log activity if status changed
    if (counselling_status && counselling_status !== existingLead.counselling_status) {
      db.prepare(`
        INSERT INTO lead_activities (lead_id, activity_type, description, performed_by)
        VALUES (?, 'STATUS_CHANGE', ?, ?)
      `).run(
        leadId,
        `Status updated from "${existingLead.counselling_status}" to "${counselling_status}".`,
        req.user.name
      );
    }

    return res.json({ message: 'Lead updated successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update lead: ' + err.message });
  }
});

// DELETE /api/admin/leads/:id
router.delete('/leads/:id', (req, res) => {
  const leadId = parseInt(req.params.id, 10);
  try {
    db.prepare('DELETE FROM leads WHERE id = ?').run(leadId);
    return res.json({ message: 'Lead successfully deleted' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete lead: ' + err.message });
  }
});

// POST /api/admin/leads/import-csv (CSV batch import)
router.post('/leads/import-csv', (req, res) => {
  const { leads } = req.body;
  if (!leads || !Array.isArray(leads) || leads.length === 0) {
    return res.status(400).json({ error: 'Valid leads array required for CSV import.' });
  }

  let importedCount = 0;
  let skippedCount = 0;

  leads.forEach(item => {
    if (!item.student_name || !item.email || !item.phone) {
      skippedCount++;
      return;
    }

    try {
      const leadRes = db.prepare(`
        INSERT INTO leads (
          student_name, email, phone, current_education, class_12_passing_year, class_12_percentage,
          city, state, interested_program, lead_source, admission_interest_level,
          counselling_status, assigned_counsellor_id, follow_up_date, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        item.student_name.trim(),
        item.email.trim().toLowerCase(),
        item.phone.trim(),
        item.current_education || '12th Pursuing (Science PCM)',
        item.class_12_passing_year ? parseInt(item.class_12_passing_year, 10) : 2026,
        item.class_12_percentage ? parseFloat(item.class_12_percentage) : null,
        item.city || 'Not Specified',
        item.state || 'Not Specified',
        item.interested_program || 'B.Tech CSE (AI & ML)',
        item.lead_source || 'CSV Import',
        item.admission_interest_level || 'Medium',
        item.counselling_status || 'New',
        item.assigned_counsellor_id ? parseInt(item.assigned_counsellor_id, 10) : 1,
        item.follow_up_date || null,
        item.notes || 'Imported via CSV batch upload'
      );

      const leadId = leadRes.lastInsertRowid;
      const aiScore = evaluateLeadScore(item);

      db.prepare(`
        INSERT INTO lead_scores (lead_id, score, ai_classification, is_manually_overridden, breakdown_json)
        VALUES (?, ?, ?, 0, ?)
      `).run(leadId, aiScore.score, aiScore.ai_classification, JSON.stringify(aiScore.breakdown));

      db.prepare(`
        INSERT INTO lead_activities (lead_id, activity_type, description, performed_by)
        VALUES (?, 'STATUS_CHANGE', ?, ?)
      `).run(leadId, `Batch imported via CSV. AI Classified as ${aiScore.ai_classification} (Score: ${aiScore.score}).`, req.user.name);

      importedCount++;
    } catch (e) {
      skippedCount++;
    }
  });

  return res.json({
    message: `CSV import completed: ${importedCount} leads added, ${skippedCount} skipped.`,
    importedCount,
    skippedCount
  });
});

// GET /api/admin/leads/export-csv
router.get('/leads-export/csv', (req, res) => {
  try {
    const leads = db.prepare(`
      SELECT 
        l.id, l.student_name, l.email, l.phone, l.current_education,
        l.class_12_passing_year, l.city, l.state, l.interested_program,
        l.lead_source, l.admission_interest_level, l.counselling_status,
        ls.score as lead_score, ls.ai_classification, c.name as counsellor_name,
        l.created_at
      FROM leads l
      LEFT JOIN lead_scores ls ON l.id = ls.lead_id
      LEFT JOIN counsellors c ON l.assigned_counsellor_id = c.id
      ORDER BY l.id ASC
    `).all();

    const headers = [
      'ID', 'Student Name', 'Email', 'Phone', 'Education', '12th Passing Year',
      'City', 'State', 'Program', 'Source', 'Interest Level', 'Status',
      'AI Lead Score', 'AI Classification', 'Counsellor', 'Created Date'
    ];

    const rows = leads.map(l => [
      l.id,
      `"${(l.student_name || '').replace(/"/g, '""')}"`,
      `"${l.email}"`,
      `"${l.phone}"`,
      `"${(l.current_education || '').replace(/"/g, '""')}"`,
      l.class_12_passing_year,
      `"${l.city}"`,
      `"${l.state}"`,
      `"${(l.interested_program || '').replace(/"/g, '""')}"`,
      `"${l.lead_source}"`,
      `"${l.admission_interest_level}"`,
      `"${l.counselling_status}"`,
      l.lead_score || 50,
      `"${l.ai_classification || 'Warm'}"`,
      `"${l.counsellor_name || 'Unassigned'}"`,
      `"${l.created_at}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="NIAT_Leads_Report_2026.csv"');
    return res.send(csvContent);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to export CSV: ' + err.message });
  }
});

// ==========================================
// B. AI-POWERED LEAD FILTRATION SYSTEM
// ==========================================

// GET /api/admin/ai/summary
router.get('/ai/summary', (req, res) => {
  try {
    const totalLeads = db.prepare('SELECT COUNT(*) as count FROM leads').get().count;
    const hotLeads = db.prepare("SELECT COUNT(*) as count FROM lead_scores WHERE ai_classification = 'Hot'").get().count;
    const warmLeads = db.prepare("SELECT COUNT(*) as count FROM lead_scores WHERE ai_classification = 'Warm'").get().count;
    const coldLeads = db.prepare("SELECT COUNT(*) as count FROM lead_scores WHERE ai_classification = 'Cold'").get().count;
    const unqualifiedLeads = db.prepare("SELECT COUNT(*) as count FROM lead_scores WHERE ai_classification = 'Unqualified'").get().count;
    const admittedCount = db.prepare("SELECT COUNT(*) as count FROM leads WHERE counselling_status = 'Admitted'").get().count;
    
    const conversionRate = totalLeads > 0 ? ((admittedCount / totalLeads) * 100).toFixed(1) : 0;

    const sourceStats = db.prepare(`
      SELECT 
        l.lead_source,
        COUNT(l.id) as total,
        SUM(CASE WHEN ls.ai_classification = 'Hot' THEN 1 ELSE 0 END) as hot_count,
        ROUND(AVG(ls.score), 1) as avg_score
      FROM leads l
      LEFT JOIN lead_scores ls ON l.id = ls.lead_id
      GROUP BY l.lead_source
      ORDER BY total DESC
    `).all();

    const statusStats = db.prepare(`
      SELECT counselling_status as status, COUNT(*) as count
      FROM leads
      GROUP BY counselling_status
    `).all();

    return res.json({
      totalLeads,
      hotLeads,
      warmLeads,
      coldLeads,
      unqualifiedLeads,
      conversionRate,
      sourceStats,
      statusStats
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load AI summary: ' + err.message });
  }
});

// POST /api/admin/ai/override/:leadId (Manual Override)
router.post('/ai/override/:leadId', (req, res) => {
  const leadId = parseInt(req.params.leadId, 10);
  const { newScore, newClassification, overrideReason } = req.body;

  if (!newClassification || !overrideReason) {
    return res.status(400).json({ error: 'Target classification and justification reason are required.' });
  }

  try {
    const existing = db.prepare('SELECT * FROM lead_scores WHERE lead_id = ?').get(leadId);
    if (!existing) {
      return res.status(404).json({ error: 'Lead score record not found' });
    }

    const assignedScore = newScore !== undefined ? parseInt(newScore, 10) : (
      newClassification === 'Hot' ? 85 :
      newClassification === 'Warm' ? 60 :
      newClassification === 'Cold' ? 35 : 15
    );

    db.prepare(`
      UPDATE lead_scores SET
        score = ?,
        ai_classification = ?,
        is_manually_overridden = 1,
        override_reason = ?,
        evaluated_at = CURRENT_TIMESTAMP
      WHERE lead_id = ?
    `).run(assignedScore, newClassification, overrideReason, leadId);

    db.prepare(`
      INSERT INTO lead_activities (lead_id, activity_type, description, performed_by)
      VALUES (?, 'SCORE_OVERRIDE', ?, ?)
    `).run(
      leadId,
      `AI classification overridden to "${newClassification}" (Score: ${assignedScore}) by ${req.user.name}. Reason: ${overrideReason}`,
      req.user.name
    );

    return res.json({
      message: 'AI score manually overridden with documented human review.',
      score: assignedScore,
      ai_classification: newClassification
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to override score: ' + err.message });
  }
});

// POST /api/admin/ai/re-evaluate (Recalculate AI scores)
router.post('/ai/re-evaluate', (req, res) => {
  try {
    const leads = db.prepare(`
      SELECT l.*, ls.is_manually_overridden 
      FROM leads l 
      LEFT JOIN lead_scores ls ON l.id = ls.lead_id
    `).all();

    let updatedCount = 0;
    leads.forEach(lead => {
      if (lead.is_manually_overridden === 1) return; // preserve human overrides

      const evaluated = evaluateLeadScore(lead);
      db.prepare(`
        UPDATE lead_scores SET
          score = ?, ai_classification = ?, breakdown_json = ?, evaluated_at = CURRENT_TIMESTAMP
        WHERE lead_id = ?
      `).run(evaluated.score, evaluated.ai_classification, JSON.stringify(evaluated.breakdown), lead.id);
      updatedCount++;
    });

    return res.json({
      message: `AI qualification engine re-evaluated ${updatedCount} leads successfully.`
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to re-evaluate leads: ' + err.message });
  }
});

// ==========================================
// C. LEAD ANALYTICS & CHARTS
// ==========================================

router.get('/analytics', (req, res) => {
  try {
    // 1. Funnel data
    const funnelSteps = [
      { step: 'Inquiries (New)', key: 'New' },
      { step: 'Contacted', key: 'Contacted' },
      { step: 'Counselling Scheduled', key: 'Counselling Scheduled' },
      { step: 'Counselling Completed', key: 'Counselling Completed' },
      { step: 'Documents Pending', key: 'Documents Pending' },
      { step: 'Admitted Students', key: 'Admitted' }
    ];

    const funnelCounts = funnelSteps.map(f => {
      const row = db.prepare('SELECT COUNT(*) as count FROM leads WHERE counselling_status = ?').get(f.key);
      return { name: f.step, count: row.count };
    });

    // 2. Lead Source breakdown
    const sourceBreakdown = db.prepare(`
      SELECT lead_source as source, COUNT(*) as count 
      FROM leads GROUP BY lead_source ORDER BY count DESC
    `).all();

    // 3. AI Classification distribution
    const classificationBreakdown = db.prepare(`
      SELECT ai_classification as name, COUNT(*) as value
      FROM lead_scores
      GROUP BY ai_classification
    `).all();

    // 4. Interested program distribution
    const programBreakdown = db.prepare(`
      SELECT interested_program as program, COUNT(*) as count
      FROM leads GROUP BY interested_program ORDER BY count DESC
    `).all();

    // 5. Counsellor performance
    const counsellorStats = db.prepare(`
      SELECT 
        c.id, c.name, c.specialization, c.rating,
        COUNT(l.id) as assigned_leads,
        SUM(CASE WHEN l.counselling_status = 'Admitted' THEN 1 ELSE 0 END) as converted_leads,
        SUM(CASE WHEN ls.ai_classification = 'Hot' THEN 1 ELSE 0 END) as hot_leads
      FROM counsellors c
      LEFT JOIN leads l ON c.id = l.assigned_counsellor_id
      LEFT JOIN lead_scores ls ON l.id = ls.lead_id
      GROUP BY c.id
      ORDER BY converted_leads DESC
    `).all();

    // 6. Trend data (simulated 7-day lead intake)
    const trends = [
      { date: 'Nov 13', leads: 4, hot: 1, conversions: 0 },
      { date: 'Nov 14', leads: 6, hot: 2, conversions: 1 },
      { date: 'Nov 15', leads: 9, hot: 3, conversions: 1 },
      { date: 'Nov 16', leads: 5, hot: 2, conversions: 0 },
      { date: 'Nov 17', leads: 12, hot: 5, conversions: 2 },
      { date: 'Nov 18', leads: 8, hot: 3, conversions: 1 },
      { date: 'Nov 19', leads: 11, hot: 4, conversions: 2 }
    ];

    return res.json({
      funnel: funnelCounts,
      sources: sourceBreakdown,
      classifications: classificationBreakdown,
      programs: programBreakdown,
      counsellors: counsellorStats,
      trends
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve analytics: ' + err.message });
  }
});

// ==========================================
// D. FOLLOW-UP MANAGEMENT
// ==========================================

router.get('/follow-ups', (req, res) => {
  const { status, timeframe } = req.query;

  let query = `
    SELECT 
      f.*,
      l.student_name,
      l.email as student_email,
      l.phone as student_phone,
      l.interested_program,
      ls.ai_classification,
      ls.score as lead_score,
      c.name as counsellor_name
    FROM follow_ups f
    JOIN leads l ON f.lead_id = l.id
    LEFT JOIN lead_scores ls ON l.id = ls.lead_id
    LEFT JOIN counsellors c ON f.counsellor_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (status && status !== 'All') {
    query += ' AND f.status = ?';
    params.push(status);
  }

  query += ' ORDER BY f.scheduled_date ASC';

  try {
    const followUps = db.prepare(query).all(params);
    return res.json({ followUps });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load follow-ups: ' + err.message });
  }
});

router.post('/follow-ups', (req, res) => {
  const { lead_id, counsellor_id, scheduled_date, scheduled_time, contact_method, outcome_notes } = req.body;
  if (!lead_id || !scheduled_date) {
    return res.status(400).json({ error: 'Lead ID and scheduled date are required.' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO follow_ups (lead_id, counsellor_id, scheduled_date, scheduled_time, contact_method, status, outcome_notes)
      VALUES (?, ?, ?, ?, ?, 'PENDING', ?)
    `).run(
      lead_id,
      counsellor_id || 1,
      scheduled_date,
      scheduled_time || '11:00 AM',
      contact_method || 'Phone',
      outcome_notes || 'Scheduled follow-up'
    );

    db.prepare('UPDATE leads SET follow_up_date = ? WHERE id = ?').run(scheduled_date, lead_id);

    db.prepare(`
      INSERT INTO lead_activities (lead_id, activity_type, description, performed_by)
      VALUES (?, 'FOLLOW_UP_SCHEDULED', ?, ?)
    `).run(
      lead_id,
      `Follow-up scheduled for ${scheduled_date} at ${scheduled_time || '11:00 AM'} via ${contact_method || 'Phone'}.`,
      req.user.name
    );

    return res.status(201).json({ message: 'Follow-up successfully scheduled', followUpId: result.lastInsertRowid });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to schedule follow-up: ' + err.message });
  }
});

router.put('/follow-ups/:id', (req, res) => {
  const followUpId = parseInt(req.params.id, 10);
  const { status, outcome_notes, scheduled_date, scheduled_time } = req.body;

  try {
    const existing = db.prepare('SELECT * FROM follow_ups WHERE id = ?').get(followUpId);
    if (!existing) {
      return res.status(404).json({ error: 'Follow-up not found' });
    }

    db.prepare(`
      UPDATE follow_ups SET
        status = ?,
        outcome_notes = ?,
        scheduled_date = ?,
        scheduled_time = ?
      WHERE id = ?
    `).run(
      status || existing.status,
      outcome_notes !== undefined ? outcome_notes : existing.outcome_notes,
      scheduled_date || existing.scheduled_date,
      scheduled_time || existing.scheduled_time,
      followUpId
    );

    if (status === 'COMPLETED') {
      db.prepare(`
        INSERT INTO lead_activities (lead_id, activity_type, description, performed_by)
        VALUES (?, 'NOTE_ADDED', ?, ?)
      `).run(existing.lead_id, `Follow-up completed: ${outcome_notes || 'No remarks recorded'}`, req.user.name);
    }

    return res.json({ message: 'Follow-up updated successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update follow-up: ' + err.message });
  }
});

// ==========================================
// E. EVENT MANAGEMENT
// ==========================================

router.get('/events', (req, res) => {
  try {
    const events = db.prepare(`
      SELECT 
        e.*,
        COUNT(er.id) as registrations_count
      FROM events e
      LEFT JOIN event_registrations er ON e.id = er.event_id
      GROUP BY e.id
      ORDER BY e.event_date ASC
    `).all();

    return res.json({ events });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load events: ' + err.message });
  }
});

router.post('/events', (req, res) => {
  const {
    title, category, description, event_date, start_time, end_time,
    location_type, venue_or_link, speaker_name, speaker_title, capacity, status
  } = req.body;

  if (!title || !category || !event_date || !start_time || !venue_or_link) {
    return res.status(400).json({ error: 'Title, category, date, start time, and venue/link are required.' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO events (
        title, category, description, event_date, start_time, end_time,
        location_type, venue_or_link, speaker_name, speaker_title, capacity, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      title.trim(),
      category,
      description || 'Official NIAT event for prospective applicants and tech builders.',
      event_date,
      start_time,
      end_time || '1 hour duration',
      location_type || 'Online',
      venue_or_link.trim(),
      speaker_name || 'NIAT Admissions Team',
      speaker_title || 'Faculty Representative',
      capacity ? parseInt(capacity, 10) : 100,
      status || 'PUBLISHED'
    );

    // Broadcast notification to prospective students
    if (status === 'PUBLISHED') {
      db.prepare(`
        INSERT INTO notifications (user_id, target_role, title, message, type, link)
        VALUES (NULL, 'STUDENT', ?, ?, 'EVENT', '/student/calendar')
      `).run(`New Event: ${title.trim()}`, `Join us for "${title.trim()}" on ${event_date}. Click to reserve your free seat.`);
    }

    return res.status(201).json({ message: 'Event created successfully', eventId: result.lastInsertRowid });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create event: ' + err.message });
  }
});

router.put('/events/:id', (req, res) => {
  const eventId = parseInt(req.params.id, 10);
  const existing = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId);
  if (!existing) {
    return res.status(404).json({ error: 'Event not found' });
  }

  const {
    title, category, description, event_date, start_time, end_time,
    location_type, venue_or_link, speaker_name, speaker_title, capacity, status
  } = req.body;

  try {
    db.prepare(`
      UPDATE events SET
        title = ?, category = ?, description = ?, event_date = ?,
        start_time = ?, end_time = ?, location_type = ?, venue_or_link = ?,
        speaker_name = ?, speaker_title = ?, capacity = ?, status = ?
      WHERE id = ?
    `).run(
      title || existing.title,
      category || existing.category,
      description || existing.description,
      event_date || existing.event_date,
      start_time || existing.start_time,
      end_time || existing.end_time,
      location_type || existing.location_type,
      venue_or_link || existing.venue_or_link,
      speaker_name || existing.speaker_name,
      speaker_title || existing.speaker_title,
      capacity !== undefined ? parseInt(capacity, 10) : existing.capacity,
      status || existing.status,
      eventId
    );

    return res.json({ message: 'Event successfully updated' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update event: ' + err.message });
  }
});

router.delete('/events/:id', (req, res) => {
  const eventId = parseInt(req.params.id, 10);
  try {
    db.prepare('DELETE FROM events WHERE id = ?').run(eventId);
    return res.json({ message: 'Event deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete event: ' + err.message });
  }
});

router.get('/events/:id/attendees', (req, res) => {
  const eventId = parseInt(req.params.id, 10);
  try {
    const attendees = db.prepare(`
      SELECT 
        er.id, er.ticket_number, er.registered_at, er.attended,
        u.name as student_name, u.email as student_email, u.phone as student_phone,
        sp.city, sp.interested_program
      FROM event_registrations er
      JOIN users u ON er.student_id = u.id
      LEFT JOIN student_profiles sp ON u.id = sp.user_id
      WHERE er.event_id = ?
      ORDER BY er.registered_at DESC
    `).all(eventId);

    return res.json({ attendees });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load attendees: ' + err.message });
  }
});

// ==========================================
// F. KNOWLEDGE BASE MANAGEMENT (RAG)
// ==========================================

router.get('/knowledge-base', (req, res) => {
  try {
    const docs = db.prepare('SELECT * FROM knowledge_base_documents ORDER BY category, id').all();
    return res.json({ documents: docs });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load knowledge base: ' + err.message });
  }
});

router.post('/knowledge-base', (req, res) => {
  const { title, category, content, tags, source_reference } = req.body;
  if (!title || !content || !source_reference) {
    return res.status(400).json({ error: 'Title, content, and source reference are mandatory.' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO knowledge_base_documents (title, category, content, tags, source_reference)
      VALUES (?, ?, ?, ?, ?)
    `).run(title.trim(), category || 'General', content.trim(), tags || '', source_reference.trim());

    return res.status(201).json({ message: 'Knowledge document saved and indexed for RAG', docId: result.lastInsertRowid });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create knowledge doc: ' + err.message });
  }
});

router.put('/knowledge-base/:id', (req, res) => {
  const docId = parseInt(req.params.id, 10);
  const { title, category, content, tags, source_reference, is_active } = req.body;

  try {
    const existing = db.prepare('SELECT * FROM knowledge_base_documents WHERE id = ?').get(docId);
    if (!existing) {
      return res.status(404).json({ error: 'Knowledge document not found' });
    }

    db.prepare(`
      UPDATE knowledge_base_documents SET
        title = ?, category = ?, content = ?, tags = ?,
        source_reference = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      title || existing.title,
      category || existing.category,
      content || existing.content,
      tags !== undefined ? tags : existing.tags,
      source_reference || existing.source_reference,
      is_active !== undefined ? is_active : existing.is_active,
      docId
    );

    return res.json({ message: 'Document updated successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update document: ' + err.message });
  }
});

router.delete('/knowledge-base/:id', (req, res) => {
  const docId = parseInt(req.params.id, 10);
  try {
    db.prepare('DELETE FROM knowledge_base_documents WHERE id = ?').run(docId);
    return res.json({ message: 'Document removed from knowledge base' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete document: ' + err.message });
  }
});

// ==========================================
// G. COUNSELLORS
// ==========================================

router.get('/counsellors', (req, res) => {
  try {
    const counsellors = db.prepare(`
      SELECT 
        c.*,
        COUNT(l.id) as active_leads
      FROM counsellors c
      LEFT JOIN leads l ON c.id = l.assigned_counsellor_id
      GROUP BY c.id
      ORDER BY c.name ASC
    `).all();

    return res.json({ counsellors });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load counsellors: ' + err.message });
  }
});

module.exports = router;
