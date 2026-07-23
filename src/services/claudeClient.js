/**
 * Shared AI client.
 *
 * The Anthropic key lives only in Vercel. The app sends the current Firebase
 * ID token to Vercel's API route, which verifies the user before calling Claude.
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

/**
 * Call the authenticated Vercel proxy. Callers retain their local fallback
 * behavior when the backend is not enabled or is temporarily unavailable.
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
    const idToken = await user.getIdToken();
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
      throw new Error(`AI_API_ERROR_${response.status}`);
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
 * Parse a JSON object out of a Claude text response that may be wrapped in
 * markdown code fences.
 */
export function parseClaudeJson(text) {
  const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(jsonStr);
}
