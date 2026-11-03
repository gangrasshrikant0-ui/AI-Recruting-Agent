import { NextRequest, NextResponse } from 'next/server';
function getDB() {
  const Database = require('better-sqlite3');
  const path = require('path');
  const db = new Database(path.resolve(process.env.DB_PATH || './recruiting.db'));
  db.pragma('journal_mode = WAL');
  return db;
}
export async function POST(req: NextRequest) {
  const { userId } = await req.json();
  const db = getDB();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as Record<string,string>|undefined;
  db.close();
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const res = NextResponse.json({ user: { id: user.id, name: user.name, role: user.role, email: user.email, orgId: user.org_id } });
  res.cookies.set('user_id', user.id, { httpOnly: true, path: '/', maxAge: 86400*7 });
  res.cookies.set('user_role', user.role, { path: '/', maxAge: 86400*7 });
  res.cookies.set('org_id', user.org_id, { path: '/', maxAge: 86400*7 });
  return res;
}

