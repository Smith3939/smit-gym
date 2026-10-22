import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { describe, test } from 'node:test';

const require = createRequire(import.meta.url);
const coach = require('../api/claude.js');

function mockResponse() {
  return {
    statusCode: null,
    body: null,
    headers: {},
    setHeader(key, value) {
      this.headers[key] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

function withEnv(values, fn) {
  const previous = {};
  for (const key of Object.keys(values)) {
    previous[key] = process.env[key];
    if (values[key] === undefined) delete process.env[key];
    else process.env[key] = values[key];
  }
  return Promise.resolve()
    .then(fn)
    .finally(() => {
      for (const key of Object.keys(previous)) {
        if (previous[key] === undefined) delete process.env[key];
        else process.env[key] = previous[key];
      }
    });
}

describe('openai coach route', { concurrency: 1 }, () => {
test('default model is gpt-5-mini when OPENAI_MODEL is unset or blank', () => {
  return withEnv({ OPENAI_MODEL: undefined }, () => {
    assert.equal(coach.resolveModel(), 'gpt-5-mini');
    assert.equal(coach.DEFAULT_MODEL, 'gpt-5-mini');
  }).then(() =>
    withEnv({ OPENAI_MODEL: '   ' }, () => {
      assert.equal(coach.resolveModel(), 'gpt-5-mini');
    })
  );
});

test('OPENAI_MODEL override is trimmed', () => {
  return withEnv({ OPENAI_MODEL: '  gpt-4.1-mini  ' }, () => {
    assert.equal(coach.resolveModel(), 'gpt-4.1-mini');
  });
});

test('gpt-5-mini request keeps the client message shape and asks for minimal reasoning', () => {
  const body = coach.buildChatCompletionBody({
    model: 'gpt-5-mini',
    maxTokens: 1024,
    system: 'אתה מאמן',
    messages: [{ role: 'user', content: 'שלום' }],
  });

  assert.equal(body.model, 'gpt-5-mini');
  assert.equal(body.reasoning_effort, 'minimal');
  assert.equal(body.max_completion_tokens, 1536);
  assert.deepEqual(body.messages, [
    { role: 'system', content: 'אתה מאמן' },
    { role: 'user', content: 'שלום' },
  ]);
  assert.equal(body.max_tokens, undefined);
  assert.equal(body.temperature, undefined);
});

test('a non-reasoning model does not get reasoning_effort', () => {
  const body = coach.buildChatCompletionBody({
    model: 'gpt-4.1-mini',
    maxTokens: 1500,
    system: 'json',
    messages: [{ role: 'user', content: 'החלף' }],
  });

  assert.equal(body.reasoning_effort, undefined);
  assert.equal(body.max_completion_tokens, 1500);
});

test('reasoning headroom never exceeds the server cap', () => {
  const body = coach.buildChatCompletionBody({
    model: 'gpt-5-mini',
    maxTokens: 2048,
    system: 'אתה מאמן',
    messages: [{ role: 'user', content: 'שלום' }],
  });
  assert.equal(body.max_completion_tokens, 2048);
});

test('assistant text is taken from a string or from text parts', () => {
  assert.equal(coach.extractAssistantText({ choices: [{ message: { content: '  שלום  ' } }] }), 'שלום');
  assert.equal(
    coach.extractAssistantText({
      choices: [{ message: { content: [{ type: 'text', text: 'אחת' }, { type: 'text', text: 'שתיים' }] } }],
    }),
    'אחתשתיים'
  );
  assert.equal(coach.extractAssistantText({ choices: [{ message: { content: null, refusal: 'no' } }] }), '');
  assert.equal(coach.extractAssistantText({}), '');
});

test('GET is rejected', async () => {
  const response = mockResponse();
  await coach({ method: 'GET', headers: {} }, response);
  assert.equal(response.statusCode, 405);
  assert.equal(response.body.error, 'Method not allowed');
  assert.equal(response.headers.Allow, 'POST');
});

test('missing OpenAI key returns 503', async () => {
  await withEnv({ OPENAI_API_KEY: undefined }, async () => {
    const response = mockResponse();
    await coach({ method: 'POST', headers: {}, body: {} }, response);
    assert.equal(response.statusCode, 503);
    assert.equal(response.body.error, 'AI service is not configured');
  });
});

test('blank OpenAI key returns 503', async () => {
  await withEnv({ OPENAI_API_KEY: '   ' }, async () => {
    const response = mockResponse();
    await coach({ method: 'POST', headers: {}, body: {} }, response);
    assert.equal(response.statusCode, 503);
    assert.equal(response.body.error, 'AI service is not configured');
  });
});

test('empty allowlist returns 503 before calling OpenAI', async () => {
  await withEnv({ OPENAI_API_KEY: 'sk-test', AI_ALLOWED_EMAILS: '  ,  ' }, async () => {
    let called = false;
    const original = global.fetch;
    global.fetch = async () => {
      called = true;
      throw new Error('should not call OpenAI');
    };
    try {
      const response = mockResponse();
      await coach({ method: 'POST', headers: {}, body: {} }, response);
      assert.equal(response.statusCode, 503);
      assert.equal(response.body.error, 'AI access is not configured');
      assert.equal(called, false);
    } finally {
      global.fetch = original;
    }
  });
});

test('missing bearer token returns 401', async () => {
  await withEnv({ OPENAI_API_KEY: 'sk-test', AI_ALLOWED_EMAILS: 'owner@example.com' }, async () => {
    const response = mockResponse();
    await coach({ method: 'POST', headers: {}, body: {} }, response);
    assert.equal(response.statusCode, 401);
    assert.equal(response.body.error, 'Authentication required');
  });
});

test('OpenAI success returns only the text field the client already expects', async () => {
  let seen;
  const outcome = await coach.requestChatCompletion({
    apiKey: 'sk-test-not-real',
    model: 'gpt-5-mini',
    maxTokens: 1024,
    system: 'אתה מאמן',
    messages: [{ role: 'user', content: 'מה לאכול אחרי אימון?' }],
    fetchImpl: async (url, init) => {
      seen = { url, init };
      return {
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'אחרי אימון כדאי חלבון ופחמימה.' } }] }),
      };
    },
  });

  assert.equal(seen.url, 'https://api.openai.com/v1/chat/completions');
  assert.equal(seen.init.headers.authorization, 'Bearer sk-test-not-real');
  assert.equal(JSON.parse(seen.init.body).model, 'gpt-5-mini');
  assert.equal(outcome.status, 200);
  assert.deepEqual(outcome.body, { text: 'אחרי אימון כדאי חלבון ופחמימה.' });
});

