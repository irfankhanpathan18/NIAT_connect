// ========================================================
// NIAT Connect – AI Service Engine
// 1. Lead Qualification & Scoring Engine (0-100, Hot/Warm/Cold/Unqualified)
// 2. RAG (Retrieval-Augmented Generation) AI Admission Chatbot
// ========================================================

// --------------------------------------------------------
// Shared helpers
// --------------------------------------------------------

/**
 * The admission cycle for a batch starting in August of year Y runs from
 * roughly August of Y-1 to July of Y. Can be pinned with ADMISSION_INTAKE_YEAR.
 */
function getIntakeYear(now = new Date()) {
  const pinned = parseInt(process.env.ADMISSION_INTAKE_YEAR, 10);
  if (!Number.isNaN(pinned)) return pinned;
  return now.getMonth() >= 7 ? now.getFullYear() + 1 : now.getFullYear();
}

function normalize(value) {
  return String(value ?? '').trim().toLowerCase();
}

// --------------------------------------------------------
// 1. Lead scoring
// --------------------------------------------------------

const MIN_PCM_PERCENTAGE = 60;          // NIAT Admissions Handbook 2026, Section 2.1
const MIN_RESERVED_PCM_PERCENTAGE = 55; // reserved / merit categories

/**
 * Classifies the academic background against B.Tech prerequisites
 * (Physics + Mathematics mandatory in Class 12, or a relevant diploma).
 */
function assessEducation(rawEducation) {
  const edu = normalize(rawEducation);

  if (!edu) {
    return { route: 'unknown', score: 7, ineligible: false, rationale: 'Education details not provided; verify Class 12 PCM background' };
  }
  if (/diploma|polytechnic/.test(edu)) {
    return { route: 'diploma', score: 12, ineligible: false, rationale: 'Diploma holder: eligible for Lateral Entry into 2nd year B.Tech (65%+ required)' };
  }

  const hasPcm = /\b(pcm|pcmb|pcmc|mpc)\b/.test(edu) || (/physics/.test(edu) && /math/.test(edu));
  const ineligibleStream = /\b(arts?|humanities|commerce|b\.?\s?com|b\.?\s?a|bipc|pcb)\b/.test(edu);

  if (!hasPcm && ineligibleStream) {
    return { route: 'ineligible', score: 0, ineligible: true, rationale: 'Stream does not include Physics + Mathematics, which B.Tech requires (Handbook Section 2.1)' };
  }
  if (hasPcm || /science/.test(edu)) {
    return { route: 'class12', score: 15, ineligible: false, rationale: 'Ideal background: 10+2 Science/PCM aligned with B.Tech prerequisites' };
  }
  if (/\b10th\b|\bssc\b|high school/.test(edu) && !/\b12th\b|\binter|\bhsc\b|\bpu\b/.test(edu)) {
    return { route: 'early', score: 4, ineligible: false, rationale: 'Early-stage student (Class 10); not yet eligible for direct B.Tech entry' };
  }
  if (/\b12th\b|\binter(mediate)?\b|\bhsc\b|\bpu\b|\bpuc\b|\bhse\b|class 12/.test(edu)) {
    return { route: 'class12', score: 9, ineligible: false, rationale: 'Class 12 student, stream not specified; verify Physics + Mathematics' };
  }
  if (/b\.?\s?sc|b\.?\s?tech|graduat|degree/.test(edu)) {
    return { route: 'graduate', score: 6, ineligible: false, rationale: 'Graduate applicant; verify Class 12 PCM eligibility' };
  }
  return { route: 'unknown', score: 7, ineligible: false, rationale: 'Education background unclear; verify Class 12 PCM eligibility' };
}

function assessMarks(rawPercentage, educationRoute) {
  const pct = parseFloat(rawPercentage);
  if (Number.isNaN(pct)) {
    return { score: 5, belowMinimum: false, rationale: 'Class 12 aggregate not provided' };
  }
  if (educationRoute === 'diploma') {
    return { score: 5, belowMinimum: false, rationale: `Class 12 aggregate ${pct}% (lateral entry is judged on diploma marks)` };
  }
  if (pct >= 85) return { score: 10, belowMinimum: false, rationale: `Excellent aggregate (${pct}%); strong scholarship candidate` };
  if (pct >= 75) return { score: 8, belowMinimum: false, rationale: `Strong aggregate (${pct}%)` };
  if (pct >= MIN_PCM_PERCENTAGE) return { score: 6, belowMinimum: false, rationale: `Meets the ${MIN_PCM_PERCENTAGE}% PCM minimum (${pct}%)` };
  if (pct >= MIN_RESERVED_PCM_PERCENTAGE) {
    return { score: 3, belowMinimum: false, rationale: `${pct}% meets only the ${MIN_RESERVED_PCM_PERCENTAGE}% reserved/merit-category minimum` };
  }
  return { score: 0, belowMinimum: true, rationale: `${pct}% is below the ${MIN_RESERVED_PCM_PERCENTAGE}% minimum aggregate (Handbook Section 2.1)` };
}

