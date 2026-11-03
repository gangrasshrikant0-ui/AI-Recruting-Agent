import { NextRequest, NextResponse } from 'next/server';
function getDB() { const Database = require('better-sqlite3'); const path = require('path'); return new Database(path.resolve(process.env.DB_PATH || './recruiting.db')); }
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDB();
  const candidate = db.prepare('SELECT * FROM candidates WHERE id=?').get(params.id);
  const applications = db.prepare('SELECT a.*,j.title as job_title FROM applications a JOIN jobs j ON a.job_id=j.id WHERE a.candidate_id=?').all(params.id);
  const interviews = db.prepare('SELECT * FROM interviews WHERE candidate_id=? ORDER BY scheduled_at DESC').all(params.id);
  db.close();
  if (!candidate) return NextResponse.json({ error:'Not found' }, { status:404 });
  return NextResponse.json({ candidate, applications, interviews });
}
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json(); const db = getDB();
  const entries = Object.entries(body);
  if (entries.length) { const sets = entries.map(([k])=>`${k}=?`).join(','); db.prepare(`UPDATE candidates SET ${sets},updated_at=? WHERE id=?`).run(...entries.map(([,v])=>v),Date.now(),params.id); }
  db.close(); return NextResponse.json({ ok:true });
}

