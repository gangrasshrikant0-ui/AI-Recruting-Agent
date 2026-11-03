type JsonRecord = Record<string, unknown>;

function isValid(result: unknown, schema: JsonRecord): result is JsonRecord {
  if (!result || typeof result !== "object") return false;
  return Object.entries(schema).every(([key, value]) => {
    if (!(key in (result as JsonRecord))) return false;
    if (typeof value === "string") return typeof (result as JsonRecord)[key] === value;
    if (Array.isArray(value)) return Array.isArray((result as JsonRecord)[key]);
    return true;
  });
}

export async function generateJSON<T extends JsonRecord>(
  schema: JsonRecord,
  prompt: string,
  fallback: T,
  validate: (result: unknown) => result is T = (result): result is T => isValid(result, schema),
) {
  if (!process.env.GEMINI_API_KEY) return fallback;
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: `Return only valid JSON. Schema: ${JSON.stringify(schema)}\n${prompt}` }] }] }),
      });
      if (!res.ok) throw new Error(`Gemini request failed: ${res.status}`);
      const data = await res.json();
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text?.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(raw || "{}");
      if (validate(parsed)) return parsed;
      throw new Error("Gemini returned JSON with an invalid schema");
    } catch (error) {
      lastError = error;
      if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 150 * 2 ** attempt));
    }
  }
  console.warn("Falling back after malformed LLM output", lastError);
  return fallback;
}
