import { NextRequest, NextResponse } from 'next/server';

function getDB() {
  const Database = require('better-sqlite3');
  const path = require('path');
  return new Database(path.resolve(process.env.DB_PATH || './recruiting.db'));
}

const DEFAULT_BLUEPRINT = {
  questions: [
    { text: 'Tell me about yourself and your background.' },
    { text: 'Describe a challenging situation at work and how you handled it.' },
    { text: 'Why are you interested in this role?' },
    { text: 'What are your key strengths and areas for improvement?' },
    { text: 'Where do you see yourself in the next 2-3 years?' },
  ]
};

export async function GET(req: NextRequest) {
  const db = getDB();
  try {
    const { searchParams } = new URL(req.url);
    const candidate_id = searchParams.get('candidate_id');
    const job_id = searchParams.get('job_id');
    const status = searchParams.get('status');
    let q = 'SELECT i.*, c.name as candidate_name, j.title as job_title FROM interviews i LEFT JOIN candidates c ON i.candidate_id=c.id LEFT JOIN jobs j ON i.job_id=j.id WHERE 1=1';
    const args: any[] = [];
    if (candidate_id) { q += ' AND i.candidate_id=?'; args.push(candidate_id); }
    if (job_id) { q += ' AND i.job_id=?'; args.push(job_id); }
    if (status) { q += ' AND i.status=?'; args.push(status); }
    q += ' ORDER BY i.created_at DESC';
    const rows = db.prepare(q).all(...args);
    return NextResponse.json({ interviews: rows });
  } finally { db.close(); }
}

export async function POST(req: NextRequest) {
  const db = getDB();
  try {
    const body = await req.json();
    const { candidate_id, job_id, scheduled_at } = body;
    const id = `int-${Date.now()}`;
    db.prepare(`INSERT INTO interviews (id,candidate_id,job_id,status,blueprint,scheduled_at,created_at,updated_at)
      VALUES (?,?,?,'scheduled',?,?,?,?)`)
      .run(id, candidate_id, job_id, JSON.stringify(DEFAULT_BLUEPRINT), scheduled_at || null, Date.now(), Date.now());
    const job = db.prepare('SELECT org_id FROM jobs WHERE id=?').get(job_id) as any;
    db.prepare(`INSERT INTO outbox (id,org_id,channel,recipient,subject,body,status,created_at) VALUES (?,?,?,?,?,?,?,?)`)
      .run(`ob-${Date.now()}`, job?.org_id || 'org-demo', 'email', candidate_id,
        'Interview Scheduled', `Your interview ${id} has been scheduled.`, 'sent', Date.now());
    return NextResponse.json({ id });
  } finally { db.close(); }
}

