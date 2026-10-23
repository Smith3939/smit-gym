/**
 * Shared AI client.
 *
 * The OpenAI key lives only in Vercel (OPENAI_API_KEY). The app sends the
 * current Firebase ID token to /api/claude — the path name is unchanged so
 * existing clients keep working — and that route calls OpenAI.
 */
import { Platform } from 'react-native';
import { auth } from '../config/firebase';

const TIMEOUT_MS = 25000;
const backendEnabled = process.env.EXPO_PUBLIC_AI_BACKEND_ENABLED === 'true';
const configuredApiUrl = process.env.EXPO_PUBLIC_AI_API_URL;

function getApiUrl() {
  if (configuredApiUrl) return configuredApiUrl;
  return Platform.OS === 'web' ? '/api/claude' : null;
}

/**
 * Controls the UI's "live" badge. This is a non-secret deployment flag and
 * must only be enabled after the Vercel API route and its secrets are live.
 */
export function hasValidClaudeKey() {
  return backendEnabled && Boolean(getApiUrl());
}

// A real request failure turns the badge off until a later request succeeds.
// The deployment flag above stays unchanged.
let forcedOffline = false;
const connectionListeners = new Set();

export function isAIConnected() {
  return hasValidClaudeKey() && !forcedOffline;
}

export function markAiNotLive() {
  if (forcedOffline) return;
  forcedOffline = true;
  connectionListeners.forEach((listener) => listener(false));
}

export function markAiLive() {
  if (!hasValidClaudeKey() || !forcedOffline) return;
  forcedOffline = false;
  connectionListeners.forEach((listener) => listener(true));
}

export function subscribeAiConnection(listener) {
  connectionListeners.add(listener);
  return () => connectionListeners.delete(listener);
}

/**
 * Call the authenticated Vercel proxy. Throws AI_BACKEND_DISABLED when the
 * backend is intentionally off. Other failures carry status/code so the chat
 * can show the real error instead of a canned answer.
 */
export async function callClaude({ system, messages, maxTokens = 1024 }) {
  const apiUrl = getApiUrl();
  const user = auth.currentUser;

  if (!backendEnabled || !apiUrl) {
    const error = new Error('AI_BACKEND_DISABLED');
    error.code = 'AI_BACKEND_DISABLED';
    throw error;
  }

  if (!user) {
    const error = new Error('AUTH_REQUIRED');
    error.code = 'AUTH_REQUIRED';
    throw error;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    let idToken;
    try {
      idToken = await user.getIdToken();
    } catch {
      const error = new Error('AUTH_REQUIRED');
      error.code = 'AUTH_REQUIRED';
      throw error;
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ system, messages, maxTokens }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const error = new Error(`AI_API_ERROR_${response.status}`);
      error.code = 'AI_API_ERROR';
      error.status = response.status;
      throw error;
    }

    const result = await response.json();
    if (typeof result?.text !== 'string' || result.text.length === 0) {
      throw new Error('INVALID_AI_RESPONSE');
    }

    return result.text;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Parse a JSON object out of a model text response that may be wrapped in
 * markdown code fences.
 */
export function parseClaudeJson(text) {
  const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(jsonStr);
}
