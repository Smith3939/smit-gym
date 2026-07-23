const FIREBASE_PROJECT_ID = 'smith-gymai';
const FIREBASE_JWKS_URL =
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
const DEFAULT_MODEL = 'claude-sonnet-4-6';
const DEFAULT_HOURLY_LIMIT = 20;
const MAX_MESSAGES = 24;
const MAX_MESSAGE_CHARS = 8000;
const MAX_SYSTEM_CHARS = 12000;
const MAX_OUTPUT_TOKENS = 2048;

// Best-effort protection. Vercel can use multiple instances, so this is not a
// substitute for a shared rate-limit service when the app grows.
const requestLog = new Map();
let jwks;

function sendJson(response, status, body) {
  response.status(status).json(body);
}

function getAllowedEmails() {
  return new Set(
    (process.env.AI_ALLOWED_EMAILS || '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

function hasAvailableQuota(email) {
  const now = Date.now();
  const cutoff = now - 60 * 60 * 1000;
  const limit = Math.max(
    1,
    Number.parseInt(process.env.AI_REQUESTS_PER_HOUR || DEFAULT_HOURLY_LIMIT, 10) ||
      DEFAULT_HOURLY_LIMIT
  );
  const recent = (requestLog.get(email) || []).filter((time) => time > cutoff);

  if (recent.length >= limit) return false;

  recent.push(now);
  requestLog.set(email, recent);
  return true;
}

function isValidPayload(body) {
  if (!body || typeof body !== 'object') return false;
  if (typeof body.system !== 'string' || body.system.length > MAX_SYSTEM_CHARS) return false;
  if (!Array.isArray(body.messages) || body.messages.length === 0 || body.messages.length > MAX_MESSAGES) {
    return false;
  }

  return body.messages.every(
    (message) =>
      message &&
      typeof message === 'object' &&
      (message.role === 'user' || message.role === 'assistant') &&
      typeof message.content === 'string' &&
      message.content.length > 0 &&
      message.content.length <= MAX_MESSAGE_CHARS
  );
}

async function verifyFirebaseToken(token) {
  const { createRemoteJWKSet, jwtVerify } = await import('jose');
  jwks ||= createRemoteJWKSet(new URL(FIREBASE_JWKS_URL));

  const { payload } = await jwtVerify(token, jwks, {
    audience: FIREBASE_PROJECT_ID,
    issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
  });

  return payload;
}

module.exports = async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return sendJson(response, 405, { error: 'Method not allowed' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return sendJson(response, 503, { error: 'AI service is not configured' });
  }

  const allowedEmails = getAllowedEmails();
  if (allowedEmails.size === 0) {
    return sendJson(response, 503, { error: 'AI access is not configured' });
  }

  const authorization = request.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : null;
  if (!token) return sendJson(response, 401, { error: 'Authentication required' });

  let user;
  try {
    user = await verifyFirebaseToken(token);
  } catch {
    return sendJson(response, 401, { error: 'Invalid authentication token' });
  }

  const email = typeof user.email === 'string' ? user.email.toLowerCase() : '';
  if (!email || !allowedEmails.has(email)) {
    return sendJson(response, 403, { error: 'AI access is not allowed for this account' });
  }

  if (!isValidPayload(request.body)) {
    return sendJson(response, 400, { error: 'Invalid AI request' });
  }

  if (!hasAvailableQuota(email)) {
    return sendJson(response, 429, { error: 'AI request limit reached. Try again later.' });
  }

  const maxTokens = Math.min(
    Math.max(1, Number.parseInt(request.body.maxTokens, 10) || 1024),
    MAX_OUTPUT_TOKENS
  );

  let anthropicResponse;
  try {
    anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
        max_tokens: maxTokens,
        system: request.body.system,
        messages: request.body.messages,
      }),
    });
  } catch {
    return sendJson(response, 502, { error: 'Could not reach the AI provider' });
  }

  if (!anthropicResponse.ok) {
    console.error('Anthropic request failed', anthropicResponse.status);
    return sendJson(response, 502, { error: 'AI provider request failed' });
  }

  const result = await anthropicResponse.json();
  const text = result.content
    ?.filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('')
    .trim();

  if (!text) return sendJson(response, 502, { error: 'AI provider returned no text' });

  return sendJson(response, 200, { text });
};
