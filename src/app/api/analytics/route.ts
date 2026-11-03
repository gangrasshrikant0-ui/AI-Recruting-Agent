import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsInsights } from '@/lib/agents.js';
function getDB() { const D = require('better-sqlite3'), p = require('path'); return new D(p.resolve(process.env.DB_PATH||'./recruiting.db')); }
export async function GET(req: NextRequest) {
  const orgId = req.cookies.get('org_id')?.value||'org-demo'; const db = getDB();
  const n=(q:string,a:unknown[])=>(db.prepare(q).get(...a) as {c:number}).c;
  const stats = {
    totalApps: n('SELECT COUNT(*) as c FROM applications WHERE org_id=?',[orgId]),
    totalJobs: n('SELECT COUNT(*) as c FROM jobs WHERE org_id=?',[orgId]),
    totalInterviews: n('SELECT COUNT(*) as c FROM interviews WHERE org_id=?',[orgId]),
    completed: n("SELECT COUNT(*) as c FROM interviews WHERE org_id=? AND status='completed'",[orgId]),
    pending: n("SELECT COUNT(*) as c FROM approvals WHERE org_id=? AND status='pending'",[orgId]),
    avgScore: (db.prepare('SELECT AVG(overall_score) as a FROM evaluations WHERE org_id=?').get(orgId) as {a:number}).a||0,
    byStage: db.prepare('SELECT stage,COUNT(*) as count FROM applications WHERE org_id=? GROUP BY stage ORDER BY count DESC').all(orgId),
    verdicts: db.prepare("SELECT verdict,COUNT(*) as count FROM evaluations WHERE org_id=? GROUP BY verdict").all(orgId),
    recentApps: db.prepare('SELECT date(created_at/1000,"unixepoch") as date,COUNT(*) as count FROM applications WHERE org_id=? GROUP BY date ORDER BY date DESC LIMIT 14').all(orgId),
  };
  db.close();
  const insights = await getAnalyticsInsights(stats);
  return NextResponse.json({...stats,insights});
}

