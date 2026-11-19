// ========================================================
// NIAT Connect – Public data integrations
// 1. India Post pincode directory (api.postalpincode.in) – location lookup
// 2. GitHub public profiles (api.github.com) – Young Innovator Scholarship screening
// ========================================================

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const REQUEST_TIMEOUT_MS = 8000;
const cache = new Map();

function cacheGet(key) {
  const hit = cache.get(key);
  if (!hit) return undefined;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    cache.delete(key);
    return undefined;
  }
  return hit.value;
}

function cacheSet(key, value) {
  if (cache.size > 500) cache.delete(cache.keys().next().value);
  cache.set(key, { at: Date.now(), value });
}

function clearPublicDataCache() {
  cache.clear();
}

class PublicDataError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}

async function fetchJson(url, headers = {}) {
  let resp;
  try {
    resp = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'niat-connect', ...headers },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });
  } catch (err) {
    throw new PublicDataError(`Could not reach ${new URL(url).host}: ${err.message}`, 'UNAVAILABLE');
  }
  if (resp.status === 404) throw new PublicDataError('Not found', 'NOT_FOUND');
  if (resp.status === 403 || resp.status === 429) throw new PublicDataError('Rate limited by the data provider', 'RATE_LIMITED');
  if (!resp.ok) throw new PublicDataError(`Data provider returned ${resp.status}`, 'UNAVAILABLE');
  return resp.json();
}

// --------------------------------------------------------
// India Post pincode directory
// --------------------------------------------------------

function normalizePincode(raw) {
  const pin = String(raw ?? '').replace(/\s+/g, '');
  return /^[1-9]\d{5}$/.test(pin) ? pin : null;
}

/**
 * Looks up an Indian pincode. Returns { pincode, district, state, region, postOffices: [...] }.
 */
async function lookupPincode(rawPincode) {
  const pincode = normalizePincode(rawPincode);
  if (!pincode) throw new PublicDataError('A valid 6-digit Indian pincode is required', 'INVALID_INPUT');

  const key = `pin:${pincode}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  const data = await fetchJson(`https://api.postalpincode.in/pincode/${pincode}`);
  const entry = Array.isArray(data) ? data[0] : null;
  if (!entry || entry.Status !== 'Success' || !Array.isArray(entry.PostOffice) || entry.PostOffice.length === 0) {
    throw new PublicDataError('Pincode not found', 'NOT_FOUND');
  }

  const offices = entry.PostOffice;
  const first = offices[0];
  const result = {
    pincode,
    district: first.District,
    state: first.State,
    region: first.Region || first.Division || null,
    country: first.Country || 'India',
    postOffices: offices.slice(0, 8).map(o => o.Name),
    source: 'India Post (api.postalpincode.in)'
  };
  cacheSet(key, result);
  return result;
}

// --------------------------------------------------------
// GitHub public profile analysis
// --------------------------------------------------------

function normalizeGithubUsername(raw) {
  let value = String(raw ?? '').trim();
  const urlMatch = value.match(/github\.com\/([A-Za-z0-9-]+)/i);
  if (urlMatch) value = urlMatch[1];
  value = value.replace(/^@/, '');
  return /^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/.test(value) ? value : null;
}

function githubHeaders() {
  return process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {};
}

/**
 * Summarises a public GitHub profile and gives an indicative readiness score for the
 * Young Innovator Scholarship. The scholarship committee always makes the final decision.
 */
async function analyzeGithubProfile(rawUsername, now = new Date()) {
  const username = normalizeGithubUsername(rawUsername);
  if (!username) throw new PublicDataError('A valid GitHub username or profile URL is required', 'INVALID_INPUT');

  const key = `gh:${username.toLowerCase()}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  const headers = githubHeaders();
  const [profile, repos] = await Promise.all([
    fetchJson(`https://api.github.com/users/${username}`, headers),
    fetchJson(`https://api.github.com/users/${username}/repos?per_page=100&sort=pushed&type=owner`, headers)
  ]);

  const ownRepos = (Array.isArray(repos) ? repos : []).filter(r => !r.fork);
  const totalStars = ownRepos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
  const languages = {};
  for (const r of ownRepos) {
    if (r.language) languages[r.language] = (languages[r.language] || 0) + 1;
  }
  const topLanguages = Object.entries(languages).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, repoCount]) => ({ name, repos: repoCount }));

  const ninetyDaysAgo = now.getTime() - 90 * 24 * 60 * 60 * 1000;
  const activeRecently = ownRepos.filter(r => r.pushed_at && new Date(r.pushed_at).getTime() >= ninetyDaysAgo).length;
  const lastPush = ownRepos.map(r => r.pushed_at).filter(Boolean).sort().pop() || null;

  const topRepos = [...ownRepos]
    .sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0) || String(b.pushed_at).localeCompare(String(a.pushed_at)))
    .slice(0, 3)
    .map(r => ({
      name: r.name,
      description: r.description ? String(r.description).slice(0, 160) : null,
      language: r.language,
      stars: r.stargazers_count || 0,
      url: r.html_url
    }));

  // Indicative readiness score (0-100)
  const breakdown = {
    originalProjects: Math.min(ownRepos.length, 10) * 3,                 // max 30
    communityStars: Math.round(Math.min(totalStars, 50) * 0.6),           // max 30
    recentActivity: activeRecently > 0 ? Math.min(activeRecently, 4) * 5 : 0, // max 20
    languageBreadth: Math.min(topLanguages.length, 4) * 5                 // max 20
  };
  const readinessScore = Object.values(breakdown).reduce((a, b) => a + b, 0);
  const readiness = readinessScore >= 60 ? 'Strong' : readinessScore >= 30 ? 'Promising' : 'Early-stage';

  const result = {
    username: profile.login,
    name: profile.name || null,
    bio: profile.bio ? String(profile.bio).slice(0, 200) : null,
    profileUrl: profile.html_url,
    accountCreated: profile.created_at ? String(profile.created_at).slice(0, 10) : null,
    followers: profile.followers || 0,
    publicRepos: profile.public_repos || 0,
    originalRepos: ownRepos.length,
    totalStars,
    reposActiveLast90Days: activeRecently,
    lastPush: lastPush ? String(lastPush).slice(0, 10) : null,
    topLanguages,
    topRepos,
    scholarshipReadiness: {
      score: readinessScore,
      level: readiness,
      breakdown,
      note: 'Indicative only. The Young Innovator Scholarship committee reviews every application personally.'
    },
    source: 'GitHub public API (api.github.com)'
  };
  cacheSet(key, result);
  return result;
}

module.exports = {
  lookupPincode,
  analyzeGithubProfile,
  normalizePincode,
  normalizeGithubUsername,
  clearPublicDataCache,
  PublicDataError
};