/**
 * Computes AI Lead Score and Classification.
 * The score prioritises outreach only; a human always makes admission decisions.
 * @param {Object} lead
 * @returns {Object} { score, ai_classification, breakdown, summary, flags }
 */
function evaluateLeadScore(lead, now = new Date()) {
  const breakdown = [];
  const flags = [];
  let totalScore = 0;
  const add = (factor, score, maxScore, rationale) => {
    breakdown.push({ factor, score, maxScore, rationale });
    totalScore += score;
  };

  // 1. Admission Interest Level (max 25)
  const interest = normalize(lead.admission_interest_level);
  if (interest === 'high') {
    add('Admission Interest Level', 25, 25, 'High student intent and proactive admission engagement');
  } else if (interest === 'low') {
    add('Admission Interest Level', 5, 25, 'Low or passive interest; exploring casual options');
  } else if (interest === 'medium') {
    add('Admission Interest Level', 15, 25, 'Moderate interest, evaluating multiple technology colleges');
  } else {
    add('Admission Interest Level', 15, 25, 'Interest level not recorded; assumed moderate');
  }

  // 2. Timeline urgency (max 20)
  const intakeYear = getIntakeYear(now);
  const passingYear = parseInt(lead.class_12_passing_year, 10);
  if (Number.isNaN(passingYear)) {
    add('Timeline Urgency & Passing Year', 8, 20, 'Class 12 passing year not provided');
  } else if (passingYear === intakeYear) {
    add('Timeline Urgency & Passing Year', 20, 20, `Immediate intake batch (${passingYear}); high urgency for seat confirmation`);
  } else if (passingYear === intakeYear - 1 || passingYear === intakeYear - 2) {
    add('Timeline Urgency & Passing Year', 16, 20, `Recent pass-out (${passingYear}); eligible for the ${intakeYear} intake`);
  } else if (passingYear > intakeYear) {
    add('Timeline Urgency & Passing Year', 12, 20, `Future batch (${passingYear}); early research phase`);
  } else {
    add('Timeline Urgency & Passing Year', 4, 20, `Passed in ${passingYear}, outside the standard eligibility window; needs verification`);
  }

  // 3. Counselling & engagement status (max 20)
  const status = normalize(lead.counselling_status) || 'new';
  if (status.includes('admitted') || status.includes('document')) {
    add('Counselling & Engagement Status', 20, 20, 'Student in final admission or document verification pipeline');
  } else if (status.includes('completed')) {
    add('Counselling & Engagement Status', 18, 20, 'Counselling completed; positive interaction recorded');
  } else if (status.includes('scheduled')) {
    add('Counselling & Engagement Status', 15, 20, 'Counselling session booked and pending attendance');
  } else if (status.includes('contacted')) {
    add('Counselling & Engagement Status', 12, 20, 'Initial call completed; student responded');
  } else if (status.includes('dropped')) {
    add('Counselling & Engagement Status', 0, 20, 'Student opted out or chose another institution');
  } else {
    add('Counselling & Engagement Status', 8, 20, 'New inquiry without prior touchpoint');
  }

  // 4. Lead source quality (max 10)
  const source = normalize(lead.lead_source) || 'website';
  if (/fair|campus|webinar/.test(source)) {
    add('Lead Source Intent', 10, 10, 'High-touch source (Webinar / Campus Visit / Education Fair)');
  } else if (source.includes('referral')) {
    add('Lead Source Intent', 9, 10, 'Word-of-mouth referral from current student or alumni');
  } else if (/website|direct/.test(source)) {
    add('Lead Source Intent', 7, 10, 'Organic direct inquiry on NIAT portal');
  } else {
    add('Lead Source Intent', 5, 10, 'Social media or third-party outreach campaign');
  }

  // 5. Eligibility & program fit (max 15)
  const education = assessEducation(lead.current_education);
  add('Eligibility & Program Fit', education.score, 15, education.rationale);
  if (education.ineligible) flags.push(education.rationale);

  // 6. Academic performance (max 10)
  const marks = assessMarks(lead.class_12_percentage, education.route);
  add('Academic Performance (Class 12)', marks.score, 10, marks.rationale);
  if (marks.belowMinimum) flags.push(marks.rationale);

  // Small intent bonus when a follow-up is already planned
  if (lead.follow_up_date) totalScore += 2;

  totalScore = Math.max(0, Math.min(100, Math.round(totalScore)));

  // Leads that miss a hard academic requirement are surfaced as Unqualified
  // for human review. They are never rejected automatically.
  if (flags.length > 0) totalScore = Math.min(totalScore, 19);

  let classification;
  if (totalScore >= 75) classification = 'Hot';
  else if (totalScore >= 45) classification = 'Warm';
  else if (totalScore >= 20) classification = 'Cold';
  else classification = 'Unqualified';

  const summary = flags.length > 0
    ? `Lead categorized as ${classification} (Score: ${totalScore}/100) pending human review: ${flags.join('; ')}.`
    : `Lead categorized as ${classification} (Score: ${totalScore}/100) based on ${breakdown[0].rationale.toLowerCase()} and ${breakdown[1].rationale.toLowerCase()}.`;

  return {
    score: totalScore,
    ai_classification: classification,
    breakdown,
    summary,
    flags
  };
}

