import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';
function getDB() { const Database = require('better-sqlite3'); const path = require('path'); return new Database(path.resolve(process.env.DB_PATH || './recruiting.db')); }
export async function GET(req: NextRequest) {
  const orgId = req.cookies.get('org_id')?.value || 'org-demo';
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get('jobId');
  const db = getDB();
  const q = jobId
    ? 'SELECT c.*,a.stage,a.match_score,a.id as app_id,a.job_id,j.title as job_title FROM candidates c JOIN applications a ON c.id=a.candidate_id JOIN jobs j ON a.job_id=j.id WHERE c.org_id=? AND a.job_id=? ORDER BY a.match_score DESC NULLS LAST'
    : 'SELECT c.*,a.stage,a.match_score,a.id as app_id,a.job_id,j.title as job_title FROM candidates c LEFT JOIN applications a ON c.id=a.candidate_id LEFT JOIN jobs j ON a.job_id=j.id WHERE c.org_id=? ORDER BY c.created_at DESC';
  const candidates = jobId ? db.prepare(q).all(orgId,jobId) : db.prepare(q).all(orgId);
  db.close(); return NextResponse.json({ candidates });
}
export async function POST(req: NextRequest) {
  const orgId = req.cookies.get('org_id')?.value || 'org-demo';
  const body = await req.json(); const db = getDB();
  const existing = db.prepare('SELECT id FROM candidates WHERE org_id=? AND email=?').get(orgId,body.email);
  if (existing) { db.close(); return NextResponse.json({ error:'Duplicate email', existingId:(existing as Record<string,string>).id }, { status:409 }); }
  const id = uuid(); const now = Date.now();
  db.prepare('INSERT INTO candidates (id,org_id,email,name,phone,resume_text,profile,language,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)').run(id,orgId,body.email,body.name,body.phone||'',body.resumeText||'',JSON.stringify(body.profile||{}),'en',now,now);
  if (body.jobId) { const appId = uuid(); db.prepare('INSERT INTO applications (id,org_id,job_id,candidate_id,stage,stage_history,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)').run(appId,orgId,body.jobId,id,'Application received',JSON.stringify([{stage:'Application received',ts:now}]),now,now); }
  db.close(); return NextResponse.json({ id });
}

