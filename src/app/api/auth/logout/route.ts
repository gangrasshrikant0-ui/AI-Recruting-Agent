import { NextResponse } from 'next/server';
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete('user_id'); res.cookies.delete('user_role'); res.cookies.delete('org_id');
  return res;
}