// --------------------------------------------------------
// 2. Knowledge retrieval (RAG)
// --------------------------------------------------------

const STOPWORDS = new Set(`
a about above after again all also am an and any are as at be because been before being below between both but by
can could did do does doing down during each few for from further had has have having he her here hers him his how
i if in into is it its itself just know let like me more most my no nor not now of off on once only or other our ours
out over own please same she should so some such tell than that the their them then there these they this those
through to too under until up very want was we were what when where which while who whom why will with would you
your yours give get got any anything something someone niat college institute university student
`.split(/\s+/).filter(Boolean));

const GREETINGS = new Set(['hi', 'hii', 'hello', 'hey', 'hlo', 'namaste', 'thanks', 'thank', 'ok', 'okay', 'bye', 'good', 'morning', 'evening', 'afternoon']);

// Everyday words mapped onto the vocabulary used in the knowledge base.
const SYNONYMS = {
  cost: ['fee', 'tuition'], price: ['fee', 'tuition'], expensive: ['fee'], afford: ['fee', 'loan', 'scholarship'],
  pay: ['fee', 'payment', 'installment'], payment: ['fee', 'installment'], charge: ['fee'], money: ['fee', 'scholarship'],
  emi: ['installment', 'loan'], loan: ['loan'],
  stay: ['hostel', 'accommodation'], live: ['hostel'], living: ['hostel'], room: ['hostel'], dorm: ['hostel'],
  accommodation: ['hostel'], mess: ['hostel'], food: ['mess', 'hostel'],
  discount: ['scholarship', 'waiver'], waiver: ['scholarship'], concession: ['scholarship'], free: ['scholarship', 'waiver'],
  job: ['placement', 'career'], salary: ['placement', 'package'], package: ['placement'], recruiter: ['placement'],
  company: ['placement', 'partner'], internship: ['placement', 'internship'], career: ['placement'],
  eligible: ['eligibility', 'criteria'], qualify: ['eligibility'], requirement: ['eligibility'], criteria: ['eligibility'],
  cutoff: ['eligibility', 'aggregate'], marks: ['eligibility', 'aggregate'], percent: ['aggregate', 'eligibility'],
  percentage: ['aggregate', 'eligibility'],
  apply: ['application', 'procedure'], deadline: ['date', 'application'], last: ['date'],
  join: ['admission', 'eligibility'], admission: ['admission'],
  exam: ['nsat', 'test'], entrance: ['nsat'], test: ['nsat'], syllabus: ['nsat', 'syllabus'],
  course: ['program', 'b.tech'], branch: ['program'], degree: ['program'], subject: ['curriculum'],
  lab: ['campus', 'facility'], library: ['campus', 'facility'], sport: ['campus', 'facility'], wifi: ['campus'],
  safe: ['safety'], safety: ['safety'], security: ['safety'], girl: ['safety', 'hostel'], parent: ['parent'],
  lateral: ['diploma', 'lateral'], diploma: ['diploma', 'lateral']
};

