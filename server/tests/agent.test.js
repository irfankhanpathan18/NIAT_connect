// Run with: npm test
const { test, describe, before, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { createSeededDb, mockFetch } = require('./helpers');
const { detectLanguage, resolveLanguage, expandQueryToEnglish, isNativeGreeting, t, STRINGS } = require('../services/agent/i18n');
const { planFromMessage } = require('../services/agent/offline');
const { runAgent, chooseProvider } = require('../services/agent');
const { lookupPincode, analyzeGithubProfile, clearPublicDataCache, normalizeGithubUsername } = require('../services/publicData');
const { toGeminiSchema } = require('../services/agent/providers/gemini');

const ENV_KEYS = ['ANTHROPIC_API_KEY', 'GEMINI_API_KEY', 'AGENT_PROVIDER', 'ANTHROPIC_BASE_URL', 'GEMINI_MODEL', 'CLAUDE_MODEL'];
let savedEnv;
beforeEach(() => {
  savedEnv = Object.fromEntries(ENV_KEYS.map(k => [k, process.env[k]]));
  for (const k of ENV_KEYS) delete process.env[k];
  clearPublicDataCache();
});
afterEach(() => {
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
});

let db;
let knowledgeDocs;
let student;
before(async () => {
  db = await createSeededDb();
  knowledgeDocs = db.prepare('SELECT * FROM knowledge_base_documents WHERE is_active = 1').all();
  // Ananya (id 4) has no event registrations in the seed data
  student = db.prepare("SELECT id, name, email, role FROM users WHERE email = 'ananya.verma@gmail.com'").get();
});

const ask = (message, extra = {}) => runAgent({ db, user: student, message, language: 'en', knowledgeDocs, ...extra });

// --------------------------------------------------------
describe('i18n', () => {
  test('detects each supported script', () => {
    assert.equal(detectLanguage('फीस कितनी है?'), 'hi');
    assert.equal(detectLanguage('கட்டணம் எவ்வளவு?'), 'ta');
    assert.equal(detectLanguage('ఫీజు ఎంత?'), 'te');
    assert.equal(detectLanguage('ಶುಲ್ಕ ಎಷ್ಟು?'), 'kn');
    assert.equal(detectLanguage('ഫീസ് എത്രയാണ്?'), 'ml');
    assert.equal(detectLanguage('What is the fee?'), 'en');
  });

  test('script beats the UI choice, UI choice beats English text', () => {
    assert.equal(resolveLanguage('en', 'ఫీజు ఎంత?'), 'te');
    assert.equal(resolveLanguage('kn', 'fees kitni hai'), 'kn');
    assert.equal(resolveLanguage('xx', 'hello'), 'en');
  });

  test('every language has every phrase', () => {
    const keys = Object.keys(STRINGS.en);
    for (const lang of Object.keys(STRINGS)) {
      for (const key of keys) assert.ok(key in STRINGS[lang], `${lang}.${key}`);
    }
    assert.match(t('hi', 'registered', { title: 'X', ticket: 'T1' }), /X.*T1/);
  });

  test('native keywords expand to English search terms', () => {
    assert.match(expandQueryToEnglish('ஹாஸ்டல் விடுதி கட்டணம்'), /hostel/);
    assert.match(expandQueryToEnglish('छात्रवृत्ति'), /scholarship/);
    assert.ok(isNativeGreeting('നമസ്കാരം'));
    assert.ok(!isNativeGreeting('hello'));
  });
});

// --------------------------------------------------------
describe('offline planner', () => {
  const cases = [
    ['register me for event 3', 'register_for_event', { event_id: 3 }],
    ['please sign me up for the webinar', 'list_upcoming_events'],
    ['what events are coming up?', 'list_upcoming_events'],
    ['I want to talk to a counsellor', 'request_counselling'],
    ['what is my application status', 'get_my_application_status'],
    ['am I eligible with 72% in PCM?', 'check_eligibility'],
    ['pincode 560001', 'lookup_pincode', { pincode: '560001' }],
    ['review my github github.com/octocat', 'analyze_github_profile', { username: 'octocat' }],
    ['my github username is ada-lovelace', 'analyze_github_profile', { username: 'ada-lovelace' }],
    ['ఈవెంట్ 2 కి నమోదు చేయి', 'register_for_event', { event_id: 2 }],
    ['நிகழ்வு 1-க்கு பதிவு செய்', 'register_for_event', { event_id: 1 }],
    ['ಕಾರ್ಯಕ್ರಮ 1 ಕ್ಕೆ ನೋಂದಾಯಿಸಿ', 'register_for_event', { event_id: 1 }],
    ['പരിപാടി 1-ന് രജിസ്റ്റർ ചെയ്യൂ', 'register_for_event', { event_id: 1 }],
    ['event 1 के लिए रजिस्टर करो', 'register_for_event', { event_id: 1 }],
    ['నేను B.Tech కి అర్హుడినా?', 'check_eligibility'],
    ['क्या मैं B.Tech के लिए पात्र हूँ?', 'check_eligibility'],
    ['Am I eligible for B.Tech?', 'check_eligibility'],
    ['ನನ್ನ ಅರ್ಜಿಯ ಸ್ಥಿತಿ ಏನು?', 'get_my_application_status'],
    ['എന്റെ അപേക്ഷയുടെ നില എന്താണ്?', 'get_my_application_status'],
    ['வரவிருக்கும் நிகழ்வுகளைக் காட்டு', 'list_upcoming_events'],
    ['ఫీజులు మరియు స్కాలర్‌షిప్‌లు ఏమిటి?', 'search_knowledge_base'],
    ['what is the hostel fee?', 'search_knowledge_base']
  ];
  for (const [message, tool, args] of cases) {
    test(`"${message}" -> ${tool}`, () => {
      const plan = planFromMessage(message);
      assert.equal(plan.tool, tool);
      if (args) for (const [k, v] of Object.entries(args)) assert.equal(plan.args[k], v);
    });
  }
});

// --------------------------------------------------------
describe('runAgent (offline)', () => {
  test('uses the offline agent when no key is set', () => {
    assert.equal(chooseProvider(), 'offline');
    process.env.GEMINI_API_KEY = 'x';
    assert.equal(chooseProvider(), 'gemini');
    process.env.ANTHROPIC_API_KEY = 'y';
    assert.equal(chooseProvider(), 'claude');
    process.env.AGENT_PROVIDER = 'offline';
    assert.equal(chooseProvider(), 'offline');
  });

  test('registers for an event and issues a ticket, once', async () => {
    const first = await ask('register me for event 3');
    assert.equal(first.toolCalls[0].name, 'register_for_event');
    assert.match(first.reply, /registered/);
    const ticket = db.prepare('SELECT ticket_number FROM event_registrations WHERE event_id = 3 AND student_id = ?').get(student.id);
    assert.match(ticket.ticket_number, /^NIAT-3-[0-9A-F]{6}$/);

    const second = await ask('register me for event 3');
    assert.match(second.reply, /already registered/);
    const count = db.prepare('SELECT COUNT(*) AS c FROM event_registrations WHERE event_id = 3 AND student_id = ?').get(student.id).c;
    assert.equal(count, 1);
  });

  test('answers in the language of the question', async () => {
    const r = await ask('హాస్టల్ ఫీజు ఎంత?');
    assert.equal(r.language, 'te');
    assert.ok(r.sources.length > 0);
    assert.match(r.reply, /ఇంగ్లీష్ హ్యాండ్‌బుక్/);
  });

  test('flags commerce students as not eligible', async () => {
    const r = await ask('am I eligible with 80% in 12th commerce?');
    assert.match(r.reply, /Does not meet/);
    assert.equal(r.suggestCounselling, true);
  });

  test('greets in the selected language without calling tools', async () => {
    const r = await ask('hi', { language: 'ml' });
    assert.equal(r.language, 'ml');
    assert.deepEqual(r.toolCalls, []);
    assert.match(r.reply, /നമസ്കാരം/);
  });

  test('reports public-data outages gracefully', async () => {
    const f = mockFetch(() => { throw new Error('network down'); });
    try {
      const r = await ask('pincode 500032', { language: 'hi' });
      assert.equal(r.toolCalls[0].ok, false);
      assert.match(r.reply, /उपलब्ध नहीं/);
    } finally {
      f.restore();
    }
  });
});

// --------------------------------------------------------
describe('public data', () => {
  test('pincode lookup parses India Post responses and caches them', async () => {
    const f = mockFetch(() => ({
      json: [{ Status: 'Success', PostOffice: [
        { Name: 'Gachibowli', District: 'Rangareddy', State: 'Telangana', Region: 'Hyderabad City', Country: 'India' },
        { Name: 'Madhapur', District: 'Rangareddy', State: 'Telangana' }
      ] }]
    }));
    try {
      const r = await lookupPincode('500032');
      assert.equal(r.state, 'Telangana');
      assert.equal(r.district, 'Rangareddy');
      assert.deepEqual(r.postOffices, ['Gachibowli', 'Madhapur']);
      await lookupPincode('500032');
      assert.equal(f.calls.length, 1);
      assert.match(f.calls[0].url, /api\.postalpincode\.in\/pincode\/500032$/);
    } finally {
      f.restore();
    }
  });

  test('rejects invalid pincodes without calling the API', async () => {
    const f = mockFetch(() => ({ json: [] }));
    try {
      await assert.rejects(lookupPincode('12345'), { code: 'INVALID_INPUT' });
      await assert.rejects(lookupPincode('012345'), { code: 'INVALID_INPUT' });
      assert.equal(f.calls.length, 0);
    } finally {
      f.restore();
    }
  });

  test('GitHub analysis summarises original repos and scores readiness', async () => {
    const recent = new Date().toISOString();
    const f = mockFetch(url => url.includes('/repos')
      ? { json: [
          { name: 'ml-notes', fork: false, stargazers_count: 12, language: 'Python', pushed_at: recent, html_url: 'https://github.com/x/ml-notes', description: 'Notes' },
          { name: 'site', fork: false, stargazers_count: 3, language: 'TypeScript', pushed_at: '2024-01-01T00:00:00Z', html_url: 'https://github.com/x/site' },
          { name: 'forked-lib', fork: true, stargazers_count: 999, language: 'C', pushed_at: recent, html_url: 'https://github.com/x/forked-lib' }
        ] }
      : { json: { login: 'student-dev', name: 'Student Dev', public_repos: 3, followers: 4, html_url: 'https://github.com/student-dev', created_at: '2023-05-01T00:00:00Z' } });
    try {
      const r = await analyzeGithubProfile('https://github.com/student-dev');
      assert.equal(r.originalRepos, 2);
      assert.equal(r.totalStars, 15); // forks excluded
      assert.equal(r.topRepos[0].name, 'ml-notes');
      assert.deepEqual(r.topLanguages.map(l => l.name).sort(), ['Python', 'TypeScript']);
      assert.ok(r.scholarshipReadiness.score > 0 && r.scholarshipReadiness.score <= 100);
      assert.match(f.calls[0].url, /api\.github\.com\/users\/student-dev/);
    } finally {
      f.restore();
    }
  });

  test('GitHub usernames are validated', () => {
    assert.equal(normalizeGithubUsername('@octocat'), 'octocat');
    assert.equal(normalizeGithubUsername('https://github.com/ada-lovelace/repo'), 'ada-lovelace');
    assert.equal(normalizeGithubUsername('bad name'), null);
    assert.equal(normalizeGithubUsername('-leading'), null);
  });
});

// --------------------------------------------------------
describe('Gemini provider', () => {
  test('schemas drop unsupported fields and empty objects', () => {
    assert.equal(toGeminiSchema({ type: 'object', properties: {} }), undefined);
    assert.deepEqual(toGeminiSchema({ type: 'object', additionalProperties: false, properties: { a: { type: 'string' } } }), { type: 'object', properties: { a: { type: 'string' } } });
  });

  test('runs a function-calling loop and returns the final text', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    const f = mockFetch((url, init, n) => n === 1
      ? { json: { candidates: [{ content: { role: 'model', parts: [{ functionCall: { name: 'check_eligibility', args: { current_education: 'Class 12 PCM', class_12_percentage: 88 } } }] } }] } }
      : { json: { candidates: [{ content: { role: 'model', parts: [{ text: 'नमस्ते! आप पात्र लगते हैं।' }] } }] } });
    try {
      const r = await ask('क्या मैं 88% PCM के साथ पात्र हूँ?');
      assert.equal(r.provider, 'gemini');
      assert.equal(r.language, 'hi');
      assert.equal(r.reply, 'नमस्ते! आप पात्र लगते हैं।');
      assert.deepEqual(r.toolCalls.map(c => c.name), ['check_eligibility']);

      const [first, second] = f.calls;
      assert.equal(first.init.headers['x-goog-api-key'], 'test-key');
      assert.match(first.body.systemInstruction.parts[0].text, /Reply in Hindi/);
      assert.ok(first.body.tools[0].functionDeclarations.some(d => d.name === 'register_for_event'));
      const fnResponse = second.body.contents.at(-1).parts[0].functionResponse;
      assert.equal(fnResponse.name, 'check_eligibility');
      assert.equal(fnResponse.response.verdict, 'likely_eligible');
    } finally {
      f.restore();
    }
  });

  test('falls back to the offline agent when Gemini fails', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    const f = mockFetch(() => ({ status: 500, json: { error: 'boom' } }));
    const warn = console.warn;
    console.warn = () => {};
    try {
      const r = await ask('what is the fee for B.Tech?');
      assert.equal(r.provider, 'offline');
      assert.ok(r.sources.length > 0);
    } finally {
      console.warn = warn;
      f.restore();
    }
  });
});

