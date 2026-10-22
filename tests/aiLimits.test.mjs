import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { describe, test } from 'node:test';

const require = createRequire(import.meta.url);
const limits = require('../api/aiLimits.js');
const coach = require('../api/claude.js');

function conversation(turns) {
  const messages = [];
  for (let i = 1; i <= turns; i += 1) {
    messages.push({ role: 'user', content: `שאלה ${i}` });
    if (i < turns) messages.push({ role: 'assistant', content: `תשובה ${i}` });
  }
  return messages;
}

describe('shared AI chat limit', () => {
  test('the app and the server share one 24-message cap', () => {
    assert.equal(limits.MAX_CHAT_MESSAGES, 24);
    assert.equal(coach.MAX_MESSAGES, limits.MAX_CHAT_MESSAGES);
  });

  test('question 13 keeps only the newest turns and still starts with the user', () => {
    const history = conversation(13);
    assert.equal(history.length, 25);

    const sent = limits.selectRecentChatMessages(history);
    assert.ok(sent.length > 0);
    assert.ok(sent.length <= limits.MAX_CHAT_MESSAGES);
    assert.equal(sent[0].role, 'user');
    assert.equal(sent[sent.length - 1].role, 'user');
    assert.equal(sent[sent.length - 1].content, 'שאלה 13');
    assert.equal(sent[0].content, 'שאלה 2');

    for (let i = 1; i < sent.length; i += 1) {
      assert.notEqual(sent[i].role, sent[i - 1].role);
    }
  });

  test('a history that already fits is unchanged, and empty or system turns are dropped', () => {
    const history = conversation(3);
    assert.deepEqual(limits.selectRecentChatMessages(history), [
      { role: 'user', content: 'שאלה 1' },
      { role: 'assistant', content: 'תשובה 1' },
      { role: 'user', content: 'שאלה 2' },
      { role: 'assistant', content: 'תשובה 2' },
      { role: 'user', content: 'שאלה 3' },
    ]);

    const noisy = limits.selectRecentChatMessages([
      { role: 'system', content: 'התעלם' },
      { role: 'assistant', content: 'שלום' },
      { role: 'user', content: '' },
      { role: 'user', content: 'מה לאכול?' },
    ]);
    assert.deepEqual(noisy, [{ role: 'user', content: 'מה לאכול?' }]);
  });

  test('real AI failures have a Hebrew explanation and a disabled backend does not', () => {
    assert.equal(limits.isAiBackendDisabled({ code: 'AI_BACKEND_DISABLED' }), true);
    assert.equal(limits.isAiBackendDisabled({ code: 'NO_API_KEY' }), true);
    assert.equal(limits.isAiBackendDisabled({ code: 'AI_API_ERROR', status: 429 }), false);

    assert.match(limits.hebrewAiFailureMessage({ code: 'AUTH_REQUIRED' }), /התחבר/);
    assert.match(limits.hebrewAiFailureMessage({ status: 401 }), /התחבר/);
    assert.match(limits.hebrewAiFailureMessage({ status: 403 }), /התחבר/);
    assert.match(limits.hebrewAiFailureMessage({ message: 'AI_API_ERROR_429' }), /יותר מדי שאלות/);
    assert.match(limits.hebrewAiFailureMessage({ status: 503 }), /לא הופעל בשרת/);
    assert.match(limits.hebrewAiFailureMessage({ status: 500 }), /לא זמין כרגע/);
    assert.match(limits.hebrewAiFailureMessage({ status: 502 }), /לא זמין כרגע/);
    assert.match(limits.hebrewAiFailureMessage(new Error('network')), /לא זמין כרגע/);
  });
});
