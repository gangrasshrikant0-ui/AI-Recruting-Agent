import { NextResponse } from "next/server";
import { assistant, completeInterview, createIcs, getState, moveCandidate, enqueueMessage, resolveApproval, retryMessage, updateAppointment } from "@/lib/recruiting";
export async function GET(req: Request) {
  const url = new URL(req.url); const state = getState();
  if (url.searchParams.get("ics")) return new Response(createIcs(url.searchParams.get("ics")!), { headers: { "content-type": "text/calendar", "content-disposition": "attachment; filename=interview.ics" } });
  if (url.searchParams.get("assistant")) return NextResponse.json({ answer: assistant(url.searchParams.get("assistant")!) });
  return NextResponse.json(state);
}
export async function POST(req: Request) {
  try { const body = await req.json();
    if (body.action === "move") return NextResponse.json(moveCandidate(body.candidateId, body.stage, body.reason || ""));
    if (body.action === "approval") return NextResponse.json(resolveApproval(body.id, Boolean(body.approved)));
    if (body.action === "message") return NextResponse.json(enqueueMessage(body.candidateId, body.channel || "Email", body.subject, body.body));
    if (body.action === "retry") return NextResponse.json(retryMessage(body.id));
    if (body.action === "interview-complete") return NextResponse.json(completeInterview(body.candidateId));
    if (body.action === "appointment") return NextResponse.json(updateAppointment(body.id, body.operation, body.value));
    return NextResponse.json({ error: "Unsupported recruiting action" }, { status: 400 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Recruiting action failed" }, { status: 400 }); }
}
