import { NextRequest, NextResponse } from 'next/server';
function getDB() { const D = require('better-sqlite3'), p = require('path'); return new D(p.resolve(process.env.DB_PATH||'./recruiting.db')); }
export async function GET(req: NextRequest) {
  const orgId = req.cookies.get('org_id')?.value||'org-demo'; const db = getDB();
  const logs = db.prepare('SELECT * FROM audit_log WHERE org_id=? ORDER BY ts DESC LIMIT 100').all(orgId);
  db.close(); return NextResponse.json({logs});
}

