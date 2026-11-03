import { NextRequest, NextResponse } from 'next/server';
function getDB() { const Database = require('better-sqlite3'); const path = require('path'); return new Database(path.resolve(process.env.DB_PATH || './recruiting.db')); }
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDB(); const job = db.prepare('SELECT * FROM jobs WHERE id=?').get(params.id); db.close();
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ job });
}
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json(); const db = getDB();
  const entries = Object.entries(body);
  if (entries.length) { const sets = entries.map(([k])=>`${k}=?`).join(','); db.prepare(`UPDATE jobs SET ${sets},updated_at=? WHERE id=?`).run(...entries.map(([,v])=>v),Date.now(),params.id); }
  db.close(); return NextResponse.json({ ok: true });
}

