import assert from 'node:assert/strict';
import test from 'node:test';

import { askTutor, contentText } from '../src/subjects/english/ai.js';

test('normalizes OpenRouter text content returned in common Qwen formats', () => {
  assert.equal(contentText('  Hello tutor  '), 'Hello tutor');
  assert.equal(contentText([{ type: 'text', text: 'Hello ' }, { type: 'text', text: 'student' }]), 'Hello student');
  assert.equal(contentText([{ content: 'Use a quote.' }, ' Then explain its effect.']), 'Use a quote. Then explain its effect.');
  assert.equal(contentText({ text: 'Structured reply' }), 'Structured reply');
  assert.equal(contentText(null), '');
});

test('English tutor requests disable hidden reasoning and read structured replies', async () => {
  const originalFetch = globalThis.fetch;
  let request;
  globalThis.fetch = async (_url, options) => {
    request = JSON.parse(options.body);
    return new Response(JSON.stringify({
      choices: [{ message: { content: [{ type: 'text', text: 'Use a quotation, then explain its effect.' }] } }],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  try {
    const result = await askTutor([{ role: 'user', content: 'How do I answer Q2?' }], {
      model: 'qwen/qwen3.7-flash',
      apiKey: 'test-key',
    });
    assert.equal(request.reasoning.effort, 'none');
    assert.equal(request.max_tokens, 1200);
    assert.equal(result.reply, 'Use a quotation, then explain its effect.');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
