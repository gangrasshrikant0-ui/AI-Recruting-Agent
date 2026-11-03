import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';
function getDB() { const Database = require('better-sqlite3'); const path = require('path'); return new Database(path.resolve(process.env.DB_PATH || './recruiting.db')); }
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { stage, reason } = await req.json();
  const orgId = req.cookies.get('org_id')?.value || 'org-demo';
  const userId = req.cookies.get('user_id')?.value;
  const db = getDB();
  const app = db.prepare('SELECT * FROM applications WHERE id=?').get(params.id) as Record<string,string>|undefined;
  if (!app) { db.close(); return NextResponse.json({ error:'Not found' }, { status:404 }); }
  const history = JSON.parse(app.stage_history||'[]');
  history.push({ stage, ts: Date.now(), reason, by: userId });
  db.prepare('UPDATE applications SET stage=?,stage_history=?,updated_at=? WHERE id=?').run(stage,JSON.stringify(history),Date.now(),params.id);
  db.prepare('INSERT INTO audit_log (id,org_id,user_id,action,entity_type,entity_id,before_val,after_val,ts) VALUES (?,?,?,?,?,?,?,?,?)').run(uuid(),orgId,userId,'stage_change','application',params.id,app.stage,stage,Date.now());
  db.close(); return NextResponse.json({ ok:true });
}

