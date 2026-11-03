import { NextRequest, NextResponse } from 'next/server';
import { screenCandidate } from '@/lib/agents.js';
function getDB() { const Database = require('better-sqlite3'); const path = require('path'); return new Database(path.resolve(process.env.DB_PATH || './recruiting.db')); }
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const orgId = req.cookies.get('org_id')?.value || 'org-demo';
  const { jobId } = await req.json();
  const db = getDB();
  const candidate = db.prepare('SELECT * FROM candidates WHERE id=?').get(params.id) as Record<string,string>|undefined;
  const job = db.prepare('SELECT * FROM jobs WHERE id=?').get(jobId) as Record<string,string>|undefined;
  if (!candidate||!job) { db.close(); return NextResponse.json({ error:'Not found' }, { status:404 }); }
  const criteria = job.criteria ? JSON.parse(job.criteria) : {};
  const report = await screenCandidate(candidate.resume_text || candidate.name, criteria, orgId);
  db.prepare('UPDATE applications SET match_score=?,match_report=?,updated_at=? WHERE candidate_id=? AND job_id=?').run(report.score,JSON.stringify(report),Date.now(),params.id,jobId);
  db.close(); return NextResponse.json(report);
}