function stem(word) {
  if (word.length > 4 && word.endsWith('ies')) return `${word.slice(0, -3)}y`;
  if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
  return word;
}

function tokenize(text) {
  return normalize(text)
    .replace(/[^a-z0-9.\s]/g, ' ')
    .replace(/\.(?=\s|$)/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map(stem);
}

function queryTerms(query) {
  const words = tokenize(query).filter(t => t.length > 1 && !STOPWORDS.has(t));
  const terms = new Map(); // term -> weight
  for (const word of words) {
    terms.set(word, 1);
    for (const syn of SYNONYMS[word] || []) {
      const s = stem(syn);
      if (!terms.has(s)) terms.set(s, 0.8);
    }
  }
  return { words, terms };
}

function isGreeting(query) {
  const words = tokenize(query);
  return words.length > 0 && words.length <= 4 && words.every(w => GREETINGS.has(w) || STOPWORDS.has(w));
}

/**
 * Retrieves the top matching knowledge base records using whole-word matching,
 * stopword removal and synonym expansion. Returns [] when nothing is relevant.
 */
function retrieveKnowledge(query, allDocs, topK = 3) {
  if (!allDocs || allDocs.length === 0) return [];

  const { words, terms } = queryTerms(query);
  if (terms.size === 0) return [];

  const scored = allDocs.map(doc => {
    const title = new Set(tokenize(doc.title));
    const tags = new Set(tokenize(doc.tags));
    const category = new Set(tokenize(String(doc.category || '').replace(/_/g, ' ')));
    const contentCounts = new Map();
    for (const w of tokenize(doc.content)) contentCounts.set(w, (contentCounts.get(w) || 0) + 1);

    let score = 0;
    let strongHits = 0;
    let matchedTerms = 0;
    for (const [term, weight] of terms) {
      let termScore = 0;
      if (title.has(term)) termScore += 15;
      if (tags.has(term)) termScore += 12;
      if (category.has(term)) termScore += 8;
      if (termScore > 0) strongHits++;
      termScore += Math.min((contentCounts.get(term) || 0) * 3, 15);
      if (termScore > 0) matchedTerms++;
      score += termScore * weight;
    }

    // Bonus when a multi-word question appears verbatim in the document
    if (words.length >= 2) {
      const phrase = words.join(' ');
      if (tokenize(doc.content).join(' ').includes(phrase)) score += 20;
    }

    return { doc, score, strongHits, matchedTerms };
  });

  return scored
    .filter(item => item.score >= 12 && (item.strongHits > 0 || item.matchedTerms >= 2))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(item => item.doc);
}

// --------------------------------------------------------
// 3. Chat response generation
// --------------------------------------------------------

const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

function buildSystemPrompt(matchedDocs) {
  const contextText = matchedDocs.map(d =>
    `[Document: ${d.title} | Source: ${d.source_reference}]\n${d.content}`
  ).join('\n\n---\n\n');

  return `You are the official NIAT AI Assistant for NextGen Institute of Advanced Technology (NIAT).
Your goal is to assist prospective students and parents with accurate, encouraging, and professional admission guidance.

CRITICAL INSTRUCTIONS:
1. Ground your answers strictly in the verified NIAT Knowledge Base provided below.
2. NEVER fabricate fees, scholarships, placement figures, or dates.
3. If information is not in the knowledge base, state clearly that you don't have verified official data for that detail and invite them to schedule a 1-on-1 session with a human admission counsellor.
4. Answer the student's actual question directly first (for example, say whether they meet a criterion), then give supporting details.
5. Always cite sources at the end in markdown format (e.g. "[Source: NIAT Admissions Handbook 2026, Section 2.1]").
6. Keep tone warm, inspiring, structured, and modern. Use bullet points and bold highlights.
7. Politely decline questions unrelated to NIAT admissions, programs, or student life.

VERIFIED NIAT KNOWLEDGE BASE:
${contextText || 'No specific document matched this query.'}
`;
}

/** Converts stored chat history into Gemini `contents`, ending with the current message. */
function buildGeminiContents(userMessage, conversationHistory) {
  const contents = [];
  for (const entry of conversationHistory || []) {
    const role = entry.sender === 'assistant' ? 'model' : 'user';
    const text = String(entry.message || '').trim();
    if (!text) continue;
    if (contents.length === 0 && role === 'model') continue; // must start with the user
    const last = contents[contents.length - 1];
    if (last && last.role === role) {
      last.parts[0].text += `\n\n${text}`;
    } else {
      contents.push({ role, parts: [{ text }] });
    }
  }

  const last = contents[contents.length - 1];
  if (!last || last.role !== 'user' || !last.parts[0].text.endsWith(userMessage)) {
    contents.push({ role: 'user', parts: [{ text: userMessage }] });
  }
  return contents;
}

async function callGemini(apiKey, userMessage, conversationHistory, matchedDocs) {
  const model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: buildSystemPrompt(matchedDocs) }] },
      contents: buildGeminiContents(userMessage, conversationHistory),
      generationConfig: { temperature: 0.2, maxOutputTokens: 1024 }
    }),
    signal: AbortSignal.timeout(20000)
  });

  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    throw new Error(`Gemini API returned ${resp.status} for model "${model}": ${body.slice(0, 200)}`);
  }

  const json = await resp.json();
  const text = json.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('').trim();
  if (!text) throw new Error(`Gemini API returned no text (finishReason: ${json.candidates?.[0]?.finishReason || 'unknown'})`);
  return text;
}

