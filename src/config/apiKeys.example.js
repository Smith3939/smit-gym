/**
 * API Keys template.
 *
 * HOW TO USE:
 * 1. Copy this file to `apiKeys.js` in the same folder.
 * 2. Paste only client-safe configuration values into apiKeys.js.
 * 3. apiKeys.js is gitignored - it will NEVER be committed to GitHub.
 *
 * ⚠️ SECURITY WARNING:
 * Never put an Anthropic / Claude API key in this file.
 * The AI coach uses the Firebase Cloud Function in functions/index.js instead.
 */

// Google OAuth Web Client ID (from Firebase Console > Auth > Google > Web SDK)
export const GOOGLE_WEB_CLIENT_ID = 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com';
