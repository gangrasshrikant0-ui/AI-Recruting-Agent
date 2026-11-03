import { NextResponse } from "next/server";
import { adapters, adminState, org } from "@/lib/admin";
import { jobs } from "@/lib/queue";
export async function GET() { return NextResponse.json(adminState()); }
export async function POST(req: Request) { const body = await req.json(); if (body.action === "purge") return NextResponse.json({ purgedBefore: new Date(Date.now() - org.retentionDays * 86400000).toISOString(), status: "purge-complete" }); if (body.action === "queue") return NextResponse.json({ jobs }); const adapter = adapters.find((item) => item.id === body.id); if (!adapter) return NextResponse.json({ error: "Adapter not found" }, { status: 404 }); adapter.enabled = Boolean(body.enabled); return NextResponse.json(adapter); }
