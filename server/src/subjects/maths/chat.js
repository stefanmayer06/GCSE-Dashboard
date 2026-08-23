const FALLBACK_REPLIES = [
  `I'm running in offline mode right now because no OpenRouter API key is configured.\n\nIn the meantime, here's a tip: for any GCSE question, underline the key numbers, decide which topic it is, then write down the formula you need BEFORE you start. Getting the right method is half the mark.\n\nAdd OPENROUTER_API_KEY to the environment (see .env.example) and I'll become a full AI maths tutor.`,
];

const KEYWORDS = [
  { re: /fraction/i, msg: 'Fractions: to add or subtract, find a common denominator first. To multiply, top × top and bottom × bottom. To divide, keep-flip-change (multiply by the reciprocal).' },
  { re: /percent/i, msg: 'Percentages: 10% means divide by 10. Increase by p% → multiply by (100+p)/100. Reverse a percentage change by dividing by the multiplier.' },
  { re: /ratio/i, msg: 'Ratio: add the parts to get the total, divide the amount by the total parts to find ONE part, then multiply by the parts you need.' },
  { re: /algebra|equation/i, msg: 'Equations: do the same to BOTH sides. Undo + with −, × with ÷, and expand brackets first when you see them.' },
  { re: /pythag/i, msg: 'Pythagoras: works only in right-angled triangles. Hypotenuse = √(a² + b²). A shorter side = √(c² − b²).' },
  { re: /trig|sin|cos|tan/i, msg: 'Trigonometry: label O (opposite), A (adjacent) and H (hypotenuse), then pick SOH, CAH or TOA. sin 30° = 1/2, cos 60° = 1/2, tan 45° = 1.' },
  { re: /probab/i, msg: 'Probability: P(event) = ways it can happen ÷ total outcomes. AND → multiply. OR (mutually exclusive) → add. Expected = P × trials.' },
  { re: /mean|median|mode|range|average/i, msg: 'Averages: Mean = total ÷ count. Median = middle value when ordered. Mode = most common. Range = biggest − smallest.' },
  { re: /area|perimeter|volume/i, msg: 'Measures: Area of rectangle = bh, triangle = ½bh, trapezium = ½(a+b)h. Perimeter = add the sides. Volume of a prism = cross-section × length.' },
  { re: /circle|circumference/i, msg: 'Circles: Circumference = πd, Area = πr². Remember the radius is HALF the diameter.' },
  { re: /angle/i, msg: 'Angles: straight line = 180°, point = 360°, triangle = 180°, quadrilateral = 360°. Z-shape (alternate) equal, C-shape (co-interior) add to 180°.' },
  { re: /graph|gradient|line/i, msg: 'Graphs: y = mx + c — m is the gradient, c is the y-intercept. Gradient = change in y ÷ change in x.' },
  { re: /sequence|nth/i, msg: 'Sequences: nth term = dn + (a − d), where d is the common difference and a is the first term.' },
];

export async function askTutor(messages, { model, apiKey, tier = 'foundation' }) {
  if (!apiKey) {
    const last = [...messages].reverse().find((m) => m.role === 'user');
    const text = last?.content || '';
    const hit = KEYWORDS.find((k) => k.re.test(text));
    return {
      reply:
        (hit ? hit.msg + '\n\n' : '') +
        FALLBACK_REPLIES[0],
      model: 'offline-tutor (no OPENROUTER_API_KEY set)',
    };
  }
  const higher = tier === 'higher';
  const system = `You are a patient, encouraging GCSE maths tutor for a student taking AQA GCSE Maths ${higher ? 'HIGHER tier (grades 4-9)' : 'FOUNDATION tier (grades 1-5)'}.
Rules:
- Explain step by step, in simple language, with a small worked example where helpful.
- Never give full answers away immediately: guide the student to work it out (Socratic style). If they are stuck, give one hint at a time.
- Keep answers short (under ~200 words) unless asked for detail.
- Use plain text maths (e.g. x^2, sqrt, 3/4) — no LaTeX.
- ${higher ? 'Use Higher content confidently: surds, quadratic formula, functions, vectors, sine/cosine rule, conditional probability and histograms.' : 'If a topic is higher-tier only (e.g. vectors with magnitudes, quadratic formula, sine rule), say so and focus on foundation-level skills.'}
- Be warm and motivating.`;
  const body = {
    model: model || 'google/gemma-4-26b-a4b',
    messages: [{ role: 'system', content: system }, ...messages.slice(-12)],
    temperature: 0.4,
    max_tokens: 700,
  };
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'X-Title': 'Maths Dashboard Tutor',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    if (res.status === 401 || res.status === 403) {
      return {
        reply: 'My OpenRouter API key looks invalid. Check OPENROUTER_API_KEY in your environment.',
        model: 'error',
        error: true,
      };
    }
    return {
      reply: `The AI tutor is unavailable right now (error ${res.status}). ${err ? 'Details: ' + err.slice(0, 200) : 'Try again in a moment.'}`,
      model: 'error',
      error: true,
    };
  }
  const data = await res.json();
  const reply = data.choices?.[0]?.message?.content || 'Hmm, I got an empty reply. Try again!';
  return { reply, model: data.model || (model || 'google/gemma-4-26b-a4b') };
}
