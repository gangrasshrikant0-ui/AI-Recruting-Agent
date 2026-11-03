import { NextResponse } from "next/server";
import { candidates } from "@/lib/data";
import { requireScope, scoped, ORG_ID } from "@/lib/security";
export async function GET(req: Request) { try { const auth = requireScope(req, "candidates:read"); return NextResponse.json({ orgId: auth.orgId, data: scoped(candidates.map((candidate) => ({ ...candidate, orgId: ORG_ID })), auth.orgId) }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unauthorized" }, { status: 401 }); } }
export async function POST(req: Request) { try { const auth = requireScope(req, "candidates:write"); const body = await req.json(); return NextResponse.json({ orgId: auth.orgId, imported: scoped([{ ...body, orgId: ORG_ID }]) }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unauthorized" }, { status: 401 }); } }
