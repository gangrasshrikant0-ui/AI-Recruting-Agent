import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';
function getDB() { const D = require('better-sqlite3'), p = require('path'); return new D(p.resolve(process.env.DB_PATH||'./recruiting.db')); }
export async function GET(req: NextRequest) {
  const orgId = req.cookies.get('org_id')?.value||'org-demo'; const db = getDB();
  const approvals = db.prepare('SELECT * FROM approvals WHERE org_id=? ORDER BY created_at DESC').all(orgId);
  db.close(); return NextResponse.json({approvals});
}
export async function POST(req: NextRequest) {
  const orgId = req.cookies.get('org_id')?.value||'org-demo'; const userId = req.cookies.get('user_id')?.value;
  const body = await req.json(); const db = getDB(); const id = uuid(); const now = Date.now();
  db.prepare('INSERT INTO approvals (id,org_id,type,entity_id,requested_by,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)').run(id,orgId,body.type,body.entityId,userId,'pending',now,now);
  db.close(); return NextResponse.json({id});
}

