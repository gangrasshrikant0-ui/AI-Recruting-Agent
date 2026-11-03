import { NextResponse } from "next/server";
import { analytics } from "@/lib/analytics";
export async function GET() { return NextResponse.json(analytics()); }
