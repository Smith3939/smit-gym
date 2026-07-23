/**
 * Shared AI client.
 *
 * Claude is called through an authenticated Firebase callable function rather
 * than from the client. This keeps the Anthropic API key out of the web bundle.
 */
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';

const TIMEOUT_MS = 25000;
const backendEnabled = process.env.EXPO_PUBLIC_AI_BACKEND_ENABLED === 'true';
const callClaudeFunction = httpsCallable(functions, 'claude', { timeout: TIMEOUT_MS });

/**
 * Controls the UI's "live" badge. This is a non-secret deployment flag and
 * must only be enabled after the Firebase function and its secret are live.
 */
export function hasValidClaudeKey() {
  return backendEnabled;
}

/**
 * Call the authenticated Firebase proxy. Callers retain their local fallback
 * behavior when the backend is not enabled or is temporarily unavailable.
 */
export async function callClaude({ system, messages, maxTokens = 1024 }) {
  if (!backendEnabled) {
    const error = new Error('AI_BACKEND_DISABLED');
    error.code = 'AI_BACKEND_DISABLED';
    throw error;
  }

  const result = await callClaudeFunction({ system, messages, maxTokens });
  const text = result?.data?.text;
  if (typeof text !== 'string' || text.length === 0) {
    throw new Error('INVALID_AI_RESPONSE');
  }

  return text;
}

/**
 * Parse a JSON object out of a Claude text response that may be wrapped in
 * markdown code fences.
 */
export function parseClaudeJson(text) {
  const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(jsonStr);
}
