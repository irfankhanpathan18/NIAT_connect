// ========================================================
// NIAT Connect – AI Service Engine
// 1. Lead Qualification & Scoring Engine (0-100, Hot/Warm/Cold/Unqualified)
// 2. RAG (Retrieval-Augmented Generation) AI Admission Chatbot
// ========================================================

/**
 * Computes AI Lead Score and Classification
 * @param {Object} lead 
 * @returns {Object} { score, classification, breakdown, summary }
 */
function evaluateLeadScore(lead) {
  const breakdown = [];
  let totalScore = 0;

  // 1. Admission Interest Level (Max 30 pts)
  let interestScore = 15;
  let interestRationale = 'Standard interest level';
  const interest = (lead.admission_interest_level || 'Medium').toLowerCase();
  if (interest === 'high') {
    interestScore = 30;
    interestRationale = 'High student intent and proactive admission engagement';
  } else if (interest === 'medium') {
    interestScore = 18;
    interestRationale = 'Moderate interest, evaluating multiple technology colleges';
  } else {
    interestScore = 6;
    interestRationale = 'Low or passive interest; exploring casual options';
  }
  breakdown.push({
    factor: 'Admission Interest Level',
    score: interestScore,
    maxScore: 30,
    rationale: interestRationale
  });
  totalScore += interestScore;

  // 2. Academic Timeline & Year (Max 20 pts)
  let timelineScore = 5;
  let timelineRationale = 'Undecided or distant intake';
  const currentYear = 2026;
  const passingYear = parseInt(lead.class_12_passing_year, 10);
  if (passingYear === currentYear || passingYear === currentYear - 1) {
    timelineScore = 20;
    timelineRationale = `Immediate intake batch (${passingYear}); high urgency for seat confirmation`;
  } else if (passingYear === currentYear + 1) {
    timelineScore = 14;
    timelineRationale = `Upcoming year (${passingYear}); early research phase`;
  } else if (passingYear < currentYear - 2) {
    timelineScore = 4;
    timelineRationale = `Gap year or non-traditional timeline (${passingYear})`;
  }
  breakdown.push({
    factor: 'Timeline Urgency & Passing Year',
    score: timelineScore,
    maxScore: 20,
    rationale: timelineRationale
  });
  totalScore += timelineScore;

  // 3. Counselling & Engagement Status (Max 20 pts)
  let statusScore = 8;
  let statusRationale = 'New inquiry without prior touchpoint';
  const status = (lead.counselling_status || 'New').toLowerCase();
  if (status.includes('admitted') || status.includes('document')) {
    statusScore = 20;
    statusRationale = 'Student in final admission or document verification pipeline';
  } else if (status.includes('completed')) {
    statusScore = 18;
    statusRationale = 'Counselling completed; positive interaction recorded';
  } else if (status.includes('scheduled')) {
    statusScore = 15;
    statusRationale = 'Counselling session booked and pending attendance';
  } else if (status.includes('contacted')) {
    statusScore = 12;
    statusRationale = 'Initial call completed; student responded positively';
  } else if (status.includes('dropped')) {
    statusScore = 0;
    statusRationale = 'Student opted out or chose another institution';
  }
  breakdown.push({
    factor: 'Counselling & Engagement Status',
    score: statusScore,
    maxScore: 20,
    rationale: statusRationale
  });
  totalScore += statusScore;

  // 4. Lead Source Quality (Max 15 pts)
  let sourceScore = 8;
  let sourceRationale = 'Standard inbound channel';
  const source = (lead.lead_source || 'Website').toLowerCase();
  if (source.includes('fair') || source.includes('campus') || source.includes('webinar')) {
    sourceScore = 15;
    sourceRationale = 'High-touch source (Webinar / Campus Visit / Education Fair)';
  } else if (source.includes('referral')) {
    sourceScore = 14;
    sourceRationale = 'Word-of-mouth referral from current student or alumni';
  } else if (source.includes('website') || source.includes('direct')) {
    sourceScore = 11;
    sourceRationale = 'Organic direct inquiry on NIAT portal';
  } else {
    sourceScore = 7;
    sourceRationale = 'Social media or third-party outreach campaign';
  }
  breakdown.push({
    factor: 'Lead Source Intent',
    score: sourceScore,
    maxScore: 15,
    rationale: sourceRationale
  });
  totalScore += sourceScore;

  // 5. Target Program & Education Alignment (Max 15 pts)
  let eduScore = 10;
  let eduRationale = 'Relevant technical education track';
  const edu = (lead.current_education || '').toLowerCase();
  if (edu.includes('12th') || edu.includes('science') || edu.includes('pcm')) {
    eduScore = 15;
    eduRationale = 'Ideal background: 10+2 Science/PCM aligned with B.Tech prerequisites';
  } else if (edu.includes('diploma') || edu.includes('polytechnic')) {
    eduScore = 12;
    eduRationale = 'Eligible for Lateral Entry into 2nd year B.Tech';
  } else if (edu.includes('10th')) {
    eduScore = 6;
    eduRationale = 'Early-stage student; not currently eligible for direct B.Tech';
  }
  breakdown.push({
    factor: 'Eligibility & Program Fit',
    score: eduScore,
    maxScore: 15,
    rationale: eduRationale
  });
  totalScore += eduScore;

  // Additional Intent modifiers from notes or follow-ups
  if (lead.follow_up_date) {
    totalScore = Math.min(100, totalScore + 2);
  }

  // Ensure 0-100 bounds
  totalScore = Math.max(0, Math.min(100, Math.round(totalScore)));

  // Segment Classification
  let classification = 'Warm';
  if (totalScore >= 75) {
    classification = 'Hot';
  } else if (totalScore >= 45) {
    classification = 'Warm';
  } else if (totalScore >= 20) {
    classification = 'Cold';
  } else {
    classification = 'Unqualified';
  }

  const summary = `Lead categorized as ${classification} (Score: ${totalScore}/100) based on ${interestRationale.toLowerCase()} and ${timelineRationale.toLowerCase()}.`;

  return {
    score: totalScore,
    ai_classification: classification,
    breakdown,
    summary
  };
}

