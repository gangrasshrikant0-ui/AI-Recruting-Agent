import { NextRequest, NextResponse } from 'next/server';

function getDB() {
  const Database = require('better-sqlite3');
  const path = require('path');
  return new Database(path.resolve(process.env.DB_PATH || './recruiting.db'));
}

const DEFAULT_QUESTIONS = [
  { text: 'Tell me about yourself and your most relevant experience.' },
  { text: 'Describe a technically challenging problem you solved. What was your approach?' },
  { text: 'How do you prioritize when you have multiple urgent tasks?' },
  { text: 'Where do you see yourself in the next 2-3 years?' },
];

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDB();
  try {
    const { answer } = await req.json();
    const interview = db.prepare('SELECT * FROM interviews WHERE id=?').get(params.id) as any;
    if (!interview) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const transcript: any[] = interview.transcript ? JSON.parse(interview.transcript) : [];
    let questions = DEFAULT_QUESTIONS;
    if (interview.job_id) {
      const job = db.prepare('SELECT blueprint FROM jobs WHERE id=?').get(interview.job_id) as any;
      if (job?.blueprint) {
        try {
          const bp = JSON.parse(job.blueprint);
          if (bp.questions && bp.questions.length > 0) questions = bp.questions;
        } catch {}
      }
    }

    if (answer && answer.trim()) {
      transcript.push({ role: 'candidate', text: answer.trim(), ts: Date.now() });
    }

    const answeredCount = transcript.filter((t: any) => t.role === 'candidate').length;
    const completed = answeredCount >= questions.length;

    let nextQuestion: string | null = null;
    if (!completed && questions[answeredCount]) {
      nextQuestion = questions[answeredCount].text || questions[answeredCount];
      transcript.push({ role: 'ai', text: nextQuestion, ts: Date.now() });
    }

    const newStatus = completed ? 'completed' : 'in_progress';
    db.prepare('UPDATE interviews SET transcript=?,status=?,updated_at=? WHERE id=?')
      .run(JSON.stringify(transcript), newStatus, Date.now(), params.id);

    if (completed) {
      db.prepare("UPDATE applications SET stage='First round completed',updated_at=? WHERE candidate_id=? AND job_id=?")
        .run(Date.now(), interview.candidate_id, interview.job_id);
    }

    return NextResponse.json({ action: nextQuestion ? 'ask' : 'done', question: nextQuestion, completed });
  } finally {
    db.close();
  }
}
