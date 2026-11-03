import { NextRequest, NextResponse } from 'next/server';
function getDB() { const D = require('better-sqlite3'), p = require('path'); return new D(p.resolve(process.env.DB_PATH||'./recruiting.db')); }
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { status, reason } = await req.json(); const userId = req.cookies.get('user_id')?.value; const db = getDB();
  db.prepare('UPDATE approvals SET status=?,approved_by=?,reason=?,updated_at=? WHERE id=?').run(status,userId,reason||null,Date.now(),params.id);
  db.close(); return NextResponse.json({ok:true});
}

