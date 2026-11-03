import { NextResponse } from "next/server";
import { generateJSON } from "@/lib/llm";
import { route } from "@/lib/orchestrator";

const questions = [
  { id: "architecture", category: "technical", difficulty: 3, text: "Walk me through a production system you designed end to end." },
  { id: "debugging", category: "practical", difficulty: 2, text: "How would you debug a slow API endpoint in production?" },
  { id: "project", category: "project", difficulty: 2, text: "Tell me about a project you personally built, and the hardest technical decision in it." },
  { id: "scenario", category: "situational", difficulty: 2, text: "A release is blocked by a dependency and the deadline is tomorrow. What do you do?" },
  { id: "behavioral", category: "behavioral", difficulty: 2, text: "Tell me about a time you changed your mind after feedback." },
  { id: "counter", category: "counter-question", difficulty: 3, text: "What trade-off would you revisit in that example, and what evidence supports your choice?" },
];

type Decision = { action: "follow_up" | "next" | "repeat" | "clarify" | "complete"; nextQuestion: string; nextQuestionId: string; confidence: number; lowConfidence: boolean; contradiction: boolean; reason: string };
const decisionSchema = { action: "string", nextQuestion: "string", nextQuestionId: "string", confidence: "number", lowConfidence: "boolean", contradiction: "boolean", reason: "string" };
const sessions = new Map<string, { startedAt: number; answered: string[] }>();

function fallbackDecision(answer: string, questionId: string, answered: string[], currentDifficulty: number, history: Array<{ answer: string }> = []): Decision {
  const normalized = answer.trim().toLowerCase();
  const current = questions.find((item) => item.id === questionId) || questions[0];
  if (/^(repeat|say that again|could you repeat|clarify|i don't understand)/.test(normalized)) {
    return { action: "repeat", nextQuestion: current.text, nextQuestionId: current.id, confidence: 1, lowConfidence: false, contradiction: false, reason: "Candidate requested repetition." };
  }
  const next = questions.find((item) => item.id !== questionId && !answered.includes(item.id));
  const vague = normalized.length < 55 || !/[0-9]|result|impact|because|trade-off|tradeoff/i.test(answer);
  const followUp = current.category === "project"
    ? "What part did you personally implement, and how did you validate that it worked?"
    : current.category === "situational"
      ? "What would you communicate first, and what countermeasure would you use if the dependency does not move?"
      : "Can you give a concrete example, including the result or metric, rather than a general approach?";
  if (vague) return { action: "follow_up", nextQuestion: followUp, nextQuestionId: current.id, confidence: 0.68, lowConfidence: true, contradiction: false, reason: "Answer was too brief or lacked observable evidence." };
  const contradiction = answered.length > 0 && (/always|never|no trade-?off/i.test(normalized) || (history.some((item) => /always|never/i.test(item.answer)) && /sometimes|depends|usually/i.test(normalized)));
  if (!next) return { action: "complete", nextQuestion: "", nextQuestionId: "", confidence: 0.88, lowConfidence: false, contradiction, reason: "All competency questions are complete." };
  const adjusted = answer.length > 180 ? Math.min(3, currentDifficulty + 1) : Math.max(1, currentDifficulty - 1);
  const adjustedNext = questions.find((item) => item.id === next.id && item.difficulty <= adjusted) || next;
  return { action: "next", nextQuestion: adjustedNext.text, nextQuestionId: adjustedNext.id, confidence: 0.9, lowConfidence: false, contradiction, reason: contradiction ? "Potential contradiction flagged for human review." : "Evidence was sufficient; moving to a non-repeated competency." };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const sessionId = String(body.sessionId || "demo-session");
    const session = sessions.get(sessionId) || { startedAt: Date.now(), answered: [] };
    if (body.action === "start") {
      sessions.set(sessionId, session);
      return NextResponse.json({ sessionId, startedAt: session.startedAt, question: questions[0], idempotent: Boolean(body.idempotencyKey) });
    }
    const answer = String(body.answer || "");
    const questionId = String(body.questionId || questions[0].id);
    const fallback = fallbackDecision(answer, questionId, session.answered, Number(body.difficulty || 2), Array.isArray(body.history) ? body.history : []);
    const prompt = `Interview question: ${body.question}\nAnswer: ${answer}\nEarlier answered question ids: ${session.answered.join(",")}\nChoose follow-up, project probe, scenario counter-question, repeat, next or complete. Never lead the candidate.`;
    const decision = await generateJSON<Decision>(decisionSchema, prompt, fallback, (value): value is Decision => {
      const candidate = value as Partial<Decision>;
      return Boolean(candidate && ["follow_up", "next", "repeat", "clarify", "complete"].includes(candidate.action || "") && typeof candidate.nextQuestion === "string" && typeof candidate.nextQuestionId === "string" && typeof candidate.confidence === "number" && typeof candidate.lowConfidence === "boolean" && typeof candidate.contradiction === "boolean" && typeof candidate.reason === "string");
    });
    if (answer.trim() && !session.answered.includes(questionId) && ["next", "complete"].includes(decision.action)) session.answered.push(questionId);
    sessions.set(sessionId, session);
    route("interview", answer, JSON.stringify(decision));
    return NextResponse.json({ ...decision, answered: session.answered.length, durationMs: Date.now() - session.startedAt });
  } catch (error) {
    return NextResponse.json({ error: "Interview turn could not be processed", detail: error instanceof Error ? error.message : "Unknown error" }, { status: 400 });
  }
}