const GREETING_REPLY = `Hello! 👋 I'm the **NIAT AI Admission Assistant**.

I can help you with verified information about:
- **Programs** – B.Tech specialisations and curriculum
- **Eligibility** – Class 12 PCM requirements and minimum marks
- **Fees & Scholarships** – tuition, EMI options and fee waivers
- **NSAT** – the entrance test pattern and syllabus
- **Campus life & Placements** – hostels, labs, internships and recruiters

What would you like to know?`;

const NO_MATCH_REPLY = `Thank you for asking! I do not have a verified official record regarding that specific query in the **NIAT 2026 Admissions Handbook**.

To prevent any misinformation regarding eligibility, fees, or program specifics, our institutional policy requires verified guidance.

💡 **Next Steps:**
- You can browse our official [Events & Webinars](/student/calendar) to meet our academic deans.
- Or click below to **Request a 1-on-1 Human Counselling Session** with an authorized NIAT Admission Officer.`;

/**
 * Generates a verified AI chatbot answer.
 * Uses Gemini when GEMINI_API_KEY is set, otherwise a deterministic answer built from the matched documents.
 */
async function generateAdmissionChatResponse(userMessage, conversationHistory = [], knowledgeDocs = [], options = {}) {
  if (isGreeting(userMessage)) {
    return { reply: GREETING_REPLY, sources: [], isGeminiPowered: false };
  }

  const matchedDocs = retrieveKnowledge(userMessage, knowledgeDocs, 3);
  const sources = matchedDocs.map(d => ({
    title: d.title,
    reference: d.source_reference,
    category: d.category
  }));

  const geminiKey = options.skipLlm ? null : process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const reply = await callGemini(geminiKey, userMessage, conversationHistory, matchedDocs);
      return {
        reply,
        sources,
        isGeminiPowered: true,
        suggestCounselling: matchedDocs.length === 0
      };
    } catch (err) {
      console.warn('Gemini API call failed, falling back to verified RAG engine:', err.message);
    }
  }

  if (matchedDocs.length === 0) {
    return { reply: NO_MATCH_REPLY, sources: [], isGeminiPowered: false, suggestCounselling: true };
  }

  const [primaryDoc, ...secondaryDocs] = matchedDocs;
  let synthesizedReply = `### ${primaryDoc.title}\n\n${primaryDoc.content}\n\n`;

  if (secondaryDocs.length > 0) {
    synthesizedReply += `#### Related Official Information:\n`;
    secondaryDocs.forEach(doc => {
      synthesizedReply += `- **${doc.title}**: ${doc.content.split('\n')[0]}\n`;
    });
    synthesizedReply += `\n`;
  }

  synthesizedReply += `---\n📌 **Official Verification Citation:**\n`;
  matchedDocs.forEach(d => {
    synthesizedReply += `* [${d.source_reference}] - ${d.title}\n`;
  });

  return {
    reply: synthesizedReply,
    sources,
    isGeminiPowered: false
  };
}

module.exports = {
  evaluateLeadScore,
  retrieveKnowledge,
  generateAdmissionChatResponse,
  getIntakeYear,
  assessEducation,
  assessMarks,
  isGreeting,
  buildSystemPrompt,
  MIN_PCM_PERCENTAGE,
  MIN_RESERVED_PCM_PERCENTAGE
};
