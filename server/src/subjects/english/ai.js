import { rubricFor } from './marking.js';

const DEFAULT_MODEL = 'deepseek/deepseek-v4-flash-0731';

export function aiConfig() {
  return {
    apiKey: process.env.OPENROUTER_API_KEY || '',
    model: process.env.OPENROUTER_MODEL || DEFAULT_MODEL,
  };
}

async function callOpenRouter({ system, user, json = false, apiKey, model }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 90000);
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'X-Title': 'EnglishMate Tutor',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
        temperature: 0.3,
        max_tokens: json ? 1100 : 800,
        ...(json ? { response_format: { type: 'json_object' } } : {}),
      }),
    });
    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error(`OpenRouter ${res.status}: ${err.slice(0, 200)}`);
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  } finally {
    clearTimeout(timer);
  }
}

function parseJsonLoose(text) {
  const cleaned = text
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('no json found');
    return JSON.parse(match[0]);
  }
}

/* ------------------------------------------------------------------ */
/* AI marking of extended responses                                     */
/* ------------------------------------------------------------------ */

export async function markAnswer({ rubricKey, questionText, sourceText, answer, apiKey, model }) {
  if (!apiKey) {
    const r = rubricFor(rubricKey);
    return {
      ai: false,
      key: r.key,
      name: r.name,
      marksTotal: r.marks,
      rubric: r,
      error: 'no-api-key',
    };
  }
  const r = rubricFor(rubricKey);
  const bandList = r.bands.map((b) => `Level ${b.level} (${b.range}): ${b.desc}`).join('\n');
  const splitJson = r.split
    ? 'Include integers "content" (0-' + r.split.content.max + ') and "accuracy" (0-' + r.split.accuracy.max + '), and set "marks" to their sum.'
    : '';
  const system = `You are an experienced AQA GCSE English Language (8700) examiner with 20 years of experience marking real exam papers. Mark the following student answer against the official-style mark scheme provided. Be fair, consistent and deserved, exactly as a live examiner would be: neither generous nor harsh.

QUESTION:
${questionText}

SOURCE TEXT (for reference):
${sourceText ? sourceText.slice(0, 4000) : '(none needed)'}

MARK SCHEME for ${r.name} (${r.ao}):
${bandList}

EXAMINER GUIDANCE:
${r.guidance}

RULES:
- Award a whole-number mark inside the official ranges.
- ${splitJson}
- Reply with ONLY a valid JSON object: {"marks": <int>, "level": <1-4>, ${r.split ? '"content": <int>, "accuracy": <int>, ' : ''}"strengths": "<2-3 specific strengths, quoting the student where possible>", "improvements": "<2-3 precise, actionable targets>", "modelAnswer": "<a concise exemplar answer for this exact question (roughly 120-200 words, or for 40-mark tasks a short opening plus note on structure, ~150 words)>"}`;

  try {
    const raw = await callOpenRouter({
      system,
      user: `STUDENT ANSWER:\n${String(answer || '(no answer submitted)').slice(0, 8000)}`,
      json: true,
      apiKey,
      model,
    });
    const parsed = parseJsonLoose(raw);
    const marks = Math.max(0, Math.min(Number(parsed.marks) || 0, r.marks));
    const content = r.split
      ? Math.max(0, Math.min(Number(parsed.content) || 0, r.split.content.max))
      : null;
    const accuracy = r.split
      ? Math.max(0, Math.min(Number(parsed.accuracy) || 0, r.split.accuracy.max))
      : null;
    return {
      ai: true,
      key: r.key,
      name: r.name,
      marksTotal: r.marks,
      marks,
      level: parsed.level || null,
      content,
      accuracy,
      strengths: String(parsed.strengths || ''),
      improvements: String(parsed.improvements || ''),
      modelAnswer: String(parsed.modelAnswer || ''),
      rubric: r,
    };
  } catch (e) {
    return {
      ai: false,
      key: r.key,
      name: r.name,
      marksTotal: r.marks,
      rubric: r,
      error: e.message,
    };
  }
}

/* ------------------------------------------------------------------ */
/* Tutor chat                                                            */
/* ------------------------------------------------------------------ */

const CHAT_FALLBACK = `I'm in offline mode right now (no OpenRouter API key is configured).

Quick tip while I'm away: for any extended English answer, remember the golden trio —
1) answer the exact question focus, 2) quote and name the method, 3) explain the effect on the reader.
Add OPENROUTER_API_KEY to enable full AI tutoring and AI marking.`;

export async function askTutor(messages, { model, apiKey }) {
  if (!apiKey) {
    return { reply: CHAT_FALLBACK, model: 'offline-tutor (no OPENROUTER_API_KEY set)' };
  }
  const system = `You are a warm, expert tutor for AQA GCSE English Language (8700), helping a student target grades 4-6 first, then 7-9.
Rules:
- Be encouraging and specific; never waffle.
- Explain the skill, then model it briefly; give frameworks (quote → technique → effect) rather than finished essays, unless the student explicitly asks for a model answer (then keep it under 250 words).
- Reference the real exam: Paper 1 Q1-Q5, Paper 2 Q1-Q5, marks and timing (e.g. Q5 is 40 marks, 45 minutes: 5 plan, 35 write, 5 check).
- Use plain text formatting; short paragraphs; use bullet points sparingly.
- If asked about set texts for Literature, gently note this app is for English Language and refocus on the language skills.
- Be honest about grades: 40/80 is not "excellent", but improvements are always worth celebrating.`;
  try {
    const raw = await callOpenRouter({
      system,
      user: messages.slice(-12).map((m) => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`).join('\n\n') + '\n\nTutor:',
      apiKey,
      model,
    });
    return { reply: raw, model: model || DEFAULT_MODEL };
  } catch (e) {
    return {
      reply: `The AI tutor is unavailable right now (${e.message}). Try again in a moment.`,
      model: 'error',
      error: true,
    };
  }
}