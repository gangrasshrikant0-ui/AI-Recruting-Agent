import { route } from "./orchestrator";

export type Competency = "technical" | "practical" | "problem-solving" | "communication" | "behavioral" | "project understanding";
export type Recommendation = "Strong match" | "Potential match" | "Insufficient evidence";
export type TranscriptTurn = { index: number; question: string; answer: string };
export type Evidence = { quote: string; turnIndex: number; grounded: boolean; validation: "grounded" | "flagged"; note: string };
export type CompetencyScore = {
  competency: Competency; score: number | null; rubricLevel: "Strong" | "Moderate" | "Weak" | "Insufficient evidence";
  evidence: Evidence[]; demonstratedVsClaimed: "Demonstrated" | "Claimed" | "Mixed" | "Insufficient evidence";
  confidence: number; evidenceQuality: "High" | "Medium" | "Low" | "None"; flagged: boolean; reason: string;
};
export type Evaluation = {
  candidateId: string; candidateName: string; role: string; duration: string; transcript: TranscriptTurn[];
  scores: CompetencyScore[]; overallScore: number | null; recommendation: Recommendation; reasons: string[];
  strengths: string[]; gaps: string[]; inconclusive: string[]; nextRoundTopics: string[]; humanReview: boolean;
  fairness: { redactedPreview: string; protectedAttributesRemoved: string[]; voiceFeaturesUsed: false; inconsistencyFlags: string[] };
  audit: Array<{ action: string; actor: string; reason: string; ts: string }>;
};

