import { NextRequest, NextResponse } from 'next/server';
import { evaluateInterview } from '@/lib/agents.js';
import { v4 as uuid } from 'uuid';
function getDB() { const D = require('better-sqlite3'), p = require('path'); return new D(p.resolve(process.env.DB_PATH||'./recruiting.db')); }
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const orgId = req.cookies.get('org_id')?.value||'org-demo';
  const db = getDB();
  const row = db.prepare('SELECT i.*,j.criteria FROM interviews i JOIN jobs j ON i.job_id=j.id WHERE i.id=?').get(params.id) as Record<string,string>|undefined;
  if (!row) { db.close(); return NextResponse.json({error:'Not found'},{status:404}); }
  const transcript = JSON.parse(row.transcript||'[]');
  const criteria = JSON.parse(row.criteria||'{}');
  const result = await evaluateInterview(transcript, criteria, orgId);
  const id = uuid(); const now = Date.now();
  db.prepare('INSERT OR REPLACE INTO evaluations (id,org_id,interview_id,scores,overall_score,verdict,recommendation,grounding_log,fairness_flags,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)').run(id,orgId,params.id,JSON.stringify(result.scores),result.overallScore,result.verdict,result.recommendation,JSON.stringify(result.groundingLog),JSON.stringify(result.fairnessFlags),now,now);
  db.prepare('UPDATE applications SET stage=?,updated_at=? WHERE id=?').run('Evaluation pending',now,row.application_id);
  db.close(); return NextResponse.json({evaluation:result,id});
}

