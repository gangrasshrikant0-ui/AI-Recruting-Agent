import { NextRequest, NextResponse } from 'next/server';
function getDB() { const Database = require('better-sqlite3'); const path = require('path'); return new Database(path.resolve(process.env.DB_PATH || './recruiting.db')); }
export async function GET(req: NextRequest) {
  const userId = req.cookies.get('user_id')?.value;
  if (!userId) return NextResponse.json({ user: null });
  const db = getDB(); const user = db.prepare('SELECT id,name,role,email,org_id FROM users WHERE id=?').get(userId) as Record<string,string>|undefined; db.close();
  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({ user: { ...user, orgId: user.org_id } });
}

