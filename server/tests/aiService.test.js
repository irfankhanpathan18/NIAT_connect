// Run with: npm test
const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');
const { createSeededDb } = require('./helpers');
const {
  evaluateLeadScore,
  retrieveKnowledge,
  generateAdmissionChatResponse,
  getIntakeYear
} = require('../services/aiService');

let knowledgeBase = [];

before(async () => {
  const db = await createSeededDb();
  knowledgeBase = db.prepare('SELECT * FROM knowledge_base_documents WHERE is_active = 1').all();
});

const NOV_2026 = new Date('2026-11-19T10:00:00Z');

describe('getIntakeYear', () => {
  test('admission cycle rolls over in August', () => {
    assert.equal(getIntakeYear(new Date('2026-03-01')), 2026);
    assert.equal(getIntakeYear(new Date('2026-11-19')), 2027);
  });
});

describe('evaluateLeadScore', () => {
  const base = {
    admission_interest_level: 'High',
    class_12_passing_year: 2027,
    counselling_status: 'New',
    lead_source: 'Website',
    current_education: '12th Pursuing (Science PCM)'
  };

  test('factor maximums add up to 100', () => {
    const { breakdown } = evaluateLeadScore(base, NOV_2026);
    assert.equal(breakdown.reduce((sum, f) => sum + f.maxScore, 0), 100);
  });

  test('strong PCM lead is Hot', () => {
    const result = evaluateLeadScore({ ...base, counselling_status: 'Counselling Completed', class_12_percentage: 91 }, NOV_2026);
    assert.equal(result.ai_classification, 'Hot');
    assert.deepEqual(result.flags, []);
  });

  test('commerce and arts students are flagged Unqualified for human review', () => {
    for (const current_education of ['B.Com graduate', '12th Arts', 'Commerce with Mathematics', '12th Humanities']) {
      const result = evaluateLeadScore({ ...base, current_education }, NOV_2026);
      assert.equal(result.ai_classification, 'Unqualified', current_education);
      assert.ok(result.score < 20);
      assert.equal(result.flags.length, 1);
    }
  });

  test('12th with unspecified stream is not treated as PCM', () => {
    const result = evaluateLeadScore({ ...base, current_education: '12th Pursuing (CBSE)' }, NOV_2026);
    const eligibility = result.breakdown.find(f => f.factor === 'Eligibility & Program Fit');
    assert.ok(eligibility.score < eligibility.maxScore);
    assert.notEqual(result.ai_classification, 'Unqualified');
  });

  test('Class 12 marks affect the score', () => {
    const low = evaluateLeadScore({ ...base, class_12_percentage: 62 }, NOV_2026);
    const high = evaluateLeadScore({ ...base, class_12_percentage: 96 }, NOV_2026);
    assert.ok(high.score > low.score);
  });

  test('marks below the 55% minimum are flagged Unqualified', () => {
    const result = evaluateLeadScore({ ...base, class_12_percentage: 40 }, NOV_2026);
    assert.equal(result.ai_classification, 'Unqualified');
  });

  test('diploma holders are not judged on Class 12 marks', () => {
    const result = evaluateLeadScore({ ...base, current_education: 'Diploma in Computer Tech', class_12_percentage: 40 }, NOV_2026);
    assert.notEqual(result.ai_classification, 'Unqualified');
  });

  test('interest level is case and whitespace insensitive', () => {
    const a = evaluateLeadScore({ ...base, admission_interest_level: 'HIGH ' }, NOV_2026);
    const b = evaluateLeadScore({ ...base, admission_interest_level: 'high' }, NOV_2026);
    assert.equal(a.score, b.score);
  });

  test('timeline follows the current intake year, not a hardcoded one', () => {
    const current = evaluateLeadScore({ ...base, class_12_passing_year: 2027 }, NOV_2026);
    const old = evaluateLeadScore({ ...base, class_12_passing_year: 2019 }, NOV_2026);
    const timeline = r => r.breakdown.find(f => f.factor.startsWith('Timeline')).score;
    assert.equal(timeline(current), 20);
    assert.ok(timeline(old) < 10);
  });
});

describe('retrieveKnowledge', () => {
  const topTitle = q => retrieveKnowledge(q, knowledgeBase, 3)[0]?.title || null;

  const cases = [
    ['What is the fee for B.Tech?', /Tuition Fee/],
    ['how much does it cost to study here', /Tuition Fee/],
    ['is there hostel accommodation', /Campus Facilities/],
    ['where do students stay', /Campus Facilities/],
    ['What scholarships are available?', /Scholarships/],
    ['what is the placement record', /Placements/],
    ['Am I eligible with 55 percent in 12th?', /Eligibility/],
    ['what is the NSAT syllabus', /NSAT/],
    ['last date to apply', /Application Procedure/],
    ['tell me about data science program', /Data Science/]
  ];

  for (const [question, expected] of cases) {
    test(`"${question}" -> ${expected}`, () => {
      assert.match(topTitle(question) || '', expected);
    });
  }

  test('off-topic questions return no documents', () => {
    for (const q of ['what is the capital of France', 'who won the cricket world cup', 'hi']) {
      assert.deepEqual(retrieveKnowledge(q, knowledgeBase, 3), [], q);
    }
  });
});

describe('generateAdmissionChatResponse (offline mode)', () => {
  before(() => { delete process.env.GEMINI_API_KEY; });

  test('greets instead of returning a random article', async () => {
    const r = await generateAdmissionChatResponse('hi', [], knowledgeBase);
    assert.match(r.reply, /NIAT AI Admission Assistant/);
    assert.deepEqual(r.sources, []);
  });

  test('suggests counselling when nothing is verified', async () => {
    const r = await generateAdmissionChatResponse('what is the capital of France', [], knowledgeBase);
    assert.equal(r.suggestCounselling, true);
    assert.deepEqual(r.sources, []);
  });

  test('answers with citations when a document matches', async () => {
    const r = await generateAdmissionChatResponse('What is the fee for B.Tech?', [], knowledgeBase);
    assert.ok(r.sources.length > 0);
    assert.match(r.reply, /Official Verification Citation/);
  });
});
