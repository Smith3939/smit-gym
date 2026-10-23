const { MAX_CHAT_MESSAGES } = require('./aiLimits');

const FIREBASE_PROJECT_ID = 'smith-gymai';
const FIREBASE_JWKS_URL =
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

// Current, low-cost model for short Hebrew coaching and JSON swaps.
// Priced around $0.25 / $2 per 1M input / output tokens.
// Override with the OPENAI_MODEL env var. Documented in VERCEL_SETUP.md.
// The file stays api/claude.js so the existing /api/claude client URL keeps working.
const DEFAULT_MODEL = 'gpt-5-mini';
const DEFAULT_HOURLY_LIMIT = 20;
const MAX_MESSAGES = MAX_CHAT_MESSAGES;
const MAX_MESSAGE_CHARS = 8000;
const MAX_SYSTEM_CHARS = 12000;
const MAX_OUTPUT_TOKENS = 2048;
// gpt-5-mini still spends a few hidden reasoning tokens on "minimal" effort.
// Add a little budget so those tokens don't erase the Hebrew answer.
// The total still cannot exceed MAX_OUTPUT_TOKENS.
const REASONING_TOKEN_HEADROOM = 512;

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

function resolveModel() {
  const configured = typeof process.env.OPENAI_MODEL === 'string' ? process.env.OPENAI_MODEL.trim() : '';
  return configured || DEFAULT_MODEL;
}

// The original GPT-5 family defaults to medium reasoning. That hidden thinking
// can consume the whole completion budget and come back with no visible text.
// Later GPT-5.x models are not matched here; they default to little or no reasoning.
function prefersMinimalReasoning(model) {
  const id = String(model || '').trim().toLowerCase();
  return (
    id === 'gpt-5' ||
    id.startsWith('gpt-5-mini') ||
    id.startsWith('gpt-5-nano') ||
    id.startsWith('gpt-5-20')
  );
}

function completionTokenBudget(model, maxTokens) {
  if (!prefersMinimalReasoning(model)) return maxTokens;
  return Math.min(MAX_OUTPUT_TOKENS, maxTokens + REASONING_TOKEN_HEADROOM);
}

function buildChatCompletionBody({ model, maxTokens, system, messages }) {
  const body = {
    model,
    max_completion_tokens: completionTokenBudget(model, maxTokens),
    messages: [{ role: 'system', content: system }, ...messages],
  };

  if (prefersMinimalReasoning(model)) {
    body.reasoning_effort = 'minimal';
  }

  return body;
}

async function requestChatCompletion({ apiKey, model, maxTokens, system, messages, fetchImpl = fetch }) {
  let openaiResponse;
  try {
    openaiResponse = await fetchImpl('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(
        buildChatCompletionBody({
          model,
          maxTokens,
          system,
          messages,
        })
      ),
    });
  } catch {
    return { status: 502, body: { error: 'Could not reach the AI provider' } };
  }

  if (!openaiResponse.ok) {
    let detail = '';
    try {
      const errBody = await openaiResponse.json();
      detail = errBody?.error?.code || errBody?.error?.type || '';
    } catch {
      detail = '';
    }
    console.error('OpenAI request failed', openaiResponse.status, detail);
    return { status: 502, body: { error: 'AI provider request failed' } };
  }

  let result;
  try {
    result = await openaiResponse.json();
  } catch {
    return { status: 502, body: { error: 'AI provider returned no text' } };
  }

  const text = extractAssistantText(result);
  if (!text) return { status: 502, body: { error: 'AI provider returned no text' } };
  return { status: 200, body: { text } };
}

function extractAssistantText(result) {
  const content = result?.choices?.[0]?.message?.content;
  if (typeof content === 'string') return content.trim();
  if (!Array.isArray(content)) return '';

  return content
    .map((part) => {
      if (typeof part === 'string') return part;
      if (part && typeof part.text === 'string') return part.text;
      return '';
    })
    .join('')
    .trim();
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

async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return sendJson(response, 405, { error: 'Method not allowed' });
  }

  const apiKey = typeof process.env.OPENAI_API_KEY === 'string' ? process.env.OPENAI_API_KEY.trim() : '';
  if (!apiKey) {
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
  const model = resolveModel();
  const outcome = await requestChatCompletion({
    apiKey,
    model,
    maxTokens,
    system: request.body.system,
    messages: request.body.messages,
  });
  return sendJson(response, outcome.status, outcome.body);
}

module.exports = handler;
module.exports.buildChatCompletionBody = buildChatCompletionBody;
module.exports.extractAssistantText = extractAssistantText;
module.exports.resolveModel = resolveModel;
module.exports.requestChatCompletion = requestChatCompletion;
module.exports.DEFAULT_MODEL = DEFAULT_MODEL;
module.exports.MAX_MESSAGES = MAX_MESSAGES;
