import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

function getDB() {
  const Database = require('better-sqlite3');
  const path = require('path');
  return new Database(path.resolve(process.env.DB_PATH || './recruiting.db'));
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDB();
  try {
    const interview = db.prepare('SELECT * FROM interviews WHERE id=?').get(params.id);
    if (!interview) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ interview });
  } finally { db.close(); }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDB();
  try {
    const body = await req.json();
    const { consent_given, transcript, completed, session_state } = body;
    const interview = db.prepare('SELECT * FROM interviews WHERE id=?').get(params.id) as any;
    if (!interview) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    db.prepare(`UPDATE interviews SET
      consent_given=COALESCE(?,consent_given),
      transcript=COALESCE(?,transcript),
      completed=COALESCE(?,completed),
      session_state=COALESCE(?,session_state),
      updated_at=?
      WHERE id=?`).run(
      consent_given ?? null,
      transcript ? JSON.stringify(transcript) : null,
      completed ?? null,
      session_state ? JSON.stringify(session_state) : null,
      Date.now(), params.id
    );
    return NextResponse.json({ ok: true });
  } finally { db.close(); }
}

