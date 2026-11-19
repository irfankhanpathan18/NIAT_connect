// ========================================================
// NIAT Connect – Tools available to the admission agent.
// Each tool acts only for the signed-in student (ctx.userId).
// ========================================================

const {
  retrieveKnowledge,
  assessEducation,
  assessMarks,
  getIntakeYear,
  MIN_PCM_PERCENTAGE
} = require('../aiService');
const {
  listUpcomingEvents,
  registerForEvent,
  requestCounselling,
  getApplicationStatus
} = require('../studentActions');
const { lookupPincode, analyzeGithubProfile, PublicDataError } = require('../publicData');
const { expandQueryToEnglish } = require('./i18n');

function checkEligibility(ctx, args = {}) {
  const profile = ctx.db.prepare('SELECT current_education, class_12_percentage, class_12_passing_year FROM student_profiles WHERE user_id = ?').get(ctx.userId) || {};
  const education = args.current_education || profile.current_education || '';
  const percentage = args.class_12_percentage ?? profile.class_12_percentage ?? null;
  const passingYear = parseInt(args.class_12_passing_year ?? profile.class_12_passing_year, 10);

  const edu = assessEducation(education);
  const marks = assessMarks(percentage, edu.route);
  const intakeYear = getIntakeYear();

  let timeline;
  if (Number.isNaN(passingYear)) timeline = 'Passing year not provided';
  else if (passingYear > intakeYear) timeline = `Passing in ${passingYear}: eligible to apply for the ${passingYear} intake`;
  else if (passingYear >= intakeYear - 2) timeline = `Passing year ${passingYear} is within the eligibility window for the ${intakeYear} intake`;
  else timeline = `Passing year ${passingYear} is outside the standard window; gap-year candidates are reviewed case by case`;

  const pct = parseFloat(percentage);
  let verdict;
  if (edu.ineligible || marks.belowMinimum) verdict = 'not_eligible';
  else if (edu.route === 'diploma') verdict = 'eligible_lateral_entry';
  else if (edu.route === 'class12' && edu.score === 15 && !Number.isNaN(pct) && pct >= MIN_PCM_PERCENTAGE) verdict = 'likely_eligible';
  else verdict = 'needs_verification';

  return {
    verdict,
    usedValues: {
      current_education: education || null,
      class_12_percentage: Number.isNaN(pct) ? null : pct,
      class_12_passing_year: Number.isNaN(passingYear) ? null : passingYear
    },
    education: edu.rationale,
    marks: marks.rationale,
    timeline,
    rule: 'Physics + Mathematics in Class 12 with at least 60% aggregate (55% for reserved/merit categories); diploma holders with 65%+ can join 2nd year (NIAT Admissions Handbook 2026, Section 2.1).',
    note: 'This is guidance only. Final eligibility is confirmed by the admissions office during document verification.'
  };
}

async function publicDataCall(fn) {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof PublicDataError) return { error: err.message, code: err.code };
    throw err;
  }
}