/**
 * Retrieval-Augmented Generation (RAG) Query Matcher
 * Retrieves top matching knowledge base records and generates a verified response.
 */
function retrieveKnowledge(query, allDocs, topK = 3) {
  if (!allDocs || allDocs.length === 0) return [];

  const cleanQuery = query.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const queryTokens = cleanQuery.split(/\s+/).filter(t => t.length > 2);

  const scoredDocs = allDocs.map(doc => {
    let matchScore = 0;
    const titleText = (doc.title || '').toLowerCase();
    const contentText = (doc.content || '').toLowerCase();
    const tagsText = (doc.tags || '').toLowerCase();
    const categoryText = (doc.category || '').toLowerCase();

    // Check full query phrase presence
    if (contentText.includes(cleanQuery.trim())) matchScore += 50;
    if (titleText.includes(cleanQuery.trim())) matchScore += 60;

    // Check individual token presence
    for (const token of queryTokens) {
      if (titleText.includes(token)) matchScore += 15;
      if (tagsText.includes(token)) matchScore += 12;
      if (categoryText.includes(token)) matchScore += 8;
      
      const occurrences = (contentText.match(new RegExp(token, 'g')) || []).length;
      matchScore += Math.min(occurrences * 3, 25);
    }

    return {
      doc,
      score: matchScore
    };
  });

  return scoredDocs
    .filter(item => item.score > 5)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(item => item.doc);
}

/**
 * Generates Verified AI Chatbot Answer
 * Uses Gemini API if GEMINI_API_KEY is available, or fallback to deterministic verified RAG synthesis.
 */
async function generateAdmissionChatResponse(userMessage, conversationHistory = [], knowledgeDocs = []) {
  const matchedDocs = retrieveKnowledge(userMessage, knowledgeDocs, 3);
  const sources = matchedDocs.map(d => ({
    title: d.title,
    reference: d.source_reference,
    category: d.category
  }));

  const geminiKey = process.env.GEMINI_API_KEY;

  if (geminiKey) {
    try {
      const contextText = matchedDocs.map(d => 
        `[Document: ${d.title} | Source: ${d.source_reference}]\n${d.content}`
      ).join('\n\n---\n\n');

      const systemPrompt = `You are the official NIAT AI Assistant for NextGen Institute of Advanced Technology (NIAT).
Your goal is to assist prospective students and parents with accurate, encouraging, and professional admission guidance.

CRITICAL INSTRUCTIONS:
1. Ground your answers strictly in the verified NIAT Knowledge Base provided below.
2. NEVER fabricate fees, scholarships, placement figures, or dates.
3. If information is not in the knowledge base, state clearly that you don't have verified official data for that detail and invite them to schedule a 1-on-1 session with a human admission counsellor.
4. Always cite sources at the end in markdown format (e.g. "[Source: NIAT Admissions Handbook 2026, Section 2.1]").
5. Keep tone warm, inspiring, structured, and modern. Use bullet points and bold highlights.

VERIFIED NIAT KNOWLEDGE BASE:
${contextText || 'No specific document matched this query.'}
`;

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
      const payload = {
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\nUser Question: ${userMessage}` }]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 800
        }
      };

      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (resp.ok) {
        const json = await resp.json();
        const generatedText = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (generatedText) {
          return {
            reply: generatedText,
            sources,
            isGeminiPowered: true
          };
        }
      }
    } catch (err) {
      console.warn('Gemini API call failed, falling back to verified RAG engine:', err.message);
    }
  }

  // Fallback to high quality deterministic verified RAG engine
  if (matchedDocs.length === 0) {
    return {
      reply: `Thank you for asking! I do not have a verified official record regarding that specific query in the **NIAT 2026 Admissions Handbook**.

To prevent any misinformation regarding eligibility, fees, or program specifics, our institutional policy requires verified guidance.

💡 **Next Steps:**
- You can browse our official [Events & Webinars](#/events) to meet our academic deans.
- Or click below to **Request a 1-on-1 Human Counselling Session** with an authorized NIAT Admission Officer.`,
      sources: [],
      isGeminiPowered: false,
      suggestCounselling: true
    };
  }

  // Synthesize answer directly from highest-scoring matched docs
  const primaryDoc = matchedDocs[0];
  const secondaryDocs = matchedDocs.slice(1);

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
  generateAdmissionChatResponse
};
