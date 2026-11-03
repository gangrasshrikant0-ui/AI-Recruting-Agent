import { NextResponse } from "next/server";
import { correctScore, getEvaluation, updateWeights } from "@/lib/evaluation";
export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("all") === "true") return NextResponse.json({ evaluations: ["c1", "c2", "c3", "c4", "c5"].map(getEvaluation) });
  return NextResponse.json(getEvaluation(url.searchParams.get("candidateId") || "c1"));
}
export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (body.action === "weights") return NextResponse.json({ weights: updateWeights(body.weights || {}) });
    if (body.action === "correction") return NextResponse.json(correctScore(body.candidateId, body.competency, Number(body.score), body.reason));
    return NextResponse.json({ error: "Unsupported evaluation action" }, { status: 400 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Evaluation update failed" }, { status: 400 }); }
}