const TOOLS = [
  {
    name: 'search_knowledge_base',
    label: 'Searched the official handbook',
    description: 'Search the verified NIAT Admissions Handbook (programs, eligibility, fees, scholarships, NSAT exam, application dates, campus, hostel, placements, parent FAQs). Always use this before answering factual questions about NIAT. Write the query in English.',
    schema: {
      type: 'object',
      properties: { query: { type: 'string', description: 'Search query in English, e.g. "hostel fees" or "NSAT syllabus"' } },
      required: ['query']
    },
    run: (ctx, { query }) => {
      const docs = retrieveKnowledge(expandQueryToEnglish(String(query || '')), ctx.knowledgeDocs, 3);
      for (const d of docs) {
        if (!ctx.sources.some(s => s.title === d.title)) {
          ctx.sources.push({ title: d.title, reference: d.source_reference, category: d.category });
        }
      }
      return docs.length
        ? { results: docs.map(d => ({ title: d.title, source: d.source_reference, content: d.content })) }
        : { results: [], note: 'No verified document matched. Do not guess; offer a human counsellor.' };
    }
  },
  {
    name: 'check_eligibility',
    label: 'Checked B.Tech eligibility',
    description: "Check whether the student meets NIAT B.Tech eligibility. Any argument left out is taken from the student's saved profile.",
    schema: {
      type: 'object',
      properties: {
        current_education: { type: 'string', description: 'Education/stream, e.g. "Class 12 PCM", "12th Commerce", "Diploma in CSE"' },
        class_12_percentage: { type: 'number', description: 'Class 12 aggregate percentage, e.g. 72.5' },
        class_12_passing_year: { type: 'integer', description: 'Year of passing Class 12, e.g. 2027' }
      }
    },
    run: (ctx, args) => checkEligibility(ctx, args)
  },
  {
    name: 'list_upcoming_events',
    label: 'Looked up upcoming events',
    description: 'List upcoming NIAT events (webinars, campus tours, workshops, parent orientations) with their IDs, dates, seats left and whether the student is already registered.',
    schema: {
      type: 'object',
      properties: { category: { type: 'string', description: 'Optional filter, e.g. "webinar" or "workshop"' } }
    },
    run: (ctx, { category } = {}) => {
      const events = listUpcomingEvents(ctx.db, ctx.userId, { category });
      return { events };
    }
  },
  {
    name: 'register_for_event',
    label: 'Registered for an event',
    isAction: true,
    description: 'Register the student for an event by its ID and issue a ticket. Only call this when the student has clearly asked to register for that specific event. Call list_upcoming_events first if you do not know the ID.',
    schema: {
      type: 'object',
      properties: { event_id: { type: 'integer', description: 'The event ID from list_upcoming_events' } },
      required: ['event_id']
    },
    run: (ctx, { event_id }) => {
      const result = registerForEvent(ctx.db, ctx.userId, event_id);
      return {
        status: result.status,
        eventId: result.event ? result.event.id : event_id,
        eventTitle: result.event ? result.event.title : null,
        eventDate: result.event ? result.event.event_date : null,
        venueOrLink: result.event ? result.event.venue_or_link : null,
        ticketNumber: result.ticketNumber || null
      };
    }
  },
  {
    name: 'get_my_application_status',
    label: 'Checked your application status',
    description: "Get the student's own admission profile: application stage, program of interest, academic details and event registrations with ticket numbers.",
    schema: { type: 'object', properties: {} },
    run: ctx => getApplicationStatus(ctx.db, ctx.userId)
  },
  {
    name: 'request_counselling',
    label: 'Requested a counselling session',
    isAction: true,
    description: 'Book a 1-on-1 session with a human admission counsellor for the student. Only call this when the student asks to talk to or book a counsellor.',
    schema: {
      type: 'object',
      properties: {
        topic: { type: 'string', description: 'What the student wants to discuss' },
        preferred_date: { type: 'string', description: 'Preferred date if the student gave one, e.g. "2026-12-02" or "next Monday"' },
        preferred_time: { type: 'string', description: 'Preferred time if the student gave one, e.g. "evening"' }
      },
      required: ['topic']
    },
    run: (ctx, { topic, preferred_date, preferred_time }) =>
      requestCounselling(ctx.db, ctx.userId, { topic, preferredDate: preferred_date, preferredTime: preferred_time })
  },
  {
    name: 'lookup_pincode',
    label: 'Looked up pincode (India Post)',
    description: 'Look up an Indian pincode using the public India Post directory to get the district, state and post offices.',
    schema: {
      type: 'object',
      properties: { pincode: { type: 'string', description: '6-digit Indian pincode, e.g. "500032"' } },
      required: ['pincode']
    },
    run: (ctx, { pincode }) => publicDataCall(() => lookupPincode(pincode))
  },
  {
    name: 'analyze_github_profile',
    label: 'Reviewed GitHub profile',
    description: "Analyse a student's public GitHub profile (projects, languages, stars, recent activity) to give indicative feedback for the Young Innovator Scholarship.",
    schema: {
      type: 'object',
      properties: { username: { type: 'string', description: 'GitHub username or profile URL' } },
      required: ['username']
    },
    run: (ctx, { username }) => publicDataCall(() => analyzeGithubProfile(username))
  }
];

const TOOLS_BY_NAME = Object.fromEntries(TOOLS.map(tool => [tool.name, tool]));

/**
 * Builds an executor bound to one request. It records every call so the UI
 * can show what the agent did.
 */
function createToolExecutor(ctx) {
  ctx.sources = ctx.sources || [];
  ctx.toolCalls = ctx.toolCalls || [];

  return async function executeTool(name, rawArgs) {
    const tool = TOOLS_BY_NAME[name];
    const args = rawArgs && typeof rawArgs === 'object' ? rawArgs : {};
    if (!tool) {
      ctx.toolCalls.push({ name, label: name, args, ok: false });
      return { error: `Unknown tool "${name}"` };
    }
    try {
      const result = await tool.run(ctx, args);
      const ok = !(result && result.error);
      ctx.toolCalls.push({ name, label: tool.label, args, ok, isAction: Boolean(tool.isAction) });
      return result;
    } catch (err) {
      console.error(`Agent tool ${name} failed:`, err);
      ctx.toolCalls.push({ name, label: tool.label, args, ok: false, isAction: Boolean(tool.isAction) });
      return { error: 'The tool failed to run. Tell the student to try again later.' };
    }
  };
}

module.exports = {
  TOOLS,
  TOOLS_BY_NAME,
  createToolExecutor,
  checkEligibility
};
