import { NextRequest, NextResponse } from 'next/server';
function getDB() { const Database = require('better-sqlite3'); const path = require('path'); return new Database(path.resolve(process.env.DB_PATH || './recruiting.db')); }
export async function GET(req: NextRequest) {
  const orgId = req.cookies.get('org_id')?.value || 'org-demo';
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get('jobId');
  const db = getDB();
  const q = jobId
    ? 'SELECT a.*,c.name as candidate_name,c.email,j.title as job_title FROM applications a JOIN candidates c ON a.candidate_id=c.id JOIN jobs j ON a.job_id=j.id WHERE a.org_id=? AND a.job_id=? ORDER BY a.match_score DESC NULLS LAST'
    : 'SELECT a.*,c.name as candidate_name,c.email,j.title as job_title FROM applications a JOIN candidates c ON a.candidate_id=c.id JOIN jobs j ON a.job_id=j.id WHERE a.org_id=? ORDER BY a.created_at DESC';
  const applications = jobId ? db.prepare(q).all(orgId,jobId) : db.prepare(q).all(orgId);
  db.close(); return NextResponse.json({ applications });
}