export const competencyWeights: Record<Competency, number> = {
  technical: 30, practical: 20, "problem-solving": 15, communication: 15, behavioral: 10, "project understanding": 10,
};
export const evaluationWeights: Record<Competency, number> = { ...competencyWeights };
export const evaluationAudit: Array<{ action: string; actor: string; reason: string; ts: string }> = [];
const role = "Senior Full-Stack Engineer";
const commonQuestions = [
  "Walk me through a production system you designed end to end.",
  "How would you debug a slow API endpoint in production?",
  "Tell me about a project you personally built, and the hardest technical decision in it.",
  "A release is blocked by a dependency and the deadline is tomorrow. What do you do?",
  "Tell me about a time you changed your mind after feedback.",
  "What trade-off would you revisit in that example, and what evidence supports your choice?",
];
const transcripts: Record<string, TranscriptTurn[]> = {
  c1: commonQuestions.map((question, index) => ({ index, question, answer: [
    "I designed a TypeScript service with a React client, PostgreSQL, queues, and metrics. It handled 10,000 requests per minute and reduced errors by 35 percent.",
    "I reproduce the issue, inspect traces and database timings, profile the endpoint, then ship a measured fix behind a safe rollout.",
    "I built the workflow personally, including the React screens and Node API. Integration tests and production metrics validated it.",
    "I communicate the risk, find a workaround, and agree on rollback while escalating the dependency owner.",
    "After feedback that my design was too complex, I removed two services and improved onboarding for the team.",
    "I would revisit the queue choice if traffic patterns changed, using p95 latency and cost as evidence.",
  ][index] })),
  c2: commonQuestions.slice(0, 4).map((question, index) => ({ index, question, answer: ["I worked on a web app.", "I would check the logs.", "I helped my team with a project.", "I would tell my manager."][index] })),
  c3: commonQuestions.slice(0, 2).map((question, index) => ({ index, question, answer: index === 0 ? "I have used React and Node.js." : "" })),
  c4: commonQuestions.map((question, index) => ({ index, question, answer: ["I built a payments platform with a queue and metrics.", "I use traces, profiling, and a canary release.", "I personally wrote the API and tests.", "I communicate impact and rollback options.", "I changed the design after peer review.", "I would revisit the queue based on p95 latency."][index] })),
  c5: commonQuestions.map((question, index) => ({ index, question, answer: ["I always work alone and never need feedback.", "I always inspect traces first.", "I led a project but did not write code.", "Sometimes I communicate after shipping.", "I never change direction after feedback.", "I would revisit everything."][index] })),
};
const scrub = (text: string) => text.replace(/\b(?:name|gender|age|college|university|school|located|location|from|he|she|his|her|they|them)\b(?:\s+is|\s+was|\s*:)?\s*[A-Za-z0-9 .,'-]{0,40}/gi, "[REDACTED]").replace(/\b\d{1,3}\s?(?:years old|yo)\b/gi, "[REDACTED]");
const normalize = (text: string) => scrub(text).toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
const grounded = (quote: string, transcript: TranscriptTurn[]) => {
  const target = normalize(quote);
  if (!target) return { ok: false, note: "Empty quote" };
  return transcript.some((turn) => {
    const source = normalize(turn.answer);
    if (source.includes(target)) return true;
    const targetTokens = new Set(target.split(" "));
    const overlap = source.split(" ").filter((token) => targetTokens.has(token)).length / Math.max(targetTokens.size, 1);
    return overlap >= 0.82;
  }) ? { ok: true, note: "Quote matched transcript after normalization" } : { ok: false, note: "Quote does not occur in transcript" };
};
const scoreFor = (candidateId: string, competency: Competency, transcript: TranscriptTurn[]): CompetencyScore => {
  const index = { technical: 0, practical: 1, "project understanding": 2, "problem-solving": 3, communication: 3, behavioral: 4 }[competency];
  const turn = transcript[index];
  if (!turn?.answer.trim()) return { competency, score: null, rubricLevel: "Insufficient evidence", evidence: [], demonstratedVsClaimed: "Insufficient evidence", confidence: 0.18, evidenceQuality: "None", flagged: true, reason: "No answer was recorded for this competency." };
  const strong = candidateId === "c1" || candidateId === "c4";
  const weak = candidateId === "c2" || candidateId === "c5";
  const quote = candidateId === "c4" && competency === "technical" ? "I designed a Ruby monolith that served a billion requests" : turn.answer;
  const check = grounded(quote, transcript);
  const score = candidateId === "c3" ? null : strong ? 88 - index * 3 : weak ? 48 - index * 3 : 55;
  const level = score === null ? "Insufficient evidence" : score >= 75 ? "Strong" : score >= 55 ? "Moderate" : "Weak";
  const flag = !check.ok || candidateId === "c5";
  return { competency, score, rubricLevel: flag && !check.ok ? "Insufficient evidence" : level, evidence: [{ quote, turnIndex: turn.index, grounded: check.ok, validation: check.ok ? "grounded" : "flagged", note: check.note }], demonstratedVsClaimed: candidateId === "c2" ? "Claimed" : candidateId === "c3" ? "Insufficient evidence" : "Demonstrated", confidence: flag ? 0.42 : strong ? 0.94 : 0.61, evidenceQuality: flag ? "Low" : strong ? "High" : "Medium", flagged: flag, reason: flag ? (check.ok ? "Inconsistency detected across answers." : "Evaluator quote failed grounding validation.") : "Evidence is specific and observable." };
};
export function sanitizeForEvaluation(transcript: TranscriptTurn[]) { return transcript.map((turn) => ({ ...turn, question: scrub(turn.question), answer: scrub(turn.answer) })); }
export function evaluateCandidate(candidateId: string, candidateName: string): Evaluation {
  const transcript = transcripts[candidateId] || [];
  const safe = sanitizeForEvaluation(transcript);
  const scores = (Object.keys(evaluationWeights) as Competency[]).map((competency) => scoreFor(candidateId, competency, transcript));
  const eligible = scores.filter((item) => item.score !== null && !item.flagged);
  const totalWeight = eligible.reduce((sum, item) => sum + evaluationWeights[item.competency], 0);
  const overallScore = totalWeight ? Math.round(eligible.reduce((sum, item) => sum + (item.score || 0) * evaluationWeights[item.competency], 0) / totalWeight) : null;
  const humanReview = scores.some((item) => item.flagged || item.confidence < 0.65);
  const recommendation: Recommendation = overallScore === null || eligible.length < 3 ? "Insufficient evidence" : overallScore >= 78 && !humanReview ? "Strong match" : "Potential match";
  const inconsistencyFlags = candidateId === "c5" ? ["Absolute claims conflict with later qualified answers."] : candidateId === "c4" ? ["Technical quote supplied by evaluator was not grounded."] : [];
  const evaluation = { candidateId, candidateName, role, duration: candidateId === "c3" ? "04:12" : "18:42", transcript, scores, overallScore, recommendation, reasons: recommendation === "Strong match" ? ["Specific production evidence", "Grounded answers across core competencies"] : recommendation === "Potential match" ? ["Some relevant evidence", "Human review required before decision"] : ["Not enough observable evidence to score safely"], strengths: scores.filter((item) => item.rubricLevel === "Strong").map((item) => item.competency), gaps: scores.filter((item) => item.rubricLevel === "Weak").map((item) => item.competency), inconclusive: scores.filter((item) => item.score === null || item.rubricLevel === "Insufficient evidence").map((item) => item.competency), nextRoundTopics: ["System design trade-offs", "Ownership and measurable outcomes"], humanReview, fairness: { redactedPreview: safe.map((item) => item.answer).join(" "), protectedAttributesRemoved: ["name", "gender", "age", "college", "location"], voiceFeaturesUsed: false as const, inconsistencyFlags }, audit: [] };
  route("evaluation", JSON.stringify({ candidateId, transcript: safe }), JSON.stringify({ recommendation, overallScore, humanReview }), "evaluation-v1");
  return evaluation;
}
export const seededEvaluations = ["c1", "c2", "c3", "c4", "c5"].map((id, index) => evaluateCandidate(id, ["Maya Iyer", "Rohan Patel", "Sara Khan", "Jon Bell", "Nina Kapoor"][index]));
export function getEvaluation(id: string) { return seededEvaluations.find((item) => item.candidateId === id) || seededEvaluations[0]; }
export function updateWeights(weights: Partial<Record<Competency, number>>, actor = "Priya Shah") { Object.assign(evaluationWeights, weights); evaluationAudit.unshift({ action: "Weights changed", actor, reason: "Recruiter-adjusted rubric weights", ts: new Date().toISOString() }); return evaluationWeights; }
export function correctScore(candidateId: string, competency: Competency, score: number, reason: string, actor = "Priya Shah") { const evaluation = getEvaluation(candidateId); const item = evaluation.scores.find((entry) => entry.competency === competency); if (!item || !reason.trim()) throw new Error("A score and correction reason are required."); item.score = Math.max(0, Math.min(100, score)); item.rubricLevel = item.score >= 75 ? "Strong" : item.score >= 55 ? "Moderate" : "Weak"; item.flagged = false; evaluation.audit.unshift({ action: `Corrected ${competency} score`, actor, reason, ts: new Date().toISOString() }); evaluationAudit.unshift({ action: `Corrected ${candidateId} ${competency}`, actor, reason, ts: new Date().toISOString() }); return evaluation; }
