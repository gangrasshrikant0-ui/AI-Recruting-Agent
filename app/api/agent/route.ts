import { NextResponse } from "next/server";
import { blueprint, criteria } from "@/lib/data";
import { route } from "@/lib/orchestrator";
export async function POST(req: Request) {
  const { action = "analyze", input = "" } = await req.json();
  const result = action === "analyze" ? { criteria, blueprint } : { message:"Mock agent completed", action };
  const approval = route(action === "analyze" ? "jobAnalysis" : "recruiterAssistant", input, JSON.stringify(result));
  return NextResponse.json({ ...result, approval });
}
