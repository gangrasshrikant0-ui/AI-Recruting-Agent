import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsInsights } from '@/lib/agents.js';

function getDB() {
  const D = require('better-sqlite3');
  const p = require('path');
  return new D(p.resolve(process.env.DB_PATH || './recruiting.db'));
}

export async function GET(req: NextRequest) {
  const orgId = req.cookies.get('org_id')?.value || 'org-demo';
  const db = getDB();
  try {
    const totalJobsRow = db.prepare('SELECT COUNT(*) as c FROM jobs WHERE org_id=?').get(orgId) as any;
    const totalCandsRow = db.prepare('SELECT COUNT(*) as c FROM candidates WHERE org_id=?').get(orgId) as any;
    const totalAppsRow = db.prepare('SELECT COUNT(*) as c FROM applications WHERE org_id=?').get(orgId) as any;
    const totalIvsRow = db.prepare('SELECT COUNT(*) as c FROM interviews WHERE org_id=?').get(orgId) as any;
    const totalEvalsRow = db.prepare('SELECT COUNT(*) as c FROM evaluations WHERE org_id=?').get(orgId) as any;

    const stageRows = db.prepare('SELECT stage, COUNT(*) as count FROM applications WHERE org_id=? GROUP BY stage').all(orgId) as any[];
    const byStage: Record<string, number> = {};
    for (const r of stageRows) {
      if (r.stage) byStage[r.stage] = r.count;
    }

    const verdictRows = db.prepare('SELECT verdict, COUNT(*) as count FROM evaluations WHERE org_id=? GROUP BY verdict').all(orgId) as any[];
    const verdicts: Record<string, number> = {};
    for (const r of verdictRows) {
      if (r.verdict) verdicts[r.verdict] = r.count;
    }

    const stats = {
      totalJobs: totalJobsRow?.c || 0,
      totalCandidates: totalCandsRow?.c || 0,
      totalApps: totalAppsRow?.c || 0,
      totalInterviews: totalIvsRow?.c || 0,
      totalEvaluations: totalEvalsRow?.c || 0,
      byStage,
      byStageList: stageRows.map((r) => ({ stage: r.stage, count: r.count })),
      verdicts,
    };

    let insights = '';
    try {
      insights = await getAnalyticsInsights(stats);
    } catch {
      insights = 'Pipeline running with steady candidate flow across technical and support roles.';
    }

    return NextResponse.json({ ...stats, insights });
  } finally {
    db.close();
  }
}
