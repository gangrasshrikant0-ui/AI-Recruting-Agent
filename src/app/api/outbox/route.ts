import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';
function getDB() { const D = require('better-sqlite3'), p = require('path'); return new D(p.resolve(process.env.DB_PATH||'./recruiting.db')); }
export async function GET(req: NextRequest) {
  const orgId = req.cookies.get('org_id')?.value||'org-demo'; const db = getDB();
  const messages = db.prepare('SELECT * FROM outbox WHERE org_id=? ORDER BY created_at DESC LIMIT 50').all(orgId);
  db.close(); return NextResponse.json({messages});
}
export async function POST(req: NextRequest) {
  const orgId = req.cookies.get('org_id')?.value||'org-demo'; const body = await req.json(); const db = getDB();
  const id = uuid(); const now = Date.now();
  db.prepare('INSERT INTO outbox (id,org_id,channel,recipient,subject,body,status,idempotency_key,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)').run(id,orgId,body.channel||'email',body.recipient,body.subject,body.body,'pending',uuid(),now,now);
  db.close(); return NextResponse.json({id});
}

