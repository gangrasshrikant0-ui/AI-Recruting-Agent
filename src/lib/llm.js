const GEMINI_KEY = process.env.GEMINI_API_KEY;

export async function generateJSON(prompt, mockFn, agent = 'unknown') {
  const start = Date.now();
  if (!GEMINI_KEY) return { data: mockFn(), model: 'mock', isMock: true, latencyMs: 50 };
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: `${prompt}\n\nRespond with valid JSON only. No markdown fences, no explanation.` }] }], generationConfig: { temperature: 0.3, maxOutputTokens: 2048 } }),
    });
    if (!res.ok) throw new Error(`${res.status}`);
    const json = await res.json();
    const raw = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const m = raw.match(/```(?:json)?\s*([\s\S]*?)```/) ?? raw.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    const text = m ? (m[1] ?? m[0]) : raw;
    const parsed = JSON.parse(text.trim());
    return { data: parsed, model: 'gemini-1.5-flash', isMock: false, latencyMs: Date.now() - start };
  } catch {
    return { data: mockFn(), model: 'mock-fallback', isMock: true, latencyMs: Date.now() - start };
  }
}

export async function generateText(prompt) {
  if (!GEMINI_KEY) return 'AI response unavailable (no GEMINI_API_KEY). This is a demo placeholder.';
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 1024 } }),
    });
    const json = await res.json();
    return json.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No response';
  } catch { return 'AI service temporarily unavailable.'; }
}

