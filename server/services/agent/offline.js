// ========================================================
// Offline agent – used when no LLM key is configured (or the LLM call fails).
// A rule-based planner picks a tool from the message, runs it through the same
// executor as the LLM agents, and writes the answer from fixed templates.
// ========================================================

const { generateAdmissionChatResponse } = require('../aiService');
const { t, hasConcept, expandQueryToEnglish } = require('./i18n');

const RE = {
  githubUrl: /github\.com\/([A-Za-z0-9-]+)/i,
  github: /\bgithub\b(?:\s+(?:user(?:name)?|profile|id|account|handle))?\s*(?:is|:|-)?\s*@?([A-Za-z0-9](?:[A-Za-z0-9-]{0,38}))/i,
  pincode: /\b([1-9]\d{5})\b/,
  pincodeWord: /\b(pin\s?code|pin|postal|zip)\b/i,
  register: /\b(register|sign\s?me\s?up|sign\s?up|enrol+|book\s+(?:a\s+)?(?:seat|ticket|spot)|reserve)\b/i,
  eventWord: /\b(events?|webinars?|workshops?|masterclass(?:es)?|sessions?|tours?|orientations?|fairs?|calendar)\b/i,
  eventId: /(?:event|id|#|no\.?|number)\s*[:#-]?\s*(\d{1,5})\b/i,
  counsellingAsk: /\b(book|schedule|request|arrange|talk|speak|call|connect|need|want)\b.*\b(counsell?or|counsell?ing|advisor|human)\b|\b(counsell?or|counsell?ing)\b.*\b(book|schedule|request|please)\b/i,
  status: /\b(my\s+(application|status|registrations?|tickets?|profile)|application\s+status|where\s+do\s+i\s+stand)\b/i,
  eligibility: /\b(eligib\w*|qualify|qualif\w*|can\s+i\s+(?:apply|join|get\s+admission))\b/i,
  percentage: /(\d{2,3}(?:\.\d+)?)\s*(?:%|percent|per\s?cent|marks)/i,
  year: /\b(20[1-3]\d)\b/
};

function formatEvents(events) {
  return events.map(e =>
    `- **#${e.id} ${e.title}** – ${e.date}, ${e.time} (${e.mode})${e.alreadyRegistered ? ` ✅ ${e.ticketNumber}` : ` · ${e.seatsLeft} seats left`}`
  ).join('\n');
}

function planFromMessage(message) {
  const text = String(message || '');

  const ghUrl = text.match(RE.githubUrl);
  if (ghUrl) return { tool: 'analyze_github_profile', args: { username: ghUrl[1] } };
  const gh = text.match(RE.github);
  if (gh && !/^(profile|account|user|username|id|handle|for|and|the|is|my)$/i.test(gh[1])) {
    return { tool: 'analyze_github_profile', args: { username: gh[1] } };
  }

  const pin = text.match(RE.pincode);
  if (pin && (RE.pincodeWord.test(text) || hasConcept(text, 'pincode') || text.trim() === pin[1])) {
    return { tool: 'lookup_pincode', args: { pincode: pin[1] } };
  }

  const wantsRegister = RE.register.test(text) || hasConcept(text, 'register');
  const mentionsEvent = RE.eventWord.test(text) || hasConcept(text, 'event');
  if (wantsRegister && (mentionsEvent || RE.eventId.test(text))) {
    const id = text.match(RE.eventId) || (hasConcept(text, 'event') ? text.match(/(?<!\d)(\d{1,5})(?!\d)/) : null);
    return id ? { tool: 'register_for_event', args: { event_id: parseInt(id[1], 10) } } : { tool: 'list_upcoming_events', args: {}, askWhich: true };
  }

  if (RE.counsellingAsk.test(text) || hasConcept(text, 'counselling')) {
    return { tool: 'request_counselling', args: { topic: text.slice(0, 200) } };
  }

  if (RE.status.test(text) || hasConcept(text, 'status')) {
    return { tool: 'get_my_application_status', args: {} };
  }

  if (mentionsEvent && !/\bfee|cost|scholarship\b/i.test(text)) {
    return { tool: 'list_upcoming_events', args: {} };
  }

  const pct = text.match(RE.percentage);
  const asksEligibility = RE.eligibility.test(text) || hasConcept(text, 'eligibility');
  const personal = /\b(am i|can i|i am|i'm|my|me)\b/i.test(text) || hasConcept(text, 'eligibility');
  if (asksEligibility && (pct || personal || /\b(pcm|commerce|arts|humanities|diploma|science|bipc)\b/i.test(text))) {
    const args = {};
    if (pct) args.class_12_percentage = parseFloat(pct[1]);
    if (/\b(pcm|mpc|commerce|arts|humanities|diploma|science|bipc|physics|math)/i.test(text)) args.current_education = text;
    const yr = text.match(RE.year);
    if (yr) args.class_12_passing_year = parseInt(yr[1], 10);
    return { tool: 'check_eligibility', args };
  }

  return { tool: 'search_knowledge_base', args: { query: text } };
}

async function runOffline({ message, language, executeTool, knowledgeDocs, ctx }) {
  const plan = planFromMessage(message);
  const lang = language;
  const note = lang !== 'en' ? `${t(lang, 'englishNote')}\n\n` : '';

  if (plan.tool === 'search_knowledge_base') {
    // Reuse the verified-answer builder, but record the search as a tool call.
    await executeTool('search_knowledge_base', { query: message });
    if (ctx.sources.length === 0) {
      return { text: t(lang, 'noMatch'), suggestCounselling: true };
    }
    const answer = await generateAdmissionChatResponse(expandQueryToEnglish(message), [], knowledgeDocs, { skipLlm: true });
    return { text: `${note}${answer.reply}` };
  }

  const result = await executeTool(plan.tool, plan.args);

  switch (plan.tool) {
    case 'list_upcoming_events': {
      if (!result.events || result.events.length === 0) return { text: t(lang, 'noEvents') };
      const header = plan.askWhich ? t(lang, 'whichEvent') : t(lang, 'eventsHeader');
      return { text: `${header}\n\n${formatEvents(result.events)}` };
    }
    case 'register_for_event': {
      const vars = { title: result.eventTitle, ticket: result.ticketNumber };
      if (result.status === 'registered') return { text: `${t(lang, 'registered', vars)}\n📅 ${result.eventDate} · ${result.venueOrLink}` };
      if (result.status === 'already_registered') return { text: t(lang, 'alreadyRegistered', vars) };
      if (result.status === 'full') return { text: t(lang, 'eventFull', vars) };
      const events = await executeTool('list_upcoming_events', {});
      return { text: `${t(lang, 'eventNotFound')}\n\n${formatEvents(events.events || [])}` };
    }
    case 'request_counselling':
      return { text: t(lang, 'counsellingRequested') };
    case 'get_my_application_status': {
      const regs = result.eventRegistrations.length
        ? result.eventRegistrations.map(r => `  - ${r.title} (${r.date}) – ${r.ticketNumber}`).join('\n')
        : '  - none';
      return {
        text: `${t(lang, 'statusHeader')}\n\n` +
          `- **Stage:** ${result.applicationStage || 'INQUIRY'}\n` +
          `- **Program:** ${result.interestedProgram || '-'}\n` +
          `- **Education:** ${result.currentEducation || '-'}${result.class12Percentage ? ` (${result.class12Percentage}%)` : ''}\n` +
          `- **Event tickets:**\n${regs}`
      };
    }
    case 'check_eligibility': {
      const verdictText = {
        likely_eligible: '✅ Likely eligible',
        eligible_lateral_entry: '✅ Eligible for lateral entry (2nd year)',
        needs_verification: 'ℹ️ Needs verification',
        not_eligible: '❌ Does not meet the B.Tech requirements'
      }[result.verdict];
      return {
        text: `${t(lang, 'eligibilityHeader')} **${verdictText}**\n\n${note}` +
          `- ${result.education}\n- ${result.marks}\n- ${result.timeline}\n\n_${result.rule}_\n\n${result.note}`,
        suggestCounselling: result.verdict !== 'likely_eligible'
      };
    }
    case 'lookup_pincode': {
      if (result.error) return { text: result.code === 'UNAVAILABLE' || result.code === 'RATE_LIMITED' ? t(lang, 'unavailable') : t(lang, 'pincodeNotFound') };
      return {
        text: `${t(lang, 'pincodeHeader')}\n\n- **${result.pincode}** → ${result.district}, ${result.state}\n- Post offices: ${result.postOffices.join(', ')}`
      };
    }
    case 'analyze_github_profile': {
      if (result.error) return { text: result.code === 'NOT_FOUND' ? t(lang, 'githubNotFound') : t(lang, 'unavailable') };
      const r = result.scholarshipReadiness;
      const langs = result.topLanguages.map(l => l.name).join(', ') || '-';
      const repos = result.topRepos.map(x => `  - [${x.name}](${x.url}) ⭐ ${x.stars}${x.language ? ` · ${x.language}` : ''}`).join('\n') || '  - -';
      return {
        text: `${t(lang, 'githubHeader')}\n\n` +
          `- **${result.name || result.username}** – ${result.originalRepos} original repos, ⭐ ${result.totalStars} stars, ${result.followers} followers\n` +
          `- Languages: ${langs}\n- Active repos (last 90 days): ${result.reposActiveLast90Days}\n- Top projects:\n${repos}\n\n` +
          `**Readiness: ${r.level} (${r.score}/100)**\n_${r.note}_`
      };
    }
    default:
      return { text: t(lang, 'noMatch'), suggestCounselling: true };
  }
}

module.exports = { runOffline, planFromMessage };