// --------------------------------------------------------
describe('Claude provider (official SDK against a local mock API)', () => {
  test('sends tools, fallbacks and the system prompt, then executes the tool loop', async () => {
    const requests = [];
    const server = http.createServer((req, res) => {
      let body = '';
      req.on('data', c => { body += c; });
      req.on('end', () => {
        const json = JSON.parse(body);
        requests.push({ url: req.url, headers: req.headers, body: json });
        const base = { id: `msg_${requests.length}`, type: 'message', role: 'assistant', model: json.model, stop_sequence: null, usage: { input_tokens: 10, output_tokens: 10 } };
        const reply = requests.length === 1
          ? { ...base, stop_reason: 'tool_use', content: [{ type: 'tool_use', id: 'toolu_1', name: 'list_upcoming_events', input: {} }] }
          : { ...base, stop_reason: 'end_turn', content: [{ type: 'text', text: 'Here are the upcoming events.' }] };
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify(reply));
      });
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    process.env.ANTHROPIC_API_KEY = 'sk-test';
    process.env.ANTHROPIC_BASE_URL = `http://127.0.0.1:${server.address().port}`;
    // The provider caches its client; load a fresh copy so it picks up the mock URL.
    delete require.cache[require.resolve('../services/agent/providers/claude')];

    try {
      const r = await ask('Which events can I join?');
      assert.equal(r.provider, 'claude');
      assert.equal(r.reply, 'Here are the upcoming events.');
      assert.deepEqual(r.toolCalls.map(c => c.name), ['list_upcoming_events']);

      const [first, second] = requests;
      assert.match(first.url, /^\/v1\/messages/);
      assert.equal(first.body.model, 'claude-opus-5-5');
      assert.equal(first.body.fallbacks, 'default');
      assert.match(first.headers['anthropic-beta'], /server-side-fallback-2026-07-01/);
      assert.match(first.body.system, /NIAT AI Admission Agent/);
      assert.ok(first.body.tools.some(tool => tool.name === 'register_for_event' && tool.input_schema));
      const toolResult = second.body.messages.at(-1).content[0];
      assert.equal(toolResult.type, 'tool_result');
      assert.equal(toolResult.tool_use_id, 'toolu_1');
      assert.ok(Array.isArray(JSON.parse(typeof toolResult.content === 'string' ? toolResult.content : toolResult.content[0].text).events));
    } finally {
      server.close();
      delete require.cache[require.resolve('../services/agent/providers/claude')];
    }
  });
});
