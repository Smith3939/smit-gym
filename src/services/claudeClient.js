/**
 * Shared Claude API client.
 * Centralizes the API call, key validation, and timeout handling so all
 * AI services (chat, nutrition, workout) behave consistently.
 */

import { CLAUDE_API_KEY } from '../config/apiKeys';

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';
const TIMEOUT_MS = 20000;

/**
 * Is a real Claude key configured? (vs the placeholder)
 */
export function hasValidClaudeKey() {
  return typeof CLAUDE_API_KEY === 'string' && CLAUDE_API_KEY.startsWith('sk-ant-');
}

/**
 * Call Claude. Throws if no valid key (so callers short-circuit to fallback
 * WITHOUT paying a doomed network round-trip), or on timeout/HTTP error.
 * @returns {Promise<string>} the assistant text
 */
export async function callClaude({ system, messages, maxTokens = 1024 }) {
  if (!hasValidClaudeKey()) {
    // No real key — signal callers to use their local fallback immediately.
    const err = new Error('NO_API_KEY');
    err.code = 'NO_API_KEY';
    throw err;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, messages }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0].text;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Parse a JSON object out of a Claude text response that may be wrapped in
 * markdown code fences.
 */
export function parseClaudeJson(text) {
  const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(jsonStr);
}
