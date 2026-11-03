import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';
function getDB() { const Database = require('better-sqlite3'); const path = require('path'); return new Database(path.resolve(process.env.DB_PATH || './recruiting.db')); }
export async function GET(req: NextRequest) {
  const orgId = req.cookies.get('org_id')?.value || 'org-demo';
  const db = getDB(); const jobs = db.prepare('SELECT * FROM jobs WHERE org_id=? ORDER BY created_at DESC').all(orgId); db.close();
  return NextResponse.json({ jobs });
}
export async function POST(req: NextRequest) {
  const orgId = req.cookies.get('org_id')?.value || 'org-demo';
  const userId = req.cookies.get('user_id')?.value || 'user-recruiter';
  const body = await req.json();
  const db = getDB(); const id = uuid(); const now = Date.now();
  db.prepare('INSERT INTO jobs (id,org_id,title,department,description,status,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)').run(id,orgId,body.title,body.department||'',body.description||'','draft',userId,now,now);
  db.close(); return NextResponse.json({ id });
}

