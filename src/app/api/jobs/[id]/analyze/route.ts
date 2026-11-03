import { NextRequest, NextResponse } from 'next/server';
import { analyzeJob } from '@/lib/agents.js';
function getDB() { const Database = require('better-sqlite3'); const path = require('path'); return new Database(path.resolve(process.env.DB_PATH || './recruiting.db')); }
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const orgId = req.cookies.get('org_id')?.value || 'org-demo';
  const db = getDB(); const job = db.prepare('SELECT * FROM jobs WHERE id=?').get(params.id) as Record<string,string>|undefined;
  if (!job) { db.close(); return NextResponse.json({ error: 'Not found' }, { status: 404 }); }
  const result = await analyzeJob(job.description || job.title, orgId);
  db.prepare('UPDATE jobs SET criteria=?,blueprint=?,status=?,updated_at=? WHERE id=?').run(JSON.stringify(result.criteria),JSON.stringify(result.blueprint),'active',Date.now(),params.id);
  db.close(); return NextResponse.json(result);
}

