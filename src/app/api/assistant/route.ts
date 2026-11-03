import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/llm.js';
function getDB() { const D = require('better-sqlite3'), p = require('path'); return new D(p.resolve(process.env.DB_PATH||'./recruiting.db')); }
export async function POST(req: NextRequest) {
  const orgId = req.cookies.get('org_id')?.value||'org-demo'; const role = req.cookies.get('user_role')?.value||'recruiter';
  const { message } = await req.json(); const db = getDB();
  const n=(q:string,a:unknown[])=>(db.prepare(q).get(...a) as {c:number}).c;
  const ctx = { jobs:n('SELECT COUNT(*) as c FROM jobs WHERE org_id=?',[orgId]), candidates:n('SELECT COUNT(*) as c FROM candidates WHERE org_id=?',[orgId]), interviews:n('SELECT COUNT(*) as c FROM interviews WHERE org_id=?',[orgId]), pending:n("SELECT COUNT(*) as c FROM approvals WHERE org_id=? AND status='pending'",[orgId]), recent:db.prepare('SELECT c.name,a.stage,j.title FROM applications a JOIN candidates c ON a.candidate_id=c.id JOIN jobs j ON a.job_id=j.id WHERE a.org_id=? ORDER BY a.updated_at DESC LIMIT 5').all(orgId) };
  db.close();
  const response = await generateText(`You are an AI recruiting assistant for ${role}s at Acme Corp. Data: ${JSON.stringify(ctx)}. Answer concisely.\n\nUser: ${message}`);
  return NextResponse.json({response});
}