test('OpenAI failures stay on the old 502 messages and do not leak the key', async () => {
  const unreachable = await coach.requestChatCompletion({
    apiKey: 'sk-test-not-real',
    model: 'gpt-5-mini',
    maxTokens: 1024,
    system: 'אתה מאמן',
    messages: [{ role: 'user', content: 'שלום' }],
    fetchImpl: async () => {
      throw new Error('network down');
    },
  });
  assert.equal(unreachable.status, 502);
  assert.equal(unreachable.body.error, 'Could not reach the AI provider');
  assert.equal(JSON.stringify(unreachable.body).includes('sk-test'), false);

  const failed = await coach.requestChatCompletion({
    apiKey: 'sk-test-not-real',
    model: 'gpt-5-mini',
    maxTokens: 1024,
    system: 'אתה מאמן',
    messages: [{ role: 'user', content: 'שלום' }],
    fetchImpl: async () => ({
      ok: false,
      status: 401,
      json: async () => ({ error: { code: 'invalid_api_key', message: 'Incorrect API key sk-secret' } }),
    }),
  });
  assert.equal(failed.status, 502);
  assert.equal(failed.body.error, 'AI provider request failed');
  assert.equal(JSON.stringify(failed.body).includes('sk-'), false);

  const empty = await coach.requestChatCompletion({
    apiKey: 'sk-test-not-real',
    model: 'gpt-5-mini',
    maxTokens: 1024,
    system: 'אתה מאמן',
    messages: [{ role: 'user', content: 'שלום' }],
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({ choices: [{ message: { content: '   ' } }] }),
    }),
  });
  assert.equal(empty.status, 502);
  assert.equal(empty.body.error, 'AI provider returned no text');
});

test('malformed bearer token returns 401', async () => {
  await withEnv({ OPENAI_API_KEY: 'sk-test', AI_ALLOWED_EMAILS: 'owner@example.com' }, async () => {
    const response = mockResponse();
    await coach(
      { method: 'POST', headers: { authorization: 'Bearer not-a-jwt' }, body: {} },
      response
    );
    assert.equal(response.statusCode, 401);
    assert.equal(response.body.error, 'Invalid authentication token');
  });
});
});
