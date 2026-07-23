const { logger } = require('firebase-functions');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');

const anthropicApiKey = defineSecret('ANTHROPIC_API_KEY');
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';
const MAX_MESSAGES = 20;
const MAX_CONTENT_LENGTH = 12000;
const MAX_SYSTEM_LENGTH = 12000;
const MAX_TOKENS = 2048;

function invalidArgument(message) {
  throw new HttpsError('invalid-argument', message);
}

function validateRequest(data) {
  if (!data || typeof data !== 'object') {
    invalidArgument('Missing AI request data.');
  }

  const { system, messages, maxTokens = 1024 } = data;

  if (typeof system !== 'string' || system.length === 0 || system.length > MAX_SYSTEM_LENGTH) {
    invalidArgument('Invalid system prompt.');
  }

  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
    invalidArgument('Invalid conversation.');
  }

  const safeMessages = messages.map((message) => {
    if (
      !message ||
      !['user', 'assistant'].includes(message.role) ||
      typeof message.content !== 'string' ||
      message.content.length === 0 ||
      message.content.length > MAX_CONTENT_LENGTH
    ) {
      invalidArgument('Invalid conversation message.');
    }

    return { role: message.role, content: message.content };
  });

  const safeMaxTokens = Number.isInteger(maxTokens) && maxTokens > 0
    ? Math.min(maxTokens, MAX_TOKENS)
    : 1024;

  return { system, messages: safeMessages, maxTokens: safeMaxTokens };
}

/**
 * Authenticated proxy for Anthropic.
 *
 * The secret is never exposed to the Expo web bundle. Firebase Auth tokens
 * are verified automatically for callable functions before this handler runs.
 */
exports.claude = onCall(
  {
    region: 'europe-west1',
    timeoutSeconds: 30,
    secrets: [anthropicApiKey],
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Sign in to use the AI coach.');
    }

    const payload = validateRequest(request.data);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    try {
      const response = await fetch(ANTHROPIC_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': anthropicApiKey.value(),
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({ model: MODEL, ...payload }),
        signal: controller.signal,
      });

      if (!response.ok) {
        logger.error('Anthropic request failed', { status: response.status });
        throw new HttpsError('unavailable', 'The AI coach is temporarily unavailable.');
      }

      const result = await response.json();
      const text = result?.content?.[0]?.text;
      if (typeof text !== 'string' || text.length === 0) {
        logger.error('Anthropic response did not contain text');
        throw new HttpsError('internal', 'The AI coach returned an invalid response.');
      }

      return { text };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logger.error('Anthropic request failed unexpectedly', error);
      throw new HttpsError('unavailable', 'The AI coach is temporarily unavailable.');
    } finally {
      clearTimeout(timeout);
    }
  },
);
