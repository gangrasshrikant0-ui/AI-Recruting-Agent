import { NextResponse } from "next/server";
import { signWebhook } from "@/lib/security";
export async function POST(req: Request) { const body = await req.text(); return NextResponse.json({ accepted: true, signature: signWebhook(body), event: JSON.parse(body || "{}") }); }
