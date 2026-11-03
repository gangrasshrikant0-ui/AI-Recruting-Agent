const base = process.env.BASE_URL || "http://localhost:3000";
const request = async (path, options = {}) => { const response = await fetch(`${base}${path}`, { ...options, headers: { "content-type": "application/json", ...(options.headers || {}) } }); if (!response.ok) throw new Error(`${path} ${response.status}: ${await response.text()}`); return response.json(); };
const assert = (condition, message) => { if (!condition) throw new Error(message); };
try {
  const analysis = await request("/api/agent", { method: "POST", body: JSON.stringify({ action: "analyze", input: "Senior TypeScript engineer" }) }); assert(analysis.criteria && analysis.blueprint, "JD analysis failed");
  const state = await request("/api/recruiting"); assert(state.candidates.length >= 25, "matching seed failed");
  const approval = await request("/api/recruiting", { method: "POST", body: JSON.stringify({ action: "approval", id: "ap1", approved: true }) }); assert(approval.status === "approved", "shortlist approval failed");
  const scheduled = await request("/api/recruiting", { method: "POST", body: JSON.stringify({ action: "appointment", id: "s1", operation: "attendance", value: "confirmed" }) }); assert(scheduled.status === "confirmed", "scheduling failed");
  const start = await request("/api/interview", { method: "POST", body: JSON.stringify({ action: "start", sessionId: "smoke-session", idempotencyKey: "smoke-session" }) }); assert(start.question, "scripted interview start failed");
  await request("/api/interview", { method: "POST", body: JSON.stringify({ sessionId: "smoke-session", questionId: "architecture", question: start.question.text, answer: "I designed a production service with measurable results and a trade-off.", history: [] }) });
  const evaluation = await request("/api/evaluation?candidateId=c1"); assert(evaluation.scores[0].evidence[0].validation === "grounded", "grounding validation failed");
  const moved = await request("/api/recruiting", { method: "POST", body: JSON.stringify({ action: "move", candidateId: "c1", stage: "Evaluation pending", reason: "Smoke transition" }) }); assert(moved.stage === "Evaluation pending", "stage transition failed");
  const analytics = await request("/api/analytics"); assert(analytics.kpis.applications >= 25, "analytics failed");
  console.log("SMOKE PASS: JD analysis, matching, approval, scheduling, interview, grounded evaluation, stage transition, analytics");
} catch (error) { console.error(`SMOKE FAIL: ${error.message}`); process.exitCode = 1; }
